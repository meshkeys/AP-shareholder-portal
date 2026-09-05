import React from "react";
import APLogo from "../assets/AP_LOGO.png";

export default function Navbar() {
  return (
    <header
      style={{
        background: "#FFFFFF",
        borderBottom: "1px solid #E5E7EB",
        boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
        position: "sticky",
        top: 0,
        zIndex: 100,
      }}
    >
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "0 24px",
          height: "64px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <img
            src={APLogo}
            alt="Africa Prudential"
            style={{ height: "36px", width: "auto", objectFit: "contain" }}
          />
          <div
            style={{
              width: "1px",
              height: "28px",
              background: "#E5E7EB",
              margin: "0 4px",
            }}
          />
          <div>
            <p
              style={{
                fontSize: "12px",
                fontWeight: "600",
                color: "#2D2D2D",
                lineHeight: 1,
                letterSpacing: "0.02em",
              }}
            >
              Self Service Portal
            </p>
            <p style={{ fontSize: "10px", color: "#6B7280", marginTop: "2px" }}>
              Shareholder Registry Services
            </p>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <a
            href="https://www.africaprudential.com"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontSize: "13px",
              fontWeight: "500",
              color: "#6B7280",
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            <i className="ti ti-world" style={{ fontSize: "14px" }} /> Main
            Website
          </a>
          <a
            href="mailto:mcc@africaprudential.com"
            style={{
              fontSize: "13px",
              fontWeight: "600",
              color: "#E31E24",
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            <i className="ti ti-headset" style={{ fontSize: "14px" }} /> Support
          </a>
        </div>
      </div>
    </header>
  );
}
