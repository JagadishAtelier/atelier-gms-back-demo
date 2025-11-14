import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

async function test() {
  try {
    const info = await transporter.sendMail({
      from: "parthiban.atelier@gmail.com",
      to: "gnanaparthibanm@gmail.com",
      subject: "SMTP Test",
      text: "SMTP test working",
    });

    console.log("Mail Sent:", info);
  } catch (err) {
    console.error("SMTP Send Error:", err);
  }
}

test();
