import React, { useState, useEffect } from "react";
import { StatusBadge, TypeBadge } from "../components/StatusBadge";
import {
  getRequestDetail,
  getAgents,
  assignRequest,
  updateRequestStatus,
  addNote,
  toggleEmailNotification,
  getCannedResponses,
} from "../services/adminApi";

const STATUS_ACTIONS = {
  pending: [],
  open: ["waiting_on_customer", "approved"],
  waiting_on_customer: ["open"],
  approved: [],
  completed: ["closed"],
  rejected: ["waiting_on_customer", "approved"],
  closed: [],
};

const DEFAULT_MESSAGES = {
  waiting_on_customer:
    "We have reviewed your request and require additional information or documents from you. Please check the flagged items and resubmit at your earliest convenience.",
  approved:
    "We are pleased to inform you that your request has been approved and is being processed.",
  completed:
    "We are pleased to inform you that your request has been successfully processed and completed.",
  rejected:
    "We regret to inform you that we were unable to process your request. Please see the reason provided and contact our support team for further assistance.",
  closed: "Your request has been closed. Thank you for using ShareReg Portal.",
};

export default function RequestDetail({ agent, requestId, onBack }) {
  const [request, setRequest] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [activity, setActivity] = useState([]);
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Assign
  const [selectedAgent, setSelectedAgent] = useState("");
  const [assigning, setAssigning] = useState(false);

  // Status update
  const [newStatus, setNewStatus] = useState("");
  const [note, setNote] = useState("");
  const [sendEmail, setSendEmail] = useState(true);
  const [emailMessage, setEmailMessage] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Canned responses
  const [cannedResponses, setCannedResponses] = useState([]);
  const [selectedCanned, setSelectedCanned] = useState("");
  const [flaggedItems, setFlaggedItems] = useState([]);
  const [availableFlagItems, setAvailableFlagItems] = useState([]);

  // Notes
  const [noteText, setNoteText] = useState("");
  const [addingNote, setAddingNote] = useState(false);

  // Close ticket
  const [closeNote, setCloseNote] = useState("");
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    loadData();
  }, [requestId]);

  async function loadData() {
    setLoading(true);
    try {
      const res = await getRequestDetail(requestId);
      setRequest(res.request);
      setDocuments(res.documents || []);
      setActivity(res.activity || []);
      setNoteText(res.request.internal_notes || "");

      // Load canned responses for this request type
      try {
        const cannedRes = await getCannedResponses(res.request.request_type);
        setCannedResponses(cannedRes.responses || []);
      } catch (e) {
        console.error("Canned responses failed:", e.message);
      }

      if (["admin", "supervisor", "lead_supervisor"].includes(agent.role)) {
        const agentsRes = await getAgents();
        setAgents(
          agentsRes.agents?.filter((a) => a.role === "agent" && a.is_active) ||
            [],
        );
      }
    } catch (err) {
      setError(err.message || "Failed to load request.");
    } finally {
      setLoading(false);
    }
  }

  async function handleAssign() {
    if (!selectedAgent) return;
    setAssigning(true);
    try {
      await assignRequest(requestId, selectedAgent);
      setSuccessMsg("Request assigned successfully.");
      loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setAssigning(false);
    }
  }

  async function handleStatusUpdate() {
    if (!newStatus) return;
    setUpdatingStatus(true);
    try {
      await updateRequestStatus(
        requestId,
        newStatus,
        note,
        sendEmail,
        sendEmail ? emailMessage : null,
      );
      setSuccessMsg("Status updated successfully.");
      setNewStatus("");
      setNote("");
      setEmailMessage("");
      setSelectedCanned("");
      setFlaggedItems([]);
      setAvailableFlagItems([]);
      loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setUpdatingStatus(false);
    }
  }

  async function handleAddNote() {
    if (!noteText.trim()) return;
    setAddingNote(true);
    try {
      await addNote(requestId, noteText);
      setSuccessMsg("Note added.");
      setNoteText("");
      loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setAddingNote(false);
    }
  }

  async function handleEmailToggle() {
    try {
      await toggleEmailNotification(requestId, !request.email_toggle);
      loadData();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleClose() {
    setClosing(true);
    try {
      await updateRequestStatus(
        requestId,
        "closed",
        closeNote,
        true,
        closeNote || DEFAULT_MESSAGES.closed,
      );
      setSuccessMsg("Ticket closed successfully.");
      setCloseNote("");
      loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setClosing(false);
    }
  }

  if (loading)
    return (
      <div style={{ padding: "24px", textAlign: "center", color: "#6b6b6b" }}>
        <span
          className="spinner spinner-dark"
          style={{
            margin: "40px auto",
            display: "block",
            width: "24px",
            height: "24px",
          }}
        />
      </div>
    );

  if (error && !request)
    return (
      <div className="alert alert-error" style={{ margin: "24px" }}>
        <i
          className="ti ti-alert-circle"
          style={{ fontSize: "15px", flexShrink: 0 }}
        />
        {error}
      </div>
    );

  const availableStatuses = STATUS_ACTIONS[request?.status] || [];

  const selectStyle = {
    width: "100%",
    padding: "9px 12px",
    fontSize: "14px",
    border: "1px solid #e0e0e0",
    borderRadius: "8px",
    background: "#fff",
    color: "#1a1a1a",
    outline: "none",
  };

  function statusLabel(s) {
    const map = {
      waiting_on_customer: "Waiting on Customer",
      open: "Open",
      closed: "Closed",
      approved: "Approve",
      completed: "Completed",
      rejected: "Rejected",
    };
    return map[s] || s.charAt(0).toUpperCase() + s.slice(1);
  }

  return (
    <div style={{ padding: "24px", maxWidth: "1000px", margin: "0 auto" }}>
      {/* Back button */}
      <button
        className="btn-ghost"
        style={{ width: "auto", padding: "8px 14px", marginBottom: "20px" }}
        onClick={onBack}
      >
        <i className="ti ti-arrow-left" style={{ fontSize: "15px" }} /> Back to
        requests
      </button>

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

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 320px",
          gap: "20px",
        }}
      >
        {/* ── LEFT COLUMN ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Request header */}
          <div
            style={{
              background: "#fff",
              border: "1px solid #e8e8e8",
              borderRadius: "12px",
              padding: "20px",
              boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                marginBottom: "16px",
              }}
            >
              <div>
                <p
                  style={{
                    fontSize: "11px",
                    color: "#6b6b6b",
                    marginBottom: "4px",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                >
                  Reference number
                </p>
                <p
                  style={{
                    fontSize: "20px",
                    fontWeight: "600",
                    color: "#C0392B",
                    fontFamily: "monospace",
                  }}
                >
                  {request.reference_number}
                </p>
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-end",
                  gap: "6px",
                }}
              >
                <StatusBadge status={request.status} />
                <TypeBadge type={request.request_type} />
              </div>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "12px",
              }}
            >
              <InfoItem
                label="Shareholder name"
                value={request.shareholder_name}
              />
              <InfoItem label="Email" value={request.shareholder_email} />
              <InfoItem label="Request type" value={request.request_type} />
              <InfoItem
                label="Sub type"
                value={request.request_subtype || "—"}
              />
              <InfoItem
                label="Assigned to"
                value={request.agents?.full_name || "Unassigned"}
              />
              <InfoItem
                label="Date submitted"
                value={new Date(request.created_at).toLocaleDateString(
                  "en-GB",
                  { day: "2-digit", month: "long", year: "numeric" },
                )}
              />
            </div>
          </div>

          {/* Ticket timeline */}
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
              <i
                className="ti ti-timeline"
                style={{
                  fontSize: "15px",
                  marginRight: "6px",
                  color: "#C0392B",
                }}
              />
              Ticket timeline
            </h3>
            <div style={{ display: "flex", flexDirection: "column" }}>
              {[
                {
                  label: "Submitted",
                  date: request.submitted_at || request.created_at,
                  icon: "ti-file-plus",
                  color: "#2255cc",
                  done: true,
                },
                {
                  label: "Assigned",
                  date: request.assigned_at,
                  icon: "ti-user-check",
                  color: "#b36a00",
                  done: !!request.assigned_at,
                },
                {
                  label: "Resolved",
                  date: request.resolved_at,
                  icon: "ti-circle-check",
                  color: "#1a7a40",
                  done: !!request.resolved_at,
                },
                {
                  label: "Approved",
                  date: request.approved_at,
                  icon: "ti-badge-check",
                  color: "#C0392B",
                  done: !!request.approved_at,
                },
              ].map((step, idx, arr) => (
                <div
                  key={step.label}
                  style={{ display: "flex", gap: "12px", position: "relative" }}
                >
                  {idx < arr.length - 1 && (
                    <div
                      style={{
                        position: "absolute",
                        left: "15px",
                        top: "32px",
                        width: "2px",
                        height: "40px",
                        background: step.done ? step.color + "40" : "#f0f0f0",
                        zIndex: 0,
                      }}
                    />
                  )}
                  <div
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "50%",
                      background: step.done ? step.color + "15" : "#f5f5f5",
                      border: `2px solid ${step.done ? step.color : "#e0e0e0"}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      zIndex: 1,
                    }}
                  >
                    <i
                      className={`ti ${step.icon}`}
                      style={{
                        fontSize: "14px",
                        color: step.done ? step.color : "#d0d0d0",
                      }}
                    />
                  </div>
                  <div
                    style={{
                      paddingBottom: idx < arr.length - 1 ? "24px" : "0",
                    }}
                  >
                    <p
                      style={{
                        fontSize: "13px",
                        fontWeight: "500",
                        color: step.done ? "#1a1a1a" : "#b0b0b0",
                        marginBottom: "2px",
                      }}
                    >
                      {step.label}
                    </p>
                    <p
                      style={{
                        fontSize: "12px",
                        color: step.done ? "#6b6b6b" : "#d0d0d0",
                      }}
                    >
                      {step.date
                        ? new Date(step.date).toLocaleDateString("en-GB", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "Pending"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Requested changes */}
          {request.fields && Object.keys(request.fields).length > 0 && (
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
                  marginBottom: "14px",
                }}
              >
                Requested changes
              </h3>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "12px",
                }}
              >
                {Object.entries(request.fields).map(([key, value]) =>
                  value ? (
                    <InfoItem key={key} label={formatKey(key)} value={value} />
                  ) : null,
                )}
              </div>
            </div>
          )}

          {/* Documents */}
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
                marginBottom: "14px",
              }}
            >
              Supporting documents ({documents.length})
            </h3>
            {documents.length === 0 ? (
              <p style={{ fontSize: "13px", color: "#6b6b6b" }}>
                No documents attached.
              </p>
            ) : (
              documents.map((doc) => (
                <div
                  key={doc.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "10px 12px",
                    background: "#fafafa",
                    border: "1px solid #e8e8e8",
                    borderRadius: "8px",
                    marginBottom: "8px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                    }}
                  >
                    <i
                      className="ti ti-file-description"
                      style={{ fontSize: "18px", color: "#C0392B" }}
                    />
                    <div>
                      <p style={{ fontSize: "13px", fontWeight: "500" }}>
                        {doc.document_type}
                      </p>
                      <p style={{ fontSize: "12px", color: "#6b6b6b" }}>
                        {doc.file_name}
                      </p>
                    </div>
                  </div>
                  <a
                    href={doc.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      fontSize: "12px",
                      color: "#C0392B",
                      fontWeight: "500",
                      textDecoration: "none",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    <i
                      className="ti ti-download"
                      style={{ fontSize: "14px" }}
                    />{" "}
                    View
                  </a>
                </div>
              ))
            )}
          </div>

          {/* Activity & Notes */}
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
              Activity & Notes
            </h3>
            {activity.length === 0 ? (
              <p style={{ fontSize: "13px", color: "#6b6b6b" }}>
                No activity yet.
              </p>
            ) : (
              activity.map((log, idx) => {
                const isSystem = !log.agent_id;
                const isExternal =
                  log.action === "external_accepted" ||
                  log.action === "external_rejected";
                const isNote = log.action === "note_added";
                const isFlag =
                  log.action === "flagged" ||
                  log.action === "waiting_on_customer";

                let dotColor = "#6b6b6b",
                  bgColor = "#f8f8f8";
                if (isExternal) {
                  dotColor = "#C0392B";
                  bgColor = "#fdf1f0";
                } else if (isNote) {
                  dotColor = "#2255cc";
                  bgColor = "#f0f4ff";
                } else if (isFlag) {
                  dotColor = "#b36a00";
                  bgColor = "#fff8e6";
                } else if (isSystem) {
                  dotColor = "#6b6b6b";
                  bgColor = "#f5f5f5";
                } else {
                  dotColor = "#1a7a40";
                  bgColor = "#f0faf4";
                }

                return (
                  <div
                    key={log.id}
                    style={{
                      display: "flex",
                      gap: "12px",
                      paddingBottom: idx < activity.length - 1 ? "14px" : 0,
                      marginBottom: idx < activity.length - 1 ? "14px" : 0,
                      borderBottom:
                        idx < activity.length - 1
                          ? "1px solid #f0f0f0"
                          : "none",
                    }}
                  >
                    <div
                      style={{
                        width: "32px",
                        height: "32px",
                        borderRadius: "50%",
                        background: bgColor,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        border: `1px solid ${dotColor}30`,
                      }}
                    >
                      <i
                        className={`ti ${getActionIcon(log.action)}`}
                        style={{ fontSize: "14px", color: dotColor }}
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                          marginBottom: "3px",
                        }}
                      >
                        <span
                          style={{
                            fontSize: "12px",
                            fontWeight: "600",
                            color: dotColor,
                          }}
                        >
                          {isExternal
                            ? "External App"
                            : isSystem
                              ? "System"
                              : log.agents?.full_name || "Unknown"}
                        </span>
                        {log.agents?.role && !isSystem && !isExternal && (
                          <span
                            style={{
                              fontSize: "10px",
                              color: "#b0b0b0",
                              textTransform: "capitalize",
                            }}
                          >
                            · {log.agents.role.replace("_", " ")}
                          </span>
                        )}
                      </div>
                      <p
                        style={{
                          fontSize: "13px",
                          color: "#1a1a1a",
                          lineHeight: 1.5,
                        }}
                      >
                        {log.details}
                      </p>
                      <p
                        style={{
                          fontSize: "11px",
                          color: "#b0b0b0",
                          marginTop: "3px",
                        }}
                      >
                        {new Date(log.created_at).toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                );
              })
            )}

            {/* Add note */}
            <div
              style={{
                borderTop: "1px solid #f0f0f0",
                paddingTop: "16px",
                marginTop: "8px",
              }}
            >
              <p
                style={{
                  fontSize: "12px",
                  fontWeight: "500",
                  color: "#6b6b6b",
                  marginBottom: "8px",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                Add internal note
              </p>
              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Type a note visible only to agents and supervisors..."
                rows={3}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  fontSize: "13px",
                  border: "1px solid #e0e0e0",
                  borderRadius: "8px",
                  resize: "vertical",
                  fontFamily: "inherit",
                  outline: "none",
                  marginBottom: "8px",
                }}
              />
              <button
                className="btn-primary"
                style={{ width: "auto", padding: "7px 14px", fontSize: "13px" }}
                onClick={handleAddNote}
                disabled={addingNote || !noteText.trim()}
              >
                {addingNote ? (
                  <>
                    <span className="spinner" /> Saving...
                  </>
                ) : (
                  <>
                    <i className="ti ti-notes" style={{ fontSize: "14px" }} />{" "}
                    Add note
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* ── RIGHT COLUMN ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Assign / Reassign — supervisors and admins only */}
          {["admin", "supervisor", "lead_supervisor"].includes(agent.role) && (
            <div
              style={{
                background: "#fff",
                border: "1px solid #e8e8e8",
                borderRadius: "12px",
                padding: "16px",
                boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
              }}
            >
              <h3
                style={{
                  fontSize: "14px",
                  fontWeight: "500",
                  marginBottom: "12px",
                }}
              >
                <i
                  className="ti ti-user-plus"
                  style={{
                    fontSize: "15px",
                    marginRight: "6px",
                    color: "#C0392B",
                  }}
                />
                {request.assigned_to ? "Reassign request" : "Assign request"}
              </h3>
              <select
                value={selectedAgent}
                onChange={(e) => setSelectedAgent(e.target.value)}
                style={{ ...selectStyle, marginBottom: "10px" }}
              >
                <option value="">Select an agent</option>
                {agents.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.full_name}
                  </option>
                ))}
              </select>
              <button
                className="btn-primary"
                onClick={handleAssign}
                disabled={!selectedAgent || assigning}
              >
                {assigning ? (
                  <>
                    <span className="spinner" /> Assigning...
                  </>
                ) : (
                  <>
                    <i
                      className="ti ti-user-check"
                      style={{ fontSize: "15px" }}
                    />{" "}
                    {request.assigned_to ? "Reassign" : "Assign"}
                  </>
                )}
              </button>
            </div>
          )}

          {/* Update status — shown when there are available transitions */}
          {availableStatuses.length > 0 && (
            <div
              style={{
                background: "#fff",
                border: "1px solid #e8e8e8",
                borderRadius: "12px",
                padding: "16px",
                boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
              }}
            >
              <h3
                style={{
                  fontSize: "14px",
                  fontWeight: "500",
                  marginBottom: "12px",
                }}
              >
                <i
                  className="ti ti-refresh"
                  style={{
                    fontSize: "15px",
                    marginRight: "6px",
                    color: "#C0392B",
                  }}
                />
                Update status
              </h3>

              {/* Status dropdown */}
              <select
                value={newStatus}
                onChange={(e) => {
                  setNewStatus(e.target.value);
                  setEmailMessage(DEFAULT_MESSAGES[e.target.value] || "");
                  setSelectedCanned("");
                  setFlaggedItems([]);
                  setAvailableFlagItems([]);
                }}
                style={{ ...selectStyle, marginBottom: "10px" }}
              >
                <option value="">Select new status</option>
                {availableStatuses.map((s) => (
                  <option key={s} value={s}>
                    {statusLabel(s)}
                  </option>
                ))}
              </select>

              {/* Canned responses — only when waiting on customer */}
              {newStatus === "waiting_on_customer" && (
                <div style={{ marginBottom: "10px" }}>
                  <label
                    style={{
                      fontSize: "12px",
                      color: "#6b6b6b",
                      marginBottom: "5px",
                      display: "block",
                    }}
                  >
                    Select a canned response (optional)
                  </label>
                  <select
                    value={selectedCanned}
                    onChange={(e) => {
                      const id = e.target.value;
                      setSelectedCanned(id);
                      if (id) {
                        const found = cannedResponses.find((r) => r.id === id);
                        if (found) {
                          setEmailMessage(found.body);
                          setAvailableFlagItems(found.flagged_items || []);
                          setFlaggedItems([]);
                        }
                      }
                    }}
                    style={{ ...selectStyle, marginBottom: "10px" }}
                  >
                    <option value="">— Choose a canned response —</option>
                    {cannedResponses.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.title}
                      </option>
                    ))}
                  </select>

                  {/* Flagged items */}
                  {availableFlagItems.length > 0 && (
                    <div
                      style={{
                        background: "#fafafa",
                        border: "1px solid #e8e8e8",
                        borderRadius: "8px",
                        padding: "12px",
                        marginBottom: "10px",
                      }}
                    >
                      <p
                        style={{
                          fontSize: "12px",
                          fontWeight: "500",
                          color: "#6b6b6b",
                          marginBottom: "8px",
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                        }}
                      >
                        Select items to flag:
                      </p>
                      {availableFlagItems.map((item, idx) => (
                        <div
                          key={idx}
                          onClick={() =>
                            setFlaggedItems((prev) =>
                              prev.includes(item)
                                ? prev.filter((i) => i !== item)
                                : [...prev, item],
                            )
                          }
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            cursor: "pointer",
                            padding: "6px 0",
                            borderBottom:
                              idx < availableFlagItems.length - 1
                                ? "1px solid #f0f0f0"
                                : "none",
                          }}
                        >
                          <div
                            style={{
                              width: "15px",
                              height: "15px",
                              borderRadius: "3px",
                              border: `2px solid ${flaggedItems.includes(item) ? "#C0392B" : "#d0d0d0"}`,
                              background: flaggedItems.includes(item)
                                ? "#C0392B"
                                : "transparent",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              flexShrink: 0,
                            }}
                          >
                            {flaggedItems.includes(item) && (
                              <i
                                className="ti ti-check"
                                style={{ fontSize: "9px", color: "#fff" }}
                              />
                            )}
                          </div>
                          <span
                            style={{
                              fontSize: "12px",
                              color: flaggedItems.includes(item)
                                ? "#C0392B"
                                : "#6b6b6b",
                            }}
                          >
                            {item}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Note */}
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Add a note (optional)"
                rows={2}
                style={{
                  width: "100%",
                  padding: "9px 12px",
                  fontSize: "13px",
                  border: "1px solid #e0e0e0",
                  borderRadius: "8px",
                  resize: "none",
                  fontFamily: "inherit",
                  outline: "none",
                  marginBottom: "10px",
                }}
              />

              {/* Email toggle */}
              <div
                onClick={() => setSendEmail((prev) => !prev)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  cursor: "pointer",
                  marginBottom: "10px",
                  padding: "8px 10px",
                  background: sendEmail ? "#f0faf4" : "#fafafa",
                  borderRadius: "6px",
                  border: `1px solid ${sendEmail ? "#a8dfc0" : "#e8e8e8"}`,
                }}
              >
                <div
                  style={{
                    width: "16px",
                    height: "16px",
                    borderRadius: "3px",
                    border: `2px solid ${sendEmail ? "#1a7a40" : "#d0d0d0"}`,
                    background: sendEmail ? "#1a7a40" : "transparent",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  {sendEmail && (
                    <i
                      className="ti ti-check"
                      style={{ fontSize: "10px", color: "#fff" }}
                    />
                  )}
                </div>
                <p
                  style={{
                    fontSize: "13px",
                    color: sendEmail ? "#1a7a40" : "#6b6b6b",
                    fontWeight: sendEmail ? "500" : "400",
                  }}
                >
                  Send email notification to shareholder
                </p>
              </div>

              {/* Email message */}
              {sendEmail && newStatus && (
                <div style={{ marginBottom: "10px" }}>
                  <label
                    style={{
                      fontSize: "12px",
                      color: "#6b6b6b",
                      marginBottom: "6px",
                      display: "block",
                    }}
                  >
                    Email message (editable)
                  </label>
                  <textarea
                    value={emailMessage}
                    onChange={(e) => setEmailMessage(e.target.value)}
                    rows={4}
                    style={{
                      width: "100%",
                      padding: "9px 12px",
                      fontSize: "13px",
                      border: "1px solid #e0e0e0",
                      borderRadius: "8px",
                      resize: "vertical",
                      fontFamily: "inherit",
                      outline: "none",
                    }}
                  />
                </div>
              )}

              <button
                className="btn-primary"
                onClick={handleStatusUpdate}
                disabled={!newStatus || updatingStatus}
              >
                {updatingStatus ? (
                  <>
                    <span className="spinner" /> Updating...
                  </>
                ) : (
                  <>
                    <i
                      className="ti ti-circle-check"
                      style={{ fontSize: "15px" }}
                    />{" "}
                    Update status
                  </>
                )}
              </button>
            </div>
          )}

          {/* Approve button — shown when status is open */}
          {request.status === "open" && (
            <div
              style={{
                background: "#fff",
                border: "1px solid #a8dfc0",
                borderRadius: "12px",
                padding: "16px",
                boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
              }}
            >
              <h3
                style={{
                  fontSize: "14px",
                  fontWeight: "500",
                  marginBottom: "8px",
                }}
              >
                <i
                  className="ti ti-circle-check"
                  style={{
                    fontSize: "15px",
                    marginRight: "6px",
                    color: "#1a7a40",
                  }}
                />
                Approve request
              </h3>
              <p
                style={{
                  fontSize: "12px",
                  color: "#6b6b6b",
                  marginBottom: "12px",
                  lineHeight: 1.5,
                }}
              >
                Approving will immediately send this request to the external
                system for processing.
              </p>
              <button
                className="btn-primary"
                style={{ background: "#1a7a40" }}
                onClick={() => handleStatusUpdate()}
                disabled={updatingStatus}
                onMouseDown={() => {
                  setNewStatus("approved");
                  setEmailMessage(DEFAULT_MESSAGES.approved);
                }}
              >
                <i className="ti ti-check" style={{ fontSize: "15px" }} />{" "}
                Approve
              </button>
            </div>
          )}

          {/* Close ticket — shown when completed */}
          {request.status === "completed" && (
            <div
              style={{
                background: "#fff",
                border: "1px solid #e8e8e8",
                borderRadius: "12px",
                padding: "16px",
                boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
              }}
            >
              <h3
                style={{
                  fontSize: "14px",
                  fontWeight: "500",
                  marginBottom: "8px",
                }}
              >
                <i
                  className="ti ti-lock"
                  style={{
                    fontSize: "15px",
                    marginRight: "6px",
                    color: "#6b6b6b",
                  }}
                />
                Close ticket
              </h3>
              <p
                style={{
                  fontSize: "12px",
                  color: "#6b6b6b",
                  marginBottom: "12px",
                  lineHeight: 1.5,
                }}
              >
                Send a completion confirmation to the shareholder and close this
                ticket.
              </p>
              <textarea
                value={closeNote}
                onChange={(e) => setCloseNote(e.target.value)}
                placeholder="Add a closing message to the shareholder (optional)..."
                rows={3}
                style={{
                  width: "100%",
                  padding: "9px 12px",
                  fontSize: "13px",
                  border: "1px solid #e0e0e0",
                  borderRadius: "8px",
                  resize: "none",
                  fontFamily: "inherit",
                  outline: "none",
                  marginBottom: "10px",
                }}
              />
              <button
                className="btn-primary"
                onClick={handleClose}
                disabled={closing}
                style={{ background: "#6b6b6b" }}
              >
                {closing ? (
                  <>
                    <span className="spinner" /> Closing...
                  </>
                ) : (
                  <>
                    <i className="ti ti-lock" style={{ fontSize: "15px" }} />{" "}
                    Close ticket
                  </>
                )}
              </button>
            </div>
          )}

          {/* Email notifications toggle */}
          <div
            style={{
              background: "#fff",
              border: "1px solid #e8e8e8",
              borderRadius: "12px",
              padding: "16px",
              boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
            }}
          >
            <h3
              style={{
                fontSize: "14px",
                fontWeight: "500",
                marginBottom: "12px",
              }}
            >
              <i
                className="ti ti-mail"
                style={{
                  fontSize: "15px",
                  marginRight: "6px",
                  color: "#C0392B",
                }}
              />
              Email notifications
            </h3>
            <div
              onClick={handleEmailToggle}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                cursor: "pointer",
                padding: "10px 12px",
                background: request.email_toggle ? "#f0faf4" : "#fafafa",
                borderRadius: "8px",
                border: `1px solid ${request.email_toggle ? "#a8dfc0" : "#e8e8e8"}`,
              }}
            >
              <p
                style={{
                  fontSize: "13px",
                  color: request.email_toggle ? "#1a7a40" : "#6b6b6b",
                  fontWeight: "500",
                }}
              >
                {request.email_toggle
                  ? "Notifications enabled"
                  : "Notifications disabled"}
              </p>
              <div
                style={{
                  width: "36px",
                  height: "20px",
                  borderRadius: "10px",
                  background: request.email_toggle ? "#1a7a40" : "#d0d0d0",
                  position: "relative",
                  transition: "background 0.2s",
                }}
              >
                <div
                  style={{
                    width: "14px",
                    height: "14px",
                    borderRadius: "50%",
                    background: "#fff",
                    position: "absolute",
                    top: "3px",
                    left: request.email_toggle ? "19px" : "3px",
                    transition: "left 0.2s",
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoItem({ label, value }) {
  return (
    <div>
      <p
        style={{
          fontSize: "11px",
          color: "#6b6b6b",
          marginBottom: "3px",
          textTransform: "uppercase",
          letterSpacing: "0.5px",
        }}
      >
        {label}
      </p>
      <p style={{ fontSize: "14px", fontWeight: "500", color: "#1a1a1a" }}>
        {value}
      </p>
    </div>
  );
}

function formatKey(key) {
  const map = {
    newFirstName: "New first name",
    newLastName: "New last name",
    newCompanyName: "New company name",
    phone: "Phone number",
    email: "Email address",
    tin: "TIN",
    address: "New address",
    state: "State",
    country: "Country",
    bvn: "BVN",
    nin: "NIN",
    dob: "Date of birth",
    occupation: "Occupation",
    maritalStatus: "Marital status",
    gender: "Gender",
    mandateCode: "Mandate code",
    cscsNumber: "CHN/CSCS Number",
    fullName: "Full name",
  };
  return map[key] || key;
}

function getActionIcon(action) {
  const icons = {
    request_created: "ti-file-plus",
    assigned: "ti-user-check",
    status_changed: "ti-refresh",
    note_added: "ti-notes",
    email_sent: "ti-mail",
    email_toggle_changed: "ti-mail-off",
    approved: "ti-circle-check",
    approval_revoked: "ti-rotate",
    external_accepted: "ti-cloud-check",
    external_rejected: "ti-cloud-off",
    flagged: "ti-flag",
    auto_closed: "ti-lock",
    resubmitted: "ti-refresh-alert",
  };
  return icons[action] || "ti-point";
}
