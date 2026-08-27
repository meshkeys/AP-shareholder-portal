/**
 * Admin API Service
 * All calls to the backend from the admin dashboard
 */

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

// ── Auth helpers ──────────────────────────────────────────────────────────────

function getToken() {
  return localStorage.getItem("adminToken");
}

function getHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${getToken()}`,
  };
}

async function handleResponse(res) {
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Something went wrong.");
  return data;
}

// ── Auth ──────────────────────────────────────────────────────────────────────

export async function login(email, password) {
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return handleResponse(res);
}

export async function createAgent(fullName, email, password, role) {
  const res = await fetch(`${BASE_URL}/api/auth/create-agent`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({ fullName, email, password, role }),
  });
  return handleResponse(res);
}

export async function changePassword(agentId, currentPassword, newPassword) {
  const res = await fetch(`${BASE_URL}/api/auth/change-password`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({ agentId, currentPassword, newPassword }),
  });
  return handleResponse(res);
}

// ── Requests ──────────────────────────────────────────────────────────────────

export async function getRequests(filters = {}) {
  const params = new URLSearchParams(filters).toString();
  const res = await fetch(`${BASE_URL}/api/requests?${params}`, {
    headers: getHeaders(),
  });
  return handleResponse(res);
}

export async function getRequestDetail(id) {
  const res = await fetch(`${BASE_URL}/api/requests/${id}`, {
    headers: getHeaders(),
  });
  return handleResponse(res);
}

export async function getStats() {
  const res = await fetch(`${BASE_URL}/api/requests/stats/summary`, {
    headers: getHeaders(),
  });
  return handleResponse(res);
}

export async function assignRequest(requestId, agentId) {
  const res = await fetch(`${BASE_URL}/api/requests/${requestId}/assign`, {
    method: "PATCH",
    headers: getHeaders(),
    body: JSON.stringify({ agentId }),
  });
  return handleResponse(res);
}

export async function bulkAssignRequests(requestIds, agentId) {
  const res = await fetch(`${BASE_URL}/api/requests/bulk-assign`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({ requestIds, agentId }),
  });
  return handleResponse(res);
}

export async function updateRequestStatus(
  requestId,
  status,
  note,
  sendEmail,
  emailMessage,
) {
  const res = await fetch(`${BASE_URL}/api/requests/${requestId}/status`, {
    method: "PATCH",
    headers: getHeaders(),
    body: JSON.stringify({ status, note, sendEmail, emailMessage }),
  });
  return handleResponse(res);
}

export async function addNote(requestId, note) {
  const res = await fetch(`${BASE_URL}/api/requests/${requestId}/note`, {
    method: "PATCH",
    headers: getHeaders(),
    body: JSON.stringify({ note }),
  });
  return handleResponse(res);
}

export async function toggleEmailNotification(requestId, emailToggle) {
  const res = await fetch(
    `${BASE_URL}/api/requests/${requestId}/email-toggle`,
    {
      method: "PATCH",
      headers: getHeaders(),
      body: JSON.stringify({ emailToggle }),
    },
  );
  return handleResponse(res);
}

// ── Agents ────────────────────────────────────────────────────────────────────

export async function getAgents() {
  const res = await fetch(`${BASE_URL}/api/agents`, {
    headers: getHeaders(),
  });
  return handleResponse(res);
}

export async function getAgentWorkload() {
  const res = await fetch(`${BASE_URL}/api/agents/workload`, {
    headers: getHeaders(),
  });
  return handleResponse(res);
}

export async function updateAgent(agentId, data) {
  const res = await fetch(`${BASE_URL}/api/agents/${agentId}`, {
    method: "PATCH",
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function resetAgentPassword(agentId, newPassword) {
  const res = await fetch(`${BASE_URL}/api/agents/${agentId}/reset-password`, {
    method: "PATCH",
    headers: getHeaders(),
    body: JSON.stringify({ newPassword }),
  });
  return handleResponse(res);
}

export async function deactivateAgent(agentId) {
  const res = await fetch(`${BASE_URL}/api/agents/${agentId}`, {
    method: "DELETE",
    headers: getHeaders(),
  });
  return handleResponse(res);
}

// ── System settings ───────────────────────────────────────────────────────────

export async function getSystemSettings() {
  const res = await fetch(`${BASE_URL}/api/agents/settings/system`, {
    headers: getHeaders(),
  });
  return handleResponse(res);
}

// ── Performance ───────────────────────────────────────────────────────────────

export async function getMyPerformance() {
  const res = await fetch(`${BASE_URL}/api/agents/performance/me`, {
    headers: getHeaders(),
  });
  return handleResponse(res);
}

export async function getTeamPerformance(periodType = "weekly") {
  const res = await fetch(
    `${BASE_URL}/api/agents/performance/team?periodType=${periodType}`,
    {
      headers: getHeaders(),
    },
  );
  return handleResponse(res);
}

export async function getReports(filters = {}) {
  const params = new URLSearchParams(filters).toString();
  const res = await fetch(`${BASE_URL}/api/agents/reports?${params}`, {
    headers: getHeaders(),
  });
  return handleResponse(res);
}

// ── Escalations ───────────────────────────────────────────────────────────────

export async function getEscalationRules() {
  const res = await fetch(`${BASE_URL}/api/escalations/rules`, {
    headers: getHeaders(),
  });
  return handleResponse(res);
}

export async function createEscalationRule(data) {
  const res = await fetch(`${BASE_URL}/api/escalations/rules`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function updateEscalationRule(id, data) {
  const res = await fetch(`${BASE_URL}/api/escalations/rules/${id}`, {
    method: "PATCH",
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function deleteEscalationRule(id) {
  const res = await fetch(`${BASE_URL}/api/escalations/rules/${id}`, {
    method: "DELETE",
    headers: getHeaders(),
  });
  return handleResponse(res);
}

export async function getActiveEscalations() {
  const res = await fetch(`${BASE_URL}/api/escalations/active`, {
    headers: getHeaders(),
  });
  return handleResponse(res);
}

export async function getAllEscalations() {
  const res = await fetch(`${BASE_URL}/api/escalations`, {
    headers: getHeaders(),
  });
  return handleResponse(res);
}

export async function resolveEscalation(id) {
  const res = await fetch(`${BASE_URL}/api/escalations/${id}/resolve`, {
    method: "PATCH",
    headers: getHeaders(),
  });
  return handleResponse(res);
}

export async function runEscalationCheck() {
  const res = await fetch(`${BASE_URL}/api/escalations/run-check`, {
    method: "POST",
    headers: getHeaders(),
  });
  return handleResponse(res);
}

export async function updateSystemSettings(data) {
  const res = await fetch(`${BASE_URL}/api/agents/settings/system`, {
    method: "PATCH",
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function getCannedResponses(requestType) {
  const params = requestType ? `?requestType=${requestType}` : "";
  const res = await fetch(`${BASE_URL}/api/canned-responses${params}`, {
    headers: getHeaders(),
  });
  return handleResponse(res);
}

export async function sendFlagEmail(requestId, emailMessage, flaggedItems) {
  const res = await fetch(`${BASE_URL}/api/canned-responses/send-flag`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({ requestId, emailMessage, flaggedItems }),
  });
  return handleResponse(res);
}

// ── Local storage helpers ─────────────────────────────────────────────────────

export function saveSession(token, agent) {
  localStorage.setItem("adminToken", token);
  localStorage.setItem("adminAgent", JSON.stringify(agent));
}

export function getSession() {
  const token = localStorage.getItem("adminToken");
  const agent = localStorage.getItem("adminAgent");
  if (!token || !agent) return null;
  return { token, agent: JSON.parse(agent) };
}

export function clearSession() {
  localStorage.removeItem("adminToken");
  localStorage.removeItem("adminAgent");
}

export async function approveRequest(requestId) {
  const res = await fetch(`${BASE_URL}/api/requests/${requestId}/approve`, {
    method: "POST",
    headers: getHeaders(),
  });
  return handleResponse(res);
}

export async function revokeApproval(requestId, reason) {
  const res = await fetch(
    `${BASE_URL}/api/requests/${requestId}/revoke-approval`,
    {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ reason }),
    },
  );
  return handleResponse(res);
}

export async function forgotPassword(email) {
  const res = await fetch(`${BASE_URL}/api/auth/forgot-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  return handleResponse(res);
}

export async function resetPassword(token, newPassword) {
  const res = await fetch(`${BASE_URL}/api/auth/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, newPassword }),
  });
  return handleResponse(res);
}
