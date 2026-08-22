import React, { useState } from "react";
import Navbar from "../components/Navbar";

const OCCUPATIONS = [
  "Accountant",
  "Actor / Entertainer",
  "Architect",
  "Artist",
  "Business Owner",
  "Civil Servant",
  "Clergy / Religious Leader",
  "Consultant",
  "Doctor / Physician",
  "Driver",
  "Engineer",
  "Farmer / Agriculturist",
  "Financial Analyst",
  "Journalist",
  "Lawyer / Legal Practitioner",
  "Lecturer / Professor",
  "Mechanic",
  "Nurse / Midwife",
  "Pharmacist",
  "Pilot",
  "Police / Military Officer",
  "Politician",
  "Realtor / Estate Agent",
  "Retired",
  "Sales Representative",
  "Secretary / Administrator",
  "Self Employed",
  "Software Developer / IT Professional",
  "Student",
  "Surveyor",
  "Tailor / Fashion Designer",
  "Teacher",
  "Trader / Merchant",
  "Transport / Logistics",
  "Unemployed",
  "Other",
];

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function KYCStandalone() {
  const [fields, setFields] = useState({
    fullName: "",
    cscsNumber: "",
    phone: "",
    email: "",
    tin: "",
    gender: "",
    dob: "",
    nin: "",
    occupation: "",
    maritalStatus: "",
    address: "",
    comments: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [refNumber, setRefNumber] = useState("");
  const [idFile, setIdFile] = useState(null);
  const idInputRef = React.useRef();
  const [signatureFile, setSignatureFile] = useState(null);
  const signatureInputRef = React.useRef();

  function handleField(key, value) {
    setFields((prev) => ({ ...prev, [key]: value }));
  }

  function validate() {
    if (!fields.fullName.trim()) return "Please enter your full name.";
    if (!fields.cscsNumber.trim()) return "Please enter your CHN/CSCS number.";
    if (!fields.email.trim()) return "Please enter your email address.";
    if (fields.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email)) {
      return "Enter a valid email address.";
    }
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
      const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
      const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
      const referenceNumber = `KYC-${date}-${rand}`;

      // Submit request
      const res = await fetch(`${API_URL}/api/requests/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          referenceNumber,
          shareholderEmail: fields.email,
          shareholderName: fields.fullName,
          requestType: "kycUpdate",
          requestSubtype: "standalone",
          fields,
          documents: [],
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      const requestId = data.requestId;

      // Upload documents if provided
      const filesToUpload = [];
      const typesToUpload = [];

      if (idFile) {
        filesToUpload.push(idFile);
        typesToUpload.push("validId");
      }

      if (signatureFile) {
        filesToUpload.push(signatureFile);
        typesToUpload.push("signature");
      }

      if (filesToUpload.length > 0 && requestId) {
        const formData = new FormData();
        formData.append("requestId", requestId);
        formData.append("documentTypes", JSON.stringify(typesToUpload));
        filesToUpload.forEach((file) => formData.append("files", file));

        await fetch(`${API_URL}/api/uploads/documents`, {
          method: "POST",
          body: formData,
        });
      }

      setRefNumber(data.referenceNumber || referenceNumber);
      setSubmitted(true);

      setRefNumber(data.referenceNumber || referenceNumber);
      setSubmitted(true);
    } catch (err) {
      setError(err.message || "Submission failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const selectStyle = {
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
    return (
      <div
        style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}
      >
        <Navbar />
        <main
          style={{
            flex: 1,
            padding: "32px 24px",
            maxWidth: "560px",
            margin: "0 auto",
            width: "100%",
          }}
        >
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
              <i
                className="ti ti-check"
                style={{ fontSize: "30px", color: "#C0392B" }}
              />
            </div>
            <h2 style={{ marginBottom: "8px" }}>KYC Update Submitted</h2>
            <p
              style={{
                fontSize: "14px",
                color: "#6b6b6b",
                marginBottom: "24px",
                lineHeight: 1.6,
              }}
            >
              Your KYC update request has been received and will be reviewed by
              our team.
            </p>
            <div
              style={{
                background: "#fafafa",
                border: "1px solid #e8e8e8",
                borderRadius: "8px",
                padding: "16px",
                marginBottom: "24px",
              }}
            >
              <p
                style={{
                  fontSize: "12px",
                  color: "#6b6b6b",
                  marginBottom: "4px",
                }}
              >
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
                {refNumber}
              </p>
            </div>
            <p
              style={{
                fontSize: "13px",
                color: "#6b6b6b",
                marginBottom: "20px",
                lineHeight: 1.6,
              }}
            >
              A confirmation email will be sent to{" "}
              <strong>{fields.email}</strong>. Processing takes 3–5 business
              days.
            </p>
            <a
              href="/"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                color: "#C0392B",
                fontWeight: "500",
                fontSize: "14px",
                textDecoration: "none",
              }}
            >
              <i className="ti ti-arrow-left" style={{ fontSize: "15px" }} />{" "}
              Back to portal
            </a>
          </div>
        </main>
        <footer
          style={{
            textAlign: "center",
            fontSize: "12px",
            color: "#b0b0b0",
            padding: "16px 24px",
            borderTop: "1px solid #e8e8e8",
            background: "#fff",
          }}
        >
          ShareReg Portal &nbsp;·&nbsp; Shareholder Registry Services
        </footer>
      </div>
    );
  }

  return (
    <div
      style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}
    >
      <Navbar />
      <main
        style={{
          flex: 1,
          padding: "32px 24px",
          maxWidth: "560px",
          margin: "0 auto",
          width: "100%",
        }}
      >
        <div className="card">
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
            KYC Update
          </p>
          <h2 style={{ marginBottom: "6px" }}>Update your KYC details</h2>
          <p
            style={{
              fontSize: "14px",
              color: "#6b6b6b",
              marginBottom: "24px",
              lineHeight: 1.6,
            }}
          >
            Fill in your details below. Fields marked with * are required.
          </p>

          {error && (
            <div className="alert alert-error" style={{ marginBottom: "16px" }}>
              <i
                className="ti ti-alert-circle"
                style={{ fontSize: "15px", flexShrink: 0, marginTop: "1px" }}
              />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            {/* Identity */}
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
              Identity
            </p>

            <div className="field-group">
              <label>Full name *</label>
              <input
                type="text"
                value={fields.fullName}
                onChange={(e) => handleField("fullName", e.target.value)}
                placeholder="As it appears on your share certificate"
                disabled={loading}
              />
            </div>

            <div className="field-group">
              <label>CHN / CSCS number *</label>
              <input
                type="text"
                value={fields.cscsNumber}
                onChange={(e) => handleField("cscsNumber", e.target.value)}
                placeholder="e.g. CHN-20190045872"
                disabled={loading}
              />
            </div>

            <div className="field-group">
              <label>Gender</label>
              <select
                value={fields.gender}
                onChange={(e) => handleField("gender", e.target.value)}
                style={selectStyle}
                disabled={loading}
              >
                <option value="">— Select gender —</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>

            <div className="field-group">
              <label>Date of birth</label>
              <input
                type="date"
                value={fields.dob}
                onChange={(e) => handleField("dob", e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="field-group">
              <label>National Identification Number (NIN)</label>
              <input
                type="text"
                value={fields.nin}
                onChange={(e) =>
                  handleField("nin", e.target.value.replace(/\D/g, ""))
                }
                placeholder="Enter your 11-digit NIN"
                maxLength={11}
                inputMode="numeric"
                disabled={loading}
              />
            </div>

            <div className="field-group">
              <label>Marital status</label>
              <select
                value={fields.maritalStatus}
                onChange={(e) => handleField("maritalStatus", e.target.value)}
                style={selectStyle}
                disabled={loading}
              >
                <option value="">— Select marital status —</option>
                <option value="single">Single</option>
                <option value="married">Married</option>
                <option value="divorced">Divorced</option>
                <option value="widowed">Widowed</option>
              </select>
            </div>

            <div className="field-group">
              <label>Occupation</label>
              <select
                value={fields.occupation}
                onChange={(e) => handleField("occupation", e.target.value)}
                style={selectStyle}
                disabled={loading}
              >
                <option value="">— Select occupation —</option>
                {OCCUPATIONS.map((occ) => (
                  <option key={occ} value={occ}>
                    {occ}
                  </option>
                ))}
              </select>
            </div>

            {/* Contact */}
            <div
              style={{
                borderTop: "1px solid #f0f0f0",
                paddingTop: "16px",
                marginBottom: "16px",
              }}
            >
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
                Contact
              </p>
            </div>

            <div className="field-group">
              <label>Email address *</label>
              <input
                type="email"
                value={fields.email}
                onChange={(e) => handleField("email", e.target.value)}
                placeholder="name@example.com"
                disabled={loading}
              />
            </div>

            <div className="field-group">
              <label>Phone number</label>
              <input
                type="tel"
                value={fields.phone}
                onChange={(e) => handleField("phone", e.target.value)}
                placeholder="+234 800 000 0000"
                disabled={loading}
              />
            </div>

            <div className="field-group">
              <label>Tax Identification Number (TIN)</label>
              <input
                type="text"
                value={fields.tin}
                onChange={(e) =>
                  handleField("tin", e.target.value.replace(/\D/g, ""))
                }
                placeholder="e.g. 1234567890"
                maxLength={10}
                inputMode="numeric"
                disabled={loading}
              />
            </div>
            <div className="field-group">
              <label>Residential address</label>
              <input
                type="text"
                value={fields.address}
                onChange={(e) => handleField("address", e.target.value)}
                placeholder="House number, street, area, city"
                disabled={loading}
              />
            </div>
            {/* Means of ID upload */}
            <div
              style={{
                borderTop: "1px solid #f0f0f0",
                paddingTop: "16px",
                marginBottom: "16px",
              }}
            >
              <p
                style={{
                  fontSize: "11px",
                  fontWeight: "500",
                  color: "#6b6b6b",
                  textTransform: "uppercase",
                  letterSpacing: "0.6px",
                  marginBottom: "4px",
                }}
              >
                Means of identification
              </p>
              <p
                style={{
                  fontSize: "12px",
                  color: "#6b6b6b",
                  marginBottom: "12px",
                }}
              >
                Upload a valid government-issued ID — NIN slip, International
                passport, Driver's licence, or Voter's card.
              </p>
              <input
                ref={idInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                style={{ display: "none" }}
                onChange={(e) =>
                  e.target.files?.[0] && setIdFile(e.target.files[0])
                }
              />
              <div
                onClick={() => idInputRef.current?.click()}
                style={{
                  border: `1.5px dashed ${idFile ? "#a8dfc0" : "#e8b4af"}`,
                  borderRadius: "8px",
                  padding: "20px",
                  textAlign: "center",
                  cursor: "pointer",
                  background: idFile ? "#f0faf4" : "#fdf1f0",
                  transition: "all 0.2s",
                }}
              >
                <i
                  className={`ti ${idFile ? "ti-circle-check" : "ti-id"}`}
                  style={{
                    fontSize: "28px",
                    color: idFile ? "#1a7a40" : "#C0392B",
                    marginBottom: "8px",
                    display: "block",
                  }}
                />
                <p
                  style={{
                    fontSize: "13px",
                    fontWeight: "500",
                    color: idFile ? "#1a7a40" : "#1a1a1a",
                    marginBottom: "4px",
                  }}
                >
                  {idFile ? idFile.name : "Click to upload your ID"}
                </p>
                <p style={{ fontSize: "12px", color: "#6b6b6b" }}>
                  {idFile ? "Click to replace" : "JPG, PNG or PDF — max 10MB"}
                </p>
              </div>
            </div>
            {/* Signature upload */}
            <div
              style={{
                borderTop: "1px solid #f0f0f0",
                paddingTop: "16px",
                marginBottom: "16px",
              }}
            >
              <p
                style={{
                  fontSize: "11px",
                  fontWeight: "500",
                  color: "#6b6b6b",
                  textTransform: "uppercase",
                  letterSpacing: "0.6px",
                  marginBottom: "4px",
                }}
              >
                Signature
              </p>
              <p
                style={{
                  fontSize: "12px",
                  color: "#6b6b6b",
                  marginBottom: "12px",
                }}
              >
                Upload a clear image of your signature on a plain white
                background.
              </p>
              <input
                ref={signatureInputRef}
                type="file"
                accept=".jpg,.jpeg,.png"
                style={{ display: "none" }}
                onChange={(e) =>
                  e.target.files?.[0] && setSignatureFile(e.target.files[0])
                }
              />
              <div
                onClick={() => signatureInputRef.current?.click()}
                style={{
                  border: `1.5px dashed ${signatureFile ? "#a8dfc0" : "#e0e0e0"}`,
                  borderRadius: "8px",
                  padding: "20px",
                  textAlign: "center",
                  cursor: "pointer",
                  background: signatureFile ? "#f0faf4" : "#fafafa",
                  transition: "all 0.2s",
                }}
              >
                <i
                  className={`ti ${signatureFile ? "ti-circle-check" : "ti-writing"}`}
                  style={{
                    fontSize: "28px",
                    color: signatureFile ? "#1a7a40" : "#6b6b6b",
                    marginBottom: "8px",
                    display: "block",
                  }}
                />
                <p
                  style={{
                    fontSize: "13px",
                    fontWeight: "500",
                    color: signatureFile ? "#1a7a40" : "#1a1a1a",
                    marginBottom: "4px",
                  }}
                >
                  {signatureFile
                    ? signatureFile.name
                    : "Click to upload your signature"}
                </p>
                <p style={{ fontSize: "12px", color: "#6b6b6b" }}>
                  {signatureFile ? "Click to replace" : "JPG or PNG — max 10MB"}
                </p>
              </div>
            </div>

            {/* Comments */}
            <div
              style={{
                borderTop: "1px solid #f0f0f0",
                paddingTop: "16px",
                marginBottom: "16px",
              }}
            >
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
                Additional comments
              </p>
            </div>

            <div className="field-group">
              <label>Comments</label>
              <textarea
                value={fields.comments}
                onChange={(e) => handleField("comments", e.target.value)}
                placeholder="Any additional information you would like to share..."
                rows={4}
                style={{
                  width: "100%",
                  padding: "9px 12px",
                  fontSize: "14px",
                  border: "1px solid #b0b0b0",
                  borderRadius: "8px",
                  resize: "vertical",
                  fontFamily: "inherit",
                  outline: "none",
                }}
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              className="btn-primary"
              style={{ marginTop: "8px" }}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner" /> Submitting...
                </>
              ) : (
                <>
                  <i className="ti ti-send" style={{ fontSize: "15px" }} />{" "}
                  Submit KYC update
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
              <i className="ti ti-arrow-left" style={{ fontSize: "15px" }} />{" "}
              Back to portal
            </a>
          </form>
        </div>
      </main>
      <footer
        style={{
          textAlign: "center",
          fontSize: "12px",
          color: "#b0b0b0",
          padding: "16px 24px",
          borderTop: "1px solid #e8e8e8",
          background: "#fff",
        }}
      >
        ShareReg Portal &nbsp;·&nbsp; Shareholder Registry Services
        &nbsp;·&nbsp;
        <a href="mailto:support@sharereg.ng" style={{ color: "#b0b0b0" }}>
          support@sharereg.ng
        </a>
      </footer>
    </div>
  );
}
