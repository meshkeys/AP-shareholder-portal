import React, { useState, useEffect } from "react";
import {
  getSystemSettings,
  updateSystemSettings,
  getEscalationRules,
  createEscalationRule,
  updateEscalationRule,
  deleteEscalationRule,
  runEscalationCheck,
  getCannedResponses,
  createCannedResponse,
  updateCannedResponse,
  deleteCannedResponse,
} from "../services/adminApi";

const TRIGGER_TYPES = [
  { value: "no_assign", label: "Ticket not assigned" },
  { value: "no_response", label: "No first response after assignment" },
  { value: "no_resolve", label: "Ticket not resolved" },
];

const emptyRule = {
  name: "",
  triggerType: "no_assign",
  triggerHours: 2,
  secondTriggerHours: "",
  finalTriggerHours: "",
  notifySupervisor: true,
  notifyLeadSupervisor: true,
  notifyAdmin: true,
};

export default function Settings({ agent }) {
  const [settings, setSettings] = useState(null);
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [runningCheck, setRunningCheck] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [showRuleForm, setShowRuleForm] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [ruleForm, setRuleForm] = useState(emptyRule);
  const [cannedResponses, setCannedResponses] = useState([]);
  const [showCannedForm, setShowCannedForm] = useState(false);
  const [editingCanned, setEditingCanned] = useState(null);
  const [cannedForm, setCannedForm] = useState({
    title: "",
    requestType: "nameChange",
    body: "",
    flaggedItems: [],
  });
  const [newFlagItem, setNewFlagItem] = useState("");

  const isAdmin = agent.role === "admin";
  const canManageEscalations = ["admin", "lead_supervisor"].includes(
    agent.role,
  );

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [settingsRes, rulesRes, cannedRes] = await Promise.all([
        isAdmin ? getSystemSettings() : Promise.resolve(null),
        canManageEscalations ? getEscalationRules() : Promise.resolve(null),
        canManageEscalations ? getCannedResponses() : Promise.resolve(null),
      ]);
      if (settingsRes) setSettings(settingsRes.settings);
      if (rulesRes) setRules(rulesRes.rules || []);
      if (cannedRes) setCannedResponses(cannedRes.responses || []);
    } catch (err) {
      setError(err.message || "Failed to load settings.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveSettings(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await updateSystemSettings({
        emailNotifications: settings.email_notifications,
        slaAssignHours: settings.sla_assign_hours,
        slaResponseHours: settings.sla_response_hours,
        slaResolveHours: settings.sla_resolve_hours,
      });
      setSuccessMsg("Settings saved successfully.");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveRule(e) {
    e.preventDefault();
    if (!ruleForm.name || !ruleForm.triggerHours) {
      setError("Rule name and trigger hours are required.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const payload = {
        name: ruleForm.name,
        triggerType: ruleForm.triggerType,
        triggerHours: parseInt(ruleForm.triggerHours),
        secondTriggerHours: ruleForm.secondTriggerHours
          ? parseInt(ruleForm.secondTriggerHours)
          : null,
        finalTriggerHours: ruleForm.finalTriggerHours
          ? parseInt(ruleForm.finalTriggerHours)
          : null,
        notifySupervisor: ruleForm.notifySupervisor,
        notifyLeadSupervisor: ruleForm.notifyLeadSupervisor,
        notifyAdmin: ruleForm.notifyAdmin,
      };

      if (editingRule) {
        await updateEscalationRule(editingRule.id, {
          ...payload,
          isActive: editingRule.is_active,
        });
        setSuccessMsg("Escalation rule updated successfully.");
      } else {
        await createEscalationRule(payload);
        setSuccessMsg("Escalation rule created successfully.");
      }

      setShowRuleForm(false);
      setEditingRule(null);
      setRuleForm(emptyRule);
      loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveCanned(e) {
    e.preventDefault();
    if (!cannedForm.title || !cannedForm.requestType || !cannedForm.body) {
      setError("Title, request type and body are required.");
      return;
    }
    setSaving(true);
    try {
      if (editingCanned) {
        await updateCannedResponse(editingCanned.id, {
          title: cannedForm.title,
          body: cannedForm.body,
          flaggedItems: cannedForm.flaggedItems,
        });
        setSuccessMsg("Canned response updated.");
      } else {
        await createCannedResponse({
          title: cannedForm.title,
          requestType: cannedForm.requestType,
          body: cannedForm.body,
          flaggedItems: cannedForm.flaggedItems,
        });
        setSuccessMsg("Canned response created.");
      }
      setShowCannedForm(false);
      setEditingCanned(null);
      setCannedForm({
        title: "",
        requestType: "nameChange",
        body: "",
        flaggedItems: [],
      });
      loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteCanned(id) {
    if (!window.confirm("Delete this canned response?")) return;
    try {
      await deleteCannedResponse(id);
      setSuccessMsg("Canned response deleted.");
      loadData();
    } catch (err) {
      setError(err.message);
    }
  }

  function handleEditCanned(r) {
    setEditingCanned(r);
    setCannedForm({
      title: r.title,
      requestType: r.request_type,
      body: r.body,
      flaggedItems: r.flagged_items || [],
    });
    setShowCannedForm(true);
  }

  async function handleToggleRule(rule) {
    try {
      await updateEscalationRule(rule.id, { isActive: !rule.is_active });
      setSuccessMsg(
        `Rule ${!rule.is_active ? "enabled" : "disabled"} successfully.`,
      );
      loadData();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDeleteRule(id) {
    if (
      !window.confirm("Are you sure you want to delete this escalation rule?")
    )
      return;
    try {
      await deleteEscalationRule(id);
      setSuccessMsg("Rule deleted successfully.");
      loadData();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleRunCheck() {
    setRunningCheck(true);
    try {
      await runEscalationCheck();
      setSuccessMsg("Escalation check completed successfully.");
    } catch (err) {
      setError(err.message);
    } finally {
      setRunningCheck(false);
    }
  }

  function handleEditRule(rule) {
    setEditingRule(rule);
    setRuleForm({
      name: rule.name,
      triggerType: rule.trigger_type,
      triggerHours: rule.trigger_hours,
      secondTriggerHours: rule.second_trigger_hours || "",
      finalTriggerHours: rule.final_trigger_hours || "",
      notifySupervisor: rule.notify_supervisor,
      notifyLeadSupervisor: rule.notify_lead_supervisor,
      notifyAdmin: rule.notify_admin,
    });
    setShowRuleForm(true);
  }

  const inputStyle = {
    width: "100%",
    padding: "9px 12px",
    fontSize: "14px",
    border: "1px solid var(--admin-card-border)",
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
    <div style={{ padding: "24px", maxWidth: "800px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: "24px" }}>
        <h1
          style={{ fontSize: "20px", fontWeight: "600", marginBottom: "4px" }}
        >
          Settings
        </h1>
        <p style={{ fontSize: "13px", color: "#6b6b6b" }}>
          Manage system settings, SLA targets and escalation rules.
        </p>
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

      {/* ── System settings — admin only ── */}
      {isAdmin && settings && (
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
          <h2
            style={{
              fontSize: "15px",
              fontWeight: "500",
              marginBottom: "20px",
            }}
          >
            <i
              className="ti ti-settings"
              style={{ fontSize: "16px", marginRight: "8px", color: "#C0392B" }}
            />
            System settings
          </h2>

          <form onSubmit={handleSaveSettings} noValidate>
            {/* Email notifications */}
            <div style={{ marginBottom: "20px" }}>
              <p
                style={{
                  fontSize: "13px",
                  fontWeight: "500",
                  color: "#1a1a1a",
                  marginBottom: "4px",
                }}
              >
                Email notifications
              </p>
              <p
                style={{
                  fontSize: "12px",
                  color: "#6b6b6b",
                  marginBottom: "10px",
                }}
              >
                Global toggle — disabling this turns off all shareholder emails
                across the system.
              </p>
              <div
                onClick={() =>
                  setSettings((prev) => ({
                    ...prev,
                    email_notifications: !prev.email_notifications,
                  }))
                }
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  cursor: "pointer",
                  padding: "12px 14px",
                  background: settings.email_notifications
                    ? "#f0faf4"
                    : "#fafafa",
                  borderRadius: "8px",
                  border: `1px solid ${settings.email_notifications ? "#a8dfc0" : "#e8e8e8"}`,
                  width: "fit-content",
                  gap: "12px",
                }}
              >
                <p
                  style={{
                    fontSize: "13px",
                    color: settings.email_notifications ? "#1a7a40" : "#6b6b6b",
                    fontWeight: "500",
                  }}
                >
                  {settings.email_notifications
                    ? "Enabled — emails are being sent"
                    : "Disabled — no emails will be sent"}
                </p>
                <div
                  style={{
                    width: "40px",
                    height: "22px",
                    borderRadius: "11px",
                    background: settings.email_notifications
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
                      left: settings.email_notifications ? "21px" : "3px",
                      transition: "left 0.2s",
                    }}
                  />
                </div>
              </div>
            </div>

            {/* SLA targets */}
            <div
              style={{
                borderTop: "1px solid #f0f0f0",
                paddingTop: "20px",
                marginBottom: "20px",
              }}
            >
              <p
                style={{
                  fontSize: "13px",
                  fontWeight: "500",
                  color: "#1a1a1a",
                  marginBottom: "4px",
                }}
              >
                SLA targets
              </p>
              <p
                style={{
                  fontSize: "12px",
                  color: "#6b6b6b",
                  marginBottom: "14px",
                }}
              >
                Set the maximum number of hours allowed for each stage. These
                apply to all tickets.
              </p>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr",
                  gap: "14px",
                }}
              >
                <div>
                  <label
                    style={{
                      fontSize: "12px",
                      color: "#6b6b6b",
                      marginBottom: "5px",
                      display: "block",
                    }}
                  >
                    Time to assign (hours)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={settings.sla_assign_hours}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        sla_assign_hours: parseInt(e.target.value),
                      }))
                    }
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label
                    style={{
                      fontSize: "12px",
                      color: "#6b6b6b",
                      marginBottom: "5px",
                      display: "block",
                    }}
                  >
                    First response (hours)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={settings.sla_response_hours}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        sla_response_hours: parseInt(e.target.value),
                      }))
                    }
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label
                    style={{
                      fontSize: "12px",
                      color: "#6b6b6b",
                      marginBottom: "5px",
                      display: "block",
                    }}
                  >
                    Resolution time (hours)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={settings.sla_resolve_hours}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        sla_resolve_hours: parseInt(e.target.value),
                      }))
                    }
                    style={inputStyle}
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="btn-primary"
              style={{ width: "auto", padding: "8px 20px" }}
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
          </form>
        </div>
      )}

      {/* ── Escalation rules ── */}
      {canManageEscalations && (
        <div
          style={{
            background: "var(--admin-card)",
            border: "1px solid var(--admin-card-border)",
            borderRadius: "12px",
            padding: "20px",
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
                  className="ti ti-bell"
                  style={{
                    fontSize: "16px",
                    marginRight: "8px",
                    color: "#C0392B",
                  }}
                />
                Escalation rules
              </h2>
              <p style={{ fontSize: "12px", color: "#6b6b6b" }}>
                Define when tickets should be escalated and who gets notified.
              </p>
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                className="btn-ghost"
                style={{ width: "auto", padding: "7px 12px", fontSize: "13px" }}
                onClick={handleRunCheck}
                disabled={runningCheck}
              >
                {runningCheck ? (
                  <>
                    <span className="spinner spinner-dark" /> Running...
                  </>
                ) : (
                  <>
                    <i className="ti ti-refresh" style={{ fontSize: "14px" }} />{" "}
                    Run check now
                  </>
                )}
              </button>
              <button
                className="btn-primary"
                style={{ width: "auto", padding: "7px 12px", fontSize: "13px" }}
                onClick={() => {
                  setShowRuleForm(true);
                  setEditingRule(null);
                  setRuleForm(emptyRule);
                }}
              >
                <i className="ti ti-plus" style={{ fontSize: "14px" }} /> Add
                rule
              </button>
            </div>
          </div>

          {/* Rule form */}
          {showRuleForm && (
            <div
              style={{
                background: "#fafafa",
                border: "1px solid var(--admin-card-border)",
                borderRadius: "8px",
                padding: "16px",
                marginBottom: "16px",
              }}
            >
              <h3
                style={{
                  fontSize: "14px",
                  fontWeight: "500",
                  marginBottom: "14px",
                }}
              >
                {editingRule ? "Edit rule" : "New escalation rule"}
              </h3>
              <form onSubmit={handleSaveRule} noValidate>
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
                        fontSize: "12px",
                        color: "#6b6b6b",
                        marginBottom: "5px",
                        display: "block",
                      }}
                    >
                      Rule name
                    </label>
                    <input
                      type="text"
                      value={ruleForm.name}
                      onChange={(e) =>
                        setRuleForm((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                      placeholder="e.g. Urgent unassigned alert"
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label
                      style={{
                        fontSize: "12px",
                        color: "#6b6b6b",
                        marginBottom: "5px",
                        display: "block",
                      }}
                    >
                      Trigger condition
                    </label>
                    <select
                      value={ruleForm.triggerType}
                      onChange={(e) =>
                        setRuleForm((prev) => ({
                          ...prev,
                          triggerType: e.target.value,
                        }))
                      }
                      style={inputStyle}
                    >
                      {TRIGGER_TYPES.map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label
                      style={{
                        fontSize: "12px",
                        color: "#6b6b6b",
                        marginBottom: "5px",
                        display: "block",
                      }}
                    >
                      First trigger (hours) — notifies supervisor
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={ruleForm.triggerHours}
                      onChange={(e) =>
                        setRuleForm((prev) => ({
                          ...prev,
                          triggerHours: e.target.value,
                        }))
                      }
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label
                      style={{
                        fontSize: "12px",
                        color: "#6b6b6b",
                        marginBottom: "5px",
                        display: "block",
                      }}
                    >
                      Second trigger (hours) — notifies lead supervisor
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={ruleForm.secondTriggerHours}
                      onChange={(e) =>
                        setRuleForm((prev) => ({
                          ...prev,
                          secondTriggerHours: e.target.value,
                        }))
                      }
                      placeholder="Optional"
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label
                      style={{
                        fontSize: "12px",
                        color: "#6b6b6b",
                        marginBottom: "5px",
                        display: "block",
                      }}
                    >
                      Final trigger (hours) — notifies admin
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={ruleForm.finalTriggerHours}
                      onChange={(e) =>
                        setRuleForm((prev) => ({
                          ...prev,
                          finalTriggerHours: e.target.value,
                        }))
                      }
                      placeholder="Optional"
                      style={inputStyle}
                    />
                  </div>
                </div>

                {/* Notification toggles */}
                <p
                  style={{
                    fontSize: "12px",
                    color: "#6b6b6b",
                    marginBottom: "10px",
                    fontWeight: "500",
                  }}
                >
                  Notify:
                </p>
                <div
                  style={{
                    display: "flex",
                    gap: "12px",
                    marginBottom: "14px",
                    flexWrap: "wrap",
                  }}
                >
                  {[
                    { key: "notifySupervisor", label: "Supervisor" },
                    { key: "notifyLeadSupervisor", label: "Lead supervisor" },
                    { key: "notifyAdmin", label: "Admin" },
                  ].map((item) => (
                    <div
                      key={item.key}
                      onClick={() =>
                        setRuleForm((prev) => ({
                          ...prev,
                          [item.key]: !prev[item.key],
                        }))
                      }
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "7px",
                        cursor: "pointer",
                        padding: "7px 12px",
                        background: ruleForm[item.key] ? "#fdf1f0" : "#fafafa",
                        border: `1px solid ${ruleForm[item.key] ? "#e8b4af" : "#e8e8e8"}`,
                        borderRadius: "6px",
                      }}
                    >
                      <div
                        style={{
                          width: "15px",
                          height: "15px",
                          borderRadius: "3px",
                          border: `2px solid ${ruleForm[item.key] ? "#C0392B" : "#d0d0d0"}`,
                          background: ruleForm[item.key]
                            ? "#C0392B"
                            : "transparent",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        {ruleForm[item.key] && (
                          <i
                            className="ti ti-check"
                            style={{ fontSize: "9px", color: "#fff" }}
                          />
                        )}
                      </div>
                      <span
                        style={{
                          fontSize: "13px",
                          color: ruleForm[item.key] ? "#C0392B" : "#6b6b6b",
                        }}
                      >
                        {item.label}
                      </span>
                    </div>
                  ))}
                </div>

                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    type="submit"
                    className="btn-primary"
                    style={{ width: "auto", padding: "8px 16px" }}
                    disabled={saving}
                  >
                    {saving ? (
                      <>
                        <span className="spinner" /> Saving...
                      </>
                    ) : editingRule ? (
                      "Update rule"
                    ) : (
                      "Create rule"
                    )}
                  </button>
                  <button
                    type="button"
                    className="btn-ghost"
                    style={{ width: "auto", padding: "8px 16px" }}
                    onClick={() => {
                      setShowRuleForm(false);
                      setEditingRule(null);
                      setRuleForm(emptyRule);
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Rules list */}
          {rules.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "32px",
                color: "#6b6b6b",
                fontSize: "13px",
              }}
            >
              <i
                className="ti ti-bell-off"
                style={{
                  fontSize: "28px",
                  display: "block",
                  marginBottom: "8px",
                  opacity: 0.4,
                }}
              />
              No escalation rules yet. Add one to get started.
            </div>
          ) : (
            rules.map((rule, idx) => (
              <div
                key={rule.id}
                style={{
                  border: "1px solid var(--admin-card-border)",
                  borderRadius: "8px",
                  padding: "14px",
                  marginBottom: idx < rules.length - 1 ? "10px" : 0,
                  background: rule.is_active ? "#fff" : "#fafafa",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    gap: "12px",
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        marginBottom: "6px",
                      }}
                    >
                      <p
                        style={{
                          fontSize: "14px",
                          fontWeight: "500",
                          color: rule.is_active ? "#1a1a1a" : "#6b6b6b",
                        }}
                      >
                        {rule.name}
                      </p>
                      <span
                        style={{
                          fontSize: "11px",
                          padding: "2px 8px",
                          borderRadius: "20px",
                          background: rule.is_active ? "#f0faf4" : "#fafafa",
                          color: rule.is_active ? "#1a7a40" : "#6b6b6b",
                          border: `1px solid ${rule.is_active ? "#a8dfc0" : "#e8e8e8"}`,
                        }}
                      >
                        {rule.is_active ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <p
                      style={{
                        fontSize: "12px",
                        color: "#6b6b6b",
                        marginBottom: "6px",
                      }}
                    >
                      {
                        TRIGGER_TYPES.find((t) => t.value === rule.trigger_type)
                          ?.label
                      }
                    </p>
                    <div
                      style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}
                    >
                      <span style={{ fontSize: "12px", color: "#2255cc" }}>
                        <i
                          className="ti ti-clock"
                          style={{ fontSize: "12px", marginRight: "3px" }}
                        />
                        Level 1: {rule.trigger_hours}h
                      </span>
                      {rule.second_trigger_hours && (
                        <span style={{ fontSize: "12px", color: "#b36a00" }}>
                          <i
                            className="ti ti-clock"
                            style={{ fontSize: "12px", marginRight: "3px" }}
                          />
                          Level 2: {rule.second_trigger_hours}h
                        </span>
                      )}
                      {rule.final_trigger_hours && (
                        <span style={{ fontSize: "12px", color: "#C0392B" }}>
                          <i
                            className="ti ti-clock"
                            style={{ fontSize: "12px", marginRight: "3px" }}
                          />
                          Level 3: {rule.final_trigger_hours}h
                        </span>
                      )}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
                    <button
                      onClick={() => handleToggleRule(rule)}
                      style={{
                        fontSize: "12px",
                        padding: "5px 10px",
                        borderRadius: "6px",
                        border: "1px solid var(--admin-card-border)",
                        background: "#fafafa",
                        color: "#6b6b6b",
                        cursor: "pointer",
                      }}
                    >
                      {rule.is_active ? "Disable" : "Enable"}
                    </button>
                    <button
                      onClick={() => handleEditRule(rule)}
                      style={{
                        fontSize: "12px",
                        padding: "5px 10px",
                        borderRadius: "6px",
                        border: "1px solid var(--admin-card-border)",
                        background: "#f0f4ff",
                        color: "#2255cc",
                        cursor: "pointer",
                      }}
                    >
                      Edit
                    </button>
                    {isAdmin && (
                      <button
                        onClick={() => handleDeleteRule(rule.id)}
                        style={{
                          fontSize: "12px",
                          padding: "5px 10px",
                          borderRadius: "6px",
                          border: "1px solid #e8b4af",
                          background: "#fdf1f0",
                          color: "#C0392B",
                          cursor: "pointer",
                        }}
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ── Canned responses ── */}
      {canManageEscalations && (
        <div
          style={{
            background: "var(--admin-card)",
            border: "1px solid var(--admin-card-border)",
            borderRadius: "12px",
            padding: "20px",
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
                  className="ti ti-message-reply"
                  style={{
                    fontSize: "16px",
                    marginRight: "8px",
                    color: "#C0392B",
                  }}
                />
                Canned responses
              </h2>
              <p style={{ fontSize: "12px", color: "#6b6b6b" }}>
                Pre-written responses agents can use when flagging tickets.
              </p>
            </div>
            <button
              className="btn-primary"
              style={{ width: "auto", padding: "7px 12px", fontSize: "13px" }}
              onClick={() => {
                setShowCannedForm(true);
                setEditingCanned(null);
                setCannedForm({
                  title: "",
                  requestType: "nameChange",
                  body: "",
                  flaggedItems: [],
                });
              }}
            >
              <i className="ti ti-plus" style={{ fontSize: "14px" }} /> Add
              response
            </button>
          </div>

          {/* Form */}
          {showCannedForm && (
            <div
              style={{
                background: "#fafafa",
                border: "1px solid var(--admin-card-border)",
                borderRadius: "8px",
                padding: "16px",
                marginBottom: "16px",
              }}
            >
              <h3
                style={{
                  fontSize: "14px",
                  fontWeight: "500",
                  marginBottom: "14px",
                }}
              >
                {editingCanned ? "Edit canned response" : "New canned response"}
              </h3>
              <form onSubmit={handleSaveCanned} noValidate>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "12px",
                    marginBottom: "12px",
                  }}
                >
                  <div>
                    <label
                      style={{
                        fontSize: "12px",
                        color: "#6b6b6b",
                        marginBottom: "5px",
                        display: "block",
                      }}
                    >
                      Title
                    </label>
                    <input
                      type="text"
                      value={cannedForm.title}
                      onChange={(e) =>
                        setCannedForm((p) => ({ ...p, title: e.target.value }))
                      }
                      placeholder="e.g. KYC — NIN Missing"
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label
                      style={{
                        fontSize: "12px",
                        color: "#6b6b6b",
                        marginBottom: "5px",
                        display: "block",
                      }}
                    >
                      Request type
                    </label>
                    <select
                      value={cannedForm.requestType}
                      onChange={(e) =>
                        setCannedForm((p) => ({
                          ...p,
                          requestType: e.target.value,
                        }))
                      }
                      style={inputStyle}
                    >
                      <option value="nameChange">Name Change</option>
                      <option value="kycUpdate">KYC Update</option>
                      <option value="addressUpdate">Address Update</option>
                      <option value="signatureUpdate">Signature Update</option>
                      <option value="nubanChange">NUBAN Change</option>
                    </select>
                  </div>
                </div>
                <div style={{ marginBottom: "12px" }}>
                  <label
                    style={{
                      fontSize: "12px",
                      color: "#6b6b6b",
                      marginBottom: "5px",
                      display: "block",
                    }}
                  >
                    Email body
                  </label>
                  <textarea
                    value={cannedForm.body}
                    onChange={(e) =>
                      setCannedForm((p) => ({ ...p, body: e.target.value }))
                    }
                    rows={4}
                    placeholder="Email body text..."
                    style={{ ...inputStyle, resize: "vertical" }}
                  />
                </div>

                {/* Flagged items */}
                <div style={{ marginBottom: "12px" }}>
                  <label
                    style={{
                      fontSize: "12px",
                      color: "#6b6b6b",
                      marginBottom: "5px",
                      display: "block",
                    }}
                  >
                    Flagged items (checkboxes shown to agent)
                  </label>
                  <div
                    style={{ display: "flex", gap: "8px", marginBottom: "8px" }}
                  >
                    <input
                      type="text"
                      value={newFlagItem}
                      onChange={(e) => setNewFlagItem(e.target.value)}
                      placeholder="Type an item and press Add or Enter..."
                      style={{ ...inputStyle, flex: 1 }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          if (newFlagItem.trim()) {
                            setCannedForm((p) => ({
                              ...p,
                              flaggedItems: [
                                ...p.flaggedItems,
                                newFlagItem.trim(),
                              ],
                            }));
                            setNewFlagItem("");
                          }
                        }
                      }}
                    />
                    <button
                      type="button"
                      className="btn-ghost"
                      style={{ width: "auto", padding: "8px 12px" }}
                      onClick={() => {
                        if (newFlagItem.trim()) {
                          setCannedForm((p) => ({
                            ...p,
                            flaggedItems: [
                              ...p.flaggedItems,
                              newFlagItem.trim(),
                            ],
                          }));
                          setNewFlagItem("");
                        }
                      }}
                    >
                      Add
                    </button>
                  </div>
                  {cannedForm.flaggedItems.map((item, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        padding: "6px 10px",
                        background: "#fdf1f0",
                        border: "1px solid #e8b4af",
                        borderRadius: "6px",
                        marginBottom: "4px",
                      }}
                    >
                      <span
                        style={{ flex: 1, fontSize: "12px", color: "#C0392B" }}
                      >
                        {item}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setCannedForm((p) => ({
                            ...p,
                            flaggedItems: p.flaggedItems.filter(
                              (_, i) => i !== idx,
                            ),
                          }))
                        }
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          color: "#C0392B",
                          padding: 0,
                        }}
                      >
                        <i className="ti ti-x" style={{ fontSize: "13px" }} />
                      </button>
                    </div>
                  ))}
                </div>

                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    type="submit"
                    className="btn-primary"
                    style={{ width: "auto", padding: "8px 16px" }}
                    disabled={saving}
                  >
                    {saving ? (
                      <>
                        <span className="spinner" /> Saving...
                      </>
                    ) : editingCanned ? (
                      "Update"
                    ) : (
                      "Create"
                    )}
                  </button>
                  <button
                    type="button"
                    className="btn-ghost"
                    style={{ width: "auto", padding: "8px 16px" }}
                    onClick={() => {
                      setShowCannedForm(false);
                      setEditingCanned(null);
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* List grouped by request type */}
          {[
            "nameChange",
            "kycUpdate",
            "addressUpdate",
            "signatureUpdate",
            "nubanChange",
          ].map((type) => {
            const typeLabels = {
              nameChange: "Name Change",
              kycUpdate: "KYC Update",
              addressUpdate: "Address Update",
              signatureUpdate: "Signature Update",
              nubanChange: "NUBAN Change",
            };
            const typeResponses = cannedResponses.filter(
              (r) => r.request_type === type,
            );
            if (!typeResponses.length) return null;
            return (
              <div key={type} style={{ marginBottom: "16px" }}>
                <p
                  style={{
                    fontSize: "12px",
                    fontWeight: "500",
                    color: "#6b6b6b",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    marginBottom: "8px",
                  }}
                >
                  {typeLabels[type]}
                </p>
                {typeResponses.map((r) => (
                  <div
                    key={r.id}
                    style={{
                      border: "1px solid var(--admin-card-border)",
                      borderRadius: "8px",
                      padding: "12px 14px",
                      marginBottom: "8px",
                      background: "var(--admin-card)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "12px",
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <p
                          style={{
                            fontSize: "13px",
                            fontWeight: "500",
                            marginBottom: "4px",
                          }}
                        >
                          {r.title}
                        </p>
                        <p style={{ fontSize: "12px", color: "#6b6b6b" }}>
                          {(r.flagged_items || []).length} flagged item
                          {(r.flagged_items || []).length !== 1 ? "s" : ""}
                        </p>
                      </div>
                      <div style={{ display: "flex", gap: "6px" }}>
                        <button
                          onClick={() => handleEditCanned(r)}
                          style={{
                            fontSize: "12px",
                            padding: "4px 10px",
                            borderRadius: "6px",
                            border: "1px solid #c0d0f5",
                            background: "#f0f4ff",
                            color: "#2255cc",
                            cursor: "pointer",
                          }}
                        >
                          Edit
                        </button>
                        {isAdmin && (
                          <button
                            onClick={() => handleDeleteCanned(r.id)}
                            style={{
                              fontSize: "12px",
                              padding: "4px 10px",
                              borderRadius: "6px",
                              border: "1px solid #e8b4af",
                              background: "#fdf1f0",
                              color: "#C0392B",
                              cursor: "pointer",
                            }}
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
