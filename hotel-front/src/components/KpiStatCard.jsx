import React from "react";

// Mini Sparkline Graph component with Register Guest button gradient (#667eea -> #764ba2)
const SparklineGraph = ({
  colorStart = "#667eea",
  colorEnd = "#764ba2",
  data = [30, 45, 35, 60, 50, 75, 90]
}) => {
  const strokeGradId = `kpi-stroke-grad-${Math.random().toString(36).substring(2, 8)}`;
  const areaGradId = `kpi-area-grad-${Math.random().toString(36).substring(2, 8)}`;
  const width = 240;
  const height = 46;
  const padding = 4;
  const maxVal = Math.max(...data, 100);
  const minVal = Math.min(...data, 0);
  const range = maxVal - minVal || 1;

  const points = data.map((val, idx) => {
    const x = (idx / (data.length - 1)) * width;
    const y = height - padding - ((val - minVal) / range) * (height - 2 * padding);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  const pathD = `M ${points.join(" L ")}`;
  const areaD = `${pathD} L ${width},${height} L 0,${height} Z`;

  return (
    <svg
      width="100%"
      height="46"
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      fill="none"
      style={{ overflow: "visible", display: "block" }}
    >
      <defs>
        <linearGradient id={strokeGradId} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={colorStart} />
          <stop offset="100%" stopColor={colorEnd} />
        </linearGradient>
        <linearGradient id={areaGradId} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={colorStart} stopOpacity="0.35" />
          <stop offset="100%" stopColor={colorEnd} stopOpacity="0.0" />
        </linearGradient>
      </defs>
      <path d={areaD} fill={`url(#${areaGradId})`} />
      <path
        d={pathD}
        stroke={`url(#${strokeGradId})`}
        strokeWidth="2.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

const KpiStatCard = ({
  icon,
  iconBg = "#eef2ff",
  iconColor = "#5b67ea",
  badgeText,
  badgeBg = "#dcfce7",
  badgeColor = "#10b981",
  chartData = [30, 45, 40, 60, 55, 75, 90],
  chartColor = "#667eea",
  chartColorEnd = "#764ba2",
  title,
  number,
  onClick,
  tooltip,
  className = ""
}) => {
  return (
    <div
      className={`kpi-custom-card ${onClick ? "clickable" : ""} ${className}`}
      onClick={onClick}
      title={tooltip}
      style={{ cursor: onClick ? "pointer" : "default" }}
    >
      {/* TOP ROW: Top Left = Icon | Top Right = Badge */}
      <div className="kpi-card-top">
        <div
          className="kpi-card-icon"
          style={{ background: iconBg, color: iconColor }}
        >
          {icon}
        </div>
        {badgeText && (
          <div
            className="kpi-card-badge"
            style={{ background: badgeBg, color: badgeColor }}
          >
            {badgeText}
          </div>
        )}
      </div>

      {/* MIDDLE ROW: Graph */}
      <div className="kpi-card-middle">
        <SparklineGraph colorStart={chartColor} colorEnd={chartColorEnd} data={chartData} />
      </div>

      {/* BOTTOM ROW: Number to the RIGHT of Heading/Title */}
      <div className="kpi-card-bottom">
        <div className="kpi-card-info">
          <span className="kpi-card-title">{title}</span>
          <span className="kpi-card-number">{number}</span>
        </div>
      </div>
    </div>
  );
};

export default KpiStatCard;
