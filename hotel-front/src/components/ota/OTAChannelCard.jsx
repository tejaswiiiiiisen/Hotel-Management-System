import { useState } from "react";
import {
  FaSyncAlt,
  FaGlobe,
  FaClock,
  FaSlidersH,
  FaExchangeAlt,
  FaChartLine,
  FaBed,
  FaExclamationTriangle,
  FaEllipsisV,
  FaPowerOff,
} from "react-icons/fa";
import { getRelativeTimeString, formatINR } from "../../utils/otaTime.js";

export default function OTAChannelCard({
  channel,
  onSync,
  onEditRates,
  onToggleActive,
  onDisconnect,
  isSyncing = false,
}) {
  const [showMenu, setShowMenu] = useState(false);

  const getStatusBadgeStyles = (status) => {
    switch (status) {
      case "CONNECTED":
      case "Synced":
        return { label: "Synced", color: "#16a34a", bg: "#dcfce7" };
      case "PENDING":
        return { label: "Pending", color: "#d97706", bg: "#fef3c7" };
      case "SYNCING":
        return { label: "Syncing...", color: "#2563eb", bg: "#dbeafe" };
      case "ERROR":
        return { label: "Error", color: "#dc2626", bg: "#fee2e2" };
      case "DISCONNECTED":
        return { label: "Disconnected", color: "#64748b", bg: "#f1f5f9" };
      default:
        return { label: status, color: "#16a34a", bg: "#dcfce7" };
    }
  };

  const statusStyle = getStatusBadgeStyles(channel.status);
  const isChannelSyncing = isSyncing || channel.status === "SYNCING";
  const isError = channel.status === "ERROR";

  return (
    <div
      className="ota-channel-card"
      style={{
        background: "#ffffff",
        border: isError ? "1.5px solid #fca5a5" : "1px solid #eef2f6",
        borderRadius: "18px",
        padding: "22px",
        boxShadow: "0 4px 16px rgba(0, 0, 0, 0.02)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        gap: "16px",
        opacity: channel.active && channel.status !== "DISCONNECTED" ? 1 : 0.65,
        transition: "all 0.2s ease",
        position: "relative",
      }}
    >
      {/* CARD TOP: ICON, NAME, STATUS BADGE, TOGGLE & MENU */}
      <div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "12px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "42px",
                height: "42px",
                borderRadius: "12px",
                background: channel.iconBg || "#3b82f6",
                color: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "18px",
                fontWeight: "800",
                boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
              }}
            >
              <FaGlobe />
            </div>

            <div>
              <h3
                className="ota-channel-name"
                style={{ margin: 0, fontSize: "17px", fontWeight: "700", color: "#0f172a" }}
              >
                {channel.displayName || channel.name}
              </h3>
              <span style={{ fontSize: "11px", color: "#94a3b8" }}>
                <FaClock style={{ fontSize: "10px", marginRight: "3px" }} />
                {isChannelSyncing ? "Syncing..." : getRelativeTimeString(channel.lastSyncedAt)}
              </span>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span
              className={`badge ${statusStyle.label.toLowerCase()}`}
              style={{
                padding: "3px 10px",
                borderRadius: "999px",
                fontSize: "11px",
                fontWeight: "700",
                background: statusStyle.bg,
                color: statusStyle.color,
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              {isError && <FaExclamationTriangle style={{ fontSize: "10px" }} />}
              {statusStyle.label}
            </span>

            {/* TOGGLE SWITCH */}
            <input
              type="checkbox"
              checked={channel.active && channel.status !== "DISCONNECTED"}
              onChange={() => onToggleActive && onToggleActive(channel.id)}
              style={{ cursor: "pointer", width: "16px", height: "16px" }}
              title="Toggle channel active status"
            />

            {/* MENU BUTTON */}
            <div style={{ position: "relative" }}>
              <button
                type="button"
                onClick={() => setShowMenu((prev) => !prev)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#94a3b8",
                  cursor: "pointer",
                  padding: "4px",
                }}
                title="Channel Options"
              >
                <FaEllipsisV />
              </button>
              {showMenu && (
                <div
                  style={{
                    position: "absolute",
                    top: "100%",
                    right: 0,
                    background: "#ffffff",
                    border: "1px solid #e2e8f0",
                    borderRadius: "10px",
                    boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
                    zIndex: 10,
                    width: "150px",
                    padding: "4px",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setShowMenu(false);
                      onDisconnect && onDisconnect(channel);
                    }}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      textAlign: "left",
                      background: "transparent",
                      border: "none",
                      color: "#dc2626",
                      fontSize: "13px",
                      fontWeight: "600",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      borderRadius: "6px",
                    }}
                  >
                    <FaPowerOff /> Disconnect
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ERROR MESSAGE ALERT IF IN ERROR STATE */}
        {isError && channel.syncError && (
          <div
            style={{
              background: "#fef2f2",
              border: "1px solid #fecaca",
              borderRadius: "10px",
              padding: "8px 12px",
              marginBottom: "12px",
              fontSize: "11px",
              color: "#991b1b",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <FaExclamationTriangle style={{ color: "#dc2626", flexShrink: 0 }} />
            <span>{channel.syncError}</span>
          </div>
        )}

        {/* METRICS BOX GRID */}
        <div
          className="ota-metrics-box"
          style={{
            background: "#f8fafc",
            borderRadius: "14px",
            padding: "14px",
            border: "1px solid #f1f5f9",
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "12px",
          }}
        >
          <div>
            <span
              className="ota-metric-lbl"
              style={{
                fontSize: "11px",
                color: "#64748b",
                display: "flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              <FaBed style={{ color: "#3b82f6" }} /> Synced Rooms
            </span>
            <strong
              className="ota-metric-val"
              style={{ fontSize: "16px", fontWeight: "800", color: "#0f172a" }}
            >
              {channel.syncedRooms || 42} Rooms
            </strong>
          </div>

          <div>
            <span
              className="ota-metric-lbl"
              style={{
                fontSize: "11px",
                color: "#64748b",
                display: "flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              <FaExchangeAlt style={{ color: "#10b981" }} /> Live Rate
            </span>
            <strong
              className="ota-metric-val"
              style={{ fontSize: "16px", fontWeight: "800", color: "#0f172a" }}
            >
              {formatINR(channel.liveRate || 4200)}/night
            </strong>
          </div>

          <div>
            <span
              className="ota-metric-lbl"
              style={{
                fontSize: "11px",
                color: "#64748b",
                display: "flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              <FaChartLine style={{ color: "#a855f7" }} /> Bookings (30d)
            </span>
            <strong
              className="ota-metric-val"
              style={{ fontSize: "16px", fontWeight: "800", color: "#0f172a" }}
            >
              {channel.bookings30Days || 0} Bookings
            </strong>
          </div>

          <div>
            <span
              className="ota-metric-lbl"
              style={{ fontSize: "11px", color: "#64748b" }}
            >
              Revenue
            </span>
            <strong style={{ fontSize: "16px", fontWeight: "800", color: "#16a34a" }}>
              {formatINR(channel.revenue30Days || 0)}
            </strong>
          </div>
        </div>
      </div>

      {/* CARD BOTTOM ACTION BUTTONS */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          paddingTop: "8px",
        }}
      >
        <button
          type="button"
          onClick={() => onSync && onSync(channel.id)}
          disabled={isChannelSyncing || channel.status === "DISCONNECTED"}
          style={{
            flex: 1,
            padding: "9px 14px",
            borderRadius: "10px",
            fontSize: "13px",
            fontWeight: "700",
            border: "none",
            background: isError
              ? "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)"
              : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            color: "#ffffff",
            cursor: isChannelSyncing || channel.status === "DISCONNECTED" ? "not-allowed" : "pointer",
            opacity: isChannelSyncing ? 0.7 : 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "6px",
            boxShadow: isError
              ? "0 4px 12px rgba(239, 68, 68, 0.35)"
              : "0 4px 12px rgba(102, 126, 234, 0.35)",
            transition: "transform 0.15s ease",
          }}
          onMouseEnter={(e) => {
            if (!isChannelSyncing) e.currentTarget.style.transform = "translateY(-1px)";
          }}
          onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
        >
          <FaSyncAlt className={isChannelSyncing ? "spin-icon" : ""} />
          {isChannelSyncing ? "Syncing..." : isError ? "Retry Sync" : "Sync Now"}
        </button>

        <button
          type="button"
          className="ota-btn-secondary"
          onClick={() => onEditRates && onEditRates(channel)}
          disabled={channel.status === "DISCONNECTED"}
          style={{
            flex: 1,
            padding: "9px 14px",
            borderRadius: "10px",
            fontSize: "13px",
            fontWeight: "600",
            border: "1px solid #e2e8f0",
            background: "#ffffff",
            color: "#475569",
            cursor: channel.status === "DISCONNECTED" ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "6px",
            transition: "background 0.2s ease",
          }}
        >
          <FaSlidersH /> Edit Rates
        </button>
      </div>
    </div>
  );
}
