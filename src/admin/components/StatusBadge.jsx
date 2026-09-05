import React from "react";

const STATUS_CONFIG = {
  pending: {
    label: "Pending",
    bg: "#F9FAFB",
    color: "#6B7280",
    border: "#E5E7EB",
    icon: "ti-clock",
  },
  open: {
    label: "Open",
    bg: "#EFF6FF",
    color: "#2563EB",
    border: "#BFDBFE",
    icon: "ti-folder-open",
  },
  waiting_on_customer: {
    label: "Waiting on Customer",
    bg: "#FFFBEB",
    color: "#D97706",
    border: "#FDE68A",
    icon: "ti-clock-pause",
  },
  approved: {
    label: "Approved",
    bg: "#FEF2F2",
    color: "#DC2626",
    border: "#FECACA",
    icon: "ti-circle-check",
  },
  completed: {
    label: "Completed",
    bg: "#ECFDF5",
    color: "#059669",
    border: "#A7F3D0",
    icon: "ti-checks",
  },
  rejected: {
    label: "Rejected",
    bg: "#FEF2F2",
    color: "#DC2626",
    border: "#FECACA",
    icon: "ti-circle-x",
  },
  closed: {
    label: "Closed",
    bg: "#F9FAFB",
    color: "#6B7280",
    border: "#E5E7EB",
    icon: "ti-lock",
  },
};

const TYPE_CONFIG = {
  nameChange: { label: "Name Change", color: "#7C3AED", bg: "#F5F3FF" },
  kycUpdate: { label: "KYC Update", color: "#2563EB", bg: "#EFF6FF" },
  addressUpdate: { label: "Address Update", color: "#D97706", bg: "#FFFBEB" },
  signatureUpdate: {
    label: "Signature Update",
    color: "#059669",
    bg: "#ECFDF5",
  },
  nubanChange: { label: "NUBAN Change", color: "#E31E24", bg: "#FEF2F2" },
};

export function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || {
    label: status,
    bg: "#F9FAFB",
    color: "#6B7280",
    border: "#E5E7EB",
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
        fontWeight: "600",
        background: cfg.bg,
        color: cfg.color,
        border: "1px solid " + cfg.border,
        fontFamily: "Inter, sans-serif",
        letterSpacing: "0.01em",
        whiteSpace: "nowrap",
      }}
    >
      <i className={"ti " + cfg.icon} style={{ fontSize: "12px" }} />
      {cfg.label}
    </span>
  );
}

export function TypeBadge({ type }) {
  const cfg = TYPE_CONFIG[type] || {
    label: type,
    color: "#6B7280",
    bg: "#F9FAFB",
  };
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "3px 10px",
        borderRadius: "20px",
        fontSize: "11px",
        fontWeight: "600",
        background: cfg.bg,
        color: cfg.color,
        fontFamily: "Inter, sans-serif",
        letterSpacing: "0.02em",
        textTransform: "uppercase",
      }}
    >
      {cfg.label}
    </span>
  );
}

export default StatusBadge;
