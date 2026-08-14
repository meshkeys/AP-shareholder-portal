import React, { useRef, useState } from "react";

export default function ReviewSummary({
  submission,
  profile,
  onConfirm,
  onBack,
}) {
  const printRef = useRef();
  const [loading, setLoading] = useState(false);

  function handlePrint() {
    window.print();
  }

  async function handleSubmit() {
    setLoading(true);
    try {
      const refNumber = generateReference();

      // Step 1 — Submit the request
      const res = await fetch(
        `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/requests/submit`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            referenceNumber: refNumber,
            shareholderEmail: profile.email,
            shareholderName: `${profile.firstName} ${profile.lastName}`,
            requestType: submission.updateType,
            requestSubtype: submission.subTypeLabel || null,
            fields: submission.fields || {},
            documents: [],
          }),
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      const requestId = data.requestId;

      // Step 2 — Upload documents if any
      const allFiles = [];
      const allTypes = [];

      // Collect main files
      if (submission.files) {
        Object.entries(submission.files).forEach(([docType, file]) => {
          if (file instanceof File) {
            allFiles.push(file);
            allTypes.push(docType);
          }
        });
      }

      // Collect secondary market files
      if (submission.secondaryMarket && submission.secondaryFiles) {
        Object.entries(submission.secondaryFiles).forEach(([docType, file]) => {
          if (file instanceof File) {
            allFiles.push(file);
            allTypes.push(`secondary_${docType}`);
          }
        });
      }

      // Upload files if any
      if (allFiles.length > 0) {
        const formData = new FormData();
        formData.append("requestId", requestId);
        formData.append("documentTypes", JSON.stringify(allTypes));
        allFiles.forEach((file) => formData.append("files", file));

        const uploadRes = await fetch(
          `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/uploads/documents`,
          {
            method: "POST",
            body: formData,
          },
        );
        const uploadData = await uploadRes.json();
        if (!uploadRes.ok)
          console.error("Document upload failed:", uploadData.error);
      }

      onConfirm({ referenceNumber: data.referenceNumber || refNumber });
    } catch (err) {
      console.error("Submission error:", err);
      onConfirm({ referenceNumber: generateReference() });
    } finally {
      setLoading(false);
    }
  }

  function generateReference() {
    const prefix = submission.tagPrefix || "REQ";
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${prefix}-${date}-${rand}`;
  }

  const submittedDate = new Date().toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return (
    <div style={{ maxWidth: "560px", margin: "0 auto" }}>
      {/* Action buttons — hidden on print */}
      <div
        className="no-print"
        style={{ display: "flex", gap: "10px", marginBottom: "16px" }}
      >
        <button className="btn-ghost" style={{ flex: 1 }} onClick={onBack}>
          <i className="ti ti-arrow-left" style={{ fontSize: "15px" }} /> Back
          to edit
        </button>
        <button className="btn-ghost" style={{ flex: 1 }} onClick={handlePrint}>
          <i className="ti ti-printer" style={{ fontSize: "15px" }} /> Print /
          Save as PDF
        </button>
      </div>

      {/* Printable summary */}
      <div ref={printRef} className="card" id="print-area">
        {/* Portal header — shown on print */}
        <div
          style={{
            borderBottom: "2px solid #C0392B",
            paddingBottom: "16px",
            marginBottom: "20px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              marginBottom: "4px",
            }}
          >
            <div
              style={{
                width: "36px",
                height: "36px",
                background: "#C0392B",
                borderRadius: "6px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                fontSize: "13px",
                fontWeight: "600",
              }}
            >
              SR
            </div>
            <div>
              <p style={{ fontSize: "14px", fontWeight: "500" }}>
                ShareReg Portal
              </p>
              <p style={{ fontSize: "11px", color: "#6b6b6b" }}>
                Shareholder Registry Services
              </p>
            </div>
          </div>
        </div>

        {/* Title */}
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
          Request summary
        </p>
        <h2 style={{ marginBottom: "4px" }}>{submission.label}</h2>
        <p style={{ fontSize: "13px", color: "#6b6b6b", marginBottom: "24px" }}>
          Date: {submittedDate}
        </p>

        {/* Shareholder info */}
        <SectionLabel>Shareholder information</SectionLabel>
        <InfoRow
          label="Full name"
          value={`${profile.firstName} ${profile.lastName}`}
        />
        <InfoRow label="CHN/CSCS number" value={profile.cscsNumber} />
        <InfoRow label="Email" value={profile.email} />

        {/* Request details */}
        {Object.keys(submission.fields).length > 0 && (
          <div style={{ marginTop: "20px" }}>
            <SectionLabel>Updated information</SectionLabel>
            {Object.entries(submission.fields).map(([key, value]) => {
              if (!value) return null;
              return <InfoRow key={key} label={formatKey(key)} value={value} />;
            })}
          </div>
        )}

        {/* Sub type if applicable */}
        {submission.subTypeLabel && (
          <div style={{ marginTop: "20px" }}>
            <SectionLabel>Request type</SectionLabel>
            <InfoRow label="Category" value={submission.subTypeLabel} />
          </div>
        )}

        {/* Documents submitted */}
        {Object.keys(submission.files).length > 0 && (
          <div style={{ marginTop: "20px" }}>
            <SectionLabel>Documents attached</SectionLabel>
            {Object.entries(submission.files).map(([docId, file]) => {
              if (!file) return null;
              return (
                <div
                  key={docId}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "8px 0",
                    borderBottom: "1px solid #f0f0f0",
                    fontSize: "13px",
                  }}
                >
                  <i
                    className="ti ti-file-check"
                    style={{
                      fontSize: "15px",
                      color: "#1a7a40",
                      flexShrink: 0,
                    }}
                  />
                  <span style={{ color: "#3d3d3d" }}>{file.name}</span>
                </div>
              );
            })}

            {/* Secondary market docs if applicable */}
            {submission.secondaryMarket &&
              submission.secondaryFiles &&
              Object.entries(submission.secondaryFiles).map(([docId, file]) => {
                if (!file) return null;
                return (
                  <div
                    key={docId}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "8px 0",
                      borderBottom: "1px solid #f0f0f0",
                      fontSize: "13px",
                    }}
                  >
                    <i
                      className="ti ti-file-check"
                      style={{
                        fontSize: "15px",
                        color: "#1a7a40",
                        flexShrink: 0,
                      }}
                    />
                    <span style={{ color: "#3d3d3d" }}>
                      {file.name}{" "}
                      <span style={{ color: "#6b6b6b" }}>
                        (secondary market)
                      </span>
                    </span>
                  </div>
                );
              })}
          </div>
        )}

        {/* Declaration */}
        <div
          style={{
            background: "#fafafa",
            border: "1px solid #e8e8e8",
            borderRadius: "8px",
            padding: "14px",
            marginTop: "24px",
          }}
        >
          <p style={{ fontSize: "12px", color: "#6b6b6b", lineHeight: 1.6 }}>
            <strong style={{ color: "#1a1a1a" }}>Declaration:</strong> I confirm
            that the information provided in this request is accurate and
            complete to the best of my knowledge. I understand that providing
            false information may result in rejection of this request.
          </p>
        </div>
      </div>
      {/* Submit button — hidden on print */}
      <div className="no-print" style={{ marginTop: "16px" }}>
        <button className="btn-primary" onClick={handleSubmit}>
          <i className="ti ti-send" style={{ fontSize: "15px" }} /> Submit this
          request
        </button>
      </div>
    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function SectionLabel({ children }) {
  return (
    <p
      style={{
        fontSize: "11px",
        fontWeight: "500",
        color: "#6b6b6b",
        textTransform: "uppercase",
        letterSpacing: "0.6px",
        marginBottom: "10px",
        marginTop: "4px",
      }}
    >
      {children}
    </p>
  );
}

function InfoRow({ label, value }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "9px 0",
        borderBottom: "1px solid #f0f0f0",
        fontSize: "13px",
      }}
    >
      <span style={{ color: "#6b6b6b" }}>{label}</span>
      <span style={{ fontWeight: "500", textAlign: "right", maxWidth: "60%" }}>
        {value}
      </span>
    </div>
  );
}

function formatKey(key) {
  const map = {
    newFirstName: "New first name",
    newLastName: "New last name",
    newCompanyName: "New company name",
    phone: "Phone number",
    email: "Email address",
    tin: "TIN",
    address: "New address",
    state: "State",
    country: "Country",
    bvn: "BVN",
  };
  return map[key] || key;
}
