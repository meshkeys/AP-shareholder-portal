import React, { useRef } from "react";

/**
 * Reusable document upload component.
 * Used across all update forms.
 *
 * Props:
 * - doc: { id, title, note, required }
 * - file: the current file object or null
 * - onFile: callback when file is selected
 * - disabled: boolean
 */

export default function DocUpload({ doc, file, onFile, disabled }) {
  const inputRef = useRef();
  const uploaded = !!file;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "12px",
        background: uploaded ? "#f0faf4" : "#fafafa",
        border: `1px solid ${uploaded ? "#a8dfc0" : "#e8e8e8"}`,
        borderRadius: "8px",
        marginBottom: "8px",
        gap: "12px",
        transition: "all 0.2s",
      }}
    >
      {/* Left — icon + info */}
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
          className={`ti ${uploaded ? "ti-circle-check" : "ti-file-description"}`}
          style={{
            fontSize: "20px",
            color: uploaded ? "#1a7a40" : "#C0392B",
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
              <span className="tag tag-optional">if applicable</span>
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

      {/* Right — attach button */}
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
            cursor: disabled ? "not-allowed" : "pointer",
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
