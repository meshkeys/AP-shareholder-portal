import React from "react";

export default function Success({ ticket, onUpdateAnother, onDone }) {
  const isConfirm = ticket?.type === "confirm";

  return (
    <div style={{ maxWidth: "560px", margin: "0 auto" }}>
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
          {isConfirm ? "Details confirmed" : "Request submitted successfully"}
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
          {isConfirm
            ? "Your shareholder record has been noted as correct. No changes were made."
            : "Your request has been received and will be reviewed by our team."}
        </p>

        {/* Ticket box */}
        <div
          style={{
            background: "#fafafa",
            border: "1px solid #e8e8e8",
            borderRadius: "8px",
            padding: "16px",
            marginBottom: "24px",
            textAlign: "left",
          }}
        >
          {/* Request type */}
          {ticket?.label && (
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "8px 0",
                borderBottom: "1px solid #f0f0f0",
                fontSize: "13px",
              }}
            >
              <span style={{ color: "#6b6b6b" }}>Request type</span>
              <span
                style={{
                  fontWeight: "500",
                  textAlign: "right",
                  maxWidth: "60%",
                }}
              >
                {ticket.label}
              </span>
            </div>
          )}

          {/* Reference number */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "8px 0",
              borderBottom: "1px solid #f0f0f0",
              fontSize: "13px",
            }}
          >
            <span style={{ color: "#6b6b6b" }}>Reference number</span>
            <span
              style={{
                fontWeight: "600",
                color: "#C0392B",
                fontSize: "15px",
                letterSpacing: "1px",
              }}
            >
              {ticket?.referenceNumber}
            </span>
          </div>

          {/* Date */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "8px 0",
              fontSize: "13px",
            }}
          >
            <span style={{ color: "#6b6b6b" }}>Date submitted</span>
            <span style={{ fontWeight: "500" }}>
              {new Date().toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "long",
                year: "numeric",
              })}
            </span>
          </div>
        </div>

        {/* Next steps */}
        {!isConfirm && (
          <div
            style={{
              background: "#f0f4ff",
              border: "1px solid #c0d0f5",
              borderRadius: "8px",
              padding: "14px",
              textAlign: "left",
              marginBottom: "24px",
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
              <li>
                A confirmation email will be sent to your registered address.
              </li>
              <li>Your request will be reviewed within 3–5 business days.</li>
              <li>
                You may be contacted if additional information is required.
              </li>
              <li>Keep your reference number for any follow-up enquiries.</li>
            </ul>
          </div>
        )}

        {/* Support */}
        <p style={{ fontSize: "13px", color: "#6b6b6b", marginBottom: "24px" }}>
          Need help?{" "}
          <a
            href="mailto:support@sharereg.ng"
            style={{ color: "#C0392B", fontWeight: "500" }}
          >
            support@sharereg.ng
          </a>
        </p>

        {/* Action buttons */}
        <button
          className="btn-primary"
          onClick={onUpdateAnother}
          style={{ marginBottom: "8px" }}
        >
          <i className="ti ti-plus" style={{ fontSize: "15px" }} /> Make another
          update
        </button>

        <button className="btn-ghost" onClick={onDone}>
          <i className="ti ti-home" style={{ fontSize: "15px" }} /> I am done
        </button>
      </div>
    </div>
  );
}
