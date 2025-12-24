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
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
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
const VERIFIED_SENDER = "flexculture001@gmail.com";

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
<div style="max-width:600px;margin:0 auto;font-family:Arial,Helvetica,sans-serif;background:#0d0d0d;border:1px solid #1f1f1f;border-radius:10px;overflow:hidden">

  <!-- Header -->
  <div style="background:#000000;padding:22px;text-align:center;border-bottom:2px solid #e10600">
    <h2 style="margin:0;font-size:22px;color:#ffffff;letter-spacing:1px">
      FLEX <span style="color:#e10600">CULTURE</span>
    </h2>
    <p style="margin:6px 0 0;font-size:13px;color:#bbbbbb">
      Membership Expiry Reminder
    </p>
  </div>

  <!-- Body -->
  <div style="padding:22px;color:#e5e5e5">
    <p style="font-size:14px;margin-bottom:18px;color:#cccccc">
      Hi <strong style="color:#ffffff">${member.name || "Member"}</strong>,
      <br/><br/>
      Your <strong style="color:#ffffff">${membership?.name}</strong> membership is expiring soon.
      Please review the details below and renew to continue training with us 💪
    </p>

    <table width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;border-collapse:collapse">
      <tr>
        <td style="padding:10px 0;font-weight:bold;color:#ffffff;width:140px">Membership</td>
        <td style="padding:10px 0;color:#e5e5e5">: ${membership?.name}</td>
      </tr>
      <tr>
        <td style="padding:10px 0;font-weight:bold;color:#ffffff">End Date</td>
        <td style="padding:10px 0;color:#e5e5e5">
          : ${new Date(rec.end_date).toLocaleDateString()}
        </td>
      </tr>
      <tr>
        <td style="padding:10px 0;font-weight:bold;color:#ffffff">Pending Amount</td>
        <td style="padding:10px 0;color:#e5e5e5">
          : ₹${membership?.price}
        </td>
      </tr>
    </table>

    <!-- CTA -->
    <div style="margin-top:24px;text-align:center">
      <a href="https://gmsflexculture.ateliertechnologysolutions.com/"
         style="display:inline-block;padding:14px 26px;background:#e10600;color:#ffffff;text-decoration:none;border-radius:6px;font-size:14px;font-weight:bold;letter-spacing:0.5px">
        RENEW NOW
      </a>
    </div>
  </div>

  <!-- Footer -->
  <div style="background:#111111;padding:14px;text-align:center;font-size:12px;color:#999999;border-top:1px solid #222222">
    This is an automated reminder from
    <strong style="color:#ffffff">flexculture.in</strong><br/>
    Stay consistent. Stay strong 💪
  </div>

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
<div style="max-width:600px;margin:0 auto;font-family:Arial,Helvetica,sans-serif;background:#0d0d0d;border:1px solid #1f1f1f;border-radius:10px;overflow:hidden">

  <!-- Header -->
  <div style="background:#000000;padding:22px;text-align:center;border-bottom:2px solid #e10600">
    <h2 style="margin:0;font-size:22px;color:#ffffff;letter-spacing:1px">
      FLEX <span style="color:#e10600">CULTURE</span>
    </h2>
    <p style="margin:6px 0 0;font-size:13px;color:#bbbbbb">
      Payment Pending Reminder
    </p>
  </div>

  <!-- Body -->
  <div style="padding:22px;color:#e5e5e5">
    <p style="font-size:14px;margin-bottom:18px;color:#cccccc">
      Hello <strong style="color:#ffffff">${record.Member?.name || "Member"}</strong>,
      <br/><br/>
      This is a friendly reminder that your payment for
      <strong style="color:#ffffff">${record.Membership?.name || "membership"}</strong>
      is still pending. Please complete the payment to continue enjoying our facilities.
    </p>

    <table width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;border-collapse:collapse">
      <tr>
        <td style="padding:10px 0;font-weight:bold;color:#ffffff;width:140px">Membership</td>
        <td style="padding:10px 0;color:#e5e5e5">: ${record.Membership?.name || "—"}</td>
      </tr>
      <tr>
        <td style="padding:10px 0;font-weight:bold;color:#ffffff">Amount</td>
        <td style="padding:10px 0;color:#e5e5e5">: ₹${record.Membership?.price ?? "0"}</td>
      </tr>
      <tr>
        <td style="padding:10px 0;font-weight:bold;color:#ffffff">Due Date</td>
        <td style="padding:10px 0;color:#e5e5e5">
          : ${record.due_date ? new Date(record.due_date).toLocaleDateString() : "—"}
        </td>
      </tr>
      <tr>
        <td style="padding:10px 0;font-weight:bold;color:#ffffff;vertical-align:top">Notes</td>
        <td style="padding:10px 0;color:#e5e5e5">: ${record.note || "Please contact the gym if you need help with payment."}</td>
      </tr>
    </table>

    <!-- CTA -->
    <div style="margin-top:24px;text-align:center">
      <a href="${paymentUrl || '#'}"
         style="display:inline-block;padding:14px 26px;background:#e10600;color:#ffffff;text-decoration:none;border-radius:6px;font-size:14px;font-weight:bold;letter-spacing:0.5px;margin-right:10px">
        PAY NOW
      </a>
      <a href="tel:+917904202265"
         style="display:inline-block;padding:12px 20px;background:transparent;color:#e5e5e5;text-decoration:none;border:1px solid #2a2a2a;border-radius:6px;font-size:13px">
        Need Help?
      </a>
    </div>
  </div>

  <!-- Footer -->
  <div style="background:#111111;padding:14px;text-align:center;font-size:12px;color:#999999;border-top:1px solid #222222">
    This reminder was sent by <strong style="color:#ffffff">flexculture.in</strong><br/>
    If you've already paid, please ignore this message. Thank you for training with us 💪
  </div>

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
<div style="max-width:600px;margin:0 auto;font-family:Arial,Helvetica,sans-serif;background:#0d0d0d;border:1px solid #1f1f1f;border-radius:10px;overflow:hidden">

  <!-- Header -->
  <div style="background:#000000;padding:22px;text-align:center;border-bottom:2px solid #e10600">
    <h2 style="margin:0;font-size:22px;color:#ffffff;letter-spacing:1px">
      FLEX <span style="color:#e10600">CULTURE</span>
    </h2>
    <p style="margin:6px 0 0;font-size:13px;color:#bbbbbb">
      Membership Ending Reminder
    </p>
  </div>

  <!-- Body -->
  <div style="padding:22px;color:#e5e5e5">
    <p style="font-size:14px;margin-bottom:18px;color:#cccccc">
      Hello <strong style="color:#ffffff">${member.name || "Member"}</strong>,
      <br/><br/>
      Your membership
      <strong style="color:#ffffff">${active.Membership?.name}</strong>
      is nearing its end. Please find the details below and renew in time to avoid interruption.
    </p>

    <table width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;border-collapse:collapse">
      <tr>
        <td style="padding:10px 0;font-weight:bold;color:#ffffff;width:160px">Membership</td>
        <td style="padding:10px 0;color:#e5e5e5">: ${active.Membership?.name}</td>
      </tr>
      <tr>
        <td style="padding:10px 0;font-weight:bold;color:#ffffff">End Date</td>
        <td style="padding:10px 0;color:#e5e5e5">
          : ${new Date(active.end_date).toLocaleDateString()}
        </td>
      </tr>
      <tr>
        <td style="padding:10px 0;font-weight:bold;color:#ffffff">Next Payment Date</td>
        <td style="padding:10px 0;color:#e5e5e5">
          : ${nextPay.toLocaleDateString()}
        </td>
      </tr>
      <tr>
        <td style="padding:10px 0;font-weight:bold;color:#ffffff">Amount</td>
        <td style="padding:10px 0;color:#e5e5e5">
          : ₹${active.Membership?.price}
        </td>
      </tr>
    </table>

    <!-- CTA -->
    <div style="margin-top:24px;text-align:center">
      <a href="https://gmsflexculture.ateliertechnologysolutions.com/"
         style="display:inline-block;padding:14px 26px;background:#e10600;color:#ffffff;text-decoration:none;border-radius:6px;font-size:14px;font-weight:bold;letter-spacing:0.5px;margin-right:10px">
        RENEW MEMBERSHIP
      </a>
      <br/>
      <a href="tel:+917904202265"
         style="display:inline-block;padding:12px 20px;background:transparent;color:#e5e5e5;text-decoration:none;border:1px solid #2a2a2a;border-radius:6px;font-size:13px">
        Contact Gym
      </a>
    </div>
  </div>

  <!-- Footer -->
  <div style="background:#111111;padding:14px;text-align:center;font-size:12px;color:#999999;border-top:1px solid #222222">
    This is an automated reminder from
    <strong style="color:#ffffff">flexculture.in</strong><br/>
    Stay consistent. Stay disciplined. 💪
  </div>

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
