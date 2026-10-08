import { useState } from "react";
import { formatINR } from "../../utils/otaTime.js";
import { FaTimes, FaGlobe, FaChartBar, FaExchangeAlt, FaBed, FaExternalLinkAlt, FaSyncAlt } from "react-icons/fa";
import { otaStorage } from "../../services/ota/otaStorage.js";
import { otaService } from "../../services/ota/otaService.js";

export default function OTADashboardStats({ stats, onSelectTab }) {
  const [activeModal, setActiveModal] = useState(null); // 'connections' | 'revenue' | 'bookings' | null
  const [syncingId, setSyncingId] = useState(null);

  const connections = otaStorage.getConnections();
  const activeConnList = connections.filter((c) => c.status === "CONNECTED" || c.status === "SYNCING");

  const {
    activeConnections = activeConnList.length,
    totalRevenue30d = connections.reduce((sum, c) => sum + (c.revenue30Days || 0), 0),
    totalBookings30d = connections.reduce((sum, c) => sum + (c.bookings30Days || 0), 0),
  } = stats || {};

  const handleSyncFromModal = async (id) => {
    setSyncingId(id);
    try {
      await otaService.syncChannel(id, false);
    } catch (e) {
      console.warn("Sync error", e);
    } finally {
      setSyncingId(null);
    }
  };

  return (
    <>
      {/* 3 OVERVIEW STAT CARDS GRID */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "16px",
          marginBottom: "24px",
        }}
      >
        {/* CARD 1: ACTIVE CONNECTIONS */}
        <div
          className="ota-stat-card active-conn"
          onClick={() => setActiveModal("connections")}
          style={{
            background: "#f8fafc",
            borderRadius: "14px",
            padding: "16px 20px",
            border: "1px solid #f1f5f9",
            cursor: "pointer",
            transition: "all 0.15s ease",
            position: "relative",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.boxShadow = "0 6px 16px rgba(0,0,0,0.06)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "none";
          }}
          title="Click to view Active OTA Connections detail breakdown"
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span className="ota-stat-lbl" style={{ fontSize: "12px", color: "#64748b", fontWeight: "600" }}>
              Active OTA Connections
            </span>
            <FaExternalLinkAlt style={{ fontSize: "10px", color: "#94a3b8" }} />
          </div>
          <div className="ota-stat-val" style={{ fontSize: "24px", fontWeight: "800", color: "#0f172a", marginTop: "4px" }}>
            {activeConnections} Connected
          </div>
          <span style={{ fontSize: "11px", color: "#64748b", marginTop: "4px", display: "inline-block" }}>
            Click to manage channel connections ↗
          </span>
        </div>

        {/* CARD 2: TOTAL OTA REVENUE */}
        <div
          className="ota-stat-card revenue"
          onClick={() => setActiveModal("revenue")}
          style={{
            background: "#f0fdf4",
            borderRadius: "14px",
            padding: "16px 20px",
            border: "1px solid #dcfce7",
            cursor: "pointer",
            transition: "all 0.15s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.boxShadow = "0 6px 16px rgba(16, 185, 129, 0.15)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "none";
          }}
          title="Click to view 30-Day Revenue Breakdown by Channel"
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span className="ota-stat-lbl" style={{ fontSize: "12px", color: "#166534", fontWeight: "600" }}>
              Total OTA Revenue (30d)
            </span>
            <FaExternalLinkAlt style={{ fontSize: "10px", color: "#15803d" }} />
          </div>
          <div className="ota-stat-val" style={{ fontSize: "24px", fontWeight: "800", color: "#15803d", marginTop: "4px" }}>
            {formatINR(totalRevenue30d)}
          </div>
          <span style={{ fontSize: "11px", color: "#166534", marginTop: "4px", display: "inline-block" }}>
            Click for revenue breakdown ↗
          </span>
        </div>

        {/* CARD 3: TOTAL OTA BOOKINGS */}
        <div
          className="ota-stat-card bookings"
          onClick={() => setActiveModal("bookings")}
          style={{
            background: "#eff6ff",
            borderRadius: "14px",
            padding: "16px 20px",
            border: "1px solid #dbeafe",
            cursor: "pointer",
            transition: "all 0.15s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.boxShadow = "0 6px 16px rgba(37, 99, 235, 0.15)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "none";
          }}
          title="Click to view 30-Day Booking Breakdown by Channel"
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span className="ota-stat-lbl" style={{ fontSize: "12px", color: "#1e40af", fontWeight: "600" }}>
              Total OTA Bookings (30d)
            </span>
            <FaExternalLinkAlt style={{ fontSize: "10px", color: "#1d4ed8" }} />
          </div>
          <div className="ota-stat-val" style={{ fontSize: "24px", fontWeight: "800", color: "#1d4ed8", marginTop: "4px" }}>
            {totalBookings30d} Bookings
          </div>
          <span style={{ fontSize: "11px", color: "#1e40af", marginTop: "4px", display: "inline-block" }}>
            Click to view bookings log ↗
          </span>
        </div>
      </div>

      {/* DRILLDOWN MODAL 1: ACTIVE CONNECTIONS */}
      {activeModal === "connections" && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(15, 23, 42, 0.65)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "16px",
          }}
        >
          <div
            className="ota-modal-card"
            style={{
              borderRadius: "20px",
              width: "100%",
              maxWidth: "560px",
              padding: "24px 28px",
              boxShadow: "0 20px 40px rgba(0,0,0,0.25)",
              animation: "modalFadeIn 0.2s ease-out",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
              <h2 className="ota-modal-title" style={{ margin: 0, fontSize: "20px", fontWeight: "800", display: "flex", alignItems: "center", gap: "8px" }}>
                <FaGlobe style={{ color: "#3b82f6" }} /> Active OTA Connections ({activeConnList.length})
              </h2>
              <button
                type="button"
                className="ota-modal-close-btn"
                onClick={() => setActiveModal(null)}
                style={{ border: "none", borderRadius: "50%", width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
              >
                <FaTimes />
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px", maxHeight: "60vh", overflowY: "auto" }}>
              {activeConnList.map((ch) => (
                <div
                  key={ch.id}
                  className="ota-modal-box"
                  style={{
                    borderRadius: "14px",
                    padding: "14px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div
                      style={{
                        width: "38px",
                        height: "38px",
                        borderRadius: "10px",
                        background: ch.iconBg || "#3b82f6",
                        color: "#fff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "16px",
                        fontWeight: "800",
                      }}
                    >
                      <FaGlobe />
                    </div>
                    <div>
                      <strong style={{ fontSize: "14px", display: "block" }}>{ch.displayName || ch.name}</strong>
                      <span style={{ fontSize: "11px", opacity: 0.75 }}>
                        Property ID: {ch.propertyId} • {ch.syncedRooms} Rooms Synced
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleSyncFromModal(ch.id)}
                    disabled={syncingId === ch.id}
                    style={{
                      padding: "6px 12px",
                      borderRadius: "8px",
                      fontSize: "12px",
                      fontWeight: "700",
                      border: "none",
                      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                      color: "#fff",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    <FaSyncAlt className={syncingId === ch.id ? "spin-icon" : ""} />
                    {syncingId === ch.id ? "Syncing..." : "Sync"}
                  </button>
                </div>
              ))}
            </div>

            <div className="ota-modal-footer" style={{ display: "flex", justifyContent: "flex-end", marginTop: "20px", paddingTop: "14px" }}>
              <button
                type="button"
                className="ota-modal-cancel-btn"
                onClick={() => setActiveModal(null)}
                style={{ padding: "9px 18px", borderRadius: "10px", fontSize: "13px", fontWeight: "600", cursor: "pointer" }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DRILLDOWN MODAL 2: REVENUE BREAKDOWN */}
      {activeModal === "revenue" && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(15, 23, 42, 0.65)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "16px",
          }}
        >
          <div
            className="ota-modal-card"
            style={{
              borderRadius: "20px",
              width: "100%",
              maxWidth: "560px",
              padding: "24px 28px",
              boxShadow: "0 20px 40px rgba(0,0,0,0.25)",
              animation: "modalFadeIn 0.2s ease-out",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
              <div>
                <h2 className="ota-modal-title" style={{ margin: 0, fontSize: "20px", fontWeight: "800", display: "flex", alignItems: "center", gap: "8px" }}>
                  <FaChartBar style={{ color: "#16a34a" }} /> Total OTA Revenue (30d) Breakdown
                </h2>
                <span style={{ fontSize: "12px", opacity: 0.75 }}>
                  Total Generated: <strong style={{ color: "#16a34a" }}>{formatINR(totalRevenue30d)}</strong>
                </span>
              </div>
              <button
                type="button"
                className="ota-modal-close-btn"
                onClick={() => setActiveModal(null)}
                style={{ border: "none", borderRadius: "50%", width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
              >
                <FaTimes />
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "14px", maxHeight: "60vh", overflowY: "auto" }}>
              {connections.map((ch) => {
                const percent = totalRevenue30d > 0 ? ((ch.revenue30Days || 0) / totalRevenue30d) * 100 : 0;
                return (
                  <div key={ch.id} className="ota-modal-box" style={{ borderRadius: "14px", padding: "14px" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                      <strong style={{ fontSize: "14px" }}>{ch.displayName || ch.name}</strong>
                      <strong style={{ fontSize: "14px", color: "#16a34a" }}>{formatINR(ch.revenue30Days || 0)}</strong>
                    </div>
                    {/* PROGRESS BAR */}
                    <div style={{ height: "8px", background: "rgba(0,0,0,0.06)", borderRadius: "999px", overflow: "hidden" }}>
                      <div
                        style={{
                          height: "100%",
                          width: `${percent.toFixed(1)}%`,
                          background: "linear-gradient(90deg, #10b981 0%, #059669 100%)",
                          borderRadius: "999px",
                        }}
                      />
                    </div>
                    <span style={{ fontSize: "11px", opacity: 0.7, marginTop: "4px", display: "block" }}>
                      {percent.toFixed(1)}% of total 30-day revenue
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="ota-modal-footer" style={{ display: "flex", justifyContent: "flex-end", marginTop: "20px", paddingTop: "14px" }}>
              <button
                type="button"
                className="ota-modal-cancel-btn"
                onClick={() => setActiveModal(null)}
                style={{ padding: "9px 18px", borderRadius: "10px", fontSize: "13px", fontWeight: "600", cursor: "pointer" }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DRILLDOWN MODAL 3: BOOKINGS BREAKDOWN */}
      {activeModal === "bookings" && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(15, 23, 42, 0.65)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "16px",
          }}
        >
          <div
            className="ota-modal-card"
            style={{
              borderRadius: "20px",
              width: "100%",
              maxWidth: "560px",
              padding: "24px 28px",
              boxShadow: "0 20px 40px rgba(0,0,0,0.25)",
              animation: "modalFadeIn 0.2s ease-out",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
              <div>
                <h2 className="ota-modal-title" style={{ margin: 0, fontSize: "20px", fontWeight: "800", display: "flex", alignItems: "center", gap: "8px" }}>
                  <FaExchangeAlt style={{ color: "#2563eb" }} /> Total OTA Bookings (30d) Breakdown
                </h2>
                <span style={{ fontSize: "12px", opacity: 0.75 }}>
                  Total Reservations: <strong style={{ color: "#2563eb" }}>{totalBookings30d} Bookings</strong>
                </span>
              </div>
              <button
                type="button"
                className="ota-modal-close-btn"
                onClick={() => setActiveModal(null)}
                style={{ border: "none", borderRadius: "50%", width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
              >
                <FaTimes />
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "14px", maxHeight: "60vh", overflowY: "auto" }}>
              {connections.map((ch) => {
                const count = ch.bookings30Days || 0;
                const percent = totalBookings30d > 0 ? (count / totalBookings30d) * 100 : 0;
                return (
                  <div key={ch.id} className="ota-modal-box" style={{ borderRadius: "14px", padding: "14px" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                      <strong style={{ fontSize: "14px" }}>{ch.displayName || ch.name}</strong>
                      <strong style={{ fontSize: "14px", color: "#2563eb" }}>{count} Bookings</strong>
                    </div>
                    <div style={{ height: "8px", background: "rgba(0,0,0,0.06)", borderRadius: "999px", overflow: "hidden" }}>
                      <div
                        style={{
                          height: "100%",
                          width: `${percent.toFixed(1)}%`,
                          background: "linear-gradient(90deg, #3b82f6 0%, #1d4ed8 100%)",
                          borderRadius: "999px",
                        }}
                      />
                    </div>
                    <span style={{ fontSize: "11px", opacity: 0.7, marginTop: "4px", display: "block" }}>
                      {percent.toFixed(1)}% of total 30-day booking volume
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="ota-modal-footer" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "20px", paddingTop: "14px" }}>
              <button
                type="button"
                style={{
                  padding: "9px 16px",
                  borderRadius: "10px",
                  fontSize: "13px",
                  fontWeight: "700",
                  border: "none",
                  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  color: "#fff",
                  cursor: "pointer",
                }}
                onClick={() => {
                  setActiveModal(null);
                  onSelectTab && onSelectTab("bookings");
                }}
              >
                Go to OTA Bookings Tab →
              </button>
              <button
                type="button"
                className="ota-modal-cancel-btn"
                onClick={() => setActiveModal(null)}
                style={{ padding: "9px 18px", borderRadius: "10px", fontSize: "13px", fontWeight: "600", cursor: "pointer" }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
