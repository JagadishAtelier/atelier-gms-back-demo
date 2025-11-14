import nodemailer from "nodemailer";
import Member from "../../member/models/member.model.js";
import Membermembership from "../../member/models/membermembership.model.js";
import Membership from "../../membership/models/membership.model.js";
import { Op } from "sequelize";
import dotenv from "dotenv";

dotenv.config();
// =========================
// SMTP CONFIG
// =========================
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT || 587,
    secure: false,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

// Test SMTP connection
transporter.verify((error, success) => {
    if (error) {
        console.error("❌ SMTP Connection Failed:", error);
    } else {
        console.log("✅ SMTP Ready to Send Emails");
    }
});

const remainderMailService = {

    // --------------------------------------------------------------------
    // SEND REMINDER EMAILS TO ALL PENDING MEMBERS
    // --------------------------------------------------------------------
    async sendPaymentReminders() {
        try {
            console.log("🔍 Fetching unpaid or expired memberships...");

            const today = new Date();

            const members = await Membermembership.findAll({
                where: {
                    payment_status: "unpaid",
                    end_date: {
                        [Op.lte]: new Date(today.getTime() + 3 * 86400000)
                    },
                    is_active: true
                },
                include: [
                    { model: Member, attributes: ["id", "name", "email", "phone"] },
                    { model: Membership, attributes: ["id", "name", "price"] }
                ]
            });

            if (members.length === 0) {
                return { message: "No unpaid/expiring memberships found." };
            }

            for (const record of members) {
                const { Member: member, Membership: membership } = record;

                if (!member?.email) continue;

                const mailOptions = {
                    from: `"Gym Admin" <${process.env.SMTP_USER}>`,
                    to: member.email,
                    subject: "Payment Reminder - Membership Expiring Soon",
                    html: `
                        <h2>Hi ${member.name},</h2>
                        <p>Your <strong>${membership.name}</strong> membership is expiring soon.</p>
                        <p><strong>End Date:</strong> ${new Date(record.end_date).toLocaleDateString()}</p>
                        <p><strong>Pending Payment:</strong> ₹${membership.price}</p>
                        <br>
                        <p>Please renew your membership to continue enjoying our services.</p>
                    `
                };

                await transporter.sendMail(mailOptions);
                console.log(`📨 Reminder Mail Sent To: ${member.email}`);
            }

            return { message: "Reminder emails sent successfully" };
        } catch (error) {
            console.error("❌ Error sending reminder emails:", error.message);
            throw error;
        }
    },

    // --------------------------------------------------------------------
    // SEND REMINDER TO A SINGLE MEMBERSHIP RECORD BY RECORD ID
    // --------------------------------------------------------------------
    async sendReminderToSingle(id) {
        try {
            const record = await Membermembership.findByPk(id, {
                include: [
                    { model: Member, attributes: ["id", "name", "email"] },
                    { model: Membership, attributes: ["id", "name", "price"] },
                ]
            });

            if (!record) throw new Error("Membership record not found");

            const { Member: member, Membership: membership } = record;

            if (!member.email) throw new Error("Member has no email");

            const mailOptions = {
                from: `"Gym Admin" <${process.env.SMTP_USER}>`,
                to: member.email,
                subject: "Payment Reminder",
                html: `
                    <h2>Hello ${member.name},</h2>
                    <p>Your payment for <strong>${membership.name}</strong> is still pending.</p>
                    <p><strong>Amount:</strong> ₹${membership.price}</p>
                    <p><strong>End Date:</strong> ${new Date(record.end_date).toLocaleDateString()}</p>
                `
            };

            await transporter.sendMail(mailOptions);

            return { message: "Reminder sent successfully", member: member.email };
        } catch (error) {
            console.error("❌ Error:", error.message);
            throw error;
        }
    },

    // --------------------------------------------------------------------
    // ⭐ NEW FUNCTION:
    // SEND REMINDER BY MEMBER ID — SHOW NEXT PAYMENT DATE + ACTIVE MEMBERSHIP
    // --------------------------------------------------------------------
    async sendNextPaymentReminderByMemberId(member_id) {
    try {
        // 1) load member 
        const member = await Member.findByPk(member_id, {
            attributes: ["id", "name", "email", "phone"],
        });
        if (!member) throw new Error("Member not found");
        if (!member.email) throw new Error("Member has no email.");

        // 2) try to find active membership
        const activeRecord = await Membermembership.findOne({
            where: { member_id, is_active: true },
            include: [{ model: Membership, attributes: ["id", "name", "price", "duration_months"] }],
            order: [["end_date", "DESC"]],
        });

        if (activeRecord) {
            // SENDING NEXT PAYMENT REMINDER
            const membership = activeRecord.Membership;
            const nextPaymentDate = new Date(activeRecord.end_date);
            nextPaymentDate.setDate(nextPaymentDate.getDate() + 1);

            await transporter.sendMail({
                from: `"Gym Admin" <${process.env.SMTP_USER}>`,
                to: member.email,
                subject: "Upcoming Payment Reminder",
                html: `
                    <h2>Hello ${member.name},</h2>
                    <p>Your membership details:</p>
                    <p><strong>Membership:</strong> ${membership.name}</p>
                    <p><strong>Next Payment Date:</strong> ${nextPaymentDate.toLocaleDateString()}</p>
                    <p><strong>Amount:</strong> ₹${membership.price}</p>
                    <br><p>Please make payment on time.</p>
                `,
            });

            return { message: "Active membership - Reminder sent", to: member.email };
        }

        // 3) FETCH PAST MEMBERSHIP RECORDS (if any)
        const allRecords = await Membermembership.findAll({
            where: { member_id },
            include: [{ model: Membership, attributes: ["id", "name", "price", "duration_months"] }],
            order: [["end_date", "DESC"]],
        });

        // 4) NEW REQUIREMENT:
        //    If NO active membership AND NO membership records => send ALL membership plans
        if (!allRecords || allRecords.length === 0) {
            // Fetch all available membership plans
            const allPlans = await Membership.findAll({
                attributes: ["id", "name", "price", "duration_months"],
                order: [["price", "ASC"]],
            });

            let html = `
                <h2>Hello ${member.name},</h2>
                <p>You have paid your membership fully till now.</p>
                <p><strong>Please select a new membership plan to continue attending the gym.</strong></p>
                <br>
                <h3>Available Membership Plans:</h3>
                <ul style="padding-left: 18px;">
            `;

            for (const plan of allPlans) {
                html += `
                    <li style="margin-bottom: 10px;">
                        <strong>${plan.name}</strong><br>
                        Price: ₹${plan.price}<br>
                        Duration: ${plan.duration_months} months
                    </li>
                `;
            }

            html += `</ul><br><p>Thank you,<br>Gym Management</p>`;

            await transporter.sendMail({
                from: `"Gym Admin" <${process.env.SMTP_USER}>`,
                to: member.email,
                subject: "Select a New Membership Plan",
                html,
            });

            return {
                message: "No records found — Sent all membership plans",
                to: member.email,
                plan_count: allPlans.length,
            };
        }

        // 5) If records exist (past memberships) -> show them
        let html = `<h2>Hello ${member.name},</h2>
            <p>You do not have an active membership. Below are your past membership records:</p>
            <ul style="padding-left:18px;">`;

        for (const r of allRecords) {
            const mem = r.Membership || {};
            const start = r.start_date ? new Date(r.start_date).toLocaleDateString() : "N/A";
            const end = r.end_date ? new Date(r.end_date).toLocaleDateString() : "N/A";

            html += `
                <li style="margin-bottom:10px;">
                    <strong>${mem.name}</strong><br>
                    Period: ${start} - ${end}<br>
                    Amount: ₹${mem.price}
                </li>
            `;
        }

        html += `</ul><br><p>Thank you,<br>Gym Management</p>`;

        await transporter.sendMail({
            from: `"Gym Admin" <${process.env.SMTP_USER}>`,
            to: member.email,
            subject: "Select Membership to Renew",
            html,
        });

        return {
            message: "Sent past membership list",
            to: member.email,
            count: allRecords.length,
        };

    } catch (error) {
        console.error("❌ Error:", error.message);
        throw error;
    }
},



};

export default remainderMailService;
