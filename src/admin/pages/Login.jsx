import React, { useState } from "react";
import { login, saveSession } from "../services/adminApi";

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
        background: "#f0f0f0",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
      }}
    >
      <div style={{ width: "100%", maxWidth: "400px" }}>
        {/* Logo */}
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
            Africa Prudential ShareReg Admin
          </h1>
          <p style={{ fontSize: "13px", color: "#6b6b6b" }}>
            Sign in to your agent account
          </p>
        </div>

        {/* Card */}
        <div className="card">
          {/* Error */}
          {error && (
            <div className="alert alert-error" style={{ marginBottom: "20px" }}>
              <i
                className="ti ti-alert-circle"
                style={{ fontSize: "15px", flexShrink: 0, marginTop: "1px" }}
              />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            {/* Email */}
            <div className="field-group">
              <label htmlFor="email">Email address</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError("");
                }}
                placeholder="your@email.com"
                autoComplete="email"
                autoFocus
                disabled={loading}
              />
            </div>

            {/* Password */}
            <div className="field-group">
              <label htmlFor="password">Password</label>
              <div style={{ position: "relative" }}>
                <input
                  id="password"
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError("");
                  }}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  disabled={loading}
                  style={{ paddingRight: "40px" }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass((prev) => !prev)}
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
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  {showPass ? "HIDE" : "SHOW"}
                </button>
              </div>
            </div>
            <div style={{ textAlign: "right", marginBottom: "8px" }}>
              <button
                type="button"
                onClick={onForgotPassword}
                style={{
                  background: "none",
                  border: "none",
                  color: "#C0392B",
                  fontSize: "13px",
                  cursor: "pointer",
                  padding: 0,
                }}
              >
                Forgot password?
              </button>
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="btn-primary"
              style={{ marginTop: "8px" }}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner" /> Signing in...
                </>
              ) : (
                <>
                  <i className="ti ti-login" style={{ fontSize: "15px" }} />{" "}
                  Sign in
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
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
