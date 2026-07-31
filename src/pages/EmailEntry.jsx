import React, { useState } from "react";
import { sendOTP } from "../services/termii";

export default function EmailEntry({ onNext }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function validate(value) {
    if (!value.trim()) return "Enter your registered email address.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))
      return "Enter a valid email address.";
    return "";
  }

  async function handleSubmit(e) {
    e.preventDefault();

    const err = validate(email);
    if (err) {
      setError(err);
      return;
    }

    setError("");
    setLoading(true);

    try {
      const { pinId } = await sendOTP(email.trim().toLowerCase());
      onNext({ email: email.trim().toLowerCase(), pinId });
    } catch (err) {
      setError(err.message || "Could not send the code. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card">
      {/* Eyebrow */}
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

      {/* Title */}
      <h2 style={{ marginBottom: "6px" }}>Enter your registered email</h2>
      <p
        style={{
          fontSize: "14px",
          color: "#6b6b6b",
          marginBottom: "24px",
          lineHeight: 1.6,
        }}
      >
        We'll send a one-time code to confirm your identity as a registered
        shareholder.
      </p>

      {/* Error */}
      {error && (
        <div className="alert alert-error">
          <i
            className="ti ti-alert-circle"
            style={{ fontSize: "15px", flexShrink: 0, marginTop: "1px" }}
          />
          {error}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} noValidate>
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
              <span className="spinner" /> Sending code…
            </>
          ) : (
            <>
              <i className="ti ti-send" style={{ fontSize: "15px" }} /> Send
              one-time code
            </>
          )}
        </button>
      </form>
    </div>
  );
}
