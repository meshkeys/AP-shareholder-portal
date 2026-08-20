const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const { supabase } = require("../utils/supabase");
const authenticate = require("../middleware/authenticate");
const {
  getSLASettings,
  getSLAStatus,
  getScoreFeedback,
  getPeriodDates,
  updateAgentPerformance,
} = require("../utils/sla");

// ── GET /api/agents ───────────────────────────────────────────────────────────
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
router.get("/workload", authenticate, async (req, res) => {
  const { role } = req.agent;
  if (!["admin", "supervisor"].includes(role)) {
    return res.status(403).json({ error: "Access denied." });
  }
  try {
    const { data: agents, error: agentsError } = await supabase
      .from("agents")
      .select("id, full_name, email, role")
      .eq("is_active", true)
      .eq("role", "agent");

    if (agentsError) throw agentsError;

    const { data: requests, error: requestsError } = await supabase
      .from("requests")
      .select("assigned_to, status, sla_resolve_breached")
      .not("assigned_to", "is", null);

    if (requestsError) throw requestsError;

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
        slaBreached: agentRequests.filter((r) => r.sla_resolve_breached).length,
      };
    });

    res.json({ success: true, workload });
  } catch (err) {
    console.error("Workload error:", err);
    res.status(500).json({ error: "Failed to fetch workload." });
  }
});

// ── GET /api/agents/performance/me ───────────────────────────────────────────
// Get current agent's own performance
router.get("/performance/me", authenticate, async (req, res) => {
  const { id: agentId } = req.agent;
  const { startDate, endDate } = req.query;

  try {
    const settings = await getSLASettings();

    // Update performance first
    await updateAgentPerformance(agentId, settings);

    // Get all period performances
    const { data: performances, error } = await supabase
      .from("agent_performance")
      .select("*")
      .eq("agent_id", agentId)
      .order("period_type");

    if (error) throw error;

    // Get open tickets with SLA status
    const { data: openTickets } = await supabase
      .from("requests")
      .select("*")
      .eq("assigned_to", agentId)
      .in("status", ["assigned", "in_progress"])
      .order("submitted_at", { ascending: true });

    const ticketsWithSLA = (openTickets || []).map((t) => ({
      ...t,
      sla: getSLAStatus(t, settings),
    }));

    // Build performance by period
    const byPeriod = {};
    for (const perf of performances || []) {
      const feedback = getScoreFeedback(perf.score, {
        ticketsAssigned: perf.tickets_assigned,
        ticketsResolved: perf.tickets_resolved,
        slametCount: perf.sla_met_count,
        slaBreachedCount: perf.sla_breached_count,
        avgResponseHours: perf.avg_response_hours,
        targetResponseHours: settings.responseHours,
      });
      byPeriod[perf.period_type] = { ...perf, feedback };
    }

    res.json({
      success: true,
      performance: byPeriod,
      openTickets: ticketsWithSLA,
      slaSettings: settings,
    });
  } catch (err) {
    console.error("Performance error:", err);
    res.status(500).json({ error: "Failed to fetch performance." });
  }
});

// ── GET /api/agents/performance/team ─────────────────────────────────────────
// Get team performance — supervisors and admins only
router.get("/performance/team", authenticate, async (req, res) => {
  const { role } = req.agent;
  const { periodType = "weekly" } = req.query;

  if (!["admin", "supervisor"].includes(role)) {
    return res.status(403).json({ error: "Access denied." });
  }

  try {
    const settings = await getSLASettings();
    const { start, end } = getPeriodDates(periodType);

    // Get all agents
    const { data: agents } = await supabase
      .from("agents")
      .select("id, full_name, email, role, is_active")
      .eq("role", "agent")
      .eq("is_active", true);

    // Get performance for each agent
    const teamPerformance = await Promise.all(
      (agents || []).map(async (agent) => {
        await updateAgentPerformance(agent.id, settings);

        const { data: perf } = await supabase
          .from("agent_performance")
          .select("*")
          .eq("agent_id", agent.id)
          .eq("period_type", periodType)
          .gte("period_start", start)
          .single();

        const feedback = perf
          ? getScoreFeedback(perf.score, {
              ticketsAssigned: perf.tickets_assigned,
              ticketsResolved: perf.tickets_resolved,
              slametCount: perf.sla_met_count,
              slaBreachedCount: perf.sla_breached_count,
              avgResponseHours: perf.avg_response_hours,
              targetResponseHours: settings.responseHours,
            })
          : null;

        return {
          agent,
          performance: perf || null,
          feedback,
        };
      }),
    );

    // Sort by score descending
    teamPerformance.sort(
      (a, b) => (b.performance?.score || 0) - (a.performance?.score || 0),
    );

    res.json({
      success: true,
      team: teamPerformance,
      period: { type: periodType, start, end },
      slaSettings: settings,
    });
  } catch (err) {
    console.error("Team performance error:", err);
    res.status(500).json({ error: "Failed to fetch team performance." });
  }
});

// ── GET /api/agents/reports ───────────────────────────────────────────────────
// Reports data for admin/supervisor
router.get("/reports", authenticate, async (req, res) => {
  const { role } = req.agent;
  const { startDate, endDate, agentId, requestType } = req.query;

  if (!["admin", "supervisor"].includes(role)) {
    return res.status(403).json({ error: "Access denied." });
  }

  try {
    let query = supabase
      .from("requests")
      .select("*, agents!requests_assigned_to_fkey(id, full_name)");

    if (startDate) query = query.gte("submitted_at", startDate);
    if (endDate) query = query.lte("submitted_at", endDate + "T23:59:59Z");
    if (agentId) query = query.eq("assigned_to", agentId);
    if (requestType) query = query.eq("request_type", requestType);

    const { data: requests, error } = await query;
    if (error) throw error;

    // Build report data
    const total = requests.length;
    const completed = requests.filter((r) => r.status === "completed").length;
    const rejected = requests.filter((r) => r.status === "rejected").length;
    const pending = requests.filter((r) => r.status === "pending").length;
    const inProgress = requests.filter(
      (r) => r.status === "in_progress",
    ).length;
    const assigned = requests.filter((r) => r.status === "assigned").length;
    const slaBreached = requests.filter((r) => r.sla_resolve_breached).length;

    // By type
    const byType = {};
    requests.forEach((r) => {
      byType[r.request_type] = (byType[r.request_type] || 0) + 1;
    });

    // By day — for line chart
    const byDay = {};
    requests.forEach((r) => {
      const day = r.submitted_at?.slice(0, 10);
      if (day) byDay[day] = (byDay[day] || 0) + 1;
    });

    // By agent
    const byAgent = {};
    requests.forEach((r) => {
      if (r.agents?.full_name) {
        if (!byAgent[r.agents.full_name]) {
          byAgent[r.agents.full_name] = {
            total: 0,
            completed: 0,
            slaBreached: 0,
          };
        }
        byAgent[r.agents.full_name].total++;
        if (r.status === "completed") byAgent[r.agents.full_name].completed++;
        if (r.sla_resolve_breached) byAgent[r.agents.full_name].slaBreached++;
      }
    });

    // Avg resolution time
    const resolvedRequests = requests.filter(
      (r) => r.resolved_at && r.submitted_at,
    );
    const avgResolutionHours =
      resolvedRequests.length > 0
        ? resolvedRequests.reduce((sum, r) => {
            const diff = new Date(r.resolved_at) - new Date(r.submitted_at);
            return sum + diff / (1000 * 60 * 60);
          }, 0) / resolvedRequests.length
        : 0;

    res.json({
      success: true,
      report: {
        summary: {
          total,
          completed,
          rejected,
          pending,
          inProgress,
          assigned,
          slaBreached,
        },
        slaComplianceRate:
          total > 0 ? Math.round(((total - slaBreached) / total) * 100) : 100,
        avgResolutionHours: Math.round(avgResolutionHours * 10) / 10,
        byType,
        byDay: Object.entries(byDay)
          .map(([date, count]) => ({ date, count }))
          .sort((a, b) => a.date.localeCompare(b.date)),
        byAgent: Object.entries(byAgent).map(([name, data]) => ({
          name,
          ...data,
        })),
      },
    });
  } catch (err) {
    console.error("Reports error:", err);
    res.status(500).json({ error: "Failed to generate report." });
  }
});

// ── GET /api/agents/settings/system ──────────────────────────────────────────
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
router.patch("/settings/system", authenticate, async (req, res) => {
  const {
    emailNotifications,
    slaAssignHours,
    slaResponseHours,
    slaResolveHours,
  } = req.body;
  const { role, id: agentId } = req.agent;
  if (role !== "admin") {
    return res
      .status(403)
      .json({ error: "Only admins can update system settings." });
  }
  try {
    const updateData = { updated_by: agentId };
    if (emailNotifications !== undefined)
      updateData.email_notifications = emailNotifications;
    if (slaAssignHours !== undefined)
      updateData.sla_assign_hours = slaAssignHours;
    if (slaResponseHours !== undefined)
      updateData.sla_response_hours = slaResponseHours;
    if (slaResolveHours !== undefined)
      updateData.sla_resolve_hours = slaResolveHours;

    const { data: settings } = await supabase
      .from("system_settings")
      .select("id")
      .single();
    const { data, error } = await supabase
      .from("system_settings")
      .update(updateData)
      .eq("id", settings.id)
      .select()
      .single();
    if (error) throw error;
    res.json({ success: true, settings: data });
  } catch (err) {
    console.error("Update settings error:", err);
    res.status(500).json({ error: "Failed to update settings." });
  }
});

// ── GET /api/agents/:id ───────────────────────────────────────────────────────
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
    if (error || !data)
      return res.status(404).json({ error: "Agent not found." });
    res.json({ success: true, agent: data });
  } catch (err) {
    console.error("Get agent error:", err);
    res.status(500).json({ error: "Failed to fetch agent." });
  }
});

// ── PATCH /api/agents/:id ─────────────────────────────────────────────────────
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
router.patch("/:id/reset-password", authenticate, async (req, res) => {
  const { id } = req.params;
  const { newPassword } = req.body;
  const { role: agentRole } = req.agent;
  if (agentRole !== "admin") {
    return res.status(403).json({ error: "Only admins can reset passwords." });
  }
  if (!newPassword)
    return res.status(400).json({ error: "New password is required." });
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

// ── DELETE /api/agents/:id/delete ─────────────────────────────────────────────
// Permanently delete agent — admins only
router.delete("/:id/delete", authenticate, async (req, res) => {
  const { id } = req.params;
  const { role: agentRole, id: currentAgentId } = req.agent;

  if (agentRole !== "admin") {
    return res.status(403).json({ error: "Only admins can delete agents." });
  }

  if (id === currentAgentId) {
    return res
      .status(400)
      .json({ error: "You cannot delete your own account." });
  }

  try {
    const { error } = await supabase.from("agents").delete().eq("id", id);

    if (error) throw error;

    res.json({ success: true, message: "Agent permanently deleted." });
  } catch (err) {
    console.error("Delete agent error:", err);
    res.status(500).json({ error: "Failed to delete agent." });
  }
});

module.exports = router;
