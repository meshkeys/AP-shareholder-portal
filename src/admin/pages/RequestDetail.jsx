import React, { useState, useEffect } from "react";
import { StatusBadge, TypeBadge } from "../components/StatusBadge";
import {
  getRequestDetail,
  getAgents,
  assignRequest,
  updateRequestStatus,
  addNote,
  toggleEmailNotification,
  approveRequest,
  revokeApproval,
} from "../services/adminApi";

const STATUS_ACTIONS = {
  pending: [],
  assigned: ["in_progress"],
  in_progress: ["waiting_on_customer", "approved"],
  waiting_on_customer: ["in_progress"],
  approved: [],
  completed: [],
  rejected: ["in_progress", "waiting_on_customer"],
  closed: [],
  approval_revoked: ["in_progress"],
};

const DEFAULT_MESSAGES = {
  in_progress:
    "We have received your request and it is currently being reviewed by our team. We will keep you updated on the progress.",
  waiting_on_customer:
    "We have reviewed your request and require additional information or documents from you. Please check the flagged items and resubmit at your earliest convenience.",
  approved:
    "We are pleased to inform you that your request has been approved and is being processed.",
  rejected:
    "We regret to inform you that we were unable to process your request. Please see the reason provided and contact our support team for further assistance.",
};

export default function RequestDetail({ agent, requestId, onBack }) {
  const [request, setRequest] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [activity, setActivity] = useState([]);
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedAgent, setSelectedAgent] = useState("");
  const [assigning, setAssigning] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [note, setNote] = useState("");
  const [sendEmail, setSendEmail] = useState(true);
  const [emailMessage, setEmailMessage] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [addingNote, setAddingNote] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [approving, setApproving] = useState(false);
  const [revoking, setRevoking] = useState(false);
  const [revokeReason, setRevokeReason] = useState("");
  const [showRevoke, setShowRevoke] = useState(false);

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
      setSuccessMsg("Note saved successfully.");
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

  async function handleApprove() {
    setApproving(true);
    try {
      const res = await approveRequest(requestId);
      setSuccessMsg(
        res.synced
          ? `Request approved and synced to external app. External ref: ${res.externalRef}`
          : "Request approved successfully. External sync pending — add endpoint to activate.",
      );
      loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setApproving(false);
    }
  }

  async function handleRevokeApproval() {
    setRevoking(true);
    try {
      await revokeApproval(requestId, revokeReason);
      setSuccessMsg("Approval revoked successfully.");
      setShowRevoke(false);
      setRevokeReason("");
      loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setRevoking(false);
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

      {/* Success message */}
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

          {/* Status timeline */}
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
            <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
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
                  label: "In progress",
                  date: request.first_response_at,
                  icon: "ti-loader",
                  color: "#0077b6",
                  done: !!request.first_response_at,
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
                  {/* Vertical line */}
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
                  {/* Icon */}
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
                  {/* Content */}
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

          {/* Updated fields */}
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

          {/* Internal notes */}
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
              Internal notes
            </h3>
            <textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Add internal notes about this request..."
              rows={4}
              style={{
                width: "100%",
                padding: "10px 12px",
                fontSize: "14px",
                border: "1px solid #e0e0e0",
                borderRadius: "8px",
                resize: "vertical",
                fontFamily: "inherit",
                outline: "none",
              }}
            />
            <button
              className="btn-primary"
              style={{ marginTop: "10px", width: "auto", padding: "8px 16px" }}
              onClick={handleAddNote}
              disabled={addingNote}
            >
              {addingNote ? (
                <>
                  <span className="spinner" /> Saving...
                </>
              ) : (
                <>
                  <i
                    className="ti ti-device-floppy"
                    style={{ fontSize: "15px" }}
                  />{" "}
                  Save note
                </>
              )}
            </button>
          </div>

          {/* Activity log */}
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
              Activity log
            </h3>
            {activity.length === 0 ? (
              <p style={{ fontSize: "13px", color: "#6b6b6b" }}>
                No activity yet.
              </p>
            ) : (
              activity.map((log, idx) => (
                <div
                  key={log.id}
                  style={{
                    display: "flex",
                    gap: "12px",
                    paddingBottom: idx < activity.length - 1 ? "14px" : 0,
                    marginBottom: idx < activity.length - 1 ? "14px" : 0,
                    borderBottom:
                      idx < activity.length - 1 ? "1px solid #f0f0f0" : "none",
                  }}
                >
                  <div
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "50%",
                      background: "#fdf1f0",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <i
                      className={`ti ${getActionIcon(log.action)}`}
                      style={{ fontSize: "14px", color: "#C0392B" }}
                    />
                  </div>
                  <div>
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
              ))
            )}
          </div>
        </div>

        {/* ── RIGHT COLUMN ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Assign request — supervisors and admins only */}
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
                Assign Request
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
                    Assign
                  </>
                )}
              </button>
            </div>
          )}

          {/* Update status */}
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
              <select
                value={newStatus}
                onChange={(e) => {
                  setNewStatus(e.target.value);
                  setEmailMessage(DEFAULT_MESSAGES[e.target.value] || "");
                }}
                style={{ ...selectStyle, marginBottom: "10px" }}
              >
                <option value="">Select new status</option>
                {availableStatuses.map((s) => (
                  <option key={s} value={s}>
                    {s === "in_progress"
                      ? "In Progress"
                      : s.charAt(0).toUpperCase() + s.slice(1)}
                  </option>
                ))}
              </select>
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

          {/* ── APPROVE REQUEST — shown when completed ── */}
          {request.status === "completed" && (
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
                Approving will mark this request as final and send the data to
                the external system.
              </p>
              <button
                className="btn-primary"
                onClick={handleApprove}
                disabled={approving}
                style={{ background: "#1a7a40" }}
              >
                {approving ? (
                  <>
                    <span className="spinner" /> Approving...
                  </>
                ) : (
                  <>
                    <i className="ti ti-check" style={{ fontSize: "15px" }} />{" "}
                    Approve this request
                  </>
                )}
              </button>
            </div>
          )}

          {/* ── REVOKE APPROVAL — shown when approved ── */}
          {request.status === "approved" && (
            <div
              style={{
                background: "#fff",
                border: "1px solid #f5d78e",
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
                  className="ti ti-rotate"
                  style={{
                    fontSize: "15px",
                    marginRight: "6px",
                    color: "#b36a00",
                  }}
                />
                Approval status
              </h3>
              <div
                style={{
                  padding: "10px 12px",
                  borderRadius: "8px",
                  background: request.external_sync ? "#f0faf4" : "#fff8e6",
                  border: `1px solid ${request.external_sync ? "#a8dfc0" : "#f5d78e"}`,
                  marginBottom: "12px",
                }}
              >
                <p
                  style={{
                    fontSize: "12px",
                    fontWeight: "500",
                    color: request.external_sync ? "#1a7a40" : "#b36a00",
                  }}
                >
                  <i
                    className={`ti ${request.external_sync ? "ti-cloud-check" : "ti-cloud-off"}`}
                    style={{ fontSize: "13px", marginRight: "5px" }}
                  />
                  {request.external_sync
                    ? `Synced — Ref: ${request.external_ref}`
                    : "Not yet synced to external app"}
                </p>
              </div>
              {!showRevoke ? (
                <button
                  className="btn-ghost"
                  onClick={() => setShowRevoke(true)}
                  style={{ fontSize: "13px" }}
                >
                  <i
                    className="ti ti-arrow-back"
                    style={{ fontSize: "14px" }}
                  />{" "}
                  Revoke approval
                </button>
              ) : (
                <div>
                  <label
                    style={{
                      fontSize: "12px",
                      color: "#6b6b6b",
                      marginBottom: "5px",
                      display: "block",
                    }}
                  >
                    Reason for revoking (optional)
                  </label>
                  <textarea
                    value={revokeReason}
                    onChange={(e) => setRevokeReason(e.target.value)}
                    placeholder="Enter reason..."
                    rows={2}
                    style={{
                      width: "100%",
                      padding: "8px 10px",
                      fontSize: "13px",
                      border: "1px solid #e0e0e0",
                      borderRadius: "6px",
                      resize: "none",
                      fontFamily: "inherit",
                      outline: "none",
                      marginBottom: "8px",
                    }}
                  />
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button
                      className="btn-primary"
                      onClick={handleRevokeApproval}
                      disabled={revoking}
                      style={{ flex: 1, background: "#b36a00" }}
                    >
                      {revoking ? (
                        <>
                          <span className="spinner" /> Revoking...
                        </>
                      ) : (
                        "Confirm revoke"
                      )}
                    </button>
                    <button
                      className="btn-ghost"
                      onClick={() => {
                        setShowRevoke(false);
                        setRevokeReason("");
                      }}
                      style={{ flex: 1 }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Email notification toggle */}
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
  };
  return icons[action] || "ti-point";
}
