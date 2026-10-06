import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import DocUpload from "../components/DocUpload";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

function Field({ label, value }) {
  return (
    <div>
      <p style={{ fontSize: "11px", color: "#6b6b6b", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "3px" }}>
        {label}
      </p>
      <p style={{ fontSize: "14px", fontWeight: "500", color: "#1a1a1a" }}>{value || "—"}</p>
    </div>
  );
}

export default function BrokerReview() {
  const requestId = new URLSearchParams(window.location.search).get("id");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [request, setRequest] = useState(null);
  const [documents, setDocuments] = useState([]);

  const [brokerContactName, setBrokerContactName] = useState("");
  const [signedForm, setSignedForm] = useState(null);
  const [signedFormPreview, setSignedFormPreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!signedForm) {
      setSignedFormPreview(null);
      return;
    }
    const url = URL.createObjectURL(signedForm);
    setSignedFormPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [signedForm]);

  useEffect(() => {
    if (!requestId) {
      setError("No request specified.");
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const res = await fetch(`${API_URL}/api/dematerialization/review/${requestId}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setRequest(data.request);
        setDocuments(data.documents || []);
      } catch (err) {
        setError(err.message || "Could not load this request.");
      } finally {
        setLoading(false);
      }
    })();
  }, [requestId]);

  async function handleComplete() {
    if (!signedForm) {
      setError("Please attach your signed and stamped form before submitting.");
      return;
    }
    if (!brokerContactName.trim()) {
      setError("Please enter your name.");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("requestId", requestId);
      formData.append("documentTypes", JSON.stringify(["brokerSignedForm"]));
      formData.append("files", signedForm);

      const uploadRes = await fetch(`${API_URL}/api/uploads/documents`, {
        method: "POST",
        body: formData,
      });
      if (!uploadRes.ok) throw new Error("Upload failed. Please try again.");

      const completeRes = await fetch(
        `${API_URL}/api/dematerialization/review/${requestId}/complete`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ brokerContactName }),
        },
      );
      if (!completeRes.ok) throw new Error("Could not finalize submission.");

      setDone(true);
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
        <Navbar />
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span className="spinner spinner-dark" style={{ width: "24px", height: "24px" }} />
        </div>
      </div>
    );
  }

  if (error && !request) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
        <Navbar />
        <main style={{ flex: 1, padding: "32px 24px", maxWidth: "560px", margin: "0 auto", width: "100%" }}>
          <div className="alert alert-error">
            <i className="ti ti-alert-circle" style={{ fontSize: "15px", flexShrink: 0 }} />
            {error}
          </div>
        </main>
      </div>
    );
  }

  const fields = request.fields || {};
  const certificates = fields.certificates || [];
  const passportPhoto = documents.find((d) => d.document_type === "passportPhoto");
  const signatureImage = documents.find((d) => d.document_type === "shareholderSignature");
  const otherDocuments = documents.filter(
    (d) => d.document_type !== "passportPhoto" && d.document_type !== "shareholderSignature",
  );

  if (done) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
        <Navbar />
        <main style={{ flex: 1, padding: "32px 24px", maxWidth: "560px", margin: "0 auto", width: "100%" }}>
          <div className="card" style={{ textAlign: "center" }}>
            <div
              style={{
                width: "64px",
                height: "64px",
                background: "#f0faf4",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 20px",
              }}
            >
              <i className="ti ti-check" style={{ fontSize: "30px", color: "#1a7a40" }} />
            </div>
            <h2 style={{ marginBottom: "8px" }}>Thank you</h2>
            <p style={{ fontSize: "14px", color: "#6b6b6b", lineHeight: 1.6 }}>
              Your signed and stamped form for <strong>{request.reference_number}</strong> has been
              received and sent to Africa Prudential for final verification.
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Navbar />
      <main style={{ flex: 1, padding: "32px 24px", maxWidth: "720px", margin: "0 auto", width: "100%" }}>
        <div className="card no-print" style={{ marginBottom: "16px" }}>
          <p style={{ fontSize: "11px", fontWeight: "500", color: "#E31E24", letterSpacing: "0.6px", textTransform: "uppercase", marginBottom: "6px" }}>
            Dematerialization request — broker review
          </p>
          <h2 style={{ marginBottom: "8px" }}>Reference {request.reference_number}</h2>
          <p style={{ fontSize: "14px", color: "#6b6b6b", lineHeight: 1.6 }}>
            Your client, <strong>{request.shareholder_name}</strong>, has named you as their
            stockbroker for this dematerialization request. Please review everything below for
            accuracy, then print this page, apply your stamp and signature, and upload the signed
            copy at the bottom of this page.
          </p>
        </div>

        {error && (
          <div className="alert alert-error no-print" style={{ marginBottom: "16px" }}>
            <i className="ti ti-alert-circle" style={{ fontSize: "15px", flexShrink: 0 }} />
            {error}
          </div>
        )}

        <div className="card" style={{ marginBottom: "16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: "16px", marginBottom: "14px" }}>
            <h3 style={{ fontSize: "14px", fontWeight: "500" }}>Shareholder details</h3>
            <div
              style={{
                width: "90px",
                height: "110px",
                flexShrink: 0,
                border: "1px solid #e0e0e0",
                borderRadius: "6px",
                overflow: "hidden",
                background: "#fafafa",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {passportPhoto ? (
                <img
                  src={passportPhoto.file_url}
                  alt="Shareholder passport photograph"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                <p style={{ fontSize: "10px", color: "#b0b0b0", textAlign: "center", padding: "6px" }}>
                  No photo attached
                </p>
              )}
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
            <Field label="Full name" value={fields.fullName} />
            <Field label="Address" value={fields.address} />
            <Field label="GSM number" value={fields.gsm} />
            <Field label="Email" value={fields.email} />
            <Field label="CSCS Investor's A/C No." value={fields.cscsAccountNo} />
            <Field label="Clearing House No. (CHN)" value={fields.chn} />
            <Field label="Registrar's ID No. (RIN)" value={fields.rin} />
          </div>
        </div>

        <div className="card" style={{ marginBottom: "16px" }}>
          <h3 style={{ fontSize: "14px", fontWeight: "500", marginBottom: "14px" }}>
            Bank details for direct settlement
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
            <Field label="Account name" value={fields.accountName} />
            <Field label="Bank" value={fields.bankName} />
            <Field label="Bank A/C number (NUBAN)" value={fields.bankAccountNo} />
            <Field label="BVN" value={fields.bvn} />
            <Field label="Age of A/C" value={fields.ageOfAccount} />
          </div>
        </div>

        <div className="card" style={{ marginBottom: "16px" }}>
          <h3 style={{ fontSize: "14px", fontWeight: "500", marginBottom: "14px" }}>
            Certificate details
          </h3>
          {certificates.length === 0 ? (
            <p style={{ fontSize: "13px", color: "#b36a00" }}>
              {fields.certificatesProvidedBy === "registrar"
                ? "Provided by Africa Prudential's registrar team."
                : "Not provided — awaiting registrar verification."}
            </p>
          ) : (
            <table style={{ width: "100%", fontSize: "13px", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ textAlign: "left", color: "#6b6b6b" }}>
                  <th style={{ padding: "6px 0" }}>Certificate No.</th>
                  <th style={{ padding: "6px 0" }}>Units</th>
                </tr>
              </thead>
              <tbody>
                {certificates.map((c, idx) => (
                  <tr key={idx} style={{ borderTop: "1px solid #f0f0f0" }}>
                    <td style={{ padding: "6px 0" }}>{c.certificateNo}</td>
                    <td style={{ padding: "6px 0" }}>{c.units}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="card" style={{ marginBottom: "16px" }}>
          <h3 style={{ fontSize: "14px", fontWeight: "500", marginBottom: "14px" }}>
            Shareholder's signature
          </h3>
          <div style={{ display: "flex", alignItems: "center", gap: "20px", marginBottom: "16px" }}>
            <div
              style={{
                width: "160px",
                height: "70px",
                flexShrink: 0,
                border: "1px solid #e0e0e0",
                borderRadius: "6px",
                background: "#fafafa",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
              }}
            >
              {signatureImage ? (
                <img
                  src={signatureImage.file_url}
                  alt="Shareholder signature"
                  style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
                />
              ) : (
                <p
                  style={{
                    fontFamily: "cursive, 'Brush Script MT', sans-serif",
                    fontSize: "20px",
                    color: "#1a1a1a",
                  }}
                >
                  {fields.signatureName || "—"}
                </p>
              )}
            </div>
            <Field label="Signed by (typed name)" value={fields.signatureName} />
          </div>

          <p style={{ fontSize: "12px", fontWeight: "500", color: "#6b6b6b", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px" }}>
            Supporting documents
          </p>
          {otherDocuments.length === 0 ? (
            <p style={{ fontSize: "13px", color: "#6b6b6b" }}>No other documents attached.</p>
          ) : (
            otherDocuments.map((doc) => (
              <a
                key={doc.id}
                href={doc.file_url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  fontSize: "13px",
                  color: "#E31E24",
                  textDecoration: "none",
                  marginBottom: "6px",
                }}
              >
                <i className="ti ti-file-description" style={{ fontSize: "15px" }} />
                {doc.document_type} — {doc.file_name}
              </a>
            ))
          )}
        </div>

        <div className="no-print" style={{ marginBottom: "16px" }}>
          <button
            type="button"
            className="btn-ghost"
            onClick={() => window.print()}
            style={{ width: "auto", padding: "9px 16px" }}
          >
            <i className="ti ti-printer" style={{ fontSize: "15px" }} /> Print / Save as PDF
          </button>
        </div>

        <div className="card no-print">
          <h3 style={{ fontSize: "14px", fontWeight: "500", marginBottom: "8px" }}>
            Broker stamp and signature / seal
          </h3>
          <p style={{ fontSize: "12px", color: "#6b6b6b", marginBottom: "14px", lineHeight: 1.6 }}>
            Print this form, apply your authorized signature(s) and company stamp/seal below, then
            scan or photograph the completed page and upload it here to return it to us.
          </p>

          <div
            style={{
              border: `1.5px dashed ${signedForm ? "#a8dfc0" : "#e8b4af"}`,
              borderRadius: "8px",
              padding: signedForm ? "12px" : "28px 16px",
              textAlign: "center",
              background: signedForm ? "#f0faf4" : "#fdf1f0",
              marginBottom: "14px",
            }}
          >
            {signedForm ? (
              signedForm.type.startsWith("image/") ? (
                <img
                  src={signedFormPreview}
                  alt="Broker stamp and signature preview"
                  style={{ maxWidth: "100%", maxHeight: "220px", borderRadius: "4px" }}
                />
              ) : (
                <>
                  <i className="ti ti-file-check" style={{ fontSize: "26px", color: "#1a7a40", display: "block", marginBottom: "6px" }} />
                  <p style={{ fontSize: "13px", color: "#1a7a40", fontWeight: "500" }}>{signedForm.name}</p>
                </>
              )
            ) : (
              <>
                <i className="ti ti-writing-sign" style={{ fontSize: "26px", color: "#E31E24", display: "block", marginBottom: "6px" }} />
                <p style={{ fontSize: "13px", color: "#E31E24", fontWeight: "500" }}>
                  Awaiting broker stamp &amp; signature
                </p>
                <p style={{ fontSize: "12px", color: "#6b6b6b", marginTop: "2px" }}>
                  Attach your scanned/photographed page below
                </p>
              </>
            )}
          </div>

          <DocUpload
            doc={{ id: "brokerSignedForm", title: "Signed & stamped form", note: "Clear scan or photo of the completed, stamped document.", required: true }}
            file={signedForm}
            onFile={setSignedForm}
            disabled={submitting}
          />

          <div className="field-group" style={{ marginTop: "14px" }}>
            <label>Your name *</label>
            <input
              type="text"
              value={brokerContactName}
              onChange={(e) => setBrokerContactName(e.target.value)}
              disabled={submitting}
            />
          </div>
          <button
            type="button"
            className="btn-primary"
            style={{ marginTop: "12px" }}
            onClick={handleComplete}
            disabled={submitting}
          >
            {submitting ? (
              <>
                <span className="spinner" /> Submitting...
              </>
            ) : (
              <>
                <i className="ti ti-send" style={{ fontSize: "15px" }} /> Return to Africa Prudential
              </>
            )}
          </button>
        </div>
      </main>
    </div>
  );
}
