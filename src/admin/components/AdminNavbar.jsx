import React, { useState } from "react";
import { clearSession } from "../services/adminApi";
import APLogo from "../../assets/AP_LOGO.png";

<img src={APLogo} alt="Africa Prudential" />;

export default function AdminNavbar({ agent, currentPage, onNavigate }) {
  function handleLogout() {
    clearSession();
    window.location.href = "/admin";
  }

  const navItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: "ti-layout-dashboard",
      roles: ["admin", "lead_supervisor", "supervisor", "agent"],
    },
    {
      id: "requests",
      label: "Requests",
      icon: "ti-file-text",
      roles: ["admin", "lead_supervisor", "supervisor", "agent"],
    },
    {
      id: "performance",
      label: "Performance",
      icon: "ti-chart-line",
      roles: ["admin", "lead_supervisor", "supervisor", "agent"],
    },
    {
      id: "reports",
      label: "Reports",
      icon: "ti-report-analytics",
      roles: ["admin", "lead_supervisor", "supervisor"],
    },
    {
      id: "autoAssign",
      label: "Auto-assign",
      icon: "ti-bolt",
      roles: ["admin", "lead_supervisor", "supervisor"],
    },
    {
      id: "agents",
      label: "Agents",
      icon: "ti-users",
      roles: ["admin", "lead_supervisor", "supervisor"],
    },
    {
      id: "settings",
      label: "Settings",
      icon: "ti-settings",
      roles: ["admin", "lead_supervisor"],
    },
  ];

  const visibleItems = navItems.filter((item) =>
    item.roles.includes(agent?.role),
  );

  const roleColors = {
    admin: "#E31E24",
    lead_supervisor: "#7C3AED",
    supervisor: "#2563EB",
    agent: "#059669",
  };

  const roleLabels = {
    admin: "Admin",
    lead_supervisor: "Lead Supervisor",
    supervisor: "Supervisor",
    agent: "Agent",
  };

  return (
    <nav
      style={{
        background: "#1A1A2E",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
        position: "sticky",
        top: 0,
        zIndex: 100,
      }}
    >
      <div
        style={{
          maxWidth: "1400px",
          margin: "0 auto",
          padding: "0 24px",
          height: "60px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "16px",
        }}
      >
        {/* Brand */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            flexShrink: 0,
          }}
        >
          <img
            src={AP_LOGO}
            alt="Africa Prudential"
            style={{
              height: "28px",
              width: "auto",
              objectFit: "contain",
              filter: "brightness(0) invert(1)",
            }}
          />
          <div
            style={{
              width: "1px",
              height: "24px",
              background: "rgba(255,255,255,0.15)",
            }}
          />
          <div>
            <p
              style={{
                fontSize: "11px",
                fontWeight: "600",
                color: "#FFFFFF",
                lineHeight: 1,
                letterSpacing: "0.04em",
                textTransform: "uppercase",
              }}
            >
              Admin Portal
            </p>
            <p
              style={{
                fontSize: "10px",
                color: "rgba(255,255,255,0.4)",
                marginTop: "2px",
              }}
            >
              Management Dashboard
            </p>
          </div>
        </div>

        {/* Nav items */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "2px",
            overflow: "auto",
            flex: 1,
            justifyContent: "center",
          }}
        >
          {visibleItems.map((item) => {
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "7px 12px",
                  borderRadius: "8px",
                  border: "none",
                  background: isActive ? "rgba(227,30,36,0.15)" : "transparent",
                  color: isActive ? "#E31E24" : "rgba(255,255,255,0.6)",
                  fontSize: "13px",
                  fontWeight: isActive ? "600" : "400",
                  fontFamily: "Inter, sans-serif",
                  cursor: "pointer",
                  transition: "all 0.15s",
                  whiteSpace: "nowrap",
                  borderBottom: isActive
                    ? "2px solid #E31E24"
                    : "2px solid transparent",
                  borderRadius: "6px 6px 0 0",
                }}
              >
                <i className={"ti " + item.icon} style={{ fontSize: "15px" }} />
                {item.label}
              </button>
            );
          })}
        </div>

        {/* Agent info */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            flexShrink: 0,
          }}
        >
          <div style={{ textAlign: "right" }}>
            <p
              style={{
                fontSize: "13px",
                fontWeight: "600",
                color: "#FFFFFF",
                lineHeight: 1,
              }}
            >
              {agent?.fullName}
            </p>
            <p
              style={{
                fontSize: "11px",
                color: roleColors[agent?.role] || "#6B7280",
                marginTop: "2px",
                fontWeight: "500",
              }}
            >
              {roleLabels[agent?.role] || agent?.role}
            </p>
          </div>
          <button
            onClick={handleLogout}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "5px",
              padding: "7px 12px",
              borderRadius: "8px",
              border: "1px solid rgba(255,255,255,0.12)",
              background: "rgba(255,255,255,0.05)",
              color: "rgba(255,255,255,0.6)",
              fontSize: "13px",
              fontFamily: "Inter, sans-serif",
              cursor: "pointer",
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(227,30,36,0.15)";
              e.currentTarget.style.color = "#E31E24";
              e.currentTarget.style.borderColor = "rgba(227,30,36,0.3)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.05)";
              e.currentTarget.style.color = "rgba(255,255,255,0.6)";
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)";
            }}
          >
            <i className="ti ti-logout" style={{ fontSize: "15px" }} />
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}
