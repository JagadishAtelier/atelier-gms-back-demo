// remainderMailService.js
import nodemailer from "nodemailer";
import Member from "../../member/models/member.model.js";
import Membermembership from "../../member/models/membermembership.model.js";
import Membership from "../../membership/models/membership.model.js";
import { Op } from "sequelize";
import dotenv from "dotenv";

dotenv.config();

// --------------- SMTP CONFIG (BREVO) -------------------
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp-relay.brevo.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,      // 9b96e4001@smtp-brevo.com
    pass: process.env.SMTP_PASS       // xsmtpsib-xxxxxxx
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
const VERIFIED_SENDER = "parthiban.atelier@gmail.com";

const remainderMailService = {

  // ========================================================
  // SEND ALL PAYMENT REMINDERS
  // ========================================================
  async sendPaymentReminders() {
    try {
      console.log("🔍 Checking for unpaid + expiring memberships...");

      const today = new Date();
      const threeDays = new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000);

      const records = await Membermembership.findAll({
        where: {
          payment_status: "unpaid",
          end_date: { [Op.lte]: threeDays },
          is_active: true,
        },
        include: [
          { model: Member, attributes: ["id", "name", "email", "phone"] },
          { model: Membership, attributes: ["id", "name", "price"] },
        ],
        order: [["end_date", "ASC"]],
      });

      if (!records.length)
        return { message: "No unpaid memberships", sent: 0, failed: 0 };

      let sentCount = 0;
      let failedCount = 0;
      const failures = [];

      for (const rec of records) {
        const member = rec.Member;
        const membership = rec.Membership;

        if (!member?.email) continue;

        const html = `
          <div style="font-family: Arial">
            <h2>Hi ${member.name || "Member"},</h2>
            <p>Your <b>${membership?.name}</b> membership is expiring soon.</p>
            <p><b>End Date:</b> ${new Date(rec.end_date).toLocaleDateString()}</p>
            <p><b>Pending Amount:</b> ₹${membership?.price}</p>
            <br/>
            <p>Please renew soon to continue using the gym.</p>
          </div>
        `;

        const mailOptions = {
          from: `"Gym Admin" <${VERIFIED_SENDER}>`,
          to: member.email,
          subject: "Membership Payment Reminder",
          html,
        };

        try {
          await transporter.sendMail(mailOptions);
          sentCount++;
          console.log(`📨 Sent to ${member.email}`);
        } catch (err) {
          failedCount++;
          console.error(`❌ Failed ${member.email}:`, err.message);
          failures.push({ email: member.email, error: err.message });
        }
      }

      return { message: "Done", sent: sentCount, failed: failedCount, failures };

    } catch (err) {
      console.error("❌ ERROR sendPaymentReminders:", err.message);
      throw err;
    }
  },

  // ========================================================
  // SEND REMINDER FOR A SINGLE RECORD
  // ========================================================
  async sendReminderToSingle(id) {
    try {
      const record = await Membermembership.findByPk(id, {
        include: [
          { model: Member, attributes: ["id", "name", "email"] },
          { model: Membership, attributes: ["id", "name", "price"] },
        ],
      });

      if (!record) throw new Error("Membership record not found");
      if (!record.Member.email) throw new Error("Member has no email");

      const html = `
        <div style="font-family: Arial">
          <h2>Hello ${record.Member.name},</h2>
          <p>Your payment for <b>${record.Membership?.name}</b> is still pending.</p>
          <p><b>Amount:</b> ₹${record.Membership?.price}</p>
        </div>
      `;

      await transporter.sendMail({
        from: `"Gym Admin" <${VERIFIED_SENDER}>`,
        to: record.Member.email,
        subject: "Payment Reminder",
        html,
      });

      console.log(`📨 Sent to ${record.Member.email}`);
      return { message: "Sent", to: record.Member.email };

    } catch (err) {
      console.error("❌ ERROR sendReminderToSingle:", err.message);
      throw err;
    }
  },

  // ========================================================
  // SEND NEXT PAYMENT REMINDER BY MEMBER ID
  // ========================================================
  async sendNextPaymentReminderByMemberId(member_id) {
    try {
      const member = await Member.findByPk(member_id);
      if (!member) throw new Error("Member not found");
      if (!member.email) throw new Error("Member has no email");

      const active = await Membermembership.findOne({
        where: { member_id, is_active: true },
        include: [{ model: Membership }],
        order: [["end_date", "DESC"]],
      });

      if (active) {
        const nextPay = new Date(active.end_date);
        nextPay.setDate(nextPay.getDate() + 1);

        const html = `
          <div style="font-family: Arial">
            <h2>Hello ${member.name},</h2>
            <p>Your membership <b>${active.Membership.name}</b> ends on 
            <b>${new Date(active.end_date).toLocaleDateString()}</b>.</p>
            <p><b>Next Payment Date:</b> ${nextPay.toLocaleDateString()}</p>
            <p><b>Amount:</b> ₹${active.Membership.price}</p>
          </div>
        `;

        await transporter.sendMail({
          from: `"Gym Admin" <${VERIFIED_SENDER}>`,
          to: member.email,
          subject: "Upcoming Membership Payment",
          html,
        });

        console.log(`📨 Sent to ${member.email}`);
        return { message: "Sent", to: member.email };
      }

      // If no active membership → send all plans
      const plans = await Membership.findAll();
      let html = `
        <div style="font-family: Arial">
          <h2>Hello ${member.name},</h2>
          <p>You have no active membership. These plans are available:</p>
          <ul>
      `;
      plans.forEach((p) => {
        html += `<li><b>${p.name}</b> — ₹${p.price} (${p.duration_months} months)</li>`;
      });
      html += `</ul></div>`;

      await transporter.sendMail({
        from: `"Gym Admin" <${VERIFIED_SENDER}>`,
        to: member.email,
        subject: "Choose Your New Membership",
        html,
      });

      console.log(`📨 Sent plan list to ${member.email}`);
      return { message: "Sent plan list", to: member.email };

    } catch (err) {
      console.error("❌ ERROR sendNextPaymentReminderByMemberId:", err.message);
      throw err;
    }
  },
};

export default remainderMailService;
