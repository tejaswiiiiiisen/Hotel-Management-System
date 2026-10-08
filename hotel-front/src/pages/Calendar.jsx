import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "../components/PageHeader.jsx";
import {
  FaCalendarAlt,
  FaChevronLeft,
  FaChevronRight,
  FaPlus,
  FaSearch,
  FaClock,
  FaUser,
  FaCheckCircle,
  FaExclamationTriangle,
  FaTimes,
  FaVideo,
  FaSlidersH,
} from "react-icons/fa";
import { getHkTasks, subscribeHkTasks, addHkTask } from "../services/housekeepingStore.js";
import { getInventoryTasks, subscribeInventoryTasks, addInventoryTask } from "../services/inventoryStore.js";
import { addNotification } from "../services/notificationStore.js";
import "./Calendar.css";

const seedCalendarEvents = [
  {
    id: 1,
    title: "Housekeeping Duty Briefing & Roster",
    time: "09:00 - 09:30 AM",
    timeHour: 9,
    dayIndex: 0, // Mon
    dayName: "01 Mon",
    category: "Housekeeping",
    bg: "#f1f5f9",
    color: "#334155",
    border: "#cbd5e1",
    tag: "Briefing",
  },
  {
    id: 2,
    title: "Room 105 & 108 Deep Steam Sanitization",
    time: "09:30 - 10:00 AM",
    timeHour: 9,
    dayIndex: 0, // Mon
    dayName: "01 Mon",
    category: "Housekeeping",
    bg: "#e2e8f0",
    color: "#1e293b",
    border: "#94a3b8",
    tag: "Cleaning",
  },
  {
    id: 3,
    title: "VIP Villa 501 Inspection & Keycard Setup",
    time: "10:00 - 11:20 AM",
    timeHour: 10,
    dayIndex: 0, // Mon
    dayName: "01 Mon",
    category: "VIP Check-in",
    bg: "linear-gradient(135deg, #ffedd5 0%, #fed7aa 100%)",
    color: "#9a3412",
    border: "#fdba74",
    tag: "Front Desk",
    staffAvatars: [
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=80&q=80",
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=80&q=80",
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=80&q=80",
    ],
  },
  {
    id: 4,
    title: "Bath Towels & Linen Stock Entry",
    time: "09:30 - 10:00 AM",
    timeHour: 9,
    dayIndex: 1, // Tue
    dayName: "02 Tue",
    category: "Inventory",
    bg: "#ede9fe",
    color: "#5b21b6",
    border: "#ddd6fe",
    tag: "Procurement",
  },
  {
    id: 5,
    title: "Publish Weekly Occupancy & OTA Rates",
    time: "09:30 - 10:00 AM",
    timeHour: 9,
    dayIndex: 1, // Tue
    dayName: "02 Tue",
    category: "Operations",
    bg: "#f1f5f9",
    color: "#0f172a",
    border: "#cbd5e1",
    tag: "OTA Sync",
  },
  {
    id: 6,
    title: "Main Restaurant Hygiene & Supply Audit",
    time: "11:30 AM",
    timeHour: 11,
    dayIndex: 2, // Wed
    dayName: "03 Wed",
    category: "Inventory",
    bg: "#ede9fe",
    color: "#4c1d95",
    border: "#c4b5fd",
    tag: "Audit",
  },
  {
    id: 7,
    title: "Room 204 Handover & Disinfection",
    time: "11:30 - 12:00 PM",
    timeHour: 11,
    dayIndex: 2, // Wed
    dayName: "03 Wed",
    category: "Housekeeping",
    bg: "#eff6ff",
    color: "#1e40af",
    border: "#bfdbfe",
    tag: "Housekeeping",
    staffAvatars: [
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=80&q=80",
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=80&q=80",
    ],
  },
  {
    id: 8,
    title: "Herbal Shampoo & Toiletries Reorder Shoot",
    time: "11:30 - 12:00 PM",
    timeHour: 11,
    dayIndex: 3, // Thu
    dayName: "04 Thu",
    category: "Inventory",
    bg: "#dcfce7",
    color: "#166534",
    border: "#86efac",
    tag: "Procurement",
    staffAvatars: [
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=80&q=80",
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=80&q=80",
    ],
  },
];

export default function Calendar() {
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState("Week"); // "Month" | "Week" | "Day"
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [currentDate, setCurrentDate] = useState(new Date(2026, 7, 1)); // August 2026
  const [isMonthDropdownOpen, setIsMonthDropdownOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedDayIndex, setSelectedDayIndex] = useState(0); // 0 = Mon, 1 = Tue...
  const [customEvents, setCustomEvents] = useState([]);
  const [hkTasks, setHkTasksState] = useState(getHkTasks());
  const [invTasks, setInvTasksState] = useState(getInventoryTasks());

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const monthShortNames = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ];

  const today = new Date();
  const currentRealYear = today.getFullYear();
  const currentRealMonth = today.getMonth();

  const year = currentDate.getFullYear();
  const monthIndex = currentDate.getMonth();

  const isCurrentOrFuture =
    year > currentRealYear ||
    (year === currentRealYear && monthIndex >= currentRealMonth);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, monthIndex - 1, 1));
  };

  const handleNextMonth = () => {
    if (isCurrentOrFuture) return;
    setCurrentDate(new Date(year, monthIndex + 1, 1));
  };

  const currentMonthDisplay = `${monthNames[monthIndex]}, ${year}`;
  const shortMonth = monthShortNames[monthIndex];

  const [newEvent, setNewEvent] = useState({
    title: "",
    category: "Housekeeping",
    assignedRole: "Housekeeper",
    time: "10:00 AM",
    dayIndex: 0,
    priority: "Normal",
  });

  useEffect(() => {
    const unsubHk = subscribeHkTasks((updated) => setHkTasksState(updated));
    const unsubInv = subscribeInventoryTasks((updated) => setInvTasksState(updated));
    return () => {
      unsubHk();
      unsubInv();
    };
  }, []);

  const daysHeader = [
    { index: 0, label: `01 Mon`, full: `Monday, ${shortMonth} 1` },
    { index: 1, label: `02 Tue`, full: `Tuesday, ${shortMonth} 2` },
    { index: 2, label: `03 Wed`, full: `Wednesday, ${shortMonth} 3` },
    { index: 3, label: `04 Thu`, full: `Thursday, ${shortMonth} 4` },
    { index: 4, label: `05 Fri`, full: `Friday, ${shortMonth} 5` },
    { index: 5, label: `06 Sat`, full: `Saturday, ${shortMonth} 6` },
    { index: 6, label: `07 Sun`, full: `Sunday, ${shortMonth} 7` },
  ];

  const timeHours = [
    { hour: 9, label: "09:00 AM" },
    { hour: 10, label: "10:00 AM" },
    { hour: 11, label: "11:00 AM" },
    { hour: 12, label: "12:00 PM" },
    { hour: 13, label: "01:00 PM" },
    { hour: 14, label: "02:00 PM" },
    { hour: 15, label: "03:00 PM" },
    { hour: 16, label: "04:00 PM" },
  ];

  const baseMonthSeed = [
    // August 2026 (Month 7)
    { id: 1, year: 2026, monthIndex: 7, title: "Housekeeping Duty Briefing & Roster", time: "09:00 - 09:30 AM", timeHour: 9, dayIndex: 0, category: "Housekeeping", tag: "Briefing" },
    { id: 2, year: 2026, monthIndex: 7, title: "Room 105 & 108 Deep Steam Sanitization", time: "09:30 - 10:00 AM", timeHour: 9, dayIndex: 0, category: "Housekeeping", tag: "Cleaning" },
    { id: 3, year: 2026, monthIndex: 7, title: "VIP Villa 501 Inspection & Keycard Setup", time: "10:00 - 11:20 AM", timeHour: 10, dayIndex: 0, category: "VIP Check-in", tag: "Front Desk", staffAvatars: ["https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=80&q=80", "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=80&q=80"] },
    { id: 4, year: 2026, monthIndex: 7, title: "Bath Towels & Linen Stock Entry", time: "09:30 - 10:00 AM", timeHour: 9, dayIndex: 1, category: "Inventory", tag: "Procurement" },
    { id: 5, year: 2026, monthIndex: 7, title: "Publish Weekly Occupancy & OTA Rates", time: "09:30 - 10:00 AM", timeHour: 9, dayIndex: 1, category: "Operations", tag: "OTA Sync" },
    { id: 6, year: 2026, monthIndex: 7, title: "Main Restaurant Hygiene & Supply Audit", time: "11:30 AM", timeHour: 11, dayIndex: 2, category: "Inventory", tag: "Audit" },
    { id: 7, year: 2026, monthIndex: 7, title: "Room 204 Handover & Disinfection", time: "11:30 - 12:00 PM", timeHour: 11, dayIndex: 2, category: "Housekeeping", tag: "Housekeeping" },
    { id: 8, year: 2026, monthIndex: 7, title: "Herbal Shampoo & Toiletries Reorder Shoot", time: "11:30 - 12:00 PM", timeHour: 11, dayIndex: 3, category: "Inventory", tag: "Procurement" },

    // July 2026 (Month 6)
    { id: 101, year: 2026, monthIndex: 6, title: "July Mid-Month Linen & Duvet Audit", time: "09:00 - 10:00 AM", timeHour: 9, dayIndex: 0, category: "Inventory", tag: "Audit" },
    { id: 102, year: 2026, monthIndex: 6, title: "Poolside Suite Deep Disinfection", time: "10:00 - 11:00 AM", timeHour: 10, dayIndex: 1, category: "Housekeeping", tag: "Deep Clean" },
    { id: 103, year: 2026, monthIndex: 6, title: "VIP Delegation Check-In & Setup", time: "11:00 AM - 12:00 PM", timeHour: 11, dayIndex: 2, category: "VIP Check-in", tag: "Front Desk" },

    // June 2026 (Month 5)
    { id: 201, year: 2026, monthIndex: 5, title: "Pre-Monsoon Roof & HVAC Inspection", time: "09:00 - 10:30 AM", timeHour: 9, dayIndex: 1, category: "Operations", tag: "Maintenance" },
    { id: 202, year: 2026, monthIndex: 5, title: "Minibar Restock Bulk Delivery (100 Cases)", time: "11:00 AM", timeHour: 11, dayIndex: 3, category: "Inventory", tag: "Restock" },

    // May 2026 (Month 4)
    { id: 301, year: 2026, monthIndex: 4, title: "Summer Peak Staff Training & Briefing", time: "09:30 - 10:30 AM", timeHour: 9, dayIndex: 0, category: "Housekeeping", tag: "Training" },
    { id: 302, year: 2026, monthIndex: 4, title: "Kitchen Hygiene & Safety Certification", time: "11:00 AM", timeHour: 11, dayIndex: 2, category: "Operations", tag: "Safety" },

    // April 2026 (Month 3)
    { id: 401, year: 2026, monthIndex: 3, title: "Q2 Property Linen Procurement Count", time: "09:00 AM", timeHour: 9, dayIndex: 2, category: "Inventory", tag: "Procurement" },
    { id: 402, year: 2026, monthIndex: 3, title: "Penthouse Suite Carpet Shampooing", time: "10:30 AM", timeHour: 10, dayIndex: 4, category: "Housekeeping", tag: "Shampoo" },

    // March 2026 (Month 2)
    { id: 501, year: 2026, monthIndex: 2, title: "Spring Hospitality & Duty Shift Review", time: "09:00 - 09:30 AM", timeHour: 9, dayIndex: 0, category: "Operations", tag: "Review" },
    { id: 502, year: 2026, monthIndex: 2, title: "Bath Amenities & Towels Quality Audit", time: "09:30 - 10:00 AM", timeHour: 9, dayIndex: 1, category: "Inventory", tag: "Audit" },
    { id: 503, year: 2026, monthIndex: 2, title: "Room 101-110 Air Conditioning Sanitization", time: "11:00 - 12:00 PM", timeHour: 11, dayIndex: 3, category: "Housekeeping", tag: "AC Clean" },

    // February 2026 (Month 1)
    { id: 601, year: 2026, monthIndex: 1, title: "Valentine's Week Deluxe Room Decor Setup", time: "10:00 AM", timeHour: 10, dayIndex: 1, category: "VIP Check-in", tag: "Decor" },
    { id: 602, year: 2026, monthIndex: 1, title: "Laundry Chemicals & Soap Stock Refill", time: "11:30 AM", timeHour: 11, dayIndex: 4, category: "Inventory", tag: "Refill" },

    // January 2026 (Month 0)
    { id: 701, year: 2026, monthIndex: 0, title: "New Year Inventory Count & Asset Review", time: "09:00 AM", timeHour: 9, dayIndex: 0, category: "Inventory", tag: "Asset Count" },
    { id: 702, year: 2026, monthIndex: 0, title: "Annual Housekeeping Uniform Distribution", time: "10:00 AM", timeHour: 10, dayIndex: 2, category: "Housekeeping", tag: "Uniforms" }
  ];

  // Dynamic real-time Housekeeping tasks matching current view's month/year
  const dynamicHkEvents = hkTasks
    .filter((t) => {
      if (!t.createdDate) return monthIndex === 7 && year === 2026;
      const d = new Date(t.createdDate);
      return d.getFullYear() === year && d.getMonth() === monthIndex;
    })
    .map((t, idx) => ({
      id: `hk_${t.id || idx}`,
      year,
      monthIndex,
      title: `${t.room}: ${t.task}`,
      time: t.assignedTime || "10:00 AM",
      timeHour: 10 + (idx % 4),
      dayIndex: (idx + 1) % 7,
      category: "Housekeeping",
      tag: t.status || "Cleaning",
      staffAvatars: [t.staffAvatar || "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=80&q=80"],
    }));

  // Dynamic real-time Inventory tasks matching current view's month/year
  const dynamicInvEvents = invTasks
    .filter((t) => {
      if (!t.createdDate) return monthIndex === 7 && year === 2026;
      const d = new Date(t.createdDate);
      return d.getFullYear() === year && d.getMonth() === monthIndex;
    })
    .map((t, idx) => ({
      id: `inv_${t.id || idx}`,
      year,
      monthIndex,
      title: t.title,
      time: t.time || "11:30 AM",
      timeHour: 11 + (idx % 3),
      dayIndex: (idx + 3) % 7,
      category: "Inventory",
      tag: t.category || "Stock",
    }));

  const activeMonthSeed = baseMonthSeed.filter(
    (ev) => ev.year === year && ev.monthIndex === monthIndex
  );

  const monthCustomEvents = customEvents.filter(
    (ev) => ev.year === year && ev.monthIndex === monthIndex
  );

  const allEvents = [...activeMonthSeed, ...dynamicHkEvents, ...dynamicInvEvents, ...monthCustomEvents];

  const filteredEvents = allEvents.filter((ev) => {
    const matchesSearch = ev.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = selectedCategory === "All" || ev.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  function handleCreateEvent(e) {
    e.preventDefault();
    if (!newEvent.title) return;

    let hourVal = 10;
    if (newEvent.time) {
      const match = newEvent.time.match(/(\d+)/);
      if (match) hourVal = parseInt(match[1], 10);
      if (newEvent.time.toLowerCase().includes("pm") && hourVal < 12) hourVal += 12;
    }

    const createdEv = {
      id: `custom_${Date.now()}`,
      year,
      monthIndex,
      title: newEvent.title,
      time: newEvent.time || "10:00 AM",
      timeHour: hourVal,
      dayIndex: Number(newEvent.dayIndex),
      category: newEvent.category,
      assignedRole: newEvent.assignedRole,
      priority: newEvent.priority,
      tag: newEvent.priority === "Urgent" ? "⚡ Urgent" : (newEvent.category === "Housekeeping" ? "Cleaning" : newEvent.category),
      staffAvatars: ["https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=80&q=80"]
    };

    setCustomEvents((prev) => [...prev, createdEv]);

    // REAL Task addition to global stores
    if (newEvent.category === "Housekeeping") {
      addHkTask({
        room: "Room " + Math.floor(100 + Math.random() * 400),
        task: newEvent.title,
        assignedTime: newEvent.time,
        assignedRole: newEvent.assignedRole,
        status: newEvent.priority === "Urgent" ? "Urgent Cleaning" : "In Progress",
      });
    } else if (newEvent.category === "Inventory") {
      addInventoryTask({
        title: `Inventory: ${newEvent.title}`,
        category: newEvent.category,
        time: newEvent.time,
        status: "Pending Audit",
      });
    }

    // DISPATCH REAL NOTIFICATION TO THE ASSIGNED ROLE
    const dayNamesList = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    const dayName = dayNamesList[Number(newEvent.dayIndex)] || "Monday";

    addNotification({
      user: `Task Assigned (${newEvent.assignedRole})`,
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80",
      action: `assigned a new ${newEvent.category} task`,
      target: `"${newEvent.title}"`,
      message: `📋 New Task Alert for ${newEvent.assignedRole}: "${newEvent.title}" scheduled for ${dayName} at ${newEvent.time}. Priority: ${newEvent.priority}.`,
      messageBg: "#e0e7ff",
      messageColor: "#3730a3",
      category: "Alerts",
      type: "alert"
    });

    setIsAddModalOpen(false);
    setNewEvent({
      title: "",
      category: "Housekeeping",
      assignedRole: "Housekeeper",
      time: "10:00 AM",
      dayIndex: 0,
      priority: "Normal",
    });
  }

  return (
    <div className="cal-page-container">
      <PageHeader
        title="Production & Operations Calendar"
        subtitle="Real-time schedule of Housekeeping tasks, Inventory audits, and Hotel events"
      />

      {/* TOP SUMMARY CARDS */}
      <div className="cal-summary-cards">
        <div className="cal-summary-card">
          <div className="cal-summary-header">
            <h4>Housekeeping & Room Duty</h4>
            <span className="cal-dropdown-arrow">▼</span>
          </div>
          <p className="cal-summary-time">3:00 PM - 4:30 PM</p>
          <div className="cal-summary-footer">
            <span className="cal-status-tag green">● Today</span>
            <button
              className="cal-action-link green"
              type="button"
              onClick={() => navigate("/housekeeping")}
            >
              View
            </button>
          </div>
        </div>

        <div className="cal-summary-card">
          <div className="cal-summary-header">
            <h4>VIP Check-in & Event Setup</h4>
            <span className="cal-dropdown-arrow">▼</span>
          </div>
          <p className="cal-summary-time">3:00 PM - 4:30 PM</p>
          <div className="cal-summary-footer">
            <span className="cal-status-tag peach">⚠️ 2 Conflicted</span>
            <button
              className="cal-action-link peach"
              type="button"
              onClick={() => navigate("/rooms")}
            >
              See Conflict
            </button>
          </div>
        </div>

        <div className="cal-summary-card">
          <div className="cal-summary-header">
            <h4>Inventory & Procurement Audit</h4>
            <span className="cal-dropdown-arrow">▼</span>
          </div>
          <p className="cal-summary-time">3:00 PM - 4:30 PM</p>
          <div className="cal-summary-footer">
            <span className="cal-status-tag red">❌ Today</span>
            <button
              className="cal-action-link red"
              type="button"
              onClick={() => navigate("/settings")}
            >
              View Audit Log
            </button>
          </div>
        </div>
      </div>

      {/* CONTROL TOOLBAR */}
      <div className="cal-toolbar">
        <div className="cal-toolbar-left">
          <div className="cal-month-nav">
            <button
              type="button"
              className="cal-nav-btn"
              onClick={handlePrevMonth}
              title="Previous Month"
            >
              <FaChevronLeft />
            </button>
            <span className="cal-month-title">{currentMonthDisplay}</span>
            <button
              type="button"
              className="cal-nav-btn"
              onClick={handleNextMonth}
              disabled={isCurrentOrFuture}
              style={{
                opacity: isCurrentOrFuture ? 0.35 : 1,
                cursor: isCurrentOrFuture ? "not-allowed" : "pointer",
              }}
              title={isCurrentOrFuture ? "Cannot view future months" : "Next Month"}
            >
              <FaChevronRight />
            </button>
          </div>
        </div>

        <div className="cal-toolbar-right">
          <div className="cal-search-box">
            <FaSearch className="cal-search-icon" />
            <input
              type="text"
              placeholder="search everything..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <span className="cal-cmd-kbd">⌘ K</span>
          </div>

          {/* MONTH SELECTOR DROPDOWN BUTTON */}
          <div style={{ position: "relative" }}>
            <button
              type="button"
              className="cal-date-picker-btn"
              onClick={() => setIsMonthDropdownOpen(!isMonthDropdownOpen)}
            >
              📅 1 {shortMonth} - 30 {shortMonth} {year} ▾
            </button>

            {isMonthDropdownOpen && (
              <div className="cal-month-dropdown">
                {monthNames.map((mName, mIdx) => {
                  const isFuture =
                    year > currentRealYear ||
                    (year === currentRealYear && mIdx > currentRealMonth);
                  const isSelected = mIdx === monthIndex;

                  return (
                    <button
                      key={mIdx}
                      type="button"
                      className={`cal-month-option ${isSelected ? "selected" : ""}`}
                      disabled={isFuture}
                      onClick={() => {
                        setCurrentDate(new Date(year, mIdx, 1));
                        setIsMonthDropdownOpen(false);
                      }}
                    >
                      <span>{mName} {year}</span>
                      {isSelected && <span>✓</span>}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* VIEW SWITCHER TABS (Month | Week | Day) */}
          <div className="cal-view-tabs">
            {["Month", "Week", "Day"].map((v) => (
              <button
                key={v}
                type="button"
                className={`cal-tab-btn ${activeView === v ? "active" : ""}`}
                onClick={() => setActiveView(v)}
              >
                {v}
              </button>
            ))}
          </div>

          <button
            type="button"
            className="cal-add-event-btn"
            onClick={() => setIsAddModalOpen(true)}
          >
            + Add Event
          </button>
        </div>
      </div>

      {/* DYNAMIC CALENDAR VIEWS (WEEK, DAY, MONTH) */}

      {/* 1. WEEK VIEW (7-DAY TIME GRID) */}
      {activeView === "Week" && (
        <div className="cal-grid-wrapper">
          <div className="cal-grid-header">
            <div className="cal-time-col-header">
              <button
                type="button"
                className="cal-grid-nav-mini"
                onClick={handlePrevMonth}
                title="Previous Month"
              >
                <FaChevronLeft />
              </button>
              <button
                type="button"
                className="cal-grid-nav-mini"
                onClick={handleNextMonth}
                disabled={isCurrentOrFuture}
                style={{
                  opacity: isCurrentOrFuture ? 0.35 : 1,
                  cursor: isCurrentOrFuture ? "not-allowed" : "pointer",
                }}
                title={isCurrentOrFuture ? "Cannot view future months" : "Next Month"}
              >
                <FaChevronRight />
              </button>
            </div>
            {daysHeader.map((d) => (
              <div key={d.index} className="cal-day-col-header">
                {d.label}
              </div>
            ))}
          </div>

          <div className="cal-grid-body">
            {timeHours.map((th) => (
              <div key={th.hour} className="cal-time-row">
                <div className="cal-time-cell">{th.label}</div>
                {daysHeader.map((d) => {
                  const cellEvents = filteredEvents.filter(
                    (ev) => ev.dayIndex === d.index && ev.timeHour === th.hour
                  );

                  return (
                    <div key={d.index} className="cal-grid-cell">
                      {cellEvents.map((ev) => (
                        <div
                          key={ev.id}
                          className={`cal-event-card ${ev.category.toLowerCase().replace(/\s+/g, "-")}`}
                        >
                          <div className="cal-event-title">{ev.title}</div>
                          <div className="cal-event-time">{ev.time}</div>

                          {ev.staffAvatars && ev.staffAvatars.length > 0 && (
                            <div className="cal-event-footer">
                              <div className="cal-avatar-group">
                                {ev.staffAvatars.map((av, idx) => (
                                  <img key={idx} src={av} alt="staff" className="cal-event-avatar" />
                                ))}
                              </div>
                              <span className="cal-event-tag">{ev.tag}</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. DAY VIEW (SINGLE-DAY FOCUSED DETAILED TIME GRID) */}
      {activeView === "Day" && (
        <div className="cal-grid-wrapper" style={{ padding: "18px" }}>
          {/* Day Selector Pills */}
          <div style={{ display: "flex", gap: "10px", marginBottom: "20px", overflowX: "auto", paddingBottom: "4px" }}>
            {daysHeader.map((d) => (
              <button
                key={d.index}
                type="button"
                className={`cal-day-pill-btn ${selectedDayIndex === d.index ? "active" : ""}`}
                onClick={() => setSelectedDayIndex(d.index)}
              >
                {d.full}
              </button>
            ))}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {timeHours.map((th) => {
              const dayEvents = filteredEvents.filter(
                (ev) => ev.dayIndex === selectedDayIndex && ev.timeHour === th.hour
              );

              return (
                <div
                  key={th.hour}
                  className="cal-day-row-card"
                >
                  <span className="cal-day-time-label">
                    {th.label}
                  </span>

                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {dayEvents.length === 0 ? (
                      <span style={{ fontSize: "12.5px", color: "#94a3b8", fontStyle: "italic" }}>
                        No events scheduled for this hour
                      </span>
                    ) : (
                      dayEvents.map((ev) => (
                        <div
                          key={ev.id}
                          className={`cal-event-card ${ev.category.toLowerCase().replace(/\s+/g, "-")}`}
                          style={{ maxWidth: "600px" }}
                        >
                          <div className="cal-event-title" style={{ fontSize: "14px" }}>{ev.title}</div>
                          <div className="cal-event-time">{ev.time} • Category: {ev.category}</div>
                          {ev.staffAvatars && ev.staffAvatars.length > 0 && (
                            <div className="cal-event-footer">
                              <div className="cal-avatar-group">
                                {ev.staffAvatars.map((av, idx) => (
                                  <img key={idx} src={av} alt="staff" className="cal-event-avatar" />
                                ))}
                              </div>
                              <span className="cal-event-tag">{ev.tag}</span>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. MONTH VIEW (31-DAY FULL CALENDAR MATRIX GRID) */}
      {activeView === "Month" && (
        <div className="cal-grid-wrapper" style={{ padding: "20px" }}>
          <h4 className="cal-month-matrix-title">
            Full Month Calendar Matrix — {currentMonthDisplay}
          </h4>

          <div className="cal-month-matrix-grid">
            {["MO", "TU", "WE", "TH", "FR", "SA", "SU"].map((dayName) => (
              <div key={dayName} className="cal-month-matrix-header">
                {dayName}
              </div>
            ))}

            {Array.from({ length: 31 }, (_, i) => i + 1).map((dateNum) => {
              const dayIdx = (dateNum - 1) % 7;
              const dateEvents = filteredEvents.filter((ev) => ev.dayIndex === dayIdx);

              return (
                <div
                  key={dateNum}
                  className="cal-month-date-card"
                >
                  <span className="cal-month-date-num">
                    {dateNum}
                  </span>

                  {dateEvents.length > 0 && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                      <span className="cal-month-event-badge">
                        {dateEvents[0].title}
                      </span>
                      {dateEvents.length > 1 && (
                        <span className="cal-month-event-more">
                          +{dateEvents.length - 1} more events
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ADD EVENT MODAL */}
      {isAddModalOpen && (
        <div className="cal-modal-overlay" onClick={() => setIsAddModalOpen(false)}>
          <div className="cal-modal-card" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "16px" }}>
              <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "700" }}>+ Add New Calendar Task / Event</h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                style={{ background: "none", border: "none", cursor: "pointer", fontSize: "16px" }}
              >
                <FaTimes />
              </button>
            </div>

            <form onSubmit={handleCreateEvent} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label style={{ fontSize: "12px", fontWeight: "700", display: "block", marginBottom: "4px" }}>Event / Task Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. VIP Penthouse Suite Room Inspection"
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                  style={{ width: "100%", padding: "10px 12px", borderRadius: "10px", border: "1px solid #cbd5e1" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: "700", display: "block", marginBottom: "4px" }}>Category</label>
                  <select
                    value={newEvent.category}
                    onChange={(e) => setNewEvent({ ...newEvent, category: e.target.value })}
                    style={{ width: "100%", padding: "10px 12px", borderRadius: "10px", border: "1px solid #cbd5e1" }}
                  >
                    <option value="Housekeeping">Housekeeping</option>
                    <option value="Front Desk">Front Desk</option>
                    <option value="Accountant">Accountant</option>
                    <option value="Manager">Manager</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: "12px", fontWeight: "700", display: "block", marginBottom: "4px" }}>Assign to Role / Staff</label>
                  <select
                    value={newEvent.assignedRole}
                    onChange={(e) => setNewEvent({ ...newEvent, assignedRole: e.target.value })}
                    style={{ width: "100%", padding: "10px 12px", borderRadius: "10px", border: "1px solid #cbd5e1" }}
                  >
                    <option value="Housekeeper">Housekeeper</option>
                    <option value="Front Desk Receptionist">Front Desk Receptionist</option>
                    <option value="Accountant">Accountant</option>
                    <option value="Hotel Manager">Hotel Manager</option>
                    <option value="All Staff">All Staff</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: "700", display: "block", marginBottom: "4px" }}>Scheduled Time</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 10:30 AM"
                    value={newEvent.time}
                    onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })}
                    style={{ width: "100%", padding: "10px 12px", borderRadius: "10px", border: "1px solid #cbd5e1" }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: "12px", fontWeight: "700", display: "block", marginBottom: "4px" }}>Priority Level</label>
                  <select
                    value={newEvent.priority}
                    onChange={(e) => setNewEvent({ ...newEvent, priority: e.target.value })}
                    style={{ width: "100%", padding: "10px 12px", borderRadius: "10px", border: "1px solid #cbd5e1" }}
                  >
                    <option value="Normal">Normal Priority</option>
                    <option value="High">High Priority</option>
                    <option value="Urgent">⚡ Urgent (Immediate Action)</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: "12px", fontWeight: "700", display: "block", marginBottom: "4px" }}>Scheduled Day</label>
                <select
                  value={newEvent.dayIndex}
                  onChange={(e) => setNewEvent({ ...newEvent, dayIndex: e.target.value })}
                  style={{ width: "100%", padding: "10px 12px", borderRadius: "10px", border: "1px solid #cbd5e1" }}
                >
                  <option value={0}>Monday</option>
                  <option value={1}>Tuesday</option>
                  <option value={2}>Wednesday</option>
                  <option value={3}>Thursday</option>
                  <option value={4}>Friday</option>
                  <option value={5}>Saturday</option>
                  <option value={6}>Sunday</option>
                </select>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  style={{ padding: "10px 18px", borderRadius: "10px", border: "1px solid #cbd5e1", background: "transparent", cursor: "pointer" }}
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
                  }}
                >
                  Save to Calendar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
