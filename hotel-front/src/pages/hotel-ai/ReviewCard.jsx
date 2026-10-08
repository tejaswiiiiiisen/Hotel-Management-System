import React from "react";

function ReviewCard({ review, rating, sentiment, date }) {
  const getBadge = (s) => {
    const sent = String(s || "").toLowerCase();
    if (sent.includes("pos")) return { label: "Positive", color: "#10b981", bg: "rgba(16, 185, 129, 0.12)" };
    if (sent.includes("neg")) return { label: "Negative", color: "#ef4444", bg: "rgba(239, 68, 68, 0.12)" };
    return { label: "Neutral", color: "#f59e0b", bg: "rgba(245, 158, 11, 0.12)" };
  };

  const badge = getBadge(sentiment);

  return (
    <div
      className="hotel-ai-card"
      style={{
        padding: "16px 20px",
        display: "flex",
        flexDirection: "column",
        gap: "10px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "8px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ color: "#f59e0b", fontSize: "16px", letterSpacing: "2px" }}>
            {"★".repeat(Math.max(1, Math.min(5, Number(rating) || 5)))}
            <span style={{ color: "var(--border-color, #cbd5e1)" }}>
              {"★".repeat(Math.max(0, 5 - (Number(rating) || 5)))}
            </span>
          </span>
          <span style={{ fontSize: "13px", fontWeight: "700", color: "var(--text-muted, #64748b)" }}>
            {rating}/5
          </span>
        </div>

        {sentiment && (
          <span
            style={{
              fontSize: "11px",
              fontWeight: "700",
              color: badge.color,
              background: badge.bg,
              padding: "4px 10px",
              borderRadius: "999px",
              border: `1px solid ${badge.color}33`,
            }}
          >
            {badge.label}
          </span>
        )}
      </div>

      <p style={{ margin: 0, fontSize: "14px", lineHeight: "1.6", color: "var(--text-color, #334155)" }}>
        {review}
      </p>

      {date && (
        <span style={{ fontSize: "11px", color: "var(--text-muted, #94a3b8)", alignSelf: "flex-end" }}>
          {new Date(date).toLocaleDateString()}
        </span>
      )}
    </div>
  );
}

export default ReviewCard;
