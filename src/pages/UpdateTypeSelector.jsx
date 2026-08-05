import React, { useState } from "react";
import { UPDATE_CATEGORIES } from "../config/updateCategories";

export default function UpdateTypeSelector({ onSelect, onBack }) {
  const [selected, setSelected] = useState(null);

  function handleProceed() {
    if (!selected) return;
    onSelect(selected);
  }

  return (
    <div style={{ maxWidth: "560px", margin: "0 auto" }}>
      <div className="card">
        {/* Header */}
        <p
          style={{
            fontSize: "11px",
            fontWeight: "500",
            color: "#C0392B",
            letterSpacing: "0.6px",
            textTransform: "uppercase",
            marginBottom: "6px",
          }}
        >
          What would you like to update?
        </p>
        <h2 style={{ marginBottom: "6px" }}>Select an update type</h2>
        <p
          style={{
            fontSize: "14px",
            color: "#6b6b6b",
            marginBottom: "24px",
            lineHeight: 1.6,
          }}
        >
          Select one option below. You can come back to update something else
          after completing this request.
        </p>

        {/* Category cards */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "10px",
            marginBottom: "24px",
          }}
        >
          {UPDATE_CATEGORIES.map((category) => {
            const isSelected = selected?.id === category.id;
            return (
              <button
                key={category.id}
                type="button"
                onClick={() => setSelected(category)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "14px",
                  padding: "14px 16px",
                  background: isSelected ? "#fdf1f0" : "#fafafa",
                  border: `1.5px solid ${isSelected ? "#C0392B" : "#e8e8e8"}`,
                  borderRadius: "8px",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "all 0.15s",
                  width: "100%",
                }}
              >
                {/* Icon */}
                <div
                  style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "8px",
                    background: isSelected ? "#C0392B" : "#f0f0f0",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    transition: "all 0.15s",
                  }}
                >
                  <i
                    className={`ti ${category.icon}`}
                    style={{
                      fontSize: "18px",
                      color: isSelected ? "#fff" : "#6b6b6b",
                    }}
                  />
                </div>

                {/* Text */}
                <div style={{ flex: 1 }}>
                  <p
                    style={{
                      fontSize: "14px",
                      fontWeight: "500",
                      color: isSelected ? "#C0392B" : "#1a1a1a",
                      marginBottom: "2px",
                    }}
                  >
                    {category.label}
                  </p>
                  <p style={{ fontSize: "12px", color: "#6b6b6b" }}>
                    {category.description}
                  </p>
                </div>

                {/* Selected indicator */}
                <div
                  style={{
                    width: "20px",
                    height: "20px",
                    borderRadius: "50%",
                    border: `2px solid ${isSelected ? "#C0392B" : "#d0d0d0"}`,
                    background: isSelected ? "#C0392B" : "transparent",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    transition: "all 0.15s",
                  }}
                >
                  {isSelected && (
                    <i
                      className="ti ti-check"
                      style={{ fontSize: "11px", color: "#fff" }}
                    />
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Proceed button */}
        <button
          className="btn-primary"
          onClick={handleProceed}
          disabled={!selected}
        >
          <i className="ti ti-arrow-right" style={{ fontSize: "15px" }} />
          Proceed with {selected ? selected.label : "..."}
        </button>

        <button
          className="btn-ghost"
          style={{ marginTop: "8px" }}
          onClick={onBack}
        >
          <i className="ti ti-arrow-left" style={{ fontSize: "15px" }} /> Back
          to my records
        </button>
      </div>
    </div>
  );
}
