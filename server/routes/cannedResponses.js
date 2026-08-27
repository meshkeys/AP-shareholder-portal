const express = require("express");
const router = express.Router();
const { supabase } = require("../utils/supabase");
const authenticate = require("../middleware/authenticate");
const crypto = require("crypto");

// ── GET /api/canned-responses ─────────────────────────────────────────────────
router.get("/", authenticate, async (req, res) => {
  const { requestType } = req.query;
  try {
    let query = supabase
      .from("canned_responses")
      .select("*")
      .eq("is_active", true)
      .order("request_type")
      .order("title");

    if (requestType) query = query.eq("request_type", requestType);

    const { data, error } = await query;
    if (error) throw error;
    res.json({ success: true, responses: data });
  } catch (err) {
    console.error("Get canned responses error:", err);
    res.status(500).json({ error: "Failed to fetch canned responses." });
  }
});

// ── POST /api/canned-responses ────────────────────────────────────────────────
router.post("/", authenticate, async (req, res) => {
  const { role, id: agentId } = req.agent;
  if (!["admin", "lead_supervisor"].includes(role)) {
    return res.status(403).json({ error: "Access denied." });
  }
  const { title, requestType, body, flaggedItems } = req.body;
  if (!title || !requestType || !body) {
    return res
      .status(400)
      .json({ error: "Title, request type and body are required." });
  }
  try {
    const { data, error } = await supabase
      .from("canned_responses")
      .insert([
        {
          title,
          request_type: requestType,
          body,
          flagged_items: flaggedItems || [],
          created_by: agentId,
        },
      ])
      .select()
      .single();
    if (error) throw error;
    res.json({ success: true, response: data });
  } catch (err) {
    console.error("Create canned response error:", err);
    res.status(500).json({ error: "Failed to create canned response." });
  }
});

// ── PATCH /api/canned-responses/:id ──────────────────────────────────────────
router.patch("/:id", authenticate, async (req, res) => {
  const { role } = req.agent;
  const { id } = req.params;
  if (!["admin", "lead_supervisor"].includes(role)) {
    return res.status(403).json({ error: "Access denied." });
  }
  const { title, body, flaggedItems, isActive } = req.body;
  try {
    const updateData = { updated_at: new Date().toISOString() };
    if (title !== undefined) updateData.title = title;
    if (body !== undefined) updateData.body = body;
    if (flaggedItems !== undefined) updateData.flagged_items = flaggedItems;
    if (isActive !== undefined) updateData.is_active = isActive;

    const { data, error } = await supabase
      .from("canned_responses")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    res.json({ success: true, response: data });
  } catch (err) {
    console.error("Update canned response error:", err);
    res.status(500).json({ error: "Failed to update canned response." });
  }
});

// ── DELETE /api/canned-responses/:id ─────────────────────────────────────────
router.delete("/:id", authenticate, async (req, res) => {
  const { role } = req.agent;
  if (role !== "admin") {
    return res
      .status(403)
      .json({ error: "Only admins can delete canned responses." });
  }
  try {
    await supabase.from("canned_responses").delete().eq("id", req.params.id);
    res.json({ success: true, message: "Canned response deleted." });
  } catch (err) {
    console.error("Delete canned response error:", err);
    res.status(500).json({ error: "Failed to delete canned response." });
  }
});

// ── POST /api/canned-responses/send-flag ─────────────────────────────────────
// Send flagged email to shareholder with resubmit link
router.post("/send-flag", authenticate, async (req, res) => {
  const { requestId, emailMessage, flaggedItems } = req.body;
  const { id: agentId, fullName } = req.agent;

  if (!requestId || !emailMessage) {
    return res
      .status(400)
      .json({ error: "Request ID and email message are required." });
  }

  try {
    const { data: request } = await supabase
      .from("requests")
      .select("*")
      .eq("id", requestId)
      .single();

    if (!request) return res.status(404).json({ error: "Request not found." });

    // Generate resubmit token
    const resubmitToken = crypto.randomBytes(32).toString("hex");
    const tokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // Save flagged items and token to request
    await supabase
      .from("requests")
      .update({
        flagged_items: flaggedItems || [],
        resubmit_token: resubmitToken,
        resubmit_token_expiry: tokenExpiry.toISOString(),
        status_before_flag: request.status,
        status: "flagged",
      })
      .eq("id", requestId);

    // Build resubmit URL
    const resubmitUrl = `${process.env.FRONTEND_URL}/resubmit?token=${resubmitToken}&ref=${request.reference_number}`;

    // Send email via Brevo
    const { sendFlaggedEmail } = require("../utils/mailer");
    await sendFlaggedEmail(
      request.shareholder_email,
      request.shareholder_name,
      request.reference_number,
      request.request_type,
      emailMessage,
      flaggedItems || [],
      resubmitUrl,
    );

    // Log activity
    await supabase.from("activity_log").insert([
      {
        request_id: requestId,
        agent_id: agentId,
        action: "flagged",
        details: `Request flagged by ${fullName}. Flagged items: ${(flaggedItems || []).join(", ")}. Resubmit email sent to ${request.shareholder_email}`,
      },
    ]);

    res.json({ success: true, message: "Flag email sent successfully." });
  } catch (err) {
    console.error("Send flag error:", err);
    res.status(500).json({ error: "Failed to send flag email." });
  }
});

// ── POST /api/canned-responses/resubmit ──────────────────────────────────────
// Shareholder resubmits corrected request
router.post("/resubmit", async (req, res) => {
  const { token, fields } = req.body;

  if (!token) return res.status(400).json({ error: "Token is required." });

  try {
    const { data: request } = await supabase
      .from("requests")
      .select("*")
      .eq("resubmit_token", token)
      .single();

    if (!request)
      return res
        .status(404)
        .json({ error: "Invalid or expired resubmit link." });

    if (new Date() > new Date(request.resubmit_token_expiry)) {
      return res
        .status(400)
        .json({
          error: "This resubmit link has expired. Please contact support.",
        });
    }

    // Update request with new fields
    await supabase
      .from("requests")
      .update({
        fields: { ...request.fields, ...fields },
        status: request.status_before_flag || "in_progress",
        resubmitted_at: new Date().toISOString(),
        resubmit_token: null,
        resubmit_token_expiry: null,
        flagged_items: [],
      })
      .eq("id", request.id);

    // Log activity
    await supabase.from("activity_log").insert([
      {
        request_id: request.id,
        agent_id: null,
        action: "resubmitted",
        details: `Shareholder resubmitted corrected information for request ${request.reference_number}`,
      },
    ]);

    res.json({
      success: true,
      message: "Your request has been resubmitted successfully.",
      referenceNumber: request.reference_number,
    });
  } catch (err) {
    console.error("Resubmit error:", err);
    res.status(500).json({ error: "Failed to resubmit request." });
  }
});

// ── GET /api/canned-responses/resubmit-info ──────────────────────────────────
// Get request info for resubmit page
router.get("/resubmit-info", async (req, res) => {
  const { token } = req.query;
  if (!token) return res.status(400).json({ error: "Token is required." });

  try {
    const { data: request } = await supabase
      .from("requests")
      .select(
        "reference_number, shareholder_name, shareholder_email, request_type, fields, flagged_items, resubmit_token_expiry",
      )
      .eq("resubmit_token", token)
      .single();

    if (!request)
      return res
        .status(404)
        .json({ error: "Invalid or expired resubmit link." });

    if (new Date() > new Date(request.resubmit_token_expiry)) {
      return res.status(400).json({ error: "This resubmit link has expired." });
    }

    res.json({ success: true, request });
  } catch (err) {
    console.error("Resubmit info error:", err);
    res.status(500).json({ error: "Failed to fetch request info." });
  }
});

module.exports = router;
