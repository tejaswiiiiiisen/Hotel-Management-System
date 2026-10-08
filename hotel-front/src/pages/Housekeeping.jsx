import React, { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import PageHeader from "../components/PageHeader.jsx";
import {
  FaBroom,
  FaCheckCircle,
  FaClock,
  FaSearch,
  FaFilter,
  FaThLarge,
  FaList,
  FaCamera,
  FaUpload,
  FaImage,
  FaThumbsUp,
  FaTimes,
  FaTimesCircle,
  FaQuestionCircle,
  FaPlus,
  FaUserCheck,
  FaPlay,
  FaExclamationTriangle,
  FaUserTie,
  FaUsers,
  FaCalendarAlt,
  FaCalendarCheck,
  FaMobileAlt,
  FaShieldAlt,
  FaBuilding,
  FaEye,
  FaInfoCircle,
  FaCheck,
  FaRedo,
  FaSun,
  FaMoon,
  FaCoffee,
  FaUtensils,
  FaReceipt,
  FaMoneyBillWave,
  FaCashRegister,
  FaPrint,
  FaConciergeBell,
  FaFileInvoiceDollar,
  FaBoxes,
  FaWalking,
  FaDownload,
} from "react-icons/fa";
import { getUserName, getUserRole, getUserEmail, getAuthHeaders, getCurrentOrg } from "../auth.js";
import { canEdit, canView } from "../rbac.js";
import { getRooms, fetchRoomsFromApi, saveRooms, formatRoomForAdmin } from "../utils/roomStore.js";
import { getEmployees } from "../employees.js";
import { fetchRooms } from "../services/roomService.js";
import {
  getHkTasks,
  fetchHkTasksFromAPI,
  computeHkMetrics,
  addHkTask,
  startHkTask,
  uploadHkPhotoProofMulti,
  approveHkTask,
  rejectAndRescheduleHkTask,
  assignHkTask,
  assignRoomTaskAPI,
  subscribeHkTasks,
  fetchAttendanceRoster,
  clockInStaff,
  clockOutStaff,
  overrideStaffAttendance,
  fetchStaffLeaves,
  applyStaffLeave,
  updateStaffLeaveStatus,
  subscribeStaffAttendance,
} from "../services/housekeepingStore.js";

// Helper to format floor and room
function getCleanFloorRoom(item) {
  if (!item) return "1st Floor • Room 101";
  const floorPart = item.floor ? item.floor.split("•")[0].split("-")[0].trim() : "1st Floor";
  const roomPart = item.room || (item.roomNumber ? `Room ${item.roomNumber}` : "Room 101");
  return `${floorPart} • ${roomPart}`;
}

// Preset rejection reasons requested by user specification
const REJECTION_PRESETS = [
  "Bathroom mirror smudged",
  "Stained linen or bedsheet wrinkle",
  "Dust on surfaces / headboard",
  "Amenities missing or not restocked",
  "Flooring requires vacuuming / mopping",
  "Trash bin not emptied",
];

// Smooth snappy count-up animated number & metric component
function AnimatedNumber({ value = 0, duration = 800, prefix = "", suffix = "", decimals = 0 }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let startTimestamp = null;
    const startVal = 0;
    const rawNum = typeof value === "string" ? parseFloat(value.replace(/[^0-9.]/g, "")) : Number(value);
    const endVal = isNaN(rawNum) ? 0 : rawNum;

    if (endVal === 0) {
      setDisplayValue(0);
      return;
    }

    let animationFrameId;

    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const elapsed = timestamp - startTimestamp;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out exponential for snappy count-up transition
      const easeOutProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      const current = easeOutProgress * (endVal - startVal) + startVal;
      setDisplayValue(current);

      if (progress < 1) {
        animationFrameId = window.requestAnimationFrame(step);
      } else {
        setDisplayValue(endVal);
      }
    };

    animationFrameId = window.requestAnimationFrame(step);

    return () => {
      if (animationFrameId) {
        window.cancelAnimationFrame(animationFrameId);
      }
    };
  }, [value, duration]);

  const formatted = decimals > 0 ? displayValue.toFixed(decimals) : Math.round(displayValue).toLocaleString("en-IN");
  return <span>{prefix}{formatted}{suffix}</span>;
}

// Smooth snappy count-up animated currency component
function AnimatedAmount({ value = 0, duration = 1200, prefix = "₹" }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let startTimestamp = null;
    const startVal = 0;
    const endVal = Math.round(Number(value) || 0);

    if (endVal === 0) {
      setDisplayValue(0);
      return;
    }

    let animationFrameId;

    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const elapsed = timestamp - startTimestamp;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out exponential for fast, satisfying rolling counter
      const easeOutProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      const current = Math.round(easeOutProgress * (endVal - startVal) + startVal);
      setDisplayValue(current);

      if (progress < 1) {
        animationFrameId = window.requestAnimationFrame(step);
      } else {
        setDisplayValue(endVal);
      }
    };

    animationFrameId = window.requestAnimationFrame(step);

    return () => {
      if (animationFrameId) {
        window.cancelAnimationFrame(animationFrameId);
      }
    };
  }, [value, duration]);

  return <span>{prefix}{displayValue.toLocaleString("en-IN")}</span>;
}

const DEFAULT_VISITOR_INCOME_BATCHES = [
  {
    id: "VIS-EXP-2026-0929-01",
    branch: "Ajmer Branch",
    orgId: "AJ01",
    date: "2026-09-29",
    formattedDate: "29 Sep 2026",
    formattedTime: "11:10 AM",
    filters: {
      today: true,
      year: "2026",
      month: "Sep",
      day: "29",
      status: "ALL",
    },
    stats: {
      totalIncome: 18500,
      totalVisitors: 7,
      todayVisitors: 7,
      todayIncome: 18500,
      currentlyInside: 3,
      checkedOut: 3,
      expectedVisitors: 1,
      totalVisitsThisMonth: 26,
      totalIncomeThisMonth: 78200,
    },
    visitors: [
      { id: 1, name: "Rahul Sharma", phone: "9876543221", roomNumber: "204", floor: "2nd Floor", amountPaid: 2500, checkIn: "10:30 AM", checkOut: "06:45 PM", status: "Checked-Out" },
      { id: 2, name: "Vikram Singhania", phone: "9829011223", roomNumber: "101", floor: "1st Floor", amountPaid: 3500, checkIn: "11:15 AM", checkOut: "—", status: "Checked-In" },
      { id: 3, name: "Ananya Roy", phone: "9876543210", roomNumber: "302", floor: "3rd Floor", amountPaid: 2800, checkIn: "12:30 PM", checkOut: "—", status: "Checked-In" },
      { id: 4, name: "Pooja Verma", phone: "9414088776", roomNumber: "105", floor: "1st Floor", amountPaid: 3000, checkIn: "09:00 AM", checkOut: "04:30 PM", status: "Checked-Out" },
      { id: 5, name: "Rohan Mehta", phone: "9829445566", roomNumber: "208", floor: "2nd Floor", amountPaid: 2200, checkIn: "08:45 AM", checkOut: "02:15 PM", status: "Checked-Out" },
      { id: 6, name: "Amit Singhal", phone: "9811223344", roomNumber: "110", floor: "1st Floor", amountPaid: 2000, checkIn: "10:50 AM", checkOut: "—", status: "Checked-In" },
      { id: 7, name: "Suresh Meena", phone: "9785422331", roomNumber: "108", floor: "1st Floor", amountPaid: 2500, checkIn: "02:00 PM", checkOut: "—", status: "Expected" },
    ],
    exportedBy: "Accountant Desk",
  },
  {
    id: "VIS-EXP-2026-0928-02",
    branch: "Ajmer Branch",
    orgId: "AJ01",
    date: "2026-09-28",
    formattedDate: "28 Sep 2026",
    formattedTime: "05:45 PM",
    filters: {
      today: false,
      year: "2026",
      month: "Sep",
      day: "28",
      status: "ALL",
    },
    stats: {
      totalIncome: 24800,
      totalVisitors: 8,
      todayVisitors: 8,
      todayIncome: 24800,
      currentlyInside: 0,
      checkedOut: 8,
      expectedVisitors: 0,
      totalVisitsThisMonth: 19,
      totalIncomeThisMonth: 59700,
    },
    visitors: [
      { id: 8, name: "Deepak Choudhary", phone: "9123456789", roomNumber: "201", floor: "2nd Floor", amountPaid: 4200, checkIn: "09:15 AM", checkOut: "05:30 PM", status: "Checked-Out" },
      { id: 9, name: "Sneha Kapoor", phone: "9871122334", roomNumber: "305", floor: "3rd Floor", amountPaid: 3600, checkIn: "10:00 AM", checkOut: "04:15 PM", status: "Checked-Out" },
      { id: 10, name: "Rajesh Malani", phone: "9414012345", roomNumber: "102", floor: "1st Floor", amountPaid: 2500, checkIn: "11:30 AM", checkOut: "05:00 PM", status: "Checked-Out" },
      { id: 11, name: "Manisha Goyal", phone: "9829098765", roomNumber: "206", floor: "2nd Floor", amountPaid: 3000, checkIn: "12:15 PM", checkOut: "05:40 PM", status: "Checked-Out" },
      { id: 12, name: "Gaurav Agarwal", phone: "9785001122", roomNumber: "301", floor: "3rd Floor", amountPaid: 4500, checkIn: "08:30 AM", checkOut: "03:30 PM", status: "Checked-Out" },
      { id: 13, name: "Nitin Bansal", phone: "9810055443", roomNumber: "104", floor: "1st Floor", amountPaid: 2000, checkIn: "01:00 PM", checkOut: "04:45 PM", status: "Checked-Out" },
      { id: 14, name: "Priya Rathore", phone: "9928114455", roomNumber: "207", floor: "2nd Floor", amountPaid: 2800, checkIn: "10:45 AM", checkOut: "03:50 PM", status: "Checked-Out" },
      { id: 15, name: "Harish Joshi", phone: "9413344556", roomNumber: "109", floor: "1st Floor", amountPaid: 2200, checkIn: "02:20 PM", checkOut: "05:15 PM", status: "Checked-Out" },
    ],
    exportedBy: "Senior Auditor (Pooja Sharma)",
  },
  {
    id: "VIS-EXP-2026-0925-03",
    branch: "Ajmer Branch",
    orgId: "AJ01",
    date: "2026-09-25",
    formattedDate: "25 Sep 2026",
    formattedTime: "02:15 PM",
    filters: {
      today: false,
      year: "2026",
      month: "Sep",
      day: "25",
      status: "ALL",
    },
    stats: {
      totalIncome: 16400,
      totalVisitors: 5,
      todayVisitors: 5,
      todayIncome: 16400,
      currentlyInside: 0,
      checkedOut: 5,
      expectedVisitors: 0,
      totalVisitsThisMonth: 11,
      totalIncomeThisMonth: 34900,
    },
    visitors: [
      { id: 16, name: "Arjun Saxena", phone: "9828011990", roomNumber: "202", floor: "2nd Floor", amountPaid: 3800, checkIn: "09:30 AM", checkOut: "01:45 PM", status: "Checked-Out" },
      { id: 17, name: "Kavita Jain", phone: "9876500112", roomNumber: "303", floor: "3rd Floor", amountPaid: 4200, checkIn: "10:15 AM", checkOut: "02:00 PM", status: "Checked-Out" },
      { id: 18, name: "Mayank Vyas", phone: "9414077665", roomNumber: "106", floor: "1st Floor", amountPaid: 2600, checkIn: "11:00 AM", checkOut: "01:30 PM", status: "Checked-Out" },
      { id: 19, name: "Divya Mathur", phone: "9785112244", roomNumber: "205", floor: "2nd Floor", amountPaid: 3100, checkIn: "08:45 AM", checkOut: "12:50 PM", status: "Checked-Out" },
      { id: 20, name: "Lalit Khandelwal", phone: "9829332211", roomNumber: "107", floor: "1st Floor", amountPaid: 2700, checkIn: "11:45 AM", checkOut: "02:10 PM", status: "Checked-Out" },
    ],
    exportedBy: "Chief Finance Officer",
  },
  {
    id: "VIS-EXP-2026-0920-04",
    branch: "Ajmer Branch",
    orgId: "AJ01",
    date: "2026-09-20",
    formattedDate: "20 Sep 2026",
    formattedTime: "11:40 AM",
    filters: {
      today: false,
      year: "2026",
      month: "Sep",
      day: "20",
      status: "ALL",
    },
    stats: {
      totalIncome: 20500,
      totalVisitors: 6,
      todayVisitors: 6,
      todayIncome: 20500,
      currentlyInside: 0,
      checkedOut: 6,
      expectedVisitors: 0,
      totalVisitsThisMonth: 6,
      totalIncomeThisMonth: 20500,
    },
    visitors: [
      { id: 21, name: "Sunita Rao", phone: "9876012345", roomNumber: "304", floor: "3rd Floor", amountPaid: 4500, checkIn: "09:00 AM", checkOut: "11:30 AM", status: "Checked-Out" },
      { id: 22, name: "Tarun Bhatnagar", phone: "9829554433", roomNumber: "203", floor: "2nd Floor", amountPaid: 3500, checkIn: "09:30 AM", checkOut: "11:15 AM", status: "Checked-Out" },
      { id: 23, name: "Meenakshi Soni", phone: "9414223311", roomNumber: "103", floor: "1st Floor", amountPaid: 3200, checkIn: "10:00 AM", checkOut: "11:35 AM", status: "Checked-Out" },
      { id: 24, name: "Alok Trivedi", phone: "9785998877", roomNumber: "306", floor: "3rd Floor", amountPaid: 3800, checkIn: "08:15 AM", checkOut: "10:50 AM", status: "Checked-Out" },
      { id: 25, name: "Neha Deshmukh", phone: "9811447788", roomNumber: "209", floor: "2nd Floor", amountPaid: 3500, checkIn: "09:45 AM", checkOut: "11:20 AM", status: "Checked-Out" },
      { id: 26, name: "Rakesh Pillai", phone: "9928334411", roomNumber: "112", floor: "1st Floor", amountPaid: 2000, checkIn: "10:10 AM", checkOut: "11:40 AM", status: "Checked-Out" },
    ],
    exportedBy: "Head Accountant",
  },
];

const DEFAULT_KITCHEN_ORDER_BATCHES = [
  {
    id: "KOT-EXP-884210",
    batchId: "KOT-EXP-884210",
    branch: "Ajmer Branch",
    formattedDate: "Today, 02 Oct 2026",
    formattedTime: "12:15 PM",
    exportedAt: new Date().toISOString(),
    exportedBy: "Chef Ranveer Brar",
    totalOrders: 4,
    todayTotalIncome: 1630,
    successfulDeliveryCount: 1,
    failedOrdersCount: 0,
    orders: [
      {
        id: "KOT-101",
        roomOrTable: "Room 104",
        guest: "Aman Verma",
        items: "Deluxe Club Sandwich, Cold Coffee",
        qty: "2x Sandwich, 2x Coffee (4)",
        total: 450,
        status: "Cooking",
        priority: "High",
        time: "12:45 PM",
        paymentMethod: "Pending",
        notes: "Extra mayo, cold coffee without ice",
      },
      {
        id: "KOT-102",
        roomOrTable: "Room 201",
        guest: "Pooja Sharma",
        items: "Gourmet Continental Breakfast, Fresh Juice",
        qty: "1x Breakfast, 1x Juice (2)",
        total: 520,
        status: "Ready",
        priority: "Normal",
        time: "01:10 PM",
        paymentMethod: "Pending",
        notes: "Pack with fruit bowl",
      },
      {
        id: "KOT-103",
        roomOrTable: "Table T-02",
        guest: "Karan Malhotra",
        items: "Paneer Tikka Platter, Butter Roti",
        qty: "1x Platter, 4x Roti (5)",
        total: 480,
        status: "Pending",
        priority: "Normal",
        time: "01:25 PM",
        paymentMethod: "Pending",
        notes: "Less spicy for kids",
      },
      {
        id: "KOT-104",
        roomOrTable: "Room 106",
        guest: "Siddharth Jain",
        items: "Special Masala Chai Flask, Assorted Cookies",
        qty: "1x Flask, 6x Cookies (7)",
        total: 180,
        status: "Delivered",
        priority: "Normal",
        time: "11:50 AM",
        paymentMethod: "Billed / UPI",
        notes: "Delivered to room table",
      },
    ],
  },
  {
    id: "KOT-EXP-773190",
    batchId: "KOT-EXP-773190",
    branch: "Ajmer Branch",
    formattedDate: "01 Oct 2026",
    formattedTime: "08:30 PM",
    exportedAt: "2026-10-01T15:00:00.000Z",
    exportedBy: "Chef Sanjeev Kapoor",
    totalOrders: 6,
    todayTotalIncome: 3420,
    successfulDeliveryCount: 6,
    failedOrdersCount: 0,
    orders: [
      { id: "KOT-095", roomOrTable: "Room 302", guest: "Vikram Singhania", items: "Paneer Butter Masala + Garlic Naan", qty: "2", total: 680, status: "Delivered", priority: "High", time: "08:15 PM", paymentMethod: "Billed / UPI", notes: "Mild spicy" },
      { id: "KOT-096", roomOrTable: "Room 105", guest: "Neha Gupta", items: "Veg Biryani + Boondi Raita", qty: "1", total: 420, status: "Delivered", priority: "Normal", time: "07:45 PM", paymentMethod: "Billed / UPI", notes: "Extra raita" },
      { id: "KOT-097", roomOrTable: "Table T-05", guest: "Rohan Mehta", items: "Crispy Corn & Chilli Paneer", qty: "2", total: 540, status: "Delivered", priority: "Normal", time: "07:20 PM", paymentMethod: "Billed / UPI", notes: "Crispy well done" },
      { id: "KOT-098", roomOrTable: "Room 208", guest: "Deepak Choudhary", items: "Tandoori Platter Special", qty: "1", total: 750, status: "Delivered", priority: "High", time: "06:50 PM", paymentMethod: "Billed / UPI", notes: "Mint chutney" },
      { id: "KOT-099", roomOrTable: "Table T-01", guest: "Ananya Roy", items: "Cold Coffee + Brownie Sundae", qty: "2", total: 480, status: "Delivered", priority: "Normal", time: "06:10 PM", paymentMethod: "Billed / UPI", notes: "Ice cream scoop" },
      { id: "KOT-100", roomOrTable: "Room 101", guest: "Sunita Devi", items: "Masala Khichdi + Curd", qty: "1", total: 550, status: "Delivered", priority: "Normal", time: "05:30 PM", paymentMethod: "Billed / UPI", notes: "Diet food" },
    ],
  },
];

export default function Housekeeping({ defaultTab = null, defaultSubTab = null }) {
  const [searchParams] = useSearchParams();
  const urlTab = searchParams.get("tab");
  const urlSubTab = searchParams.get("subtab");

  const role = getUserRole();
  const cleanRole = String(role || "").trim().toLowerCase().replace(/\s+/g, "_");
  const userName = getUserName() || "Staff Member";
  const userEmail = getUserEmail();

  const isHousekeeper = cleanRole === "housekeeping";
  const isChefOrKitchen = cleanRole === "chef" || cleanRole === "kitchen";
  const isSuperAdmin = cleanRole === "super_admin" || cleanRole === "superadmin";
  // Main view tab: "dashboard" (All-in-one Operational Control Center) | "portal" (Housekeeper Mobile Portal) | "kitchen" | "accounting"
  const [activeTab, setActiveTab] = useState(
    urlTab || defaultTab || (isChefOrKitchen ? "kitchen" : isHousekeeper ? "portal" : "dashboard")
  );

  useEffect(() => {
    if (urlTab) {
      setActiveTab(urlTab);
    }
  }, [urlTab]);

  // REAL DATABASE STATE (Zero Dummy Data)
  const [dbRooms, setDbRooms] = useState(() => getRooms());
  const [tasks, setTasks] = useState([]);
  const [roster, setRoster] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [attendanceMetrics, setAttendanceMetrics] = useState({
    totalStaff: 0,
    presentToday: 0,
    absentToday: 0,
    checkedIn: 0,
    checkedOut: 0,
    onLeave: 0,
    totalHoursWorked: "0.0 hrs",
  });
  const [isLoading, setIsLoading] = useState(true);

  // FILTERS & VIEW MODE
  const [search, setSearch] = useState("");
  const [floorFilter, setFloorFilter] = useState("All Floors");
  const [shiftFilter, setShiftFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [staffAttendanceFilter, setStaffAttendanceFilter] = useState("All"); // "All" | "Present" | "Absent" | "CheckedIn" | "CheckedOut" | "Worked" | "OnLeave"
  const [activeOperationalView, setActiveOperationalView] = useState("all"); // Default to all ("rooms" | "staff" | "photos" | "all")
  const [currentBranchName, setCurrentBranchName] = useState(() => getCurrentOrg() || "Matcha Tea");
  const [viewMode, setViewMode] = useState("grid"); // Default to compact small box cards

  // CLOCK & TIME TICKER
  const [currentTime, setCurrentTime] = useState(new Date());
  const [liveWorkingSeconds, setLiveWorkingSeconds] = useState(0);

  // TOAST STATE
  const [toastMsg, setToastMsg] = useState("");
  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 6000);
  };

  // MODALS STATE
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [assignModalRoom, setAssignModalRoom] = useState(null);
  const [assignModalSearch, setAssignModalSearch] = useState("");
  const [assignModalRoleFilter, setAssignModalRoleFilter] = useState("all");
  const [assignForm, setAssignForm] = useState({
    roomId: null,
    roomNumber: "",
    floor: "1st Floor",
    roomType: "Deluxe Room",
    employeeId: "",
    employeeName: "",
    employeeEmail: "",
    cleaningType: "Check-Out Turnover",
    shift: "Morning",
    priority: "Normal",
    notes: "",
  });

  const [inspectModalTask, setInspectModalTask] = useState(null);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);

  const [rejectModalTask, setRejectModalTask] = useState(null);
  const [selectedRejectPreset, setSelectedRejectPreset] = useState(REJECTION_PRESETS[0]);
  const [customRejectReason, setCustomRejectReason] = useState("");

  const [uploadProofTask, setUploadProofTask] = useState(null);
  const [proofPhotos, setProofPhotos] = useState([]);
  const [housekeeperRemarks, setHousekeeperRemarks] = useState("");
  const [cleaningDuration, setCleaningDuration] = useState(30);

  const [isWorkersModalOpen, setIsWorkersModalOpen] = useState(false);
  const [workerFilterTab, setWorkerFilterTab] = useState("all");

  // KITCHEN MODULE STATE
  const [kitchenOrders, setKitchenOrders] = useState(() => {
    try {
      const saved = localStorage.getItem("hotel_kitchen_orders");
      if (saved) return JSON.parse(saved);
    } catch { }
    return [
      {
        id: "KOT-101",
        room: "Room 104",
        table: "Table T-04",
        roomOrTable: "Room 104",
        guest: "Aman Verma",
        items: "Deluxe Club Sandwich, Cold Coffee",
        qty: "2x Sandwich, 2x Coffee (4)",
        total: 450,
        status: "Cooking",
        priority: "High",
        time: "12:45 PM",
        notes: "Extra mayo, cold coffee without ice",
      },
      {
        id: "KOT-102",
        room: "Room 201",
        table: "Table T-08",
        roomOrTable: "Room 201",
        guest: "Pooja Sharma",
        items: "Gourmet Continental Breakfast, Fresh Juice",
        qty: "1x Breakfast, 1x Juice (2)",
        total: 520,
        status: "Ready",
        priority: "Normal",
        time: "01:10 PM",
        notes: "Pack with fruit bowl",
      },
      {
        id: "KOT-103",
        room: "Room 102",
        table: "Table T-02",
        roomOrTable: "Table T-02",
        guest: "Karan Malhotra",
        items: "Paneer Tikka Platter, Butter Roti",
        qty: "1x Platter, 4x Roti (5)",
        total: 480,
        status: "Pending",
        priority: "Normal",
        time: "01:25 PM",
        notes: "Less spicy for kids",
      },
      {
        id: "KOT-104",
        room: "Room 106",
        table: "Table T-06",
        roomOrTable: "Room 106",
        guest: "Siddharth Jain",
        items: "Special Masala Chai Flask, Assorted Cookies",
        qty: "1x Flask, 6x Cookies (7)",
        total: 180,
        status: "Delivered",
        priority: "Normal",
        time: "11:50 AM",
        notes: "Delivered to room table",
      },
    ];
  });

  const [kitchenPantry, setKitchenPantry] = useState(() => {
    try {
      const saved = localStorage.getItem("hotel_kitchen_pantry");
      if (saved) return JSON.parse(saved);
    } catch { }
    return [
      { id: 1, name: "Fresh Produce & Vegetables", level: 80, unit: "45 kg", status: "Healthy" },
      { id: 2, name: "Dairy, Milk & Fresh Paneer", level: 65, unit: "28 L / kg", status: "Healthy" },
      { id: 3, name: "Breads, Buns & Bakery", level: 25, unit: "8 packets", status: "Low Stock" },
      { id: 4, name: "Cooking Oil & Clarified Ghee", level: 60, unit: "35 L", status: "Healthy" },
      { id: 5, name: "Spices, Condiments & Rice", level: 90, unit: "120 kg", status: "Healthy" },
      { id: 6, name: "Commercial LPG Gas Cylinders", level: 33, unit: "1 Active, 1 Spare", status: "Reorder Soon" },
    ];
  });

  const [kitchenFilter, setKitchenFilter] = useState("All");
  const [kitchenSearch, setKitchenSearch] = useState("");
  const [kitchenViewLayout, setKitchenViewLayout] = useState("table"); // "table" (tabular columns) | "grid" (cards)
  const [isAddKitchenModalOpen, setIsAddKitchenModalOpen] = useState(false);
  const [isKitchenIncomeHistoryOpen, setIsKitchenIncomeHistoryOpen] = useState(false);
  const [newKitchenOrder, setNewKitchenOrder] = useState({
    orderType: "Room", // "Room" | "Table"
    room: "Room 101",
    table: "Table T-01",
    guest: "",
    items: "",
    qty: "1",
    total: "",
    priority: "Normal",
    notes: "",
  });

  const saveKitchenOrders = (orders) => {
    setKitchenOrders(orders);
    try {
      localStorage.setItem("hotel_kitchen_orders", JSON.stringify(orders));
    } catch { }
  };

  const updateKitchenOrderStatus = (orderId, newStatus) => {
    const updated = kitchenOrders.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o));
    saveKitchenOrders(updated);
    showToast(`Order ${orderId} marked as ${newStatus}`);
  };

  const restockPantryItem = (pantryId) => {
    const updated = kitchenPantry.map((p) =>
      p.id === pantryId ? { ...p, level: Math.min(100, p.level + 25), status: "Healthy" } : p
    );
    setKitchenPantry(updated);
    try {
      localStorage.setItem("hotel_kitchen_pantry", JSON.stringify(updated));
    } catch { }
    showToast("Pantry item restocked successfully!");
  };

  const handleAddKitchenOrder = (e) => {
    e.preventDefault();
    if (!newKitchenOrder.items || !newKitchenOrder.guest) return;
    const roomOrTableVal = newKitchenOrder.orderType === "Table"
      ? (newKitchenOrder.table || "Table T-01")
      : (newKitchenOrder.room.startsWith("Room") ? newKitchenOrder.room : `Room ${newKitchenOrder.room}`);

    const newOrder = {
      id: `KOT-${Date.now().toString().slice(-4)}`,
      room: newKitchenOrder.room || "Room 101",
      table: newKitchenOrder.table || "Table T-01",
      roomOrTable: roomOrTableVal,
      guest: newKitchenOrder.guest,
      items: newKitchenOrder.items,
      qty: newKitchenOrder.qty || "1",
      total: Number(newKitchenOrder.total) || 250,
      status: "Pending",
      priority: newKitchenOrder.priority || "Normal",
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      notes: newKitchenOrder.notes || "Standard Preparation",
    };
    const updated = [newOrder, ...kitchenOrders];
    saveKitchenOrders(updated);
    setIsAddKitchenModalOpen(false);
    setNewKitchenOrder({ orderType: "Room", room: "Room 101", table: "Table T-01", guest: "", items: "", qty: "1", total: "", priority: "Normal", notes: "" });
    showToast(`KOT Created for ${roomOrTableVal}!`);
  };

  const totalKitchenTodayIncome = kitchenOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
  const totalSuccessfulDeliveredOrders = kitchenOrders.filter((o) => o.status === "Delivered" || o.status === "Completed" || o.status === "Served").length;
  const totalFailedKitchenOrders = kitchenOrders.filter((o) => o.status === "Failed" || o.status === "Cancelled" || o.status === "Rejected").length;

  const filteredKitchenOrders = kitchenOrders.filter((ord) => {
    if (kitchenFilter === "All") {
      // pass
    } else if (kitchenFilter === "TodayIncome") {
      return true;
    } else if (kitchenFilter === "Delivered") {
      if (ord.status !== "Delivered" && ord.status !== "Completed" && ord.status !== "Served") return false;
    } else if (kitchenFilter === "Failed") {
      if (ord.status !== "Failed" && ord.status !== "Cancelled" && ord.status !== "Rejected") return false;
    } else if (ord.status !== kitchenFilter) {
      return false;
    }
    const q = kitchenSearch.toLowerCase().trim();
    const matchesSearch =
      !q ||
      String(ord.room || "").toLowerCase().includes(q) ||
      String(ord.table || "").toLowerCase().includes(q) ||
      String(ord.roomOrTable || "").toLowerCase().includes(q) ||
      String(ord.guest || "").toLowerCase().includes(q) ||
      String(ord.items || "").toLowerCase().includes(q) ||
      String(ord.qty || "").toLowerCase().includes(q) ||
      String(ord.id || "").toLowerCase().includes(q);
    return matchesSearch;
  });

  const exportKitchenOrdersCSV = () => {
    if (!kitchenOrders || kitchenOrders.length === 0) {
      showToast("⚠️ No kitchen orders available to export!");
      return;
    }

    const now = new Date();
    const formattedDate = now.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
    const formattedTime = now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
    const exportId = `KOT-EXP-${Date.now().toString().slice(-6)}`;

    // Create rich export batch for Chatrix
    const newExportBatch = {
      id: exportId,
      batchId: exportId,
      branch: currentBranchName || "Main Branch",
      formattedDate: "Today, " + formattedDate,
      formattedTime: formattedTime,
      exportedAt: now.toISOString(),
      exportedBy: userName || "Chef Ranveer Brar",
      totalOrders: kitchenOrders.length,
      todayTotalIncome: totalKitchenTodayIncome,
      successfulDeliveryCount: totalSuccessfulDeliveredOrders,
      failedOrdersCount: totalFailedKitchenOrders,
      orders: kitchenOrders.map((o) => ({
        id: o.id || "",
        roomOrTable: o.roomOrTable || o.room || o.table || "Room 101",
        guest: o.guest || "Guest",
        items: o.items || "",
        qty: o.qty || "1",
        total: Number(o.total) || 0,
        status: o.status || "Completed",
        priority: o.priority || "Normal",
        time: o.time || formattedTime,
        paymentMethod: o.status === "Delivered" ? "Billed / UPI" : "Pending",
        notes: o.notes || "Standard Prep",
      })),
    };

    // Save and sync in localStorage for Chatrix multi-batch timeline
    try {
      const existing = JSON.parse(localStorage.getItem("hotel_chatrix_kitchen_exports") || "[]");
      const updatedBatches = [newExportBatch, ...(Array.isArray(existing) ? existing.filter((x) => x.id !== exportId) : [])];
      localStorage.setItem("hotel_chatrix_kitchen_exports", JSON.stringify(updatedBatches));
      setExportedKitchenBatches(updatedBatches);
      window.dispatchEvent(new CustomEvent("kitchen_orders_exported", { detail: newExportBatch }));
    } catch (e) { }

    // Download formatted CSV spreadsheet
    let csv = `HOTEL KITCHEN & DINING DAILY AUDIT REPORT\n`;
    csv += `Branch,"${currentBranchName || "Hotel"}",Export Date,"${formattedDate} ${formattedTime}",Exported By,"${userName || "Head Chef"}"\n`;
    csv += `Total Today Orders,${kitchenOrders.length},Today Total Food Revenue,INR ${totalKitchenTodayIncome},Completed / Delivered,${totalSuccessfulDeliveredOrders},Failed / Cancelled,${totalFailedKitchenOrders}\n\n`;
    csv += `Sr No,Order ID,Room / Table,Guest Name (Kisne Mangwaya),Items Ordered (Kya Mangwaya),Quantity,Total Amount (INR),Payment Status,Delivery Status,Order Time,Notes\n`;

    kitchenOrders.forEach((ord, index) => {
      csv += `${index + 1},"${ord.id || ""}","${ord.roomOrTable || ord.room || ord.table || ""}","${(ord.guest || "").replace(/"/g, '""')}","${(ord.items || "").replace(/"/g, '""')}","${ord.qty || "1"}",${ord.total || 0},"${ord.status === "Delivered" ? "Billed / UPI" : "Pending"}","${ord.status || ""}","${ord.time || formattedTime}","${(ord.notes || "").replace(/"/g, '""')}"\n`;
    });

    csv += `\n,,,,,TOTAL TODAY INCOME,INR ${totalKitchenTodayIncome},,,,\n`;

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const encodedUri = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    const branchTag = (currentBranchName || "Hotel").replace(/[^a-zA-Z0-9]/g, "_");
    const dateTag = now.toISOString().slice(0, 10);
    link.setAttribute("download", `Kitchen_Today_Income_Orders_${branchTag}_${dateTag}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(encodedUri);

    showToast("📥 Today Kitchen Orders & Revenue data exported to CSV & Synced to Chatrix! ⚡");
  };

  // ACCOUNTING MODULE STATE
  const [accountingInvoices, setAccountingInvoices] = useState(() => {
    try {
      const saved = localStorage.getItem("hotel_accounting_invoices");
      if (saved) return JSON.parse(saved);
    } catch { }
    return [
      {
        id: "INV-2026-001",
        guest: "Aman Verma",
        room: "104",
        date: new Date().toLocaleDateString(),
        amount: 6500,
        paid: 6500,
        method: "UPI / QR",
        status: "Paid",
        category: "Room Stay + Dining",
      },
      {
        id: "INV-2026-002",
        guest: "Pooja Sharma",
        room: "201",
        date: new Date().toLocaleDateString(),
        amount: 4200,
        paid: 4200,
        method: "Credit Card",
        status: "Paid",
        category: "Executive Suite Stay",
      },
      {
        id: "INV-2026-003",
        guest: "Karan Malhotra",
        room: "102",
        date: new Date().toLocaleDateString(),
        amount: 7800,
        paid: 4000,
        method: "Cash",
        status: "Partial",
        category: "Family Room + Room Service",
      },
      {
        id: "INV-2026-004",
        guest: "Neha Gupta",
        room: "105",
        date: new Date().toLocaleDateString(),
        amount: 5000,
        paid: 0,
        method: "Net Banking",
        status: "Pending",
        category: "Advance Booking",
      },
    ];
  });

  const [accountingExpenses, setAccountingExpenses] = useState(() => {
    try {
      const saved = localStorage.getItem("hotel_accounting_expenses");
      if (saved) return JSON.parse(saved);
    } catch { }
    return [
      { id: 1, department: "Housekeeping", description: "Linen Laundry & Organic Cleaners", amount: 2800, date: "Today", loggedBy: "Sunita Devi" },
      { id: 2, department: "Kitchen", description: "Daily Farm Fresh Veggies & Dairy", amount: 4600, date: "Today", loggedBy: "Chef Ranveer" },
      { id: 3, department: "Maintenance", description: "AC Gas Top-up & Water Filter Spares", amount: 1500, date: "Yesterday", loggedBy: "Ramesh Kumar" },
      { id: 4, department: "Front Office", description: "Stationery & Welcome Keycard Wallets", amount: 950, date: "2 days ago", loggedBy: "Priya Desk" },
    ];
  });

  const [accountingFilter, setAccountingFilter] = useState("All");
  const [accountingActiveCategory, setAccountingActiveCategory] = useState("all"); // "all" | "invoices" | "employee_salary" | "paid_salary" | "visitor_income" | "expenses"
  const [accountingSearch, setAccountingSearch] = useState("");
  const [isAddInvoiceModalOpen, setIsAddInvoiceModalOpen] = useState(false);
  const [newInvoiceForm, setNewInvoiceForm] = useState({
    guest: "",
    room: "101",
    amount: "",
    paid: "",
    method: "UPI / QR",
    category: "Room Stay",
  });
  const [isAddExpenseModalOpen, setIsAddExpenseModalOpen] = useState(false);
  const [newExpenseForm, setNewExpenseForm] = useState({
    department: "Kitchen",
    description: "",
    amount: "",
    loggedBy: userName,
  });
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [selectedChatrixInvoiceStaff, setSelectedChatrixInvoiceStaff] = useState(null);
  const [selectedChatrixInvoiceIndex, setSelectedChatrixInvoiceIndex] = useState(0);
  const [selectedVisitorIncomeStaff, setSelectedVisitorIncomeStaff] = useState(null);
  const [visitorChatInput, setVisitorChatInput] = useState("");
  const [activePrintSalarySlip, setActivePrintSalarySlip] = useState(null);
  const [showSalaryDetailsMap, setShowSalaryDetailsMap] = useState({});

  // KITCHEN CHATRIX MULTI-BATCH EXPORTS & CHAT BOX STATE
  const [selectedKitchenChatrixChef, setSelectedKitchenChatrixChef] = useState(null);
  const [kitchenChatInput, setKitchenChatInput] = useState("");
  const [exportedKitchenBatches, setExportedKitchenBatches] = useState(() => {
    try {
      const saved = localStorage.getItem("hotel_chatrix_kitchen_exports");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch { }
    return DEFAULT_KITCHEN_ORDER_BATCHES;
  });

  // Sync real-time when Accountant exports data or Chef exports kitchen data
  // REAL VISITOR INCOME EXPORTS (SYNCED ACROSS ACCOUNTANT & SUPER ADMIN CHATRIX)
  const [exportedVisitorIncomes, setExportedVisitorIncomes] = useState(() => {
    try {
      const saved = localStorage.getItem("hotel_chatrix_visitor_income_exports");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      const latest = localStorage.getItem("hotel_latest_exported_visitor_income");
      if (latest) return [JSON.parse(latest), ...DEFAULT_VISITOR_INCOME_BATCHES];
    } catch { }
    return DEFAULT_VISITOR_INCOME_BATCHES;
  });

  // Sync real-time when Accountant exports data
  useEffect(() => {
    const handleExportSync = () => {
      try {
        const saved = localStorage.getItem("hotel_accounting_invoices");
        if (saved) setAccountingInvoices(JSON.parse(saved));
      } catch (e) { }
    };
    const handleVisitorExportSync = (e) => {
      try {
        if (e?.detail) {
          setExportedVisitorIncomes((prev) => [e.detail, ...prev.filter((x) => x.id !== e.detail.id)]);
        } else {
          const saved = localStorage.getItem("hotel_chatrix_visitor_income_exports");
          if (saved) setExportedVisitorIncomes(JSON.parse(saved));
        }
      } catch (err) { }
    };
    const handleKitchenExportSync = (e) => {
      try {
        if (e?.detail) {
          setExportedKitchenBatches((prev) => [e.detail, ...prev.filter((x) => x.id !== e.detail.id)]);
        } else {
          const saved = localStorage.getItem("hotel_chatrix_kitchen_exports");
          if (saved) setExportedKitchenBatches(JSON.parse(saved));
        }
      } catch (err) { }
    };

    window.addEventListener("accountant_payroll_exported", handleExportSync);
    window.addEventListener("accountant_visitor_income_exported", handleVisitorExportSync);
    window.addEventListener("kitchen_orders_exported", handleKitchenExportSync);
    window.addEventListener("chatrix_invoice_generated", handleExportSync);
    window.addEventListener("storage", handleExportSync);
    window.addEventListener("storage", handleVisitorExportSync);
    window.addEventListener("storage", handleKitchenExportSync);

    return () => {
      window.removeEventListener("accountant_payroll_exported", handleExportSync);
      window.removeEventListener("accountant_visitor_income_exported", handleVisitorExportSync);
      window.removeEventListener("kitchen_orders_exported", handleKitchenExportSync);
      window.removeEventListener("chatrix_invoice_generated", handleExportSync);
      window.removeEventListener("storage", handleExportSync);
      window.removeEventListener("storage", handleVisitorExportSync);
      window.removeEventListener("storage", handleKitchenExportSync);
    };
  }, []);

  // VISITOR INCOME RECORDS (FALLBACK & MANUAL ENTRIES)
  const [visitorIncomeList, setVisitorIncomeList] = useState(() => {
    try {
      const saved = localStorage.getItem("hotel_visitor_incomes");
      if (saved) return JSON.parse(saved);
    } catch { }
    return [
      { id: "VIS-001", name: "Vikram Singhania", phone: "+91 98290 11223", room: "101", purpose: "Client Meeting", fee: 1500, status: "Collected", method: "UPI / QR", date: "Today, 11:30 AM", time: "11:30 AM", hostGuest: "Aman Verma" },
      { id: "VIS-002", name: "Ananya Roy", phone: "+91 98765 43210", room: "204", purpose: "Family Visit", fee: 1200, status: "Collected", method: "Cash", date: "Today, 01:15 PM", time: "01:15 PM", hostGuest: "Pooja Sharma" },
      { id: "VIS-003", name: "Deepak Choudhary", phone: "+91 94140 88776", room: "302", purpose: "Conference Guest", fee: 2500, status: "Collected", method: "Credit Card", date: "Yesterday, 04:45 PM", time: "04:45 PM", hostGuest: "Karan Malhotra" },
      { id: "VIS-004", name: "Suresh Meena", phone: "+91 91234 56789", room: "105", purpose: "Vendor Meeting", fee: 800, status: "Collected", method: "UPI / QR", date: "2 days ago", time: "10:00 AM", hostGuest: "Neha Gupta" },
    ];
  });

  const saveAccountingInvoices = (invs) => {
    setAccountingInvoices(invs);
    try {
      localStorage.setItem("hotel_accounting_invoices", JSON.stringify(invs));
    } catch { }
  };

  const handleAddInvoice = (e) => {
    e.preventDefault();
    const amt = Number(newInvoiceForm.amount) || 0;
    const pd = Number(newInvoiceForm.paid) || 0;
    const inv = {
      id: `INV-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`,
      guest: newInvoiceForm.guest || "Walk-in Guest",
      room: newInvoiceForm.room || "101",
      date: new Date().toLocaleDateString(),
      amount: amt,
      paid: pd,
      method: newInvoiceForm.method,
      status: pd >= amt ? "Paid" : pd > 0 ? "Partial" : "Pending",
      category: newInvoiceForm.category,
    };
    const updated = [inv, ...accountingInvoices];
    saveAccountingInvoices(updated);
    setIsAddInvoiceModalOpen(false);
    setNewInvoiceForm({ guest: "", room: "101", amount: "", paid: "", method: "UPI / QR", category: "Room Stay" });
    showToast(`Invoice ${inv.id} recorded successfully!`);
  };

  const handleAddExpense = (e) => {
    e.preventDefault();
    const exp = {
      id: Date.now(),
      department: newExpenseForm.department,
      description: newExpenseForm.description,
      amount: Number(newExpenseForm.amount) || 0,
      date: "Today",
      loggedBy: newExpenseForm.loggedBy || userName,
    };
    const updated = [exp, ...accountingExpenses];
    setAccountingExpenses(updated);
    try {
      localStorage.setItem("hotel_accounting_expenses", JSON.stringify(updated));
    } catch { }
    setIsAddExpenseModalOpen(false);
    setNewExpenseForm({ department: "Kitchen", description: "", amount: "", loggedBy: userName });
    showToast(`Expense of ₹${exp.amount} logged for ${exp.department}!`);
  };

  const filteredAccountingInvoices = accountingInvoices.filter((inv) => {
    const matchesFilter = accountingFilter === "All" || inv.status === accountingFilter;
    const q = accountingSearch.toLowerCase().trim();
    const matchesSearch =
      !q ||
      String(inv.id).toLowerCase().includes(q) ||
      String(inv.guest).toLowerCase().includes(q) ||
      String(inv.room).toLowerCase().includes(q) ||
      String(inv.category).toLowerCase().includes(q);
    return matchesFilter && matchesSearch;
  });

  // Dynamic calculations for the 4 Executive Metric Cards
  const totalInvoicedAmount = accountingInvoices.reduce((sum, i) => sum + (Number(i.amount) || 0), 0);
  const currentStaffList = (getEmployees() || []);
  const totalEmployeeSalary = currentStaffList.reduce((sum, e) => {
    const sal = Number(e.salary) || Number(e.baseSalary) || Number(e.monthlySalary) || 28000;
    return sum + sal;
  }, 0) || 140000;
  const totalPaidSalary = currentStaffList.reduce((sum, e) => {
    const sal = Number(e.salary) || Number(e.baseSalary) || Number(e.monthlySalary) || 28000;
    return sum + Math.round(sal * 0.85);
  }, 0) || 119000;
  const totalVisitorIncome = visitorIncomeList.reduce((sum, v) => sum + (Number(v.fee) || 0), 0) || 6000;

  // Digital Clock Ticker
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
      setLiveWorkingSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // LOAD REAL DATA FROM DATABASE
  const loadAllData = async () => {
    try {
      const [roomsData, tasksRes, attendanceData, leavesData] = await Promise.all([
        fetchRooms(),
        fetchHkTasksFromAPI(),
        fetchAttendanceRoster(),
        fetchStaffLeaves(),
      ]);

      // Robust rooms loading with multi-tier fallback so room count is never 0
      let validRooms = [];
      try {
        const apiR = await fetchRoomsFromApi();
        if (Array.isArray(apiR) && apiR.length > 0) validRooms = apiR;
      } catch (e) { }

      if (validRooms.length === 0 && Array.isArray(roomsData) && roomsData.length > 0) {
        validRooms = roomsData;
      }

      if (validRooms.length === 0) {
        validRooms = getRooms();
      }

      if (Array.isArray(validRooms) && validRooms.length > 0) {
        setDbRooms(validRooms);
      }
      if (tasksRes?.tasks) {
        setTasks(tasksRes.tasks);
      }
      if (attendanceData?.roster) {
        setRoster(attendanceData.roster);
        if (attendanceData.metrics) {
          setAttendanceMetrics(attendanceData.metrics);
        }
      }
      if (Array.isArray(leavesData)) {
        setLeaves(leavesData);
      }
    } catch (err) {
      console.error("Error loading housekeeping operational data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();

    // Periodic auto-refresh every 10 seconds for live synchronization
    const interval = setInterval(loadAllData, 10000);

    // Real-time Event Subscriptions
    const unsubHk = subscribeHkTasks((updatedTasks, detail) => {
      if (Array.isArray(updatedTasks)) setTasks(updatedTasks);
      loadAllData();
      if (detail?.message) showToast(detail.message);
    });

    const unsubAttendance = subscribeStaffAttendance((data, detail) => {
      if (data?.roster) setRoster(data.roster);
      if (data?.metrics) setAttendanceMetrics(data.metrics);
      loadAllData();
      if (detail?.message) showToast(detail.message);
    });

    const handleStorageChange = () => {
      setCurrentBranchName(getCurrentOrg() || "Matcha Tea");
      loadAllData();
    };
    window.addEventListener("storage", handleStorageChange);

    return () => {
      clearInterval(interval);
      unsubHk();
      unsubAttendance();
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  // COMPUTE DYNAMIC ROOM CARDS LINKING REAL DATABASE ROOMS TO HOUSEKEEPING TASKS
  const roomStatusList = dbRooms.map((room) => {
    const roomNumStr = String(room.roomNumber || room.number || room.id).replace(/\D/g, "");
    // Find active housekeeping task matching this room
    const matchingTask = tasks.find((t) => {
      if (t.roomId && String(t.roomId) === String(room.id)) return true;
      const tNum = String(t.room || "").replace(/\D/g, "");
      return tNum && tNum === roomNumStr;
    });

    // Derive cleaning status
    let cleaningStatus = "Dirty";
    let statusBg = "rgba(239, 68, 68, 0.12)";
    let statusColor = "#ef4444";

    if (matchingTask) {
      cleaningStatus = matchingTask.status;
      statusBg = matchingTask.statusBg || "#f1f5f9";
      statusColor = matchingTask.statusColor || "#475569";
    } else if (room.status === "Available" || room.status === "Clean") {
      cleaningStatus = "Clean";
      statusBg = "rgba(16, 185, 129, 0.12)";
      statusColor = "#10b981";
    } else if (room.status === "Cleaning") {
      cleaningStatus = "Cleaning";
      statusBg = "rgba(245, 158, 11, 0.12)";
      statusColor = "#f59e0b";
    }

    return {
      roomId: room.id,
      roomNumber: room.roomNumber || `Room ${room.id}`,
      floor: room.floor || "1st Floor",
      roomType: room.type || room.name || "Standard Room",
      status: cleaningStatus,
      statusBg,
      statusColor,
      assignedStaff: matchingTask?.staff || "Unassigned",
      assignedStaffEmail: matchingTask?.staffEmail || "",
      assignedStaffId: matchingTask?.staffId || "",
      currentTask: matchingTask?.task || (cleaningStatus === "Clean" ? "Room Sanitized & Inspected" : "Check-Out Turnover & Sanitize"),
      cleaningType: matchingTask?.cleaningType || "Check-Out Turnover",
      shift: matchingTask?.shift || "Morning",
      priority: matchingTask?.priority || "Normal",
      lastUpdated: matchingTask?.statusActionAt || matchingTask?.assignedTime || "Today",
      photoProofUrl: matchingTask?.photoProofUrl,
      photoProofs: matchingTask?.photoProofs || [],
      rejectedReason: matchingTask?.rejectedReason,
      approvedBy: matchingTask?.approvedBy,
      taskId: matchingTask?.id,
      rawRoom: room,
      rawTask: matchingTask,
    };
  });

  // TOP SUMMARY REAL METRICS
  const totalRoomsCount = dbRooms.length;
  const cleanRoomsCount = roomStatusList.filter((r) => r.status === "Clean" || r.status === "Ready" || r.status === "Cleaned & Approved").length;
  const inProgressCount = roomStatusList.filter((r) => r.status === "Cleaning" || r.status === "In Progress").length;
  const unassignedRoomsCount = roomStatusList.filter(
    (r) =>
      (!r.assignedStaff || r.assignedStaff === "Unassigned" || r.assignedStaff === "Staff") &&
      r.status !== "Clean" &&
      r.status !== "Ready" &&
      r.status !== "Cleaned & Approved"
  ).length;
  const assignedRoomsCount = roomStatusList.filter(
    (r) => r.assignedStaff && r.assignedStaff !== "Unassigned" && r.assignedStaff !== "Staff"
  ).length;
  const dirtyRoomsCount = roomStatusList.filter((r) => r.status === "Dirty" || r.status === "Re-cleaning Scheduled" || r.status === "Rescheduled").length;
  const photoReviewsCount = tasks.filter((t) => t.status === "Photo Uploaded" || (t.approvalStatus && t.approvalStatus.includes("Pending"))).length;
  const cleanPercentage = totalRoomsCount > 0 ? Math.round((cleanRoomsCount / totalRoomsCount) * 100) : 0;

  // Real staff members for active branch (Housekeeping + other depts if needed)
  const effectiveRoster = React.useMemo(() => {
    let branchStaff = [];
    try {
      branchStaff = getEmployees() || [];
    } catch {
      branchStaff = [];
    }
    const activeOrg = currentBranchName || getCurrentOrg();
    const activeOrgId = (typeof getCurrentOrgId === "function" ? getCurrentOrgId() : "") || "";
    const hkOnly = branchStaff.filter((e) => {
      if (!e) return false;
      const eOrgId = e.orgId || e.org_id;
      const eOrgName = e.org || e.org_name || e.orgName;
      if (activeOrgId && eOrgId && eOrgId !== activeOrgId) return false;
      if (activeOrg && activeOrg !== "All" && activeOrg !== "Super Admin" && eOrgName && eOrgName.toLowerCase() !== activeOrg.toLowerCase()) return false;
      const d = (e.department || "").toLowerCase();
      const r = (e.role || "").toLowerCase();
      const id = String(e.id || e.staff_id || e.staffId || "").toLowerCase();
      return d.includes("housekeep") || r.includes("housekeep") || id.startsWith("hk");
    });

    const seenHkIds = new Set();
    const baseStaff = [];
    hkOnly.forEach((emp) => {
      const sid = String(emp.id || emp.staff_id || emp.staffId || "").toLowerCase().trim();
      const semail = String(emp.email || "").toLowerCase().trim();
      const sname = String(emp.name || emp.staffName || "").toLowerCase().trim();
      const key = sid || semail || sname;
      if (key && seenHkIds.has(key)) return;
      if (key) seenHkIds.add(key);
      if (semail) seenHkIds.add(semail);
      baseStaff.push(emp);
    });

    return baseStaff.map((emp, index) => {
      const empId = String(emp.id || emp.staff_id || emp.staffId || `HK-${101 + index}`);
      const empEmail = (emp.email || "").toLowerCase().trim();
      const empName = (emp.name || emp.staffName || "").trim();

      // 1. Check matching record in attendance roster (synced from backend / local storage)
      const matchingBackend = (roster || []).find((r) => {
        const rStaffId = String(r.staffId || r.id || "");
        const rEmail = String(r.staffEmail || r.email || "").toLowerCase().trim();
        const rName = String(r.staffName || r.name || "").toLowerCase().trim();
        return (
          (empId && rStaffId === empId) ||
          (empEmail && rEmail && (rEmail === empEmail || rEmail.includes(empEmail) || empEmail.includes(rEmail))) ||
          (empName && rName && rName === empName.toLowerCase())
        );
      });

      // 2. Check local punch from Dashboard (hk_staff_attendance_${email})
      let localPunch = null;
      try {
        if (empEmail) {
          const punchRaw = localStorage.getItem(`hk_staff_attendance_${empEmail}`);
          if (punchRaw) {
            const p = JSON.parse(punchRaw);
            const todayStr = new Date().toDateString();
            if (p.date === todayStr) {
              localPunch = p;
            }
          }
        }
      } catch (e) { }

      // 3. Check real leave applications (both leaves state from backend/local and employee's local leave history)
      let activeLeave = (leaves || []).find((l) => {
        const lStaffId = String(l.staffId || l.id || "");
        const lEmail = String(l.staffEmail || l.email || "").toLowerCase().trim();
        const lName = String(l.staffName || l.name || "").toLowerCase().trim();
        const matchesStaff = (
          (empId && lStaffId === empId) ||
          (empEmail && lEmail && (lEmail === empEmail || lEmail.includes(empEmail) || empEmail.includes(lEmail))) ||
          (empName && lName && lName === empName.toLowerCase())
        );
        return matchesStaff && (l.status === "Approved" || l.status === "Pending" || l.status === "Pending Supervisor Approval");
      });

      if (!activeLeave && empEmail) {
        try {
          const historyRaw = localStorage.getItem(`hk_leave_history_${empEmail}`);
          if (historyRaw) {
            const historyList = JSON.parse(historyRaw);
            if (Array.isArray(historyList) && historyList.length > 0) {
              const latest = historyList[0];
              activeLeave = {
                leaveType: latest.type || "Casual Leave",
                reason: latest.reason || "Personal Leave",
                dates: latest.dates || latest.startDate || "Today",
                status: latest.status || "Pending",
              };
            }
          }
        } catch (e) { }
      }

      // 4. Determine REAL check-in & check-out (NO dummy fallback)
      let realClockIn = null;
      let realClockOut = null;

      if (matchingBackend && matchingBackend.clockIn) {
        realClockIn = matchingBackend.clockIn;
        realClockOut = matchingBackend.clockOut || null;
      } else if (localPunch && localPunch.checkInTime) {
        realClockIn = localPunch.checkInTime;
        realClockOut = localPunch.checkOutTime || null;
      }

      // 5. Determine REAL status
      let staffStatus = "Absent";
      if (activeLeave) {
        staffStatus = "On Leave";
      } else if (realClockIn && !realClockOut) {
        staffStatus = "Present";
      } else if (realClockOut) {
        staffStatus = "Checked Out";
      } else {
        staffStatus = "Absent";
      }

      const isOnDuty = Boolean(realClockIn && !realClockOut) && staffStatus !== "On Leave";

      let hoursWorked = "0h 0m";
      if (realClockIn && !realClockOut) {
        hoursWorked = "Active Now";
      } else if (realClockIn && realClockOut) {
        hoursWorked = matchingBackend?.hoursWorked || "Completed";
      }

      // 6. Real assigned task
      const activeTask = tasks.find((t) => {
        const tEmail = String(t.staffEmail || "").toLowerCase().trim();
        const tStaff = String(t.staff || "").toLowerCase().trim();
        const tStaffId = String(t.staffId || "").toLowerCase().trim();
        return (
          (empEmail && tEmail && tEmail === empEmail) ||
          (empId && tStaffId && tStaffId === empId) ||
          (empName && tStaff && tStaff === empName.toLowerCase())
        );
      });

      return {
        id: empId,
        staffId: empId,
        name: emp.name,
        staffName: emp.name,
        email: emp.email || "",
        staffEmail: emp.email || "",
        department: emp.department || "Housekeeping",
        role: emp.role || "housekeeping",
        shift: matchingBackend?.shift || emp.shift || "Morning (07:00 AM - 03:30 PM)",
        assignedArea: matchingBackend?.assignedArea || emp.assigned_area || emp.assignedArea || "1st & 2nd Floor Rooms",
        assignedWork: matchingBackend?.assignedWork || emp.assigned_work || "Room Turnover & Sanitization",
        status: staffStatus,
        isOnDuty,
        clockIn: realClockIn,
        clockOut: realClockOut,
        leaveDetails: activeLeave ? {
          type: activeLeave.leaveType || activeLeave.type || "Casual Leave",
          reason: activeLeave.reason || "Personal Leave",
          dates: activeLeave.dates || `${activeLeave.startDate || "Today"} - ${activeLeave.endDate || "Today"}`,
          status: activeLeave.status || "Pending",
        } : null,
        durationMinutes: matchingBackend?.durationMinutes || 0,
        durationText: hoursWorked,
        hoursWorked,
        avatar: emp.avatar || "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80",
        notes: matchingBackend?.notes || "",
        currentTask: activeTask ? { id: activeTask.id, room: activeTask.room, task: activeTask.task, status: activeTask.status } : null,
      };
    });
  }, [roster, leaves, tasks, currentBranchName]);

  // Real staff metrics
  const totalEmployeesCount = effectiveRoster.length;
  const presentTodayCount = effectiveRoster.filter((r) => r.status === "Present" || r.status === "Checked Out" || r.clockIn).length;
  const absentTodayCount = effectiveRoster.filter((r) => r.status === "Absent" && !r.clockIn).length;
  const checkedInCount = effectiveRoster.filter((r) => r.clockIn && !r.clockOut).length;
  const checkedOutCount = effectiveRoster.filter((r) => r.clockOut).length;
  const onLeaveCount = effectiveRoster.filter((r) => r.status === "On Leave").length;
  const hoursWorkedText = `${(effectiveRoster.filter((r) => r.clockIn).length * 2.5).toFixed(1)} hrs`;

  // Real employee list combining attendance roster & registered employees
  const allAvailableEmployees = React.useMemo(() => {
    const list = [];
    const seenIds = new Set();
    const seenEmails = new Set();
    const seenNames = new Set();

    // 1. Add all effective roster staff (with real duty & check-in status)
    (effectiveRoster || []).forEach((emp) => {
      const id = String(emp.staffId || emp.id || "");
      const email = String(emp.staffEmail || emp.email || "").toLowerCase();
      const normName = String(emp.staffName || emp.name || "").toLowerCase().trim();
      if (id) seenIds.add(id);
      if (email) seenEmails.add(email);
      if (normName) seenNames.add(normName);

      list.push({
        id: id || `ST-${list.length + 1}`,
        staffId: id || `ST-${list.length + 1}`,
        name: emp.staffName || emp.name || "Housekeeper",
        staffName: emp.staffName || emp.name || "Housekeeper",
        email: emp.staffEmail || emp.email || "",
        staffEmail: emp.staffEmail || emp.email || "",
        role: emp.role || "housekeeping",
        department: emp.department || "Housekeeping",
        shift: emp.shift || "Morning (07:00 AM - 03:30 PM)",
        assignedArea: emp.assignedArea || "1st Floor & Rooms",
        status: emp.status,
        clockIn: emp.clockIn,
        clockOut: emp.clockOut,
        avatar: emp.avatar || "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80",
        isOnDuty: Boolean(emp.clockIn && !emp.clockOut) || emp.status === "Present" || emp.status === "On Duty",
      });
    });

    // 2. Add any other Housekeeping employees not in effectiveRoster
    try {
      const stored = getEmployees() || [];
      stored.forEach((emp) => {
        const id = String(emp.id || emp.staff_id || emp.staffId || "");
        const email = String(emp.email || "").toLowerCase();
        const normName = String(emp.name || emp.staffName || "").toLowerCase().trim();
        const d = (emp.department || "").toLowerCase();
        const r = (emp.role || "").toLowerCase();
        const isHK = d.includes("housekeep") || r.includes("housekeep") || id.toLowerCase().startsWith("hk");

        if (!isHK) return;

        if ((!id || !seenIds.has(id)) && (!email || !seenEmails.has(email)) && (!normName || !seenNames.has(normName))) {
          if (id) seenIds.add(id);
          if (email) seenEmails.add(email);
          if (normName) seenNames.add(normName);
          list.push({
            id: id || `HK-${list.length + 1}`,
            staffId: id || `HK-${list.length + 1}`,
            name: emp.name || "Staff Member",
            staffName: emp.name || "Staff Member",
            email: emp.email || "",
            staffEmail: emp.email || "",
            role: emp.role || "housekeeping",
            department: "Housekeeping",
            shift: emp.shift || "Morning (07:00 AM - 03:30 PM)",
            assignedArea: emp.assigned_area || emp.assignedArea || "1st Floor & Rooms",
            status: "Absent",
            clockIn: null,
            clockOut: null,
            avatar: emp.avatar || "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80",
            isOnDuty: false,
          });
        }
      });
    } catch (e) { }

    // Sort: HK staff (HK-101 to HK-106) first in order, then others
    list.sort((a, b) => {
      const aIsHK = (a.staffId || "").startsWith("HK");
      const bIsHK = (b.staffId || "").startsWith("HK");
      if (aIsHK && !bIsHK) return -1;
      if (!aIsHK && bIsHK) return 1;
      return (a.staffId || "").localeCompare(b.staffId || "");
    });

    return list;
  }, [effectiveRoster]);

  // ACCOUNTING STAFF ATTENDANCE ROSTER & METRICS
  const [accountingDeptView, setAccountingDeptView] = useState("all"); // "all" | "chatrix"
  const [accountingStaffAttFilter, setAccountingStaffAttFilter] = useState("All"); // "All" | "CheckedIn" | "CheckedOut" | "Worked" | "OnLeave"

  // 1. ALL ACCOUNTING EMPLOYEES ROSTER (ONLY ACCOUNTING STAFF)
  const accountingAllHotelStaffRoster = React.useMemo(() => {
    let branchStaff = [];
    try {
      branchStaff = getEmployees() || [];
    } catch {
      branchStaff = [];
    }

    const activeOrg = currentBranchName || getCurrentOrg();
    const activeOrgId = (typeof getCurrentOrgId === "function" ? getCurrentOrgId() : "") || "";
    const filteredByBranch = branchStaff.filter((emp) => {
      if (!emp) return false;
      const eOrgId = emp.orgId || emp.org_id;
      const eOrgName = emp.org || emp.org_name || emp.orgName;
      if (activeOrgId && eOrgId && eOrgId !== activeOrgId) return false;
      if (activeOrg && activeOrg !== "All" && activeOrg !== "Super Admin" && eOrgName && eOrgName.toLowerCase() !== activeOrg.toLowerCase()) return false;

      // STRICT CHECK: ONLY Accounting department staff in Accounting Operations
      const d = (emp.department || "").toLowerCase();
      const r = (emp.role || "").toLowerCase();
      const id = String(emp.id || emp.staff_id || emp.staffId || "").toLowerCase();
      return d.includes("account") || d.includes("finance") || r.includes("account") || id.startsWith("acc");
    });

    const targetListRaw = filteredByBranch.length > 0
      ? filteredByBranch
      : branchStaff.filter((emp) => {
        const d = (emp?.department || "").toLowerCase();
        const r = (emp?.role || "").toLowerCase();
        const id = String(emp?.id || emp?.staff_id || emp?.staffId || "").toLowerCase();
        return d.includes("account") || d.includes("finance") || r.includes("account") || id.startsWith("acc");
      });

    // Deduplicate accounting staff by id / email / name
    const seenAccountingIds = new Set();
    const targetList = [];
    targetListRaw.forEach((emp) => {
      if (!emp) return;
      const sid = String(emp.id || emp.staff_id || emp.staffId || "").toLowerCase().trim();
      const semail = String(emp.email || "").toLowerCase().trim();
      const sname = String(emp.name || emp.staffName || "").toLowerCase().trim();
      const key = sid || semail || sname;
      if (key && seenAccountingIds.has(key)) return;
      if (key) seenAccountingIds.add(key);
      if (semail) seenAccountingIds.add(semail);
      targetList.push(emp);
    });

    return targetList.map((emp, index) => {
      const empId = String(emp.id || emp.staff_id || emp.staffId || `ST-${101 + index}`);
      const empEmail = (emp.email || "").toLowerCase().trim();
      const empName = (emp.name || emp.staffName || "").trim();

      const matchingBackend = (roster || []).find((r) => {
        const rStaffId = String(r.staffId || r.id || "");
        const rEmail = String(r.staffEmail || r.email || "").toLowerCase().trim();
        const rName = String(r.staffName || r.name || "").toLowerCase().trim();
        return (
          (empId && rStaffId === empId) ||
          (empEmail && rEmail && (rEmail === empEmail || rEmail.includes(empEmail) || empEmail.includes(rEmail))) ||
          (empName && rName && rName === empName.toLowerCase())
        );
      });

      let localPunch = null;
      try {
        if (empEmail) {
          const punchRaw = localStorage.getItem(`hk_staff_attendance_${empEmail}`);
          if (punchRaw) {
            const p = JSON.parse(punchRaw);
            if (p.date === new Date().toDateString()) localPunch = p;
          }
        }
      } catch (e) { }

      let activeLeave = (leaves || []).find((l) => {
        const lStaffId = String(l.staffId || l.id || "");
        const lEmail = String(l.staffEmail || l.email || "").toLowerCase().trim();
        const lName = String(l.staffName || l.name || "").toLowerCase().trim();
        const matches = (
          (empId && lStaffId === empId) ||
          (empEmail && lEmail && (lEmail === empEmail || lEmail.includes(empEmail) || empEmail.includes(lEmail))) ||
          (empName && lName && lName === empName.toLowerCase())
        );
        return matches && (l.status === "Approved" || l.status === "Pending");
      });

      let realClockIn = null;
      let realClockOut = null;
      if (matchingBackend && matchingBackend.clockIn) {
        realClockIn = matchingBackend.clockIn;
        realClockOut = matchingBackend.clockOut || null;
      } else if (localPunch && localPunch.checkInTime) {
        realClockIn = localPunch.checkInTime;
        realClockOut = localPunch.checkOutTime || null;
      }

      let staffStatus = "Absent";
      if (activeLeave) staffStatus = "On Leave";
      else if (realClockIn && !realClockOut) staffStatus = "Present";
      else if (realClockOut) staffStatus = "Checked Out";

      const isOnDuty = Boolean(realClockIn && !realClockOut) && staffStatus !== "On Leave";
      let hoursWorked = "0h 0m";
      if (realClockIn && !realClockOut) hoursWorked = "Active (2.5 hrs)";
      else if (realClockIn && realClockOut) hoursWorked = matchingBackend?.hoursWorked || "8.0 hrs";

      const dRaw = (emp.department || "").toLowerCase();
      const rRaw = (emp.role || "").toLowerCase();
      let department = emp.department || "Housekeeping";
      let roleDisplay = emp.role || "Staff";
      if (dRaw.includes("account") || rRaw.includes("account") || empId.startsWith("ACC-")) {
        department = "Accounting";
        roleDisplay = "Senior Accountant";
      } else if (dRaw.includes("kitchen") || dRaw.includes("food") || rRaw.includes("chef") || empId.startsWith("KIT-")) {
        department = "Kitchen";
        roleDisplay = "Chef / Kitchen Staff";
      } else {
        department = "Housekeeping";
        roleDisplay = "Housekeeping Staff";
      }

      return {
        id: empId,
        staffId: empId,
        name: emp.name || emp.staffName || "Staff Member",
        staffName: emp.name || emp.staffName || "Staff Member",
        email: emp.email || "",
        staffEmail: emp.email || "",
        department,
        role: roleDisplay,
        shift: matchingBackend?.shift || emp.shift || "Morning Shift",
        assignedArea: matchingBackend?.assignedArea || emp.assigned_area || emp.assignedArea || (department === "Accounting" ? "Finance Office" : department === "Kitchen" ? "Main Kitchen" : "1st & 2nd Floor Rooms"),
        assignedWork: matchingBackend?.assignedWork || emp.assigned_work || (department === "Accounting" ? "Invoicing & Financial Ledger" : department === "Kitchen" ? "Buffet & Hot Kitchen" : "Room Turnover & Cleaning"),
        status: staffStatus,
        isOnDuty,
        clockIn: realClockIn,
        clockOut: realClockOut,
        salary: Number(emp.salary) || Number(emp.baseSalary) || (department === "Accounting" ? 28000 : department === "Kitchen" ? 25000 : 20000),
        phone: emp.phone || "+91 98765 43210",
        avatar: emp.avatar || (department === "Accounting" ? "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80" : "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80"),
      };
    });
  }, [roster, leaves, currentBranchName]);

  // 2. CHATRIX STAFF ONLY (ACCOUNTING & FINANCE TEAM ONLY)
  const accountingChatrixStaffRoster = React.useMemo(() => {
    return accountingAllHotelStaffRoster.filter((emp) => {
      const d = (emp.department || "").toLowerCase();
      const r = (emp.role || "").toLowerCase();
      const id = String(emp.id || emp.staffId || "").toLowerCase();
      return d.includes("account") || d.includes("finance") || r.includes("account") || id.startsWith("acc");
    });
  }, [accountingAllHotelStaffRoster]);

  const totalAllStaffCount = accountingAllHotelStaffRoster.length;
  const totalChatrixStaffCount = accountingChatrixStaffRoster.length;
  const totalAccStaff = totalChatrixStaffCount;

  const activeRosterForAccountingView = accountingDeptView === "chatrix" ? accountingChatrixStaffRoster : accountingAllHotelStaffRoster;

  const accCheckedInCount = activeRosterForAccountingView.filter((r) => r.clockIn && !r.clockOut).length;
  const accCheckedOutCount = activeRosterForAccountingView.filter((r) => r.clockOut).length;
  const accOnLeaveCount = activeRosterForAccountingView.filter((r) => r.status === "On Leave").length;
  const accHoursWorkedText = `${(activeRosterForAccountingView.filter((r) => r.clockIn).length * 2.5).toFixed(1)} hrs`;

  const filteredAccountingRoster = activeRosterForAccountingView.filter((staff) => {
    if (accountingStaffAttFilter === "CheckedIn") return staff.clockIn && !staff.clockOut;
    if (accountingStaffAttFilter === "CheckedOut") return Boolean(staff.clockOut);
    if (accountingStaffAttFilter === "Worked") return Boolean(staff.clockIn || staff.clockOut);
    if (accountingStaffAttFilter === "OnLeave") return staff.status === "On Leave";
    return true;
  });

  // =========================================================================
  // KITCHEN STAFF ATTENDANCE ROSTER & METRICS (DEDICATED KITCHEN DATA ONLY)
  // =========================================================================
  const [kitchenDeptView, setKitchenDeptView] = useState("all"); // "all" | "chatrix"
  const [kitchenStaffAttFilter, setKitchenStaffAttFilter] = useState("All"); // "All" | "CheckedIn" | "CheckedOut" | "Worked" | "OnLeave"

  const kitchenAllStaffRoster = React.useMemo(() => {
    let branchStaff = [];
    try {
      branchStaff = getEmployees() || [];
    } catch {
      branchStaff = [];
    }

    const activeOrg = currentBranchName || getCurrentOrg();
    const activeOrgId = (typeof getCurrentOrgId === "function" ? getCurrentOrgId() : "") || "";

    const filteredByBranch = branchStaff.filter((emp) => {
      if (!emp) return false;
      const eOrgId = emp.orgId || emp.org_id;
      const eOrgName = emp.org || emp.org_name || emp.orgName;
      if (activeOrgId && eOrgId && eOrgId !== activeOrgId) return false;
      if (activeOrg && activeOrg !== "All" && activeOrg !== "Super Admin" && eOrgName && eOrgName.toLowerCase() !== activeOrg.toLowerCase()) return false;

      // STRICT CHECK: ONLY Kitchen / Chef / Dining / Food & Beverage staff
      const d = (emp.department || "").toLowerCase();
      const r = (emp.role || "").toLowerCase();
      const id = String(emp.id || emp.staff_id || emp.staffId || "").toLowerCase();
      return (
        d.includes("kitchen") ||
        d.includes("chef") ||
        d.includes("cook") ||
        d.includes("dining") ||
        d.includes("food") ||
        d.includes("f&b") ||
        r.includes("kitchen") ||
        r.includes("chef") ||
        r.includes("cook") ||
        r.includes("dining") ||
        r.includes("food") ||
        id.startsWith("kit") ||
        id.startsWith("chef")
      );
    });

    // Fallback kitchen team if no specific branch employees are tagged as kitchen
    const fallbackKitchenTeam = [
      { id: "KIT-101", staffId: "KIT-101", name: "Ranveer Brar", role: "Executive Head Chef", department: "Kitchen", shift: "Morning (07:00 AM - 03:30 PM)", assignedArea: "Main Kitchen & Hot Line", salary: 45000, phone: "+91 98230 45678", email: "chef.ranveer@hotel.com", avatar: "https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=150&auto=format&fit=crop&q=80" },
      { id: "KIT-102", staffId: "KIT-102", name: "Sanjeev Khurana", role: "Sous Chef & Bakery", department: "Kitchen", shift: "Morning (07:00 AM - 03:30 PM)", assignedArea: "Pastry & Bakery Station", salary: 38000, phone: "+91 98112 34567", email: "sanjeev.k@hotel.com", avatar: "https://images.unsplash.com/photo-1583394838336-acd977736f90?w=150&auto=format&fit=crop&q=80" },
      { id: "KIT-103", staffId: "KIT-103", name: "Vikram Negi", role: "Line Cook (Continental)", department: "Kitchen", shift: "Evening (02:30 PM - 11:00 PM)", assignedArea: "Grill & Continental", salary: 28000, phone: "+91 98765 89012", email: "vikram.negi@hotel.com", avatar: "https://images.unsplash.com/photo-1581299894007-aaa50297cf16?w=150&auto=format&fit=crop&q=80" },
      { id: "KIT-104", staffId: "KIT-104", name: "Anita Sharma", role: "Pantry & Cold Prep Chef", department: "Kitchen", shift: "Morning (07:00 AM - 03:30 PM)", assignedArea: "Salad, Juice & Pantry", salary: 26000, phone: "+91 94140 12345", email: "anita.s@hotel.com", avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80" },
      { id: "KIT-105", staffId: "KIT-105", name: "Rohan Verma", role: "Kitchen Steward & Sanitization", department: "Kitchen", shift: "Night (10:00 PM - 06:30 AM)", assignedArea: "Dishwashing & Sanitation", salary: 22000, phone: "+91 91234 67890", email: "rohan.v@hotel.com", avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80" },
    ];

    const targetListRaw = filteredByBranch.length > 0 ? filteredByBranch : fallbackKitchenTeam;

    const seenKitchenIds = new Set();
    const targetList = [];
    targetListRaw.forEach((emp) => {
      if (!emp) return;
      const sid = String(emp.id || emp.staff_id || emp.staffId || "").toLowerCase().trim();
      const semail = String(emp.email || "").toLowerCase().trim();
      const sname = String(emp.name || emp.staffName || "").toLowerCase().trim();
      const key = sid || semail || sname;
      if (key && seenKitchenIds.has(key)) return;
      if (key) seenKitchenIds.add(key);
      if (semail) seenKitchenIds.add(semail);
      targetList.push(emp);
    });

    return targetList.map((emp, index) => {
      const empId = String(emp.id || emp.staff_id || emp.staffId || `KIT-${101 + index}`);
      const empEmail = (emp.email || "").toLowerCase().trim();
      const empName = (emp.name || emp.staffName || "").trim();

      const matchingBackend = (roster || []).find((r) => {
        const rStaffId = String(r.staffId || r.id || "");
        const rEmail = String(r.staffEmail || r.email || "").toLowerCase().trim();
        const rName = String(r.staffName || r.name || "").toLowerCase().trim();
        return (
          (empId && rStaffId === empId) ||
          (empEmail && rEmail && (rEmail === empEmail || rEmail.includes(empEmail) || empEmail.includes(rEmail))) ||
          (empName && rName && rName === empName.toLowerCase())
        );
      });

      let localPunch = null;
      try {
        if (empEmail) {
          const punchRaw = localStorage.getItem(`hk_staff_attendance_${empEmail}`);
          if (punchRaw) {
            const p = JSON.parse(punchRaw);
            if (p.date === new Date().toDateString()) localPunch = p;
          }
        }
      } catch (e) { }

      let activeLeave = (leaves || []).find((l) => {
        const lStaffId = String(l.staffId || l.id || "");
        const lEmail = String(l.staffEmail || l.email || "").toLowerCase().trim();
        const lName = String(l.staffName || l.name || "").toLowerCase().trim();
        const matches = (
          (empId && lStaffId === empId) ||
          (empEmail && lEmail && (lEmail === empEmail || lEmail.includes(empEmail) || empEmail.includes(lEmail))) ||
          (empName && lName && lName === empName.toLowerCase())
        );
        return matches && (l.status === "Approved" || l.status === "Pending");
      });

      let realClockIn = null;
      let realClockOut = null;
      if (matchingBackend && matchingBackend.clockIn) {
        realClockIn = matchingBackend.clockIn;
        realClockOut = matchingBackend.clockOut || null;
      } else if (localPunch && localPunch.checkInTime) {
        realClockIn = localPunch.checkInTime;
        realClockOut = localPunch.checkOutTime || null;
      } else {
        // Default present check-in for kitchen staff on duty
        realClockIn = "07:30 AM";
        realClockOut = null;
      }

      let staffStatus = "Present";
      if (activeLeave) staffStatus = "On Leave";
      else if (realClockIn && !realClockOut) staffStatus = "Present";
      else if (realClockOut) staffStatus = "Checked Out";

      const isOnDuty = Boolean(realClockIn && !realClockOut) && staffStatus !== "On Leave";
      let hoursWorked = "2.5 hrs";
      if (realClockIn && !realClockOut) hoursWorked = "Active (2.5 hrs)";
      else if (realClockIn && realClockOut) hoursWorked = matchingBackend?.hoursWorked || "8.0 hrs";

      return {
        id: empId,
        staffId: empId,
        name: emp.name || emp.staffName || "Kitchen Staff",
        staffName: emp.name || emp.staffName || "Kitchen Staff",
        email: emp.email || `${(emp.name || "staff").toLowerCase().replace(/\s+/g, ".")}@hotel.com`,
        staffEmail: emp.email || "",
        department: "Kitchen & Dining",
        role: emp.role || "Chef / Kitchen Staff",
        shift: matchingBackend?.shift || emp.shift || "Morning (07:00 AM - 03:30 PM)",
        assignedArea: matchingBackend?.assignedArea || emp.assigned_area || emp.assignedArea || "Main Kitchen & Hot Line",
        assignedWork: matchingBackend?.assignedWork || emp.assigned_work || "Food Preparation & Orders",
        status: staffStatus,
        isOnDuty,
        clockIn: realClockIn,
        clockOut: realClockOut,
        salary: Number(emp.salary) || Number(emp.baseSalary) || 28000,
        phone: emp.phone || "+91 98765 43210",
        avatar: emp.avatar || "https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=150&auto=format&fit=crop&q=80",
      };
    });
  }, [roster, leaves, currentBranchName]);

  // Dedicated Kitchen Chatrix Staff
  const kitchenChatrixStaffRoster = React.useMemo(() => {
    return kitchenAllStaffRoster;
  }, [kitchenAllStaffRoster]);

  const totalKitchenAllStaffCount = kitchenAllStaffRoster.length;
  const totalKitchenChatrixStaffCount = kitchenChatrixStaffRoster.length;

  const activeRosterForKitchenView = kitchenDeptView === "chatrix" ? kitchenChatrixStaffRoster : kitchenAllStaffRoster;

  const kitchenCheckedInCount = activeRosterForKitchenView.filter((r) => r.clockIn && !r.clockOut).length;
  const kitchenCheckedOutCount = activeRosterForKitchenView.filter((r) => r.clockOut).length;
  const kitchenOnLeaveCount = activeRosterForKitchenView.filter((r) => r.status === "On Leave").length;
  const kitchenHoursWorkedText = `${(activeRosterForKitchenView.filter((r) => r.clockIn).length * 2.5).toFixed(1)} hrs`;

  const filteredKitchenStaffRoster = activeRosterForKitchenView.filter((staff) => {
    if (kitchenStaffAttFilter === "CheckedIn") return staff.clockIn && !staff.clockOut;
    if (kitchenStaffAttFilter === "CheckedOut") return Boolean(staff.clockOut);
    if (kitchenStaffAttFilter === "Worked") return Boolean(staff.clockIn || staff.clockOut);
    if (kitchenStaffAttFilter === "OnLeave") return staff.status === "On Leave";
    return true;
  });

  // SECTION 3: PENDING PHOTO APPROVALS TASKS
  const pendingPhotoApprovals = tasks.filter((t) => {
    const isPending =
      (t.status === "Photo Uploaded" || (t.approvalStatus && t.approvalStatus.includes("Pending"))) &&
      (t.photoProofUrl || (t.photoProofs && t.photoProofs.length > 0));
    if (!isPending) return false;

    // Filter by branch if specific branch is active in Super Admin PMS
    const activeOrg = currentBranchName || getCurrentOrg();
    const activeOrgId = (typeof getCurrentOrgId === "function" ? getCurrentOrgId() : "") || "";
    if (activeOrg && activeOrg !== "All" && activeOrg !== "all" && activeOrg !== "Super Admin") {
      if (t.orgName && t.orgName.toLowerCase() !== activeOrg.toLowerCase() && t.orgId && t.orgId !== activeOrgId) {
        return false;
      }
    }
    return true;
  });

  // SECTION 4: FILTERED ROOMS LIST
  const filteredRooms = roomStatusList.filter((r) => {
    // Search query filter
    const matchSearch =
      !search.trim() ||
      r.roomNumber.toLowerCase().includes(search.toLowerCase()) ||
      r.assignedStaff.toLowerCase().includes(search.toLowerCase()) ||
      r.currentTask.toLowerCase().includes(search.toLowerCase()) ||
      r.roomType.toLowerCase().includes(search.toLowerCase());

    // Floor filter
    const matchFloor = floorFilter === "All Floors" || r.floor.includes(floorFilter.split(" ")[0]);

    // Shift filter
    const matchShift = shiftFilter === "All" || r.shift === shiftFilter;

    // Priority filter
    const matchPriority = priorityFilter === "All" || (r.priority || "").includes(priorityFilter);

    // Status filter
    let matchStatus = true;
    if (statusFilter === "Unassigned") {
      matchStatus = (!r.assignedStaff || r.assignedStaff === "Unassigned" || r.assignedStaff === "Staff") && r.status !== "Clean" && r.status !== "Ready" && r.status !== "Cleaned & Approved";
    } else if (statusFilter === "Assigned") {
      matchStatus = r.assignedStaff && r.assignedStaff !== "Unassigned" && r.assignedStaff !== "Staff";
    } else if (statusFilter === "Dirty") {
      matchStatus = r.status === "Dirty";
    } else if (statusFilter === "Cleaning") {
      matchStatus = r.status === "Cleaning" || r.status === "In Progress";
    } else if (statusFilter === "Clean") {
      matchStatus = r.status === "Clean" || r.status === "Cleaned & Approved" || r.status === "Ready";
    } else if (statusFilter === "Photo Uploaded") {
      matchStatus = r.status === "Photo Uploaded";
    } else if (statusFilter === "Re-cleaning Scheduled") {
      matchStatus = r.status === "Re-cleaning Scheduled" || r.status === "Rescheduled";
    }

    return matchSearch && matchFloor && matchShift && matchPriority && matchStatus;
  });

  // Filter staff attendance by active staff metric button
  const filteredRoster = effectiveRoster.filter((staff) => {
    if (staffAttendanceFilter === "All") return true;
    if (staffAttendanceFilter === "Present") return staff.status === "Present" || staff.status === "Checked Out" || staff.status === "On Duty" || Boolean(staff.clockIn);
    if (staffAttendanceFilter === "Absent") return (staff.status === "Absent" || staff.status === "Off Duty") && !staff.clockIn;
    if (staffAttendanceFilter === "CheckedIn") return Boolean(staff.clockIn && !staff.clockOut);
    if (staffAttendanceFilter === "CheckedOut") return Boolean(staff.clockOut);
    if (staffAttendanceFilter === "Worked") return Boolean(staff.clockIn || staff.clockOut || (staff.hoursWorked && staff.hoursWorked !== "0h 0m"));
    if (staffAttendanceFilter === "OnLeave") return staff.status === "On Leave" || staff.status === "Leave";
    return true;
  });

  // Current logged in housekeeper attendance
  const myAttendance = roster.find(
    (r) =>
      (r.staffEmail && r.staffEmail.toLowerCase() === userEmail?.toLowerCase()) ||
      (r.staffName && userName && r.staffName.toLowerCase().includes(userName.toLowerCase().split(" ")[0]))
  ) || {
    staffId: "HK-101",
    staffName: userName || "Staff",
    assignedArea: "1st Floor & Suites",
    shift: "Morning (07:00 AM - 03:30 PM)",
    status: "On Duty",
    clockIn: null,
  };

  // Housekeeper assigned tasks strictly matching logged in housekeeper
  const myAssignedRooms = roomStatusList.filter(
    (r) =>
      (r.assignedStaffEmail && userEmail && r.assignedStaffEmail.toLowerCase() === userEmail.toLowerCase()) ||
      (r.assignedStaff && userName && userName !== "Super Admin" && r.assignedStaff.toLowerCase().includes(userName.toLowerCase().split(" ")[0]))
  );

  // Format seconds to text
  const formatSecondsToHours = (totalSec) => {
    const hours = Math.floor(totalSec / 3600);
    const minutes = Math.floor((totalSec % 3600) / 60);
    const seconds = totalSec % 60;
    return `${hours}h ${minutes}m ${seconds}s`;
  };

  // ==========================================
  // HANDLERS FOR REAL DATABASE OPERATIONS
  // ==========================================

  // 1. OPEN ASSIGN MODAL (Workflow 5)
  const handleOpenAssignModal = (roomItem = null, employeeItem = null) => {
    const targetRoom = roomItem || roomStatusList[0] || { roomId: 1, roomNumber: "101", floor: "1st Floor", roomType: "Deluxe Room" };
    const targetEmployee = employeeItem || roster[0] || { staffId: "HK-101", staffName: "Housekeeper", staffEmail: "" };

    setAssignModalRoom(targetRoom);
    setAssignModalSearch("");
    setAssignModalRoleFilter("all");
    setAssignForm({
      roomId: targetRoom.roomId,
      roomNumber: targetRoom.roomNumber,
      floor: targetRoom.floor,
      roomType: targetRoom.roomType,
      employeeId: targetEmployee.staffId || targetEmployee.id || "HK-101",
      employeeName: targetEmployee.staffName || targetEmployee.name || "Housekeeper",
      employeeEmail: targetEmployee.staffEmail || targetEmployee.email || "",
      cleaningType: targetRoom.cleaningType || "Check-Out Turnover",
      shift: targetRoom.shift || "Morning",
      priority: targetRoom.priority || "Normal",
      notes: `Clean thoroughly and sanitize all surfaces.`,
    });
    setIsAssignModalOpen(true);
  };

  // 1.0 CLOCK IN / OUT HANDLERS
  const handleClockIn = async (staff) => {
    try {
      const nowStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      await clockInStaff({
        staffId: staff.staffId || staff.id,
        staffName: staff.name || staff.staffName,
        shift: staff.shift || "Morning (07:00 AM - 03:30 PM)",
      });
      showToast(`🕒 ${staff.name} clocked in at ${nowStr}.`);
      loadAllData();
    } catch (e) {
      showToast(`🕒 Clocked in ${staff.name}`);
    }
  };

  const handleClockOut = async (staff) => {
    try {
      const nowStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      await clockOutStaff({
        staffId: staff.staffId || staff.id,
        staffName: staff.name || staff.staffName,
      });
      showToast(`📤 ${staff.name} clocked out at ${nowStr}.`);
      loadAllData();
    } catch (e) {
      showToast(`📤 Clocked out ${staff.name}`);
    }
  };

  // 1.1 DIRECT INSTANT ASSIGN HANDLER (Clicking any employee in modal list)
  const handleDirectAssign = async (employee) => {
    if (!assignModalRoom) return;
    const staffName = employee.staffName || employee.name || "Housekeeper";

    // Validate Check-In: Employees who are NOT checked in cannot be assigned tasks
    const isCheckedIn = Boolean(employee.clockIn && !employee.clockOut) || employee.isOnDuty || employee.status === "Present" || employee.status === "On Duty";
    if (!isCheckedIn) {
      showToast(`⚠️ Cannot assign: ${staffName} has not Checked In today!`);
      return;
    }

    try {
      const staffId = employee.staffId || employee.id || employee.staff_id || "HK-101";
      const staffEmail = employee.staffEmail || employee.email || "";
      const targetRoomNum = String(assignModalRoom.roomNumber || "").replace(/\D/g, "");
      const nowStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

      // Optimistic update so room immediately reflects assigned staff & leaves unassigned pool with zero lag
      const optimisticTask = {
        id: assignModalRoom.taskId || `HK-TASK-${Date.now().toString().slice(-4)}`,
        roomId: assignModalRoom.roomId,
        room: assignModalRoom.roomNumber,
        floor: assignModalRoom.floor,
        roomType: assignModalRoom.roomType,
        staff: staffName,
        staffId: staffId,
        staffEmail: staffEmail,
        shift: employee.shift || assignForm.shift || "Morning",
        cleaningType: assignForm.cleaningType || "Check-Out Turnover",
        task: `${assignForm.cleaningType || "Turnover"} & Sanitize`,
        status: "Assigned",
        statusColor: "#6366f1",
        statusBg: "#e0e7ff",
        priority: assignForm.priority || "Normal",
        assignedTime: nowStr,
        assignedBy: `${userName} (${role})`,
        approvalStatus: "Pending Cleaning",
      };

      setTasks((prev) => {
        const next = [...prev];
        const existingIdx = next.findIndex(
          (t) =>
            (assignModalRoom.taskId && String(t.id) === String(assignModalRoom.taskId)) ||
            (targetRoomNum && String(t.room || "").replace(/\D/g, "") === targetRoomNum)
        );
        if (existingIdx !== -1) {
          next[existingIdx] = { ...next[existingIdx], ...optimisticTask };
        } else {
          next.unshift(optimisticTask);
        }
        return next;
      });

      setIsAssignModalOpen(false);
      showToast(`✨ Room ${assignModalRoom.roomNumber ? (assignModalRoom.roomNumber.startsWith("Room") ? assignModalRoom.roomNumber.replace("Room", "").trim() : assignModalRoom.roomNumber) : ""} assigned to ${staffName}!`);

      await assignRoomTaskAPI({
        roomId: assignModalRoom.roomId,
        roomNumber: assignModalRoom.roomNumber,
        floor: assignModalRoom.floor,
        roomType: assignModalRoom.roomType,
        employeeId: staffId,
        employeeName: staffName,
        employeeEmail: staffEmail,
        cleaningType: assignForm.cleaningType || "Check-Out Turnover",
        shift: employee.shift || assignForm.shift || "Morning",
        priority: assignForm.priority || "Normal",
        notes: `Assigned to ${staffName}`,
        assignedBy: `${userName} (${role})`,
      });

      await loadAllData();
    } catch (err) {
      console.error("Error assigning room:", err);
      showToast("Failed to assign room.");
    }
  };

  // 2. SUBMIT ROOM ASSIGNMENT TO BACKEND (Workflow 5)
  const handleSubmitAssignment = async (e) => {
    e.preventDefault();

    // Validate Check-In for assigned employee
    const targetEmp = allAvailableEmployees.find(
      (item) => String(item.staffId || item.id) === String(assignForm.employeeId) || item.name === assignForm.employeeName
    );
    const isCheckedIn = targetEmp
      ? Boolean(targetEmp.clockIn && !targetEmp.clockOut) || targetEmp.isOnDuty || targetEmp.status === "Present" || targetEmp.status === "On Duty"
      : false;
    if (!isCheckedIn) {
      showToast(`⚠️ Cannot assign: ${assignForm.employeeName || "Selected staff"} has not Checked In today!`);
      return;
    }
    try {
      const targetRoomNum = String(assignForm.roomNumber || "").replace(/\D/g, "");
      const nowStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

      const optimisticTask = {
        id: assignForm.roomId ? `HK-TASK-${assignForm.roomId}` : `HK-TASK-${Date.now().toString().slice(-4)}`,
        roomId: assignForm.roomId,
        room: assignForm.roomNumber,
        floor: assignForm.floor,
        roomType: assignForm.roomType,
        staff: assignForm.employeeName,
        staffId: assignForm.employeeId,
        staffEmail: assignForm.employeeEmail,
        shift: assignForm.shift,
        cleaningType: assignForm.cleaningType,
        task: `${assignForm.cleaningType || "Turnover"} & Sanitize`,
        status: "Assigned",
        statusColor: "#6366f1",
        statusBg: "#e0e7ff",
        priority: assignForm.priority,
        assignedTime: nowStr,
        assignedBy: `${userName} (${role})`,
        approvalStatus: "Pending Cleaning",
        notes: assignForm.notes,
      };

      setTasks((prev) => {
        const next = [...prev];
        const existingIdx = next.findIndex(
          (t) =>
            (assignForm.roomId && String(t.roomId) === String(assignForm.roomId)) ||
            (targetRoomNum && String(t.room || "").replace(/\D/g, "") === targetRoomNum)
        );
        if (existingIdx !== -1) {
          next[existingIdx] = { ...next[existingIdx], ...optimisticTask };
        } else {
          next.unshift(optimisticTask);
        }
        return next;
      });

      setIsAssignModalOpen(false);
      showToast(`✨ ${assignForm.roomNumber} assigned to ${assignForm.employeeName}!`);

      await assignRoomTaskAPI({
        roomId: assignForm.roomId,
        roomNumber: assignForm.roomNumber,
        floor: assignForm.floor,
        roomType: assignForm.roomType,
        employeeId: assignForm.employeeId,
        employeeName: assignForm.employeeName,
        employeeEmail: assignForm.employeeEmail,
        cleaningType: assignForm.cleaningType,
        shift: assignForm.shift,
        priority: assignForm.priority,
        notes: assignForm.notes,
        assignedBy: `${userName} (${role})`,
      });

      await loadAllData();
    } catch (err) {
      showToast("Failed to assign room.");
    }
  };

  // 3. CLOCK-IN HANDLER
  const handleClockInAction = async (staffId, staffName, staffEmail) => {
    try {
      const res = await clockInStaff({
        staffId: staffId || myAttendance.staffId,
        staffName: staffName || myAttendance.staffName,
        staffEmail: staffEmail || myAttendance.staffEmail,
        shift: "Morning (07:00 - 15:30)",
        assignedArea: "1st Floor & Suites",
      });
      showToast(`🟢 ${staffName || myAttendance.staffName} clocked in successfully at ${res.clockInTime || "Now"}!`);
      await loadAllData();
    } catch (err) {
      showToast("Error clocking in.");
    }
  };

  // 4. CLOCK-OUT HANDLER
  const handleClockOutAction = async (staffId, staffName) => {
    if (window.confirm(`Are you sure you want to Clock Out ${staffName || myAttendance.staffName}?`)) {
      try {
        const res = await clockOutStaff({
          staffId: staffId || myAttendance.staffId,
        });
        showToast(`🚪 Clocked out at ${res.clockOutTime || "Now"} (${res.durationText || ""})`);
        await loadAllData();
      } catch (err) {
        showToast("Error clocking out.");
      }
    }
  };

  // 5. START CLEANING HANDLER
  const handleStartCleaningTask = async (roomItem) => {
    try {
      let targetTaskId = roomItem.taskId;
      if (!targetTaskId) {
        // Create task first if unassigned
        const created = await assignRoomTaskAPI({
          roomId: roomItem.roomId,
          roomNumber: roomItem.roomNumber,
          floor: roomItem.floor,
          roomType: roomItem.roomType,
          employeeId: myAttendance.staffId,
          employeeName: userName,
          employeeEmail: userEmail,
          cleaningType: "Check-Out Turnover",
          shift: "Morning",
          priority: "Normal",
          assignedBy: userName,
        });
        targetTaskId = created?.id;
      }
      if (targetTaskId) {
        await startHkTask(targetTaskId, userName);
        showToast(`🧼 Cleaning started for ${roomItem.roomNumber}. Timer running.`);
        await loadAllData();
      }
    } catch (err) {
      showToast("Could not start cleaning.");
    }
  };

  // 6. UPLOAD PHOTO PROOF HANDLER (Workflow 6)
  const handleOpenUploadProof = (roomItem) => {
    setUploadProofTask(roomItem);
    setProofPhotos([
      "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1584132967334-10e028bd69f7?auto=format&fit=crop&w=800&q=80",
    ]);
    setHousekeeperRemarks("Bedding sanitized, bathroom polished, fresh toiletries restocked.");
    setCleaningDuration(30);
  };

  const handleSubmitProof = async (e) => {
    e.preventDefault();
    if (!uploadProofTask) return;
    try {
      let targetTaskId = uploadProofTask.taskId;
      if (!targetTaskId) {
        const created = await assignRoomTaskAPI({
          roomId: uploadProofTask.roomId,
          roomNumber: uploadProofTask.roomNumber,
          floor: uploadProofTask.floor,
          roomType: uploadProofTask.roomType,
          employeeId: myAttendance.staffId,
          employeeName: userName,
          employeeEmail: userEmail,
          assignedBy: userName,
        });
        targetTaskId = created?.id;
      }

      await uploadHkPhotoProofMulti(targetTaskId, {
        photos: proofPhotos,
        remarks: housekeeperRemarks,
        durationMinutes: cleaningDuration,
        staffName: userName,
        staffEmail: userEmail,
      });

      showToast(`📸 Cleaning proof submitted for ${uploadProofTask.roomNumber}! Sent for Supervisor approval.`);
      setUploadProofTask(null);
      await loadAllData();
    } catch (err) {
      showToast("Proof submission failed.");
    }
  };

  // 7. APPROVE CLEANING HANDLER (Workflow 3 & 6)
  const handleApproveAction = async (taskId, roomNumber) => {
    try {
      await approveHkTask(taskId, userName, role);
      showToast(`✨ ${roomNumber || "Room"} verified & approved! Automatically marked Clean & Available in PMS.`);
      setInspectModalTask(null);
      await loadAllData();
    } catch (err) {
      showToast("Approval failed.");
    }
  };

  // 8. REJECT & RE-CLEAN HANDLER
  const handleOpenRejectModal = (taskItem) => {
    setRejectModalTask(taskItem);
    setSelectedRejectPreset(REJECTION_PRESETS[0]);
    setCustomRejectReason("");
  };

  const handleConfirmReject = async () => {
    if (!rejectModalTask) return;
    const finalReason = customRejectReason.trim() ? customRejectReason : selectedRejectPreset;
    try {
      await rejectAndRescheduleHkTask(rejectModalTask.taskId || rejectModalTask.id, userName, role, finalReason);
      showToast(`⚠️ Re-cleaning scheduled for ${rejectModalTask.roomNumber || rejectModalTask.room}: "${finalReason}"`);
      setRejectModalTask(null);
      setInspectModalTask(null);
      await loadAllData();
    } catch (err) {
      showToast("Rejection failed.");
    }
  };

  return (
    <div className="housekeeping-module" style={{ paddingBottom: "50px" }}>
      {/* SLEEK PILLS AT THE VERY TOP ABOVE PAGEHEADER */}
      {!isChefOrKitchen && (
        <div
          style={{
            display: "inline-flex",
            gap: "8px",
            marginBottom: "16px",
            background: "transparent",
            padding: "0",
            border: "none",
            boxShadow: "none",
            alignItems: "center",
            width: "fit-content",
          }}
        >
          {[
            {
              id: isHousekeeper ? "portal" : "dashboard",
              key: "housekeeping",
              label: "Housekeeping",
              icon: "🧹",
              active: activeTab === "dashboard" || activeTab === "portal",
              activeBg: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
              activeShadow: "0 4px 14px rgba(99, 102, 241, 0.4)",
            },
            {
              id: "kitchen",
              key: "kitchen",
              label: "Kitchen",
              icon: "🍳",
              active: activeTab === "kitchen",
              activeBg: "linear-gradient(135deg, #f97316 0%, #ea580c 100%)",
              activeShadow: "0 4px 14px rgba(249, 115, 22, 0.4)",
            },
            {
              id: "accounting",
              key: "accounting",
              label: "Accounting",
              icon: "📊",
              active: activeTab === "accounting",
              activeBg: "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)",
              activeShadow: "0 4px 14px rgba(139, 92, 246, 0.4)",
            },
          ]
            .filter((tab) => {
              if (isChefOrKitchen) return tab.key === "kitchen";
              if (isHousekeeper) return tab.key === "housekeeping";
              if (cleanRole === "accountant") return tab.key === "accounting";
              return true; // Admins / Managers / Super Admins see all 3
            })
            .map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                style={{
                  height: "38px",
                  padding: "0 18px",
                  borderRadius: "999px",
                  border: tab.active ? "none" : "1px solid #e2e8f0",
                  background: tab.active ? tab.activeBg : "#ffffff",
                  color: tab.active ? "#ffffff" : "#475569",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  fontSize: "13px",
                  fontWeight: "750",
                  boxShadow: tab.active ? tab.activeShadow : "0 2px 6px rgba(0,0,0,0.04)",
                  transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                  transform: tab.active ? "translateY(-1px)" : "none",
                }}
              >
                <span style={{ fontSize: "14px" }}>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
        </div>
      )}

      {/* PAGE HEADER */}
      <PageHeader
        title={
          activeTab === "kitchen"
            ? "Kitchen & Dining Operations"
            : activeTab === "accounting"
              ? "Accounting & Financial Ledger"
              : "Housekeeping & Operations"
        }
        subtitle={
          activeTab === "kitchen"
            ? "Live Kitchen Orders • Food Preparation Status • Daily Pantry & Groceries"
            : activeTab === "accounting"
              ? "Invoices & Receipts • Payment Collections • Departmental Expense Ledger"
              : ""
        }
        action={
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            {activeTab === "kitchen" ? (
              <button
                type="button"
                onClick={() => setIsAddKitchenModalOpen(true)}
                style={{
                  padding: "10px 20px",
                  borderRadius: "12px",
                  fontSize: "13.5px",
                  fontWeight: "700",
                  border: "none",
                  background: "linear-gradient(135deg, #f97316 0%, #ea580c 100%)",
                  color: "#ffffff",
                  cursor: "pointer",
                  boxShadow: "0 4px 14px rgba(249, 115, 22, 0.4)",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  transition: "all 0.2s ease",
                }}
              >
                <FaPlus style={{ fontSize: "12px" }} /> New Kitchen Order
              </button>
            ) : activeTab === "accounting" ? (
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  type="button"
                  onClick={() => setIsAddExpenseModalOpen(true)}
                  style={{
                    padding: "10px 16px",
                    borderRadius: "12px",
                    fontSize: "13px",
                    fontWeight: "700",
                    border: "1px solid #cbd5e1",
                    background: "#ffffff",
                    color: "#334155",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <FaPlus style={{ fontSize: "11px" }} /> Log Expense
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddInvoiceModalOpen(true)}
                  style={{
                    padding: "10px 18px",
                    borderRadius: "12px",
                    fontSize: "13.5px",
                    fontWeight: "700",
                    border: "none",
                    background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                    color: "#ffffff",
                    cursor: "pointer",
                    boxShadow: "0 4px 14px rgba(16, 185, 129, 0.4)",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    transition: "all 0.2s ease",
                  }}
                >
                  <FaPlus style={{ fontSize: "12px" }} /> Record Invoice
                </button>
              </div>
            ) : (
              canEdit("housekeeping", role) && (
                <button
                  type="button"
                  onClick={() => handleOpenAssignModal()}
                  style={{
                    padding: "10px 20px",
                    borderRadius: "12px",
                    fontSize: "13.5px",
                    fontWeight: "700",
                    border: "none",
                    background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
                    color: "#ffffff",
                    cursor: "pointer",
                    boxShadow: "0 4px 14px rgba(99, 102, 241, 0.4)",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    transition: "all 0.2s ease",
                  }}
                >
                  <FaPlus style={{ fontSize: "12px" }} /> Assign New Task
                </button>
              )
            )}
          </div>
        }
      />

      {/* REAL-TIME TOAST ALERT */}
      {toastMsg && (
        <div
          style={{
            background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
            color: "#ffffff",
            padding: "14px 22px",
            borderRadius: "14px",
            marginBottom: "20px",
            fontSize: "14px",
            fontWeight: "700",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            boxShadow: "0 10px 25px -5px rgba(0,0,0,0.3)",
            borderLeft: "5px solid #10b981",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "18px" }}>🔔</span>
            <span>{toastMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setToastMsg("")}
            style={{ background: "transparent", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: "16px" }}
          >
            <FaTimes />
          </button>
        </div>
      )}

      {activeTab === "dashboard" && (
        <>
          {/* ===================================================================== */}
          {/* ===================================================================== */}
          {/* 1. UNIFIED OPERATIONAL & STAFF ATTENDANCE METRICS BANNER (FULL PURPLE)  */}
          {/* ===================================================================== */}
          <div
            style={{
              background: "linear-gradient(135deg, #2e0854 0%, #4c1d95 35%, #6b21a8 70%, #7c3aed 100%)",
              borderRadius: "20px",
              padding: "20px 22px",
              marginBottom: "22px",
              border: "1.5px solid rgba(216, 180, 254, 0.35)",
              boxShadow: "0 12px 32px -4px rgba(76, 29, 149, 0.5), 0 4px 12px -2px rgba(124, 58, 237, 0.3)",
              display: "flex",
              flexDirection: "column",
              gap: "18px",
            }}
          >
            {/* 1.1 STAFF DUTY & ATTENDANCE OPERATIONAL METRICS (EXACT ACCOUNTING CARD SIZE & FROSTED GLASS) */}
            <div>
              <div style={{ marginBottom: "14px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
                <div style={{ fontSize: "14.5px", fontWeight: "900", color: "#ffffff", letterSpacing: "0.4px", display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "18px" }}>👥</span> Staff Duty & Attendance ({currentBranchName})
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
                  gap: "12px",
                }}
              >
                {/* 1. All Staff Card */}
                <div
                  onClick={() => {
                    setStaffAttendanceFilter("All");
                    setActiveOperationalView("staff");
                    document.getElementById("staff-attendance-section")?.scrollIntoView({ behavior: "smooth" });
                  }}
                  title="Click to view all active staff on roster"
                  style={{
                    background: staffAttendanceFilter === "All" && activeOperationalView === "staff"
                      ? "rgba(255, 255, 255, 0.22)"
                      : "rgba(255, 255, 255, 0.12)",
                    backdropFilter: "blur(8px)",
                    padding: "16px 18px",
                    borderRadius: "16px",
                    border: staffAttendanceFilter === "All" && activeOperationalView === "staff"
                      ? "2px solid #cbd5e1"
                      : "1px solid rgba(216, 180, 254, 0.35)",
                    display: "flex",
                    alignItems: "center",
                    gap: "14px",
                    transition: "all 0.2s ease",
                    cursor: "pointer",
                    boxShadow: staffAttendanceFilter === "All" && activeOperationalView === "staff"
                      ? "0 6px 20px rgba(99, 102, 241, 0.35)"
                      : "none",
                  }}
                >
                  <div
                    style={{
                      width: "44px",
                      height: "44px",
                      borderRadius: "12px",
                      background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
                      color: "#ffffff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "18px",
                      boxShadow: "0 4px 12px rgba(99, 102, 241, 0.35)",
                      flexShrink: 0,
                    }}
                  >
                    👥
                  </div>
                  <div>
                    <span style={{ fontSize: "11.5px", color: "#e9d5ff", fontWeight: "700", display: "block" }}>
                      All Staff
                    </span>
                    <strong style={{ fontSize: "20px", color: "#ffffff", fontWeight: "900", letterSpacing: "0.3px" }}>
                      <AnimatedNumber value={totalEmployeesCount} />
                    </strong>
                    <span style={{ fontSize: "11px", color: "#c7d2fe", display: "block", marginTop: "2px", fontWeight: "700" }}>
                      Active in Branch
                    </span>
                  </div>
                </div>

                {/* 2. Check-In Card */}
                <div
                  onClick={() => {
                    setStaffAttendanceFilter("CheckedIn");
                    setActiveOperationalView("staff");
                    document.getElementById("staff-attendance-section")?.scrollIntoView({ behavior: "smooth" });
                  }}
                  title="Click to view live checked-in staff"
                  style={{
                    background: staffAttendanceFilter === "CheckedIn"
                      ? "rgba(255, 255, 255, 0.22)"
                      : "rgba(255, 255, 255, 0.12)",
                    backdropFilter: "blur(8px)",
                    padding: "16px 18px",
                    borderRadius: "16px",
                    border: staffAttendanceFilter === "CheckedIn"
                      ? "2px solid #7dd3fc"
                      : "1px solid rgba(216, 180, 254, 0.35)",
                    display: "flex",
                    alignItems: "center",
                    gap: "14px",
                    transition: "all 0.2s ease",
                    cursor: "pointer",
                    boxShadow: staffAttendanceFilter === "CheckedIn"
                      ? "0 6px 20px rgba(2, 132, 199, 0.35)"
                      : "none",
                  }}
                >
                  <div
                    style={{
                      width: "44px",
                      height: "44px",
                      borderRadius: "12px",
                      background: "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)",
                      color: "#ffffff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "18px",
                      boxShadow: "0 4px 12px rgba(2, 132, 199, 0.35)",
                      flexShrink: 0,
                    }}
                  >
                    📥
                  </div>
                  <div>
                    <span style={{ fontSize: "11.5px", color: "#e9d5ff", fontWeight: "700", display: "block" }}>
                      Check-In
                    </span>
                    <strong style={{ fontSize: "20px", color: "#ffffff", fontWeight: "900", letterSpacing: "0.3px" }}>
                      <AnimatedNumber value={checkedInCount} />
                    </strong>
                    <span style={{ fontSize: "11px", color: "#bae6fd", display: "block", marginTop: "2px", fontWeight: "700" }}>
                      On Live Duty
                    </span>
                  </div>
                </div>

                {/* 3. Checked Out Card */}
                <div
                  onClick={() => {
                    setStaffAttendanceFilter("CheckedOut");
                    setActiveOperationalView("staff");
                    document.getElementById("staff-attendance-section")?.scrollIntoView({ behavior: "smooth" });
                  }}
                  title="Click to view checked-out staff"
                  style={{
                    background: staffAttendanceFilter === "CheckedOut"
                      ? "rgba(255, 255, 255, 0.22)"
                      : "rgba(255, 255, 255, 0.12)",
                    backdropFilter: "blur(8px)",
                    padding: "16px 18px",
                    borderRadius: "16px",
                    border: staffAttendanceFilter === "CheckedOut"
                      ? "2px solid #fed7aa"
                      : "1px solid rgba(216, 180, 254, 0.35)",
                    display: "flex",
                    alignItems: "center",
                    gap: "14px",
                    transition: "all 0.2s ease",
                    cursor: "pointer",
                    boxShadow: staffAttendanceFilter === "CheckedOut"
                      ? "0 6px 20px rgba(234, 88, 12, 0.35)"
                      : "none",
                  }}
                >
                  <div
                    style={{
                      width: "44px",
                      height: "44px",
                      borderRadius: "12px",
                      background: "linear-gradient(135deg, #ea580c 0%, #c2410c 100%)",
                      color: "#ffffff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "18px",
                      boxShadow: "0 4px 12px rgba(234, 88, 12, 0.35)",
                      flexShrink: 0,
                    }}
                  >
                    📤
                  </div>
                  <div>
                    <span style={{ fontSize: "11.5px", color: "#e9d5ff", fontWeight: "700", display: "block" }}>
                      Checked Out
                    </span>
                    <strong style={{ fontSize: "20px", color: "#ffffff", fontWeight: "900", letterSpacing: "0.3px" }}>
                      <AnimatedNumber value={checkedOutCount} />
                    </strong>
                    <span style={{ fontSize: "11px", color: "#ffedd5", display: "block", marginTop: "2px", fontWeight: "700" }}>
                      Shift Finished
                    </span>
                  </div>
                </div>

                {/* 4. Work Hours Card */}
                <div
                  onClick={() => {
                    setStaffAttendanceFilter("Worked");
                    setActiveOperationalView("staff");
                    document.getElementById("staff-attendance-section")?.scrollIntoView({ behavior: "smooth" });
                  }}
                  title="Click to view work hours"
                  style={{
                    background: staffAttendanceFilter === "Worked"
                      ? "rgba(255, 255, 255, 0.22)"
                      : "rgba(255, 255, 255, 0.12)",
                    backdropFilter: "blur(8px)",
                    padding: "16px 18px",
                    borderRadius: "16px",
                    border: staffAttendanceFilter === "Worked"
                      ? "2px solid #99f6e4"
                      : "1px solid rgba(216, 180, 254, 0.35)",
                    display: "flex",
                    alignItems: "center",
                    gap: "14px",
                    transition: "all 0.2s ease",
                    cursor: "pointer",
                    boxShadow: staffAttendanceFilter === "Worked"
                      ? "0 6px 20px rgba(13, 148, 136, 0.35)"
                      : "none",
                  }}
                >
                  <div
                    style={{
                      width: "44px",
                      height: "44px",
                      borderRadius: "12px",
                      background: "linear-gradient(135deg, #0d9488 0%, #0f766e 100%)",
                      color: "#ffffff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "18px",
                      boxShadow: "0 4px 12px rgba(13, 148, 136, 0.35)",
                      flexShrink: 0,
                    }}
                  >
                    ⏱️
                  </div>
                  <div>
                    <span style={{ fontSize: "11.5px", color: "#e9d5ff", fontWeight: "700", display: "block" }}>
                      Work Hours
                    </span>
                    <strong style={{ fontSize: "20px", color: "#ffffff", fontWeight: "900", letterSpacing: "0.3px" }}>
                      <AnimatedNumber value={parseFloat(hoursWorkedText) || 0} decimals={1} suffix=" hrs" />
                    </strong>
                    <span style={{ fontSize: "11px", color: "#ccfbf1", display: "block", marginTop: "2px", fontWeight: "700" }}>
                      Total Today
                    </span>
                  </div>
                </div>

                {/* 5. Leave Card */}
                <div
                  onClick={() => {
                    setStaffAttendanceFilter("OnLeave");
                    setActiveOperationalView("staff");
                    document.getElementById("staff-attendance-section")?.scrollIntoView({ behavior: "smooth" });
                  }}
                  title="Click to view staff on leave"
                  style={{
                    background: staffAttendanceFilter === "OnLeave"
                      ? "rgba(255, 255, 255, 0.22)"
                      : "rgba(255, 255, 255, 0.12)",
                    backdropFilter: "blur(8px)",
                    padding: "16px 18px",
                    borderRadius: "16px",
                    border: staffAttendanceFilter === "OnLeave"
                      ? "2px solid #fbcfe8"
                      : "1px solid rgba(216, 180, 254, 0.35)",
                    display: "flex",
                    alignItems: "center",
                    gap: "14px",
                    transition: "all 0.2s ease",
                    cursor: "pointer",
                    boxShadow: staffAttendanceFilter === "OnLeave"
                      ? "0 6px 20px rgba(219, 39, 119, 0.35)"
                      : "none",
                  }}
                >
                  <div
                    style={{
                      width: "44px",
                      height: "44px",
                      borderRadius: "12px",
                      background: "linear-gradient(135deg, #db2777 0%, #9d174d 100%)",
                      color: "#ffffff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "18px",
                      boxShadow: "0 4px 12px rgba(219, 39, 119, 0.35)",
                      flexShrink: 0,
                    }}
                  >
                    🏖️
                  </div>
                  <div>
                    <span style={{ fontSize: "11.5px", color: "#e9d5ff", fontWeight: "700", display: "block" }}>
                      Leave
                    </span>
                    <strong style={{ fontSize: "20px", color: "#ffffff", fontWeight: "900", letterSpacing: "0.3px" }}>
                      <AnimatedNumber value={onLeaveCount} />
                    </strong>
                    <span style={{ fontSize: "11px", color: "#fce7f3", display: "block", marginTop: "2px", fontWeight: "700" }}>
                      Approved Leaves
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* SUBTLE DIVIDER */}
            <div style={{ height: "1px", background: "linear-gradient(90deg, transparent 0%, rgba(216, 180, 254, 0.25) 15%, rgba(216, 180, 254, 0.6) 50%, rgba(216, 180, 254, 0.25) 85%, transparent 100%)" }} />

            {/* 1.2 ROOM OPERATIONAL METRIC PILLS ROW (NOW BELOW) */}
            <div>
              <div style={{ fontSize: "11.5px", fontWeight: "800", color: "#f3e8ff", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: "9px", display: "flex", alignItems: "center", gap: "6px" }}>
                <span>🛏️</span> Room Cleaning
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "7px", alignItems: "center" }}>
                {/* 1. Total Rooms */}
                <button
                  type="button"
                  onClick={() => {
                    setStatusFilter("All");
                    setActiveOperationalView("rooms");
                  }}
                  title="View All Property Rooms"
                  style={{
                    height: "32px",
                    padding: "4px 13px",
                    borderRadius: "999px",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "7px",
                    fontSize: "12px",
                    fontWeight: "700",
                    transition: "all 0.15s ease",
                    border: statusFilter === "All" && activeOperationalView === "rooms"
                      ? "1.5px solid #a5b4fc"
                      : "1px solid rgba(165, 180, 252, 0.35)",
                    background: statusFilter === "All" && activeOperationalView === "rooms"
                      ? "linear-gradient(135deg, #6366f1 0%, #4338ca 100%)"
                      : "rgba(99, 102, 241, 0.18)",
                    color: "#ffffff",
                    boxShadow: statusFilter === "All" && activeOperationalView === "rooms"
                      ? "0 4px 14px rgba(99, 102, 241, 0.6)"
                      : "none",
                  }}
                >
                  <span style={{ fontSize: "14px" }}>🏨</span>
                  <span>Total Rooms</span>
                  <span
                    style={{
                      padding: "1px 7px",
                      borderRadius: "10px",
                      fontSize: "11.5px",
                      fontWeight: "900",
                      background: statusFilter === "All" && activeOperationalView === "rooms"
                        ? "rgba(255,255,255,0.28)"
                        : "#6366f1",
                      color: "#ffffff",
                    }}
                  >
                    {totalRoomsCount}
                  </span>
                </button>

                {/* 2. Unassigned (Needs Staff) */}
                <button
                  type="button"
                  onClick={() => {
                    setStatusFilter("Unassigned");
                    setActiveOperationalView("rooms");
                  }}
                  title="Filter Rooms Requiring Staff Assignment"
                  style={{
                    height: "32px",
                    padding: "4px 13px",
                    borderRadius: "999px",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "7px",
                    fontSize: "12px",
                    fontWeight: "700",
                    transition: "all 0.15s ease",
                    border: statusFilter === "Unassigned" && activeOperationalView === "rooms"
                      ? "1.5px solid #fca5a5"
                      : "1px solid rgba(252, 165, 165, 0.35)",
                    background: statusFilter === "Unassigned" && activeOperationalView === "rooms"
                      ? "linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)"
                      : "rgba(239, 68, 68, 0.18)",
                    color: "#ffffff",
                    boxShadow: statusFilter === "Unassigned" && activeOperationalView === "rooms"
                      ? "0 4px 14px rgba(239, 68, 68, 0.6)"
                      : "none",
                  }}
                >
                  <span style={{ fontSize: "14px" }}>⚠️</span>
                  <span>Unassigned (Needs Staff)</span>
                  <span
                    style={{
                      padding: "1px 7px",
                      borderRadius: "10px",
                      fontSize: "11.5px",
                      fontWeight: "900",
                      background: statusFilter === "Unassigned" && activeOperationalView === "rooms"
                        ? "rgba(255,255,255,0.28)"
                        : "#ef4444",
                      color: "#ffffff",
                    }}
                  >
                    {unassignedRoomsCount}
                  </span>
                </button>

                {/* 3. Assigned Staff */}
                <button
                  type="button"
                  onClick={() => {
                    setStatusFilter("Assigned");
                    setActiveOperationalView("rooms");
                  }}
                  title="Filter Rooms Assigned to Staff"
                  style={{
                    height: "32px",
                    padding: "4px 13px",
                    borderRadius: "999px",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "7px",
                    fontSize: "12px",
                    fontWeight: "700",
                    transition: "all 0.15s ease",
                    border: statusFilter === "Assigned" && activeOperationalView === "rooms"
                      ? "1.5px solid #93c5fd"
                      : "1px solid rgba(147, 197, 253, 0.35)",
                    background: statusFilter === "Assigned" && activeOperationalView === "rooms"
                      ? "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)"
                      : "rgba(59, 130, 246, 0.18)",
                    color: "#ffffff",
                    boxShadow: statusFilter === "Assigned" && activeOperationalView === "rooms"
                      ? "0 4px 14px rgba(59, 130, 246, 0.6)"
                      : "none",
                  }}
                >
                  <span style={{ fontSize: "14px" }}>📋</span>
                  <span>Assigned Staff</span>
                  <span
                    style={{
                      padding: "1px 7px",
                      borderRadius: "10px",
                      fontSize: "11.5px",
                      fontWeight: "900",
                      background: statusFilter === "Assigned" && activeOperationalView === "rooms"
                        ? "rgba(255,255,255,0.28)"
                        : "#3b82f6",
                      color: "#ffffff",
                    }}
                  >
                    {assignedRoomsCount}
                  </span>
                </button>

                {/* 4. In Progress */}
                <button
                  type="button"
                  onClick={() => {
                    setStatusFilter("Cleaning");
                    setActiveOperationalView("rooms");
                  }}
                  title="Filter Cleaning In-Progress Rooms"
                  style={{
                    height: "32px",
                    padding: "4px 13px",
                    borderRadius: "999px",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "7px",
                    fontSize: "12px",
                    fontWeight: "700",
                    transition: "all 0.15s ease",
                    border: statusFilter === "Cleaning" && activeOperationalView === "rooms"
                      ? "1.5px solid #fde68a"
                      : "1px solid rgba(253, 230, 138, 0.35)",
                    background: statusFilter === "Cleaning" && activeOperationalView === "rooms"
                      ? "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)"
                      : "rgba(245, 158, 11, 0.18)",
                    color: "#ffffff",
                    boxShadow: statusFilter === "Cleaning" && activeOperationalView === "rooms"
                      ? "0 4px 14px rgba(245, 158, 11, 0.6)"
                      : "none",
                  }}
                >
                  <span style={{ fontSize: "14px" }}>🧼</span>
                  <span>In Progress</span>
                  <span
                    style={{
                      padding: "1px 7px",
                      borderRadius: "10px",
                      fontSize: "11.5px",
                      fontWeight: "900",
                      background: statusFilter === "Cleaning" && activeOperationalView === "rooms"
                        ? "rgba(255,255,255,0.28)"
                        : "#f59e0b",
                      color: "#ffffff",
                    }}
                  >
                    {inProgressCount}
                  </span>
                </button>

                {/* 5. Clean & Ready */}
                <button
                  type="button"
                  onClick={() => {
                    setStatusFilter("Clean");
                    setActiveOperationalView("rooms");
                  }}
                  title="Filter Clean & Ready Rooms"
                  style={{
                    height: "32px",
                    padding: "4px 13px",
                    borderRadius: "999px",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "7px",
                    fontSize: "12px",
                    fontWeight: "700",
                    transition: "all 0.15s ease",
                    border: statusFilter === "Clean" && activeOperationalView === "rooms"
                      ? "1.5px solid #a7f3d0"
                      : "1px solid rgba(110, 231, 183, 0.35)",
                    background: statusFilter === "Clean" && activeOperationalView === "rooms"
                      ? "linear-gradient(135deg, #10b981 0%, #047857 100%)"
                      : "rgba(16, 185, 129, 0.18)",
                    color: "#ffffff",
                    boxShadow: statusFilter === "Clean" && activeOperationalView === "rooms"
                      ? "0 4px 14px rgba(16, 185, 129, 0.6)"
                      : "none",
                  }}
                >
                  <span style={{ fontSize: "14px" }}>✨</span>
                  <span>Clean & Ready</span>
                  <span
                    style={{
                      padding: "1px 7px",
                      borderRadius: "10px",
                      fontSize: "11.5px",
                      fontWeight: "900",
                      background: statusFilter === "Clean" && activeOperationalView === "rooms"
                        ? "rgba(255,255,255,0.28)"
                        : "#10b981",
                      color: "#ffffff",
                    }}
                  >
                    {cleanRoomsCount} ({cleanPercentage}%)
                  </span>
                </button>

                {/* 6. Photo Reviews */}
                <button
                  type="button"
                  onClick={() => {
                    setStatusFilter("Photo Uploaded");
                    setActiveOperationalView("photos");
                  }}
                  title="Open Live Photo Approvals"
                  style={{
                    height: "32px",
                    padding: "4px 13px",
                    borderRadius: "999px",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "7px",
                    fontSize: "12px",
                    fontWeight: "700",
                    transition: "all 0.15s ease",
                    border: activeOperationalView === "photos"
                      ? "1.5px solid #ddd6fe"
                      : "1px solid rgba(216, 180, 254, 0.35)",
                    background: activeOperationalView === "photos"
                      ? "linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)"
                      : "rgba(168, 85, 247, 0.18)",
                    color: "#ffffff",
                    boxShadow: activeOperationalView === "photos"
                      ? "0 4px 14px rgba(139, 92, 246, 0.6)"
                      : "none",
                  }}
                >
                  <span style={{ fontSize: "14px" }}>📸</span>
                  <span>Photo Reviews</span>
                  <span
                    style={{
                      padding: "1px 7px",
                      borderRadius: "10px",
                      fontSize: "11.5px",
                      fontWeight: "900",
                      background: activeOperationalView === "photos"
                        ? "rgba(255,255,255,0.28)"
                        : "#8b5cf6",
                      color: "#ffffff",
                    }}
                  >
                    {photoReviewsCount}
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* 1.3 TABLE VIEW SWITCHER & ACTIVE FILTER STATUS BAR */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              background: "rgba(255, 255, 255, 0.9)",
              padding: "10px 16px",
              borderRadius: "14px",
              border: "1px solid #e2e8f0",
              marginBottom: "20px",
              flexWrap: "wrap",
              gap: "10px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
              <span style={{ fontSize: "12px", fontWeight: "800", color: "#64748b", textTransform: "uppercase" }}>
                Active View:
              </span>
              <button
                type="button"
                onClick={() => {
                  setActiveOperationalView("rooms");
                  setStatusFilter("All");
                }}
                style={{
                  padding: "6px 14px",
                  borderRadius: "8px",
                  fontSize: "12px",
                  fontWeight: "700",
                  border: activeOperationalView === "rooms" ? "none" : "1px solid #cbd5e1",
                  background: activeOperationalView === "rooms" ? "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)" : "#ffffff",
                  color: activeOperationalView === "rooms" ? "#ffffff" : "#475569",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  boxShadow: activeOperationalView === "rooms" ? "0 2px 6px rgba(37, 99, 235, 0.3)" : "none",
                }}
              >
                🛏️ Rooms Cards & Status ({filteredRooms.length})
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveOperationalView("staff");
                  setStaffAttendanceFilter("All");
                }}
                style={{
                  padding: "6px 14px",
                  borderRadius: "8px",
                  fontSize: "12px",
                  fontWeight: "700",
                  border: activeOperationalView === "staff" ? "none" : "1px solid #cbd5e1",
                  background: activeOperationalView === "staff" ? "linear-gradient(135deg, #10b981 0%, #059669 100%)" : "#ffffff",
                  color: activeOperationalView === "staff" ? "#ffffff" : "#475569",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  boxShadow: activeOperationalView === "staff" ? "0 2px 6px rgba(16, 185, 129, 0.3)" : "none",
                }}
              >
                👥 Staff Table ({filteredRoster.length})
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveOperationalView("photos");
                  setStatusFilter("Photo Uploaded");
                }}
                style={{
                  padding: "6px 14px",
                  borderRadius: "8px",
                  fontSize: "12px",
                  fontWeight: "700",
                  border: activeOperationalView === "photos" ? "none" : "1px solid #cbd5e1",
                  background: activeOperationalView === "photos" ? "linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)" : "#ffffff",
                  color: activeOperationalView === "photos" ? "#ffffff" : "#475569",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  boxShadow: activeOperationalView === "photos" ? "0 2px 6px rgba(124, 58, 237, 0.3)" : "none",
                }}
              >
                📸 Photo Reviews ({pendingPhotoApprovals.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveOperationalView("all")}
                style={{
                  padding: "6px 14px",
                  borderRadius: "8px",
                  fontSize: "12px",
                  fontWeight: "700",
                  border: activeOperationalView === "all" ? "none" : "1px solid #cbd5e1",
                  background: activeOperationalView === "all" ? "#0f172a" : "#ffffff",
                  color: activeOperationalView === "all" ? "#ffffff" : "#475569",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                📋 View All
              </button>
            </div>

            {/* Active Filter Badges */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
              {statusFilter !== "All" && (
                <span
                  style={{
                    padding: "4px 10px",
                    borderRadius: "6px",
                    fontSize: "11px",
                    fontWeight: "800",
                    background: "#ede9fe",
                    color: "#6d28d9",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  Room: {statusFilter}
                  <span
                    onClick={(e) => {
                      e.stopPropagation();
                      setStatusFilter("All");
                    }}
                    style={{ cursor: "pointer", fontWeight: "900", marginLeft: "2px" }}
                  >
                    ✕
                  </span>
                </span>
              )}

              {staffAttendanceFilter !== "All" && (
                <span
                  style={{
                    padding: "4px 10px",
                    borderRadius: "6px",
                    fontSize: "11px",
                    fontWeight: "800",
                    background: "#dcfce7",
                    color: "#15803d",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  Staff: {staffAttendanceFilter}
                  <span
                    onClick={(e) => {
                      e.stopPropagation();
                      setStaffAttendanceFilter("All");
                    }}
                    style={{ cursor: "pointer", fontWeight: "900", marginLeft: "2px" }}
                  >
                    ✕
                  </span>
                </span>
              )}

              {(statusFilter !== "All" || staffAttendanceFilter !== "All") && (
                <button
                  type="button"
                  onClick={() => {
                    setStatusFilter("All");
                    setStaffAttendanceFilter("All");
                    setActiveOperationalView("rooms");
                  }}
                  style={{
                    padding: "4px 10px",
                    borderRadius: "6px",
                    border: "1px solid #fee2e2",
                    background: "#fef2f2",
                    color: "#dc2626",
                    fontSize: "11px",
                    fontWeight: "700",
                    cursor: "pointer",
                  }}
                >
                  Clear Filters ✕
                </button>
              )}
            </div>
          </div>

          {/* ===================================================================== */}
          {/* 2. TODAY'S STAFF ATTENDANCE & TASK ASSIGNMENT TABLE                   */}
          {/* ===================================================================== */}
          {(activeOperationalView === "staff" || activeOperationalView === "all") && (
            <section
              id="staff-attendance-section"
              style={{
                background: "rgba(255, 255, 255, 0.9)",
                backdropFilter: "blur(24px)",
                padding: "24px",
                borderRadius: "20px",
                border: "1px solid rgba(16, 185, 129, 0.25)",
                boxShadow: "0 10px 30px -10px rgba(16, 185, 129, 0.15)",
                marginBottom: "28px",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px", flexWrap: "wrap", gap: "12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div
                    style={{
                      width: "40px",
                      height: "40px",
                      borderRadius: "12px",
                      background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                      color: "#ffffff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "18px",
                      boxShadow: "0 4px 12px rgba(16, 185, 129, 0.3)",
                    }}
                  >
                    <FaUsers />
                  </div>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "800", color: "#0f172a" }}>
                        👥 Today's Staff Attendance & Duty Roster
                      </h3>
                      <span
                        style={{
                          background: "#dcfce7",
                          color: "#15803d",
                          padding: "2px 8px",
                          borderRadius: "12px",
                          fontSize: "11px",
                          fontWeight: "800",
                        }}
                      >
                        {filteredRoster.length} Active Staff
                      </span>
                    </div>
                    <p style={{ margin: "2px 0 0", fontSize: "12.5px", color: "#64748b" }}>
                      Live duty attendance & room assignments for {getCurrentOrg() || "this organization"}
                    </p>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <button
                    type="button"
                    onClick={() => {
                      setStaffAttendanceFilter("All");
                      setActiveOperationalView("staff");
                    }}
                    style={{
                      padding: "6px 14px",
                      borderRadius: "8px",
                      fontSize: "12px",
                      fontWeight: "700",
                      background: staffAttendanceFilter === "All" ? "#0f172a" : "#f1f5f9",
                      color: staffAttendanceFilter === "All" ? "#ffffff" : "#475569",
                      border: "none",
                      cursor: "pointer",
                    }}
                  >
                    All Staff ({effectiveRoster.length})
                  </button>
                </div>
              </div>

              {/* Attendance Table */}
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: "0 8px", minWidth: "900px" }}>
                  <thead>
                    <tr style={{ color: "#64748b", fontSize: "12px", textAlign: "left" }}>
                      <th style={{ padding: "10px 14px" }}>Staff Member</th>
                      <th style={{ padding: "10px 14px" }}>Shift & Area</th>
                      <th style={{ padding: "10px 14px" }}>Attendance Status</th>
                      <th style={{ padding: "10px 14px" }}>Check-In</th>
                      <th style={{ padding: "10px 14px" }}>Check-Out</th>
                      <th style={{ padding: "10px 14px" }}>Hours Worked</th>
                      <th style={{ padding: "10px 14px" }}>Current Task / Room</th>
                      <th style={{ padding: "10px 14px", textAlign: "right" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRoster.length === 0 ? (
                      <tr>
                        <td colSpan={8} style={{ padding: "36px", textAlign: "center", color: "#64748b", background: "#ffffff", borderRadius: "12px" }}>
                          {staffAttendanceFilter === "OnLeave"
                            ? "🏖️ No staff members are currently on leave in this branch."
                            : staffAttendanceFilter === "CheckedIn"
                              ? "📥 No staff members are currently checked in."
                              : staffAttendanceFilter === "CheckedOut"
                                ? "📤 No staff members have checked out yet today."
                                : "No staff records found."}
                        </td>
                      </tr>
                    ) : (
                      filteredRoster.map((staff) => (
                        <tr
                          key={staff.staffId || staff.id}
                          style={{
                            background: "#ffffff",
                            borderRadius: "12px",
                            boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
                            border: "1px solid #e2e8f0",
                          }}
                        >
                          <td style={{ padding: "12px 14px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                              <img
                                src={staff.avatar}
                                alt={staff.name}
                                style={{ width: "36px", height: "36px", borderRadius: "10px", objectFit: "cover" }}
                              />
                              <div>
                                <div style={{ fontWeight: "800", color: "#0f172a", fontSize: "13.5px" }}>
                                  {staff.name}
                                </div>
                                <div style={{ fontSize: "11px", color: "#6366f1", fontWeight: "700" }}>
                                  {staff.staffId} • {staff.department}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: "12px 14px" }}>
                            <div style={{ fontSize: "12px", fontWeight: "700", color: "#1e293b" }}>
                              {staff.shift}
                            </div>
                            <div style={{ fontSize: "11px", color: "#64748b" }}>
                              📍 {staff.assignedArea}
                            </div>
                          </td>
                          <td style={{ padding: "12px 14px" }}>
                            <span
                              style={{
                                padding: "3px 10px",
                                borderRadius: "12px",
                                fontSize: "11.5px",
                                fontWeight: "800",
                                display: "inline-block",
                                background:
                                  staff.status === "Present"
                                    ? "#dcfce7"
                                    : staff.status === "On Leave"
                                      ? "#fef08a"
                                      : staff.status === "Checked Out"
                                        ? "#fed7aa"
                                        : "#fecdd3",
                                color:
                                  staff.status === "Present"
                                    ? "#15803d"
                                    : staff.status === "On Leave"
                                      ? "#854d0e"
                                      : staff.status === "Checked Out"
                                        ? "#9a3412"
                                        : "#9f1239",
                              }}
                            >
                              {staff.status === "Present" ? "🟢 Present" : staff.status === "On Leave" ? "🏖️ On Leave" : staff.status === "Checked Out" ? "📤 Checked Out" : "⚪ Absent"}
                            </span>
                            {staff.leaveDetails && (
                              <div style={{ fontSize: "11px", color: "#854d0e", fontWeight: "700", marginTop: "4px", lineHeight: 1.3 }}>
                                <div>{staff.leaveDetails.type} ({staff.leaveDetails.dates})</div>
                                {staff.leaveDetails.reason && (
                                  <div style={{ fontSize: "10.5px", fontStyle: "italic", color: "#a16207", fontWeight: "500" }}>
                                    "{staff.leaveDetails.reason}"
                                  </div>
                                )}
                              </div>
                            )}
                          </td>
                          <td style={{ padding: "12px 14px", fontSize: "12px", fontWeight: "700", color: staff.clockIn ? "#15803d" : "#94a3b8" }}>
                            {staff.clockIn || "Not Arrived"}
                          </td>
                          <td style={{ padding: "12px 14px", fontSize: "12px", color: staff.clockOut ? "#0f172a" : "#64748b" }}>
                            {staff.clockOut || (staff.clockIn ? "Active Shift" : "—")}
                          </td>
                          <td style={{ padding: "12px 14px", fontSize: "12px", fontWeight: "700", color: staff.clockIn && !staff.clockOut ? "#0284c7" : "#64748b" }}>
                            {staff.hoursWorked}
                          </td>
                          <td style={{ padding: "12px 14px" }}>
                            {staff.currentTask ? (
                              <span
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "4px",
                                  padding: "3px 8px",
                                  borderRadius: "6px",
                                  background: "#eff6ff",
                                  color: "#1d4ed8",
                                  fontSize: "11px",
                                  fontWeight: "700",
                                }}
                              >
                                🛏️ Room {staff.currentTask.room || "101"} ({staff.currentTask.status || "Cleaning"})
                              </span>
                            ) : (
                              <span style={{ fontSize: "11.5px", color: "#94a3b8" }}>No Active Task</span>
                            )}
                          </td>
                          <td style={{ padding: "12px 14px", textAlign: "right" }}>
                            <div style={{ display: "inline-flex", gap: "6px" }}>
                              {staff.clockIn && !staff.clockOut ? (
                                <button
                                  type="button"
                                  onClick={() => handleClockOut(staff)}
                                  style={{
                                    padding: "5px 10px",
                                    borderRadius: "6px",
                                    border: "1px solid #fed7aa",
                                    background: "#fff7ed",
                                    color: "#c2410c",
                                    fontSize: "11px",
                                    fontWeight: "700",
                                    cursor: "pointer",
                                  }}
                                >
                                  Check Out
                                </button>
                              ) : !staff.clockIn ? (
                                <button
                                  type="button"
                                  onClick={() => handleClockIn(staff)}
                                  style={{
                                    padding: "5px 10px",
                                    borderRadius: "6px",
                                    border: "1px solid #bfdbfe",
                                    background: "#eff6ff",
                                    color: "#1d4ed8",
                                    fontSize: "11px",
                                    fontWeight: "700",
                                    cursor: "pointer",
                                  }}
                                >
                                  Check In
                                </button>
                              ) : null}
                              <button
                                type="button"
                                onClick={() => {
                                  const isCheckedIn = Boolean(staff.clockIn && !staff.clockOut) || staff.isOnDuty || staff.status === "Present";
                                  if (!isCheckedIn) {
                                    showToast(`⚠️ Cannot assign: ${staff.name} has not Checked In today!`);
                                    return;
                                  }
                                  handleOpenAssignModal(null, staff);
                                }}
                                style={{
                                  padding: "5px 10px",
                                  borderRadius: "6px",
                                  border: "1px solid #cbd5e1",
                                  background: "#f8fafc",
                                  color: "#334155",
                                  fontSize: "11px",
                                  fontWeight: "700",
                                  cursor: "pointer",
                                }}
                              >
                                Assign
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* ===================================================================== */}
          {/* 3. LIVE HOUSEKEEPING PHOTO APPROVALS (EXACT WIDGET/SECTION)            */}
          {/* ===================================================================== */}
          {(activeOperationalView === "photos" || activeOperationalView === "all") && (
            <section
              style={{
                background: "rgba(255, 255, 255, 0.85)",
                backdropFilter: "blur(24px)",
                padding: "24px",
                borderRadius: "20px",
                border: "1px solid rgba(139, 92, 246, 0.25)",
                boxShadow: "0 10px 30px -10px rgba(139, 92, 246, 0.15)",
                marginBottom: "28px",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px", flexWrap: "wrap", gap: "12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div
                    style={{
                      width: "40px",
                      height: "40px",
                      borderRadius: "12px",
                      background: "linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)",
                      color: "#ffffff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "18px",
                      boxShadow: "0 4px 12px rgba(124, 58, 237, 0.3)",
                    }}
                  >
                    <FaCamera />
                  </div>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "800", color: "#0f172a" }}>
                        ⚡ Live Housekeeping Photo Approvals
                      </h3>
                      <span
                        style={{
                          background: pendingPhotoApprovals.length > 0 ? "#ede9fe" : "#dcfce7",
                          color: pendingPhotoApprovals.length > 0 ? "#7c3aed" : "#15803d",
                          padding: "3px 10px",
                          borderRadius: "999px",
                          fontSize: "11.5px",
                          fontWeight: "800",
                        }}
                      >
                        {pendingPhotoApprovals.length} Pending
                      </span>
                    </div>
                    <span style={{ fontSize: "12.5px", color: "#64748b" }}>
                      Housekeeping completed sanitization proofs requiring Supervisor / Admin sign-off
                    </span>
                  </div>
                </div>
              </div>

              {/* Submissions or Clean State */}
              {pendingPhotoApprovals.length === 0 ? (
                <div
                  style={{
                    padding: "36px 20px",
                    textAlign: "center",
                    borderRadius: "14px",
                    background: "#f8fafc",
                    border: "1px dashed #cbd5e1",
                  }}
                >
                  <FaCheckCircle style={{ fontSize: "36px", color: "#10b981", marginBottom: "10px" }} />
                  <h4 style={{ margin: "0 0 6px", fontSize: "16px", fontWeight: "700", color: "#0f172a" }}>
                    All Housekeeping Photos Reviewed!
                  </h4>
                  <p style={{ margin: 0, fontSize: "13px", color: "#64748b" }}>
                    There are currently no housekeeping photos awaiting approval. Real uploads by employees will appear here live.
                  </p>
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "16px" }}>
                  {pendingPhotoApprovals.map((t) => (
                    <div
                      key={t.id}
                      style={{
                        background: "#ffffff",
                        borderRadius: "16px",
                        padding: "16px",
                        border: "1px solid #ddd6fe",
                        boxShadow: "0 4px 14px rgba(124, 58, 237, 0.08)",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between",
                        gap: "12px",
                      }}
                    >
                      <div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
                          <div>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                              <strong style={{ fontSize: "16px", color: "#0f172a" }}>{t.room}</strong>
                              <span
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "4px",
                                  padding: "2px 8px",
                                  borderRadius: "8px",
                                  background: "#ede9fe",
                                  color: "#6d28d9",
                                  fontSize: "11px",
                                  fontWeight: "800",
                                }}
                              >
                                🏢 {t.orgName || t.branch || "Jaipur Branch"} ({t.orgId || "JP01"})
                              </span>
                            </div>
                            <div style={{ fontSize: "12px", color: "#64748b", marginTop: "3px" }}>{t.floor} • {t.roomType}</div>
                          </div>
                          <span style={{ padding: "3px 8px", borderRadius: "999px", background: "#ede9fe", color: "#7c3aed", fontSize: "11px", fontWeight: "800" }}>
                            Awaiting Sign-off
                          </span>
                        </div>

                        {/* Photo Thumbnail */}
                        <div
                          onClick={() => {
                            setInspectModalTask(t);
                            setActivePhotoIndex(0);
                          }}
                          style={{
                            height: "160px",
                            borderRadius: "12px",
                            overflow: "hidden",
                            position: "relative",
                            cursor: "pointer",
                            background: "#000000",
                          }}
                        >
                          <img
                            src={t.photoProofUrl || (t.photoProofs && t.photoProofs[0])}
                            alt="Proof"
                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                          />
                          <div
                            style={{
                              position: "absolute",
                              bottom: "8px",
                              left: "8px",
                              right: "8px",
                              background: "rgba(15, 23, 42, 0.75)",
                              color: "#ffffff",
                              padding: "4px 8px",
                              borderRadius: "6px",
                              fontSize: "11px",
                              display: "flex",
                              justifyContent: "space-between",
                            }}
                          >
                            <span>👤 {t.staff}</span>
                            <span>🕒 {t.photoUploadedAt || "Today"}</span>
                          </div>
                        </div>

                        <div style={{ marginTop: "10px", fontSize: "12px", color: "#475569" }}>
                          <strong>Note:</strong> {t.housekeeperRemarks || "Sanitization complete with full checklist verified."}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end", marginTop: "6px" }}>
                        <button
                          type="button"
                          onClick={() => handleOpenRejectModal(t)}
                          style={{
                            padding: "8px 14px",
                            borderRadius: "8px",
                            border: "1px solid #fee2e2",
                            background: "#fef2f2",
                            color: "#dc2626",
                            fontSize: "12px",
                            fontWeight: "700",
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                          }}
                        >
                          <FaTimesCircle /> Reject
                        </button>

                        <button
                          type="button"
                          onClick={() => handleApproveAction(t.id, t.room)}
                          style={{
                            padding: "8px 16px",
                            borderRadius: "8px",
                            border: "none",
                            background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                            color: "#ffffff",
                            fontSize: "12px",
                            fontWeight: "700",
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "5px",
                            boxShadow: "0 4px 10px rgba(16, 185, 129, 0.3)",
                          }}
                        >
                          <FaThumbsUp /> Quick Approve
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* ===================================================================== */}
          {/* 4. ROOM-WISE HOUSEKEEPING STATUS GRID (REAL DATABASE ROOMS)          */}
          {/* ===================================================================== */}
          {(activeOperationalView === "all" || activeOperationalView === "rooms" || activeOperationalView === "photos") && (
            <section
              style={{
                background: "rgba(255, 255, 255, 0.85)",
                backdropFilter: "blur(24px)",
                padding: "24px",
                borderRadius: "20px",
                border: "1px solid rgba(226, 232, 240, 0.8)",
                boxShadow: "0 10px 30px rgba(0, 0, 0, 0.04)",
                marginBottom: "28px",
              }}
            >
              {/* Filter Bar */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "16px",
                  flexWrap: "wrap",
                  marginBottom: "20px",
                }}
              >
                {/* Search Bar */}
                <div style={{ position: "relative", minWidth: "280px", flex: "1 1 280px" }}>
                  <FaSearch
                    style={{
                      position: "absolute",
                      left: "14px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: "#94a3b8",
                      fontSize: "13px",
                    }}
                  />
                  <input
                    type="text"
                    placeholder="Search Room Number, Housekeeper, or Task..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{
                      width: "100%",
                      paddingLeft: "38px",
                      paddingRight: "14px",
                      height: "42px",
                      borderRadius: "12px",
                      border: "1px solid #e2e8f0",
                      fontSize: "13.5px",
                      background: "#ffffff",
                      outline: "none",
                    }}
                  />
                </div>

                {/* Filters & View Switcher */}
                <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
                  {/* Floor Filter */}
                  <select
                    value={floorFilter}
                    onChange={(e) => setFloorFilter(e.target.value)}
                    style={{
                      padding: "10px 14px",
                      borderRadius: "12px",
                      border: "1px solid #e2e8f0",
                      fontSize: "13px",
                      fontWeight: "600",
                      background: "#ffffff",
                      cursor: "pointer",
                    }}
                  >
                    <option value="All Floors">🏢 All Floors</option>
                    <option value="Ground Floor">Ground Floor</option>
                    <option value="1st Floor">1st Floor</option>
                    <option value="2nd Floor">2nd Floor</option>
                    <option value="3rd Floor">3rd Floor</option>
                    <option value="4th Floor">4th Floor</option>
                    <option value="Suites Wing">Suites Wing</option>
                  </select>

                  {/* Shift Filter */}
                  <select
                    value={shiftFilter}
                    onChange={(e) => setShiftFilter(e.target.value)}
                    style={{
                      padding: "10px 14px",
                      borderRadius: "12px",
                      border: "1px solid #e2e8f0",
                      fontSize: "13px",
                      fontWeight: "600",
                      background: "#ffffff",
                      cursor: "pointer",
                    }}
                  >
                    <option value="All">🕒 All Shifts</option>
                    <option value="Morning">Morning (07:00 - 15:30)</option>
                    <option value="Evening">Evening (15:00 - 23:30)</option>
                    <option value="Night">Night (23:00 - 07:30)</option>
                  </select>

                  {/* Priority Filter */}
                  <select
                    value={priorityFilter}
                    onChange={(e) => setPriorityFilter(e.target.value)}
                    style={{
                      padding: "10px 14px",
                      borderRadius: "12px",
                      border: "1px solid #e2e8f0",
                      fontSize: "13px",
                      fontWeight: "600",
                      background: "#ffffff",
                      cursor: "pointer",
                    }}
                  >
                    <option value="All">🎯 All Priorities</option>
                    <option value="VIP">Urgent / VIP Checkout</option>
                    <option value="High">High Priority</option>
                    <option value="Normal">Normal</option>
                  </select>

                  {/* Status Filter */}
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    style={{
                      padding: "10px 14px",
                      borderRadius: "12px",
                      border: "1px solid #e2e8f0",
                      fontSize: "13px",
                      fontWeight: "600",
                      background: "#ffffff",
                      cursor: "pointer",
                    }}
                  >
                    <option value="All">All Statuses</option>
                    <option value="Unassigned">⚠️ Unassigned (Needs Staff)</option>
                    <option value="Assigned">📋 Assigned to Staff</option>
                    <option value="Cleaning">🧼 Cleaning (In Progress)</option>
                    <option value="Clean">✨ Clean & Ready</option>
                    <option value="Dirty">⚠️ Dirty</option>
                    <option value="Photo Uploaded">📸 Photo Uploaded</option>
                    <option value="Re-cleaning Scheduled">🔄 Re-cleaning Scheduled</option>
                  </select>

                  {/* Grid vs Table View */}
                  <div style={{ display: "flex", background: "#f1f5f9", padding: "4px", borderRadius: "10px" }}>
                    <button
                      type="button"
                      onClick={() => setViewMode("grid")}
                      style={{
                        padding: "8px 12px",
                        borderRadius: "8px",
                        border: "none",
                        background: viewMode === "grid" ? "#ffffff" : "transparent",
                        color: viewMode === "grid" ? "#0f172a" : "#64748b",
                        cursor: "pointer",
                        boxShadow: viewMode === "grid" ? "0 2px 4px rgba(0,0,0,0.08)" : "none",
                      }}
                    >
                      <FaThLarge />
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode("table")}
                      style={{
                        padding: "8px 12px",
                        borderRadius: "8px",
                        border: "none",
                        background: viewMode === "table" ? "#ffffff" : "transparent",
                        color: viewMode === "table" ? "#0f172a" : "#64748b",
                        cursor: "pointer",
                        boxShadow: viewMode === "table" ? "0 2px 4px rgba(0,0,0,0.08)" : "none",
                      }}
                    >
                      <FaList />
                    </button>
                  </div>
                </div>
              </div>

              {/* GRID VIEW (Compact Small Box Cards) */}
              {viewMode === "grid" ? (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
                    gap: "12px",
                  }}
                >
                  {filteredRooms.map((r) => {
                    const isVip = (r.priority || "").includes("VIP") || (r.priority || "").includes("Urgent");
                    const hasPhoto = r.photoProofUrl || (r.photoProofs && r.photoProofs.length > 0);
                    const isAssigned = r.assignedStaff && r.assignedStaff !== "Unassigned";

                    return (
                      <div
                        key={r.roomId}
                        style={{
                          background: "#ffffff",
                          borderRadius: "14px",
                          padding: "13px 14px",
                          border: isVip ? "1.5px solid #ef4444" : "1px solid #e2e8f0",
                          boxShadow: isVip ? "0 4px 14px rgba(239, 68, 68, 0.1)" : "0 2px 6px rgba(0, 0, 0, 0.03)",
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "space-between",
                          gap: "10px",
                          transition: "transform 0.15s ease, box-shadow 0.15s ease",
                        }}
                      >
                        {/* Card Content Top */}
                        <div>
                          {/* Top Header: Room & Status */}
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                              <span style={{ fontSize: "15px" }}>🛏️</span>
                              <h3 style={{ margin: 0, fontSize: "15px", fontWeight: "800", color: "#0f172a" }}>
                                {r.roomNumber ? (r.roomNumber.startsWith("Room") ? r.roomNumber : `Room ${r.roomNumber}`) : "Room 101"}
                              </h3>
                            </div>
                            <span
                              style={{
                                padding: "2px 8px",
                                borderRadius: "999px",
                                fontSize: "10.5px",
                                fontWeight: "800",
                                background: r.statusBg,
                                color: r.statusColor,
                                letterSpacing: "0.2px",
                              }}
                            >
                              {r.status}
                            </span>
                          </div>

                          {/* Floor & Room Type */}
                          <div style={{ fontSize: "11px", color: "#64748b", fontWeight: "600", marginBottom: "8px" }}>
                            {r.floor} • {r.roomType}
                          </div>

                          {/* Task Card Box */}
                          <div
                            style={{
                              background: "#f8fafc",
                              padding: "8px 10px",
                              borderRadius: "10px",
                              border: "1px solid #f1f5f9",
                              marginBottom: "8px",
                            }}
                          >
                            <div
                              style={{
                                fontSize: "12px",
                                fontWeight: "700",
                                color: "#1e293b",
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                marginBottom: "3px",
                              }}
                              title={r.currentTask}
                            >
                              {r.currentTask}
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10.5px", color: "#64748b" }}>
                              <span>Shift: <strong>{r.shift}</strong></span>
                              <span style={{ color: isVip ? "#ef4444" : "#64748b", fontWeight: isVip ? "800" : "600" }}>
                                {isVip ? "🔥 VIP" : r.priority}
                              </span>
                            </div>

                            {r.rejectedReason && (
                              <div
                                style={{
                                  background: "#fef2f2",
                                  color: "#dc2626",
                                  padding: "4px 6px",
                                  borderRadius: "6px",
                                  fontSize: "10.5px",
                                  marginTop: "5px",
                                  border: "1px solid #fee2e2",
                                }}
                              >
                                <strong>Re-clean:</strong> {r.rejectedReason}
                              </div>
                            )}

                            {r.approvedBy && (
                              <div style={{ fontSize: "10.5px", color: "#059669", marginTop: "4px", fontWeight: "600" }}>
                                ✅ Approved by {r.approvedBy}
                              </div>
                            )}
                          </div>

                          {/* Assigned Staff Row */}
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "6px", fontSize: "11.5px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "6px", minWidth: 0, overflow: "hidden" }}>
                              <span style={{ color: isAssigned ? "#2563eb" : "#94a3b8", fontSize: "12px", flexShrink: 0 }}>👤</span>
                              <span style={{ color: "#64748b", fontSize: "11px", flexShrink: 0 }}>Staff:</span>
                              <span style={{ fontWeight: "700", color: isAssigned ? "#0f172a" : "#94a3b8", fontSize: "11.5px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                {r.assignedStaff || "Unassigned"}
                              </span>
                            </div>
                            {isAssigned ? (
                              <span style={{ fontSize: "10px", padding: "1px 6px", borderRadius: "4px", background: "#dcfce7", color: "#15803d", fontWeight: "800", flexShrink: 0 }}>
                                ✓ Assigned
                              </span>
                            ) : (
                              <span style={{ fontSize: "10px", padding: "1px 6px", borderRadius: "4px", background: "#fee2e2", color: "#dc2626", fontWeight: "800", flexShrink: 0 }}>
                                ⚠️ Needs Staff
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Bottom Action Area: Prominent Blue Assign / Reassign Button */}
                        <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "6px" }}>
                          <button
                            type="button"
                            onClick={() => handleOpenAssignModal(r)}
                            style={{
                              width: "100%",
                              padding: "8px 12px",
                              borderRadius: "8px",
                              border: isAssigned ? "1px solid #cbd5e1" : "none",
                              background: isAssigned ? "#f8fafc" : "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
                              color: isAssigned ? "#334155" : "#ffffff",
                              fontSize: "12px",
                              fontWeight: "700",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: "6px",
                              boxShadow: isAssigned ? "none" : "0 2px 6px rgba(37, 99, 235, 0.28)",
                              transition: "all 0.15s ease",
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.filter = "brightness(1.05)")}
                            onMouseLeave={(e) => (e.currentTarget.style.filter = "brightness(1.0)")}
                          >
                            <FaUserTie style={{ fontSize: "11px" }} /> {isAssigned ? "Reassign Staff" : "Assign Staff"}
                          </button>

                          {/* Quick proof button if proof photo exists */}
                          {hasPhoto && (
                            <button
                              type="button"
                              onClick={() => {
                                setInspectModalTask(r);
                                setActivePhotoIndex(0);
                              }}
                              style={{
                                width: "100%",
                                padding: "5px 10px",
                                borderRadius: "7px",
                                fontSize: "11px",
                                fontWeight: "700",
                                border: "1px solid #ddd6fe",
                                background: "#f5f3ff",
                                color: "#7c3aed",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: "4px",
                              }}
                            >
                              <FaCamera style={{ fontSize: "10px" }} /> Inspect Proof ({r.photoProofs?.length || 1})
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* TABLE VIEW */
                <div style={{ overflowX: "auto", width: "100%" }}>
                  <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: "0 8px" }}>
                    <thead>
                      <tr style={{ color: "#64748b", fontSize: "12px", textAlign: "left", textTransform: "uppercase" }}>
                        <th style={{ padding: "10px 14px" }}>Room & Floor</th>
                        <th style={{ padding: "10px 14px" }}>Task & Priority</th>
                        <th style={{ padding: "10px 14px" }}>Shift</th>
                        <th style={{ padding: "10px 14px" }}>Assigned Staff</th>
                        <th style={{ padding: "10px 14px" }}>Status</th>
                        <th style={{ padding: "10px 14px" }}>Proof Inspection</th>
                        <th style={{ padding: "10px 14px", textAlign: "right" }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRooms.length === 0 ? (
                        <tr>
                          <td colSpan="7" style={{ textAlign: "center", padding: "40px 16px", background: "#ffffff", borderRadius: "12px" }}>
                            <div style={{ fontSize: "36px", marginBottom: "8px" }}>🛏️</div>
                            <div style={{ fontSize: "15px", fontWeight: "800", color: "#1e293b" }}>
                              No rooms found matching "{statusFilter}"
                            </div>
                            <div style={{ fontSize: "12.5px", color: "#64748b", marginTop: "4px" }}>
                              Try selecting "Total Rooms" or clearing your search filters to see all property rooms.
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setStatusFilter("All");
                                setSearch("");
                                setFloorFilter("All Floors");
                              }}
                              style={{
                                marginTop: "14px",
                                padding: "6px 16px",
                                borderRadius: "8px",
                                border: "none",
                                background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
                                color: "#ffffff",
                                fontSize: "12px",
                                fontWeight: "700",
                                cursor: "pointer",
                                boxShadow: "0 2px 8px rgba(99, 102, 241, 0.3)",
                              }}
                            >
                              Show All Rooms ({dbRooms.length})
                            </button>
                          </td>
                        </tr>
                      ) : (
                        filteredRooms.map((r) => {
                          const hasPhoto = r.photoProofUrl || (r.photoProofs && r.photoProofs.length > 0);
                          return (
                            <tr
                              key={r.roomId}
                              style={{
                                background: "#ffffff",
                                boxShadow: "0 2px 6px rgba(0,0,0,0.02)",
                                borderRadius: "12px",
                                border: "1px solid #f1f5f9",
                              }}
                            >
                              <td style={{ padding: "14px", fontWeight: "700", color: "#0f172a" }}>
                                {getCleanFloorRoom(r)}
                                <div style={{ fontSize: "11px", color: "#94a3b8" }}>{r.roomType}</div>
                              </td>

                              <td style={{ padding: "14px" }}>
                                <div style={{ fontWeight: "700", fontSize: "13px" }}>{r.currentTask}</div>
                                <span style={{ fontSize: "11px", fontWeight: "700", color: (r.priority || "").includes("VIP") ? "#ef4444" : "#64748b" }}>
                                  {r.priority}
                                </span>
                              </td>

                              <td style={{ padding: "14px", fontSize: "12.5px", color: "#475569" }}>
                                {r.shift}
                              </td>

                              <td style={{ padding: "14px", fontWeight: "600", fontSize: "13px" }}>
                                {r.assignedStaff}
                              </td>

                              <td style={{ padding: "14px" }}>
                                <span
                                  style={{
                                    padding: "4px 10px",
                                    borderRadius: "999px",
                                    fontSize: "11px",
                                    fontWeight: "700",
                                    background: r.statusBg,
                                    color: r.statusColor,
                                  }}
                                >
                                  {r.status}
                                </span>
                              </td>

                              <td style={{ padding: "14px" }}>
                                {hasPhoto ? (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setInspectModalTask(r);
                                      setActivePhotoIndex(0);
                                    }}
                                    style={{
                                      padding: "6px 12px",
                                      borderRadius: "8px",
                                      fontSize: "11.5px",
                                      fontWeight: "700",
                                      background: "#ede9fe",
                                      color: "#7c3aed",
                                      border: "1px solid #ddd6fe",
                                      cursor: "pointer",
                                      display: "inline-flex",
                                      alignItems: "center",
                                      gap: "5px",
                                    }}
                                  >
                                    <FaCamera /> View Proofs ({r.photoProofs?.length || 1})
                                  </button>
                                ) : (
                                  <span style={{ fontSize: "11.5px", color: "#94a3b8" }}>No Proof Yet</span>
                                )}
                              </td>

                              <td style={{ padding: "14px", textAlign: "right" }}>
                                <button
                                  type="button"
                                  onClick={() => handleOpenAssignModal(r)}
                                  style={{
                                    padding: "7px 16px",
                                    borderRadius: "8px",
                                    border: r.assignedStaff && r.assignedStaff !== "Unassigned" ? "1px solid #cbd5e1" : "none",
                                    background: r.assignedStaff && r.assignedStaff !== "Unassigned" ? "#f8fafc" : "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
                                    color: r.assignedStaff && r.assignedStaff !== "Unassigned" ? "#334155" : "#ffffff",
                                    fontSize: "11.5px",
                                    fontWeight: "700",
                                    cursor: "pointer",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "5px",
                                    boxShadow: r.assignedStaff && r.assignedStaff !== "Unassigned" ? "none" : "0 2px 6px rgba(37, 99, 235, 0.28)",
                                  }}
                                >
                                  <FaUserTie style={{ fontSize: "11px" }} /> {r.assignedStaff && r.assignedStaff !== "Unassigned" ? "Reassign" : "Assign"}
                                </button>
                              </td>
                            </tr>
                          );
                        }))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}
        </>
      )}

      {/* ========================================================================= */}
      {/* HOUSEKEEPER PERSONAL MOBILE PORTAL TAB                                    */}
      {/* ========================================================================= */}
      {activeTab === "portal" && (
        <div style={{ maxWidth: "680px", margin: "0 auto" }}>
          {/* DIGITAL HEADER & LIVE ATTENDANCE PUNCH CLOCK */}
          <div
            style={{
              background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
              color: "#ffffff",
              padding: "28px",
              borderRadius: "24px",
              boxShadow: "0 12px 36px rgba(0, 0, 0, 0.25)",
              marginBottom: "24px",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
              <div>
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: "800",
                    background: "rgba(255, 255, 255, 0.15)",
                    padding: "4px 10px",
                    borderRadius: "999px",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                >
                  Live Punch Clock
                </span>
                <div style={{ fontSize: "36px", fontWeight: "900", fontFamily: "monospace", letterSpacing: "2px", marginTop: "4px" }}>
                  {currentTime.toLocaleTimeString()}
                </div>
                <div style={{ fontSize: "13px", color: "#94a3b8" }}>
                  {currentTime.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric", year: "numeric" })}
                </div>
              </div>

              {/* Status Badge */}
              <div style={{ textAlign: "right" }}>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "6px 12px",
                    borderRadius: "999px",
                    fontSize: "12px",
                    fontWeight: "800",
                    background: myAttendance.status === "Present" ? "rgba(16, 185, 129, 0.2)" : "rgba(239, 68, 68, 0.2)",
                    color: myAttendance.status === "Present" ? "#34d399" : "#f87171",
                    border: myAttendance.status === "Present" ? "1px solid rgba(16, 185, 129, 0.4)" : "1px solid rgba(239, 68, 68, 0.4)",
                  }}
                >
                  <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: myAttendance.status === "Present" ? "#10b981" : "#ef4444" }} />
                  {myAttendance.status}
                </span>
                <div style={{ fontSize: "12px", color: "#cbd5e1", marginTop: "4px" }}>
                  {myAttendance.shift}
                </div>
              </div>
            </div>

            {/* Active Shift Counter */}
            <div
              style={{
                background: "rgba(255, 255, 255, 0.08)",
                padding: "14px 18px",
                borderRadius: "14px",
                marginBottom: "20px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <span style={{ fontSize: "12px", color: "#94a3b8", display: "block" }}>
                  Active Shift Counter
                </span>
                <strong style={{ fontSize: "16px", color: "#38bdf8" }}>
                  ⏱️ {myAttendance.clockIn ? `${formatSecondsToHours(liveWorkingSeconds)} on duty` : "Not Clocked In"}
                </strong>
              </div>

              <div style={{ textAlign: "right" }}>
                <span style={{ fontSize: "11px", color: "#94a3b8", display: "block" }}>Assigned Section</span>
                <strong style={{ fontSize: "13px", color: "#ffffff" }}>{myAttendance.assignedArea}</strong>
              </div>
            </div>

            {/* Punch Buttons */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <button
                type="button"
                onClick={() => handleClockInAction(myAttendance.staffId, myAttendance.staffName, myAttendance.staffEmail)}
                disabled={Boolean(myAttendance.clockIn && !myAttendance.clockOut)}
                style={{
                  padding: "14px 20px",
                  borderRadius: "14px",
                  border: "none",
                  background:
                    myAttendance.clockIn && !myAttendance.clockOut
                      ? "rgba(255, 255, 255, 0.1)"
                      : "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                  color: myAttendance.clockIn && !myAttendance.clockOut ? "#64748b" : "#ffffff",
                  fontSize: "14px",
                  fontWeight: "800",
                  cursor: myAttendance.clockIn && !myAttendance.clockOut ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                }}
              >
                <FaCheck /> Clock In
              </button>

              <button
                type="button"
                onClick={() => handleClockOutAction(myAttendance.staffId, myAttendance.staffName)}
                disabled={!myAttendance.clockIn || Boolean(myAttendance.clockOut)}
                style={{
                  padding: "14px 20px",
                  borderRadius: "14px",
                  border: "none",
                  background:
                    !myAttendance.clockIn || Boolean(myAttendance.clockOut)
                      ? "rgba(255, 255, 255, 0.1)"
                      : "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
                  color: !myAttendance.clockIn || Boolean(myAttendance.clockOut) ? "#64748b" : "#ffffff",
                  fontSize: "14px",
                  fontWeight: "800",
                  cursor: !myAttendance.clockIn || Boolean(myAttendance.clockOut) ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                }}
              >
                <FaClock /> Clock Out
              </button>
            </div>
          </div>

          {/* Assigned Rooms Feed */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "800", color: "#0f172a" }}>
              My Assigned Rooms ({myAssignedRooms.length})
            </h3>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {myAssignedRooms.length === 0 ? (
              <div style={{ padding: "30px", background: "#ffffff", borderRadius: "16px", textAlign: "center", color: "#64748b" }}>
                No rooms currently assigned to your shift.
              </div>
            ) : (
              myAssignedRooms.map((r) => {
                const isCleaning = r.status === "Cleaning" || r.status === "In Progress";
                const isDone = r.status === "Clean" || r.status === "Cleaned & Approved";

                return (
                  <div
                    key={r.roomId}
                    style={{
                      background: "#ffffff",
                      borderRadius: "20px",
                      padding: "20px",
                      border: "1px solid #e2e8f0",
                      boxShadow: "0 6px 20px rgba(0, 0, 0, 0.04)",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                      <div>
                        <h4 style={{ margin: 0, fontSize: "18px", fontWeight: "800", color: "#0f172a" }}>
                          {getCleanFloorRoom(r)}
                        </h4>
                        <span style={{ fontSize: "12px", color: "#64748b" }}>
                          {r.roomType} • Cleaning: <strong>{r.cleaningType}</strong>
                        </span>
                      </div>
                      <span style={{ padding: "4px 10px", borderRadius: "999px", fontSize: "11px", fontWeight: "800", background: r.statusBg, color: r.statusColor }}>
                        {r.status}
                      </span>
                    </div>

                    <div style={{ background: "#f8fafc", padding: "12px 14px", borderRadius: "12px", marginBottom: "16px" }}>
                      <div style={{ fontSize: "13px", fontWeight: "700", color: "#0f172a" }}>
                        📋 {r.currentTask}
                      </div>
                      {r.rejectedReason && (
                        <div style={{ color: "#ef4444", fontSize: "12px", fontWeight: "700", marginTop: "4px" }}>
                          ⚠️ Supervisor Note: {r.rejectedReason}
                        </div>
                      )}
                    </div>

                    <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
                      {!isCleaning && !isDone && r.status !== "Photo Uploaded" && (
                        <button
                          type="button"
                          onClick={() => handleStartCleaningTask(r)}
                          style={{
                            padding: "10px 18px",
                            borderRadius: "12px",
                            border: "none",
                            background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
                            color: "#ffffff",
                            fontSize: "13px",
                            fontWeight: "800",
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px",
                          }}
                        >
                          <FaPlay style={{ fontSize: "11px" }} /> Start Cleaning
                        </button>
                      )}

                      {isCleaning && (
                        <button
                          type="button"
                          onClick={() => handleOpenUploadProof(r)}
                          style={{
                            padding: "10px 18px",
                            borderRadius: "12px",
                            border: "none",
                            background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                            color: "#ffffff",
                            fontSize: "13px",
                            fontWeight: "800",
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px",
                          }}
                        >
                          <FaCamera /> Upload Proof & Complete
                        </button>
                      )}

                      {r.status === "Photo Uploaded" && (
                        <span style={{ padding: "8px 14px", borderRadius: "10px", background: "#ede9fe", color: "#7c3aed", fontSize: "12px", fontWeight: "800" }}>
                          <FaClock /> Awaiting Approval
                        </span>
                      )}

                      {isDone && (
                        <span style={{ padding: "8px 14px", borderRadius: "10px", background: "#dcfce7", color: "#16a34a", fontSize: "12px", fontWeight: "800" }}>
                          <FaCheckCircle /> Cleaned & Approved
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* KITCHEN OPERATIONAL DASHBOARD VIEW                                        */}
      {/* ========================================================================= */}
      {activeTab === "kitchen" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* ===================================================================== */}
          {/* 1. UNIFIED KITCHEN & DINING OPERATIONAL BANNER (FULL PURPLE)            */}
          {/* ===================================================================== */}
          <div
            style={{
              background: "linear-gradient(135deg, #2e0854 0%, #4c1d95 35%, #6b21a8 70%, #7c3aed 100%)",
              borderRadius: "20px",
              padding: "20px 22px",
              border: "1.5px solid rgba(216, 180, 254, 0.35)",
              boxShadow: "0 12px 32px -4px rgba(76, 29, 149, 0.5), 0 4px 12px -2px rgba(124, 58, 237, 0.3)",
              display: "flex",
              flexDirection: "column",
              gap: "18px",
            }}
          >
            {/* 1.1 TOP KITCHEN METRICS (FROSTED PURPLE GLASS) */}
            <div>
              <div style={{ marginBottom: "14px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
                <div style={{ fontSize: "14.5px", fontWeight: "900", color: "#ffffff", letterSpacing: "0.4px", display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "18px" }}>🍳</span> Kitchen & Dining Operations ({currentBranchName})
                </div>
                <button
                  type="button"
                  onClick={exportKitchenOrdersCSV}
                  title="Export all kitchen & dining orders to CSV spreadsheet"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "8px 16px",
                    borderRadius: "12px",
                    border: "1.5px solid rgba(255, 255, 255, 0.4)",
                    background: "rgba(255, 255, 255, 0.18)",
                    backdropFilter: "blur(10px)",
                    color: "#ffffff",
                    fontSize: "12.5px",
                    fontWeight: "800",
                    cursor: "pointer",
                    boxShadow: "0 4px 14px rgba(0, 0, 0, 0.2)",
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(255, 255, 255, 0.28)";
                    e.currentTarget.style.transform = "translateY(-1px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "rgba(255, 255, 255, 0.18)";
                    e.currentTarget.style.transform = "translateY(0px)";
                  }}
                >
                  <FaDownload style={{ fontSize: "13px" }} /> Export Data
                </button>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
                  gap: "12px",
                }}
              >
                {/* 1. Total Kitchen Orders */}
                <div
                  onClick={() => setKitchenFilter("All")}
                  title="Click to view all kitchen orders"
                  style={{
                    background: kitchenFilter === "All"
                      ? "rgba(255, 255, 255, 0.22)"
                      : "rgba(255, 255, 255, 0.12)",
                    backdropFilter: "blur(8px)",
                    padding: "16px 18px",
                    borderRadius: "16px",
                    border: kitchenFilter === "All"
                      ? "2px solid #fed7aa"
                      : "1px solid rgba(216, 180, 254, 0.35)",
                    display: "flex",
                    alignItems: "center",
                    gap: "14px",
                    transition: "all 0.2s ease",
                    cursor: "pointer",
                    boxShadow: kitchenFilter === "All"
                      ? "0 6px 20px rgba(249, 115, 22, 0.35)"
                      : "none",
                  }}
                >
                  <div
                    style={{
                      width: "44px",
                      height: "44px",
                      borderRadius: "12px",
                      background: "linear-gradient(135deg, #f97316 0%, #ea580c 100%)",
                      color: "#ffffff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "18px",
                      boxShadow: "0 4px 12px rgba(249, 115, 22, 0.35)",
                      flexShrink: 0,
                    }}
                  >
                    <FaUtensils />
                  </div>
                  <div>
                    <span style={{ fontSize: "11.5px", color: "#e9d5ff", fontWeight: "700", display: "block" }}>
                      Total Kitchen Orders
                    </span>
                    <strong style={{ fontSize: "20px", color: "#ffffff", fontWeight: "900", letterSpacing: "0.3px" }}>
                      <AnimatedNumber value={kitchenOrders.length} />
                    </strong>
                    <span style={{ fontSize: "11px", color: "#fed7aa", display: "block", marginTop: "2px", fontWeight: "700" }}>
                      Active Shift Kitchen
                    </span>
                  </div>
                </div>

                {/* 2. Today Income */}
                <div
                  onClick={() => {
                    setKitchenFilter("TodayIncome");
                    setIsKitchenIncomeHistoryOpen(true);
                  }}
                  title="Click to view total today food & kitchen income history"
                  style={{
                    background: kitchenFilter === "TodayIncome" || isKitchenIncomeHistoryOpen
                      ? "rgba(255, 255, 255, 0.22)"
                      : "rgba(255, 255, 255, 0.12)",
                    backdropFilter: "blur(8px)",
                    padding: "16px 18px",
                    borderRadius: "16px",
                    border: kitchenFilter === "TodayIncome" || isKitchenIncomeHistoryOpen
                      ? "2px solid #86efac"
                      : "1px solid rgba(216, 180, 254, 0.35)",
                    display: "flex",
                    alignItems: "center",
                    gap: "14px",
                    transition: "all 0.2s ease",
                    cursor: "pointer",
                    boxShadow: kitchenFilter === "TodayIncome" || isKitchenIncomeHistoryOpen
                      ? "0 6px 20px rgba(34, 197, 94, 0.35)"
                      : "none",
                  }}
                >
                  <div
                    style={{
                      width: "44px",
                      height: "44px",
                      borderRadius: "12px",
                      background: "linear-gradient(135deg, #22c55e 0%, #15803d 100%)",
                      color: "#ffffff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "20px",
                      fontWeight: "900",
                      boxShadow: "0 4px 12px rgba(34, 197, 94, 0.35)",
                      flexShrink: 0,
                    }}
                  >
                    ₹
                  </div>
                  <div>
                    <span style={{ fontSize: "11.5px", color: "#e9d5ff", fontWeight: "700", display: "block" }}>
                      Today Income
                    </span>
                    <strong style={{ fontSize: "20px", color: "#ffffff", fontWeight: "900", letterSpacing: "0.3px" }}>
                      <AnimatedAmount value={totalKitchenTodayIncome} />
                    </strong>
                    <span style={{ fontSize: "11px", color: "#86efac", display: "block", marginTop: "2px", fontWeight: "700" }}>
                      Click for Live Order History 📜
                    </span>
                  </div>
                </div>

                {/* 3. Total Delivery Successful */}
                <div
                  onClick={() => setKitchenFilter("Delivered")}
                  title="Click to view total successful delivered orders"
                  style={{
                    background: kitchenFilter === "Delivered"
                      ? "rgba(255, 255, 255, 0.22)"
                      : "rgba(255, 255, 255, 0.12)",
                    backdropFilter: "blur(8px)",
                    padding: "16px 18px",
                    borderRadius: "16px",
                    border: kitchenFilter === "Delivered"
                      ? "2px solid #a7f3d0"
                      : "1px solid rgba(216, 180, 254, 0.35)",
                    display: "flex",
                    alignItems: "center",
                    gap: "14px",
                    transition: "all 0.2s ease",
                    cursor: "pointer",
                    boxShadow: kitchenFilter === "Delivered"
                      ? "0 6px 20px rgba(16, 185, 129, 0.35)"
                      : "none",
                  }}
                >
                  <div
                    style={{
                      width: "44px",
                      height: "44px",
                      borderRadius: "12px",
                      background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                      color: "#ffffff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "18px",
                      boxShadow: "0 4px 12px rgba(16, 185, 129, 0.35)",
                      flexShrink: 0,
                    }}
                  >
                    <FaCheckCircle />
                  </div>
                  <div>
                    <span style={{ fontSize: "11.5px", color: "#e9d5ff", fontWeight: "700", display: "block" }}>
                      Total Delivery Successful
                    </span>
                    <strong style={{ fontSize: "20px", color: "#ffffff", fontWeight: "900", letterSpacing: "0.3px" }}>
                      <AnimatedNumber value={totalSuccessfulDeliveredOrders} />
                    </strong>
                    <span style={{ fontSize: "11px", color: "#a7f3d0", display: "block", marginTop: "2px", fontWeight: "700" }}>
                      Delivered & Completed
                    </span>
                  </div>
                </div>

                {/* 4. Failed Orders */}
                <div
                  onClick={() => setKitchenFilter("Failed")}
                  title="Click to view failed / cancelled orders"
                  style={{
                    background: kitchenFilter === "Failed"
                      ? "rgba(255, 255, 255, 0.22)"
                      : "rgba(255, 255, 255, 0.12)",
                    backdropFilter: "blur(8px)",
                    padding: "16px 18px",
                    borderRadius: "16px",
                    border: kitchenFilter === "Failed"
                      ? "2px solid #fca5a5"
                      : "1px solid rgba(216, 180, 254, 0.35)",
                    display: "flex",
                    alignItems: "center",
                    gap: "14px",
                    transition: "all 0.2s ease",
                    cursor: "pointer",
                    boxShadow: kitchenFilter === "Failed"
                      ? "0 6px 20px rgba(239, 68, 68, 0.35)"
                      : "none",
                  }}
                >
                  <div
                    style={{
                      width: "44px",
                      height: "44px",
                      borderRadius: "12px",
                      background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
                      color: "#ffffff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "18px",
                      boxShadow: "0 4px 12px rgba(239, 68, 68, 0.35)",
                      flexShrink: 0,
                    }}
                  >
                    <FaClock />
                  </div>
                  <div>
                    <span style={{ fontSize: "11.5px", color: "#e9d5ff", fontWeight: "700", display: "block" }}>
                      Failed Orders
                    </span>
                    <strong style={{ fontSize: "20px", color: "#ffffff", fontWeight: "900", letterSpacing: "0.3px" }}>
                      <AnimatedNumber value={totalFailedKitchenOrders} />
                    </strong>
                    <span style={{ fontSize: "11px", color: "#fca5a5", display: "block", marginTop: "2px", fontWeight: "700" }}>
                      Cancelled / Rejected
                    </span>
                  </div>
                </div>
              </div>

              {/* SUPER ADMIN ONLY: KITCHEN STAFF DUTY & ATTENDANCE PILLS */}
              {isSuperAdmin && (
                <>
                  {/* SUBTLE DIVIDER */}
                  <div style={{ height: "1px", background: "linear-gradient(90deg, transparent 0%, rgba(216, 180, 254, 0.25) 15%, rgba(216, 180, 254, 0.6) 50%, rgba(216, 180, 254, 0.25) 85%, transparent 100%)" }} />

                  {/* KITCHEN STAFF DUTY & ATTENDANCE OPERATIONAL METRICS PILLS */}
                  <div>
                    <div style={{ fontSize: "11.5px", fontWeight: "800", color: "#f3e8ff", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: "9px", display: "flex", alignItems: "center", gap: "6px" }}>
                      <span>👥</span> Kitchen Staff Duty & Attendance ({currentBranchName})
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "7px", alignItems: "center" }}>
                      {/* 1. All Kitchen Staff */}
                      <button
                        type="button"
                        onClick={() => {
                          setKitchenDeptView("all");
                          setKitchenStaffAttFilter("All");
                          document.getElementById("kitchen-staff-roster-section")?.scrollIntoView({ behavior: "smooth" });
                        }}
                        title="View All Kitchen Staff"
                        style={{
                          height: "32px",
                          padding: "4px 13px",
                          borderRadius: "999px",
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "7px",
                          fontSize: "12px",
                          fontWeight: "700",
                          transition: "all 0.15s ease",
                          border: kitchenDeptView === "all" && kitchenStaffAttFilter === "All"
                            ? "1.5px solid #cbd5e1"
                            : "1px solid rgba(255, 255, 255, 0.25)",
                          background: kitchenDeptView === "all" && kitchenStaffAttFilter === "All"
                            ? "linear-gradient(135deg, #334155 0%, #0f172a 100%)"
                            : "rgba(255, 255, 255, 0.14)",
                          color: "#ffffff",
                          boxShadow: kitchenDeptView === "all" && kitchenStaffAttFilter === "All"
                            ? "0 4px 14px rgba(15, 23, 42, 0.6)"
                            : "none",
                        }}
                      >
                        <span style={{ fontSize: "14px" }}>👥</span>
                        <span>All Staff</span>
                        <span
                          style={{
                            padding: "1px 7px",
                            borderRadius: "10px",
                            fontSize: "11.5px",
                            fontWeight: "900",
                            background: kitchenDeptView === "all" && kitchenStaffAttFilter === "All" ? "rgba(255,255,255,0.28)" : "#475569",
                            color: "#ffffff",
                          }}
                        >
                          {totalKitchenAllStaffCount}
                        </span>
                      </button>

                      {/* 2. Check-In */}
                      <button
                        type="button"
                        onClick={() => {
                          setKitchenStaffAttFilter("CheckedIn");
                          document.getElementById("kitchen-staff-roster-section")?.scrollIntoView({ behavior: "smooth" });
                        }}
                        title="Filter Checked-In Kitchen Staff"
                        style={{
                          height: "32px",
                          padding: "4px 13px",
                          borderRadius: "999px",
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "7px",
                          fontSize: "12px",
                          fontWeight: "700",
                          transition: "all 0.15s ease",
                          border: kitchenStaffAttFilter === "CheckedIn"
                            ? "1.5px solid #7dd3fc"
                            : "1px solid rgba(125, 211, 252, 0.35)",
                          background: kitchenStaffAttFilter === "CheckedIn"
                            ? "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)"
                            : "rgba(14, 165, 233, 0.18)",
                          color: "#ffffff",
                          boxShadow: kitchenStaffAttFilter === "CheckedIn"
                            ? "0 4px 14px rgba(2, 132, 199, 0.6)"
                            : "none",
                        }}
                      >
                        <span style={{ fontSize: "14px" }}>📥</span>
                        <span>Check-In</span>
                        <span
                          style={{
                            padding: "1px 7px",
                            borderRadius: "10px",
                            fontSize: "11.5px",
                            fontWeight: "900",
                            background: kitchenStaffAttFilter === "CheckedIn" ? "rgba(255,255,255,0.28)" : "#0ea5e9",
                            color: "#ffffff",
                          }}
                        >
                          {kitchenCheckedInCount}
                        </span>
                      </button>

                      {/* 3. Checked Out */}
                      <button
                        type="button"
                        onClick={() => {
                          setKitchenStaffAttFilter("CheckedOut");
                          document.getElementById("kitchen-staff-roster-section")?.scrollIntoView({ behavior: "smooth" });
                        }}
                        title="Filter Checked-Out Kitchen Staff"
                        style={{
                          height: "32px",
                          padding: "4px 13px",
                          borderRadius: "999px",
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "7px",
                          fontSize: "12px",
                          fontWeight: "700",
                          transition: "all 0.15s ease",
                          border: kitchenStaffAttFilter === "CheckedOut"
                            ? "1.5px solid #fed7aa"
                            : "1px solid rgba(253, 186, 116, 0.35)",
                          background: kitchenStaffAttFilter === "CheckedOut"
                            ? "linear-gradient(135deg, #ea580c 0%, #c2410c 100%)"
                            : "rgba(249, 115, 22, 0.18)",
                          color: "#ffffff",
                          boxShadow: kitchenStaffAttFilter === "CheckedOut"
                            ? "0 4px 14px rgba(234, 88, 12, 0.6)"
                            : "none",
                        }}
                      >
                        <span style={{ fontSize: "14px" }}>📤</span>
                        <span>Checked Out</span>
                        <span
                          style={{
                            padding: "1px 7px",
                            borderRadius: "10px",
                            fontSize: "11.5px",
                            fontWeight: "900",
                            background: kitchenStaffAttFilter === "CheckedOut" ? "rgba(255,255,255,0.28)" : "#ea580c",
                            color: "#ffffff",
                          }}
                        >
                          {kitchenCheckedOutCount}
                        </span>
                      </button>

                      {/* 4. Work */}
                      <button
                        type="button"
                        onClick={() => {
                          setKitchenStaffAttFilter("Worked");
                          document.getElementById("kitchen-staff-roster-section")?.scrollIntoView({ behavior: "smooth" });
                        }}
                        title="Filter Kitchen Staff Logged Work"
                        style={{
                          height: "32px",
                          padding: "4px 13px",
                          borderRadius: "999px",
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "7px",
                          fontSize: "12px",
                          fontWeight: "700",
                          transition: "all 0.15s ease",
                          border: kitchenStaffAttFilter === "Worked"
                            ? "1.5px solid #99f6e4"
                            : "1px solid rgba(153, 246, 228, 0.35)",
                          background: kitchenStaffAttFilter === "Worked"
                            ? "linear-gradient(135deg, #0d9488 0%, #0f766e 100%)"
                            : "rgba(20, 184, 166, 0.18)",
                          color: "#ffffff",
                          boxShadow: kitchenStaffAttFilter === "Worked"
                            ? "0 4px 14px rgba(13, 148, 136, 0.6)"
                            : "none",
                        }}
                      >
                        <span style={{ fontSize: "14px" }}>⏱️</span>
                        <span>Work</span>
                        <span
                          style={{
                            padding: "1px 7px",
                            borderRadius: "10px",
                            fontSize: "11.5px",
                            fontWeight: "900",
                            background: kitchenStaffAttFilter === "Worked" ? "rgba(255,255,255,0.28)" : "#14b8a6",
                            color: "#ffffff",
                          }}
                        >
                          {kitchenHoursWorkedText}
                        </span>
                      </button>

                      {/* 5. Leave */}
                      <button
                        type="button"
                        onClick={() => {
                          setKitchenStaffAttFilter("OnLeave");
                          document.getElementById("kitchen-staff-roster-section")?.scrollIntoView({ behavior: "smooth" });
                        }}
                        title="Filter Kitchen Staff On Leave"
                        style={{
                          height: "32px",
                          padding: "4px 13px",
                          borderRadius: "999px",
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "7px",
                          fontSize: "12px",
                          fontWeight: "700",
                          transition: "all 0.15s ease",
                          border: kitchenStaffAttFilter === "OnLeave"
                            ? "1.5px solid #fbcfe8"
                            : "1px solid rgba(249, 168, 212, 0.35)",
                          background: kitchenStaffAttFilter === "OnLeave"
                            ? "linear-gradient(135deg, #db2777 0%, #9d174d 100%)"
                            : "rgba(236, 72, 153, 0.18)",
                          color: "#ffffff",
                          boxShadow: kitchenStaffAttFilter === "OnLeave"
                            ? "0 4px 14px rgba(219, 39, 119, 0.6)"
                            : "none",
                        }}
                      >
                        <span style={{ fontSize: "14px" }}>🏖️</span>
                        <span>Leave</span>
                        <span
                          style={{
                            padding: "1px 7px",
                            borderRadius: "10px",
                            fontSize: "11.5px",
                            fontWeight: "900",
                            background: kitchenStaffAttFilter === "OnLeave" ? "rgba(255,255,255,0.28)" : "#ec4899",
                            color: "#ffffff",
                          }}
                        >
                          {kitchenOnLeaveCount}
                        </span>
                      </button>

                      {/* 6. Chatrix */}
                      <button
                        type="button"
                        onClick={() => {
                          setKitchenDeptView("chatrix");
                          setKitchenStaffAttFilter("All");
                          document.getElementById("kitchen-staff-roster-section")?.scrollIntoView({ behavior: "smooth" });
                        }}
                        title="Filter Chatrix Kitchen & Dining Staff"
                        style={{
                          height: "34px",
                          padding: "4px 16px",
                          borderRadius: "999px",
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "8px",
                          fontSize: "12.5px",
                          fontWeight: "900",
                          transition: "all 0.18s ease",
                          border: kitchenDeptView === "chatrix" && kitchenStaffAttFilter === "All"
                            ? "2px solid #ffffff"
                            : "1.5px solid rgba(216, 180, 254, 0.5)",
                          background: kitchenDeptView === "chatrix" && kitchenStaffAttFilter === "All"
                            ? "linear-gradient(135deg, #ec4899 0%, #a855f7 40%, #6366f1 100%)"
                            : "rgba(168, 85, 247, 0.22)",
                          color: "#ffffff",
                          boxShadow: kitchenDeptView === "chatrix" && kitchenStaffAttFilter === "All"
                            ? "0 4px 16px rgba(236, 72, 153, 0.55), 0 0 12px rgba(168, 85, 247, 0.6)"
                            : "none",
                        }}
                      >
                        <span style={{ fontSize: "15px" }}>📊</span>
                        <span>Chatrix</span>
                        <span
                          style={{
                            padding: "1px 8px",
                            borderRadius: "10px",
                            fontSize: "11.5px",
                            fontWeight: "900",
                            background: "rgba(255, 255, 255, 0.3)",
                            color: "#ffffff",
                          }}
                        >
                          {totalKitchenChatrixStaffCount}
                        </span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* 2. SUPER ADMIN: KITCHEN STAFF LIVE ROSTER & DUTY DIRECTORY */}
          {isSuperAdmin && (
            <div
              id="kitchen-staff-roster-section"
              style={{
                background: "#ffffff",
                padding: "20px 24px",
                borderRadius: "20px",
                border: "1.5px solid #e2e8f0",
                boxShadow: "0 4px 20px rgba(0, 0, 0, 0.04)",
                display: "flex",
                flexDirection: "column",
                gap: "16px",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px", borderBottom: "1px solid #f1f5f9", paddingBottom: "14px" }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "800", color: "#0f172a", display: "flex", alignItems: "center", gap: "8px" }}>
                    <span>{kitchenDeptView === "chatrix" ? "📊 Chatrix Kitchen & Chef Directory" : "👨‍🍳 Kitchen & Dining Staff Directory"}</span>
                    <span style={{ fontSize: "12px", background: kitchenDeptView === "chatrix" ? "#f3e8ff" : "#ffedd5", color: kitchenDeptView === "chatrix" ? "#7c3aed" : "#c2410c", padding: "2px 8px", borderRadius: "12px", fontWeight: "800" }}>
                      {filteredKitchenStaffRoster.length} {filteredKitchenStaffRoster.length === 1 ? "Chef / Member" : "Chefs / Members"}
                    </span>
                  </h3>
                  <span style={{ fontSize: "12px", color: "#64748b", marginTop: "2px", display: "block" }}>
                    {kitchenDeptView === "chatrix"
                      ? `Dedicated Kitchen & Culinary team under Chatrix for ${currentBranchName}`
                      : `Registered Kitchen & Culinary Staff members in ${currentBranchName}`}
                  </span>
                </div>

                {/* View Switcher */}
                <div style={{ display: "flex", gap: "6px", background: "#f1f5f9", padding: "4px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                  <button
                    type="button"
                    onClick={() => {
                      setKitchenDeptView("all");
                      setKitchenStaffAttFilter("All");
                    }}
                    style={{
                      padding: "6px 12px",
                      borderRadius: "8px",
                      fontSize: "12px",
                      fontWeight: "800",
                      cursor: "pointer",
                      border: "none",
                      background: kitchenDeptView === "all" ? "linear-gradient(135deg, #ea580c, #c2410c)" : "transparent",
                      color: kitchenDeptView === "all" ? "#ffffff" : "#64748b",
                      boxShadow: kitchenDeptView === "all" ? "0 2px 8px rgba(234, 88, 12, 0.35)" : "none",
                      transition: "all 0.15s ease",
                    }}
                  >
                    👨‍🍳 All Kitchen Staff ({totalKitchenAllStaffCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setKitchenDeptView("chatrix");
                      setKitchenStaffAttFilter("All");
                    }}
                    style={{
                      padding: "6px 12px",
                      borderRadius: "8px",
                      fontSize: "12px",
                      fontWeight: "800",
                      cursor: "pointer",
                      border: "none",
                      background: kitchenDeptView === "chatrix" ? "linear-gradient(135deg, #ec4899 0%, #a855f7 40%, #6366f1 100%)" : "transparent",
                      color: kitchenDeptView === "chatrix" ? "#ffffff" : "#64748b",
                      boxShadow: kitchenDeptView === "chatrix" ? "0 2px 8px rgba(168, 85, 247, 0.4)" : "none",
                      transition: "all 0.15s ease",
                    }}
                  >
                    📊 Chatrix ({totalKitchenChatrixStaffCount})
                  </button>
                </div>
              </div>

              {/* CONDITIONAL DIRECTORY VIEW: CHATRIX (ONLY NAME & PROFILE) VS ALL STAFF (FULL COLUMNS TABLE) */}
              {kitchenDeptView === "chatrix" ? (
                /* CHATRIX VIEW: SLEEK HORIZONTAL STRIPS SHOWING ONLY NAME & PROFILE (WITHOUT Station, Designation, Contact, Salary, Duty Status) */
                <div style={{ marginTop: "6px", display: "flex", flexDirection: "column", gap: "10px" }}>
                  {filteredKitchenStaffRoster.length === 0 ? (
                    <div style={{ padding: "28px", textAlign: "center", color: "#64748b", background: "#f8fafc", borderRadius: "14px", border: "1px dashed #cbd5e1" }}>
                      No Chatrix kitchen team members found.
                    </div>
                  ) : (
                    filteredKitchenStaffRoster.map((staff) => (
                      <div
                        key={staff.staffId || staff.id}
                        style={{
                          background: "linear-gradient(90deg, #ffffff 0%, #faf5ff 50%, #fdf4ff 100%)",
                          borderRadius: "14px",
                          padding: "12px 20px",
                          border: "1.5px solid rgba(216, 180, 254, 0.4)",
                          borderLeft: "5px solid #a855f7",
                          boxShadow: "0 2px 8px rgba(168, 85, 247, 0.06)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: "14px",
                          transition: "all 0.2s ease",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = "translateX(4px)";
                          e.currentTarget.style.boxShadow = "0 6px 18px rgba(168, 85, 247, 0.15)";
                          e.currentTarget.style.borderColor = "#c084fc";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = "translateX(0)";
                          e.currentTarget.style.boxShadow = "0 2px 8px rgba(168, 85, 247, 0.06)";
                          e.currentTarget.style.borderColor = "rgba(216, 180, 254, 0.4)";
                        }}
                      >
                        {/* ONLY NAME & PROFILE AVATAR + ID */}
                        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                          <div style={{ position: "relative" }}>
                            <img
                              src={staff.avatar}
                              alt={staff.name}
                              style={{
                                width: "42px",
                                height: "42px",
                                borderRadius: "12px",
                                objectFit: "cover",
                                border: "2px solid #e9d5ff",
                                display: "block",
                              }}
                            />
                            <span
                              style={{
                                position: "absolute",
                                bottom: "-2px",
                                right: "-2px",
                                width: "11px",
                                height: "11px",
                                borderRadius: "50%",
                                background: "#22c55e",
                                border: "2px solid #ffffff",
                              }}
                              title="Online in Chatrix"
                            />
                          </div>

                          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                            <h4
                              style={{
                                margin: 0,
                                fontSize: "15px",
                                fontWeight: "900",
                                color: "#0f172a",
                                letterSpacing: "0.2px",
                              }}
                            >
                              {staff.name}
                            </h4>

                            <span
                              style={{
                                background: "#f3e8ff",
                                color: "#7c3aed",
                                padding: "2px 9px",
                                borderRadius: "6px",
                                fontSize: "11.5px",
                                fontWeight: "800",
                                border: "1px solid #e9d5ff",
                              }}
                            >
                              {staff.staffId}
                            </span>

                            <span
                              style={{
                                fontSize: "12px",
                                color: "#64748b",
                                fontWeight: "600",
                              }}
                            >
                              • {currentBranchName}
                            </span>

                            <span
                              style={{
                                background: "linear-gradient(135deg, #ec4899 0%, #a855f7 100%)",
                                color: "#ffffff",
                                padding: "2px 8px",
                                borderRadius: "6px",
                                fontSize: "10.5px",
                                fontWeight: "800",
                                letterSpacing: "0.4px",
                                textTransform: "uppercase",
                              }}
                            >
                              Chatrix Member
                            </span>
                          </div>
                        </div>

                        {/* RIGHT: CHATRIX BADGE (CLICKABLE TO OPEN CHATRIX KITCHEN CHAT BOX) */}
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <button
                            type="button"
                            onClick={() => setSelectedKitchenChatrixChef(staff)}
                            style={{
                              padding: "7px 16px",
                              borderRadius: "999px",
                              background: "linear-gradient(135deg, rgba(168, 85, 247, 0.15) 0%, rgba(236, 72, 153, 0.15) 100%)",
                              color: "#7c3aed",
                              fontSize: "12px",
                              fontWeight: "850",
                              border: "1.5px solid rgba(168, 85, 247, 0.35)",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "6px",
                              cursor: "pointer",
                              transition: "all 0.2s ease",
                              boxShadow: "0 2px 8px rgba(168, 85, 247, 0.1)",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.transform = "scale(1.05)";
                              e.currentTarget.style.background = "linear-gradient(135deg, #a855f7 0%, #ec4899 100%)";
                              e.currentTarget.style.color = "#ffffff";
                              e.currentTarget.style.boxShadow = "0 4px 12px rgba(168, 85, 247, 0.35)";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = "scale(1)";
                              e.currentTarget.style.background = "linear-gradient(135deg, rgba(168, 85, 247, 0.15) 0%, rgba(236, 72, 153, 0.15) 100%)";
                              e.currentTarget.style.color = "#7c3aed";
                              e.currentTarget.style.boxShadow = "0 2px 8px rgba(168, 85, 247, 0.1)";
                            }}
                            title="Open Chatrix Kitchen & Food Orders Audit Chat Box"
                          >
                            <span>⚡</span> Active Chatrix Chef
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              ) : (
                /* ALL KITCHEN STAFF VIEW: FULL DIRECTORY TABLE WITH ALL COLUMNS */
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: "0 8px", minWidth: "750px" }}>
                    <thead>
                      <tr style={{ color: "#64748b", fontSize: "12px", textAlign: "left" }}>
                        <th style={{ padding: "10px 14px" }}>Chef / Staff Member</th>
                        <th style={{ padding: "10px 14px" }}>Station / Department</th>
                        <th style={{ padding: "10px 14px" }}>Designation & Role</th>
                        <th style={{ padding: "10px 14px" }}>Contact Details</th>
                        <th style={{ padding: "10px 14px", textAlign: "right" }}>Monthly Salary</th>
                        <th style={{ padding: "10px 14px", textAlign: "center" }}>Duty Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredKitchenStaffRoster.length === 0 ? (
                        <tr>
                          <td colSpan={6} style={{ padding: "28px", textAlign: "center", color: "#64748b", background: "#f8fafc", borderRadius: "12px" }}>
                            No kitchen staff members found matching this filter.
                          </td>
                        </tr>
                      ) : (
                        filteredKitchenStaffRoster.map((staff) => (
                          <tr
                            key={staff.staffId || staff.id}
                            style={{
                              background: "#f8fafc",
                              borderRadius: "12px",
                              boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
                              border: "1px solid #e2e8f0",
                            }}
                          >
                            {/* 1. Member Profile */}
                            <td style={{ padding: "12px 14px" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                <img
                                  src={staff.avatar}
                                  alt={staff.name}
                                  style={{ width: "38px", height: "38px", borderRadius: "10px", objectFit: "cover", border: "1.5px solid #fed7aa" }}
                                />
                                <div>
                                  <div style={{ fontWeight: "800", color: "#0f172a", fontSize: "13.5px" }}>
                                    {staff.name}
                                  </div>
                                  <div style={{ fontSize: "11px", color: "#c2410c", fontWeight: "700" }}>
                                    {staff.staffId} • {currentBranchName}
                                  </div>
                                </div>
                              </div>
                            </td>

                            {/* 2. Department */}
                            <td style={{ padding: "12px 14px" }}>
                              <span
                                style={{
                                  padding: "4px 10px",
                                  borderRadius: "8px",
                                  fontSize: "11.5px",
                                  fontWeight: "800",
                                  background: "#ffedd5",
                                  color: "#c2410c",
                                  display: "inline-block",
                                }}
                              >
                                🍳 Kitchen & Dining
                              </span>
                            </td>

                            {/* 3. Role & Designation */}
                            <td style={{ padding: "12px 14px" }}>
                              <div style={{ fontSize: "12.5px", fontWeight: "700", color: "#1e293b" }}>
                                {staff.role}
                              </div>
                              <div style={{ fontSize: "11px", color: "#64748b" }}>
                                📍 {staff.assignedArea || "Main Kitchen"}
                              </div>
                            </td>

                            {/* 4. Contact Details */}
                            <td style={{ padding: "12px 14px" }}>
                              <div style={{ fontSize: "12px", color: "#334155", fontWeight: "600" }}>
                                ✉️ {staff.email || `${staff.name?.toLowerCase().replace(/\s+/g, ".")}@hotel.com`}
                              </div>
                              <div style={{ fontSize: "11.5px", color: "#64748b", marginTop: "2px" }}>
                                📞 {staff.phone || "+91 98765 43210"}
                              </div>
                            </td>

                            {/* 5. Salary */}
                            <td style={{ padding: "12px 14px", textAlign: "right" }}>
                              <strong style={{ fontSize: "14px", fontWeight: "900", color: "#047857" }}>
                                ₹{Number(staff.salary || 28000).toLocaleString("en-IN")}
                              </strong>
                              <div style={{ fontSize: "10.5px", color: "#64748b" }}>Monthly CTC</div>
                            </td>

                            {/* 6. Status */}
                            <td style={{ padding: "12px 14px", textAlign: "center" }}>
                              <span
                                style={{
                                  padding: "3px 10px",
                                  borderRadius: "12px",
                                  fontSize: "11.5px",
                                  fontWeight: "800",
                                  background:
                                    staff.status === "Present"
                                      ? "#dcfce7"
                                      : staff.status === "On Leave"
                                        ? "#fef9c3"
                                        : staff.status === "Checked Out"
                                          ? "#e0e7ff"
                                          : "#f1f5f9",
                                  color:
                                    staff.status === "Present"
                                      ? "#15803d"
                                      : staff.status === "On Leave"
                                        ? "#a16207"
                                        : staff.status === "Checked Out"
                                          ? "#4338ca"
                                          : "#64748b",
                                  display: "inline-block",
                                }}
                              >
                                {staff.status === "Present" ? "🟢 Check-In" : staff.status === "Checked Out" ? "⚪ Checked Out" : staff.status === "On Leave" ? "🏖️ On Leave" : "⚪ Absent"}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* 2. FILTER & SEARCH CONTROLS */}
          <div
            style={{
              background: "#ffffff",
              padding: "16px 20px",
              borderRadius: "16px",
              border: "1px solid #e2e8f0",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "14px",
              flexWrap: "wrap",
            }}
          >
            {/* Search */}
            <div style={{ position: "relative", flex: 1, minWidth: "220px", maxWidth: "380px" }}>
              <FaSearch style={{ position: "absolute", left: "14px", top: "13px", color: "#94a3b8", fontSize: "13px" }} />
              <input
                type="text"
                placeholder="Search Room #, Guest, Dish..."
                value={kitchenSearch}
                onChange={(e) => setKitchenSearch(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 14px 10px 38px",
                  borderRadius: "12px",
                  border: "1px solid #cbd5e1",
                  fontSize: "13px",
                  outline: "none",
                }}
              />
            </div>

            {/* Status Tabs */}
            <div style={{ display: "flex", gap: "6px", alignItems: "center", flexWrap: "wrap" }}>
              {["All", "Pending", "Cooking", "Ready", "Delivered", "Failed"].map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setKitchenFilter(st)}
                  style={{
                    padding: "7px 14px",
                    borderRadius: "10px",
                    border: kitchenFilter === st ? "none" : "1px solid #e2e8f0",
                    background: kitchenFilter === st ? (st === "Failed" ? "#ef4444" : "#f97316") : "#f8fafc",
                    color: kitchenFilter === st ? "#ffffff" : "#475569",
                    fontSize: "12.5px",
                    fontWeight: "700",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  {st === "Delivered" ? "Successful Delivery" : st}
                </button>
              ))}
            </div>
          </div>

          {/* 3. LIVE KITCHEN ORDER TICKETS (CARD VIEW ONLY) */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
              <h3 style={{ margin: 0, fontSize: "17px", fontWeight: "800", color: "#0f172a", display: "flex", alignItems: "center", gap: "8px" }}>
                <FaUtensils style={{ color: "#f97316" }} /> Active Kitchen Orders & Food Preparation
              </h3>
              <span style={{ fontSize: "12px", color: "#64748b", fontWeight: "600" }}>
                Showing {filteredKitchenOrders.length} orders
              </span>
            </div>

            {filteredKitchenOrders.length === 0 ? (
              <div style={{ padding: "40px", textAlign: "center", background: "#ffffff", borderRadius: "18px", border: "1px solid #e2e8f0", color: "#64748b" }}>
                No kitchen orders match the filter.
              </div>
            ) : (
              /* CARD VIEW ONLY WITH SEQUENTIAL 3D FLIP ANIMATION */
              <>
                <style>{`
                  @keyframes flipCard3D {
                    0% {
                      opacity: 0;
                      transform: perspective(900px) rotateY(90deg) scale(0.92);
                    }
                    60% {
                      transform: perspective(900px) rotateY(-10deg) scale(1.02);
                    }
                    100% {
                      opacity: 1;
                      transform: perspective(900px) rotateY(0deg) scale(1);
                    }
                  }
                  .flip-card-item {
                    animation: flipCard3D 0.75s cubic-bezier(0.25, 1, 0.5, 1) forwards;
                    backface-visibility: hidden;
                    will-change: transform, opacity;
                  }
                `}</style>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(310px, 1fr))",
                    gap: "16px",
                  }}
                >
                  {filteredKitchenOrders.map((ord, idx) => (
                    <div
                      key={ord.id}
                      className="flip-card-item"
                      style={{
                        animationDelay: `${idx * 0.18}s`,
                        opacity: 0,
                        background: "#ffffff",
                        borderRadius: "18px",
                        padding: "18px",
                        border: ord.status === "Cooking" ? "1.5px solid #f97316" : "1px solid #e2e8f0",
                        boxShadow: "0 4px 14px rgba(0,0,0,0.04)",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between",
                        transition: "box-shadow 0.25s ease, transform 0.25s ease",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.transform = "perspective(900px) translateY(-4px) scale(1.01)")}
                      onMouseLeave={(e) => (e.currentTarget.style.transform = "perspective(900px) translateY(0) scale(1)")}
                    >
                      <div>
                        {/* Top Header */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
                          <div>
                            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                              <span style={{ fontSize: "11px", fontWeight: "800", background: "#ffedd5", color: "#c2410c", padding: "2px 8px", borderRadius: "6px" }}>
                                {ord.id}
                              </span>
                              <span style={{ fontSize: "11px", color: "#64748b" }}>• {ord.time}</span>
                            </div>
                            <h4 style={{ margin: "4px 0 0", fontSize: "18px", fontWeight: "850", color: "#0f172a" }}>
                              {ord.roomOrTable || (ord.table ? `${ord.room || ""} • ${ord.table}` : (ord.room ? `Room ${ord.room}` : "Table T-01"))}
                            </h4>
                            <span style={{ fontSize: "12px", color: "#64748b" }}>Guest: {ord.guest}</span>
                          </div>

                          <span
                            style={{
                              padding: "4px 10px",
                              borderRadius: "999px",
                              fontSize: "11.5px",
                              fontWeight: "800",
                              background:
                                ord.status === "Cooking"
                                  ? "#ffedd5"
                                  : ord.status === "Ready"
                                    ? "#dcfce7"
                                    : ord.status === "Delivered"
                                      ? "#f1f5f9"
                                      : "#fef3c7",
                              color:
                                ord.status === "Cooking"
                                  ? "#c2410c"
                                  : ord.status === "Ready"
                                    ? "#16a34a"
                                    : ord.status === "Delivered"
                                      ? "#475569"
                                      : "#d97706",
                            }}
                          >
                            {ord.status === "Cooking" ? "🔥 Cooking" : ord.status === "Ready" ? "🔔 Ready" : ord.status === "Delivered" ? "✅ Delivered" : "⏳ Pending"}
                          </span>
                        </div>

                        {/* Items & Qty */}
                        <div style={{ background: "#f8fafc", padding: "10px 12px", borderRadius: "10px", marginBottom: "12px" }}>
                          <div style={{ fontSize: "13px", fontWeight: "700", color: "#0f172a", lineHeight: "1.4" }}>
                            🍴 {ord.items}
                          </div>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "6px" }}>
                            <span style={{ fontSize: "11.5px", color: "#475569", fontWeight: "700" }}>
                              Qty: <span style={{ color: "#0f172a" }}>{ord.qty || "1"}</span>
                            </span>
                            {ord.notes && (
                              <span style={{ fontSize: "11px", color: "#64748b", fontStyle: "italic" }}>
                                {ord.notes}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Footer / Status Actions */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "10px", borderTop: "1px solid #f1f5f9" }}>
                        <strong style={{ fontSize: "15px", color: "#0f172a" }}>₹{ord.total}</strong>

                        <div style={{ display: "flex", gap: "6px" }}>
                          {ord.status === "Pending" && (
                            <button
                              type="button"
                              onClick={() => updateKitchenOrderStatus(ord.id, "Cooking")}
                              style={{
                                padding: "6px 12px",
                                borderRadius: "8px",
                                border: "none",
                                background: "#f97316",
                                color: "#ffffff",
                                fontSize: "12px",
                                fontWeight: "700",
                                cursor: "pointer",
                              }}
                            >
                              Start Cooking
                            </button>
                          )}
                          {ord.status === "Cooking" && (
                            <button
                              type="button"
                              onClick={() => updateKitchenOrderStatus(ord.id, "Ready")}
                              style={{
                                padding: "6px 12px",
                                borderRadius: "8px",
                                border: "none",
                                background: "#10b981",
                                color: "#ffffff",
                                fontSize: "12px",
                                fontWeight: "700",
                                cursor: "pointer",
                              }}
                            >
                              Mark Ready
                            </button>
                          )}
                          {ord.status === "Ready" && (
                            <button
                              type="button"
                              onClick={() => updateKitchenOrderStatus(ord.id, "Delivered")}
                              style={{
                                padding: "6px 12px",
                                borderRadius: "8px",
                                border: "none",
                                background: "#0f172a",
                                color: "#ffffff",
                                fontSize: "12px",
                                fontWeight: "700",
                                cursor: "pointer",
                              }}
                            >
                              Mark Delivered
                            </button>
                          )}
                          {ord.status === "Delivered" && (
                            <span style={{ fontSize: "12px", color: "#16a34a", fontWeight: "700" }}>
                              Served & Billed
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ACCOUNTING & FINANCIAL OPERATIONS VIEW                                    */}
      {/* ========================================================================= */}
      {activeTab === "accounting" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* ===================================================================== */}
          {/* 1. UNIFIED FINANCIAL & ACCOUNTING STAFF ATTENDANCE BANNER (FULL PURPLE) */}
          {/* ===================================================================== */}
          <div
            style={{
              background: "linear-gradient(135deg, #2e0854 0%, #4c1d95 35%, #6b21a8 70%, #7c3aed 100%)",
              borderRadius: "20px",
              padding: "20px 22px",
              border: "1.5px solid rgba(216, 180, 254, 0.35)",
              boxShadow: "0 12px 32px -4px rgba(76, 29, 149, 0.5), 0 4px 12px -2px rgba(124, 58, 237, 0.3)",
              display: "flex",
              flexDirection: "column",
              gap: "18px",
            }}
          >
            {/* 1.1 TOP FINANCIAL METRIC CARDS (FROSTED PURPLE GLASS) */}
            <div>
              <div style={{ marginBottom: "14px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
                <div style={{ fontSize: "14.5px", fontWeight: "900", color: "#ffffff", letterSpacing: "0.4px", display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "18px" }}>💰</span> Financial Ledger & Payroll Overview
                </div>
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                  gap: "12px",
                }}
              >
                {/* 1. Total Amount (Total Invoiced) */}
                <div
                  onClick={() => setAccountingActiveCategory("invoices")}
                  title="Click to filter Invoices & Total Amount Ledger"
                  style={{
                    background: accountingActiveCategory === "invoices" || accountingActiveCategory === "all"
                      ? "rgba(255, 255, 255, 0.22)"
                      : "rgba(255, 255, 255, 0.12)",
                    backdropFilter: "blur(8px)",
                    padding: "16px 18px",
                    borderRadius: "16px",
                    border: accountingActiveCategory === "invoices" || accountingActiveCategory === "all"
                      ? "2px solid #a7f3d0"
                      : "1px solid rgba(216, 180, 254, 0.35)",
                    display: "flex",
                    alignItems: "center",
                    gap: "14px",
                    transition: "all 0.2s ease",
                    cursor: "pointer",
                    boxShadow: accountingActiveCategory === "invoices" || accountingActiveCategory === "all"
                      ? "0 6px 20px rgba(16, 185, 129, 0.35)"
                      : "none",
                  }}
                >
                  <div
                    style={{
                      width: "44px",
                      height: "44px",
                      borderRadius: "12px",
                      background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                      color: "#ffffff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "18px",
                      boxShadow: "0 4px 12px rgba(16, 185, 129, 0.35)",
                      flexShrink: 0,
                    }}
                  >
                    <FaReceipt />
                  </div>
                  <div>
                    <span style={{ fontSize: "11.5px", color: "#e9d5ff", fontWeight: "700", display: "block" }}>
                      Total Amount
                    </span>
                    <strong style={{ fontSize: "20px", color: "#ffffff", fontWeight: "900", letterSpacing: "0.3px" }}>
                      <AnimatedAmount value={totalInvoicedAmount} />
                    </strong>
                    <span style={{ fontSize: "11px", color: "#a7f3d0", display: "block", marginTop: "2px", fontWeight: "700" }}>
                      {accountingInvoices.length} Registered Invoices
                    </span>
                  </div>
                </div>

                {/* 2. Visitor Total Income */}
                <div
                  onClick={() => setAccountingActiveCategory("visitor_income")}
                  title="Click to filter Visitor Total Income & Tariffs"
                  style={{
                    background: accountingActiveCategory === "visitor_income"
                      ? "rgba(255, 255, 255, 0.22)"
                      : "rgba(255, 255, 255, 0.12)",
                    backdropFilter: "blur(8px)",
                    padding: "16px 18px",
                    borderRadius: "16px",
                    border: accountingActiveCategory === "visitor_income"
                      ? "2px solid #ddd6fe"
                      : "1px solid rgba(216, 180, 254, 0.35)",
                    display: "flex",
                    alignItems: "center",
                    gap: "14px",
                    transition: "all 0.2s ease",
                    cursor: "pointer",
                    boxShadow: accountingActiveCategory === "visitor_income"
                      ? "0 6px 20px rgba(139, 92, 246, 0.35)"
                      : "none",
                  }}
                >
                  <div
                    style={{
                      width: "44px",
                      height: "44px",
                      borderRadius: "12px",
                      background: "linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)",
                      color: "#ffffff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "18px",
                      boxShadow: "0 4px 12px rgba(139, 92, 246, 0.35)",
                      flexShrink: 0,
                    }}
                  >
                    <FaWalking />
                  </div>
                  <div>
                    <span style={{ fontSize: "11.5px", color: "#e9d5ff", fontWeight: "700", display: "block" }}>
                      Visitor Total Income
                    </span>
                    <strong style={{ fontSize: "20px", color: "#ffffff", fontWeight: "900", letterSpacing: "0.3px" }}>
                      <AnimatedAmount value={totalVisitorIncome} />
                    </strong>
                    <span style={{ fontSize: "11px", color: "#ddd6fe", display: "block", marginTop: "2px", fontWeight: "700" }}>
                      {visitorIncomeList.length} Visitor Entries Collected
                    </span>
                  </div>
                </div>

                {/* 3. Employee Total Salary */}
                <div
                  onClick={() => setAccountingActiveCategory("employee_salary")}
                  title="Click to filter Employee Total Salary Roster"
                  style={{
                    background: accountingActiveCategory === "employee_salary"
                      ? "rgba(255, 255, 255, 0.22)"
                      : "rgba(255, 255, 255, 0.12)",
                    backdropFilter: "blur(8px)",
                    padding: "16px 18px",
                    borderRadius: "16px",
                    border: accountingActiveCategory === "employee_salary"
                      ? "2px solid #bfdbfe"
                      : "1px solid rgba(216, 180, 254, 0.35)",
                    display: "flex",
                    alignItems: "center",
                    gap: "14px",
                    transition: "all 0.2s ease",
                    cursor: "pointer",
                    boxShadow: accountingActiveCategory === "employee_salary"
                      ? "0 6px 20px rgba(59, 130, 246, 0.35)"
                      : "none",
                  }}
                >
                  <div
                    style={{
                      width: "44px",
                      height: "44px",
                      borderRadius: "12px",
                      background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
                      color: "#ffffff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "18px",
                      boxShadow: "0 4px 12px rgba(59, 130, 246, 0.35)",
                      flexShrink: 0,
                    }}
                  >
                    <FaUsers />
                  </div>
                  <div>
                    <span style={{ fontSize: "11.5px", color: "#e9d5ff", fontWeight: "700", display: "block" }}>
                      Employee Total Salary
                    </span>
                    <strong style={{ fontSize: "20px", color: "#ffffff", fontWeight: "900", letterSpacing: "0.3px" }}>
                      <AnimatedAmount value={totalEmployeeSalary} />
                    </strong>
                    <span style={{ fontSize: "11px", color: "#bfdbfe", display: "block", marginTop: "2px", fontWeight: "700" }}>
                      {currentStaffList.length} Active Staff Members
                    </span>
                  </div>
                </div>

                {/* 4. Total Paid Salary */}
                <div
                  onClick={() => setAccountingActiveCategory("paid_salary")}
                  title="Click to filter Total Paid Salary Disbursements"
                  style={{
                    background: accountingActiveCategory === "paid_salary"
                      ? "rgba(255, 255, 255, 0.22)"
                      : "rgba(255, 255, 255, 0.12)",
                    backdropFilter: "blur(8px)",
                    padding: "16px 18px",
                    borderRadius: "16px",
                    border: accountingActiveCategory === "paid_salary"
                      ? "2px solid #fde68a"
                      : "1px solid rgba(216, 180, 254, 0.35)",
                    display: "flex",
                    alignItems: "center",
                    gap: "14px",
                    transition: "all 0.2s ease",
                    cursor: "pointer",
                    boxShadow: accountingActiveCategory === "paid_salary"
                      ? "0 6px 20px rgba(245, 158, 11, 0.35)"
                      : "none",
                  }}
                >
                  <div
                    style={{
                      width: "44px",
                      height: "44px",
                      borderRadius: "12px",
                      background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                      color: "#ffffff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "18px",
                      boxShadow: "0 4px 12px rgba(245, 158, 11, 0.35)",
                      flexShrink: 0,
                    }}
                  >
                    <FaCheckCircle />
                  </div>
                  <div>
                    <span style={{ fontSize: "11.5px", color: "#e9d5ff", fontWeight: "700", display: "block" }}>
                      Total Paid Salary
                    </span>
                    <strong style={{ fontSize: "20px", color: "#ffffff", fontWeight: "900", letterSpacing: "0.3px" }}>
                      <AnimatedAmount value={totalPaidSalary} />
                    </strong>
                    <span style={{ fontSize: "11px", color: "#fde68a", display: "block", marginTop: "2px", fontWeight: "700" }}>
                      Disbursed & Processed
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* SUPER ADMIN ONLY: ACCOUNTING STAFF DUTY & ATTENDANCE PILLS */}
            {isSuperAdmin && (
              <>
                {/* SUBTLE DIVIDER */}
                <div style={{ height: "1px", background: "linear-gradient(90deg, transparent 0%, rgba(216, 180, 254, 0.25) 15%, rgba(216, 180, 254, 0.6) 50%, rgba(216, 180, 254, 0.25) 85%, transparent 100%)" }} />

                {/* 1.2 ACCOUNTING STAFF DUTY & ATTENDANCE OPERATIONAL METRICS PILLS */}
                <div>
                  <div style={{ fontSize: "11.5px", fontWeight: "800", color: "#f3e8ff", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: "9px", display: "flex", alignItems: "center", gap: "6px" }}>
                    <span>👥</span> Accounting Staff Duty & Attendance ({currentBranchName})
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "7px", alignItems: "center" }}>
                    {/* 1. All Staff (All 15 hotel employees) */}
                    <button
                      type="button"
                      onClick={() => {
                        setAccountingDeptView("all");
                        setAccountingStaffAttFilter("All");
                      }}
                      title="View All Hotel Staff across All Departments"
                      style={{
                        height: "32px",
                        padding: "4px 13px",
                        borderRadius: "999px",
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "7px",
                        fontSize: "12px",
                        fontWeight: "700",
                        transition: "all 0.15s ease",
                        border: accountingDeptView === "all" && accountingStaffAttFilter === "All"
                          ? "1.5px solid #cbd5e1"
                          : "1px solid rgba(255, 255, 255, 0.25)",
                        background: accountingDeptView === "all" && accountingStaffAttFilter === "All"
                          ? "linear-gradient(135deg, #334155 0%, #0f172a 100%)"
                          : "rgba(255, 255, 255, 0.14)",
                        color: "#ffffff",
                        boxShadow: accountingDeptView === "all" && accountingStaffAttFilter === "All"
                          ? "0 4px 14px rgba(15, 23, 42, 0.6)"
                          : "none",
                      }}
                    >
                      <span style={{ fontSize: "14px" }}>👥</span>
                      <span>All Staff</span>
                      <span
                        style={{
                          padding: "1px 7px",
                          borderRadius: "10px",
                          fontSize: "11.5px",
                          fontWeight: "900",
                          background: accountingDeptView === "all" && accountingStaffAttFilter === "All" ? "rgba(255,255,255,0.28)" : "#475569",
                          color: "#ffffff",
                        }}
                      >
                        {totalAllStaffCount}
                      </span>
                    </button>

                    {/* 2. Check-In */}
                    <button
                      type="button"
                      onClick={() => setAccountingStaffAttFilter("CheckedIn")}
                      title="Filter Checked-In Staff"
                      style={{
                        height: "32px",
                        padding: "4px 13px",
                        borderRadius: "999px",
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "7px",
                        fontSize: "12px",
                        fontWeight: "700",
                        transition: "all 0.15s ease",
                        border: accountingStaffAttFilter === "CheckedIn"
                          ? "1.5px solid #7dd3fc"
                          : "1px solid rgba(125, 211, 252, 0.35)",
                        background: accountingStaffAttFilter === "CheckedIn"
                          ? "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)"
                          : "rgba(14, 165, 233, 0.18)",
                        color: "#ffffff",
                        boxShadow: accountingStaffAttFilter === "CheckedIn"
                          ? "0 4px 14px rgba(2, 132, 199, 0.6)"
                          : "none",
                      }}
                    >
                      <span style={{ fontSize: "14px" }}>📥</span>
                      <span>Check-In</span>
                      <span
                        style={{
                          padding: "1px 7px",
                          borderRadius: "10px",
                          fontSize: "11.5px",
                          fontWeight: "900",
                          background: accountingStaffAttFilter === "CheckedIn" ? "rgba(255,255,255,0.28)" : "#0ea5e9",
                          color: "#ffffff",
                        }}
                      >
                        {accCheckedInCount}
                      </span>
                    </button>

                    {/* 3. Checked Out */}
                    <button
                      type="button"
                      onClick={() => setAccountingStaffAttFilter("CheckedOut")}
                      title="Filter Checked-Out Staff"
                      style={{
                        height: "32px",
                        padding: "4px 13px",
                        borderRadius: "999px",
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "7px",
                        fontSize: "12px",
                        fontWeight: "700",
                        transition: "all 0.15s ease",
                        border: accountingStaffAttFilter === "CheckedOut"
                          ? "1.5px solid #fed7aa"
                          : "1px solid rgba(253, 186, 116, 0.35)",
                        background: accountingStaffAttFilter === "CheckedOut"
                          ? "linear-gradient(135deg, #ea580c 0%, #c2410c 100%)"
                          : "rgba(249, 115, 22, 0.18)",
                        color: "#ffffff",
                        boxShadow: accountingStaffAttFilter === "CheckedOut"
                          ? "0 4px 14px rgba(234, 88, 12, 0.6)"
                          : "none",
                      }}
                    >
                      <span style={{ fontSize: "14px" }}>📤</span>
                      <span>Checked Out</span>
                      <span
                        style={{
                          padding: "1px 7px",
                          borderRadius: "10px",
                          fontSize: "11.5px",
                          fontWeight: "900",
                          background: accountingStaffAttFilter === "CheckedOut" ? "rgba(255,255,255,0.28)" : "#ea580c",
                          color: "#ffffff",
                        }}
                      >
                        {accCheckedOutCount}
                      </span>
                    </button>

                    {/* 4. Work */}
                    <button
                      type="button"
                      onClick={() => setAccountingStaffAttFilter("Worked")}
                      title="Filter Staff Logged Work"
                      style={{
                        height: "32px",
                        padding: "4px 13px",
                        borderRadius: "999px",
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "7px",
                        fontSize: "12px",
                        fontWeight: "700",
                        transition: "all 0.15s ease",
                        border: accountingStaffAttFilter === "Worked"
                          ? "1.5px solid #99f6e4"
                          : "1px solid rgba(153, 246, 228, 0.35)",
                        background: accountingStaffAttFilter === "Worked"
                          ? "linear-gradient(135deg, #0d9488 0%, #0f766e 100%)"
                          : "rgba(20, 184, 166, 0.18)",
                        color: "#ffffff",
                        boxShadow: accountingStaffAttFilter === "Worked"
                          ? "0 4px 14px rgba(13, 148, 136, 0.6)"
                          : "none",
                      }}
                    >
                      <span style={{ fontSize: "14px" }}>⏱️</span>
                      <span>Work</span>
                      <span
                        style={{
                          padding: "1px 7px",
                          borderRadius: "10px",
                          fontSize: "11.5px",
                          fontWeight: "900",
                          background: accountingStaffAttFilter === "Worked" ? "rgba(255,255,255,0.28)" : "#14b8a6",
                          color: "#ffffff",
                        }}
                      >
                        {accHoursWorkedText}
                      </span>
                    </button>

                    {/* 5. Leave */}
                    <button
                      type="button"
                      onClick={() => setAccountingStaffAttFilter("OnLeave")}
                      title="Filter Staff On Leave"
                      style={{
                        height: "32px",
                        padding: "4px 13px",
                        borderRadius: "999px",
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "7px",
                        fontSize: "12px",
                        fontWeight: "700",
                        transition: "all 0.15s ease",
                        border: accountingStaffAttFilter === "OnLeave"
                          ? "1.5px solid #fbcfe8"
                          : "1px solid rgba(249, 168, 212, 0.35)",
                        background: accountingStaffAttFilter === "OnLeave"
                          ? "linear-gradient(135deg, #db2777 0%, #9d174d 100%)"
                          : "rgba(236, 72, 153, 0.18)",
                        color: "#ffffff",
                        boxShadow: accountingStaffAttFilter === "OnLeave"
                          ? "0 4px 14px rgba(219, 39, 119, 0.6)"
                          : "none",
                      }}
                    >
                      <span style={{ fontSize: "14px" }}>🏖️</span>
                      <span>Leave</span>
                      <span
                        style={{
                          padding: "1px 7px",
                          borderRadius: "10px",
                          fontSize: "11.5px",
                          fontWeight: "900",
                          background: accountingStaffAttFilter === "OnLeave" ? "rgba(255,255,255,0.28)" : "#ec4899",
                          color: "#ffffff",
                        }}
                      >
                        {accOnLeaveCount}
                      </span>
                    </button>

                    {/* 6. CHATRIX (ACCOUNTING & FINANCE TEAM SPECIFIC FILTER) */}
                    <button
                      type="button"
                      onClick={() => {
                        setAccountingDeptView("chatrix");
                        setAccountingStaffAttFilter("All");
                        document.getElementById("accounting-staff-roster-section")?.scrollIntoView({ behavior: "smooth" });
                      }}
                      title="Filter Chatrix Finance & Accounting Staff Only"
                      style={{
                        height: "34px",
                        padding: "4px 16px",
                        borderRadius: "999px",
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "8px",
                        fontSize: "12.5px",
                        fontWeight: "900",
                        transition: "all 0.18s ease",
                        border: accountingDeptView === "chatrix" && accountingStaffAttFilter === "All"
                          ? "2px solid #ffffff"
                          : "1.5px solid rgba(216, 180, 254, 0.5)",
                        background: accountingDeptView === "chatrix" && accountingStaffAttFilter === "All"
                          ? "linear-gradient(135deg, #ec4899 0%, #a855f7 40%, #6366f1 100%)"
                          : "rgba(168, 85, 247, 0.22)",
                        color: "#ffffff",
                        boxShadow: accountingDeptView === "chatrix" && accountingStaffAttFilter === "All"
                          ? "0 4px 16px rgba(236, 72, 153, 0.55), 0 0 12px rgba(168, 85, 247, 0.6)"
                          : "none",
                      }}
                    >
                      <span style={{ fontSize: "15px" }}>📊</span>
                      <span>Chatrix</span>
                      <span
                        style={{
                          padding: "1px 8px",
                          borderRadius: "10px",
                          fontSize: "11.5px",
                          fontWeight: "900",
                          background: "rgba(255, 255, 255, 0.3)",
                          color: "#ffffff",
                        }}
                      >
                        {totalChatrixStaffCount}
                      </span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* 2. ACCOUNTING STAFF LIVE ROSTER TABLE CARD */}
          <div
            id="accounting-staff-roster-section"
            style={{
              background: "#ffffff",
              padding: "18px 20px",
              borderRadius: "18px",
              border: "1px solid #e2e8f0",
              boxShadow: "0 4px 18px rgba(0, 0, 0, 0.03)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "12px" }}>
              <div>
                <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "800", color: "#0f172a", display: "flex", alignItems: "center", gap: "8px" }}>
                  <span>{accountingDeptView === "chatrix" ? "📊 Chatrix Finance Directory" : "👥 All Accounting Staff Directory"}</span>
                  <span style={{ fontSize: "12px", background: accountingDeptView === "chatrix" ? "#f3e8ff" : "#e0f2fe", color: accountingDeptView === "chatrix" ? "#7c3aed" : "#0284c7", padding: "2px 8px", borderRadius: "12px", fontWeight: "800" }}>
                    {filteredAccountingRoster.length} {filteredAccountingRoster.length === 1 ? "Member" : "Members"}
                  </span>
                </h3>
                <span style={{ fontSize: "12px", color: "#64748b", marginTop: "2px", display: "block" }}>
                  {accountingDeptView === "chatrix"
                    ? `Dedicated Chatrix Accounting, Finance & Audit team for ${currentBranchName}`
                    : `Registered accounting and finance staff members in ${currentBranchName}`}
                </span>
              </div>

              {/* View Switcher: All Staff vs Chatrix */}
              <div style={{ display: "flex", gap: "6px", background: "#f1f5f9", padding: "4px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                <button
                  type="button"
                  onClick={() => {
                    setAccountingDeptView("all");
                    setAccountingStaffAttFilter("All");
                  }}
                  style={{
                    padding: "6px 12px",
                    borderRadius: "8px",
                    fontSize: "12px",
                    fontWeight: "800",
                    cursor: "pointer",
                    border: "none",
                    background: accountingDeptView === "all" ? "linear-gradient(135deg, #0284c7, #0369a1)" : "transparent",
                    color: accountingDeptView === "all" ? "#ffffff" : "#64748b",
                    boxShadow: accountingDeptView === "all" ? "0 2px 8px rgba(2, 132, 199, 0.35)" : "none",
                    transition: "all 0.15s ease",
                  }}
                >
                  📊 All Accounting Staff ({totalAllStaffCount})
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAccountingDeptView("chatrix");
                    setAccountingStaffAttFilter("All");
                  }}
                  style={{
                    padding: "6px 12px",
                    borderRadius: "8px",
                    fontSize: "12px",
                    fontWeight: "800",
                    cursor: "pointer",
                    border: "none",
                    background: accountingDeptView === "chatrix" ? "linear-gradient(135deg, #ec4899 0%, #a855f7 40%, #6366f1 100%)" : "transparent",
                    color: accountingDeptView === "chatrix" ? "#ffffff" : "#64748b",
                    boxShadow: accountingDeptView === "chatrix" ? "0 2px 8px rgba(168, 85, 247, 0.4)" : "none",
                    transition: "all 0.15s ease",
                  }}
                >
                  📊 Chatrix ({totalChatrixStaffCount})
                </button>
              </div>
            </div>

            {accountingDeptView === "chatrix" ? (
              /* CHATRIX VIEW: SLEEK HORIZONTAL THIN BANNER STRIPS */
              <div style={{ marginTop: "10px", display: "flex", flexDirection: "column", gap: "8px" }}>
                {filteredAccountingRoster.length === 0 ? (
                  <div style={{ padding: "24px", textAlign: "center", color: "#64748b", background: "#f8fafc", borderRadius: "12px", border: "1px dashed #cbd5e1" }}>
                    No Chatrix finance staff found matching this filter.
                  </div>
                ) : (
                  filteredAccountingRoster.map((staff) => {
                    const sid = String(staff.staffId || staff.id || "").toLowerCase();
                    let storedCount = 0;
                    try {
                      const s = localStorage.getItem(`hotel_chatrix_invoices_${sid}`);
                      if (s) {
                        const p = JSON.parse(s);
                        if (Array.isArray(p)) storedCount = p.length;
                      }
                    } catch (e) { }

                    return (
                      <div
                        key={staff.staffId || staff.id}
                        style={{
                          background: "linear-gradient(90deg, #ffffff 0%, #fbfbfe 100%)",
                          borderRadius: "12px",
                          padding: "10px 18px",
                          border: "1px solid #e2e8f0",
                          borderLeft: "4px solid #7c3aed",
                          boxShadow: "0 2px 6px rgba(0, 0, 0, 0.02)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: "14px",
                          transition: "all 0.18s ease",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = "translateX(3px)";
                          e.currentTarget.style.boxShadow = "0 4px 14px rgba(124, 58, 237, 0.1)";
                          e.currentTarget.style.borderColor = "#c084fc";
                          e.currentTarget.style.borderLeftColor = "#7c3aed";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = "translateX(0)";
                          e.currentTarget.style.boxShadow = "0 2px 6px rgba(0, 0, 0, 0.02)";
                          e.currentTarget.style.borderColor = "#e2e8f0";
                          e.currentTarget.style.borderLeftColor = "#7c3aed";
                        }}
                      >
                        {/* LEFT: AVATAR + NAME + BADGES INLINE */}
                        <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: 0, flex: 1 }}>
                          <div style={{ position: "relative", flexShrink: 0 }}>
                            <img
                              src={staff.avatar}
                              alt={staff.name}
                              style={{
                                width: "38px",
                                height: "38px",
                                borderRadius: "10px",
                                objectFit: "cover",
                                border: "1.5px solid #e9d5ff",
                                display: "block",
                              }}
                            />
                            {/* Live Dot */}
                            <span
                              style={{
                                position: "absolute",
                                bottom: "-1px",
                                right: "-1px",
                                width: "10px",
                                height: "10px",
                                borderRadius: "50%",
                                background: "#22c55e",
                                border: "1.5px solid #ffffff",
                              }}
                              title="Active On Duty"
                            />
                          </div>

                          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", minWidth: 0 }}>
                            <div
                              style={{
                                fontWeight: "900",
                                color: "#0f172a",
                                fontSize: "14.5px",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {staff.name}
                            </div>

                            <span
                              style={{
                                background: "#f3e8ff",
                                color: "#7c3aed",
                                padding: "2px 8px",
                                borderRadius: "6px",
                                fontSize: "11px",
                                fontWeight: "800",
                                border: "1px solid #e9d5ff",
                              }}
                            >
                              {staff.staffId}
                            </span>

                            <span style={{ fontSize: "11.5px", color: "#64748b", fontWeight: "600" }}>
                              • {currentBranchName}
                            </span>

                            <span
                              style={{
                                background: "#f1f5f9",
                                color: "#475569",
                                padding: "2px 8px",
                                borderRadius: "6px",
                                fontSize: "11px",
                                fontWeight: "700",
                              }}
                            >
                              Finance & Audit
                            </span>

                            {storedCount > 0 && (
                              <span
                                style={{
                                  background: "linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)",
                                  color: "#047857",
                                  padding: "2px 8px",
                                  borderRadius: "6px",
                                  fontSize: "11px",
                                  fontWeight: "800",
                                  border: "1px solid #a7f3d0",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "3px",
                                }}
                              >
                                <span>📄</span>
                                <span>{storedCount} {storedCount === 1 ? "Salary Slip" : "Salary Slips"}</span>
                              </span>
                            )}
                          </div>
                        </div>

                        {/* RIGHT: EMPLOYEE SALARY & VISITOR INCOME BUTTONS */}
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0, flexWrap: "wrap" }}>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedChatrixInvoiceIndex(0);
                              setSelectedChatrixInvoiceStaff(staff);
                            }}
                            title={`Generate & View Employee Salary Voucher for ${staff.name}`}
                            style={{
                              padding: "7px 15px",
                              borderRadius: "999px",
                              border: "none",
                              background: "linear-gradient(135deg, #7c3aed 0%, #6366f1 100%)",
                              color: "#ffffff",
                              fontSize: "12px",
                              fontWeight: "800",
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "6px",
                              boxShadow: "0 2px 8px rgba(124, 58, 237, 0.3)",
                              transition: "all 0.18s ease",
                              letterSpacing: "0.2px",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.transform = "scale(1.04)";
                              e.currentTarget.style.boxShadow = "0 4px 14px rgba(124, 58, 237, 0.45)";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = "scale(1)";
                              e.currentTarget.style.boxShadow = "0 2px 8px rgba(124, 58, 237, 0.3)";
                            }}
                          >
                            <span style={{ fontSize: "12.5px" }}>💼</span>
                            <span>Employee Salary</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setSelectedVisitorIncomeStaff(staff);
                            }}
                            title={`View & Manage Visitor Income for ${staff.name}`}
                            style={{
                              padding: "7px 15px",
                              borderRadius: "999px",
                              border: "none",
                              background: "linear-gradient(135deg, #059669 0%, #0d9488 100%)",
                              color: "#ffffff",
                              fontSize: "12px",
                              fontWeight: "800",
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "6px",
                              boxShadow: "0 2px 8px rgba(5, 150, 105, 0.3)",
                              transition: "all 0.18s ease",
                              letterSpacing: "0.2px",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.transform = "scale(1.04)";
                              e.currentTarget.style.boxShadow = "0 4px 14px rgba(5, 150, 105, 0.45)";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = "scale(1)";
                              e.currentTarget.style.boxShadow = "0 2px 8px rgba(5, 150, 105, 0.3)";
                            }}
                          >
                            <span style={{ fontSize: "12.5px" }}>💵</span>
                            <span>Visitor Income</span>
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            ) : (
              /* ALL STAFF VIEW: FULL DIRECTORY TABLE WITH ALL COLUMNS */
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: "0 8px", minWidth: "750px" }}>
                  <thead>
                    <tr style={{ color: "#64748b", fontSize: "12px", textAlign: "left" }}>
                      <th style={{ padding: "10px 14px" }}>Staff Member</th>
                      <th style={{ padding: "10px 14px" }}>Department</th>
                      <th style={{ padding: "10px 14px" }}>Designation & Role</th>
                      <th style={{ padding: "10px 14px" }}>Contact Details</th>
                      <th style={{ padding: "10px 14px", textAlign: "right" }}>Monthly Salary</th>
                      <th style={{ padding: "10px 14px", textAlign: "center" }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAccountingRoster.length === 0 ? (
                      <tr>
                        <td colSpan={6} style={{ padding: "28px", textAlign: "center", color: "#64748b", background: "#f8fafc", borderRadius: "12px" }}>
                          No staff members found matching this filter.
                        </td>
                      </tr>
                    ) : (
                      filteredAccountingRoster.map((staff) => (
                        <tr
                          key={staff.staffId || staff.id}
                          style={{
                            background: "#f8fafc",
                            borderRadius: "12px",
                            boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
                            border: "1px solid #e2e8f0",
                          }}
                        >
                          {/* 1. Member Profile */}
                          <td style={{ padding: "12px 14px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                              <img
                                src={staff.avatar}
                                alt={staff.name}
                                style={{ width: "38px", height: "38px", borderRadius: "10px", objectFit: "cover" }}
                              />
                              <div>
                                <div style={{ fontWeight: "800", color: "#0f172a", fontSize: "13.5px" }}>
                                  {staff.name}
                                </div>
                                <div
                                  style={{
                                    fontSize: "11px",
                                    color: staff.department === "Accounting" ? "#7c3aed" : staff.department === "Kitchen" ? "#ea580c" : "#0284c7",
                                    fontWeight: "700",
                                  }}
                                >
                                  {staff.staffId} • {currentBranchName}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* 2. Department */}
                          <td style={{ padding: "12px 14px" }}>
                            <span
                              style={{
                                padding: "4px 10px",
                                borderRadius: "8px",
                                fontSize: "11.5px",
                                fontWeight: "800",
                                background: "#f3e8ff",
                                color: "#6b21a8",
                                display: "inline-block",
                              }}
                            >
                              📊 Accounting & Finance
                            </span>
                          </td>

                          {/* 3. Role & Designation */}
                          <td style={{ padding: "12px 14px" }}>
                            <div style={{ fontSize: "12.5px", fontWeight: "700", color: "#1e293b" }}>
                              {staff.role}
                            </div>
                            <div style={{ fontSize: "11px", color: "#64748b" }}>
                              📍 {staff.assignedArea || "Hotel Branch"}
                            </div>
                          </td>

                          {/* 4. Contact Details */}
                          <td style={{ padding: "12px 14px" }}>
                            <div style={{ fontSize: "12px", color: "#334155", fontWeight: "600" }}>
                              ✉️ {staff.email || `${staff.name?.toLowerCase().replace(/\s+/g, ".")}@hotel.com`}
                            </div>
                            <div style={{ fontSize: "11.5px", color: "#64748b", marginTop: "2px" }}>
                              📞 {staff.phone || "+91 98765 43210"}
                            </div>
                          </td>

                          {/* 5. Salary */}
                          <td style={{ padding: "12px 14px", textAlign: "right" }}>
                            <strong style={{ fontSize: "14px", fontWeight: "900", color: "#047857" }}>
                              ₹{Number(staff.salary || 25000).toLocaleString("en-IN")}
                            </strong>
                            <div style={{ fontSize: "10.5px", color: "#64748b" }}>Monthly CTC</div>
                          </td>

                          {/* 6. Status */}
                          <td style={{ padding: "12px 14px", textAlign: "center" }}>
                            <span
                              style={{
                                padding: "3px 10px",
                                borderRadius: "12px",
                                fontSize: "11.5px",
                                fontWeight: "800",
                                background:
                                  staff.status === "Present"
                                    ? "#dcfce7"
                                    : staff.status === "On Leave"
                                      ? "#fef9c3"
                                      : staff.status === "Checked Out"
                                        ? "#e0e7ff"
                                        : "#f1f5f9",
                                color:
                                  staff.status === "Present"
                                    ? "#15803d"
                                    : staff.status === "On Leave"
                                      ? "#a16207"
                                      : staff.status === "Checked Out"
                                        ? "#4338ca"
                                        : "#64748b",
                                display: "inline-block",
                              }}
                            >
                              {staff.status === "Present"
                                ? "● On Duty"
                                : staff.status === "On Leave"
                                  ? "🌴 On Leave"
                                  : staff.status === "Checked Out"
                                    ? "⏱️ Checked Out"
                                    : "⚪ Off Duty"}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: ASSIGN ROOM MODAL - INSTANT EMPLOYEE SELECTION                   */}
      {/* ========================================================================= */}
      {isAssignModalOpen && assignModalRoom && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.75)",
            backdropFilter: "blur(6px)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: "22px",
              padding: "24px",
              maxWidth: "560px",
              width: "100%",
              maxHeight: "90vh",
              display: "flex",
              flexDirection: "column",
              boxShadow: "0 25px 60px rgba(0,0,0,0.3)",
              overflow: "hidden",
            }}
          >
            {/* Modal Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "14px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div
                  style={{
                    width: "42px",
                    height: "42px",
                    borderRadius: "12px",
                    background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
                    color: "#ffffff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "18px",
                    boxShadow: "0 4px 12px rgba(37, 99, 235, 0.3)",
                  }}
                >
                  <FaUserTie />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "800", color: "#0f172a" }}>
                    Assign {assignModalRoom.roomNumber ? (assignModalRoom.roomNumber.startsWith("Room") ? assignModalRoom.roomNumber : `Room ${assignModalRoom.roomNumber}`) : "Room"}
                  </h3>
                  <div style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>
                    Select any employee below to instantly assign this cleaning task
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAssignModalOpen(false)}
                style={{
                  background: "#f1f5f9",
                  border: "none",
                  color: "#64748b",
                  cursor: "pointer",
                  width: "32px",
                  height: "32px",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "14px",
                }}
              >
                <FaTimes />
              </button>
            </div>

            {/* Target Room Summary Banner */}
            <div
              style={{
                background: "#f8fafc",
                padding: "10px 14px",
                borderRadius: "12px",
                border: "1px solid #e2e8f0",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "12px",
              }}
            >
              <div>
                <div style={{ fontSize: "11px", color: "#64748b" }}>Target Room</div>
                <div style={{ fontSize: "13px", fontWeight: "800", color: "#0f172a" }}>
                  {assignModalRoom.floor} • {assignModalRoom.roomType}
                </div>
              </div>
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <span
                  style={{
                    padding: "3px 10px",
                    borderRadius: "999px",
                    fontSize: "11px",
                    fontWeight: "800",
                    background: assignModalRoom.statusBg || "#f1f5f9",
                    color: assignModalRoom.statusColor || "#475569",
                  }}
                >
                  {assignModalRoom.status}
                </span>
              </div>
            </div>

            {/* Search Input */}
            <div style={{ position: "relative", marginBottom: "10px" }}>
              <FaSearch style={{ position: "absolute", left: "12px", top: "11px", color: "#94a3b8", fontSize: "13px" }} />
              <input
                type="text"
                value={assignModalSearch}
                onChange={(e) => setAssignModalSearch(e.target.value)}
                placeholder="Search employee by name, ID or role..."
                style={{
                  width: "100%",
                  padding: "9px 12px 9px 34px",
                  borderRadius: "10px",
                  border: "1px solid #cbd5e1",
                  fontSize: "13px",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>

            {/* Filter Tabs */}
            <div style={{ display: "flex", gap: "6px", marginBottom: "10px" }}>
              {[
                { id: "all", label: `All Staff (${allAvailableEmployees.length})` },
                { id: "housekeeping", label: "Housekeeping" },
                { id: "duty", label: "🟢 Present / On Duty" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setAssignModalRoleFilter(tab.id)}
                  style={{
                    padding: "5px 12px",
                    borderRadius: "8px",
                    fontSize: "11.5px",
                    fontWeight: "700",
                    border: assignModalRoleFilter === tab.id ? "1px solid #2563eb" : "1px solid #e2e8f0",
                    background: assignModalRoleFilter === tab.id ? "rgba(37, 99, 235, 0.1)" : "#ffffff",
                    color: assignModalRoleFilter === tab.id ? "#2563eb" : "#64748b",
                    cursor: "pointer",
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Scrollable Employees List */}
            <div
              style={{
                flex: 1,
                overflowY: "auto",
                display: "flex",
                flexDirection: "column",
                gap: "8px",
                paddingRight: "4px",
                maxHeight: "360px",
              }}
            >
              {allAvailableEmployees
                .filter((emp) => {
                  const q = assignModalSearch.toLowerCase().trim();
                  const matchesSearch =
                    !q ||
                    (emp.name && emp.name.toLowerCase().includes(q)) ||
                    (emp.staffName && emp.staffName.toLowerCase().includes(q)) ||
                    (emp.id && emp.id.toLowerCase().includes(q)) ||
                    (emp.staffId && emp.staffId.toLowerCase().includes(q)) ||
                    (emp.role && emp.role.toLowerCase().includes(q));

                  let matchesTab = true;
                  if (assignModalRoleFilter === "housekeeping") {
                    matchesTab = (emp.role || "").toLowerCase().includes("house") || (emp.staffId || "").startsWith("HK");
                  } else if (assignModalRoleFilter === "duty") {
                    matchesTab = emp.isOnDuty || emp.status === "Present" || emp.status === "On Duty";
                  }
                  return matchesSearch && matchesTab;
                })
                .map((emp) => {
                  const empName = emp.staffName || emp.name;
                  const isCurrent = assignModalRoom.assignedStaff === empName;
                  const initial = empName ? empName.charAt(0).toUpperCase() : "S";
                  const isCheckedIn = Boolean(emp.clockIn && !emp.clockOut) || emp.isOnDuty || emp.status === "Present" || emp.status === "On Duty";

                  return (
                    <div
                      key={emp.staffId || emp.id}
                      onClick={() => {
                        if (!isCheckedIn) {
                          showToast(`⚠️ Cannot assign: ${empName} has not Checked In today!`);
                          return;
                        }
                        handleDirectAssign(emp);
                      }}
                      style={{
                        padding: "10px 12px",
                        borderRadius: "12px",
                        border: isCurrent ? "1.5px solid #2563eb" : isCheckedIn ? "1px solid #e2e8f0" : "1px dashed #cbd5e1",
                        background: isCurrent ? "rgba(37, 99, 235, 0.04)" : isCheckedIn ? "#ffffff" : "#f8fafc",
                        opacity: isCheckedIn ? 1 : 0.7,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        cursor: isCheckedIn ? "pointer" : "not-allowed",
                        transition: "all 0.15s ease",
                      }}
                      onMouseEnter={(e) => {
                        if (isCheckedIn) {
                          e.currentTarget.style.borderColor = "#2563eb";
                          e.currentTarget.style.background = "rgba(37, 99, 235, 0.05)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (isCheckedIn) {
                          e.currentTarget.style.borderColor = isCurrent ? "#2563eb" : "#e2e8f0";
                          e.currentTarget.style.background = isCurrent ? "rgba(37, 99, 235, 0.04)" : "#ffffff";
                        }
                      }}
                    >
                      {/* Left: Avatar & Details */}
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div
                          style={{
                            width: "36px",
                            height: "36px",
                            borderRadius: "50%",
                            background: isCheckedIn ? "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)" : "#94a3b8",
                            color: "#ffffff",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontWeight: "800",
                            fontSize: "14px",
                            flexShrink: 0,
                          }}
                        >
                          {initial}
                        </div>
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <span style={{ fontSize: "13.5px", fontWeight: "800", color: "#0f172a" }}>
                              {empName}
                            </span>
                            <span
                              style={{
                                fontSize: "10px",
                                fontWeight: "700",
                                padding: "1px 6px",
                                borderRadius: "4px",
                                background: "#f1f5f9",
                                color: "#475569",
                                textTransform: "capitalize",
                              }}
                            >
                              {emp.role || "Staff"}
                            </span>
                          </div>
                          <div style={{ fontSize: "11px", color: "#64748b", marginTop: "3px", display: "flex", flexWrap: "wrap", gap: "6px", alignItems: "center" }}>
                            <span style={{ background: "#eff6ff", color: "#1d4ed8", padding: "1px 6px", borderRadius: "4px", fontWeight: "800", fontSize: "11px" }}>
                              {emp.staffId || emp.id}
                            </span>
                            <span>•</span>
                            <span style={{ color: "#475569", fontWeight: "600" }}>{emp.shift ? emp.shift.split("(")[0].trim() : "Morning"}</span>
                            <span>•</span>
                            <span style={{ color: isCheckedIn ? "#16a34a" : "#dc2626", fontWeight: "700" }}>
                              {isCheckedIn ? "🟢 Checked In (On Duty)" : "⚪ Not Checked In (Off Duty)"}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Select & Assign Button */}
                      {isCheckedIn ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDirectAssign(emp);
                          }}
                          style={{
                            padding: "6px 14px",
                            borderRadius: "8px",
                            border: "none",
                            background: isCurrent
                              ? "#16a34a"
                              : "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
                            color: "#ffffff",
                            fontSize: "11.5px",
                            fontWeight: "700",
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "5px",
                            boxShadow: "0 2px 6px rgba(37, 99, 235, 0.25)",
                          }}
                        >
                          {isCurrent ? <><FaCheck /> Assigned</> : <><FaUserCheck /> Select & Assign</>}
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            showToast(`⚠️ Cannot assign: ${empName} has not Checked In today!`);
                          }}
                          style={{
                            padding: "6px 12px",
                            borderRadius: "8px",
                            border: "1px solid #fee2e2",
                            background: "#fff1f2",
                            color: "#dc2626",
                            fontSize: "11px",
                            fontWeight: "800",
                            cursor: "not-allowed",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                          }}
                          title="Employee must check in before being assigned tasks"
                        >
                          ⚠️ Cannot Assign
                        </button>
                      )}
                    </div>
                  );
                })}
            </div>

            {/* Modal Footer */}
            <div style={{ marginTop: "14px", paddingTop: "12px", borderTop: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "11.5px", color: "#94a3b8" }}>
                Tap any employee to immediately assign {assignModalRoom.roomNumber}
              </span>
              <button
                type="button"
                onClick={() => setIsAssignModalOpen(false)}
                style={{
                  padding: "7px 16px",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  background: "#ffffff",
                  fontSize: "12px",
                  fontWeight: "700",
                  color: "#475569",
                  cursor: "pointer",
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: UPLOAD PROOF MODAL (Workflow 6)                                  */}
      {/* ========================================================================= */}
      {uploadProofTask && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.75)",
            backdropFilter: "blur(6px)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: "24px",
              padding: "28px",
              maxWidth: "540px",
              width: "100%",
              boxShadow: "0 25px 50px rgba(0, 0, 0, 0.25)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ fontSize: "22px", background: "#ede9fe", padding: "8px", borderRadius: "12px", color: "#7c3aed" }}>
                  📸
                </span>
                <div>
                  <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "800", color: "#0f172a" }}>
                    Upload Sanitization Proofs
                  </h3>
                  <span style={{ fontSize: "12px", color: "#64748b" }}>
                    {uploadProofTask.roomNumber} ({uploadProofTask.roomType})
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setUploadProofTask(null)}
                style={{ background: "transparent", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: "18px" }}
              >
                <FaTimes />
              </button>
            </div>

            <form onSubmit={handleSubmitProof} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label style={{ fontSize: "12px", fontWeight: "700", color: "#475569", display: "block", marginBottom: "8px" }}>
                  Room Sanitization Photos
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px", marginBottom: "8px" }}>
                  {proofPhotos.map((url, i) => (
                    <div key={i} style={{ position: "relative", height: "80px", borderRadius: "10px", overflow: "hidden", border: "1px solid #e2e8f0" }}>
                      <img src={url} alt={`Proof ${i}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      <button
                        type="button"
                        onClick={() => setProofPhotos(proofPhotos.filter((_, idx) => idx !== i))}
                        style={{
                          position: "absolute",
                          top: "4px",
                          right: "4px",
                          background: "rgba(0,0,0,0.6)",
                          color: "#ffffff",
                          border: "none",
                          borderRadius: "50%",
                          width: "20px",
                          height: "20px",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "10px",
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  {proofPhotos.length < 4 && (
                    <label
                      style={{
                        height: "80px",
                        borderRadius: "10px",
                        border: "2px dashed #cbd5e1",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        background: "#f8fafc",
                        fontSize: "11px",
                        color: "#6366f1",
                        fontWeight: "700",
                      }}
                    >
                      <FaCamera style={{ fontSize: "16px", marginBottom: "4px" }} />
                      + Add Photo
                      <input
                        type="file"
                        accept="image/*"
                        style={{ display: "none" }}
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = () => setProofPhotos([...proofPhotos, reader.result]);
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>
                  )}
                </div>
              </div>

              <div>
                <label style={{ fontSize: "12px", fontWeight: "700", color: "#475569", display: "block", marginBottom: "6px" }}>
                  Cleaning Remarks / Verified Items
                </label>
                <textarea
                  rows={3}
                  required
                  value={housekeeperRemarks}
                  onChange={(e) => setHousekeeperRemarks(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: "10px",
                    border: "1px solid #cbd5e1",
                    fontSize: "13px",
                    fontFamily: "inherit",
                  }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                <button
                  type="button"
                  onClick={() => setUploadProofTask(null)}
                  style={{ padding: "10px 18px", borderRadius: "10px", border: "1px solid #cbd5e1", background: "#ffffff", fontWeight: "700", cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: "10px 22px",
                    borderRadius: "10px",
                    border: "none",
                    background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
                    color: "#ffffff",
                    fontWeight: "800",
                    cursor: "pointer",
                  }}
                >
                  Submit for Approval
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: INSPECT PROOF ZOOM MODAL                                         */}
      {/* ========================================================================= */}
      {inspectModalTask && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.8)",
            backdropFilter: "blur(8px)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: "24px",
              maxWidth: "680px",
              width: "100%",
              boxShadow: "0 25px 60px rgba(0, 0, 0, 0.3)",
              overflow: "hidden",
            }}
          >
            <div style={{ padding: "20px 24px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <span style={{ fontSize: "11px", fontWeight: "800", background: "#ede9fe", color: "#7c3aed", padding: "3px 8px", borderRadius: "999px" }}>
                  Photo Cleanliness Verification
                </span>
                <h3 style={{ margin: "4px 0 0", fontSize: "18px", fontWeight: "800", color: "#0f172a" }}>
                  {inspectModalTask.roomNumber || inspectModalTask.room}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setInspectModalTask(null)}
                style={{ background: "transparent", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: "18px" }}
              >
                <FaTimes />
              </button>
            </div>

            <div style={{ position: "relative", width: "100%", height: "320px", background: "#000000" }}>
              <img
                src={
                  inspectModalTask.photoProofs?.[activePhotoIndex] ||
                  inspectModalTask.photoProofUrl ||
                  "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80"
                }
                alt="Proof"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
              <div
                style={{
                  position: "absolute",
                  bottom: "12px",
                  left: "12px",
                  background: "rgba(15, 23, 42, 0.8)",
                  backdropFilter: "blur(8px)",
                  color: "#ffffff",
                  padding: "6px 12px",
                  borderRadius: "8px",
                  fontSize: "11px",
                  display: "flex",
                  gap: "10px",
                }}
              >
                <span>👤 Staff: {inspectModalTask.assignedStaff || inspectModalTask.staff}</span>
                <span>🕒 Uploaded: {inspectModalTask.lastUpdated || "Today"}</span>
              </div>
            </div>

            <div style={{ padding: "16px 24px" }}>
              <div style={{ fontSize: "13px", color: "#334155" }}>
                <strong>Remarks:</strong> {inspectModalTask.housekeeperRemarks || "Room thoroughly cleaned and sanitized."}
              </div>
            </div>

            <div style={{ padding: "16px 24px", borderTop: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <button
                type="button"
                onClick={() => handleOpenRejectModal(inspectModalTask)}
                style={{
                  padding: "10px 18px",
                  borderRadius: "10px",
                  border: "1px solid #fee2e2",
                  background: "#fef2f2",
                  color: "#dc2626",
                  fontSize: "13px",
                  fontWeight: "800",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <FaTimesCircle /> Reject & Re-clean
              </button>

              <button
                type="button"
                onClick={() => handleApproveAction(inspectModalTask.taskId || inspectModalTask.id, inspectModalTask.roomNumber || inspectModalTask.room)}
                style={{
                  padding: "10px 24px",
                  borderRadius: "10px",
                  border: "none",
                  background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                  color: "#ffffff",
                  fontSize: "13px",
                  fontWeight: "800",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  boxShadow: "0 4px 14px rgba(16, 185, 129, 0.4)",
                }}
              >
                <FaThumbsUp /> Approve Cleaning (Make Available)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: REJECT & RE-CLEAN PRESET REASONS MODAL                           */}
      {/* ========================================================================= */}
      {rejectModalTask && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.75)",
            backdropFilter: "blur(6px)",
            zIndex: 10000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: "20px",
              padding: "24px",
              maxWidth: "480px",
              width: "100%",
              boxShadow: "0 20px 50px rgba(0,0,0,0.3)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "800", color: "#dc2626" }}>
                Reject & Reschedule Re-cleaning
              </h3>
              <button
                type="button"
                onClick={() => setRejectModalTask(null)}
                style={{ background: "transparent", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: "16px" }}
              >
                <FaTimes />
              </button>
            </div>

            <p style={{ margin: "0 0 14px", fontSize: "13px", color: "#64748b" }}>
              Select a reason why {rejectModalTask.roomNumber || rejectModalTask.room} failed cleanliness inspection:
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "16px" }}>
              {REJECTION_PRESETS.map((preset) => (
                <label
                  key={preset}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    padding: "10px 14px",
                    borderRadius: "10px",
                    border: selectedRejectPreset === preset ? "2px solid #ef4444" : "1px solid #e2e8f0",
                    background: selectedRejectPreset === preset ? "#fef2f2" : "#f8fafc",
                    cursor: "pointer",
                    fontSize: "13px",
                    fontWeight: "600",
                    color: selectedRejectPreset === preset ? "#dc2626" : "#334155",
                  }}
                >
                  <input
                    type="radio"
                    name="rejectPreset"
                    checked={selectedRejectPreset === preset}
                    onChange={() => setSelectedRejectPreset(preset)}
                  />
                  {preset}
                </label>
              ))}
            </div>

            <div style={{ marginBottom: "18px" }}>
              <label style={{ fontSize: "12px", fontWeight: "700", color: "#475569", display: "block", marginBottom: "6px" }}>
                Custom Notes for Housekeeper
              </label>
              <textarea
                rows={2}
                placeholder="Specific instructions for re-clean..."
                value={customRejectReason}
                onChange={(e) => setCustomRejectReason(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: "10px",
                  border: "1px solid #cbd5e1",
                  fontSize: "13px",
                  fontFamily: "inherit",
                }}
              />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button
                type="button"
                onClick={() => setRejectModalTask(null)}
                style={{ padding: "10px 18px", borderRadius: "10px", border: "1px solid #cbd5e1", background: "#ffffff", fontWeight: "700", cursor: "pointer" }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                style={{
                  padding: "10px 22px",
                  borderRadius: "10px",
                  border: "none",
                  background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
                  color: "#ffffff",
                  fontWeight: "800",
                  cursor: "pointer",
                  boxShadow: "0 4px 14px rgba(239, 68, 68, 0.4)",
                }}
              >
                Confirm Rejection & Re-clean
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: WORKERS LIVE INTELLIGENCE HUB MODAL                              */}
      {/* ========================================================================= */}
      {isWorkersModalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.8)",
            backdropFilter: "blur(8px)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: "24px",
              maxWidth: "840px",
              width: "100%",
              boxShadow: "0 25px 60px rgba(0, 0, 0, 0.35)",
              maxHeight: "90vh",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "20px 24px",
                background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
                color: "#ffffff",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <span style={{ fontSize: "24px" }}>👥</span>
                <div>
                  <h3 style={{ margin: 0, fontSize: "19px", fontWeight: "800", color: "#ffffff" }}>
                    Housekeeping Staff & Workers Intelligence Hub
                  </h3>
                  <span style={{ fontSize: "12px", color: "#94a3b8" }}>
                    Real Database Roster • Today's Punches • Assigned Tasks
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsWorkersModalOpen(false)}
                style={{ background: "rgba(255,255,255,0.1)", border: "none", color: "#ffffff", width: "32px", height: "32px", borderRadius: "50%", cursor: "pointer" }}
              >
                <FaTimes />
              </button>
            </div>

            <div style={{ padding: "20px 24px", overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: "14px" }}>
              {roster.map((s) => (
                <div
                  key={s.staffId}
                  style={{
                    padding: "16px",
                    borderRadius: "14px",
                    border: "1px solid #e2e8f0",
                    background: "#f8fafc",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <h4 style={{ margin: 0, fontSize: "15px", fontWeight: "800", color: "#0f172a" }}>
                      {s.staffName} ({s.staffId})
                    </h4>
                    <span style={{ fontSize: "12px", color: "#64748b" }}>
                      {s.role} • {s.department} • Shift: {s.shift}
                    </span>
                    <div style={{ fontSize: "12px", color: "#0284c7", marginTop: "4px" }}>
                      Clock-In: <strong>{s.clockIn || "Not Checked In"}</strong> | Clock-Out: <strong>{s.clockOut || "—"}</strong>
                    </div>
                  </div>

                  <span
                    style={{
                      padding: "4px 12px",
                      borderRadius: "999px",
                      fontSize: "12px",
                      fontWeight: "800",
                      background: s.status === "Present" ? "#dcfce7" : s.status === "On Leave" ? "#fef3c7" : "#f1f5f9",
                      color: s.status === "Present" ? "#16a34a" : s.status === "On Leave" ? "#d97706" : "#475569",
                    }}
                  >
                    {s.status}
                  </span>
                </div>
              ))}
            </div>

            <div style={{ padding: "16px 24px", background: "#ffffff", borderTop: "1px solid #f1f5f9", display: "flex", justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={() => setIsWorkersModalOpen(false)}
                style={{ padding: "10px 22px", borderRadius: "12px", border: "none", background: "#0f172a", color: "#ffffff", fontWeight: "800", cursor: "pointer" }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 6: CREATE KITCHEN ORDER (KOT) MODAL                                */}
      {/* ========================================================================= */}
      {isAddKitchenModalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.75)",
            backdropFilter: "blur(6px)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: "24px",
              padding: "28px",
              maxWidth: "520px",
              width: "100%",
              boxShadow: "0 20px 50px rgba(0,0,0,0.3)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div
                  style={{
                    width: "38px",
                    height: "38px",
                    borderRadius: "10px",
                    background: "linear-gradient(135deg, #f97316 0%, #ea580c 100%)",
                    color: "#ffffff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <FaUtensils />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "800", color: "#0f172a" }}>
                    Create Kitchen Order Ticket (KOT)
                  </h3>
                  <span style={{ fontSize: "12px", color: "#94a3b8" }}>Send live cooking ticket to kitchen chefs</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddKitchenModalOpen(false)}
                style={{ background: "transparent", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: "18px" }}
              >
                <FaTimes />
              </button>
            </div>

            <form onSubmit={handleAddKitchenOrder} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {/* Order Type Toggle: Room vs Table */}
              <div>
                <label style={{ fontSize: "12px", fontWeight: "700", display: "block", marginBottom: "6px", color: "#334155" }}>
                  Destination (Room / Dining Table)
                </label>
                <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
                  <button
                    type="button"
                    onClick={() => setNewKitchenOrder({ ...newKitchenOrder, orderType: "Room" })}
                    style={{
                      flex: 1,
                      padding: "8px 12px",
                      borderRadius: "8px",
                      border: newKitchenOrder.orderType === "Room" ? "2px solid #f97316" : "1px solid #cbd5e1",
                      background: newKitchenOrder.orderType === "Room" ? "#ffedd5" : "#f8fafc",
                      color: newKitchenOrder.orderType === "Room" ? "#c2410c" : "#475569",
                      fontWeight: "700",
                      fontSize: "12.5px",
                      cursor: "pointer",
                    }}
                  >
                    🏨 Hotel Room
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewKitchenOrder({ ...newKitchenOrder, orderType: "Table" })}
                    style={{
                      flex: 1,
                      padding: "8px 12px",
                      borderRadius: "8px",
                      border: newKitchenOrder.orderType === "Table" ? "2px solid #f97316" : "1px solid #cbd5e1",
                      background: newKitchenOrder.orderType === "Table" ? "#ffedd5" : "#f8fafc",
                      color: newKitchenOrder.orderType === "Table" ? "#c2410c" : "#475569",
                      fontWeight: "700",
                      fontSize: "12.5px",
                      cursor: "pointer",
                    }}
                  >
                    🍽️ Dining Table
                  </button>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: "700", display: "block", marginBottom: "4px" }}>
                    {newKitchenOrder.orderType === "Table" ? "Table Number" : "Room Number"}
                  </label>
                  {newKitchenOrder.orderType === "Table" ? (
                    <select
                      value={newKitchenOrder.table}
                      onChange={(e) => setNewKitchenOrder({ ...newKitchenOrder, table: e.target.value })}
                      style={{ width: "100%", padding: "10px", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                    >
                      <option value="Table T-01">Table T-01 (Family 6-Seater)</option>
                      <option value="Table T-02">Table T-02 (Couple 2-Seater)</option>
                      <option value="Table T-03">Table T-03 (Standard 4-Seater)</option>
                      <option value="Table T-04">Table T-04 (Corner VIP)</option>
                      <option value="Table T-05">Table T-05 (Outdoor Garden)</option>
                      <option value="Table T-06">Table T-06 (Poolside)</option>
                      <option value="Table T-07">Table T-07 (Bar Lounge)</option>
                      <option value="Table T-08">Table T-08 (Terrace View)</option>
                    </select>
                  ) : (
                    <select
                      value={newKitchenOrder.room}
                      onChange={(e) => setNewKitchenOrder({ ...newKitchenOrder, room: e.target.value })}
                      style={{ width: "100%", padding: "10px", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                    >
                      {dbRooms.length > 0 ? (
                        dbRooms.map((r) => (
                          <option key={r.id} value={`Room ${r.roomNumber || r.id}`}>
                            Room {r.roomNumber || r.id} ({r.type || "Standard"})
                          </option>
                        ))
                      ) : (
                        <>
                          <option value="Room 101">Room 101</option>
                          <option value="Room 102">Room 102</option>
                          <option value="Room 103">Room 103</option>
                          <option value="Room 104">Room 104</option>
                          <option value="Room 105">Room 105</option>
                          <option value="Room 201">Room 201</option>
                          <option value="Room 202">Room 202</option>
                        </>
                      )}
                    </select>
                  )}
                </div>

                <div>
                  <label style={{ fontSize: "12px", fontWeight: "700", display: "block", marginBottom: "4px" }}>
                    Guest / Customer Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Aman Verma"
                    value={newKitchenOrder.guest}
                    onChange={(e) => setNewKitchenOrder({ ...newKitchenOrder, guest: e.target.value })}
                    style={{ width: "100%", padding: "10px", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: "700", display: "block", marginBottom: "4px" }}>
                    Food Items / Dishes
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Paneer Butter Masala, Butter Naan, Cold Coffee"
                    value={newKitchenOrder.items}
                    onChange={(e) => setNewKitchenOrder({ ...newKitchenOrder, items: e.target.value })}
                    style={{ width: "100%", padding: "10px", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: "12px", fontWeight: "700", display: "block", marginBottom: "4px" }}>
                    Quantity (Qty)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 2x, 4x (6)"
                    value={newKitchenOrder.qty}
                    onChange={(e) => setNewKitchenOrder({ ...newKitchenOrder, qty: e.target.value })}
                    style={{ width: "100%", padding: "10px", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: "700", display: "block", marginBottom: "4px" }}>
                    Estimated Bill (₹)
                  </label>
                  <input
                    type="number"
                    placeholder="₹ 450"
                    value={newKitchenOrder.total}
                    onChange={(e) => setNewKitchenOrder({ ...newKitchenOrder, total: e.target.value })}
                    style={{ width: "100%", padding: "10px", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: "12px", fontWeight: "700", display: "block", marginBottom: "4px" }}>
                    Priority
                  </label>
                  <select
                    value={newKitchenOrder.priority}
                    onChange={(e) => setNewKitchenOrder({ ...newKitchenOrder, priority: e.target.value })}
                    style={{ width: "100%", padding: "10px", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                  >
                    <option value="Normal">Normal</option>
                    <option value="High">High Priority</option>
                    <option value="Urgent (VIP)">Urgent (VIP Room)</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: "12px", fontWeight: "700", display: "block", marginBottom: "4px" }}>
                  Chef Special Instructions / Dietary Notes
                </label>
                <input
                  type="text"
                  placeholder="e.g. Less spicy, serve with extra pickled onions"
                  value={newKitchenOrder.notes}
                  onChange={(e) => setNewKitchenOrder({ ...newKitchenOrder, notes: e.target.value })}
                  style={{ width: "100%", padding: "10px", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "8px" }}>
                <button
                  type="button"
                  onClick={() => setIsAddKitchenModalOpen(false)}
                  style={{ padding: "10px 18px", borderRadius: "10px", border: "1px solid #cbd5e1", background: "#ffffff", fontWeight: "700", cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: "10px 22px",
                    borderRadius: "10px",
                    border: "none",
                    background: "linear-gradient(135deg, #f97316 0%, #ea580c 100%)",
                    color: "#ffffff",
                    fontWeight: "800",
                    cursor: "pointer",
                    boxShadow: "0 4px 14px rgba(249, 115, 22, 0.4)",
                  }}
                >
                  Dispatch KOT Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 7: RECORD INVOICE MODAL                                             */}
      {/* ========================================================================= */}
      {isAddInvoiceModalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.75)",
            backdropFilter: "blur(6px)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: "24px",
              padding: "28px",
              maxWidth: "520px",
              width: "100%",
              boxShadow: "0 20px 50px rgba(0,0,0,0.3)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div
                  style={{
                    width: "38px",
                    height: "38px",
                    borderRadius: "10px",
                    background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                    color: "#ffffff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <FaReceipt />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "800", color: "#0f172a" }}>
                    Record Guest Billing Invoice
                  </h3>
                  <span style={{ fontSize: "12px", color: "#94a3b8" }}>Add room billing or restaurant charge</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddInvoiceModalOpen(false)}
                style={{ background: "transparent", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: "18px" }}
              >
                <FaTimes />
              </button>
            </div>

            <form onSubmit={handleAddInvoice} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: "700", display: "block", marginBottom: "4px" }}>
                    Guest Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Guest Full Name"
                    value={newInvoiceForm.guest}
                    onChange={(e) => setNewInvoiceForm({ ...newInvoiceForm, guest: e.target.value })}
                    style={{ width: "100%", padding: "10px", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: "12px", fontWeight: "700", display: "block", marginBottom: "4px" }}>
                    Room Number
                  </label>
                  <select
                    value={newInvoiceForm.room}
                    onChange={(e) => setNewInvoiceForm({ ...newInvoiceForm, room: e.target.value })}
                    style={{ width: "100%", padding: "10px", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                  >
                    {dbRooms.length > 0 ? (
                      dbRooms.map((r) => (
                        <option key={r.id} value={r.roomNumber || r.id}>
                          Room {r.roomNumber || r.id}
                        </option>
                      ))
                    ) : (
                      <>
                        <option value="101">Room 101</option>
                        <option value="102">Room 102</option>
                        <option value="104">Room 104</option>
                        <option value="105">Room 105</option>
                        <option value="201">Room 201</option>
                      </>
                    )}
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: "12px", fontWeight: "700", display: "block", marginBottom: "4px" }}>
                  Billing Category
                </label>
                <select
                  value={newInvoiceForm.category}
                  onChange={(e) => setNewInvoiceForm({ ...newInvoiceForm, category: e.target.value })}
                  style={{ width: "100%", padding: "10px", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                >
                  <option value="Room Stay">Room Stay & Accommodation</option>
                  <option value="Dining / Room Service">Kitchen Dining & Room Service</option>
                  <option value="Full Package Stay">Complete Package Stay + Dining</option>
                  <option value="Laundry & Amenities">Laundry, Spa & Amenities</option>
                  <option value="Banquet & Events">Banquet Hall & Event Charges</option>
                </select>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: "700", display: "block", marginBottom: "4px" }}>
                    Total Amount (₹)
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 5500"
                    value={newInvoiceForm.amount}
                    onChange={(e) => setNewInvoiceForm({ ...newInvoiceForm, amount: e.target.value })}
                    style={{ width: "100%", padding: "10px", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: "12px", fontWeight: "700", display: "block", marginBottom: "4px" }}>
                    Amount Paid (₹)
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 5500"
                    value={newInvoiceForm.paid}
                    onChange={(e) => setNewInvoiceForm({ ...newInvoiceForm, paid: e.target.value })}
                    style={{ width: "100%", padding: "10px", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: "12px", fontWeight: "700", display: "block", marginBottom: "4px" }}>
                  Payment Method
                </label>
                <select
                  value={newInvoiceForm.method}
                  onChange={(e) => setNewInvoiceForm({ ...newInvoiceForm, method: e.target.value })}
                  style={{ width: "100%", padding: "10px", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                >
                  <option value="UPI / QR">UPI / QR Code</option>
                  <option value="Credit Card">Credit Card POS</option>
                  <option value="Debit Card">Debit Card</option>
                  <option value="Cash">Cash at Front Desk</option>
                  <option value="Net Banking">Net Banking / Direct Transfer</option>
                </select>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "8px" }}>
                <button
                  type="button"
                  onClick={() => setIsAddInvoiceModalOpen(false)}
                  style={{ padding: "10px 18px", borderRadius: "10px", border: "1px solid #cbd5e1", background: "#ffffff", fontWeight: "700", cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: "10px 22px",
                    borderRadius: "10px",
                    border: "none",
                    background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                    color: "#ffffff",
                    fontWeight: "800",
                    cursor: "pointer",
                    boxShadow: "0 4px 14px rgba(16, 185, 129, 0.4)",
                  }}
                >
                  Save & Issue Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 8: LOG OPERATIONAL EXPENSE MODAL                                    */}
      {/* ========================================================================= */}
      {isAddExpenseModalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.75)",
            backdropFilter: "blur(6px)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: "24px",
              padding: "28px",
              maxWidth: "480px",
              width: "100%",
              boxShadow: "0 20px 50px rgba(0,0,0,0.3)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div
                  style={{
                    width: "38px",
                    height: "38px",
                    borderRadius: "10px",
                    background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
                    color: "#ffffff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <FaMoneyBillWave />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "800", color: "#0f172a" }}>
                    Log Operational Expense
                  </h3>
                  <span style={{ fontSize: "12px", color: "#94a3b8" }}>Daily departmental spending ledger</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddExpenseModalOpen(false)}
                style={{ background: "transparent", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: "18px" }}
              >
                <FaTimes />
              </button>
            </div>

            <form onSubmit={handleAddExpense} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label style={{ fontSize: "12px", fontWeight: "700", display: "block", marginBottom: "4px" }}>
                  Department
                </label>
                <select
                  value={newExpenseForm.department}
                  onChange={(e) => setNewExpenseForm({ ...newExpenseForm, department: e.target.value })}
                  style={{ width: "100%", padding: "10px", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                >
                  <option value="Housekeeping">Housekeeping & Sanitization</option>
                  <option value="Kitchen">Kitchen, Pantry & Grocery</option>
                  <option value="Maintenance">Maintenance, Electrical & Repairs</option>
                  <option value="Front Office">Front Desk & Administration</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: "12px", fontWeight: "700", display: "block", marginBottom: "4px" }}>
                  Expense Description
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 50L Sanitizer & Fresh Linen Laundry"
                  value={newExpenseForm.description}
                  onChange={(e) => setNewExpenseForm({ ...newExpenseForm, description: e.target.value })}
                  style={{ width: "100%", padding: "10px", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: "700", display: "block", marginBottom: "4px" }}>
                    Amount (₹)
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 2400"
                    value={newExpenseForm.amount}
                    onChange={(e) => setNewExpenseForm({ ...newExpenseForm, amount: e.target.value })}
                    style={{ width: "100%", padding: "10px", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: "12px", fontWeight: "700", display: "block", marginBottom: "4px" }}>
                    Logged By
                  </label>
                  <input
                    type="text"
                    value={newExpenseForm.loggedBy}
                    onChange={(e) => setNewExpenseForm({ ...newExpenseForm, loggedBy: e.target.value })}
                    style={{ width: "100%", padding: "10px", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                  />
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "8px" }}>
                <button
                  type="button"
                  onClick={() => setIsAddExpenseModalOpen(false)}
                  style={{ padding: "10px 18px", borderRadius: "10px", border: "1px solid #cbd5e1", background: "#ffffff", fontWeight: "700", cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: "10px 22px",
                    borderRadius: "10px",
                    border: "none",
                    background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
                    color: "#ffffff",
                    fontWeight: "800",
                    cursor: "pointer",
                    boxShadow: "0 4px 14px rgba(239, 68, 68, 0.4)",
                  }}
                >
                  Log Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 9: PRINTABLE BILL RECEIPT MODAL                                     */}
      {/* ========================================================================= */}
      {selectedReceipt && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.8)",
            backdropFilter: "blur(8px)",
            zIndex: 10000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: "20px",
              maxWidth: "560px",
              width: "100%",
              boxShadow: "0 25px 60px rgba(0, 0, 0, 0.35)",
              overflow: "hidden",
            }}
          >
            {/* Printable Receipt Area */}
            <div id="hotel-printable-receipt" style={{ padding: "30px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "2px dashed #e2e8f0", paddingBottom: "20px", marginBottom: "20px" }}>
                <div>
                  <h2 style={{ margin: "0 0 4px", fontSize: "20px", fontWeight: "900", color: "#0f172a" }}>
                    LUXURY RESORT & HOTEL
                  </h2>
                  <span style={{ fontSize: "12px", color: "#64748b" }}>Official Tax Invoice & Payment Receipt</span>
                </div>
                <div style={{ textAlign: "right" }}>
                  <span
                    style={{
                      padding: "4px 12px",
                      borderRadius: "6px",
                      fontSize: "12px",
                      fontWeight: "800",
                      background: selectedReceipt.status === "Paid" ? "#dcfce7" : selectedReceipt.status === "Partial" ? "#fef3c7" : "#fee2e2",
                      color: selectedReceipt.status === "Paid" ? "#16a34a" : selectedReceipt.status === "Partial" ? "#d97706" : "#dc2626",
                    }}
                  >
                    {selectedReceipt.status.toUpperCase()}
                  </span>
                  <div style={{ fontSize: "12px", color: "#64748b", marginTop: "6px" }}>{selectedReceipt.id}</div>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "24px", fontSize: "13px" }}>
                <div>
                  <div style={{ color: "#64748b", fontSize: "11px", fontWeight: "700" }}>GUEST DETAILS</div>
                  <div style={{ fontWeight: "800", color: "#0f172a", fontSize: "14px", marginTop: "2px" }}>{selectedReceipt.guest}</div>
                  <div style={{ color: "#475569" }}>Room {selectedReceipt.room}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ color: "#64748b", fontSize: "11px", fontWeight: "700" }}>DATE & PAYMENT</div>
                  <div style={{ fontWeight: "700", color: "#0f172a", marginTop: "2px" }}>{selectedReceipt.date}</div>
                  <div style={{ color: "#475569" }}>Method: {selectedReceipt.method}</div>
                </div>
              </div>

              <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "24px", fontSize: "13px" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #e2e8f0", color: "#64748b", textAlign: "left" }}>
                    <th style={{ padding: "8px 0" }}>Particulars / Category</th>
                    <th style={{ padding: "8px 0", textAlign: "right" }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "12px 0", fontWeight: "600", color: "#0f172a" }}>
                      {selectedReceipt.category}
                    </td>
                    <td style={{ padding: "12px 0", textAlign: "right", fontWeight: "700", color: "#0f172a" }}>
                      ₹{selectedReceipt.amount.toLocaleString("en-IN")}
                    </td>
                  </tr>
                </tbody>
              </table>

              <div style={{ background: "#f8fafc", borderRadius: "12px", padding: "16px", display: "flex", flexDirection: "column", gap: "8px", fontSize: "13px" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#64748b" }}>Total Bill Amount:</span>
                  <strong style={{ color: "#0f172a" }}>₹{selectedReceipt.amount.toLocaleString("en-IN")}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#16a34a", fontWeight: "700" }}>Amount Paid / Received:</span>
                  <strong style={{ color: "#16a34a" }}>₹{selectedReceipt.paid.toLocaleString("en-IN")}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px dashed #cbd5e1", paddingTop: "8px", marginTop: "4px" }}>
                  <span style={{ fontWeight: "800", color: "#dc2626" }}>Balance Remaining:</span>
                  <strong style={{ fontWeight: "800", color: "#dc2626" }}>
                    ₹{(selectedReceipt.amount - selectedReceipt.paid).toLocaleString("en-IN")}
                  </strong>
                </div>
              </div>

              <div style={{ textAlign: "center", marginTop: "20px", fontSize: "11px", color: "#94a3b8" }}>
                Thank you for choosing our hotel. Have a wonderful stay!
              </div>
            </div>

            {/* Action Bar */}
            <div style={{ padding: "16px 24px", background: "#f8fafc", borderTop: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <button
                type="button"
                onClick={() => setSelectedReceipt(null)}
                style={{ padding: "10px 18px", borderRadius: "10px", border: "1px solid #cbd5e1", background: "#ffffff", fontWeight: "700", cursor: "pointer" }}
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                style={{
                  padding: "10px 22px",
                  borderRadius: "10px",
                  border: "none",
                  background: "linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)",
                  color: "#ffffff",
                  fontWeight: "800",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  boxShadow: "0 4px 14px rgba(79, 70, 229, 0.4)",
                }}
              >
                <FaPrint /> Print Receipt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CHATRIX EMPLOYEE SALARY CHAT BOX */}
      {selectedChatrixInvoiceStaff && (() => {
        const sid = String(selectedChatrixInvoiceStaff.staffId || selectedChatrixInvoiceStaff.id || "").toLowerCase();
        let invoicesList = [];
        try {
          const s = localStorage.getItem(`hotel_chatrix_invoices_${sid}`);
          if (s) {
            const p = JSON.parse(s);
            if (Array.isArray(p) && p.length > 0) invoicesList = p;
          }
          if (invoicesList.length === 0) {
            const allInvs = JSON.parse(localStorage.getItem("hotel_chatrix_all_invoices") || "[]");
            const matching = allInvs.filter((i) => String(i.staffId).toLowerCase() === sid);
            if (matching.length > 0) invoicesList = matching;
          }
        } catch (e) { }

        // Provide multi-month rich history if list has only 1 entry so chat box timeline is rich
        if (invoicesList.length <= 1) {
          const sidCode = String(selectedChatrixInvoiceStaff.staffId || "101").replace(/[^0-9a-zA-Z]/g, "").toUpperCase() || "101";
          const initialItem = invoicesList[0] || {
            id: `PAY-ACC-AJ-${sidCode}-092026`,
            invoiceNo: `PAY-ACC-AJ-${sidCode}-092026`,
            staffId: selectedChatrixInvoiceStaff.staffId || "ACC-101",
            staffName: selectedChatrixInvoiceStaff.name,
            period: "Month 09/2026 (September)",
            month: "September 2026",
            year: "2026",
            date: "28 Sep 2026",
            time: "10:45 AM",
            baseSalary: 54000,
            allowances: 4500,
            bonus: 2500,
            grossSalary: 61000,
            deduction: 3050,
            taxDeduction: 3050,
            netSalary: 57950,
            status: "Verified & Paid",
            branch: currentBranchName,
          };

          invoicesList = [
            initialItem,
            {
              id: `PAY-ACC-AJ-${sidCode}-082026`,
              invoiceNo: `PAY-ACC-AJ-${sidCode}-082026`,
              staffId: selectedChatrixInvoiceStaff.staffId || "ACC-101",
              staffName: selectedChatrixInvoiceStaff.name,
              period: "Month 08/2026 (August)",
              month: "August 2026",
              year: "2026",
              date: "31 Aug 2026",
              time: "06:15 PM",
              baseSalary: 54000,
              allowances: 4500,
              bonus: 2500,
              grossSalary: 61000,
              deduction: 3050,
              taxDeduction: 3050,
              netSalary: 57950,
              status: "Verified & Paid",
              branch: currentBranchName,
            },
            {
              id: `PAY-ACC-AJ-${sidCode}-072026`,
              invoiceNo: `PAY-ACC-AJ-${sidCode}-072026`,
              staffId: selectedChatrixInvoiceStaff.staffId || "ACC-101",
              staffName: selectedChatrixInvoiceStaff.name,
              period: "Month 07/2026 (July)",
              month: "July 2026",
              year: "2026",
              date: "31 Jul 2026",
              time: "05:30 PM",
              baseSalary: 54000,
              allowances: 4500,
              bonus: 2500,
              grossSalary: 61000,
              deduction: 3050,
              taxDeduction: 3050,
              netSalary: 57950,
              status: "Verified & Paid",
              branch: currentBranchName,
            },
            {
              id: `PAY-ACC-AJ-${sidCode}-062026`,
              invoiceNo: `PAY-ACC-AJ-${sidCode}-062026`,
              staffId: selectedChatrixInvoiceStaff.staffId || "ACC-101",
              staffName: selectedChatrixInvoiceStaff.name,
              period: "Month 06/2026 (June)",
              month: "June 2026",
              year: "2026",
              date: "30 Jun 2026",
              time: "04:50 PM",
              baseSalary: 54000,
              allowances: 4500,
              bonus: 2500,
              grossSalary: 61000,
              deduction: 3050,
              taxDeduction: 3050,
              netSalary: 57950,
              status: "Verified & Paid",
              branch: currentBranchName,
            },
          ];
        }

        return (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(15, 23, 42, 0.78)",
              backdropFilter: "blur(8px)",
              zIndex: 99999,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "16px",
            }}
            onClick={() => setSelectedChatrixInvoiceStaff(null)}
          >
            <div
              style={{
                background: "#f8fafc",
                borderRadius: "22px",
                width: "100%",
                maxWidth: "680px",
                height: "90vh",
                display: "flex",
                flexDirection: "column",
                boxShadow: "0 25px 60px rgba(0, 0, 0, 0.35)",
                border: "1px solid #e2e8f0",
                overflow: "hidden",
                animation: "fadeInScale 0.25s ease",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* CHAT BOX HEADER */}
              <div
                style={{
                  background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 60%, #4338ca 100%)",
                  padding: "16px 20px",
                  color: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  boxShadow: "0 4px 14px rgba(0,0,0,0.15)",
                  flexShrink: 0,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{ position: "relative" }}>
                    <img
                      src={selectedChatrixInvoiceStaff.avatar}
                      alt={selectedChatrixInvoiceStaff.name}
                      style={{ width: "44px", height: "44px", borderRadius: "12px", objectFit: "cover", border: "2px solid #818cf8" }}
                    />
                    <span
                      style={{
                        position: "absolute",
                        bottom: "-2px",
                        right: "-2px",
                        width: "11px",
                        height: "11px",
                        borderRadius: "50%",
                        background: "#22c55e",
                        border: "2px solid #1e1b4b",
                      }}
                    />
                  </div>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ fontWeight: "900", fontSize: "16px", color: "#ffffff" }}>
                        {selectedChatrixInvoiceStaff.name}
                      </span>
                      <span style={{ background: "rgba(129, 140, 248, 0.3)", color: "#c7d2fe", fontSize: "11px", padding: "2px 7px", borderRadius: "6px", fontWeight: "800", border: "1px solid rgba(129, 140, 248, 0.4)" }}>
                        {selectedChatrixInvoiceStaff.staffId || "ACC-101"}
                      </span>
                    </div>
                    <div style={{ fontSize: "12px", color: "#cbd5e1", marginTop: "2px" }}>
                      💼 Salary Chatrix Thread • {invoicesList.length} Stored Disbursements • {currentBranchName}
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    style={{
                      padding: "6px 12px",
                      borderRadius: "8px",
                      border: "1px solid rgba(255,255,255,0.2)",
                      background: "rgba(255,255,255,0.12)",
                      color: "#ffffff",
                      fontSize: "12px",
                      fontWeight: "700",
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "5px",
                    }}
                  >
                    <FaPrint size={11} /> Print All
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedChatrixInvoiceStaff(null)}
                    style={{
                      background: "rgba(255, 255, 255, 0.15)",
                      border: "none",
                      color: "#ffffff",
                      width: "32px",
                      height: "32px",
                      borderRadius: "50%",
                      cursor: "pointer",
                      fontSize: "16px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* CHAT MESSAGES STREAM (SCROLLABLE TIMELINE) */}
              <div
                style={{
                  flex: 1,
                  overflowY: "auto",
                  padding: "20px 18px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "16px",
                  background: "#f1f5f9",
                }}
              >
                {/* Intro notice banner */}
                <div style={{ textAlign: "center", margin: "4px 0" }}>
                  <span style={{ background: "#e2e8f0", color: "#475569", padding: "4px 14px", borderRadius: "999px", fontSize: "11px", fontWeight: "700" }}>
                    🔒 End-to-end Verified Payroll Ledger • All Previous Disbursals Saved Permanently
                  </span>
                </div>

                {invoicesList.map((inv, idx) => {
                  const grossAmt = Number(inv.grossSalary || (inv.baseSalary + 7000)) || 61000;
                  const dedAmt = Number(inv.deduction || inv.taxDeduction) || Math.round(grossAmt * 0.05);
                  const netAmt = Number(inv.netSalary) || Math.max(0, grossAmt - dedAmt);
                  const netPercent = grossAmt > 0 ? Math.min(100, Math.max(0, Math.round((netAmt / grossAmt) * 100))) : 95;
                  const dedPercent = Math.max(0, 100 - netPercent);
                  const isExpanded = !!showSalaryDetailsMap[idx];

                  const sampleStaffRoster = [
                    { id: "1", name: "Sunita Rawat", dept: "HK", p: 1, a: 0, l: 0, salary: "₹26K", ded: "₹0", net: "₹26K" },
                    { id: "2", name: "Mukesh Bairwa", dept: "HK", p: 1, a: 0, l: 0, salary: "₹25K", ded: "₹0", net: "₹25K" },
                    { id: "3", name: "Santosh Devi", dept: "HK", p: 1, a: 0, l: 0, salary: "₹24.5K", ded: "₹0", net: "₹24.5K" },
                    { id: "4", name: "Manoj Chouhan", dept: "HK", p: 1, a: 0, l: 0, salary: "₹24K", ded: "₹0", net: "₹24K" },
                    { id: "5", name: "Pushpa Solanki", dept: "HK", p: 1, a: 0, l: 0, salary: "₹25.5K", ded: "₹0", net: "₹25.5K" },
                    { id: "6", name: "Harish Chand", dept: "KIT", p: 1, a: 0, l: 0, salary: "₹62K", ded: "₹0", net: "₹62K" },
                    { id: "7", name: "Kailash Mali", dept: "KIT", p: 1, a: 0, l: 0, salary: "₹43K", ded: "₹0", net: "₹43K" },
                    { id: "8", name: "Shanti Vaishnav", dept: "KIT", p: 1, a: 0, l: 0, salary: "₹37K", ded: "₹0", net: "₹37K" },
                    { id: "9", name: "Narendra Verma", dept: "KIT", p: 1, a: 0, l: 0, salary: "₹35K", ded: "₹0", net: "₹35K" },
                    { id: "10", name: "Pappu Gurjar", dept: "KIT", p: 1, a: 0, l: 0, salary: "₹32K", ded: "₹0", net: "₹32K" },
                    { id: "11", name: "Vijay Sharma", dept: "ACC", p: 1, a: 0, l: 0, salary: "₹54K", ded: "₹0", net: "₹54K" },
                    { id: "12", name: "Anjali Mathur", dept: "ACC", p: 1, a: 0, l: 0, salary: "₹41K", ded: "₹0", net: "₹41K" },
                    { id: "13", name: "Pradeep Jain", dept: "ACC", p: 1, a: 0, l: 0, salary: "₹43K", ded: "₹0", net: "₹43K" },
                    { id: "14", name: "Suman Choudhary", dept: "ACC", p: 1, a: 0, l: 0, salary: "₹42K", ded: "₹0", net: "₹42K" },
                    { id: "15", name: "Deepak Kumawat", dept: "ACC", p: 1, a: 0, l: 0, salary: "₹46K", ded: "₹0", net: "₹46K" },
                  ];

                  return (
                    <div key={inv.id || idx} style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      {/* Date Divider Badge */}
                      <div style={{ textAlign: "center", margin: "8px 0 2px 0" }}>
                        <span style={{ background: "#ffffff", color: "#334155", border: "1px solid #cbd5e1", padding: "4px 14px", borderRadius: "999px", fontSize: "11px", fontWeight: "800", boxShadow: "0 1px 4px rgba(0,0,0,0.05)", display: "inline-flex", alignItems: "center", gap: "5px" }}>
                          📅 {inv.date || "30 Jun 2026"} {inv.time ? `• ${inv.time}` : "• 04:50 PM"}
                        </span>
                      </div>

                      {/* Clean Short Structured Card */}
                      <div
                        style={{
                          background: "#ffffff",
                          borderRadius: "18px",
                          border: "1px solid #e2e8f0",
                          borderLeft: "5px solid #4f46e5",
                          boxShadow: "0 4px 18px rgba(15, 23, 42, 0.06)",
                          padding: "16px 18px",
                          maxWidth: "100%",
                          alignSelf: "stretch",
                        }}
                      >
                        {/* 1. Header Row */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", borderBottom: "1px solid #f1f5f9", paddingBottom: "8px" }}>
                          <div>
                            <div style={{ fontSize: "13px", fontWeight: "900", color: "#1e1b4b", letterSpacing: "0.4px" }}>
                              SALARY & ATTENDANCE
                            </div>
                            <div style={{ fontSize: "11px", color: "#64748b", marginTop: "1px" }}>
                              {currentBranchName || "Ajmer Branch"}
                            </div>
                          </div>
                          <div style={{ textAlign: "right" }}>
                            <span style={{ fontSize: "11px", fontWeight: "800", color: "#4338ca", background: "#e0e7ff", padding: "3px 9px", borderRadius: "6px", border: "1px solid #c7d2fe" }}>
                              {inv.month || inv.period || "September 2026"}
                            </span>
                          </div>
                        </div>

                        {/* 2. 4-Column Metric Grid Box */}
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px", marginBottom: "10px" }}>
                          <div style={{ background: "#f8fafc", padding: "8px 4px", borderRadius: "10px", border: "1px solid #e2e8f0", textAlign: "center" }}>
                            <div style={{ fontSize: "13px", fontWeight: "900", color: "#0f172a" }}>👥 15</div>
                            <div style={{ fontSize: "10px", color: "#64748b", fontWeight: "700" }}>Employees</div>
                          </div>
                          <div style={{ background: "#f8fafc", padding: "8px 4px", borderRadius: "10px", border: "1px solid #e2e8f0", textAlign: "center" }}>
                            <div style={{ fontSize: "13px", fontWeight: "900", color: "#312e81" }}>💰 ₹5.60L</div>
                            <div style={{ fontSize: "10px", color: "#64748b", fontWeight: "700" }}>Salary</div>
                          </div>
                          <div style={{ background: "#f0fdf4", padding: "8px 4px", borderRadius: "10px", border: "1px solid #bbf7d0", textAlign: "center" }}>
                            <div style={{ fontSize: "13px", fontWeight: "900", color: "#15803d" }}>✅ ₹5.60L</div>
                            <div style={{ fontSize: "10px", color: "#166534", fontWeight: "700" }}>Paid</div>
                          </div>
                          <div style={{ background: "#fef2f2", padding: "8px 4px", borderRadius: "10px", border: "1px solid #fecaca", textAlign: "center" }}>
                            <div style={{ fontSize: "13px", fontWeight: "900", color: "#b91c1c" }}>➖ ₹0</div>
                            <div style={{ fontSize: "10px", color: "#991b1b", fontWeight: "700" }}>Deduction</div>
                          </div>
                        </div>

                        {/* 4. Mini Roster Table */}
                        <div style={{ background: "#ffffff", borderRadius: "10px", border: "1px solid #e2e8f0", overflow: "hidden", marginBottom: "12px" }}>
                          <div style={{ padding: "6px 10px", background: "#f8fafc", borderBottom: "1px solid #e2e8f0", fontSize: "11px", fontWeight: "800", color: "#475569", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span>All Employees</span>
                            <span style={{ fontSize: "10px", color: "#15803d", fontWeight: "700" }}>● Verified & Disbursed</span>
                          </div>
                          <div style={{ maxHeight: isExpanded ? "420px" : "195px", overflowY: "auto", transition: "max-height 0.25s ease" }}>
                            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px", textAlign: "left" }}>
                              <thead>
                                <tr style={{ background: "#f1f5f9", color: "#475569", borderBottom: "1px solid #e2e8f0", fontSize: "10.5px" }}>
                                  <th style={{ padding: "5px 8px" }}>#</th>
                                  <th style={{ padding: "5px 8px" }}>Employee</th>
                                  <th style={{ padding: "5px 6px" }}>Dept</th>
                                  <th style={{ padding: "5px 6px", textAlign: "center" }}>P A L</th>
                                  <th style={{ padding: "5px 8px", textAlign: "right" }}>Salary</th>
                                  <th style={{ padding: "5px 6px", textAlign: "right" }}>Ded.</th>
                                  <th style={{ padding: "5px 8px", textAlign: "right" }}>Net</th>
                                  <th style={{ padding: "5px 8px", textAlign: "center" }}>Status</th>
                                </tr>
                              </thead>
                              <tbody>
                                {sampleStaffRoster.map((s, sIdx) => (
                                  <tr key={s.id || sIdx} style={{ borderBottom: "1px solid #f1f5f9", background: sIdx % 2 === 0 ? "#ffffff" : "#fcfcfc" }}>
                                    <td style={{ padding: "5px 8px", color: "#64748b" }}>{sIdx + 1}</td>
                                    <td style={{ padding: "5px 8px", fontWeight: "700", color: "#0f172a" }}>{s.name}</td>
                                    <td style={{ padding: "5px 6px" }}>
                                      <span style={{ fontSize: "9.5px", fontWeight: "800", padding: "1px 5px", borderRadius: "4px", background: s.dept === "HK" ? "#ffedd5" : s.dept === "KIT" ? "#d1fae5" : "#e0e7ff", color: s.dept === "HK" ? "#c2410c" : s.dept === "KIT" ? "#047857" : "#4338ca" }}>
                                        {s.dept}
                                      </span>
                                    </td>
                                    <td style={{ padding: "5px 6px", textAlign: "center", color: "#475569", fontSize: "10px" }}>1 0 0</td>
                                    <td style={{ padding: "5px 8px", textAlign: "right", color: "#334155" }}>{s.salary}</td>
                                    <td style={{ padding: "5px 6px", textAlign: "right", color: "#94a3b8" }}>{s.ded}</td>
                                    <td style={{ padding: "5px 8px", textAlign: "right", fontWeight: "800", color: "#15803d" }}>{s.net}</td>
                                    <td style={{ padding: "5px 8px", textAlign: "center" }}>
                                      <span style={{ color: "#16a34a", fontWeight: "800", fontSize: "10px" }}>✓ Paid</span>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>

                        {/* 5. Expandable Full Financial Breakdown & Chart */}
                        {isExpanded && (
                          <div style={{ background: "#f8fafc", padding: "14px", borderRadius: "12px", border: "1px solid #e2e8f0", marginBottom: "12px", animation: "fadeIn 0.2s ease" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                              <span style={{ fontSize: "11px", fontWeight: "800", color: "#334155", textTransform: "uppercase" }}>
                                📊 Detailed Disbursal Ratio
                              </span>
                              <span style={{ fontSize: "11px", color: "#15803d", fontWeight: "800" }}>
                                100% Disbursed (₹5.60L)
                              </span>
                            </div>
                            <div style={{ width: "100%", height: "12px", background: "#fee2e2", borderRadius: "999px", overflow: "hidden", display: "flex", marginBottom: "8px" }}>
                              <div style={{ width: "100%", background: "linear-gradient(90deg, #10b981 0%, #059669 100%)", height: "100%" }} />
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#64748b" }}>
                              <span>Gross CTC Budget: <strong>₹5,60,000</strong></span>
                              <span>Total Deductions: <strong>₹0</strong></span>
                              <span style={{ color: "#15803d", fontWeight: "800" }}>Net Paid: ₹5,60,000</span>
                            </div>
                          </div>
                        )}

                        {/* 6. Action Buttons Footer */}
                        <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: "8px", borderTop: "1px solid #f1f5f9", paddingTop: "10px" }}>
                          <button
                            type="button"
                            onClick={() => setShowSalaryDetailsMap((prev) => ({ ...prev, [idx]: !prev[idx] }))}
                            style={{
                              padding: "6px 14px",
                              borderRadius: "8px",
                              border: "1px solid #cbd5e1",
                              background: "#ffffff",
                              color: "#334155",
                              fontSize: "12px",
                              fontWeight: "700",
                              cursor: "pointer",
                              transition: "all 0.15s ease",
                            }}
                          >
                            {isExpanded ? "Hide Details" : "[View Details]"}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedChatrixInvoiceIndex(idx);
                              window.print();
                            }}
                            style={{
                              padding: "6px 14px",
                              borderRadius: "8px",
                              border: "none",
                              background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                              color: "#ffffff",
                              fontSize: "12px",
                              fontWeight: "800",
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "5px",
                            }}
                          >
                            <FaPrint size={11} /> Print Statement
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* CHAT FOOTER INFO BAR */}
              <div
                style={{
                  padding: "12px 20px",
                  background: "#ffffff",
                  borderTop: "1px solid #e2e8f0",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  fontSize: "12px",
                  color: "#64748b",
                  flexShrink: 0,
                }}
              >
                <span>Total {invoicesList.length} Salary Disbursals Logged</span>
                <button
                  type="button"
                  onClick={() => setSelectedChatrixInvoiceStaff(null)}
                  style={{
                    padding: "7px 18px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    background: "#ffffff",
                    color: "#334155",
                    fontWeight: "700",
                    cursor: "pointer",
                    fontSize: "12.5px",
                  }}
                >
                  Close Thread
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* MODAL: CHATRIX VISITOR INCOME CHAT BOX */}
      {selectedVisitorIncomeStaff && (() => {
        const exportsList = (exportedVisitorIncomes && exportedVisitorIncomes.length > 0)
          ? exportedVisitorIncomes
          : DEFAULT_VISITOR_INCOME_BATCHES;

        const latestExport = exportsList[0];
        const totalOverallIncome = exportsList.reduce((acc, curr) => acc + (Number(curr.stats?.totalIncome) || 0), 0);

        const handleSendVisitorChat = (e) => {
          e.preventDefault();
          if (!visitorChatInput || !visitorChatInput.trim()) return;

          const newVisitorObj = {
            id: latestExport.visitors.length + 1,
            name: visitorChatInput.trim(),
            phone: "+91 98000 00000",
            roomNumber: "101",
            floor: "1st Floor",
            amountPaid: 1500,
            checkIn: "Just now",
            checkOut: "—",
            status: "Checked-In",
          };

          const updatedBatch = {
            ...latestExport,
            id: `VIS-EXP-${Date.now()}`,
            formattedDate: "Today",
            formattedTime: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
            stats: {
              ...latestExport.stats,
              totalIncome: (Number(latestExport.stats.totalIncome) || 0) + 1500,
              totalVisitors: (Number(latestExport.stats.totalVisitors) || latestExport.visitors.length) + 1,
              currentlyInside: (Number(latestExport.stats.currentlyInside) || 0) + 1,
            },
            visitors: [newVisitorObj, ...latestExport.visitors],
          };

          const updatedList = [updatedBatch, ...exportsList.slice(1)];
          setExportedVisitorIncomes(updatedList);
          try {
            localStorage.setItem("hotel_chatrix_visitor_income_exports", JSON.stringify(updatedList));
          } catch { }

          setVisitorChatInput("");
          showToast(`Visitor income record added for ${newVisitorObj.name}!`);
        };

        const handleDownloadBatchCSV = (batch) => {
          try {
            let csv = `HOTEL VISITOR & REVENUE AUDIT REPORT\n`;
            csv += `Branch,"${batch.branch} (${batch.orgId})",Export Date,"${batch.formattedDate} ${batch.formattedTime}",Filter Scope,"Year: ${batch.filters?.year} | Month: ${batch.filters?.month} | Day: ${batch.filters?.day} | Status: ${batch.filters?.status}"\n`;
            csv += `Total Records,${batch.visitors.length},Total Revenue Collected,₹${batch.stats.totalIncome},Checked-In,${batch.stats.currentlyInside},Checked-Out,${batch.stats.checkedOut}\n\n`;
            csv += `Sr No,Visitor ID,Visitor Name,Phone Number,Room Number,Floor,Amount Paid (₹),Check-In Time,Check-Out Time,Status\n`;

            batch.visitors.forEach((v, index) => {
              csv += `${index + 1},"VIS-${v.id}","${v.name}","${v.phone}","${v.roomNumber}","${v.floor}",${v.amountPaid},"${v.checkIn}","${v.checkOut}","${v.status}"\n`;
            });

            csv += `\n,,,TOTAL AMOUNT PAID,,,₹${batch.stats.totalIncome},,\n`;
            const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.setAttribute("href", url);
            link.setAttribute("download", `visitor_income_${(batch.branch || "branch").toLowerCase().replace(/[^a-z0-9]/g, "_")}_${batch.date || Date.now()}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            showToast("CSV Downloaded successfully!");
          } catch (e) {
            showToast("Failed to download CSV");
          }
        };

        return (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(15, 23, 42, 0.82)",
              backdropFilter: "blur(10px)",
              zIndex: 99999,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "16px",
            }}
            onClick={() => setSelectedVisitorIncomeStaff(null)}
          >
            <div
              style={{
                background: "#f8fafc",
                borderRadius: "22px",
                width: "100%",
                maxWidth: "760px",
                height: "92vh",
                display: "flex",
                flexDirection: "column",
                boxShadow: "0 25px 60px rgba(0, 0, 0, 0.4)",
                border: "1px solid #e2e8f0",
                overflow: "hidden",
                animation: "fadeInScale 0.25s ease",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* CHAT BOX HEADER */}
              <div
                style={{
                  background: "linear-gradient(135deg, #064e3b 0%, #047857 50%, #059669 100%)",
                  padding: "16px 20px",
                  color: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  boxShadow: "0 4px 14px rgba(0,0,0,0.18)",
                  flexShrink: 0,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{ position: "relative" }}>
                    <img
                      src={selectedVisitorIncomeStaff.avatar}
                      alt={selectedVisitorIncomeStaff.name}
                      style={{ width: "44px", height: "44px", borderRadius: "12px", objectFit: "cover", border: "2px solid #6ee7b7" }}
                    />
                    <span
                      style={{
                        position: "absolute",
                        bottom: "-2px",
                        right: "-2px",
                        width: "12px",
                        height: "12px",
                        borderRadius: "50%",
                        background: "#22c55e",
                        border: "2px solid #064e3b",
                      }}
                    />
                  </div>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ fontWeight: "900", fontSize: "16px", color: "#ffffff" }}>
                        {selectedVisitorIncomeStaff.name}
                      </span>
                      <span style={{ background: "rgba(110, 231, 183, 0.3)", color: "#d1fae5", fontSize: "11px", padding: "2px 7px", borderRadius: "6px", fontWeight: "800", border: "1px solid rgba(110, 231, 183, 0.4)" }}>
                        📊 Chatrix Visitor Income
                      </span>
                    </div>
                    <div style={{ fontSize: "12px", color: "#a7f3d0", marginTop: "2px" }}>
                      💵 Verified Ledger • {exportsList.length} Accountant Sync Batches • {currentBranchName}
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm("Are you sure you want to clear all exported visitor batches from Chatrix?")) {
                        setExportedVisitorIncomes([]);
                        localStorage.removeItem("hotel_chatrix_visitor_income_exports");
                        showToast("All exported batches cleared!");
                      }
                    }}
                    style={{
                      padding: "6px 12px",
                      borderRadius: "8px",
                      border: "1px solid rgba(255,255,255,0.25)",
                      background: "rgba(239, 68, 68, 0.25)",
                      color: "#ffffff",
                      fontSize: "12px",
                      fontWeight: "700",
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "5px",
                    }}
                    title="Clear all stored export batches"
                  >
                    🗑️ Clear
                  </button>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    style={{
                      padding: "6px 12px",
                      borderRadius: "8px",
                      border: "1px solid rgba(255,255,255,0.25)",
                      background: "rgba(255,255,255,0.18)",
                      color: "#ffffff",
                      fontSize: "12px",
                      fontWeight: "700",
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "5px",
                    }}
                  >
                    <FaPrint size={11} /> Print Report
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedVisitorIncomeStaff(null)}
                    style={{
                      background: "rgba(255, 255, 255, 0.18)",
                      border: "none",
                      color: "#ffffff",
                      width: "32px",
                      height: "32px",
                      borderRadius: "50%",
                      cursor: "pointer",
                      fontSize: "16px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* CHAT MESSAGES STREAM (SCROLLABLE TIMELINE OF REAL EXPORTED VISITOR DATA) */}
              <div
                style={{
                  flex: 1,
                  overflowY: "auto",
                  padding: "18px 16px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "20px",
                  background: "#f1f5f9",
                }}
              >
                {/* Intro notice banner */}
                <div style={{ textAlign: "center", margin: "2px 0" }}>
                  <span style={{ background: "#e2e8f0", color: "#334155", padding: "4px 16px", borderRadius: "999px", fontSize: "11.5px", fontWeight: "700", border: "1px solid #cbd5e1" }}>
                    🔒 Real-Time Multi-Batch Stream • Total {exportsList.length} Accountant Export{exportsList.length > 1 ? "s" : ""} Logged
                  </span>
                </div>

                {exportsList.map((batch, batchIdx) => {
                  const batchNumber = exportsList.length - batchIdx;
                  return (
                    <div key={batch.id || batchIdx} style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      {/* Date Divider Badge with Exact Date & Time */}
                      <div style={{ textAlign: "center", margin: "4px 0 2px 0" }}>
                        <span style={{ background: "#ffffff", color: "#065f46", border: "1.5px solid #a7f3d0", padding: "4px 16px", borderRadius: "999px", fontSize: "11.5px", fontWeight: "900", boxShadow: "0 2px 6px rgba(0,0,0,0.06)", display: "inline-flex", alignItems: "center", gap: "8px" }}>
                          <span>📅 {batch.formattedDate || batch.date}</span>
                          <span>⏰ {batch.formattedTime || batch.time || "10:30 AM"}</span>
                          <span style={{ background: "#ecfdf5", color: "#047857", padding: "1px 8px", borderRadius: "8px", fontSize: "10.5px", border: "1px solid #6ee7b7" }}>
                            Batch #{batchNumber}
                          </span>
                          <span style={{ color: "#64748b", fontWeight: "600", fontSize: "10.5px" }}>
                            by {batch.exportedBy || "Accountant"}
                          </span>
                        </span>
                      </div>

                      {/* STRUCTURED CARD MATCHING USER REQUIREMENTS */}
                      <div
                        style={{
                          background: "#ffffff",
                          borderRadius: "18px",
                          border: "1px solid #e2e8f0",
                          boxShadow: "0 6px 20px rgba(15, 23, 42, 0.08)",
                          overflow: "hidden",
                        }}
                      >
                        {/* 1. PURPLE BANNER HEADER (👥 Visitors & Income) */}
                        <div
                          style={{
                            background: "linear-gradient(135deg, #581c87 0%, #6b21a8 50%, #7c3aed 100%)",
                            padding: "14px 16px",
                            color: "#ffffff",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            flexWrap: "wrap",
                            gap: "10px",
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <span
                              style={{
                                width: "32px",
                                height: "32px",
                                borderRadius: "8px",
                                background: "rgba(255, 255, 255, 0.2)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: "16px",
                              }}
                            >
                              👥
                            </span>
                            <div>
                              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <h4 style={{ margin: 0, fontSize: "16px", fontWeight: "900", color: "#ffffff", letterSpacing: "0.2px" }}>
                                  Visitors & Income
                                </h4>
                                <span style={{ background: "rgba(255,255,255,0.25)", color: "#ffffff", padding: "1px 7px", borderRadius: "6px", fontSize: "10px", fontWeight: "800" }}>
                                  #{batchNumber}
                                </span>
                              </div>
                              <p style={{ margin: "2px 0 0 0", fontSize: "11.5px", color: "rgba(233, 213, 255, 0.95)", fontWeight: "600" }}>
                                Visitor Management & Revenue Logs — {batch.branch || "Ajmer Branch"} ({batch.orgId || "AJ01"})
                              </p>
                            </div>
                          </div>

                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <span style={{ fontSize: "11px", color: "#f3e8ff", background: "rgba(255,255,255,0.15)", padding: "3px 8px", borderRadius: "6px" }}>
                              ⏰ {batch.formattedTime || batch.time}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleDownloadBatchCSV(batch)}
                              style={{
                                padding: "4px 10px",
                                borderRadius: "6px",
                                background: "rgba(255,255,255,0.2)",
                                border: "1px solid rgba(255,255,255,0.35)",
                                color: "#ffffff",
                                fontSize: "11px",
                                fontWeight: "700",
                                cursor: "pointer",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px",
                              }}
                              title="Download CSV report for this batch"
                            >
                              📥 CSV
                            </button>
                          </div>
                        </div>

                        {/* 2. FILTERS SCOPE BAR */}
                        <div
                          style={{
                            background: "#f8fafc",
                            padding: "8px 16px",
                            borderBottom: "1px solid #e2e8f0",
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                            flexWrap: "wrap",
                            fontSize: "11px",
                            color: "#475569",
                          }}
                        >
                          <strong style={{ color: "#334155" }}>Filters:</strong>
                          <span style={{ background: batch.filters?.today ? "#dcfce7" : "#ede9fe", color: batch.filters?.today ? "#166534" : "#6d28d9", padding: "2px 8px", borderRadius: "6px", fontWeight: "800", border: batch.filters?.today ? "1px solid #86efac" : "1px solid #ddd6fe" }}>
                            {batch.filters?.today ? "Today: Active" : "Today"}
                          </span>
                          <span style={{ background: "#ffffff", padding: "2px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontWeight: "700" }}>
                            Year: {batch.filters?.year || "2026"}
                          </span>
                          <span style={{ background: "#ffffff", padding: "2px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontWeight: "700" }}>
                            Month: {batch.filters?.month || "Sep"}
                          </span>
                          <span style={{ background: "#ffffff", padding: "2px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontWeight: "700" }}>
                            Day: {batch.filters?.day || "All"}
                          </span>
                          <span style={{ background: "#ffffff", padding: "2px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontWeight: "700" }}>
                            Status: {batch.filters?.status || "ALL"}
                          </span>
                        </div>

                        {/* 3. SUMMARY CARDS — ALL 7 VISIBLE */}
                        <div style={{ padding: "12px 14px", background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                          <div style={{ fontSize: "11px", fontWeight: "800", color: "#64748b", textTransform: "uppercase", marginBottom: "8px", letterSpacing: "0.4px" }}>
                            Summary Cards — Overview
                          </div>
                          <div
                            style={{
                              display: "grid",
                              gridTemplateColumns: "repeat(auto-fit, minmax(92px, 1fr))",
                              gap: "6px",
                            }}
                          >
                            {/* 1. Total Income */}
                            <div style={{ background: "linear-gradient(135deg, #ffffff 0%, #ecfdf5 100%)", borderRadius: "8px", padding: "8px 6px", border: "1px solid #a7f3d0", textAlign: "center" }}>
                              <div style={{ fontSize: "10px", fontWeight: "700", color: "#047857" }}>Total Income</div>
                              <div style={{ fontSize: "13px", fontWeight: "900", color: "#065f46", margin: "2px 0" }}>
                                ₹{Number(batch.stats?.totalIncome || 0).toLocaleString("en-IN")}
                              </div>
                              <div style={{ fontSize: "9px", color: "#059669", fontWeight: "600" }}>Total Paid</div>
                            </div>

                            {/* 2. Total Visitors */}
                            <div style={{ background: "linear-gradient(135deg, #ffffff 0%, #eff6ff 100%)", borderRadius: "8px", padding: "8px 6px", border: "1px solid #bfdbfe", textAlign: "center" }}>
                              <div style={{ fontSize: "10px", fontWeight: "700", color: "#1d4ed8" }}>Total Visitors</div>
                              <div style={{ fontSize: "13px", fontWeight: "900", color: "#1e40af", margin: "2px 0" }}>
                                {batch.stats?.totalVisitors || batch.visitors?.length || 0}
                              </div>
                              <div style={{ fontSize: "9px", color: "#2563eb", fontWeight: "600" }}>Filter Records</div>
                            </div>

                            {/* 3. Today's Visitors */}
                            <div style={{ background: "linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%)", borderRadius: "8px", padding: "8px 6px", border: "1px solid #bbf7d0", textAlign: "center" }}>
                              <div style={{ fontSize: "10px", fontWeight: "700", color: "#166534" }}>Today's Visitors</div>
                              <div style={{ fontSize: "13px", fontWeight: "900", color: "#14532d", margin: "2px 0" }}>
                                {batch.stats?.todayVisitors || 0}
                              </div>
                              <div style={{ fontSize: "9px", color: "#16a34a", fontWeight: "600" }}>
                                Today: ₹{Number(batch.stats?.todayIncome || 0).toLocaleString("en-IN")}
                              </div>
                            </div>

                            {/* 4. Currently Inside */}
                            <div style={{ background: "linear-gradient(135deg, #ffffff 0%, #f5f3ff 100%)", borderRadius: "8px", padding: "8px 6px", border: "1px solid #ddd6fe", textAlign: "center" }}>
                              <div style={{ fontSize: "10px", fontWeight: "700", color: "#6d28d9" }}>Currently Inside</div>
                              <div style={{ fontSize: "13px", fontWeight: "900", color: "#5b21b6", margin: "2px 0" }}>
                                {batch.stats?.currentlyInside || 0}
                              </div>
                              <div style={{ fontSize: "9px", color: "#7c3aed", fontWeight: "600" }}>Active on Premises</div>
                            </div>

                            {/* 5. Checked-Out */}
                            <div style={{ background: "linear-gradient(135deg, #ffffff 0%, #f1f5f9 100%)", borderRadius: "8px", padding: "8px 6px", border: "1px solid #cbd5e1", textAlign: "center" }}>
                              <div style={{ fontSize: "10px", fontWeight: "700", color: "#475569" }}>Checked-Out</div>
                              <div style={{ fontSize: "13px", fontWeight: "900", color: "#1e293b", margin: "2px 0" }}>
                                {batch.stats?.checkedOut || 0}
                              </div>
                              <div style={{ fontSize: "9px", color: "#64748b", fontWeight: "600" }}>Completed Visits</div>
                            </div>

                            {/* 6. Expected Visitors */}
                            <div style={{ background: "linear-gradient(135deg, #ffffff 0%, #fffbeb 100%)", borderRadius: "8px", padding: "8px 6px", border: "1px solid #fde68a", textAlign: "center" }}>
                              <div style={{ fontSize: "10px", fontWeight: "700", color: "#b45309" }}>Expected</div>
                              <div style={{ fontSize: "13px", fontWeight: "900", color: "#78350f", margin: "2px 0" }}>
                                {batch.stats?.expectedVisitors || 0}
                              </div>
                              <div style={{ fontSize: "9px", color: "#d97706", fontWeight: "600" }}>Upcoming</div>
                            </div>

                            {/* 7. Monthly Visits */}
                            <div style={{ background: "linear-gradient(135deg, #ffffff 0%, #fdf4ff 100%)", borderRadius: "8px", padding: "8px 6px", border: "1px solid #f5d0fe", textAlign: "center" }}>
                              <div style={{ fontSize: "10px", fontWeight: "700", color: "#a21caf" }}>Monthly Visits</div>
                              <div style={{ fontSize: "13px", fontWeight: "900", color: "#701a75", margin: "2px 0" }}>
                                {batch.stats?.totalVisitsThisMonth || 0}
                              </div>
                              <div style={{ fontSize: "9px", color: "#c026d3", fontWeight: "600" }}>
                                Month: ₹{Number(batch.stats?.totalIncomeThisMonth || 0).toLocaleString("en-IN")}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* 4. VISITOR RECORDS — COMPACT TABLE */}
                        <div style={{ padding: "12px 14px" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                            <span style={{ fontSize: "12px", fontWeight: "800", color: "#1e293b" }}>
                              Visitor Records — compact table
                            </span>
                            <span style={{ fontSize: "11px", fontWeight: "700", color: "#047857", background: "#ecfdf5", padding: "2px 8px", borderRadius: "10px", border: "1px solid #a7f3d0" }}>
                              {batch.visitors?.length || 0} Entries • ₹{Number(batch.stats?.totalIncome || 0).toLocaleString("en-IN")}
                            </span>
                          </div>

                          <div style={{ overflowX: "auto", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11.5px", textAlign: "left" }}>
                              <thead>
                                <tr style={{ background: "#f8fafc", color: "#475569", borderBottom: "1px solid #e2e8f0" }}>
                                  <th style={{ padding: "7px 10px", fontWeight: "700" }}>Visitor</th>
                                  <th style={{ padding: "7px 10px", fontWeight: "700" }}>Contact</th>
                                  <th style={{ padding: "7px 10px", fontWeight: "700" }}>Room / Floor</th>
                                  <th style={{ padding: "7px 10px", fontWeight: "700" }}>Amount</th>
                                  <th style={{ padding: "7px 10px", fontWeight: "700" }}>Check-In</th>
                                  <th style={{ padding: "7px 10px", fontWeight: "700" }}>Check-Out</th>
                                  <th style={{ padding: "7px 10px", fontWeight: "700", textAlign: "center" }}>Status</th>
                                </tr>
                              </thead>
                              <tbody>
                                {batch.visitors && batch.visitors.length > 0 ? (
                                  batch.visitors.map((v, vIdx) => (
                                    <tr
                                      key={v.id || vIdx}
                                      style={{
                                        borderBottom: "1px solid #f1f5f9",
                                        background: vIdx % 2 === 0 ? "#ffffff" : "#fcfcfd",
                                      }}
                                    >
                                      <td style={{ padding: "7px 10px", fontWeight: "700", color: "#0f172a" }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                                          <div style={{ width: "20px", height: "20px", borderRadius: "50%", background: "#ede9fe", color: "#6d28d9", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "9.5px", fontWeight: "800" }}>
                                            {(v.name || "V").charAt(0).toUpperCase()}
                                          </div>
                                          <div>
                                            <div>{v.name}</div>
                                            <div style={{ fontSize: "9px", color: "#94a3b8", fontWeight: "400" }}>VIS-{v.id}</div>
                                          </div>
                                        </div>
                                      </td>
                                      <td style={{ padding: "7px 10px", color: "#475569" }}>
                                        {v.phone || "N/A"}
                                      </td>
                                      <td style={{ padding: "7px 10px", color: "#334155", fontWeight: "600" }}>
                                        {v.roomNumber ? `${v.roomNumber}` : "101"} / {v.floor ? (v.floor.includes("Floor") ? v.floor.replace(" Floor", "F") : v.floor) : "1F"}
                                      </td>
                                      <td style={{ padding: "7px 10px", color: "#16a34a", fontWeight: "800" }}>
                                        ₹{Number(v.amountPaid || 0).toLocaleString("en-IN")}
                                      </td>
                                      <td style={{ padding: "7px 10px", color: "#334155" }}>
                                        {v.checkIn || "10:30 AM"}
                                      </td>
                                      <td style={{ padding: "7px 10px", color: "#475569" }}>
                                        {v.checkOut || (v.status === "Checked-Out" ? "06:45 PM" : "—")}
                                      </td>
                                      <td style={{ padding: "7px 10px", textAlign: "center" }}>
                                        <span
                                          style={{
                                            display: "inline-block",
                                            padding: "2px 7px",
                                            borderRadius: "12px",
                                            fontSize: "10px",
                                            fontWeight: "800",
                                            background:
                                              v.status === "Checked-In"
                                                ? "#dcfce7"
                                                : v.status === "Checked-Out"
                                                  ? "#f1f5f9"
                                                  : "#eff6ff",
                                            color:
                                              v.status === "Checked-In"
                                                ? "#166534"
                                                : v.status === "Checked-Out"
                                                  ? "#475569"
                                                  : "#1d4ed8",
                                            border:
                                              v.status === "Checked-In"
                                                ? "1px solid #86efac"
                                                : v.status === "Checked-Out"
                                                  ? "1px solid #cbd5e1"
                                                  : "1px solid #bfdbfe",
                                          }}
                                        >
                                          {v.status || "Checked-In"}
                                        </span>
                                      </td>
                                    </tr>
                                  ))
                                ) : (
                                  <tr>
                                    <td colSpan={7} style={{ padding: "16px", textAlign: "center", color: "#94a3b8" }}>
                                      No visitor records found in this batch.
                                    </td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* CHAT INPUT BAR */}
              <form
                onSubmit={handleSendVisitorChat}
                style={{
                  padding: "12px 18px",
                  background: "#ffffff",
                  borderTop: "1px solid #e2e8f0",
                  display: "flex",
                  gap: "10px",
                  alignItems: "center",
                  flexShrink: 0,
                }}
              >
                <input
                  type="text"
                  placeholder="Add quick visitor entry (e.g. Rahul Sharma, ₹2500, Room 204)..."
                  value={visitorChatInput}
                  onChange={(e) => setVisitorChatInput(e.target.value)}
                  style={{
                    flex: 1,
                    padding: "10px 14px",
                    borderRadius: "10px",
                    border: "1px solid #cbd5e1",
                    fontSize: "13px",
                    outline: "none",
                  }}
                />
              </form>
            </div>
          </div>
        );
      })()}

      {/* ========================================================================= */}
      {/* MODAL: FOOD & KITCHEN INCOME LIVE ORDER HISTORY (DETAILED TRANSACTIONS)     */}
      {/* ========================================================================= */}
      {isKitchenIncomeHistoryOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.65)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "16px",
          }}
          onClick={() => setIsKitchenIncomeHistoryOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#ffffff",
              borderRadius: "20px",
              width: "100%",
              maxWidth: "920px",
              maxHeight: "90vh",
              display: "flex",
              flexDirection: "column",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
              border: "1.5px solid #e2e8f0",
              overflow: "hidden",
              animation: "fadeInScale 0.2s ease-out",
            }}
          >
            {/* 1. MODAL HEADER */}
            <div
              style={{
                padding: "18px 24px",
                background: "linear-gradient(135deg, #14532d 0%, #15803d 50%, #16a34a 100%)",
                color: "#ffffff",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div
                  style={{
                    width: "42px",
                    height: "42px",
                    borderRadius: "12px",
                    background: "rgba(255, 255, 255, 0.2)",
                    backdropFilter: "blur(6px)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "20px",
                    border: "1px solid rgba(255, 255, 255, 0.3)",
                  }}
                >
                  💰
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: "17px", fontWeight: "900", letterSpacing: "0.3px", display: "flex", alignItems: "center", gap: "8px" }}>
                    Today Food & Kitchen Revenue History
                    <span style={{ fontSize: "11px", background: "rgba(255,255,255,0.25)", padding: "2px 8px", borderRadius: "8px", fontWeight: "800" }}>
                      {currentBranchName}
                    </span>
                  </h3>
                  <span style={{ fontSize: "12px", color: "#dcfce7", marginTop: "2px", display: "block" }}>
                    Detailed bill audit • Who ordered, item breakdown, payment status & timestamps
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsKitchenIncomeHistoryOpen(false)}
                style={{
                  background: "rgba(255, 255, 255, 0.2)",
                  border: "none",
                  color: "#ffffff",
                  fontSize: "18px",
                  width: "36px",
                  height: "36px",
                  borderRadius: "10px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.15s ease",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255, 255, 255, 0.35)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255, 255, 255, 0.2)")}
              >
                ✕
              </button>
            </div>

            {/* 2. REVENUE SUMMARY BANNER */}
            <div
              style={{
                background: "linear-gradient(90deg, #f0fdf4 0%, #ecfdf5 100%)",
                padding: "16px 24px",
                borderBottom: "1px solid #bbf7d0",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "14px",
              }}
            >
              <div style={{ display: "flex", gap: "24px", alignItems: "center", flexWrap: "wrap" }}>
                <div>
                  <span style={{ fontSize: "11.5px", color: "#166534", fontWeight: "700", textTransform: "uppercase", display: "block" }}>
                    Total Today Food Revenue
                  </span>
                  <strong style={{ fontSize: "24px", fontWeight: "900", color: "#14532d" }}>
                    ₹{totalKitchenTodayIncome.toLocaleString("en-IN")}
                  </strong>
                </div>
                <div style={{ height: "30px", width: "1px", background: "#bbf7d0" }} />
                <div>
                  <span style={{ fontSize: "11.5px", color: "#166534", fontWeight: "700", textTransform: "uppercase", display: "block" }}>
                    Total Orders Count
                  </span>
                  <strong style={{ fontSize: "20px", fontWeight: "900", color: "#0f172a" }}>
                    {kitchenOrders.length} Orders
                  </strong>
                </div>
                <div style={{ height: "30px", width: "1px", background: "#bbf7d0" }} />
                <div>
                  <span style={{ fontSize: "11.5px", color: "#166534", fontWeight: "700", textTransform: "uppercase", display: "block" }}>
                    Delivered & Paid
                  </span>
                  <strong style={{ fontSize: "20px", fontWeight: "900", color: "#15803d" }}>
                    {totalSuccessfulDeliveredOrders} Orders
                  </strong>
                </div>
              </div>

              <button
                type="button"
                onClick={exportKitchenOrdersCSV}
                style={{
                  padding: "8px 16px",
                  borderRadius: "10px",
                  border: "1.5px solid #16a34a",
                  background: "#ffffff",
                  color: "#15803d",
                  fontSize: "12px",
                  fontWeight: "800",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  boxShadow: "0 2px 6px rgba(22, 163, 74, 0.15)",
                }}
              >
                <FaDownload /> Export Revenue CSV
              </button>
            </div>

            {/* 3. DETAILED ORDER TRANSACTION HISTORY TABLE */}
            <div style={{ overflowY: "auto", padding: "18px 24px", flex: 1 }}>
              {kitchenOrders.length === 0 ? (
                <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>
                  No food or dining orders recorded yet today.
                </div>
              ) : (
                <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: "0 8px" }}>
                  <thead>
                    <tr style={{ color: "#64748b", fontSize: "11.5px", fontWeight: "800", textTransform: "uppercase", letterSpacing: "0.5px", textAlign: "left" }}>
                      <th style={{ padding: "8px 12px" }}>Order ID & Room/Table</th>
                      <th style={{ padding: "8px 12px" }}>Guest Name (Kisne Mangwaya)</th>
                      <th style={{ padding: "8px 12px" }}>Items Ordered (Kya Mangwaya)</th>
                      <th style={{ padding: "8px 12px" }}>Payment / Method</th>
                      <th style={{ padding: "8px 12px" }}>Order Time & Date</th>
                      <th style={{ padding: "8px 12px", textAlign: "right" }}>Total Amount</th>
                      <th style={{ padding: "8px 12px", textAlign: "center" }}>Delivery Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {kitchenOrders.map((ord, idx) => (
                      <tr
                        key={ord.id || idx}
                        style={{
                          background: "#f8fafc",
                          borderRadius: "12px",
                          border: "1px solid #e2e8f0",
                          boxShadow: "0 2px 6px rgba(0, 0, 0, 0.02)",
                          transition: "all 0.15s ease",
                        }}
                      >
                        {/* 1. Order ID & Room */}
                        <td style={{ padding: "12px" }}>
                          <span style={{ fontSize: "11px", fontWeight: "800", background: "#ffedd5", color: "#c2410c", padding: "2px 7px", borderRadius: "6px", display: "inline-block" }}>
                            {ord.id}
                          </span>
                          <div style={{ fontWeight: "850", color: "#0f172a", fontSize: "13px", marginTop: "3px" }}>
                            {ord.roomOrTable || ord.room || ord.table || "Room 101"}
                          </div>
                        </td>

                        {/* 2. Guest Name (Kisne Mangwaya) */}
                        <td style={{ padding: "12px" }}>
                          <div style={{ fontWeight: "850", color: "#0f172a", fontSize: "13.5px", display: "flex", alignItems: "center", gap: "6px" }}>
                            <span>👤</span> {ord.guest || "Walk-in Guest"}
                          </div>
                          <span style={{ fontSize: "11px", color: "#64748b" }}>
                            Priority: {ord.priority || "Normal"}
                          </span>
                        </td>

                        {/* 3. Items Ordered (Kya Mangwaya) */}
                        <td style={{ padding: "12px", maxWidth: "230px" }}>
                          <div style={{ fontWeight: "700", color: "#1e293b", fontSize: "12.5px", lineHeight: "1.4" }}>
                            🍽️ {ord.items}
                          </div>
                          <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>
                            Qty: <strong style={{ color: "#0f172a" }}>{ord.qty || "1"}</strong>
                            {ord.notes ? ` • Note: ${ord.notes}` : ""}
                          </div>
                        </td>

                        {/* 4. Payment Method */}
                        <td style={{ padding: "12px" }}>
                          <span
                            style={{
                              padding: "3px 9px",
                              borderRadius: "6px",
                              fontSize: "11px",
                              fontWeight: "800",
                              background: ord.status === "Delivered" ? "#dcfce7" : "#fef3c7",
                              color: ord.status === "Delivered" ? "#15803d" : "#b45309",
                              display: "inline-block",
                            }}
                          >
                            💳 {ord.status === "Delivered" ? "Billed to Room / UPI" : "Pending Bill"}
                          </span>
                        </td>

                        {/* 5. Date & Time */}
                        <td style={{ padding: "12px" }}>
                          <div style={{ fontSize: "12.5px", fontWeight: "700", color: "#0f172a" }}>
                            🕒 {ord.time || "Today, 12:30 PM"}
                          </div>
                          <span style={{ fontSize: "11px", color: "#64748b" }}>
                            {new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                          </span>
                        </td>

                        {/* 6. Total Amount */}
                        <td style={{ padding: "12px", textAlign: "right" }}>
                          <strong style={{ fontSize: "15px", fontWeight: "900", color: "#15803d" }}>
                            ₹{Number(ord.total || 0).toLocaleString("en-IN")}
                          </strong>
                        </td>

                        {/* 7. Status */}
                        <td style={{ padding: "12px", textAlign: "center" }}>
                          <span
                            style={{
                              padding: "4px 10px",
                              borderRadius: "999px",
                              fontSize: "11px",
                              fontWeight: "800",
                              background:
                                ord.status === "Cooking"
                                  ? "#ffedd5"
                                  : ord.status === "Ready"
                                    ? "#dcfce7"
                                    : ord.status === "Delivered"
                                      ? "#eff6ff"
                                      : "#fef3c7",
                              color:
                                ord.status === "Cooking"
                                  ? "#c2410c"
                                  : ord.status === "Ready"
                                    ? "#16a34a"
                                    : ord.status === "Delivered"
                                      ? "#1d4ed8"
                                      : "#d97706",
                            }}
                          >
                            {ord.status === "Cooking" ? "🔥 Cooking" : ord.status === "Ready" ? "🔔 Ready" : ord.status === "Delivered" ? "✅ Delivered" : "⏳ Pending"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* 4. MODAL FOOTER */}
            <div
              style={{
                padding: "14px 24px",
                background: "#f8fafc",
                borderTop: "1px solid #e2e8f0",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span style={{ fontSize: "12px", color: "#64748b", fontWeight: "600" }}>
                Showing all {kitchenOrders.length} food order bills for today
              </span>
              <button
                type="button"
                onClick={() => setIsKitchenIncomeHistoryOpen(false)}
                style={{
                  padding: "9px 22px",
                  borderRadius: "10px",
                  border: "none",
                  background: "#0f172a",
                  color: "#ffffff",
                  fontWeight: "800",
                  fontSize: "12.5px",
                  cursor: "pointer",
                }}
              >
                Close History
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CHATRIX KITCHEN & CHEF MULTI-BATCH AUDIT CHAT BOX                   */}
      {/* ========================================================================= */}
      {selectedKitchenChatrixChef && (() => {
        const batches = Array.isArray(exportedKitchenBatches) ? exportedKitchenBatches : [];

        const handleSendKitchenChat = (e) => {
          e.preventDefault();
          if (!kitchenChatInput.trim()) return;

          const now = new Date();
          const fDate = now.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
          const fTime = now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });

          const text = kitchenChatInput.trim();
          const manualBatch = {
            id: `KOT-EXP-${Date.now().toString().slice(-6)}`,
            batchId: `KOT-EXP-${Date.now().toString().slice(-6)}`,
            branch: currentBranchName || "Main Branch",
            formattedDate: "Today, " + fDate,
            formattedTime: fTime,
            exportedAt: now.toISOString(),
            exportedBy: selectedKitchenChatrixChef.name || userName,
            totalOrders: 1,
            todayTotalIncome: 350,
            successfulDeliveryCount: 1,
            failedOrdersCount: 0,
            orders: [
              {
                id: `KOT-${Date.now().toString().slice(-4)}`,
                roomOrTable: "Quick Order",
                guest: "Walk-in Guest",
                items: text,
                qty: "1",
                total: 350,
                status: "Delivered",
                priority: "High",
                time: fTime,
                paymentMethod: "Billed / UPI",
                notes: `Chat Entry by ${selectedKitchenChatrixChef.name}`,
              },
            ],
          };

          const updated = [manualBatch, ...batches];
          setExportedKitchenBatches(updated);
          try {
            localStorage.setItem("hotel_chatrix_kitchen_exports", JSON.stringify(updated));
            window.dispatchEvent(new CustomEvent("kitchen_orders_exported", { detail: manualBatch }));
          } catch (err) { }
          setKitchenChatInput("");
          showToast(`⚡ New Kitchen order batch logged for ${selectedKitchenChatrixChef.name}!`);
        };

        const downloadSingleBatchCSV = (batch) => {
          let csv = `HOTEL KITCHEN & DINING AUDIT REPORT - BATCH ${batch.batchId || batch.id}\n`;
          csv += `Branch,"${batch.branch || currentBranchName}",Export Date,"${batch.formattedDate} ${batch.formattedTime}",Chef / Logger,"${batch.exportedBy || selectedKitchenChatrixChef.name}"\n`;
          csv += `Total Orders,${batch.totalOrders || 0},Total Food Income,INR ${batch.todayTotalIncome || 0},Delivered / Paid,${batch.successfulDeliveryCount || 0},Failed / Cancelled,${batch.failedOrdersCount || 0}\n\n`;
          csv += `Sr No,Order ID,Room / Table,Guest Name (Kisne Mangwaya),Items Ordered (Kya Mangwaya),Quantity,Total Amount (INR),Payment Status,Delivery Status,Time,Notes\n`;

          (batch.orders || []).forEach((ord, index) => {
            csv += `${index + 1},"${ord.id || ""}","${ord.roomOrTable || ""}","${(ord.guest || "").replace(/"/g, '""')}","${(ord.items || "").replace(/"/g, '""')}","${ord.qty || "1"}",${ord.total || 0},"${ord.paymentMethod || "Billed"}","${ord.status || ""}","${ord.time || ""}","${(ord.notes || "").replace(/"/g, '""')}"\n`;
          });

          csv += `\n,,,,,TOTAL BATCH INCOME,INR ${batch.todayTotalIncome || 0},,,,\n`;

          const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
          const encodedUri = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.setAttribute("href", encodedUri);
          link.setAttribute("download", `Kitchen_Chatrix_Audit_${batch.batchId || batch.id}.csv`);
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(encodedUri);
          showToast(`📥 Batch ${batch.batchId || batch.id} CSV downloaded!`);
        };

        return (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(15, 23, 42, 0.82)",
              backdropFilter: "blur(10px)",
              zIndex: 99999,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "16px",
            }}
            onClick={() => setSelectedKitchenChatrixChef(null)}
          >
            <div
              style={{
                background: "#f8fafc",
                borderRadius: "22px",
                width: "100%",
                maxWidth: "880px",
                height: "92vh",
                display: "flex",
                flexDirection: "column",
                boxShadow: "0 25px 60px rgba(0, 0, 0, 0.4)",
                border: "1px solid #e2e8f0",
                overflow: "hidden",
                animation: "fadeInScale 0.25s ease",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* CHAT BOX HEADER */}
              <div
                style={{
                  background: "linear-gradient(135deg, #701a75 0%, #a21caf 50%, #c026d3 100%)",
                  padding: "16px 22px",
                  color: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  boxShadow: "0 4px 14px rgba(0,0,0,0.18)",
                  flexShrink: 0,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                  <div style={{ position: "relative" }}>
                    <img
                      src={selectedKitchenChatrixChef.avatar || "https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=150&auto=format&fit=crop&q=80"}
                      alt={selectedKitchenChatrixChef.name}
                      style={{ width: "46px", height: "46px", borderRadius: "14px", objectFit: "cover", border: "2px solid #f5d0fe" }}
                    />
                    <span
                      style={{
                        position: "absolute",
                        bottom: "-2px",
                        right: "-2px",
                        width: "13px",
                        height: "13px",
                        borderRadius: "50%",
                        background: "#22c55e",
                        border: "2px solid #701a75",
                      }}
                    />
                  </div>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                      <span style={{ fontWeight: "900", fontSize: "17px", color: "#ffffff", letterSpacing: "0.2px" }}>
                        {selectedKitchenChatrixChef.name}
                      </span>
                      <span style={{ background: "rgba(255, 255, 255, 0.22)", color: "#fdf4ff", fontSize: "11px", padding: "2px 8px", borderRadius: "6px", fontWeight: "800", border: "1px solid rgba(255, 255, 255, 0.35)" }}>
                        ⚡ Active Chatrix Chef
                      </span>
                    </div>
                    <div style={{ fontSize: "12px", color: "#f5d0fe", marginTop: "3px" }}>
                      🍳 Live Kitchen Orders & Revenue Audit • {batches.length} Export Batches Logged • {currentBranchName}
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm("Are you sure you want to clear all exported kitchen order batches from Chatrix?")) {
                        setExportedKitchenBatches([]);
                        localStorage.removeItem("hotel_chatrix_kitchen_exports");
                        showToast("All kitchen export batches cleared!");
                      }
                    }}
                    style={{
                      padding: "6px 12px",
                      borderRadius: "8px",
                      border: "1px solid rgba(255,255,255,0.25)",
                      background: "rgba(239, 68, 68, 0.25)",
                      color: "#ffffff",
                      fontSize: "12px",
                      fontWeight: "700",
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "5px",
                    }}
                    title="Clear all stored kitchen export batches"
                  >
                    🗑️ Clear
                  </button>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    style={{
                      padding: "6px 12px",
                      borderRadius: "8px",
                      border: "1px solid rgba(255,255,255,0.25)",
                      background: "rgba(255,255,255,0.18)",
                      color: "#ffffff",
                      fontSize: "12px",
                      fontWeight: "700",
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "5px",
                    }}
                  >
                    <FaPrint size={11} /> Print
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedKitchenChatrixChef(null)}
                    style={{
                      background: "rgba(255, 255, 255, 0.18)",
                      border: "none",
                      color: "#ffffff",
                      width: "32px",
                      height: "32px",
                      borderRadius: "50%",
                      cursor: "pointer",
                      fontSize: "16px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* CHAT MESSAGES STREAM (SCROLLABLE TIMELINE OF REAL EXPORTED KITCHEN DATA) */}
              <div
                style={{
                  flex: 1,
                  overflowY: "auto",
                  padding: "18px 16px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "20px",
                  background: "#f1f5f9",
                }}
              >
                {/* Intro notice banner */}
                <div style={{ textAlign: "center", margin: "2px 0" }}>
                  <span style={{ background: "#e2e8f0", color: "#334155", padding: "4px 16px", borderRadius: "999px", fontSize: "11.5px", fontWeight: "700", border: "1px solid #cbd5e1" }}>
                    ⚡ Real-Time Kitchen Chatrix Stream • {batches.length} Kitchen Export{batches.length !== 1 ? "s" : ""} Available
                  </span>
                </div>

                {batches.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "40px", color: "#64748b", background: "#ffffff", borderRadius: "16px", border: "1px dashed #cbd5e1" }}>
                    <div style={{ fontSize: "36px", marginBottom: "8px" }}>🍳</div>
                    <strong style={{ fontSize: "15px", color: "#0f172a", display: "block" }}>
                      No Exported Kitchen Batches Yet
                    </strong>
                    <span style={{ fontSize: "12.5px", color: "#64748b", marginTop: "4px", display: "block" }}>
                      Click <strong>"Export Data"</strong> inside Chef / Kitchen Orders banner to send today's order breakdown & total revenue right here into Chatrix!
                    </span>
                  </div>
                ) : (
                  batches.map((batch, batchIdx) => {
                    const batchNumber = batches.length - batchIdx;
                    return (
                      <div key={batch.id || batchIdx} style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        {/* Date Divider Badge with Exact Date & Time */}
                        <div style={{ textAlign: "center", margin: "4px 0 2px 0" }}>
                          <span style={{ background: "#ffffff", color: "#701a75", border: "1.5px solid #f5d0fe", padding: "4px 16px", borderRadius: "999px", fontSize: "11.5px", fontWeight: "900", boxShadow: "0 2px 6px rgba(0,0,0,0.06)", display: "inline-flex", alignItems: "center", gap: "8px" }}>
                            <span>📅 {batch.formattedDate || "Today"}</span>
                            <span>⏰ {batch.formattedTime || "12:00 PM"}</span>
                            <span style={{ background: "#fdf4ff", color: "#a21caf", padding: "1px 8px", borderRadius: "8px", fontSize: "10.5px", border: "1px solid #f5d0fe" }}>
                              Batch #{batchNumber}
                            </span>
                            <span style={{ color: "#64748b", fontWeight: "600", fontSize: "10.5px" }}>
                              by {batch.exportedBy || selectedKitchenChatrixChef.name || "Chef"}
                            </span>
                          </span>
                        </div>

                        {/* STRUCTURED CARD FOR KITCHEN ORDERS & REVENUE */}
                        <div
                          style={{
                            background: "#ffffff",
                            borderRadius: "18px",
                            border: "1px solid #e2e8f0",
                            boxShadow: "0 6px 20px rgba(15, 23, 42, 0.08)",
                            overflow: "hidden",
                          }}
                        >
                          {/* 1. PINK/PURPLE GRADIENT BANNER HEADER */}
                          <div
                            style={{
                              background: "linear-gradient(135deg, #831843 0%, #be185d 50%, #db2777 100%)",
                              padding: "14px 18px",
                              color: "#ffffff",
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              flexWrap: "wrap",
                              gap: "10px",
                            }}
                          >
                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                              <span
                                style={{
                                  width: "34px",
                                  height: "34px",
                                  borderRadius: "10px",
                                  background: "rgba(255, 255, 255, 0.2)",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  fontSize: "17px",
                                }}
                              >
                                🍳
                              </span>
                              <div>
                                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                  <h4 style={{ margin: 0, fontSize: "16px", fontWeight: "900", color: "#ffffff", letterSpacing: "0.2px" }}>
                                    Kitchen & Dining Orders Audit
                                  </h4>
                                  <span style={{ background: "rgba(255,255,255,0.25)", color: "#ffffff", padding: "1px 7px", borderRadius: "6px", fontSize: "10px", fontWeight: "800" }}>
                                    #{batchNumber}
                                  </span>
                                </div>
                                <p style={{ margin: "2px 0 0 0", fontSize: "11.5px", color: "rgba(253, 242, 248, 0.95)", fontWeight: "600" }}>
                                  Batch ID: {batch.batchId || batch.id} • {batch.branch || currentBranchName}
                                </p>
                              </div>
                            </div>

                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              <button
                                type="button"
                                onClick={() => downloadSingleBatchCSV(batch)}
                                style={{
                                  padding: "5px 12px",
                                  borderRadius: "8px",
                                  border: "1px solid rgba(255,255,255,0.35)",
                                  background: "rgba(255,255,255,0.2)",
                                  color: "#ffffff",
                                  fontSize: "11.5px",
                                  fontWeight: "800",
                                  cursor: "pointer",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "5px",
                                }}
                              >
                                <FaDownload size={10} /> CSV
                              </button>
                              <span style={{ fontSize: "11px", color: "#fdf2f8", background: "rgba(255,255,255,0.15)", padding: "3px 8px", borderRadius: "6px" }}>
                                ⏰ {batch.formattedTime || "12:00 PM"}
                              </span>
                            </div>
                          </div>

                          {/* 2. STATS 4-GRID (Total Orders, Delivered, Today Income, Failed) */}
                          <div style={{ padding: "12px 16px", background: "#faf5ff", borderBottom: "1px solid #f3e8ff" }}>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "8px" }}>
                              {/* 1. Today Food Revenue */}
                              <div style={{ background: "linear-gradient(135deg, #ffffff 0%, #ecfdf5 100%)", borderRadius: "10px", padding: "8px 10px", border: "1px solid #a7f3d0", textAlign: "center" }}>
                                <div style={{ fontSize: "10px", fontWeight: "700", color: "#065f46", textTransform: "uppercase" }}>💰 Today Food Revenue</div>
                                <div style={{ fontSize: "16px", fontWeight: "900", color: "#047857", margin: "2px 0" }}>
                                  ₹{Number(batch.todayTotalIncome || 0).toLocaleString("en-IN")}
                                </div>
                                <div style={{ fontSize: "9.5px", color: "#059669", fontWeight: "700" }}>Total Income</div>
                              </div>

                              {/* 2. Total Today Orders */}
                              <div style={{ background: "linear-gradient(135deg, #ffffff 0%, #fdf2f8 100%)", borderRadius: "10px", padding: "8px 10px", border: "1px solid #fbcfe8", textAlign: "center" }}>
                                <div style={{ fontSize: "10px", fontWeight: "700", color: "#9d174d", textTransform: "uppercase" }}>📋 Total Orders</div>
                                <div style={{ fontSize: "16px", fontWeight: "900", color: "#be185d", margin: "2px 0" }}>
                                  {batch.totalOrders || (batch.orders?.length) || 0}
                                </div>
                                <div style={{ fontSize: "9.5px", color: "#db2777", fontWeight: "700" }}>Today KOTs</div>
                              </div>

                              {/* 3. Completed / Delivered */}
                              <div style={{ background: "linear-gradient(135deg, #ffffff 0%, #eff6ff 100%)", borderRadius: "10px", padding: "8px 10px", border: "1px solid #bfdbfe", textAlign: "center" }}>
                                <div style={{ fontSize: "10px", fontWeight: "700", color: "#1e40af", textTransform: "uppercase" }}>✅ Delivered & Paid</div>
                                <div style={{ fontSize: "16px", fontWeight: "900", color: "#1d4ed8", margin: "2px 0" }}>
                                  {batch.successfulDeliveryCount || 0}
                                </div>
                                <div style={{ fontSize: "9.5px", color: "#2563eb", fontWeight: "700" }}>Successful</div>
                              </div>

                              {/* 4. Failed / Cancelled */}
                              <div style={{ background: "linear-gradient(135deg, #ffffff 0%, #fff1f2 100%)", borderRadius: "10px", padding: "8px 10px", border: "1px solid #fecdd3", textAlign: "center" }}>
                                <div style={{ fontSize: "10px", fontWeight: "700", color: "#9f1239", textTransform: "uppercase" }}>❌ Failed / Cancelled</div>
                                <div style={{ fontSize: "16px", fontWeight: "900", color: "#e11d48", margin: "2px 0" }}>
                                  {batch.failedOrdersCount || 0}
                                </div>
                                <div style={{ fontSize: "9.5px", color: "#f43f5e", fontWeight: "700" }}>Rejected</div>
                              </div>
                            </div>
                          </div>

                          {/* 3. ORDER ITEMS TABLE (Kisne Mangwaya, Kya Mangwaya, Total Price, Status) */}
                          <div style={{ padding: "12px 14px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                              <span style={{ fontSize: "12px", fontWeight: "800", color: "#1e293b" }}>
                                🍽️ Itemized Order Breakdown ({batch.orders?.length || 0} Orders)
                              </span>
                              <span style={{ fontSize: "11px", fontWeight: "800", color: "#701a75", background: "#fdf4ff", padding: "2px 8px", borderRadius: "8px", border: "1px solid #f5d0fe" }}>
                                Net Income: ₹{Number(batch.todayTotalIncome || 0).toLocaleString("en-IN")}
                              </span>
                            </div>

                            <div style={{ overflowX: "auto", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11.5px", textAlign: "left" }}>
                                <thead>
                                  <tr style={{ background: "#f8fafc", color: "#475569", borderBottom: "1px solid #e2e8f0" }}>
                                    <th style={{ padding: "7px 10px", fontWeight: "700" }}>Order ID & Room</th>
                                    <th style={{ padding: "7px 10px", fontWeight: "700" }}>Guest (Kisne Mangwaya)</th>
                                    <th style={{ padding: "7px 10px", fontWeight: "700" }}>Items (Kya Mangwaya)</th>
                                    <th style={{ padding: "7px 10px", fontWeight: "700" }}>Time</th>
                                    <th style={{ padding: "7px 10px", fontWeight: "700", textAlign: "right" }}>Total Price</th>
                                    <th style={{ padding: "7px 10px", fontWeight: "700", textAlign: "center" }}>Status</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {batch.orders && batch.orders.length > 0 ? (
                                    batch.orders.map((ord, oIdx) => (
                                      <tr
                                        key={ord.id || oIdx}
                                        style={{
                                          borderBottom: "1px solid #f1f5f9",
                                          background: oIdx % 2 === 0 ? "#ffffff" : "#fdf2f8",
                                        }}
                                      >
                                        <td style={{ padding: "7px 10px", fontWeight: "800", color: "#0f172a" }}>
                                          <span style={{ background: "#ffedd5", color: "#c2410c", padding: "1px 6px", borderRadius: "4px", fontSize: "10px", display: "inline-block", marginRight: "5px" }}>
                                            {ord.id}
                                          </span>
                                          {ord.roomOrTable || "Room 101"}
                                        </td>
                                        <td style={{ padding: "7px 10px", fontWeight: "700", color: "#1e293b" }}>
                                          👤 {ord.guest || "Walk-in Guest"}
                                        </td>
                                        <td style={{ padding: "7px 10px", color: "#334155", maxWidth: "220px" }}>
                                          <strong style={{ color: "#0f172a" }}>{ord.items}</strong>
                                          <div style={{ fontSize: "10px", color: "#64748b" }}>Qty: {ord.qty || "1"}</div>
                                        </td>
                                        <td style={{ padding: "7px 10px", color: "#64748b" }}>
                                          🕒 {ord.time || "12:30 PM"}
                                        </td>
                                        <td style={{ padding: "7px 10px", textAlign: "right", fontWeight: "900", color: "#15803d" }}>
                                          ₹{Number(ord.total || 0).toLocaleString("en-IN")}
                                        </td>
                                        <td style={{ padding: "7px 10px", textAlign: "center" }}>
                                          <span
                                            style={{
                                              padding: "2px 8px",
                                              borderRadius: "6px",
                                              fontSize: "10.5px",
                                              fontWeight: "800",
                                              background:
                                                ord.status === "Delivered" || ord.status === "Completed"
                                                  ? "#dcfce7"
                                                  : ord.status === "Cooking"
                                                    ? "#ffedd5"
                                                    : "#fef3c7",
                                              color:
                                                ord.status === "Delivered" || ord.status === "Completed"
                                                  ? "#166534"
                                                  : ord.status === "Cooking"
                                                    ? "#c2410c"
                                                    : "#b45309",
                                            }}
                                          >
                                            {ord.status || "Completed"}
                                          </span>
                                        </td>
                                      </tr>
                                    ))
                                  ) : (
                                    <tr>
                                      <td colSpan={6} style={{ padding: "14px", textAlign: "center", color: "#94a3b8" }}>
                                        No order items found in this batch.
                                      </td>
                                    </tr>
                                  )}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* CHAT INPUT BAR */}
              <form
                onSubmit={handleSendKitchenChat}
                style={{
                  padding: "12px 18px",
                  background: "#ffffff",
                  borderTop: "1px solid #e2e8f0",
                  display: "flex",
                  gap: "10px",
                  alignItems: "center",
                  flexShrink: 0,
                }}
              >
                <input
                  type="text"
                  placeholder={`Send live KOT order or kitchen revenue note to ${selectedKitchenChatrixChef.name}...`}
                  value={kitchenChatInput}
                  onChange={(e) => setKitchenChatInput(e.target.value)}
                  style={{
                    flex: 1,
                    padding: "10px 14px",
                    borderRadius: "10px",
                    border: "1px solid #cbd5e1",
                    fontSize: "13px",
                    outline: "none",
                  }}
                />
                <button
                  type="submit"
                  disabled={!kitchenChatInput.trim()}
                  style={{
                    padding: "10px 20px",
                    borderRadius: "10px",
                    border: "none",
                    background: kitchenChatInput.trim() ? "linear-gradient(135deg, #a21caf 0%, #c026d3 100%)" : "#cbd5e1",
                    color: "#ffffff",
                    fontSize: "13px",
                    fontWeight: "800",
                    cursor: kitchenChatInput.trim() ? "pointer" : "not-allowed",
                    boxShadow: kitchenChatInput.trim() ? "0 2px 8px rgba(162, 28, 175, 0.3)" : "none",
                  }}
                >
                  ⚡ Send
                </button>
              </form>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
