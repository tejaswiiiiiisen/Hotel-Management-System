import React from "react";

function RevenueStats({
  currentMonthRevenue = 0,
  predictedNextMonthRevenue = 0,
}) {
  const revenueIncrease = predictedNextMonthRevenue - currentMonthRevenue;

  const revenueGrowth =
    currentMonthRevenue > 0
      ? ((revenueIncrease / currentMonthRevenue) * 100).toFixed(1)
      : "0.0";

  const stats = [
    {
      title: "Current Month Revenue",
      value: `₹${currentMonthRevenue.toLocaleString("en-IN")}`,
      icon: "💵",
      color: "#6366f1",
      bg: "rgba(99, 102, 241, 0.08)",
    },
    {
      title: "Predicted Next Month",
      value: `₹${predictedNextMonthRevenue.toLocaleString("en-IN")}`,
      icon: "🔮",
      color: "#10b981",
      bg: "rgba(16, 185, 129, 0.08)",
    },
    {
      title: "Expected Growth",
      value: `₹${revenueIncrease.toLocaleString("en-IN")}`,
      icon: "📈",
      color: "#3b82f6",
      bg: "rgba(59, 130, 246, 0.08)",
    },
    {
      title: "Growth Percentage",
      value: `${revenueGrowth}%`,
      icon: "🎯",
      color: "#8b5cf6",
      bg: "rgba(139, 92, 246, 0.08)",
    },
  ];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px", marginBottom: "24px" }}>
      {stats.map((stat) => (
        <div
          key={stat.title}
          className="hotel-ai-card"
          style={{
            padding: "20px",
            display: "flex",
            flexDirection: "column",
            gap: "8px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "13px", fontWeight: "600", color: "var(--text-muted, #64748b)" }}>
              {stat.title}
            </span>
            <span style={{ fontSize: "20px", background: stat.bg, padding: "6px", borderRadius: "10px" }}>
              {stat.icon}
            </span>
          </div>
          <h2 style={{ fontSize: "24px", fontWeight: "800", color: "var(--text-color, #0f172a)", margin: 0 }}>
            {stat.value}
          </h2>
        </div>
      ))}
    </div>
  );
}

export default RevenueStats;
