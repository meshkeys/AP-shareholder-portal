import React, { useState, useEffect } from "react";
import StatCard from "../components/StatCard";
import { StatusBadge, TypeBadge } from "../components/StatusBadge";
import { getStats, getAgentWorkload, getRequests } from "../services/adminApi";

export default function Dashboard({ agent, onNavigate }) {
  const [stats, setStats] = useState(null);
  const [workload, setWorkload] = useState([]);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [statsRes, recentRes] = await Promise.all([
        getStats(),
        getRequests({ limit: 5 }),
      ]);
      setStats(statsRes.stats);
      setRecent(recentRes.requests || []);

      if (["admin", "supervisor"].includes(agent.role)) {
        const workloadRes = await getAgentWorkload();
        setWorkload(workloadRes.workload || []);
      }
    } catch (err) {
      setError(err.message || "Failed to load dashboard data.");
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <LoadingState />;

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
    <div style={{ padding: "24px", maxWidth: "1200px", margin: "0 auto" }}>
      {/* Welcome */}
      <div style={{ marginBottom: "24px" }}>
        <h1
          style={{ fontSize: "20px", fontWeight: "600", marginBottom: "4px" }}
        >
          Welcome back, {agent.fullName} 👋
        </h1>
        <p style={{ fontSize: "13px", color: "#6b6b6b" }}>
          Here's what's happening with your requests today.
        </p>
      </div>

      {/* Stats grid */}
      {stats && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "16px",
            marginBottom: "28px",
          }}
        >
          <StatCard
            label="Total requests"
            value={stats.total}
            icon="ti-file-text"
            color="#1a1a1a"
          />
          <StatCard
            label="Pending"
            value={stats.pending}
            icon="ti-clock"
            color="#b36a00"
            subLabel="Awaiting assignment"
          />
          <StatCard
            label="Open"
            value={stats.open}
            icon="ti-loader"
            color="#0077b6"
            subLabel="Being processed"
          />
          <StatCard
            label="Waiting on Customer"
            value={stats.waitingOnCustomer}
            icon="ti-clock-pause"
            color="#b36a00"
            subLabel="Awaiting shareholder response"
          />
          <StatCard
            label="Completed"
            value={stats.completed}
            icon="ti-circle-check"
            color="#1a7a40"
            subLabel="Successfully resolved"
          />
          <StatCard
            label="Rejected"
            value={stats.rejected}
            icon="ti-circle-x"
            color="#C0392B"
            subLabel="Could not be processed"
          />
          <StatCard
            label="Closed"
            value={stats.closed}
            icon="ti-lock"
            color="#6b6b6b"
            subLabel="Ticket closed"
          />
        </div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: agent.role === "agent" ? "1fr" : "1fr 1fr",
          gap: "20px",
        }}
      >
        {/* Recent requests */}
        <div
          style={{
            background: "var(--admin-card)",
            border: "1px solid var(--admin-card-border)",
            borderRadius: "12px",
            overflow: "hidden",
            boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
          }}
        >
          <div
            style={{
              padding: "16px 20px",
              borderBottom: "1px solid #f0f0f0",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <h3 style={{ fontSize: "14px", fontWeight: "500" }}>
              Recent requests
            </h3>
            <button
              onClick={() => onNavigate("requests")}
              style={{
                fontSize: "12px",
                color: "#C0392B",
                background: "none",
                border: "none",
                cursor: "pointer",
                fontWeight: "500",
              }}
            >
              View all
            </button>
          </div>
          <div>
            {recent.length === 0 ? (
              <div
                style={{
                  padding: "32px",
                  textAlign: "center",
                  color: "#6b6b6b",
                  fontSize: "13px",
                }}
              >
                No requests yet
              </div>
            ) : (
              recent.map((req, idx) => (
                <div
                  key={req.id}
                  style={{
                    padding: "12px 20px",
                    borderBottom:
                      idx < recent.length - 1 ? "1px solid #f0f0f0" : "none",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "12px",
                    cursor: "pointer",
                  }}
                  onClick={() => onNavigate("requestDetail", req.id)}
                >
                  <div style={{ minWidth: 0 }}>
                    <p
                      style={{
                        fontSize: "13px",
                        fontWeight: "500",
                        marginBottom: "3px",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {req.shareholder_name}
                    </p>
                    <p style={{ fontSize: "12px", color: "#6b6b6b" }}>
                      {req.reference_number}
                    </p>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "flex-end",
                      gap: "4px",
                      flexShrink: 0,
                    }}
                  >
                    <StatusBadge status={req.status} />
                    <TypeBadge type={req.request_type} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Request types breakdown */}
        {stats && (
          <div
            style={{
              background: "var(--admin-card)",
              border: "1px solid var(--admin-card-border)",
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
                Requests by type
              </h3>
            </div>
            <div style={{ padding: "8px 0" }}>
              {Object.entries(stats.byType).map(([type, count]) => (
                <div
                  key={type}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "10px 20px",
                  }}
                >
                  <TypeBadge type={type} />
                  <span
                    style={{
                      fontSize: "14px",
                      fontWeight: "600",
                      color: "#1a1a1a",
                    }}
                  >
                    {count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Agent workload — supervisors and admins only */}
      {["admin", "supervisor"].includes(agent.role) && workload.length > 0 && (
        <div
          style={{
            background: "var(--admin-card)",
            border: "1px solid var(--admin-card-border)",
            borderRadius: "12px",
            overflow: "hidden",
            boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
            marginTop: "20px",
          }}
        >
          <div
            style={{
              padding: "16px 20px",
              borderBottom: "1px solid #f0f0f0",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <h3 style={{ fontSize: "14px", fontWeight: "500" }}>
              Agent workload
            </h3>
            <button
              onClick={() => onNavigate("agents")}
              style={{
                fontSize: "12px",
                color: "#C0392B",
                background: "none",
                border: "none",
                cursor: "pointer",
                fontWeight: "500",
              }}
            >
              Manage agents
            </button>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "13px",
                minWidth: "600px",
              }}
            >
              <thead>
                <tr style={{ background: "#fafafa" }}>
                  {[
                    "Agent",
                    "Open",
                    "Waiting on Customer",
                    "Completed",
                    "Rejected",
                    "Closed",
                    "Total",
                  ].map((col) => (
                    <th
                      key={col}
                      style={{
                        padding: "10px 16px",
                        textAlign: "left",
                        fontWeight: "500",
                        color: "#6b6b6b",
                        borderBottom: "1px solid #f0f0f0",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {workload.map((w, idx) => (
                  <tr
                    key={w.agent.id}
                    style={{
                      borderBottom:
                        idx < workload.length - 1
                          ? "1px solid #f0f0f0"
                          : "none",
                    }}
                  >
                    <td style={{ padding: "12px 16px" }}>
                      <p style={{ fontWeight: "500", marginBottom: "2px" }}>
                        {w.agent.full_name}
                      </p>
                      <p style={{ fontSize: "12px", color: "#6b6b6b" }}>
                        {w.agent.email}
                      </p>
                    </td>
                    <td
                      style={{
                        padding: "12px 16px",
                        color: "#0077b6",
                        fontWeight: "500",
                      }}
                    >
                      {w.open}
                    </td>
                    <td
                      style={{
                        padding: "12px 16px",
                        color: "#b36a00",
                        fontWeight: "500",
                      }}
                    >
                      {w.waitingOnCustomer}
                    </td>
                    <td
                      style={{
                        padding: "12px 16px",
                        color: "#1a7a40",
                        fontWeight: "500",
                      }}
                    >
                      {w.completed}
                    </td>
                    <td
                      style={{
                        padding: "12px 16px",
                        color: "#C0392B",
                        fontWeight: "500",
                      }}
                    >
                      {w.rejected}
                    </td>
                    <td
                      style={{
                        padding: "12px 16px",
                        color: "#6b6b6b",
                        fontWeight: "500",
                      }}
                    >
                      {w.closed}
                    </td>
                    <td style={{ padding: "12px 16px", fontWeight: "600" }}>
                      {w.total}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function LoadingState() {
  return (
    <div style={{ padding: "24px", maxWidth: "1200px", margin: "0 auto" }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "16px",
          marginBottom: "28px",
        }}
      >
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            style={{
              background: "var(--admin-card)",
              border: "1px solid var(--admin-card-border)",
              borderRadius: "12px",
              padding: "20px",
              height: "90px",
              animation: "pulse 1.5s infinite",
            }}
          />
        ))}
      </div>
    </div>
  );
}
