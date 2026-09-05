import React, { useState } from "react";
import { confirmDetailsCorrect } from "../services/api";

const TABLE_COLUMNS = [
  { key: "companyName", label: "Company name" },
  { key: "accountNo", label: "Account no" },
  { key: "fullName", label: "Full name" },
  { key: "email", label: "Email" },
  { key: "bankName", label: "Bank name" },
  { key: "bankAccountNo", label: "Bank acct no" },
  { key: "phone", label: "Phone no" },
  { key: "tin", label: "TIN" },
  { key: "address", label: "Address" },
];

// Mock holdings data — replace with real API response
const mockHoldings = [
  {
    companyName: "Dangote Cement Plc",
    accountNo: "ACT-00123",
    fullName: "Adaeze Okonkwo",
    email: "adaeze@example.com",
    bankName: "Access Bank",
    bankAccountNo: "0123456789",
    phone: "+234 803 456 7890",
    tin: "1234567890",
    address: "14 Bourdillon Road, Ikoyi, Lagos",
  },
  {
    companyName: "MTN Nigeria Plc",
    accountNo: "ACT-00456",
    fullName: "Adaeze Okonkwo",
    email: "adaeze@example.com",
    bankName: "GTBank",
    bankAccountNo: "9876543210",
    phone: "+234 803 456 7890",
    tin: "1234567890",
    address: "14 Bourdillon Road, Ikoyi, Lagos",
  },
  {
    companyName: "Zenith Bank Plc",
    accountNo: "ACT-00789",
    fullName: "Adaeze Okonkwo",
    email: "adaeze@example.com",
    bankName: "First Bank",
    bankAccountNo: "1122334455",
    phone: "+234 803 456 7890",
    tin: "1234567890",
    address: "14 Bourdillon Road, Ikoyi, Lagos",
  },
];

export default function ProfileReview({ profile, onUpdate, onConfirm }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleConfirm() {
    setLoading(true);
    setError("");
    try {
      const { referenceNumber } = await confirmDetailsCorrect(profile.id);
      onConfirm({ referenceNumber, type: "confirm" });
    } catch (err) {
      setError(err.message || "Could not confirm details. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      {/* Header */}
      <div
        style={{
          background: "#fff",
          border: "1px solid #e8e8e8",
          borderRadius: "12px",
          padding: "20px 24px",
          marginBottom: "20px",
          boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
        }}
      >
        <p
          style={{
            fontSize: "11px",
            fontWeight: "500",
            color: "#C0392B",
            letterSpacing: "0.6px",
            textTransform: "uppercase",
            marginBottom: "6px",
          }}
        >
          Shareholding records
        </p>
        <h2 style={{ marginBottom: "4px" }}>
          Welcome, {profile.firstName} {profile.lastName}
        </h2>
        <p style={{ fontSize: "13px", color: "#6b6b6b" }}>
          CHN / CSCS number:{" "}
          <strong style={{ color: "#1a1a1a" }}>{profile.cscsNumber}</strong>
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="alert alert-error" style={{ marginBottom: "16px" }}>
          <i
            className="ti ti-alert-circle"
            style={{ fontSize: "15px", flexShrink: 0, marginTop: "1px" }}
          />
          {error}
        </div>
      )}

      {/* Info banner */}
      <div className="alert alert-info" style={{ marginBottom: "16px" }}>
        <i
          className="ti ti-info-circle"
          style={{ fontSize: "15px", flexShrink: 0, marginTop: "1px" }}
        />
        Review your shareholding records below. If any information is incorrect
        or outdated, click "Update my details".
      </div>

      {/* Holdings table */}
      <div
        style={{
          background: "#fff",
          border: "1px solid #e8e8e8",
          borderRadius: "12px",
          overflow: "hidden",
          marginBottom: "20px",
          boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
        }}
      >
        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "13px",
              minWidth: "100%",
            }}
          >
            {/* Table header */}
            <thead>
              <tr style={{ background: "#E31E24" }}>
                {TABLE_COLUMNS.map((col) => (
                  <th
                    key={col.key}
                    style={{
                      padding: "12px 14px",
                      textAlign: "left",
                      fontWeight: "600",
                      color: "#fff",
                      whiteSpace: "nowrap",
                      fontSize: "12px",
                      letterSpacing: "0.3px",
                      background: "#E31E24",
                      borderBottom: "none",
                    }}
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>

            {/* Table body */}
            <tbody>
              {mockHoldings.map((row, idx) => (
                <tr
                  key={idx}
                  style={{
                    background: idx % 2 === 0 ? "#fff" : "#fafafa",
                    borderBottom: "1px solid #f0f0f0",
                  }}
                >
                  {TABLE_COLUMNS.map((col) => (
                    <td
                      key={col.key}
                      style={{
                        padding: "11px 14px",
                        color: "#3d3d3d",
                        whiteSpace: col.key === "address" ? "normal" : "nowrap",
                        maxWidth: col.key === "address" ? "200px" : "none",
                      }}
                    >
                      {row[col.key] || "—"}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Scroll hint */}
        <div
          style={{
            padding: "8px 14px",
            background: "#f8f8f8",
            borderTop: "1px solid #f0f0f0",
            fontSize: "11px",
            color: "#b0b0b0",
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <i className="ti ti-arrows-horizontal" style={{ fontSize: "13px" }} />
          Scroll horizontally to view all columns
        </div>
      </div>

      {/* Action buttons */}
      <div style={{ display: "flex", gap: "10px" }}>
        <button
          className="btn-ghost"
          style={{ flex: 1 }}
          onClick={handleConfirm}
          disabled={loading}
        >
          {loading ? (
            <>
              <span className="spinner spinner-dark" /> Confirming...
            </>
          ) : (
            <>
              <i className="ti ti-check" style={{ fontSize: "15px" }} /> All
              information is correct
            </>
          )}
        </button>
        <button
          className="btn-primary"
          style={{ flex: 1 }}
          onClick={onUpdate}
          disabled={loading}
        >
          <i className="ti ti-edit" style={{ fontSize: "15px" }} /> Update my
          details
        </button>
      </div>
    </div>
  );
}
