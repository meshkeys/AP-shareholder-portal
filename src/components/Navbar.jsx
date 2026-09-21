import React, { useState } from "react";
import APLogo from "../assets/AP_LOGO.png";

// Mirrors the main site's nav (africaprudential.com). Update these if the
// exact destination pages change — "Our Services" and "Community" fall back
// to the homepage since no specific page was confirmed for them.
const NAV_LINKS = [
  { label: "About Us", url: "https://www.africaprudential.com/About-Us" },
  { label: "Our Services", url: "https://www.africaprudential.com" },
  {
    label: "Investor Relations",
    url: "https://www.africaprudential.com/investor-relations",
  },
  {
    label: "Capital Market Solutions",
    url: "https://www.africaprudential.com/Services/Capital-Market-Issuer-Services",
  },
  { label: "Community", url: "https://www.africaprudential.com" },
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header
      style={{
        background: "#fff",
        borderBottom: "1px solid #E5E7EB",
        position: "sticky",
        top: 0,
        zIndex: 100,
      }}
    >
      <div
        style={{
          position: "relative",
          maxWidth: "1280px",
          margin: "0 auto",
          padding: "0 24px",
          height: "72px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <img
          src={APLogo}
          alt="Africa Prudential"
          style={{ height: "30px", width: "auto", objectFit: "contain" }}
        />

        <nav className={`navbar-links${mobileOpen ? " open" : ""}`}>
          {NAV_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontSize: "14px",
                fontWeight: "500",
                color: "#374151",
                textDecoration: "none",
                whiteSpace: "nowrap",
                transition: "color 0.15s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#E31E24")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#374151")}
            >
              {link.label}
            </a>
          ))}

          <div
            className="navbar-cta"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              marginLeft: "8px",
            }}
          >
            <a
              href="https://www.africaprudential.com/Contact-Us"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                padding: "9px 18px",
                borderRadius: "6px",
                border: "1.5px solid #E31E24",
                background: "#fff",
                color: "#E31E24",
                fontSize: "13px",
                fontWeight: "600",
                textDecoration: "none",
                whiteSpace: "nowrap",
              }}
            >
              Contact us
            </a>
            <a
              href="https://www.africaprudential.com"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "9px 18px",
                borderRadius: "6px",
                border: "none",
                background: "#E31E24",
                color: "#fff",
                fontSize: "13px",
                fontWeight: "600",
                textDecoration: "none",
                whiteSpace: "nowrap",
              }}
            >
              Main Website
              <i className="ti ti-arrow-right" style={{ fontSize: "14px" }} />
            </a>
          </div>
        </nav>

        <button
          type="button"
          className="navbar-toggle"
          onClick={() => setMobileOpen((prev) => !prev)}
          aria-label="Toggle navigation menu"
          style={{
            alignItems: "center",
            justifyContent: "center",
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "8px",
            color: "#374151",
          }}
        >
          <i
            className={`ti ${mobileOpen ? "ti-x" : "ti-menu-2"}`}
            style={{ fontSize: "22px" }}
          />
        </button>
      </div>
    </header>
  );
}
