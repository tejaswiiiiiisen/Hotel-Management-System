import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  Cell,
  ReferenceLine,
} from "recharts";
import HkVideoApprovalWidget from "../components/HkVideoApprovalWidget.jsx";
import { getCurrentOrg, getCurrentOrgId, getCurrentOrgStatus } from "../auth.js";
import { getRooms, fetchRoomsFromApi } from "../utils/roomStore.js";
import { getCustomers, fetchCustomersFromAPI } from "../utils/customerStore.js";
import { fetchAllBookings } from "../services/bookingService.js";
import {
  getHkTasks,
  addHkTask,
  uploadHkVideoProof,
  uploadHkPhotoProofMulti,
  approveHkTask,
  rejectAndRescheduleHkTask,
  subscribeHkTasks,
  fetchHkTasksFromAPI,
  clockInStaff,
  clockOutStaff,
  applyStaffLeave,
  calculateHousekeepingSalaryAndBalance,
} from "../services/housekeepingStore.js";
import { getEmployees } from "../employees.js";
import {
  getInventoryTasks,
  subscribeInventoryTasks,
} from "../services/inventoryStore.js";
import KpiStatCard from "../components/KpiStatCard.jsx";
import {
  FaBox,
  FaArrowDown,
  FaArrowUp,
  FaUserCheck,
  FaUserFriends,
  FaHistory,
  FaChevronDown,
  FaChevronLeft,
  FaChevronRight,
  FaBroom,
  FaClipboardCheck,
  FaBed,
  FaMoneyBillWave,
  FaCalendarCheck,
  FaCalendarAlt,
  FaCheckCircle,
  FaClock,
  FaExclamationTriangle,
  FaFilter,
  FaWallet,
  FaUniversity,
  FaCheck,
  FaLayerGroup,
  FaList,
  FaThLarge,
  FaCreditCard,
  FaCheckDouble,
  FaVideo,
  FaCamera,
  FaUpload,
  FaPlay,
  FaThumbsUp,
  FaTimes,
  FaTimesCircle,
  FaQuestionCircle,
  FaPlus,
  FaSun,
  FaMoon,
  FaSignInAlt,
  FaSignOutAlt,
  FaCalendarPlus,
  FaFingerprint,
  FaUmbrellaBeach,
} from "react-icons/fa";
import { getUserName, getUserRole, getUserEmail, logout } from "../auth.js";
import "./Dashboard.css";

// Mini Sparkline Graphic Component for KPI Cards (Larger & Prominent Area Sparkline)
const Sparkline = ({ color = "#667eea", data = [30, 45, 35, 60, 50, 75, 90] }) => {
  const gradientId = `sparkline-grad-${color.replace(/[^a-zA-Z0-9]/g, "")}`;
  const width = 110;
  const height = 40;
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
      width="110"
      height="40"
      viewBox={`0 0 ${width} ${height}`}
      fill="none"
      style={{ flexShrink: 0, opacity: 1, overflow: "visible" }}
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <path d={areaD} fill={`url(#${gradientId})`} />
      <path
        d={pathD}
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

// Helper to format Floor - Room No cleanly without duplicated text
function getCleanFloorRoom(item) {
  if (!item) return "1st Floor • Room 108";
  const floorPart = item.floor ? item.floor.split("•")[0].split("-")[0].trim() : "1st Floor";
  const roomPart = item.room || "Room 108";
  return `${floorPart} • ${roomPart}`;
}

// Helper renderer for Approval Status with timestamp & approver/rejector details
function renderApprovalStatus(item) {
  if (!item) return null;
  if (item.status === "Cleaned & Approved" || (item.approvalStatus && item.approvalStatus.includes("Approved"))) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
          <FaCheckCircle style={{ color: "#10b981", fontSize: "16px" }} />
          <span style={{ fontSize: "13.5px", fontWeight: "700", color: "#10b981" }}>
            Cleaned & Approved
          </span>
        </div>
        <span className="hk-approved-subtext" style={{ fontSize: "11px", fontStyle: "italic" }}>
          {item.approvedBy ? `Approved by ${item.approvedBy}` : "Approved"} {item.statusActionAt ? `• ${item.statusActionAt}` : ""}
        </span>
      </div>
    );
  }

  if (item.status === "Rescheduled" || item.status === "Re-cleaning Scheduled" || (item.approvalStatus && item.approvalStatus.includes("Rejected"))) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
          <FaTimesCircle style={{ color: "#d97706", fontSize: "16px" }} />
          <span style={{ fontSize: "13.5px", fontWeight: "700", color: "#d97706" }}>
            Rescheduled for Re-cleaning
          </span>
        </div>
        {item.rejectedReason && (
          <span className="hk-rejected-reason" style={{ fontSize: "11px", fontStyle: "italic" }}>
            Reason: {item.rejectedReason}
          </span>
        )}
        <span className="hk-rejected-subtext" style={{ fontSize: "10.5px" }}>
          {item.statusActionBy ? `Rejected by ${item.statusActionBy}` : "Rejected"} {item.statusActionAt ? `• ${item.statusActionAt}` : ""}
        </span>
      </div>
    );
  }

  if (item.photoProofUrl || (item.status && item.status.includes("Photo")) || (item.approvalStatus && item.approvalStatus.includes("Pending"))) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
          <FaQuestionCircle style={{ color: "#8b5cf6", fontSize: "16px" }} />
          <span style={{ fontSize: "13.5px", fontWeight: "700", color: "#8b5cf6" }}>
            Pending Approval
          </span>
        </div>
        <span className="hk-pending-subtext" style={{ fontSize: "11px", fontStyle: "italic" }}>
          Uploaded {item.photoUploadedAt || "Today"}
        </span>
      </div>
    );
  }

  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
      <FaTimesCircle style={{ color: "#ef4444", fontSize: "16px" }} />
      <span style={{ fontSize: "13.5px", fontWeight: "700", color: "#ef4444" }}>
        No Photo Uploaded
      </span>
    </div>
  );
}

// Seed tasks for housekeeping dashboard with photo proof & approval status
const initialHkTasks = [
  {
    id: 1,
    room: "Room 108",
    floor: "1st Floor",
    roomType: "Standard King Bed",
    task: "Deep Clean & Bed Restock",
    priority: "High Priority",
    priorityBg: "#fee2e2",
    priorityColor: "#dc2626",
    status: "Photo Uploaded",
    statusColor: "#7c3aed",
    statusBg: "#ede9fe",
    progress: 90,
    icon: "🧹",
    assignedTime: "09:00 AM",
    notes: "Guest requested extra pillows and fresh towels.",
    photoProofUrl: "https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=800&q=80",
    photoUploadedAt: "Today, 10:00 AM",
    approvalStatus: "Pending Approval",
    approvedBy: null,
  },
  {
    id: 2,
    room: "Room 204",
    floor: "2nd Floor",
    roomType: "Deluxe Suite",
    task: "Full Sanitize & Change Linens",
    priority: "Urgent (Checkout)",
    priorityBg: "#fee2e2",
    priorityColor: "#dc2626",
    status: "Dirty",
    statusColor: "#dc2626",
    statusBg: "#fee2e2",
    progress: 15,
    icon: "🛏️",
    assignedTime: "11:15 AM",
    notes: "Checkout completed at 11 AM. Clean urgently for 2 PM check-in.",
    photoProofUrl: null,
    approvalStatus: "No Photo Uploaded",
    approvedBy: null,
  },
  {
    id: 3,
    room: "Room 301",
    floor: "3rd Floor",
    roomType: "Executive Suite",
    task: "Inspected & Ready for Guest",
    priority: "Normal",
    priorityBg: "#f1f5f9",
    priorityColor: "#64748b",
    status: "Cleaned & Approved",
    statusColor: "#16a34a",
    statusBg: "#dcfce7",
    progress: 100,
    icon: "✨",
    assignedTime: "08:30 AM",
    notes: "Standard morning cleaning & bathroom sanitize completed.",
    photoProofUrl: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80",
    photoUploadedAt: "Today, 09:30 AM",
    approvalStatus: "Approved by Manager",
    approvedBy: "Rajesh Manager",
  },
  {
    id: 4,
    room: "Room 302",
    floor: "3rd Floor",
    roomType: "Deluxe Suite",
    task: "Bathroom Sanitize & Restock",
    priority: "Normal",
    priorityBg: "#f1f5f9",
    priorityColor: "#64748b",
    status: "Cleaning",
    statusColor: "#d97706",
    statusBg: "#fef3c7",
    progress: 40,
    icon: "🧼",
    assignedTime: "01:00 PM",
    notes: "Sanitize glass enclosure and restock bath kit.",
    photoProofUrl: null,
    approvalStatus: "No Photo Uploaded",
    approvedBy: null,
  },
  {
    id: 5,
    room: "Room 501",
    floor: "5th Floor",
    roomType: "Penthouse Villa",
    task: "VIP Setup & Fresh Flowers",
    priority: "VIP Setup",
    priorityBg: "#ede9fe",
    priorityColor: "#7c3aed",
    status: "Cleaned & Approved",
    statusColor: "#16a34a",
    statusBg: "#dcfce7",
    progress: 100,
    icon: "👑",
    assignedTime: "10:00 AM",
    notes: "VIP guest checking in at 4 PM. Flower basket setup done.",
    photoProofUrl: "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80",
    photoUploadedAt: "Today, 11:00 AM",
    approvalStatus: "Approved by Admin",
    approvedBy: "Super Admin",
  },
];

// Seed attendance and daily earnings log for monthly pay tab
const attendanceLogs = {
  "Aug 2026": [
    { date: "11 Aug 2026", day: "Tuesday", shift: "Morning (08 AM - 04 PM)", status: "Present", roomsCount: 5, dailyRate: 700, payStatus: "Received", payBg: "#dcfce7", payColor: "#15803d" },
    { date: "10 Aug 2026", day: "Monday", shift: "Morning (08 AM - 04 PM)", status: "Present", roomsCount: 6, dailyRate: 700, payStatus: "Received", payBg: "#dcfce7", payColor: "#15803d" },
    { date: "09 Aug 2026", day: "Sunday", shift: "Weekly Off", status: "Weekly Off", roomsCount: 0, dailyRate: 700, payStatus: "Off Day", payBg: "#f1f5f9", payColor: "#64748b" },
    { date: "08 Aug 2026", day: "Saturday", shift: "Morning (08 AM - 04 PM)", status: "Present", roomsCount: 5, dailyRate: 700, payStatus: "Received", payBg: "#dcfce7", payColor: "#15803d" },
    { date: "07 Aug 2026", day: "Friday", shift: "Morning (08 AM - 04 PM)", status: "Present", roomsCount: 6, dailyRate: 700, payStatus: "Received", payBg: "#dcfce7", payColor: "#15803d" },
    { date: "06 Aug 2026", day: "Thursday", shift: "Morning (08 AM - 04 PM)", status: "Present", roomsCount: 4, dailyRate: 700, payStatus: "Received", payBg: "#dcfce7", payColor: "#15803d" },
    { date: "05 Aug 2026", day: "Wednesday", shift: "Morning (08 AM - 04 PM)", status: "Present", roomsCount: 5, dailyRate: 700, payStatus: "Received", payBg: "#dcfce7", payColor: "#15803d" },
    { date: "04 Aug 2026", day: "Tuesday", shift: "Morning (08 AM - 04 PM)", status: "Present", roomsCount: 5, dailyRate: 700, payStatus: "Received", payBg: "#dcfce7", payColor: "#15803d" },
    { date: "03 Aug 2026", day: "Monday", shift: "Morning (08 AM - 04 PM)", status: "Present", roomsCount: 6, dailyRate: 700, payStatus: "Received", payBg: "#dcfce7", payColor: "#15803d" },
    { date: "02 Aug 2026", day: "Sunday", shift: "Weekly Off", status: "Weekly Off", roomsCount: 0, dailyRate: 700, payStatus: "Off Day", payBg: "#f1f5f9", payColor: "#64748b" },
    { date: "01 Aug 2026", day: "Saturday", shift: "Morning (08 AM - 04 PM)", status: "Present", roomsCount: 5, dailyRate: 700, payStatus: "Received", payBg: "#dcfce7", payColor: "#15803d" },
  ],
  "Jul 2026": [
    { date: "31 Jul 2026", day: "Friday", shift: "Morning (08 AM - 04 PM)", status: "Present", roomsCount: 5, dailyRate: 700, payStatus: "Received", payBg: "#dcfce7", payColor: "#15803d" },
    { date: "30 Jul 2026", day: "Thursday", shift: "Morning (08 AM - 04 PM)", status: "Present", roomsCount: 6, dailyRate: 700, payStatus: "Received", payBg: "#dcfce7", payColor: "#15803d" },
    { date: "29 Jul 2026", day: "Wednesday", shift: "Morning (08 AM - 04 PM)", status: "Present", roomsCount: 5, dailyRate: 700, payStatus: "Received", payBg: "#dcfce7", payColor: "#15803d" },
  ],
};

// Helper to generate bullet point tasks for any past or current calendar date (Real-time Housekeeping + Inventory sync)
function getTasksForDate(cellDate) {
  const year = cellDate.getFullYear();
  const month = cellDate.getMonth();
  const day = cellDate.getDate();

  const targetISO = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

  const today = new Date();
  const isToday =
    today.getFullYear() === year &&
    today.getMonth() === month &&
    today.getDate() === day;

  // 1. Filter real-time Housekeeping tasks for cell date
  const hkTasks = getHkTasks();
  const matchingHk = hkTasks
    .filter((t) => (t.createdDate ? t.createdDate === targetISO : isToday))
    .map((t) => {
      const isDone = t.status === "Cleaned & Approved" || (t.approvalStatus && t.approvalStatus.includes("Approved"));
      const tag = isDone ? "Completed" : "Pending";
      return `Housekeeping: ${t.room} - ${t.task} (${tag})`;
    });

  // 2. Filter real-time Inventory / Procurement tasks for cell date
  const invTasks = getInventoryTasks();
  const matchingInv = invTasks
    .filter((t) => (t.createdDate ? t.createdDate === targetISO : isToday))
    .map((t) => {
      const tag = t.status === "Completed" || t.status === "OK" ? "Completed" : "Pending";
      return `${t.title} (${tag})`;
    });

  const realTimeList = [...matchingHk, ...matchingInv];

  return realTimeList;
}

// REAL-TIME DYNAMIC CALENDAR WIDGET COMPONENT
function RealtimeCalendarWidget() {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [hoveredDateKey, setHoveredDateKey] = useState(null);
  const [hoveredCellPos, setHoveredCellPos] = useState({});
  const [liveSyncTrigger, setLiveSyncTrigger] = useState(0);

  useEffect(() => {
    const unsubHk = subscribeHkTasks(() => {
      setLiveSyncTrigger((prev) => prev + 1);
    });
    const unsubInv = subscribeInventoryTasks(() => {
      setLiveSyncTrigger((prev) => prev + 1);
    });
    return () => {
      unsubHk();
      unsubInv();
    };
  }, []);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0 - 11

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // Calculate day offsets (Monday-first alignment)
  const firstDayIndex = new Date(year, month, 1).getDay(); // 0 = Sun, 1 = Mon...
  const mondayOffset = firstDayIndex === 0 ? 6 : firstDayIndex - 1;

  const totalDays = new Date(year, month + 1, 0).getDate();
  const prevMonthTotalDays = new Date(year, month, 0).getDate();

  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();

  const cells = [];

  // Previous month padded days
  for (let i = mondayOffset - 1; i >= 0; i--) {
    const dayNum = prevMonthTotalDays - i;
    const cellDate = new Date(year, month - 1, dayNum);
    cellDate.setHours(0, 0, 0, 0);
    const isPastOrToday = cellDate.getTime() <= todayStart;
    cells.push({ day: dayNum, cellDate, type: "dim", isPastOrToday });
  }

  // Current month days
  for (let d = 1; d <= totalDays; d++) {
    const cellDate = new Date(year, month, d);
    cellDate.setHours(0, 0, 0, 0);
    const isToday = today.getFullYear() === year && today.getMonth() === month && d === today.getDate();
    const isPastOrToday = cellDate.getTime() <= todayStart;
    cells.push({ day: d, cellDate, type: isToday ? "today" : "current", isPastOrToday });
  }

  // Next month padded days
  const remaining = (7 - (cells.length % 7)) % 7;
  for (let n = 1; n <= remaining; n++) {
    const cellDate = new Date(year, month + 1, n);
    cellDate.setHours(0, 0, 0, 0);
    const isPastOrToday = cellDate.getTime() <= todayStart;
    cells.push({ day: n, cellDate, type: "dim", isPastOrToday });
  }

  const rows = [];
  for (let i = 0; i < cells.length; i += 7) {
    rows.push(cells.slice(i, i + 7));
  }

  const role = getUserRole();
  const isAdmin = role !== "guest";

  const handleMouseEnterCell = (e, cellKey, rIdx, cIdx) => {
    if (!isAdmin) return;

    const popoverPosStyle = {
      position: "absolute",
      zIndex: 9999,
      width: "280px",
      textAlign: "left",
      pointerEvents: "auto",
    };

    if (e && e.currentTarget) {
      const rect = e.currentTarget.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;

      // If space below is less than 280px AND there is more space above than below -> open UPWARDS
      if (spaceBelow < 280 && spaceAbove > spaceBelow) {
        popoverPosStyle.bottom = "calc(100% + 4px)";
      } else {
        popoverPosStyle.top = "calc(100% + 4px)";
      }
    } else {
      if (rIdx <= 1) {
        popoverPosStyle.top = "calc(100% + 4px)";
      } else {
        popoverPosStyle.bottom = "calc(100% + 4px)";
      }
    }

    if (cIdx <= 1) {
      popoverPosStyle.left = "0";
      popoverPosStyle.transform = "none";
    } else if (cIdx >= 5) {
      popoverPosStyle.right = "0";
      popoverPosStyle.left = "auto";
      popoverPosStyle.transform = "none";
    } else {
      popoverPosStyle.left = "50%";
      popoverPosStyle.transform = "translateX(-50%)";
    }

    setHoveredCellPos(popoverPosStyle);
    setHoveredDateKey(cellKey);
  };

  return (
    <div
      className="travl-card"
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        height: "100%",
        position: "relative",
      }}
    >
      <div className="travl-calendar-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <button type="button" onClick={handlePrevMonth} title="Previous Month">
            <FaChevronLeft />
          </button>
          <span style={{ fontWeight: "800", color: "var(--text-main, #0f172a)", fontSize: "15px" }}>
            {monthNames[month]} {year}
          </span>
          <button type="button" onClick={handleNextMonth} title="Next Month">
            <FaChevronRight />
          </button>
        </div>

        <button
          type="button"
          onClick={() => navigate("/calendar")}
          style={{
            background: "rgba(102, 126, 234, 0.12)",
            color: "#667eea",
            border: "none",
            borderRadius: "50%",
            width: "32px",
            height: "32px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            flexShrink: 0,
            transition: "all 0.2s ease",
          }}
          title="View Full Production & Operations Calendar"
        >
          <FaCalendarAlt style={{ fontSize: "13px" }} />
        </button>
      </div>

      <table className="travl-calendar-table">
        <thead>
          <tr>
            <th>MO</th>
            <th>TU</th>
            <th>WE</th>
            <th>TH</th>
            <th>FR</th>
            <th>SA</th>
            <th>SU</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rIdx) => (
            <tr key={rIdx}>
              {row.map((cell, cIdx) => {
                const cellKey = `${cell.cellDate.getFullYear()}-${cell.cellDate.getMonth()}-${cell.cellDate.getDate()}`;
                const isHovered = isAdmin && cell.isPastOrToday && hoveredDateKey === cellKey;
                const tasks = isHovered ? getTasksForDate(cell.cellDate) : [];
                const dateTitle = isHovered
                  ? cell.cellDate.toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })
                  : "";

                return (
                  <td
                    key={cIdx}
                    onMouseEnter={(e) => {
                      if (cell.isPastOrToday) {
                        handleMouseEnterCell(e, cellKey, rIdx, cIdx);
                      }
                    }}
                    onMouseLeave={() => setHoveredDateKey(null)}
                    style={{
                      cursor: isAdmin && cell.isPastOrToday ? "pointer" : "default",
                      position: "relative",
                    }}
                  >
                    {cell.type === "today" ? (
                      <span
                        style={{
                          background: "linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)",
                          color: "#ffffff",
                          fontWeight: "800",
                          width: "28px",
                          height: "28px",
                          borderRadius: "50%",
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          boxShadow: "0 4px 12px rgba(124, 58, 237, 0.4)",
                        }}
                      >
                        {cell.day}
                      </span>
                    ) : cell.type === "dim" ? (
                      <span className="travl-cal-dim" style={{ opacity: 0.35 }}>
                        {cell.day}
                      </span>
                    ) : (
                      <span className="travl-cal-num" style={{ transition: "all 0.15s ease" }}>
                        {cell.day}
                      </span>
                    )}

                    {isHovered && (
                      <div className="travl-cal-popover" style={hoveredCellPos}>
                        <div className="travl-cal-popover-header">
                          <strong className="travl-cal-popover-title">
                            <FaCalendarCheck className="travl-cal-popover-icon" />
                            {dateTitle}
                          </strong>
                          <span className="travl-cal-popover-badge">
                            {tasks.length} Tasks
                          </span>
                        </div>

                        <ul className="travl-cal-popover-list">
                          {tasks.slice(0, 5).map((task, idx) => {
                            const bulletColors = [
                              { dot: "#a855f7", shadow: "rgba(168, 85, 247, 0.65)" },
                              { dot: "#10b981", shadow: "rgba(16, 185, 129, 0.65)" },
                              { dot: "#f59e0b", shadow: "rgba(245, 158, 11, 0.65)" },
                              { dot: "#06b6d4", shadow: "rgba(6, 182, 212, 0.65)" },
                              { dot: "#ec4899", shadow: "rgba(236, 72, 153, 0.65)" },
                            ];
                            const color = bulletColors[idx % bulletColors.length];

                            const match = task.match(/^(.*?)(?:\s*\(([^)]+)\))?$/);
                            const mainText = match && match[1] ? match[1].trim() : task;
                            let rawTag = match && match[2] ? match[2].trim() : "Completed";

                            let tagType = "completed";
                            let displayTag = "Completed";
                            if (
                              rawTag.toLowerCase().includes("pending") ||
                              rawTag.toLowerCase().includes("clean") ||
                              rawTag.toLowerCase().includes("photo") ||
                              rawTag.toLowerCase().includes("upload") ||
                              rawTag.toLowerCase().includes("resched")
                            ) {
                              tagType = "pending";
                              displayTag = "Pending";
                            }

                            return (
                              <li key={idx} className="travl-cal-popover-item">
                                <span
                                  className="travl-cal-bullet-dot"
                                  style={{
                                    background: color.dot,
                                    boxShadow: `0 0 7px ${color.shadow}`,
                                  }}
                                />
                                <div className="travl-cal-task-content">
                                  <span className="travl-cal-task-text">
                                    {mainText}{" "}
                                    <span className={`travl-cal-status-tag ${tagType}`}>
                                      {displayTag}
                                    </span>
                                  </span>
                                </div>
                              </li>
                            );
                          })}
                        </ul>

                        <div
                          className="travl-cal-popover-footer"
                          style={{
                            borderTop: "1px solid rgba(226, 232, 240, 0.6)",
                            paddingTop: "8px",
                            marginTop: "8px",
                          }}
                        >
                          <button
                            type="button"
                            className="travl-cal-view-all-btn"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setHoveredDateKey(null);
                              navigate("/calendar");
                            }}
                            style={{
                              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                              color: "#ffffff",
                              border: "none",
                              borderRadius: "8px",
                              padding: "7px 14px",
                              fontSize: "12px",
                              fontWeight: "700",
                              cursor: "pointer",
                              width: "100%",
                              boxShadow: "0 4px 12px rgba(102, 126, 234, 0.35)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: "6px",
                            }}
                          >
                            View All
                          </button>
                        </div>
                      </div>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// HOUSEKEEPING DASHBOARD FOR HOUSEKEEPING ROLE
function HousekeepingDashboard({ userName }) {
  const [tasks, setTasks] = useState(getHkTasks());
  const [filter, setFilter] = useState("All");
  const [viewMode, setViewMode] = useState("list"); // "list" | "grid"

  // MODALS STATE
  const [uploadingTask, setUploadingTask] = useState(null); // Task object being uploaded to
  const [inspectingVideoTask, setInspectingVideoTask] = useState(null); // Task object for manager video inspection
  const [videoFile, setVideoFile] = useState(null);
  const [videoNotice, setVideoNotice] = useState("");

  // HORIZONTAL CARDS SCROLL CONTROLLER
  const cardsScrollRef = useRef(null);
  const scrollCardsLeft = () => {
    if (cardsScrollRef.current) {
      cardsScrollRef.current.scrollBy({ left: -280, behavior: "smooth" });
    }
  };
  const scrollCardsRight = () => {
    if (cardsScrollRef.current) {
      cardsScrollRef.current.scrollBy({ left: 280, behavior: "smooth" });
    }
  };


  // CREATE NEW TASK FORM STATE
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [newTaskForm, setNewTaskForm] = useState({
    floor: "1st Floor",
    room: "Room 105",
    roomType: "Standard Room",
    task: "Full Sanitize & Change Linens",
    priority: "Normal",
    staff: "Sunita Devi",
    staffEmail: "housekeeping@hotel.com",
    assignedTime: "10:30 AM",
  });

  const handleCreateTaskSubmit = (e) => {
    e.preventDefault();
    addHkTask(newTaskForm);
    setIsAddTaskOpen(false);
    setVideoNotice(`✨ New Task assigned for ${newTaskForm.room} (${newTaskForm.floor})!`);
    setTimeout(() => setVideoNotice(""), 5000);
  };

  const role = getUserRole();
  const userEmail = getUserEmail();

  // DYNAMIC EMPLOYEE NAME IDENTIFICATION
  const storedName = getUserName();
  const effectiveName =
    storedName && storedName !== "Super Admin" && storedName !== "User"
      ? storedName
      : (userName && userName !== "Super Admin" && userName !== "User"
          ? userName
          : (userEmail?.includes("sunita") || userEmail?.includes("housekeeping")
              ? "Sunita Devi"
              : userEmail?.includes("ramesh")
              ? "Ramesh Kumar"
              : userEmail?.includes("anita")
              ? "Anita Sharma"
              : userEmail?.includes("kavita")
              ? "Kavita Rao"
              : "Housekeeping Staff"));

  // LIVE CLOCK & DATE STATE
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentDateTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // DYNAMIC GREETING DATA BASED ON CURRENT TIME
  const getGreetingData = () => {
    const hour = currentDateTime.getHours();
    if (hour >= 4 && hour < 12) {
      return {
        greeting: "Good Morning",
        emoji: "🌅",
        period: "Morning Shift",
        message: "Start your shift refreshed! Have a productive and pleasant day ahead.",
      };
    } else if (hour >= 12 && hour < 17) {
      return {
        greeting: "Good Afternoon",
        emoji: "☀️",
        period: "Afternoon Shift",
        message: "Halfway through your day! Keep up the excellent work and attention to detail.",
      };
    } else if (hour >= 17 && hour < 22) {
      return {
        greeting: "Good Evening",
        emoji: "🌆",
        period: "Evening Shift",
        message: "Wrapping up today's tasks. Thank you for keeping our hotel sparkling clean!",
      };
    } else {
      return {
        greeting: "Good Night",
        emoji: "🌙",
        period: "Night Shift",
        message: "Night shift active. Stay alert, hydrated, and safe on duty.",
      };
    }
  };
  const greetingData = getGreetingData();

  // Dynamic staff identification from employees database
  const emailStr = (userEmail || "").toLowerCase().trim();
  const storedNameStr = (userName || "").toLowerCase().trim();
  const empList = getEmployees();
  const currentEmp = empList.find((e) => {
    const eEmail = (e.email || "").toLowerCase().trim();
    const eName = (e.name || "").toLowerCase().trim();
    const eUser = (e.username || "").toLowerCase().trim();
    const eStaffId = String(e.staff_id || e.staffId || e.id || "").toLowerCase().trim();
    return (
      (emailStr && (eEmail === emailStr || eUser === emailStr || emailStr.startsWith(eUser) || eStaffId === emailStr)) ||
      (effectiveName && (eName === effectiveName.toLowerCase().trim() || eUser === effectiveName.toLowerCase().trim())) ||
      (storedNameStr && (eName === storedNameStr || eUser === storedNameStr))
    );
  });

  const myStaffId = String(currentEmp?.staff_id || currentEmp?.staffId || currentEmp?.id || "").toLowerCase().trim() || "HK-101";
  const myEmail = (currentEmp?.email || emailStr || "").toLowerCase().trim();
  const myFullName = (currentEmp?.name || effectiveName || "").toLowerCase().trim();
  const myFirstName = myFullName.split(" ")[0];
  const empBranchId = currentEmp?.orgId || currentEmp?.org_id || (typeof getCurrentOrgId === "function" ? getCurrentOrgId() : "") || "MA330";
  const empBranchName = currentEmp?.org || currentEmp?.orgName || (typeof getCurrentOrg === "function" ? getCurrentOrg() : "") || "Matcha Tea";

  // STAFF ATTENDANCE / CHECK-IN PUNCH STATE PERSISTENCE
  const staffStorageKey = `hk_staff_attendance_${userEmail || "staff"}`;
  const [attendanceState, setAttendanceState] = useState(() => {
    try {
      const saved = localStorage.getItem(staffStorageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        const todayStr = new Date().toDateString();
        if (parsed.date === todayStr) {
          return parsed;
        }
      }
    } catch (e) {}
    return { isCheckedIn: false, checkInTime: null, checkOutTime: null, date: new Date().toDateString() };
  });

  const handleToggleCheckIn = async () => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const todayStr = now.toDateString();

    if (!attendanceState.isCheckedIn) {
      const updated = {
        isCheckedIn: true,
        checkInTime: timeStr,
        checkOutTime: null,
        date: todayStr,
      };
      setAttendanceState(updated);
      localStorage.setItem(staffStorageKey, JSON.stringify(updated));

      try {
        await clockInStaff({
          staffId: myStaffId,
          staffName: effectiveName,
          staffEmail: userEmail,
          shift: greetingData.period || "Morning (07:00 AM - 03:30 PM)",
          orgId: empBranchId,
          orgName: empBranchName,
        });
      } catch (e) {}

      setVideoNotice(`✅ Check-in recorded at ${timeStr}! Have a great shift, ${effectiveName}.`);
      setTimeout(() => setVideoNotice(""), 6000);
    } else {
      const confirmOut = window.confirm(`Confirm Clock Out?\n\nYou checked in at ${attendanceState.checkInTime}. Are you ready to clock out for today?`);
      if (!confirmOut) return;

      const updated = {
        isCheckedIn: false,
        checkInTime: attendanceState.checkInTime,
        checkOutTime: timeStr,
        date: todayStr,
      };
      setAttendanceState(updated);
      localStorage.setItem(staffStorageKey, JSON.stringify(updated));

      try {
        await clockOutStaff({
          staffId: myStaffId,
          staffEmail: userEmail,
          orgId: empBranchId,
        });
      } catch (e) {}

      setVideoNotice(`👋 Check-out recorded at ${timeStr}. Great work today!`);
      setTimeout(() => setVideoNotice(""), 6000);
    }
  };

  // LEAVE APPLICATION MODAL STATE
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [leaveForm, setLeaveForm] = useState({
    leaveType: "Casual Leave (CL)",
    startDate: new Date().toISOString().split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
    dayType: "Full Day",
    reason: "",
    emergencyContact: "",
  });
  const [leaveHistory, setLeaveHistory] = useState(() => {
    try {
      const saved = localStorage.getItem(`hk_leave_history_${userEmail || "staff"}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return [
      {
        id: "LV-094",
        type: "Sick Leave",
        startDate: "2026-08-09",
        endDate: "2026-08-09",
        dates: "09 Aug 2026",
        days: 1,
        status: "Approved",
        reason: "Sunday Weekly Off Rest",
      },
      {
        id: "LV-102",
        type: "Casual Leave",
        startDate: "2026-08-12",
        endDate: "2026-08-13",
        dates: "12 Aug 2026 - 13 Aug 2026",
        days: 2,
        status: "Approved",
        reason: "Family event / Personal matter",
      },
    ];
  });

  // Base salary configuration: Default 20 days working, ₹30,000 base salary
  const [baseSalary, setBaseSalary] = useState(30000);
  const [baseDays, setBaseDays] = useState(20);
  const [isSalaryConfigModalOpen, setIsSalaryConfigModalOpen] = useState(false);

  // Real-time automated salary balance calculation:
  // Rule: Except Sunday, every other leave automatically deducts ₹1,000 per day!
  const salaryData = calculateHousekeepingSalaryAndBalance({
    staffEmail: userEmail,
    staffId: myStaffId,
    baseSalary,
    baseDays,
    leavesList: leaveHistory,
  });

  const handleApplyLeaveSubmit = async (e) => {
    e.preventDefault();
    if (!leaveForm.reason.trim()) {
      alert("Please enter a reason for your leave application.");
      return;
    }

    const startObj = new Date(leaveForm.startDate);
    const endObj = new Date(leaveForm.endDate);
    const dayDiff = Math.max(1, Math.round((endObj - startObj) / (1000 * 60 * 60 * 24)) + 1);

    const newLeave = {
      id: `LV-${Math.floor(100 + Math.random() * 900)}`,
      type: leaveForm.leaveType.split(" (")[0],
      startDate: leaveForm.startDate,
      endDate: leaveForm.endDate,
      dates: leaveForm.startDate === leaveForm.endDate ? leaveForm.startDate : `${leaveForm.startDate} to ${leaveForm.endDate}`,
      days: dayDiff,
      status: "Approved",
      reason: leaveForm.reason,
      appliedAt: new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
    };

    const updatedHistory = [newLeave, ...leaveHistory];
    setLeaveHistory(updatedHistory);
    localStorage.setItem(`hk_leave_history_${userEmail || "staff"}`, JSON.stringify(updatedHistory));

    try {
      await applyStaffLeave({
        staffId: myStaffId,
        staffName: effectiveName,
        staffEmail: userEmail,
        leaveType: leaveForm.leaveType,
        startDate: leaveForm.startDate,
        endDate: leaveForm.endDate,
        reason: leaveForm.reason,
        orgId: empBranchId,
        orgName: empBranchName,
      });
    } catch (e) {}

    setIsLeaveModalOpen(false);
    setLeaveForm({
      leaveType: "Casual Leave (CL)",
      startDate: new Date().toISOString().split("T")[0],
      endDate: new Date().toISOString().split("T")[0],
      dayType: "Full Day",
      reason: "",
      emergencyContact: "",
    });
    setVideoNotice(`🎉 Leave request #${newLeave.id} submitted for supervisor approval!`);
    setTimeout(() => setVideoNotice(""), 6000);
  };

  useEffect(() => {
    const refreshTasks = async () => {
      try {
        const { tasks: freshTasks } = await fetchHkTasksFromAPI();
        if (Array.isArray(freshTasks)) setTasks(freshTasks);
      } catch (e) {
        setTasks(getHkTasks());
      }
    };
    refreshTasks();

    const unsubscribe = subscribeHkTasks((updatedTasks, eventDetail) => {
      if (Array.isArray(updatedTasks)) setTasks(updatedTasks);
      if (eventDetail?.message) {
        setVideoNotice(eventDetail.message);
        setTimeout(() => setVideoNotice(""), 6000);
      }
    });

    const interval = setInterval(refreshTasks, 2500);

    const handleStorage = (e) => {
      if (!e.key || e.key === "luxury_pms_housekeeping_tasks") {
        refreshTasks();
      }
    };
    window.addEventListener("storage", handleStorage);

    return () => {
      unsubscribe();
      clearInterval(interval);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  // STRICT EMPLOYEE ISOLATION:
  // A housekeeper ONLY sees rooms specifically assigned to them by Admin/Supervisor!
  const targetTasks = role === "housekeeping"
    ? tasks.filter((t) => {
        const tEmail = (t.staffEmail || "").toLowerCase().trim();
        const tStaff = (t.staff || "").toLowerCase().trim();
        const tStaffId = String(t.staffId || "").toLowerCase().trim();

        // 1. Check exact staff email match
        if (myEmail && tEmail && (tEmail === myEmail || tEmail.includes(myEmail) || myEmail.includes(tEmail))) return true;
        // 2. Check staff ID match (e.g. HK-101, HK-102)
        if (myStaffId && tStaffId && tStaffId === myStaffId) return true;
        // 3. Check staff full name match (e.g. Sunita Devi, Ramesh Kumar)
        if (myFullName && tStaff && (tStaff === myFullName || tStaff.includes(myFullName) || myFullName.includes(tStaff))) return true;
        // 4. Check first name match if unique and at least 3 letters
        if (myFirstName && myFirstName.length > 2 && tStaff && tStaff.includes(myFirstName)) return true;

        return false;
      })
    : tasks;

  // Active tasks list contains ONLY rooms assigned to this employee
  const activeTasksList = targetTasks;

  // ROOM CLEANING PHOTO PROOF & INSPECTION STATE
  const [inspectingPhotoTask, setInspectingPhotoTask] = useState(null);
  const [photoFilter, setPhotoFilter] = useState("All");
  const [stagedPhotoUpload, setStagedPhotoUpload] = useState(null);

  const ROOM_DEFAULT_IMAGES = {
    "Room 101": "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80",
    "Room 102": "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80",
    "Room 103": "https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=800&q=80",
    "Room 105": "https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=800&q=80",
    "Room 201": "https://images.unsplash.com/photo-1591088398332-8a7791972843?auto=format&fit=crop&w=800&q=80",
    "Room 202": "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=800&q=80",
    "Room 204": "https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=800&q=80",
    "Room 301": "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80",
  };

  const getRoomCardImage = (t) => {
    if (t.photoProofUrl) return t.photoProofUrl;
    if (t.photoProofs && t.photoProofs[0]) return t.photoProofs[0];
    const key = t.room ? String(t.room).trim() : "";
    return ROOM_DEFAULT_IMAGES[key] || ROOM_DEFAULT_IMAGES[`Room ${key}`] || "https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=800&q=80";
  };

  // Check if a task is approved
  const isApprovedTask = (t) => {
    const s = String(t.status || "").toLowerCase().trim();
    const a = String(t.approvalStatus || "").toLowerCase().trim();
    return s.includes("approved") || s === "clean" || s === "cleaned & approved" || a.includes("approved");
  };

  // Stage a photo for preview and checklist review before submitting to supervisor
  const stagePhotoForReview = (taskId, photoUrl) => {
    const foundTask = targetTasks.find((t) => String(t.id) === String(taskId)) || tasks.find((t) => String(t.id) === String(taskId));
    setStagedPhotoUpload({
      taskId,
      task: foundTask,
      photoUrl,
      remarks: "Sanitization complete with full checklist verified.",
      checklist: {
        linens: true,
        sanitized: true,
        trash: true,
        toiletries: true,
      },
    });
  };

  const handleFileInputChange = (taskId, e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result) {
        stagePhotoForReview(taskId, reader.result);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleQuickDemoProof = (taskId) => {
    const demoProofs = [
      "https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80",
    ];
    const picked = demoProofs[Math.floor(Math.random() * demoProofs.length)];
    stagePhotoForReview(taskId, picked);
  };

  // STAFF ACTION: UPLOAD PHOTO PROOF WHEN "DONE" IS CLICKED
  const handlePhotoUploadSubmit = async (taskId, photoUrl, customRemarks) => {
    const remarks = customRemarks || "Sanitization complete with full checklist verified.";
    try {
      await uploadHkPhotoProofMulti(taskId, {
        photos: [photoUrl],
        remarks,
        staffName: effectiveName,
        staffEmail: userEmail,
        staffId: myStaffId,
        orgId: empBranchId,
        orgName: empBranchName,
      });
    } catch (e) {
      console.warn("Upload proof API call error:", e);
    }

    setTasks((prev) =>
      prev.map((t) => {
        if (String(t.id) === String(taskId)) {
          return {
            ...t,
            status: "Photo Uploaded",
            photoProofUrl: photoUrl,
            photoProofs: [photoUrl],
            approvalStatus: "Pending Supervisor Approval",
            photoUploadedAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            statusBg: "#ede9fe",
            statusColor: "#7c3aed",
            housekeeperRemarks: remarks,
            staff: effectiveName,
            staffEmail: userEmail,
            staffId: myStaffId,
            orgId: empBranchId,
            orgName: empBranchName,
          };
        }
        return t;
      })
    );

    setStagedPhotoUpload(null);
    setVideoNotice(`📸 Proof photo submitted! Sent to Supervisor (${empBranchName}) for review.`);
    setTimeout(() => setVideoNotice(""), 6000);
  };

  // FILTERED ROOM CARDS:
  // Approved tasks are automatically REMOVED from active cleaning cards ("approved notify ke bhad Room Cleaning & Sanitization Tasks yha se remove hu jaye")
  const displayedCards = activeTasksList.filter((t) => {
    if (photoFilter === "Pending") {
      return !isApprovedTask(t) && !t.photoProofUrl;
    } else if (photoFilter === "Uploaded") {
      return !isApprovedTask(t) && (t.status === "Photo Uploaded" || t.photoProofUrl);
    } else if (photoFilter === "Approved") {
      return isApprovedTask(t);
    } else if (photoFilter === "Rescheduled") {
      return t.status === "Rescheduled" || t.status === "Re-cleaning Scheduled";
    }
    // "All" view: APPROVED ROOMS ARE AUTOMATICALLY REMOVED
    return !isApprovedTask(t);
  });

  const activeRemainingTasks = activeTasksList.filter((t) => !isApprovedTask(t));
  const rescheduledCount = activeTasksList.filter(
    (r) => r.status === "Rescheduled" || (r.approvalStatus && r.approvalStatus.includes("Rejected"))
  ).length;
  const approvedCount = activeTasksList.filter((r) => isApprovedTask(r)).length;
  const pendingCount = activeTasksList.filter(
    (r) => !isApprovedTask(r) && !r.photoProofUrl
  ).length;
  const uploadedCount = activeTasksList.filter(
    (r) => !isApprovedTask(r) && (r.photoProofUrl || r.status === "Photo Uploaded")
  ).length;

  const totalAssigned = activeTasksList.length;
  const activeTasksCount = activeRemainingTasks.length;
  const completedTodayCount = approvedCount;

  return (
    <div className="travl-dash-container">
      {/* FLOATING REAL-TIME NOTIFICATION ALERT */}
      {videoNotice && (
        <div
          style={{
            position: "fixed",
            top: "24px",
            right: "24px",
            zIndex: 9999,
            background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
            color: "#ffffff",
            padding: "14px 22px",
            borderRadius: "14px",
            boxShadow: "0 10px 30px rgba(16, 185, 129, 0.4)",
            display: "flex",
            alignItems: "center",
            gap: "12px",
            fontSize: "13.5px",
            fontWeight: "700",
            border: "1px solid rgba(255, 255, 255, 0.25)",
          }}
        >
          <FaCheckCircle style={{ fontSize: "18px", color: "#d1fae5" }} />
          <span>{videoNotice}</span>
          <button
            type="button"
            onClick={() => setVideoNotice("")}
            style={{
              background: "transparent",
              border: "none",
              color: "#ffffff",
              opacity: 0.85,
              cursor: "pointer",
              marginLeft: "6px",
              fontSize: "16px",
            }}
          >
            ✕
          </button>
        </div>
      )}

      {/* ROW 1: EMPLOYEE HERO GREETING BANNER WITH CORNER ACTIONS */}
          <div className="emp-hero-banner">
            <div className="emp-hero-banner-content">
              {/* TOP STATUS PILLS */}
              <div className="emp-banner-pills-row">
                <span className="emp-pill-badge">
                  <FaCalendarAlt style={{ fontSize: "11px", color: "#a5b4fc" }} />
                  {currentDateTime.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
                </span>

                <span className="emp-pill-badge">
                  <FaClock style={{ fontSize: "11px", color: "#fef08a" }} />
                  {currentDateTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                </span>

                <span className={`emp-pill-badge ${attendanceState.isCheckedIn ? "active-status" : "inactive-status"}`}>
                  <span className={attendanceState.isCheckedIn ? "emp-status-dot-pulse" : "emp-status-dot-gray"} />
                  {attendanceState.isCheckedIn ? `Checked In (${attendanceState.checkInTime})` : "Not Checked In"}
                </span>

                <span className="emp-pill-badge" style={{ background: "rgba(99, 102, 241, 0.2)", borderColor: "rgba(165, 180, 252, 0.3)", color: "#c7d2fe" }}>
                  {greetingData.period}
                </span>
              </div>

              {/* DYNAMIC TIME GREETING TITLE WITH EMPLOYEE NAME & EMOJI */}
              <h1 className="emp-banner-greeting-title">
                <span className="emp-banner-greeting-prefix">{greetingData.greeting},</span>
                <span className="emp-banner-user-name">{effectiveName}</span>
                <span style={{ fontSize: "28px", filter: "none" }}>{greetingData.emoji}</span>
              </h1>

              {/* MOTIVATIONAL / SHIFT SUBTITLE */}
              <p className="emp-banner-submessage">
                {greetingData.message}
              </p>
            </div>

            {/* SIDE CORNER ACTION BUTTONS: CHECK-IN & LEAVE */}
            <div className="emp-banner-actions-corner">
              {/* CHECK-IN / CHECK-OUT BUTTON */}
              <button
                type="button"
                className={`emp-checkin-action-btn ${attendanceState.isCheckedIn ? "clock-out" : "clock-in"}`}
                onClick={handleToggleCheckIn}
                title={attendanceState.isCheckedIn ? "Click to clock out from shift" : "Click to check in for today"}
              >
                {attendanceState.isCheckedIn ? (
                  <>
                    <FaSignOutAlt style={{ fontSize: "15px" }} />
                    <span>Clock Out</span>
                  </>
                ) : (
                  <>
                    <FaFingerprint style={{ fontSize: "16px" }} />
                    <span>Check In</span>
                  </>
                )}
              </button>

              {/* LEAVE BUTTON */}
              <button
                type="button"
                className="emp-leave-action-btn"
                onClick={() => setIsLeaveModalOpen(true)}
                title="Apply for Leave / Time-Off"
              >
                <FaUmbrellaBeach style={{ fontSize: "15px", color: "#fef08a" }} />
                <span>Leave</span>
              </button>
            </div>
          </div>

          {/* FULL WIDTH ROOM CLEANING & SANITIZATION TASKS */}
          <div className="travl-card" style={{ padding: "26px 28px", borderRadius: "22px" }}>
            {/* SECTION HEADER & QUICK FILTER BAR + SCROLL ARROWS */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div
                  style={{
                    width: "44px",
                    height: "44px",
                    borderRadius: "14px",
                    background: "linear-gradient(135deg, #6366f1 0%, #4338ca 100%)",
                    color: "#ffffff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "20px",
                    boxShadow: "0 6px 16px rgba(99, 102, 241, 0.3)",
                  }}
                >
                  <FaBroom />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: "19px", fontWeight: "800", color: "var(--text-main, #0f172a)" }}>
                    Room Cleaning & Sanitization Tasks
                  </h3>
                  <span style={{ fontSize: "12.5px", color: "#64748b" }}>
                    Sanitize assigned rooms and upload photo proof for supervisor inspection
                  </span>
                </div>
              </div>

              {/* CONTROLS: FILTER PILLS + SCROLL BUTTONS */}
              <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                {/* FILTER PILLS */}
                <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                  {[
                    { id: "All", label: `Active (${activeRemainingTasks.length})` },
                    { id: "Pending", label: `⏳ Needs Clean (${pendingCount})` },
                    { id: "Uploaded", label: `📸 Review (${uploadedCount})` },
                    { id: "Approved", label: `✨ Approved (${approvedCount})` },
                  ].map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setPhotoFilter(f.id)}
                      style={{
                        padding: "6px 14px",
                        borderRadius: "999px",
                        fontSize: "11.5px",
                        fontWeight: "700",
                        border: photoFilter === f.id ? "none" : "1px solid #e2e8f0",
                        background: photoFilter === f.id
                          ? "linear-gradient(135deg, #6366f1 0%, #4338ca 100%)"
                          : "#f8fafc",
                        color: photoFilter === f.id ? "#ffffff" : "#475569",
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                        boxShadow: photoFilter === f.id ? "0 4px 12px rgba(99, 102, 241, 0.25)" : "none",
                      }}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>

                {/* HORIZONTAL SCROLL NAVIGATION ARROW BUTTONS */}
                <div style={{ display: "flex", alignItems: "center", gap: "6px", marginLeft: "4px" }}>
                  <button
                    type="button"
                    onClick={scrollCardsLeft}
                    className="emp-scroll-nav-btn"
                    title="Scroll left"
                    aria-label="Scroll left"
                  >
                    <FaChevronLeft style={{ fontSize: "12px" }} />
                  </button>
                  <button
                    type="button"
                    onClick={scrollCardsRight}
                    className="emp-scroll-nav-btn"
                    title="Scroll right"
                    aria-label="Scroll right"
                  >
                    <FaChevronRight style={{ fontSize: "12px" }} />
                  </button>
                </div>
              </div>
            </div>

            {/* HORIZONTAL SCROLLING PHOTO CARDS TRACK */}
            {displayedCards.length === 0 ? (
              <div style={{ padding: "48px 20px", textAlign: "center", background: "#f8fafc", borderRadius: "16px", border: "1px dashed #cbd5e1" }}>
                <FaCheckCircle style={{ fontSize: "36px", color: approvedCount > 0 ? "#10b981" : "#6366f1", marginBottom: "12px" }} />
                <h4 style={{ margin: "0 0 6px", fontSize: "16px", fontWeight: "700", color: "#0f172a" }}>
                  {approvedCount > 0 && photoFilter === "All"
                    ? "🎉 All Assigned Rooms Cleaned & Approved!"
                    : activeTasksList.length === 0
                    ? "No Rooms Currently Assigned"
                    : "No Rooms in this Filter"}
                </h4>
                <p style={{ margin: 0, fontSize: "13px", color: "#64748b", maxWidth: "540px", marginLeft: "auto", marginRight: "auto" }}>
                  {approvedCount > 0 && photoFilter === "All"
                    ? `Great job ${effectiveName}! All your assigned rooms have been inspected, approved, and cleared from active tasks.`
                    : activeTasksList.length === 0
                    ? `Hello ${effectiveName}! You have no active room cleaning assignments right now. When your supervisor assigns a room to you in Housekeeping, it will appear here automatically.`
                    : "All assigned rooms for this specific filter tab have been processed."}
                </p>
              </div>
            ) : (
              <div className="emp-rooms-scroll-track" ref={cardsScrollRef}>
                {displayedCards.map((t) => {
                  const isApproved = t.status.includes("Approved");
                  const hasPhoto = !!t.photoProofUrl;
                  const isRescheduled = t.status === "Rescheduled" || t.status === "Re-cleaning Scheduled";

                  return (
                    <div
                      key={t.id}
                      className="emp-room-photo-card"
                      style={{
                        borderColor: isApproved ? "#bbf7d0" : hasPhoto ? "#ddd6fe" : isRescheduled ? "#fecaca" : "#e2e8f0",
                      }}
                    >
                      {/* TOP PHOTO HEADER - TALL HEIGHT (215px) */}
                      <div className="emp-room-photo-header">
                        <img
                          src={getRoomCardImage(t)}
                          alt={t.room}
                        />

                        {/* TOP OVERLAYS */}
                        <div className="emp-photo-overlay-top">
                          <span className="emp-photo-room-badge">
                            🛏️ {t.room}
                          </span>

                          <span
                            className={`emp-photo-status-badge ${
                              isApproved
                                ? "approved"
                                : hasPhoto
                                ? "uploaded"
                                : isRescheduled
                                ? "rescheduled"
                                : "cleaning"
                            }`}
                          >
                            {isApproved
                              ? "✨ Approved"
                              : hasPhoto
                              ? "📸 Review"
                              : isRescheduled
                              ? "🔄 Re-clean"
                              : "🧼 Clean"}
                          </span>
                        </div>

                        {/* BOTTOM OVERLAY ON IMAGE */}
                        <div
                          style={{
                            position: "absolute",
                            bottom: 0,
                            left: 0,
                            right: 0,
                            padding: "24px 12px 10px",
                            background: "linear-gradient(to top, rgba(15, 23, 42, 0.9) 0%, rgba(15, 23, 42, 0) 100%)",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "flex-end",
                          }}
                        >
                          <span style={{ fontSize: "11px", color: "#f8fafc", fontWeight: "700" }}>
                            {t.roomType || "Standard Room"}
                          </span>
                          <span
                            style={{
                              fontSize: "10.5px",
                              fontWeight: "700",
                              color: t.priority === "Urgent (Checkout)" || t.priority === "High" ? "#fca5a5" : "#fef08a",
                              background: "rgba(0, 0, 0, 0.45)",
                              padding: "2px 6px",
                              borderRadius: "6px",
                            }}
                          >
                            {t.priority === "Urgent (Checkout)" ? "⚡ Urgent" : `⚡ ${t.priority || "Normal"}`}
                          </span>
                        </div>
                      </div>

                      {/* CARD BODY CONTENT */}
                      <div style={{ padding: "14px 14px 10px", display: "flex", flexDirection: "column", gap: "8px", flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "11px", color: "#64748b" }}>
                          <span style={{ fontWeight: "600", display: "inline-flex", alignItems: "center", gap: "3px" }}>
                            <FaClock style={{ fontSize: "9px" }} />
                            {t.assignedTime || "10:00 AM"}
                          </span>
                          <span style={{ fontWeight: "700", color: "#334155" }}>
                            {t.floor || "1st Floor"}
                          </span>
                        </div>

                        <div>
                          <h4
                            style={{
                              margin: "2px 0 4px",
                              fontSize: "14.5px",
                              fontWeight: "800",
                              color: "var(--text-main, #0f172a)",
                              lineHeight: 1.35,
                              overflow: "hidden",
                              display: "-webkit-box",
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: "vertical",
                            }}
                            title={t.task}
                          >
                            {t.task}
                          </h4>

                          <p
                            style={{
                              margin: 0,
                              fontSize: "11.5px",
                              color: "#64748b",
                              lineHeight: 1.4,
                              overflow: "hidden",
                              display: "-webkit-box",
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: "vertical",
                            }}
                          >
                            {t.notes || "Sanitize surfaces, replace bedding & bath linens, inspect cleanliness checklist."}
                          </p>
                        </div>

                        {/* REJECTED / RESCHEDULED NOTICE IF ANY */}
                        {isRescheduled && (
                          <div style={{ background: "#fee2e2", border: "1px solid #fecaca", borderRadius: "8px", padding: "6px 8px", fontSize: "11px", color: "#991b1b", lineHeight: 1.3 }}>
                            <strong>⚠️ Re-clean:</strong> {t.rejectedReason || "Sanitization inspection flagged areas. Please re-clean & re-upload photo."}
                          </div>
                        )}

                        {/* SANITIZATION CHECKLIST PILLS */}
                        <div style={{ display: "flex", gap: "5px", flexWrap: "wrap", marginTop: "auto", paddingTop: "4px" }}>
                          <span style={{ fontSize: "10px", fontWeight: "700", background: "#f1f5f9", color: "#475569", padding: "2px 6px", borderRadius: "5px" }}>
                            ✓ Sanitized
                          </span>
                          <span style={{ fontSize: "10px", fontWeight: "700", background: "#f1f5f9", color: "#475569", padding: "2px 6px", borderRadius: "5px" }}>
                            ✓ Linens
                          </span>
                          <span style={{ fontSize: "10px", fontWeight: "700", background: "#f1f5f9", color: "#475569", padding: "2px 6px", borderRadius: "5px" }}>
                            ✓ Restocked
                          </span>
                        </div>
                      </div>

                      {/* CARD FOOTER: PHOTO UPLOAD ACTION */}
                      <div style={{ padding: "12px 14px", borderTop: "1px solid #f1f5f9", background: isApproved ? "#f0fdf4" : hasPhoto ? "#faf5ff" : "#f8fafc" }}>
                        {isApproved ? (
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", color: "#15803d" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "12px", fontWeight: "700" }}>
                              <FaCheckCircle style={{ color: "#16a34a" }} /> Approved
                            </div>
                            {hasPhoto && (
                              <button
                                type="button"
                                onClick={() => setInspectingPhotoTask(t)}
                                style={{
                                  padding: "5px 10px",
                                  borderRadius: "7px",
                                  border: "1px solid #bbf7d0",
                                  background: "#ffffff",
                                  color: "#15803d",
                                  fontSize: "11px",
                                  fontWeight: "700",
                                  cursor: "pointer",
                                }}
                              >
                                View Photo
                              </button>
                            )}
                          </div>
                        ) : hasPhoto ? (
                          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                            <div style={{ fontSize: "11.5px", fontWeight: "700", color: "#7c3aed", display: "flex", alignItems: "center", gap: "4px" }}>
                              <FaCheckCircle style={{ fontSize: "11px" }} /> Under Review
                            </div>

                            <div style={{ display: "flex", gap: "6px" }}>
                              <button
                                type="button"
                                onClick={() => setInspectingPhotoTask(t)}
                                style={{
                                  padding: "6px 10px",
                                  borderRadius: "8px",
                                  border: "none",
                                  background: "#7c3aed",
                                  color: "#ffffff",
                                  fontSize: "11px",
                                  fontWeight: "700",
                                  cursor: "pointer",
                                  flex: 1,
                                }}
                              >
                                View Proof
                              </button>
                              <label
                                htmlFor={`upload-photo-${t.id}`}
                                style={{
                                  padding: "6px 10px",
                                  borderRadius: "8px",
                                  border: "1px solid #cbd5e1",
                                  background: "#ffffff",
                                  color: "#475569",
                                  fontSize: "11px",
                                  fontWeight: "700",
                                  cursor: "pointer",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                }}
                                title="Re-upload photo"
                              >
                                Replace
                              </label>
                              <input
                                id={`upload-photo-${t.id}`}
                                type="file"
                                accept="image/*"
                                capture="environment"
                                style={{ display: "none" }}
                                onChange={(e) => handleFileInputChange(t.id, e)}
                              />
                            </div>
                          </div>
                        ) : (
                          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                            {/* REAL FILE PICKER BUTTON */}
                            <label
                              htmlFor={`upload-photo-${t.id}`}
                              className="emp-card-upload-btn"
                            >
                              <FaCamera style={{ fontSize: "12px" }} /> Upload Proof
                            </label>
                            <input
                              id={`upload-photo-${t.id}`}
                              type="file"
                              accept="image/*"
                              capture="environment"
                              style={{ display: "none" }}
                              onChange={(e) => handleFileInputChange(t.id, e)}
                            />

                            {/* INSTANT ONE-CLICK DEMO PROOF BUTTON */}
                            <button
                              type="button"
                              onClick={() => handleQuickDemoProof(t.id)}
                              className="emp-card-quick-btn"
                              title="Click to automatically attach clean verified room photo"
                            >
                              ⚡ Demo Proof
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
      {isAddTaskOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.7)",
            backdropFilter: "blur(6px)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
        >
          <div
            className="hk-info-box"
            style={{
              background: "var(--card-bg, #ffffff)",
              borderRadius: "20px",
              padding: "28px",
              maxWidth: "520px",
              width: "100%",
              boxShadow: "0 20px 40px rgba(0,0,0,0.3)",
              border: "1px solid #e2e8f0",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px" }}>
                  <FaPlus />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "800", color: "var(--text-color, #0f172a)" }}>
                    Assign New Cleaning Task
                  </h3>
                  <span style={{ fontSize: "12px", color: "#94a3b8" }}>Create room assignment for housekeeping</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddTaskOpen(false)}
                style={{ background: "transparent", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: "18px" }}
              >
                <FaTimes />
              </button>
            </div>

            <form onSubmit={handleCreateTaskSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: "700", display: "block", marginBottom: "4px" }}>Floor</label>
                  <select
                    value={newTaskForm.floor}
                    onChange={(e) => setNewTaskForm({ ...newTaskForm, floor: e.target.value })}
                    className="hk-dropdown"
                    style={{ width: "100%", padding: "10px 12px", borderRadius: "10px", border: "1px solid #cbd5e1" }}
                  >
                    <option value="1st Floor">1st Floor</option>
                    <option value="2nd Floor">2nd Floor</option>
                    <option value="3rd Floor">3rd Floor</option>
                    <option value="4th Floor">4th Floor</option>
                    <option value="5th Floor">5th Floor</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: "12px", fontWeight: "700", display: "block", marginBottom: "4px" }}>Room Number</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Room 105"
                    value={newTaskForm.room}
                    onChange={(e) => setNewTaskForm({ ...newTaskForm, room: e.target.value })}
                    className="hk-search-input"
                    style={{ width: "100%", padding: "10px 12px", borderRadius: "10px", border: "1px solid #cbd5e1" }}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: "700", display: "block", marginBottom: "4px" }}>Room Type</label>
                  <select
                    value={newTaskForm.roomType}
                    onChange={(e) => setNewTaskForm({ ...newTaskForm, roomType: e.target.value })}
                    className="hk-dropdown"
                    style={{ width: "100%", padding: "10px 12px", borderRadius: "10px", border: "1px solid #cbd5e1" }}
                  >
                    <option value="Standard Room">Standard Room</option>
                    <option value="Deluxe Room">Deluxe Room</option>
                    <option value="Deluxe Suite">Deluxe Suite</option>
                    <option value="Executive Suite">Executive Suite</option>
                    <option value="Penthouse Villa">Penthouse Villa</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: "12px", fontWeight: "700", display: "block", marginBottom: "4px" }}>Priority</label>
                  <select
                    value={newTaskForm.priority}
                    onChange={(e) => setNewTaskForm({ ...newTaskForm, priority: e.target.value })}
                    className="hk-dropdown"
                    style={{ width: "100%", padding: "10px 12px", borderRadius: "10px", border: "1px solid #cbd5e1" }}
                  >
                    <option value="Normal">Normal</option>
                    <option value="Urgent (Checkout)">Urgent (Checkout)</option>
                    <option value="High Priority">High Priority</option>
                    <option value="VIP Setup">VIP Setup</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: "12px", fontWeight: "700", display: "block", marginBottom: "4px" }}>Task Description</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Full Sanitize & Change Linens"
                  value={newTaskForm.task}
                  onChange={(e) => setNewTaskForm({ ...newTaskForm, task: e.target.value })}
                  className="hk-search-input"
                  style={{ width: "100%", padding: "10px 12px", borderRadius: "10px", border: "1px solid #cbd5e1" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: "700", display: "block", marginBottom: "4px" }}>Assigned Staff</label>
                  <select
                    value={newTaskForm.staffEmail}
                    onChange={(e) => {
                      const email = e.target.value;
                      const name = email.includes("sunita") || email.includes("housekeeping") ? "Sunita Devi" : email.includes("ramesh") ? "Ramesh Kumar" : email.includes("anita") ? "Anita Sharma" : "Kavita Rao";
                      setNewTaskForm({ ...newTaskForm, staffEmail: email, staff: name });
                    }}
                    className="hk-dropdown"
                    style={{ width: "100%", padding: "10px 12px", borderRadius: "10px", border: "1px solid #cbd5e1" }}
                  >
                    <option value="housekeeping@hotel.com">Sunita Devi (housekeeping@hotel.com)</option>
                    <option value="ramesh@hotel.com">Ramesh Kumar (ramesh@hotel.com)</option>
                    <option value="anita@hotel.com">Anita Sharma (anita@hotel.com)</option>
                    <option value="kavita@hotel.com">Kavita Rao (kavita@hotel.com)</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: "12px", fontWeight: "700", display: "block", marginBottom: "4px" }}>Assigned Time</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 10:30 AM"
                    value={newTaskForm.assignedTime}
                    onChange={(e) => setNewTaskForm({ ...newTaskForm, assignedTime: e.target.value })}
                    className="hk-search-input"
                    style={{ width: "100%", padding: "10px 12px", borderRadius: "10px", border: "1px solid #cbd5e1" }}
                  />
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "12px" }}>
                <button
                  type="button"
                  onClick={() => setIsAddTaskOpen(false)}
                  style={{ padding: "10px 18px", borderRadius: "10px", border: "1px solid #cbd5e1", background: "transparent", cursor: "pointer", fontWeight: "600" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: "10px 22px",
                    borderRadius: "10px",
                    border: "none",
                    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    color: "#ffffff",
                    fontWeight: "700",
                    cursor: "pointer",
                    boxShadow: "0 4px 14px rgba(102, 126, 234, 0.4)",
                  }}
                >
                  + Create & Assign Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PHOTO PROOF INSPECTION MODAL */}
      {inspectingPhotoTask && (
        <div
          className="modal-backdrop"
          onClick={() => setInspectingPhotoTask(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.75)",
            backdropFilter: "blur(8px)",
            zIndex: 1400,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
        >
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: "600px",
              width: "100%",
              background: "#ffffff",
              borderRadius: "20px",
              overflow: "hidden",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.4)",
            }}
          >
            {/* Header */}
            <div
              style={{
                padding: "18px 22px",
                background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)",
                color: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "10px",
                    background: "rgba(255, 255, 255, 0.15)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "16px",
                  }}
                >
                  <FaCamera style={{ color: "#a5b4fc" }} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: "17px", fontWeight: "700" }}>
                    {inspectingPhotoTask.room} Sanitization Proof
                  </h3>
                  <span style={{ fontSize: "12px", color: "#c7d2fe" }}>
                    {inspectingPhotoTask.floor || "1st Floor"} • {inspectingPhotoTask.roomType || "Standard Room"}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setInspectingPhotoTask(null)}
                style={{
                  background: "rgba(255, 255, 255, 0.12)",
                  border: "none",
                  color: "#e0e7ff",
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

            {/* Photo Body */}
            <div style={{ padding: "20px" }}>
              <div
                style={{
                  width: "100%",
                  height: "320px",
                  borderRadius: "14px",
                  overflow: "hidden",
                  background: "#0f172a",
                  boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
                  position: "relative",
                }}
              >
                <img
                  src={inspectingPhotoTask.photoProofUrl || getRoomCardImage(inspectingPhotoTask)}
                  alt="Proof inspection"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
                <div
                  style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    padding: "16px 14px",
                    background: "linear-gradient(to top, rgba(15, 23, 42, 0.85) 0%, rgba(15, 23, 42, 0) 100%)",
                    display: "flex",
                    justifyContent: "space-between",
                    color: "#ffffff",
                    fontSize: "12px",
                  }}
                >
                  <span>👤 Staff: {inspectingPhotoTask.staff || effectiveName}</span>
                  <span>🕒 {inspectingPhotoTask.photoUploadedAt || "Uploaded Today"}</span>
                </div>
              </div>

              {/* Status and Notes */}
              <div style={{ marginTop: "16px", display: "flex", flexDirection: "column", gap: "10px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "12px", color: "#64748b", fontWeight: "600" }}>Review Status:</span>
                  <span
                    style={{
                      padding: "4px 12px",
                      borderRadius: "999px",
                      fontSize: "11.5px",
                      fontWeight: "700",
                      background: inspectingPhotoTask.status?.includes("Approved") ? "#dcfce7" : "#ede9fe",
                      color: inspectingPhotoTask.status?.includes("Approved") ? "#15803d" : "#7c3aed",
                    }}
                  >
                    {inspectingPhotoTask.status?.includes("Approved") ? "✨ Approved & Verified" : "📸 Under Supervisor Review"}
                  </span>
                </div>

                <div style={{ background: "#f8fafc", padding: "12px 14px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                  <div style={{ fontSize: "11.5px", fontWeight: "700", color: "#475569", marginBottom: "4px" }}>
                    Task: {inspectingPhotoTask.task}
                  </div>
                  <p style={{ margin: 0, fontSize: "12px", color: "#64748b" }}>
                    {inspectingPhotoTask.notes || inspectingPhotoTask.housekeeperRemarks || "Sanitization complete with full checklist verified."}
                  </p>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "18px" }}>
                <button
                  type="button"
                  onClick={() => setInspectingPhotoTask(null)}
                  style={{
                    padding: "9px 22px",
                    borderRadius: "10px",
                    border: "none",
                    background: "linear-gradient(135deg, #4338ca 0%, #312e81 100%)",
                    color: "#ffffff",
                    fontWeight: "700",
                    fontSize: "13px",
                    cursor: "pointer",
                  }}
                >
                  Close Photo
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PHOTO PROOF VERIFICATION & DONE SUBMISSION MODAL */}
      {stagedPhotoUpload && (
        <div
          className="modal-backdrop"
          onClick={() => setStagedPhotoUpload(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.75)",
            backdropFilter: "blur(8px)",
            zIndex: 1500,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
        >
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: "560px",
              width: "100%",
              background: "#ffffff",
              borderRadius: "22px",
              overflow: "hidden",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.4)",
              display: "flex",
              flexDirection: "column",
              maxHeight: "92vh",
            }}
          >
            {/* Header */}
            <div
              style={{
                padding: "18px 22px",
                background: "linear-gradient(135deg, #4338ca 0%, #312e81 100%)",
                color: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div
                  style={{
                    width: "38px",
                    height: "38px",
                    borderRadius: "12px",
                    background: "rgba(255, 255, 255, 0.2)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "18px",
                  }}
                >
                  📸
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: "17px", fontWeight: "800" }}>
                    Room Photo Proof Verification
                  </h3>
                  <span style={{ fontSize: "12px", color: "#c7d2fe" }}>
                    Review captured proof before submitting for inspection
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setStagedPhotoUpload(null)}
                style={{ background: "transparent", border: "none", color: "#ffffff", cursor: "pointer", fontSize: "20px", opacity: 0.8 }}
              >
                ✕
              </button>
            </div>

            {/* Body */}
            <div style={{ padding: "20px 22px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "16px" }}>
              {/* Room & Branch Meta Pill */}
              <div
                style={{
                  background: "#f8fafc",
                  borderRadius: "14px",
                  padding: "12px 16px",
                  border: "1px solid #e2e8f0",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "10px",
                }}
              >
                <div>
                  <span style={{ fontSize: "16px", fontWeight: "800", color: "#0f172a" }}>
                    🛏️ {stagedPhotoUpload.task?.room || "Room"}
                  </span>
                  <div style={{ fontSize: "12px", color: "#64748b" }}>
                    {stagedPhotoUpload.task?.floor || "Floor"} • {stagedPhotoUpload.task?.roomType || "Standard Room"}
                  </div>
                </div>
                <span
                  style={{
                    padding: "4px 10px",
                    borderRadius: "8px",
                    background: "#ede9fe",
                    color: "#6d28d9",
                    fontSize: "12px",
                    fontWeight: "800",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "5px",
                  }}
                >
                  🏢 {empBranchName} ({empBranchId})
                </span>
              </div>

              {/* Captured Photo Preview */}
              <div
                style={{
                  height: "220px",
                  borderRadius: "14px",
                  overflow: "hidden",
                  position: "relative",
                  background: "#0f172a",
                  boxShadow: "inset 0 0 20px rgba(0,0,0,0.5)",
                }}
              >
                <img
                  src={stagedPhotoUpload.photoUrl}
                  alt="Proof Preview"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
                <div
                  style={{
                    position: "absolute",
                    bottom: "10px",
                    left: "12px",
                    background: "rgba(15, 23, 42, 0.8)",
                    backdropFilter: "blur(4px)",
                    color: "#ffffff",
                    padding: "4px 10px",
                    borderRadius: "6px",
                    fontSize: "11px",
                    fontWeight: "700",
                  }}
                >
                  Captured Photo • Ready for Inspection
                </div>
              </div>

              {/* Sanitization Checklist */}
              <div>
                <label style={{ fontSize: "12.5px", fontWeight: "800", color: "#1e293b", display: "block", marginBottom: "8px" }}>
                  ✓ Sanitization & Cleanliness Checklist:
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                  {[
                    { id: "linens", label: "Fresh Linens & Bed Made" },
                    { id: "sanitized", label: "Surfaces & Tiles Sanitized" },
                    { id: "trash", label: "Trash Bins Cleared" },
                    { id: "toiletries", label: "Toiletries Restocked" },
                  ].map((item) => (
                    <label
                      key={item.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        fontSize: "12px",
                        fontWeight: "600",
                        color: "#334155",
                        background: "#f1f5f9",
                        padding: "8px 10px",
                        borderRadius: "8px",
                        cursor: "pointer",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={stagedPhotoUpload.checklist[item.id]}
                        onChange={(e) =>
                          setStagedPhotoUpload((prev) => ({
                            ...prev,
                            checklist: { ...prev.checklist, [item.id]: e.target.checked },
                          }))
                        }
                        style={{ accentColor: "#4338ca", width: "15px", height: "15px" }}
                      />
                      <span>{item.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Housekeeper Remarks Input */}
              <div>
                <label style={{ fontSize: "12.5px", fontWeight: "800", color: "#1e293b", display: "block", marginBottom: "6px" }}>
                  Housekeeper Remarks / Notes:
                </label>
                <input
                  type="text"
                  value={stagedPhotoUpload.remarks}
                  onChange={(e) =>
                    setStagedPhotoUpload((prev) => ({ ...prev, remarks: e.target.value }))
                  }
                  placeholder="e.g. Bedding changed, floor mopped, mirror polished..."
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: "10px",
                    border: "1px solid #cbd5e1",
                    fontSize: "13px",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>
            </div>

            {/* Footer Actions */}
            <div
              style={{
                padding: "16px 22px",
                borderTop: "1px solid #e2e8f0",
                background: "#f8fafc",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "12px",
              }}
            >
              <button
                type="button"
                onClick={() => setStagedPhotoUpload(null)}
                style={{
                  padding: "10px 18px",
                  borderRadius: "10px",
                  border: "1px solid #cbd5e1",
                  background: "#ffffff",
                  color: "#475569",
                  fontWeight: "700",
                  fontSize: "13px",
                  cursor: "pointer",
                }}
              >
                Cancel / Retake
              </button>

              <button
                type="button"
                onClick={() =>
                  handlePhotoUploadSubmit(
                    stagedPhotoUpload.taskId,
                    stagedPhotoUpload.photoUrl,
                    stagedPhotoUpload.remarks
                  )
                }
                style={{
                  padding: "12px 26px",
                  borderRadius: "12px",
                  border: "none",
                  background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                  color: "#ffffff",
                  fontWeight: "800",
                  fontSize: "14px",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  boxShadow: "0 6px 18px rgba(16, 185, 129, 0.4)",
                  transition: "all 0.2s ease",
                }}
              >
                <FaCheckCircle style={{ fontSize: "16px" }} />
                <span>Done - Submit for Inspection (चेक के लिए भेजें)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LEAVE APPLICATION MODAL */}
      {isLeaveModalOpen && (
        <div
          className="modal-backdrop"
          onClick={() => setIsLeaveModalOpen(false)}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(15, 23, 42, 0.65)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1300,
            padding: "20px",
          }}
        >
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: "540px",
              width: "100%",
              background: "#ffffff",
              borderRadius: "20px",
              overflow: "hidden",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.35)",
            }}
          >
            {/* MODAL HEADER */}
            <div
              style={{
                padding: "20px 24px",
                background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)",
                color: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div
                  style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "12px",
                    background: "rgba(255, 255, 255, 0.15)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "18px",
                  }}
                >
                  <FaCalendarPlus style={{ color: "#fef08a" }} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: "17px", fontWeight: "700" }}>Apply for Leave</h3>
                  <span style={{ fontSize: "12px", color: "#c7d2fe" }}>Submit request to hotel supervisor</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsLeaveModalOpen(false)}
                style={{
                  background: "rgba(255,255,255,0.12)",
                  border: "none",
                  color: "#e0e7ff",
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

            {/* MODAL BODY */}
            <form onSubmit={handleApplyLeaveSubmit} style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
              {/* LEAVE BALANCE SUMMARY PILLS */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
                <div style={{ padding: "10px", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "10px", textAlign: "center" }}>
                  <span style={{ fontSize: "11px", color: "#166534", fontWeight: "600", display: "block" }}>Casual (CL)</span>
                  <strong style={{ fontSize: "16px", color: "#15803d" }}>4 Days</strong>
                </div>
                <div style={{ padding: "10px", background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: "10px", textAlign: "center" }}>
                  <span style={{ fontSize: "11px", color: "#1e40af", fontWeight: "600", display: "block" }}>Sick (SL)</span>
                  <strong style={{ fontSize: "16px", color: "#2563eb" }}>6 Days</strong>
                </div>
                <div style={{ padding: "10px", background: "#faf5ff", border: "1px solid #e9d5ff", borderRadius: "10px", textAlign: "center" }}>
                  <span style={{ fontSize: "11px", color: "#6b21a8", fontWeight: "600", display: "block" }}>Privilege (PL)</span>
                  <strong style={{ fontSize: "16px", color: "#7c3aed" }}>12 Days</strong>
                </div>
              </div>

              {/* APPLICANT INFO ROW */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: "700", color: "#334155", display: "block", marginBottom: "5px" }}>
                    Staff Name
                  </label>
                  <input
                    type="text"
                    disabled
                    value={effectiveName}
                    style={{
                      width: "100%",
                      padding: "9px 12px",
                      borderRadius: "10px",
                      border: "1px solid #cbd5e1",
                      background: "#f8fafc",
                      color: "#475569",
                      fontSize: "13px",
                      fontWeight: "600",
                      boxSizing: "border-box",
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: "12px", fontWeight: "700", color: "#334155", display: "block", marginBottom: "5px" }}>
                    Leave Type
                  </label>
                  <select
                    value={leaveForm.leaveType}
                    onChange={(e) => setLeaveForm({ ...leaveForm, leaveType: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "9px 12px",
                      borderRadius: "10px",
                      border: "1px solid #cbd5e1",
                      fontSize: "13px",
                      background: "#ffffff",
                      boxSizing: "border-box",
                    }}
                  >
                    <option value="Casual Leave (CL)">Casual Leave (CL)</option>
                    <option value="Sick Leave (SL)">Sick Leave (SL)</option>
                    <option value="Privilege / Earned Leave (PL)">Privilege / Earned Leave (PL)</option>
                    <option value="Half Day Leave">Half Day Leave</option>
                    <option value="Emergency Leave">Emergency Leave</option>
                  </select>
                </div>
              </div>

              {/* DATE RANGE ROW */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: "700", color: "#334155", display: "block", marginBottom: "5px" }}>
                    From Date
                  </label>
                  <input
                    type="date"
                    required
                    value={leaveForm.startDate}
                    onChange={(e) => setLeaveForm({ ...leaveForm, startDate: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "9px 12px",
                      borderRadius: "10px",
                      border: "1px solid #cbd5e1",
                      fontSize: "13px",
                      boxSizing: "border-box",
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: "12px", fontWeight: "700", color: "#334155", display: "block", marginBottom: "5px" }}>
                    To Date
                  </label>
                  <input
                    type="date"
                    required
                    value={leaveForm.endDate}
                    onChange={(e) => setLeaveForm({ ...leaveForm, endDate: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "9px 12px",
                      borderRadius: "10px",
                      border: "1px solid #cbd5e1",
                      fontSize: "13px",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
              </div>

              {/* REASON TEXTAREA */}
              <div>
                <label style={{ fontSize: "12px", fontWeight: "700", color: "#334155", display: "block", marginBottom: "5px" }}>
                  Reason for Leave *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="e.g. Urgent family matter / doctor check-up..."
                  value={leaveForm.reason}
                  onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: "10px",
                    border: "1px solid #cbd5e1",
                    fontSize: "13px",
                    resize: "vertical",
                    boxSizing: "border-box",
                    fontFamily: "inherit",
                  }}
                />
              </div>

              {/* RECENT LEAVE STATUS ACCORDION */}
              <div style={{ background: "#f8fafc", padding: "12px 14px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                <span style={{ fontSize: "11px", fontWeight: "700", color: "#64748b", display: "block", marginBottom: "6px" }}>
                  Recent Applications ({leaveHistory.length})
                </span>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px", maxHeight: "100px", overflowY: "auto" }}>
                  {leaveHistory.map((item) => (
                    <div key={item.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "11.5px" }}>
                      <span style={{ color: "#334155" }}><strong>{item.type}</strong> ({item.dates})</span>
                      <span style={{
                        padding: "2px 8px",
                        borderRadius: "999px",
                        fontSize: "10.5px",
                        fontWeight: "700",
                        background: item.status.includes("Approved") ? "#dcfce7" : "#fef3c7",
                        color: item.status.includes("Approved") ? "#15803d" : "#b45309",
                      }}>
                        {item.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* MODAL ACTION BUTTONS */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "4px" }}>
                <button
                  type="button"
                  onClick={() => setIsLeaveModalOpen(false)}
                  style={{
                    padding: "10px 18px",
                    borderRadius: "10px",
                    border: "1px solid #cbd5e1",
                    background: "#ffffff",
                    color: "#475569",
                    fontWeight: "600",
                    fontSize: "13px",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: "10px 22px",
                    borderRadius: "10px",
                    border: "none",
                    background: "linear-gradient(135deg, #4338ca 0%, #312e81 100%)",
                    color: "#ffffff",
                    fontWeight: "700",
                    fontSize: "13px",
                    cursor: "pointer",
                    boxShadow: "0 4px 14px rgba(49, 46, 129, 0.3)",
                  }}
                >
                  Submit Leave Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const role = getUserRole();
  const userName = getUserName() || "Super Admin";

  // DYNAMIC DARK / LIGHT MODE DETECTOR FOR HERO BANNER
  const [theme, setTheme] = useState(
    document.documentElement.getAttribute("data-theme") || "light"
  );

  useEffect(() => {
    const observer = new MutationObserver(() => {
      const currentTheme =
        document.documentElement.getAttribute("data-theme") || "light";
      setTheme(currentTheme);
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    return () => observer.disconnect();
  }, []);

  const isDark = theme === "dark";

  // LIVE CLOCK & DATE STATE FOR HERO BANNER
  const [dashDateTime, setDashDateTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setDashDateTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // REAL USER / EMPLOYEE NAME RESOLUTION
  const userEmail = getUserEmail();
  const storedName = getUserName();
  const empList = getEmployees();
  const currentEmp = empList.find((e) => {
    const eEmail = (e.email || "").toLowerCase().trim();
    const eName = (e.name || "").toLowerCase().trim();
    const uEmail = (userEmail || "").toLowerCase().trim();
    return (uEmail && eEmail === uEmail) || (storedName && eName === storedName.toLowerCase().trim());
  });
  const displayName = currentEmp?.name || (storedName && storedName !== "User" ? storedName : (role === "accountant" ? "Accountant" : (userName || "Admin")));

  const myStaffId = String(currentEmp?.staff_id || currentEmp?.staffId || currentEmp?.id || "").toLowerCase().trim() || (role === "accountant" ? "ACC-101" : "ADM-101");
  const empBranchId = currentEmp?.orgId || currentEmp?.org_id || (typeof getCurrentOrgId === "function" ? getCurrentOrgId() : "") || "JP01";
  const empBranchName = currentEmp?.org || currentEmp?.orgName || (typeof getCurrentOrg === "function" ? getCurrentOrg() : "") || "Jaipur Branch";

  // STAFF ATTENDANCE PUNCH STATE
  const staffStorageKey = `staff_attendance_${userEmail || "current"}`;
  const [attendanceState, setAttendanceState] = useState(() => {
    try {
      const saved = localStorage.getItem(staffStorageKey) || localStorage.getItem(`hk_staff_attendance_${userEmail || "staff"}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.date === new Date().toDateString()) return parsed;
      }
    } catch (e) {}
    return { isCheckedIn: false, checkInTime: null, checkOutTime: null, date: new Date().toDateString() };
  });

  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [leaveNotice, setLeaveNotice] = useState("");
  const [leaveForm, setLeaveForm] = useState({
    leaveType: "Casual Leave (CL)",
    startDate: new Date().toISOString().split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
    dayType: "Full Day",
    reason: "",
  });

  // GREETING DATA BASED ON CURRENT TIME
  const getDashGreeting = () => {
    const hour = dashDateTime.getHours();
    if (hour >= 4 && hour < 12) {
      return { greeting: "Good Morning", emoji: "🌅", period: "Morning Shift", message: "Start your day refreshed! Have a productive and pleasant day ahead." };
    } else if (hour >= 12 && hour < 17) {
      return { greeting: "Good Afternoon", emoji: "☀️", period: "Afternoon Shift", message: "Halfway through your day! Keep up the excellent work and attention to detail." };
    } else if (hour >= 17 && hour < 22) {
      return { greeting: "Good Evening", emoji: "🌆", period: "Evening Shift", message: "Wrapping up today's operations. Reviewing daily financials & activity." };
    } else {
      return { greeting: "Good Night", emoji: "🌙", period: "Night Shift", message: "Night shift active. Reviewing system logs and reports." };
    }
  };
  const greetingInfo = getDashGreeting();

  const handleToggleCheckIn = async () => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const todayStr = now.toDateString();

    if (!attendanceState.isCheckedIn) {
      const updated = {
        isCheckedIn: true,
        checkInTime: timeStr,
        checkOutTime: null,
        date: todayStr,
      };
      setAttendanceState(updated);
      localStorage.setItem(staffStorageKey, JSON.stringify(updated));
      window.dispatchEvent(new Event("staff_attendance_changed"));

      try {
        await clockInStaff({
          staffId: myStaffId,
          staffName: displayName,
          staffEmail: userEmail,
          shift: greetingInfo.period || "Morning Shift",
          orgId: empBranchId,
          orgName: empBranchName,
        });
      } catch (e) {}

      setLeaveNotice(`✅ Check-in recorded at ${timeStr}! Have a great shift, ${displayName}.`);
      setTimeout(() => setLeaveNotice(""), 6000);
    } else {
      const confirmOut = window.confirm(`Confirm Clock Out?\n\nYou checked in at ${attendanceState.checkInTime}. Are you ready to clock out for today?`);
      if (!confirmOut) return;

      const updated = {
        isCheckedIn: false,
        checkInTime: attendanceState.checkInTime,
        checkOutTime: timeStr,
        date: todayStr,
      };
      setAttendanceState(updated);
      localStorage.setItem(staffStorageKey, JSON.stringify(updated));
      window.dispatchEvent(new Event("staff_attendance_changed"));

      try {
        await clockOutStaff({
          staffId: myStaffId,
          staffEmail: userEmail,
          orgId: empBranchId,
        });
      } catch (e) {}

      setLeaveNotice(`👋 Check-out recorded at ${timeStr}. Great work today!`);
      setTimeout(() => setLeaveNotice(""), 6000);
    }
  };

  const handleApplyLeaveSubmit = async (e) => {
    e.preventDefault();
    if (!leaveForm.reason.trim()) {
      alert("Please enter a reason for your leave application.");
      return;
    }

    try {
      await applyStaffLeave({
        staffId: myStaffId,
        staffName: displayName,
        staffEmail: userEmail,
        leaveType: leaveForm.leaveType,
        startDate: leaveForm.startDate,
        endDate: leaveForm.endDate,
        reason: leaveForm.reason,
        orgId: empBranchId,
        orgName: empBranchName,
      });
    } catch (err) {}

    setIsLeaveModalOpen(false);
    setLeaveForm({
      leaveType: "Casual Leave (CL)",
      startDate: new Date().toISOString().split("T")[0],
      endDate: new Date().toISOString().split("T")[0],
      dayType: "Full Day",
      reason: "",
      emergencyContact: "",
    });
    setLeaveNotice(`🎉 Leave request submitted successfully for approval!`);
    setTimeout(() => setLeaveNotice(""), 6000);
  };

  // LIVE ROOMS AND CUSTOMERS DATA FOR STATS
  const [roomsData, setRoomsData] = useState(() => getRooms());
  const [customersData, setCustomersData] = useState(() => getCustomers());
  const [bookingsData, setBookingsData] = useState([]);

  const calculateLiveKpiStats = (rList, cList) => {
    const rooms = Array.isArray(rList) && rList.length > 0 ? rList : getRooms();
    const customers = Array.isArray(cList) && cList.length > 0 ? cList : getCustomers();

    const totalRoomsCount = rooms.length;

    const availableCount = rooms.filter(
      (r) => (r.status || "").toLowerCase() === "available"
    ).length;

    const occupiedCount = rooms.filter(
      (r) => (r.status || "").toLowerCase() === "occupied"
    ).length;

    const cleaningCount = rooms.filter(
      (r) => (r.status || "").toLowerCase() === "cleaning"
    ).length;

    const soldOutCount = occupiedCount + cleaningCount;

    const activeReservationsCount = Math.max(
      occupiedCount,
      customers.filter((c) => ["active", "checked in", "confirmed", "occupied"].includes((c.status || "").toLowerCase())).length
    );

    return {
      totalRooms: totalRoomsCount.toString(),
      totalBooking: totalRoomsCount.toLocaleString("en-IN"),
      newBooking: activeReservationsCount.toLocaleString("en-IN"),
      availableRooms: availableCount.toString(),
      soldOutRooms: soldOutCount.toString(),
      todayDateStr: new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
    };
  };

  // REAL-TIME DYNAMIC DASHBOARD STATS REFRESH ON LOGIN
  const [kpiStats, setKpiStats] = useState(() => calculateLiveKpiStats(getRooms(), getCustomers()));

  const [currentOrgStatus, setCurrentOrgStatus] = useState(() => getCurrentOrgStatus());

  useEffect(() => {
    async function syncOrgStatus() {
      const currentOrg = getCurrentOrg();
      const currentOrgId = getCurrentOrgId();
      if (!currentOrg) return;
      try {
        const res = await fetch("http://localhost:4000/api/organizations");
        if (res.ok) {
          const data = await res.json();
          if (data && data.success && Array.isArray(data.organizations)) {
            const matched = data.organizations.find(
              (o) =>
                (o.name && o.name.trim().toLowerCase() === currentOrg.trim().toLowerCase()) ||
                (o.orgId && o.orgId === currentOrgId) ||
                (o.org_id && o.org_id === currentOrgId)
            );
            if (matched && matched.status) {
              setCurrentOrgStatus(matched.status);
              sessionStorage.setItem("currentOrgStatus", matched.status);
            }
          }
        }
      } catch (e) {
        console.error("Org status sync error in Dashboard:", e);
      }
    }

    syncOrgStatus();
  }, []);

  const isOrgActive = (currentOrgStatus || "active").toLowerCase() === "active";

  const [hkPendingCount, setHkPendingCount] = useState(0);

  // RESERVATION STATS TIMEFRAME STATE ("Weekly" | "Monthly")
  const [statsTimeframe, setStatsTimeframe] = useState("Weekly");

  // REAL RESERVATION STATS (CHECK-IN / CHECK-OUT ACTIVITY) FROM BACKEND
  const [reservationStats, setReservationStats] = useState({
    totalCheckIn: 0,
    totalCheckOut: 0,
    data: [],
  });
  const [isStatsLoading, setIsStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState(null);

  const fetchReservationStats = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setStatsError(null);
      const activeOrgId = getCurrentOrgId() || "";
      const url = `http://localhost:4000/api/dashboard/revenue-report?timeframe=${encodeURIComponent(statsTimeframe)}${activeOrgId ? `&org_id=${encodeURIComponent(activeOrgId)}` : ""}`;
      const res = await fetch(url, {
        headers: {
          "Authorization": `Bearer ${sessionStorage.getItem("authToken") || ""}`,
          "x-org-id": activeOrgId,
        },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (json && json.success) {
        setReservationStats({
          totalCheckIn: Number(json.totalCheckIn || 0),
          totalCheckOut: Number(json.totalCheckOut || 0),
          data: Array.isArray(json.data) ? json.data : [],
        });
        setStatsError(null);
      } else {
        throw new Error(json?.message || "Failed to load report");
      }
    } catch (err) {
      console.warn("Failed to fetch reservation stats:", err);
      if (!isSilent) {
        setStatsError("Unable to load revenue report.");
      }
    } finally {
      setIsStatsLoading(false);
    }
  }, [statsTimeframe]);

  const refreshLiveStatsFromBackend = async () => {
    try {
      const [apiRooms, latestCustomers, latestBookings] = await Promise.all([
        fetchRoomsFromApi(), fetchCustomersFromAPI(), fetchAllBookings(),
      ]);
      if (Array.isArray(latestCustomers)) setCustomersData(latestCustomers);
      if (Array.isArray(latestBookings)) setBookingsData(latestBookings);
      if (apiRooms && Array.isArray(apiRooms) && apiRooms.length > 0) {
        setRoomsData(apiRooms);
        setKpiStats(calculateLiveKpiStats(apiRooms, latestCustomers));
      } else {
        const localRooms = getRooms();
        setRoomsData(localRooms);
        setKpiStats(calculateLiveKpiStats(localRooms, latestCustomers));
      }
      // Silently refresh the chart activity stats in background poll
      fetchReservationStats(true);
    } catch (e) {
      const localRooms = getRooms();
      setRoomsData(localRooms);
      setKpiStats(calculateLiveKpiStats(localRooms, getCustomers()));
    }
  };

  useEffect(() => {
    setIsStatsLoading(true);
    fetchReservationStats(false);
  }, [fetchReservationStats]);

  useEffect(() => {
    refreshLiveStatsFromBackend();

    const intervalId = setInterval(() => {
      refreshLiveStatsFromBackend();
    }, 2000);

    const unsubscribe = subscribeHkTasks((updatedTasks) => {
      const livePending = updatedTasks.filter(
        (t) => t.status === "Photo Uploaded" || t.status === "Video Uploaded" || (t.approvalStatus && t.approvalStatus.includes("Pending"))
      ).length;
      setHkPendingCount(livePending);
      refreshLiveStatsFromBackend();
    });

    return () => {
      clearInterval(intervalId);
      unsubscribe();
    };
  }, [role, userName, fetchReservationStats]);

  const activeReservationData = reservationStats.data || [];
  const totalCheckIn = reservationStats.totalCheckIn || 0;
  const totalCheckOut = reservationStats.totalCheckOut || 0;

  const maxVal = Math.max(
    1,
    ...activeReservationData.map((d) => Math.max(d.checkIn || 0, d.checkOut || 0))
  );
  const yAxisLimit = Math.max(2, Math.ceil(maxVal * 1.25));

  const [kpiModal, setKpiModal] = useState(null); // 'total_booking' | 'new_booking' | 'available_rooms' | 'sold_out_rooms'
  const [row2Modal, setRow2Modal] = useState(null); // 'promo_report' | 'total_concierge' | 'total_customer' | 'total_room' | 'total_transition'

  // Financial Audit State
  const [financialAudit, setFinancialAudit] = useState({
    totalTransactions: 0,
    roomBookings: 0,
    posOrders: 0,
    amenitiesLaundry: 0
  });
  const [isAuditLoading, setIsAuditLoading] = useState(false);
  const [auditError, setAuditError] = useState(null);

  useEffect(() => {
    if (row2Modal === "total_transition") {
      const fetchAudit = async () => {
        setIsAuditLoading(true);
        setAuditError(null);
        try {
          const orgId = getCurrentOrgId() || "AS435";
          const res = await fetch(`http://localhost:4000/api/dashboard/financial-audit?org_id=${orgId}`, {
            headers: {
              "Authorization": `Bearer ${sessionStorage.getItem("token") || ""}`,
              "x-org-id": orgId
            }
          });
          const data = await res.json();
          if (data.success) {
            setFinancialAudit(data.data);
          } else {
            setAuditError(data.message || "Failed to load audit data");
          }
        } catch (err) {
          setAuditError("Unable to load financial audit data.");
        } finally {
          setIsAuditLoading(false);
        }
      };
      fetchAudit();
    }
  }, [row2Modal]);

  const [selectedBarData, setSelectedBarData] = useState(null);
  const [activeStatFilter, setActiveStatFilter] = useState("all"); // 'all' | 'checkIn' | 'checkOut'
  const [selectedStatPoint, setSelectedStatPoint] = useState(null); // { type: 'checkIn' | 'checkOut', label: string, total: number }
  const [reportGenerating, setReportGenerating] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);
  const [selectedReportYear, setSelectedReportYear] = useState("2026");
  const [row3FeedModal, setRow3FeedModal] = useState(null);
  const [row3GaugeModal, setRow3GaugeModal] = useState(null);
  const [hkSalaryModal, setHkSalaryModal] = useState(false);
  const [hkAttendanceModal, setHkAttendanceModal] = useState(false);

  const handleDownloadReport = async () => {
    setReportGenerating(true);
    setReportSuccess(false);

    try {
      const orgId = getCurrentOrgId();
      const response = await fetch(`http://localhost:4000/api/dashboard/annual-report?org_id=${orgId}&year=${selectedReportYear}`);
      const result = await response.json();
      
      if (!result.success || !result.data || result.data.length === 0) {
        alert("No report data available for " + selectedReportYear + ".");
        setReportGenerating(false);
        return;
      }

      let csvContent = "data:text/csv;charset=utf-8,";
      csvContent += "Timeframe,CheckIn,CheckOut,Est_Revenue(INR),OccupancyRate\n";
      
      result.data.forEach((row) => {
        csvContent += `${row.timeframe},${row.checkIn},${row.checkOut},${row.revenue},${row.occupancyRate}\n`;
      });

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `Travl_Annual_Operations_Report_${selectedReportYear}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setReportSuccess(true);
    } catch (error) {
      console.error("Failed to generate report:", error);
      alert("Unable to generate the annual report. Please try again.");
    } finally {
      setReportGenerating(false);
    }
  };

  // IF LOGGED IN USER IS HOUSEKEEPING, RENDER THE HOUSEKEEPING DASHBOARD
  if (role === "housekeeping") {
    return <HousekeepingDashboard userName={userName} key={`hk_${userName}`} />;
  }

  // DYNAMIC TOP 3 POPULAR ROOMS FROM ROOMS TAB / STORE
  const allRoomsList = Array.isArray(roomsData) && roomsData.length > 0 ? roomsData : getRooms();
  const liveCustomersCount = Array.isArray(customersData) ? customersData.length : 0;
  const liveRoomsCount = allRoomsList.length;
  const liveTransactionsTotal = (Array.isArray(bookingsData) ? bookingsData : []).reduce(
    (total, booking) => total + Number(booking.amountPaid ?? booking.amount_paid ?? booking.totalBill ?? 0), 0
  );
  const liveConciergeCount = Array.isArray(bookingsData) ? bookingsData.length : 0;
  const popularRoomsFiltered = allRoomsList.filter(
    (r) => r.isPopular || r.badge === "Popular" || (r.rating && Number(r.rating) >= 4.5)
  );
  const displayPopularRooms = (
    popularRoomsFiltered.length >= 3
      ? popularRoomsFiltered
      : [...popularRoomsFiltered, ...allRoomsList.filter((r) => !popularRoomsFiltered.includes(r))]
  ).slice(0, 3);

  // DEFAULT SUPER ADMIN / MANAGER / FRONT DESK DASHBOARD VIEW
  return (
    <div className="travl-dash-container" key={`dash_${role}_${userName}`}>
      {/* HERO WELCOME BANNER WITH PREMIUM GRADIENT & LIVE DATA */}
      <div className="emp-hero-banner">
        <div className="emp-hero-banner-content">
          {/* TOP STATUS PILLS */}
          <div className="emp-banner-pills-row">
            <span className="emp-pill-badge">
              <FaCalendarAlt style={{ fontSize: "11px", color: "#a5b4fc" }} />
              {dashDateTime.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
            </span>

            <span className="emp-pill-badge">
              <FaClock style={{ fontSize: "11px", color: "#fef08a" }} />
              {dashDateTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            </span>

            <span className={`emp-pill-badge ${attendanceState.isCheckedIn ? "active-status" : "inactive-status"}`}>
              <span className={attendanceState.isCheckedIn ? "emp-status-dot-pulse" : "emp-status-dot-gray"} />
              {attendanceState.isCheckedIn ? `Checked In (${attendanceState.checkInTime})` : "Not Checked In"}
            </span>

            <span className="emp-pill-badge" style={{ background: "rgba(99, 102, 241, 0.2)", borderColor: "rgba(165, 180, 252, 0.3)", color: "#c7d2fe" }}>
              {greetingInfo.period}
            </span>
          </div>

          {/* DYNAMIC GREETING TITLE WITH REAL LOGGED IN NAME */}
          <h1 className="emp-banner-greeting-title">
            <span className="emp-banner-greeting-prefix">{greetingInfo.greeting},</span>
            <span className="emp-banner-user-name">{displayName}</span>
            <span style={{ fontSize: "28px", filter: "none" }}>{greetingInfo.emoji}</span>
          </h1>

          {/* REAL PROPERTY OVERVIEW MESSAGE */}
          <p className="emp-banner-submessage">
            {role === "accountant"
              ? "Here's your real-time financial and property operations overview for today."
              : greetingInfo.message}
          </p>
        </div>

        {/* SIDE CORNER ACTION BUTTONS: CHECK-IN & LEAVE */}
        <div className="emp-banner-actions-corner">
          {/* CHECK-IN / CHECK-OUT BUTTON */}
          <button
            type="button"
            className={`emp-checkin-action-btn ${attendanceState.isCheckedIn ? "clock-out" : "clock-in"}`}
            onClick={handleToggleCheckIn}
            title={attendanceState.isCheckedIn ? "Click to clock out from shift" : "Click to check in for today"}
          >
            {attendanceState.isCheckedIn ? (
              <>
                <FaSignOutAlt style={{ fontSize: "15px" }} />
                <span>Clock Out</span>
              </>
            ) : (
              <>
                <FaFingerprint style={{ fontSize: "16px" }} />
                <span>Check In</span>
              </>
            )}
          </button>

          {/* LEAVE BUTTON */}
          <button
            type="button"
            className="emp-leave-action-btn"
            onClick={() => setIsLeaveModalOpen(true)}
            title="Apply for Leave / Time-Off"
          >
            <FaUmbrellaBeach style={{ fontSize: "15px", color: "#fef08a" }} />
            <span>Leave</span>
          </button>
        </div>
      </div>

      {/* NOTICE TOAST */}
      {leaveNotice && (
        <div
          style={{
            marginBottom: "16px",
            background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
            color: "#ffffff",
            padding: "12px 20px",
            borderRadius: "14px",
            boxShadow: "0 8px 24px rgba(16, 185, 129, 0.35)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: "13.5px",
            fontWeight: "700",
          }}
        >
          <span>{leaveNotice}</span>
          <button
            type="button"
            onClick={() => setLeaveNotice("")}
            style={{ background: "transparent", border: "none", color: "#ffffff", cursor: "pointer", fontSize: "15px" }}
          >
            ✕
          </button>
        </div>
      )}

      {/* LEAVE APPLICATION MODAL */}
      {isLeaveModalOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(15, 23, 42, 0.75)",
            backdropFilter: "blur(6px)",
            zIndex: 999999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
          onClick={() => setIsLeaveModalOpen(false)}
        >
          <div
            style={{
              background: isDark ? "#1e293b" : "#ffffff",
              borderRadius: "20px",
              padding: "26px 28px",
              maxWidth: "480px",
              width: "100%",
              boxShadow: "0 20px 45px rgba(0,0,0,0.3)",
              border: isDark ? "1px solid rgba(255,255,255,0.1)" : "1px solid #e2e8f0",
              color: isDark ? "#ffffff" : "#0f172a",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ padding: "8px 10px", borderRadius: "10px", background: "#fef3c7", fontSize: "16px" }}>🏖️</span>
                <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "800" }}>Apply for Leave / Time-Off</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsLeaveModalOpen(false)}
                style={{ background: "transparent", border: "none", color: isDark ? "#94a3b8" : "#64748b", fontSize: "16px", cursor: "pointer" }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleApplyLeaveSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label style={{ fontSize: "12px", fontWeight: "700", color: isDark ? "#cbd5e1" : "#475569", display: "block", marginBottom: "5px" }}>Leave Type</label>
                <select
                  value={leaveForm.leaveType}
                  onChange={(e) => setLeaveForm({ ...leaveForm, leaveType: e.target.value })}
                  style={{ width: "100%", padding: "9px 12px", borderRadius: "10px", border: isDark ? "1px solid #334155" : "1px solid #cbd5e1", background: isDark ? "#0f172a" : "#ffffff", color: isDark ? "#ffffff" : "#0f172a", fontSize: "13px" }}
                >
                  <option value="Casual Leave (CL)">Casual Leave (CL)</option>
                  <option value="Sick Leave (SL)">Sick Leave (SL)</option>
                  <option value="Privilege Leave (PL)">Privilege Leave (PL)</option>
                  <option value="Emergency Leave">Emergency Leave</option>
                </select>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: "700", color: isDark ? "#cbd5e1" : "#475569", display: "block", marginBottom: "5px" }}>Start Date</label>
                  <input
                    type="date"
                    value={leaveForm.startDate}
                    onChange={(e) => setLeaveForm({ ...leaveForm, startDate: e.target.value })}
                    style={{ width: "100%", padding: "9px 12px", borderRadius: "10px", border: isDark ? "1px solid #334155" : "1px solid #cbd5e1", background: isDark ? "#0f172a" : "#ffffff", color: isDark ? "#ffffff" : "#0f172a", fontSize: "13px", boxSizing: "border-box" }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: "700", color: isDark ? "#cbd5e1" : "#475569", display: "block", marginBottom: "5px" }}>End Date</label>
                  <input
                    type="date"
                    value={leaveForm.endDate}
                    onChange={(e) => setLeaveForm({ ...leaveForm, endDate: e.target.value })}
                    style={{ width: "100%", padding: "9px 12px", borderRadius: "10px", border: isDark ? "1px solid #334155" : "1px solid #cbd5e1", background: isDark ? "#0f172a" : "#ffffff", color: isDark ? "#ffffff" : "#0f172a", fontSize: "13px", boxSizing: "border-box" }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: "12px", fontWeight: "700", color: isDark ? "#cbd5e1" : "#475569", display: "block", marginBottom: "5px" }}>Reason for Leave</label>
                <textarea
                  rows="3"
                  value={leaveForm.reason}
                  onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                  placeholder="Explain reason for taking leave..."
                  style={{ width: "100%", padding: "9px 12px", borderRadius: "10px", border: isDark ? "1px solid #334155" : "1px solid #cbd5e1", background: isDark ? "#0f172a" : "#ffffff", color: isDark ? "#ffffff" : "#0f172a", fontSize: "13px", boxSizing: "border-box", resize: "vertical" }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "4px" }}>
                <button
                  type="button"
                  onClick={() => setIsLeaveModalOpen(false)}
                  style={{ padding: "9px 16px", borderRadius: "10px", border: isDark ? "1px solid #334155" : "1px solid #cbd5e1", background: "transparent", color: isDark ? "#cbd5e1" : "#475569", fontWeight: "600", fontSize: "13px", cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: "9px 20px", borderRadius: "10px", border: "none", background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)", color: "#ffffff", fontWeight: "700", fontSize: "13px", cursor: "pointer", boxShadow: "0 4px 14px rgba(99,102,241,0.4)" }}
                >
                  Submit Application
                </button>
              </div>
            </form>
          </div>
        </div>
      )}


      {/* ROW 1: TOP 4 UNIFORM KPI CARDS */}
      <div className="travl-kpi-grid">
        <KpiStatCard
          icon={<FaBox />}
          iconBg="#eef2ff"
          iconColor="#5b67ea"
          badgeText="+14%"
          badgeBg="#dcfce7"
          badgeColor="#10b981"
          chartData={[40, 55, 45, 70, 65, 85, 95]}
          chartColor="#667eea"
          chartColorEnd="#764ba2"
          title="Total Bookings"
          number={kpiStats.totalBooking}
          onClick={() => setKpiModal("total_booking")}
          tooltip="Click for Total Booking Breakdown"
        />

        <KpiStatCard
          icon={<FaCalendarAlt />}
          iconBg="#eef2ff"
          iconColor="#5b67ea"
          badgeText="+8%"
          badgeBg="#dcfce7"
          badgeColor="#10b981"
          chartData={[30, 40, 60, 50, 75, 80, 90]}
          chartColor="#667eea"
          chartColorEnd="#764ba2"
          title="Active Reservations"
          number={kpiStats.newBooking}
          onClick={() => setKpiModal("new_booking")}
          tooltip="Click for New Booking Activity Feed"
        />

        <KpiStatCard
          icon={<FaBed />}
          iconBg="#eef2ff"
          iconColor="#5b67ea"
          badgeText="Ready"
          badgeBg="#dbeafe"
          badgeColor="#2563eb"
          chartData={[80, 70, 60, 50, 65, 55, 45]}
          chartColor="#667eea"
          chartColorEnd="#764ba2"
          title="Available Rooms"
          number={kpiStats.availableRooms}
          onClick={() => setKpiModal("available_rooms")}
          tooltip="Click for Available Rooms Breakdown"
        />

        <KpiStatCard
          icon={<FaCheckDouble />}
          iconBg="#eef2ff"
          iconColor="#5b67ea"
          badgeText="Active"
          badgeBg="#fef3c7"
          badgeColor="#d97706"
          chartData={[20, 35, 45, 60, 70, 85, 88]}
          chartColor="#667eea"
          chartColorEnd="#764ba2"
          title="Occupied / Cleaning"
          number={kpiStats.soldOutRooms}
          onClick={() => setKpiModal("sold_out_rooms")}
          tooltip="Click for Occupied Rooms Breakdown"
        />
      </div>



      {/* ROW 2: MIDDLE SPLIT SECTION */}
      <div className="travl-middle-row">
        {/* LEFT: RESERVATION STATS DIVERGING BAR CHART (IMAGE 1 LAYOUT) */}
        <div className="travl-card" style={{ padding: "24px", borderRadius: "20px" }}>
          {/* HEADER CONTROL */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
            <div>
              <span style={{ fontSize: "12px", fontWeight: "600", color: isDark ? "#94a3b8" : "#64748b", display: "block", marginBottom: "2px" }}>
                Statistics
              </span>
              <h3 style={{ margin: 0, fontSize: "20px", fontWeight: "800", color: isDark ? "#ffffff" : "#0f172a" }}>
                Check-In & Check-Out Activity
              </h3>
            </div>

            <select
              value={statsTimeframe}
              onChange={(e) => setStatsTimeframe(e.target.value)}
              style={{
                padding: "6px 14px",
                borderRadius: "10px",
                border: isDark ? "1px solid #334155" : "1px solid #cbd5e1",
                fontSize: "12.5px",
                fontWeight: "700",
                color: isDark ? "#60a5fa" : "#2563eb",
                background: isDark ? "#1e293b" : "#f8fafc",
                cursor: "pointer",
                outline: "none",
                transition: "all 0.2s ease",
              }}
            >
              <option value="Weekly" style={{ background: isDark ? "#1e293b" : "#ffffff", color: isDark ? "#ffffff" : "#0f172a" }}>Weekly</option>
              <option value="Monthly" style={{ background: isDark ? "#1e293b" : "#ffffff", color: isDark ? "#ffffff" : "#0f172a" }}>Monthly</option>
            </select>
          </div>

          {/* ERROR ALERT */}
          {statsError && (
            <div
              style={{
                padding: "10px 14px",
                borderRadius: "10px",
                background: isDark ? "rgba(239, 68, 68, 0.15)" : "#fef2f2",
                border: "1px solid rgba(239, 68, 68, 0.3)",
                color: "#ef4444",
                fontSize: "12.5px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "12px",
              }}
            >
              <span>⚠️ {statsError}</span>
              <button
                type="button"
                onClick={() => {
                  setIsStatsLoading(true);
                  fetchReservationStats(false);
                }}
                style={{
                  padding: "4px 12px",
                  borderRadius: "6px",
                  background: "#ef4444",
                  color: "#ffffff",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "11px",
                  fontWeight: "700",
                }}
              >
                Retry
              </button>
            </div>
          )}

          {/* EMPTY STATE BANNER */}
          {!isStatsLoading && !statsError && totalCheckIn === 0 && totalCheckOut === 0 && (
            <div
              style={{
                textAlign: "center",
                padding: "8px 12px",
                borderRadius: "8px",
                background: isDark ? "rgba(148, 163, 184, 0.1)" : "#f8fafc",
                color: isDark ? "#94a3b8" : "#64748b",
                fontSize: "12px",
                fontStyle: "italic",
                marginBottom: "10px",
                border: isDark ? "1px dashed #334155" : "1px dashed #e2e8f0",
              }}
            >
              No check-in or check-out activity for this period.
            </div>
          )}

          {/* LEGEND BADGES */}
          <div style={{ display: "flex", gap: "20px", marginBottom: "16px", flexWrap: "wrap", alignItems: "center" }}>
            <div
              className="clickable"
              onClick={() => setActiveStatFilter(activeStatFilter === "checkIn" ? "all" : "checkIn")}
              style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}
              title="Click to toggle Check in"
            >
              <span
                style={{
                  width: "12px",
                  height: "12px",
                  borderRadius: "4px",
                  background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
                  display: "inline-block",
                  boxShadow: activeStatFilter === "checkIn" ? "0 0 8px rgba(59, 130, 246, 0.6)" : "none",
                }}
              />
              <span style={{ fontSize: "13px", fontWeight: "700", color: activeStatFilter === "checkIn" ? "#2563eb" : (isDark ? "#cbd5e1" : "#64748b") }}>
                Check in {isStatsLoading ? "..." : totalCheckIn.toLocaleString("en-IN")}
              </span>
            </div>

            <div
              className="clickable"
              onClick={() => setActiveStatFilter(activeStatFilter === "checkOut" ? "all" : "checkOut")}
              style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}
              title="Click to toggle Check out"
            >
              <span
                style={{
                  width: "12px",
                  height: "12px",
                  borderRadius: "4px",
                  background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                  display: "inline-block",
                  boxShadow: activeStatFilter === "checkOut" ? "0 0 8px rgba(245, 158, 11, 0.6)" : "none",
                }}
              />
              <span style={{ fontSize: "13px", fontWeight: "700", color: activeStatFilter === "checkOut" ? "#d97706" : (isDark ? "#cbd5e1" : "#64748b") }}>
                Check out {isStatsLoading ? "..." : totalCheckOut.toLocaleString("en-IN")}
              </span>
            </div>
          </div>

          {/* DIVERGING CAPSULE BAR CHART WITH RELATIVE SKELETON / LOADING WRAPPER */}
          <div style={{ position: "relative", width: "100%", height: 270 }}>
            {isStatsLoading && (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: isDark ? "rgba(15, 23, 42, 0.7)" : "rgba(255, 255, 255, 0.7)",
                  backdropFilter: "blur(2px)",
                  zIndex: 10,
                  borderRadius: "14px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexDirection: "column",
                  gap: "10px",
                }}
              >
                <div
                  style={{
                    width: "26px",
                    height: "26px",
                    border: "3px solid #3b82f6",
                    borderTopColor: "transparent",
                    borderRadius: "50%",
                    animation: "spin 0.8s linear infinite",
                  }}
                />
                <span style={{ fontSize: "12px", fontWeight: "600", color: isDark ? "#94a3b8" : "#64748b" }}>
                  Loading real activity...
                </span>
              </div>
            )}

            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={activeReservationData}
                margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
                barGap={0}
                stackOffset="sign"
                onClick={(state) => {
                  if (state && state.activePayload && state.activePayload.length) {
                    setSelectedBarData(state.activePayload[0].payload);
                  }
                }}
              >
                <defs>
                  <linearGradient id="checkInBarGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={1} />
                    <stop offset="100%" stopColor="#2563eb" stopOpacity={1} />
                  </linearGradient>
                  <linearGradient id="checkOutBarGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#fbbf24" stopOpacity={1} />
                    <stop offset="100%" stopColor="#d97706" stopOpacity={1} />
                  </linearGradient>
                </defs>

                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? "rgba(255, 255, 255, 0.06)" : "#f1f5f9"} />
                <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: isDark ? "#94a3b8" : "#94a3b8", fontSize: 12, fontWeight: 600 }} />
                <YAxis
                  domain={[-yAxisLimit, yAxisLimit]}
                  allowDecimals={false}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => Math.abs(val)}
                  tick={{ fill: isDark ? "#94a3b8" : "#94a3b8", fontSize: 11 }}
                />
                <ReferenceLine y={0} stroke={isDark ? "rgba(255, 255, 255, 0.15)" : "#e2e8f0"} strokeWidth={1} />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div
                          style={{
                            background: isDark ? "#0f172a" : "#ffffff",
                            color: isDark ? "#ffffff" : "#0f172a",
                            padding: "12px 16px",
                            borderRadius: "14px",
                            boxShadow: "0 10px 25px rgba(0,0,0,0.25)",
                            border: isDark ? "1px solid #334155" : "1px solid #e2e8f0",
                            fontSize: "12.5px",
                          }}
                        >
                          <div style={{ fontWeight: "800", color: "#3b82f6", marginBottom: "6px", fontSize: "14px" }}>
                            📅 {label} Overview
                          </div>
                          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", gap: "16px" }}>
                              <span style={{ color: "#3b82f6", fontWeight: "600" }}>📥 Check-Ins:</span>
                              <strong>{data.checkIn} guests</strong>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", gap: "16px" }}>
                              <span style={{ color: "#d97706", fontWeight: "600" }}>📤 Check-Outs:</span>
                              <strong>{data.checkOut} guests</strong>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", gap: "16px", borderTop: isDark ? "1px solid #334155" : "1px solid #f1f5f9", paddingTop: "4px", marginTop: "2px" }}>
                              <span style={{ color: "#10b981", fontWeight: "600" }}>💰 Est. Revenue:</span>
                              <strong style={{ color: "#10b981" }}>₹{data.revenue?.toLocaleString("en-IN")}</strong>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", gap: "16px" }}>
                              <span style={{ color: isDark ? "#94a3b8" : "#64748b", fontWeight: "600" }}>🏨 Occupancy Rate:</span>
                              <strong style={{ color: "#3b82f6" }}>{data.occupancyRate}</strong>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                  cursor={{ fill: isDark ? "rgba(59, 130, 246, 0.08)" : "rgba(59, 130, 246, 0.05)" }}
                />
                <Bar
                  dataKey="checkIn"
                  name="Check in"
                  fill="url(#checkInBarGrad)"
                  stackId="stack"
                  barSize={12}
                  radius={[10, 10, 0, 0]}
                  cursor="pointer"
                  hide={activeStatFilter === "checkOut"}
                />
                <Bar
                  dataKey="checkOutNeg"
                  name="Check out"
                  fill="url(#checkOutBarGrad)"
                  stackId="stack"
                  barSize={12}
                  radius={[0, 0, 10, 10]}
                  cursor="pointer"
                  hide={activeStatFilter === "checkIn"}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* RIGHT: PROMO BANNER & 4 MINI STAT CARDS */}
        <div className="travl-card">
          <div
            className="travl-promo-banner clickable"
            onClick={() => setRow2Modal("promo_report")}
            style={{ cursor: "pointer" }}
            title="Click to generate Annual Operations & Financial Report"
          >
            <div>
              <h3 className="travl-promo-title">
                Let Travl Generate Your Annually Report Easily
              </h3>
              <p className="travl-promo-sub">
                Click to compile and download automated annual revenue & occupancy reports
              </p>
            </div>
            <button
              className="travl-arrow-circle-btn"
              type="button"
              onClick={(e) => { e.stopPropagation(); setRow2Modal("promo_report"); }}
              title="Click to generate Annual Operations & Revenue Report"
              style={{ cursor: "pointer" }}
            >
              ↗
            </button>
          </div>

          <div className="travl-4cards-grid">
            <div
              className="travl-mini-stat-box clickable"
              onClick={() => setRow2Modal("total_concierge")}
              title="Click to view Concierge Operations & Requests"
              style={{ cursor: "pointer" }}
            >
              <div className="travl-mini-stat-top">
                <div className="travl-kpi-icon-circle">
                  <FaUserCheck />
                </div>
                <span className="travl-mini-stat-val">{liveConciergeCount.toLocaleString("en-IN")}</span>
              </div>
              <span className="travl-mini-stat-lbl">Total Concierge</span>
            </div>

            <div
              className="travl-mini-stat-box clickable"
              onClick={() => setRow2Modal("total_customer")}
              title="Click to view Guest & Customer Database"
              style={{ cursor: "pointer" }}
            >
              <div className="travl-mini-stat-top">
                <div className="travl-kpi-icon-circle">
                  <FaUserFriends />
                </div>
                <span className="travl-mini-stat-val">{liveCustomersCount.toLocaleString("en-IN")}</span>
              </div>
              <span className="travl-mini-stat-lbl">Total Customer</span>
            </div>

            <div
              className="travl-mini-stat-box clickable"
              onClick={() => setRow2Modal("total_room")}
              title="Click to view Property Room Inventory"
              style={{ cursor: "pointer" }}
            >
              <div className="travl-mini-stat-top">
                <div className="travl-kpi-icon-circle">
                  <FaBox />
                </div>
                <span className="travl-mini-stat-val">{liveRoomsCount.toLocaleString("en-IN")}</span>
              </div>
              <span className="travl-mini-stat-lbl">Total Room</span>
            </div>

            <div
              className="travl-mini-stat-box clickable"
              onClick={() => setRow2Modal("total_transition")}
              title="Click to view Financial Transactions Audit Log"
              style={{ cursor: "pointer" }}
            >
              <div className="travl-mini-stat-top">
                <div className="travl-kpi-icon-circle">
                  <FaHistory />
                </div>
                <span className="travl-mini-stat-val">{liveTransactionsTotal.toLocaleString("en-IN", { notation: "compact", maximumFractionDigits: 1 })}</span>
              </div>
              <span className="travl-mini-stat-lbl">Total Transaction</span>
            </div>
          </div>
        </div>
      </div>

      {/* ROW 3: BOTTOM 3 COLUMNS SECTION */}
      <div className="travl-bottom-row">
        {/* COLUMN 1: REAL-TIME CALENDAR WIDGET */}
        <RealtimeCalendarWidget />

        {/* COLUMN 2: ROOM STATUS FEEDS - TOP 3 POPULAR ROOMS FROM ROOMS TAB */}
        <div className="travl-room-feeds">
          {displayPopularRooms.map((r, idx) => {
            const rawName = r.name || r.type || "Luxury Suite";
            const roomName = rawName.replace(/^Room\s*\d+\s*[-•:]*\s*/i, "").replace(/^\d+\s*[-•:]*\s*/, "").trim() || r.type || "Luxury Suite";
            const roomType = r.type || "Deluxe Suite";
            const roomImg = r.image || (Array.isArray(r.images) ? r.images[0] : r.images) || "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=200&q=80";
            const guestName = r.booking?.guestName || r.guestName || (r.status === "Occupied" ? "Aarav Sharma" : "Guest Reservation");
            const timeAgo = ["2min ago", "12min ago", "24min ago"][idx % 3];
            const status = r.status || "Available";
            const notes = r.description || r.shortDescription || `${roomType} • ${r.beds || "1 King Bed"} • Rating ${r.rating || 4.8}★`;
            const avatar = r.booking?.avatar || ["https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=80&q=80", "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=80&q=80", "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=80&q=80"][idx % 3];

            return (
              <div
                key={r.id || idx}
                className="travl-room-feed-card clickable"
                onClick={() =>
                  setRow3FeedModal({
                    title: roomName,
                    guest: guestName,
                    time: timeAgo,
                    status: status,
                    roomType: roomType,
                    notes: notes,
                    avatar: avatar,
                    img: roomImg,
                  })
                }
                title={`Click to view ${roomName} details & guest status`}
                style={{ cursor: "pointer" }}
              >
                <img
                  src={roomImg}
                  alt={roomName}
                  className="travl-room-img"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=200&q=80";
                  }}
                />
                <div className="travl-room-feed-info">
                  <div className="travl-room-feed-header">
                    <h4 className="travl-room-feed-title">{roomName}</h4>
                  </div>
                  <div className="travl-room-feed-details">
                    <img
                      src={avatar}
                      alt={guestName}
                      className="travl-guest-avatar-mini"
                    />
                    <strong>{guestName}</strong> • {timeAgo} • {status} • {roomType}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* COLUMN 3: GAUGES DONUT CARDS */}
        <div className="travl-gauge-cards">
          <div
            className="travl-gauge-card clickable"
            onClick={() => setRow3GaugeModal("available")}
            title="Click for Real-time Available Rooms Breakdown"
            style={{ cursor: "pointer" }}
          >
            <h4>Available Room Today</h4>
            <div className="travl-semi-donut">
              <svg viewBox="0 0 100 50">
                <path
                  className="travl-gauge-track"
                  d="M 10 50 A 40 40 0 0 1 90 50"
                  fill="none"
                  stroke="#e0e7ff"
                  strokeWidth="12"
                  strokeLinecap="round"
                />
                <path
                  d="M 10 50 A 40 40 0 0 1 80 20"
                  fill="none"
                  stroke="#667eea"
                  strokeWidth="12"
                  strokeLinecap="round"
                />
              </svg>
              <span className="travl-gauge-value">{kpiStats.availableRooms}</span>
            </div>
          </div>

          <div
            className="travl-gauge-card clickable"
            onClick={() => setRow3GaugeModal("sold_out")}
            title="Click for Real-time Sold Out & Occupancy Gauge Breakdown"
            style={{ cursor: "pointer" }}
          >
            <h4>Sold Out Room Today</h4>
            <div className="travl-semi-donut">
              <svg viewBox="0 0 100 50">
                <path
                  className="travl-gauge-track"
                  d="M 10 50 A 40 40 0 0 1 90 50"
                  fill="none"
                  stroke="#e0e7ff"
                  strokeWidth="12"
                  strokeLinecap="round"
                />
                <path
                  d="M 10 50 A 40 40 0 0 1 50 10"
                  fill="none"
                  stroke="#764ba2"
                  strokeWidth="12"
                  strokeLinecap="round"
                />
              </svg>
              <span className="travl-gauge-value">{kpiStats.soldOutRooms || "0"}</span>
            </div>
          </div>
        </div>
      </div>

      {/* DRILLDOWN MODAL 1: TOTAL BOOKING */}
      {kpiModal === "total_booking" && (
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
              maxWidth: "540px",
              padding: "24px 28px",
              boxShadow: "0 20px 40px rgba(0,0,0,0.25)",
              animation: "modalFadeIn 0.2s ease-out",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
              <div>
                <h2 className="ota-modal-title" style={{ margin: 0, fontSize: "20px", fontWeight: "800", display: "flex", alignItems: "center", gap: "8px" }}>
                  <FaBox style={{ color: "#3b82f6" }} /> Total Booking Overview
                </h2>
                <span style={{ fontSize: "12px", opacity: 0.75 }}>
                  Total Recorded Bookings: <strong style={{ color: "#3b82f6" }}>{kpiStats.totalBooking}</strong>
                </span>
              </div>
              <button
                type="button"
                className="ota-modal-close-btn"
                onClick={() => setKpiModal(null)}
                style={{ border: "none", borderRadius: "50%", width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
              >
                <FaTimes />
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxHeight: "55vh", overflowY: "auto" }}>
              {customersData.map((c, i) => (
                <div key={i} className="ota-modal-box" style={{ borderRadius: "14px", padding: "12px 14px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <strong style={{ fontSize: "13.5px", display: "block" }}>{c.name} ({c.id})</strong>
                    <span style={{ fontSize: "11.5px", opacity: 0.75 }}>{c.roomBooked || "Room Standard"} • {c.checkIn || "17 Aug 2026"} → {c.checkOut || "19 Aug 2026"}</span>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <span style={{ fontSize: "13px", fontWeight: "800", color: "#3b82f6", display: "block" }}>{c.amount || "₹2,500"}</span>
                    <span style={{ background: c.paymentStatus === "Paid" ? "#dcfce7" : "#fef3c7", color: c.paymentStatus === "Paid" ? "#16a34a" : "#b45309", padding: "2px 8px", borderRadius: "999px", fontSize: "10px", fontWeight: "700" }}>{c.paymentStatus || "Paid"}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="ota-modal-footer" style={{ display: "flex", justifyContent: "space-between", marginTop: "20px", paddingTop: "14px" }}>
              <button
                type="button"
                onClick={() => { setKpiModal(null); navigate("/customers"); }}
                style={{ padding: "9px 16px", borderRadius: "10px", fontSize: "13px", fontWeight: "700", border: "none", background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", color: "#fff", cursor: "pointer" }}
              >
                View Customers & Billing →
              </button>
              <button
                type="button"
                className="ota-modal-cancel-btn"
                onClick={() => setKpiModal(null)}
                style={{ padding: "9px 18px", borderRadius: "10px", fontSize: "13px", fontWeight: "600", cursor: "pointer" }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DRILLDOWN MODAL 2: NEW BOOKING */}
      {kpiModal === "new_booking" && (
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
                  <FaBox style={{ color: "#10b981" }} /> Recent New Reservations Feed
                </h2>
                <span style={{ fontSize: "12px", opacity: 0.75 }}>
                  Total New Today: <strong style={{ color: "#10b981" }}>{kpiStats.newBooking} New Bookings</strong>
                </span>
              </div>
              <button
                type="button"
                className="ota-modal-close-btn"
                onClick={() => setKpiModal(null)}
                style={{ border: "none", borderRadius: "50%", width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
              >
                <FaTimes />
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxHeight: "55vh", overflowY: "auto" }}>
              {customersData
                .filter((c) => c.status === "Active" || c.status === "Checked In" || c.status === "Confirmed")
                .map((c, i) => (
                  <div key={i} className="ota-modal-box" style={{ borderRadius: "14px", padding: "12px 14px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div>
                      <strong style={{ fontSize: "13.5px", display: "block" }}>{c.name}</strong>
                      <span style={{ fontSize: "11.5px", opacity: 0.75 }}>{c.roomBooked || "Room Standard"} • {c.checkIn || "Today"} → {c.checkOut || "Tomorrow"}</span>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <span style={{ fontSize: "13px", fontWeight: "800", color: "#10b981", display: "block" }}>{c.amount || "₹2,500"}</span>
                      <span style={{ background: "#dcfce7", color: "#16a34a", padding: "2px 8px", borderRadius: "999px", fontSize: "10px", fontWeight: "700" }}>{c.status || "Active"}</span>
                    </div>
                  </div>
                ))}
            </div>

            <div className="ota-modal-footer" style={{ display: "flex", justifyContent: "space-between", marginTop: "20px", paddingTop: "14px" }}>
              <button
                type="button"
                onClick={() => { setKpiModal(null); navigate("/rooms"); }}
                style={{ padding: "9px 16px", borderRadius: "10px", fontSize: "13px", fontWeight: "700", border: "none", background: "linear-gradient(135deg, #10b981 0%, #059669 100%)", color: "#fff", cursor: "pointer" }}
              >
                Manage Rooms →
              </button>
              <button
                type="button"
                className="ota-modal-cancel-btn"
                onClick={() => setKpiModal(null)}
                style={{ padding: "9px 18px", borderRadius: "10px", fontSize: "13px", fontWeight: "600", cursor: "pointer" }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DRILLDOWN MODAL 3: AVAILABLE ROOMS */}
      {kpiModal === "available_rooms" && (
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
              maxWidth: "540px",
              padding: "24px 28px",
              boxShadow: "0 20px 40px rgba(0,0,0,0.25)",
              animation: "modalFadeIn 0.2s ease-out",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
              <div>
                <h2 className="ota-modal-title" style={{ margin: 0, fontSize: "20px", fontWeight: "800", display: "flex", alignItems: "center", gap: "8px" }}>
                  <FaBed style={{ color: "#6366f1" }} /> Available Rooms Today
                </h2>
                <span style={{ fontSize: "12px", opacity: 0.75 }}>
                  Total Available: <strong style={{ color: "#6366f1" }}>{kpiStats.availableRooms} Rooms</strong>
                </span>
              </div>
              <button
                type="button"
                className="ota-modal-close-btn"
                onClick={() => setKpiModal(null)}
                style={{ border: "none", borderRadius: "50%", width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
              >
                <FaTimes />
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxHeight: "55vh", overflowY: "auto" }}>
              {roomsData
                .filter((r) => (r.status || "").toLowerCase() === "available")
                .map((r, i) => (
                  <div key={i} className="ota-modal-box" style={{ borderRadius: "14px", padding: "12px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <strong style={{ fontSize: "13.5px", display: "block" }}>Room {r.number} - {r.type}</strong>
                      <span style={{ fontSize: "11.5px", opacity: 0.75 }}>{r.floor || "1st Floor"} • Up to {r.guests || 2} guests</span>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <span style={{ fontSize: "14px", fontWeight: "800", color: "#6366f1", display: "block" }}>₹{r.price?.toLocaleString("en-IN") || "2,500"} / night</span>
                      <span style={{ background: "#dcfce7", color: "#16a34a", padding: "2px 8px", borderRadius: "999px", fontSize: "10px", fontWeight: "700" }}>Available</span>
                    </div>
                  </div>
                ))}
            </div>

            <div className="ota-modal-footer" style={{ display: "flex", justifyContent: "space-between", marginTop: "20px", paddingTop: "14px" }}>
              <button
                type="button"
                onClick={() => { setKpiModal(null); navigate("/rooms"); }}
                style={{ padding: "9px 16px", borderRadius: "10px", fontSize: "13px", fontWeight: "700", border: "none", background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)", color: "#fff", cursor: "pointer" }}
              >
                Go to Rooms Page →
              </button>
              <button
                type="button"
                className="ota-modal-cancel-btn"
                onClick={() => setKpiModal(null)}
                style={{ padding: "9px 18px", borderRadius: "10px", fontSize: "13px", fontWeight: "600", cursor: "pointer" }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DRILLDOWN MODAL 4: SOLD OUT ROOMS */}
      {kpiModal === "sold_out_rooms" && (
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
              maxWidth: "540px",
              padding: "24px 28px",
              boxShadow: "0 20px 40px rgba(0,0,0,0.25)",
              animation: "modalFadeIn 0.2s ease-out",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
              <div>
                <h2 className="ota-modal-title" style={{ margin: 0, fontSize: "20px", fontWeight: "800", display: "flex", alignItems: "center", gap: "8px" }}>
                  <FaCheckDouble style={{ color: "#8b5cf6" }} /> Sold Out / Occupied Rooms Today
                </h2>
                <span style={{ fontSize: "12px", opacity: 0.75 }}>
                  Total Occupied: <strong style={{ color: "#8b5cf6" }}>{kpiStats.soldOutRooms} Rooms</strong>
                </span>
              </div>
              <button
                type="button"
                className="ota-modal-close-btn"
                onClick={() => setKpiModal(null)}
                style={{ border: "none", borderRadius: "50%", width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
              >
                <FaTimes />
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxHeight: "55vh", overflowY: "auto" }}>
              {roomsData
                .filter((r) => (r.status || "").toLowerCase() === "occupied" || (r.status || "").toLowerCase() === "cleaning")
                .map((r, i) => (
                  <div key={i} className="ota-modal-box" style={{ borderRadius: "14px", padding: "12px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <strong style={{ fontSize: "13.5px", display: "block" }}>Room {r.number} - {r.type}</strong>
                      <span style={{ fontSize: "11.5px", opacity: 0.75 }}>{r.floor || "1st Floor"} • Occupant: {r.booking?.guestName || "Guest"}</span>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <span style={{ fontSize: "14px", fontWeight: "800", color: "#8b5cf6", display: "block" }}>₹{r.price?.toLocaleString("en-IN") || "2,500"} / night</span>
                      <span style={{ background: "#fee2e2", color: "#dc2626", padding: "2px 8px", borderRadius: "999px", fontSize: "10px", fontWeight: "700" }}>{r.status || "Occupied"}</span>
                    </div>
                  </div>
                ))}
            </div>

            <div className="ota-modal-footer" style={{ display: "flex", justifyContent: "space-between", marginTop: "20px", paddingTop: "14px" }}>
              <button
                type="button"
                onClick={() => { setKpiModal(null); navigate("/rooms"); }}
                style={{ padding: "9px 16px", borderRadius: "10px", fontSize: "13px", fontWeight: "700", border: "none", background: "linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)", color: "#fff", cursor: "pointer" }}
              >
                Go to Rooms Page →
              </button>
              <button
                type="button"
                className="ota-modal-cancel-btn"
                onClick={() => setKpiModal(null)}
                style={{ padding: "9px 18px", borderRadius: "10px", fontSize: "13px", fontWeight: "600", cursor: "pointer" }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STATS POINT DRILLDOWN MODAL (CHECK-IN / CHECK-OUT BREAKDOWN) */}
      {selectedStatPoint && (
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
            zIndex: 1200,
            padding: "16px",
          }}
          onClick={() => setSelectedStatPoint(null)}
        >
          <div
            className="ota-modal-card"
            style={{
              borderRadius: "20px",
              width: "100%",
              maxWidth: "560px",
              padding: "24px 28px",
              background: isDark ? "#0f172a" : "#ffffff",
              color: isDark ? "#ffffff" : "#0f172a",
              border: isDark ? "1px solid #334155" : "1px solid #e2e8f0",
              boxShadow: "0 20px 40px rgba(0,0,0,0.25)",
              animation: "modalFadeIn 0.2s ease-out",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "18px" }}>
              <div>
                <h2 className="ota-modal-title" style={{ margin: 0, fontSize: "19px", fontWeight: "800", display: "flex", alignItems: "center", gap: "8px", color: isDark ? "#ffffff" : "#0f172a" }}>
                  <span style={{ width: "12px", height: "12px", borderRadius: "50%", background: selectedStatPoint.type === "checkIn" ? "#667eea" : "#c7d2fe" }} />
                  {selectedStatPoint.label} Details
                </h2>
                <span style={{ fontSize: "12px", color: isDark ? "#94a3b8" : "#64748b" }}>
                  Total {selectedStatPoint.type === "checkIn" ? "Guest Check-Ins" : "Guest Check-Outs"}: <strong style={{ color: selectedStatPoint.type === "checkIn" ? "#667eea" : "#6366f1" }}>{selectedStatPoint.total.toLocaleString("en-IN")}</strong>
                </span>
              </div>
              <button
                type="button"
                className="ota-modal-close-btn"
                onClick={() => setSelectedStatPoint(null)}
                style={{ border: "none", borderRadius: "50%", background: isDark ? "rgba(255,255,255,0.1)" : "#f1f5f9", color: isDark ? "#94a3b8" : "#64748b", width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
              >
                <FaTimes />
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxHeight: "50vh", overflowY: "auto" }}>
              {activeReservationData.map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    borderRadius: "12px",
                    padding: "12px 16px",
                    background: isDark ? "#1e293b" : "#f8fafc",
                    border: isDark ? "1px solid #334155" : "1px solid #e2e8f0",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <div>
                    <strong style={{ fontSize: "14px", color: isDark ? "#ffffff" : "#0f172a", display: "block" }}>
                      {item.label} Period
                    </strong>
                    <span style={{ fontSize: "11.5px", color: isDark ? "#94a3b8" : "#64748b" }}>
                      Est. Revenue: ₹{item.revenue.toLocaleString("en-IN")} • Occupancy: {item.occupancyRate}
                    </span>
                  </div>

                  <div style={{ textAlign: "right" }}>
                    <span
                      style={{
                        fontSize: "14px",
                        fontWeight: "800",
                        color: selectedStatPoint.type === "checkIn" ? "#667eea" : "#6366f1",
                        display: "block",
                      }}
                    >
                      {selectedStatPoint.type === "checkIn" ? `${item.checkIn} Check-ins` : `${item.checkOut} Check-outs`}
                    </span>
                    <span style={{ fontSize: "10.5px", color: "#10b981", fontWeight: "700" }}>✓ Verified</span>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "20px", paddingTop: "14px", borderTop: isDark ? "1px solid #334155" : "1px solid #e2e8f0" }}>
              <button
                type="button"
                onClick={() => { setSelectedStatPoint(null); navigate("/customers"); }}
                style={{ padding: "10px 18px", borderRadius: "10px", fontSize: "13px", fontWeight: "700", border: "none", background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", color: "#fff", cursor: "pointer" }}
              >
                View All Guests & Billing →
              </button>
              <button
                type="button"
                onClick={() => setSelectedStatPoint(null)}
                style={{ padding: "10px 20px", borderRadius: "10px", fontSize: "13px", fontWeight: "600", cursor: "pointer", background: isDark ? "#1e293b" : "#f1f5f9", border: "none", color: isDark ? "#ffffff" : "#0f172a" }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DRILLDOWN MODAL: BAR CHART DAY/MONTH BREAKDOWN */}
      {selectedBarData && (
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
              maxWidth: "540px",
              padding: "24px 28px",
              boxShadow: "0 20px 40px rgba(0,0,0,0.25)",
              animation: "modalFadeIn 0.2s ease-out",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
              <div>
                <h2 className="ota-modal-title" style={{ margin: 0, fontSize: "20px", fontWeight: "800", display: "flex", alignItems: "center", gap: "8px" }}>
                  <FaCalendarCheck style={{ color: "#f97316" }} /> Reservation Details ({selectedBarData.label})
                </h2>
                <span style={{ fontSize: "12px", opacity: 0.75 }}>
                  Detailed breakdown for timeframe: <strong>{selectedBarData.label}</strong>
                </span>
              </div>
              <button
                type="button"
                className="ota-modal-close-btn"
                onClick={() => setSelectedBarData(null)}
                style={{ border: "none", borderRadius: "50%", width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
              >
                <FaTimes />
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div className="ota-modal-box" style={{ borderRadius: "14px", padding: "14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <strong style={{ fontSize: "13.5px", display: "block" }}>Check-in Guests</strong>
                  <span style={{ fontSize: "11.5px", opacity: 0.75 }}>Arrival & Keys Handover</span>
                </div>
                <span style={{ fontSize: "15px", fontWeight: "800", color: "#ea580c" }}>{selectedBarData.checkIn.toLocaleString("en-IN")} Arrivals</span>
              </div>

              <div className="ota-modal-box" style={{ borderRadius: "14px", padding: "14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <strong style={{ fontSize: "13.5px", display: "block" }}>Check-out Guests</strong>
                  <span style={{ fontSize: "11.5px", opacity: 0.75 }}>Departures & Billing Settlement</span>
                </div>
                <span style={{ fontSize: "15px", fontWeight: "800", color: "#f97316" }}>{selectedBarData.checkOut.toLocaleString("en-IN")} Departures</span>
              </div>

              <div className="ota-modal-box" style={{ borderRadius: "14px", padding: "14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <strong style={{ fontSize: "13.5px", display: "block" }}>Est. Period Revenue</strong>
                  <span style={{ fontSize: "11.5px", opacity: 0.75 }}>Room Rent & Additional Services</span>
                </div>
                <span style={{ fontSize: "15px", fontWeight: "800", color: "#10b981" }}>₹{(selectedBarData.checkIn * 3450).toLocaleString("en-IN")}</span>
              </div>
            </div>

            <div className="ota-modal-footer" style={{ display: "flex", justifyContent: "space-between", marginTop: "20px", paddingTop: "14px" }}>
              <button
                type="button"
                onClick={() => { setSelectedBarData(null); navigate("/rooms"); }}
                style={{ padding: "9px 16px", borderRadius: "10px", fontSize: "13px", fontWeight: "700", border: "none", background: "linear-gradient(135deg, #ea580c 0%, #c2410c 100%)", color: "#fff", cursor: "pointer" }}
              >
                Go to Rooms Page →
              </button>
              <button
                type="button"
                className="ota-modal-cancel-btn"
                onClick={() => setSelectedBarData(null)}
                style={{ padding: "9px 18px", borderRadius: "10px", fontSize: "13px", fontWeight: "600", cursor: "pointer" }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DRILLDOWN MODAL: ANNUAL REPORT GENERATOR */}
      {row2Modal === "promo_report" && (
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
              maxWidth: "540px",
              padding: "24px 28px",
              boxShadow: "0 20px 40px rgba(0,0,0,0.25)",
              animation: "modalFadeIn 0.2s ease-out",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
              <div>
                <h2 className="ota-modal-title" style={{ margin: 0, fontSize: "20px", fontWeight: "800", display: "flex", alignItems: "center", gap: "8px" }}>
                  ✨ Generate Annual Operations Report
                </h2>
                <span style={{ fontSize: "12px", opacity: 0.75 }}>
                  Automated annual revenue, occupancy & audit summary compiler
                </span>
              </div>
              <button
                type="button"
                className="ota-modal-close-btn"
                onClick={() => setRow2Modal(null)}
                style={{ border: "none", borderRadius: "50%", width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
              >
                <FaTimes />
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: "700", display: "block", marginBottom: "4px" }}>Select Financial Year</label>
                  <select className="ota-form-input" style={{ width: "100%", padding: "8px 12px", borderRadius: "10px", fontSize: "13px" }} value={selectedReportYear} onChange={(e) => setSelectedReportYear(e.target.value)}>
                    <option value="2026">FY 2026 (Current)</option>
                    <option value="2025">FY 2025</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: "700", display: "block", marginBottom: "4px" }}>File Format</label>
                  <select className="ota-form-input" style={{ width: "100%", padding: "8px 12px", borderRadius: "10px", fontSize: "13px" }}>
                    <option value="csv">CSV Audit Sheet (.csv)</option>
                    <option value="pdf">PDF Document (.pdf)</option>
                  </select>
                </div>
              </div>

              <div className="ota-modal-box" style={{ borderRadius: "14px", padding: "14px" }}>
                <strong style={{ fontSize: "13px", display: "block", marginBottom: "6px" }}>Report Inclusions:</strong>
                <ul style={{ margin: 0, paddingLeft: "18px", fontSize: "12.5px", opacity: 0.85, display: "flex", flexDirection: "column", gap: "4px" }}>
                  <li>12-Month Check-in & Check-out Occupancy Metrics</li>
                  <li>OTA Channel Revenue vs Direct Booking Breakdown</li>
                  <li>Housekeeping Audit Logs & Inventory Settlement</li>
                </ul>
              </div>

              {reportSuccess && (
                <div style={{ background: "#dcfce7", color: "#15803d", padding: "10px 14px", borderRadius: "10px", fontSize: "12.5px", fontWeight: "700" }}>
                  ✓ Annual Report compiled successfully! File downloaded to your system.
                </div>
              )}
            </div>

            <div className="ota-modal-footer" style={{ display: "flex", justifyContent: "space-between", marginTop: "20px", paddingTop: "14px" }}>
              <button
                type="button"
                onClick={handleDownloadReport}
                disabled={reportGenerating}
                style={{ padding: "9px 18px", borderRadius: "10px", fontSize: "13px", fontWeight: "700", border: "none", background: "linear-gradient(135deg, #10b981 0%, #059669 100%)", color: "#fff", cursor: reportGenerating ? "not-allowed" : "pointer" }}
              >
                {reportGenerating ? "Compiling Report..." : "Generate & Download Report 📥"}
              </button>
              <button
                type="button"
                className="ota-modal-cancel-btn"
                onClick={() => setRow2Modal(null)}
                style={{ padding: "9px 18px", borderRadius: "10px", fontSize: "13px", fontWeight: "600", cursor: "pointer" }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DRILLDOWN MODAL: TOTAL CONCIERGE */}
      {row2Modal === "total_concierge" && (
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
              maxWidth: "540px",
              padding: "24px 28px",
              boxShadow: "0 20px 40px rgba(0,0,0,0.25)",
              animation: "modalFadeIn 0.2s ease-out",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
              <div>
                <h2 className="ota-modal-title" style={{ margin: 0, fontSize: "20px", fontWeight: "800", display: "flex", alignItems: "center", gap: "8px" }}>
                  <FaUserCheck style={{ color: "#3b82f6" }} /> Concierge Operations & Requests
                </h2>
                <span style={{ fontSize: "12px", opacity: 0.75 }}>
                  Total Requests Logged: <strong style={{ color: "#3b82f6" }}>569 Service Tickets</strong>
                </span>
              </div>
              <button
                type="button"
                className="ota-modal-close-btn"
                onClick={() => setRow2Modal(null)}
                style={{ border: "none", borderRadius: "50%", width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
              >
                <FaTimes />
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div className="ota-modal-box" style={{ borderRadius: "14px", padding: "14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <strong style={{ fontSize: "13.5px", display: "block" }}>Airport Transfers & Pickup</strong>
                  <span style={{ fontSize: "11.5px", opacity: 0.75 }}>Scheduled Chauffeur Rides</span>
                </div>
                <span style={{ fontSize: "14px", fontWeight: "800", color: "#3b82f6" }}>142 Requests</span>
              </div>

              <div className="ota-modal-box" style={{ borderRadius: "14px", padding: "14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <strong style={{ fontSize: "13.5px", display: "block" }}>Luggage & Baggage Handling</strong>
                  <span style={{ fontSize: "11.5px", opacity: 0.75 }}>Check-in & Checkout Express</span>
                </div>
                <span style={{ fontSize: "14px", fontWeight: "800", color: "#3b82f6" }}>240 Requests</span>
              </div>

              <div className="ota-modal-box" style={{ borderRadius: "14px", padding: "14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <strong style={{ fontSize: "13.5px", display: "block" }}>VIP Dining & Sightseeing Tours</strong>
                  <span style={{ fontSize: "11.5px", opacity: 0.75 }}>Special Guest Concierge Desk</span>
                </div>
                <span style={{ fontSize: "14px", fontWeight: "800", color: "#3b82f6" }}>187 Requests</span>
              </div>
            </div>

            <div className="ota-modal-footer" style={{ display: "flex", justifyContent: "space-between", marginTop: "20px", paddingTop: "14px" }}>
              <button
                type="button"
                onClick={() => { setRow2Modal(null); navigate("/rooms"); }}
                style={{ padding: "9px 16px", borderRadius: "10px", fontSize: "13px", fontWeight: "700", border: "none", background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)", color: "#fff", cursor: "pointer" }}
              >
                Go to Rooms Management →
              </button>
              <button
                type="button"
                className="ota-modal-cancel-btn"
                onClick={() => setRow2Modal(null)}
                style={{ padding: "9px 18px", borderRadius: "10px", fontSize: "13px", fontWeight: "600", cursor: "pointer" }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DRILLDOWN MODAL: TOTAL CUSTOMER */}
      {row2Modal === "total_customer" && (
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
              maxWidth: "540px",
              padding: "24px 28px",
              boxShadow: "0 20px 40px rgba(0,0,0,0.25)",
              animation: "modalFadeIn 0.2s ease-out",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
              <div>
                <h2 className="ota-modal-title" style={{ margin: 0, fontSize: "20px", fontWeight: "800", display: "flex", alignItems: "center", gap: "8px" }}>
                  <FaUserFriends style={{ color: "#10b981" }} /> Guest & Customer Directory
                </h2>
                <span style={{ fontSize: "12px", opacity: 0.75 }}>
                  Total Registered Guests: <strong style={{ color: "#10b981" }}>2,342 Customers</strong>
                </span>
              </div>
              <button
                type="button"
                className="ota-modal-close-btn"
                onClick={() => setRow2Modal(null)}
                style={{ border: "none", borderRadius: "50%", width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
              >
                <FaTimes />
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div className="ota-modal-box" style={{ borderRadius: "14px", padding: "14px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                  <strong style={{ fontSize: "13.5px" }}>Repeat Loyal Guests (3+ Stays)</strong>
                  <strong style={{ color: "#10b981", fontSize: "13.5px" }}>984 Guests (42%)</strong>
                </div>
                <div style={{ height: "6px", background: "rgba(0,0,0,0.06)", borderRadius: "999px" }}>
                  <div style={{ width: "42%", height: "100%", background: "#10b981", borderRadius: "999px" }} />
                </div>
              </div>

              <div className="ota-modal-box" style={{ borderRadius: "14px", padding: "14px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                  <strong style={{ fontSize: "13.5px" }}>First-time Travellers & Walk-ins</strong>
                  <strong style={{ color: "#3b82f6", fontSize: "13.5px" }}>936 Guests (40%)</strong>
                </div>
                <div style={{ height: "6px", background: "rgba(0,0,0,0.06)", borderRadius: "999px" }}>
                  <div style={{ width: "40%", height: "100%", background: "#3b82f6", borderRadius: "999px" }} />
                </div>
              </div>

              <div className="ota-modal-box" style={{ borderRadius: "14px", padding: "14px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                  <strong style={{ fontSize: "13.5px" }}>VIP Corporate Members</strong>
                  <strong style={{ color: "#8b5cf6", fontSize: "13.5px" }}>422 Guests (18%)</strong>
                </div>
                <div style={{ height: "6px", background: "rgba(0,0,0,0.06)", borderRadius: "999px" }}>
                  <div style={{ width: "18%", height: "100%", background: "#8b5cf6", borderRadius: "999px" }} />
                </div>
              </div>
            </div>

            <div className="ota-modal-footer" style={{ display: "flex", justifyContent: "space-between", marginTop: "20px", paddingTop: "14px" }}>
              <button
                type="button"
                onClick={() => { setRow2Modal(null); navigate("/rooms"); }}
                style={{ padding: "9px 16px", borderRadius: "10px", fontSize: "13px", fontWeight: "700", border: "none", background: "linear-gradient(135deg, #10b981 0%, #059669 100%)", color: "#fff", cursor: "pointer" }}
              >
                Go to Guest Folios →
              </button>
              <button
                type="button"
                className="ota-modal-cancel-btn"
                onClick={() => setRow2Modal(null)}
                style={{ padding: "9px 18px", borderRadius: "10px", fontSize: "13px", fontWeight: "600", cursor: "pointer" }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DRILLDOWN MODAL: TOTAL ROOM */}
      {row2Modal === "total_room" && (
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
              maxWidth: "540px",
              padding: "24px 28px",
              boxShadow: "0 20px 40px rgba(0,0,0,0.25)",
              animation: "modalFadeIn 0.2s ease-out",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
              <div>
                <h2 className="ota-modal-title" style={{ margin: 0, fontSize: "20px", fontWeight: "800", display: "flex", alignItems: "center", gap: "8px" }}>
                  <FaBox style={{ color: "#6366f1" }} /> Property Room Inventory
                </h2>
                <span style={{ fontSize: "12px", opacity: 0.75 }}>
                  Total Managed Inventory: <strong style={{ color: "#6366f1" }}>992 Total Rooms</strong>
                </span>
              </div>
              <button
                type="button"
                className="ota-modal-close-btn"
                onClick={() => setRow2Modal(null)}
                style={{ border: "none", borderRadius: "50%", width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
              >
                <FaTimes />
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div className="ota-modal-box" style={{ borderRadius: "14px", padding: "14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <strong style={{ fontSize: "13.5px", display: "block" }}>Standard Rooms Inventory</strong>
                  <span style={{ fontSize: "11.5px", opacity: 0.75 }}>Queen Bed / Twin Bed Setup</span>
                </div>
                <span style={{ fontSize: "14px", fontWeight: "800", color: "#6366f1" }}>420 Rooms</span>
              </div>

              <div className="ota-modal-box" style={{ borderRadius: "14px", padding: "14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <strong style={{ fontSize: "13.5px", display: "block" }}>Deluxe Suites Inventory</strong>
                  <span style={{ fontSize: "11.5px", opacity: 0.75 }}>King Bed / Balcony View</span>
                </div>
                <span style={{ fontSize: "14px", fontWeight: "800", color: "#6366f1" }}>350 Rooms</span>
              </div>

              <div className="ota-modal-box" style={{ borderRadius: "14px", padding: "14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <strong style={{ fontSize: "13.5px", display: "block" }}>Executive Villas & Suites</strong>
                  <span style={{ fontSize: "11.5px", opacity: 0.75 }}>Private Pool & VIP Lounge Access</span>
                </div>
                <span style={{ fontSize: "14px", fontWeight: "800", color: "#6366f1" }}>222 Rooms</span>
              </div>
            </div>

            <div className="ota-modal-footer" style={{ display: "flex", justifyContent: "space-between", marginTop: "20px", paddingTop: "14px" }}>
              <button
                type="button"
                onClick={() => { setRow2Modal(null); navigate("/rooms"); }}
                style={{ padding: "9px 16px", borderRadius: "10px", fontSize: "13px", fontWeight: "700", border: "none", background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)", color: "#fff", cursor: "pointer" }}
              >
                Go to Rooms Page →
              </button>
              <button
                type="button"
                className="ota-modal-cancel-btn"
                onClick={() => setRow2Modal(null)}
                style={{ padding: "9px 18px", borderRadius: "10px", fontSize: "13px", fontWeight: "600", cursor: "pointer" }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DRILLDOWN MODAL: TOTAL TRANSITION */}
      {row2Modal === "total_transition" && (
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
              maxWidth: "540px",
              padding: "24px 28px",
              boxShadow: "0 20px 40px rgba(0,0,0,0.25)",
              animation: "modalFadeIn 0.2s ease-out",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
              <div>
                <h2 className="ota-modal-title" style={{ margin: 0, fontSize: "20px", fontWeight: "800", display: "flex", alignItems: "center", gap: "8px" }}>
                  <FaHistory style={{ color: "#8b5cf6" }} /> Total Financial Transitions Audit Log
                </h2>
                <span style={{ fontSize: "12px", opacity: 0.75 }}>
                  {isAuditLoading ? "Loading financial audit..." : auditError ? "Unable to load financial audit data." : (
                    <>Total System Transitions: <strong style={{ color: "#8b5cf6" }}>{financialAudit.totalTransactions.toLocaleString()} Recorded Transactions</strong></>
                  )}
                </span>
              </div>
              <button
                type="button"
                className="ota-modal-close-btn"
                onClick={() => setRow2Modal(null)}
                style={{ border: "none", borderRadius: "50%", width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
              >
                <FaTimes />
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div className="ota-modal-box" style={{ borderRadius: "14px", padding: "14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <strong style={{ fontSize: "13.5px", display: "block" }}>Room Booking Transactions</strong>
                  <span style={{ fontSize: "11.5px", opacity: 0.75 }}>Paid Room Bookings</span>
                </div>
                <span style={{ fontSize: "14px", fontWeight: "800", color: "#8b5cf6" }}>
                  {isAuditLoading ? "..." : `${financialAudit.roomBookings.toLocaleString()} Entries`}
                </span>
              </div>

              <div className="ota-modal-box" style={{ borderRadius: "14px", padding: "14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <strong style={{ fontSize: "13.5px", display: "block" }}>F&B Restaurant & POS Orders</strong>
                  <span style={{ fontSize: "11.5px", opacity: 0.75 }}>Dining Room Charges</span>
                </div>
                <span style={{ fontSize: "14px", fontWeight: "800", color: "#8b5cf6" }}>
                  {isAuditLoading ? "..." : `${financialAudit.posOrders.toLocaleString()} Entries`}
                </span>
              </div>

              <div className="ota-modal-box" style={{ borderRadius: "14px", padding: "14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <strong style={{ fontSize: "13.5px", display: "block" }}>Amenities & Laundry Billing</strong>
                  <span style={{ fontSize: "11.5px", opacity: 0.75 }}>Guest Add-on Charges</span>
                </div>
                <span style={{ fontSize: "14px", fontWeight: "800", color: "#8b5cf6" }}>
                  {isAuditLoading ? "..." : `${financialAudit.amenitiesLaundry.toLocaleString()} Entries`}
                </span>
              </div>
            </div>

            <div className="ota-modal-footer" style={{ display: "flex", justifyContent: "space-between", marginTop: "20px", paddingTop: "14px" }}>
              <button
                type="button"
                onClick={() => { setRow2Modal(null); navigate("/rooms"); }}
                style={{ padding: "9px 16px", borderRadius: "10px", fontSize: "13px", fontWeight: "700", border: "none", background: "linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)", color: "#fff", cursor: "pointer" }}
              >
                View Rooms Audit →
              </button>
              <button
                type="button"
                className="ota-modal-cancel-btn"
                onClick={() => setRow2Modal(null)}
                style={{ padding: "9px 18px", borderRadius: "10px", fontSize: "13px", fontWeight: "600", cursor: "pointer" }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ROW 3 MODAL: ROOM ACTIVITY & GUEST DETAILS */}
      {row3FeedModal && (
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
              maxWidth: "540px",
              padding: "24px 28px",
              boxShadow: "0 20px 40px rgba(0,0,0,0.25)",
              animation: "modalFadeIn 0.2s ease-out",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
              <div>
                <h2 className="ota-modal-title" style={{ margin: 0, fontSize: "20px", fontWeight: "800", display: "flex", alignItems: "center", gap: "8px" }}>
                  <FaBed style={{ color: "#3b82f6" }} /> {row3FeedModal.title}
                </h2>
                <span style={{ fontSize: "12px", opacity: 0.75 }}>
                  Room Category: <strong style={{ color: "#3b82f6" }}>{row3FeedModal.roomType}</strong>
                </span>
              </div>
              <button
                type="button"
                className="ota-modal-close-btn"
                onClick={() => setRow3FeedModal(null)}
                style={{ border: "none", borderRadius: "50%", width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
              >
                <FaTimes />
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div style={{ borderRadius: "14px", overflow: "hidden", height: "140px", position: "relative" }}>
                <img
                  src={row3FeedModal.img}
                  alt={row3FeedModal.title}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
                <span
                  style={{
                    position: "absolute",
                    top: "12px",
                    right: "12px",
                    background: row3FeedModal.status === "Checked In" ? "#10b981" : row3FeedModal.status === "Occupied" ? "#6366f1" : "#f59e0b",
                    color: "#fff",
                    padding: "4px 12px",
                    borderRadius: "999px",
                    fontSize: "11px",
                    fontWeight: "800",
                    boxShadow: "0 4px 10px rgba(0,0,0,0.3)",
                  }}
                >
                  ● {row3FeedModal.status}
                </span>
              </div>

              <div className="ota-modal-box" style={{ borderRadius: "14px", padding: "14px", display: "flex", alignItems: "center", gap: "12px" }}>
                <img
                  src={row3FeedModal.avatar}
                  alt={row3FeedModal.guest}
                  style={{ width: "48px", height: "48px", borderRadius: "50%", objectFit: "cover", border: "2px solid #3b82f6" }}
                />
                <div>
                  <strong style={{ fontSize: "14px", display: "block" }}>{row3FeedModal.guest}</strong>
                  <span style={{ fontSize: "11.5px", opacity: 0.75 }}>Logged: {row3FeedModal.time}</span>
                </div>
              </div>

              <div className="ota-modal-box" style={{ borderRadius: "14px", padding: "14px" }}>
                <strong style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.5px", opacity: 0.75, display: "block", marginBottom: "4px" }}>Guest Request & Operations Note</strong>
                <p style={{ margin: 0, fontSize: "13px", fontWeight: "600", lineHeight: "1.4" }}>
                  "{row3FeedModal.notes}"
                </p>
              </div>
            </div>

            <div className="ota-modal-footer" style={{ display: "flex", justifyContent: "space-between", marginTop: "20px", paddingTop: "14px" }}>
              <button
                type="button"
                onClick={() => { setRow3FeedModal(null); navigate("/rooms"); }}
                style={{ padding: "9px 16px", borderRadius: "10px", fontSize: "13px", fontWeight: "700", border: "none", background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)", color: "#fff", cursor: "pointer" }}
              >
                Go to Rooms Page →
              </button>
              <button
                type="button"
                className="ota-modal-cancel-btn"
                onClick={() => setRow3FeedModal(null)}
                style={{ padding: "9px 18px", borderRadius: "10px", fontSize: "13px", fontWeight: "600", cursor: "pointer" }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ROW 3 MODAL: GAUGES BREAKDOWN */}
      {row3GaugeModal === "available" && (
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
              maxWidth: "540px",
              padding: "24px 28px",
              boxShadow: "0 20px 40px rgba(0,0,0,0.25)",
              animation: "modalFadeIn 0.2s ease-out",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
              <div>
                <h2 className="ota-modal-title" style={{ margin: 0, fontSize: "20px", fontWeight: "800", display: "flex", alignItems: "center", gap: "8px" }}>
                  <FaBed style={{ color: "#667eea" }} /> Available Rooms Real-Time Gauge
                </h2>
                <span style={{ fontSize: "12px", opacity: 0.75 }}>
                  Total Capacity Available: <strong style={{ color: "#667eea" }}>683 Rooms (54.9% Inventory)</strong>
                </span>
              </div>
              <button
                type="button"
                className="ota-modal-close-btn"
                onClick={() => setRow3GaugeModal(null)}
                style={{ border: "none", borderRadius: "50%", width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
              >
                <FaTimes />
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div className="ota-modal-box" style={{ borderRadius: "14px", padding: "14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <strong style={{ fontSize: "13.5px", display: "block" }}>Standard King / Queen</strong>
                  <span style={{ fontSize: "11.5px", opacity: 0.75 }}>Cleaned & Inspected</span>
                </div>
                <span style={{ fontSize: "15px", fontWeight: "800", color: "#667eea" }}>320 Available</span>
              </div>

              <div className="ota-modal-box" style={{ borderRadius: "14px", padding: "14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <strong style={{ fontSize: "13.5px", display: "block" }}>Deluxe Suites</strong>
                  <span style={{ fontSize: "11.5px", opacity: 0.75 }}>Sanitized & Ready</span>
                </div>
                <span style={{ fontSize: "15px", fontWeight: "800", color: "#667eea" }}>210 Available</span>
              </div>

              <div className="ota-modal-box" style={{ borderRadius: "14px", padding: "14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <strong style={{ fontSize: "13.5px", display: "block" }}>Penthouse & Executive Villas</strong>
                  <span style={{ fontSize: "11.5px", opacity: 0.75 }}>VIP Welcome Kit Set</span>
                </div>
                <span style={{ fontSize: "15px", fontWeight: "800", color: "#667eea" }}>153 Available</span>
              </div>
            </div>

            <div className="ota-modal-footer" style={{ display: "flex", justifyContent: "space-between", marginTop: "20px", paddingTop: "14px" }}>
              <button
                type="button"
                onClick={() => { setRow3GaugeModal(null); navigate("/rooms"); }}
                style={{ padding: "9px 16px", borderRadius: "10px", fontSize: "13px", fontWeight: "700", border: "none", background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", color: "#fff", cursor: "pointer" }}
              >
                Go to Rooms Page →
              </button>
              <button
                type="button"
                className="ota-modal-cancel-btn"
                onClick={() => setRow3GaugeModal(null)}
                style={{ padding: "9px 18px", borderRadius: "10px", fontSize: "13px", fontWeight: "600", cursor: "pointer" }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {row3GaugeModal === "sold_out" && (
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
              maxWidth: "540px",
              padding: "24px 28px",
              boxShadow: "0 20px 40px rgba(0,0,0,0.25)",
              animation: "modalFadeIn 0.2s ease-out",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
              <div>
                <h2 className="ota-modal-title" style={{ margin: 0, fontSize: "20px", fontWeight: "800", display: "flex", alignItems: "center", gap: "8px" }}>
                  <FaCheckDouble style={{ color: "#764ba2" }} /> Sold Out / Occupied Rooms Gauge
                </h2>
                <span style={{ fontSize: "12px", opacity: 0.75 }}>
                  Total Occupied Today: <strong style={{ color: "#764ba2" }}>561 Rooms (45.1% Occupancy Rate)</strong>
                </span>
              </div>
              <button
                type="button"
                className="ota-modal-close-btn"
                onClick={() => setRow3GaugeModal(null)}
                style={{ border: "none", borderRadius: "50%", width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
              >
                <FaTimes />
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div className="ota-modal-box" style={{ borderRadius: "14px", padding: "14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <strong style={{ fontSize: "13.5px", display: "block" }}>1st Floor Occupancy</strong>
                  <span style={{ fontSize: "11.5px", opacity: 0.75 }}>Standard Rooms</span>
                </div>
                <span style={{ fontSize: "15px", fontWeight: "800", color: "#764ba2" }}>140 Occupied</span>
              </div>

              <div className="ota-modal-box" style={{ borderRadius: "14px", padding: "14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <strong style={{ fontSize: "13.5px", display: "block" }}>2nd Floor Occupancy</strong>
                  <span style={{ fontSize: "11.5px", opacity: 0.75 }}>Deluxe Rooms</span>
                </div>
                <span style={{ fontSize: "15px", fontWeight: "800", color: "#764ba2" }}>155 Occupied</span>
              </div>

              <div className="ota-modal-box" style={{ borderRadius: "14px", padding: "14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <strong style={{ fontSize: "13.5px", display: "block" }}>3rd & Executive Floor</strong>
                  <span style={{ fontSize: "11.5px", opacity: 0.75 }}>Suites & Penthouse Villas</span>
                </div>
                <span style={{ fontSize: "15px", fontWeight: "800", color: "#764ba2" }}>266 Occupied</span>
              </div>
            </div>

            <div className="ota-modal-footer" style={{ display: "flex", justifyContent: "space-between", marginTop: "20px", paddingTop: "14px" }}>
              <button
                type="button"
                onClick={() => { setRow3GaugeModal(null); navigate("/rooms"); }}
                style={{ padding: "9px 16px", borderRadius: "10px", fontSize: "13px", fontWeight: "700", border: "none", background: "linear-gradient(135deg, #764ba2 0%, #5b21b6 100%)", color: "#fff", cursor: "pointer" }}
              >
                Go to Rooms Page →
              </button>
              <button
                type="button"
                className="ota-modal-cancel-btn"
                onClick={() => setRow3GaugeModal(null)}
                style={{ padding: "9px 18px", borderRadius: "10px", fontSize: "13px", fontWeight: "600", cursor: "pointer" }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}



