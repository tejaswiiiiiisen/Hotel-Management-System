import React from "react";

function BookingStats({
  totalBookings = 0,
  predictedCancellation = 0,
  predictedNonCancellation = 0,
}) {
  const cancellationRate =
    totalBookings > 0
      ? ((predictedCancellation / totalBookings) * 100).toFixed(1)
      : "0.0";

  const stats = [
    {
      title: "Total Bookings",
      value: totalBookings,
      color: "#6366f1",
      bg: "rgba(99, 102, 241, 0.08)",
      icon: "📊",
    },
    {
      title: "Predicted Cancellation",
      value: predictedCancellation,
      color: "#ef4444",
      bg: "rgba(239, 68, 68, 0.08)",
      icon: "⚠️",
    },
    {
      title: "Predicted Non-Cancellation",
      value: predictedNonCancellation,
      color: "#10b981",
      bg: "rgba(16, 185, 129, 0.08)",
      icon: "✅",
    },
    {
      title: "Cancellation Rate",
      value: `${cancellationRate}%`,
      color: "#f59e0b",
      bg: "rgba(245, 158, 11, 0.08)",
      icon: "📈",
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
          <h2 style={{ fontSize: "26px", fontWeight: "800", color: "var(--text-color, #0f172a)", margin: 0 }}>
            {stat.value}
          </h2>
        </div>
      ))}
    </div>
  );
}

export default BookingStats;
