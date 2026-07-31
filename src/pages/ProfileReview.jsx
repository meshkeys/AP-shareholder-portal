import React, { useState } from "react";
import { confirmDetailsCorrect } from "../services/api";

const FIELD_LABELS = [
  { key: "firstName", label: "First name" },
  { key: "lastName", label: "Last name" },
  { key: "email", label: "Registered email" },
  { key: "phone", label: "Phone number" },
  { key: "cscsNumber", label: "CHN / CSCS number" },
  { key: "address", label: "Residential address" },
  { key: "state", label: "State" },
  { key: "country", label: "Country" },
  { key: "nextOfKin", label: "Next of kin" },
  { key: "tin", label: "Tax Identification Number (TIN)" },
  { key: "bankAccount", label: "Bank account number" },
  { key: "bankName", label: "Bank name" },
];

export default function ProfileReview({ profile, onConfirm, onUpdate }) {
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
    <div className="card">
      {/* Eyebrow */}
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
        Step 3 of 4
      </p>

      {/* Title */}
      <h2 style={{ marginBottom: "6px" }}>Confirm your shareholder details</h2>
      <p
        style={{
          fontSize: "14px",
          color: "#6b6b6b",
          marginBottom: "24px",
          lineHeight: 1.6,
        }}
      >
        Review the information we hold on record. If everything looks correct,
        select "All correct". To make changes, select "Update details".
      </p>

      {/* Error */}
      {error && (
        <div className="alert alert-error">
          <i
            className="ti ti-alert-circle"
            style={{ fontSize: "15px", flexShrink: 0, marginTop: "1px" }}
          />
          {error}
        </div>
      )}

      {/* Profile data table */}
      <div
        style={{
          border: "1px solid #e8e8e8",
          borderRadius: "8px",
          overflow: "hidden",
          marginBottom: "24px",
        }}
      >
        {FIELD_LABELS.map(({ key, label }, idx) => {
          const value = profile[key];
          if (!value) return null;
          return (
            <div
              key={key}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "11px 14px",
                borderBottom:
                  idx < FIELD_LABELS.length - 1 ? "1px solid #f0f0f0" : "none",
                background: idx % 2 === 0 ? "#fff" : "#fafafa",
              }}
            >
              <span style={{ fontSize: "13px", color: "#6b6b6b" }}>
                {label}
              </span>
              <span
                style={{
                  fontSize: "14px",
                  fontWeight: "500",
                  textAlign: "right",
                  maxWidth: "60%",
                }}
              >
                {value}
              </span>
            </div>
          );
        })}
      </div>

      {/* Action buttons */}
      <div style={{ display: "flex", gap: "10px" }}>
        <button
          className="btn-ghost"
          style={{ flex: 1 }}
          onClick={onUpdate}
          disabled={loading}
        >
          <i className="ti ti-edit" style={{ fontSize: "15px" }} />
          Update details
        </button>
        <button
          className="btn-primary"
          style={{ flex: 1 }}
          onClick={handleConfirm}
          disabled={loading}
        >
          {loading ? (
            <>
              <span className="spinner" /> Confirming…
            </>
          ) : (
            <>
              <i className="ti ti-check" style={{ fontSize: "15px" }} /> All
              correct
            </>
          )}
        </button>
      </div>
    </div>
  );
}
