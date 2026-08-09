/**
 * Escalation Engine
 * Runs every 30 minutes to check for tickets that need escalation
 */

const { supabase } = require("./supabase");
const { sendStatusUpdateEmail } = require("./mailer");
const nodemailer = require("nodemailer");
require("dotenv").config();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: { rejectUnauthorized: false },
});

// ── Send escalation email ─────────────────────────────────────────────────────
async function sendEscalationEmail(toEmail, toName, request, rule, level) {
  const levelLabels = {
    1: "First escalation",
    2: "Second escalation",
    3: "Final escalation",
  };

  const triggerLabels = {
    no_assign: "has not been assigned to an agent",
    no_response: "has not received a first response",
    no_resolve: "has not been resolved",
  };

  const mailOptions = {
    from: `"${process.env.SMTP_FROM_NAME}" <${process.env.SMTP_USER}>`,
    to: toEmail,
    subject: `⚠️ [${levelLabels[level]}] Ticket ${request.reference_number} requires attention`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">

        <div style="background: #C0392B; padding: 20px 24px; border-radius: 8px 8px 0 0;">
          <h2 style="color: #fff; margin: 0; font-size: 18px;">ShareReg Admin — Escalation Alert</h2>
          <p style="color: rgba(255,255,255,0.8); margin: 4px 0 0; font-size: 13px;">${levelLabels[level]}</p>
        </div>

        <div style="background: #fff; border: 1px solid #e8e8e8; border-top: none; padding: 24px; border-radius: 0 0 8px 8px;">
          <p style="font-size: 15px; color: #1a1a1a; margin-bottom: 8px;">Dear ${toName},</p>
          <p style="font-size: 14px; color: #6b6b6b; line-height: 1.6; margin-bottom: 24px;">
            The following ticket requires your immediate attention. It ${triggerLabels[rule.trigger_type]} within the expected timeframe.
          </p>

          <!-- Ticket details -->
          <div style="background: #fdf1f0; border: 1px solid #e8b4af; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
            <p style="font-size: 12px; color: #C0392B; font-weight: 500; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px;">
              Ticket details
            </p>
            <table style="width: 100%; font-size: 13px; border-collapse: collapse;">
              <tr>
                <td style="color: #6b6b6b; padding: 4px 0; width: 40%;">Reference</td>
                <td style="color: #1a1a1a; font-weight: 500; font-family: monospace;">${request.reference_number}</td>
              </tr>
              <tr>
                <td style="color: #6b6b6b; padding: 4px 0;">Shareholder</td>
                <td style="color: #1a1a1a; font-weight: 500;">${request.shareholder_name}</td>
              </tr>
              <tr>
                <td style="color: #6b6b6b; padding: 4px 0;">Request type</td>
                <td style="color: #1a1a1a; font-weight: 500;">${request.request_type}</td>
              </tr>
              <tr>
                <td style="color: #6b6b6b; padding: 4px 0;">Current status</td>
                <td style="color: #1a1a1a; font-weight: 500;">${request.status}</td>
              </tr>
              <tr>
                <td style="color: #6b6b6b; padding: 4px 0;">Submitted</td>
                <td style="color: #1a1a1a; font-weight: 500;">${new Date(request.submitted_at).toLocaleString("en-GB")}</td>
              </tr>
              <tr>
                <td style="color: #6b6b6b; padding: 4px 0;">Escalation level</td>
                <td style="color: #C0392B; font-weight: 700;">${levelLabels[level]}</td>
              </tr>
            </table>
          </div>

          <p style="font-size: 13px; color: #6b6b6b; line-height: 1.6;">
            Please log in to the admin dashboard and take immediate action on this ticket.
          </p>

          <hr style="border: none; border-top: 1px solid #f0f0f0; margin: 16px 0;" />
          <p style="font-size: 12px; color: #b0b0b0; text-align: center;">
            ShareReg Portal &nbsp;·&nbsp; Admin Alert System<br/>
            <a href="mailto:${process.env.SMTP_USER}" style="color: #C0392B;">${process.env.SMTP_USER}</a>
          </p>
        </div>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
}

// ── Get agents to notify based on rule and assigned agent ─────────────────────
async function getAgentsToNotify(request, rule, level) {
  const agentsToNotify = [];

  // Get assigned agent's supervisor chain
  if (request.assigned_to) {
    const { data: agent } = await supabase
      .from("agents")
      .select("*, supervisor:supervisor_id(id, full_name, email, role)")
      .eq("id", request.assigned_to)
      .single();

    if (agent?.supervisor && rule.notify_supervisor) {
      agentsToNotify.push(agent.supervisor);
    }
  }

  // Get all lead supervisors
  if (rule.notify_lead_supervisor && level >= 2) {
    const { data: leadSupervisors } = await supabase
      .from("agents")
      .select("id, full_name, email, role")
      .eq("role", "lead_supervisor")
      .eq("is_active", true);

    if (leadSupervisors) agentsToNotify.push(...leadSupervisors);
  }

  // Get all admins
  if (rule.notify_admin && level >= 3) {
    const { data: admins } = await supabase
      .from("agents")
      .select("id, full_name, email, role")
      .eq("role", "admin")
      .eq("is_active", true);

    if (admins) agentsToNotify.push(...admins);
  }

  // Remove duplicates
  return agentsToNotify.filter(
    (a, idx, arr) => arr.findIndex((b) => b.id === a.id) === idx,
  );
}

// ── Check hours elapsed ───────────────────────────────────────────────────────
function hoursElapsed(timestamp) {
  if (!timestamp) return 0;
  return (Date.now() - new Date(timestamp).getTime()) / (1000 * 60 * 60);
}

// ── Main escalation checker ───────────────────────────────────────────────────
async function runEscalationCheck() {
  console.log(`[${new Date().toISOString()}] Running escalation check...`);

  try {
    // Get active escalation rules
    const { data: rules, error: rulesError } = await supabase
      .from("escalation_rules")
      .select("*")
      .eq("is_active", true);

    if (rulesError || !rules?.length) return;
    console.log("No active escalation rules found.");
    // Get open requests
    const { data: requests, error: requestsError } = await supabase
      .from("requests")
      .select("*")
      .in("status", ["pending", "assigned", "in_progress"]);

    if (requestsError || !requests?.length) return;
    console.log("No open requests to check.");
    for (const rule of rules) {
      for (const request of requests) {
        let shouldEscalate = false;
        let elapsed = 0;

        // Check trigger condition
        if (rule.trigger_type === "no_assign" && !request.assigned_at) {
          elapsed = hoursElapsed(request.submitted_at);
          shouldEscalate = elapsed >= rule.trigger_hours;
        } else if (
          rule.trigger_type === "no_response" &&
          request.assigned_at &&
          !request.first_response_at
        ) {
          elapsed = hoursElapsed(request.assigned_at);
          shouldEscalate = elapsed >= rule.trigger_hours;
        } else if (rule.trigger_type === "no_resolve" && !request.resolved_at) {
          elapsed = hoursElapsed(request.submitted_at);
          shouldEscalate = elapsed >= rule.trigger_hours;
        }

        if (!shouldEscalate) continue;

        // Determine escalation level
        let level = 1;
        if (rule.final_trigger_hours && elapsed >= rule.final_trigger_hours)
          level = 3;
        else if (
          rule.second_trigger_hours &&
          elapsed >= rule.second_trigger_hours
        )
          level = 2;

        // Check if already escalated at this level
        const { data: existing } = await supabase
          .from("escalations")
          .select("id, escalation_level")
          .eq("request_id", request.id)
          .eq("rule_id", rule.id)
          .eq("escalation_level", level)
          .single();

        if (existing) continue; // Already escalated at this level

        // Get agents to notify
        const agentsToNotify = await getAgentsToNotify(request, rule, level);

        if (!agentsToNotify.length) continue;

        // Send emails
        const notified = [];
        for (const agent of agentsToNotify) {
          try {
            await sendEscalationEmail(
              agent.email,
              agent.full_name,
              request,
              rule,
              level,
            );
            notified.push({
              id: agent.id,
              email: agent.email,
              name: agent.full_name,
            });
            console.log(
              `Escalation email sent to ${agent.email} for ticket ${request.reference_number}`,
            );
          } catch (err) {
            console.error(
              `Failed to send escalation email to ${agent.email}:`,
              err.message,
            );
          }
        }

        // Log escalation
        await supabase.from("escalations").insert([
          {
            request_id: request.id,
            rule_id: rule.id,
            escalation_level: level,
            triggered_at: new Date().toISOString(),
            notified_to: notified,
          },
        ]);

        // Update request escalation status
        await supabase
          .from("requests")
          .update({
            is_escalated: true,
            escalation_level: level,
          })
          .eq("id", request.id);

        // Log activity
        await supabase.from("activity_log").insert([
          {
            request_id: request.id,
            agent_id: null,
            action: "escalated",
            details: `Ticket escalated (level ${level}) — ${rule.name}. Notified: ${notified.map((n) => n.name).join(", ")}`,
          },
        ]);
      }
    }
    console.log(
      `[${new Date().toISOString()}] Checked ${requests?.length || 0} open tickets against ${rules?.length || 0} rules.`,
    );
    console.log(`[${new Date().toISOString()}] Escalation check complete.`);
  } catch (err) {
    console.error("Escalation check error:", err);
  }
}

// ── Start escalation scheduler ────────────────────────────────────────────────
function startEscalationScheduler() {
  console.log("Escalation scheduler started — checking every 30 minutes.");
  runEscalationCheck(); // Run immediately on startup
  setInterval(runEscalationCheck, 30 * 60 * 1000); // Then every 30 minutes
}

module.exports = { startEscalationScheduler, runEscalationCheck };
