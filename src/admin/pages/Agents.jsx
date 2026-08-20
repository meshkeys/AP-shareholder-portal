import React, { useState, useEffect } from "react";
import {
  getAgents,
  createAgent,
  updateAgent,
  deactivateAgent,
  resetAgentPassword,
} from "../services/adminApi";

export default function Agents({ agent }) {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [resetId, setResetId] = useState(null);
  const [newPass, setNewPass] = useState("");
  const [resetting, setResetting] = useState(false);

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    role: "agent",
  });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadAgents();
  }, []);

  async function loadAgents() {
    setLoading(true);
    try {
      const res = await getAgents();
      setAgents(res.agents || []);
    } catch (err) {
      setError(err.message || "Failed to load agents.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e) {
    e.preventDefault();
    if (!form.fullName || !form.email || !form.password) {
      setError("All fields are required.");
      return;
    }
    setCreating(true);
    try {
      await createAgent(form.fullName, form.email, form.password, form.role);
      setSuccessMsg("Agent created successfully.");
      setShowForm(false);
      setForm({ fullName: "", email: "", password: "", role: "agent" });
      loadAgents();
    } catch (err) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  }

  async function handleDeactivate(agentId, isActive) {
    if (
      !window.confirm(
        `Are you sure you want to ${isActive ? "deactivate" : "reactivate"} this agent?`,
      )
    )
      return;
    try {
      if (isActive) {
        await deactivateAgent(agentId);
      } else {
        await updateAgent(agentId, { isActive: true });
      }
      setSuccessMsg(
        `Agent ${isActive ? "deactivated" : "reactivated"} successfully.`,
      );
      loadAgents();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDelete(agentId, agentName) {
    if (
      !window.confirm(
        `Are you sure you want to permanently delete ${agentName}? This action cannot be undone.`,
      )
    )
      return;
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/agents/${agentId}/delete`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
          },
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSuccessMsg(`${agentName} has been permanently deleted.`);
      loadAgents();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleResetPassword() {
    if (!newPass.trim()) {
      setError("New password is required.");
      return;
    }
    setResetting(true);
    try {
      await resetAgentPassword(resetId, newPass);
      setSuccessMsg("Password reset successfully.");
      setResetId(null);
      setNewPass("");
    } catch (err) {
      setError(err.message);
    } finally {
      setResetting(false);
    }
  }

  const roleColors = {
    admin: "#C0392B",
    lead_supervisor: "#7c3aed",
    supervisor: "#2255cc",
    agent: "#1a7a40",
  };

  const inputStyle = {
    width: "100%",
    padding: "9px 12px",
    fontSize: "14px",
    border: "1px solid #e0e0e0",
    borderRadius: "8px",
    background: "#fff",
    color: "#1a1a1a",
    outline: "none",
  };

  return (
    <div style={{ padding: "24px", maxWidth: "1000px", margin: "0 auto" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "24px",
        }}
      >
        <div>
          <h1
            style={{ fontSize: "20px", fontWeight: "600", marginBottom: "4px" }}
          >
            Agents
          </h1>
          <p style={{ fontSize: "13px", color: "#6b6b6b" }}>
            {agents.length} agent{agents.length !== 1 ? "s" : ""} registered
          </p>
        </div>
        {agent.role === "admin" && (
          <button
            className="btn-primary"
            style={{ width: "auto", padding: "8px 16px" }}
            onClick={() => setShowForm((prev) => !prev)}
          >
            <i className="ti ti-plus" style={{ fontSize: "15px" }} />
            {showForm ? "Cancel" : "Add agent"}
          </button>
        )}
      </div>

      {/* Success */}
      {successMsg && (
        <div className="alert alert-success" style={{ marginBottom: "16px" }}>
          <i
            className="ti ti-circle-check"
            style={{ fontSize: "15px", flexShrink: 0 }}
          />
          {successMsg}
          <button
            onClick={() => setSuccessMsg("")}
            style={{
              marginLeft: "auto",
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#1a7a40",
            }}
          >
            <i className="ti ti-x" style={{ fontSize: "14px" }} />
          </button>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="alert alert-error" style={{ marginBottom: "16px" }}>
          <i
            className="ti ti-alert-circle"
            style={{ fontSize: "15px", flexShrink: 0 }}
          />
          {error}
          <button
            onClick={() => setError("")}
            style={{
              marginLeft: "auto",
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#C0392B",
            }}
          >
            <i className="ti ti-x" style={{ fontSize: "14px" }} />
          </button>
        </div>
      )}

      {/* Add agent form */}
      {showForm && (
        <div
          style={{
            background: "#fff",
            border: "1px solid #e8e8e8",
            borderRadius: "12px",
            padding: "20px",
            marginBottom: "20px",
            boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
          }}
        >
          <h3
            style={{
              fontSize: "15px",
              fontWeight: "500",
              marginBottom: "16px",
            }}
          >
            <i
              className="ti ti-user-plus"
              style={{ fontSize: "16px", marginRight: "6px", color: "#C0392B" }}
            />
            Add new agent
          </h3>
          <form onSubmit={handleCreate} noValidate>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "14px",
                marginBottom: "14px",
              }}
            >
              <div>
                <label
                  style={{
                    fontSize: "13px",
                    color: "#6b6b6b",
                    marginBottom: "5px",
                    display: "block",
                  }}
                >
                  Full name
                </label>
                <input
                  type="text"
                  value={form.fullName}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, fullName: e.target.value }))
                  }
                  placeholder="Agent full name"
                  style={inputStyle}
                  disabled={creating}
                />
              </div>
              <div>
                <label
                  style={{
                    fontSize: "13px",
                    color: "#6b6b6b",
                    marginBottom: "5px",
                    display: "block",
                  }}
                >
                  Email address
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, email: e.target.value }))
                  }
                  placeholder="agent@company.com"
                  style={inputStyle}
                  disabled={creating}
                />
              </div>
              <div>
                <label
                  style={{
                    fontSize: "13px",
                    color: "#6b6b6b",
                    marginBottom: "5px",
                    display: "block",
                  }}
                >
                  Password
                </label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, password: e.target.value }))
                  }
                  placeholder="Temporary password"
                  style={inputStyle}
                  disabled={creating}
                />
              </div>
              <div>
                <label
                  style={{
                    fontSize: "13px",
                    color: "#6b6b6b",
                    marginBottom: "5px",
                    display: "block",
                  }}
                >
                  Role
                </label>
                <select
                  value={form.role}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, role: e.target.value }))
                  }
                  style={inputStyle}
                  disabled={creating}
                >
                  <option value="agent">Agent</option>
                  <option value="supervisor">Supervisor</option>
                  <option value="lead_supervisor">Lead Supervisor</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
            <button
              type="submit"
              className="btn-primary"
              style={{ width: "auto", padding: "8px 16px" }}
              disabled={creating}
            >
              {creating ? (
                <>
                  <span className="spinner" /> Creating...
                </>
              ) : (
                <>
                  <i className="ti ti-user-plus" style={{ fontSize: "15px" }} />{" "}
                  Create agent
                </>
              )}
            </button>
          </form>
        </div>
      )}

      {/* Reset password modal */}
      {resetId && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: "12px",
              padding: "24px",
              width: "400px",
              boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
            }}
          >
            <h3
              style={{
                fontSize: "16px",
                fontWeight: "500",
                marginBottom: "16px",
              }}
            >
              Reset password
            </h3>
            <label
              style={{
                fontSize: "13px",
                color: "#6b6b6b",
                marginBottom: "5px",
                display: "block",
              }}
            >
              New password
            </label>
            <input
              type="password"
              value={newPass}
              onChange={(e) => setNewPass(e.target.value)}
              placeholder="Enter new password"
              style={{ ...inputStyle, marginBottom: "16px" }}
            />
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                className="btn-primary"
                style={{ flex: 1 }}
                onClick={handleResetPassword}
                disabled={resetting}
              >
                {resetting ? (
                  <>
                    <span className="spinner" /> Resetting...
                  </>
                ) : (
                  "Reset password"
                )}
              </button>
              <button
                className="btn-ghost"
                style={{ flex: 1 }}
                onClick={() => {
                  setResetId(null);
                  setNewPass("");
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Agents table */}
      <div
        style={{
          background: "#fff",
          border: "1px solid #e8e8e8",
          borderRadius: "12px",
          overflow: "hidden",
          boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
        }}
      >
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: "13px",
          }}
        >
          <thead>
            <tr
              style={{
                background: "#fafafa",
                borderBottom: "1px solid #f0f0f0",
              }}
            >
              {["Agent", "Role", "Status", "Joined", "Actions"].map((col) => (
                <th
                  key={col}
                  style={{
                    padding: "12px 16px",
                    textAlign: "left",
                    fontWeight: "500",
                    color: "#6b6b6b",
                    whiteSpace: "nowrap",
                  }}
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 5 }).map((_, j) => (
                    <td key={j} style={{ padding: "14px 16px" }}>
                      <div
                        style={{
                          height: "14px",
                          background: "#f0f0f0",
                          borderRadius: "4px",
                          width: j === 0 ? "140px" : "80px",
                        }}
                      />
                    </td>
                  ))}
                </tr>
              ))
            ) : agents.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  style={{
                    padding: "40px",
                    textAlign: "center",
                    color: "#6b6b6b",
                  }}
                >
                  No agents found
                </td>
              </tr>
            ) : (
              agents.map((a, idx) => (
                <tr
                  key={a.id}
                  style={{
                    borderBottom:
                      idx < agents.length - 1 ? "1px solid #f0f0f0" : "none",
                  }}
                >
                  <td style={{ padding: "14px 16px" }}>
                    <p style={{ fontWeight: "500", marginBottom: "2px" }}>
                      {a.full_name}
                    </p>
                    <p style={{ fontSize: "12px", color: "#6b6b6b" }}>
                      {a.email}
                    </p>
                  </td>
                  <td style={{ padding: "14px 16px" }}>
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        padding: "3px 10px",
                        borderRadius: "20px",
                        fontSize: "12px",
                        fontWeight: "500",
                        background: `${roleColors[a.role]}15`,
                        color: roleColors[a.role],
                        textTransform: "capitalize",
                      }}
                    >
                      {a.role}
                    </span>
                  </td>
                  <td style={{ padding: "14px 16px" }}>
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                        padding: "3px 10px",
                        borderRadius: "20px",
                        fontSize: "12px",
                        fontWeight: "500",
                        background: a.is_active ? "#f0faf4" : "#fafafa",
                        color: a.is_active ? "#1a7a40" : "#6b6b6b",
                        border: `1px solid ${a.is_active ? "#a8dfc0" : "#e8e8e8"}`,
                      }}
                    >
                      <i
                        className={`ti ${a.is_active ? "ti-circle-check" : "ti-circle-x"}`}
                        style={{ fontSize: "12px" }}
                      />
                      {a.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td
                    style={{
                      padding: "14px 16px",
                      color: "#6b6b6b",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {new Date(a.created_at).toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                  <td style={{ padding: "14px 16px" }}>
                    {agent.role === "admin" && a.id !== agent.id && (
                      <div style={{ display: "flex", gap: "8px" }}>
                        <button
                          onClick={() => setResetId(a.id)}
                          style={{
                            fontSize: "12px",
                            color: "#2255cc",
                            background: "none",
                            border: "1px solid #c0d0f5",
                            borderRadius: "6px",
                            padding: "4px 10px",
                            cursor: "pointer",
                          }}
                        >
                          Reset password
                        </button>
                        <button
                          onClick={() => handleDeactivate(a.id, a.is_active)}
                          style={{
                            fontSize: "12px",
                            color: a.is_active ? "#C0392B" : "#1a7a40",
                            background: "none",
                            border: `1px solid ${a.is_active ? "#e8b4af" : "#a8dfc0"}`,
                            borderRadius: "6px",
                            padding: "4px 10px",
                            cursor: "pointer",
                          }}
                        >
                          {a.is_active ? "Deactivate" : "Reactivate"}
                        </button>
                        <button
                          onClick={() => handleDelete(a.id, a.full_name)}
                          style={{
                            fontSize: "12px",
                            color: "#C0392B",
                            background: "#fdf1f0",
                            border: "1px solid #e8b4af",
                            borderRadius: "6px",
                            padding: "4px 10px",
                            cursor: "pointer",
                          }}
                        >
                          <i
                            className="ti ti-trash"
                            style={{ fontSize: "12px", marginRight: "3px" }}
                          />
                          Delete
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
