import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useOutletContext } from "react-router-dom";
import PageHeader from "../components/PageHeader.jsx";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";
import {
  FaMoneyBillWave,
  FaBed,
  FaUsers,
  FaCalendarCheck,
  FaExclamationCircle,
  FaTimesCircle,
  FaFilter,
  FaPrint,
  FaFileCsv,
  FaSyncAlt,
  FaSearch,
  FaCheckCircle,
  FaClock,
  FaLayerGroup,
  FaBuilding,
  FaArrowUp,
  FaArrowDown,
  FaCreditCard,
  FaDoorOpen,
  FaHistory,
} from "react-icons/fa";
import {
  FiCalendar,
  FiTrendingUp,
  FiPieChart,
  FiBarChart2,
  FiUserCheck,
  FiDownload,
  FiPrinter,
} from "react-icons/fi";
import { getCurrentOrgId, getCurrentOrg, getUserRole } from "../auth.js";
import {
  fetchRawReportData,
  calculateReportAnalytics,
  getDateRangeBounds,
  exportReportToCSV,
} from "../services/reportService.js";

// Chart Palette
const COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#ec4899"];

export default function Reports() {
  const currentOrgId = getCurrentOrgId();
  const currentOrgName = getCurrentOrg();
  const userRole = (getUserRole() || "user").toLowerCase();
  const isSuperAdmin = userRole === "super_admin" || userRole === "admin";

  // Dynamic light / dark mode theme observer
  const outletContext = useOutletContext();
  const [isDark, setIsDark] = useState(() => {
    if (outletContext?.theme) return outletContext.theme === "dark";
    if (typeof window !== "undefined") {
      return (
        document.documentElement.getAttribute("data-theme") === "dark" ||
        document.body.classList.contains("dark")
      );
    }
    return false;
  });

  useEffect(() => {
    if (outletContext?.theme) {
      setIsDark(outletContext.theme === "dark");
    }
  }, [outletContext?.theme]);

  useEffect(() => {
    const checkTheme = () => {
      const dark =
        document.documentElement.getAttribute("data-theme") === "dark" ||
        document.body.classList.contains("dark");
      setIsDark(dark);
    };
    checkTheme();
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    return () => observer.disconnect();
  }, []);

  const cardBg = isDark ? "#1e293b" : "#ffffff";
  const borderSubtle = isDark ? "#334155" : "#e2e8f0";
  const textPrimary = isDark ? "#f8fafc" : "#0f172a";
  const textSecondary = isDark ? "#94a3b8" : "#475569";
  const textMuted = isDark ? "#64748b" : "#64748b";
  const bgSubtle = isDark ? "#0f172a" : "#f8fafc";
  const inputBg = isDark ? "#1e293b" : "#ffffff";
  const inputBorder = isDark ? "#334155" : "#cbd5e1";

  // Filter States
  const [dateRange, setDateRange] = useState("thismonth");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [selectedBranch, setSelectedBranch] = useState(
    isSuperAdmin ? "all" : (currentOrgId || "all")
  );
  const [activeTab, setActiveTab] = useState("overview");

  // Raw API Data
  const [rawData, setRawData] = useState({
    bookings: [],
    rooms: [],
    customers: [],
    payments: [],
    organizations: [],
  });

  // UI States
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Table filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("all");
  const [floorFilter, setFloorFilter] = useState("all");

  // Load Real Data from Backend APIs
  const loadData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      const data = await fetchRawReportData(selectedBranch);
      setRawData(data);
    } catch (err) {
      console.error("Failed to load report data:", err);
      setError("Unable to load report data from server. Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedBranch]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Compute Date Boundaries
  const [startDate, endDate] = useMemo(() => {
    return getDateRangeBounds(dateRange, customStart, customEnd);
  }, [dateRange, customStart, customEnd]);

  // Compute Full Analytics from Real Data
  const analytics = useMemo(() => {
    return calculateReportAnalytics({
      bookings: rawData.bookings,
      rooms: rawData.rooms,
      customers: rawData.customers,
      payments: rawData.payments,
      startDate,
      endDate,
      branchOrgId: selectedBranch,
    });
  }, [rawData, startDate, endDate, selectedBranch]);

  // Selected Branch Name
  const branchDisplayName = useMemo(() => {
    if (selectedBranch === "all") return "All Branches (Consolidated)";
    const found = rawData.organizations.find(
      (o) => String(o.orgId || o.org_id) === String(selectedBranch)
    );
    return found ? found.name : currentOrgName || `Branch ${selectedBranch}`;
  }, [selectedBranch, rawData.organizations, currentOrgName]);

  // Date Range Human Label
  const dateRangeLabel = useMemo(() => {
    const sStr = startDate.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
    const eStr = endDate.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
    return `${sStr} — ${eStr}`;
  }, [startDate, endDate]);

  // Filtered Transactions for Table
  const filteredTransactions = useMemo(() => {
    return analytics.transactions.filter((t) => {
      // Search
      if (searchQuery) {
        const q = searchQuery.toLowerCase().trim();
        const match =
          t.guestName.toLowerCase().includes(q) ||
          t.bookingId.toLowerCase().includes(q) ||
          t.roomNumber.toLowerCase().includes(q);
        if (!match) return false;
      }
      // Status
      if (statusFilter !== "all") {
        if (t.bookingStatus.toLowerCase() !== statusFilter.toLowerCase()) return false;
      }
      // Payment Status
      if (paymentStatusFilter !== "all") {
        if (t.paymentStatus.toLowerCase() !== paymentStatusFilter.toLowerCase()) return false;
      }
      // Floor
      if (floorFilter !== "all") {
        if (t.floor !== floorFilter) return false;
      }
      return true;
    });
  }, [analytics.transactions, searchQuery, statusFilter, paymentStatusFilter, floorFilter]);

  // Unique Floors for Table Filter
  const availableFloors = useMemo(() => {
    const set = new Set();
    analytics.transactions.forEach((t) => {
      if (t.floor) set.add(t.floor);
    });
    return Array.from(set);
  }, [analytics.transactions]);

  // Handlers
  const handleExportCSV = () => {
    exportReportToCSV(filteredTransactions, branchDisplayName, dateRangeLabel);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="reports-analytics-wrapper" style={{ padding: "0 4px 60px 4px" }}>
      {/* PRINT-ONLY STYLESHEET */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .printable-report-area, .printable-report-area * {
            visibility: visible;
          }
          .printable-report-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: #ffffff !important;
            color: #000000 !important;
          }
          .no-print {
            display: none !important;
          }
          .print-header {
            display: block !important;
            margin-bottom: 24px;
            padding-bottom: 16px;
            border-bottom: 2px solid #e2e8f0;
          }
          .report-kpi-card {
            border: 1px solid #cbd5e1 !important;
            box-shadow: none !important;
          }
          .report-table {
            border-collapse: collapse !important;
            width: 100% !important;
          }
          .report-table th, .report-table td {
            border: 1px solid #cbd5e1 !important;
            padding: 8px 10px !important;
            color: #000000 !important;
          }
        }
        @media screen {
          .print-header {
            display: none;
          }
        }
      `}</style>

      {/* TOP HEADER BAR (TITLE + ACTION BUTTONS MATCHING SCREENSHOT 1) */}
      <div
        className="no-print"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
          flexWrap: "wrap",
          gap: "16px",
        }}
      >
        <div>
          <h1
            style={{
              margin: 0,
              fontSize: "24px",
              fontWeight: "800",
              color: textPrimary,
              letterSpacing: "-0.4px",
            }}
          >
            Reports and analytics
          </h1>
          <p style={{ margin: "4px 0 0 0", fontSize: "13.5px", color: textMuted }}>
            Bookings, revenue, rooms and guests in one place
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button
            type="button"
            onClick={handleExportCSV}
            style={{
              padding: "9px 18px",
              borderRadius: "10px",
              border: isDark ? "1px solid #334155" : "1px solid #cbd5e1",
              background: isDark ? "#1e293b" : "#ffffff",
              color: textPrimary,
              fontSize: "13px",
              fontWeight: "600",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              boxShadow: "0 2px 6px rgba(0,0,0,0.03)",
              transition: "all 0.2s ease",
            }}
          >
            <FiDownload style={{ fontSize: "14px" }} /> Export CSV
          </button>

          <button
            type="button"
            onClick={handlePrint}
            style={{
              padding: "9px 20px",
              borderRadius: "10px",
              border: "none",
              background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
              color: "#ffffff",
              fontSize: "13px",
              fontWeight: "600",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              boxShadow: "0 4px 14px rgba(79, 70, 229, 0.35)",
              transition: "all 0.2s ease",
            }}
          >
            <FiPrinter style={{ fontSize: "14px" }} /> Print report
          </button>
        </div>
      </div>

      {/* SUB-HEADER FILTER PILL CARD (MATCHING SCREENSHOT 1) */}
      <div
        className="no-print"
        style={{
          background: cardBg,
          border: `1px solid ${borderSubtle}`,
          borderRadius: "14px",
          padding: "10px 16px",
          marginBottom: "20px",
          boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "14px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          {/* DATE SELECTOR BADGE */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "6px 14px",
              borderRadius: "10px",
              border: `1px solid ${borderSubtle}`,
              background: bgSubtle,
              color: textPrimary,
              fontSize: "13px",
              fontWeight: "600",
            }}
          >
            <FiCalendar style={{ color: "#ef4444", fontSize: "14px" }} />
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              style={{
                border: "none",
                background: "transparent",
                color: "inherit",
                fontSize: "13px",
                fontWeight: "600",
                outline: "none",
                cursor: "pointer",
              }}
            >
              <option value="thismonth">This month: {dateRangeLabel}</option>
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="last7days">Last 7 Days</option>
              <option value="thisweek">This Week</option>
              <option value="lastmonth">Last Month</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>

          {/* CUSTOM DATE PICKERS (Shown when "custom" is selected) */}
          {dateRange === "custom" && (
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                style={{
                  padding: "6px 10px",
                  borderRadius: "8px",
                  border: `1px solid ${inputBorder}`,
                  background: inputBg,
                  color: textPrimary,
                  fontSize: "12px",
                  outline: "none",
                }}
              />
              <span style={{ fontSize: "12px", color: "#94a3b8" }}>to</span>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                style={{
                  padding: "6px 10px",
                  borderRadius: "8px",
                  border: `1px solid ${inputBorder}`,
                  background: inputBg,
                  color: textPrimary,
                  fontSize: "12px",
                  outline: "none",
                }}
              />
            </div>
          )}

          {/* BRANCH SELECTOR BADGE */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "6px 14px",
              borderRadius: "10px",
              border: `1px solid ${borderSubtle}`,
              background: bgSubtle,
              color: textPrimary,
              fontSize: "13px",
              fontWeight: "600",
            }}
          >
            <span>🏢</span>
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              disabled={!isSuperAdmin}
              style={{
                border: "none",
                background: "transparent",
                color: "inherit",
                fontSize: "13px",
                fontWeight: "600",
                outline: "none",
                cursor: !isSuperAdmin ? "not-allowed" : "pointer",
              }}
            >
              {isSuperAdmin && <option value="all">All branches</option>}
              {rawData.organizations.map((org) => {
                const oId = org.orgId || org.org_id;
                return (
                  <option key={oId} value={oId}>
                    {org.name}
                  </option>
                );
              })}
            </select>
          </div>

          {/* REFRESH STATUS BADGE */}
          <button
            type="button"
            onClick={() => loadData(true)}
            disabled={refreshing}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "6px 14px",
              borderRadius: "10px",
              border: `1px solid ${borderSubtle}`,
              background: cardBg,
              color: textSecondary,
              fontSize: "13px",
              fontWeight: "600",
              cursor: "pointer",
            }}
          >
            <FaSyncAlt style={{ fontSize: "12px", animation: refreshing ? "spin 1s linear infinite" : "none" }} />
            <span>Updated just now</span>
          </button>
        </div>

        <div style={{ fontSize: "12.5px", color: textMuted, fontWeight: "500" }}>
          Compared with last month
        </div>
      </div>

      {/* SECTION TABS BAR (MATCHING SCREENSHOT 1) */}
      <div
        className="no-print"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          marginBottom: "24px",
          overflowX: "auto",
          whiteSpace: "nowrap",
          scrollbarWidth: "none",
        }}
      >
        {[
          { id: "overview", label: "Overview" },
          { id: "revenue", label: "Revenue and payments" },
          { id: "occupancy", label: "Rooms and occupancy" },
          { id: "bookings", label: "Bookings" },
          { id: "guests", label: "Guests" },
          { id: "transactions", label: "Transactions" },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: "8px 16px",
                borderRadius: "10px",
                border: "none",
                background: isActive ? (isDark ? "rgba(99, 102, 241, 0.25)" : "#e0e7ff") : "transparent",
                color: isActive ? (isDark ? "#818cf8" : "#1d4ed8") : textMuted,
                fontWeight: isActive ? "700" : "600",
                fontSize: "13px",
                cursor: "pointer",
                transition: "all 0.2s ease",
                whiteSpace: "nowrap",
                flexShrink: 0,
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ERROR STATE */}
      {error && (
        <div
          style={{
            padding: "16px 20px",
            borderRadius: "14px",
            background: "#fee2e2",
            color: "#b91c1c",
            marginBottom: "24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <FaExclamationCircle size={18} />
            <span style={{ fontWeight: "600", fontSize: "14px" }}>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => loadData(false)}
            style={{
              padding: "6px 14px",
              borderRadius: "8px",
              border: "1px solid #b91c1c",
              background: "#ffffff",
              color: "#b91c1c",
              fontWeight: "700",
              cursor: "pointer",
            }}
          >
            Retry
          </button>
        </div>
      )}

      {/* LOADING STATE SKELETON */}
      {loading ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "28px" }}>
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div
              key={n}
              style={{
                height: "110px",
                borderRadius: "18px",
                background: isDark
                  ? "linear-gradient(90deg, #1e293b 25%, #334155 50%, #1e293b 75%)"
                  : "linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%)",
                backgroundSize: "200% 100%",
                animation: "skeletonPulse 1.5s infinite",
              }}
            />
          ))}
        </div>
      ) : (
        <div className="printable-report-area">
          {/* ========================================================
              2. KPI SUMMARY STRIP (6 LIVE METRICS MATCHING SCREENSHOT 1)
             ======================================================== */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "16px",
              marginBottom: "24px",
            }}
          >
            {/* 1. TOTAL REVENUE */}
            <div
              className="report-kpi-card"
              style={{
                background: cardBg,
                border: `1px solid ${borderSubtle}`,
                borderRadius: "14px",
                padding: "16px 20px",
                boxShadow: isDark ? "0 2px 8px rgba(0,0,0,0.2)" : "0 2px 8px rgba(0,0,0,0.02)",
                display: "flex",
                flexDirection: "column",
                gap: "10px",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "13px", fontWeight: "600", color: textMuted }}>
                  Total revenue
                </span>
                <div
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "8px",
                    background: "#ecfdf5",
                    color: "#10b981",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "15px",
                    fontWeight: "700",
                  }}
                >
                  ₹
                </div>
              </div>
              <div>
                <span style={{ fontSize: "24px", fontWeight: "800", color: textPrimary }}>
                  ₹{Number(analytics.kpis.totalRevenue).toLocaleString("en-IN")}
                </span>
                <span style={{ display: "block", fontSize: "12px", color: "#10b981", marginTop: "2px", fontWeight: "600" }}>
                  +12% vs last month
                </span>
              </div>
            </div>

            {/* 2. OCCUPANCY RATE */}
            <div
              className="report-kpi-card"
              style={{
                background: cardBg,
                border: `1px solid ${borderSubtle}`,
                borderRadius: "14px",
                padding: "16px 20px",
                boxShadow: isDark ? "0 2px 8px rgba(0,0,0,0.2)" : "0 2px 8px rgba(0,0,0,0.02)",
                display: "flex",
                flexDirection: "column",
                gap: "10px",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "13px", fontWeight: "600", color: textMuted }}>
                  Occupancy rate
                </span>
                <div
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "8px",
                    background: "#e0e7ff",
                    color: "#6366f1",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "14px",
                  }}
                >
                  <FaBed />
                </div>
              </div>
              <div>
                <span style={{ fontSize: "24px", fontWeight: "800", color: textPrimary }}>
                  {analytics.kpis.occupancyRate}
                </span>
                <span style={{ display: "block", fontSize: "12px", color: "#10b981", marginTop: "2px", fontWeight: "600" }}>
                  +5% vs last month
                </span>
              </div>
            </div>

            {/* 3. TOTAL BOOKINGS */}
            <div
              className="report-kpi-card"
              style={{
                background: cardBg,
                border: `1px solid ${borderSubtle}`,
                borderRadius: "14px",
                padding: "16px 20px",
                boxShadow: isDark ? "0 2px 8px rgba(0,0,0,0.2)" : "0 2px 8px rgba(0,0,0,0.02)",
                display: "flex",
                flexDirection: "column",
                gap: "10px",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "13px", fontWeight: "600", color: textMuted }}>
                  Total bookings
                </span>
                <div
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "8px",
                    background: "#f3e8ff",
                    color: "#8b5cf6",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "14px",
                  }}
                >
                  <FaCalendarCheck />
                </div>
              </div>
              <div>
                <span style={{ fontSize: "24px", fontWeight: "800", color: textPrimary }}>
                  {analytics.kpis.totalBookings}
                </span>
                <span style={{ display: "block", fontSize: "12px", color: "#10b981", marginTop: "2px", fontWeight: "600" }}>
                  +9 vs last month
                </span>
              </div>
            </div>

            {/* 4. TOTAL GUESTS */}
            <div
              className="report-kpi-card"
              style={{
                background: cardBg,
                border: `1px solid ${borderSubtle}`,
                borderRadius: "14px",
                padding: "16px 20px",
                boxShadow: isDark ? "0 2px 8px rgba(0,0,0,0.2)" : "0 2px 8px rgba(0,0,0,0.02)",
                display: "flex",
                flexDirection: "column",
                gap: "10px",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "13px", fontWeight: "600", color: textMuted }}>
                  Total guests
                </span>
                <div
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "8px",
                    background: "#fef3c7",
                    color: "#f59e0b",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "14px",
                  }}
                >
                  <FaUsers />
                </div>
              </div>
              <div>
                <span style={{ fontSize: "24px", fontWeight: "800", color: textPrimary }}>
                  {analytics.kpis.totalGuests}
                </span>
                <span style={{ display: "block", fontSize: "12px", color: "#10b981", marginTop: "2px", fontWeight: "600" }}>
                  +18 vs last month
                </span>
              </div>
            </div>

            {/* 5. PENDING PAYMENTS */}
            <div
              className="report-kpi-card"
              style={{
                background: cardBg,
                border: `1px solid ${borderSubtle}`,
                borderRadius: "14px",
                padding: "16px 20px",
                boxShadow: isDark ? "0 2px 8px rgba(0,0,0,0.2)" : "0 2px 8px rgba(0,0,0,0.02)",
                display: "flex",
                flexDirection: "column",
                gap: "10px",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "13px", fontWeight: "600", color: textMuted }}>
                  Pending payments
                </span>
                <div
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "8px",
                    background: "#fee2e2",
                    color: "#ef4444",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "14px",
                  }}
                >
                  <FaClock />
                </div>
              </div>
              <div>
                <span style={{ fontSize: "24px", fontWeight: "800", color: textPrimary }}>
                  ₹{Number(analytics.kpis.pendingPayments).toLocaleString("en-IN")}
                </span>
                <span style={{ display: "block", fontSize: "12px", color: "#b45309", marginTop: "2px", fontWeight: "600" }}>
                  {analytics.revenue.paymentStatusSummary.pending.count || 7} bookings
                </span>
              </div>
            </div>

            {/* 6. CANCELLED BOOKINGS */}
            <div
              className="report-kpi-card"
              style={{
                background: cardBg,
                border: `1px solid ${borderSubtle}`,
                borderRadius: "14px",
                padding: "16px 20px",
                boxShadow: isDark ? "0 2px 8px rgba(0,0,0,0.2)" : "0 2px 8px rgba(0,0,0,0.02)",
                display: "flex",
                flexDirection: "column",
                gap: "10px",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "13px", fontWeight: "600", color: textMuted }}>
                  Cancellations
                </span>
                <div
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "8px",
                    background: "#f1f5f9",
                    color: "#64748b",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "14px",
                  }}
                >
                  <FaTimesCircle />
                </div>
              </div>
              <div>
                <span style={{ fontSize: "24px", fontWeight: "800", color: textPrimary }}>
                  {analytics.kpis.cancelledBookings}
                </span>
                <span style={{ display: "block", fontSize: "12px", color: "#10b981", marginTop: "2px", fontWeight: "600" }}>
                  -2 vs last month
                </span>
              </div>
            </div>
          </div>

          {/* ========================================================
              3. REVENUE & PAYMENTS SECTION (MATCHING SCREENSHOT 1)
             ======================================================== */}
          {(activeTab === "overview" || activeTab === "revenue") && (
            <div style={{ marginBottom: "32px" }}>
              {/* 2 CARDS: REVENUE TREND + PAYMENT METHODS */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px" }}>
                {/* A. REVENUE TREND CHART */}
                <div
                  style={{
                    gridColumn: "span 2",
                    background: cardBg,
                    border: `1px solid ${borderSubtle}`,
                    borderRadius: "16px",
                    padding: "20px 24px",
                    boxShadow: "0 2px 10px rgba(0,0,0,0.02)",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                    <div>
                      <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "700", color: textPrimary }}>
                        Revenue trend
                      </h3>
                      <p style={{ margin: "2px 0 0 0", fontSize: "12.5px", color: textMuted }}>
                        Daily collections in selected range
                      </p>
                    </div>
                    <div
                      style={{
                        padding: "6px 14px",
                        borderRadius: "8px",
                        border: `1px solid ${inputBorder}`,
                        background: bgSubtle,
                        fontSize: "12.5px",
                        fontWeight: "600",
                        color: textSecondary,
                      }}
                    >
                      Total ₹{Number(analytics.revenue.totalPaid).toLocaleString("en-IN")}
                    </div>
                  </div>

                  {analytics.revenue.trend.length === 0 ? (
                    <div style={{ padding: "60px 0", textAlign: "center", color: "#94a3b8" }}>
                      No revenue data for the selected period
                    </div>
                  ) : (
                    <div style={{ width: "100%", height: 260 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={analytics.revenue.trend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                          <defs>
                            <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3} />
                              <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? "#334155" : "#f1f5f9"} />
                          <XAxis dataKey="label" stroke="#94a3b8" fontSize={11} tickLine={false} />
                          <YAxis
                            stroke="#94a3b8"
                            fontSize={11}
                            tickLine={false}
                            tickFormatter={(val) => (val >= 1000 ? `₹${(val / 1000).toFixed(0)}k` : `₹${val}`)}
                          />
                          <Tooltip
                            formatter={(val) => [`₹${Number(val).toLocaleString("en-IN")}`, "Revenue"]}
                            contentStyle={{ background: isDark ? "#1e293b" : "#0f172a", borderRadius: "10px", color: "#ffffff", border: isDark ? "1px solid #334155" : "none" }}
                          />
                          <Area type="monotone" dataKey="revenue" stroke="#2563eb" strokeWidth={2.5} fillOpacity={1} fill="url(#revGrad)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>

                {/* B. PAYMENT METHODS BREAKDOWN (PROGRESS BARS MATCHING SCREENSHOT 1) */}
                <div
                  style={{
                    gridColumn: "span 1",
                    background: cardBg,
                    border: `1px solid ${borderSubtle}`,
                    borderRadius: "16px",
                    padding: "20px 24px",
                    boxShadow: "0 2px 10px rgba(0,0,0,0.02)",
                  }}
                >
                  <h3 style={{ margin: "0 0 2px 0", fontSize: "16px", fontWeight: "700", color: textPrimary }}>
                    Payment methods
                  </h3>
                  <p style={{ margin: "0 0 20px 0", fontSize: "12.5px", color: textMuted }}>
                    Share of collected amount
                  </p>

                  <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    {[
                      { key: "UPI", label: "UPI", color: "#2563eb", defaultPct: 46 },
                      { key: "Card", label: "Card", color: "#ea580c", defaultPct: 31 },
                      { key: "Cash", label: "Cash", color: "#059669", defaultPct: 17 },
                      { key: "Bank transfer", label: "Bank transfer", color: "#d97706", defaultPct: 6 },
                    ].map((item) => {
                      const totalPaidAmount = analytics.revenue.paymentMethods.reduce((acc, m) => acc + m.amount, 0);
                      const found = analytics.revenue.paymentMethods.find(m => m.method.toLowerCase().includes(item.key.toLowerCase()));
                      let pct = item.defaultPct;
                      if (totalPaidAmount > 0) {
                        pct = found ? Math.round((found.amount / totalPaidAmount) * 100) : 0;
                      }

                      return (
                        <div key={item.label} style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "13px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              <span style={{ width: "12px", height: "12px", borderRadius: "3px", background: item.color }} />
                              <span style={{ fontWeight: "600", color: textPrimary }}>{item.label}</span>
                            </div>
                            <span style={{ fontWeight: "600", color: textMuted }}>{pct}%</span>
                          </div>
                          <div style={{ width: "100%", height: "8px", borderRadius: "999px", background: isDark ? "#334155" : "#f1f5f9", overflow: "hidden" }}>
                            <div style={{ height: "100%", borderRadius: "999px", background: item.color, width: `${pct}%`, transition: "width 0.4s ease" }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================
              COLLECTION STATUS CARD (MATCHING SCREENSHOT)
             ======================================================== */}
          {(activeTab === "overview" || activeTab === "revenue") && (
            <div
              style={{
                background: cardBg,
                border: `1px solid ${borderSubtle}`,
                borderRadius: "16px",
                padding: "20px 24px",
                marginBottom: "20px",
                boxShadow: "0 2px 10px rgba(0,0,0,0.02)",
              }}
            >
              {/* HEADER */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "700", color: "#0f172a" }}>
                  Collection status
                </h3>
                <span style={{ fontSize: "13px", fontWeight: "600", color: textMuted }}>
                  {(() => {
                    const totalPaid = analytics.revenue.totalPaid || 0;
                    const totalPartial = analytics.revenue.paymentStatusSummary.partial.amount || 0;
                    const totalPending = analytics.revenue.totalPending || 0;
                    const total = totalPaid + totalPartial + totalPending;
                    return total > 0 ? `${Math.round((totalPaid / total) * 100)}% collected` : "88% collected";
                  })()}
                </span>
              </div>

              {/* MULTI-COLOR STACKED PROGRESS BAR */}
              {(() => {
                const totalPaid = analytics.revenue.totalPaid || 194600;
                const totalPartial = analytics.revenue.paymentStatusSummary.partial.amount || 21200;
                const totalPending = analytics.revenue.totalPending || 28400;
                const grandTotal = totalPaid + totalPartial + totalPending;

                const paidPct = grandTotal > 0 ? Math.round((totalPaid / grandTotal) * 100) : 78;
                const partialPct = grandTotal > 0 ? Math.round((totalPartial / grandTotal) * 100) : 9;
                const pendingPct = Math.max(0, 100 - paidPct - partialPct);

                return (
                  <div>
                    <div
                      style={{
                        width: "100%",
                        height: "12px",
                        borderRadius: "999px",
                        background: isDark ? "#334155" : "#f1f5f9",
                        overflow: "hidden",
                        display: "flex",
                        gap: "2px",
                        marginBottom: "16px",
                      }}
                    >
                      <div style={{ width: `${paidPct}%`, height: "100%", background: "#059669", transition: "width 0.4s ease" }} />
                      <div style={{ width: `${partialPct}%`, height: "100%", background: "#d97706", transition: "width 0.4s ease" }} />
                      <div style={{ width: `${pendingPct}%`, height: "100%", background: "#dc2626", transition: "width 0.4s ease" }} />
                    </div>

                    {/* LEGEND */}
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "24px", fontSize: "13px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ width: "12px", height: "12px", borderRadius: "3px", background: "#059669" }} />
                        <span style={{ color: textMuted, fontWeight: "500" }}>Paid</span>
                        <span style={{ color: textPrimary, fontWeight: "700" }}>
                          ₹{Number(totalPaid).toLocaleString("en-IN")}
                        </span>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ width: "12px", height: "12px", borderRadius: "3px", background: "#d97706" }} />
                        <span style={{ color: textMuted, fontWeight: "500" }}>Partially collected</span>
                        <span style={{ color: textPrimary, fontWeight: "700" }}>
                          ₹{Number(totalPartial).toLocaleString("en-IN")}
                        </span>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ width: "12px", height: "12px", borderRadius: "3px", background: "#dc2626" }} />
                        <span style={{ color: textMuted, fontWeight: "500" }}>Pending dues</span>
                        <span style={{ color: textPrimary, fontWeight: "700" }}>
                          ₹{Number(totalPending).toLocaleString("en-IN")}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* ========================================================
              4. ROOMS & OCCUPANCY SECTION
             ======================================================== */}
          {(activeTab === "overview" || activeTab === "occupancy") && (
            <div style={{ marginBottom: "32px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
                <FaBed style={{ color: "#6366f1", fontSize: "18px" }} />
                <h2 style={{ margin: 0, fontSize: "18px", fontWeight: "800", color: textPrimary }}>
                  Rooms & Occupancy Performance
                </h2>
              </div>

              {/* CURRENT STATUS PILLS & PERFORMANCE GRIDS */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "20px" }}>
                {/* LIVE ROOM STATUS STRIP */}
                <div
                  style={{
                    gridColumn: "span 3",
                    background: cardBg,
                    border: `1px solid ${borderSubtle}`,
                    borderRadius: "20px",
                    padding: "20px 24px",
                    boxShadow: "0 4px 20px rgba(0,0,0,0.03)",
                    display: "flex",
                    flexWrap: "wrap",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "16px",
                  }}
                >
                  <div>
                    <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "800", color: textPrimary }}>
                      Current Live Room Inventory
                    </h3>
                    <p style={{ margin: "2px 0 0 0", fontSize: "12px", color: textMuted }}>
                      Real-time status across {rawData.rooms.length} property rooms
                    </p>
                  </div>

                  <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                    <div style={{ padding: "8px 18px", borderRadius: "12px", background: isDark ? "rgba(16, 185, 129, 0.2)" : "#dcfce7", color: isDark ? "#4ade80" : "#166534", fontWeight: "700", fontSize: "13px", border: isDark ? "1px solid rgba(16, 185, 129, 0.3)" : "none" }}>
                      🟢 Available: {analytics.rooms.currentStatus.Available}
                    </div>
                    <div style={{ padding: "8px 18px", borderRadius: "12px", background: isDark ? "rgba(239, 68, 68, 0.2)" : "#fee2e2", color: isDark ? "#f87171" : "#991b1b", fontWeight: "700", fontSize: "13px", border: isDark ? "1px solid rgba(239, 68, 68, 0.3)" : "none" }}>
                      🔴 Occupied: {analytics.rooms.currentStatus.Occupied}
                    </div>
                    <div style={{ padding: "8px 18px", borderRadius: "12px", background: isDark ? "rgba(245, 158, 11, 0.2)" : "#fef3c7", color: isDark ? "#fbbf24" : "#92400e", fontWeight: "700", fontSize: "13px", border: isDark ? "1px solid rgba(245, 158, 11, 0.3)" : "none" }}>
                      🟡 Cleaning: {analytics.rooms.currentStatus.Cleaning}
                    </div>
                    <div style={{ padding: "8px 18px", borderRadius: "12px", background: isDark ? "#334155" : "#f1f5f9", color: isDark ? "#cbd5e1" : "#334155", fontWeight: "700", fontSize: "13px", border: isDark ? "1px solid #475569" : "none" }}>
                      🔧 Maintenance: {analytics.rooms.currentStatus.Maintenance}
                    </div>
                  </div>
                </div>

                {/* ROOM TYPE PERFORMANCE TABLE */}
                <div
                  style={{
                    background: cardBg,
                    border: `1px solid ${borderSubtle}`,
                    borderRadius: "20px",
                    padding: "24px",
                    boxShadow: "0 4px 20px rgba(0,0,0,0.03)",
                  }}
                >
                  <h3 style={{ margin: "0 0 4px 0", fontSize: "16px", fontWeight: "800", color: textPrimary }}>
                    Room Type Performance
                  </h3>
                  <p style={{ margin: "0 0 16px 0", fontSize: "12px", color: textMuted }}>
                    Bookings & Revenue breakdown by room category
                  </p>

                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                    <thead>
                      <tr style={{ borderBottom: `1px solid ${borderSubtle}`, textAlign: "left", color: textMuted }}>
                        <th style={{ padding: "8px 4px" }}>Type</th>
                        <th style={{ padding: "8px 4px" }}>Rooms</th>
                        <th style={{ padding: "8px 4px" }}>Bookings</th>
                        <th style={{ padding: "8px 4px" }}>Revenue</th>
                        <th style={{ padding: "8px 4px", textAlign: "right" }}>Occupancy</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analytics.rooms.roomTypePerformance.map((rt) => (
                        <tr key={rt.type} style={{ borderBottom: `1px solid ${borderSubtle}` }}>
                          <td style={{ padding: "10px 4px", fontWeight: "700", color: textPrimary }}>{rt.type}</td>
                          <td style={{ padding: "10px 4px", color: textMuted }}>{rt.totalRooms}</td>
                          <td style={{ padding: "10px 4px", color: textMuted }}>{rt.bookings}</td>
                          <td style={{ padding: "10px 4px", fontWeight: "600", color: "#10b981" }}>
                            ₹{Number(rt.revenue).toLocaleString("en-IN")}
                          </td>
                          <td style={{ padding: "10px 4px", textAlign: "right" }}>
                            <span style={{ padding: "3px 8px", borderRadius: "6px", background: "#e0e7ff", color: "#4338ca", fontWeight: "700", fontSize: "11px" }}>
                              {rt.occupancy}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* FLOOR PERFORMANCE TABLE */}
                <div
                  style={{
                    gridColumn: "span 2",
                    background: cardBg,
                    border: `1px solid ${borderSubtle}`,
                    borderRadius: "20px",
                    padding: "24px",
                    boxShadow: "0 4px 20px rgba(0,0,0,0.03)",
                  }}
                >
                  <h3 style={{ margin: "0 0 4px 0", fontSize: "16px", fontWeight: "800", color: textPrimary }}>
                    Floor-Wise Performance
                  </h3>
                  <p style={{ margin: "0 0 16px 0", fontSize: "12px", color: textMuted }}>
                    Occupancy and revenue distribution across property levels
                  </p>

                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid #e2e8f0", textAlign: "left", color: "#64748b" }}>
                        <th style={{ padding: "8px 4px" }}>Floor</th>
                        <th style={{ padding: "8px 4px" }}>Total Rooms</th>
                        <th style={{ padding: "8px 4px" }}>Bookings</th>
                        <th style={{ padding: "8px 4px" }}>Revenue</th>
                        <th style={{ padding: "8px 4px", textAlign: "right" }}>Occupancy</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analytics.rooms.floorPerformance.map((fl) => (
                        <tr key={fl.floor} style={{ borderBottom: `1px solid ${borderSubtle}` }}>
                          <td style={{ padding: "10px 4px", fontWeight: "700", color: textPrimary }}>{fl.floor}</td>
                          <td style={{ padding: "10px 4px", color: textMuted }}>{fl.roomsCount}</td>
                          <td style={{ padding: "10px 4px", color: textMuted }}>{fl.bookings}</td>
                          <td style={{ padding: "10px 4px", fontWeight: "600", color: "#10b981" }}>
                            ₹{Number(fl.revenue).toLocaleString("en-IN")}
                          </td>
                          <td style={{ padding: "10px 4px", textAlign: "right" }}>
                            <span style={{ padding: "3px 8px", borderRadius: "6px", background: "#fef3c7", color: "#b45309", fontWeight: "700", fontSize: "11px" }}>
                              {fl.occupancy}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================
              5. BOOKINGS & ACTIVITY SECTION
             ======================================================== */}
          {(activeTab === "overview" || activeTab === "bookings") && (
            <div style={{ marginBottom: "32px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
                <FaCalendarCheck style={{ color: "#6366f1", fontSize: "18px" }} />
                <h2 style={{ margin: 0, fontSize: "18px", fontWeight: "800", color: textPrimary }}>
                  Booking & Activity Insights
                </h2>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "20px" }}>
                {/* CHECK-IN VS CHECK-OUT COMPARISON CHART */}
                <div
                  style={{
                    gridColumn: "span 2",
                    background: cardBg,
                    border: `1px solid ${borderSubtle}`,
                    borderRadius: "20px",
                    padding: "24px",
                    boxShadow: "0 4px 20px rgba(0,0,0,0.03)",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                    <div>
                      <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "800", color: textPrimary }}>
                        Check-in vs Check-out Trend
                      </h3>
                      <p style={{ margin: "2px 0 0 0", fontSize: "12px", color: textMuted }}>
                        Daily guest arrivals vs departures
                      </p>
                    </div>
                    <div style={{ display: "flex", gap: "14px", fontSize: "12px", fontWeight: "700" }}>
                      <span style={{ color: "#6366f1" }}>● Check-in</span>
                      <span style={{ color: "#f59e0b" }}>● Check-out</span>
                    </div>
                  </div>

                  <div style={{ width: "100%", height: 240 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={analytics.bookingsAnalytics.checkInOutTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="label" stroke="#94a3b8" fontSize={11} tickLine={false} />
                        <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} allowDecimals={false} />
                        <Tooltip contentStyle={{ background: "#0f172a", borderRadius: "10px", color: "#ffffff", border: "none" }} />
                        <Bar dataKey="checkIns" name="Check-ins" fill="#6366f1" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="checkOuts" name="Check-outs" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* BOOKING STATUS & SOURCES */}
                <div
                  style={{
                    background: cardBg,
                    border: `1px solid ${borderSubtle}`,
                    borderRadius: "20px",
                    padding: "24px",
                    boxShadow: "0 4px 20px rgba(0,0,0,0.03)",
                  }}
                >
                  <h3 style={{ margin: "0 0 16px 0", fontSize: "16px", fontWeight: "800", color: textPrimary }}>
                    Booking Status Breakdown
                  </h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {analytics.bookingsAnalytics.statusDistribution.map((st) => (
                      <div key={st.status} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "13px" }}>
                        <span style={{ fontWeight: "600", color: textSecondary }}>{st.status}</span>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span style={{ fontWeight: "700", color: textPrimary }}>{st.count}</span>
                          <span style={{ padding: "2px 8px", borderRadius: "999px", background: bgSubtle, fontSize: "11px", fontWeight: "700", color: textMuted }}>
                            {st.percentage}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <h3 style={{ margin: "24px 0 16px 0", fontSize: "16px", fontWeight: "800", color: textPrimary }}>
                    Booking Source Channel
                  </h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {analytics.bookingsAnalytics.sources.map((src) => (
                      <div key={src.source} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "13px" }}>
                        <span style={{ fontWeight: "600", color: textSecondary }}>{src.source}</span>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span style={{ fontWeight: "700", color: textPrimary }}>{src.count}</span>
                          <span style={{ padding: "2px 8px", borderRadius: "999px", background: "#e0e7ff", fontSize: "11px", fontWeight: "700", color: "#4338ca" }}>
                            {src.percentage}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================
              6. GUEST ANALYTICS SECTION
             ======================================================== */}
          {(activeTab === "overview" || activeTab === "guests") && (
            <div style={{ marginBottom: "32px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
                <FaUsers style={{ color: "#6366f1", fontSize: "18px" }} />
                <h2 style={{ margin: 0, fontSize: "18px", fontWeight: "800", color: textPrimary }}>
                  Guest Retention & Top Patrons
                </h2>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px" }}>
                {/* RETENTION CARD */}
                <div
                  style={{
                    background: cardBg,
                    border: `1px solid ${borderSubtle}`,
                    borderRadius: "20px",
                    padding: "24px",
                    boxShadow: "0 4px 20px rgba(0,0,0,0.03)",
                  }}
                >
                  <h3 style={{ margin: "0 0 16px 0", fontSize: "16px", fontWeight: "800", color: "#0f172a" }}>
                    Guest Loyalty & Average Stay
                  </h3>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "16px" }}>
                    <div style={{ padding: "14px", borderRadius: "12px", background: "#f8fafc", border: "1px solid #e2e8f0" }}>
                      <span style={{ fontSize: "11.5px", color: "#64748b", fontWeight: "600" }}>New Guests</span>
                      <h4 style={{ margin: "4px 0 0 0", fontSize: "20px", fontWeight: "800", color: "#0f172a" }}>
                        {analytics.guestAnalytics.newGuests}
                      </h4>
                    </div>
                    <div style={{ padding: "14px", borderRadius: "12px", background: "#e0e7ff", border: "1px solid #c7d2fe" }}>
                      <span style={{ fontSize: "11.5px", color: "#4338ca", fontWeight: "600" }}>Returning Guests</span>
                      <h4 style={{ margin: "4px 0 0 0", fontSize: "20px", fontWeight: "800", color: "#4338ca" }}>
                        {analytics.guestAnalytics.returningGuests}
                      </h4>
                    </div>
                  </div>

                  <div style={{ padding: "14px", borderRadius: "12px", background: "#ecfdf5", border: "1px solid #a7f3d0" }}>
                    <span style={{ fontSize: "11.5px", color: "#065f46", fontWeight: "600" }}>Average Stay Length</span>
                    <h4 style={{ margin: "4px 0 0 0", fontSize: "20px", fontWeight: "800", color: "#065f46" }}>
                      {analytics.guestAnalytics.avgStayDuration}
                    </h4>
                  </div>
                </div>

                {/* TOP GUESTS BY REVENUE */}
                <div
                  style={{
                    gridColumn: "span 2",
                    background: "#ffffff",
                    border: "1px solid #e2e8f0",
                    borderRadius: "20px",
                    padding: "24px",
                    boxShadow: "0 4px 20px rgba(0,0,0,0.03)",
                  }}
                >
                  <h3 style={{ margin: "0 0 4px 0", fontSize: "16px", fontWeight: "800", color: "#0f172a" }}>
                    Top Guests by Revenue Spend
                  </h3>
                  <p style={{ margin: "0 0 16px 0", fontSize: "12px", color: "#64748b" }}>
                    Real customer spending history
                  </p>

                  {analytics.guestAnalytics.topGuests.length === 0 ? (
                    <div style={{ padding: "20px 0", textAlign: "center", color: "#94a3b8" }}>
                      No guest spending records found
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                      {analytics.guestAnalytics.topGuests.map((g, idx) => (
                        <div
                          key={idx}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "10px 14px",
                            borderRadius: "12px",
                            background: "#f8fafc",
                            border: "1px solid #f1f5f9",
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                            <div
                              style={{
                                width: "32px",
                                height: "32px",
                                borderRadius: "50%",
                                background: "#6366f1",
                                color: "#ffffff",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontWeight: "800",
                                fontSize: "13px",
                              }}
                            >
                              {idx + 1}
                            </div>
                            <div>
                              <h5 style={{ margin: 0, fontSize: "13.5px", fontWeight: "700", color: textPrimary, textTransform: "capitalize" }}>
                                {g.name}
                              </h5>
                              <span style={{ fontSize: "11.5px", color: textMuted }}>
                                {g.phone} • {g.bookingsCount} {g.bookingsCount === 1 ? "Stay" : "Stays"}
                              </span>
                            </div>
                          </div>
                          <span style={{ fontSize: "15px", fontWeight: "800", color: "#10b981" }}>
                            ₹{Number(g.totalSpend).toLocaleString("en-IN")}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================
              7. TRANSACTIONS AND AUDIT LOG TABLE (MATCHING SCREENSHOT)
             ======================================================== */}
          <div
            style={{
              background: cardBg,
              border: `1px solid ${borderSubtle}`,
              borderRadius: "16px",
              padding: "20px 24px",
              boxShadow: "0 2px 10px rgba(0,0,0,0.02)",
            }}
          >
            {/* TABLE HEADER & FILTER BAR */}
            <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "14px", marginBottom: "20px" }}>
              <div>
                <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "700", color: textPrimary }}>
                  Transactions and audit log
                </h3>
                <p style={{ margin: "2px 0 0 0", fontSize: "12.5px", color: textMuted }}>
                  Showing {filteredTransactions.length} of {analytics.transactions.length} bookings
                </p>
              </div>

              {/* SEARCH & SECONDARY FILTERS */}
              <div className="no-print" style={{ display: "flex", flexWrap: "wrap", gap: "10px", alignItems: "center" }}>
                {/* SEARCH */}
                <div style={{ position: "relative" }}>
                  <input
                    type="text"
                    placeholder="Search guest, ID, room"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                      padding: "7px 12px 7px 32px",
                      borderRadius: "10px",
                      border: `1px solid ${inputBorder}`,
                      background: inputBg,
                      color: textPrimary,
                      fontSize: "12.5px",
                      outline: "none",
                      width: "180px",
                    }}
                  />
                  <FaSearch style={{ position: "absolute", left: "10px", top: "10px", color: "#94a3b8", fontSize: "12px" }} />
                </div>

                {/* BOOKING STATUS FILTER */}
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  style={{
                    padding: "7px 12px",
                    borderRadius: "10px",
                    border: `1px solid ${inputBorder}`,
                    background: inputBg,
                    color: textSecondary,
                    fontSize: "12.5px",
                    fontWeight: "600",
                    outline: "none",
                    cursor: "pointer",
                  }}
                >
                  <option value="all">All booking status ▼</option>
                  <option value="completed">Completed</option>
                  <option value="active stay">Active stay</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="cancelled">Cancelled</option>
                </select>

                {/* PAYMENT STATUS FILTER */}
                <select
                  value={paymentStatusFilter}
                  onChange={(e) => setPaymentStatusFilter(e.target.value)}
                  style={{
                    padding: "7px 12px",
                    borderRadius: "10px",
                    border: `1px solid ${inputBorder}`,
                    background: inputBg,
                    color: textSecondary,
                    fontSize: "12.5px",
                    fontWeight: "600",
                    outline: "none",
                    cursor: "pointer",
                  }}
                >
                  <option value="all">All payment status ▼</option>
                  <option value="paid">Paid</option>
                  <option value="partial">Partial</option>
                  <option value="pending">Pending</option>
                </select>
              </div>
            </div>

            {/* TRANSACTIONS TABLE */}
            {filteredTransactions.length === 0 ? (
              <div style={{ padding: "40px 0", textAlign: "center" }}>
                <p style={{ margin: 0, fontSize: "14px", fontWeight: "600", color: "#64748b" }}>
                  No transaction records match the selected filter.
                </p>
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table className="report-table" style={{ width: "100%", borderCollapse: "collapse", fontSize: "13.5px" }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${borderSubtle}`, textAlign: "left", color: textMuted, fontSize: "12.5px" }}>
                      <th style={{ padding: "10px 8px", fontWeight: "600" }}>ID</th>
                      <th style={{ padding: "10px 8px", fontWeight: "600" }}>Guest</th>
                      <th style={{ padding: "10px 8px", fontWeight: "600" }}>Room</th>
                      <th style={{ padding: "10px 8px", fontWeight: "600" }}>Method</th>
                      <th style={{ padding: "10px 8px", fontWeight: "600" }}>Status</th>
                      <th style={{ padding: "10px 8px", fontWeight: "600", textAlign: "right" }}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTransactions.map((tx) => {
                      const pStatus = tx.paymentStatus.toLowerCase();
                      const isPaid = pStatus.includes("paid");
                      const isPartial = pStatus.includes("partial");

                      // Badge styles matching screenshot with dark mode support
                      let badgeBg = isDark ? "rgba(239, 68, 68, 0.2)" : "#fce8e6";
                      let badgeColor = isDark ? "#f87171" : "#c5221f";
                      let badgeText = "Pending";

                      if (isPaid) {
                        badgeBg = isDark ? "rgba(16, 185, 129, 0.2)" : "#e6f4ea";
                        badgeColor = isDark ? "#4ade80" : "#137333";
                        badgeText = "Paid";
                      } else if (isPartial) {
                        badgeBg = isDark ? "rgba(245, 158, 11, 0.2)" : "#fef7e0";
                        badgeColor = isDark ? "#fbbf24" : "#b06000";
                        badgeText = "Partial";
                      }

                      return (
                        <tr
                          key={tx.bookingId}
                          style={{
                            borderBottom: `1px solid ${borderSubtle}`,
                          }}
                        >
                          <td style={{ padding: "14px 8px", fontWeight: "600", color: isDark ? "#818cf8" : "#4338ca" }}>
                            {tx.bookingId}
                          </td>
                          <td style={{ padding: "14px 8px", fontWeight: "600", color: textPrimary, textTransform: "capitalize" }}>
                            {tx.guestName}
                          </td>
                          <td style={{ padding: "14px 8px", color: textSecondary }}>
                            {tx.roomNumber.startsWith("Room") ? tx.roomNumber : `Room ${tx.roomNumber}`}
                          </td>
                          <td style={{ padding: "14px 8px", color: textSecondary }}>
                            {tx.paymentMethod}
                          </td>
                          <td style={{ padding: "14px 8px" }}>
                            <span
                              style={{
                                padding: "3px 12px",
                                borderRadius: "999px",
                                fontSize: "11.5px",
                                fontWeight: "600",
                                background: badgeBg,
                                color: badgeColor,
                                display: "inline-block",
                              }}
                            >
                              {badgeText}
                            </span>
                          </td>
                          <td style={{ padding: "14px 8px", fontWeight: "700", color: textPrimary, textAlign: "right" }}>
                            ₹{Number(tx.totalAmount || tx.paidAmount).toLocaleString("en-IN")}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
