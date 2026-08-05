import React, { useRef } from "react";

/**
 * Reusable signatory row component.
 * Used in corporate name change form.
 *
 * Props:
 * - index: number (signatory number)
 * - signatory: { name, bvn, passport }
 * - onChange: callback when field changes
 * - onRemove: callback to remove this signatory
 * - disabled: boolean
 */

export default function SignatoryRow({
  index,
  signatory,
  onChange,
  onRemove,
  disabled,
}) {
  const passportRef = useRef();

  function handleField(key, value) {
    onChange(index, { ...signatory, [key]: value });
  }

  function handlePassport(e) {
    if (e.target.files?.[0]) {
      onChange(index, { ...signatory, passport: e.target.files[0] });
    }
  }

  return (
    <div
      style={{
        background: "#fafafa",
        border: "1px solid #e8e8e8",
        borderRadius: "8px",
        padding: "16px",
        marginBottom: "12px",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "14px",
        }}
      >
        <p style={{ fontSize: "13px", fontWeight: "500", color: "#1a1a1a" }}>
          <i
            className="ti ti-user"
            style={{ fontSize: "14px", marginRight: "6px", color: "#C0392B" }}
          />
          Signatory {index + 1}
        </p>
        {index > 0 && (
          <button
            type="button"
            onClick={() => onRemove(index)}
            disabled={disabled}
            style={{
              background: "none",
              border: "none",
              color: "#C0392B",
              fontSize: "12px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "4px",
              padding: 0,
            }}
          >
            <i className="ti ti-trash" style={{ fontSize: "13px" }} />
            Remove
          </button>
        )}
      </div>

      {/* Full name */}
      <div className="field-group">
        <label>
          Full name <span className="tag tag-required">required</span>
        </label>
        <input
          type="text"
          value={signatory.name || ""}
          onChange={(e) => handleField("name", e.target.value)}
          placeholder="Signatory full name"
          disabled={disabled}
        />
      </div>

      {/* BVN */}
      <div className="field-group">
        <label>
          BVN <span className="tag tag-required">required</span>
        </label>
        <input
          type="text"
          value={signatory.bvn || ""}
          onChange={(e) =>
            handleField("bvn", e.target.value.replace(/\D/g, ""))
          }
          placeholder="Bank Verification Number"
          maxLength={11}
          inputMode="numeric"
          disabled={disabled}
        />
      </div>

      {/* Passport photograph */}
      <div>
        <label>
          Passport photograph <span className="tag tag-required">required</span>
        </label>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "10px 12px",
            background: signatory.passport ? "#f0faf4" : "#fff",
            border: `1px solid ${signatory.passport ? "#a8dfc0" : "#e0e0e0"}`,
            borderRadius: "6px",
            marginTop: "5px",
          }}
        >
          <div>
            {signatory.passport ? (
              <p
                style={{
                  fontSize: "12px",
                  color: "#1a7a40",
                  fontWeight: "500",
                }}
              >
                <i
                  className="ti ti-check"
                  style={{ fontSize: "12px", marginRight: "4px" }}
                />
                {signatory.passport.name}
              </p>
            ) : (
              <p style={{ fontSize: "12px", color: "#6b6b6b" }}>
                No file selected — JPG, PNG or PDF
              </p>
            )}
          </div>
          <input
            ref={passportRef}
            type="file"
            accept=".jpg,.jpeg,.png,.pdf"
            style={{ display: "none" }}
            onChange={handlePassport}
            disabled={disabled}
          />
          <button
            type="button"
            onClick={() => passportRef.current?.click()}
            disabled={disabled}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "5px",
              fontSize: "12px",
              padding: "6px 10px",
              borderRadius: "6px",
              border: signatory.passport
                ? "1px solid #a8dfc0"
                : "1px solid #e8b4af",
              background: signatory.passport ? "#f0faf4" : "#fdf1f0",
              color: signatory.passport ? "#1a7a40" : "#C0392B",
              cursor: disabled ? "not-allowed" : "pointer",
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
          >
            <i
              className={`ti ${signatory.passport ? "ti-check" : "ti-upload"}`}
              style={{ fontSize: "13px" }}
            />
            {signatory.passport ? "Attached" : "Attach"}
          </button>
        </div>
      </div>
    </div>
  );
}
