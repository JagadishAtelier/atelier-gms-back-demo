import { Op } from "sequelize";
import { v4 as uuidv4 } from "uuid";
import Member from "../models/member.model.js";
import User from "../../../user/models/user.model.js";
import bcrypt from "bcrypt";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import XLSX from "xlsx";
import { parse } from "csv-parse/sync";

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
        const clientLoginUrl = "https://gmsflexculture.ateliertechnologysolutions.com/";

        const html = `
<div style="max-width:600px;margin:0 auto;font-family:Arial,Helvetica,sans-serif;background:#0d0d0d;border:1px solid #1f1f1f;border-radius:10px;overflow:hidden">

  <!-- Header -->
  <div style="background:#000000;padding:22px;text-align:center;border-bottom:2px solid #e10600">
    <h2 style="margin:0;font-size:22px;color:#ffffff;letter-spacing:1px">
      FLEX <span style="color:#e10600">CULTURE</span>
    </h2>
    <p style="margin:6px 0 0;font-size:13px;color:#bbbbbb">
      Welcome to the Community
    </p>
  </div>

  <!-- Body -->
  <div style="padding:22px;color:#e5e5e5">
    <p style="font-size:14px;margin-bottom:16px;color:#cccccc">
      Hi <strong style="color:#ffffff">${data.name}</strong>,
    </p>

    <p style="font-size:14px;margin-bottom:18px;color:#cccccc">
      Welcome to <strong style="color:#ffffff">Flex Culture</strong>!  
      We’re excited to have you on board. Your account has been created successfully.
      Below are your login details:
    </p>

    <table width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;border-collapse:collapse">
      <tr>
        <td style="padding:10px 0;font-weight:bold;color:#ffffff;width:160px">Email</td>
        <td style="padding:10px 0;color:#e5e5e5">: ${data.email}</td>
      </tr>
      <tr>
        <td style="padding:10px 0;font-weight:bold;color:#ffffff">Phone</td>
        <td style="padding:10px 0;color:#e5e5e5">: ${data.phone}</td>
      </tr>
      <tr>
        <td style="padding:10px 0;font-weight:bold;color:#ffffff">Temporary Password</td>
        <td style="padding:10px 0;color:#e5e5e5">: ${plainPassword}</td>
      </tr>
    </table>

    <!-- CTA -->
    <div style="margin-top:24px;text-align:center">
      <a href="${clientLoginUrl}"
         style="display:inline-block;padding:14px 26px;background:#e10600;color:#ffffff;text-decoration:none;border-radius:6px;font-size:14px;font-weight:bold;letter-spacing:0.5px;margin-bottom:10px">
        LOGIN TO YOUR ACCOUNT
      </a>
    </div>

    <p style="font-size:13px;margin-top:20px;color:#aaaaaa">
      🔐 For security reasons, we strongly recommend changing your password after your first login.
    </p>
  </div>

  <!-- Footer -->
  <div style="background:#111111;padding:14px;text-align:center;font-size:12px;color:#999999;border-top:1px solid #222222">
    Need help? Contact us at
    <strong style="color:#ffffff">flexculture.in</strong><br/>
    Train smart. Stay strong. 💪
  </div>

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

  async bulkUpload(fileBuffer, user, sendEmail = true) {
    try {
      if (!fileBuffer) throw new Error("File is required");

      let rows = [];

      // Detect file type by buffer signature
      const isExcel =
        fileBuffer[0] === 0x50 &&
        fileBuffer[1] === 0x4b &&
        fileBuffer[2] === 0x03 &&
        fileBuffer[3] === 0x04;

      if (isExcel) {
        // Read Excel File
        const workbook = XLSX.read(fileBuffer, { type: "buffer" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        rows = XLSX.utils.sheet_to_json(sheet);
      } else {
        // Read CSV File
        rows = parse(fileBuffer.toString(), {
          columns: true,
          skip_empty_lines: true,
        });
      }

      const results = {
        success: [],
        failed: [],
      };

      for (const [index, row] of rows.entries()) {
        try {
          // Validate fields
          const required = ["name", "email", "phone"];
          for (const field of required) {
            if (!row[field]) throw new Error(`Missing field: ${field}`);
          }

          // Check if email already exists
          const exist = await Member.findOne({ where: { email: row.email } });
          if (exist) throw new Error("Email already exists");

          // Create member
          const member = await Member.create({
            id: uuidv4(),
            name: row.name,
            email: row.email,
            phone: row.phone,
            gender: row.gender || null,
            workout_batch: row.workout_batch || null,
            created_by: user?.id || null,
            created_by_name: user?.username || null,
            created_by_email: user?.email || null,
          });

          // Create user login
          const plainPassword = String(row.phone);
          const hashedPassword = await bcrypt.hash(plainPassword, 10);

          await User.create({
            id: uuidv4(),
            role: "member",
            username: row.name,
            email: row.email,
            phone: row.phone,
            password: hashedPassword,
            created_by: user?.id || null,
          });

          // Send welcome email (optional)
          if (sendEmail) {
            const loginUrl = "https://gmsflexculture.ateliertechnologysolutions.com/";
            const html = `
<div style="max-width:600px;margin:0 auto;font-family:Arial,Helvetica,sans-serif;background:#0d0d0d;border:1px solid #1f1f1f;border-radius:10px;overflow:hidden">

  <!-- Header -->
  <div style="background:#000000;padding:22px;text-align:center;border-bottom:2px solid #e10600">
    <h2 style="margin:0;font-size:22px;color:#ffffff;letter-spacing:1px">
      FLEX <span style="color:#e10600">CULTURE</span>
    </h2>
    <p style="margin:6px 0 0;font-size:13px;color:#bbbbbb">
      Account Created Successfully
    </p>
  </div>

  <!-- Body -->
  <div style="padding:22px;color:#e5e5e5">
    <p style="font-size:14px;margin-bottom:16px;color:#cccccc">
      Hello <strong style="color:#ffffff">${row.name}</strong>,
    </p>

    <p style="font-size:14px;margin-bottom:18px;color:#cccccc">
      Welcome to <strong style="color:#ffffff">Flex Culture</strong>!
      Your account has been created successfully. Please find your login credentials below:
    </p>

    <table width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;border-collapse:collapse">
      <tr>
        <td style="padding:10px 0;font-weight:bold;color:#ffffff;width:160px">Email</td>
        <td style="padding:10px 0;color:#e5e5e5">: ${row.email}</td>
      </tr>
      <tr>
        <td style="padding:10px 0;font-weight:bold;color:#ffffff">Phone</td>
        <td style="padding:10px 0;color:#e5e5e5">: ${row.phone}</td>
      </tr>
      <tr>
        <td style="padding:10px 0;font-weight:bold;color:#ffffff">Temporary Password</td>
        <td style="padding:10px 0;color:#e5e5e5">: ${plainPassword}</td>
      </tr>
    </table>

    <!-- CTA -->
    <div style="margin-top:24px;text-align:center">
      <a href="${loginUrl}"
         style="display:inline-block;padding:14px 26px;background:#e10600;color:#ffffff;text-decoration:none;border-radius:6px;font-size:14px;font-weight:bold;letter-spacing:0.5px">
        LOGIN TO YOUR ACCOUNT
      </a>
    </div>

    <p style="font-size:13px;margin-top:20px;color:#aaaaaa">
      🔐 For security reasons, we recommend changing your password after your first login.
    </p>
  </div>

  <!-- Footer -->
  <div style="background:#111111;padding:14px;text-align:center;font-size:12px;color:#999999;border-top:1px solid #222222">
    This message was sent by
    <strong style="color:#ffffff">flexculture.in</strong><br/>
    Welcome to the culture 💪
  </div>

</div>
`;


            await transporter.sendMail({
              from: `"Flex Culture" <${VERIFIED_SENDER}>`,
              to: row.email,
              subject: "Welcome — Your Login Details",
              html,
            });
          }

          // Push success
          results.success.push({
            row: index + 1,
            email: row.email,
            status: "Created",
          });

        } catch (err) {
          // Push failed
          results.failed.push({
            row: index + 1,
            data: row,
            error: err.message,
          });
        }
      }

      return results;
    } catch (error) {
      console.error("❌ Bulk Upload Error:", error.message);
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
