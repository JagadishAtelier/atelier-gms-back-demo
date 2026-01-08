import { Op } from "sequelize";
import { v4 as uuidv4 } from "uuid";
import Member from "../models/member.model.js";
import User from "../../../user/models/user.model.js";
import bcrypt from "bcrypt";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import XLSX from "xlsx";
import { parse } from "csv-parse/sync";
import Membermembership from '../models/membermembership.model.js';
import { sequelize } from "../../../db/index.js";


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

async function generateMemberNo() {
  const lastMember = await Member.findOne({
    order: [["createdAt", "DESC"]],
    attributes: ["member_no"],
  });

  let nextNumber = 1;

  if (lastMember?.member_no) {
    const match = lastMember.member_no.match(/\d+$/);
    if (match) {
      nextNumber = parseInt(match[0], 10) + 1;
    }
  }

  return `MEM${String(nextNumber).padStart(4, "0")}`;
}

/**
 * Normalize member_no values coming from bulk upload.
 * - If value is purely numeric (1, 2, 3 or "1.0"), convert to MEM0001 format.
 * - If value is already a string like "MEM0001", return as-is (trimmed).
 * - If null/undefined => return null.
 *
 * This normalization is applied ONLY for bulkUpload lookup to support Excel numeric cells.
 */
function normalizeMemberNo(value) {
  if (value === null || value === undefined) return null;
  let v = String(value).trim();
  if (v === "") return null;

  // If purely numeric (e.g. 1, 2, 15, 1.0)
  if (/^\d+(\.0+)?$/.test(v)) {
    const num = parseInt(Number(v), 10);
    return `MEM${String(num).padStart(4, "0")}`;
  }

  // Otherwise keep as-is
  return v;
}

// VERIFIED sender email
const VERIFIED_SENDER = process.env.VERIFIED_SENDER || "flexculture001@gmail.com";

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

      const memberNo = await generateMemberNo();

      // 1️⃣ Create new member
      const member = await Member.create({
        id: uuidv4(),
        member_no: memberNo,
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

      // Debug: print connected DB so you can verify it's the same DB you query manually
      try {
        const [dbRes] = await sequelize.query("SELECT DATABASE() as db");
        console.log("📡 Sequelize connected DB:", dbRes?.[0]?.db ?? JSON.stringify(dbRes?.[0]));
      } catch (dbErr) {
        console.warn("⚠️ Could not read connected DB:", dbErr.message);
      }

      let rows = [];

      // Detect Excel
      const isExcel =
        fileBuffer[0] === 0x50 &&
        fileBuffer[1] === 0x4b &&
        fileBuffer[2] === 0x03 &&
        fileBuffer[3] === 0x04;

      if (isExcel) {
        const workbook = XLSX.read(fileBuffer, { type: "buffer" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        rows = XLSX.utils.sheet_to_json(sheet, { defval: null });
      } else {
        rows = parse(fileBuffer.toString(), {
          columns: true,
          skip_empty_lines: true,
        });
      }

      // Helper: parse dates from various formats (dd-mm-yyyy, dd/mm/yyyy, yyyy-mm-dd,
      // Excel serial numbers, etc.) -> returns Date object or null
      const parseDate = (val) => {
        if (val === undefined || val === null || val === "") return null;
        // If already a Date
        if (val instanceof Date && !isNaN(val.getTime())) return val;

        let s = String(val).trim();

        // Ignore explicit MySQL zero date representation
        if (s === "0000-00-00" || s === "0000-00-00 00:00:00") return null;

        // Excel serial (number) might come as number or numeric-string
        if (/^\d+(\.\d+)?$/.test(s)) {
          const num = Number(s);
          // Heuristic: if numeric > 31 treat as Excel serial (days since 1899-12-31)
          if (num > 31) {
            // Excel epoch conversion
            const ms = Math.round((num - 25569) * 86400 * 1000);
            const d = new Date(ms);
            if (!isNaN(d.getTime())) return d;
          }
        }

        // Normalize separators
        s = s.replace(/\//g, "-");

        // dd-mm-yyyy or d-m-yyyy
        const dmY = /^(\d{1,2})-(\d{1,2})-(\d{4})$/;
        const yMd = /^(\d{4})-(\d{1,2})-(\d{1,2})$/;

        let match;
        if ((match = s.match(dmY))) {
          const dd = match[1].padStart(2, "0");
          const mm = match[2].padStart(2, "0");
          const yyyy = match[3];
          const iso = `${yyyy}-${mm}-${dd}`;
          const d = new Date(iso);
          if (!isNaN(d.getTime())) return d;
        } else if (yMd.test(s)) {
          const d = new Date(s);
          if (!isNaN(d.getTime())) return d;
        }

        // Fallback to Date parse
        const fallback = new Date(s);
        if (!isNaN(fallback.getTime())) return fallback;

        return null;
      };

      // Helper: simple email/phone validators
      const isValidEmail = (value) => {
        if (!value) return false;
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(String(value).trim());
      };
      const isValidPhone = (value) => {
        if (!value) return false;
        const cleaned = String(value).replace(/[^\d]/g, "");
        return cleaned.length >= 10 && cleaned.length <= 15;
      };

      const results = { success: [], failed: [] };

      for (const [index, rawRow] of rows.entries()) {
        const t = await sequelize.transaction();
        try {
          const row = { ...rawRow };

          // 🔹 Normalize values (original behavior)
          for (const k of Object.keys(row)) {
            if (row[k] === undefined || row[k] === null) {
              row[k] = null;
              continue;
            }
            if (typeof row[k] === "number") row[k] = String(row[k]);
            if (typeof row[k] === "string") {
              row[k] = row[k].trim();
              if (row[k] === "") row[k] = null;
            }
          }

          // ===== New: sanitize email & phone to remove hidden chars =====
          row.email = row.email ? String(row.email).trim() : null;

          // normalize phone: remove all non-digit characters (keeps only digits)
          // this avoids invisible whitespace, NBSP, formatting characters from Excel
          if (row.phone) {
            const rawPhone = String(row.phone);
            const cleaned = rawPhone.replace(/[^\d]/g, "");
            row.phone = cleaned || null;
          } else {
            row.phone = null;
          }

          // Debug row-level info (helps identify invisible characters)
          console.log(`BulkUpload row ${index + 1} — email=[${row.email}] phone=[${row.phone}]`);

          // Parse date-like fields into Date objects (or null)
          const parsedDob = parseDate(row.dob);
          const parsedJoinDate = parseDate(row.join_date);
          const parsedStartDate = parseDate(row.start_date);
          const parsedEndDate = parseDate(row.end_date);

          let member = null;
          let memberNo = row.member_no ? normalizeMemberNo(row.member_no) : null;

          // ====================================================
          // ✅ CASE 1: member_no PROVIDED
          // ====================================================
          if (memberNo) {
            console.log(`Row ${index + 1}: checking member_no ${memberNo}`);
            member = await Member.findOne({
              where: { member_no: memberNo },
              transaction: t,
            });

            // ❗ member_no not found → CREATE MEMBER
            if (!member) {
              console.log(`Row ${index + 1}: member_no ${memberNo} not found, preparing to create new member`);

              // require name AND (email OR phone)
              if (!row.name) throw new Error("Missing field: name");
              if (!row.email && !row.phone) throw new Error("Either email or phone is required");

              // If email provided, validate and check existence (only active members)
              if (row.email) {
                if (!isValidEmail(row.email)) throw new Error("Invalid email format");
                const emailExistMember = await Member.findOne({
                  where: { email: row.email, is_active: 1 },
                  transaction: t,
                });
                const emailExistUser = await User.unscoped().findOne({
                  where: { email: row.email },
                  transaction: t,
                });
                if (emailExistMember || emailExistUser) {
                  console.error(`Row ${index + 1}: email conflict`, {
                    emailExistMember: !!emailExistMember,
                    emailExistUser: !!emailExistUser,
                  });
                  throw new Error("Email already exists");
                }
              }

              // If phone provided, validate and check existence (only active members)
              if (row.phone) {
                if (!isValidPhone(row.phone)) throw new Error("Invalid phone number");
                const phoneExistMember = await Member.findOne({
                  where: { phone: row.phone, is_active: 1 },
                  transaction: t,
                });
                const phoneExistUser = await User.unscoped().findOne({
                  where: { phone: row.phone },
                  transaction: t,
                });
                if (phoneExistMember || phoneExistUser) {
                  console.error(`Row ${index + 1}: phone conflict`, {
                    phoneExistMember: !!phoneExistMember,
                    phoneExistUser: !!phoneExistUser,
                  });
                  throw new Error("Phone already exists");
                }
              }

              console.log(`Row ${index + 1}: about to create Member and User`);
              member = await Member.create(
                {
                  id: uuidv4(),
                  member_no: memberNo,
                  name: row.name,
                  email: row.email,
                  phone: row.phone,
                  address: row.address || null,
                  dob: parsedDob,
                  join_date: parsedJoinDate,
                  start_date: parsedStartDate,
                  gender: row.gender || null,
                  workout_batch: row.workout_batch || null,
                  is_active: true,
                  created_by: user?.id || null,
                  created_by_name: user?.username || null,
                  created_by_email: user?.email || null,
                },
                { transaction: t }
              );

              const hashedPassword = await bcrypt.hash(String(row.phone || ""), 10);

              await User.create(
                {
                  id: uuidv4(),
                  role: "member",
                  username: row.name,
                  email: row.email,
                  phone: row.phone,
                  password: hashedPassword,
                  created_by: user?.id || null,
                },
                { transaction: t }
              );
            }

            // ➕ Add membership if present
            if (row.membership_name) {
              const start = parsedStartDate ? parsedStartDate : new Date();
              const end = parsedEndDate
                ? parsedEndDate
                : new Date(start.getTime() + 30 * 24 * 60 * 60 * 1000);

              await Membermembership.create(
                {
                  id: uuidv4(),
                  member_id: member.id,
                  membership_id: row.membership_id || null,
                  membership_name: row.membership_name,
                  start_date: start,
                  end_date: end,
                  payment_status: row.payment_status || "unpaid",
                  payment_type: row.payment_type || "cash",
                  status: row.status || "active",
                  amount_paid: row.amount_paid ? parseFloat(row.amount_paid) : 0,
                  pending_amount: row.pending_amount ? parseFloat(row.pending_amount) : null,
                  is_active: true,
                  created_by: user?.id || null,
                  created_by_name: user?.username || null,
                  created_by_email: user?.email || null,
                },
                { transaction: t }
              );
            }

            await t.commit();

            results.success.push({
              row: index + 1,
              member_no: member.member_no,
              status: "Member Created/Found + Membership Added",
            });

            continue;
          }

          // ====================================================
          // ✅ CASE 2: NO member_no → NORMAL NEW MEMBER
          // ====================================================
          // require name AND (email OR phone)
          if (!row.name) throw new Error("Missing field: name");
          if (!row.email && !row.phone) throw new Error("Either email or phone is required");

          // If email provided, validate and check existence (only active members)
          if (row.email) {
            if (!isValidEmail(row.email)) throw new Error("Invalid email format");
            const existMemberByEmail = await Member.findOne({
              where: { email: row.email, is_active: 1 },
              transaction: t,
            });
            const existUserByEmail = await User.unscoped().findOne({
              where: { email: row.email },
              transaction: t,
            });
            if (existMemberByEmail || existUserByEmail) {
              console.error(`Row ${index + 1}: email conflict on new-member`, {
                existMemberByEmail: !!existMemberByEmail,
                existUserByEmail: !!existUserByEmail,
              });
              throw new Error("Email already exists");
            }
          }

          // If phone provided, validate and check existence (only active members)
          if (row.phone) {
            if (!isValidPhone(row.phone)) throw new Error("Invalid phone number");
            const existMemberByPhone = await Member.findOne({
              where: { phone: row.phone, is_active: 1 },
              transaction: t,
            });
            const existUserByPhone = await User.unscoped().findOne({
              where: { phone: row.phone },
              transaction: t,
            });
            if (existMemberByPhone || existUserByPhone) {
              console.error(`Row ${index + 1}: phone conflict on new-member`, {
                existMemberByPhone: !!existMemberByPhone,
                existUserByPhone: !!existUserByPhone,
              });
              throw new Error("Phone already exists");
            }
          }

          console.log(`Row ${index + 1}: about to create new Member (no member_no)`);
          member = await Member.create(
            {
              id: uuidv4(),
              member_no: null,
              name: row.name,
              email: row.email,
              phone: row.phone,
              dob: parsedDob,
              address: row.address || null,
              join_date: parsedJoinDate,
              start_date: parsedStartDate,
              gender: row.gender || null,
              workout_batch: row.workout_batch || null,
              is_active: true,
              created_by: user?.id || null,
              created_by_name: user?.username || null,
              created_by_email: user?.email || null,
            },
            { transaction: t }
          );

          const hashedPassword = await bcrypt.hash(String(row.phone || ""), 10);

          await User.create(
            {
              id: uuidv4(),
              role: "member",
              username: row.name,
              email: row.email,
              phone: row.phone,
              password: hashedPassword,
              created_by: user?.id || null,
            },
            { transaction: t }
          );

          if (row.membership_name) {
            const start = parsedStartDate ? parsedStartDate : new Date();
            const end = parsedEndDate
              ? parsedEndDate
              : new Date(start.getTime() + 30 * 24 * 60 * 60 * 1000);

            await Membermembership.create(
              {
                id: uuidv4(),
                member_id: member.id,
                membership_name: row.membership_name,
                start_date: start,
                end_date: end,
                status: "active",
                is_active: true,
              },
              { transaction: t }
            );
          }

          await t.commit();

          results.success.push({
            row: index + 1,
            email: row.email,
            status: "Member + User Created",
          });
        } catch (err) {
          // LOG FULL ERROR (stack) — critical for diagnosing why rollback occurred
          console.error(`❌ Row ${index + 1} failed — error:`, err && err.stack ? err.stack : err);
          await t.rollback();
          results.failed.push({
            row: index + 1,
            data: rawRow,
            error: err.message || String(err),
          });
        }
      }

      return results;
    } catch (error) {
      console.error("❌ Bulk Upload Error:", error && error.stack ? error.stack : error);
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
