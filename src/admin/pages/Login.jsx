import React, { useState } from "react";
import { login, saveSession } from "../services/adminApi";
import APLogo from "../../assets/AP_LOGO.png";

export default function Login({ onLogin, onForgotPassword }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPass, setShowPass] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email || !password) {
      setError("Email and password are required.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const data = await login(email, password);
      saveSession(data.token, data.agent);
      onLogin(data.agent);
    } catch (err) {
      setError(err.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(135deg, #1A1A2E 0%, #16213E 50%, #0F3460 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        fontFamily: "Inter, sans-serif",
      }}
    >
      {/* Background pattern */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.03,
          backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />

      <div
        style={{
          width: "100%",
          maxWidth: "420px",
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* Logo card */}
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(255,255,255,0.08)",
              backdropFilter: "blur(12px)",
              borderRadius: "16px",
              padding: "20px 32px",
              border: "1px solid rgba(255,255,255,0.1)",
              marginBottom: "20px",
            }}
          >
            <img
              src={APLogo}
              alt="Africa Prudential"
              style={{
                height: "40px",
                width: "auto",
                filter: "brightness(0) invert(1)",
              }}
            />
          </div>
          <h1
            style={{
              fontSize: "22px",
              fontWeight: "700",
              color: "#FFFFFF",
              marginBottom: "6px",
              letterSpacing: "-0.01em",
            }}
          >
            Admin Portal
          </h1>
          <p
            style={{
              fontSize: "14px",
              color: "rgba(255,255,255,0.5)",
              fontWeight: "400",
            }}
          >
            Sign in to your management account
          </p>
        </div>

        {/* Login card */}
        <div
          style={{
            background: "rgba(255,255,255,0.95)",
            backdropFilter: "blur(20px)",
            borderRadius: "16px",
            padding: "36px 32px",
            boxShadow: "0 24px 48px rgba(0,0,0,0.3)",
            border: "1px solid rgba(255,255,255,0.2)",
          }}
        >
          {/* Error */}
          {error && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "12px 14px",
                background: "#FDECEA",
                border: "1px solid #F5BCBD",
                borderRadius: "10px",
                marginBottom: "20px",
                fontSize: "13px",
                fontWeight: "500",
                color: "#C0181D",
              }}
            >
              <i
                className="ti ti-alert-circle"
                style={{ fontSize: "16px", flexShrink: 0 }}
              />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            {/* Email */}
            <div style={{ marginBottom: "18px" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "13px",
                  fontWeight: "600",
                  color: "#2D2D2D",
                  marginBottom: "7px",
                }}
              >
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError("");
                }}
                placeholder="your@africaprudential.com"
                autoComplete="email"
                autoFocus
                disabled={loading}
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  fontSize: "14px",
                  color: "#2D2D2D",
                  background: "#F9FAFB",
                  border: "1.5px solid #E5E7EB",
                  borderRadius: "10px",
                  outline: "none",
                  fontFamily: "Inter, sans-serif",
                  transition: "all 0.2s",
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "#E31E24";
                  e.target.style.boxShadow = "0 0 0 3px rgba(227,30,36,0.10)";
                  e.target.style.background = "#fff";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "#E5E7EB";
                  e.target.style.boxShadow = "none";
                  e.target.style.background = "#F9FAFB";
                }}
              />
            </div>

            {/* Password */}
            <div style={{ marginBottom: "24px" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "13px",
                  fontWeight: "600",
                  color: "#2D2D2D",
                  marginBottom: "7px",
                }}
              >
                Password
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError("");
                  }}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  disabled={loading}
                  style={{
                    width: "100%",
                    padding: "12px 44px 12px 14px",
                    fontSize: "14px",
                    color: "#2D2D2D",
                    background: "#F9FAFB",
                    border: "1.5px solid #E5E7EB",
                    borderRadius: "10px",
                    outline: "none",
                    fontFamily: "Inter, sans-serif",
                    transition: "all 0.2s",
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "#E31E24";
                    e.target.style.boxShadow = "0 0 0 3px rgba(227,30,36,0.10)";
                    e.target.style.background = "#fff";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "#E5E7EB";
                    e.target.style.boxShadow = "none";
                    e.target.style.background = "#F9FAFB";
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass((p) => !p)}
                  style={{
                    position: "absolute",
                    right: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "#9CA3AF",
                    padding: "4px",
                    fontSize: "11px",
                    fontWeight: "600",
                    fontFamily: "Inter, sans-serif",
                    letterSpacing: "0.02em",
                  }}
                >
                  {showPass ? "HIDE" : "SHOW"}
                </button>
              </div>

              {/* Forgot password */}
              <div style={{ textAlign: "right", marginTop: "8px" }}>
                <button
                  type="button"
                  onClick={onForgotPassword}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#E31E24",
                    fontSize: "12px",
                    fontWeight: "600",
                    cursor: "pointer",
                    fontFamily: "Inter, sans-serif",
                  }}
                >
                  Forgot password?
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                padding: "13px 20px",
                background: loading ? "#F5BCBD" : "#E31E24",
                color: "#FFFFFF",
                border: "none",
                borderRadius: "10px",
                fontSize: "15px",
                fontWeight: "600",
                fontFamily: "Inter, sans-serif",
                cursor: loading ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                transition: "all 0.2s",
                letterSpacing: "0.01em",
              }}
            >
              {loading ? (
                <>
                  <span className="spinner" /> Signing in...
                </>
              ) : (
                "Sign in to Admin Portal"
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p
          style={{
            textAlign: "center",
            fontSize: "12px",
            color: "rgba(255,255,255,0.3)",
            marginTop: "24px",
            lineHeight: 1.5,
          }}
        >
          Africa Prudential Plc &nbsp;·&nbsp; Registered with SEC Nigeria
          <br />© 2026 Africa Prudential. All rights reserved.
        </p>
      </div>
    </div>
  );
}
