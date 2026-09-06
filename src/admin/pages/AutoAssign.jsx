import React, { useState, useEffect } from "react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

function getHeaders() {
  const token = localStorage.getItem("adminToken");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

const REQUEST_TYPES = [
  { value: "nameChange", label: "Name Change" },
  { value: "kycUpdate", label: "KYC Update" },
  { value: "addressUpdate", label: "Address Update" },
  { value: "signatureUpdate", label: "Signature Update" },
  { value: "nubanChange", label: "NUBAN Change" },
];

const SCHEDULE_TYPES = [
  { value: "daily", label: "Once daily" },
  { value: "hourly", label: "Every X hours" },
  { value: "minutely", label: "Every X minutes" },
];

export default function AutoAssign({ agent }) {
  const [settings, setSettings] = useState(null);
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [settingsRes, agentsRes] = await Promise.all([
        fetch(`${API_URL}/api/auto-assign/settings`, { headers: getHeaders() }),
        fetch(`${API_URL}/api/auto-assign/agents`, { headers: getHeaders() }),
      ]);
      const settingsJson = await settingsRes.json();
      const agentsJson = await agentsRes.json();
      if (!settingsRes.ok) throw new Error(settingsJson.error);
      if (!agentsRes.ok) throw new Error(agentsJson.error);
      setSettings(settingsJson.settings);
      setAgents(agentsJson.agents || []);
    } catch (err) {
      setError(err.message || "Failed to load auto-assign settings.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveSettings() {
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/api/auto-assign/settings`, {
        method: "PATCH",
        headers: getHeaders(),
        body: JSON.stringify({
          isActive: settings.is_active,
          ticketsPerAgent: settings.tickets_per_agent,
          scheduleType: settings.schedule_type,
          scheduleTime: settings.schedule_time,
          scheduleValue: settings.schedule_value,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setSettings(json.settings);
      setSuccessMsg("Settings saved successfully.");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleAgent(agentId, isEnabled) {
    try {
      const res = await fetch(`${API_URL}/api/auto-assign/agents/${agentId}`, {
        method: "PATCH",
        headers: getHeaders(),
        body: JSON.stringify({ isEnabled }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setAgents((prev) =>
        prev.map((a) =>
          a.id === agentId
            ? { ...a, autoAssign: { ...a.autoAssign, isEnabled } }
            : a,
        ),
      );
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleUpdateTypes(agentId, requestTypes) {
    try {
      const res = await fetch(`${API_URL}/api/auto-assign/agents/${agentId}`, {
        method: "PATCH",
        headers: getHeaders(),
        body: JSON.stringify({ requestTypes }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setAgents((prev) =>
        prev.map((a) =>
          a.id === agentId
            ? { ...a, autoAssign: { ...a.autoAssign, requestTypes } }
            : a,
        ),
      );
    } catch (err) {
      setError(err.message);
    }
  }

  function handleTypeToggle(agentId, type, currentTypes) {
    const newTypes = currentTypes.includes(type)
      ? currentTypes.filter((t) => t !== type)
      : [...currentTypes, type];
    handleUpdateTypes(agentId, newTypes);
  }

  function handleSelectAll(agentId, currentTypes) {
    const allTypes = REQUEST_TYPES.map((t) => t.value);
    const allSelected = currentTypes.length === allTypes.length;
    handleUpdateTypes(agentId, allSelected ? [] : allTypes);
  }

  async function handleRunNow() {
    setRunning(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/api/auto-assign/run`, {
        method: "POST",
        headers: getHeaders(),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setSuccessMsg(json.message || "Auto-assign completed successfully.");
      loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setRunning(false);
    }
  }

  const inputStyle = {
    padding: "8px 12px",
    fontSize: "13px",
    border: "1px solid #e0e0e0",
    borderRadius: "8px",
    background: "var(--admin-card)",
    color: "#1a1a1a",
    outline: "none",
  };

  if (loading)
    return (
      <div style={{ padding: "24px", textAlign: "center", marginTop: "60px" }}>
        <span
          className="spinner spinner-dark"
          style={{
            margin: "0 auto",
            display: "block",
            width: "28px",
            height: "28px",
          }}
        />
      </div>
    );

  return (
    <div style={{ padding: "24px", maxWidth: "900px", margin: "0 auto" }}>
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
            Auto-assign
          </h1>
          <p style={{ fontSize: "13px", color: "#6b6b6b" }}>
            Automatically assign incoming tickets to agents based on rules.
          </p>
        </div>
        <button
          onClick={handleRunNow}
          disabled={running}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            padding: "9px 16px",
            background: "#1a7a40",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            fontSize: "13px",
            fontWeight: "500",
            cursor: "pointer",
          }}
        >
          {running ? (
            <>
              <span className="spinner" /> Running...
            </>
          ) : (
            <>
              <i className="ti ti-player-play" style={{ fontSize: "15px" }} />{" "}
              Run auto-assign now
            </>
          )}
        </button>
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

      {/* Global settings */}
      {settings && (
        <div
          style={{
            background: "var(--admin-card)",
            border: "1px solid var(--admin-card-border)",
            borderRadius: "12px",
            padding: "20px",
            marginBottom: "20px",
            boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "20px",
            }}
          >
            <div>
              <h2
                style={{
                  fontSize: "15px",
                  fontWeight: "500",
                  marginBottom: "4px",
                }}
              >
                <i
                  className="ti ti-settings"
                  style={{
                    fontSize: "16px",
                    marginRight: "8px",
                    color: "#C0392B",
                  }}
                />
                Global settings
              </h2>
              <p style={{ fontSize: "12px", color: "#6b6b6b" }}>
                {settings.last_run_at
                  ? `Last run: ${new Date(settings.last_run_at).toLocaleString("en-GB")}`
                  : "Never run yet"}
              </p>
            </div>

            {/* Master toggle */}
            <div
              onClick={() =>
                setSettings((prev) => ({ ...prev, is_active: !prev.is_active }))
              }
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                cursor: "pointer",
                padding: "10px 14px",
                background: settings.is_active ? "#f0faf4" : "#fafafa",
                borderRadius: "8px",
                border: `1px solid ${settings.is_active ? "#a8dfc0" : "#e8e8e8"}`,
              }}
            >
              <p
                style={{
                  fontSize: "13px",
                  fontWeight: "500",
                  color: settings.is_active ? "#1a7a40" : "#6b6b6b",
                }}
              >
                {settings.is_active
                  ? "Auto-assign enabled"
                  : "Auto-assign disabled"}
              </p>
              <div
                style={{
                  width: "40px",
                  height: "22px",
                  borderRadius: "11px",
                  background: settings.is_active ? "#1a7a40" : "#d0d0d0",
                  position: "relative",
                  transition: "background 0.2s",
                  flexShrink: 0,
                }}
              >
                <div
                  style={{
                    width: "16px",
                    height: "16px",
                    borderRadius: "50%",
                    background: "var(--admin-card)",
                    position: "absolute",
                    top: "3px",
                    left: settings.is_active ? "21px" : "3px",
                    transition: "left 0.2s",
                  }}
                />
              </div>
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: "16px",
              marginBottom: "20px",
            }}
          >
            {/* Tickets per agent */}
            <div>
              <label
                style={{
                  fontSize: "12px",
                  color: "#6b6b6b",
                  marginBottom: "5px",
                  display: "block",
                }}
              >
                Tickets per agent per run
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={settings.tickets_per_agent}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    tickets_per_agent: parseInt(e.target.value),
                  }))
                }
                style={{ ...inputStyle, width: "100%" }}
              />
            </div>

            {/* Schedule type */}
            <div>
              <label
                style={{
                  fontSize: "12px",
                  color: "#6b6b6b",
                  marginBottom: "5px",
                  display: "block",
                }}
              >
                Schedule frequency
              </label>
              <select
                value={settings.schedule_type}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    schedule_type: e.target.value,
                  }))
                }
                style={{ ...inputStyle, width: "100%" }}
              >
                {SCHEDULE_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Schedule time — daily */}
            {settings.schedule_type === "daily" && (
              <div>
                <label
                  style={{
                    fontSize: "12px",
                    color: "#6b6b6b",
                    marginBottom: "5px",
                    display: "block",
                  }}
                >
                  Run time
                </label>
                <input
                  type="time"
                  value={settings.schedule_time}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      schedule_time: e.target.value,
                    }))
                  }
                  style={{ ...inputStyle, width: "100%" }}
                />
              </div>
            )}

            {/* Schedule value — hourly/minutely */}
            {["hourly", "minutely"].includes(settings.schedule_type) && (
              <div>
                <label
                  style={{
                    fontSize: "12px",
                    color: "#6b6b6b",
                    marginBottom: "5px",
                    display: "block",
                  }}
                >
                  {settings.schedule_type === "hourly"
                    ? "Every X hours"
                    : "Every X minutes"}
                </label>
                <input
                  type="number"
                  min="1"
                  value={settings.schedule_value}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      schedule_value: parseInt(e.target.value),
                    }))
                  }
                  style={{ ...inputStyle, width: "100%" }}
                />
              </div>
            )}
          </div>

          <button
            className="btn-primary"
            style={{ width: "auto", padding: "8px 20px" }}
            onClick={handleSaveSettings}
            disabled={saving}
          >
            {saving ? (
              <>
                <span className="spinner" /> Saving...
              </>
            ) : (
              <>
                <i
                  className="ti ti-device-floppy"
                  style={{ fontSize: "15px" }}
                />{" "}
                Save settings
              </>
            )}
          </button>
        </div>
      )}

      {/* Agent cards */}
      <div>
        <h2
          style={{ fontSize: "15px", fontWeight: "500", marginBottom: "4px" }}
        >
          <i
            className="ti ti-users"
            style={{ fontSize: "16px", marginRight: "8px", color: "#C0392B" }}
          />
          Agent configuration
        </h2>
        <p style={{ fontSize: "12px", color: "#6b6b6b", marginBottom: "16px" }}>
          Toggle auto-assign on or off per agent and select which ticket types
          they should receive.
        </p>

        {agents.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "40px",
              color: "#6b6b6b",
              background: "var(--admin-card)",
              borderRadius: "12px",
              border: "1px solid var(--admin-card-border)",
            }}
          >
            <i
              className="ti ti-users-off"
              style={{
                fontSize: "32px",
                display: "block",
                marginBottom: "8px",
                opacity: 0.4,
              }}
            />
            No active agents found.
          </div>
        ) : (
          <div
            style={{ display: "flex", flexDirection: "column", gap: "12px" }}
          >
            {agents.map((a) => (
              <div
                key={a.id}
                style={{
                  background: "var(--admin-card)",
                  border: `1px solid ${a.autoAssign.isEnabled ? "#a8dfc0" : "#e8e8e8"}`,
                  borderRadius: "12px",
                  overflow: "hidden",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                  transition: "border-color 0.2s",
                }}
              >
                {/* Agent header */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "16px 20px",
                    background: a.autoAssign.isEnabled ? "#f0faf4" : "#fff",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                    }}
                  >
                    <div
                      style={{
                        width: "38px",
                        height: "38px",
                        borderRadius: "50%",
                        background: a.autoAssign.isEnabled
                          ? "#1a7a40"
                          : "#e8e8e8",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: a.autoAssign.isEnabled ? "#fff" : "#6b6b6b",
                        fontSize: "14px",
                        fontWeight: "600",
                        flexShrink: 0,
                      }}
                    >
                      {a.full_name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p
                        style={{
                          fontSize: "14px",
                          fontWeight: "500",
                          color: "#1a1a1a",
                          marginBottom: "2px",
                        }}
                      >
                        {a.full_name}
                      </p>
                      <p style={{ fontSize: "12px", color: "#6b6b6b" }}>
                        {a.email}
                      </p>
                    </div>
                  </div>

                  {/* Toggle */}
                  <div
                    onClick={() =>
                      handleToggleAgent(a.id, !a.autoAssign.isEnabled)
                    }
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      cursor: "pointer",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "12px",
                        color: a.autoAssign.isEnabled ? "#1a7a40" : "#6b6b6b",
                        fontWeight: "500",
                      }}
                    >
                      {a.autoAssign.isEnabled
                        ? "Auto-assign ON"
                        : "Auto-assign OFF"}
                    </span>
                    <div
                      style={{
                        width: "40px",
                        height: "22px",
                        borderRadius: "11px",
                        background: a.autoAssign.isEnabled
                          ? "#1a7a40"
                          : "#d0d0d0",
                        position: "relative",
                        transition: "background 0.2s",
                        flexShrink: 0,
                      }}
                    >
                      <div
                        style={{
                          width: "16px",
                          height: "16px",
                          borderRadius: "50%",
                          background: "var(--admin-card)",
                          position: "absolute",
                          top: "3px",
                          left: a.autoAssign.isEnabled ? "21px" : "3px",
                          transition: "left 0.2s",
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Ticket types — shown when enabled */}
                {a.autoAssign.isEnabled && (
                  <div
                    style={{
                      padding: "16px 20px",
                      borderTop: "1px solid #e8e8e8",
                    }}
                  >
                    <p
                      style={{
                        fontSize: "12px",
                        color: "#6b6b6b",
                        marginBottom: "12px",
                        fontWeight: "500",
                      }}
                    >
                      Select ticket types to auto-assign to this agent:
                    </p>

                    {/* Select all */}
                    <div
                      onClick={() =>
                        handleSelectAll(a.id, a.autoAssign.requestTypes)
                      }
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        cursor: "pointer",
                        marginBottom: "10px",
                        padding: "8px 10px",
                        background:
                          a.autoAssign.requestTypes.length ===
                          REQUEST_TYPES.length
                            ? "#1a1a1a"
                            : "#f8f8f8",
                        borderRadius: "6px",
                        border: "1px solid #e0e0e0",
                      }}
                    >
                      <div
                        style={{
                          width: "16px",
                          height: "16px",
                          borderRadius: "3px",
                          border: `2px solid ${a.autoAssign.requestTypes.length === REQUEST_TYPES.length ? "#fff" : "#d0d0d0"}`,
                          background:
                            a.autoAssign.requestTypes.length ===
                            REQUEST_TYPES.length
                              ? "#fff"
                              : "transparent",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        {a.autoAssign.requestTypes.length ===
                          REQUEST_TYPES.length && (
                          <i
                            className="ti ti-check"
                            style={{ fontSize: "10px", color: "#1a1a1a" }}
                          />
                        )}
                      </div>
                      <span
                        style={{
                          fontSize: "13px",
                          fontWeight: "500",
                          color:
                            a.autoAssign.requestTypes.length ===
                            REQUEST_TYPES.length
                              ? "#fff"
                              : "#1a1a1a",
                        }}
                      >
                        All ticket types
                      </span>
                    </div>

                    {/* Individual types */}
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          "repeat(auto-fit, minmax(160px, 1fr))",
                        gap: "8px",
                      }}
                    >
                      {REQUEST_TYPES.map((type) => {
                        const isChecked = a.autoAssign.requestTypes.includes(
                          type.value,
                        );
                        return (
                          <div
                            key={type.value}
                            onClick={() =>
                              handleTypeToggle(
                                a.id,
                                type.value,
                                a.autoAssign.requestTypes,
                              )
                            }
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                              cursor: "pointer",
                              padding: "8px 10px",
                              background: isChecked ? "#fdf1f0" : "#fafafa",
                              borderRadius: "6px",
                              border: `1px solid ${isChecked ? "#e8b4af" : "#e0e0e0"}`,
                              transition: "all 0.15s",
                            }}
                          >
                            <div
                              style={{
                                width: "16px",
                                height: "16px",
                                borderRadius: "3px",
                                border: `2px solid ${isChecked ? "#C0392B" : "#d0d0d0"}`,
                                background: isChecked
                                  ? "#C0392B"
                                  : "transparent",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                flexShrink: 0,
                              }}
                            >
                              {isChecked && (
                                <i
                                  className="ti ti-check"
                                  style={{ fontSize: "10px", color: "#fff" }}
                                />
                              )}
                            </div>
                            <span
                              style={{
                                fontSize: "13px",
                                color: isChecked ? "#C0392B" : "#6b6b6b",
                                fontWeight: isChecked ? "500" : "400",
                              }}
                            >
                              {type.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Show assigned types summary */}
                    <p
                      style={{
                        fontSize: "11px",
                        color: "#6b6b6b",
                        marginTop: "10px",
                      }}
                    >
                      {a.autoAssign.requestTypes.length === 0
                        ? "⚠️ No ticket types selected — this agent will not receive any tickets."
                        : a.autoAssign.requestTypes.length ===
                            REQUEST_TYPES.length
                          ? "✅ This agent will receive all ticket types."
                          : `✅ This agent will receive: ${a.autoAssign.requestTypes.map((t) => REQUEST_TYPES.find((r) => r.value === t)?.label).join(", ")}`}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
