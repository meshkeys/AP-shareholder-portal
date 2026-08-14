import React from "react";

export default function NUBANChange({ onBack }) {
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
          NUBAN change
        </p>
        <h2 style={{ marginBottom: "6px" }}>Update your bank account number</h2>
        <p
          style={{
            fontSize: "14px",
            color: "#6b6b6b",
            marginBottom: "24px",
            lineHeight: 1.6,
          }}
        >
          To update your NUBAN (bank account number), you are required to
          complete a form on the official NIBSS website.
        </p>

        {/* Info card */}
        <div
          style={{
            background: "#fafafa",
            border: "1px solid #e8e8e8",
            borderRadius: "8px",
            padding: "20px",
            marginBottom: "24px",
          }}
        >
          {/* NIBSS logo placeholder */}
          <div
            style={{
              width: "56px",
              height: "56px",
              background: "#fdf1f0",
              borderRadius: "12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "16px",
            }}
          >
            <i
              className="ti ti-building-bank"
              style={{ fontSize: "26px", color: "#C0392B" }}
            />
          </div>
          <h3 style={{ marginBottom: "6px" }}>NIBSS NUBAN Update Portal</h3>
          <p
            style={{
              fontSize: "13px",
              color: "#6b6b6b",
              marginBottom: "16px",
              lineHeight: 1.6,
            }}
          >
            The Nigeria Inter-Bank Settlement System (NIBSS) manages all NUBAN
            account number updates. You will be redirected to their official
            portal to complete your request.
          </p>
          {/* Steps */}
          <div style={{ marginBottom: "20px" }}>
            <p
              style={{
                fontSize: "12px",
                fontWeight: "500",
                color: "#6b6b6b",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                marginBottom: "10px",
              }}
            >
              What to expect
            </p>
            {[
              "Click the button below to visit the NIBSS website",
              "Fill in your details on the NIBSS NUBAN update form",
              "Submit your request on the NIBSS portal",
              "Return here if you have other updates to make",
            ].map((step, idx) => (
              <div
                key={idx}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "10px",
                  marginBottom: "10px",
                }}
              >
                <div
                  style={{
                    width: "22px",
                    height: "22px",
                    borderRadius: "50%",
                    background: "#C0392B",
                    color: "#fff",
                    fontSize: "11px",
                    fontWeight: "500",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    marginTop: "1px",
                  }}
                >
                  {idx + 1}
                </div>
                <p
                  style={{
                    fontSize: "13px",
                    color: "#3d3d3d",
                    lineHeight: 1.5,
                  }}
                >
                  {step}
                </p>
              </div>
            ))}
          </div>
          {/* External link button */}

          <a
            href="https://docuhub3.nibss-plc.com.ng/edmms/self-service"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              width: "100%",
              padding: "10px 16px",
              background: "#C0392B",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: "500",
              cursor: "pointer",
              textDecoration: "none",
              boxSizing: "border-box",
            }}
          >
            <i className="ti ti-external-link" style={{ fontSize: "15px" }} />
            Click here to fill the form
          </a>
          {/* Disclaimer */}
          <p
            style={{
              fontSize: "11px",
              color: "#b0b0b0",
              textAlign: "center",
              marginTop: "12px",
              lineHeight: 1.5,
            }}
          >
            You will be redirected to an external website (nibss-plc.com.ng).
            This is not affiliated with ShareReg Portal.
          </p>
        </div>

        {/* Back button */}
        <button className="btn-ghost" onClick={onBack}>
          <i className="ti ti-arrow-left" style={{ fontSize: "15px" }} /> Back
          to update options
        </button>
      </div>
    </div>
  );
}
