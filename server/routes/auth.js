const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const router = express.Router();
const { supabase } = require("../utils/supabase");
const { sendAgentWelcomeEmail } = require("../utils/mailer");
const {
  sendAgentWelcomeEmail,
  sendPasswordResetEmail,
} = require("../utils/mailer");

require("dotenv").config();

// ── POST /api/auth/login ──────────────────────────────────────────────────────
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }

  try {
    // Find agent by email
    const { data: agent, error } = await supabase
      .from("agents")
      .select("*")
      .eq("email", email.toLowerCase())
      .single();

    if (error || !agent) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    // Check if agent is active
    if (!agent.is_active) {
      return res.status(401).json({
        error: "Your account has been deactivated. Contact your administrator.",
      });
    }

    // Verify password
    const validPassword = await bcrypt.compare(password, agent.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        id: agent.id,
        email: agent.email,
        role: agent.role,
        fullName: agent.full_name,
      },
      process.env.JWT_SECRET,
      { expiresIn: "8h" },
    );

    res.json({
      success: true,
      token,
      agent: {
        id: agent.id,
        fullName: agent.full_name,
        email: agent.email,
        role: agent.role,
        mustChangePassword: agent.must_change_password || false,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Login failed. Please try again." });
  }
});

// ── POST /api/auth/create-agent ───────────────────────────────────────────────
// Only admins and supervisors can create agents
router.post("/create-agent", async (req, res) => {
  const { fullName, email, password, role } = req.body;

  if (!fullName || !email || !password || !role) {
    return res.status(400).json({ error: "All fields are required." });
  }

  if (!["admin", "supervisor", "agent"].includes(role)) {
    return res.status(400).json({ error: "Invalid role." });
  }

  try {
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Insert agent
    const { data, error } = await supabase
      .from("agents")
      .insert([
        {
          full_name: fullName,
          email: email.toLowerCase(),
          password_hash: passwordHash,
          role,
          must_change_password: true,
        },
      ])
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        return res
          .status(400)
          .json({ error: "An agent with this email already exists." });
      }
      throw error;
    }

    // Send welcome email
    try {
      await sendAgentWelcomeEmail(
        data.email,
        data.full_name,
        data.role,
        password,
      );
    } catch (emailErr) {
      console.error("Welcome email failed:", emailErr.message);
    }

    res.json({
      success: true,
      agent: {
        id: data.id,
        fullName: data.full_name,
        email: data.email,
        role: data.role,
      },
    });
  } catch (err) {
    console.error("Create agent error:", err);
    res
      .status(500)
      .json({ error: "Failed to create agent. Please try again." });
  }
});

// ── POST /api/auth/change-password ────────────────────────────────────────────
router.post("/change-password", async (req, res) => {
  const { agentId, currentPassword, newPassword } = req.body;

  if (!agentId || !currentPassword || !newPassword) {
    return res.status(400).json({ error: "All fields are required." });
  }

  try {
    // Get agent
    const { data: agent, error } = await supabase
      .from("agents")
      .select("*")
      .eq("id", agentId)
      .single();

    if (error || !agent) {
      return res.status(404).json({ error: "Agent not found." });
    }

    // Verify current password
    const validPassword = await bcrypt.compare(
      currentPassword,
      agent.password_hash,
    );
    if (!validPassword) {
      return res.status(401).json({ error: "Current password is incorrect." });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    // Update password
    // Clear must_change_password flag
    await supabase
      .from("agents")
      .update({ must_change_password: false })
      .eq("id", agentId);

    res.json({ success: true, message: "Password changed successfully." });
  } catch (err) {
    console.error("Change password error:", err);
    res
      .status(500)
      .json({ error: "Failed to change password. Please try again." });
  }
});

// ── POST /api/auth/forgot-password ───────────────────────────────────────────
router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Email is required." });

  try {
    const { data: agent } = await supabase
      .from("agents")
      .select("id, full_name, email")
      .eq("email", email.toLowerCase())
      .single();

    // Always return success to prevent email enumeration
    if (!agent) {
      return res.json({
        success: true,
        message: "If this email exists, a reset link has been sent.",
      });
    }

    // Generate reset token
    const crypto = require("crypto");
    const resetToken = crypto.randomBytes(32).toString("hex");
    const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Save token to DB
    await supabase
      .from("agents")
      .update({
        reset_token: resetToken,
        reset_token_expiry: expiry.toISOString(),
      })
      .eq("id", agent.id);

    // Send reset email
    const resetUrl = `${process.env.FRONTEND_URL}/admin/reset-password?token=${resetToken}`;
    await sendPasswordResetEmail(agent.email, agent.full_name, resetUrl);

    res.json({
      success: true,
      message: "If this email exists, a reset link has been sent.",
    });
  } catch (err) {
    console.error("Forgot password error:", err);
    res
      .status(500)
      .json({ error: "Failed to send reset email. Please try again." });
  }
});

// ── POST /api/auth/reset-password ────────────────────────────────────────────
router.post("/reset-password", async (req, res) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    return res
      .status(400)
      .json({ error: "Token and new password are required." });
  }

  if (newPassword.length < 8) {
    return res
      .status(400)
      .json({ error: "Password must be at least 8 characters." });
  }

  try {
    // Find agent by token
    const { data: agent } = await supabase
      .from("agents")
      .select("id, full_name, reset_token_expiry")
      .eq("reset_token", token)
      .single();

    if (!agent) {
      return res.status(400).json({ error: "Invalid or expired reset link." });
    }

    // Check expiry
    if (new Date() > new Date(agent.reset_token_expiry)) {
      return res.status(400).json({
        error: "This reset link has expired. Please request a new one.",
      });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    // Update password and clear token
    await supabase
      .from("agents")
      .update({
        password_hash: passwordHash,
        reset_token: null,
        reset_token_expiry: null,
        must_change_password: false,
      })
      .eq("id", agent.id);

    res.json({
      success: true,
      message: "Password reset successfully. You can now log in.",
    });
  } catch (err) {
    console.error("Reset password error:", err);
    res
      .status(500)
      .json({ error: "Failed to reset password. Please try again." });
  }
});

module.exports = router;
