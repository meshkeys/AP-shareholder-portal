import React, { useState } from "react";
import DocUpload from "../components/DocUpload";
import {
  UPDATE_CATEGORIES,
  SECONDARY_MARKET_DOCS,
} from "../config/updateCategories";

const NAME_CHANGE = UPDATE_CATEGORIES.find((c) => c.id === "nameChange");

const SUB_TYPE_OPTIONS = [
  { id: "male", label: "Male individual" },
  { id: "femaleMarried", label: "Female individual — Married" },
  { id: "femaleDivorcee", label: "Female individual — Divorcee" },
  { id: "corporate", label: "Corporate entity" },
];

function emptyFiles(documents) {
  return documents.reduce((acc, doc) => ({ ...acc, [doc.id]: null }), {});
}

export default function NameChangeForm({ profile, onNext, onBack }) {
  const [subType, setSubType] = useState(null);
  const [secondaryMarket, setSecondaryMarket] = useState(null); // null=not chosen, true/false
  const [fields, setFields] = useState({});
  const [files, setFiles] = useState({});
  const [secondaryFiles, setSecondaryFiles] = useState(
    emptyFiles(SECONDARY_MARKET_DOCS),
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handleSubType(id) {
    const selected = NAME_CHANGE.subTypes.find((s) => s.id === id);
    setSubType(selected);
    setSecondaryMarket(null);
    setFields({});
    setFiles(emptyFiles(selected.documents));
    setSecondaryFiles(emptyFiles(SECONDARY_MARKET_DOCS));
    setError("");
  }

  function handleSecondaryMarketChoice(choice) {
    setSecondaryMarket(choice);
    setError("");
  }

  function handleField(key, value) {
    setFields((prev) => ({ ...prev, [key]: value }));
  }

  function handleFile(docId, file) {
    setFiles((prev) => ({ ...prev, [docId]: file }));
  }

  function handleSecondaryFile(docId, file) {
    setSecondaryFiles((prev) => ({ ...prev, [docId]: file }));
  }

  function validate() {
    if (!subType) return "Please select a name change type.";
    if (secondaryMarket === null)
      return "Please indicate whether your shares were purchased on the secondary market.";

    if (secondaryMarket === true) {
      // Only validate secondary market docs
      for (const doc of SECONDARY_MARKET_DOCS) {
        if (doc.required && !secondaryFiles[doc.id]) {
          return `Please attach: ${doc.title}`;
        }
      }
    } else {
      // Validate main form fields
      for (const field of subType.fields) {
        if (field.required && !fields[field.key]?.trim()) {
          return `Please fill in: ${field.label}`;
        }
      }
      // Validate main documents
      for (const doc of subType.documents) {
        if (doc.required && !files[doc.id]) {
          return `Please attach: ${doc.title}`;
        }
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
        updateType: "nameChange",
        subType: subType.id,
        subTypeLabel: subType.label,
        fields: secondaryMarket ? {} : fields,
        files: secondaryMarket ? secondaryFiles : files,
        secondaryMarket,
        secondaryFiles: secondaryMarket ? secondaryFiles : {},
        tagPrefix: NAME_CHANGE.tagPrefix,
        label: secondaryMarket
          ? `${NAME_CHANGE.label} — ${subType.label} (Secondary market)`
          : `${NAME_CHANGE.label} — ${subType.label}`,
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
          Name change
        </p>
        <h2 style={{ marginBottom: "6px" }}>Update your registered name</h2>
        <p
          style={{
            fontSize: "14px",
            color: "#6b6b6b",
            marginBottom: "16px",
            lineHeight: 1.6,
          }}
        >
          Select the option that applies to you, then answer the questions
          below.
        </p>

        {/* Important note */}
        <div
          style={{
            background: "#fdf1f0",
            border: "1px solid #e8b4af",
            borderRadius: "8px",
            padding: "12px 14px",
            marginBottom: "24px",
            display: "flex",
            gap: "10px",
          }}
        >
          <i
            className="ti ti-alert-triangle"
            style={{
              fontSize: "16px",
              color: "#C0392B",
              flexShrink: 0,
              marginTop: "1px",
            }}
          />
          <p style={{ fontSize: "13px", color: "#C0392B", lineHeight: 1.5 }}>
            <strong>Important:</strong> Your new name must tally with your bank
            account name pattern.
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

        <form onSubmit={handleProceed} noValidate>
          {/* ── Sub-type selector ── */}
          <label style={{ marginBottom: "10px", display: "block" }}>
            Select type
          </label>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "8px",
              marginBottom: "24px",
            }}
          >
            {SUB_TYPE_OPTIONS.map((opt) => {
              const isSelected = subType?.id === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handleSubType(opt.id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    padding: "12px 14px",
                    background: isSelected ? "#fdf1f0" : "#fafafa",
                    border: `1.5px solid ${isSelected ? "#C0392B" : "#e8e8e8"}`,
                    borderRadius: "8px",
                    cursor: "pointer",
                    textAlign: "left",
                    transition: "all 0.15s",
                    width: "100%",
                  }}
                >
                  <div
                    style={{
                      width: "18px",
                      height: "18px",
                      borderRadius: "50%",
                      border: `2px solid ${isSelected ? "#C0392B" : "#d0d0d0"}`,
                      background: isSelected ? "#C0392B" : "transparent",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    {isSelected && (
                      <i
                        className="ti ti-check"
                        style={{ fontSize: "10px", color: "#fff" }}
                      />
                    )}
                  </div>
                  <span
                    style={{
                      fontSize: "14px",
                      color: isSelected ? "#C0392B" : "#1a1a1a",
                      fontWeight: isSelected ? "500" : "400",
                    }}
                  >
                    {opt.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* ── Secondary market question — shown immediately after subtype is picked ── */}
          {subType && (
            <div
              style={{
                borderTop: "1px solid #f0f0f0",
                paddingTop: "20px",
                marginBottom: "20px",
              }}
            >
              <p
                style={{
                  fontSize: "14px",
                  fontWeight: "500",
                  color: "#1a1a1a",
                  marginBottom: "6px",
                }}
              >
                Were your shares purchased on the secondary market?
              </p>
              <p
                style={{
                  fontSize: "13px",
                  color: "#6b6b6b",
                  marginBottom: "14px",
                  lineHeight: 1.5,
                }}
              >
                The secondary market includes shares bought through a
                stockbroker or the stock exchange.
              </p>

              <div
                style={{ display: "flex", gap: "10px", marginBottom: "20px" }}
              >
                {/* Yes */}
                <button
                  type="button"
                  onClick={() => handleSecondaryMarketChoice(true)}
                  style={{
                    flex: 1,
                    padding: "12px",
                    background:
                      secondaryMarket === true ? "#fdf1f0" : "#fafafa",
                    border: `1.5px solid ${secondaryMarket === true ? "#C0392B" : "#e8e8e8"}`,
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontSize: "14px",
                    fontWeight: secondaryMarket === true ? "500" : "400",
                    color: secondaryMarket === true ? "#C0392B" : "#1a1a1a",
                    transition: "all 0.15s",
                  }}
                >
                  <i
                    className="ti ti-check"
                    style={{
                      fontSize: "15px",
                      marginRight: "6px",
                      verticalAlign: "-2px",
                    }}
                  />
                  Yes
                </button>

                {/* No */}
                <button
                  type="button"
                  onClick={() => handleSecondaryMarketChoice(false)}
                  style={{
                    flex: 1,
                    padding: "12px",
                    background:
                      secondaryMarket === false ? "#fdf1f0" : "#fafafa",
                    border: `1.5px solid ${secondaryMarket === false ? "#C0392B" : "#e8e8e8"}`,
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontSize: "14px",
                    fontWeight: secondaryMarket === false ? "500" : "400",
                    color: secondaryMarket === false ? "#C0392B" : "#1a1a1a",
                    transition: "all 0.15s",
                  }}
                >
                  <i
                    className="ti ti-x"
                    style={{
                      fontSize: "15px",
                      marginRight: "6px",
                      verticalAlign: "-2px",
                    }}
                  />
                  No
                </button>
              </div>

              {/* ── SECONDARY MARKET PATH ── */}
              {secondaryMarket === true && (
                <div>
                  <div
                    className="alert alert-info"
                    style={{ marginBottom: "16px" }}
                  >
                    <i
                      className="ti ti-info-circle"
                      style={{
                        fontSize: "15px",
                        flexShrink: 0,
                        marginTop: "1px",
                      }}
                    />
                    For secondary market transactions, attach only the documents
                    below and submit.
                  </div>
                  <SectionLabel>Required documents</SectionLabel>
                  {SECONDARY_MARKET_DOCS.map((doc) => (
                    <DocUpload
                      key={doc.id}
                      doc={doc}
                      file={secondaryFiles[doc.id]}
                      onFile={(file) => handleSecondaryFile(doc.id, file)}
                      disabled={loading}
                    />
                  ))}
                </div>
              )}

              {/* ── MAIN FORM PATH ── */}
              {secondaryMarket === false && (
                <div>
                  {/* Fields */}
                  {subType.fields.length > 0 && (
                    <div style={{ marginBottom: "20px" }}>
                      <SectionLabel>Updated details</SectionLabel>
                      {subType.fields.map((field) => (
                        <div key={field.key} className="field-group">
                          <label>
                            {field.label}{" "}
                            {field.required ? (
                              <span className="tag tag-required">required</span>
                            ) : (
                              <span className="tag tag-optional">optional</span>
                            )}
                          </label>
                          <input
                            type={field.type}
                            value={fields[field.key] || ""}
                            onChange={(e) =>
                              handleField(field.key, e.target.value)
                            }
                            disabled={loading}
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Documents */}
                  <SectionLabel>Supporting documents</SectionLabel>
                  <p
                    style={{
                      fontSize: "13px",
                      color: "#6b6b6b",
                      marginBottom: "12px",
                      lineHeight: 1.5,
                    }}
                  >
                    Attach all required documents to support your name change
                    request.
                  </p>
                  {subType.documents.map((doc) => (
                    <DocUpload
                      key={doc.id}
                      doc={doc}
                      file={files[doc.id]}
                      onFile={(file) => handleFile(doc.id, file)}
                      disabled={loading}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Buttons ── */}
          <button
            type="submit"
            className="btn-primary"
            style={{ marginTop: "8px" }}
            disabled={loading || !subType || secondaryMarket === null}
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
