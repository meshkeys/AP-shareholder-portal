const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const router = express.Router();
const { supabase } = require("../utils/supabase");
const { sendAgentWelcomeEmail } = require("../utils/mailer");

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

module.exports = router;
