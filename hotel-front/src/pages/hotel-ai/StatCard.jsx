import React from "react";

function StatCard({ title, value, type, icon }) {
  const getStyle = () => {
    switch (type) {
      case "positive":
        return { color: "#10b981", bg: "rgba(16, 185, 129, 0.1)", defaultIcon: "✓" };
      case "negative":
        return { color: "#ef4444", bg: "rgba(239, 68, 68, 0.1)", defaultIcon: "✕" };
      case "neutral":
        return { color: "#f59e0b", bg: "rgba(245, 158, 11, 0.1)", defaultIcon: "—" };
      default:
        return { color: "#6366f1", bg: "rgba(99, 102, 241, 0.1)", defaultIcon: "▣" };
    }
  };

  const style = getStyle();

  return (
    <div
      className="hotel-ai-card"
      style={{
        padding: "18px 22px",
        display: "flex",
        flexDirection: "column",
        gap: "10px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: "13px", fontWeight: "600", color: "var(--text-muted, #64748b)" }}>
          {title}
        </span>
        <div
          style={{
            width: "32px",
            height: "32px",
            borderRadius: "8px",
            background: style.bg,
            color: style.color,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: "800",
            fontSize: "14px",
          }}
        >
          {icon || style.defaultIcon}
        </div>
      </div>
      <div style={{ fontSize: "28px", fontWeight: "800", color: "var(--text-color, #0f172a)" }}>
        {value}
      </div>
    </div>
  );
}

export default StatCard;
