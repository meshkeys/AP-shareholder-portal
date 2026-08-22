import React, { useState } from "react";
import { changePassword } from "../services/adminApi";

export default function ChangePassword({ agent, onDone }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  function validate() {
    if (!currentPassword) return "Enter your temporary password.";
    if (!newPassword) return "Enter a new password.";
    if (newPassword.length < 8)
      return "New password must be at least 8 characters.";
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
      await changePassword(agent.id, currentPassword, newPassword);
      onDone();
    } catch (err) {
      setError(err.message || "Failed to change password. Please try again.");
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
  };

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
      <div style={{ width: "100%", maxWidth: "420px" }}>
        {/* Header */}
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
            Change your password
          </h1>
          <p style={{ fontSize: "13px", color: "#6b6b6b" }}>
            You must change your temporary password before continuing.
          </p>
        </div>

        <div className="card">
          {/* Warning */}
          <div className="alert alert-error" style={{ marginBottom: "20px" }}>
            <i
              className="ti ti-alert-circle"
              style={{ fontSize: "15px", flexShrink: 0 }}
            />
            For security, please change your temporary password now.
          </div>

          {/* Error */}
          {error && (
            <div className="alert alert-error" style={{ marginBottom: "16px" }}>
              <i
                className="ti ti-alert-circle"
                style={{ fontSize: "15px", flexShrink: 0 }}
              />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            {/* Temporary password */}
            <div className="field-group">
              <label>Temporary password</label>
              <div style={{ position: "relative" }}>
                <input
                  type={showCurrent ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => {
                    setCurrentPassword(e.target.value);
                    setError("");
                  }}
                  placeholder="Enter temporary password"
                  style={{ ...inputStyle, paddingRight: "40px" }}
                  disabled={loading}
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent((p) => !p)}
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
                  }}
                >
                  <i
                    className={`ti ${showCurrent ? "ti-eye-off" : "ti-eye"}`}
                    style={{ fontSize: "16px" }}
                  />
                </button>
              </div>
            </div>

            {/* New password */}
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
                  style={{ ...inputStyle, paddingRight: "40px" }}
                  disabled={loading}
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
                  }}
                >
                  <i
                    className={`ti ${showNew ? "ti-eye-off" : "ti-eye"}`}
                    style={{ fontSize: "16px" }}
                  />
                </button>
              </div>
            </div>

            {/* Confirm password */}
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
                  style={{ ...inputStyle, paddingRight: "40px" }}
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
                  }}
                >
                  <i
                    className={`ti ${showConfirm ? "ti-eye-off" : "ti-eye"}`}
                    style={{ fontSize: "16px" }}
                  />
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
                  <span className="spinner" /> Changing password...
                </>
              ) : (
                <>
                  <i className="ti ti-lock" style={{ fontSize: "15px" }} />{" "}
                  Change password
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
