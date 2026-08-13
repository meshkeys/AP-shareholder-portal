import React, { useState, useEffect } from "react";
import { StatusBadge, TypeBadge } from "../components/StatusBadge";
import {
  getRequests,
  getAgents,
  bulkAssignRequests,
} from "../services/adminApi";

const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "pending", label: "Pending" },
  { value: "assigned", label: "Assigned" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
  { value: "rejected", label: "Rejected" },
];

const TYPE_OPTIONS = [
  { value: "", label: "All types" },
  { value: "nameChange", label: "Name Change" },
  { value: "kycUpdate", label: "KYC Update" },
  { value: "addressUpdate", label: "Address Update" },
  { value: "signatureUpdate", label: "Signature Update" },
  { value: "nubanChange", label: "NUBAN Change" },
];

export default function Requests({ agent, onNavigate }) {
  const [requests, setRequests] = useState([]);
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ status: "", type: "" });
  const [selected, setSelected] = useState([]);
  const [bulkAgent, setBulkAgent] = useState("");
  const [bulkAssigning, setBulkAssigning] = useState(false);
  const limit = 15;

  const canAssign = ["admin", "supervisor", "lead_supervisor"].includes(
    agent.role,
  );

  useEffect(() => {
    loadRequests();
    if (canAssign) loadAgents();
  }, [page, filters]);

  async function loadRequests() {
    setLoading(true);
    try {
      const params = { page, limit };
      if (filters.status) params.status = filters.status;
      if (filters.type) params.type = filters.type;
      const res = await getRequests(params);
      setRequests(res.requests || []);
      setTotal(res.total || 0);
    } catch (err) {
      setError(err.message || "Failed to load requests.");
    } finally {
      setLoading(false);
    }
  }

  async function loadAgents() {
    try {
      const res = await getAgents();
      setAgents(
        res.agents?.filter((a) => a.role === "agent" && a.is_active) || [],
      );
    } catch (err) {
      console.error("Failed to load agents:", err);
    }
  }

  async function handleBulkAssign() {
    if (!bulkAgent || !selected.length) return;
    setBulkAssigning(true);
    setError("");
    try {
      const res = await bulkAssignRequests(selected, bulkAgent);
      setSuccessMsg(res.message);
      setSelected([]);
      setBulkAgent("");
      loadRequests();
    } catch (err) {
      setError(err.message);
    } finally {
      setBulkAssigning(false);
    }
  }

  function handleFilter(key, value) {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
    setSelected([]);
  }

  function toggleSelect(id) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
    );
  }

  function toggleSelectAll() {
    const pendingIds = requests
      .filter((r) => r.status === "pending")
      .map((r) => r.id);
    if (selected.length === pendingIds.length) {
      setSelected([]);
    } else {
      setSelected(pendingIds);
    }
  }

  const pendingRequests = requests.filter((r) => r.status === "pending");
  const allPendingSelected =
    pendingRequests.length > 0 && selected.length === pendingRequests.length;
  const totalPages = Math.ceil(total / limit);

  const selectStyle = {
    padding: "8px 12px",
    fontSize: "13px",
    border: "1px solid #e0e0e0",
    borderRadius: "8px",
    background: "#fff",
    color: "#1a1a1a",
    outline: "none",
  };

  return (
    <div style={{ padding: "24px", maxWidth: "1200px", margin: "0 auto" }}>
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
            Requests
          </h1>
          <p style={{ fontSize: "13px", color: "#6b6b6b" }}>
            {total} total request{total !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          className="btn-ghost"
          style={{ width: "auto", padding: "8px 14px" }}
          onClick={loadRequests}
        >
          <i className="ti ti-refresh" style={{ fontSize: "15px" }} /> Refresh
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

      {/* Filters */}
      <div
        style={{
          display: "flex",
          gap: "10px",
          marginBottom: "16px",
          flexWrap: "wrap",
        }}
      >
        <select
          value={filters.status}
          onChange={(e) => handleFilter("status", e.target.value)}
          style={selectStyle}
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <select
          value={filters.type}
          onChange={(e) => handleFilter("type", e.target.value)}
          style={selectStyle}
        >
          {TYPE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {(filters.status || filters.type) && (
          <button
            onClick={() => {
              setFilters({ status: "", type: "" });
              setPage(1);
            }}
            style={{
              ...selectStyle,
              color: "#C0392B",
              border: "1px solid #e8b4af",
              background: "#fdf1f0",
            }}
          >
            <i
              className="ti ti-x"
              style={{ fontSize: "13px", marginRight: "4px" }}
            />{" "}
            Clear
          </button>
        )}
      </div>

      {/* Bulk assign bar */}
      {canAssign && selected.length > 0 && (
        <div
          style={{
            background: "#1a1a1a",
            borderRadius: "10px",
            padding: "12px 16px",
            marginBottom: "16px",
            display: "flex",
            alignItems: "center",
            gap: "12px",
            flexWrap: "wrap",
          }}
        >
          <p style={{ fontSize: "13px", color: "#fff", fontWeight: "500" }}>
            <i
              className="ti ti-checkbox"
              style={{ fontSize: "15px", marginRight: "6px", color: "#C0392B" }}
            />
            {selected.length} ticket{selected.length !== 1 ? "s" : ""} selected
          </p>
          <select
            value={bulkAgent}
            onChange={(e) => setBulkAgent(e.target.value)}
            style={{
              padding: "7px 12px",
              fontSize: "13px",
              border: "1px solid #3a3a3a",
              borderRadius: "6px",
              background: "#2a2a2a",
              color: "#fff",
              outline: "none",
              flex: 1,
              minWidth: "200px",
            }}
          >
            <option value="">Select agent to assign...</option>
            {agents.map((a) => (
              <option key={a.id} value={a.id}>
                {a.full_name}
              </option>
            ))}
          </select>
          <button
            onClick={handleBulkAssign}
            disabled={!bulkAgent || bulkAssigning}
            style={{
              padding: "7px 14px",
              background: "#C0392B",
              color: "#fff",
              border: "none",
              borderRadius: "6px",
              fontSize: "13px",
              fontWeight: "500",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              whiteSpace: "nowrap",
            }}
          >
            {bulkAssigning ? (
              <>
                <span className="spinner" /> Assigning...
              </>
            ) : (
              <>
                <i className="ti ti-user-check" style={{ fontSize: "14px" }} />{" "}
                Assign selected
              </>
            )}
          </button>
          <button
            onClick={() => setSelected([])}
            style={{
              padding: "7px 12px",
              background: "transparent",
              color: "#9b9b9b",
              border: "1px solid #3a3a3a",
              borderRadius: "6px",
              fontSize: "13px",
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
        </div>
      )}

      {/* Table */}
      <div
        style={{
          background: "#fff",
          border: "1px solid #e8e8e8",
          borderRadius: "12px",
          overflow: "hidden",
          boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
        }}
      >
        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "13px",
              minWidth: "700px",
            }}
          >
            <thead>
              <tr
                style={{
                  background: "#fafafa",
                  borderBottom: "1px solid #f0f0f0",
                }}
              >
                {canAssign && (
                  <th style={{ padding: "12px 16px", width: "40px" }}>
                    <input
                      type="checkbox"
                      checked={allPendingSelected}
                      onChange={toggleSelectAll}
                      style={{
                        cursor: "pointer",
                        width: "15px",
                        height: "15px",
                      }}
                      title="Select all pending"
                    />
                  </th>
                )}
                {[
                  "Reference",
                  "Shareholder",
                  "Type",
                  "Status",
                  "SLA",
                  "Assigned to",
                  "Date",
                  "",
                ].map((col) => (
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
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: canAssign ? 8 : 7 }).map((_, j) => (
                      <td key={j} style={{ padding: "14px 16px" }}>
                        <div
                          style={{
                            height: "14px",
                            background: "#f0f0f0",
                            borderRadius: "4px",
                            width: j === 1 ? "120px" : "80px",
                          }}
                        />
                      </td>
                    ))}
                  </tr>
                ))
              ) : requests.length === 0 ? (
                <tr>
                  <td
                    colSpan={canAssign ? 8 : 7}
                    style={{
                      padding: "40px",
                      textAlign: "center",
                      color: "#6b6b6b",
                    }}
                  >
                    <i
                      className="ti ti-file-off"
                      style={{
                        fontSize: "32px",
                        display: "block",
                        marginBottom: "8px",
                        opacity: 0.4,
                      }}
                    />
                    No requests found
                  </td>
                </tr>
              ) : (
                requests.map((req, idx) => {
                  const isSelected = selected.includes(req.id);
                  const isPending = req.status === "pending";
                  const slaStatus = req.sla?.resolve?.status;

                  return (
                    <tr
                      key={req.id}
                      style={{
                        borderBottom:
                          idx < requests.length - 1
                            ? "1px solid #f0f0f0"
                            : "none",
                        background: isSelected ? "#fdf8f8" : "transparent",
                        transition: "background 0.1s",
                      }}
                    >
                      {/* Checkbox — only for pending tickets */}
                      {canAssign && (
                        <td style={{ padding: "14px 16px" }}>
                          {isPending && (
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelect(req.id)}
                              style={{
                                cursor: "pointer",
                                width: "15px",
                                height: "15px",
                              }}
                            />
                          )}
                        </td>
                      )}

                      <td
                        style={{ padding: "14px 16px", cursor: "pointer" }}
                        onClick={() => onNavigate("requestDetail", req.id)}
                      >
                        <span
                          style={{
                            fontFamily: "monospace",
                            fontSize: "12px",
                            color: "#C0392B",
                            fontWeight: "500",
                          }}
                        >
                          {req.reference_number}
                        </span>
                        {req.is_escalated && (
                          <span
                            style={{
                              display: "block",
                              fontSize: "10px",
                              color: "#C0392B",
                              fontWeight: "500",
                              marginTop: "2px",
                            }}
                          >
                            <i
                              className="ti ti-alert-triangle"
                              style={{ fontSize: "10px", marginRight: "2px" }}
                            />
                            Escalated (Level {req.escalation_level})
                          </span>
                        )}
                      </td>
                      <td
                        style={{ padding: "14px 16px", cursor: "pointer" }}
                        onClick={() => onNavigate("requestDetail", req.id)}
                      >
                        <p style={{ fontWeight: "500", marginBottom: "2px" }}>
                          {req.shareholder_name}
                        </p>
                        <p style={{ fontSize: "12px", color: "#6b6b6b" }}>
                          {req.shareholder_email}
                        </p>
                      </td>
                      <td style={{ padding: "14px 16px" }}>
                        <TypeBadge type={req.request_type} />
                      </td>
                      <td style={{ padding: "14px 16px" }}>
                        <StatusBadge status={req.status} />
                      </td>
                      <td style={{ padding: "14px 16px" }}>
                        {slaStatus && (
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                              padding: "3px 8px",
                              borderRadius: "20px",
                              fontSize: "11px",
                              fontWeight: "500",
                              background:
                                slaStatus === "on_track"
                                  ? "#f0faf4"
                                  : slaStatus === "at_risk"
                                    ? "#fff8e6"
                                    : "#fdf1f0",
                              color:
                                slaStatus === "on_track"
                                  ? "#1a7a40"
                                  : slaStatus === "at_risk"
                                    ? "#b36a00"
                                    : "#C0392B",
                              border: `1px solid ${slaStatus === "on_track" ? "#a8dfc0" : slaStatus === "at_risk" ? "#f5d78e" : "#e8b4af"}`,
                            }}
                          >
                            <i
                              className={`ti ${slaStatus === "on_track" ? "ti-circle-check" : slaStatus === "at_risk" ? "ti-alert-triangle" : "ti-circle-x"}`}
                              style={{ fontSize: "11px" }}
                            />
                            {slaStatus === "on_track"
                              ? "On track"
                              : slaStatus === "at_risk"
                                ? "At risk"
                                : "Breached"}
                          </span>
                        )}
                      </td>
                      <td style={{ padding: "14px 16px", color: "#6b6b6b" }}>
                        {req.agents?.full_name || "—"}
                      </td>
                      <td
                        style={{
                          padding: "14px 16px",
                          color: "#6b6b6b",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {new Date(req.created_at).toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td style={{ padding: "14px 16px" }}>
                        <i
                          className="ti ti-chevron-right"
                          style={{
                            fontSize: "16px",
                            color: "#b0b0b0",
                            cursor: "pointer",
                          }}
                          onClick={() => onNavigate("requestDetail", req.id)}
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div
            style={{
              padding: "12px 16px",
              borderTop: "1px solid #f0f0f0",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <p style={{ fontSize: "13px", color: "#6b6b6b" }}>
              Page {page} of {totalPages}
            </p>
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                disabled={page === 1}
                className="btn-ghost"
                style={{ width: "auto", padding: "6px 12px", fontSize: "13px" }}
              >
                <i className="ti ti-arrow-left" style={{ fontSize: "14px" }} />{" "}
                Previous
              </button>
              <button
                onClick={() =>
                  setPage((prev) => Math.min(totalPages, prev + 1))
                }
                disabled={page === totalPages}
                className="btn-ghost"
                style={{ width: "auto", padding: "6px 12px", fontSize: "13px" }}
              >
                Next{" "}
                <i className="ti ti-arrow-right" style={{ fontSize: "14px" }} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
