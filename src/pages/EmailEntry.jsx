import React, { useState } from "react";
import { sendOTP } from "../services/termii";
import { checkEmailExists } from "../services/api";

const STATUS = {
  IDLE: "idle",
  FOUND: "found",
  NOTFOUND: "notfound",
};

const PRODUCTS = [
  {
    id: 1,
    icon: "ti-chart-line",
    title: "Dividend Management",
    description:
      "Track and manage your dividend payments seamlessly across all your shareholdings.",
    color: "#C0392B",
    tag: "Popular",
  },
  {
    id: 2,
    icon: "ti-file-certificate",
    title: "Share Certificate Services",
    description:
      "Request, replace or verify your share certificates quickly and securely.",
    color: "#2255cc",
    tag: "New",
  },
  {
    id: 3,
    icon: "ti-building-bank",
    title: "E-Dividend Registration",
    description:
      "Register your bank account to receive dividends directly without delay.",
    color: "#1a7a40",
    tag: "Recommended",
  },
  {
    id: 4,
    icon: "ti-transfer",
    title: "Share Transfer Services",
    description:
      "Transfer shares to beneficiaries or between accounts with full documentation support.",
    color: "#7c3aed",
    tag: null,
  },
  {
    id: 5,
    icon: "ti-id",
    title: "KYC Update",
    description:
      "Keep your Know Your Customer information up to date for uninterrupted services.",
    color: "#b36a00",
    tag: null,
  },
  {
    id: 6,
    icon: "ti-shield-check",
    title: "Shareholder Verification",
    description:
      "Verify your shareholder status and access your complete portfolio at any time.",
    color: "#0077b6",
    tag: null,
  },
];

export function ProductCarousel() {
  const [current, setCurrent] = React.useState(0);
  const visibleCount = 3;
  const total = PRODUCTS.length;

  function prev() {
    setCurrent((c) => (c === 0 ? total - visibleCount : c - 1));
  }

  function next() {
    setCurrent((c) => (c >= total - visibleCount ? 0 : c + 1));
  }

  // Auto advance every 4 seconds
  React.useEffect(() => {
    const timer = setInterval(next, 4000);
    return () => clearInterval(timer);
  }, [current]);

  const visible = PRODUCTS.slice(current, current + visibleCount).concat(
    current + visibleCount > total
      ? PRODUCTS.slice(0, (current + visibleCount) % total)
      : [],
  );

  return (
    <div style={{ marginBottom: "28px" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "12px",
        }}
      >
        <div>
          <p
            style={{
              fontSize: "11px",
              fontWeight: "500",
              color: "#C0392B",
              letterSpacing: "0.6px",
              textTransform: "uppercase",
              marginBottom: "2px",
            }}
          >
            Our services
          </p>
          <p style={{ fontSize: "13px", color: "#6b6b6b" }}>
            Explore what we offer to shareholders
          </p>
        </div>
        <div style={{ display: "flex", gap: "6px" }}>
          <button
            onClick={prev}
            style={{
              width: "30px",
              height: "30px",
              borderRadius: "50%",
              border: "1px solid #e0e0e0",
              background: "#fff",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#6b6b6b",
              transition: "all 0.15s",
            }}
          >
            <i className="ti ti-chevron-left" style={{ fontSize: "14px" }} />
          </button>
          <button
            onClick={next}
            style={{
              width: "30px",
              height: "30px",
              borderRadius: "50%",
              border: "1px solid #e0e0e0",
              background: "#fff",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#6b6b6b",
              transition: "all 0.15s",
            }}
          >
            <i className="ti ti-chevron-right" style={{ fontSize: "14px" }} />
          </button>
        </div>
      </div>

      {/* Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "12px",
        }}
      >
        {visible.map((product, idx) => (
          <div
            key={`${product.id}-${idx}`}
            style={{
              background: "#fff",
              border: "1px solid #e8e8e8",
              borderRadius: "10px",
              padding: "16px",
              boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
              transition: "transform 0.2s, box-shadow 0.2s",
              cursor: "default",
              position: "relative",
              overflow: "hidden",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 1px 4px rgba(0,0,0,0.05)";
            }}
          >
            {/* Tag */}
            {product.tag && (
              <span
                style={{
                  position: "absolute",
                  top: "10px",
                  right: "10px",
                  fontSize: "10px",
                  fontWeight: "500",
                  padding: "2px 8px",
                  borderRadius: "20px",
                  background: `${product.color}15`,
                  color: product.color,
                  border: `1px solid ${product.color}30`,
                }}
              >
                {product.tag}
              </span>
            )}

            {/* Icon */}
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "10px",
                background: `${product.color}12`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "12px",
              }}
            >
              <i
                className={`ti ${product.icon}`}
                style={{ fontSize: "20px", color: product.color }}
              />
            </div>

            {/* Content */}
            <p
              style={{
                fontSize: "13px",
                fontWeight: "600",
                color: "#1a1a1a",
                marginBottom: "6px",
                lineHeight: 1.3,
              }}
            >
              {product.title}
            </p>
            <p style={{ fontSize: "12px", color: "#6b6b6b", lineHeight: 1.5 }}>
              {product.description}
            </p>

            {/* Bottom accent line */}
            <div
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                height: "3px",
                background: `${product.color}40`,
                borderRadius: "0 0 10px 10px",
              }}
            />
          </div>
        ))}
      </div>

      {/* Dots indicator */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: "6px",
          marginTop: "12px",
        }}
      >
        {Array.from({ length: total - visibleCount + 1 }).map((_, idx) => (
          <div
            key={idx}
            onClick={() => setCurrent(idx)}
            style={{
              width: current === idx ? "20px" : "6px",
              height: "6px",
              borderRadius: "3px",
              background: current === idx ? "#C0392B" : "#d0d0d0",
              cursor: "pointer",
              transition: "all 0.3s",
            }}
          />
        ))}
      </div>
    </div>
  );
}

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
                  Need to update your registered email? /*
                  <a
                    href="/kyc-update"
                    style={{
                      color: "#C0392B",
                      fontWeight: "500",
                      fontSize: "13px",
                      textDecoration: "underline",
                    }}
                  >
                    Click here to update your KYC
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
