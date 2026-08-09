const express = require("express");
const router = express.Router();
const { supabase } = require("../utils/supabase");
const authenticate = require("../middleware/authenticate");
const { runEscalationCheck } = require("../utils/escalation");

// ── GET /api/escalations/rules ────────────────────────────────────────────────
// Get all escalation rules
router.get("/rules", authenticate, async (req, res) => {
  const { role } = req.agent;
  if (!["admin", "lead_supervisor"].includes(role)) {
    return res.status(403).json({ error: "Access denied." });
  }
  try {
    const { data, error } = await supabase
      .from("escalation_rules")
      .select("*")
      .order("created_at", { ascending: true });
    if (error) throw error;
    res.json({ success: true, rules: data });
  } catch (err) {
    console.error("Get rules error:", err);
    res.status(500).json({ error: "Failed to fetch escalation rules." });
  }
});

// ── POST /api/escalations/rules ───────────────────────────────────────────────
// Create new escalation rule
router.post("/rules", authenticate, async (req, res) => {
  const { role, id: agentId } = req.agent;
  if (!["admin", "lead_supervisor"].includes(role)) {
    return res.status(403).json({ error: "Access denied." });
  }

  const {
    name,
    triggerType,
    triggerHours,
    secondTriggerHours,
    finalTriggerHours,
    notifySupervisor,
    notifyLeadSupervisor,
    notifyAdmin,
  } = req.body;

  if (!name || !triggerType || !triggerHours) {
    return res
      .status(400)
      .json({ error: "Name, trigger type and trigger hours are required." });
  }

  try {
    const { data, error } = await supabase
      .from("escalation_rules")
      .insert([
        {
          name,
          trigger_type: triggerType,
          trigger_hours: triggerHours,
          second_trigger_hours: secondTriggerHours || null,
          final_trigger_hours: finalTriggerHours || null,
          notify_supervisor: notifySupervisor ?? true,
          notify_lead_supervisor: notifyLeadSupervisor ?? true,
          notify_admin: notifyAdmin ?? true,
          created_by: agentId,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, rule: data });
  } catch (err) {
    console.error("Create rule error:", err);
    res.status(500).json({ error: "Failed to create escalation rule." });
  }
});

// ── PATCH /api/escalations/rules/:id ─────────────────────────────────────────
// Update escalation rule
router.patch("/rules/:id", authenticate, async (req, res) => {
  const { role } = req.agent;
  const { id } = req.params;
  if (!["admin", "lead_supervisor"].includes(role)) {
    return res.status(403).json({ error: "Access denied." });
  }

  const {
    name,
    triggerHours,
    secondTriggerHours,
    finalTriggerHours,
    notifySupervisor,
    notifyLeadSupervisor,
    notifyAdmin,
    isActive,
  } = req.body;

  try {
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (triggerHours !== undefined) updateData.trigger_hours = triggerHours;
    if (secondTriggerHours !== undefined)
      updateData.second_trigger_hours = secondTriggerHours;
    if (finalTriggerHours !== undefined)
      updateData.final_trigger_hours = finalTriggerHours;
    if (notifySupervisor !== undefined)
      updateData.notify_supervisor = notifySupervisor;
    if (notifyLeadSupervisor !== undefined)
      updateData.notify_lead_supervisor = notifyLeadSupervisor;
    if (notifyAdmin !== undefined) updateData.notify_admin = notifyAdmin;
    if (isActive !== undefined) updateData.is_active = isActive;

    const { data, error } = await supabase
      .from("escalation_rules")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, rule: data });
  } catch (err) {
    console.error("Update rule error:", err);
    res.status(500).json({ error: "Failed to update escalation rule." });
  }
});

// ── DELETE /api/escalations/rules/:id ────────────────────────────────────────
// Delete escalation rule
router.delete("/rules/:id", authenticate, async (req, res) => {
  const { role } = req.agent;
  if (role !== "admin") {
    return res
      .status(403)
      .json({ error: "Only admins can delete escalation rules." });
  }
  try {
    await supabase.from("escalation_rules").delete().eq("id", req.params.id);
    res.json({ success: true, message: "Rule deleted successfully." });
  } catch (err) {
    console.error("Delete rule error:", err);
    res.status(500).json({ error: "Failed to delete rule." });
  }
});

// ── GET /api/escalations ──────────────────────────────────────────────────────
// Get all escalation logs
router.get("/", authenticate, async (req, res) => {
  const { role } = req.agent;
  if (!["admin", "lead_supervisor", "supervisor"].includes(role)) {
    return res.status(403).json({ error: "Access denied." });
  }
  try {
    const { data, error } = await supabase
      .from("escalations")
      .select(
        `
        *,
        requests (
          id,
          reference_number,
          shareholder_name,
          request_type,
          status
        ),
        escalation_rules (
          name,
          trigger_type
        )
      `,
      )
      .order("triggered_at", { ascending: false })
      .limit(100);

    if (error) throw error;
    res.json({ success: true, escalations: data });
  } catch (err) {
    console.error("Get escalations error:", err);
    res.status(500).json({ error: "Failed to fetch escalations." });
  }
});

// ── GET /api/escalations/active ──────────────────────────────────────────────
// Get active (unresolved) escalations
router.get("/active", authenticate, async (req, res) => {
  const { role } = req.agent;
  if (!["admin", "lead_supervisor", "supervisor"].includes(role)) {
    return res.status(403).json({ error: "Access denied." });
  }
  try {
    const { data, error } = await supabase
      .from("escalations")
      .select(
        `
        *,
        requests (
          id,
          reference_number,
          shareholder_name,
          request_type,
          status,
          assigned_to,
          submitted_at
        ),
        escalation_rules (
          name,
          trigger_type
        )
      `,
      )
      .eq("is_resolved", false)
      .order("escalation_level", { ascending: false })
      .order("triggered_at", { ascending: true });

    if (error) throw error;
    res.json({ success: true, escalations: data });
  } catch (err) {
    console.error("Get active escalations error:", err);
    res.status(500).json({ error: "Failed to fetch active escalations." });
  }
});

// ── PATCH /api/escalations/:id/resolve ───────────────────────────────────────
// Mark escalation as resolved
router.patch("/:id/resolve", authenticate, async (req, res) => {
  const { id } = req.params;
  const { role } = req.agent;
  if (!["admin", "lead_supervisor", "supervisor"].includes(role)) {
    return res.status(403).json({ error: "Access denied." });
  }
  try {
    const { data, error } = await supabase
      .from("escalations")
      .update({ is_resolved: true, resolved_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, escalation: data });
  } catch (err) {
    console.error("Resolve escalation error:", err);
    res.status(500).json({ error: "Failed to resolve escalation." });
  }
});

// ── POST /api/escalations/run-check ──────────────────────────────────────────
// Manually trigger escalation check — admins only
router.post("/run-check", authenticate, async (req, res) => {
  const { role } = req.agent;
  if (!["admin", "lead_supervisor"].includes(role)) {
    return res.status(403).json({ error: "Access denied." });
  }
  try {
    await runEscalationCheck();
    res.json({ success: true, message: "Escalation check completed." });
  } catch (err) {
    console.error("Manual escalation check error:", err);
    res.status(500).json({ error: "Failed to run escalation check." });
  }
});

module.exports = router;
