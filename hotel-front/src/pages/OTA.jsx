import { showSuccess, showError, showWarning, showInfo } from "../utils/toast.js";
import { useState } from "react";
import PageHeader from "../components/PageHeader.jsx";
import {
  FaPlus,
  FaExchangeAlt,
  FaListUl,
  FaCog,
  FaHistory,
} from "react-icons/fa";

import { useOTAChannels } from "../hooks/useOTAChannels.js";
import { useOTASync } from "../hooks/useOTASync.js";
import { otaService } from "../services/ota/otaService.js";

import OTADashboardStats from "../components/ota/OTADashboardStats.jsx";
import OTAChannelCard from "../components/ota/OTAChannelCard.jsx";
import OTAConnectionModal from "../components/ota/OTAConnectionModal.jsx";
import OTARateModal from "../components/ota/OTARateModal.jsx";
import OTABookingModal from "../components/ota/OTABookingModal.jsx";
import OTARoomMappingModal from "../components/ota/OTARoomMappingModal.jsx";
import OTABookingsList from "../components/ota/OTABookingsList.jsx";
import OTASyncHistory from "../components/ota/OTASyncHistory.jsx";
import OTASettingsModal from "../components/ota/OTASettingsModal.jsx";
import OTACompetitorWatch from "../components/ota/OTACompetitorWatch.jsx";

export default function OTA() {
  const {
    connections,
    rooms,
    bookings,
    roomMappings,
    rateMappings,
    syncHistory,
    stats,
    refreshData,
  } = useOTAChannels();

  // Enable periodic background auto-sync simulation
  useOTASync(true, 45);

  const [activeTab, setActiveTab] = useState("channels"); // channels | bookings | mapping | history
  const [syncingMap, setSyncingMap] = useState({});

  // Modals state
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [selectedRateChannel, setSelectedRateChannel] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // Sync Now handler
  const handleSyncNow = async (channelId) => {
    setSyncingMap((prev) => ({ ...prev, [channelId]: true }));
    try {
      await otaService.syncChannel(channelId, false);
    } catch (err) {
      console.warn("Sync failed for channel:", channelId, err);
    } finally {
      setSyncingMap((prev) => ({ ...prev, [channelId]: false }));
    }
  };

  // Toggle active status
  const handleToggleActive = (channelId) => {
    const channel = connections.find((c) => c.id === channelId);
    if (!channel) return;
    if (channel.status === "DISCONNECTED") {
      otaService.connectChannel({ channelId, displayName: channel.displayName || channel.name });
    } else {
      otaService.disconnectChannel(channelId);
    }
  };

  // Disconnect handler
  const handleDisconnect = async (channel) => {
    if (
      window.confirm(
        `Are you sure you want to disconnect ${channel.displayName || channel.name}? Historical bookings will be preserved.`
      )
    ) {
      try {
        await otaService.disconnectChannel(channel.id);
      } catch (e) {
        showError(e.message || "Failed to disconnect channel.");
      }
    }
  };

  return (
    <>
      <PageHeader
        title="OTA Channel Manager"
        subtitle="Keep room inventory & rates automatically 2-way synced across major online travel agencies"
        action={
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <button
              type="button"
              className="ota-btn-secondary"
              onClick={() => setShowSettingsModal(true)}
              style={{
                padding: "10px 14px",
                borderRadius: "12px",
                fontSize: "14px",
                fontWeight: "600",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
              title="OTA Settings & Reset"
            >
              <FaCog /> Settings
            </button>

            <button
              type="button"
              onClick={() => setShowConnectModal(true)}
              style={{
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                color: "#ffffff",
                padding: "10px 20px",
                borderRadius: "12px",
                fontSize: "14px",
                fontWeight: "700",
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                boxShadow: "0 4px 14px rgba(102, 126, 234, 0.35)",
                transition: "transform 0.15s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-1px)")}
              onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
            >
              <FaPlus /> Connect New Channel
            </button>
          </div>
        }
      />

      {/* SINGLE BACKGROUND CONTAINER PANEL CARD */}
      <section className="panel" style={{ padding: "28px", borderRadius: "20px" }}>
        {/* SUB-NAVIGATION TABS BAR */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            marginBottom: "24px",
            borderBottom: "1px solid #f1f5f9",
            paddingBottom: "12px",
            overflowX: "auto",
            flexWrap: "nowrap",
          }}
        >
          <button
            type="button"
            className={`ota-tab-btn ${activeTab === "channels" ? "active" : ""}`}
            onClick={() => setActiveTab("channels")}
            style={{
              padding: "9px 18px",
              borderRadius: "10px",
              fontSize: "13px",
              fontWeight: "700",
              border: "none",
              background: activeTab === "channels" ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" : "#f1f5f9",
              color: activeTab === "channels" ? "#ffffff" : "#64748b",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              whiteSpace: "nowrap",
              flexShrink: 0,
              boxShadow: activeTab === "channels" ? "0 4px 12px rgba(102, 126, 234, 0.3)" : "none",
            }}
          >
            OTA Channels ({connections.length})
          </button>

          <button
            type="button"
            className={`ota-tab-btn ${activeTab === "bookings" ? "active" : ""}`}
            onClick={() => setActiveTab("bookings")}
            style={{
              padding: "9px 18px",
              borderRadius: "10px",
              fontSize: "13px",
              fontWeight: "700",
              border: "none",
              background: activeTab === "bookings" ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" : "#f1f5f9",
              color: activeTab === "bookings" ? "#ffffff" : "#64748b",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              whiteSpace: "nowrap",
              flexShrink: 0,
              boxShadow: activeTab === "bookings" ? "0 4px 12px rgba(102, 126, 234, 0.3)" : "none",
            }}
          >
            <FaListUl /> OTA Bookings ({bookings.length})
          </button>

          <button
            type="button"
            className={`ota-tab-btn ${activeTab === "mapping" ? "active" : ""}`}
            onClick={() => setActiveTab("mapping")}
            style={{
              padding: "9px 18px",
              borderRadius: "10px",
              fontSize: "13px",
              fontWeight: "700",
              border: "none",
              background: activeTab === "mapping" ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" : "#f1f5f9",
              color: activeTab === "mapping" ? "#ffffff" : "#64748b",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              whiteSpace: "nowrap",
              flexShrink: 0,
              boxShadow: activeTab === "mapping" ? "0 4px 12px rgba(102, 126, 234, 0.3)" : "none",
            }}
          >
            <FaExchangeAlt /> Room & Rate Mapping
          </button>

          <button
            type="button"
            className={`ota-tab-btn ${activeTab === "history" ? "active" : ""}`}
            onClick={() => setActiveTab("history")}
            style={{
              padding: "9px 18px",
              borderRadius: "10px",
              fontSize: "13px",
              fontWeight: "700",
              border: "none",
              background: activeTab === "history" ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" : "#f1f5f9",
              color: activeTab === "history" ? "#ffffff" : "#64748b",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              whiteSpace: "nowrap",
              flexShrink: 0,
              boxShadow: activeTab === "history" ? "0 4px 12px rgba(102, 126, 234, 0.3)" : "none",
            }}
          >
            <FaHistory /> Sync Audit History ({syncHistory.length})
          </button>

          <button
            type="button"
            className={`ota-tab-btn ${activeTab === "competitors" ? "active" : ""}`}
            onClick={() => setActiveTab("competitors")}
            style={{
              padding: "9px 18px",
              borderRadius: "10px",
              fontSize: "13px",
              fontWeight: "700",
              border: "none",
              background: activeTab === "competitors" ? "linear-gradient(135deg, #10b981 0%, #059669 100%)" : "#f1f5f9",
              color: activeTab === "competitors" ? "#ffffff" : "#64748b",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              whiteSpace: "nowrap",
              flexShrink: 0,
              boxShadow: activeTab === "competitors" ? "0 4px 12px rgba(16, 185, 129, 0.3)" : "none",
            }}
          >
            🛡️ Competitor Watch
          </button>
        </div>

        {/* TAB 1: CHANNELS VIEW */}
        {activeTab === "channels" && (
          <>
            {/* OVERVIEW STATS BOXES */}
            <OTADashboardStats stats={stats} onSelectTab={setActiveTab} />


            {/* OTA CHANNEL CARDS GRID */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
                gap: "20px",
              }}
            >
              {connections.map((channel) => (
                <OTAChannelCard
                  key={channel.id}
                  channel={channel}
                  onSync={handleSyncNow}
                  onEditRates={(c) => setSelectedRateChannel(c)}
                  onToggleActive={handleToggleActive}
                  onDisconnect={handleDisconnect}
                  isSyncing={Boolean(syncingMap[channel.id])}
                />
              ))}
            </div>
          </>
        )}

        {/* TAB 2: BOOKINGS LIST */}
        {activeTab === "bookings" && (
          <OTABookingsList
            bookings={bookings}
            connections={connections}
            onOpenNewBookingModal={() => setShowBookingModal(true)}
            onRefresh={refreshData}
          />
        )}

        {/* TAB 3: ROOM & RATE MAPPING */}
        {activeTab === "mapping" && (
          <OTARoomMappingModal
            roomMappings={roomMappings}
            rateMappings={rateMappings}
            connections={connections}
            rooms={rooms}
          />
        )}

        {/* TAB 4: SYNC AUDIT HISTORY */}
        {activeTab === "history" && (
          <OTASyncHistory
            syncHistory={syncHistory}
            connections={connections}
            onRefresh={refreshData}
          />
        )}

        {/* TAB 5: COMPETITOR RATE WATCH (SERP API) */}
        {activeTab === "competitors" && (
          <OTACompetitorWatch />
        )}
      </section>

      {/* CONNECT NEW CHANNEL MODAL */}
      <OTAConnectionModal
        isOpen={showConnectModal}
        onClose={() => setShowConnectModal(false)}
        onSuccess={refreshData}
      />

      {/* EDIT RATES MODAL */}
      <OTARateModal
        isOpen={Boolean(selectedRateChannel)}
        channel={selectedRateChannel}
        rooms={rooms}
        onClose={() => setSelectedRateChannel(null)}
        onSuccess={refreshData}
      />

      {/* SIMULATE NEW BOOKING MODAL */}
      <OTABookingModal
        isOpen={showBookingModal}
        connections={connections}
        rooms={rooms}
        onClose={() => setShowBookingModal(false)}
        onSuccess={refreshData}
      />

      {/* OTA SETTINGS MODAL */}
      <OTASettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        onResetDone={refreshData}
      />
    </>
  );
}
