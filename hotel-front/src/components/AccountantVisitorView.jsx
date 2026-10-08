import { useState, useEffect, useCallback, useMemo } from "react";
import {
  FaUsers,
  FaUserCheck,
  FaWalking,
  FaSignOutAlt,
  FaUserClock,
  FaCalendarCheck,
  FaSearch,
  FaCalendarAlt,
  FaBuilding,
  FaPlus,
  FaSyncAlt,
  FaPhoneAlt,
  FaTimes,
  FaClock,
  FaBed,
  FaLayerGroup,
  FaRupeeSign,
  FaMoneyBillWave,
  FaCalendarDay,
  FaSun,
  FaDownload,
} from "react-icons/fa";
import { getCurrentOrg, getCurrentOrgId, getUserRole } from "../auth.js";
import { showSuccess, showError, showInfo, showWarning } from "../utils/toast.js";

const API_BASE = "http://localhost:4000/api/visitors";

export default function AccountantVisitorView({ isSuperAdmin: propIsSuperAdmin }) {
  const currentRole = getUserRole();
  const isSuperAdmin = propIsSuperAdmin ?? (currentRole === "super_admin");

  // Branch auto-scoping strictly for the logged-in accountant's organization or selectable for super admin
  const [sessionOrgName, setSessionOrgName] = useState(() => isSuperAdmin ? "All Branches" : (getCurrentOrg() || "Ajmer Branch"));
  const [sessionOrgId, setSessionOrgId] = useState(() => isSuperAdmin ? "ALL" : (getCurrentOrgId() || "AJ01"));
  const [branchesList, setBranchesList] = useState([
    { orgId: "ALL", name: "All Branches", location: "Global" },
    { orgId: "AJ01", name: "Ajmer Branch", location: "Ajmer" },
    { orgId: "JP01", name: "Jaipur Branch", location: "Jaipur" },
    { orgId: "MA330", name: "Matcha Tea", location: "Mumbai" },
    { orgId: "CH560", name: "Cheery Clothing", location: "Delhi" },
    { orgId: "AS435", name: "Ashirwad", location: "Udaipur" },
  ]);

  // Fetch real branches from DB if available
  useEffect(() => {
    fetch(`${API_BASE}/branches`, { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        if (data && data.success && Array.isArray(data.branches) && data.branches.length > 0) {
          const list = isSuperAdmin 
            ? [{ orgId: "ALL", name: "All Branches", location: "All Locations" }, ...data.branches]
            : data.branches;
          setBranchesList(list);
        }
      })
      .catch(() => {});
  }, [isSuperAdmin]);

  useEffect(() => {
    if (!isSuperAdmin) {
      const handleOrgSync = () => {
        setSessionOrgName(getCurrentOrg() || "Ajmer Branch");
        setSessionOrgId(getCurrentOrgId() || "AJ01");
      };
      window.addEventListener("storage", handleOrgSync);
      window.addEventListener("current_org_changed", handleOrgSync);
      return () => {
        window.removeEventListener("storage", handleOrgSync);
        window.removeEventListener("current_org_changed", handleOrgSync);
      };
    }
  }, [isSuperAdmin]);

  // Light / Dark mode theme state
  const [isDark, setIsDark] = useState(
    () => typeof document !== "undefined" && document.documentElement.getAttribute("data-theme") === "dark"
  );

  useEffect(() => {
    if (typeof document === "undefined") return;
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.getAttribute("data-theme") === "dark");
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    return () => observer.disconnect();
  }, []);

  // Filter state (Year, Month, Day, Date, Search)
  const [yearFilter, setYearFilter] = useState("2026");
  const [monthFilter, setMonthFilter] = useState("9");
  const [dayFilter, setDayFilter] = useState("ALL"); // "ALL" or "1"-"31"
  const [dateFilter, setDateFilter] = useState(""); // When Today button is clicked, set to current date
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Data loaded from backend
  const [visitors, setVisitors] = useState([]);
  const [stats, setStats] = useState({
    totalVisitors: 0,
    totalIncome: 0,
    todayVisitors: 0,
    todayIncome: 0,
    currentlyInside: 0,
    checkedOut: 0,
    expectedVisitors: 0,
    totalVisitsThisMonth: 0,
    totalIncomeThisMonth: 0,
  });

  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newVisitor, setNewVisitor] = useState({
    name: "",
    phone: "",
    roomNumber: "101",
    floor: "1st Floor",
    amountPaid: 2000,
    orgId: sessionOrgId,
    orgName: sessionOrgName,
    status: "Checked-In",
    visitDate: new Date().toISOString().split("T")[0],
    notes: "",
  });

  // Today shortcut trigger
  const handleSelectToday = () => {
    const today = new Date();
    const currentYear = String(today.getFullYear());
    const currentMonth = String(today.getMonth() + 1);
    const currentDay = String(today.getDate());
    const todayFormatted = today.toISOString().split("T")[0];

    setYearFilter(currentYear);
    setMonthFilter(currentMonth);
    setDayFilter(currentDay);
    setDateFilter(todayFormatted);
    showInfo(`Filtered for Today (${todayFormatted})`);
  };

  const isTodaySelected = useMemo(() => {
    const today = new Date();
    return (
      dateFilter === today.toISOString().split("T")[0] ||
      (yearFilter === String(today.getFullYear()) &&
        monthFilter === String(today.getMonth() + 1) &&
        dayFilter === String(today.getDate()))
    );
  }, [dateFilter, yearFilter, monthFilter, dayFilter]);

  // Format currency helper
  const formatCurrency = (amt) => {
    return "₹" + Number(amt || 0).toLocaleString("en-IN");
  };

  // Fetch visitors & dynamic stats strictly for current accountant's branch
  const fetchVisitorsData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (dateFilter && dateFilter.trim() !== "") {
        params.append("date", dateFilter);
      } else {
        if (yearFilter && yearFilter !== "ALL") params.append("year", yearFilter);
        if (monthFilter && monthFilter !== "ALL") params.append("month", monthFilter);
        if (dayFilter && dayFilter !== "ALL") params.append("day", dayFilter);
      }

      if (sessionOrgId) params.append("orgId", sessionOrgId);
      if (sessionOrgName) params.append("branch", sessionOrgName);
      if (statusFilter && statusFilter !== "ALL") params.append("status", statusFilter);
      if (searchQuery && searchQuery.trim() !== "") params.append("search", searchQuery.trim());

      const res = await fetch(`${API_BASE}?${params.toString()}`, { credentials: "include" });
      const data = await res.json();

      if (data.success) {
        setVisitors(data.visitors || []);
        setStats(
          data.stats || {
            totalVisitors: 0,
            totalIncome: 0,
            todayVisitors: 0,
            todayIncome: 0,
            currentlyInside: 0,
            checkedOut: 0,
            expectedVisitors: 0,
            totalVisitsThisMonth: 0,
            totalIncomeThisMonth: 0,
          }
        );
      } else {
        showError(data.error || "Failed to load visitor records.");
      }
    } catch (err) {
      console.error("Error fetching visitor data:", err);
      showError("Connection error. Could not fetch visitor records.");
    } finally {
      setLoading(false);
    }
  }, [yearFilter, monthFilter, dayFilter, dateFilter, sessionOrgId, sessionOrgName, statusFilter, searchQuery]);

  useEffect(() => {
    fetchVisitorsData();
  }, [fetchVisitorsData]);

  // Handle register new visitor
  const handleAddVisitor = async (e) => {
    e.preventDefault();
    if (!newVisitor.name.trim() || !newVisitor.phone.trim()) {
      showError("Please fill in visitor name and phone number.");
      return;
    }

    try {
      const payload = {
        ...newVisitor,
        amountPaid: Number(newVisitor.amountPaid) || 0,
        orgId: sessionOrgId,
        orgName: sessionOrgName,
      };

      const res = await fetch(API_BASE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "include",
      });
      const data = await res.json();

      if (data.success) {
        showSuccess("Visitor registered successfully!");
        setShowAddModal(false);
        setNewVisitor({
          name: "",
          phone: "",
          roomNumber: "101",
          floor: "1st Floor",
          amountPaid: 2000,
          orgId: sessionOrgId,
          orgName: sessionOrgName,
          status: "Checked-In",
          visitDate: new Date().toISOString().split("T")[0],
          notes: "",
        });
        fetchVisitorsData();
      } else {
        showError(data.error || "Failed to register visitor.");
      }
    } catch (err) {
      showError("Network error. Could not register visitor.");
    }
  };

  // Export visitor & income records to CSV / Excel format & sync with Chatrix
  const handleExportVisitorData = () => {
    if (!visitors || visitors.length === 0) {
      showWarning("No visitor records available to export for current filter.");
      return;
    }

    try {
      const now = new Date();
      const isoDateStr = now.toISOString().split("T")[0];
      const formattedDate = now.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
      const timeStr = now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true });

      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const monthLabel = monthFilter === "ALL" ? "All" : monthNames[Number(monthFilter) - 1] || monthFilter;

      // 1. Prepare Structured Real Export Payload with unique ID & exact timestamp
      const exportPayload = {
        id: `VIS-EXP-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        branch: sessionOrgName || "Ajmer Branch",
        orgId: sessionOrgId || "AJ01",
        date: isoDateStr,
        time: timeStr,
        formattedDate: formattedDate,
        formattedTime: timeStr,
        timestamp: Date.now(),
        filters: {
          today: isTodaySelected,
          year: yearFilter || "2026",
          month: monthLabel || "Sep",
          day: dayFilter || "All",
          status: statusFilter || "ALL",
        },
        stats: {
          totalIncome: Number(stats.totalIncome) || 0,
          totalVisitors: Number(stats.totalVisitors) || visitors.length,
          todayVisitors: Number(stats.todayVisitors) || 0,
          todayIncome: Number(stats.todayIncome) || 0,
          currentlyInside: Number(stats.currentlyInside) || 0,
          checkedOut: Number(stats.checkedOut) || 0,
          expectedVisitors: Number(stats.expectedVisitors) || 0,
          totalVisitsThisMonth: Number(stats.totalVisitsThisMonth) || 0,
          totalIncomeThisMonth: Number(stats.totalIncomeThisMonth) || 0,
        },
        visitors: visitors.map((v, index) => ({
          id: v.id || index + 1,
          name: v.name || "Guest Visitor",
          phone: v.phone || "N/A",
          roomNumber: v.roomNumber || "101",
          floor: v.floor || "1st Floor",
          amountPaid: Number(v.amountPaid) || 0,
          checkIn: v.checkIn || (v.visitDate ? `${v.visitDate} 10:30 AM` : "10:30 AM"),
          checkOut: v.checkOut || (v.status === "Checked-Out" ? "06:45 PM" : "—"),
          status: v.status || "Checked-In",
          visitDate: v.visitDate || isoDateStr,
          notes: v.notes || "",
          orgName: v.orgName || sessionOrgName,
          orgId: v.orgId || sessionOrgId,
        })),
        exportedBy: sessionStorage.getItem("userName") || localStorage.getItem("userName") || "Accountant Desk",
      };

      // 2. Prepend to multi-entry export history in LocalStorage
      try {
        const storedExports = JSON.parse(localStorage.getItem("hotel_chatrix_visitor_income_exports") || "[]");
        const updatedExports = [exportPayload, ...storedExports];
        localStorage.setItem("hotel_chatrix_visitor_income_exports", JSON.stringify(updatedExports));
        localStorage.setItem("hotel_latest_exported_visitor_income", JSON.stringify(exportPayload));
      } catch (e) {
        console.error("Storage sync error:", e);
      }

      // 3. Dispatch Live Cross-Component Events
      window.dispatchEvent(new CustomEvent("accountant_visitor_income_exported", { detail: exportPayload }));
      window.dispatchEvent(new Event("storage"));

      // 4. Generate & Trigger CSV Download
      let csv = `HOTEL VISITOR & REVENUE AUDIT REPORT\n`;
      csv += `Branch,"${sessionOrgName} (${sessionOrgId})",Export Date,"${formattedDate} ${timeStr}",Filter Scope,"Year: ${yearFilter} | Month: ${monthLabel} | Day: ${dayFilter} | Status: ${statusFilter}"\n`;
      csv += `Total Records,${visitors.length},Total Revenue Collected,₹${stats.totalIncome || 0},Checked-In Now,${stats.currentlyInside || 0},Checked-Out,${stats.checkedOut || 0},Expected,${stats.expectedVisitors || 0}\n\n`;
      
      csv += `Sr No,Visitor ID,Visitor Name,Phone Number,Room Number,Floor,Amount Paid (₹),Check-In Time,Check-Out Time,Visit Date,Status,Organization / Branch,Notes\n`;

      visitors.forEach((v, index) => {
        const cleanName = (v.name || "").replace(/"/g, '""');
        const cleanPhone = (v.phone || "").replace(/"/g, '""');
        const cleanRoom = (v.roomNumber || "").replace(/"/g, '""');
        const cleanFloor = (v.floor || "").replace(/"/g, '""');
        const amount = Number(v.amountPaid) || 0;
        const cleanCheckIn = (v.checkIn || "").replace(/"/g, '""');
        const cleanCheckOut = (v.checkOut || "").replace(/"/g, '""');
        const cleanDate = (v.visitDate || "").replace(/"/g, '""');
        const cleanStatus = (v.status || "").replace(/"/g, '""');
        const cleanBranch = (v.orgName || sessionOrgName || "").replace(/"/g, '""');
        const cleanNotes = (v.notes || "").replace(/"/g, '""');

        csv += `${index + 1},"VIS-${v.id || index + 1}","${cleanName}","${cleanPhone}","${cleanRoom}","${cleanFloor}",${amount},"${cleanCheckIn}","${cleanCheckOut}","${cleanDate}","${cleanStatus}","${cleanBranch}","${cleanNotes}"\n`;
      });

      csv += `\n,,,TOTAL AMOUNT PAID,,,₹${stats.totalIncome || 0},,,,,,\n`;

      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `visitors_and_income_${(sessionOrgName || "branch").toLowerCase().replace(/[^a-z0-9]/g, "_")}_${dateStr}.csv`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      showSuccess(`Exported & synced ${visitors.length} visitor record${visitors.length > 1 ? "s" : ""} with Super Admin Chatrix!`);
    } catch (err) {
      console.error("Export error:", err);
      showError("Failed to export visitor data.");
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "Checked-In":
        return (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "5px",
              background: "#dcfce7",
              color: "#166534",
              padding: "3px 10px",
              borderRadius: "20px",
              fontSize: "12px",
              fontWeight: "700",
              border: "1px solid #86efac",
            }}
          >
            <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#22c55e", display: "inline-block" }}></span>
            Checked-In
          </span>
        );
      case "Checked-Out":
        return (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "5px",
              background: "#f1f5f9",
              color: "#475569",
              padding: "3px 10px",
              borderRadius: "20px",
              fontSize: "12px",
              fontWeight: "700",
              border: "1px solid #cbd5e1",
            }}
          >
            <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#64748b", display: "inline-block" }}></span>
            Checked-Out
          </span>
        );
      case "Expected":
        return (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "5px",
              background: "#eff6ff",
              color: "#1d4ed8",
              padding: "3px 10px",
              borderRadius: "20px",
              fontSize: "12px",
              fontWeight: "700",
              border: "1px solid #bfdbfe",
            }}
          >
            <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#3b82f6", display: "inline-block" }}></span>
            Expected
          </span>
        );
      case "Cancelled":
        return (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "5px",
              background: "#fee2e2",
              color: "#991b1b",
              padding: "3px 10px",
              borderRadius: "20px",
              fontSize: "12px",
              fontWeight: "700",
              border: "1px solid #fca5a5",
            }}
          >
            <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#ef4444", display: "inline-block" }}></span>
            Cancelled
          </span>
        );
      default:
        return (
          <span style={{ background: "#f8fafc", color: "#64748b", padding: "3px 10px", borderRadius: "20px", fontSize: "12px" }}>
            {status}
          </span>
        );
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "18px", color: isDark ? "#f1f5f9" : "#1e293b" }}>
      {/* CSS KEYFRAMES FOR SMOOTH LOOP TRANSITIONS */}
      <style>{`
        @keyframes vCardFloatPulse {
          0% {
            transform: translateY(0px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
          }
          50% {
            transform: translateY(-3px);
            box-shadow: 0 8px 18px rgba(147, 51, 234, 0.28);
          }
          100% {
            transform: translateY(0px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
          }
        }
        @keyframes vCardFloatPulseDark {
          0% {
            transform: translateY(0px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
          }
          50% {
            transform: translateY(-3px);
            box-shadow: 0 8px 20px rgba(192, 132, 252, 0.35);
          }
          100% {
            transform: translateY(0px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
          }
        }
        .v-kpi-1 { animation: ${isDark ? "vCardFloatPulseDark" : "vCardFloatPulse"} 3.2s ease-in-out infinite; }
        .v-kpi-2 { animation: ${isDark ? "vCardFloatPulseDark" : "vCardFloatPulse"} 3.2s ease-in-out 0.4s infinite; }
        .v-kpi-3 { animation: ${isDark ? "vCardFloatPulseDark" : "vCardFloatPulse"} 3.2s ease-in-out 0.8s infinite; }
        .v-kpi-4 { animation: ${isDark ? "vCardFloatPulseDark" : "vCardFloatPulse"} 3.2s ease-in-out 1.2s infinite; }
        .v-kpi-5 { animation: ${isDark ? "vCardFloatPulseDark" : "vCardFloatPulse"} 3.2s ease-in-out 1.6s infinite; }
        .v-kpi-6 { animation: ${isDark ? "vCardFloatPulseDark" : "vCardFloatPulse"} 3.2s ease-in-out 2.0s infinite; }
        .v-kpi-7 { animation: ${isDark ? "vCardFloatPulseDark" : "vCardFloatPulse"} 3.2s ease-in-out 2.4s infinite; }

        @keyframes exportBtnGlow {
          0%, 100% {
            box-shadow: 0 4px 16px rgba(245, 158, 11, 0.5), 0 0 0 0 rgba(251, 191, 36, 0.4);
          }
          50% {
            box-shadow: 0 8px 24px rgba(245, 158, 11, 0.75), 0 0 18px 3px rgba(251, 191, 36, 0.65);
          }
        }

        .export-data-btn {
          display: inline-flex;
          align-items: center;
          gap: 9px;
          padding: 10px 22px;
          background: linear-gradient(135deg, #f59e0b 0%, #ea580c 55%, #c2410c 100%);
          border: 2px solid #fde047;
          border-radius: 12px;
          color: #ffffff;
          font-size: 14.5px;
          font-weight: 900;
          letter-spacing: 0.4px;
          cursor: pointer;
          position: relative;
          overflow: hidden;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.35);
          box-shadow: 0 4px 18px rgba(245, 158, 11, 0.55);
          transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
          animation: exportBtnGlow 3.2s ease-in-out infinite;
          margin-left: 6px;
        }

        .export-data-btn:hover {
          transform: translateY(-3px) scale(1.05);
          background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #ea580c 100%);
          border-color: #ffffff;
          box-shadow: 0 10px 28px rgba(245, 158, 11, 0.8), 0 0 22px rgba(251, 191, 36, 0.75);
        }

        .export-data-btn:active {
          transform: translateY(1px) scale(0.97);
          box-shadow: 0 2px 10px rgba(245, 158, 11, 0.45);
        }

        .export-data-btn .export-icon {
          font-size: 16px;
          filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.35));
          transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .export-data-btn:hover .export-icon {
          transform: translateY(3px) scale(1.22);
        }
      `}</style>

      {/* ========================================================================= */}
      {/* ALL-IN-ONE PURPLE BANNER WITH TITLE, TODAY/DAY/MONTH/YEAR FILTERS & KPI CARDS */}
      {/* ========================================================================= */}
      <div
        style={{
          background: isDark
            ? "linear-gradient(135deg, #190d2e 0%, #290d59 50%, #380860 100%)"
            : "linear-gradient(135deg, #581c87 0%, #6b21a8 50%, #7c3aed 100%)",
          borderRadius: "16px",
          padding: "16px 20px",
          border: isDark ? "1px solid rgba(192, 132, 252, 0.35)" : "1px solid rgba(168, 85, 247, 0.4)",
          boxShadow: isDark
            ? "0 8px 24px rgba(0, 0, 0, 0.55), 0 0 20px rgba(168, 85, 247, 0.2)"
            : "0 10px 24px rgba(107, 33, 168, 0.22)",
          display: "flex",
          flexDirection: "column",
          gap: "14px",
        }}
      >
        {/* BANNER HEADER: TITLE & EASY FILTERS (TODAY, YEAR, MONTH, DAY, REFRESH, NEW ENTRY) */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "12px",
            borderBottom: "1px solid rgba(255, 255, 255, 0.15)",
            paddingBottom: "12px",
          }}
        >
          {/* TITLE & BRANCH NAME */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span
                style={{
                  width: "30px",
                  height: "30px",
                  borderRadius: "8px",
                  background: "rgba(255, 255, 255, 0.18)",
                  color: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "15px",
                  boxShadow: "0 2px 6px rgba(0, 0, 0, 0.2)",
                }}
              >
                👥
              </span>
              <h1 style={{ margin: 0, fontSize: "19px", fontWeight: "900", color: "#ffffff", letterSpacing: "0.2px" }}>
                Visitors & Income
              </h1>
            </div>
            {isSuperAdmin ? (
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "4px" }}>
                <span style={{ fontSize: "12px", color: "rgba(233, 213, 255, 0.95)", fontWeight: "700" }}>
                  🏢 Branch Filter:
                </span>
                <select
                  value={sessionOrgId}
                  onChange={(e) => {
                    const selId = e.target.value;
                    const b = branchesList.find((x) => x.orgId === selId);
                    setSessionOrgId(selId);
                    setSessionOrgName(b ? b.name : selId);
                  }}
                  style={{
                    background: "rgba(255, 255, 255, 0.22)",
                    backdropFilter: "blur(8px)",
                    border: "1px solid rgba(255, 255, 255, 0.35)",
                    borderRadius: "6px",
                    color: "#ffffff",
                    fontSize: "12px",
                    fontWeight: "800",
                    padding: "2px 8px",
                    cursor: "pointer",
                    outline: "none",
                  }}
                >
                  {branchesList.map((b) => (
                    <option key={b.orgId} value={b.orgId} style={{ background: "#3b0764", color: "#ffffff" }}>
                      {b.name} ({b.orgId})
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <p style={{ margin: "2px 0 0 0", fontSize: "12px", color: "rgba(233, 213, 255, 0.92)", fontWeight: "600" }}>
                Visitor Management & Revenue Logs — {sessionOrgName} ({sessionOrgId})
              </p>
            )}
          </div>

          {/* INTEGRATED EASY FILTERS & BUTTONS */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
            {/* 🌟 TODAY FILTER BUTTON */}
            <button
              onClick={handleSelectToday}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                padding: "5px 12px",
                background: isTodaySelected ? "#22c55e" : "rgba(255, 255, 255, 0.14)",
                backdropFilter: "blur(8px)",
                border: isTodaySelected ? "1px solid #86efac" : "1px solid rgba(255, 255, 255, 0.25)",
                borderRadius: "8px",
                color: "#ffffff",
                fontSize: "12px",
                fontWeight: "800",
                cursor: "pointer",
                boxShadow: isTodaySelected ? "0 2px 10px rgba(34, 197, 94, 0.4)" : "none",
                transition: "all 0.15s ease",
              }}
              title="Filter visitors who arrived today"
            >
              <FaSun size={11} style={{ color: isTodaySelected ? "#ffffff" : "#fde047" }} /> Today
            </button>

            {/* YEAR SELECTOR */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "5px",
                background: "rgba(255, 255, 255, 0.12)",
                backdropFilter: "blur(8px)",
                padding: "5px 10px",
                borderRadius: "8px",
                border: "1px solid rgba(255, 255, 255, 0.22)",
              }}
            >
              <FaClock style={{ color: "#d8b4fe", fontSize: "11px" }} />
              <span style={{ fontSize: "11px", fontWeight: "700", color: "#f3e8ff" }}>Year:</span>
              <select
                value={yearFilter}
                onChange={(e) => {
                  setYearFilter(e.target.value);
                  setDateFilter("");
                }}
                style={{
                  background: "transparent",
                  border: "none",
                  fontWeight: "800",
                  color: "#ffffff",
                  fontSize: "12px",
                  outline: "none",
                  cursor: "pointer",
                }}
              >
                <option value="ALL" style={{ color: "#111827", background: "#ffffff" }}>All</option>
                <option value="2026" style={{ color: "#111827", background: "#ffffff" }}>2026</option>
                <option value="2025" style={{ color: "#111827", background: "#ffffff" }}>2025</option>
                <option value="2024" style={{ color: "#111827", background: "#ffffff" }}>2024</option>
              </select>
            </div>

            {/* MONTH SELECTOR */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "5px",
                background: "rgba(255, 255, 255, 0.12)",
                backdropFilter: "blur(8px)",
                padding: "5px 10px",
                borderRadius: "8px",
                border: "1px solid rgba(255, 255, 255, 0.22)",
              }}
            >
              <FaCalendarAlt style={{ color: "#d8b4fe", fontSize: "11px" }} />
              <span style={{ fontSize: "11px", fontWeight: "700", color: "#f3e8ff" }}>Month:</span>
              <select
                value={monthFilter}
                onChange={(e) => {
                  setMonthFilter(e.target.value);
                  setDateFilter("");
                }}
                style={{
                  background: "transparent",
                  border: "none",
                  fontWeight: "800",
                  color: "#ffffff",
                  fontSize: "12px",
                  outline: "none",
                  cursor: "pointer",
                }}
              >
                <option value="ALL" style={{ color: "#111827", background: "#ffffff" }}>All</option>
                <option value="1" style={{ color: "#111827", background: "#ffffff" }}>Jan</option>
                <option value="2" style={{ color: "#111827", background: "#ffffff" }}>Feb</option>
                <option value="3" style={{ color: "#111827", background: "#ffffff" }}>Mar</option>
                <option value="4" style={{ color: "#111827", background: "#ffffff" }}>Apr</option>
                <option value="5" style={{ color: "#111827", background: "#ffffff" }}>May</option>
                <option value="6" style={{ color: "#111827", background: "#ffffff" }}>Jun</option>
                <option value="7" style={{ color: "#111827", background: "#ffffff" }}>Jul</option>
                <option value="8" style={{ color: "#111827", background: "#ffffff" }}>Aug</option>
                <option value="9" style={{ color: "#111827", background: "#ffffff" }}>Sep</option>
                <option value="10" style={{ color: "#111827", background: "#ffffff" }}>Oct</option>
                <option value="11" style={{ color: "#111827", background: "#ffffff" }}>Nov</option>
                <option value="12" style={{ color: "#111827", background: "#ffffff" }}>Dec</option>
              </select>
            </div>

            {/* DAY SELECTOR */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "5px",
                background: "rgba(255, 255, 255, 0.12)",
                backdropFilter: "blur(8px)",
                padding: "5px 10px",
                borderRadius: "8px",
                border: "1px solid rgba(255, 255, 255, 0.22)",
              }}
            >
              <FaCalendarDay style={{ color: "#d8b4fe", fontSize: "11px" }} />
              <span style={{ fontSize: "11px", fontWeight: "700", color: "#f3e8ff" }}>Day:</span>
              <select
                value={dayFilter}
                onChange={(e) => {
                  setDayFilter(e.target.value);
                  setDateFilter("");
                }}
                style={{
                  background: "transparent",
                  border: "none",
                  fontWeight: "800",
                  color: "#ffffff",
                  fontSize: "12px",
                  outline: "none",
                  cursor: "pointer",
                }}
              >
                <option value="ALL" style={{ color: "#111827", background: "#ffffff" }}>All</option>
                {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                  <option key={d} value={String(d)} style={{ color: "#111827", background: "#ffffff" }}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            {/* REFRESH BUTTON */}
            <button
              onClick={() => {
                fetchVisitorsData();
                showInfo("Visitor & income data refreshed from database");
              }}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                padding: "6px 12px",
                background: "rgba(255, 255, 255, 0.18)",
                backdropFilter: "blur(8px)",
                border: "1px solid rgba(255, 255, 255, 0.3)",
                borderRadius: "8px",
                color: "#ffffff",
                fontSize: "12px",
                fontWeight: "700",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255, 255, 255, 0.28)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255, 255, 255, 0.18)")}
            >
              <FaSyncAlt size={11} className={loading ? "fa-spin" : ""} /> Refresh
            </button>

            {/* NEW VISITOR ENTRY BUTTON */}
            <button
              onClick={() => setShowAddModal(true)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 16px",
                background: "#ffffff",
                border: "none",
                borderRadius: "10px",
                color: "#6b21a8",
                fontSize: "13px",
                fontWeight: "800",
                cursor: "pointer",
                boxShadow: "0 3px 10px rgba(0, 0, 0, 0.2)",
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-1px)")}
              onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0px)")}
            >
              <FaPlus size={11} /> New Visitor
            </button>

            {/* EXPORT DATA BUTTON (PROMINENT FAR RIGHT CORNER PLACEMENT + ENLARGED) */}
            <button
              className="export-data-btn"
              onClick={handleExportVisitorData}
              title="Export all filtered visitor & income records to CSV / Excel"
            >
              <FaDownload className="export-icon" />
              <span>Export Data</span>
            </button>
          </div>
        </div>

        {/* 7 VISITOR & INCOME OVERVIEW CARDS INSIDE THE BANNER */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(145px, 1fr))",
            gap: "10px",
          }}
        >
          {/* Card 1: Total Visitor Income */}
          <div
            className="v-kpi-1"
            style={{
              background: isDark
                ? "linear-gradient(135deg, rgba(20, 45, 30, 0.9) 0%, rgba(30, 70, 45, 0.9) 100%)"
                : "linear-gradient(135deg, #ffffff 0%, #ecfdf5 100%)",
              borderRadius: "12px",
              padding: "12px 14px",
              border: isDark ? "1px solid rgba(52, 211, 153, 0.45)" : "1px solid rgba(167, 243, 208, 0.9)",
              display: "flex",
              flexDirection: "column",
              gap: "4px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "11px", fontWeight: "700", color: isDark ? "#6ee7b7" : "#047857" }}>
                Total Income
              </span>
              <span style={{ fontSize: "15px" }}>💰</span>
            </div>
            <div style={{ fontSize: "20px", fontWeight: "900", color: isDark ? "#ffffff" : "#065f46", lineHeight: 1.1 }}>
              {formatCurrency(stats.totalIncome)}
            </div>
            <div style={{ fontSize: "10.5px", color: isDark ? "#6ee7b7" : "#059669", fontWeight: "600" }}>
              Total Paid by Visitors
            </div>
          </div>

          {/* Card 2: Total Visitors */}
          <div
            className="v-kpi-2"
            style={{
              background: isDark
                ? "linear-gradient(135deg, rgba(30, 20, 50, 0.9) 0%, rgba(45, 20, 75, 0.9) 100%)"
                : "linear-gradient(135deg, #ffffff 0%, #faf5ff 100%)",
              borderRadius: "12px",
              padding: "12px 14px",
              border: isDark ? "1px solid rgba(192, 132, 252, 0.35)" : "1px solid rgba(233, 213, 255, 0.9)",
              display: "flex",
              flexDirection: "column",
              gap: "4px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "11px", fontWeight: "700", color: isDark ? "#c084fc" : "#7e22ce" }}>
                Total Visitors
              </span>
              <span style={{ fontSize: "15px" }}>👥</span>
            </div>
            <div style={{ fontSize: "20px", fontWeight: "900", color: isDark ? "#ffffff" : "#581c87", lineHeight: 1.1 }}>
              {stats.totalVisitors}
            </div>
            <div style={{ fontSize: "10.5px", color: isDark ? "#d8b4fe" : "#9333ea", fontWeight: "600" }}>
              Filter Records Count
            </div>
          </div>

          {/* Card 3: Today's Visitors */}
          <div
            className="v-kpi-3"
            style={{
              background: isDark
                ? "linear-gradient(135deg, rgba(15, 35, 25, 0.9) 0%, rgba(20, 50, 35, 0.9) 100%)"
                : "linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%)",
              borderRadius: "12px",
              padding: "12px 14px",
              border: isDark ? "1px solid rgba(74, 222, 128, 0.35)" : "1px solid rgba(187, 247, 208, 0.9)",
              display: "flex",
              flexDirection: "column",
              gap: "4px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "11px", fontWeight: "700", color: isDark ? "#86efac" : "#15803d" }}>
                Today's Visitors
              </span>
              <span style={{ fontSize: "15px" }}>✓</span>
            </div>
            <div style={{ fontSize: "20px", fontWeight: "900", color: isDark ? "#ffffff" : "#14532d", lineHeight: 1.1 }}>
              {stats.todayVisitors}
            </div>
            <div style={{ fontSize: "10.5px", color: isDark ? "#86efac" : "#16a34a", fontWeight: "600" }}>
              Today: {formatCurrency(stats.todayIncome)}
            </div>
          </div>

          {/* Card 4: Currently Inside */}
          <div
            className="v-kpi-4"
            style={{
              background: isDark
                ? "linear-gradient(135deg, rgba(15, 30, 60, 0.9) 0%, rgba(20, 45, 90, 0.9) 100%)"
                : "linear-gradient(135deg, #ffffff 0%, #eff6ff 100%)",
              borderRadius: "12px",
              padding: "12px 14px",
              border: isDark ? "1px solid rgba(96, 165, 250, 0.35)" : "1px solid rgba(191, 219, 254, 0.9)",
              display: "flex",
              flexDirection: "column",
              gap: "4px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "11px", fontWeight: "700", color: isDark ? "#93c5fd" : "#1d4ed8" }}>
                Currently Inside
              </span>
              <span style={{ fontSize: "15px" }}>🚶</span>
            </div>
            <div style={{ fontSize: "20px", fontWeight: "900", color: isDark ? "#ffffff" : "#1e3a8a", lineHeight: 1.1 }}>
              {stats.currentlyInside}
            </div>
            <div style={{ fontSize: "10.5px", color: isDark ? "#93c5fd" : "#2563eb", fontWeight: "600" }}>
              Active on Premises
            </div>
          </div>

          {/* Card 5: Checked-Out */}
          <div
            className="v-kpi-5"
            style={{
              background: isDark
                ? "linear-gradient(135deg, rgba(30, 35, 45, 0.9) 0%, rgba(40, 48, 60, 0.9) 100%)"
                : "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
              borderRadius: "12px",
              padding: "12px 14px",
              border: isDark ? "1px solid rgba(148, 163, 184, 0.35)" : "1px solid rgba(203, 213, 225, 0.9)",
              display: "flex",
              flexDirection: "column",
              gap: "4px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "11px", fontWeight: "700", color: isDark ? "#cbd5e1" : "#475569" }}>
                Checked-Out
              </span>
              <span style={{ fontSize: "15px" }}>🚪</span>
            </div>
            <div style={{ fontSize: "20px", fontWeight: "900", color: isDark ? "#ffffff" : "#1e293b", lineHeight: 1.1 }}>
              {stats.checkedOut}
            </div>
            <div style={{ fontSize: "10.5px", color: isDark ? "#cbd5e1" : "#64748b", fontWeight: "600" }}>
              Completed Visits
            </div>
          </div>

          {/* Card 6: Expected Visitors */}
          <div
            className="v-kpi-6"
            style={{
              background: isDark
                ? "linear-gradient(135deg, rgba(45, 30, 15, 0.9) 0%, rgba(65, 40, 20, 0.9) 100%)"
                : "linear-gradient(135deg, #ffffff 0%, #fffbeb 100%)",
              borderRadius: "12px",
              padding: "12px 14px",
              border: isDark ? "1px solid rgba(251, 191, 36, 0.35)" : "1px solid rgba(253, 230, 138, 0.9)",
              display: "flex",
              flexDirection: "column",
              gap: "4px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "11px", fontWeight: "700", color: isDark ? "#fcd34d" : "#b45309" }}>
                Expected Visitors
              </span>
              <span style={{ fontSize: "15px" }}>⏳</span>
            </div>
            <div style={{ fontSize: "20px", fontWeight: "900", color: isDark ? "#ffffff" : "#78350f", lineHeight: 1.1 }}>
              {stats.expectedVisitors}
            </div>
            <div style={{ fontSize: "10.5px", color: isDark ? "#fcd34d" : "#d97706", fontWeight: "600" }}>
              Upcoming Scheduled
            </div>
          </div>

          {/* Card 7: Visits This Month */}
          <div
            className="v-kpi-7"
            style={{
              background: isDark
                ? "linear-gradient(135deg, rgba(40, 15, 45, 0.9) 0%, rgba(60, 20, 70, 0.9) 100%)"
                : "linear-gradient(135deg, #ffffff 0%, #fdf4ff 100%)",
              borderRadius: "12px",
              padding: "12px 14px",
              border: isDark ? "1px solid rgba(232, 121, 249, 0.35)" : "1px solid rgba(245, 208, 254, 0.9)",
              display: "flex",
              flexDirection: "column",
              gap: "4px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "11px", fontWeight: "700", color: isDark ? "#f0abfc" : "#a21caf" }}>
                Monthly Visits
              </span>
              <span style={{ fontSize: "15px" }}>📅</span>
            </div>
            <div style={{ fontSize: "20px", fontWeight: "900", color: isDark ? "#ffffff" : "#701a75", lineHeight: 1.1 }}>
              {stats.totalVisitsThisMonth}
            </div>
            <div style={{ fontSize: "10.5px", color: isDark ? "#f0abfc" : "#c026d3", fontWeight: "600" }}>
              Month: {formatCurrency(stats.totalIncomeThisMonth)}
            </div>
          </div>
        </div>
      </div>

      {/* QUICK STATUS BAR & SEARCH ABOVE TABLE */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "10px",
        }}
      >
        {/* Status Filter Tabs */}
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          {["ALL", "Expected", "Checked-In", "Checked-Out", "Cancelled"].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              style={{
                padding: "5px 12px",
                borderRadius: "8px",
                border: statusFilter === st ? "none" : isDark ? "1px solid #374151" : "1px solid #cbd5e1",
                background:
                  statusFilter === st
                    ? "linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)"
                    : isDark
                    ? "#1e293b"
                    : "#f8fafc",
                color: statusFilter === st ? "#ffffff" : isDark ? "#cbd5e1" : "#475569",
                fontSize: "12px",
                fontWeight: "700",
                cursor: "pointer",
                boxShadow: statusFilter === st ? "0 2px 8px rgba(124, 58, 237, 0.25)" : "none",
              }}
            >
              {st === "ALL" ? "All Visitors" : st}
            </button>
          ))}
        </div>

        {/* Search Visitor Box */}
        <div style={{ position: "relative", minWidth: "260px" }}>
          <FaSearch
            style={{
              position: "absolute",
              left: "10px",
              top: "50%",
              transform: "translateY(-50%)",
              color: "#94a3b8",
              fontSize: "12px",
            }}
          />
          <input
            type="text"
            placeholder="Search visitor by name, phone, room..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: "100%",
              padding: "6px 12px 6px 30px",
              borderRadius: "8px",
              border: isDark ? "1px solid #374151" : "1px solid #cbd5e1",
              background: isDark ? "#1e293b" : "#ffffff",
              color: isDark ? "#f1f5f9" : "#0f172a",
              fontSize: "12.5px",
              outline: "none",
              boxSizing: "border-box",
            }}
          />
        </div>
      </div>

      {/* VISITOR TABLE (Includes Amount Paid Column) */}
      <div
        style={{
          background: isDark ? "#1e293b" : "#ffffff",
          borderRadius: "14px",
          border: isDark ? "1px solid #334155" : "1px solid #e2e8f0",
          boxShadow: isDark ? "0 4px 16px rgba(0, 0, 0, 0.3)" : "0 4px 16px rgba(0, 0, 0, 0.04)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "14px 18px",
            borderBottom: isDark ? "1px solid #334155" : "1px solid #e2e8f0",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            background: isDark ? "#0f172a" : "#f8fafc",
            flexWrap: "wrap",
            gap: "10px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <FaUsers style={{ color: "#7c3aed" }} />
            <span style={{ fontSize: "14px", fontWeight: "800", color: isDark ? "#ffffff" : "#0f172a" }}>
              Visitor Records — {sessionOrgName}
            </span>
            <span
              style={{
                fontSize: "11px",
                fontWeight: "700",
                background: "#ede9fe",
                color: "#6d28d9",
                padding: "2px 8px",
                borderRadius: "12px",
              }}
            >
              {visitors.length} Records
            </span>
            <span
              style={{
                fontSize: "11px",
                fontWeight: "700",
                background: "#dcfce7",
                color: "#166534",
                padding: "2px 8px",
                borderRadius: "12px",
              }}
            >
              Total: {formatCurrency(stats.totalIncome)}
            </span>
          </div>

          <div style={{ fontSize: "11.5px", color: isDark ? "#94a3b8" : "#64748b", fontWeight: "600" }}>
            Direct MySQL Database Sync
          </div>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "12.5px" }}>
            <thead>
              <tr style={{ background: isDark ? "#111827" : "#f1f5f9", borderBottom: isDark ? "2px solid #374151" : "2px solid #cbd5e1" }}>
                <th style={{ padding: "11px 14px", fontWeight: "700", color: isDark ? "#cbd5e1" : "#475569" }}>Visitor Name</th>
                <th style={{ padding: "11px 14px", fontWeight: "700", color: isDark ? "#cbd5e1" : "#475569" }}>Phone</th>
                <th style={{ padding: "11px 14px", fontWeight: "700", color: isDark ? "#cbd5e1" : "#475569" }}>Room Number</th>
                <th style={{ padding: "11px 14px", fontWeight: "700", color: isDark ? "#cbd5e1" : "#475569" }}>Floor</th>
                <th style={{ padding: "11px 14px", fontWeight: "700", color: isDark ? "#cbd5e1" : "#475569" }}>Amount Paid</th>
                <th style={{ padding: "11px 14px", fontWeight: "700", color: isDark ? "#cbd5e1" : "#475569" }}>Check-In</th>
                <th style={{ padding: "11px 14px", fontWeight: "700", color: isDark ? "#cbd5e1" : "#475569" }}>Check-Out</th>
                <th style={{ padding: "11px 14px", fontWeight: "700", color: isDark ? "#cbd5e1" : "#475569" }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} style={{ padding: "36px", textAlign: "center", color: "#64748b" }}>
                    <FaSyncAlt className="fa-spin" style={{ marginRight: "8px", color: "#7c3aed" }} />
                    Loading database records...
                  </td>
                </tr>
              ) : visitors.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: "44px 20px", textAlign: "center", color: "#64748b" }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
                      <FaUsers size={32} style={{ color: "#94a3b8" }} />
                      <div style={{ fontSize: "15px", fontWeight: "700", color: isDark ? "#e2e8f0" : "#334155" }}>No visitors found</div>
                      <div style={{ fontSize: "12px", color: "#94a3b8" }}>
                        There are no visitor records in {sessionOrgName} for the selected period.
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                visitors.map((v) => (
                  <tr
                    key={v.id}
                    style={{
                      borderBottom: isDark ? "1px solid #334155" : "1px solid #f1f5f9",
                      transition: "background 0.15s ease",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = isDark ? "#2d1f4b" : "#fdf4ff")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <td style={{ padding: "12px 14px", fontWeight: "700", color: isDark ? "#ffffff" : "#0f172a" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <div
                          style={{
                            width: "28px",
                            height: "28px",
                            borderRadius: "50%",
                            background: "#ede9fe",
                            color: "#6d28d9",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontWeight: "800",
                            fontSize: "11px",
                          }}
                        >
                          {v.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div>{v.name}</div>
                          <div style={{ fontSize: "10px", color: "#94a3b8", fontWeight: "400" }}>ID: VIS-{v.id}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: "12px 14px", color: isDark ? "#cbd5e1" : "#475569", fontWeight: "600" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                        <FaPhoneAlt size={10} style={{ color: "#94a3b8" }} />
                        {v.phone || "N/A"}
                      </div>
                    </td>
                    <td style={{ padding: "12px 14px", color: isDark ? "#e2e8f0" : "#0f172a", fontWeight: "700" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                        <FaBed size={12} style={{ color: "#7c3aed" }} />
                        <span>Room {v.roomNumber || "101"}</span>
                      </div>
                    </td>
                    <td style={{ padding: "12px 14px", color: isDark ? "#cbd5e1" : "#475569" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                        <FaLayerGroup size={11} style={{ color: "#94a3b8" }} />
                        <span>{v.floor || "1st Floor"}</span>
                      </div>
                    </td>
                    <td style={{ padding: "12px 14px", color: "#16a34a", fontWeight: "800", fontSize: "13px" }}>
                      {formatCurrency(v.amountPaid)}
                    </td>
                    <td style={{ padding: "12px 14px", color: isDark ? "#e2e8f0" : "#334155", fontSize: "11.5px" }}>
                      {v.checkIn ? (
                        <div>
                          <div style={{ fontWeight: "700", color: "#16a34a" }}>{v.checkIn.split(" ")[1] || v.checkIn}</div>
                          <div style={{ fontSize: "10px", color: "#94a3b8" }}>{v.checkIn.split(" ")[0]}</div>
                        </div>
                      ) : (
                        <span style={{ color: "#94a3b8" }}>—</span>
                      )}
                    </td>
                    <td style={{ padding: "12px 14px", color: isDark ? "#e2e8f0" : "#334155", fontSize: "11.5px" }}>
                      {v.checkOut ? (
                        <div>
                          <div style={{ fontWeight: "700", color: isDark ? "#cbd5e1" : "#475569" }}>{v.checkOut.split(" ")[1] || v.checkOut}</div>
                          <div style={{ fontSize: "10px", color: "#94a3b8" }}>{v.checkOut.split(" ")[0]}</div>
                        </div>
                      ) : (
                        <span style={{ color: "#94a3b8" }}>—</span>
                      )}
                    </td>
                    <td style={{ padding: "12px 14px" }}>{getStatusBadge(v.status)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* REGISTER NEW VISITOR MODAL */}
      {showAddModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(15, 23, 42, 0.6)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "20px",
          }}
        >
          <div
            style={{
              background: isDark ? "#1e293b" : "#ffffff",
              borderRadius: "16px",
              maxWidth: "480px",
              width: "100%",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.3)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "16px 20px",
                background: "linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)",
                color: "#ffffff",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <FaUsers size={18} />
                <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "800" }}>Register Visitor — {sessionOrgName}</h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#ffffff",
                  fontSize: "18px",
                  cursor: "pointer",
                }}
              >
                <FaTimes />
              </button>
            </div>

            <form onSubmit={handleAddVisitor} style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "14px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "11.5px", fontWeight: "700", color: isDark ? "#cbd5e1" : "#475569", marginBottom: "4px" }}>
                    Visitor Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Vikram Sharma"
                    value={newVisitor.name}
                    onChange={(e) => setNewVisitor({ ...newVisitor, name: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "7px 10px",
                      borderRadius: "8px",
                      border: isDark ? "1px solid #374151" : "1px solid #cbd5e1",
                      background: isDark ? "#0f172a" : "#ffffff",
                      color: isDark ? "#f1f5f9" : "#0f172a",
                      fontSize: "12.5px",
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "11.5px", fontWeight: "700", color: isDark ? "#cbd5e1" : "#475569", marginBottom: "4px" }}>
                    Phone Number *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="+91 98290 12345"
                    value={newVisitor.phone}
                    onChange={(e) => setNewVisitor({ ...newVisitor, phone: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "7px 10px",
                      borderRadius: "8px",
                      border: isDark ? "1px solid #374151" : "1px solid #cbd5e1",
                      background: isDark ? "#0f172a" : "#ffffff",
                      color: isDark ? "#f1f5f9" : "#0f172a",
                      fontSize: "12.5px",
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "11.5px", fontWeight: "700", color: isDark ? "#cbd5e1" : "#475569", marginBottom: "4px" }}>
                    Room Number *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 101, 204"
                    value={newVisitor.roomNumber}
                    onChange={(e) => setNewVisitor({ ...newVisitor, roomNumber: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "7px 10px",
                      borderRadius: "8px",
                      border: isDark ? "1px solid #374151" : "1px solid #cbd5e1",
                      background: isDark ? "#0f172a" : "#ffffff",
                      color: isDark ? "#f1f5f9" : "#0f172a",
                      fontSize: "12.5px",
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "11.5px", fontWeight: "700", color: isDark ? "#cbd5e1" : "#475569", marginBottom: "4px" }}>
                    Floor *
                  </label>
                  <select
                    value={newVisitor.floor}
                    onChange={(e) => setNewVisitor({ ...newVisitor, floor: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "7px 10px",
                      borderRadius: "8px",
                      border: isDark ? "1px solid #374151" : "1px solid #cbd5e1",
                      background: isDark ? "#0f172a" : "#ffffff",
                      color: isDark ? "#f1f5f9" : "#0f172a",
                      fontSize: "12.5px",
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  >
                    <option value="Ground Floor">Ground Floor</option>
                    <option value="1st Floor">1st Floor</option>
                    <option value="2nd Floor">2nd Floor</option>
                    <option value="3rd Floor">3rd Floor</option>
                    <option value="4th Floor">4th Floor</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "11.5px", fontWeight: "700", color: isDark ? "#cbd5e1" : "#475569", marginBottom: "4px" }}>
                    Amount Paid (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder="e.g. 2000"
                    value={newVisitor.amountPaid}
                    onChange={(e) => setNewVisitor({ ...newVisitor, amountPaid: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "7px 10px",
                      borderRadius: "8px",
                      border: isDark ? "1px solid #374151" : "1px solid #cbd5e1",
                      background: isDark ? "#0f172a" : "#ffffff",
                      color: isDark ? "#f1f5f9" : "#0f172a",
                      fontSize: "12.5px",
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "11.5px", fontWeight: "700", color: isDark ? "#cbd5e1" : "#475569", marginBottom: "4px" }}>
                    Status
                  </label>
                  <select
                    value={newVisitor.status}
                    onChange={(e) => setNewVisitor({ ...newVisitor, status: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "7px 10px",
                      borderRadius: "8px",
                      border: isDark ? "1px solid #374151" : "1px solid #cbd5e1",
                      background: isDark ? "#0f172a" : "#ffffff",
                      color: isDark ? "#f1f5f9" : "#0f172a",
                      fontSize: "12.5px",
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  >
                    <option value="Checked-In">Checked-In (Arrival)</option>
                    <option value="Expected">Expected (Upcoming)</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "11.5px", fontWeight: "700", color: isDark ? "#cbd5e1" : "#475569", marginBottom: "4px" }}>
                  Visit Date
                </label>
                <input
                  type="date"
                  value={newVisitor.visitDate}
                  onChange={(e) => setNewVisitor({ ...newVisitor, visitDate: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "6px 10px",
                    borderRadius: "8px",
                    border: isDark ? "1px solid #374151" : "1px solid #cbd5e1",
                    background: isDark ? "#0f172a" : "#ffffff",
                    color: isDark ? "#f1f5f9" : "#0f172a",
                    fontSize: "12.5px",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "11.5px", fontWeight: "700", color: isDark ? "#cbd5e1" : "#475569", marginBottom: "4px" }}>
                  Additional Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Payment method (Cash/UPI), ID proof details, etc."
                  value={newVisitor.notes}
                  onChange={(e) => setNewVisitor({ ...newVisitor, notes: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "7px 10px",
                    borderRadius: "8px",
                    border: isDark ? "1px solid #374151" : "1px solid #cbd5e1",
                    background: isDark ? "#0f172a" : "#ffffff",
                    color: isDark ? "#f1f5f9" : "#0f172a",
                    fontSize: "12.5px",
                    outline: "none",
                    boxSizing: "border-box",
                    resize: "none",
                  }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "8px" }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  style={{
                    padding: "7px 14px",
                    background: isDark ? "#334155" : "#f1f5f9",
                    border: isDark ? "1px solid #475569" : "1px solid #cbd5e1",
                    borderRadius: "8px",
                    color: isDark ? "#cbd5e1" : "#475569",
                    fontSize: "12px",
                    fontWeight: "600",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: "7px 18px",
                    background: "#7c3aed",
                    border: "none",
                    borderRadius: "8px",
                    color: "#ffffff",
                    fontSize: "12px",
                    fontWeight: "700",
                    cursor: "pointer",
                    boxShadow: "0 3px 10px rgba(124, 58, 237, 0.3)",
                  }}
                >
                  Save & Register
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
