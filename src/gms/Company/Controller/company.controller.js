import Company from "..//Models/Company.js";
import OTP from "../Models/otp.model.js";
import {
  sendEmailOTP,
  sendAccountCreatedEmail,
  sendSuperAdminNotification,
} from "../../../utils/brevo.js";
import User from "../../../user/models/user.model.js";
import { sequelize } from "../../../db/index.js";
import bcrypt from "bcrypt";
// ✅ SEND OTP
export const sendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await OTP.create({
      email,
      otp,
      expires_at: expiresAt,
    });

    const isSent = await sendEmailOTP(email, otp);

    if (!isSent) {
      return res.status(500).json({ message: "Failed to send OTP" });
    }

    res.json({ message: "OTP sent successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

// ✅ VERIFY OTP + CREATE COMPANY + ADMIN USER
export const verifyOTPAndCreateCompany = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const { email, otp, company_name, owner_name, phone } = req.body;

    // 🔍 Check OTP
    const record = await OTP.findOne({
      where: { email, otp },
      order: [["createdAt", "DESC"]],
    });

    if (!record) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    if (new Date() > record.expires_at) {
      return res.status(400).json({ message: "OTP expired" });
    }

    // 🚫 Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // 🚫 Optional: Check if company already exists
    const existingCompany = await Company.findOne({ where: { email } });
    if (existingCompany) {
      return res.status(400).json({ message: "Company already exists" });
    }

    // ✅ Create Company
    const company = await Company.create(
      {
        email,
        company_name,
        owner_name,
        phone,
        demo_expiry: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
      { transaction: t }
    );

    // 🔐 Hash password (phone)
    const hashedPassword = await bcrypt.hash(phone, 10);

    // ✅ Create Admin User
    const user = await User.create(
      {
        role: "Admin",
        username: owner_name,
        email: email,
        password: hashedPassword,
        phone: phone,
        company_id: company.id,
        created_by: company.id,
        created_by_name: company.company_name,
        created_by_email: company.email,
      },
      { transaction: t }
    );

    // 🧹 Delete OTP after success
    await record.destroy({ transaction: t });

    await t.commit();

    // ==========================
    // 📧 SEND EMAILS HERE
    // ==========================

    // Send to user
    await sendAccountCreatedEmail(email, owner_name, phone);

    // Send to super admin
    await sendSuperAdminNotification(company, user);

    // ==========================

    res.json({
      message: "Company & Admin User created successfully",
      company,
      user,
    });

  } catch (error) {
    await t.rollback();
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};