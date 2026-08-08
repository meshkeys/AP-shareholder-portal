const express = require("express");
const router = express.Router();
const { supabase } = require("../utils/supabase");
const authenticate = require("../middleware/authenticate");
const { sendStatusUpdateEmail } = require("../utils/mailer");
require("dotenv").config();

// ── POST /api/requests/submit ─────────────────────────────────────────────────
// Called by shareholder portal when submitting a request
router.post("/submit", async (req, res) => {
  const {
    referenceNumber,
    shareholderEmail,
    shareholderName,
    requestType,
    requestSubtype,
    fields,
    documents,
  } = req.body;

  if (!referenceNumber || !shareholderEmail || !requestType) {
    return res.status(400).json({ error: "Missing required fields." });
  }

  try {
    // Save request to database
    const { data: request, error } = await supabase
      .from("requests")
      .insert([
        {
          reference_number: referenceNumber,
          shareholder_email: shareholderEmail,
          shareholder_name: shareholderName,
          request_type: requestType,
          request_subtype: requestSubtype || null,
          status: "pending",
          fields: fields || {},
        },
      ])
      .select()
      .single();

    if (error) throw error;

    // Save documents if any
    if (documents && documents.length > 0) {
      const docRows = documents.map((doc) => ({
        request_id: request.id,
        document_type: doc.type,
        file_name: doc.fileName,
        file_url: doc.fileUrl,
      }));

      const { error: docError } = await supabase
        .from("documents")
        .insert(docRows);

      if (docError) throw docError;
    }

    // Log activity
    await supabase.from("activity_log").insert([
      {
        request_id: request.id,
        agent_id: null,
        action: "request_created",
        details: `Request ${referenceNumber} submitted by ${shareholderEmail}`,
      },
    ]);

    res.json({
      success: true,
      referenceNumber: request.reference_number,
      requestId: request.id,
    });
  } catch (err) {
    console.error("Submit request error:", err);
    res
      .status(500)
      .json({ error: "Failed to submit request. Please try again." });
  }
});

// ── GET /api/requests ─────────────────────────────────────────────────────────
// Get all requests — supervisors see all, agents see only assigned
router.get("/", authenticate, async (req, res) => {
  const { role, id: agentId } = req.agent;
  const { status, type, page = 1, limit = 20 } = req.query;

  try {
    let query = supabase
      .from("requests")
      .select(
        `
        *,
        agents (
          id,
          full_name,
          email
        )
      `,
        { count: "exact" },
      )
      .order("created_at", { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    // Agents only see their assigned requests
    if (role === "agent") {
      query = query.eq("assigned_to", agentId);
    }

    // Filter by status
    if (status) {
      query = query.eq("status", status);
    }

    // Filter by type
    if (type) {
      query = query.eq("request_type", type);
    }

    const { data, error, count } = await query;

    if (error) throw error;

    res.json({
      success: true,
      requests: data,
      total: count,
      page: parseInt(page),
      limit: parseInt(limit),
    });
  } catch (err) {
    console.error("Get requests error:", err);
    res.status(500).json({ error: "Failed to fetch requests." });
  }
});

// ── GET /api/requests/:id ─────────────────────────────────────────────────────
// Get single request with documents and activity log
router.get("/:id", authenticate, async (req, res) => {
  const { id } = req.params;

  try {
    // Get request
    const { data: request, error } = await supabase
      .from("requests")
      .select(
        `
        *,
        agents (
          id,
          full_name,
          email
        )
      `,
      )
      .eq("id", id)
      .single();

    if (error || !request) {
      return res.status(404).json({ error: "Request not found." });
    }

    // Get documents
    const { data: documents } = await supabase
      .from("documents")
      .select("*")
      .eq("request_id", id);

    // Get activity log
    const { data: activity } = await supabase
      .from("activity_log")
      .select(
        `
        *,
        agents (
          id,
          full_name
        )
      `,
      )
      .eq("request_id", id)
      .order("created_at", { ascending: false });

    res.json({
      success: true,
      request,
      documents: documents || [],
      activity: activity || [],
    });
  } catch (err) {
    console.error("Get request error:", err);
    res.status(500).json({ error: "Failed to fetch request." });
  }
});

// ── PATCH /api/requests/:id/assign ───────────────────────────────────────────
// Assign request to an agent — supervisors and admins only
router.patch("/:id/assign", authenticate, async (req, res) => {
  const { id } = req.params;
  const { agentId } = req.body;
  const { role, id: supervisorId, fullName: supervisorName } = req.agent;

  if (!["admin", "supervisor"].includes(role)) {
    return res
      .status(403)
      .json({ error: "Only supervisors and admins can assign requests." });
  }

  try {
    // Get agent name
    const { data: agent } = await supabase
      .from("agents")
      .select("full_name")
      .eq("id", agentId)
      .single();

    // Update request
    const { data: request, error } = await supabase
      .from("requests")
      .update({ assigned_to: agentId, status: "assigned" })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    // Log activity
    await supabase.from("activity_log").insert([
      {
        request_id: id,
        agent_id: supervisorId,
        action: "assigned",
        details: `Assigned to ${agent?.full_name} by ${supervisorName}`,
      },
    ]);

    res.json({ success: true, request });
  } catch (err) {
    console.error("Assign request error:", err);
    res.status(500).json({ error: "Failed to assign request." });
  }
});

// ── PATCH /api/requests/:id/status ───────────────────────────────────────────
// Update request status
router.patch("/:id/status", authenticate, async (req, res) => {
  const { id } = req.params;
  const { status, note, sendEmail, emailMessage } = req.body;
  const { id: agentId, fullName } = req.agent;

  const validStatuses = ["in_progress", "completed", "rejected"];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: "Invalid status." });
  }

  try {
    // Get request
    const { data: request } = await supabase
      .from("requests")
      .select("*")
      .eq("id", id)
      .single();

    // Check system email toggle
    const { data: settings } = await supabase
      .from("system_settings")
      .select("email_notifications")
      .single();

    // Update status
    const updateData = { status };
    if (note) updateData.internal_notes = note;

    const { data: updated, error } = await supabase
      .from("requests")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    // Log activity
    await supabase.from("activity_log").insert([
      {
        request_id: id,
        agent_id: agentId,
        action: "status_changed",
        details: `Status changed to ${status} by ${fullName}${note ? ` — Note: ${note}` : ""}`,
      },
    ]);

    // Send email to shareholder if toggle enabled
    const shouldSendEmail =
      sendEmail && settings?.email_notifications && request?.email_toggle;

    if (shouldSendEmail && emailMessage) {
      await sendStatusUpdateEmail(
        request.shareholder_email,
        request.shareholder_name,
        request.reference_number,
        status,
        emailMessage,
      );

      // Log email sent
      await supabase.from("activity_log").insert([
        {
          request_id: id,
          agent_id: agentId,
          action: "email_sent",
          details: `Status update email sent to ${request.shareholder_email}`,
        },
      ]);
    }

    res.json({ success: true, request: updated });
  } catch (err) {
    console.error("Update status error:", err);
    res.status(500).json({ error: "Failed to update status." });
  }
});

// ── PATCH /api/requests/:id/note ─────────────────────────────────────────────
// Add internal note to request
router.patch("/:id/note", authenticate, async (req, res) => {
  const { id } = req.params;
  const { note } = req.body;
  const { id: agentId, fullName } = req.agent;

  if (!note) {
    return res.status(400).json({ error: "Note is required." });
  }

  try {
    await supabase
      .from("requests")
      .update({ internal_notes: note })
      .eq("id", id);

    await supabase.from("activity_log").insert([
      {
        request_id: id,
        agent_id: agentId,
        action: "note_added",
        details: `Note added by ${fullName}: ${note}`,
      },
    ]);

    res.json({ success: true, message: "Note added successfully." });
  } catch (err) {
    console.error("Add note error:", err);
    res.status(500).json({ error: "Failed to add note." });
  }
});

// ── PATCH /api/requests/:id/email-toggle ─────────────────────────────────────
// Toggle email notifications for a specific request
router.patch("/:id/email-toggle", authenticate, async (req, res) => {
  const { id } = req.params;
  const { emailToggle } = req.body;
  const { id: agentId, fullName } = req.agent;

  try {
    await supabase
      .from("requests")
      .update({ email_toggle: emailToggle })
      .eq("id", id);

    await supabase.from("activity_log").insert([
      {
        request_id: id,
        agent_id: agentId,
        action: "email_toggle_changed",
        details: `Email notifications ${emailToggle ? "enabled" : "disabled"} by ${fullName}`,
      },
    ]);

    res.json({ success: true });
  } catch (err) {
    console.error("Email toggle error:", err);
    res.status(500).json({ error: "Failed to update email toggle." });
  }
});

// ── GET /api/requests/stats/summary ──────────────────────────────────────────
// Get summary stats for dashboard
router.get("/stats/summary", authenticate, async (req, res) => {
  const { role, id: agentId } = req.agent;

  try {
    let query = supabase
      .from("requests")
      .select("status, request_type, assigned_to");

    if (role === "agent") {
      query = query.eq("assigned_to", agentId);
    }

    const { data, error } = await query;
    if (error) throw error;

    const stats = {
      total: data.length,
      pending: data.filter((r) => r.status === "pending").length,
      assigned: data.filter((r) => r.status === "assigned").length,
      inProgress: data.filter((r) => r.status === "in_progress").length,
      completed: data.filter((r) => r.status === "completed").length,
      rejected: data.filter((r) => r.status === "rejected").length,
      byType: {
        nameChange: data.filter((r) => r.request_type === "nameChange").length,
        kycUpdate: data.filter((r) => r.request_type === "kycUpdate").length,
        addressUpdate: data.filter((r) => r.request_type === "addressUpdate")
          .length,
        signatureUpdate: data.filter(
          (r) => r.request_type === "signatureUpdate",
        ).length,
        nubanChange: data.filter((r) => r.request_type === "nubanChange")
          .length,
      },
    };

    res.json({ success: true, stats });
  } catch (err) {
    console.error("Stats error:", err);
    res.status(500).json({ error: "Failed to fetch stats." });
  }
});

module.exports = router;
