import React from "react";

export default function Success({ referenceNumber, type }) {
  const isUpdate = type === "update";

  return (
    <div className="card" style={{ textAlign: "center" }}>
      {/* Icon */}
      <div
        style={{
          width: "64px",
          height: "64px",
          background: "#fdf1f0",
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 20px",
        }}
      >
        <i
          className="ti ti-check"
          style={{ fontSize: "30px", color: "#C0392B" }}
          aria-hidden="true"
        />
      </div>

      {/* Title */}
      <h2 style={{ marginBottom: "8px" }}>
        {isUpdate ? "Update request submitted" : "Details confirmed"}
      </h2>

      {/* Message */}
      <p
        style={{
          fontSize: "14px",
          color: "#6b6b6b",
          lineHeight: 1.6,
          marginBottom: "24px",
        }}
      >
        {isUpdate
          ? "Your update request has been received and is pending review by our team."
          : "Your shareholder record has been noted as correct. No changes were made."}
      </p>

      {/* Reference number */}
      <div
        style={{
          background: "#fafafa",
          border: "1px solid #e8e8e8",
          borderRadius: "8px",
          padding: "16px",
          marginBottom: "24px",
        }}
      >
        <p style={{ fontSize: "12px", color: "#6b6b6b", marginBottom: "4px" }}>
          Reference number
        </p>
        <p
          style={{
            fontSize: "22px",
            fontWeight: "500",
            letterSpacing: "2px",
            color: "#C0392B",
          }}
        >
          {referenceNumber}
        </p>
      </div>

      {/* Next steps */}
      <div
        style={{
          background: "#f0f4ff",
          border: "1px solid #c0d0f5",
          borderRadius: "8px",
          padding: "14px",
          textAlign: "left",
          marginBottom: "20px",
        }}
      >
        <p
          style={{
            fontSize: "13px",
            fontWeight: "500",
            color: "#2255cc",
            marginBottom: "8px",
          }}
        >
          <i
            className="ti ti-info-circle"
            style={{
              fontSize: "14px",
              marginRight: "6px",
              verticalAlign: "-2px",
            }}
          />
          What happens next
        </p>
        <ul
          style={{
            fontSize: "13px",
            color: "#2255cc",
            paddingLeft: "18px",
            lineHeight: 1.8,
          }}
        >
          <li>A confirmation email will be sent to your registered address.</li>
          {isUpdate && (
            <li>
              Your update request will be reviewed within 3–5 business days.
            </li>
          )}
          {isUpdate && (
            <li>You may be contacted if additional information is required.</li>
          )}
          <li>Keep your reference number for any follow-up enquiries.</li>
        </ul>
      </div>

      {/* Support */}
      <p style={{ fontSize: "13px", color: "#6b6b6b" }}>
        Need help?{" "}
        <a
          href="mailto:support@sharereg.ng"
          style={{ color: "#C0392B", fontWeight: "500" }}
        >
          support@sharereg.ng
        </a>
      </p>
    </div>
  );
}
