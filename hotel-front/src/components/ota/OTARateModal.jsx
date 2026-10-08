import { useState, useEffect } from "react";
import { FaTimes, FaSave, FaSyncAlt, FaExclamationCircle, FaBed } from "react-icons/fa";
import { otaService } from "../../services/ota/otaService.js";

export default function OTARateModal({ isOpen, channel, rooms = [], onClose, onSuccess }) {
  const [roomStates, setRoomStates] = useState([]);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (channel && rooms.length > 0) {
      const initial = rooms.map((room) => ({
        id: room.id,
        name: room.name,
        type: room.type,
        rate: room.otaRates?.[channel.id] || room.baseRate || 4200,
        availableInventory: room.availableInventory ?? 8,
        totalInventory: room.totalInventory ?? 20,
        minStay: room.minStay || 1,
        maxStay: room.maxStay || 30,
        stopSell: Boolean(room.stopSell),
      }));
      setRoomStates(initial);
      setErrorMsg("");
    }
  }, [channel, rooms]);

  if (!isOpen || !channel) return null;

  const handleChange = (id, field, value) => {
    setRoomStates((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: value } : r))
    );
  };

  const validate = () => {
    for (const r of roomStates) {
      if (Number(r.rate) < 0) return `${r.name}: Rate cannot be negative.`;
      if (Number(r.availableInventory) < 0) return `${r.name}: Availability cannot be negative.`;
      if (Number(r.minStay) < 1) return `${r.name}: Minimum stay must be at least 1 night.`;
      if (Number(r.maxStay) < Number(r.minStay))
        return `${r.name}: Maximum stay cannot be lower than minimum stay.`;
    }
    return null;
  };

  const handleSave = async (triggerSync = false) => {
    const err = validate();
    if (err) {
      setErrorMsg(err);
      return;
    }

    setSaving(true);
    setErrorMsg("");
    try {
      await otaService.updateRoomRates(channel.id, roomStates, triggerSync);
      setSaving(false);
      onSuccess && onSuccess();
      onClose();
    } catch (e) {
      setSaving(false);
      setErrorMsg(e.message || "Failed to save room rate updates.");
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
          maxWidth: "720px",
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          padding: "24px 28px",
          boxShadow: "0 20px 40px rgba(0,0,0,0.25)",
        }}
      >
        {/* HEADER */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "16px",
            paddingBottom: "12px",
          }}
        >
          <div>
            <h2 className="ota-modal-title" style={{ margin: 0, fontSize: "20px", fontWeight: "800" }}>
              Edit Rates & Inventory — {channel.displayName || channel.name}
            </h2>
            <span style={{ fontSize: "12px", opacity: 0.7 }}>
              Update room pricing, available inventory, minimum stay rules and stop-sell flags.
            </span>
          </div>
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

        {/* ERROR NOTICE */}
        {errorMsg && (
          <div
            style={{
              background: "#fef2f2",
              color: "#dc2626",
              padding: "10px 14px",
              borderRadius: "10px",
              fontSize: "12px",
              marginBottom: "16px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <FaExclamationCircle style={{ fontSize: "14px" }} /> {errorMsg}
          </div>
        )}

        {/* ROOM LIST FORM */}
        <div
          style={{
            overflowY: "auto",
            flex: 1,
            display: "flex",
            flexDirection: "column",
            gap: "14px",
            paddingRight: "6px",
          }}
        >
          {roomStates.map((room) => (
            <div
              key={room.id}
              className="ota-modal-box"
              style={{
                borderRadius: "14px",
                padding: "16px",
                display: "flex",
                flexDirection: "column",
                gap: "12px",
              }}
            >
              {/* TOP ROW: ROOM NAME & STOP SELL TOGGLE */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <FaBed style={{ color: "#3b82f6" }} />
                  <strong style={{ fontSize: "15px" }}>{room.name}</strong>
                  <span style={{ fontSize: "11px", opacity: 0.75, padding: "2px 8px", borderRadius: "999px" }}>
                    Total Capacity: {room.totalInventory}
                  </span>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "12px", fontWeight: "600", color: room.stopSell ? "#dc2626" : "inherit" }}>
                    Stop Sell
                  </span>
                  <input
                    type="checkbox"
                    checked={room.stopSell}
                    onChange={(e) => handleChange(room.id, "stopSell", e.target.checked)}
                    style={{ width: "16px", height: "16px", cursor: "pointer" }}
                  />
                </div>
              </div>

              {/* INPUT FIELDS GRID */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
                  gap: "12px",
                }}
              >
                <div>
                  <label className="ota-modal-label" style={{ display: "block", fontSize: "11px", fontWeight: "700", marginBottom: "4px" }}>
                    OTA Rate (₹/night)
                  </label>
                  <input
                    type="number"
                    value={room.rate}
                    onChange={(e) => handleChange(room.id, "rate", e.target.value)}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      borderRadius: "8px",
                      fontSize: "14px",
                      fontWeight: "700",
                    }}
                  />
                </div>

                <div>
                  <label className="ota-modal-label" style={{ display: "block", fontSize: "11px", fontWeight: "700", marginBottom: "4px" }}>
                    Available Rooms
                  </label>
                  <input
                    type="number"
                    value={room.availableInventory}
                    onChange={(e) => handleChange(room.id, "availableInventory", e.target.value)}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      borderRadius: "8px",
                      fontSize: "14px",
                      fontWeight: "700",
                    }}
                  />
                </div>

                <div>
                  <label className="ota-modal-label" style={{ display: "block", fontSize: "11px", fontWeight: "700", marginBottom: "4px" }}>
                    Min Stay (nights)
                  </label>
                  <input
                    type="number"
                    value={room.minStay}
                    onChange={(e) => handleChange(room.id, "minStay", e.target.value)}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      borderRadius: "8px",
                      fontSize: "14px",
                    }}
                  />
                </div>

                <div>
                  <label className="ota-modal-label" style={{ display: "block", fontSize: "11px", fontWeight: "700", marginBottom: "4px" }}>
                    Max Stay (nights)
                  </label>
                  <input
                    type="number"
                    value={room.maxStay}
                    onChange={(e) => handleChange(room.id, "maxStay", e.target.value)}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      borderRadius: "8px",
                      fontSize: "14px",
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* FOOTER ACTIONS */}
        <div
          className="ota-modal-footer"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            gap: "12px",
            marginTop: "20px",
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
            Cancel
          </button>

          <button
            type="button"
            className="ota-modal-sec-btn"
            onClick={() => handleSave(false)}
            disabled={saving}
            style={{
              padding: "9px 16px",
              borderRadius: "10px",
              fontSize: "13px",
              fontWeight: "600",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <FaSave /> {saving ? "Saving..." : "Save Changes"}
          </button>

          <button
            type="button"
            onClick={() => handleSave(true)}
            disabled={saving}
            style={{
              padding: "9px 20px",
              borderRadius: "10px",
              fontSize: "13px",
              fontWeight: "700",
              border: "none",
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              color: "#ffffff",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              boxShadow: "0 4px 12px rgba(102, 126, 234, 0.35)",
            }}
          >
            <FaSyncAlt /> {saving ? "Syncing..." : "Save & Sync"}
          </button>
        </div>
      </div>
    </div>
  );
}
