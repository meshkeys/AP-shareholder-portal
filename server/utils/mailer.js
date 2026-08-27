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

// ── Send Flagged Email ────────────────────────────────────────────────────────
async function sendFlaggedEmail(
  toEmail,
  shareholderName,
  referenceNumber,
  requestType,
  message,
  flaggedItems,
  resubmitUrl,
) {
  const typeLabels = {
    nameChange: "Name Change",
    kycUpdate: "KYC Update",
    addressUpdate: "Address Update",
    signatureUpdate: "Signature Update",
    nubanChange: "NUBAN Change",
  };

  const flaggedList =
    flaggedItems.length > 0
      ? flaggedItems
          .map(
            (item) =>
              `<li style="padding:4px 0;color:#C0392B;font-size:14px">⚠️ ${item}</li>`,
          )
          .join("")
      : "";

  await client.transactionalEmails.sendTransacEmail({
    subject: `Action Required — Your ${typeLabels[requestType] || requestType} Request (${referenceNumber})`,
    sender: {
      name: process.env.SMTP_FROM_NAME || "ShareReg Portal",
      email: process.env.BREVO_SENDER_EMAIL,
    },
    to: [{ email: toEmail, name: shareholderName }],
    htmlContent: `
      <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;padding:24px">
        <div style="background:#C0392B;padding:20px 24px;border-radius:8px 8px 0 0">
          <h2 style="color:#fff;margin:0;font-size:18px">ShareReg Portal</h2>
          <p style="color:rgba(255,255,255,0.8);margin:4px 0 0;font-size:13px">Action Required on Your Request</p>
        </div>
        <div style="background:#fff;border:1px solid #e8e8e8;border-top:none;padding:24px;border-radius:0 0 8px 8px">
          <p style="font-size:15px;color:#1a1a1a;margin-bottom:8px">Dear ${shareholderName},</p>
          <p style="font-size:14px;color:#6b6b6b;line-height:1.6;margin-bottom:20px">${message}</p>

          ${
            flaggedList
              ? `
          <div style="background:#fdf1f0;border:1px solid #e8b4af;border-radius:8px;padding:16px;margin-bottom:20px">
            <p style="font-size:13px;font-weight:600;color:#C0392B;margin-bottom:10px;text-transform:uppercase;letter-spacing:0.5px">
              Items requiring attention:
            </p>
            <ul style="margin:0;padding-left:16px">${flaggedList}</ul>
          </div>`
              : ""
          }

          <div style="background:#f8f8f8;border-radius:8px;padding:16px;margin-bottom:20px">
            <p style="font-size:12px;color:#6b6b6b;margin-bottom:4px">Reference number</p>
            <p style="font-size:16px;font-weight:700;color:#1a1a1a;font-family:monospace;letter-spacing:2px">${referenceNumber}</p>
          </div>

          <div style="text-align:center;margin-bottom:24px">
            <a href="${resubmitUrl}" style="display:inline-block;padding:14px 32px;background:#C0392B;color:#fff;text-decoration:none;border-radius:8px;font-size:15px;font-weight:600">
              Click here to re-submit your request →
            </a>
          </div>

          <p style="font-size:12px;color:#6b6b6b;line-height:1.6;margin-bottom:4px">
            This link will expire in <strong>7 days</strong>. If you need assistance, please contact our support team.
          </p>
          <p style="font-size:12px;color:#b0b0b0;text-align:center;margin-top:20px">
            ShareReg Portal &nbsp;·&nbsp; Shareholder Registry Services
          </p>
        </div>
      </div>
    `,
  });
}

// ── Send Waiting Closed Email ─────────────────────────────────────────────────
async function sendWaitingClosedEmail(
  toEmail,
  shareholderName,
  referenceNumber,
  reopenUrl,
) {
  await client.transactionalEmails.sendTransacEmail({
    subject: `Important Update on Your Request — ${referenceNumber}`,
    sender: {
      name: process.env.SMTP_FROM_NAME || "ShareReg Portal",
      email: process.env.BREVO_SENDER_EMAIL,
    },
    to: [{ email: toEmail, name: shareholderName }],
    htmlContent: `
      <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;padding:24px">
        <div style="background:#1a1a1a;padding:20px 24px;border-radius:8px 8px 0 0">
          <h2 style="color:#fff;margin:0;font-size:18px">ShareReg Portal</h2>
          <p style="color:rgba(255,255,255,0.6);margin:4px 0 0;font-size:13px">Request Status Update</p>
        </div>
        <div style="background:#fff;border:1px solid #e8e8e8;border-top:none;padding:24px;border-radius:0 0 8px 8px">
          <p style="font-size:15px;color:#1a1a1a;margin-bottom:8px">Dear ${shareholderName},</p>
          <p style="font-size:14px;color:#6b6b6b;line-height:1.6;margin-bottom:20px">
            We are writing to inform you that your request with reference number
            <strong style="color:#1a1a1a;font-family:monospace">${referenceNumber}</strong>
            has been temporarily closed as we have not received a response to our previous correspondence.
          </p>
          <div style="background:#fff8e6;border:1px solid #f5d78e;border-radius:8px;padding:16px;margin-bottom:20px">
            <p style="font-size:14px;color:#b36a00;line-height:1.6;margin:0">
              <strong>Please note:</strong> Your request has not been cancelled. You can easily reopen it
              by clicking the button below to provide your updated information.
              We look forward to continuing to assist you.
            </p>
          </div>
          <div style="text-align:center;margin-bottom:24px">
            <a href="${reopenUrl}" style="display:inline-block;padding:14px 32px;background:#C0392B;color:#fff;text-decoration:none;border-radius:8px;font-size:15px;font-weight:600">
              Click here to reopen your request →
            </a>
          </div>
          <p style="font-size:12px;color:#6b6b6b;line-height:1.6;margin-bottom:4px">
            If you no longer wish to proceed with this request, no further action is required.
            Should you need any assistance, please do not hesitate to contact our support team.
          </p>
          <hr style="border:none;border-top:1px solid #f0f0f0;margin:20px 0"/>
          <p style="font-size:12px;color:#b0b0b0;text-align:center">
            ShareReg Portal &nbsp;·&nbsp; Shareholder Registry Services
          </p>
        </div>
      </div>
    `,
  });
}

module.exports = {
  sendOTPEmail,
  sendStatusUpdateEmail,
  sendAgentWelcomeEmail,
  sendPasswordResetEmail,
  sendFlaggedEmail,
  sendWaitingClosedEmail,
};
