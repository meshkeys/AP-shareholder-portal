import React, { useState } from "react";
import { UPDATE_CATEGORIES } from "../config/updateCategories";

const KYC = UPDATE_CATEGORIES.find((c) => c.id === "kycUpdate");

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

export default function KYCForm({ profile, onNext, onBack }) {
  const [fields, setFields] = useState({
    phone: profile.phone || "",
    email: profile.email || "",
    tin: profile.tin || "",
    gender: "",
    dob: "",
    nin: "",
    occupation: "",
    maritalStatus: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handleField(key, value) {
    setFields((prev) => ({ ...prev, [key]: value }));
  }

  function validate() {
    const hasValue = Object.values(fields).some((v) => v.trim() !== "");
    if (!hasValue) return "Please fill in at least one field to update.";
    if (fields.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email)) {
      return "Enter a valid email address.";
    }
    return "";
  }

  function handleProceed(e) {
    e.preventDefault();
    const err = validate();
    if (err) {
      setError(err);
      return;
    }

    setError("");
    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      onNext({
        updateType: "kycUpdate",
        subType: null,
        label: KYC.label,
        tagPrefix: KYC.tagPrefix,
        fields,
        files: {},
      });
    }, 500);
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
    cursor: "pointer",
  };

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
          KYC update
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
          Fill in only the fields you want to update. Leave others blank.
        </p>

        {/* Info banner */}
        <div className="alert alert-info" style={{ marginBottom: "24px" }}>
          <i
            className="ti ti-info-circle"
            style={{ fontSize: "15px", flexShrink: 0, marginTop: "1px" }}
          />
          No supporting documents are required for KYC updates.
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
          {/* Gender */}
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

          {/* Date of birth */}
          <div className="field-group">
            <label>Date of birth</label>
            <input
              type="date"
              value={fields.dob}
              onChange={(e) => handleField("dob", e.target.value)}
              disabled={loading}
            />
          </div>

          {/* NIN */}
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

          {/* Marital status */}
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

          {/* Occupation */}
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

          {/* Phone */}
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

          {/* Email */}
          <div className="field-group">
            <label>Email address</label>
            <input
              type="email"
              value={fields.email}
              onChange={(e) => handleField("email", e.target.value)}
              placeholder="name@example.com"
              disabled={loading}
            />
          </div>

          {/* TIN */}
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

          {/* Buttons */}
          <button
            type="submit"
            className="btn-primary"
            style={{ marginTop: "8px" }}
            disabled={loading}
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
