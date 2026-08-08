const nodemailer = require("nodemailer");
require("dotenv").config();

//const transporter = nodemailer.createTransport({
// host: process.env.SMTP_HOST,
//port: parseInt(process.env.SMTP_PORT),
//secure: process.env.SMTP_SECURE === "true", // true for 465, false for 587
//auth: {
//user: process.env.SMTP_USER,
//pass: process.env.SMTP_PASS,
//},
//});*/

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

async function sendOTPEmail(toEmail, otp) {
  const mailOptions = {
    from: `"${process.env.SMTP_FROM_NAME}" <${process.env.SMTP_USER}>`,
    to: toEmail,
    subject: "Your ShareReg Portal Verification Code",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
        
        <!-- Header -->
        <div style="background: #C0392B; padding: 20px 24px; border-radius: 8px 8px 0 0;">
          <h2 style="color: #fff; margin: 0; font-size: 18px;">ShareReg Portal</h2>
          <p style="color: rgba(255,255,255,0.8); margin: 4px 0 0; font-size: 13px;">Shareholder Registry Services</p>
        </div>

        <!-- Body -->
        <div style="background: #fff; border: 1px solid #e8e8e8; border-top: none; padding: 24px; border-radius: 0 0 8px 8px;">
          <p style="font-size: 15px; color: #1a1a1a; margin-bottom: 8px;">Hello,</p>
          <p style="font-size: 14px; color: #6b6b6b; line-height: 1.6; margin-bottom: 24px;">
            You requested a verification code to access your shareholder records on the ShareReg Portal. 
            Use the code below to complete your login.
          </p>

          <!-- OTP box -->
          <div style="background: #fdf1f0; border: 1px solid #e8b4af; border-radius: 8px; padding: 20px; text-align: center; margin-bottom: 24px;">
            <p style="font-size: 12px; color: #C0392B; font-weight: 500; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">
              Your verification code
            </p>
            <p style="font-size: 36px; font-weight: 700; color: #C0392B; letter-spacing: 8px; margin: 0;">
              ${otp}
            </p>
          </div>

          <p style="font-size: 13px; color: #6b6b6b; line-height: 1.6; margin-bottom: 8px;">
            This code expires in <strong>10 minutes</strong>.
          </p>
          <p style="font-size: 13px; color: #6b6b6b; line-height: 1.6; margin-bottom: 24px;">
            If you did not request this code, please ignore this email. 
            Do not share this code with anyone.
          </p>

          <hr style="border: none; border-top: 1px solid #f0f0f0; margin-bottom: 16px;" />

          <p style="font-size: 12px; color: #b0b0b0; text-align: center;">
            ShareReg Portal &nbsp;·&nbsp; Shareholder Registry Services
            <br/>
            <a href="mailto:support@sharereg.ng" style="color: #C0392B;">support@sharereg.ng</a>
          </p>
        </div>

      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
}

module.exports = { sendOTPEmail };
