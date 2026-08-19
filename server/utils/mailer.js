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
    htmlContent: `<div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px"><div style="background:#C0392B;padding:20px 24px;border-radius:8px 8px 0 0"><h2 style="color:#fff;margin:0;font-size:18px">ShareReg Portal</h2><p style="color:rgba(255,255,255,0.8);margin:4px 0 0;font-size:13px">Shareholder Registry Services</p></div><div style="background:#fff;border:1px solid #e8e8e8;border-top:none;padding:24px;border-radius:0 0 8px 8px"><p style="font-size:15px;color:#1a1a1a;margin-bottom:8px">Hello,</p><p style="font-size:14px;color:#6b6b6b;line-height:1.6;margin-bottom:24px">You requested a verification code to access your shareholder records on the ShareReg Portal. Use the code below to complete your login.</p><div style="background:#fdf1f0;border:1px solid #e8b4af;border-radius:8px;padding:20px;text-align:center;margin-bottom:24px"><p style="font-size:12px;color:#C0392B;font-weight:500;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px">Your verification code</p><p style="font-size:36px;font-weight:700;color:#C0392B;letter-spacing:8px;margin:0">${otp}</p></div><p style="font-size:13px;color:#6b6b6b;line-height:1.6;margin-bottom:8px">This code expires in <strong>10 minutes</strong>.</p><p style="font-size:13px;color:#6b6b6b;line-height:1.6;margin-bottom:24px">If you did not request this code, please ignore this email. Do not share this code with anyone.</p><hr style="border:none;border-top:1px solid #f0f0f0;margin-bottom:16px"/><p style="font-size:12px;color:#b0b0b0;text-align:center">ShareReg Portal &nbsp;·&nbsp; Shareholder Registry Services</p></div></div>`,
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
    subject: "Update on your request — " + referenceNumber,
    sender: {
      name: process.env.SMTP_FROM_NAME || "ShareReg Portal",
      email: process.env.BREVO_SENDER_EMAIL,
    },
    to: [{ email: toEmail, name: shareholderName }],
    htmlContent: `<div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px"><div style="background:#C0392B;padding:20px 24px;border-radius:8px 8px 0 0"><h2 style="color:#fff;margin:0;font-size:18px">ShareReg Portal</h2><p style="color:rgba(255,255,255,0.8);margin:4px 0 0;font-size:13px">Shareholder Registry Services</p></div><div style="background:#fff;border:1px solid #e8e8e8;border-top:none;padding:24px;border-radius:0 0 8px 8px"><p style="font-size:15px;color:#1a1a1a;margin-bottom:8px">Dear ${shareholderName},</p><p style="font-size:14px;color:#6b6b6b;line-height:1.6;margin-bottom:24px">There is an update on your request with reference number <strong>${referenceNumber}</strong>.</p><div style="background:#f8f8f8;border:1px solid #e8e8e8;border-radius:8px;padding:16px;margin-bottom:24px;text-align:center"><p style="font-size:12px;color:#6b6b6b;margin-bottom:6px;text-transform:uppercase;letter-spacing:1px">Request status</p><p style="font-size:18px;font-weight:700;color:${statusColors[status] || "#1a1a1a"};margin:0">${statusLabels[status] || status}</p></div><div style="background:#f8f8f8;border-left:3px solid #C0392B;padding:14px 16px;margin-bottom:24px;border-radius:0 8px 8px 0"><p style="font-size:13px;color:#6b6b6b;margin-bottom:4px;font-weight:500">Message from our team:</p><p style="font-size:14px;color:#1a1a1a;line-height:1.6;margin:0">${customMessage}</p></div><hr style="border:none;border-top:1px solid #f0f0f0;margin-bottom:16px"/><p style="font-size:12px;color:#b0b0b0;text-align:center">ShareReg Portal &nbsp;·&nbsp; Shareholder Registry Services</p></div></div>`,
  });
}

// ── Send Agent Welcome Email ──────────────────────────────────────────────────
async function sendAgentWelcomeEmail(
  toEmail,
  agentName,
  role,
  temporaryPassword,
) {
  const roleLabels = {
    admin: "Admin",
    lead_supervisor: "Lead Supervisor",
    supervisor: "Supervisor",
    agent: "Agent",
  };

  const portalUrl =
    (process.env.FRONTEND_URL || "https://your-portal.vercel.app") + "/admin";

  await client.transactionalEmails.sendTransacEmail({
    subject: "Welcome to ShareReg Portal — Your Account Details",
    sender: {
      name: process.env.SMTP_FROM_NAME || "ShareReg Portal",
      email: process.env.BREVO_SENDER_EMAIL,
    },
    to: [{ email: toEmail, name: agentName }],
    htmlContent: `<div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px"><div style="background:#1a1a1a;padding:20px 24px;border-radius:8px 8px 0 0"><h2 style="color:#fff;margin:0;font-size:18px">ShareReg Admin Portal</h2><p style="color:rgba(255,255,255,0.6);margin:4px 0 0;font-size:13px">Your account has been created</p></div><div style="background:#fff;border:1px solid #e8e8e8;border-top:none;padding:24px;border-radius:0 0 8px 8px"><p style="font-size:15px;color:#1a1a1a;margin-bottom:8px">Hello ${agentName},</p><p style="font-size:14px;color:#6b6b6b;line-height:1.6;margin-bottom:24px">Your ShareReg Admin Portal account has been created. You have been assigned the role of <strong style="color:#C0392B">${roleLabels[role] || role}</strong>. Use the details below to log in.</p><div style="background:#f8f8f8;border:1px solid #e8e8e8;border-radius:8px;padding:16px;margin-bottom:24px"><p style="font-size:12px;color:#6b6b6b;text-transform:uppercase;letter-spacing:1px;margin-bottom:12px;font-weight:500">Your login details</p><table style="width:100%;font-size:14px;border-collapse:collapse"><tr><td style="color:#6b6b6b;padding:6px 0;width:40%">Portal URL</td><td><a href="${portalUrl}" style="color:#C0392B">${portalUrl}</a></td></tr><tr><td style="color:#6b6b6b;padding:6px 0">Email</td><td style="color:#1a1a1a;font-weight:500">${toEmail}</td></tr><tr><td style="color:#6b6b6b;padding:6px 0">Temporary password</td><td style="font-family:monospace;font-size:16px;font-weight:700;color:#C0392B;letter-spacing:2px">${temporaryPassword}</td></tr></table></div><div style="background:#fdf1f0;border:1px solid #e8b4af;border-radius:8px;padding:14px;margin-bottom:24px"><p style="font-size:13px;color:#C0392B;margin:0;line-height:1.5"><strong>Important:</strong> You will be required to change your password immediately after your first login. Keep your credentials secure and do not share them with anyone.</p></div><hr style="border:none;border-top:1px solid #f0f0f0;margin-bottom:16px"/><p style="font-size:12px;color:#b0b0b0;text-align:center">ShareReg Portal &nbsp;·&nbsp; Admin Access Only</p></div></div>`,
  });
}

module.exports = { sendOTPEmail, sendStatusUpdateEmail, sendAgentWelcomeEmail };
