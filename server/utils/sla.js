/**
 * SLA Utility Functions
 * Handles SLA calculations, breach checks and agent scoring
 */

const { supabase } = require("./supabase");

// ── Get SLA settings from DB ──────────────────────────────────────────────────
async function getSLASettings() {
  const { data, error } = await supabase
    .from("system_settings")
    .select("sla_assign_hours, sla_response_hours, sla_resolve_hours")
    .single();

  if (error) throw error;

  return {
    assignHours: data.sla_assign_hours || 2,
    responseHours: data.sla_response_hours || 4,
    resolveHours: data.sla_resolve_hours || 48,
  };
}

// ── Calculate hours between two timestamps ────────────────────────────────────
function hoursBetween(start, end) {
  if (!start || !end) return null;
  const diff = new Date(end) - new Date(start);
  return diff / (1000 * 60 * 60);
}

// ── Get SLA status for a single request ──────────────────────────────────────
function getSLAStatus(request, settings) {
  const now = new Date();

  // Time to assign
  const assignHours = request.assigned_at
    ? hoursBetween(request.submitted_at, request.assigned_at)
    : hoursBetween(request.submitted_at, now);

  const assignBreached = assignHours > settings.assignHours;
  const assignPct = (assignHours / settings.assignHours) * 100;

  // Time to first response
  const responseHours = request.first_response_at
    ? hoursBetween(request.assigned_at, request.first_response_at)
    : request.assigned_at
      ? hoursBetween(request.assigned_at, now)
      : null;

  const responseBreached =
    responseHours !== null && responseHours > settings.responseHours;
  const responsePct =
    responseHours !== null ? (responseHours / settings.responseHours) * 100 : 0;

  // Time to resolve
  const resolveHours = request.resolved_at
    ? hoursBetween(request.submitted_at, request.resolved_at)
    : hoursBetween(request.submitted_at, now);

  const resolveBreached = resolveHours > settings.resolveHours;
  const resolvePct = (resolveHours / settings.resolveHours) * 100;

  // Overall SLA status
  function getStatus(breached, pct) {
    if (breached) return "breached";
    if (pct >= 75) return "at_risk";
    return "on_track";
  }

  return {
    assign: {
      hours: Math.round(assignHours * 10) / 10,
      target: settings.assignHours,
      breached: assignBreached,
      status: getStatus(assignBreached, assignPct),
      pct: Math.min(100, Math.round(assignPct)),
    },
    response: {
      hours:
        responseHours !== null ? Math.round(responseHours * 10) / 10 : null,
      target: settings.responseHours,
      breached: responseBreached,
      status:
        responseHours !== null
          ? getStatus(responseBreached, responsePct)
          : "pending",
      pct: Math.min(100, Math.round(responsePct)),
    },
    resolve: {
      hours: Math.round(resolveHours * 10) / 10,
      target: settings.resolveHours,
      breached: resolveBreached,
      status: getStatus(resolveBreached, resolvePct),
      pct: Math.min(100, Math.round(resolvePct)),
    },
  };
}

// ── Calculate agent score ─────────────────────────────────────────────────────
function calculateScore(stats) {
  if (stats.ticketsAssigned === 0) return 0;

  // Resolution rate (30%)
  const resolutionRate =
    stats.ticketsAssigned > 0
      ? (stats.ticketsResolved / stats.ticketsAssigned) * 100
      : 0;

  // SLA compliance rate (30%)
  const totalSLA = stats.slametCount + stats.slaBreachedCount;
  const slaRate = totalSLA > 0 ? (stats.slametCount / totalSLA) * 100 : 100;

  // Avg response time score (20%) — lower is better, target is responseHours
  const responseScore =
    stats.avgResponseHours > 0
      ? Math.max(
          0,
          100 -
            ((stats.avgResponseHours - stats.targetResponseHours) /
              stats.targetResponseHours) *
              100,
        )
      : 100;

  // Volume score (20%) — based on tickets handled
  const volumeScore = Math.min(100, (stats.ticketsResolved / 10) * 100);

  const score =
    resolutionRate * 0.3 +
    slaRate * 0.3 +
    responseScore * 0.2 +
    volumeScore * 0.2;

  return Math.round(Math.min(100, Math.max(0, score)) * 10) / 10;
}

// ── Get score badge and encouragement message ─────────────────────────────────
function getScoreFeedback(score, stats) {
  let badge, message, tip;

  if (score >= 90) {
    badge = "🏆";
    message = "Outstanding! You are in the top tier of performers.";
    tip = "Keep up the excellent work and mentor your colleagues!";
  } else if (score >= 75) {
    badge = "⭐";
    message = "Great work! You are performing above standard.";
    tip = "Focus on maintaining your SLA compliance to push for 90+";
  } else if (score >= 60) {
    badge = "💪";
    message = "Good effort! You are meeting the basic standard.";
    tip =
      "Try to respond to tickets within the SLA window to boost your score.";
  } else {
    badge = "📈";
    message = "There is room to grow. Let's work on improving your metrics.";
    tip =
      "Start by clearing your oldest open tickets and checking SLA deadlines daily.";
  }

  // Add specific tips based on weak areas
  const tips = [tip];

  if (stats.slaBreachedCount > stats.slametCount) {
    tips.push(
      "SLA breaches are high — try to action tickets within the first hour of assignment.",
    );
  }

  if (stats.avgResponseHours > stats.targetResponseHours * 1.5) {
    tips.push(
      "Your average response time is high — aim to send your first update within 2 hours.",
    );
  }

  if (stats.ticketsResolved < 5) {
    tips.push("Volume is low this period — push to close out pending tickets.");
  }

  return { badge, message, tips };
}

// ── Calculate period dates ────────────────────────────────────────────────────
function getPeriodDates(periodType) {
  const now = new Date();
  let start, end;

  if (periodType === "weekly") {
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    start = new Date(now.setDate(diff));
    end = new Date(start);
    end.setDate(start.getDate() + 6);
  } else if (periodType === "monthly") {
    start = new Date(now.getFullYear(), now.getMonth(), 1);
    end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  } else if (periodType === "quarterly") {
    const quarter = Math.floor(now.getMonth() / 3);
    start = new Date(now.getFullYear(), quarter * 3, 1);
    end = new Date(now.getFullYear(), quarter * 3 + 3, 0);
  } else {
    start = new Date("2020-01-01");
    end = new Date("2099-12-31");
  }

  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  };
}

// ── Update agent performance record ──────────────────────────────────────────
async function updateAgentPerformance(agentId, settings) {
  const periods = ["weekly", "monthly", "quarterly", "alltime"];

  for (const periodType of periods) {
    const { start, end } = getPeriodDates(periodType);

    // Get all requests for this agent in this period
    const { data: requests } = await supabase
      .from("requests")
      .select("*")
      .eq("assigned_to", agentId)
      .gte("submitted_at", start)
      .lte("submitted_at", end + "T23:59:59Z");

    if (!requests) continue;

    const ticketsAssigned = requests.length;
    const ticketsResolved = requests.filter(
      (r) => r.status === "completed",
    ).length;
    const ticketsRejected = requests.filter(
      (r) => r.status === "rejected",
    ).length;
    const slaMetCount = requests.filter(
      (r) => !r.sla_resolve_breached && r.resolved_at,
    ).length;
    const slaBreachedCount = requests.filter(
      (r) => r.sla_resolve_breached,
    ).length;

    // Avg resolution hours
    const resolvedRequests = requests.filter(
      (r) => r.resolved_at && r.submitted_at,
    );
    const avgResolutionHours =
      resolvedRequests.length > 0
        ? resolvedRequests.reduce(
            (sum, r) => sum + hoursBetween(r.submitted_at, r.resolved_at),
            0,
          ) / resolvedRequests.length
        : 0;

    // Avg response hours
    const respondedRequests = requests.filter(
      (r) => r.first_response_at && r.assigned_at,
    );
    const avgResponseHours =
      respondedRequests.length > 0
        ? respondedRequests.reduce(
            (sum, r) => sum + hoursBetween(r.assigned_at, r.first_response_at),
            0,
          ) / respondedRequests.length
        : 0;

    const score = calculateScore({
      ticketsAssigned,
      ticketsResolved,
      slametCount: slaMetCount,
      slaBreachedCount,
      avgResponseHours,
      targetResponseHours: settings.responseHours,
    });

    // Upsert performance record
    await supabase.from("agent_performance").upsert(
      {
        agent_id: agentId,
        period_type: periodType,
        period_start: start,
        period_end: end,
        tickets_assigned: ticketsAssigned,
        tickets_resolved: ticketsResolved,
        tickets_rejected: ticketsRejected,
        sla_met_count: slaMetCount,
        sla_breached_count: slaBreachedCount,
        avg_resolution_hours: avgResolutionHours,
        avg_response_hours: avgResponseHours,
        score,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "agent_id,period_type,period_start",
      },
    );
  }
}

// ── Check working hours elapsed (Mon-Fri only) ────────────────────────────────
function workingHoursElapsed(fromTimestamp) {
  if (!fromTimestamp) return 0;

  const start = new Date(fromTimestamp);
  const now = new Date();
  let hours = 0;
  let current = new Date(start);

  while (current < now) {
    const day = current.getDay(); // 0=Sun, 6=Sat
    if (day !== 0 && day !== 6) {
      hours++;
    }
    current.setHours(current.getHours() + 1);
  }

  return hours;
}

// ── Run waiting on customer checker ──────────────────────────────────────────
async function runWaitingOnCustomerCheck() {
  console.log(
    `[${new Date().toISOString()}] Running waiting on customer check...`,
  );

  try {
    const { supabase } = require("./supabase");
    const { sendWaitingClosedEmail } = require("./mailer");

    // Get all tickets in waiting_on_customer status
    const { data: tickets, error } = await supabase
      .from("requests")
      .select("*")
      .eq("status", "waiting_on_customer");

    if (error) throw error;
    if (!tickets?.length) {
      console.log("No tickets waiting on customer.");
      return;
    }

    for (const ticket of tickets) {
      const hoursWaiting = workingHoursElapsed(ticket.waiting_since);

      if (hoursWaiting >= 48) {
        // Auto-close ticket
        await supabase
          .from("requests")
          .update({
            status: "closed",
            closed_at: new Date().toISOString(),
            closed_reason:
              "Auto-closed after 48 working hours with no customer response.",
          })
          .eq("id", ticket.id);

        // Generate reopen token
        const crypto = require("crypto");
        const reopenToken = crypto.randomBytes(32).toString("hex");
        const tokenExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

        await supabase
          .from("requests")
          .update({
            resubmit_token: reopenToken,
            resubmit_token_expiry: tokenExpiry.toISOString(),
          })
          .eq("id", ticket.id);

        // Build reopen URL
        const reopenUrl = `${process.env.FRONTEND_URL}/resubmit?token=${reopenToken}&ref=${ticket.reference_number}`;

        // Send closed email to shareholder
        try {
          await sendWaitingClosedEmail(
            ticket.shareholder_email,
            ticket.shareholder_name,
            ticket.reference_number,
            reopenUrl,
          );
        } catch (emailErr) {
          console.error(
            `Failed to send closed email for ${ticket.reference_number}:`,
            emailErr.message,
          );
        }

        // Log activity
        await supabase.from("activity_log").insert([
          {
            request_id: ticket.id,
            agent_id: null,
            action: "auto_closed",
            details: `Ticket auto-closed by system after 48 working hours with no customer response.`,
          },
        ]);

        console.log(
          `Ticket ${ticket.reference_number} auto-closed after ${hoursWaiting} working hours.`,
        );
      }
    }

    console.log(`Waiting on customer check complete.`);
  } catch (err) {
    console.error("Waiting on customer check error:", err);
  }
}

// ── Start waiting on customer scheduler ───────────────────────────────────────
function startWaitingOnCustomerScheduler() {
  console.log("Waiting on customer scheduler started — checking every hour.");
  runWaitingOnCustomerCheck();
  setInterval(runWaitingOnCustomerCheck, 60 * 60 * 1000); // every hour
}

module.exports = {
  getSLASettings,
  getSLAStatus,
  calculateScore,
  getScoreFeedback,
  getPeriodDates,
  updateAgentPerformance,
  hoursBetween,
  startWaitingOnCustomerScheduler,
  runWaitingOnCustomerCheck,
};
