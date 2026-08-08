const express = require("express");
const router = express.Router();
const { sendOTPEmail } = require("../utils/mailer");

// In-memory OTP store
// In production, replace with Redis or a database
const otpStore = {};

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// ── POST /api/otp/send ────────────────────────────────────────────────────────
router.post("/send", async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: "Email address is required." });
  }

  try {
    const otp = generateOTP();
    const expires = Date.now() + 10 * 60 * 1000; // 10 minutes

    // Store OTP against email
    otpStore[email.toLowerCase()] = { otp, expires, attempts: 0 };

    // Send email
    await sendOTPEmail(email, otp);

    console.log(`OTP sent to ${email}`);

    res.json({ success: true, message: "OTP sent successfully." });
  } catch (err) {
    console.error("Error sending OTP:", err);
    res.status(500).json({ error: "Failed to send OTP. Please try again." });
  }
});

// ── POST /api/otp/verify ──────────────────────────────────────────────────────
router.post("/verify", (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ error: "Email and OTP are required." });
  }

  const record = otpStore[email.toLowerCase()];

  // OTP not found
  if (!record) {
    return res.status(400).json({
      error: "No OTP was sent to this email. Please request a new code.",
    });
  }

  // OTP expired
  if (Date.now() > record.expires) {
    delete otpStore[email.toLowerCase()];
    return res
      .status(400)
      .json({ error: "This code has expired. Please request a new one." });
  }

  // Too many attempts
  if (record.attempts >= 3) {
    delete otpStore[email.toLowerCase()];
    return res.status(400).json({
      error: "Too many incorrect attempts. Please request a new code.",
    });
  }

  // Wrong OTP
  if (record.otp !== otp) {
    otpStore[email.toLowerCase()].attempts += 1;
    return res.status(400).json({ error: "Incorrect code. Please try again." });
  }

  // Success — clear OTP
  delete otpStore[email.toLowerCase()];
  res.json({ success: true, verified: true });
});

module.exports = router;
