import { useState, useEffect } from "react";
import PageHeader from "../components/PageHeader.jsx";
import RowActions from "../components/RowActions.jsx";
import { getUserRole } from "../auth.js";
import "./Inventory.css";
import {
  getMaintenanceTickets,
  fetchMaintenanceTickets,
  addMaintenanceTicket,
  updateMaintenanceTicket,
  updateMaintenanceTicketStatus,
  deleteMaintenanceTicket,
  subscribeInventory,
} from "../services/inventoryStore.js";
import { fetchRoomsFromApi, getRooms } from "../utils/roomStore.js";
import {
  FaWrench,
  FaBed,
  FaUserTie,
  FaExclamationTriangle,
  FaCheckCircle,
  FaClock,
  FaThLarge,
  FaList,
  FaSearch,
  FaPlus,
  FaTimes,
  FaEye,
  FaCheck,
  FaFilter,
  FaBuilding,
  FaTools,
  FaEdit,
  FaTrash,
} from "react-icons/fa";

// Helper to format Room Asset as Floor No - Room No (e.g. 3rd Floor - Room 302) without room type
function formatMaintenanceAsset(assetStr) {
  if (!assetStr) return "1st Floor - Room 101";
  const roomMatch = assetStr.match(/Room\s*(\d+)/i) || assetStr.match(/^(\d+)$/);
  if (roomMatch) {
    const roomNum = roomMatch[1] || roomMatch[0];
    const cleanRoom = `Room ${roomNum.replace(/^Room\s*/i, "")}`;
    const numVal = parseInt(roomNum.replace(/\D/g, ""), 10) || 101;
    const floorNum = Math.floor(numVal / 100) || 1;
    const suffixes = ["th", "st", "nd", "rd"];
    const v = floorNum % 100;
    const suffix = suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0];
    const floorStr = `${floorNum}${suffix} Floor`;
    return `${floorStr} - ${cleanRoom}`;
  }
  return assetStr;
}

function getOrdinalSuffix(n) {
  const num = parseInt(n, 10);
  if (isNaN(num)) return "th";
  const v = num % 100;
  if (v >= 11 && v <= 13) return "th";
  switch (num % 10) {
    case 1: return "st";
    case 2: return "nd";
    case 3: return "rd";
    default: return "th";
  }
}

function groupRoomsByFloor(rooms) {
  const groups = {};
  (rooms || []).forEach((room) => {
    const rNum = String(room.number || room.roomNumber || "");
    let fName = room.floor
      ? String(room.floor).includes("Floor")
        ? String(room.floor)
        : `${room.floor}${getOrdinalSuffix(room.floor)} Floor`
      : null;

    if (!fName && rNum) {
      const n = parseInt(rNum.replace(/\D/g, ""), 10);
      if (!isNaN(n)) {
        const fl = Math.floor(n / 100) || 1;
        fName = `${fl}${getOrdinalSuffix(fl)} Floor`;
      }
    }
    if (!fName) fName = "Ground Floor";

    if (!groups[fName]) groups[fName] = [];
    groups[fName].push(room);
  });
  return groups;
}

export default function Maintenance({
  hideHeader = false,
  openAddModal = false,
  onCloseAddModal = () => {},
}) {
  const [tickets, setTickets] = useState(getMaintenanceTickets);
  const [dbRooms, setDbRooms] = useState(getRooms);
  const [customAsset, setCustomAsset] = useState("");
  const [q, setQ] = useState("");
  const [viewMode, setViewMode] = useState("grid"); // "grid" or "list"
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");

  const [selectedTicket, setSelectedTicket] = useState(null);
  const [internalIsAddModalOpen, setInternalIsAddModalOpen] = useState(false);
  const isAddModalOpen = openAddModal || internalIsAddModalOpen;

  const setIsAddModalOpen = (val) => {
    setInternalIsAddModalOpen(val);
    if (!val) {
      onCloseAddModal();
    }
  };

  const [newTicket, setNewTicket] = useState({
    asset: "",
    category: "General",
    issue: "",
    assignedTo: "Eng. Ravi Sharma",
    priority: "Medium",
  });

  // Fetch rooms from backend API database on initial mount and when modal opens
  useEffect(() => {
    async function loadData() {
      const freshTickets = await fetchMaintenanceTickets();
      if (freshTickets && Array.isArray(freshTickets)) {
        setTickets(freshTickets);
      }
      const freshRooms = await fetchRoomsFromApi();
      if (freshRooms && Array.isArray(freshRooms)) {
        setDbRooms(freshRooms);
      }
    }

    loadData();
    const intervalId = setInterval(loadData, 5000);

    const unsubscribe = subscribeInventory(() => {
      setTickets(getMaintenanceTickets());
    });

    return () => {
      clearInterval(intervalId);
      unsubscribe();
    };
  }, []);

  // Sync rooms and pre-select default room when modal opens
  useEffect(() => {
    if (isAddModalOpen) {
      setCustomAsset("");
      fetchRoomsFromApi().then((freshRooms) => {
        if (freshRooms && Array.isArray(freshRooms)) {
          setDbRooms(freshRooms);
          if (freshRooms.length > 0) {
            const firstRoom = freshRooms[0];
            const defaultAsset = `Room ${firstRoom.number || firstRoom.roomNumber} (${firstRoom.type || "Standard"})`;
            setNewTicket((prev) => ({ ...prev, asset: prev.asset || defaultAsset }));
          }
        }
      });
    }
  }, [isAddModalOpen]);

  const isGuest = getUserRole() === "guest";

  const filtered = tickets.filter((t) => {
    if (statusFilter !== "all" && t.status.toLowerCase().replace(" ", "") !== statusFilter.toLowerCase().replace(" ", "")) return false;
    if (priorityFilter !== "all" && t.priority.toLowerCase() !== priorityFilter.toLowerCase()) return false;

    if (q) {
      const lower = q.toLowerCase();
      const match =
        t.id.toLowerCase().includes(lower) ||
        t.asset.toLowerCase().includes(lower) ||
        t.issue.toLowerCase().includes(lower) ||
        t.assignedTo.toLowerCase().includes(lower) ||
        t.category.toLowerCase().includes(lower);
      if (!match) return false;
    }
    return true;
  });

  async function handleStatusChange(ticketId, newStatus) {
    const updated = await updateMaintenanceTicketStatus(ticketId, newStatus);
    const fresh = await fetchMaintenanceTickets();
    const currentTickets = fresh || updated || getMaintenanceTickets();
    setTickets(currentTickets);
    if (selectedTicket && selectedTicket.id === ticketId) {
      const updatedTicket = currentTickets.find((t) => t.id === ticketId);
      if (updatedTicket) setSelectedTicket(updatedTicket);
    }
  }

  async function handleAddTicket(e) {
    e.preventDefault();
    const finalAsset = newTicket.asset === "Other" ? customAsset.trim() : newTicket.asset;
    if (!finalAsset || !newTicket.issue) return;

    let targetRoomId = null;
    let targetRoomNumber = null;
    let targetFloor = null;
    let assetType = "Custom";

    if (newTicket.asset !== "Other") {
      const matchedRoom = dbRooms.find((r) => {
        const rNum = String(r.number || r.roomNumber || "");
        const val = `Room ${rNum} (${r.type || "Standard"})`;
        return val === newTicket.asset || rNum === newTicket.asset || String(r.id) === newTicket.asset;
      });

      if (matchedRoom) {
        targetRoomId = matchedRoom.id;
        targetRoomNumber = String(matchedRoom.number || matchedRoom.roomNumber || "");
        if (matchedRoom.floor) {
          targetFloor = String(matchedRoom.floor).includes("Floor")
            ? String(matchedRoom.floor)
            : `${matchedRoom.floor}${getOrdinalSuffix(matchedRoom.floor)} Floor`;
        } else if (targetRoomNumber) {
          const numVal = parseInt(targetRoomNumber, 10);
          if (!isNaN(numVal)) {
            const fl = Math.floor(numVal / 100) || 1;
            targetFloor = `${fl}${getOrdinalSuffix(fl)} Floor`;
          }
        }
        assetType = "Room";
      } else if (newTicket.asset.startsWith("Room")) {
        assetType = "Room";
        const numMatch = newTicket.asset.match(/\d+/);
        if (numMatch) {
          targetRoomNumber = numMatch[0];
          const numVal = parseInt(targetRoomNumber, 10);
          const fl = Math.floor(numVal / 100) || 1;
          targetFloor = `${fl}${getOrdinalSuffix(fl)} Floor`;
        }
      } else {
        assetType = "Facility";
      }
    }

    await addMaintenanceTicket({
      roomId: targetRoomId,
      roomNumber: targetRoomNumber,
      floor: targetFloor,
      asset: finalAsset,
      assetType,
      category: newTicket.category,
      issue: newTicket.issue,
      assignedTo: newTicket.assignedTo,
      priority: newTicket.priority,
      reportedBy: "Admin Desk",
    });

    const fresh = await fetchMaintenanceTickets();
    setTickets(fresh || getMaintenanceTickets());
    setIsAddModalOpen(false);
    setCustomAsset("");
    setNewTicket({ asset: "", category: "General", issue: "", assignedTo: "Eng. Ravi Sharma", priority: "Medium" });
  }

  const [editTicket, setEditTicket] = useState(null);
  const [editForm, setEditForm] = useState({
    asset: "",
    category: "General",
    issue: "",
    assignedTo: "Eng. Ravi Sharma",
    priority: "Medium",
    status: "Open",
  });
  const [editCustomAsset, setEditCustomAsset] = useState("");

  function openEditModal(t) {
    setSelectedTicket(null);
    setEditTicket(t);

    const isPreset = dbRooms.some((r) => {
      const val = `Room ${r.number || r.roomNumber} (${r.type || "Standard"})`;
      return val === t.asset || String(r.number) === String(t.asset);
    }) || ["Main Lobby Ceiling", "Elevator B (West Wing)", "Gym Pool Area", "Kitchen Bakery Desk", "Main Entrance Automatic Doors"].includes(t.asset);

    if (!isPreset) {
      setEditForm({
        asset: "Other",
        category: t.category || "General",
        issue: t.issue || "",
        assignedTo: t.assignedTo || "Eng. Ravi Sharma",
        priority: t.priority || "Medium",
        status: t.status || "Open",
      });
      setEditCustomAsset(t.asset || "");
    } else {
      setEditForm({
        asset: t.asset || "",
        category: t.category || "General",
        issue: t.issue || "",
        assignedTo: t.assignedTo || "Eng. Ravi Sharma",
        priority: t.priority || "Medium",
        status: t.status || "Open",
      });
      setEditCustomAsset("");
    }
  }

  async function handleSaveEditTicket(e) {
    e.preventDefault();
    if (!editTicket) return;
    const finalAsset = editForm.asset === "Other" ? editCustomAsset.trim() : editForm.asset;
    if (!finalAsset || !editForm.issue) return;

    let targetRoomId = null;
    let targetRoomNumber = null;
    let targetFloor = null;
    let assetType = "Custom";

    if (editForm.asset !== "Other") {
      const matched = dbRooms.find((r) => {
        const rNum = String(r.number || r.roomNumber || "");
        const val = `Room ${rNum} (${r.type || "Standard"})`;
        return val === editForm.asset || rNum === editForm.asset || String(r.id) === editForm.asset;
      });

      if (matched) {
        targetRoomId = matched.id;
        targetRoomNumber = String(matched.number || matched.roomNumber || "");
        if (matched.floor) {
          targetFloor = String(matched.floor).includes("Floor")
            ? String(matched.floor)
            : `${matched.floor}${getOrdinalSuffix(matched.floor)} Floor`;
        } else if (targetRoomNumber) {
          const numVal = parseInt(targetRoomNumber, 10);
          if (!isNaN(numVal)) {
            const fl = Math.floor(numVal / 100) || 1;
            targetFloor = `${fl}${getOrdinalSuffix(fl)} Floor`;
          }
        }
        assetType = "Room";
      } else if (editForm.asset.startsWith("Room")) {
        assetType = "Room";
        const numMatch = editForm.asset.match(/\d+/);
        if (numMatch) {
          targetRoomNumber = numMatch[0];
          const numVal = parseInt(targetRoomNumber, 10);
          const fl = Math.floor(numVal / 100) || 1;
          targetFloor = `${fl}${getOrdinalSuffix(fl)} Floor`;
        }
      } else {
        assetType = "Facility";
      }
    }

    await updateMaintenanceTicket(editTicket.id, {
      roomId: targetRoomId,
      roomNumber: targetRoomNumber,
      floor: targetFloor,
      asset: finalAsset,
      assetType,
      category: editForm.category,
      issue: editForm.issue,
      assignedTo: editForm.assignedTo,
      priority: editForm.priority,
      status: editForm.status,
    });

    const fresh = await fetchMaintenanceTickets();
    setTickets(fresh || getMaintenanceTickets());
    setEditTicket(null);
    setEditCustomAsset("");
  }

  async function handleDeleteTicket(ticketId) {
    if (window.confirm("Are you sure you want to delete this maintenance ticket from database?")) {
      await deleteMaintenanceTicket(ticketId);
      const fresh = await fetchMaintenanceTickets();
      setTickets(fresh || getMaintenanceTickets());
      if (selectedTicket && selectedTicket.id === ticketId) {
        setSelectedTicket(null);
      }
    }
  }

  return (
    <>
      {!hideHeader && (
        <PageHeader
          title="Maintenance & Assets"
          subtitle="Track non-housekeeping issues (AC, plumbing, electrical, furniture) with Grid & List views"
          action={
            !isGuest && (
              <button
                className="btn-primary"
                onClick={() => setIsAddModalOpen(true)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "10px 18px",
                  borderRadius: "10px",
                  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  border: "none",
                  color: "#ffffff",
                  fontWeight: "700",
                  fontSize: "13.5px",
                  cursor: "pointer",
                  boxShadow: "0 4px 12px rgba(102, 126, 234, 0.35)",
                }}
              >
                <FaPlus /> Log Maintenance Ticket
              </button>
            )
          }
        />
      )}

      {/* CONTROL BAR: SEARCH, FILTERS & GRID / LIST TOGGLE */}
      <section className="inv-panel">
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "14px",
            flexWrap: "wrap",
            marginBottom: "20px",
          }}
        >
          {/* SEARCH INPUT */}
          <div className="inv-search-box" style={{ width: "320px" }}>
            <FaSearch style={{ color: "#94a3b8" }} />
            <input
              className="inv-search-input"
              placeholder="Search by ticket #, room, issue or engineer..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap", marginLeft: "auto" }}>
            {/* STATUS FILTER DROPDOWN */}
            <select
              className="inv-dropdown"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="open">Open</option>
              <option value="inprogress">In Progress</option>
              <option value="resolved">Resolved</option>
            </select>

            {/* PRIORITY FILTER DROPDOWN */}
            <select
              className="inv-dropdown"
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
            >
              <option value="all">All Priorities</option>
              <option value="high">High Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="low">Low Priority</option>
            </select>

            {/* GRID & LIST VIEW TOGGLE BUTTONS */}
            <div className="view-mode-toggle">
              <button
                type="button"
                className={`view-btn ${viewMode === "grid" ? "active" : ""}`}
                onClick={() => setViewMode("grid")}
                title="Grid View"
              >
                <FaThLarge />
              </button>

              <button
                type="button"
                className={`view-btn ${viewMode === "list" ? "active" : ""}`}
                onClick={() => setViewMode("list")}
                title="List View"
              >
                <FaList />
              </button>
            </div>

          </div>
        </div>

        {/* 1. GRID VIEW MODE */}
        {viewMode === "grid" ? (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
              gap: "20px",
            }}
          >
            {filtered.map((t) => (
              <div
                key={t.id}
                className="maint-card"
                onClick={() => setSelectedTicket(t)}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  gap: "14px",
                  transition: "all 0.2s ease",
                  cursor: "pointer",
                }}
              >
                {/* TICKET HEADER */}
                <div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                    <span style={{ fontSize: "12.5px", fontWeight: "800", color: "#667eea" }}>
                      {t.id}
                    </span>

                    {/* PRIORITY CHIP */}
                    <span
                      className={`maint-priority-chip ${t.priority.toLowerCase()}`}
                      style={{
                        padding: "3px 10px",
                        borderRadius: "999px",
                        fontSize: "11px",
                        fontWeight: "700",
                        background: t.priorityBg,
                        color: t.priorityColor,
                      }}
                    >
                      {t.priority} Priority
                    </span>
                  </div>

                  {/* ASSET NAME */}
                  <h3 className="maint-title" style={{ margin: "0 0 6px", fontSize: "16px", fontWeight: "700", display: "flex", alignItems: "center", gap: "6px" }}>
                    <FaTools style={{ opacity: 0.7, fontSize: "14px" }} />
                    {formatMaintenanceAsset(t.asset)}
                  </h3>

                  {/* ISSUE DESCRIPTION */}
                  <p
                    className="maint-desc"
                    style={{
                      margin: 0,
                      fontSize: "13px",
                      opacity: 0.85,
                      lineHeight: 1.45,
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {t.issue}
                  </p>
                </div>

                {/* ASSIGNED ENGINEER & STATUS BAR */}
                <div className="maint-box" style={{ padding: "10px 12px", borderRadius: "12px", display: "flex", flexDirection: "column", gap: "6px" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "12px" }}>
                    <span style={{ opacity: 0.8, display: "flex", alignItems: "center", gap: "4px" }}>
                      <FaUserTie style={{ color: "#6366f1" }} /> {t.assignedTo}
                    </span>

                    {/* STATUS BADGE */}
                    <span
                      className={`maint-status-chip ${t.status.toLowerCase().replace(" ", "")}`}
                      style={{
                        padding: "2px 8px",
                        borderRadius: "6px",
                        fontSize: "11px",
                        fontWeight: "700",
                        background: t.statusBg,
                        color: t.statusColor,
                      }}
                    >
                      {t.status}
                    </span>
                  </div>

                  <div style={{ fontSize: "11px", opacity: 0.7, display: "flex", alignItems: "center", gap: "4px" }}>
                    <FaClock style={{ fontSize: "10px" }} /> Reported: {t.reportedAt}
                  </div>
                </div>

                {/* CARD ACTIONS */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: "10px", borderTop: "none", gap: "8px" }} onClick={(e) => e.stopPropagation()}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <button
                      type="button"
                      onClick={() => setSelectedTicket(t)}
                      title="View Issue Details"
                      style={{
                        width: "34px",
                        height: "34px",
                        borderRadius: "10px",
                        border: "none",
                        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                        color: "#ffffff",
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "15px",
                        boxShadow: "0 2px 8px rgba(102, 126, 234, 0.35)",
                        transition: "all 0.2s ease",
                      }}
                    >
                      <FaEye />
                    </button>
                    {!isGuest && (
                      <>
                        <button
                          type="button"
                          onClick={() => openEditModal(t)}
                          title="Edit Maintenance Ticket"
                          style={{
                            width: "34px",
                            height: "34px",
                            borderRadius: "10px",
                            border: "1px solid #cbd5e1",
                            background: "#f8fafc",
                            color: "#334155",
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "14px",
                            transition: "all 0.2s ease",
                          }}
                        >
                          <FaEdit />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteTicket(t.id)}
                          title="Delete Ticket"
                          style={{
                            width: "34px",
                            height: "34px",
                            borderRadius: "10px",
                            border: "1px solid #fecaca",
                            background: "#fef2f2",
                            color: "#ef4444",
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "14px",
                            transition: "all 0.2s ease",
                          }}
                        >
                          <FaTrash />
                        </button>
                      </>
                    )}
                  </div>

                  {t.status !== "Resolved" ? (
                    <button
                      type="button"
                      onClick={() => handleStatusChange(t.id, "Resolved")}
                      style={{
                        padding: "8px 14px",
                        borderRadius: "10px",
                        border: "none",
                        background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                        color: "#ffffff",
                        fontSize: "12.5px",
                        fontWeight: "700",
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        boxShadow: "0 2px 8px rgba(16, 185, 129, 0.3)",
                      }}
                    >
                      <FaCheck /> Mark Resolved
                    </button>
                  ) : (
                    <span style={{ fontSize: "12px", color: "#10b981", fontWeight: "700", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                      <FaCheckCircle /> Fixed & Closed
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* 2. LIST VIEW TABLE MODE */
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: "0 8px" }}>
              <thead>
                <tr style={{ fontSize: "12px", textAlign: "left", whiteSpace: "nowrap" }}>
                  <th style={{ padding: "12px 16px" }}>Ticket ID</th>
                  <th style={{ padding: "12px 16px" }}>Room / Asset</th>
                  <th style={{ padding: "12px 16px" }}>Category & Issue</th>
                  <th style={{ padding: "12px 16px" }}>Assigned Engineer</th>
                  <th style={{ padding: "12px 16px" }}>Priority</th>
                  <th style={{ padding: "12px 16px" }}>Status</th>
                  <th style={{ padding: "12px 16px", textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((t) => (
                  <tr
                    key={t.id}
                    className="maint-table-row"
                    onClick={() => setSelectedTicket(t)}
                    style={{ cursor: "pointer" }}
                  >
                    <td style={{ padding: "14px 16px", fontWeight: "800", color: "#667eea", whiteSpace: "nowrap" }}>
                      {t.id}
                    </td>

                    <td style={{ padding: "14px 16px", fontWeight: "700", whiteSpace: "nowrap" }}>
                      <div className="maint-asset-txt" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <FaBuilding style={{ opacity: 0.7, fontSize: "12px" }} />
                        {formatMaintenanceAsset(t.asset)}
                      </div>
                    </td>

                    <td style={{ padding: "14px 16px" }}>
                      <div style={{ fontSize: "11px", fontWeight: "700", color: "#6366f1" }}>{t.category}</div>
                      <div className="maint-issue-txt" style={{ fontSize: "13px", fontWeight: "600", maxWidth: "260px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {t.issue}
                      </div>
                    </td>

                    <td style={{ padding: "14px 16px", whiteSpace: "nowrap" }}>
                      <div className="maint-eng-txt" style={{ fontSize: "12.5px", fontWeight: "600", display: "flex", alignItems: "center", gap: "6px" }}>
                        <FaUserTie style={{ opacity: 0.7 }} />
                        {t.assignedTo}
                      </div>
                    </td>

                    <td style={{ padding: "14px 16px", whiteSpace: "nowrap" }}>
                      <span
                        className={`maint-priority-chip ${t.priority.toLowerCase()}`}
                        style={{
                          padding: "3px 10px",
                          borderRadius: "999px",
                          fontSize: "11px",
                          fontWeight: "700",
                          background: t.priorityBg,
                          color: t.priorityColor,
                        }}
                      >
                        {t.priority}
                      </span>
                    </td>

                    <td style={{ padding: "14px 16px", whiteSpace: "nowrap" }}>
                      <span
                        className={`maint-status-chip ${t.status.toLowerCase().replace(" ", "")}`}
                        style={{
                          padding: "4px 10px",
                          borderRadius: "6px",
                          fontSize: "11px",
                          fontWeight: "700",
                          background: t.statusBg,
                          color: t.statusColor,
                        }}
                      >
                        {t.status}
                      </span>
                    </td>

                    <td style={{ padding: "14px 16px", textAlign: "right", whiteSpace: "nowrap" }} onClick={(e) => e.stopPropagation()}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "8px" }}>
                        <button
                          type="button"
                          onClick={() => setSelectedTicket(t)}
                          style={{
                            padding: "6px 12px",
                            borderRadius: "8px",
                            border: "none",
                            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                            color: "#ffffff",
                            fontSize: "12px",
                            fontWeight: "700",
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                          }}
                        >
                          <FaEye /> View
                        </button>

                        <RowActions
                          items={[
                            { label: "View Ticket Details", onClick: () => setSelectedTicket(t) },
                            { label: "Edit Ticket Details", onClick: () => openEditModal(t) },
                            t.status !== "Resolved" && { label: "Mark as Resolved", onClick: () => handleStatusChange(t.id, "Resolved") },
                            t.status === "Open" && { label: "Set In Progress", onClick: () => handleStatusChange(t.id, "In Progress") },
                            { label: "Delete Ticket", onClick: () => handleDeleteTicket(t.id), danger: true },
                          ].filter(Boolean)}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* VIEW TICKET DETAILS MODAL */}
      {selectedTicket && (
        <div
          className="modal-backdrop"
          onClick={() => setSelectedTicket(null)}
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
            zIndex: 1200,
            padding: "20px",
          }}
        >
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#ffffff",
              borderRadius: "20px",
              maxWidth: "520px",
              width: "100%",
              overflow: "hidden",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
            }}
          >
            <div
              style={{
                padding: "20px 24px",
                background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
                color: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div>
                <span style={{ fontSize: "12px", color: "#94a3b8", fontWeight: "700" }}>{selectedTicket.id}</span>
                <h3 style={{ margin: "2px 0 0", fontSize: "17px", fontWeight: "700" }}>{formatMaintenanceAsset(selectedTicket.asset)}</h3>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <button
                  type="button"
                  onClick={() => setSelectedTicket(null)}
                  title="Close"
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "50%",
                    background: "rgba(255, 255, 255, 0.1)",
                    border: "none",
                    color: "#cbd5e1",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    fontSize: "14px",
                  }}
                >
                  <FaTimes />
                </button>
              </div>
            </div>

            <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label style={{ fontSize: "11px", fontWeight: "700", color: "#64748b" }}>Category</label>
                <div style={{ fontSize: "14px", fontWeight: "700", color: "#0f172a" }}>{selectedTicket.category}</div>
              </div>

              <div>
                <label style={{ fontSize: "11px", fontWeight: "700", color: "#64748b" }}>Issue Description</label>
                <p style={{ margin: "4px 0 0", fontSize: "13.5px", color: "#334155", background: "#f8fafc", padding: "12px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                  {selectedTicket.issue}
                </p>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                <div>
                  <label style={{ fontSize: "11px", fontWeight: "700", color: "#64748b" }}>Assigned Staff</label>
                  <div style={{ fontSize: "13px", fontWeight: "700", color: "#0f172a" }}>{selectedTicket.assignedTo}</div>
                </div>

                <div>
                  <label style={{ fontSize: "11px", fontWeight: "700", color: "#64748b" }}>Priority</label>
                  <div>
                    <span style={{ padding: "3px 8px", borderRadius: "6px", fontSize: "11px", fontWeight: "700", background: selectedTicket.priorityBg, color: selectedTicket.priorityColor }}>
                      {selectedTicket.priority} Priority
                    </span>
                  </div>
                </div>
              </div>

              <div style={{ paddingTop: "14px", borderTop: "1px solid #f1f5f9", display: "flex", gap: "10px" }}>
                {selectedTicket.status !== "Resolved" ? (
                  <button
                    type="button"
                    onClick={() => handleStatusChange(selectedTicket.id, "Resolved")}
                    style={{
                      width: "100%",
                      padding: "12px",
                      borderRadius: "10px",
                      border: "none",
                      background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                      color: "#ffffff",
                      fontSize: "13.5px",
                      fontWeight: "700",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px",
                    }}
                  >
                    <FaCheck /> Mark Ticket as Resolved
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setSelectedTicket(null)}
                    style={{
                      width: "100%",
                      padding: "10px",
                      borderRadius: "10px",
                      border: "1px solid #cbd5e1",
                      background: "#ffffff",
                      color: "#475569",
                      fontSize: "13px",
                      fontWeight: "700",
                      cursor: "pointer",
                    }}
                  >
                    Close Window
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* LOG MAINTENANCE ISSUE MODAL */}
      {isAddModalOpen && (
        <div
          className="modal-backdrop"
          onClick={() => setIsAddModalOpen(false)}
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
            zIndex: 1200,
            padding: "20px",
          }}
        >
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#ffffff",
              borderRadius: "20px",
              maxWidth: "500px",
              width: "100%",
              overflow: "hidden",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
            }}
          >
            <div
              style={{
                padding: "20px 24px",
                background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
                color: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <h3 style={{ margin: 0, fontSize: "17px", fontWeight: "700" }}>Log Maintenance Ticket</h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                style={{
                  background: "rgba(255,255,255,0.1)",
                  border: "none",
                  color: "#cbd5e1",
                  width: "32px",
                  height: "32px",
                  borderRadius: "50%",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <FaTimes />
              </button>
            </div>

            <form onSubmit={handleAddTicket} style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label style={{ fontSize: "12px", fontWeight: "700", color: "#334155", display: "block", marginBottom: "4px" }}>
                  Select Room / Asset *
                </label>
                <select
                  required
                  value={newTicket.asset}
                  onChange={(e) => setNewTicket({ ...newTicket, asset: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "10px",
                    borderRadius: "10px",
                    border: "1px solid #cbd5e1",
                    fontSize: "13.5px",
                    background: "#ffffff",
                    color: "#0f172a",
                    fontWeight: "600",
                  }}
                >
                  <option value="" disabled>-- Select Room by Floor --</option>
                  {Object.entries(groupRoomsByFloor(dbRooms)).map(([floorName, floorRooms]) => (
                    <optgroup key={`add-floor-${floorName}`} label={`🏢 ${floorName}`}>
                      {floorRooms.map((room) => {
                        const rNum = room.number || room.roomNumber;
                        const roomType = room.type || "Standard";
                        const roomVal = `Room ${rNum} (${roomType})`;
                        return (
                          <option key={`add-room-${room.id}-${rNum}`} value={roomVal}>
                            Room {rNum} - {roomType}
                          </option>
                        );
                      })}
                    </optgroup>
                  ))}
                  <optgroup label="🏢 Common Facilities & Hotel Assets">
                    <option value="Main Lobby Ceiling">Main Lobby Ceiling</option>
                    <option value="Elevator B (West Wing)">Elevator B (West Wing)</option>
                    <option value="Gym Pool Area">Gym Pool Area</option>
                    <option value="Kitchen Bakery Desk">Kitchen Bakery Desk</option>
                    <option value="Main Entrance Automatic Doors">Main Entrance Automatic Doors</option>
                  </optgroup>
                  <optgroup label="➕ Custom Entry">
                    <option value="Other">➕ Other (Type Custom Room / Asset Name)</option>
                  </optgroup>
                </select>

                {newTicket.asset === "Other" && (
                  <div style={{ marginTop: "10px" }}>
                    <label style={{ fontSize: "12px", fontWeight: "700", color: "#6366f1", display: "block", marginBottom: "4px" }}>
                      Enter Custom Room or Asset Name *
                    </label>
                    <input
                      required
                      placeholder="e.g. Swimming Pool Pump, Room 602, Staff Canteen..."
                      value={customAsset}
                      onChange={(e) => setCustomAsset(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        borderRadius: "10px",
                        border: "2px solid #6366f1",
                        fontSize: "13.5px",
                        background: "#f8fafc",
                        outline: "none",
                        color: "#0f172a",
                        fontWeight: "600",
                      }}
                    />
                  </div>
                )}
              </div>

              <div>
                <label style={{ fontSize: "12px", fontWeight: "700", color: "#334155", display: "block", marginBottom: "4px" }}>
                  Category
                </label>
                <select
                  value={newTicket.category}
                  onChange={(e) => setNewTicket({ ...newTicket, category: e.target.value })}
                  style={{ width: "100%", padding: "10px", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "13.5px", background: "#ffffff" }}
                >
                  <option value="HVAC / Air Conditioning">HVAC / Air Conditioning</option>
                  <option value="Plumbing">Plumbing</option>
                  <option value="Electrical">Electrical</option>
                  <option value="Furniture / Woodwork">Furniture / Woodwork</option>
                  <option value="Elevator / Lift">Elevator / Lift</option>
                  <option value="General">General Repair</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: "12px", fontWeight: "700", color: "#334155", display: "block", marginBottom: "4px" }}>
                  Issue Details *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Describe the issue in detail..."
                  value={newTicket.issue}
                  onChange={(e) => setNewTicket({ ...newTicket, issue: e.target.value })}
                  style={{ width: "100%", padding: "10px", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "13.5px" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: "700", color: "#334155", display: "block", marginBottom: "4px" }}>
                    Assign Engineer
                  </label>
                  <select
                    value={newTicket.assignedTo}
                    onChange={(e) => setNewTicket({ ...newTicket, assignedTo: e.target.value })}
                    style={{ width: "100%", padding: "10px", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "13px", background: "#ffffff" }}
                  >
                    <option value="Eng. Ravi Sharma">Eng. Ravi Sharma</option>
                    <option value="Eng. Sameer Verma">Eng. Sameer Verma</option>
                    <option value="Eng. Vikram Gill">Eng. Vikram Gill</option>
                    <option value="Outside Service Team">Outside Service Team</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: "12px", fontWeight: "700", color: "#334155", display: "block", marginBottom: "4px" }}>
                    Priority Level
                  </label>
                  <select
                    value={newTicket.priority}
                    onChange={(e) => setNewTicket({ ...newTicket, priority: e.target.value })}
                    style={{ width: "100%", padding: "10px", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "13px", background: "#ffffff" }}
                  >
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                style={{
                  marginTop: "10px",
                  padding: "12px",
                  borderRadius: "10px",
                  border: "none",
                  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  color: "#ffffff",
                  fontSize: "14px",
                  fontWeight: "700",
                  cursor: "pointer",
                  boxShadow: "0 4px 12px rgba(102, 126, 234, 0.35)",
                }}
              >
                Submit Ticket
              </button>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MAINTENANCE TICKET MODAL */}
      {editTicket && (
        <div
          className="modal-backdrop"
          onClick={() => setEditTicket(null)}
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
            zIndex: 1200,
            padding: "20px",
          }}
        >
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#ffffff",
              borderRadius: "20px",
              maxWidth: "500px",
              width: "100%",
              overflow: "hidden",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
            }}
          >
            <div
              style={{
                padding: "20px 24px",
                background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
                color: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div>
                <span style={{ fontSize: "12px", color: "#94a3b8", fontWeight: "700" }}>{editTicket.id}</span>
                <h3 style={{ margin: "2px 0 0", fontSize: "17px", fontWeight: "700" }}>Edit Maintenance Ticket</h3>
              </div>
              <button
                type="button"
                onClick={() => setEditTicket(null)}
                style={{
                  background: "rgba(255,255,255,0.1)",
                  border: "none",
                  color: "#cbd5e1",
                  width: "32px",
                  height: "32px",
                  borderRadius: "50%",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <FaTimes />
              </button>
            </div>

            <form onSubmit={handleSaveEditTicket} style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label style={{ fontSize: "12px", fontWeight: "700", color: "#334155", display: "block", marginBottom: "4px" }}>
                  Select Room / Asset *
                </label>
                <select
                  required
                  value={editForm.asset}
                  onChange={(e) => setEditForm({ ...editForm, asset: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "10px",
                    borderRadius: "10px",
                    border: "1px solid #cbd5e1",
                    fontSize: "13.5px",
                    background: "#ffffff",
                    color: "#0f172a",
                    fontWeight: "600",
                  }}
                >
                  <option value="" disabled>-- Select Room by Floor --</option>
                  {Object.entries(groupRoomsByFloor(dbRooms)).map(([floorName, floorRooms]) => (
                    <optgroup key={`edit-floor-${floorName}`} label={`🏢 ${floorName}`}>
                      {floorRooms.map((room) => {
                        const rNum = room.number || room.roomNumber;
                        const roomType = room.type || "Standard";
                        const roomVal = `Room ${rNum} (${roomType})`;
                        return (
                          <option key={`edit-room-${room.id}-${rNum}`} value={roomVal}>
                            Room {rNum} - {roomType}
                          </option>
                        );
                      })}
                    </optgroup>
                  ))}
                  <optgroup label="🏢 Common Facilities & Hotel Assets">
                    <option value="Main Lobby Ceiling">Main Lobby Ceiling</option>
                    <option value="Elevator B (West Wing)">Elevator B (West Wing)</option>
                    <option value="Gym Pool Area">Gym Pool Area</option>
                    <option value="Kitchen Bakery Desk">Kitchen Bakery Desk</option>
                    <option value="Main Entrance Automatic Doors">Main Entrance Automatic Doors</option>
                  </optgroup>
                  <optgroup label="➕ Custom Entry">
                    <option value="Other">➕ Other (Type Custom Room / Asset Name)</option>
                  </optgroup>
                </select>

                {editForm.asset === "Other" && (
                  <div style={{ marginTop: "10px" }}>
                    <label style={{ fontSize: "12px", fontWeight: "700", color: "#6366f1", display: "block", marginBottom: "4px" }}>
                      Enter Custom Room or Asset Name *
                    </label>
                    <input
                      required
                      placeholder="e.g. Swimming Pool Pump, Room 602..."
                      value={editCustomAsset}
                      onChange={(e) => setEditCustomAsset(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        borderRadius: "10px",
                        border: "2px solid #6366f1",
                        fontSize: "13.5px",
                        background: "#f8fafc",
                        outline: "none",
                        color: "#0f172a",
                        fontWeight: "600",
                      }}
                    />
                  </div>
                )}
              </div>

              <div>
                <label style={{ fontSize: "12px", fontWeight: "700", color: "#334155", display: "block", marginBottom: "4px" }}>
                  Category
                </label>
                <select
                  value={editForm.category}
                  onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                  style={{ width: "100%", padding: "10px", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "13.5px", background: "#ffffff" }}
                >
                  <option value="HVAC / Air Conditioning">HVAC / Air Conditioning</option>
                  <option value="Plumbing">Plumbing</option>
                  <option value="Electrical">Electrical</option>
                  <option value="Furniture / Woodwork">Furniture / Woodwork</option>
                  <option value="Elevator / Lift">Elevator / Lift</option>
                  <option value="General">General Repair</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: "12px", fontWeight: "700", color: "#334155", display: "block", marginBottom: "4px" }}>
                  Issue Details *
                </label>
                <textarea
                  required
                  rows={3}
                  value={editForm.issue}
                  onChange={(e) => setEditForm({ ...editForm, issue: e.target.value })}
                  style={{ width: "100%", padding: "10px", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "13.5px" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: "700", color: "#334155", display: "block", marginBottom: "4px" }}>
                    Assign Engineer
                  </label>
                  <select
                    value={editForm.assignedTo}
                    onChange={(e) => setEditForm({ ...editForm, assignedTo: e.target.value })}
                    style={{ width: "100%", padding: "10px", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "13px", background: "#ffffff" }}
                  >
                    <option value="Eng. Ravi Sharma">Eng. Ravi Sharma</option>
                    <option value="Eng. Sameer Verma">Eng. Sameer Verma</option>
                    <option value="Eng. Vikram Gill">Eng. Vikram Gill</option>
                    <option value="Outside Service Team">Outside Service Team</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: "12px", fontWeight: "700", color: "#334155", display: "block", marginBottom: "4px" }}>
                    Priority Level
                  </label>
                  <select
                    value={editForm.priority}
                    onChange={(e) => setEditForm({ ...editForm, priority: e.target.value })}
                    style={{ width: "100%", padding: "10px", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "13px", background: "#ffffff" }}
                  >
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: "12px", fontWeight: "700", color: "#334155", display: "block", marginBottom: "4px" }}>
                  Status
                </label>
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                  style={{ width: "100%", padding: "10px", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "13px", background: "#ffffff" }}
                >
                  <option value="Open">Open</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Resolved">Resolved</option>
                </select>
              </div>

              <button
                type="submit"
                style={{
                  marginTop: "10px",
                  padding: "12px",
                  borderRadius: "10px",
                  border: "none",
                  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  color: "#ffffff",
                  fontSize: "14px",
                  fontWeight: "700",
                  cursor: "pointer",
                  boxShadow: "0 4px 12px rgba(102, 126, 234, 0.35)",
                }}
              >
                Save Changes 💾
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
