import React from "react";

const STEPS = [
  "Verify email",
  "Enter OTP",
  "Review profile",
  "Update details",
  "Done",
];

export default function StepBar({ currentStep }) {
  return (
    <div
      style={{ display: "flex", alignItems: "center", marginBottom: "28px" }}
    >
      {STEPS.map((label, idx) => {
        const stepNum = idx + 1;
        const isDone = stepNum < currentStep;
        const isActive = stepNum === currentStep;

        return (
          <React.Fragment key={stepNum}>
            {/* Step circle + label */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                flex: 1,
              }}
            >
              <div
                style={{
                  width: "28px",
                  height: "28px",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "12px",
                  fontWeight: "500",
                  border: isDone
                    ? "1.5px solid #e8b4af"
                    : isActive
                      ? "1.5px solid #C0392B"
                      : "1.5px solid #d0d0d0",
                  background: isDone
                    ? "#fdf1f0"
                    : isActive
                      ? "#C0392B"
                      : "#f8f8f8",
                  color: isDone ? "#C0392B" : isActive ? "#fff" : "#b0b0b0",
                  transition: "all 0.2s",
                }}
              >
                {isDone ? (
                  <i className="ti ti-check" style={{ fontSize: "12px" }} />
                ) : (
                  stepNum
                )}
              </div>
              <div
                style={{
                  fontSize: "10px",
                  marginTop: "4px",
                  textAlign: "center",
                  color: isActive ? "#C0392B" : "#b0b0b0",
                  fontWeight: isActive ? "500" : "400",
                }}
              >
                {label}
              </div>
            </div>

            {/* Connector line between steps */}
            {idx < STEPS.length - 1 && (
              <div
                style={{
                  flex: 1,
                  height: "1px",
                  background: stepNum < currentStep ? "#e8b4af" : "#e0e0e0",
                  margin: "0 4px",
                  marginBottom: "18px",
                  transition: "background 0.2s",
                }}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
