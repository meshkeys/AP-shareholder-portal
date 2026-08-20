import * as XLSX from "xlsx";

/**
 * Export data to Excel or CSV
 * @param {Array} data - array of objects to export
 * @param {string} filename - filename without extension
 * @param {string} format - 'xlsx' or 'csv'
 * @param {string} sheetName - name of the sheet
 */
export function exportToFile(
  data,
  filename,
  format = "xlsx",
  sheetName = "Sheet1",
) {
  if (!data?.length) {
    alert("No data to export.");
    return;
  }

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  const date = new Date().toISOString().slice(0, 10);
  const fullFilename = `${filename}_${date}.${format}`;

  XLSX.writeFile(workbook, fullFilename);
}

/**
 * Format requests data for export
 */
export function formatRequestsForExport(requests) {
  return requests.map((r) => ({
    "Reference Number": r.reference_number,
    "Shareholder Name": r.shareholder_name,
    Email: r.shareholder_email,
    "Request Type": formatType(r.request_type),
    "Sub Type": r.request_subtype || "—",
    Status: formatStatus(r.status),
    "Assigned To": r.agents?.full_name || "Unassigned",
    "SLA Status": r.sla?.resolve?.status || "—",
    Escalated: r.is_escalated ? "Yes" : "No",
    "Date Submitted": formatDate(r.submitted_at || r.created_at),
    "Date Assigned": formatDate(r.assigned_at),
    "First Response": formatDate(r.first_response_at),
    "Date Resolved": formatDate(r.resolved_at),
    Approved: r.status === "approved" ? "Yes" : "No",
  }));
}

/**
 * Format performance data for export
 */
export function formatPerformanceForExport(teamData) {
  return teamData.map((member, idx) => ({
    Rank: idx + 1,
    "Agent Name": member.agent.full_name,
    Email: member.agent.email,
    Score: member.performance?.score || 0,
    "Tickets Assigned": member.performance?.tickets_assigned || 0,
    "Tickets Resolved": member.performance?.tickets_resolved || 0,
    "Tickets Rejected": member.performance?.tickets_rejected || 0,
    "SLA Met": member.performance?.sla_met_count || 0,
    "SLA Breached": member.performance?.sla_breached_count || 0,
    "Avg Resolution (hrs)": member.performance?.avg_resolution_hours || 0,
    "Avg Response (hrs)": member.performance?.avg_response_hours || 0,
    Rating: member.feedback?.message || "—",
  }));
}

/**
 * Format reports data for export
 */
export function formatReportSummaryForExport(report) {
  return [
    { Metric: "Total Requests", Value: report.summary.total },
    { Metric: "Completed", Value: report.summary.completed },
    { Metric: "In Progress", Value: report.summary.inProgress },
    { Metric: "Pending", Value: report.summary.pending },
    { Metric: "Rejected", Value: report.summary.rejected },
    { Metric: "SLA Breached", Value: report.summary.slaBreached },
    { Metric: "SLA Compliance Rate", Value: report.slaComplianceRate + "%" },
    { Metric: "Avg Resolution (hrs)", Value: report.avgResolutionHours },
  ];
}

export function formatReportByTypeForExport(report) {
  const TYPE_LABELS = {
    nameChange: "Name Change",
    kycUpdate: "KYC Update",
    addressUpdate: "Address Update",
    signatureUpdate: "Signature Update",
    nubanChange: "NUBAN Change",
  };
  return Object.entries(report.byType).map(([type, count]) => ({
    "Request Type": TYPE_LABELS[type] || type,
    Count: count,
  }));
}

export function formatReportByAgentForExport(report) {
  return report.byAgent.map((a) => ({
    "Agent Name": a.name,
    Total: a.total,
    Completed: a.completed,
    "SLA Breached": a.slaBreached,
  }));
}

export function formatReportByDayForExport(report) {
  return report.byDay.map((d) => ({
    Date: d.date,
    Count: d.count,
  }));
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatDate(date) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatType(type) {
  const map = {
    nameChange: "Name Change",
    kycUpdate: "KYC Update",
    addressUpdate: "Address Update",
    signatureUpdate: "Signature Update",
    nubanChange: "NUBAN Change",
  };
  return map[type] || type;
}

function formatStatus(status) {
  const map = {
    pending: "Pending",
    assigned: "Assigned",
    in_progress: "In Progress",
    completed: "Completed",
    rejected: "Rejected",
    approved: "Approved",
    approval_revoked: "Approval Revoked",
  };
  return map[status] || status;
}
