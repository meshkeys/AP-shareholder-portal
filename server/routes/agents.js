const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const { supabase } = require("../utils/supabase");
const authenticate = require("../middleware/authenticate");

// ── GET /api/agents ───────────────────────────────────────────────────────────
// Get all agents — supervisors and admins only
router.get("/", authenticate, async (req, res) => {
  const { role } = req.agent;

  if (!["admin", "supervisor"].includes(role)) {
    return res.status(403).json({ error: "Access denied." });
  }

  try {
    const { data, error } = await supabase
      .from("agents")
      .select("id, full_name, email, role, is_active, created_at")
      .order("created_at", { ascending: false });

    if (error) throw error;

    res.json({ success: true, agents: data });
  } catch (err) {
    console.error("Get agents error:", err);
    res.status(500).json({ error: "Failed to fetch agents." });
  }
});

// ── GET /api/agents/workload ──────────────────────────────────────────────────
// Get agent workload summary — supervisors and admins only
router.get("/workload", authenticate, async (req, res) => {
  const { role } = req.agent;

  if (!["admin", "supervisor"].includes(role)) {
    return res.status(403).json({ error: "Access denied." });
  }

  try {
    // Get all active agents
    const { data: agents, error: agentsError } = await supabase
      .from("agents")
      .select("id, full_name, email, role")
      .eq("is_active", true)
      .eq("role", "agent");

    if (agentsError) throw agentsError;

    // Get request counts per agent
    const { data: requests, error: requestsError } = await supabase
      .from("requests")
      .select("assigned_to, status")
      .not("assigned_to", "is", null);

    if (requestsError) throw requestsError;

    // Build workload summary
    const workload = agents.map((agent) => {
      const agentRequests = requests.filter((r) => r.assigned_to === agent.id);
      return {
        agent,
        total: agentRequests.length,
        assigned: agentRequests.filter((r) => r.status === "assigned").length,
        inProgress: agentRequests.filter((r) => r.status === "in_progress")
          .length,
        completed: agentRequests.filter((r) => r.status === "completed").length,
        rejected: agentRequests.filter((r) => r.status === "rejected").length,
      };
    });

    res.json({ success: true, workload });
  } catch (err) {
    console.error("Workload error:", err);
    res.status(500).json({ error: "Failed to fetch workload." });
  }
});

// ── GET /api/agents/:id ───────────────────────────────────────────────────────
// Get single agent
router.get("/:id", authenticate, async (req, res) => {
  const { id } = req.params;
  const { role } = req.agent;

  if (!["admin", "supervisor"].includes(role)) {
    return res.status(403).json({ error: "Access denied." });
  }

  try {
    const { data, error } = await supabase
      .from("agents")
      .select("id, full_name, email, role, is_active, created_at")
      .eq("id", id)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: "Agent not found." });
    }

    res.json({ success: true, agent: data });
  } catch (err) {
    console.error("Get agent error:", err);
    res.status(500).json({ error: "Failed to fetch agent." });
  }
});

// ── PATCH /api/agents/:id ─────────────────────────────────────────────────────
// Update agent details — admins only
router.patch("/:id", authenticate, async (req, res) => {
  const { id } = req.params;
  const { fullName, role, isActive } = req.body;
  const { role: agentRole } = req.agent;

  if (agentRole !== "admin") {
    return res
      .status(403)
      .json({ error: "Only admins can update agent details." });
  }

  try {
    const updateData = {};
    if (fullName !== undefined) updateData.full_name = fullName;
    if (role !== undefined) updateData.role = role;
    if (isActive !== undefined) updateData.is_active = isActive;

    const { data, error } = await supabase
      .from("agents")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, agent: data });
  } catch (err) {
    console.error("Update agent error:", err);
    res.status(500).json({ error: "Failed to update agent." });
  }
});

// ── PATCH /api/agents/:id/reset-password ─────────────────────────────────────
// Reset agent password — admins only
router.patch("/:id/reset-password", authenticate, async (req, res) => {
  const { id } = req.params;
  const { newPassword } = req.body;
  const { role: agentRole } = req.agent;

  if (agentRole !== "admin") {
    return res.status(403).json({ error: "Only admins can reset passwords." });
  }

  if (!newPassword) {
    return res.status(400).json({ error: "New password is required." });
  }

  try {
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    await supabase
      .from("agents")
      .update({ password_hash: passwordHash })
      .eq("id", id);

    res.json({ success: true, message: "Password reset successfully." });
  } catch (err) {
    console.error("Reset password error:", err);
    res.status(500).json({ error: "Failed to reset password." });
  }
});

// ── DELETE /api/agents/:id ────────────────────────────────────────────────────
// Deactivate agent — admins only (we never hard delete)
router.delete("/:id", authenticate, async (req, res) => {
  const { id } = req.params;
  const { role: agentRole } = req.agent;

  if (agentRole !== "admin") {
    return res
      .status(403)
      .json({ error: "Only admins can deactivate agents." });
  }

  try {
    await supabase.from("agents").update({ is_active: false }).eq("id", id);

    res.json({ success: true, message: "Agent deactivated successfully." });
  } catch (err) {
    console.error("Deactivate agent error:", err);
    res.status(500).json({ error: "Failed to deactivate agent." });
  }
});

// ── GET /api/agents/settings/system ──────────────────────────────────────────
// Get system settings — admins only
router.get("/settings/system", authenticate, async (req, res) => {
  const { role } = req.agent;

  if (role !== "admin") {
    return res
      .status(403)
      .json({ error: "Only admins can view system settings." });
  }

  try {
    const { data, error } = await supabase
      .from("system_settings")
      .select("*")
      .single();

    if (error) throw error;

    res.json({ success: true, settings: data });
  } catch (err) {
    console.error("Get settings error:", err);
    res.status(500).json({ error: "Failed to fetch settings." });
  }
});

// ── PATCH /api/agents/settings/system ────────────────────────────────────────
// Update system settings — admins only
router.patch("/settings/system", authenticate, async (req, res) => {
  const { emailNotifications } = req.body;
  const { role, id: agentId } = req.agent;

  if (role !== "admin") {
    return res
      .status(403)
      .json({ error: "Only admins can update system settings." });
  }

  try {
    const { data, error } = await supabase
      .from("system_settings")
      .update({
        email_notifications: emailNotifications,
        updated_by: agentId,
      })
      .eq(
        "id",
        (await supabase.from("system_settings").select("id").single()).data.id,
      )
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, settings: data });
  } catch (err) {
    console.error("Update settings error:", err);
    res.status(500).json({ error: "Failed to update settings." });
  }
});

module.exports = router;
