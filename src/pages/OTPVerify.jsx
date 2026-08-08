import React, { useState, useRef, useEffect } from "react";
import { verifyOTP, sendOTP } from "../services/termii";
import { fetchShareholderByEmail } from "../services/api";

const OTP_LENGTH = 6;

export default function OTPVerify({ email, pinId, onNext, onBack }) {
  const [digits, setDigits] = useState(Array(OTP_LENGTH).fill(""));
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [currentPinId, setCurrentPinId] = useState(pinId);

  const inputRefs = useRef([]);

  // Auto focus first box on mount
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  function handleDigitChange(idx, value) {
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[idx] = digit;
    setDigits(next);
    setError("");

    // Auto advance to next box
    if (digit && idx < OTP_LENGTH - 1) {
      inputRefs.current[idx + 1]?.focus();
    }
  }

  function handleKeyDown(idx, e) {
    // Go back to previous box on backspace
    if (e.key === "Backspace" && !digits[idx] && idx > 0) {
      inputRefs.current[idx - 1]?.focus();
    }
  }

  function handlePaste(e) {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, OTP_LENGTH);
    if (!pasted) return;
    const next = Array(OTP_LENGTH).fill("");
    pasted.split("").forEach((ch, i) => {
      next[i] = ch;
    });
    setDigits(next);
    const focusIdx = Math.min(pasted.length, OTP_LENGTH - 1);
    inputRefs.current[focusIdx]?.focus();
  }

  async function handleVerify(e) {
    e.preventDefault();

    const otp = digits.join("");
    if (otp.length < OTP_LENGTH) {
      setError("Enter the full 6-digit code.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      await verifyOTP(currentPinId, otp, email);

      // OTP confirmed — fetch shareholder profile
      const profile = await fetchShareholderByEmail(email);
      onNext({ profile });
    } catch (err) {
      setError(err.message || "Verification failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    setResending(true);
    setError("");
    setInfo("");
    setDigits(Array(OTP_LENGTH).fill(""));
    inputRefs.current[0]?.focus();

    try {
      const { pinId: newPinId } = await sendOTP(email);
      setCurrentPinId(newPinId);
      setInfo("A new code has been sent to your email.");
    } catch (err) {
      setError(err.message || "Could not resend the code. Please try again.");
    } finally {
      setResending(false);
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
        Step 2 of 4
      </p>

      {/* Title */}
      <h2 style={{ marginBottom: "6px" }}>Enter your one-time code</h2>
      <p
        style={{
          fontSize: "14px",
          color: "#6b6b6b",
          marginBottom: "24px",
          lineHeight: 1.6,
        }}
      >
        A 6-digit code was sent to{" "}
        <strong style={{ color: "#1a1a1a" }}>{email}</strong>. It expires in 10
        minutes.
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

      {/* Info */}
      {info && (
        <div className="alert alert-success">
          <i
            className="ti ti-circle-check"
            style={{ fontSize: "15px", flexShrink: 0, marginTop: "1px" }}
          />
          {info}
        </div>
      )}

      <form onSubmit={handleVerify} noValidate>
        {/* OTP boxes */}
        <label>One-time code</label>
        <div
          style={{ display: "flex", gap: "8px", margin: "6px 0 8px" }}
          onPaste={handlePaste}
        >
          {digits.map((digit, idx) => (
            <input
              key={idx}
              ref={(el) => (inputRefs.current[idx] = el)}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleDigitChange(idx, e.target.value)}
              onKeyDown={(e) => handleKeyDown(idx, e)}
              disabled={loading}
              style={{
                textAlign: "center",
                fontSize: "22px",
                fontWeight: "500",
                padding: "10px 0",
                width: "100%",
              }}
            />
          ))}
        </div>

        {/* Resend */}
        <p style={{ fontSize: "13px", color: "#6b6b6b", marginBottom: "16px" }}>
          Didn't receive it?{" "}
          <button
            type="button"
            onClick={handleResend}
            disabled={resending || loading}
            style={{
              background: "none",
              border: "none",
              color: "#C0392B",
              fontWeight: "500",
              fontSize: "13px",
              cursor: "pointer",
              padding: 0,
            }}
          >
            {resending ? "Resending…" : "Resend code"}
          </button>
        </p>

        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? (
            <>
              <span className="spinner" /> Verifying…
            </>
          ) : (
            <>
              <i className="ti ti-shield-check" style={{ fontSize: "15px" }} />{" "}
              Verify code
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
  );
}
