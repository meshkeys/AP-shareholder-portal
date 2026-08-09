import React, { useState, useEffect } from "react";
import { StatusBadge, TypeBadge } from "../components/StatusBadge";
import { getRequests } from "../services/adminApi";

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ status: "", type: "" });
  const limit = 15;

  useEffect(() => {
    loadRequests();
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

  function handleFilter(key, value) {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  }

  const totalPages = Math.ceil(total / limit);

  const selectStyle = {
    padding: "8px 12px",
    fontSize: "13px",
    border: "1px solid #e0e0e0",
    borderRadius: "8px",
    background: "#fff",
    color: "#1a1a1a",
    outline: "none",
    cursor: "pointer",
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

      {/* Filters */}
      <div
        style={{
          display: "flex",
          gap: "10px",
          marginBottom: "20px",
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
            />
            Clear filters
          </button>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="alert alert-error" style={{ marginBottom: "16px" }}>
          <i
            className="ti ti-alert-circle"
            style={{ fontSize: "15px", flexShrink: 0 }}
          />
          {error}
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
                {[
                  "Reference",
                  "Shareholder",
                  "Type",
                  "Status",
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
                    {Array.from({ length: 7 }).map((_, j) => (
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
                    colSpan={7}
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
                requests.map((req, idx) => (
                  <tr
                    key={req.id}
                    style={{
                      borderBottom:
                        idx < requests.length - 1
                          ? "1px solid #f0f0f0"
                          : "none",
                      cursor: "pointer",
                      transition: "background 0.1s",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = "#fafafa")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "transparent")
                    }
                    onClick={() => onNavigate("requestDetail", req.id)}
                  >
                    <td style={{ padding: "14px 16px" }}>
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
                    </td>
                    <td style={{ padding: "14px 16px" }}>
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
                        style={{ fontSize: "16px", color: "#b0b0b0" }}
                      />
                    </td>
                  </tr>
                ))
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
