const express = require("express");
const router = express.Router();
const { supabase } = require("../utils/supabase");
const authenticate = require("../middleware/authenticate");
const { sendBrokerReviewEmail } = require("../utils/mailer");

// The broker's "review & upload" link is just the request's own UUID —
// unguessable, only ever sent to the broker email the shareholder chose,
// and scoped to dematerialization requests only (see the guard below).
function reviewUrlFor(id) {
  const base = process.env.FRONTEND_URL || "http://localhost:5173";
  return `${base}/broker-review?id=${id}`;
}

async function getDematRequest(id) {
  const { data, error } = await supabase
    .from("requests")
    .select("*")
    .eq("id", id)
    .eq("request_type", "dematerialization")
    .single();
  if (error || !data) return null;
  return data;
}

async function sendToBrokerInternal(request, { agentId, fullName } = {}) {
  const brokerEmail = request.fields?.brokerEmail;
  const brokerName = request.fields?.brokerName || "Stockbroker";

  if (!brokerEmail) {
    const err = new Error(
      "No broker email on file for this request. Add one before sending.",
    );
    err.status = 400;
    throw err;
  }

  await sendBrokerReviewEmail(
    brokerEmail,
    brokerName,
    request.shareholder_name,
    request.reference_number,
    reviewUrlFor(request.id),
  );

  const now = new Date().toISOString();
  await supabase
    .from("requests")
    .update({ fields: { ...request.fields, brokerSentAt: now } })
    .eq("id", request.id);

  await supabase.from("activity_log").insert([
    {
      request_id: request.id,
      agent_id: agentId || null,
      action: "sent_to_broker",
      details: agentId
        ? `Sent to broker (${brokerName}) by ${fullName}`
        : `Automatically sent to broker (${brokerName}) on submission`,
    },
  ]);
}

// ── POST /api/dematerialization/:id/auto-send-to-broker ───────────────────────
// PUBLIC — no login. Called by the shareholder's own browser immediately
// after a complete submission (certificate details present, broker has an
// email on file). Idempotent: refuses if this request has already been sent,
// so it can't be used to repeatedly email the broker.
router.post("/:id/auto-send-to-broker", async (req, res) => {
  const { id } = req.params;

  try {
    const request = await getDematRequest(id);
    if (!request) {
      return res.status(404).json({ error: "Dematerialization request not found." });
    }
    if (request.fields?.brokerSentAt) {
      return res.status(409).json({ error: "Already sent to broker." });
    }

    await sendToBrokerInternal(request);
    res.json({ success: true });
  } catch (err) {
    console.error("Auto-send to broker error:", err);
    res.status(err.status || 500).json({ error: err.message || "Failed to send request to broker." });
  }
});

// ── POST /api/dematerialization/:id/send-to-broker ────────────────────────────
// Agent-triggered send/resend — used after filling in registrar info, or to
// resend if needed. Always allowed, regardless of whether it was already sent.
router.post("/:id/send-to-broker", authenticate, async (req, res) => {
  const { id } = req.params;
  const { id: agentId, fullName } = req.agent;

  try {
    const request = await getDematRequest(id);
    if (!request) {
      return res.status(404).json({ error: "Dematerialization request not found." });
    }

    await sendToBrokerInternal(request, { agentId, fullName });
    res.json({ success: true });
  } catch (err) {
    console.error("Send to broker error:", err);
    res.status(err.status || 500).json({ error: err.message || "Failed to send request to broker." });
  }
});

// ── POST /api/dematerialization/:id/registrar-info ────────────────────────────
// Agent fills in certificate number(s)/units the shareholder didn't have,
// then sends the completed request to the broker in the same action.
router.post("/:id/registrar-info", authenticate, async (req, res) => {
  const { id } = req.params;
  const { certificates } = req.body; // [{ certificateNo, units }, ...]
  const { id: agentId, fullName } = req.agent;

  if (!Array.isArray(certificates) || certificates.length === 0) {
    return res.status(400).json({ error: "At least one certificate entry is required." });
  }

  try {
    const request = await getDematRequest(id);
    if (!request) {
      return res.status(404).json({ error: "Dematerialization request not found." });
    }

    const updatedFields = {
      ...request.fields,
      certificates,
      certificatesProvidedBy: "registrar",
    };

    const { error } = await supabase
      .from("requests")
      .update({ fields: updatedFields })
      .eq("id", id);
    if (error) throw error;

    await supabase.from("activity_log").insert([
      {
        request_id: id,
        agent_id: agentId,
        action: "registrar_info_added",
        details: `Certificate details added by ${fullName}`,
      },
    ]);

    await sendToBrokerInternal(
      { ...request, fields: updatedFields },
      { agentId, fullName },
    );

    res.json({ success: true });
  } catch (err) {
    console.error("Registrar info error:", err);
    res.status(err.status || 500).json({ error: err.message || "Failed to save certificate details." });
  }
});

// ── GET /api/dematerialization/review/:id ──────────────────────────────────────
// PUBLIC — no login. Reached via the broker's emailed link. Returns the full
// request so the broker can verify what the shareholder entered before
// completing their own section.
router.get("/review/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const request = await getDematRequest(id);
    if (!request) {
      return res.status(404).json({ error: "Request not found." });
    }

    const { data: documents } = await supabase
      .from("documents")
      .select("*")
      .eq("request_id", id);

    res.json({ success: true, request, documents: documents || [] });
  } catch (err) {
    console.error("Broker review fetch error:", err);
    res.status(500).json({ error: "Failed to load request." });
  }
});

// ── POST /api/dematerialization/review/:id/complete ────────────────────────────
// PUBLIC — no login. Broker calls this after uploading their signed/stamped
// scan (via the existing generic /api/uploads/documents endpoint) to mark
// their part done and hand the request back to us for final verification.
router.post("/review/:id/complete", async (req, res) => {
  const { id } = req.params;
  const { brokerContactName } = req.body;

  try {
    const request = await getDematRequest(id);
    if (!request) {
      return res.status(404).json({ error: "Request not found." });
    }

    const now = new Date().toISOString();
    await supabase
      .from("requests")
      .update({ fields: { ...request.fields, brokerReturnedAt: now } })
      .eq("id", id);

    await supabase.from("activity_log").insert([
      {
        request_id: id,
        agent_id: null,
        action: "broker_document_received",
        details: `Signed form returned by broker${brokerContactName ? ` (${brokerContactName})` : ""} — ready for registrar verification`,
      },
    ]);

    res.json({ success: true });
  } catch (err) {
    console.error("Broker complete error:", err);
    res.status(500).json({ error: "Failed to record broker submission." });
  }
});

module.exports = router;
