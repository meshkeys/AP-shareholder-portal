const express = require("express");
const router = express.Router();
const { supabase } = require("../utils/supabase");
const authenticate = require("../middleware/authenticate");
const {
  runAutoAssign,
  getAutoAssignSettings,
  ensureAgentAutoAssignRecord,
} = require("../utils/autoAssign");

// ── GET /api/auto-assign/settings ─────────────────────────────────────────────
router.get("/settings", authenticate, async (req, res) => {
  const { role } = req.agent;
  if (!["admin", "lead_supervisor", "supervisor"].includes(role)) {
    return res.status(403).json({ error: "Access denied." });
  }
  try {
    const settings = await getAutoAssignSettings();
    res.json({ success: true, settings });
  } catch (err) {
    console.error("Get auto-assign settings error:", err);
    res.status(500).json({ error: "Failed to fetch settings." });
  }
});

// ── PATCH /api/auto-assign/settings ──────────────────────────────────────────
router.patch("/settings", authenticate, async (req, res) => {
  const { role } = req.agent;
  if (!["admin", "lead_supervisor", "supervisor"].includes(role)) {
    return res.status(403).json({ error: "Access denied." });
  }

  const {
    isActive,
    ticketsPerAgent,
    scheduleType,
    scheduleTime,
    scheduleValue,
  } = req.body;

  try {
    const { data: current } = await supabase
      .from("auto_assign_settings")
      .select("id")
      .single();

    const updateData = { updated_at: new Date().toISOString() };
    if (isActive !== undefined) updateData.is_active = isActive;
    if (ticketsPerAgent !== undefined)
      updateData.tickets_per_agent = ticketsPerAgent;
    if (scheduleType !== undefined) updateData.schedule_type = scheduleType;
    if (scheduleTime !== undefined) updateData.schedule_time = scheduleTime;
    if (scheduleValue !== undefined) updateData.schedule_value = scheduleValue;

    const { data, error } = await supabase
      .from("auto_assign_settings")
      .update(updateData)
      .eq("id", current.id)
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, settings: data });
  } catch (err) {
    console.error("Update auto-assign settings error:", err);
    res.status(500).json({ error: "Failed to update settings." });
  }
});

// ── GET /api/auto-assign/agents ───────────────────────────────────────────────
router.get("/agents", authenticate, async (req, res) => {
  const { role } = req.agent;
  if (!["admin", "lead_supervisor", "supervisor"].includes(role)) {
    return res.status(403).json({ error: "Access denied." });
  }

  try {
    // Get all active agents
    const { data: agents, error: agentsError } = await supabase
      .from("agents")
      .select("id, full_name, email, role, is_active")
      .eq("role", "agent")
      .eq("is_active", true)
      .order("full_name");

    if (agentsError) throw agentsError;

    // Ensure all agents have auto-assign records
    for (const agent of agents) {
      await ensureAgentAutoAssignRecord(agent.id);
    }

    // Get auto-assign config for each agent
    const { data: configs, error: configsError } = await supabase
      .from("auto_assign_agents")
      .select("*")
      .in(
        "agent_id",
        agents.map((a) => a.id),
      );

    if (configsError) throw configsError;

    // Merge agent data with config
    const agentsWithConfig = agents.map((agent) => {
      const config = configs.find((c) => c.agent_id === agent.id);
      return {
        ...agent,
        autoAssign: {
          id: config?.id,
          isEnabled: config?.is_enabled || false,
          requestTypes: config?.request_types || [],
        },
      };
    });

    res.json({ success: true, agents: agentsWithConfig });
  } catch (err) {
    console.error("Get auto-assign agents error:", err);
    res.status(500).json({ error: "Failed to fetch agents." });
  }
});

// ── PATCH /api/auto-assign/agents/:agentId ────────────────────────────────────
router.patch("/agents/:agentId", authenticate, async (req, res) => {
  const { role } = req.agent;
  const { agentId } = req.params;
  const { isEnabled, requestTypes } = req.body;

  if (!["admin", "lead_supervisor", "supervisor"].includes(role)) {
    return res.status(403).json({ error: "Access denied." });
  }

  try {
    await ensureAgentAutoAssignRecord(agentId);

    const updateData = { updated_at: new Date().toISOString() };
    if (isEnabled !== undefined) updateData.is_enabled = isEnabled;
    if (requestTypes !== undefined) updateData.request_types = requestTypes;

    const { data, error } = await supabase
      .from("auto_assign_agents")
      .update(updateData)
      .eq("agent_id", agentId)
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, config: data });
  } catch (err) {
    console.error("Update agent auto-assign error:", err);
    res.status(500).json({ error: "Failed to update agent config." });
  }
});

// ── POST /api/auto-assign/run ─────────────────────────────────────────────────
router.post("/run", authenticate, async (req, res) => {
  const { role } = req.agent;
  if (!["admin", "lead_supervisor", "supervisor"].includes(role)) {
    return res.status(403).json({ error: "Access denied." });
  }

  try {
    const result = await runAutoAssign();
    res.json(result);
  } catch (err) {
    console.error("Manual auto-assign run error:", err);
    res.status(500).json({ error: "Failed to run auto-assign." });
  }
});

module.exports = router;
