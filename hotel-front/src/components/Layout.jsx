import { showSuccess, showError, showWarning, showInfo } from "../utils/toast.js";
import { Fragment, useState, useRef, useEffect, useMemo } from "react";
import { NavLink, useNavigate, useLocation, Outlet } from "react-router-dom";
import NotificationDrawer from "./NotificationDrawer.jsx";
import BookRoomModal from "./BookRoomModal.jsx";
import { logout, getUserName, getUserRole, getUserEmail, getUserPermissions, refreshPermissions, getCurrentOrg, getCurrentOrgId, getCurrentOrgStatus, clearCurrentOrg, getAuthHeaders } from "../auth.js";
import { ROLES, MODULES, accessibleModules, accessLabel } from "../rbac.js";
import { getHkTasks, subscribeHkTasks, calculateHousekeepingSalaryAndBalance } from "../services/housekeepingStore.js";
import { getEmployees } from "../employees.js";
import { getProfile, subscribeProfile } from "../services/profileStore.js";
import { getNotifications, subscribeNotifications } from "../services/notificationStore.js";
import { logAction } from "../audit.js";
import { getRooms, bookRoomInStore, formatRoomForAdmin } from "../utils/roomStore.js";
import { getCustomers } from "../utils/customerStore.js";
import {
  FaBell,
  FaQuestion,
  FaQuestionCircle,
  FaCog,
  FaChevronDown,
  FaSignOutAlt,
  FaSun,
  FaMoon,
  FaChevronLeft,
  FaChevronRight,
  FaArrowLeft,
  FaPlus,
  FaVideo,
  FaCalendarAlt,
  FaBars,
  FaThLarge,
  FaBed,
  FaChartLine,
  FaUserTie,
  FaWallet,
  FaRobot,
  FaExclamationTriangle,
  FaEnvelope,
  FaPhone,
  FaBullhorn,
  FaTrash,
  FaCheckCircle,
  FaCheck,
  FaInbox,
  FaCommentAlt,
} from "react-icons/fa";

// Global Layout Component

const LogoutIcon = ({ size = 18 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ display: "inline-block", verticalAlign: "middle", flexShrink: 0 }}
  >
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();

  const [currentRole, setCurrentRole] = useState(() => getUserRole());
  const cleanRole = String(currentRole || "").trim().toLowerCase().replace(/\s+/g, "_");
  const role = cleanRole;
  const isHkRole = cleanRole === "housekeeping" || cleanRole === "housekeeper" || cleanRole === "staff";
  const userEmail = getUserEmail();
  const userName = getUserName();
  const [currentPermissions, setCurrentPermissions] = useState(() => getUserPermissions());

  const empList = useMemo(() => getEmployees(), []);
  const currentHkEmp = useMemo(() => {
    const emailStr = (userEmail || "").toLowerCase().trim();
    const storedName = (userName || "").toLowerCase().trim();
    return empList.find((e) => {
      const eEmail = (e.email || "").toLowerCase().trim();
      const eName = (e.name || "").toLowerCase().trim();
      const eUser = (e.username || "").toLowerCase().trim();
      return (
        (emailStr && (eEmail === emailStr || eUser === emailStr)) ||
        (storedName && eName === storedName)
      );
    });
  }, [empList, userEmail, userName]);

  const hkDisplayName = currentHkEmp?.name || (userName && userName !== "Super Admin" ? userName : "Sunita Devi");
  const hkStaffId = currentHkEmp?.staff_id || currentHkEmp?.staffId || "HK-101";

  const roleInfo = ROLES[cleanRole] || ROLES[currentRole] || { label: currentRole, color: "#667eea" };
  const modules = useMemo(() => {
    let mods = accessibleModules(cleanRole);
    // User requirement: remove rooms and employees from sidedashboard only in housekeeping
    if (cleanRole === "housekeeping") {
      mods = mods.filter((m) => m.key !== "rooms" && m.key !== "housekeeping" && m.key !== "employees");
      if (!mods.some((m) => m.key === "balance")) {
        mods.push({
          key: "balance",
          label: "Balance",
          icon: FaWallet,
          path: "/balance",
        });
      }
    }
    // Super admin: remove Visitor (payroll) from sidedashboard
    if (cleanRole === "super_admin" || cleanRole === "admin" || cleanRole === "root") {
      mods = mods.filter((m) => m.key !== "payroll");
    }
    // Accountant: remove rooms, housekeeping, and customers from sidedashboard
    if (cleanRole === "accountant") {
      mods = mods.filter((m) => m.key !== "rooms" && m.key !== "housekeeping" && m.key !== "customers");
    }
    return mods;
  }, [cleanRole, currentPermissions]);

  // Housekeeper dynamic balance state (Base ₹30,000 for 20 days, -₹1,000 auto-deducted except Sunday)
  const [hkSalaryData, setHkSalaryData] = useState(() => {
    return calculateHousekeepingSalaryAndBalance({
      staffEmail: userEmail,
      baseSalary: 30000,
      baseDays: 20,
    });
  });

  const [hkPunchStatus, setHkPunchStatus] = useState(() => {
    try {
      const saved = localStorage.getItem(`hk_staff_attendance_${userEmail || "staff"}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.date === new Date().toDateString()) {
          return parsed.isCheckedIn ? "Checked In" : "Off Duty";
        }
      }
    } catch (e) {}
    return "Off Duty";
  });

  const handleHkPunchToggle = () => {
    const isCurrentlyCheckedIn = hkPunchStatus === "Checked In";
    const nextCheckedIn = !isCurrentlyCheckedIn;
    const nextStatus = nextCheckedIn ? "Checked In" : "Off Duty";
    const emailKey = getUserEmail() || "staff";
    const record = {
      date: new Date().toDateString(),
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      isCheckedIn: nextCheckedIn,
      email: emailKey,
      name: hkDisplayName,
      staffId: hkStaffId,
      timestamp: Date.now(),
    };
    try {
      localStorage.setItem(`hk_staff_attendance_${emailKey}`, JSON.stringify(record));
    } catch (e) {}
    setHkPunchStatus(nextStatus);
    window.dispatchEvent(new Event("staff_attendance_changed"));
    if (nextCheckedIn) {
      showSuccess("Punch In recorded! Status: On Duty 🟢");
    } else {
      showInfo("Punched Out recorded. Status: Off Duty ⚪");
    }
  };

  useEffect(() => {
    if (!isHkRole) return;
    const syncHkState = () => {
      setHkSalaryData(
        calculateHousekeepingSalaryAndBalance({
          staffEmail: getUserEmail(),
          baseSalary: 30000,
          baseDays: 20,
        })
      );
      try {
        const saved = localStorage.getItem(`hk_staff_attendance_${getUserEmail() || "staff"}`);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.date === new Date().toDateString()) {
            setHkPunchStatus(parsed.isCheckedIn ? "Checked In" : "Off Duty");
          } else {
            setHkPunchStatus("Off Duty");
          }
        }
      } catch (e) {}
    };

    window.addEventListener("staff_attendance_changed", syncHkState);
    window.addEventListener("storage", syncHkState);
    const interval = setInterval(syncHkState, 3000);
    return () => {
      window.removeEventListener("staff_attendance_changed", syncHkState);
      window.removeEventListener("storage", syncHkState);
      clearInterval(interval);
    };
  }, [isHkRole]);

  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const profileMenuRef = useRef(null);

  const [userProfile, setUserProfile] = useState(() => getProfile());

  // Listen to permission updates & refresh permissions on layout mount, focus, and storage events
  useEffect(() => {
    const handlePermissionsUpdated = () => {
      setCurrentRole(getUserRole());
      setCurrentPermissions(getUserPermissions());
    };

    const triggerRefresh = () => {
      refreshPermissions().then(() => {
        setCurrentRole(getUserRole());
        setCurrentPermissions(getUserPermissions());
      });
    };

    window.addEventListener("user_permissions_updated", handlePermissionsUpdated);
    window.addEventListener("storage", handlePermissionsUpdated);
    window.addEventListener("focus", triggerRefresh);
    document.addEventListener("visibilitychange", triggerRefresh);

    triggerRefresh();

    return () => {
      window.removeEventListener("user_permissions_updated", handlePermissionsUpdated);
      window.removeEventListener("storage", handlePermissionsUpdated);
      window.removeEventListener("focus", triggerRefresh);
      document.removeEventListener("visibilitychange", triggerRefresh);
    };
  }, []);

  // 5-SECOND REAL-TIME BOOKING POPUP TOAST STATE
  const [bookingToast, setBookingToast] = useState(null);
  const toastTimerRef = useRef(null);

  const triggerBookingToastCard = (data) => {
    if (!data) return;

    // 1. DO NOT show pop-up card when admin is on Organizations listing page (/organizations)!
    if (window.location.pathname === "/organizations" || location.pathname === "/organizations") {
      console.log("[Layout Toast Ignored] Admin is currently on /organizations listing page.");
      return;
    }

    // 2. Organization filter: ONLY display floating pop-up card if booking orgId matches current active admin dashboard org!
    const activeOrgId = getCurrentOrgId();
    const activeOrgName = getCurrentOrg();

    if (!activeOrgId && !activeOrgName) {
      console.log("[Layout Toast Ignored] No active organization branch selected.");
      return;
    }

    const targetOrgId = data.orgId || data.org_id || "CH560";
    const bOrg = String(targetOrgId).trim().toLowerCase();
    const curId = activeOrgId ? String(activeOrgId).trim().toLowerCase() : "";
    const curName = activeOrgName ? String(activeOrgName).trim().toLowerCase() : "";

    const isMatch =
      !curId ||
      (curId && (bOrg === curId || curId.includes(bOrg) || bOrg.includes(curId))) ||
      (curName && (bOrg === curName || curName.toLowerCase().includes(bOrg) || bOrg.includes(curName.toLowerCase()))) ||
      (bOrg === "ch560" && curName.includes("cheery")) ||
      (bOrg === "as435" && curName.includes("ashirwad")) ||
      (bOrg === "ma330" && curName.includes("matcha"));

    if (!isMatch) {
      console.log(`[Layout Toast Ignored] Booking org ${targetOrgId} does not match active admin org ${activeOrgId} (${activeOrgName})`);
      return;
    }

    // UNIQUE SINGLE-SHOW DEDUPLICATION CHECK:
    const toastId = String(data.id || data.pkId || data.timestamp || `${data.guestName}_${data.roomNumber}`);
    let shownIds = [];
    try {
      shownIds = JSON.parse(localStorage.getItem("hotel_shown_booking_toast_ids") || "[]");
    } catch (e) {
      shownIds = [];
    }

    if (shownIds.includes(toastId)) {
      // Toast has ALREADY been shown ONCE to user in this session -> DO NOT SHOW AGAIN!
      return;
    }

    // Record this toast as shown ONCE
    shownIds.push(toastId);
    localStorage.setItem("hotel_shown_booking_toast_ids", JSON.stringify(shownIds));

    // Mark pending keys as shown in localStorage so they don't re-trigger
    try {
      const keysToMark = [
        targetOrgId ? `hotel_pending_toast_${targetOrgId}` : null,
        activeOrgId ? `hotel_pending_toast_${activeOrgId}` : null,
        "hotel_pending_toast_CH560",
        "hotel_pending_toast_AS435",
        "hotel_pending_toast_MA330",
        "hotel_new_booking_toast_alert"
      ].filter(Boolean);

      for (const k of keysToMark) {
        const raw = localStorage.getItem(k);
        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            if (String(parsed.id || parsed.pkId || parsed.timestamp || "") === toastId || !parsed.shown) {
              localStorage.setItem(k, JSON.stringify({ ...parsed, shown: true }));
            }
          } catch (e) { }
        }
      }
    } catch (err) { }

    setBookingToast({
      ...data,
      key: Date.now(),
    });

    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }

    // Auto remove card after 5 seconds (5000ms)
    toastTimerRef.current = setTimeout(() => {
      setBookingToast(null);
    }, 5000);
  };

  useEffect(() => {
    const handleNewBookingToast = (e) => {
      if (e.detail) {
        triggerBookingToastCard(e.detail);
      }
    };

    const handleStorageChange = (e) => {
      if (e.key === "hotel_new_booking_toast_alert" && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          triggerBookingToastCard(parsed);
        } catch (err) { }
      }
    };

    window.addEventListener("new_room_booked_toast", handleNewBookingToast);
    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("new_room_booked_toast", handleNewBookingToast);
      window.removeEventListener("storage", handleStorageChange);
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  // CHECK FOR PENDING BRANCH TOAST ON DASHBOARD MOUNT / LOCATION CHANGE / ORG SWITCH
  useEffect(() => {
    if (location.pathname === "/organizations") return;

    const activeOrgId = getCurrentOrgId();
    const activeOrgName = getCurrentOrg();
    if (!activeOrgId && !activeOrgName) return;

    try {
      let shownIds = [];
      try {
        shownIds = JSON.parse(localStorage.getItem("hotel_shown_booking_toast_ids") || "[]");
      } catch (e) {
        shownIds = [];
      }

      const keysToCheck = [
        activeOrgId ? `hotel_pending_toast_${activeOrgId}` : null,
        "hotel_pending_toast_CH560",
        "hotel_pending_toast_AS435",
        "hotel_pending_toast_MA330",
        "hotel_new_booking_toast_alert"
      ].filter(Boolean);

      for (const k of keysToCheck) {
        const raw = localStorage.getItem(k);
        if (raw) {
          const parsed = JSON.parse(raw);
          const toastId = String(parsed.id || parsed.pkId || parsed.timestamp || `${parsed.guestName}_${parsed.roomNumber}`);

          if (shownIds.includes(toastId)) continue;

          // Check if pending booking org matches active admin org
          const targetOrgId = parsed.orgId || parsed.org_id || "CH560";
          const bOrg = String(targetOrgId).trim().toLowerCase();
          const curId = activeOrgId ? String(activeOrgId).trim().toLowerCase() : "";
          const curName = activeOrgName ? String(activeOrgName).trim().toLowerCase() : "";

          const isMatch =
            !curId ||
            (curId && (bOrg === curId || curId.includes(bOrg) || bOrg.includes(curId))) ||
            (curName && (bOrg === curName || curName.toLowerCase().includes(bOrg) || bOrg.includes(curName.toLowerCase()))) ||
            (bOrg === "ch560" && curName.includes("cheery")) ||
            (bOrg === "as435" && curName.includes("ashirwad")) ||
            (bOrg === "ma330" && curName.includes("matcha"));

          if (isMatch && parsed && !parsed.shown && (Date.now() - (parsed.timestamp || 0)) < 300000) {
            triggerBookingToastCard(parsed);
            break;
          }
        }
      }
    } catch (e) { }
  }, [location.pathname, getCurrentOrgId(), getCurrentOrg()]);

  // GLOBAL LIVE SEARCH STATE
  const [globalSearchQuery, setGlobalSearchQuery] = useState("");
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const searchRef = useRef(null);

  // GLOBAL BOOK ROOM MODAL STATE FOR TOPBAR "+ BOOK NOW" BUTTON
  const [isGlobalBookModalOpen, setIsGlobalBookModalOpen] = useState(false);
  const [globalSelectedRoom, setGlobalSelectedRoom] = useState(null);
  const [globalAvailableRooms, setGlobalAvailableRooms] = useState([]);

  function handleOpenGlobalBookModal() {
    navigate("/book-now");
  }

  const handleConfirmGlobalBooking = () => {
    setIsGlobalBookModalOpen(false);
    setGlobalSelectedRoom(null);
  };

  // WEBSITE CUSTOMER QUERIES STATE (FOR QUESTION MARK ICON NEXT TO NOTIFICATION BELL)
  const [queriesList, setQueriesList] = useState([]);
  const [showQueries, setShowQueries] = useState(false);
  const [queryToast, setQueryToast] = useState(null);
  const queryToastTimerRef = useRef(null);
  const seenQueryIdsRef = useRef(new Set());

  const triggerQueryToastCard = (q) => {
    if (!q) return;
    setQueryToast({
      ...q,
      key: Date.now(),
    });

    if (queryToastTimerRef.current) {
      clearTimeout(queryToastTimerRef.current);
    }

    // Auto remove query toast card after 5 seconds (5000ms)
    queryToastTimerRef.current = setTimeout(() => {
      setQueryToast(null);
    }, 5000);
  };

  useEffect(() => {
    const handleQueryToast = (e) => {
      if (e.detail) {
        triggerQueryToastCard(e.detail);
      }
    };
    window.addEventListener("new_customer_query_toast", handleQueryToast);
    return () => {
      window.removeEventListener("new_customer_query_toast", handleQueryToast);
      if (queryToastTimerRef.current) clearTimeout(queryToastTimerRef.current);
    };
  }, []);

  const fetchWebsiteQueries = async () => {
    try {
      let res = await fetch("/api/query", { headers: getAuthHeaders() });
      if (!res.ok) {
        res = await fetch("http://localhost:4000/api/query", { headers: getAuthHeaders() });
      }
      const data = await res.json();
      if (data && data.success && Array.isArray(data.queries)) {
        // Detect newly arrived queries for 5-second toast popup
        if (seenQueryIdsRef.current.size > 0) {
          const newArrivals = data.queries.filter((q) => q.id && !seenQueryIdsRef.current.has(q.id));
          if (newArrivals.length > 0) {
            triggerQueryToastCard(newArrivals[0]);
          }
        }

        // Record all current query IDs into seen set
        data.queries.forEach((q) => {
          if (q.id) seenQueryIdsRef.current.add(q.id);
        });

        setQueriesList(data.queries);
        window.dispatchEvent(new CustomEvent("queries_updated", { detail: data.queries }));
      }
    } catch (err) {
      console.warn("Could not fetch queries", err);
    }
  };

  useEffect(() => {
    fetchWebsiteQueries();
    const interval = setInterval(fetchWebsiteQueries, 2500);
    return () => clearInterval(interval);
  }, []);

  const unreadQueryCount = useMemo(() => {
    return queriesList.filter((q) => !q.status || q.status === "New" || q.status === "Unread").length;
  }, [queriesList]);

  const handleMarkQueryRead = async (id) => {
    try {
      await fetch(`/api/query/${id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({ status: "Read" }),
      });
    } catch { }
    setQueriesList((prev) =>
      prev.map((q) => (q.id === id ? { ...q, status: "Read" } : q))
    );
  };

  const handleDeleteQuery = async (id) => {
    try {
      await fetch(`/api/query/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
    } catch { }
    setQueriesList((prev) => prev.filter((q) => q.id !== id));
  };

  useEffect(() => {
    function handleClickOutsideSearch(e) {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSearchDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutsideSearch);
    return () => document.removeEventListener("mousedown", handleClickOutsideSearch);
  }, []);

  const searchResults = (() => {
    if (!globalSearchQuery || globalSearchQuery.trim().length === 0) return [];
    const q = globalSearchQuery.trim().toLowerCase();
    const results = [];

    // 1. Rooms search
    try {
      const rooms = getRooms() || [];
      rooms.forEach((r) => {
        const roomNumStr = String(r.number || r.id || "");
        const title = r.name || r.roomTitle || `Room ${r.number}` || "";
        const type = r.type || "";
        const floor = r.floor || "";
        if (title.toLowerCase().includes(q) || type.toLowerCase().includes(q) || floor.toLowerCase().includes(q) || roomNumStr.includes(q)) {
          results.push({
            type: "room",
            id: r.id,
            title: title.startsWith("Room") ? title : `Room ${r.number || r.id} - ${title}`,
            subtitle: `${type} • ${floor} • ${r.price ? `₹${r.price}` : "Standard"}`,
            status: r.status || "Available",
            icon: "🛏️",
            link: `/rooms/${r.id}`,
          });
        }
      });
    } catch (e) { }

    // 2. Customers search
    try {
      const customers = getCustomers() || [];
      customers.forEach((c) => {
        const name = c.name || "";
        const phone = c.phone || "";
        const email = c.email || "";
        const room = c.roomBooked || "";
        if (name.toLowerCase().includes(q) || phone.includes(q) || email.toLowerCase().includes(q) || room.toLowerCase().includes(q)) {
          results.push({
            type: "customer",
            id: c.id,
            title: name,
            subtitle: `${room} • ${phone || email}`,
            status: c.paymentStatus || "Paid",
            icon: "👥",
            link: `/customers`,
          });
        }
      });
    } catch (e) { }

    // 3. Housekeeping Tasks search
    try {
      const tasks = getHkTasks() || [];
      tasks.forEach((t) => {
        const taskName = t.task || "";
        const room = t.room || "";
        const staff = t.staff || "";
        if (taskName.toLowerCase().includes(q) || room.toLowerCase().includes(q) || staff.toLowerCase().includes(q)) {
          results.push({
            type: "task",
            id: t.id,
            title: `${room} - ${taskName}`,
            subtitle: `Staff: ${staff} • Priority: ${t.priority || "Normal"}`,
            status: t.status || "Pending",
            icon: "🧹",
            link: `/housekeeping`,
          });
        }
      });
    } catch (e) { }

    return results.slice(0, 8);
  })();

  useEffect(() => {
    const unsubscribe = subscribeProfile((updated) => {
      if (updated) setUserProfile(updated);
    });
    return () => unsubscribe();
  }, []);

  // SIDEBAR COLLAPSE & MOBILE DRAWER STATE
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => {
    setIsMobileOpen(false);
  }, [location.pathname]);

  // REAL-TIME HOUSEKEEPING PENDING VIDEO APPROVALS COUNT
  const [hkPendingCount, setHkPendingCount] = useState(() => {
    return getHkTasks().filter(
      (t) => t.status === "Video Uploaded" || (t.approvalStatus && t.approvalStatus.includes("Pending"))
    ).length;
  });

  useEffect(() => {
    const unsubscribe = subscribeHkTasks((updatedTasks) => {
      const pending = updatedTasks.filter(
        (t) => t.status === "Video Uploaded" || (t.approvalStatus && t.approvalStatus.includes("Pending"))
      ).length;
      setHkPendingCount(pending);
    });
    return () => unsubscribe();
  }, []);

  // REAL-TIME NOTIFICATIONS UNREAD BADGE COUNT
  const [unreadNotifCount, setUnreadNotifCount] = useState(() => {
    return getNotifications().filter((n) => n.unread).length;
  });

  useEffect(() => {
    const unsubscribe = subscribeNotifications((list) => {
      setUnreadNotifCount(list.filter((n) => n.unread).length);
    });
    return () => unsubscribe();
  }, []);

  // DARK / LIGHT THEME STATE & LOCALSTORAGE PERSISTENCE
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("appTheme") || "light";
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("appTheme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  // Close dropdown menu when clicking anywhere outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const NAV_GROUPS = [
    { title: "People & Services", keys: ["customers", "housekeeping", "employees", "payroll"] },
    { title: "Operations", keys: ["inventory"] },
    { title: "Administration", keys: ["settings"] },
  ];
  // maintenance redirects to inventory?tab=maintenance; organizations is property switch; roles is global-only; reports is Super Admin portal only; crm, offers, ota, hotel_ai & ai removed from sidebar
  const HIDDEN_KEYS = ["organizations", "maintenance", "roles", "reports", "crm", "offers", "ai", "ota", "hotel_ai"];
  const BOTTOM_KEYS = ["profile"];
  const groupedKeys = NAV_GROUPS.flatMap((g) => g.keys);
  const mainModules = modules.filter(
    (m) => !groupedKeys.includes(m.key) && !HIDDEN_KEYS.includes(m.key) && !BOTTOM_KEYS.includes(m.key)
  );
  const navGroups = NAV_GROUPS.map((g) => ({
    ...g,
    items: g.keys
      .filter((k) => !HIDDEN_KEYS.includes(k) && !BOTTOM_KEYS.includes(k))
      .map((k) => modules.find((m) => m.key === k))
      .filter(Boolean),
  })).filter((g) => g.items.length > 0);
  const bottomModules = modules.filter(
    (m) => BOTTOM_KEYS.includes(m.key) && !HIDDEN_KEYS.includes(m.key)
  );

  const isAdmin = cleanRole === "super_admin" || cleanRole === "admin" || cleanRole === "root";
  const currentOrg = getCurrentOrg();
  const currentOrgId = getCurrentOrgId();
  const [currentOrgStatus, setCurrentOrgStatusState] = useState(() => getCurrentOrgStatus());
  const [currentOrgLogo, setCurrentOrgLogo] = useState("");

  useEffect(() => {
    const loadBranchLogo = () => {
      if (!currentOrgId) return;
      fetch(`http://localhost:4000/api/site-settings?orgId=${encodeURIComponent(currentOrgId)}`, { headers: getAuthHeaders() })
        .then((r) => r.json()).then((d) => setCurrentOrgLogo(d.logo || "")).catch(() => { });
    };
    loadBranchLogo();
    window.addEventListener("branch_logo_changed", loadBranchLogo);
    async function syncLiveOrgStatus() {
      if (!currentOrg) return;
      try {
        const res = await fetch("http://localhost:4000/api/organizations", { headers: getAuthHeaders() });
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
              setCurrentOrgStatusState(matched.status);
              sessionStorage.setItem("currentOrgStatus", matched.status);
            }
          }
        }
      } catch (e) {
        console.error("Live org status sync error:", e);
      }
    }

    syncLiveOrgStatus();
    const handleStorageChange = () => {
      setCurrentOrgStatusState(getCurrentOrgStatus());
      syncLiveOrgStatus();
    };
    window.addEventListener("storage", handleStorageChange);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("branch_logo_changed", loadBranchLogo);
    };
  }, [currentOrg, currentOrgId]);

  const isOrgActive = (currentOrgStatus || "active").toLowerCase() === "active";
  const isSuperAdminPortalPage = ["/organizations", "/roles", "/hotel-ai", "/reports"].includes(location.pathname);
  const isOrgLanding = isSuperAdminPortalPage;
  const needsOrgSelection = isAdmin && (!currentOrg || isSuperAdminPortalPage);
  const orgModule = MODULES.find((m) => m.key === "organizations");

  function handleLogout() {
    logAction("Logged out", "from Admin Dashboard", "login");
    logout();
    navigate("/login");
  }

  function exitOrg() {
    clearCurrentOrg();
    navigate("/organizations");
  }

  return (
    <div className={`dashboard ${isCollapsed ? "sidebar-is-collapsed" : ""}`}>
      {/* MOBILE BACKDROP OVERLAY */}
      {isMobileOpen && (
        <div
          className="sidebar-backdrop"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* SIDEBAR CONTAINER */}
      <aside className={`sidebar ${isCollapsed ? "collapsed" : ""} ${isMobileOpen ? "mobile-open" : ""}`}>
        {/* COLLAPSE / EXPAND TOGGLE FLOATING BUTTON */}
        <button
          className="sidebar-toggle-btn"
          type="button"
          onClick={() => setIsCollapsed((prev) => !prev)}
          title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {isCollapsed ? <FaChevronRight /> : <FaChevronLeft />}
        </button>

        {/* MACOS DECORATIVE CONTROL DOTS */}
        <div className="sidebar-mac-dots">
          <span className="dot red" />
          <span className="dot yellow" />
          <span className="dot green" />
        </div>

        {/* SIDEBAR COMPANY BRAND HEADER */}
        <div
          className="sidebar-user-header"
          style={{ display: "flex", alignItems: "center", gap: "10px" }}
        >
          {isAdmin && currentOrg && !isOrgLanding && (
            <button
              type="button"
              onClick={exitOrg}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "rgba(99, 102, 241, 0.1)",
                color: "#6366f1",
                border: "1px solid rgba(99, 102, 241, 0.2)",
                padding: "6px",
                borderRadius: "8px",
                cursor: "pointer",
                transition: "all 0.2s",
                flexShrink: 0
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(99, 102, 241, 0.2)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(99, 102, 241, 0.1)";
              }}
              title="Return to Organizations Dashboard"
            >
              <FaArrowLeft size={14} />
            </button>
          )}
          {!needsOrgSelection && (
            <img
              src={currentOrgLogo || "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=100&q=80"}
              alt="Hotel Brand Logo"
              className="sidebar-user-avatar"
              style={{ borderRadius: "10px", objectFit: "cover" }}
            />
          )}
          {!isCollapsed && (
            <div className="sidebar-user-info" style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
              {!needsOrgSelection ? (
                <>
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "5px",
                      padding: "2px 8px",
                      borderRadius: "999px",
                      fontSize: "10.5px",
                      fontWeight: "700",
                      background: isOrgActive ? "rgba(16, 185, 129, 0.12)" : "rgba(239, 68, 68, 0.12)",
                      color: isOrgActive ? "#10b981" : "#ef4444",
                      border: isOrgActive ? "1px solid rgba(16, 185, 129, 0.25)" : "1px solid rgba(239, 68, 68, 0.25)",
                      marginBottom: "3px",
                      width: "fit-content",
                      letterSpacing: "0.2px",
                    }}
                  >
                    <span
                      style={{
                        width: "6px",
                        height: "6px",
                        borderRadius: "50%",
                        background: isOrgActive ? "#10b981" : "#ef4444",
                        boxShadow: isOrgActive ? "0 0 6px #10b981" : "0 0 6px #ef4444",
                        display: "inline-block",
                      }}
                    />
                    {isOrgActive ? "Active" : "Inactive"}
                  </span>
                  <h3
                    className="sidebar-user-name"
                    style={{
                      fontSize: "15px",
                      fontWeight: "800",
                      color: "#0f172a",
                      margin: 0,
                      lineHeight: "1.2",
                    }}
                  >
                    {currentOrg || "Ashirwad"}
                  </h3>
                </>
              ) : (
                <>
                  <h3
                    className="sidebar-user-name"
                    style={{
                      fontSize: "15px",
                      fontWeight: "800",
                      color: "#0f172a",
                      margin: 0,
                      lineHeight: "1.2",
                    }}
                  >
                    Select Organization
                  </h3>
                  <span className="sidebar-user-role" style={{ fontSize: "10.5px", color: "#64748b", textTransform: "none" }}>
                    System Admin Portal
                  </span>
                </>
              )}
            </div>
          )}
        </div>

        {/* NAVIGATION LIST */}
        <nav className="sidebar-nav">
          {needsOrgSelection ? (
            <>
              {orgModule && (
                <NavLink
                  to={orgModule.path}
                  className={({ isActive }) => (isActive ? "active" : "")}
                  title={orgModule.label}
                >
                  <span className="ic">
                    {typeof orgModule.icon === "function" ? <orgModule.icon /> : orgModule.icon}
                  </span>
                  {!isCollapsed && (
                    <span className="nav-text">
                      <span className="lbl">{orgModule.label}</span>
                    </span>
                  )}
                </NavLink>
              )}
            </>
          ) : (
            <>
              {mainModules.length === 0 && navGroups.length === 0 && !isCollapsed && (
                <div style={{ padding: "24px 16px", textAlign: "center", color: "#94a3b8", fontSize: "12px", lineHeight: "1.5" }}>
                  <div style={{ fontSize: "20px", marginBottom: "6px" }}>🔒</div>
                  <strong>No Accessible Modules</strong>
                  <p style={{ margin: "4px 0 0 0", fontSize: "11px", color: "#64748b" }}>
                    Your role has not been granted access to any modules. Please contact Super Admin.
                  </p>
                </div>
              )}

              {!isCollapsed && mainModules.length > 0 && <div className="nav-section">Main</div>}
              {mainModules.map((m) => {
                const IconComponent = typeof m.icon === "function" ? m.icon : null;
                return (
                  <NavLink
                    key={m.key}
                    to={m.path}
                    className={({ isActive }) => (isActive ? "active" : "")}
                    title={isCollapsed ? m.label : accessLabel(role, m.key)}
                  >
                    <span className="ic">
                      {IconComponent ? <IconComponent /> : m.icon}
                    </span>
                    {!isCollapsed && (
                      <span className="nav-text">
                        <span className="lbl">{m.label}</span>
                      </span>
                    )}
                  </NavLink>
                );
              })}

              {navGroups.map((g) => (
                <Fragment key={g.title}>
                  {!isCollapsed && <div className="nav-section">{g.title}</div>}
                  {g.items.map((m) => {
                    const IconComponent = typeof m.icon === "function" ? m.icon : null;
                    return (
                      <NavLink
                        key={m.key}
                        to={m.path}
                        className={({ isActive }) => (isActive ? "active" : "")}
                        title={isCollapsed ? m.label : accessLabel(role, m.key)}
                      >
                        <span className="ic">
                          {IconComponent ? <IconComponent /> : m.icon}
                        </span>
                        {!isCollapsed && (
                          <span className="nav-text">
                            <span className="lbl">{m.label}</span>
                          </span>
                        )}
                      </NavLink>
                    );
                  })}
                </Fragment>
              ))}

              {/* BOTTOM NAVIGATION MODULES (Shifted Profile to Bottom) */}
              {bottomModules.length > 0 && (
                <>
                  {!isCollapsed && <div className="nav-section" style={{ marginTop: "12px" }}>Account</div>}
                  {bottomModules.map((m) => {
                    const IconComponent = typeof m.icon === "function" ? m.icon : null;
                    return (
                      <NavLink
                        key={m.key}
                        to={m.path}
                        className={({ isActive }) => (isActive ? "active" : "")}
                        title={isCollapsed ? m.label : accessLabel(role, m.key)}
                      >
                        <span className="ic">
                          {IconComponent ? <IconComponent /> : m.icon}
                        </span>
                        {!isCollapsed && (
                          <span className="nav-text">
                            <span className="lbl">{m.label}</span>
                          </span>
                        )}
                      </NavLink>
                    );
                  })}
                </>
              )}
            </>
          )}
        </nav>

        {/* BOTTOM LOG OUT PILL BUTTON & PROFILE FOOTER */}
        <div className="sidebar-bottom-action">
          {/* PROFILE IN SIDEDASHBOARD FOOTER */}
          <div
            className={`sidebar-user-footer ${location.pathname === "/profile" ? "active" : ""}`}
            onClick={() => navigate("/profile")}
            style={{
              cursor: "pointer",
              borderRadius: "12px",
              padding: "6px 8px",
              background: location.pathname === "/profile" ? "rgba(99, 102, 241, 0.14)" : "transparent",
              border: location.pathname === "/profile" ? "1px solid rgba(99, 102, 241, 0.35)" : "1px solid transparent",
              transition: "all 0.15s ease",
            }}
            title={isHkRole ? "Housekeeper Profile (Click to View & Edit)" : "Click to View & Edit Admin Profile"}
          >
            <div style={{ position: "relative", flexShrink: 0 }}>
              <div
                style={{
                  width: "38px",
                  height: "38px",
                  borderRadius: "50%",
                  background: isHkRole ? "linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)" : "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)",
                  color: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "15px",
                  fontWeight: "700",
                  boxShadow: "0 2px 8px rgba(99, 102, 241, 0.25)",
                }}
              >
                {(isHkRole ? hkDisplayName : (userProfile?.name || getUserName() || "A"))[0]?.toUpperCase() || "U"}
              </div>
              <span
                className="sidebar-online-dot"
                style={{
                  background: isHkRole ? (hkPunchStatus === "Checked In" ? "#10b981" : "#94a3b8") : "#10b981",
                  boxShadow: isHkRole ? (hkPunchStatus === "Checked In" ? "0 0 6px #10b981" : "none") : "0 0 6px #10b981",
                }}
              />
            </div>

            {!isCollapsed && (
              <div className="sidebar-footer-info">
                {isHkRole ? (
                  <>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <h4 className="sidebar-footer-name" style={{ margin: 0, fontSize: "13.5px" }}>{hkDisplayName}</h4>
                      <span style={{ fontSize: "9px", fontWeight: "800", background: "#ede9fe", color: "#7c3aed", padding: "1px 5px", borderRadius: "4px" }}>
                        {hkStaffId}
                      </span>
                    </div>
                    <span className="sidebar-footer-role" style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "10.5px" }}>
                      <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: hkPunchStatus === "Checked In" ? "#10b981" : "#94a3b8", display: "inline-block" }} />
                      {hkPunchStatus === "Checked In" ? "Checked In" : "Housekeeping"}
                    </span>
                  </>
                ) : (
                  <>
                    <h4 className="sidebar-footer-name">{userProfile?.name || getUserName() || "Super Admin"}</h4>
                    <span className="sidebar-footer-role">{roleInfo.label}</span>
                  </>
                )}
              </div>
            )}
          </div>

          <button
            type="button"
            className="sidebar-logout-pill"
            onClick={handleLogout}
            title="Logout"
          >
            <LogoutIcon size={18} />
            {!isCollapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      <main
        className="content"
        style={{
          paddingTop: "0px",
        }}
      >
        {/* UNIFIED TOPBAR HEADER FOR ALL PAGES WITH DARK / LIGHT MODE TOGGLE */}
        <header className="travl-topbar-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 0 20px" }}>
          {/* MOBILE HAMBURGER BUTTON */}
          <button
            className="mobile-hamburger-btn"
            type="button"
            onClick={() => setIsMobileOpen((prev) => !prev)}
            title="Toggle Navigation Menu"
          >
            <FaBars />
          </button>



          <div className="travl-topbar-right" style={{ display: "flex", alignItems: "center", gap: "14px", marginLeft: "auto" }}>

            {/* ORGANIZATION BRANCH BADGE (Hidden for housekeeping) */}
            {currentOrg && role !== "housekeeping" && (
              <div style={{ display: "flex", alignItems: "center", gap: "8px", background: theme === "dark" ? "#1e293b" : "#f1f5f9", padding: "6px 12px", borderRadius: "12px", border: theme === "dark" ? "1px solid #334155" : "1px solid #cbd5e1" }}>
                <span style={{ fontSize: "12.5px", fontWeight: "700", color: theme === "dark" ? "#e2e8f0" : "#1e293b" }}>{currentOrg}</span>
                <span style={{ fontSize: "11px", fontWeight: "800", background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)", color: "#ffffff", padding: "2px 8px", borderRadius: "999px" }}>{currentOrgId || "AJ01"}</span>
              </div>
            )}
            {/* DARK / LIGHT MODE TOGGLE BUTTON */}
            <button
              className="travl-circle-btn"
              type="button"
              title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
              onClick={toggleTheme}
            >
              {theme === "dark" ? (
                <FaSun style={{ color: "#f59e0b", fontSize: "16px" }} />
              ) : (
                <FaMoon style={{ color: "#64748b", fontSize: "15px" }} />
              )}
            </button>

            {/* SETTINGS BUTTON */}
            {role !== "housekeeping" && (
              <button
                className="travl-circle-btn"
                type="button"
                title="Settings"
                onClick={() => navigate("/settings")}
              >
                <FaCog />
              </button>
            )}

            {/* NOTIFICATION BELL BUTTON (HIDDEN FOR HOUSEKEEPING ROLE) */}
            {role !== "housekeeping" && (
              <div style={{ position: "relative" }}>
                <button
                  className="travl-circle-btn"
                  type="button"
                  style={{ position: "relative" }}
                  title={`Notifications (${unreadNotifCount} unread)`}
                  onClick={() => {
                    setShowNotifications((prev) => !prev);
                    setShowQueries(false);
                  }}
                >
                  <FaBell />
                  {unreadNotifCount > 0 && (
                    <span
                      style={{
                        position: "absolute",
                        top: "-3px",
                        right: "-3px",
                        width: "18px",
                        height: "18px",
                        borderRadius: "50%",
                        background: "#fee2e2",
                        color: "#dc2626",
                        fontSize: "11px",
                        fontWeight: "800",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        border: "1.5px solid #ffffff",
                        boxShadow: "0 2px 6px rgba(220, 38, 38, 0.2)",
                        lineHeight: "1",
                      }}
                    >
                      {unreadNotifCount}
                    </span>
                  )}
                </button>

                {/* NOTIFICATION DRAWER POPUP */}
                {showNotifications && (
                  <NotificationDrawer onClose={() => setShowNotifications(false)} />
                )}
              </div>
            )}

            {/* WEBSITE CUSTOMER QUERIES QUESTION MARK BUTTON (RIGHT NEXT TO NOTIFICATION BELL) */}
            {role !== "housekeeping" && (
              <div style={{ position: "relative" }}>
                <button
                  className="travl-circle-btn"
                  type="button"
                  style={{ position: "relative" }}
                  title={`Customer Queries (${unreadQueryCount} new)`}
                  onClick={() => {
                    setShowQueries((prev) => !prev);
                    setShowNotifications(false);
                  }}
                >
                  <FaQuestion />
                  {unreadQueryCount > 0 && (
                    <span
                      style={{
                        position: "absolute",
                        top: "-3px",
                        right: "-3px",
                        width: "18px",
                        height: "18px",
                        borderRadius: "50%",
                        background: "#fee2e2",
                        color: "#dc2626",
                        fontSize: "11px",
                        fontWeight: "800",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        border: "1.5px solid #ffffff",
                        boxShadow: "0 2px 6px rgba(220, 38, 38, 0.2)",
                        lineHeight: "1",
                      }}
                    >
                      {unreadQueryCount}
                    </span>
                  )}
                </button>

                {/* QUERIES POPUP DRAWER */}
                {showQueries && (
                  <QueryDrawer
                    queries={queriesList}
                    theme={theme}
                    onClose={() => setShowQueries(false)}
                    onMarkRead={handleMarkQueryRead}
                    onDelete={handleDeleteQuery}
                  />
                )}
              </div>
            )}

            {/* + BOOK NOW BUTTON */}
            {!needsOrgSelection && role !== "housekeeping" && (
              <button
                type="button"
                onClick={handleOpenGlobalBookModal}
                style={{
                  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  color: "#ffffff",
                  height: "40px",
                  padding: "0 20px",
                  borderRadius: "12px",
                  fontSize: "13.5px",
                  fontWeight: "700",
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  boxShadow: "0 4px 14px rgba(102, 126, 234, 0.35)",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-1px)";
                  e.currentTarget.style.boxShadow = "0 6px 18px rgba(102, 126, 234, 0.45)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 4px 14px rgba(102, 126, 234, 0.35)";
                }}
                title="Create New Booking"
              >
                <FaPlus style={{ fontSize: "12px" }} /> Book Now
              </button>
            )}
          </div>
        </header>

        <div className="page">
          <Outlet context={{ theme }} />
        </div>
      </main>

      {/* GLOBAL TOPBAR BOOK ROOM MODAL */}
      {isGlobalBookModalOpen && globalSelectedRoom && (
        <BookRoomModal
          room={globalSelectedRoom}
          availableRooms={globalAvailableRooms}
          onRoomChange={(room) => setGlobalSelectedRoom(room)}
          isOpen={isGlobalBookModalOpen}
          onClose={() => setIsGlobalBookModalOpen(false)}
          onConfirm={handleConfirmGlobalBooking}
        />
      )}

      {/* 5-SECOND REAL-TIME BOOKING POPUP CARD MATCHING PROJECT BUTTON BRAND GRADIENT (#667eea -> #764ba2) */}
      {bookingToast && (() => {
        const isToastDark = theme === "dark";
        const toastBg = isToastDark ? "#1e293b" : "#ffffff";
        const toastBorder = isToastDark ? "1px solid #334155" : "1px solid #e2e8f0";
        const toastShadow = isToastDark
          ? "0 12px 32px rgba(0, 0, 0, 0.45), 0 0 0 1px rgba(255, 255, 255, 0.05)"
          : "0 12px 32px rgba(102, 126, 234, 0.15), 0 4px 12px rgba(0, 0, 0, 0.04)";
        const titleColor = isToastDark ? "#ffffff" : "#0f172a";
        const descColor = isToastDark ? "#cbd5e1" : "#475569";
        const timeColor = isToastDark ? "#94a3b8" : "#94a3b8";
        const brandColor = isToastDark ? "#a78bfa" : "#667eea";
        const iconBg = "linear-gradient(135deg, #667eea 0%, #764ba2 100%)";
        const closeColor = isToastDark ? "#94a3b8" : "#94a3b8";
        const unreadTint = isToastDark ? "rgba(102, 126, 234, 0.14)" : "rgba(102, 126, 234, 0.04)";
        const priceColor = isToastDark ? "#34d399" : "#059669";

        const roomStr = bookingToast.roomName || (bookingToast.roomNumber ? `Room ${bookingToast.roomNumber}` : "Room");
        const guestStr = bookingToast.guestName || "Guest User";
        const amountStr = Number(bookingToast.amountPaid || bookingToast.totalBill || 2500).toLocaleString("en-IN");

        const handleToastClick = (e) => {
          // If clicked close button, do not navigate
          if (e.target.closest("button")) return;
          setBookingToast(null);

          // Find matching room in store and navigate
          try {
            const rooms = getRooms() || [];
            const rNumStr = String(bookingToast.roomNumber || "").toLowerCase();
            const rNameStr = String(bookingToast.roomName || "").toLowerCase();
            const matched = rooms.find((r) => {
              const rNum = String(r.number || r.roomNumber || r.id || "").toLowerCase();
              const rName = String(r.name || r.roomTitle || "").toLowerCase();
              return (rNumStr && rNum === rNumStr) || (rNameStr && rName.includes(rNameStr));
            });

            if (matched) {
              navigate(`/rooms/${matched.id}`);
              return;
            }
          } catch (err) { }
          navigate("/rooms");
        };

        return (
          <div
            onClick={handleToastClick}
            style={{
              position: "fixed",
              top: "28px",
              right: "28px",
              zIndex: 99999,
              width: "360px",
              maxWidth: "90vw",
              background: `linear-gradient(0deg, ${unreadTint}, ${unreadTint}), ${toastBg}`,
              borderRadius: "16px",
              padding: "16px 18px",
              boxShadow: toastShadow,
              border: toastBorder,
              animation: "slideInDown 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards",
              overflow: "hidden",
              fontFamily: "'Inter', 'Jost', sans-serif",
              cursor: "pointer",
            }}
          >
            <div style={{ display: "flex", alignItems: "flex-start", gap: "14px", position: "relative" }}>
              {/* Project Primary Button Gradient Bell Icon Circle */}
              <div
                style={{
                  width: "42px",
                  height: "42px",
                  borderRadius: "50%",
                  background: iconBg,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#ffffff",
                  fontSize: "18px",
                  flexShrink: 0,
                  boxShadow: "0 4px 14px rgba(102, 126, 234, 0.45)",
                }}
              >
                <FaBell />
              </div>

              {/* Center Content: Title & Subtitle details */}
              <div style={{ flex: 1, paddingRight: "20px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "3px" }}>
                  <h4
                    style={{
                      margin: 0,
                      fontSize: "14px",
                      fontWeight: "800",
                      color: titleColor,
                      lineHeight: "1.3",
                    }}
                  >
                    New Booking
                  </h4>
                  {/* Notification Unread Pulse Badge Dot - Project Theme Color */}
                  <span
                    style={{
                      width: "8px",
                      height: "8px",
                      borderRadius: "50%",
                      background: brandColor,
                      boxShadow: "0 0 6px rgba(102, 126, 234, 0.8)",
                      display: "inline-block",
                    }}
                  />
                </div>
                <p
                  style={{
                    margin: "0 0 4px 0",
                    fontSize: "12.5px",
                    fontWeight: "500",
                    color: descColor,
                    lineHeight: "1.4",
                  }}
                >
                  New room booking received: <strong style={{ color: titleColor, fontWeight: "700" }}>{guestStr}</strong> booked <strong style={{ color: brandColor, fontWeight: "700" }}>{roomStr}</strong> <span style={{ color: priceColor, fontWeight: "700" }}>(₹{amountStr})</span>.
                </p>
                <span style={{ fontSize: "11px", fontWeight: "600", color: timeColor }}>
                  Just Now • Website Booking
                </span>
              </div>

              {/* Top-Right Close Icon */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setBookingToast(null);
                }}
                title="Dismiss"
                style={{
                  position: "absolute",
                  top: "-2px",
                  right: "-2px",
                  background: "transparent",
                  border: "none",
                  color: closeColor,
                  cursor: "pointer",
                  fontSize: "14px",
                  padding: "4px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  lineHeight: "1",
                }}
              >
                ✕
              </button>
            </div>

            {/* Bottom 5-Second Animated Progress Bar with Project Button Gradient */}
            <div
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                height: "3px",
                background: isToastDark ? "rgba(255, 255, 255, 0.08)" : "#f1f5f9",
              }}
            >
              <div
                style={{
                  height: "100%",
                  background: "linear-gradient(90deg, #667eea 0%, #764ba2 100%)",
                  width: "100%",
                  animation: "bookingToastProgress 5s linear forwards",
                }}
              />
            </div>
          </div>
        );
      })()}

      {/* NEW CUSTOMER QUERY TOAST POPUP CARD (AUTODISAPPEARS IN 5 SECONDS) */}
      {queryToast && (() => {
        const isToastDark = theme === "dark";
        const toastBg = isToastDark ? "#1e293b" : "#ffffff";
        const toastBorder = isToastDark ? "1px solid #334155" : "1px solid #e2e8f0";
        const titleColor = isToastDark ? "#f8fafc" : "#0f172a";
        const descColor = isToastDark ? "#cbd5e1" : "#475569";
        const timeColor = isToastDark ? "#94a3b8" : "#64748b";
        const closeColor = isToastDark ? "#94a3b8" : "#94a3b8";

        const fullName = queryToast.first_name || queryToast.last_name
          ? `${queryToast.first_name || ""} ${queryToast.last_name || ""}`.trim()
          : "Website Guest";
        const subj = queryToast.subject || "Tour & Guide Packages";
        const msgSnippet = queryToast.message || "New customer inquiry received.";

        return (
          <div
            key={queryToast.key}
            onClick={() => {
              setQueryToast(null);
              navigate("/queries");
            }}
            style={{
              position: "fixed",
              bottom: "28px",
              right: "28px",
              zIndex: 999999,
              width: "420px",
              maxWidth: "calc(100vw - 32px)",
              background: toastBg,
              border: toastBorder,
              borderRadius: "18px",
              padding: "16px 20px 18px 20px",
              boxShadow: isToastDark
                ? "0 20px 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.06)"
                : "0 20px 40px rgba(124, 58, 237, 0.2), 0 4px 16px rgba(0,0,0,0.06)",
              cursor: "pointer",
              animation: "slideInRight 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards",
              overflow: "hidden",
              fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
            }}
          >
            <div style={{ display: "flex", alignItems: "flex-start", gap: "14px", position: "relative" }}>
              {/* Icon Badge */}
              <div
                style={{
                  width: "42px",
                  height: "42px",
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #7c3aed 0%, #6366f1 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#ffffff",
                  fontSize: "18px",
                  flexShrink: 0,
                  boxShadow: "0 4px 14px rgba(124, 58, 237, 0.4)",
                }}
              >
                <FaEnvelope />
              </div>

              {/* Content */}
              <div style={{ flex: 1, paddingRight: "20px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "3px" }}>
                  <h4
                    style={{
                      margin: 0,
                      fontSize: "14px",
                      fontWeight: "800",
                      color: titleColor,
                      lineHeight: "1.3",
                    }}
                  >
                    New Customer Query
                  </h4>
                  <span
                    style={{
                      width: "8px",
                      height: "8px",
                      borderRadius: "50%",
                      background: "#7c3aed",
                      boxShadow: "0 0 6px rgba(124, 58, 237, 0.8)",
                      display: "inline-block",
                    }}
                  />
                </div>

                <p
                  style={{
                    margin: "0 0 4px 0",
                    fontSize: "12.5px",
                    fontWeight: "500",
                    color: descColor,
                    lineHeight: "1.4",
                  }}
                >
                  Inquiry from <strong style={{ color: titleColor, fontWeight: "700" }}>{fullName}</strong> regarding <strong style={{ color: "#6366f1", fontWeight: "700" }}>{subj}</strong>: "{msgSnippet}"
                </p>

                <span style={{ fontSize: "11px", fontWeight: "600", color: timeColor }}>
                  Just Now • Auto Disappears in 5s
                </span>
              </div>

              {/* Dismiss Button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setQueryToast(null);
                }}
                title="Dismiss"
                style={{
                  position: "absolute",
                  top: "-2px",
                  right: "-2px",
                  background: "transparent",
                  border: "none",
                  color: closeColor,
                  cursor: "pointer",
                  fontSize: "14px",
                  padding: "4px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  lineHeight: "1",
                }}
              >
                ✕
              </button>
            </div>

            {/* 5-Second Animated Progress Bar */}
            <div
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                height: "3px",
                background: isToastDark ? "rgba(255, 255, 255, 0.08)" : "#f1f5f9",
              }}
            >
              <div
                style={{
                  height: "100%",
                  background: "linear-gradient(90deg, #7c3aed 0%, #6366f1 100%)",
                  width: "100%",
                  animation: "bookingToastProgress 5s linear forwards",
                }}
              />
            </div>
          </div>
        );
      })()}
    </div>
  );
}

function formatTimeAgo(dateStr) {
  if (!dateStr) return "2 min ago";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "2 min ago";
  const diffInSeconds = Math.floor((new Date() - date) / 1000);

  if (diffInSeconds < 30) return "Just now";
  if (diffInSeconds < 60) return `${diffInSeconds} sec ago`;
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes} min ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours} hr${diffInHours > 1 ? "s" : ""} ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) return `${diffInDays} day${diffInDays > 1 ? "s" : ""} ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function QueryDrawer({ queries, theme, onClose, onMarkRead, onDelete }) {
  const navigate = useNavigate();
  const isDark = theme === "dark";
  const bg = isDark ? "#1e293b" : "#ffffff";
  const border = isDark ? "1px solid #334155" : "1px solid #f1f5f9";
  const textColor = isDark ? "#f8fafc" : "#0f172a";
  const subColor = isDark ? "#94a3b8" : "#64748b";

  // Pastel icon theme presets matching the reference UI
  const pastelThemes = [
    { bg: isDark ? "rgba(124, 58, 237, 0.15)" : "#f3e8ff", color: "#7c3aed", icon: <FaBell /> },
    { bg: isDark ? "rgba(225, 29, 72, 0.15)" : "#ffe4e6", color: "#e11d48", icon: <FaExclamationTriangle /> },
    { bg: isDark ? "rgba(217, 119, 6, 0.15)" : "#fef3c7", color: "#d97706", icon: <FaCog /> },
    { bg: isDark ? "rgba(22, 163, 74, 0.15)" : "#dcfce7", color: "#16a34a", icon: <FaBullhorn /> },
    { bg: isDark ? "rgba(37, 99, 235, 0.15)" : "#dbeafe", color: "#2563eb", icon: <FaEnvelope /> },
  ];

  const handleOpenQueriesPage = () => {
    onClose();
    navigate("/queries");
  };

  return (
    <div
      style={{
        position: "absolute",
        top: "54px",
        right: "0px",
        width: "430px",
        maxWidth: "92vw",
        maxHeight: "560px",
        background: bg,
        border: border,
        borderRadius: "20px",
        boxShadow: isDark
          ? "0 20px 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.05)"
          : "0 20px 40px rgba(0, 0, 0, 0.08), 0 4px 16px rgba(0, 0, 0, 0.04)",
        zIndex: 99999,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
        animation: "slideInDown 0.25s ease-out forwards",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "20px 24px 16px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: isDark ? "1px solid #334155" : "1px solid #f1f5f9",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <h3
            style={{
              margin: 0,
              fontSize: "19px",
              fontWeight: "700",
              color: textColor,
              letterSpacing: "-0.3px",
            }}
          >
            Customer Queries
          </h3>
          {queries.length > 0 && (
            <span
              style={{
                fontSize: "11px",
                fontWeight: "700",
                background: isDark ? "rgba(37, 99, 235, 0.2)" : "#eff6ff",
                color: "#2563eb",
                padding: "2px 8px",
                borderRadius: "99px",
              }}
            >
              {queries.length}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          title="Close"
          style={{
            background: isDark ? "#334155" : "#f1f5f9",
            border: "none",
            borderRadius: "50%",
            width: "32px",
            height: "32px",
            color: subColor,
            fontSize: "15px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.15s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = isDark ? "#475569" : "#e2e8f0";
            e.currentTarget.style.color = textColor;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = isDark ? "#334155" : "#f1f5f9";
            e.currentTarget.style.color = subColor;
          }}
        >
          ✕
        </button>
      </div>

      {/* Query List */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        {queries.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "50px 20px",
              color: subColor,
              fontSize: "14px",
            }}
          >
            <FaQuestionCircle
              style={{
                fontSize: "36px",
                color: isDark ? "#334155" : "#cbd5e1",
                marginBottom: "12px",
                display: "block",
                margin: "0 auto 12px",
              }}
            />
            No customer inquiries found.
          </div>
        ) : (
          queries.map((q, idx) => {
            const isUnread = !q.status || q.status === "New" || q.status === "Unread";
            const themePreset = pastelThemes[idx % pastelThemes.length];
            const timeAgoStr = formatTimeAgo(q.created_at);

            return (
              <div
                key={q.id}
                onClick={handleOpenQueriesPage}
                style={{
                  padding: "16px 24px",
                  display: "flex",
                  gap: "16px",
                  alignItems: "flex-start",
                  borderBottom: isDark ? "1px solid #334155" : "1px solid #f1f5f9",
                  background: isUnread
                    ? isDark
                      ? "rgba(37, 99, 235, 0.08)"
                      : "#fafafa"
                    : "transparent",
                  transition: "background 0.2s ease",
                  position: "relative",
                  cursor: "pointer",
                }}
              >
                {/* Left Pastel Square Icon */}
                <div
                  style={{
                    width: "44px",
                    height: "44px",
                    borderRadius: "14px",
                    background: themePreset.bg,
                    color: themePreset.color,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "18px",
                    flexShrink: 0,
                  }}
                >
                  {themePreset.icon}
                </div>

                {/* Middle Content Section */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "8px",
                    }}
                  >
                    <h4
                      style={{
                        margin: 0,
                        fontSize: "15px",
                        fontWeight: "600",
                        color: textColor,
                        lineHeight: "1.3",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {q.first_name || q.last_name
                        ? `${q.first_name || ""} ${q.last_name || ""}`.trim()
                        : "New Query Received"}
                    </h4>
                    <span
                      style={{
                        fontSize: "13px",
                        color: "#94a3b8",
                        fontWeight: "400",
                        flexShrink: 0,
                      }}
                    >
                      {timeAgoStr}
                    </span>
                  </div>

                  {/* Single Line Message Preview (1 row = one line) */}
                  <p
                    style={{
                      margin: "3px 0 0 0",
                      fontSize: "13.5px",
                      color: subColor,
                      lineHeight: "1.4",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {q.subject ? (
                      <strong style={{ color: textColor, fontWeight: "600" }}>
                        {q.subject}:{" "}
                      </strong>
                    ) : null}
                    {q.message || "A new customer query was submitted."}
                  </p>

                  {/* Contact details & Action buttons */}
                  <div
                    style={{
                      marginTop: "8px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      fontSize: "12px",
                      color: subColor,
                    }}
                  >
                    <div style={{ display: "flex", gap: "10px", minWidth: 0 }}>
                      {q.email && (
                        <a
                          href={`mailto:${q.email}`}
                          title={q.email}
                          onClick={(e) => e.stopPropagation()}
                          style={{
                            color: "#6366f1",
                            textDecoration: "none",
                            fontWeight: "500",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                            maxWidth: "130px",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          <FaEnvelope style={{ flexShrink: 0 }} /> {q.email}
                        </a>
                      )}
                      {q.phone && (
                        <a
                          href={`tel:${q.phone}`}
                          title={q.phone}
                          onClick={(e) => e.stopPropagation()}
                          style={{
                            color: "#10b981",
                            textDecoration: "none",
                            fontWeight: "500",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                            whiteSpace: "nowrap",
                          }}
                        >
                          <FaPhone style={{ flexShrink: 0 }} /> {q.phone}
                        </a>
                      )}
                    </div>

                    {/* Tick Mark Icon & Trash Bin Icon */}
                    <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                      {isUnread && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onMarkRead(q.id);
                          }}
                          title="Mark as Read"
                          style={{
                            background: isDark ? "rgba(16, 185, 129, 0.15)" : "#dcfce7",
                            border: isDark ? "1px solid rgba(16, 185, 129, 0.3)" : "1px solid #bbf7d0",
                            color: "#10b981",
                            width: "32px",
                            height: "32px",
                            borderRadius: "10px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "14px",
                            cursor: "pointer",
                            transition: "all 0.15s ease",
                            boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                          }}
                        >
                          <FaCheckCircle />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(q.id);
                        }}
                        title="Delete Query"
                        style={{
                          background: isDark ? "rgba(239, 68, 68, 0.18)" : "#ffe4e6",
                          border: "none",
                          color: "#ef4444",
                          width: "36px",
                          height: "36px",
                          borderRadius: "10px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "15px",
                          cursor: "pointer",
                          transition: "all 0.15s ease",
                        }}
                      >
                        <FaTrash />
                      </button>

                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer Link */}
      <div
        style={{
          padding: "16px 24px",
          textAlign: "center",
          borderTop: isDark ? "1px solid #334155" : "1px solid #f1f5f9",
          background: bg,
        }}
      >
        <button
          type="button"
          onClick={handleOpenQueriesPage}
          style={{
            background: "none",
            border: "none",
            color: "#6366f1",
            fontSize: "15px",
            fontWeight: "700",
            cursor: "pointer",
            transition: "opacity 0.2s ease",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.8")}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
        >
          View All Customer Queries
        </button>
      </div>
    </div>
  );
}
