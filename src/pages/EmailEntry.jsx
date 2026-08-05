import React, { useState } from "react";
import { sendOTP } from "../services/termii";
import { checkEmailExists } from "../services/api";

const STATUS = {
  IDLE: "idle",
  FOUND: "found",
  NOTFOUND: "notfound",
};

export default function EmailEntry({ onNext }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState(STATUS.IDLE);

  function validate(value) {
    if (!value.trim()) return "Enter your registered email address.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))
      return "Enter a valid email address.";
    return "";
  }

  async function handleCheckEmail(e) {
    e.preventDefault();
    const err = validate(email);
    if (err) {
      setError(err);
      return;
    }
    setError("");
    setLoading(true);
    try {
      const { exists } = await checkEmailExists(email.trim().toLowerCase());
      setStatus(exists ? STATUS.FOUND : STATUS.NOTFOUND);
    } catch (err) {
      setError(err.message || "Could not verify email. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSendOTP() {
    setLoading(true);
    setError("");
    try {
      const { pinId } = await sendOTP(email.trim().toLowerCase());
      onNext({ email: email.trim().toLowerCase(), pinId });
    } catch (err) {
      setError(err.message || "Could not send the code. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleTryAnother() {
    setEmail("");
    setStatus(STATUS.IDLE);
    setError("");
  }

  return (
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
        Step 1 of 4
      </p>
      <h2 style={{ marginBottom: "6px" }}>Enter your registered email</h2>
      <p
        style={{
          fontSize: "14px",
          color: "#6b6b6b",
          marginBottom: "24px",
          lineHeight: 1.6,
        }}
      >
        Enter the email address linked to your shareholder account.
      </p>

      {error && (
        <div className="alert alert-error">
          <i
            className="ti ti-alert-circle"
            style={{ fontSize: "15px", flexShrink: 0, marginTop: "1px" }}
          />
          {error}
        </div>
      )}

      {status === STATUS.IDLE && (
        <form onSubmit={handleCheckEmail} noValidate>
          <div className="field-group">
            <label htmlFor="email">Registered email address</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError("");
              }}
              placeholder="name@example.com"
              autoComplete="email"
              autoFocus
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
                <span className="spinner" /> Checking...
              </>
            ) : (
              <>
                <i className="ti ti-search" style={{ fontSize: "15px" }} />{" "}
                Check email
              </>
            )}
          </button>
        </form>
      )}

      {status === STATUS.FOUND && (
        <div>
          <div className="alert alert-success" style={{ marginBottom: "20px" }}>
            <i
              className="ti ti-circle-check"
              style={{ fontSize: "15px", flexShrink: 0, marginTop: "1px" }}
            />
            <div>
              <strong>Email found!</strong> We found a shareholder account
              linked to <strong>{email}</strong>.
            </div>
          </div>
          <p
            style={{
              fontSize: "14px",
              color: "#6b6b6b",
              marginBottom: "20px",
              lineHeight: 1.6,
            }}
          >
            We will send a one-time verification code to this email to confirm
            your identity.
          </p>
          <button
            className="btn-primary"
            onClick={handleSendOTP}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner" /> Sending code...
              </>
            ) : (
              <>
                <i className="ti ti-send" style={{ fontSize: "15px" }} /> Send
                one-time code
              </>
            )}
          </button>
          <button
            className="btn-ghost"
            style={{ marginTop: "8px" }}
            onClick={handleTryAnother}
            disabled={loading}
          >
            <i className="ti ti-arrow-left" style={{ fontSize: "15px" }} /> Try
            a different email
          </button>
        </div>
      )}

      {status === STATUS.NOTFOUND && (
        <div>
          <div className="alert alert-error" style={{ marginBottom: "20px" }}>
            <i
              className="ti ti-alert-circle"
              style={{ fontSize: "15px", flexShrink: 0, marginTop: "1px" }}
            />
            <div>
              <strong>Email not found.</strong> We could not find a shareholder
              account linked to <strong>{email}</strong>.
            </div>
          </div>
          <div
            style={{
              background: "#fafafa",
              border: "1px solid #e8e8e8",
              borderRadius: "8px",
              padding: "16px",
              marginBottom: "20px",
            }}
          >
            <p
              style={{
                fontSize: "13px",
                fontWeight: "500",
                color: "#1a1a1a",
                marginBottom: "12px",
              }}
            >
              What would you like to do?
            </p>
            <div
              style={{ display: "flex", flexDirection: "column", gap: "12px" }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "10px",
                }}
              >
                <i
                  className="ti ti-mail"
                  style={{
                    color: "#C0392B",
                    fontSize: "16px",
                    marginTop: "1px",
                    flexShrink: 0,
                  }}
                />
                <p style={{ fontSize: "13px", color: "#6b6b6b" }}>
                  Is your email address different?{" "}
                  <button
                    onClick={handleTryAnother}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#C0392B",
                      fontWeight: "500",
                      fontSize: "13px",
                      cursor: "pointer",
                      padding: 0,
                      textDecoration: "underline",
                    }}
                  >
                    Try another email
                  </button>
                </p>
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "10px",
                }}
              >
                <i
                  className="ti ti-edit"
                  style={{
                    color: "#C0392B",
                    fontSize: "16px",
                    marginTop: "1px",
                    flexShrink: 0,
                  }}
                />
                <p style={{ fontSize: "13px", color: "#6b6b6b" }}>
                  Need to update your registered email?{" "}
                  <a
                    href="mailto:support@sharereg.ng?subject=Email Update Request&body=Please update my registered email. My name is: [Full Name]. My CHN/CSCS number is: [Your Number]."
                    style={{
                      color: "#C0392B",
                      fontWeight: "500",
                      fontSize: "13px",
                      textDecoration: "underline",
                    }}
                  >
                    Contact support to update it
                  </a>
                </p>
              </div>
            </div>
          </div>
          <button className="btn-ghost" onClick={handleTryAnother}>
            <i className="ti ti-arrow-left" style={{ fontSize: "15px" }} /> Go
            back
          </button>
        </div>
      )}
    </div>
  );
}
