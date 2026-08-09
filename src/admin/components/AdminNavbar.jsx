import React, { useState } from "react";
import { clearSession } from "../services/adminApi";

export default function AdminNavbar({ agent, currentPage, onNavigate }) {
  const [menuOpen, setMenuOpen] = useState(false);

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
    admin: "#C0392B",
    lead_supervisor: "#7c3aed",
    supervisor: "#2255cc",
    agent: "#1a7a40",
  };

  const roleLabels = {
    admin: "Admin",
    lead_supervisor: "Lead Supervisor",
    supervisor: "Supervisor",
    agent: "Agent",
  };

  const roleColor = roleColors[agent?.role] || "#6b6b6b";

  return (
    <nav
      style={{
        background: "#1a1a1a",
        padding: "0 24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        height: "56px",
        position: "sticky",
        top: 0,
        zIndex: 100,
        boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
      }}
    >
      {/* Brand */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: "32px",
            height: "32px",
            background: "#C0392B",
            borderRadius: "6px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            fontSize: "12px",
            fontWeight: "600",
          }}
        >
          SR
        </div>
        <div>
          <p
            style={{
              fontSize: "13px",
              fontWeight: "500",
              color: "#fff",
              lineHeight: 1,
            }}
          >
            ShareReg Admin
          </p>
          <p style={{ fontSize: "10px", color: "#6b6b6b", marginTop: "2px" }}>
            Management Portal
          </p>
        </div>
      </div>

      {/* Nav items */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "2px",
          overflowX: "auto",
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
                gap: "5px",
                padding: "7px 10px",
                borderRadius: "6px",
                border: "none",
                background: isActive ? "#2a2a2a" : "transparent",
                color: isActive ? "#fff" : "#9b9b9b",
                fontSize: "13px",
                fontWeight: isActive ? "500" : "400",
                cursor: "pointer",
                transition: "all 0.15s",
                whiteSpace: "nowrap",
              }}
            >
              <i className={`ti ${item.icon}`} style={{ fontSize: "15px" }} />
              {item.label}
              {/* Active indicator */}
              {isActive && (
                <span
                  style={{
                    width: "4px",
                    height: "4px",
                    borderRadius: "50%",
                    background: "#C0392B",
                    marginLeft: "2px",
                  }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Agent info + logout */}
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
              fontWeight: "500",
              color: "#fff",
              lineHeight: 1,
            }}
          >
            {agent?.fullName}
          </p>
          <p style={{ fontSize: "11px", color: roleColor, marginTop: "2px" }}>
            {roleLabels[agent?.role] || agent?.role}
          </p>
        </div>
        <button
          onClick={handleLogout}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "5px",
            padding: "7px 10px",
            borderRadius: "6px",
            border: "1px solid #2a2a2a",
            background: "transparent",
            color: "#9b9b9b",
            fontSize: "13px",
            cursor: "pointer",
            transition: "all 0.15s",
            whiteSpace: "nowrap",
          }}
        >
          <i className="ti ti-logout" style={{ fontSize: "15px" }} />
          Logout
        </button>
      </div>
    </nav>
  );
}
