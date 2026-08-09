import React from "react";

export default function StatCard({ label, value, icon, color, subLabel }) {
  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #e8e8e8",
        borderRadius: "12px",
        padding: "20px",
        boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
        display: "flex",
        alignItems: "flex-start",
        gap: "14px",
      }}
    >
      {/* Icon */}
      <div
        style={{
          width: "44px",
          height: "44px",
          borderRadius: "10px",
          background: `${color}15`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <i className={`ti ${icon}`} style={{ fontSize: "22px", color }} />
      </div>

      {/* Text */}
      <div>
        <p
          style={{
            fontSize: "12px",
            color: "#6b6b6b",
            marginBottom: "4px",
            fontWeight: "500",
            textTransform: "uppercase",
            letterSpacing: "0.5px",
          }}
        >
          {label}
        </p>
        <p
          style={{
            fontSize: "28px",
            fontWeight: "600",
            color: "#1a1a1a",
            lineHeight: 1,
          }}
        >
          {value}
        </p>
        {subLabel && (
          <p style={{ fontSize: "12px", color: "#6b6b6b", marginTop: "4px" }}>
            {subLabel}
          </p>
        )}
      </div>
    </div>
  );
}
