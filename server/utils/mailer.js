require("dotenv").config();
const { BrevoClient } = require("@getbrevo/brevo");

const client = new BrevoClient({ apiKey: process.env.BREVO_API_KEY });

async function sendOTPEmail(toEmail, otp) {
  await client.transactionalEmails.sendTransacEmail({
    subject: "Your ShareReg Portal Verification Code",
    sender: {
      name: process.env.SMTP_FROM_NAME || "ShareReg Portal",
      email: process.env.BREVO_SENDER_EMAIL,
    },
    to: [{ email: toEmail }],
    htmlContent:
      "<p>Your OTP is: <strong>" +
      otp +
      "</strong>. Expires in 10 minutes.</p>",
  });
}

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
  await client.transactionalEmails.sendTransacEmail({
    subject: "Update on your request — " + referenceNumber,
    sender: {
      name: process.env.SMTP_FROM_NAME || "ShareReg Portal",
      email: process.env.BREVO_SENDER_EMAIL,
    },
    to: [{ email: toEmail }],
    htmlContent:
      "<p>Dear " +
      shareholderName +
      ", your request " +
      referenceNumber +
      " status is now <strong>" +
      (statusLabels[status] || status) +
      "</strong>. " +
      customMessage +
      "</p>",
  });
}

async function sendAgentWelcomeEmail(
  toEmail,
  agentName,
  role,
  temporaryPassword,
) {
  const portalUrl =
    (process.env.FRONTEND_URL || "https://your-portal.vercel.app") + "/admin";
  await client.transactionalEmails.sendTransacEmail({
    subject: "Welcome to ShareReg Portal",
    sender: {
      name: process.env.SMTP_FROM_NAME || "ShareReg Portal",
      email: process.env.BREVO_SENDER_EMAIL,
    },
    to: [{ email: toEmail }],
    htmlContent:
      "<p>Hello " +
      agentName +
      ", your account has been created with role <strong>" +
      role +
      '</strong>.<br>Login at: <a href="' +
      portalUrl +
      '">' +
      portalUrl +
      "</a><br>Email: " +
      toEmail +
      "<br>Temporary password: <strong>" +
      temporaryPassword +
      "</strong><br><br>You will be asked to change your password on first login.</p>",
  });
}

async function sendPasswordResetEmail(toEmail, agentName, resetUrl) {
  await client.transactionalEmails.sendTransacEmail({
    subject: "Reset your ShareReg Portal password",
    sender: {
      name: process.env.SMTP_FROM_NAME || "ShareReg Portal",
      email: process.env.BREVO_SENDER_EMAIL,
    },
    to: [{ email: toEmail, name: agentName }],
    htmlContent: `<div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px"><div style="background:#1a1a1a;padding:20px 24px;border-radius:8px 8px 0 0"><h2 style="color:#fff;margin:0;font-size:18px">ShareReg Admin Portal</h2><p style="color:rgba(255,255,255,0.6);margin:4px 0 0;font-size:13px">Password reset request</p></div><div style="background:#fff;border:1px solid #e8e8e8;border-top:none;padding:24px;border-radius:0 0 8px 8px"><p style="font-size:15px;color:#1a1a1a;margin-bottom:8px">Hello ${agentName},</p><p style="font-size:14px;color:#6b6b6b;line-height:1.6;margin-bottom:24px">We received a request to reset your ShareReg Admin Portal password. Click the button below to reset it. This link expires in <strong>1 hour</strong>.</p><div style="text-align:center;margin-bottom:24px"><a href="${resetUrl}" style="display:inline-block;padding:12px 24px;background:#C0392B;color:#fff;text-decoration:none;border-radius:8px;font-size:14px;font-weight:500">Reset my password</a></div><p style="font-size:13px;color:#6b6b6b;line-height:1.6;margin-bottom:8px">If the button doesn't work, copy and paste this link into your browser:</p><p style="font-size:12px;color:#C0392B;word-break:break-all;margin-bottom:24px">${resetUrl}</p><div style="background:#fdf1f0;border:1px solid #e8b4af;border-radius:8px;padding:14px;margin-bottom:24px"><p style="font-size:13px;color:#C0392B;margin:0">If you did not request a password reset, please ignore this email. Your password will remain unchanged.</p></div><hr style="border:none;border-top:1px solid #f0f0f0;margin-bottom:16px"/><p style="font-size:12px;color:#b0b0b0;text-align:center">ShareReg Portal &nbsp;·&nbsp; Admin Access Only</p></div></div>`,
  });
}

module.exports = {
  sendOTPEmail,
  sendStatusUpdateEmail,
  sendAgentWelcomeEmail,
  sendPasswordResetEmail,
};
