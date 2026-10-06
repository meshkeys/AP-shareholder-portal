import React, { useEffect, useRef, useState } from "react";
import Navbar from "../components/Navbar";
import DocUpload from "../components/DocUpload";
import APLogo from "../assets/AP_LOGO.png";
import { BROKERS } from "../config/brokers";
import { NIGERIAN_BANKS } from "../config/nigerianBanks";
import { DEMAT_COMPANIES } from "../config/dematCompanies";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

// Reject obviously low-quality images (too small to be legible once printed
// or reviewed by a broker/registrar). Not a full clarity check — just a
// guardrail against accidental thumbnails/heavily-compressed photos.
const MIN_IMAGE_DIMENSION = 600;
const MIN_FILE_SIZE_BYTES = 20 * 1024; // 20KB

function checkImageQuality(file) {
  return new Promise((resolve) => {
    if (!file.type.startsWith("image/")) {
      resolve({ ok: true }); // PDFs skip the dimension check
      return;
    }
    if (file.size < MIN_FILE_SIZE_BYTES) {
      resolve({
        ok: false,
        reason: "This file looks too small/compressed to be readable. Please upload a clearer image.",
      });
      return;
    }
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      if (img.width < MIN_IMAGE_DIMENSION || img.height < MIN_IMAGE_DIMENSION) {
        resolve({
          ok: false,
          reason: "This image resolution is too low to be read clearly. Please upload a higher-quality photo or scan.",
        });
      } else {
        resolve({ ok: true });
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve({ ok: true }); // couldn't inspect it — don't block submission on that
    };
    img.src = url;
  });
}

const emptyCertificate = {
  company: "",
  certificateNo: "",
  units: "",
  brokerId: "",
  brokerEmailOverride: "",
};

export default function DematForm() {
  const [fields, setFields] = useState({
    surname: "",
    firstName: "",
    middleName: "",
    address: "",
    gsm: "",
    email: "",
    cscsAccountNo: "",
    chn: "",
    rin: "",
    accountName: "",
    bankName: "",
    bankAccountNo: "",
    bvn: "",
    ageOfAccount: "",
    signatureName: "",
    // Guarantor / witness — only used when certificates are missing/lost
    witnessName: "",
    witnessGsm: "",
    witnessAddress: "",
  });

  const [certificates, setCertificates] = useState([{ ...emptyCertificate }]);
  const [certificatesMissing, setCertificatesMissing] = useState(false);

  // Used only when certificates are missing — in that case the shareholder
  // doesn't yet know which companies/holdings are involved, so there's no
  // per-holding broker to pick; one broker is chosen for the whole lookup
  // instead. When certificates ARE known, broker is selected per holding
  // (see each certificate row) since different holdings can sit with
  // different brokers.
  const [fallbackBrokerId, setFallbackBrokerId] = useState("");
  const [fallbackBrokerEmailOverride, setFallbackBrokerEmailOverride] = useState("");

  const [passportPhoto, setPassportPhoto] = useState(null);
  const [validId, setValidId] = useState(null);
  const [signatureFile, setSignatureFile] = useState(null);
  const [bankIsOther, setBankIsOther] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const errorRef = useRef(null);

  // Scroll any new error into view — a shareholder attaching a document
  // further down the form would otherwise never see a rejection reason
  // that only appears in the banner at the top.
  useEffect(() => {
    if (error) errorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [error]);
  const [submitted, setSubmitted] = useState(false);
  // One entry per broker group submitted — usually one, but more than one
  // when holdings are split across different brokers.
  const [submissionResults, setSubmissionResults] = useState([]);

  const fallbackBroker = BROKERS.find((b) => b.name === fallbackBrokerId) || null;
  const fallbackBrokerEmail = fallbackBroker?.email || fallbackBrokerEmailOverride.trim();

  function handleField(key, value) {
    setFields((prev) => ({ ...prev, [key]: value }));
  }

  function handleCertificateChange(idx, key, value) {
    setCertificates((prev) =>
      prev.map((c, i) => (i === idx ? { ...c, [key]: value } : c)),
    );
  }

  function addCertificateRow() {
    setCertificates((prev) => [...prev, { ...emptyCertificate }]);
  }

  function removeCertificateRow(idx) {
    setCertificates((prev) => prev.filter((_, i) => i !== idx));
  }

  async function handleFileSelect(setter, file) {
    const result = await checkImageQuality(file);
    if (!result.ok) {
      setError(result.reason);
      return;
    }
    setError("");
    setter(file);
  }

  function validate() {
    if (!fields.surname.trim() || !fields.firstName.trim())
      return "Please enter your surname and first name.";
    if (!fields.address.trim()) return "Please enter your address.";
    if (!fields.gsm.trim()) return "Please enter your GSM number.";
    if (!fields.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email))
      return "Please enter a valid email address.";
    if (!fields.cscsAccountNo.trim())
      return "Please enter your CSCS Investor's A/C number.";
    if (!fields.accountName.trim() || !fields.bankName.trim() || !fields.bankAccountNo.trim())
      return "Please complete your bank details for direct settlement.";
    if (!fields.signatureName.trim())
      return "Please type your full name to sign this request.";
    if (!certificatesMissing) {
      const incomplete = certificates.some(
        (c) =>
          !c.company.trim() ||
          !c.certificateNo.trim() ||
          !c.units.trim() ||
          !c.brokerId,
      );
      if (incomplete)
        return "Please select the company, broker, certificate number and unit count for every holding, or tick the box below if you don't have this information.";
      const missingBrokerEmail = certificates.some((c) => {
        const b = BROKERS.find((broker) => broker.name === c.brokerId);
        return !b?.email && !c.brokerEmailOverride.trim();
      });
      if (missingBrokerEmail)
        return "We don't have an email on file for one of your selected brokers — please enter one if you know it, or leave it blank and we'll let you know how to proceed.";
    } else {
      if (!fallbackBrokerId) return "Please select your stockbroker.";
      if (!fallbackBroker?.email && !fallbackBrokerEmailOverride.trim())
        return "We don't have an email on file for this broker — please enter one if you know it, or leave it blank and we'll let you know how to proceed.";
      if (!fields.witnessName.trim() || !fields.witnessGsm.trim())
        return "Please provide a witness name and GSM number for the indemnity section.";
    }
    if (!passportPhoto) return "Please attach a recent passport photograph.";
    if (!validId) return "Please attach a valid means of identification.";
    return "";
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const err = validate();
    if (err) {
      setError(err);
      return;
    }
    setError("");
    setLoading(true);

    try {
      const fullName = `${fields.surname} ${fields.firstName} ${fields.middleName}`.trim();

      // One submission per broker when certificates are known (holdings can
      // sit with different brokers); a single submission when they're not
      // (we don't yet know which companies/brokers are involved).
      let groups;
      if (certificatesMissing) {
        groups = [
          {
            brokerName: fallbackBroker.name,
            brokerEmail: fallbackBrokerEmail || null,
            certificates: [],
            certificatesMissing: true,
          },
        ];
      } else {
        const byBroker = new Map();
        certificates.forEach((c) => {
          if (!byBroker.has(c.brokerId)) byBroker.set(c.brokerId, []);
          byBroker.get(c.brokerId).push(c);
        });
        groups = Array.from(byBroker.entries()).map(([brokerId, certs]) => {
          const broker = BROKERS.find((b) => b.name === brokerId);
          const emailOverride = certs.find((c) => c.brokerEmailOverride.trim())?.brokerEmailOverride;
          return {
            brokerName: broker.name,
            brokerEmail: broker.email || emailOverride?.trim() || null,
            certificates: certs.map(({ company, certificateNo, units }) => ({
              company,
              certificateNo,
              units,
            })),
            certificatesMissing: false,
          };
        });
      }

      const batchId =
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

      const results = [];

      for (const group of groups) {
        const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
        const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
        const referenceNumber = `DEMAT-${date}-${rand}`;

        const submittedFields = {
          ...fields,
          fullName,
          certificates: group.certificates,
          certificatesProvidedBy: group.certificatesMissing ? null : "shareholder",
          certificatesMissing: group.certificatesMissing,
          brokerName: group.brokerName,
          brokerEmail: group.brokerEmail,
          batchId,
          batchBrokerCount: groups.length,
        };

        const res = await fetch(`${API_URL}/api/requests/submit`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            referenceNumber,
            shareholderEmail: fields.email,
            shareholderName: fullName,
            requestType: "dematerialization",
            requestSubtype: group.certificatesMissing ? "certificates_missing" : null,
            fields: submittedFields,
            documents: [],
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);

        const requestId = data.requestId;
        const savedRef = data.referenceNumber || referenceNumber;

        const filesToUpload = [["passportPhoto", passportPhoto]];
        if (validId) filesToUpload.push(["validId", validId]);
        if (signatureFile) filesToUpload.push(["shareholderSignature", signatureFile]);

        const formData = new FormData();
        formData.append("requestId", requestId);
        formData.append(
          "documentTypes",
          JSON.stringify(filesToUpload.map(([type]) => type)),
        );
        filesToUpload.forEach(([, file]) => formData.append("files", file));

        const uploadRes = await fetch(`${API_URL}/api/uploads/documents`, {
          method: "POST",
          body: formData,
        });
        if (!uploadRes.ok) {
          const uploadData = await uploadRes.json().catch(() => ({}));
          const refsSoFar = [...results.map((r) => r.referenceNumber), savedRef].join(", ");
          throw new Error(
            `${uploadData.error || "We couldn't attach your documents."} The following request(s) were saved but documents failed to attach: ${refsSoFar}. Please contact support with these reference numbers.`,
          );
        }

        let outcome;
        if (group.certificatesMissing) {
          outcome = "missing-info";
        } else if (group.brokerEmail) {
          const sendRes = await fetch(
            `${API_URL}/api/dematerialization/${requestId}/auto-send-to-broker`,
            { method: "POST" },
          );
          outcome = sendRes.ok ? "sent" : "send-failed";
        } else {
          outcome = "no-email";
        }

        results.push({ referenceNumber: savedRef, brokerName: group.brokerName, outcome });
      }

      setSubmissionResults(results);
      setSubmitted(true);
    } catch (err) {
      setError(err.message || "Submission failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const inputStyle = {
    width: "100%",
    padding: "9px 12px",
    fontSize: "14px",
    border: "1px solid #b0b0b0",
    borderRadius: "8px",
    background: "#fff",
    color: "#1a1a1a",
    outline: "none",
  };

  if (submitted) {
    const outcomeCopy = {
      sent:
        "We've emailed your stockbroker a link to review your request and complete their section. We'll be in touch once they've returned it.",
      "send-failed":
        "Your request was submitted, but we couldn't email your broker automatically — our team will reach out to them directly.",
      "no-email":
        "We don't have an email on file for your broker. Please download your submitted request and take it to them in person — they'll need to complete and stamp their section before you return it to us.",
      "missing-info":
        "Since you didn't have your certificate number(s)/units, our registrar team will look these up and then forward your request to your broker.",
    };

    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
        <Navbar />
        <main style={{ flex: 1, padding: "32px 24px", maxWidth: "560px", margin: "0 auto", width: "100%" }}>
          <div className="card" style={{ textAlign: "center" }}>
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
              <i className="ti ti-check" style={{ fontSize: "30px", color: "#E31E24" }} />
            </div>
            <h2 style={{ marginBottom: "8px" }}>
              {submissionResults.length > 1
                ? `${submissionResults.length} Dematerialization Requests Submitted`
                : "Dematerialization Request Submitted"}
            </h2>
            {submissionResults.length > 1 && (
              <p style={{ fontSize: "13px", color: "#6b6b6b", marginBottom: "16px", lineHeight: 1.6 }}>
                Your holdings were split across {submissionResults.length} brokers, so each got its
                own request and reference number.
              </p>
            )}

            {submissionResults.map((r, idx) => (
              <div
                key={r.referenceNumber}
                style={{
                  background: "#fafafa",
                  border: "1px solid #e8e8e8",
                  borderRadius: "8px",
                  padding: "16px",
                  marginBottom: idx < submissionResults.length - 1 ? "10px" : "20px",
                  textAlign: "left",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                  <div>
                    <p style={{ fontSize: "11px", color: "#6b6b6b", marginBottom: "2px" }}>
                      Reference number
                    </p>
                    <p style={{ fontSize: "18px", fontWeight: "500", letterSpacing: "1px", color: "#E31E24" }}>
                      {r.referenceNumber}
                    </p>
                  </div>
                  <p style={{ fontSize: "12px", color: "#6b6b6b", textAlign: "right" }}>
                    Broker
                    <br />
                    <strong style={{ color: "#1a1a1a" }}>{r.brokerName}</strong>
                  </p>
                </div>
                <p style={{ fontSize: "13px", color: "#1a1a1a", lineHeight: 1.6 }}>
                  {outcomeCopy[r.outcome] || outcomeCopy.sent}
                </p>
              </div>
            ))}
            <a
              href="/"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                color: "#E31E24",
                fontWeight: "500",
                fontSize: "14px",
                textDecoration: "none",
              }}
            >
              <i className="ti ti-arrow-left" style={{ fontSize: "15px" }} /> Back to portal
            </a>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Navbar />
      <main style={{ flex: 1, padding: "32px 24px", maxWidth: "640px", margin: "0 auto", width: "100%" }}>
        <div className="card">
          <img
            src={APLogo}
            alt="Africa Prudential"
            style={{ height: "34px", width: "auto", marginBottom: "18px" }}
          />
          <h1
            style={{
              fontSize: "22px",
              fontWeight: "800",
              color: "#E31E24",
              letterSpacing: "0.01em",
              marginBottom: "14px",
              lineHeight: 1.2,
            }}
          >
            FULL DEMATERIALIZATION FORM FOR MIGRATION
          </h1>

          <div
            style={{
              border: "1px solid #1a1a1a",
              borderRadius: "4px",
              padding: "8px 12px",
              fontSize: "12px",
              marginBottom: "14px",
              lineHeight: 1.5,
            }}
          >
            <strong>INSTRUCTION:</strong> Fill out the form below. Section &quot;B&quot; only
            applies if your certificate(s) is/are misplaced, lost or destroyed.
          </div>

          <p style={{ fontSize: "13px", color: "#1a1a1a", lineHeight: 1.6, marginBottom: "24px" }}>
            Please credit my account at Central Securities Clearing System (CSCS) with shares
            from my holdings in the compan{certificates.length > 1 ? "ies" : "y"} listed below. I
            recognize that this will invalidate any certificate(s) in my possession, or which
            might come into my possession, in respect of my total holding(s) in{" "}
            {certificates.length > 1 ? "these companies" : "this company"}.
          </p>

          {error && (
            <div ref={errorRef} className="alert alert-error" style={{ marginBottom: "16px" }}>
              <i className="ti ti-alert-circle" style={{ fontSize: "15px", flexShrink: 0, marginTop: "1px" }} />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            {/* Shareholder details */}
            <p className="form-section-label">Shareholder details</p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
              <div className="field-group">
                <label>Surname *</label>
                <input type="text" value={fields.surname} onChange={(e) => handleField("surname", e.target.value)} disabled={loading} />
              </div>
              <div className="field-group">
                <label>First name *</label>
                <input type="text" value={fields.firstName} onChange={(e) => handleField("firstName", e.target.value)} disabled={loading} />
              </div>
              <div className="field-group">
                <label>Middle name</label>
                <input type="text" value={fields.middleName} onChange={(e) => handleField("middleName", e.target.value)} disabled={loading} />
              </div>
            </div>

            <div className="field-group">
              <label>Address *</label>
              <input type="text" value={fields.address} onChange={(e) => handleField("address", e.target.value)} disabled={loading} />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <div className="field-group">
                <label>GSM number *</label>
                <input type="tel" value={fields.gsm} onChange={(e) => handleField("gsm", e.target.value)} placeholder="+234 800 000 0000" disabled={loading} />
              </div>
              <div className="field-group">
                <label>Email address *</label>
                <input type="email" value={fields.email} onChange={(e) => handleField("email", e.target.value)} placeholder="name@example.com" disabled={loading} />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
              <div className="field-group">
                <label>CSCS Investor's A/C No. *</label>
                <input type="text" value={fields.cscsAccountNo} onChange={(e) => handleField("cscsAccountNo", e.target.value)} disabled={loading} />
              </div>
              <div className="field-group">
                <label>Clearing House No. (CHN)</label>
                <input type="text" value={fields.chn} onChange={(e) => handleField("chn", e.target.value)} placeholder="C-XXXXXXX" disabled={loading} />
              </div>
              <div className="field-group">
                <label>Registrar's ID No. (RIN)</label>
                <input type="text" value={fields.rin} onChange={(e) => handleField("rin", e.target.value)} disabled={loading} />
              </div>
            </div>

            {/* Bank details */}
            <p className="form-section-label" style={{ marginTop: "8px" }}>
              Bank details for direct settlement
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <div className="field-group">
                <label>Account name *</label>
                <input type="text" value={fields.accountName} onChange={(e) => handleField("accountName", e.target.value)} disabled={loading} />
              </div>
              <div className="field-group">
                <label>Bank *</label>
                <select
                  value={bankIsOther ? "Other (not listed)" : fields.bankName}
                  onChange={(e) => {
                    const isOther = e.target.value === "Other (not listed)";
                    setBankIsOther(isOther);
                    handleField("bankName", isOther ? "" : e.target.value);
                  }}
                  style={inputStyle}
                  disabled={loading}
                >
                  <option value="">— Select your bank —</option>
                  {NIGERIAN_BANKS.map((group) => (
                    <optgroup key={group.group} label={group.group}>
                      {group.banks.map((bank) => (
                        <option key={bank} value={bank}>
                          {bank}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
                {bankIsOther && (
                  <input
                    type="text"
                    value={fields.bankName}
                    onChange={(e) => handleField("bankName", e.target.value)}
                    placeholder="Enter your bank's name"
                    style={{ marginTop: "8px" }}
                    disabled={loading}
                  />
                )}
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
              <div className="field-group">
                <label>Bank A/C number (NUBAN) *</label>
                <input
                  type="text"
                  value={fields.bankAccountNo}
                  onChange={(e) => handleField("bankAccountNo", e.target.value.replace(/\D/g, ""))}
                  maxLength={10}
                  inputMode="numeric"
                  disabled={loading}
                />
              </div>
              <div className="field-group">
                <label>BVN</label>
                <input
                  type="text"
                  value={fields.bvn}
                  onChange={(e) => handleField("bvn", e.target.value.replace(/\D/g, ""))}
                  maxLength={11}
                  inputMode="numeric"
                  disabled={loading}
                />
              </div>
              <div className="field-group">
                <label>Age of A/C</label>
                <input type="text" value={fields.ageOfAccount} onChange={(e) => handleField("ageOfAccount", e.target.value)} disabled={loading} />
              </div>
            </div>

            {/* Certificate details */}
            <p className="form-section-label" style={{ marginTop: "8px" }}>
              Certificate details
            </p>

            <div
              onClick={() => !loading && setCertificatesMissing((p) => !p)}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "8px",
                cursor: loading ? "default" : "pointer",
                marginBottom: "12px",
                padding: "10px 12px",
                background: certificatesMissing ? "#fff8e6" : "#fafafa",
                border: `1px solid ${certificatesMissing ? "#f5d78e" : "#e8e8e8"}`,
                borderRadius: "8px",
              }}
            >
              <input type="checkbox" checked={certificatesMissing} readOnly style={{ marginTop: "2px" }} />
              <p style={{ fontSize: "13px", color: certificatesMissing ? "#b36a00" : "#1a1a1a", lineHeight: 1.5 }}>
                I don't have my certificate number(s) or unit count — my certificate(s) may be
                misplaced, lost or destroyed. (Africa Prudential will look these up for you.)
              </p>
            </div>

            {!certificatesMissing ? (
              <>
                {certificates.map((cert, idx) => (
                  <div
                    key={idx}
                    style={{
                      border: "1px solid #e8e8e8",
                      borderRadius: "8px",
                      padding: "12px",
                      marginBottom: "10px",
                      background: "#fafafa",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                      <p style={{ fontSize: "12px", fontWeight: "500", color: "#6b6b6b", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                        Holding {idx + 1}
                      </p>
                      {certificates.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeCertificateRow(idx)}
                          disabled={loading}
                          style={{ background: "none", border: "none", cursor: "pointer", color: "#E31E24", padding: "2px" }}
                        >
                          <i className="ti ti-trash" style={{ fontSize: "15px" }} />
                        </button>
                      )}
                    </div>

                    <div className="field-group" style={{ marginBottom: "8px" }}>
                      <label>Company</label>
                      <select
                        value={cert.company}
                        onChange={(e) => handleCertificateChange(idx, "company", e.target.value)}
                        style={inputStyle}
                        disabled={loading}
                      >
                        <option value="">— Select company —</option>
                        {DEMAT_COMPANIES.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="field-group" style={{ marginBottom: "8px" }}>
                      <label>Stockbroker</label>
                      <select
                        value={cert.brokerId}
                        onChange={(e) => {
                          handleCertificateChange(idx, "brokerId", e.target.value);
                          handleCertificateChange(idx, "brokerEmailOverride", "");
                        }}
                        style={inputStyle}
                        disabled={loading}
                      >
                        <option value="">— Select stockbroker —</option>
                        {BROKERS.map((b) => (
                          <option key={b.name} value={b.name}>
                            {b.name}
                          </option>
                        ))}
                      </select>
                      {cert.brokerId && (() => {
                        const rowBroker = BROKERS.find((b) => b.name === cert.brokerId);
                        return (
                          <div style={{ marginTop: "8px" }}>
                            {rowBroker?.email ? (
                              <input type="email" value={rowBroker.email} disabled />
                            ) : (
                              <>
                                <input
                                  type="email"
                                  value={cert.brokerEmailOverride}
                                  onChange={(e) => handleCertificateChange(idx, "brokerEmailOverride", e.target.value)}
                                  placeholder="We don't have one on file — enter it if you know it"
                                  disabled={loading}
                                />
                                <p style={{ fontSize: "12px", color: "#b36a00", marginTop: "4px" }}>
                                  If left blank, you'll need to download this holding's request and
                                  deliver it to this broker yourself.
                                </p>
                              </>
                            )}
                          </div>
                        );
                      })()}
                    </div>

                    <div style={{ display: "flex", gap: "8px" }}>
                      <div className="field-group" style={{ flex: 1, marginBottom: 0 }}>
                        <label>Certificate no.</label>
                        <input
                          type="text"
                          value={cert.certificateNo}
                          onChange={(e) => handleCertificateChange(idx, "certificateNo", e.target.value)}
                          disabled={loading}
                        />
                      </div>
                      <div className="field-group" style={{ flex: 1, marginBottom: 0 }}>
                        <label>Units</label>
                        <input
                          type="text"
                          value={cert.units}
                          onChange={(e) => handleCertificateChange(idx, "units", e.target.value.replace(/\D/g, ""))}
                          inputMode="numeric"
                          disabled={loading}
                        />
                      </div>
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  className="btn-ghost"
                  style={{ width: "auto", padding: "7px 14px", fontSize: "13px", marginBottom: "8px" }}
                  onClick={addCertificateRow}
                  disabled={loading}
                >
                  <i className="ti ti-plus" style={{ fontSize: "14px" }} /> Add another holding
                </button>
                {new Set(certificates.map((c) => c.brokerId).filter(Boolean)).size > 1 && (
                  <p style={{ fontSize: "12px", color: "#6b6b6b", marginBottom: "16px", lineHeight: 1.6 }}>
                    <i className="ti ti-info-circle" style={{ fontSize: "13px", marginRight: "4px" }} />
                    These holdings use different brokers, so submitting will create a separate
                    request (and reference number) for each broker.
                  </p>
                )}
              </>
            ) : (
              <div style={{ marginBottom: "16px" }}>
                <p style={{ fontSize: "12px", color: "#6b6b6b", marginBottom: "12px", lineHeight: 1.6 }}>
                  Since your certificate(s) are missing, we need a witness to this request —
                  someone present who can confirm your identity.
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <div className="field-group">
                    <label>Witness full name *</label>
                    <input type="text" value={fields.witnessName} onChange={(e) => handleField("witnessName", e.target.value)} disabled={loading} />
                  </div>
                  <div className="field-group">
                    <label>Witness GSM number *</label>
                    <input type="tel" value={fields.witnessGsm} onChange={(e) => handleField("witnessGsm", e.target.value)} disabled={loading} />
                  </div>
                </div>
                <div className="field-group">
                  <label>Witness address</label>
                  <input type="text" value={fields.witnessAddress} onChange={(e) => handleField("witnessAddress", e.target.value)} disabled={loading} />
                </div>

                {/* Broker — used only here, since without known holdings there's no
                    per-row company/broker to split by; Africa Prudential will look
                    up the holdings first and route to the right broker(s) then. */}
                <p className="form-section-label" style={{ marginTop: "16px" }}>Your stockbroker</p>
                <p style={{ fontSize: "12px", color: "#6b6b6b", marginBottom: "12px" }}>
                  Once we've looked up your holdings, we'll send your broker the completed request
                  to confirm, sign and stamp their section.
                </p>

                <div className="field-group">
                  <label>Stockbroker *</label>
                  <select
                    value={fallbackBrokerId}
                    onChange={(e) => {
                      setFallbackBrokerId(e.target.value);
                      setFallbackBrokerEmailOverride("");
                    }}
                    style={inputStyle}
                    disabled={loading}
                  >
                    <option value="">— Select your stockbroker —</option>
                    {BROKERS.map((b) => (
                      <option key={b.name} value={b.name}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>

                {fallbackBroker && (
                  <div className="field-group">
                    <label>Broker email</label>
                    {fallbackBroker.email ? (
                      <input type="email" value={fallbackBroker.email} disabled />
                    ) : (
                      <>
                        <input
                          type="email"
                          value={fallbackBrokerEmailOverride}
                          onChange={(e) => setFallbackBrokerEmailOverride(e.target.value)}
                          placeholder="We don't have one on file — enter it if you know it"
                          disabled={loading}
                        />
                        <p style={{ fontSize: "12px", color: "#b36a00", marginTop: "4px" }}>
                          If left blank, you'll need to download your submitted request and deliver
                          it to your broker yourself.
                        </p>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Signature */}
            <p className="form-section-label" style={{ marginTop: "8px" }}>
              Your signature
            </p>
            <div className="field-group">
              <label>Type your full name to sign *</label>
              <input type="text" value={fields.signatureName} onChange={(e) => handleField("signatureName", e.target.value)} disabled={loading} />
            </div>
            <div style={{ marginBottom: "16px" }}>
              <DocUpload
                doc={{ id: "shareholderSignature", title: "Signature image (optional)", note: "Upload a photo of your handwritten signature if you'd prefer not to rely on your typed name alone.", required: false }}
                file={signatureFile}
                onFile={(file) => handleFileSelect(setSignatureFile, file)}
                disabled={loading}
              />
            </div>

            {/* Uploads */}
            <p className="form-section-label">Documents</p>
            <DocUpload
              doc={{ id: "passportPhoto", title: "Recent passport photograph", note: "A clear, recent photo on a plain background.", required: true }}
              file={passportPhoto}
              onFile={(file) => handleFileSelect(setPassportPhoto, file)}
              disabled={loading}
            />
            <DocUpload
              doc={{ id: "validId", title: "Valid means of identification", note: "NIN slip, national ID card, driver's licence, voter's card or international passport.", required: true }}
              file={validId}
              onFile={(file) => handleFileSelect(setValidId, file)}
              disabled={loading}
            />

            <button type="submit" className="btn-primary" style={{ marginTop: "16px" }} disabled={loading}>
              {loading ? (
                <>
                  <span className="spinner" /> Submitting...
                </>
              ) : (
                <>
                  <i className="ti ti-send" style={{ fontSize: "15px" }} /> Submit dematerialization request
                </>
              )}
            </button>

            <a
              href="/"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
                marginTop: "8px",
                padding: "10px",
                color: "#6b6b6b",
                fontSize: "14px",
                textDecoration: "none",
                border: "1px solid #e0e0e0",
                borderRadius: "8px",
              }}
            >
              <i className="ti ti-arrow-left" style={{ fontSize: "15px" }} /> Back to portal
            </a>
          </form>
        </div>
      </main>
    </div>
  );
}
