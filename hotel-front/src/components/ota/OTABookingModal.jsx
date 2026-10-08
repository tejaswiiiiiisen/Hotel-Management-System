import { useState } from "react";
import { FaTimes, FaExclamationCircle } from "react-icons/fa";
import { otaService } from "../../services/ota/otaService.js";

export default function OTABookingModal({ isOpen, connections = [], rooms = [], onClose, onSuccess }) {
  const [selectedChannel, setSelectedChannel] = useState(
    connections.find((c) => c.status === "CONNECTED")?.id || connections[0]?.id || "booking"
  );
  const [selectedRoomType, setSelectedRoomType] = useState(rooms[0]?.name || "Deluxe Room");
  const [guestName, setGuestName] = useState("Vikram Sharma");
  const [guestsCount, setGuestsCount] = useState(2);
  const [nights, setNights] = useState(2);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  if (!isOpen) return null;

  const connectedList = connections.length > 0 ? connections.filter((c) => c.status === "CONNECTED" || c.status === "SYNCING") : [];
  const targetRoom = rooms.find((r) => r.name === selectedRoomType || r.type === selectedRoomType);
  const isSoldOut = targetRoom && typeof targetRoom.availableInventory === 'number' ? targetRoom.availableInventory <= 0 : false;

  const handleSimulate = async (e) => {
    e.preventDefault();
    if (!guestName.trim()) {
      setErrorMsg("Guest name is required.");
      return;
    }
    if (isSoldOut) {
      setErrorMsg("Booking rejected: Room is Sold Out / Unavailable.");
      return;
    }

    setLoading(true);
    setErrorMsg("");
    try {
      await otaService.simulateNewBooking({
        otaChannel: selectedChannel,
        roomType: selectedRoomType,
        guestName,
        guests: Number(guestsCount),
        nights: Number(nights),
      });

      setLoading(false);
      onSuccess && onSuccess();
      onClose();
    } catch (err) {
      setLoading(false);
      setErrorMsg(err.message || "Failed to create simulated booking.");
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
          animation: "modalFadeIn 0.2s ease-out",
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
          <h2 className="ota-modal-title" style={{ margin: 0, fontSize: "20px", fontWeight: "800" }}>
            Simulate New OTA Reservation
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
            <FaExclamationCircle /> {errorMsg}
          </div>
        )}

        <form onSubmit={handleSimulate}>
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div>
              <label className="ota-modal-label" style={{ display: "block", fontSize: "13px", fontWeight: "700", marginBottom: "6px" }}>
                OTA Channel Source
              </label>
              <select
                value={selectedChannel}
                onChange={(e) => setSelectedChannel(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: "10px",
                  fontSize: "14px",
                }}
              >
                {connectedList.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.displayName || c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="ota-modal-label" style={{ display: "block", fontSize: "13px", fontWeight: "700", marginBottom: "6px" }}>
                Target Room Type
              </label>
              <select
                value={selectedRoomType}
                onChange={(e) => setSelectedRoomType(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: "10px",
                  fontSize: "14px",
                }}
              >
                {rooms.map((r) => (
                  <option key={r.id} value={r.name}>
                    {r.name} ({r.availableInventory} available)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="ota-modal-label" style={{ display: "block", fontSize: "13px", fontWeight: "700", marginBottom: "6px" }}>
                Guest Name
              </label>
              <input
                type="text"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                placeholder="e.g. Vikram Sharma"
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: "10px",
                  fontSize: "14px",
                }}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div>
                <label className="ota-modal-label" style={{ display: "block", fontSize: "13px", fontWeight: "700", marginBottom: "6px" }}>
                  Guests
                </label>
                <input
                  type="number"
                  value={guestsCount}
                  min={1}
                  max={6}
                  onChange={(e) => setGuestsCount(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: "10px",
                    fontSize: "14px",
                  }}
                />
              </div>

              <div>
                <label className="ota-modal-label" style={{ display: "block", fontSize: "13px", fontWeight: "700", marginBottom: "6px" }}>
                  Nights
                </label>
                <input
                  type="number"
                  value={nights}
                  min={1}
                  max={14}
                  onChange={(e) => setNights(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: "10px",
                    fontSize: "14px",
                  }}
                />
              </div>
            </div>
          </div>

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
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading || isSoldOut}
              style={{
                padding: "9px 20px",
                borderRadius: "10px",
                fontSize: "13px",
                fontWeight: "700",
                border: "none",
                background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                color: "#ffffff",
                cursor: isSoldOut ? "not-allowed" : "pointer",
                boxShadow: "0 4px 12px rgba(16, 185, 129, 0.35)",
              }}
            >
              {loading ? "Creating..." : isSoldOut ? "Sold Out" : "Confirm Booking"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
