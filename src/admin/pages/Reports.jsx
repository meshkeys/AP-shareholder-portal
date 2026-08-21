import React, { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import { getReports, getAgents } from "../services/adminApi";
import {
  exportToFile,
  formatReportSummaryForExport,
  formatReportByTypeForExport,
  formatReportByAgentForExport,
  formatReportByDayForExport,
} from "../utils/exportData";

const TYPE_LABELS = {
  nameChange: "Name Change",
  kycUpdate: "KYC Update",
  addressUpdate: "Address Update",
  signatureUpdate: "Signature Update",
  nubanChange: "NUBAN Change",
};

const TYPE_COLORS = {
  nameChange: "#7c3aed",
  kycUpdate: "#0077b6",
  addressUpdate: "#b36a00",
  signatureUpdate: "#1a7a40",
  nubanChange: "#C0392B",
};

export default function Reports({ agent }) {
  const [report, setReport] = useState(null);
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showExport, setShowExport] = useState(false);
  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    agentId: "",
    requestType: "",
  });

  useEffect(() => {
    if (["admin", "supervisor", "lead_supervisor"].includes(agent.role)) {
      loadAgents();
    }
    loadReport();
  }, []);

  async function loadAgents() {
    try {
      const res = await getAgents();
      setAgents(res.agents?.filter((a) => a.role === "agent") || []);
    } catch (err) {
      console.error("Failed to load agents:", err);
    }
  }

  async function loadReport() {
    setLoading(true);
    setError("");
    try {
      const params = {};
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;
      if (filters.agentId) params.agentId = filters.agentId;
      if (filters.requestType) params.requestType = filters.requestType;
      const res = await getReports(params);
      setReport(res.report);
    } catch (err) {
      setError(err.message || "Failed to load report.");
    } finally {
      setLoading(false);
    }
  }

  function handleFilter(key, value) {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }

  function handlePrint() {
    window.print();
  }

  function handleFullExport() {
    if (!report) return;
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(formatReportSummaryForExport(report)),
      "Summary",
    );
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(formatReportByTypeForExport(report)),
      "By Type",
    );
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(formatReportByAgentForExport(report)),
      "By Agent",
    );
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(formatReportByDayForExport(report)),
      "By Date",
    );
    const date = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(wb, "full_report_" + date + ".xlsx");
    setShowExport(false);
  }

  const selectStyle = {
    padding: "8px 12px",
    fontSize: "13px",
    border: "1px solid #e0e0e0",
    borderRadius: "8px",
    background: "#fff",
    color: "#1a1a1a",
    outline: "none",
  };

  function BarChart({ data, labelKey, valueKey, colorFn }) {
    if (!data?.length)
      return (
        <p
          style={{
            fontSize: "13px",
            color: "#6b6b6b",
            textAlign: "center",
            padding: "20px",
          }}
        >
          No data available
        </p>
      );
    const max = Math.max(...data.map((d) => d[valueKey]));
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {data.map((item, idx) => (
          <div key={idx}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "4px",
              }}
            >
              <span style={{ fontSize: "12px", color: "#6b6b6b" }}>
                {item[labelKey]}
              </span>
              <span style={{ fontSize: "12px", fontWeight: "500" }}>
                {item[valueKey]}
              </span>
            </div>
            <div
              style={{
                height: "8px",
                background: "#f0f0f0",
                borderRadius: "4px",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: max > 0 ? (item[valueKey] / max) * 100 + "%" : "0%",
                  background: colorFn ? colorFn(item) : "#C0392B",
                  borderRadius: "4px",
                  transition: "width 0.6s ease",
                }}
              />
            </div>
          </div>
        ))}
      </div>
    );
  }

  function SummaryCard({ label, value, color, icon }) {
    return (
      <div
        style={{
          background: "#fff",
          border: "1px solid #e8e8e8",
          borderRadius: "10px",
          padding: "16px",
          boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "8px",
              background: color + "15",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <i className={"ti " + icon} style={{ fontSize: "18px", color }} />
          </div>
          <div>
            <p
              style={{
                fontSize: "22px",
                fontWeight: "600",
                color: "#1a1a1a",
                lineHeight: 1,
              }}
            >
              {value}
            </p>
            <p style={{ fontSize: "12px", color: "#6b6b6b", marginTop: "3px" }}>
              {label}
            </p>
          </div>
        </div>
      </div>
    );
  }

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
            Reports
          </h1>
          <p style={{ fontSize: "13px", color: "#6b6b6b" }}>
            Analyse request trends, SLA performance and agent activity.
          </p>
        </div>

        {/* Action buttons */}
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          {/* Print button */}
          <button
            className="btn-ghost"
            style={{ width: "auto", padding: "8px 14px" }}
            onClick={handlePrint}
          >
            <i className="ti ti-printer" style={{ fontSize: "15px" }} /> Print
          </button>

          {/* Export dropdown */}
          <div style={{ position: "relative" }}>
            <button
              className="btn-primary"
              style={{ width: "auto", padding: "8px 14px" }}
              onClick={() => setShowExport((prev) => !prev)}
              disabled={!report}
            >
              <i className="ti ti-download" style={{ fontSize: "15px" }} />{" "}
              Export
            </button>

            {showExport && report && (
              <div
                style={{
                  position: "absolute",
                  right: 0,
                  top: "44px",
                  background: "#fff",
                  border: "1px solid #e8e8e8",
                  borderRadius: "8px",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                  zIndex: 100,
                  minWidth: "230px",
                }}
              >
                {[
                  {
                    label: "Summary (Excel)",
                    fn: () => {
                      exportToFile(
                        formatReportSummaryForExport(report),
                        "report_summary",
                        "xlsx",
                        "Summary",
                      );
                      setShowExport(false);
                    },
                  },
                  {
                    label: "Summary (CSV)",
                    fn: () => {
                      exportToFile(
                        formatReportSummaryForExport(report),
                        "report_summary",
                        "csv",
                        "Summary",
                      );
                      setShowExport(false);
                    },
                  },
                  {
                    label: "By request type (Excel)",
                    fn: () => {
                      exportToFile(
                        formatReportByTypeForExport(report),
                        "report_by_type",
                        "xlsx",
                        "By Type",
                      );
                      setShowExport(false);
                    },
                  },
                  {
                    label: "By agent (Excel)",
                    fn: () => {
                      exportToFile(
                        formatReportByAgentForExport(report),
                        "report_by_agent",
                        "xlsx",
                        "By Agent",
                      );
                      setShowExport(false);
                    },
                  },
                  {
                    label: "By date (Excel)",
                    fn: () => {
                      exportToFile(
                        formatReportByDayForExport(report),
                        "report_by_date",
                        "xlsx",
                        "By Date",
                      );
                      setShowExport(false);
                    },
                  },
                  { label: "Full report (Excel)", fn: handleFullExport },
                ].map((opt, idx) => (
                  <button
                    key={idx}
                    onClick={opt.fn}
                    style={{
                      display: "block",
                      width: "100%",
                      padding: "10px 14px",
                      textAlign: "left",
                      background: "none",
                      border: "none",
                      fontSize: "13px",
                      color: "#1a1a1a",
                      cursor: "pointer",
                      borderBottom: idx < 5 ? "1px solid #f0f0f0" : "none",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = "#fafafa")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "none")
                    }
                  >
                    <i
                      className="ti ti-file-spreadsheet"
                      style={{
                        fontSize: "13px",
                        marginRight: "8px",
                        color: "#1a7a40",
                      }}
                    />
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div
        style={{
          background: "#fff",
          border: "1px solid #e8e8e8",
          borderRadius: "12px",
          padding: "16px",
          marginBottom: "20px",
          boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
        }}
      >
        <p
          style={{
            fontSize: "12px",
            fontWeight: "500",
            color: "#6b6b6b",
            textTransform: "uppercase",
            letterSpacing: "0.5px",
            marginBottom: "12px",
          }}
        >
          Filter report
        </p>
        <div
          style={{
            display: "flex",
            gap: "10px",
            flexWrap: "wrap",
            alignItems: "flex-end",
          }}
        >
          <div>
            <label
              style={{
                fontSize: "12px",
                color: "#6b6b6b",
                marginBottom: "4px",
                display: "block",
              }}
            >
              Start date
            </label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => handleFilter("startDate", e.target.value)}
              style={selectStyle}
            />
          </div>
          <div>
            <label
              style={{
                fontSize: "12px",
                color: "#6b6b6b",
                marginBottom: "4px",
                display: "block",
              }}
            >
              End date
            </label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => handleFilter("endDate", e.target.value)}
              style={selectStyle}
            />
          </div>
          <div>
            <label
              style={{
                fontSize: "12px",
                color: "#6b6b6b",
                marginBottom: "4px",
                display: "block",
              }}
            >
              Request type
            </label>
            <select
              value={filters.requestType}
              onChange={(e) => handleFilter("requestType", e.target.value)}
              style={selectStyle}
            >
              <option value="">All types</option>
              {Object.entries(TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          {["admin", "supervisor", "lead_supervisor"].includes(agent.role) && (
            <div>
              <label
                style={{
                  fontSize: "12px",
                  color: "#6b6b6b",
                  marginBottom: "4px",
                  display: "block",
                }}
              >
                Agent
              </label>
              <select
                value={filters.agentId}
                onChange={(e) => handleFilter("agentId", e.target.value)}
                style={selectStyle}
              >
                <option value="">All agents</option>
                {agents.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.full_name}
                  </option>
                ))}
              </select>
            </div>
          )}
          <button
            className="btn-primary"
            style={{ width: "auto", padding: "8px 16px" }}
            onClick={loadReport}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner" /> Loading...
              </>
            ) : (
              <>
                <i className="ti ti-search" style={{ fontSize: "15px" }} />{" "}
                Generate
              </>
            )}
          </button>
          {(filters.startDate ||
            filters.endDate ||
            filters.agentId ||
            filters.requestType) && (
            <button
              className="btn-ghost"
              style={{ width: "auto", padding: "8px 14px" }}
              onClick={() => {
                setFilters({
                  startDate: "",
                  endDate: "",
                  agentId: "",
                  requestType: "",
                });
                loadReport();
              }}
            >
              <i className="ti ti-x" style={{ fontSize: "14px" }} /> Clear
            </button>
          )}
        </div>
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

      {/* Report content */}
      {report && !loading && (
        <div id="report-content">
          {/* Summary stats */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
              gap: "12px",
              marginBottom: "20px",
            }}
          >
            <SummaryCard
              label="Total requests"
              value={report.summary.total}
              color="#1a1a1a"
              icon="ti-file-text"
            />
            <SummaryCard
              label="Completed"
              value={report.summary.completed}
              color="#1a7a40"
              icon="ti-circle-check"
            />
            <SummaryCard
              label="In progress"
              value={report.summary.inProgress}
              color="#0077b6"
              icon="ti-loader"
            />
            <SummaryCard
              label="Pending"
              value={report.summary.pending}
              color="#b36a00"
              icon="ti-clock"
            />
            <SummaryCard
              label="Rejected"
              value={report.summary.rejected}
              color="#C0392B"
              icon="ti-circle-x"
            />
            <SummaryCard
              label="SLA breached"
              value={report.summary.slaBreached}
              color="#C0392B"
              icon="ti-alert-triangle"
            />
          </div>

          {/* Key metrics */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "16px",
              marginBottom: "20px",
            }}
          >
            <div
              style={{
                background: "#fff",
                border: "1px solid #e8e8e8",
                borderRadius: "12px",
                padding: "20px",
                boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
              }}
            >
              <p
                style={{
                  fontSize: "12px",
                  color: "#6b6b6b",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  marginBottom: "8px",
                }}
              >
                SLA compliance rate
              </p>
              <p
                style={{
                  fontSize: "36px",
                  fontWeight: "700",
                  color:
                    report.slaComplianceRate >= 80
                      ? "#1a7a40"
                      : report.slaComplianceRate >= 60
                        ? "#b36a00"
                        : "#C0392B",
                  lineHeight: 1,
                  marginBottom: "8px",
                }}
              >
                {report.slaComplianceRate}%
              </p>
              <div
                style={{
                  height: "8px",
                  background: "#f0f0f0",
                  borderRadius: "4px",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: report.slaComplianceRate + "%",
                    background:
                      report.slaComplianceRate >= 80
                        ? "#1a7a40"
                        : report.slaComplianceRate >= 60
                          ? "#b36a00"
                          : "#C0392B",
                    borderRadius: "4px",
                  }}
                />
              </div>
            </div>
            <div
              style={{
                background: "#fff",
                border: "1px solid #e8e8e8",
                borderRadius: "12px",
                padding: "20px",
                boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
              }}
            >
              <p
                style={{
                  fontSize: "12px",
                  color: "#6b6b6b",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  marginBottom: "8px",
                }}
              >
                Avg resolution time
              </p>
              <p
                style={{
                  fontSize: "36px",
                  fontWeight: "700",
                  color: "#1a1a1a",
                  lineHeight: 1,
                  marginBottom: "4px",
                }}
              >
                {report.avgResolutionHours}h
              </p>
              <p style={{ fontSize: "12px", color: "#6b6b6b" }}>
                Average hours from submission to resolution
              </p>
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "16px",
              marginBottom: "20px",
            }}
          >
            {/* By type */}
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
                Requests by type
              </h3>
              <BarChart
                data={Object.entries(report.byType).map(([type, count]) => ({
                  type: TYPE_LABELS[type] || type,
                  count,
                  key: type,
                }))}
                labelKey="type"
                valueKey="count"
                colorFn={(item) => TYPE_COLORS[item.key] || "#C0392B"}
              />
            </div>

            {/* By agent */}
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
                Requests by agent
              </h3>
              {report.byAgent.length === 0 ? (
                <p
                  style={{
                    fontSize: "13px",
                    color: "#6b6b6b",
                    textAlign: "center",
                    padding: "20px",
                  }}
                >
                  No agent data available
                </p>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table
                    style={{
                      width: "100%",
                      borderCollapse: "collapse",
                      fontSize: "13px",
                    }}
                  >
                    <thead>
                      <tr style={{ background: "#fafafa" }}>
                        {["Agent", "Total", "Completed", "SLA Breached"].map(
                          (h) => (
                            <th
                              key={h}
                              style={{
                                padding: "8px 10px",
                                textAlign: "left",
                                fontWeight: "500",
                                color: "#6b6b6b",
                                borderBottom: "1px solid #f0f0f0",
                                fontSize: "12px",
                              }}
                            >
                              {h}
                            </th>
                          ),
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {report.byAgent.map((a, idx) => (
                        <tr
                          key={idx}
                          style={{
                            borderBottom:
                              idx < report.byAgent.length - 1
                                ? "1px solid #f0f0f0"
                                : "none",
                          }}
                        >
                          <td
                            style={{ padding: "8px 10px", fontWeight: "500" }}
                          >
                            {a.name}
                          </td>
                          <td style={{ padding: "8px 10px" }}>{a.total}</td>
                          <td
                            style={{
                              padding: "8px 10px",
                              color: "#1a7a40",
                              fontWeight: "500",
                            }}
                          >
                            {a.completed}
                          </td>
                          <td
                            style={{
                              padding: "8px 10px",
                              color: "#C0392B",
                              fontWeight: "500",
                            }}
                          >
                            {a.slaBreached}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* By day */}
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
              Requests over time
            </h3>
            {report.byDay.length === 0 ? (
              <p
                style={{
                  fontSize: "13px",
                  color: "#6b6b6b",
                  textAlign: "center",
                  padding: "20px",
                }}
              >
                No data for selected period
              </p>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-end",
                    gap: "6px",
                    minWidth: report.byDay.length * 40 + "px",
                    height: "120px",
                    padding: "0 4px",
                  }}
                >
                  {report.byDay.map((day, idx) => {
                    const max = Math.max(...report.byDay.map((d) => d.count));
                    const height = max > 0 ? (day.count / max) * 100 : 0;
                    return (
                      <div
                        key={idx}
                        style={{
                          flex: 1,
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          gap: "4px",
                        }}
                      >
                        <span style={{ fontSize: "10px", color: "#6b6b6b" }}>
                          {day.count}
                        </span>
                        <div
                          title={day.date + ": " + day.count + " requests"}
                          style={{
                            width: "100%",
                            height: height + "%",
                            minHeight: "4px",
                            background: "#C0392B",
                            borderRadius: "3px 3px 0 0",
                            opacity: 0.8,
                          }}
                        />
                        <span
                          style={{
                            fontSize: "9px",
                            color: "#b0b0b0",
                            transform: "rotate(-45deg)",
                            whiteSpace: "nowrap",
                            marginTop: "4px",
                          }}
                        >
                          {day.date.slice(5)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {!report && !loading && (
        <div style={{ textAlign: "center", padding: "60px", color: "#6b6b6b" }}>
          <i
            className="ti ti-chart-bar"
            style={{
              fontSize: "48px",
              display: "block",
              marginBottom: "12px",
              opacity: 0.3,
            }}
          />
          <p
            style={{ fontSize: "15px", fontWeight: "500", marginBottom: "6px" }}
          >
            No report generated yet
          </p>
          <p style={{ fontSize: "13px" }}>
            Apply filters above and click Generate to view your report.
          </p>
        </div>
      )}
    </div>
  );
}
