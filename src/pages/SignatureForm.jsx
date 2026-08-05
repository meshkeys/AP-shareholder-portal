import React, { useState } from "react";
import DocUpload from "../components/DocUpload";
import { UPDATE_CATEGORIES } from "../config/updateCategories";

const SIGNATURE = UPDATE_CATEGORIES.find((c) => c.id === "signatureUpdate");

export default function SignatureForm({ profile, onNext, onBack }) {
  const [files, setFiles] = useState(
    SIGNATURE.documents.reduce((acc, doc) => ({ ...acc, [doc.id]: null }), {}),
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handleFile(docId, file) {
    setFiles((prev) => ({ ...prev, [docId]: file }));
  }

  function validate() {
    for (const doc of SIGNATURE.documents) {
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
        updateType: "signatureUpdate",
        subType: null,
        label: SIGNATURE.label,
        tagPrefix: SIGNATURE.tagPrefix,
        fields: {},
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
          Signature update
        </p>
        <h2 style={{ marginBottom: "6px" }}>
          Update your registered signature
        </h2>
        <p
          style={{
            fontSize: "14px",
            color: "#6b6b6b",
            marginBottom: "24px",
            lineHeight: 1.6,
          }}
        >
          Upload your old and new signatures along with the required supporting
          documents.
        </p>

        {/* Info banner */}
        <div className="alert alert-info" style={{ marginBottom: "24px" }}>
          <i
            className="ti ti-info-circle"
            style={{ fontSize: "15px", flexShrink: 0, marginTop: "1px" }}
          />
          <div>
            <strong>Signature format:</strong> Your signature should be on a
            plain white background. Accepted formats: JPG, PNG, or PDF.
          </div>
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

        <form onSubmit={handleProceed} noValidate>
          {/* Signature uploads — shown prominently */}
          <SectionLabel>Signature uploads</SectionLabel>
          <p
            style={{
              fontSize: "13px",
              color: "#6b6b6b",
              marginBottom: "12px",
              lineHeight: 1.5,
            }}
          >
            Upload both your current registered signature and your new
            signature.
          </p>

          {/* Old signature */}
          <div
            style={{
              background: "#fafafa",
              border: `1.5px dashed ${files.oldSignature ? "#a8dfc0" : "#e8b4af"}`,
              borderRadius: "8px",
              padding: "20px",
              textAlign: "center",
              marginBottom: "12px",
              cursor: "pointer",
            }}
            onClick={() => document.getElementById("oldSigInput").click()}
          >
            <i
              className={`ti ${files.oldSignature ? "ti-circle-check" : "ti-writing"}`}
              style={{
                fontSize: "28px",
                color: files.oldSignature ? "#1a7a40" : "#C0392B",
                marginBottom: "8px",
                display: "block",
              }}
            />
            <p
              style={{
                fontSize: "13px",
                fontWeight: "500",
                color: files.oldSignature ? "#1a7a40" : "#1a1a1a",
                marginBottom: "4px",
              }}
            >
              {files.oldSignature
                ? files.oldSignature.name
                : "Current registered signature"}
            </p>
            <p style={{ fontSize: "12px", color: "#6b6b6b" }}>
              {files.oldSignature
                ? "Click to replace"
                : "Click to upload — JPG, PNG or PDF"}
            </p>
            <input
              id="oldSigInput"
              type="file"
              accept=".jpg,.jpeg,.png,.pdf"
              style={{ display: "none" }}
              onChange={(e) =>
                e.target.files?.[0] &&
                handleFile("oldSignature", e.target.files[0])
              }
            />
          </div>

          {/* New signature */}
          <div
            style={{
              background: "#fafafa",
              border: `1.5px dashed ${files.newSignature ? "#a8dfc0" : "#e8b4af"}`,
              borderRadius: "8px",
              padding: "20px",
              textAlign: "center",
              marginBottom: "20px",
              cursor: "pointer",
            }}
            onClick={() => document.getElementById("newSigInput").click()}
          >
            <i
              className={`ti ${files.newSignature ? "ti-circle-check" : "ti-pencil"}`}
              style={{
                fontSize: "28px",
                color: files.newSignature ? "#1a7a40" : "#C0392B",
                marginBottom: "8px",
                display: "block",
              }}
            />
            <p
              style={{
                fontSize: "13px",
                fontWeight: "500",
                color: files.newSignature ? "#1a7a40" : "#1a1a1a",
                marginBottom: "4px",
              }}
            >
              {files.newSignature ? files.newSignature.name : "New signature"}
            </p>
            <p style={{ fontSize: "12px", color: "#6b6b6b" }}>
              {files.newSignature
                ? "Click to replace"
                : "Click to upload — JPG, PNG or PDF"}
            </p>
            <input
              id="newSigInput"
              type="file"
              accept=".jpg,.jpeg,.png,.pdf"
              style={{ display: "none" }}
              onChange={(e) =>
                e.target.files?.[0] &&
                handleFile("newSignature", e.target.files[0])
              }
            />
          </div>

          {/* Other supporting documents */}
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
              Attach all required supporting documents.
            </p>
            {SIGNATURE.documents
              .filter(
                (doc) => doc.id !== "oldSignature" && doc.id !== "newSignature",
              )
              .map((doc) => (
                <DocUpload
                  key={doc.id}
                  doc={doc}
                  file={files[doc.id]}
                  onFile={(file) => handleFile(doc.id, file)}
                  disabled={loading}
                />
              ))}
          </div>

          {/* Buttons */}
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
