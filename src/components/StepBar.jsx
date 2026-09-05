import React from "react";

const STEPS = [
  { num: 1, label: "Verify" },
  { num: 2, label: "Holdings" },
  { num: 3, label: "Select" },
  { num: 4, label: "Details" },
  { num: 5, label: "Review" },
];

export default function StepBar({ currentStep }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: "32px",
        padding: "0 8px",
      }}
    >
      {STEPS.map((step, idx) => {
        const done = currentStep > step.num;
        const active = currentStep === step.num;
        return (
          <React.Fragment key={step.num}>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "50%",
                  border: done || active ? "none" : "2px solid #E5E7EB",
                  background: done ? "#E31E24" : active ? "#E31E24" : "#FFFFFF",
                  color: done || active ? "#FFFFFF" : "#9CA3AF",
                  fontSize: "13px",
                  fontWeight: "600",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: "Inter, sans-serif",
                  boxShadow: active ? "0 0 0 4px rgba(227,30,36,0.15)" : "none",
                  transition: "all 0.3s",
                  zIndex: 1,
                  position: "relative",
                }}
              >
                {done ? (
                  <i className="ti ti-check" style={{ fontSize: "16px" }} />
                ) : (
                  step.num
                )}
              </div>
              <span
                style={{
                  fontSize: "10px",
                  fontWeight: active ? "600" : "500",
                  color: active ? "#E31E24" : done ? "#E31E24" : "#9CA3AF",
                  fontFamily: "Inter, sans-serif",
                  letterSpacing: "0.02em",
                  textTransform: "uppercase",
                  whiteSpace: "nowrap",
                }}
              >
                {step.label}
              </span>
            </div>
            {idx < STEPS.length - 1 && (
              <div
                style={{
                  flex: 1,
                  height: "2px",
                  background: done ? "#E31E24" : "#E5E7EB",
                  margin: "0 4px",
                  marginTop: "-18px",
                  transition: "background 0.3s",
                  maxWidth: "80px",
                }}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
