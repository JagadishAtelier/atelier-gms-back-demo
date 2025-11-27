import { Op } from "sequelize";
import { v4 as uuidv4 } from "uuid";
import Member from "../models/member.model.js";
import User from "../../../user/models/user.model.js";
import bcrypt from "bcrypt";
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

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

// Test SMTP
transporter.verify((err, success) => {
  if (err) {
    console.error("❌ SMTP Connection Failed:", err.message);
  } else {
    console.log("✅ SMTP Ready (Brevo)");
  }
});

// VERIFIED sender email
const VERIFIED_SENDER = process.env.VERIFIED_SENDER || "parthiban.atelier@gmail.com";

const memberService = {
  /**
   * ✅ Create a new member
   */
  async create(data, user) {
    try {
      // Required fields
      const requiredFields = ["name", "email", "phone"];
      for (const field of requiredFields) {
        if (!data[field]) throw new Error(`${field} is required`);
      }

      // 1️⃣ Create new member
      const member = await Member.create({
        id: uuidv4(),
        ...data,
        created_by: user?.id || null,
        created_by_name: user?.username || null,
        created_by_email: user?.email || null,
      });

      // 2️⃣ Create User account for this member
      // For initial password we're using the member's phone (as requested).
      // WARNING: sending plain passwords via email is insecure. Consider sending a password-reset link instead.
      const plainPassword = String(data.phone);
      const hashedPassword = await bcrypt.hash(plainPassword, 10);

      await User.create({
        id: uuidv4(),
        role: "member",
        username: data.name,
        email: data.email,
        phone: data.phone,
        password: hashedPassword,
        created_by: user?.id || null,
      });

      // 3️⃣ Send welcome email with credentials
      try {
        const clientLoginUrl = process.env.CLIENT_LOGIN_URL || "https://your-app.example.com/login";

        const html = `
          <div style="font-family: Arial, sans-serif; line-height:1.4;">
            <h2>Welcome to <span style="color:#2b6cb0;">Flex Culture</span>!</h2>
            <p>Hi ${data.name},</p>
            <p>We are happy to add you as a member of Flex Culture. Here are your account details:</p>
            <ul>
              <li><b>User Email:</b> ${data.email}</li>
              <li><b>Phone Number:</b> ${data.phone}</li>
              <li><b>Password:</b> ${plainPassword}</li>
            </ul>
            <p>You can log in here: <a href="${clientLoginUrl}">${clientLoginUrl}</a></p>
            <p>For security, we recommend you change your password after first login.</p>
            <br />
            <p>— The Flex Culture Team</p>
          </div>
        `;

        await transporter.sendMail({
          from: `"Flex Culture" <${VERIFIED_SENDER}>`,
          to: data.email,
          subject: "Welcome to Flex Culture — Your Account Details",
          html,
        });

        console.log(`📨 Welcome email sent to ${data.email}`);
      } catch (mailErr) {
        // don't fail the whole flow if email fails — log and return member
        console.error("❌ Failed to send welcome email:", mailErr.message);
      }

      return member;
    } catch (error) {
      console.error("❌ Error creating member:", error.message);
      throw error;
    }
  },

  /**
   * ✅ Get all members with pagination, search, and filters
   */
  async getAll(options = {}) {
    const {
      page = 1,
      limit = 10,
      search = "",
      is_active,
      gender,
      workout_batch,
      sort_by = "createdAt",
      sort_order = "DESC",
    } = options;

    const where = {};

    if (typeof is_active !== "undefined") where.is_active = is_active;
    if (gender) where.gender = gender;
    if (workout_batch) where.workout_batch = workout_batch;

    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
        { phone: { [Op.like]: `%${search}%` } },
      ];
    }

    const offset = (page - 1) * limit;

    const { count, rows } = await Member.findAndCountAll({
      where,
      limit: Number(limit),
      offset,
      order: [[sort_by, sort_order]],
    });

    return {
      total: count,
      currentPage: page,
      totalPages: Math.ceil(count / limit),
      data: rows,
    };
  },

  /**
   * ✅ Get member by ID
   */
  async getById(id) {
    const member = await Member.findByPk(id);
    if (!member) throw new Error("Member not found");
    return member;
  },

  /**
   * ✅ Update member
   */
  async update(id, data, user) {
    const member = await Member.findByPk(id);
    if (!member) throw new Error("Member not found");

    await member.update({
      ...data,
      updated_by: user?.id || null,
      updated_by_name: user?.username || null,
      updated_by_email: user?.email || null,
    });

    return member;
  },

  /**
   * ✅ Soft delete or permanently delete a member
   */
  async delete(id, user, hardDelete = false) {
    const member = await Member.findByPk(id);
    if (!member) throw new Error("Member not found");

    if (hardDelete) {
      await member.destroy();
      return { message: "Member permanently deleted" };
    }

    await member.update({
      is_active: false,
      deleted_by: user?.id || null,
      deleted_by_name: user?.username || null,
      deleted_by_email: user?.email || null,
    });

    return { message: "Member deactivated successfully" };
  },

  async getMembersbyuserEmail(email) {
    const members = await Member.findOne({
      where: {
        email: email,
      },
    });
    return members;
  },

  /**
   * ✅ Restore a deactivated member
   */
  async restore(id, user) {
    const member = await Member.findByPk(id);
    if (!member) throw new Error("Member not found");

    await member.update({
      is_active: true,
      updated_by: user?.id || null,
      updated_by_name: user?.username || null,
      updated_by_email: user?.email || null,
    });

    return { message: "Member reactivated successfully" };
  },
};

export default memberService;
