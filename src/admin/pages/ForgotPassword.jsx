import React, { useState } from "react";
import { forgotPassword } from "../services/adminApi";

export default function ForgotPassword({ onBack }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email) {
      setError("Enter your registered email address.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await forgotPassword(email.toLowerCase());
      setSubmitted(true);
    } catch (err) {
      setError(err.message || "Failed to send reset email. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f0f0f0",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
      }}
    >
      <div style={{ width: "100%", maxWidth: "400px" }}>
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <div
            style={{
              width: "52px",
              height: "52px",
              background: "#C0392B",
              borderRadius: "12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 12px",
              color: "#fff",
              fontSize: "18px",
              fontWeight: "700",
            }}
          >
            SR
          </div>
          <h1
            style={{
              fontSize: "20px",
              fontWeight: "600",
              color: "#1a1a1a",
              marginBottom: "4px",
            }}
          >
            Reset your password
          </h1>
          <p style={{ fontSize: "13px", color: "#6b6b6b" }}>
            Enter your registered email and we'll send you a reset link.
          </p>
        </div>

        <div className="card">
          {submitted ? (
            <div style={{ textAlign: "center", padding: "8px 0" }}>
              <div
                style={{
                  width: "56px",
                  height: "56px",
                  background: "#f0faf4",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 16px",
                }}
              >
                <i
                  className="ti ti-mail-check"
                  style={{ fontSize: "26px", color: "#1a7a40" }}
                />
              </div>
              <h3 style={{ marginBottom: "8px" }}>Check your email</h3>
              <p
                style={{
                  fontSize: "13px",
                  color: "#6b6b6b",
                  lineHeight: 1.6,
                  marginBottom: "20px",
                }}
              >
                If <strong>{email}</strong> is registered, you'll receive a
                password reset link shortly. Check your spam folder if you don't
                see it.
              </p>
              <button className="btn-ghost" onClick={onBack}>
                <i className="ti ti-arrow-left" style={{ fontSize: "15px" }} />{" "}
                Back to login
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate>
              {error && (
                <div
                  className="alert alert-error"
                  style={{ marginBottom: "16px" }}
                >
                  <i
                    className="ti ti-alert-circle"
                    style={{ fontSize: "15px", flexShrink: 0 }}
                  />
                  {error}
                </div>
              )}
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
                  placeholder="your@email.com"
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
                    <span className="spinner" /> Sending...
                  </>
                ) : (
                  <>
                    <i className="ti ti-send" style={{ fontSize: "15px" }} />{" "}
                    Send reset link
                  </>
                )}
              </button>
              <button
                type="button"
                className="btn-ghost"
                style={{ marginTop: "8px" }}
                onClick={onBack}
              >
                <i className="ti ti-arrow-left" style={{ fontSize: "15px" }} />{" "}
                Back to login
              </button>
            </form>
          )}
        </div>

        <p
          style={{
            textAlign: "center",
            fontSize: "12px",
            color: "#b0b0b0",
            marginTop: "24px",
          }}
        >
          ShareReg Portal &nbsp;·&nbsp; Admin Access Only
        </p>
      </div>
    </div>
  );
}
