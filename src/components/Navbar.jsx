import React from "react";

export default function Navbar() {
  return (
    <nav
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "14px 24px",
        borderBottom: "1px solid #e8e8e8",
        background: "#fff",
        position: "sticky",
        top: 0,
        zIndex: 10,
      }}
    >
      {/* Brand */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <div
          style={{
            width: "36px",
            height: "36px",
            background: "#C0392B",
            borderRadius: "6px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            fontSize: "13px",
            fontWeight: "600",
            letterSpacing: "0.5px",
            flexShrink: 0,
          }}
        >
          SR
        </div>
        <div>
          <div
            style={{ fontSize: "14px", fontWeight: "500", color: "#1a1a1a" }}
          >
            ShareReg Portal
          </div>
          <div style={{ fontSize: "11px", color: "#6b6b6b", marginTop: "1px" }}>
            Shareholder Registry Services
          </div>
        </div>
      </div>

      {/* Secure badge */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "5px",
          fontSize: "12px",
          color: "#C0392B",
        }}
      >
        <i
          className="ti ti-lock"
          style={{ fontSize: "14px" }}
          aria-hidden="true"
        />
        Secure portal
      </div>
    </nav>
  );
}
