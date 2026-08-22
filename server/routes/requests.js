const express = require("express");
const router = express.Router();
const { supabase } = require("../utils/supabase");
const authenticate = require("../middleware/authenticate");
const { sendStatusUpdateEmail } = require("../utils/mailer");
const {
  getSLASettings,
  getSLAStatus,
  updateAgentPerformance,
} = require("../utils/sla");

// ── POST /api/requests/submit ─────────────────────────────────────────────────
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
          submitted_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) throw error;

    if (documents && documents.length > 0) {
      const docRows = documents.map((doc) => ({
        request_id: request.id,
        document_type: doc.type,
        file_name: doc.fileName,
        file_url: doc.fileUrl,
      }));
      await supabase.from("documents").insert(docRows);
    }

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

// ── GET /api/requests/stats/summary ──────────────────────────────────────────
router.get("/stats/summary", authenticate, async (req, res) => {
  const { role, id: agentId } = req.agent;

  try {
    let query = supabase
      .from("requests")
      .select("*, agents!requests_assigned_to_fkey(id, full_name, email)", {
        count: "exact",
      })
      .order("created_at", { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (role === "agent") query = query.eq("assigned_to", agentId);
    if (status) query = query.eq("status", status);
    if (type) query = query.eq("request_type", type);

    const { data, error } = await query;
    if (error) throw error;

    const stats = {
      total: data.length,
      pending: data.filter((r) => r.status === "pending").length,
      assigned: data.filter((r) => r.status === "assigned").length,
      inProgress: data.filter((r) => r.status === "in_progress").length,
      completed: data.filter((r) => r.status === "completed").length,
      rejected: data.filter((r) => r.status === "rejected").length,
      slaBreached: data.filter((r) => r.sla_resolve_breached).length,
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

// ── GET /api/requests ─────────────────────────────────────────────────────────
router.get("/", authenticate, async (req, res) => {
  const { role, id: agentId } = req.agent;
  const { status, type, page = 1, limit = 20 } = req.query;

  try {
    let query = supabase
      .from("requests")
      .select("*, agents!requests_assigned_to_fkey(id, full_name, email)", {
        count: "exact",
      })
      .order("created_at", { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (role === "agent") query = query.eq("assigned_to", agentId);
    if (status) query = query.eq("status", status);
    if (type) query = query.eq("request_type", type);

    const { data, error, count } = await query;
    if (error) throw error;

    // Attach SLA status to each request
    const settings = await getSLASettings();
    const requestsWithSLA = data.map((r) => ({
      ...r,
      sla: getSLAStatus(r, settings),
    }));

    res.json({
      success: true,
      requests: requestsWithSLA,
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
router.get("/:id", authenticate, async (req, res) => {
  const { id } = req.params;

  try {
    const { data: request, error } = await supabase
      .from("requests")
      .select("*, agents!requests_assigned_to_fkey(id, full_name, email)")
      .eq("id", id)
      .single();

    if (error || !request)
      return res.status(404).json({ error: "Request not found." });

    const { data: documents } = await supabase
      .from("documents")
      .select("*")
      .eq("request_id", id);
    const { data: activity } = await supabase
      .from("activity_log")
      .select(
        `
          *,
          agents!activity_log_agent_id_fkey (
            id,
            full_name
          )
        `,
      )
      .eq("request_id", id)
      .order("created_at", { ascending: false });

    const settings = await getSLASettings();
    const sla = getSLAStatus(request, settings);

    res.json({
      success: true,
      request: { ...request, sla },
      documents: documents || [],
      activity: activity || [],
    });
  } catch (err) {
    console.error("Get request error:", err);
    res.status(500).json({ error: "Failed to fetch request." });
  }
});

// ── PATCH /api/requests/:id/assign ───────────────────────────────────────────
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
    const { data: agent } = await supabase
      .from("agents")
      .select("full_name")
      .eq("id", agentId)
      .single();

    // Get current request to check status
    const { data: currentRequest } = await supabase
      .from("requests")
      .select("status")
      .eq("id", id)
      .single();

    // Only reset to assigned if currently pending or assigned
    // Keep in_progress status if already being worked on
    const newStatus = ["pending", "assigned"].includes(currentRequest?.status)
      ? "assigned"
      : currentRequest?.status;

    const { data: request, error } = await supabase
      .from("requests")
      .update({
        assigned_to: agentId,
        status: newStatus,
        assigned_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    await supabase.from("activity_log").insert([
      {
        request_id: id,
        agent_id: supervisorId,
        action: "assigned",
        details: `Assigned to ${agent?.full_name} by ${supervisorName}`,
      },
    ]);

    // Update SLA breach status
    const settings = await getSLASettings();
    const sla = getSLAStatus(request, settings);

    await supabase
      .from("requests")
      .update({ sla_assign_breached: sla.assign.breached })
      .eq("id", id);

    res.json({ success: true, request });
  } catch (err) {
    console.error("Assign request error:", err);
    res.status(500).json({ error: "Failed to assign request." });
  }
});

// ── PATCH /api/requests/:id/status ───────────────────────────────────────────
router.patch("/:id/status", authenticate, async (req, res) => {
  const { id } = req.params;
  const { status, note, sendEmail, emailMessage } = req.body;
  const { id: agentId, fullName } = req.agent;

  const validStatuses = ["in_progress", "completed", "rejected"];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: "Invalid status." });
  }

  try {
    const { data: request } = await supabase
      .from("requests")
      .select("*")
      .eq("id", id)
      .single();
    const { data: settings } = await supabase
      .from("system_settings")
      .select("*")
      .single();

    const now = new Date().toISOString();
    const updateData = { status };

    if (note) updateData.internal_notes = note;

    // Set timestamps
    if (status === "in_progress" && !request.first_response_at) {
      updateData.first_response_at = now;
      updateData.sla_response_breached = getSLAStatus(request, {
        assignHours: settings.sla_assign_hours,
        responseHours: settings.sla_response_hours,
        resolveHours: settings.sla_resolve_hours,
      }).response.breached;
    }

    if (["completed", "rejected"].includes(status)) {
      updateData.resolved_at = now;
      updateData.sla_resolve_breached = getSLAStatus(request, {
        assignHours: settings.sla_assign_hours,
        responseHours: settings.sla_response_hours,
        resolveHours: settings.sla_resolve_hours,
      }).resolve.breached;
    }

    const { data: updated, error } = await supabase
      .from("requests")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    await supabase.from("activity_log").insert([
      {
        request_id: id,
        agent_id: agentId,
        action: "status_changed",
        details: `Status changed to ${status} by ${fullName}${note ? ` — Note: ${note}` : ""}`,
      },
    ]);

    // Send email if toggled
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
      await supabase.from("activity_log").insert([
        {
          request_id: id,
          agent_id: agentId,
          action: "email_sent",
          details: `Status update email sent to ${request.shareholder_email}`,
        },
      ]);
    }

    // Update agent performance
    if (request.assigned_to) {
      const slaSettings = await getSLASettings();
      await updateAgentPerformance(request.assigned_to, slaSettings);
    }

    res.json({ success: true, request: updated });
  } catch (err) {
    console.error("Update status error:", err);
    res.status(500).json({ error: "Failed to update status." });
  }
});

// ── PATCH /api/requests/:id/note ─────────────────────────────────────────────
router.patch("/:id/note", authenticate, async (req, res) => {
  const { id } = req.params;
  const { note } = req.body;
  const { id: agentId, fullName } = req.agent;

  if (!note) return res.status(400).json({ error: "Note is required." });

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

// ── POST /api/requests/bulk-assign ───────────────────────────────────────────
router.post("/bulk-assign", authenticate, async (req, res) => {
  const { requestIds, agentId } = req.body;
  const { role, id: supervisorId, fullName: supervisorName } = req.agent;

  if (!["admin", "supervisor", "lead_supervisor"].includes(role)) {
    return res.status(403).json({ error: "Access denied." });
  }

  if (!requestIds?.length || !agentId) {
    return res
      .status(400)
      .json({ error: "Request IDs and agent ID are required." });
  }

  try {
    const { data: agent } = await supabase
      .from("agents")
      .select("full_name")
      .eq("id", agentId)
      .single();

    const now = new Date().toISOString();

    // Update all selected requests
    const { error } = await supabase
      .from("requests")
      .update({
        assigned_to: agentId,
        assigned_at: now,
      })
      .in("id", requestIds)
      .not("status", "in", '("completed","approved",)');

    if (error) throw error;

    // Log activity for each request
    const activityLogs = requestIds.map((id) => ({
      request_id: id,
      agent_id: supervisorId,
      action: "assigned",
      details: `Bulk assigned to ${agent?.full_name} by ${supervisorName}`,
    }));

    await supabase.from("activity_log").insert(activityLogs);

    res.json({
      success: true,
      message: `${requestIds.length} tickets assigned to ${agent?.full_name}`,
    });
  } catch (err) {
    console.error("Bulk assign error:", err);
    res.status(500).json({ error: "Failed to bulk assign requests." });
  }
});

// ── POST /api/requests/:id/approve ───────────────────────────────────────────
router.post("/:id/approve", authenticate, async (req, res) => {
  const { id } = req.params;
  const { id: agentId, fullName } = req.agent;

  try {
    // Get full request with documents
    const { data: request, error: reqError } = await supabase
      .from("requests")
      .select("*")
      .eq("id", id)
      .single();

    if (reqError || !request) {
      return res.status(404).json({ error: "Request not found." });
    }

    if (request.status !== "completed") {
      return res
        .status(400)
        .json({ error: "Only completed requests can be approved." });
    }

    // Get documents
    const { data: documents } = await supabase
      .from("documents")
      .select("*")
      .eq("request_id", id);

    // Build payload for external app
    const externalPayload = {
      referenceNumber: request.reference_number,
      requestType: request.request_type,
      requestSubtype: request.request_subtype,
      shareholderName: request.shareholder_name,
      shareholderEmail: request.shareholder_email,
      fields: request.fields,
      submittedAt: request.submitted_at,
      resolvedAt: request.resolved_at,
      approvedAt: new Date().toISOString(),
      approvedBy: fullName,
      documents: (documents || []).map((doc) => ({
        type: doc.document_type,
        fileName: doc.file_name,
        fileUrl: doc.file_url,
      })),
    };

    // Send to external app if endpoint is configured
    const EXTERNAL_ENDPOINT = process.env.EXTERNAL_APP_ENDPOINT;
    let externalRef = null;

    if (EXTERNAL_ENDPOINT) {
      try {
        const extRes = await fetch(EXTERNAL_ENDPOINT, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.EXTERNAL_APP_TOKEN || ""}`,
          },
          body: JSON.stringify(externalPayload),
        });
        const extData = await extRes.json();
        externalRef = extData?.referenceNumber || extData?.id || null;
        console.log(
          `Request ${request.reference_number} synced to external app.`,
        );
      } catch (extErr) {
        console.error("External app sync failed:", extErr.message);
        // Don't block approval if external sync fails
      }
    } else {
      console.log(
        `External endpoint not configured. Approval logged locally only.`,
      );
    }

    // Update request status to approved
    const { data: updated, error: updateError } = await supabase
      .from("requests")
      .update({
        status: "approved",
        approved_at: new Date().toISOString(),
        approved_by: agentId,
        external_sync: !!externalRef,
        external_ref: externalRef,
      })
      .eq("id", id)
      .select()
      .single();

    if (updateError) throw updateError;

    // Log activity
    await supabase.from("activity_log").insert([
      {
        request_id: id,
        agent_id: agentId,
        action: "approved",
        details: `Request approved by ${fullName}${externalRef ? ` — External ref: ${externalRef}` : ""}`,
      },
    ]);

    res.json({
      success: true,
      request: updated,
      externalRef,
      synced: !!externalRef,
    });
  } catch (err) {
    console.error("Approve request error:", err);
    res.status(500).json({ error: "Failed to approve request." });
  }
});

// ── POST /api/requests/:id/revoke-approval ────────────────────────────────────
router.post("/:id/revoke-approval", authenticate, async (req, res) => {
  const { id } = req.params;
  const { id: agentId, fullName } = req.agent;
  const { reason } = req.body;

  try {
    const { data: request } = await supabase
      .from("requests")
      .select("*")
      .eq("id", id)
      .single();

    if (!request) {
      return res.status(404).json({ error: "Request not found." });
    }

    if (request.status !== "approved") {
      return res
        .status(400)
        .json({ error: "Only approved requests can be revoked." });
    }

    const { data: updated, error } = await supabase
      .from("requests")
      .update({
        status: "approval_revoked",
        external_sync: false,
        external_ref: null,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    await supabase.from("activity_log").insert([
      {
        request_id: id,
        agent_id: agentId,
        action: "approval_revoked",
        details: `Approval revoked by ${fullName}${reason ? ` — Reason: ${reason}` : ""}`,
      },
    ]);

    res.json({ success: true, request: updated });
  } catch (err) {
    console.error("Revoke approval error:", err);
    res.status(500).json({ error: "Failed to revoke approval." });
  }
});

module.exports = router;
