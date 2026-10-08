import { showSuccess, showError, showWarning, showInfo } from "../../utils/toast.js";
import { useState } from "react";
import { FaSearch, FaPlus, FaCalendarAlt } from "react-icons/fa";
import { formatINR } from "../../utils/otaTime.js";
import { otaService } from "../../services/ota/otaService.js";

export default function OTABookingsList({ bookings = [], connections = [], onOpenNewBookingModal, onRefresh }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedChannelFilter, setSelectedChannelFilter] = useState("ALL");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState("ALL");
  const [cancellingId, setCancellingId] = useState(null);

  const handleCancelBooking = async (id) => {
    if (!window.confirm("Are you sure you want to cancel this OTA reservation? Room availability will be restored.")) {
      return;
    }
    setCancellingId(id);
    try {
      await otaService.cancelBooking(id);
      setCancellingId(null);
      onRefresh && onRefresh();
    } catch (e) {
      setCancellingId(null);
      showError(e.message || "Failed to cancel booking.");
    }
  };

  const filteredBookings = bookings.filter((b) => {
    const matchesSearch =
      b.guestName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.bookingId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.roomType.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesChannel =
      selectedChannelFilter === "ALL" || b.otaChannel === selectedChannelFilter;
    const matchesStatus =
      selectedStatusFilter === "ALL" || b.status === selectedStatusFilter;

    return matchesSearch && matchesChannel && matchesStatus;
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* TOOLBAR: SEARCH, FILTERS & SIMULATE BOOKING BUTTON */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
          {/* SEARCH BOX MATCHING PAYROLL / EMPLOYEES SEARCH BOX UI */}
          <div
            className="ota-search-box"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              padding: "8px 14px",
              borderRadius: "12px",
              width: "280px",
            }}
          >
            <FaSearch style={{ color: "#94a3b8", fontSize: "13px" }} />
            <input
              type="text"
              className="ota-search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search guest or Booking ID..."
              style={{
                border: "none",
                background: "transparent",
                outline: "none",
                fontSize: "13px",
                width: "100%",
              }}
            />
          </div>

          {/* OTA FILTER */}
          <select
            className="ota-filter-select"
            value={selectedChannelFilter}
            onChange={(e) => setSelectedChannelFilter(e.target.value)}
            style={{
              padding: "8px 14px",
              borderRadius: "12px",
              border: "1px solid #e2e8f0",
              fontSize: "13px",
            }}
          >
            <option value="ALL">All OTA Channels</option>
            {connections.map((c) => (
              <option key={c.id} value={c.id}>
                {c.displayName || c.name}
              </option>
            ))}
          </select>

          {/* STATUS FILTER */}
          <select
            className="ota-filter-select"
            value={selectedStatusFilter}
            onChange={(e) => setSelectedStatusFilter(e.target.value)}
            style={{
              padding: "8px 14px",
              borderRadius: "12px",
              border: "1px solid #e2e8f0",
              fontSize: "13px",
            }}
          >
            <option value="ALL">All Statuses</option>
            <option value="CONFIRMED">CONFIRMED</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>
        </div>

        {/* SIMULATE NEW BOOKING BUTTON */}
        <button
          type="button"
          onClick={onOpenNewBookingModal}
          style={{
            padding: "9px 18px",
            borderRadius: "10px",
            fontSize: "13px",
            fontWeight: "700",
            border: "none",
            background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
            color: "#ffffff",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            boxShadow: "0 4px 12px rgba(16, 185, 129, 0.35)",
          }}
        >
          <FaPlus /> Simulate New Booking
        </button>
      </div>

      {/* BOOKINGS TABLE WITH SINGLE LINE ROWS (whiteSpace: nowrap) */}
      <div className="ota-table-wrapper" style={{ overflowX: "auto", borderRadius: "14px" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", whiteSpace: "nowrap" }}>
          <thead>
            <tr className="ota-table-header" style={{ textAlign: "left" }}>
              <th style={{ padding: "12px 16px", whiteSpace: "nowrap" }}>BOOKING ID</th>
              <th style={{ padding: "12px 16px", whiteSpace: "nowrap" }}>OTA CHANNEL</th>
              <th style={{ padding: "12px 16px", whiteSpace: "nowrap" }}>GUEST NAME</th>
              <th style={{ padding: "12px 16px", whiteSpace: "nowrap" }}>ROOM TYPE</th>
              <th style={{ padding: "12px 16px", whiteSpace: "nowrap" }}>CHECK-IN / OUT</th>
              <th style={{ padding: "12px 16px", whiteSpace: "nowrap" }}>AMOUNT</th>
              <th style={{ padding: "12px 16px", whiteSpace: "nowrap" }}>STATUS</th>
              <th style={{ padding: "12px 16px", textAlign: "right", whiteSpace: "nowrap" }}>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {filteredBookings.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: "center", padding: "32px", color: "#94a3b8" }}>
                  No simulated OTA bookings found matching criteria.
                </td>
              </tr>
            ) : (
              filteredBookings.map((b) => (
                <tr key={b.id} className="ota-table-row">
                  <td style={{ padding: "12px 16px", fontWeight: "700", color: "#60a5fa", whiteSpace: "nowrap" }}>
                    {b.bookingId}
                  </td>
                  <td style={{ padding: "12px 16px", fontWeight: "600", whiteSpace: "nowrap" }}>
                    {b.otaChannelName}
                  </td>
                  <td style={{ padding: "12px 16px", fontWeight: "600", whiteSpace: "nowrap" }}>
                    {b.guestName}
                  </td>
                  <td style={{ padding: "12px 16px", whiteSpace: "nowrap" }}>
                    {b.roomType}
                  </td>
                  <td style={{ padding: "12px 16px", fontSize: "12px", whiteSpace: "nowrap" }}>
                    <FaCalendarAlt style={{ marginRight: "4px", fontSize: "10px", opacity: 0.7 }} />
                    {b.checkIn} → {b.checkOut}
                  </td>
                  <td style={{ padding: "12px 16px", fontWeight: "800", color: "#34d399", whiteSpace: "nowrap" }}>
                    {formatINR(b.amount)}
                  </td>
                  <td style={{ padding: "12px 16px", whiteSpace: "nowrap" }}>
                    <span
                      style={{
                        padding: "3px 10px",
                        borderRadius: "999px",
                        fontSize: "11px",
                        fontWeight: "700",
                        background: b.status === "CONFIRMED" ? "#dcfce7" : "#fee2e2",
                        color: b.status === "CONFIRMED" ? "#16a34a" : "#dc2626",
                      }}
                    >
                      {b.status}
                    </span>
                  </td>
                  <td style={{ padding: "12px 16px", textAlign: "right", whiteSpace: "nowrap" }}>
                    {b.status === "CONFIRMED" ? (
                      <button
                        type="button"
                        className="ota-cancel-btn"
                        onClick={() => handleCancelBooking(b.id)}
                        disabled={cancellingId === b.id}
                        style={{
                          padding: "5px 10px",
                          borderRadius: "6px",
                          fontSize: "11px",
                          fontWeight: "700",
                          cursor: "pointer",
                        }}
                      >
                        {cancellingId === b.id ? "Cancelling..." : "Cancel"}
                      </button>
                    ) : (
                      <span style={{ fontSize: "11px", opacity: 0.6 }}>Cancelled</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
