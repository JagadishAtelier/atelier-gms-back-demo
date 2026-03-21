// utils/brevo.js
import SibApiV3Sdk from "sib-api-v3-sdk";

const client = SibApiV3Sdk.ApiClient.instance;

const apiKey = client.authentications["api-key"];
apiKey.apiKey = process.env.BREVO_API_KEY;

const tranEmailApi = new SibApiV3Sdk.TransactionalEmailsApi();

const sender = {
  email: "jagadish.atelier@gmail.com",
  name: "Atelier Creation",
};

// ✅ OTP EMAIL (Already working)
export const sendEmailOTP = async (toEmail, otp) => {
  try {
    await tranEmailApi.sendTransacEmail({
      sender,
      to: [{ email: toEmail }],
      subject: "Your OTP Verification Code",
      htmlContent: `
        <h2>Email Verification</h2>
        <p>Your OTP is:</p>
        <h1 style="color:#4f46e5;">${otp}</h1>
        <p>This OTP is valid for 5 minutes.</p>
      `,
    });

    return true;
  } catch (error) {
    console.error("Brevo OTP Error:", error);
    return false;
  }
};

// ✅ 1. USER ACCOUNT CREATED EMAIL
export const sendAccountCreatedEmail = async (toEmail, name, phone) => {
  try {
    await tranEmailApi.sendTransacEmail({
      sender,
      to: [{ email: toEmail, name }],
      subject: "Your Account Created Successfully",
      htmlContent: `
        <div style="font-family: Arial; padding: 20px;">
          <h2 style="color:#4f46e5;">Welcome ${name} 👋</h2>
          
          <p>Your account has been created successfully.</p>

          <div style="background:#f3f4f6; padding:15px; border-radius:8px;">
            <h3>Login Details:</h3>
            <p><strong>Email:</strong> ${toEmail}</p>
            <p><strong>Password:</strong> ${phone}</p>
          </div>

          <p>Thanks,<br/>Atelier Creation Team</p>
        </div>
      `,
    });

    return true;
  } catch (error) {
    console.error("User Email Error:", error);
    return false;
  }
};

// ✅ 2. SUPER ADMIN NOTIFICATION EMAIL
export const sendSuperAdminNotification = async (company, user) => {
  try {
    await tranEmailApi.sendTransacEmail({
      sender,
      to: [
        {
          email: process.env.SUPER_ADMIN_EMAIL, // add in .env
          name: "Super Admin",
        },
      ],
      subject: "New Company Registration",
      htmlContent: `
        <div style="font-family: Arial; padding: 20px;">
          <h2 style="color:#16a34a;">New Company Registered</h2>

          <h3>Company Details</h3>
          <p><strong>Name:</strong> ${company.company_name}</p>
          <p><strong>Owner:</strong> ${company.owner_name}</p>
          <p><strong>Email:</strong> ${company.email}</p>
          <p><strong>Phone:</strong> ${company.phone}</p>

          <hr/>

          <h3>Admin User Details</h3>
          <p><strong>Name:</strong> ${user.username}</p>
          <p><strong>Email:</strong> ${user.email}</p>
          <p><strong>Phone:</strong> ${user.phone}</p>
        </div>
      `,
    });

    return true;
  } catch (error) {
    console.error("Super Admin Email Error:", error);
    return false;
  }
};