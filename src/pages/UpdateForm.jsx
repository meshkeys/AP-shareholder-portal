import React, { useState, useRef } from "react";
import { submitUpdateRequest } from "../services/api";

const DOCUMENTS = [
  {
    id: "govId",
    icon: "ti-id",
    title: "Valid government-issued ID",
    note: "NIN slip, International passport, Driver's licence, or Voter's card",
    required: true,
    condition: null,
  },
  {
    id: "proofOfAddress",
    icon: "ti-file-text",
    title: "Proof of address",
    note: "Utility bill or bank statement — not older than 3 months",
    required: false,
    condition: "If address changed",
  },
  {
    id: "bankDoc",
    icon: "ti-building-bank",
    title: "Bank statement or cheque leaf",
    note: "Must show account name and number clearly",
    required: false,
    condition: "If banking details changed",
  },
  {
    id: "nokDoc",
    icon: "ti-users",
    title: "Next of kin documentation",
    note: "Signed letter or identification document of next of kin",
    required: false,
    condition: "If next of kin changed",
  },
];

export default function UpdateForm({ profile, onSubmit, onBack }) {
  const [fields, setFields] = useState({
    firstName: profile.firstName || "",
    lastName: profile.lastName || "",
    phone: profile.phone || "",
    address: profile.address || "",
    state: profile.state || "",
    country: profile.country || "Nigeria",
    nextOfKin: profile.nextOfKin || "",
    tin: profile.tin || "",
    bankAccount: profile.bankAccount || "",
    bankName: profile.bankName || "",
  });

  const [files, setFiles] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handleField(key, value) {
    setFields((prev) => ({ ...prev, [key]: value }));
  }

  function handleFile(docId, file) {
    setFiles((prev) => ({ ...prev, [docId]: file }));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!files.govId) {
      setError("Attach a valid government-issued ID before submitting.");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setError("");
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("shareholderId", profile.id);

      Object.entries(fields).forEach(([key, val]) => {
        if (val !== (profile[key] || "")) {
          formData.append(key, val);
        }
      });

      Object.entries(files).forEach(([docId, file]) => {
        formData.append(docId, file);
      });

      const { referenceNumber } = await submitUpdateRequest(
        profile.id,
        formData,
      );
      onSubmit({ referenceNumber, type: "update" });
    } catch (err) {
      setError(err.message || "Submission failed. Please try again.");
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
        Step 4 of 4
      </p>

      {/* Title */}
      <h2 style={{ marginBottom: "6px" }}>Update your details</h2>
      <p
        style={{
          fontSize: "14px",
          color: "#6b6b6b",
          marginBottom: "24px",
          lineHeight: 1.6,
        }}
      >
        Edit only the fields you want to change. Leave others as-is.
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

      <form onSubmit={handleSubmit} noValidate>
        {/* ── Personal details ── */}
        <SectionLabel>Personal details</SectionLabel>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "14px",
            marginBottom: "16px",
          }}
        >
          <div>
            <label>
              First name <span className="tag tag-optional">optional</span>
            </label>
            <input
              type="text"
              value={fields.firstName}
              onChange={(e) => handleField("firstName", e.target.value)}
              disabled={loading}
            />
          </div>
          <div>
            <label>
              Last name <span className="tag tag-optional">optional</span>
            </label>
            <input
              type="text"
              value={fields.lastName}
              onChange={(e) => handleField("lastName", e.target.value)}
              disabled={loading}
            />
          </div>
        </div>

        <div className="field-group">
          <label>
            Phone number <span className="tag tag-optional">optional</span>
          </label>
          <input
            type="tel"
            value={fields.phone}
            onChange={(e) => handleField("phone", e.target.value)}
            placeholder="+234 800 000 0000"
            disabled={loading}
          />
        </div>

        <div className="field-group">
          <label>
            Next of kin name <span className="tag tag-optional">optional</span>
          </label>
          <input
            type="text"
            value={fields.nextOfKin}
            onChange={(e) => handleField("nextOfKin", e.target.value)}
            disabled={loading}
          />
        </div>

        <div className="field-group">
          <label>
            Tax Identification Number (TIN){" "}
            <span className="tag tag-optional">optional</span>
          </label>
          <input
            type="text"
            value={fields.tin}
            onChange={(e) =>
              handleField("tin", e.target.value.replace(/\D/g, ""))
            }
            placeholder="e.g. 1234567890"
            maxLength={10}
            inputMode="numeric"
            disabled={loading}
          />
        </div>

        {/* ── Address ── */}
        <Divider />
        <SectionLabel>Address</SectionLabel>

        <div className="field-group">
          <label>
            Residential address{" "}
            <span className="tag tag-optional">optional</span>
          </label>
          <input
            type="text"
            value={fields.address}
            onChange={(e) => handleField("address", e.target.value)}
            disabled={loading}
          />
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "14px",
            marginBottom: "16px",
          }}
        >
          <div>
            <label>
              State <span className="tag tag-optional">optional</span>
            </label>
            <input
              type="text"
              value={fields.state}
              onChange={(e) => handleField("state", e.target.value)}
              disabled={loading}
            />
          </div>
          <div>
            <label>
              Country <span className="tag tag-optional">optional</span>
            </label>
            <input
              type="text"
              value={fields.country}
              onChange={(e) => handleField("country", e.target.value)}
              disabled={loading}
            />
          </div>
        </div>

        {/* ── Banking ── */}
        <Divider />
        <SectionLabel>Banking details</SectionLabel>

        <div className="field-group">
          <label>
            Bank account number{" "}
            <span className="tag tag-optional">optional</span>
          </label>
          <input
            type="text"
            value={fields.bankAccount}
            onChange={(e) =>
              handleField("bankAccount", e.target.value.replace(/\D/g, ""))
            }
            maxLength={10}
            inputMode="numeric"
            disabled={loading}
          />
        </div>

        <div className="field-group">
          <label>
            Bank name <span className="tag tag-optional">optional</span>
          </label>
          <input
            type="text"
            value={fields.bankName}
            onChange={(e) => handleField("bankName", e.target.value)}
            disabled={loading}
          />
        </div>

        {/* ── Documents ── */}
        <Divider />
        <SectionLabel>Supporting documents</SectionLabel>
        <p
          style={{
            fontSize: "13px",
            color: "#6b6b6b",
            marginBottom: "14px",
            lineHeight: 1.5,
          }}
        >
          Attach documents to support your update request. Government-issued ID
          is always required.
        </p>

        {DOCUMENTS.map((doc) => (
          <DocUploadRow
            key={doc.id}
            doc={doc}
            file={files[doc.id]}
            onFile={(file) => handleFile(doc.id, file)}
            disabled={loading}
          />
        ))}

        {/* ── Submit ── */}
        <button
          type="submit"
          className="btn-primary"
          style={{ marginTop: "20px" }}
          disabled={loading}
        >
          {loading ? (
            <>
              <span className="spinner" /> Submitting…
            </>
          ) : (
            <>
              <i className="ti ti-send" style={{ fontSize: "15px" }} /> Submit
              update request
            </>
          )}
        </button>

        <button
          type="button"
          className="btn-ghost"
          style={{ marginTop: "8px" }}
          onClick={onBack}
          disabled={loading}
        >
          <i className="ti ti-arrow-left" style={{ fontSize: "15px" }} /> Back
          to profile review
        </button>
      </form>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionLabel({ children }) {
  return (
    <p
      style={{
        fontSize: "11px",
        fontWeight: "500",
        color: "#6b6b6b",
        textTransform: "uppercase",
        letterSpacing: "0.6px",
        marginBottom: "12px",
      }}
    >
      {children}
    </p>
  );
}

function Divider() {
  return (
    <div style={{ borderTop: "1px solid #f0f0f0", margin: "4px 0 16px" }} />
  );
}

function DocUploadRow({ doc, file, onFile, disabled }) {
  const inputRef = useRef();
  const uploaded = !!file;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "12px",
        background: "#fafafa",
        border: "1px solid #e8e8e8",
        borderRadius: "8px",
        marginBottom: "8px",
        gap: "12px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: "10px",
          flex: 1,
          minWidth: 0,
        }}
      >
        <i
          className={`ti ${doc.icon}`}
          style={{
            fontSize: "20px",
            color: "#C0392B",
            flexShrink: 0,
            marginTop: "2px",
          }}
          aria-hidden="true"
        />
        <div style={{ minWidth: 0 }}>
          <p style={{ fontSize: "13px", fontWeight: "500", lineHeight: 1.3 }}>
            {doc.title}{" "}
            {doc.required ? (
              <span className="tag tag-required">required</span>
            ) : (
              <span className="tag tag-optional">{doc.condition}</span>
            )}
          </p>
          <p
            style={{
              fontSize: "12px",
              color: "#6b6b6b",
              marginTop: "3px",
              lineHeight: 1.4,
            }}
          >
            {doc.note}
          </p>
          {uploaded && (
            <p
              style={{
                fontSize: "12px",
                color: "#1a7a40",
                marginTop: "4px",
                fontWeight: "500",
              }}
            >
              <i
                className="ti ti-check"
                style={{ fontSize: "12px", marginRight: "3px" }}
              />
              {file.name}
            </p>
          )}
        </div>
      </div>

      <div style={{ flexShrink: 0 }}>
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          style={{ display: "none" }}
          onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
          disabled={disabled}
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={disabled}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "5px",
            fontSize: "12px",
            padding: "6px 10px",
            borderRadius: "6px",
            border: uploaded ? "1px solid #a8dfc0" : "1px solid #e8b4af",
            background: uploaded ? "#f0faf4" : "#fdf1f0",
            color: uploaded ? "#1a7a40" : "#C0392B",
            cursor: "pointer",
            whiteSpace: "nowrap",
          }}
        >
          <i
            className={`ti ${uploaded ? "ti-check" : "ti-upload"}`}
            style={{ fontSize: "13px" }}
          />
          {uploaded ? "Attached" : "Attach"}
        </button>
      </div>
    </div>
  );
}
