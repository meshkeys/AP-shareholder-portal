require("dotenv").config();
const { BrevoClient } = require("@getbrevo/brevo");

const client = new BrevoClient({
  apiKey: process.env.BREVO_API_KEY,
});

// ── Send OTP Email ────────────────────────────────────────────────────────────
async function sendOTPEmail(toEmail, otp) {
  await client.transactionalEmails.sendTransacEmail({
    subject: "Your ShareReg Portal Verification Code",
    sender: {
      name: process.env.SMTP_FROM_NAME || "ShareReg Portal",
      email: process.env.BREVO_SENDER_EMAIL,
    },
    to: [{ email: toEmail }],
    htmlContent: `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px">
        <div style="background:#C0392B;padding:20px 24px;border-radius:8px 8px 0 0">
          <h2 style="color:#fff;margin:0;font-size:18px">ShareReg Portal</h2>
          <p style="color:rgba(255,255,255,0.8);margin:4px 0 0;font-size:13px">Shareholder Registry Services</p>
        </div>
        <div style="background:#fff;border:1px solid #e8e8e8;border-top:none;padding:24px;border-radius:0 0 8px 8px">
          <p style="font-size:15px;color:#1a1a1a;margin-bottom:8px">Hello,</p>
          <p style="font-size:14px;color:#6b6b6b;line-height:1.6;margin-bottom:24px">
            You requested a verification code to access your shareholder records.
            Use the code below to complete your login.
          </p>
          <div style="background:#fdf1f0;border:1px solid #e8b4af;border-radius:8px;padding:20px;text-align:center;margin-bottom:24px">
            <p style="font-size:12px;color:#C0392B;font-weight:500;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px">
              Your verification code
            </p>
            <p style="font-size:36px;font-weight:700;color:#C0392B;letter-spacing:8px;margin:0">${otp}</p>
          </div>
          <p style="font-size:13px;color:#6b6b6b;line-height:1.6;margin-bottom:8px">
            This code expires in <strong>10 minutes</strong>.
          </p>
          <p style="font-size:13px;color:#6b6b6b;line-height:1.6;margin-bottom:24px">
            If you did not request this code, please ignore this email.
            Do not share this code with anyone.
          </p>
          <hr style="border:none;border-top:1px solid #f0f0f0;margin-bottom:16px"/>
          <p style="font-size:12px;color:#b0b0b0;text-align:center">
            ShareReg Portal · Shareholder Registry Services
          </p>
        </div>
      </div>
    `,
  });
}

// ── Send Status Update Email ──────────────────────────────────────────────────
async function sendStatusUpdateEmail(
  toEmail,
  shareholderName,
  referenceNumber,
  status,
  customMessage,
) {
  const statusLabels = {
    in_progress: "In Progress",
    completed: "Completed",
    rejected: "Rejected",
  };
  const statusColors = {
    in_progress: "#2255cc",
    completed: "#1a7a40",
    rejected: "#C0392B",
  };

  await client.transactionalEmails.sendTransacEmail({
    subject: `Update on your request — ${referenceNumber}`,
    sender: {
      name: process.env.SMTP_FROM_NAME || "ShareReg Portal",
      email: process.env.BREVO_SENDER_EMAIL,
    },
    to: [{ email: toEmail }],
    htmlContent: `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px">
        <div style="background:#C0392B;padding:20px 24px;border-radius:8px 8px 0 0">
          <h2 style="color:#fff;margin:0;font-size:18px">ShareReg Portal</h2>
        </div>
        <div style="background:#fff;border:1px solid #e8e8e8;border-top:none;padding:24px;border-radius:0 0 8px 8px">
          <p style="font-size:15px;color:#1a1a1a;margin-bottom:8px">Dear ${shareholderName},</p>
          <p style="font-size:14px;color:#6b6b6b;line-height:1.6;margin-bottom:24px">
            There is an update on your request <strong>${referenceNumber}</strong>.
          </p>
          <div style="background:#f8f8f8;border:1px solid #e8e8e8;border-radius:8px;padding:16px;margin-bottom:24px;text-align:center">
            <p style="font-size:18px;font-weight:700;color:${statusColors[status] || "#1a1a1a"};margin:0">
              ${statusLabels[status] || status}
            </p>
          </div>
          <div style="background:#f8f8f8;border-left:3px solid #C0392B;padding:14px 16px;margin-bottom:24px">
            <p style="font-size:14px;color:#1a1a1a;line-height:1.6;margin:0">${customMessage}</p>
          </div>
          <hr style="border:none;border-top:1px solid #f0f0f0;margin-bottom:16px"/>
          <p style="font-size:12px;color:#b0b0b0;text-align:center">
            ShareReg Portal · Shareholder Registry Services
          </p>
        </div>
      </div>
    `,
  });
}

module.exports = { sendOTPEmail, sendStatusUpdateEmail };
