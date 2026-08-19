import React, { useState, useEffect } from "react";
import { getSession } from "../services/adminApi";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

function getHeaders() {
  const token = localStorage.getItem("adminToken");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

const today = new Date().toISOString().slice(0, 10);
const weekStart = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  .toISOString()
  .slice(0, 10);

const SLA_COLORS = {
  on_track: {
    bg: "#f0faf4",
    color: "#1a7a40",
    border: "#a8dfc0",
    label: "On track",
  },
  at_risk: {
    bg: "#fff8e6",
    color: "#b36a00",
    border: "#f5d78e",
    label: "At risk",
  },
  breached: {
    bg: "#fdf1f0",
    color: "#C0392B",
    border: "#e8b4af",
    label: "Breached",
  },
  pending: {
    bg: "#f8f8f8",
    color: "#6b6b6b",
    border: "#e0e0e0",
    label: "Pending",
  },
};

export default function Performance({ agent, onNavigate }) {
  const [startDate, setStartDate] = useState(weekStart);
  const [endDate, setEndDate] = useState(today);
  const [data, setData] = useState(null);
  const [teamData, setTeamData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const isAgentRole = agent.role === "agent";

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    setError("");
    try {
      if (isAgentRole) {
        const res = await fetch(
          `${API_URL}/api/agents/performance/me?startDate=${startDate}&endDate=${endDate}`,
          { headers: getHeaders() },
        );
        const json = await res.json();
        if (!res.ok) throw new Error(json.error);
        setData(json);
      } else {
        const res = await fetch(
          `${API_URL}/api/agents/performance/team?startDate=${startDate}&endDate=${endDate}`,
          { headers: getHeaders() },
        );
        const json = await res.json();
        if (!res.ok) throw new Error(json.error);
        setTeamData(json);
      }
    } catch (err) {
      setError(err.message || "Failed to load performance data.");
    } finally {
      setLoading(false);
    }
  }

  const perf = data?.performance?.[period];
  const score = perf?.score || 0;
  const feedback = perf?.feedback;

  function ScoreRing({ score }) {
    const color =
      score >= 90
        ? "#1a7a40"
        : score >= 75
          ? "#2255cc"
          : score >= 60
            ? "#b36a00"
            : "#C0392B";
    return (
      <div
        style={{
          position: "relative",
          width: "120px",
          height: "120px",
          margin: "0 auto 16px",
        }}
      >
        <svg viewBox="0 0 120 120" style={{ transform: "rotate(-90deg)" }}>
          <circle
            cx="60"
            cy="60"
            r="50"
            fill="none"
            stroke="#f0f0f0"
            strokeWidth="10"
          />
          <circle
            cx="60"
            cy="60"
            r="50"
            fill="none"
            stroke={color}
            strokeWidth="10"
            strokeDasharray={`${(score / 100) * 314} 314`}
            strokeLinecap="round"
            style={{ transition: "stroke-dasharray 1s ease" }}
          />
        </svg>
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            textAlign: "center",
          }}
        >
          <p
            style={{
              fontSize: "28px",
              fontWeight: "700",
              color,
              lineHeight: 1,
            }}
          >
            {Math.round(score)}
          </p>
          <p style={{ fontSize: "11px", color: "#6b6b6b" }}>/ 100</p>
        </div>
      </div>
    );
  }

  function MetricBar({ label, value, target, unit = "%", color = "#C0392B" }) {
    const pct = Math.min(100, target ? (value / target) * 100 : value);
    return (
      <div style={{ marginBottom: "14px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: "5px",
          }}
        >
          <span style={{ fontSize: "13px", color: "#6b6b6b" }}>{label}</span>
          <span style={{ fontSize: "13px", fontWeight: "500" }}>
            {unit === "%"
              ? `${Math.round(value)}%`
              : `${Math.round(value * 10) / 10}${unit}`}
          </span>
        </div>
        <div
          style={{
            height: "6px",
            background: "#f0f0f0",
            borderRadius: "3px",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${pct}%`,
              background: color,
              borderRadius: "3px",
              transition: "width 0.8s ease",
            }}
          />
        </div>
      </div>
    );
  }

  function SLABadge({ status }) {
    const cfg = SLA_COLORS[status] || SLA_COLORS.pending;
    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "4px",
          padding: "3px 8px",
          borderRadius: "20px",
          fontSize: "11px",
          fontWeight: "500",
          background: cfg.bg,
          color: cfg.color,
          border: `1px solid ${cfg.border}`,
          whiteSpace: "nowrap",
        }}
      >
        <i
          className={`ti ${status === "on_track" ? "ti-circle-check" : status === "at_risk" ? "ti-alert-triangle" : status === "breached" ? "ti-circle-x" : "ti-clock"}`}
          style={{ fontSize: "11px" }}
        />
        {cfg.label}
      </span>
    );
  }

  if (loading)
    return (
      <div
        style={{
          padding: "24px",
          textAlign: "center",
          color: "#6b6b6b",
          marginTop: "60px",
        }}
      >
        <span
          className="spinner spinner-dark"
          style={{
            margin: "0 auto",
            display: "block",
            width: "28px",
            height: "28px",
          }}
        />
        <p style={{ marginTop: "12px", fontSize: "13px" }}>
          Loading performance data...
        </p>
      </div>
    );

  if (error)
    return (
      <div className="alert alert-error" style={{ margin: "24px" }}>
        <i
          className="ti ti-alert-circle"
          style={{ fontSize: "15px", flexShrink: 0 }}
        />
        {error}
      </div>
    );

  return (
    <div style={{ padding: "24px", maxWidth: "1100px", margin: "0 auto" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "24px",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        <div>
          <h1
            style={{ fontSize: "20px", fontWeight: "600", marginBottom: "4px" }}
          >
            {isAgentRole ? "My performance" : "Team performance"}
          </h1>
          <p style={{ fontSize: "13px", color: "#6b6b6b" }}>
            {isAgentRole
              ? "Track your progress and SLA compliance"
              : "Monitor your team's performance and SLA metrics"}
          </p>
        </div>
        <div
          style={{
            display: "flex",
            gap: "6px",
            background: "#f0f0f0",
            padding: "4px",
            borderRadius: "8px",
          }}
        >
          <div
            style={{
              display: "flex",
              gap: "10px",
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <div>
              <label
                style={{
                  fontSize: "12px",
                  color: "#6b6b6b",
                  display: "block",
                  marginBottom: "3px",
                }}
              >
                From
              </label>
              <input
                type="date"
                value={startDate}
                max={endDate}
                onChange={(e) => setStartDate(e.target.value)}
                style={{
                  padding: "8px 12px",
                  fontSize: "13px",
                  border: "1px solid #e0e0e0",
                  borderRadius: "6px",
                  background: "#fff",
                  color: "#1a1a1a",
                  outline: "none",
                  cursor: "pointer",
                }}
              />
            </div>
            <div>
              <label
                style={{
                  fontSize: "12px",
                  color: "#6b6b6b",
                  display: "block",
                  marginBottom: "3px",
                }}
              >
                To
              </label>
              <input
                type="date"
                value={endDate}
                min={startDate}
                max={today}
                onChange={(e) => setEndDate(e.target.value)}
                style={{
                  padding: "8px 12px",
                  fontSize: "13px",
                  border: "1px solid #e0e0e0",
                  borderRadius: "6px",
                  background: "#fff",
                  color: "#1a1a1a",
                  outline: "none",
                  cursor: "pointer",
                }}
              />
            </div>
            <div style={{ marginTop: "18px" }}>
              <button
                onClick={loadData}
                style={{
                  padding: "7px 14px",
                  background: "#C0392B",
                  color: "#fff",
                  border: "none",
                  borderRadius: "6px",
                  fontSize: "13px",
                  fontWeight: "500",
                  cursor: "pointer",
                }}
              >
                <i
                  className="ti ti-search"
                  style={{ fontSize: "14px", marginRight: "5px" }}
                />
                Apply
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── AGENT VIEW ── */}
      {isAgentRole && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "300px 1fr",
            gap: "20px",
          }}
        >
          {/* Score card */}
          <div
            style={{ display: "flex", flexDirection: "column", gap: "16px" }}
          >
            <div
              style={{
                background: "#fff",
                border: "1px solid #e8e8e8",
                borderRadius: "12px",
                padding: "24px",
                boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                textAlign: "center",
              }}
            >
              <p
                style={{
                  fontSize: "11px",
                  color: "#6b6b6b",
                  textTransform: "uppercase",
                  letterSpacing: "0.6px",
                  marginBottom: "16px",
                }}
              >
                Performance score
              </p>
              <ScoreRing score={score} />
              {feedback && (
                <>
                  <p style={{ fontSize: "22px", marginBottom: "6px" }}>
                    {feedback.badge}
                  </p>
                  <p
                    style={{
                      fontSize: "13px",
                      fontWeight: "500",
                      color: "#1a1a1a",
                      marginBottom: "8px",
                      lineHeight: 1.4,
                    }}
                  >
                    {feedback.message}
                  </p>
                </>
              )}
            </div>

            {/* Tips */}
            {feedback?.tips && (
              <div
                style={{
                  background: "#f0f4ff",
                  border: "1px solid #c0d0f5",
                  borderRadius: "12px",
                  padding: "16px",
                }}
              >
                <p
                  style={{
                    fontSize: "12px",
                    fontWeight: "500",
                    color: "#2255cc",
                    marginBottom: "10px",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                >
                  <i
                    className="ti ti-bulb"
                    style={{ fontSize: "13px", marginRight: "5px" }}
                  />
                  Tips to improve
                </p>
                {feedback.tips.map((tip, idx) => (
                  <div
                    key={idx}
                    style={{ display: "flex", gap: "8px", marginBottom: "8px" }}
                  >
                    <i
                      className="ti ti-arrow-right"
                      style={{
                        fontSize: "13px",
                        color: "#2255cc",
                        flexShrink: 0,
                        marginTop: "2px",
                      }}
                    />
                    <p
                      style={{
                        fontSize: "12px",
                        color: "#2255cc",
                        lineHeight: 1.5,
                      }}
                    >
                      {tip}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Metrics + tickets */}
          <div
            style={{ display: "flex", flexDirection: "column", gap: "16px" }}
          >
            {/* Stats grid */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: "12px",
              }}
            >
              {[
                {
                  label: "Assigned",
                  value: perf?.tickets_assigned || 0,
                  icon: "ti-file-text",
                  color: "#1a1a1a",
                },
                {
                  label: "Resolved",
                  value: perf?.tickets_resolved || 0,
                  icon: "ti-circle-check",
                  color: "#1a7a40",
                },
                {
                  label: "SLA met",
                  value: perf?.sla_met_count || 0,
                  icon: "ti-clock-check",
                  color: "#2255cc",
                },
                {
                  label: "Breached",
                  value: perf?.sla_breached_count || 0,
                  icon: "ti-alert-triangle",
                  color: "#C0392B",
                },
                {
                  label: "Avg resolve",
                  value: `${Math.round((perf?.avg_resolution_hours || 0) * 10) / 10}h`,
                  icon: "ti-hourglass",
                  color: "#b36a00",
                },
                {
                  label: "Avg response",
                  value: `${Math.round((perf?.avg_response_hours || 0) * 10) / 10}h`,
                  icon: "ti-messages",
                  color: "#7c3aed",
                },
              ].map((stat) => (
                <div
                  key={stat.label}
                  style={{
                    background: "#fff",
                    border: "1px solid #e8e8e8",
                    borderRadius: "10px",
                    padding: "14px",
                    boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
                  }}
                >
                  <i
                    className={`ti ${stat.icon}`}
                    style={{
                      fontSize: "18px",
                      color: stat.color,
                      marginBottom: "6px",
                      display: "block",
                    }}
                  />
                  <p
                    style={{
                      fontSize: "20px",
                      fontWeight: "600",
                      color: "#1a1a1a",
                      lineHeight: 1,
                    }}
                  >
                    {stat.value}
                  </p>
                  <p
                    style={{
                      fontSize: "11px",
                      color: "#6b6b6b",
                      marginTop: "3px",
                    }}
                  >
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>

            {/* Metric bars */}
            <div
              style={{
                background: "#fff",
                border: "1px solid #e8e8e8",
                borderRadius: "12px",
                padding: "20px",
                boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
              }}
            >
              <h3
                style={{
                  fontSize: "14px",
                  fontWeight: "500",
                  marginBottom: "16px",
                }}
              >
                Performance metrics
              </h3>
              {perf && (
                <>
                  <MetricBar
                    label="Resolution rate"
                    value={
                      perf.tickets_assigned > 0
                        ? (perf.tickets_resolved / perf.tickets_assigned) * 100
                        : 0
                    }
                    color="#1a7a40"
                  />
                  <MetricBar
                    label="SLA compliance"
                    value={
                      perf.sla_met_count + perf.sla_breached_count > 0
                        ? (perf.sla_met_count /
                            (perf.sla_met_count + perf.sla_breached_count)) *
                          100
                        : 100
                    }
                    color="#2255cc"
                  />
                  <MetricBar
                    label="Avg response time"
                    value={perf.avg_response_hours || 0}
                    target={data?.slaSettings?.responseHours || 4}
                    unit="h"
                    color="#b36a00"
                  />
                  <MetricBar
                    label="Avg resolution time"
                    value={perf.avg_resolution_hours || 0}
                    target={data?.slaSettings?.resolveHours || 48}
                    unit="h"
                    color="#7c3aed"
                  />
                </>
              )}
            </div>

            {/* Open tickets with SLA */}
            <div
              style={{
                background: "#fff",
                border: "1px solid #e8e8e8",
                borderRadius: "12px",
                overflow: "hidden",
                boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
              }}
            >
              <div
                style={{
                  padding: "16px 20px",
                  borderBottom: "1px solid #f0f0f0",
                }}
              >
                <h3 style={{ fontSize: "14px", fontWeight: "500" }}>
                  Open tickets — SLA status ({data?.openTickets?.length || 0})
                </h3>
              </div>
              {!data?.openTickets?.length ? (
                <div
                  style={{
                    padding: "24px",
                    textAlign: "center",
                    color: "#6b6b6b",
                    fontSize: "13px",
                  }}
                >
                  <i
                    className="ti ti-checks"
                    style={{
                      fontSize: "28px",
                      display: "block",
                      marginBottom: "8px",
                      opacity: 0.4,
                    }}
                  />
                  No open tickets!
                </div>
              ) : (
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    fontSize: "13px",
                  }}
                >
                  <thead>
                    <tr style={{ background: "#fafafa" }}>
                      {[
                        "Reference",
                        "Type",
                        "Assign SLA",
                        "Response SLA",
                        "Resolve SLA",
                        "Time left",
                      ].map((h) => (
                        <th
                          key={h}
                          style={{
                            padding: "10px 14px",
                            textAlign: "left",
                            fontWeight: "500",
                            color: "#6b6b6b",
                            borderBottom: "1px solid #f0f0f0",
                            whiteSpace: "nowrap",
                            fontSize: "12px",
                          }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.openTickets.map((ticket, idx) => (
                      <tr
                        key={ticket.id}
                        onClick={() => onNavigate("requestDetail", ticket.id)}
                        style={{
                          cursor: "pointer",
                          borderBottom:
                            idx < data.openTickets.length - 1
                              ? "1px solid #f0f0f0"
                              : "none",
                          transition: "background 0.1s",
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.background = "#fafafa")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.background = "transparent")
                        }
                      >
                        <td style={{ padding: "10px 14px" }}>
                          <span
                            style={{
                              fontFamily: "monospace",
                              fontSize: "12px",
                              color: "#C0392B",
                              fontWeight: "500",
                            }}
                          >
                            {ticket.reference_number}
                          </span>
                        </td>
                        <td style={{ padding: "10px 14px", color: "#6b6b6b" }}>
                          {ticket.request_type}
                        </td>
                        <td style={{ padding: "10px 14px" }}>
                          <SLABadge status={ticket.sla?.assign?.status} />
                        </td>
                        <td style={{ padding: "10px 14px" }}>
                          <SLABadge status={ticket.sla?.response?.status} />
                        </td>
                        <td style={{ padding: "10px 14px" }}>
                          <SLABadge status={ticket.sla?.resolve?.status} />
                        </td>
                        <td
                          style={{
                            padding: "10px 14px",
                            color: ticket.sla?.resolve?.breached
                              ? "#C0392B"
                              : "#6b6b6b",
                            fontWeight: ticket.sla?.resolve?.breached
                              ? "500"
                              : "400",
                            fontSize: "12px",
                          }}
                        >
                          {ticket.sla?.resolve?.breached
                            ? `Overdue by ${Math.round((ticket.sla.resolve.hours - ticket.sla.resolve.target) * 10) / 10}h`
                            : `${Math.round((ticket.sla.resolve.target - ticket.sla.resolve.hours) * 10) / 10}h left`}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── SUPERVISOR / ADMIN VIEW ── */}
      {!isAgentRole && teamData && (
        <div>
          <div
            style={{
              background: "#fff",
              border: "1px solid #e8e8e8",
              borderRadius: "12px",
              overflow: "hidden",
              boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
            }}
          >
            <div
              style={{
                padding: "16px 20px",
                borderBottom: "1px solid #f0f0f0",
              }}
            >
              <h3 style={{ fontSize: "14px", fontWeight: "500" }}>
                Team performance — {startDate} to {endDate}
              </h3>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: "13px",
                  minWidth: "800px",
                }}
              >
                <thead>
                  <tr
                    style={{
                      background: "#fafafa",
                      borderBottom: "1px solid #f0f0f0",
                    }}
                  >
                    {[
                      "Rank",
                      "Agent",
                      "Score",
                      "Assigned",
                      "Resolved",
                      "SLA Met",
                      "SLA Breached",
                      "Avg Resolve",
                      "Avg Response",
                      "Rating",
                    ].map((h) => (
                      <th
                        key={h}
                        style={{
                          padding: "10px 14px",
                          textAlign: "left",
                          fontWeight: "500",
                          color: "#6b6b6b",
                          whiteSpace: "nowrap",
                          fontSize: "12px",
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {teamData.team.map((member, idx) => {
                    const p = member.performance;
                    const score = p?.score || 0;
                    const color =
                      score >= 90
                        ? "#1a7a40"
                        : score >= 75
                          ? "#2255cc"
                          : score >= 60
                            ? "#b36a00"
                            : "#C0392B";
                    const medal =
                      idx === 0
                        ? "🥇"
                        : idx === 1
                          ? "🥈"
                          : idx === 2
                            ? "🥉"
                            : `#${idx + 1}`;

                    return (
                      <tr
                        key={member.agent.id}
                        style={{
                          borderBottom:
                            idx < teamData.team.length - 1
                              ? "1px solid #f0f0f0"
                              : "none",
                        }}
                      >
                        <td style={{ padding: "12px 14px", fontSize: "16px" }}>
                          {medal}
                        </td>
                        <td style={{ padding: "12px 14px" }}>
                          <p style={{ fontWeight: "500", marginBottom: "2px" }}>
                            {member.agent.full_name}
                          </p>
                          <p style={{ fontSize: "11px", color: "#6b6b6b" }}>
                            {member.agent.email}
                          </p>
                        </td>
                        <td style={{ padding: "12px 14px" }}>
                          <span
                            style={{
                              fontSize: "18px",
                              fontWeight: "700",
                              color,
                            }}
                          >
                            {Math.round(score)}
                          </span>
                          <span style={{ fontSize: "11px", color: "#6b6b6b" }}>
                            /100
                          </span>
                        </td>
                        <td style={{ padding: "12px 14px" }}>
                          {p?.tickets_assigned || 0}
                        </td>
                        <td
                          style={{
                            padding: "12px 14px",
                            color: "#1a7a40",
                            fontWeight: "500",
                          }}
                        >
                          {p?.tickets_resolved || 0}
                        </td>
                        <td
                          style={{
                            padding: "12px 14px",
                            color: "#2255cc",
                            fontWeight: "500",
                          }}
                        >
                          {p?.sla_met_count || 0}
                        </td>
                        <td
                          style={{
                            padding: "12px 14px",
                            color: "#C0392B",
                            fontWeight: "500",
                          }}
                        >
                          {p?.sla_breached_count || 0}
                        </td>
                        <td style={{ padding: "12px 14px", color: "#6b6b6b" }}>
                          {Math.round((p?.avg_resolution_hours || 0) * 10) / 10}
                          h
                        </td>
                        <td style={{ padding: "12px 14px", color: "#6b6b6b" }}>
                          {Math.round((p?.avg_response_hours || 0) * 10) / 10}h
                        </td>
                        <td style={{ padding: "12px 14px" }}>
                          {member.feedback && (
                            <span
                              title={member.feedback.message}
                              style={{ cursor: "help" }}
                            >
                              {member.feedback.badge}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {teamData.team.length === 0 && (
                    <tr>
                      <td
                        colSpan={10}
                        style={{
                          padding: "32px",
                          textAlign: "center",
                          color: "#6b6b6b",
                        }}
                      >
                        No agent performance data for this period yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
