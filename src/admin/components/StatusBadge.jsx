import React from "react";

const STATUS_CONFIG = {
  pending: {
    label: "Pending",
    background: "#fff8e6",
    color: "#b36a00",
    border: "#f5d78e",
    icon: "ti-clock",
  },
  assigned: {
    label: "Assigned",
    background: "#f0f4ff",
    color: "#2255cc",
    border: "#c0d0f5",
    icon: "ti-user-check",
  },
  in_progress: {
    label: "In Progress",
    background: "#f0f9ff",
    color: "#0077b6",
    border: "#b0dcf5",
    icon: "ti-loader",
  },
  completed: {
    label: "Completed",
    background: "#f0faf4",
    color: "#1a7a40",
    border: "#a8dfc0",
    icon: "ti-circle-check",
  },
  rejected: {
    label: "Rejected",
    background: "#fdf1f0",
    color: "#C0392B",
    border: "#e8b4af",
    icon: "ti-circle-x",
  },
};

const TYPE_CONFIG = {
  nameChange: { label: "Name Change", icon: "ti-user", color: "#7c3aed" },
  kycUpdate: { label: "KYC Update", icon: "ti-id", color: "#0077b6" },
  addressUpdate: {
    label: "Address Update",
    icon: "ti-map-pin",
    color: "#b36a00",
  },
  signatureUpdate: {
    label: "Signature Update",
    icon: "ti-writing",
    color: "#1a7a40",
  },
  nubanChange: {
    label: "NUBAN Change",
    icon: "ti-building-bank",
    color: "#C0392B",
  },
};

export function StatusBadge({ status }) {
  const config = STATUS_CONFIG[status] || {
    label: status,
    background: "#f0f0f0",
    color: "#6b6b6b",
    border: "#d0d0d0",
    icon: "ti-point",
  };

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "5px",
        padding: "4px 10px",
        borderRadius: "20px",
        fontSize: "12px",
        fontWeight: "500",
        background: config.background,
        color: config.color,
        border: `1px solid ${config.border}`,
        whiteSpace: "nowrap",
      }}
    >
      <i className={`ti ${config.icon}`} style={{ fontSize: "12px" }} />
      {config.label}
    </span>
  );
}

export function TypeBadge({ type }) {
  const config = TYPE_CONFIG[type] || {
    label: type,
    icon: "ti-file",
    color: "#6b6b6b",
  };

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "5px",
        padding: "4px 10px",
        borderRadius: "20px",
        fontSize: "12px",
        fontWeight: "500",
        background: "#f8f8f8",
        color: config.color,
        border: "1px solid #e8e8e8",
        whiteSpace: "nowrap",
      }}
    >
      <i className={`ti ${config.icon}`} style={{ fontSize: "12px" }} />
      {config.label}
    </span>
  );
}

export default StatusBadge;
