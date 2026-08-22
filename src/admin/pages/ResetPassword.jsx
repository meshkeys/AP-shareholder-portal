import React, { useState } from "react";
import { resetPassword } from "../services/adminApi";

export default function ResetPassword({ token, onDone }) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  function validate() {
    if (!newPassword) return "Enter a new password.";
    if (newPassword.length < 8)
      return "Password must be at least 8 characters.";
    if (newPassword !== confirmPassword) return "Passwords do not match.";
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
      await resetPassword(token, newPassword);
      setSuccess(true);
    } catch (err) {
      setError(err.message || "Failed to reset password. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const inputStyle = {
    width: "100%",
    padding: "9px 12px",
    fontSize: "14px",
    border: "1px solid #e0e0e0",
    borderRadius: "8px",
    background: "#fff",
    color: "#1a1a1a",
    outline: "none",
    paddingRight: "40px",
  };

  if (!token) {
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
        <div
          className="card"
          style={{ maxWidth: "400px", width: "100%", textAlign: "center" }}
        >
          <i
            className="ti ti-alert-circle"
            style={{
              fontSize: "40px",
              color: "#C0392B",
              display: "block",
              marginBottom: "16px",
            }}
          />
          <h3 style={{ marginBottom: "8px" }}>Invalid reset link</h3>
          <p
            style={{ fontSize: "13px", color: "#6b6b6b", marginBottom: "20px" }}
          >
            This password reset link is invalid or has expired.
          </p>
          <button className="btn-primary" onClick={onDone}>
            Go to login
          </button>
        </div>
      </div>
    );
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
            Set new password
          </h1>
          <p style={{ fontSize: "13px", color: "#6b6b6b" }}>
            Enter your new password below.
          </p>
        </div>

        <div className="card">
          {success ? (
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
                  className="ti ti-circle-check"
                  style={{ fontSize: "26px", color: "#1a7a40" }}
                />
              </div>
              <h3 style={{ marginBottom: "8px" }}>
                Password reset successfully!
              </h3>
              <p
                style={{
                  fontSize: "13px",
                  color: "#6b6b6b",
                  marginBottom: "20px",
                  lineHeight: 1.6,
                }}
              >
                Your password has been updated. You can now log in with your new
                password.
              </p>
              <button className="btn-primary" onClick={onDone}>
                <i className="ti ti-login" style={{ fontSize: "15px" }} /> Go to
                login
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
                <label>New password</label>
                <div style={{ position: "relative" }}>
                  <input
                    type={showNew ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      setError("");
                    }}
                    placeholder="At least 8 characters"
                    style={inputStyle}
                    disabled={loading}
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew((p) => !p)}
                    style={{
                      position: "absolute",
                      right: "10px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "#6b6b6b",
                      padding: 0,
                      fontSize: "11px",
                      fontWeight: "500",
                    }}
                  >
                    {showNew ? "HIDE" : "SHOW"}
                  </button>
                </div>
              </div>

              <div className="field-group">
                <label>Confirm new password</label>
                <div style={{ position: "relative" }}>
                  <input
                    type={showConfirm ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      setError("");
                    }}
                    placeholder="Repeat new password"
                    style={inputStyle}
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((p) => !p)}
                    style={{
                      position: "absolute",
                      right: "10px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "#6b6b6b",
                      padding: 0,
                      fontSize: "11px",
                      fontWeight: "500",
                    }}
                  >
                    {showConfirm ? "HIDE" : "SHOW"}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="btn-primary"
                style={{ marginTop: "8px" }}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner" /> Resetting...
                  </>
                ) : (
                  <>
                    <i className="ti ti-lock" style={{ fontSize: "15px" }} />{" "}
                    Reset password
                  </>
                )}
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
