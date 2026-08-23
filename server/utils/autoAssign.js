/**
 * Auto-assign Engine
 * Automatically assigns pending tickets to agents based on rules
 */

const { supabase } = require("./supabase");

// ── Get auto-assign settings ──────────────────────────────────────────────────
async function getAutoAssignSettings() {
  const { data, error } = await supabase
    .from("auto_assign_settings")
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

// ── Get enabled agents with their ticket type preferences ─────────────────────
async function getEnabledAgents() {
  const { data, error } = await supabase
    .from("auto_assign_agents")
    .select("*, agents(id, full_name, email, is_active)")
    .eq("is_enabled", true);

  if (error) throw error;

  // Filter only active agents
  return (data || []).filter((a) => a.agents?.is_active);
}

// ── Get pending tickets ───────────────────────────────────────────────────────
async function getPendingTickets() {
  const { data, error } = await supabase
    .from("requests")
    .select("id, request_type, submitted_at")
    .eq("status", "pending")
    .order("submitted_at", { ascending: true });

  if (error) throw error;
  return data || [];
}

// ── Distribute tickets equally ────────────────────────────────────────────────
function distributeTickets(tickets, agents, ticketsPerAgent) {
  const assignments = {};
  agents.forEach((a) => {
    assignments[a.agent_id] = [];
  });

  // Filter tickets per agent based on their preferred types
  const agentQueues = {};
  agents.forEach((agent) => {
    const types = agent.request_types || [];
    agentQueues[agent.agent_id] =
      types.length === 0
        ? tickets // if no types selected, accept all
        : tickets.filter((t) => types.includes(t.request_type));
  });

  // Calculate total available tickets across all agents
  const totalAvailable = new Set(
    agents.flatMap((a) => agentQueues[a.agent_id].map((t) => t.id)),
  ).size;

  const totalAgents = agents.length;
  const totalNeeded = totalAgents * ticketsPerAgent;

  let perAgentAllocation = ticketsPerAgent;

  // Not enough tickets — distribute equally or round robin
  if (totalAvailable < totalNeeded) {
    perAgentAllocation = Math.floor(totalAvailable / totalAgents);
  }

  // Track assigned ticket IDs to avoid double assigning
  const assignedIds = new Set();

  // First pass — give each agent their equal allocation
  agents.forEach((agent) => {
    const queue = agentQueues[agent.agent_id].filter(
      (t) => !assignedIds.has(t.id),
    );
    const toAssign = queue.slice(0, perAgentAllocation);
    toAssign.forEach((t) => {
      assignments[agent.agent_id].push(t.id);
      assignedIds.add(t.id);
    });
  });

  // Second pass — round robin remaining tickets if any left
  const remainingTickets = tickets.filter((t) => !assignedIds.has(t.id));
  let agentIndex = 0;

  for (const ticket of remainingTickets) {
    // Find next agent that accepts this ticket type
    let attempts = 0;
    while (attempts < totalAgents) {
      const agent = agents[agentIndex % totalAgents];
      const types = agent.request_types || [];
      const accepts = types.length === 0 || types.includes(ticket.request_type);

      if (accepts) {
        assignments[agent.agent_id].push(ticket.id);
        assignedIds.add(ticket.id);
        agentIndex++;
        break;
      }
      agentIndex++;
      attempts++;
    }

    // Stop if all agents have been tried
    if (attempts >= totalAgents) break;
  }

  return assignments;
}

// ── Run auto-assign ───────────────────────────────────────────────────────────
async function runAutoAssign() {
  console.log(`[${new Date().toISOString()}] Running auto-assign...`);

  try {
    const settings = await getAutoAssignSettings();

    if (!settings.is_active) {
      console.log("Auto-assign is disabled. Skipping.");
      return {
        success: true,
        assigned: 0,
        message: "Auto-assign is disabled.",
      };
    }

    const [agents, pendingTickets] = await Promise.all([
      getEnabledAgents(),
      getPendingTickets(),
    ]);

    if (!agents.length) {
      console.log("No enabled agents for auto-assign.");
      return { success: true, assigned: 0, message: "No enabled agents." };
    }

    if (!pendingTickets.length) {
      console.log("No pending tickets to assign.");
      return { success: true, assigned: 0, message: "No pending tickets." };
    }

    // Distribute tickets
    const assignments = distributeTickets(
      pendingTickets,
      agents,
      settings.tickets_per_agent,
    );

    // Apply assignments to database
    let totalAssigned = 0;
    const now = new Date().toISOString();

    for (const [agentId, ticketIds] of Object.entries(assignments)) {
      if (!ticketIds.length) continue;

      const agent = agents.find((a) => a.agent_id === agentId);

      // Update tickets
      const { error } = await supabase
        .from("requests")
        .update({
          assigned_to: agentId,
          status: "assigned",
          assigned_at: now,
        })
        .in("id", ticketIds);

      if (error) {
        console.error(`Failed to assign tickets to agent ${agentId}:`, error);
        continue;
      }

      // Log activity for each ticket
      const activityLogs = ticketIds.map((id) => ({
        request_id: id,
        agent_id: null,
        action: "assigned",
        details: `Auto-assigned to ${agent?.agents?.full_name} by auto-assign engine`,
      }));

      await supabase.from("activity_log").insert(activityLogs);

      totalAssigned += ticketIds.length;
      console.log(
        `Auto-assigned ${ticketIds.length} tickets to ${agent?.agents?.full_name}`,
      );
    }

    // Update last run time
    await supabase
      .from("auto_assign_settings")
      .update({ last_run_at: now })
      .eq("id", settings.id);

    console.log(
      `[${new Date().toISOString()}] Auto-assign complete. ${totalAssigned} tickets assigned.`,
    );
    return {
      success: true,
      assigned: totalAssigned,
      message: `${totalAssigned} tickets assigned successfully.`,
    };
  } catch (err) {
    console.error("Auto-assign error:", err);
    return { success: false, assigned: 0, message: err.message };
  }
}

// ── Start auto-assign scheduler ───────────────────────────────────────────────
function startAutoAssignScheduler() {
  console.log("Auto-assign scheduler started.");

  async function scheduleNext() {
    try {
      const settings = await getAutoAssignSettings();
      if (!settings.is_active) {
        // Check again in 5 minutes if disabled
        setTimeout(scheduleNext, 5 * 60 * 1000);
        return;
      }

      let intervalMs;

      if (settings.schedule_type === "minutely") {
        intervalMs = settings.schedule_value * 60 * 1000;
      } else if (settings.schedule_type === "hourly") {
        intervalMs = settings.schedule_value * 60 * 60 * 1000;
      } else {
        // Daily — calculate ms until next run time
        const [hours, minutes] = (settings.schedule_time || "08:00")
          .split(":")
          .map(Number);
        const now = new Date();
        const next = new Date();
        next.setHours(hours, minutes, 0, 0);
        if (next <= now) next.setDate(next.getDate() + 1);
        intervalMs = next - now;
        console.log(`Next auto-assign scheduled for ${next.toLocaleString()}`);
      }

      setTimeout(async () => {
        await runAutoAssign();
        scheduleNext(); // Schedule the next run
      }, intervalMs);
    } catch (err) {
      console.error("Auto-assign scheduler error:", err);
      setTimeout(scheduleNext, 5 * 60 * 1000); // Retry in 5 minutes
    }
  }

  scheduleNext();
}

// ── Ensure agent has auto-assign record ──────────────────────────────────────
async function ensureAgentAutoAssignRecord(agentId) {
  const { data } = await supabase
    .from("auto_assign_agents")
    .select("id")
    .eq("agent_id", agentId)
    .single();

  if (!data) {
    await supabase
      .from("auto_assign_agents")
      .insert([{ agent_id: agentId, is_enabled: false, request_types: [] }]);
  }
}

module.exports = {
  runAutoAssign,
  startAutoAssignScheduler,
  ensureAgentAutoAssignRecord,
  getAutoAssignSettings,
};
