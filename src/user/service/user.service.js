import User from "../models/user.model.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { Op } from "sequelize";

dotenv.config();

const SECRET_KEY = process.env.JWT_SECRET;

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
    return await this.getUserById(id);
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
   * ✅ Change password
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
};

export default userService;
