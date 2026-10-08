import { useState } from "react";
import { FaTimes, FaUndo, FaCheckCircle, FaExclamationTriangle, FaCog } from "react-icons/fa";
import { otaStorage } from "../../services/ota/otaStorage.js";
import { otaService } from "../../services/ota/otaService.js";

export default function OTASettingsModal({ isOpen, onClose, onResetDone }) {
  const [settings, setSettings] = useState(() => otaStorage.getSettings());
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSaveSettings = () => {
    otaStorage.saveSettings(settings);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const handleResetData = () => {
    if (
      window.confirm(
        "Are you sure you want to reset all OTA demo data to default state? This will restore the original six channels, bookings, room rates, and sync logs."
      )
    ) {
      otaService.resetDemoData();
      onResetDone && onResetDone();
      onClose();
    }
  };

  return (
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
          maxWidth: "480px",
          padding: "24px 28px",
          boxShadow: "0 20px 40px rgba(0,0,0,0.25)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "16px",
          }}
        >
          <h2
            className="ota-modal-title"
            style={{
              margin: 0,
              fontSize: "20px",
              fontWeight: "800",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <FaCog style={{ color: "#3b82f6" }} /> OTA Channel Settings
          </h2>
          <button
            type="button"
            className="ota-modal-close-btn"
            onClick={onClose}
            style={{
              border: "none",
              borderRadius: "50%",
              width: "32px",
              height: "32px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
          >
            <FaTimes />
          </button>
        </div>

        {savedSuccess && (
          <div
            style={{
              background: "#dcfce7",
              color: "#16a34a",
              padding: "10px 14px",
              borderRadius: "10px",
              fontSize: "12px",
              marginBottom: "16px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <FaCheckCircle /> Settings saved successfully.
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* AUTO SYNC TOGGLE */}
          <div
            className="ota-modal-box"
            style={{
              borderRadius: "12px",
              padding: "14px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div>
              <strong style={{ fontSize: "14px", display: "block" }}>
                Global Auto Sync
              </strong>
              <span style={{ fontSize: "12px", opacity: 0.75 }}>
                Periodically sync rate & inventory in background
              </span>
            </div>
            <input
              type="checkbox"
              checked={settings.autoSync}
              onChange={(e) => setSettings({ ...settings, autoSync: e.target.checked })}
              style={{ width: "18px", height: "18px", cursor: "pointer" }}
            />
          </div>

          {/* SYNC INTERVAL */}
          <div>
            <label className="ota-modal-label" style={{ display: "block", fontSize: "13px", fontWeight: "700", marginBottom: "6px" }}>
              Sync Frequency Interval
            </label>
            <select
              className="ota-filter-select"
              value={settings.globalInterval}
              onChange={(e) => setSettings({ ...settings, globalInterval: Number(e.target.value) })}
              style={{
                width: "100%",
                padding: "10px 14px",
                borderRadius: "10px",
                fontSize: "14px",
              }}
            >
              <option value={5}>Every 5 minutes</option>
              <option value={15}>Every 15 minutes</option>
              <option value={30}>Every 30 minutes</option>
              <option value={60}>Every 1 hour</option>
            </select>
          </div>

          {/* RESET DEMO DATA BOX */}
          <div
            className="ota-danger-box"
            style={{
              borderRadius: "14px",
              padding: "16px",
              marginTop: "12px",
            }}
          >
            <strong className="ota-danger-title" style={{ fontSize: "14px", display: "flex", alignItems: "center", gap: "6px" }}>
              <FaExclamationTriangle style={{ color: "#dc2626" }} /> Reset Demo Data
            </strong>
            <p className="ota-danger-desc" style={{ margin: "6px 0 12px", fontSize: "12px" }}>
              Restore original 6 channels, default room rates, clean initial bookings, and sync audit log.
            </p>
            <button
              type="button"
              onClick={handleResetData}
              style={{
                padding: "8px 14px",
                borderRadius: "8px",
                fontSize: "12px",
                fontWeight: "700",
                border: "none",
                background: "#dc2626",
                color: "#ffffff",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <FaUndo /> Reset OTA Demo Data
            </button>
          </div>
        </div>

        {/* FOOTER ACTIONS */}
        <div
          className="ota-modal-footer"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            gap: "12px",
            marginTop: "24px",
            paddingTop: "16px",
          }}
        >
          <button
            type="button"
            className="ota-modal-cancel-btn"
            onClick={onClose}
            style={{
              padding: "9px 16px",
              borderRadius: "10px",
              fontSize: "13px",
              fontWeight: "600",
              cursor: "pointer",
            }}
          >
            Close
          </button>
          <button
            type="button"
            onClick={handleSaveSettings}
            style={{
              padding: "9px 20px",
              borderRadius: "10px",
              fontSize: "13px",
              fontWeight: "700",
              border: "none",
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              color: "#ffffff",
              cursor: "pointer",
              boxShadow: "0 4px 12px rgba(102, 126, 234, 0.35)",
            }}
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}
