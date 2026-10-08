import { useState } from "react";
import { FaPlus, FaCheckCircle, FaTrash } from "react-icons/fa";
import { otaStorage } from "../../services/ota/otaStorage.js";

export default function OTARoomMappingModal({
  roomMappings = [],
  rateMappings = [],
  connections = [],
  rooms = [],
}) {
  const [activeTab, setActiveTab] = useState("rooms"); // rooms | rates
  const [mappingList, setMappingList] = useState(roomMappings);
  const [rateMappingList, setRateMappingList] = useState(rateMappings);

  // New Room Mapping Form State
  const [selectedPmsRoom, setSelectedPmsRoom] = useState("pms_deluxe");
  const [selectedOtaChannel, setSelectedOtaChannel] = useState("booking_com");
  const [otaRoomNameInput, setOtaRoomNameInput] = useState("");

  const handleAddRoomMapping = (e) => {
    e.preventDefault();
    if (!otaRoomNameInput.trim()) return;

    const pmsRoom = rooms.find((r) => r.id === selectedPmsRoom) || { name: "Deluxe Room" };
    const otaChan = connections.find((c) => c.id === selectedOtaChannel) || { name: "Booking.com" };

    const newMap = {
      id: `map-${Date.now()}`,
      pmsRoomId: selectedPmsRoom,
      pmsRoomName: pmsRoom.name,
      otaChannelId: selectedOtaChannel,
      otaChannelName: otaChan.displayName || otaChan.name,
      otaRoomName: otaRoomNameInput.trim(),
      status: "MAPPED",
    };

    const updated = [newMap, ...mappingList];
    setMappingList(updated);
    otaStorage.saveRoomMappings(updated);
    setOtaRoomNameInput("");
  };

  const handleRemoveMapping = (id) => {
    const updated = mappingList.filter((m) => m.id !== id);
    setMappingList(updated);
    otaStorage.saveRoomMappings(updated);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* MAPPING HEADER & TAB SELECTOR */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid #e2e8f0",
          paddingBottom: "12px",
        }}
      >
        <div>
          <h3 className="ota-modal-title" style={{ margin: 0, fontSize: "18px", fontWeight: "800" }}>
            PMS ↔ OTA Room & Rate Plan Mappings
          </h3>
          <span style={{ fontSize: "12px", opacity: 0.7 }}>
            Map PMS internal room categories & rate plans to external OTA channel inventory.
          </span>
        </div>

        <div className="ota-mapping-toggle-group" style={{ display: "flex", gap: "8px", background: "#f1f5f9", padding: "4px", borderRadius: "10px" }}>
          <button
            type="button"
            className={`ota-mapping-tab-btn ${activeTab === "rooms" ? "active" : ""}`}
            onClick={() => setActiveTab("rooms")}
            style={{
              padding: "6px 14px",
              borderRadius: "8px",
              fontSize: "13px",
              fontWeight: "700",
              border: "none",
              background: activeTab === "rooms" ? "#ffffff" : "transparent",
              color: activeTab === "rooms" ? "#0f172a" : "#64748b",
              boxShadow: activeTab === "rooms" ? "0 2px 6px rgba(0,0,0,0.05)" : "none",
              cursor: "pointer",
            }}
          >
            Room Mappings ({mappingList.length})
          </button>
          <button
            type="button"
            className={`ota-mapping-tab-btn ${activeTab === "rates" ? "active" : ""}`}
            onClick={() => setActiveTab("rates")}
            style={{
              padding: "6px 14px",
              borderRadius: "8px",
              fontSize: "13px",
              fontWeight: "700",
              border: "none",
              background: activeTab === "rates" ? "#ffffff" : "transparent",
              color: activeTab === "rates" ? "#0f172a" : "#64748b",
              boxShadow: activeTab === "rates" ? "0 2px 6px rgba(0,0,0,0.05)" : "none",
              cursor: "pointer",
            }}
          >
            Rate Plan Mappings ({rateMappingList.length})
          </button>
        </div>
      </div>

      {activeTab === "rooms" ? (
        <>
          {/* ADD ROOM MAPPING FORM */}
          <form
            onSubmit={handleAddRoomMapping}
            className="ota-mapping-form-box"
            style={{
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: "14px",
              padding: "16px",
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr auto",
              gap: "12px",
              alignItems: "end",
            }}
          >
            <div>
              <label className="ota-modal-label" style={{ display: "block", fontSize: "11px", fontWeight: "700", marginBottom: "4px" }}>
                PMS Room Category
              </label>
              <select
                className="ota-filter-select"
                value={selectedPmsRoom}
                onChange={(e) => setSelectedPmsRoom(e.target.value)}
                style={{
                  width: "100%",
                  padding: "9px 12px",
                  borderRadius: "10px",
                  fontSize: "13px",
                  border: "1px solid #cbd5e1",
                }}
              >
                {rooms.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="ota-modal-label" style={{ display: "block", fontSize: "11px", fontWeight: "700", marginBottom: "4px" }}>
                Target OTA Channel
              </label>
              <select
                className="ota-filter-select"
                value={selectedOtaChannel}
                onChange={(e) => setSelectedOtaChannel(e.target.value)}
                style={{
                  width: "100%",
                  padding: "9px 12px",
                  borderRadius: "10px",
                  fontSize: "13px",
                  border: "1px solid #cbd5e1",
                }}
              >
                {connections.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.displayName || c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="ota-modal-label" style={{ display: "block", fontSize: "11px", fontWeight: "700", marginBottom: "4px" }}>
                OTA Category Name
              </label>
              <input
                type="text"
                className="ota-form-input"
                value={otaRoomNameInput}
                onChange={(e) => setOtaRoomNameInput(e.target.value)}
                placeholder="e.g. Deluxe Double Room"
                style={{
                  width: "100%",
                  padding: "9px 12px",
                  borderRadius: "10px",
                  fontSize: "13px",
                  border: "1px solid #cbd5e1",
                  outline: "none",
                }}
              />
            </div>

            <button
              type="submit"
              style={{
                padding: "9px 16px",
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
                height: "38px",
              }}
            >
              <FaPlus /> Map Room
            </button>
          </form>

          {/* ROOM MAPPINGS TABLE */}
          <div className="ota-table-wrapper" style={{ overflowX: "auto", borderRadius: "14px" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", whiteSpace: "nowrap" }}>
              <thead>
                <tr className="ota-table-header" style={{ textAlign: "left" }}>
                  <th style={{ padding: "12px 14px", whiteSpace: "nowrap" }}>PMS ROOM NAME</th>
                  <th style={{ padding: "12px 14px", whiteSpace: "nowrap" }}>OTA CHANNEL</th>
                  <th style={{ padding: "12px 14px", whiteSpace: "nowrap" }}>OTA MAPPED NAME</th>
                  <th style={{ padding: "12px 14px", whiteSpace: "nowrap" }}>STATUS</th>
                  <th style={{ padding: "12px 14px", textAlign: "center", whiteSpace: "nowrap" }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {mappingList.map((m) => (
                  <tr key={m.id} className="ota-table-row">
                    <td style={{ padding: "12px 14px", fontWeight: "700", whiteSpace: "nowrap" }}>
                      {m.pmsRoomName}
                    </td>
                    <td style={{ padding: "12px 14px", whiteSpace: "nowrap" }}>
                      {m.otaChannelName}
                    </td>
                    <td style={{ padding: "12px 14px", fontWeight: "600", color: "#60a5fa", whiteSpace: "nowrap" }}>
                      {m.otaRoomName}
                    </td>
                    <td style={{ padding: "12px 14px", whiteSpace: "nowrap" }}>
                      <span
                        style={{
                          background: "#dcfce7",
                          color: "#16a34a",
                          padding: "3px 10px",
                          borderRadius: "999px",
                          fontSize: "11px",
                          fontWeight: "700",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                        }}
                      >
                        <FaCheckCircle style={{ fontSize: "10px" }} /> Mapped
                      </span>
                    </td>
                    <td style={{ padding: "12px 14px", textAlign: "center", whiteSpace: "nowrap" }}>
                      <button
                        type="button"
                        onClick={() => handleRemoveMapping(m.id)}
                        style={{
                          background: "transparent",
                          border: "none",
                          color: "#ef4444",
                          cursor: "pointer",
                          fontSize: "14px",
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          padding: "4px",
                        }}
                        title="Remove Mapping"
                      >
                        <FaTrash />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        /* RATE PLAN MAPPINGS LIST */
        <div className="ota-table-wrapper" style={{ overflowX: "auto", borderRadius: "14px" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", whiteSpace: "nowrap" }}>
            <thead>
              <tr className="ota-table-header" style={{ textAlign: "left" }}>
                <th style={{ padding: "12px 14px", whiteSpace: "nowrap" }}>PMS RATE PLAN</th>
                <th style={{ padding: "12px 14px", whiteSpace: "nowrap" }}>OTA CHANNEL</th>
                <th style={{ padding: "12px 14px", whiteSpace: "nowrap" }}>OTA RATE PLAN NAME</th>
                <th style={{ padding: "12px 14px", whiteSpace: "nowrap" }}>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {rateMappingList.map((rm) => (
                <tr key={rm.id} className="ota-table-row">
                  <td style={{ padding: "12px 14px", fontWeight: "700", whiteSpace: "nowrap" }}>
                    {rm.pmsRatePlanName}
                  </td>
                  <td style={{ padding: "12px 14px", whiteSpace: "nowrap" }}>
                    {rm.otaChannelId}
                  </td>
                  <td style={{ padding: "12px 14px", fontWeight: "600", color: "#c084fc", whiteSpace: "nowrap" }}>
                    {rm.otaRatePlanName}
                  </td>
                  <td style={{ padding: "12px 14px", whiteSpace: "nowrap" }}>
                    <span
                      style={{
                        background: "#dcfce7",
                        color: "#16a34a",
                        padding: "3px 10px",
                        borderRadius: "999px",
                        fontSize: "11px",
                        fontWeight: "700",
                      }}
                    >
                      ✓ Mapped
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
