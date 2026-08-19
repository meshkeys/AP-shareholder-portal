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

module.exports = { sendOTPEmail, sendStatusUpdateEmail, sendAgentWelcomeEmail };
