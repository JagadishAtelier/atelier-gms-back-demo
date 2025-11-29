// src/modules/user/service/user.service.js
import User from "../models/user.model.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { Op } from "sequelize";
import Member from "../../gms/member/models/member.model.js";

import nodemailer from "nodemailer";
import { v4 as uuidv4 } from "uuid";

dotenv.config();

const SECRET_KEY = process.env.JWT_SECRET;

// --- mail transporter (reuse your existing SMTP env vars) ---
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp-relay.brevo.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: { rejectUnauthorized: false },
  connectionTimeout: 80000,
});

transporter.verify((err) => {
  if (err) {
    console.error("❌ SMTP Connection Failed:", err.message);
  } else {
    console.log("✅ SMTP Ready");
  }
});

const VERIFIED_SENDER = process.env.VERIFIED_SENDER || "no-reply@example.com";
const CLIENT_URL = process.env.CLIENT_URL || "https://your-client-app.example.com";

/**
 * In-memory OTP store:
 * Map<otp_token, { email, otp_hash, expiresAt: Date, isUsed: boolean, createdAt: Date }>
 *
 * NOTE: ephemeral. Will be cleared on server restart. For production use DB or Redis.
 */
const otpStore = new Map();

/** helper to cleanup expired entries */
function cleanupExpiredOtps() {
  const now = Date.now();
  for (const [token, rec] of otpStore.entries()) {
    if (!rec || rec.expiresAt <= now || rec.isUsed) otpStore.delete(token);
  }
}

/** helper: count recent OTPs for an email (for rate limiting) */
function countRecentOtpsForEmail(email, windowMs = 60 * 60 * 1000) {
  const now = Date.now();
  let count = 0;
  for (const rec of otpStore.values()) {
    if (rec.email === email && now - rec.createdAt <= windowMs) count++;
  }
  return count;
}

const userService = {
  /**
   * ✅ Create a new user
   */
  async createUser({ username, email, password, phone, role, created_by }) {
    const exists = await User.findOne({ where: { email } });
    if (exists) throw new Error("Email already exists");

    const hashed = await bcrypt.hash(password, 10);

    const user = await User.create({
      username,
      email,
      password: hashed,
      phone,
      role,
      created_by,
    });

    return user;
  },

  /**
   * ✅ Get all active users (can extend later with pagination)
   */
  async getUsers() {
    return await User.findAll({
      where: { is_active: true, deleted_by: null },
      order: [["createdAt", "DESC"]],
    });
  },

  /**
   * ✅ Get user by ID
   */
  async getUserById(id) {
    const user = await User.findByPk(id);
    if (!user) throw new Error("User not found");
    return user;
  },

  /**
   * ✅ Get logged-in user (from token)
   */
  async getMe(id) {
    if (!id) throw new Error("User id is required");

    // 1) fetch user (exclude sensitive fields)
    const user = await User.findByPk(id, {
      attributes: { exclude: ["password"] },
      raw: true,
    });

    if (!user) {
      const err = new Error("User not found");
      err.status = 404;
      throw err;
    }

    // 2) fetch Member row for this user but only select id
    const memberRow = await Member.findOne({
      where: { email: user.email },
      attributes: ["id"],
      raw: true,
    });

    // 3) return merged result: include memberId (or null)
    return {
      ...user,
      memberId: memberRow ? memberRow.id : null,
    };
  },

  /**
   * ✅ Login user (email or phone)
   */
  async loginUser({ identifier, password }) {
    const user = await User.findOne({
      where: {
        [Op.or]: [{ email: identifier }, { phone: identifier }],
      },
    });

    if (!user) throw new Error("Invalid credentials");

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) throw new Error("Invalid credentials");

    if (!SECRET_KEY) throw new Error("JWT secret key missing in .env file");

    // Create JWT token
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
      },
      SECRET_KEY,
      { expiresIn: "7d" }
    );

    await user.update({ token });

    // Strip password before sending response
    const { password: _, ...userWithoutPassword } = user.get({ plain: true });

    return {
      message: `${user.role} ${user.username} Login successful`,
      user: userWithoutPassword,
      token,
    };
  },

  /**
   * ✅ Update user
   */
  async updateUserById(id, updateData, updated_by) {
    const user = await User.findByPk(id);
    if (!user) throw new Error("User not found");

    await user.update({
      ...updateData,
      updated_by,
    });

    return user;
  },

  /**
   * ✅ Soft delete user (mark inactive + deleted_by)
   */
  async softDeleteUser(id, deleted_by) {
    const user = await User.findByPk(id);
    if (!user) throw new Error("User not found");

    await user.update({
      is_active: false,
      deleted_by,
    });

    return { message: "User deleted successfully" };
  },

  /**
   * ✅ Restore soft-deleted user
   */
  async restoreUser(id) {
    const user = await User.findByPk(id);
    if (!user) throw new Error("User not found");

    await user.update({
      is_active: true,
      deleted_by: null,
    });

    return { message: "User restored successfully" };
  },

  /**
   * ✅ Refresh JWT token
   */
  async refreshAccessToken(userId) {
    const user = await User.findByPk(userId);
    if (!user) throw new Error("User not found");

    const newToken = jwt.sign(
      {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
      },
      SECRET_KEY,
      { expiresIn: "7d" }
    );

    await user.update({ token: newToken });
    return { token: newToken };
  },

  /**
   * ✅ Logout user (clear token)
   */
  async logoutUser(userId) {
    const user = await User.findByPk(userId);
    if (!user) throw new Error("User not found");

    await user.update({ token: null });
    return { message: "Logout successful" };
  },

  /**
   * ✅ Send OTP (mock for now)
   */
  async sendOtpToken(identifier) {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    console.log(`Generated OTP for ${identifier}: ${otp}`);
    return { otp };
  },

  /**
   * ✅ Check if user already exists
   */
  async userAlreadyExists(email) {
    const user = await User.findOne({ where: { email } });
    return !!user;
  },

  /**
   * ✅ Change password (requires old password)
   */
  async changePassword(userId, oldPassword, newPassword) {
    const user = await User.findByPk(userId);
    if (!user) throw new Error("User not found");

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) throw new Error("Old password is incorrect");

    const hashed = await bcrypt.hash(newPassword, 10);
    await user.update({ password: hashed });

    return { message: "Password changed successfully" };
  },

  /**
   * ----------------------------
   * NEW: sendPasswordResetOtp (in-memory OTP store)
   * - returns { message, otp_token }
   * ----------------------------
   */
  async sendPasswordResetOtp(email) {
    if (!email) throw new Error("Email is required");

    // cleanup old entries
    cleanupExpiredOtps();

    // find user
    const user = await User.findOne({ where: { email } });
    if (!user) throw new Error("No user found with that email");

    // simple rate limit: max 5 OTPs per hour per email
    const recentCount = countRecentOtpsForEmail(email, 60 * 60 * 1000);
    if (recentCount >= 5) {
      throw new Error("Too many OTP requests. Please try again later.");
    }

    // generate OTP and token
    const otpPlain = (Math.floor(100000 + Math.random() * 900000)).toString();
    const otp_token = uuidv4();
    const otp_hash = await bcrypt.hash(otpPlain, 10);
    const expiresAt = Date.now() + 15 * 60 * 1000; // 15 minutes
    const createdAt = Date.now();

    // store in memory
    otpStore.set(otp_token, {
      email,
      otp_hash,
      expiresAt,
      isUsed: false,
      createdAt
    });

    // compose email
    const html = `
      <div style="font-family: Arial, sans-serif; color:#111; line-height:1.4">
        <h3>Password reset</h3>
        <p>Hi ${user.username || user.email},</p>
        <p>Your password reset code is:</p>
        <div style="display:inline-block;padding:10px 14px;background:#f3f4f6;border-radius:6px;font-weight:700;font-size:1.1rem;">
          ${otpPlain}
        </div>
        <p>This code will expire in 15 minutes.</p>
        <p>If you didn't request this, please ignore this email.</p>
        <p><a href="${CLIENT_URL}" target="_blank" rel="noreferrer">Open app</a></p>
      </div>
    `;

    try {
      await transporter.sendMail({
        from: `"Support" <${VERIFIED_SENDER}>`,
        to: user.email,
        subject: "Your password reset code",
        html,
      });
    } catch (mailErr) {
      // remove store entry on failure to avoid dangling token
      otpStore.delete(otp_token);
      console.error("❌ Failed to send password reset email:", mailErr);
      throw new Error("Failed to send password reset email");
    }

    return { message: "OTP sent to email", otp_token };
  },

  /**
   * ----------------------------
   * NEW: resetPasswordWithOtp (in-memory store)
   * - payload: { email, otp, otp_token, newPassword }
   * ----------------------------
   */
  async resetPasswordWithOtp({ email, otp, otp_token, newPassword }) {
    if (!email || !otp || !otp_token || !newPassword) throw new Error("Required fields missing");

    // cleanup old entries first
    cleanupExpiredOtps();

    const rec = otpStore.get(otp_token);
    if (!rec) throw new Error("Invalid or expired OTP token");

    if (rec.email !== email) throw new Error("Email does not match OTP token");

    if (rec.isUsed) {
      otpStore.delete(otp_token);
      throw new Error("OTP already used");
    }

    if (rec.expiresAt <= Date.now()) {
      otpStore.delete(otp_token);
      throw new Error("OTP expired");
    }

    const valid = await bcrypt.compare(otp, rec.otp_hash);
    if (!valid) throw new Error("Invalid OTP");

    // find user
    const user = await User.findOne({ where: { email } });
    if (!user) throw new Error("User not found");

    // update password
    const hashed = await bcrypt.hash(newPassword, 10);
    await user.update({ password: hashed });

    // mark used and remove
    rec.isUsed = true;
    otpStore.delete(otp_token);

    return { message: "Password reset successfully" };
  },
};

export default userService;
