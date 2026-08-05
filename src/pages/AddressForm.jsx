import React, { useState } from "react";
import DocUpload from "../components/DocUpload";
import { UPDATE_CATEGORIES } from "../config/updateCategories";

const ADDRESS = UPDATE_CATEGORIES.find((c) => c.id === "addressUpdate");

export default function AddressForm({ profile, onNext, onBack }) {
  const [fields, setFields] = useState({
    address: profile.address || "",
    state: profile.state || "",
    country: profile.country || "Nigeria",
  });

  const [files, setFiles] = useState(
    ADDRESS.documents.reduce((acc, doc) => ({ ...acc, [doc.id]: null }), {}),
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handleField(key, value) {
    setFields((prev) => ({ ...prev, [key]: value }));
  }

  function handleFile(docId, file) {
    setFiles((prev) => ({ ...prev, [docId]: file }));
  }

  function validate() {
    if (!fields.address.trim())
      return "Please enter your new residential address.";
    if (!fields.state.trim()) return "Please enter your state.";
    if (!fields.country.trim()) return "Please enter your country.";

    for (const doc of ADDRESS.documents) {
      if (doc.required && !files[doc.id]) {
        return `Please attach: ${doc.title}`;
      }
    }
    return "";
  }

  function handleProceed(e) {
    e.preventDefault();
    const err = validate();
    if (err) {
      setError(err);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setError("");
    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      onNext({
        updateType: "addressUpdate",
        subType: null,
        label: ADDRESS.label,
        tagPrefix: ADDRESS.tagPrefix,
        fields,
        files,
      });
    }, 500);
  }

  return (
    <div style={{ maxWidth: "560px", margin: "0 auto" }}>
      <div className="card">
        {/* Header */}
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
          Address update
        </p>
        <h2 style={{ marginBottom: "6px" }}>Update your residential address</h2>
        <p
          style={{
            fontSize: "14px",
            color: "#6b6b6b",
            marginBottom: "24px",
            lineHeight: 1.6,
          }}
        >
          Enter your new address and attach the required supporting documents.
        </p>

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

        <form onSubmit={handleProceed} noValidate>
          {/* ── Address fields ── */}
          <SectionLabel>New address details</SectionLabel>

          <div className="field-group">
            <label htmlFor="address">
              Residential address{" "}
              <span className="tag tag-required">required</span>
            </label>
            <input
              id="address"
              type="text"
              value={fields.address}
              onChange={(e) => handleField("address", e.target.value)}
              placeholder="House number, street name, area"
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
              <label htmlFor="state">
                State <span className="tag tag-required">required</span>
              </label>
              <input
                id="state"
                type="text"
                value={fields.state}
                onChange={(e) => handleField("state", e.target.value)}
                placeholder="e.g. Lagos"
                disabled={loading}
              />
            </div>
            <div>
              <label htmlFor="country">
                Country <span className="tag tag-required">required</span>
              </label>
              <input
                id="country"
                type="text"
                value={fields.country}
                onChange={(e) => handleField("country", e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          {/* ── Documents ── */}
          <div
            style={{
              borderTop: "1px solid #f0f0f0",
              paddingTop: "20px",
              marginBottom: "8px",
            }}
          >
            <SectionLabel>Supporting documents</SectionLabel>
            <p
              style={{
                fontSize: "13px",
                color: "#6b6b6b",
                marginBottom: "12px",
                lineHeight: 1.5,
              }}
            >
              Attach all required documents to support your address change
              request.
            </p>
            {ADDRESS.documents.map((doc) => (
              <DocUpload
                key={doc.id}
                doc={doc}
                file={files[doc.id]}
                onFile={(file) => handleFile(doc.id, file)}
                disabled={loading}
              />
            ))}
          </div>

          {/* ── Buttons ── */}
          <button
            type="submit"
            className="btn-primary"
            style={{ marginTop: "16px" }}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner" /> Processing...
              </>
            ) : (
              <>
                <i className="ti ti-arrow-right" style={{ fontSize: "15px" }} />{" "}
                Review my request
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
          </button>
        </form>
      </div>
    </div>
  );
}

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
