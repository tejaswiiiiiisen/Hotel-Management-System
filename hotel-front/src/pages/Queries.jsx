import React, { useState, useEffect, useRef } from "react";
import { useOutletContext } from "react-router-dom";
import {
  FaQuestionCircle,
  FaEnvelope,
  FaPhone,
  FaCheckCircle,
  FaCheck,
  FaTrash,
  FaSearch,
  FaSlidersH,
  FaChevronDown,
  FaClock,
  FaThLarge,
  FaList,
  FaPlus,
  FaUserFriends,
  FaExclamationTriangle,
} from "react-icons/fa";
import { getAuthHeaders } from "../auth.js";
import { showSuccess, showError } from "../utils/toast.js";

export default function Queries() {
  const outletContext = useOutletContext() || {};
  const [theme, setTheme] = useState(() => {
    return (
      outletContext.theme ||
      localStorage.getItem("theme") ||
      (document.documentElement.classList.contains("dark") ||
      document.body.classList.contains("dark-mode")
        ? "dark"
        : "light")
    );
  });

  useEffect(() => {
    const checkTheme = () => {
      const curTheme =
        outletContext.theme ||
        localStorage.getItem("theme") ||
        (document.documentElement.classList.contains("dark") ||
        document.body.classList.contains("dark-mode")
          ? "dark"
          : "light");
      setTheme(curTheme);
    };

    checkTheme();
    const interval = setInterval(checkTheme, 400);
    window.addEventListener("storage", checkTheme);
    return () => {
      clearInterval(interval);
      window.removeEventListener("storage", checkTheme);
    };
  }, [outletContext.theme]);

  const isDark = theme === "dark";

  // Dynamic theme variables
  const cardBg = isDark ? "#1e293b" : "#ffffff";
  const border = isDark ? "1px solid #334155" : "1px solid #e2e8f0";
  const textColor = isDark ? "#f8fafc" : "#0f172a";
  const subColor = isDark ? "#94a3b8" : "#64748b";
  const inputBg = isDark ? "#0f172a" : "#f8fafc";
  const inputBorder = isDark ? "1px solid #334155" : "1px solid #e2e8f0";
  const tableHeaderBg = isDark ? "#0f172a" : "#ffffff";
  const tableRowHover = isDark ? "#334155" : "#f8fafc";
  const innerBoxBg = isDark ? "#0f172a" : "#f8fafc";

  // Queries Data State
  const [queries, setQueries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // 'all', 'unread', 'read'
  const [selectedQuery, setSelectedQuery] = useState(null);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [viewMode, setViewMode] = useState("table"); // 'table' or 'grid'

  const filterRef = useRef(null);

  // Close filter dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (filterRef.current && !filterRef.current.contains(e.target)) {
        setShowFilterDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch queries with real-time support
  const fetchQueries = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      let res = await fetch("/api/query", { headers: getAuthHeaders() });
      if (!res.ok) {
        res = await fetch("http://localhost:4000/api/query", { headers: getAuthHeaders() });
      }
      const data = await res.json();
      if (data && data.success && Array.isArray(data.queries)) {
        setQueries(data.queries);
      }
    } catch (err) {
      if (!silent) {
        console.error("Failed to fetch queries:", err);
        showError("Could not load customer queries.");
      }
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueries(false);
    const interval = setInterval(() => fetchQueries(true), 2500);

    const handleFocus = () => fetchQueries(true);
    const handleUpdate = (e) => {
      if (e.detail && Array.isArray(e.detail)) {
        setQueries(e.detail);
      } else {
        fetchQueries(true);
      }
    };

    window.addEventListener("focus", handleFocus);
    window.addEventListener("queries_updated", handleUpdate);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("queries_updated", handleUpdate);
    };
  }, []);

  // Actions
  const handleMarkRead = async (id) => {
    try {
      let res = await fetch(`/api/query/${id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({ status: "Read" }),
      });
      if (!res.ok) {
        res = await fetch(`http://localhost:4000/api/query/${id}/status`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", ...getAuthHeaders() },
          body: JSON.stringify({ status: "Read" }),
        });
      }
      showSuccess("Query marked as Read");
      setQueries((prev) =>
        prev.map((q) => (q.id === id ? { ...q, status: "Read" } : q))
      );
      if (selectedQuery && selectedQuery.id === id) {
        setSelectedQuery((prev) => ({ ...prev, status: "Read" }));
      }
    } catch (err) {
      showError("Failed to update status");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this customer query?")) return;
    try {
      let res = await fetch(`/api/query/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      if (!res.ok) {
        res = await fetch(`http://localhost:4000/api/query/${id}`, {
          method: "DELETE",
          headers: getAuthHeaders(),
        });
      }
      showSuccess("Query deleted successfully");
      setQueries((prev) => prev.filter((q) => q.id !== id));
      if (selectedQuery && selectedQuery.id === id) {
        setSelectedQuery(null);
      }
    } catch (err) {
      showError("Failed to delete query");
    }
  };

  // Filter logic
  const filteredQueries = queries.filter((q) => {
    const isUnread = !q.status || q.status === "New" || q.status === "Unread";
    if (statusFilter === "unread" && !isUnread) return false;
    if (statusFilter === "read" && isUnread) return false;

    if (!searchQuery.trim()) return true;
    const term = searchQuery.toLowerCase();
    const fullName = `${q.first_name || ""} ${q.last_name || ""}`.toLowerCase();
    return (
      fullName.includes(term) ||
      (q.email && q.email.toLowerCase().includes(term)) ||
      (q.phone && q.phone.toLowerCase().includes(term)) ||
      (q.subject && q.subject.toLowerCase().includes(term)) ||
      (q.message && q.message.toLowerCase().includes(term))
    );
  });

  const totalCount = queries.length;
  const unreadCount = queries.filter((q) => !q.status || q.status === "New" || q.status === "Unread").length;
  const readCount = totalCount - unreadCount;

  // Helper for Initials
  const getInitials = (firstName, lastName) => {
    const f = firstName ? firstName.charAt(0).toUpperCase() : "";
    const l = lastName ? lastName.charAt(0).toUpperCase() : "";
    return f + l || "G";
  };

  // Helper for handle/username tag
  const getHandle = (firstName, lastName) => {
    const f = firstName ? firstName.toLowerCase().replace(/\s+/g, "") : "";
    const l = lastName ? lastName.toLowerCase().replace(/\s+/g, "") : "";
    return `@${f}${l}` || "@guest";
  };

  return (
    <div
      style={{
        padding: "24px 32px",
        fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
        maxWidth: "1480px",
        margin: "0 auto",
      }}
    >
      {/* PAGE TITLE HEADER */}
      <div
        style={{
          marginBottom: "24px",
        }}
      >
        <h1 style={{ margin: 0, fontSize: "26px", fontWeight: "800", color: textColor, letterSpacing: "-0.5px" }}>
          Customer Queries
        </h1>
        <span style={{ fontSize: "13.5px", color: subColor, display: "block", marginTop: "4px" }}>
          Unified customer inquiries, room booking questions, stay package requests & real-time responses
        </span>
      </div>

      {/* 1. TOP HORIZONTAL SUMMARY KPI CARDS ROW (3 CARDS IN ONE SINGLE ROW) */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "18px",
          marginBottom: "28px",
        }}
      >
        {/* KPI Card 1 */}
        <div
          onClick={() => setStatusFilter("all")}
          style={{
            background: cardBg,
            border: border,
            borderRadius: "20px",
            padding: "20px 24px",
            boxShadow: isDark ? "0 4px 20px rgba(0,0,0,0.4)" : "0 4px 16px rgba(0,0,0,0.03)",
            cursor: "pointer",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <span style={{ fontSize: "12.5px", fontWeight: "700", color: subColor }}>Total Registered Queries</span>
            <div style={{ fontSize: "28px", fontWeight: "800", color: textColor, marginTop: "4px" }}>
              {totalCount} <span style={{ fontSize: "14px", fontWeight: "600", color: subColor }}>Queries</span>
            </div>
          </div>
          <div
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "12px",
              background: isDark ? "rgba(99, 102, 241, 0.15)" : "#eff6ff",
              color: "#6366f1",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "18px",
            }}
          >
            <FaUserFriends />
          </div>
        </div>

        {/* KPI Card 2 */}
        <div
          onClick={() => setStatusFilter("unread")}
          style={{
            background: cardBg,
            border: border,
            borderRadius: "20px",
            padding: "20px 24px",
            boxShadow: isDark ? "0 4px 20px rgba(0,0,0,0.4)" : "0 4px 16px rgba(0,0,0,0.03)",
            cursor: "pointer",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <span style={{ fontSize: "12.5px", fontWeight: "700", color: subColor }}>Unread Guest Inquiries</span>
            <div style={{ fontSize: "28px", fontWeight: "800", color: "#f97316", marginTop: "4px" }}>
              {unreadCount} <span style={{ fontSize: "14px", fontWeight: "600", color: subColor }}>Pending</span>
            </div>
          </div>
          <div
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "12px",
              background: isDark ? "rgba(249, 115, 22, 0.15)" : "#fff7ed",
              color: "#f97316",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "18px",
            }}
          >
            <FaExclamationTriangle />
          </div>
        </div>

        {/* KPI Card 3 */}
        <div
          onClick={() => setStatusFilter("read")}
          style={{
            background: cardBg,
            border: border,
            borderRadius: "20px",
            padding: "20px 24px",
            boxShadow: isDark ? "0 4px 20px rgba(0,0,0,0.4)" : "0 4px 16px rgba(0,0,0,0.03)",
            cursor: "pointer",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <span style={{ fontSize: "12.5px", fontWeight: "700", color: subColor }}>Resolved & Archived</span>
            <div style={{ fontSize: "28px", fontWeight: "800", color: "#10b981", marginTop: "4px" }}>
              {readCount} <span style={{ fontSize: "14px", fontWeight: "600", color: subColor }}>Resolved</span>
            </div>
          </div>
          <div
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "12px",
              background: isDark ? "rgba(16, 185, 129, 0.15)" : "#dcfce7",
              color: "#10b981",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "18px",
            }}
          >
            <FaCheckCircle />
          </div>
        </div>
      </div>

      {/* 2. MAIN SINGLE UNIFIED WRAPPER CARD (CONTAINING BOTH SEARCH CONTROLS & TABLE / GRID INSIDE!) */}
      <div
        style={{
          background: cardBg,
          borderRadius: "24px",
          border: border,
          padding: "24px",
          boxShadow: isDark ? "0 10px 30px rgba(0,0,0,0.4)" : "0 4px 20px rgba(0,0,0,0.03)",
        }}
      >
        {/* CONTROLS BAR INSIDE THE UNIFIED CARD */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "16px",
            marginBottom: "24px",
          }}
        >
          {/* Left Search Pill Input */}
          <div style={{ position: "relative", width: "420px", maxWidth: "100%" }}>
            <FaSearch
              style={{
                position: "absolute",
                left: "18px",
                top: "50%",
                transform: "translateY(-50%)",
                color: "#94a3b8",
                fontSize: "14px",
              }}
            />
            <input
              type="text"
              placeholder="Search guest by name, room, phone, email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: "100%",
                padding: "12px 20px 12px 46px",
                borderRadius: "99px",
                border: inputBorder,
                background: inputBg,
                color: textColor,
                fontSize: "14px",
                outline: "none",
                boxSizing: "border-box",
                boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
              }}
            />
          </div>

          {/* Right Controls: Filters Button + Grid/List View Toggle Icons */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            {/* Filters Button */}
            <div ref={filterRef} style={{ position: "relative" }}>
              <button
                type="button"
                onClick={() => setShowFilterDropdown((prev) => !prev)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  background: isDark ? "#0f172a" : "#f1f5f9",
                  border: "none",
                  color: textColor,
                  padding: "8px 16px",
                  borderRadius: "99px",
                  fontWeight: "700",
                  fontSize: "14px",
                  cursor: "pointer",
                }}
              >
                <FaSlidersH style={{ color: "#6366f1", fontSize: "14px" }} />
                <span>Filters</span>
                <span
                  style={{
                    fontSize: "11.5px",
                    fontWeight: "800",
                    background: "#6366f1",
                    color: "#ffffff",
                    padding: "2px 10px",
                    borderRadius: "99px",
                    textTransform: "capitalize",
                  }}
                >
                  {statusFilter === "all" ? "All" : statusFilter}
                </span>
              </button>

              {showFilterDropdown && (
                <div
                  style={{
                    position: "absolute",
                    top: "calc(100% + 8px)",
                    right: 0,
                    width: "200px",
                    background: cardBg,
                    border: border,
                    borderRadius: "16px",
                    boxShadow: isDark
                      ? "0 10px 30px rgba(0,0,0,0.5)"
                      : "0 10px 25px rgba(0,0,0,0.08)",
                    padding: "8px",
                    zIndex: 99,
                  }}
                >
                  {[
                    { id: "all", label: "All Queries", count: totalCount },
                    { id: "unread", label: "Unread", count: unreadCount },
                    { id: "read", label: "Read", count: readCount },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        setStatusFilter(opt.id);
                        setShowFilterDropdown(false);
                      }}
                      style={{
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "10px 14px",
                        borderRadius: "10px",
                        border: "none",
                        background: statusFilter === opt.id ? (isDark ? "rgba(99, 102, 241, 0.2)" : "#eff6ff") : "transparent",
                        color: statusFilter === opt.id ? "#6366f1" : textColor,
                        fontWeight: statusFilter === opt.id ? "700" : "500",
                        fontSize: "13.5px",
                        cursor: "pointer",
                      }}
                    >
                      <span>{opt.label}</span>
                      <span style={{ fontSize: "11px", fontWeight: "700", background: isDark ? "#334155" : "#e2e8f0", padding: "2px 7px", borderRadius: "99px" }}>
                        {opt.count}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Grid / List View Toggle Icons */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                background: isDark ? "#0f172a" : "#eef2ff",
                borderRadius: "16px",
                padding: "4px",
                gap: "4px",
              }}
            >
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                title="Grid Card View"
                style={{
                  background: viewMode === "grid" ? (isDark ? "#6366f1" : "#ffffff") : "transparent",
                  color: viewMode === "grid" ? (isDark ? "#ffffff" : "#4f46e5") : subColor,
                  border: "none",
                  borderRadius: "12px",
                  width: "40px",
                  height: "38px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "16px",
                  cursor: "pointer",
                  boxShadow: viewMode === "grid" ? "0 4px 12px rgba(99, 102, 241, 0.25)" : "none",
                  transition: "all 0.2s ease",
                }}
              >
                <FaThLarge />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("table")}
                title="Table List View"
                style={{
                  background: viewMode === "table" ? (isDark ? "#6366f1" : "#ffffff") : "transparent",
                  color: viewMode === "table" ? (isDark ? "#ffffff" : "#4f46e5") : subColor,
                  border: "none",
                  borderRadius: "12px",
                  width: "40px",
                  height: "38px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "16px",
                  cursor: "pointer",
                  boxShadow: viewMode === "table" ? "0 4px 12px rgba(99, 102, 241, 0.25)" : "none",
                  transition: "all 0.2s ease",
                }}
              >
                <FaList />
              </button>
            </div>
          </div>
        </div>

        {/* CONTENT DIRECTLY INSIDE THE UNIFIED CARD: TABLE OR GRID */}
        {loading ? (
          <div style={{ padding: "50px", textAlign: "center", color: subColor, fontSize: "14.5px" }}>
            Loading customer queries...
          </div>
        ) : filteredQueries.length === 0 ? (
          <div style={{ padding: "60px 20px", textAlign: "center", color: subColor }}>
            <FaQuestionCircle style={{ fontSize: "42px", color: isDark ? "#334155" : "#cbd5e1", marginBottom: "14px" }} />
            <h3 style={{ margin: "0 0 6px 0", color: textColor, fontWeight: "700" }}>No Customer Queries Found</h3>
            <p style={{ margin: 0, fontSize: "13.5px" }}>
              {searchQuery ? "Try refining your search terms." : "No customer inquiries matching this status."}
            </p>
          </div>
        ) : viewMode === "table" ? (
          /* TABLE VIEW MODE (MATCHING REFERENCE SCREENSHOT) */
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                textAlign: "left",
                fontFamily: "inherit",
              }}
            >
              <thead>
                <tr
                  style={{
                    background: tableHeaderBg,
                    borderBottom: isDark ? "1px solid #334155" : "1px solid #f1f5f9",
                  }}
                >
                  <th style={{ padding: "18px 24px", fontSize: "12.5px", fontWeight: "800", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.6px", whiteSpace: "nowrap" }}>
                    CUSTOMER
                  </th>
                  <th style={{ padding: "18px 24px", fontSize: "12.5px", fontWeight: "800", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.6px", whiteSpace: "nowrap" }}>
                    SUBJECT
                  </th>
                  <th style={{ padding: "18px 24px", fontSize: "12.5px", fontWeight: "800", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.6px", whiteSpace: "nowrap" }}>
                    CONTACT
                  </th>
                  <th style={{ padding: "18px 24px", fontSize: "12.5px", fontWeight: "800", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.6px", whiteSpace: "nowrap" }}>
                    QUERY DETAILS & DATE
                  </th>
                  <th style={{ padding: "18px 24px", fontSize: "12.5px", fontWeight: "800", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.6px", whiteSpace: "nowrap" }}>
                    STATUS
                  </th>
                  <th style={{ padding: "18px 24px", fontSize: "12.5px", fontWeight: "800", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.6px", textAlign: "right", whiteSpace: "nowrap" }}>
                    ACTIONS
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredQueries.map((q, idx) => {
                  const isUnread = !q.status || q.status === "New" || q.status === "Unread";
                  const fullName = q.first_name || q.last_name
                    ? `${q.first_name || ""} ${q.last_name || ""}`.trim()
                    : "Website Guest";
                  const initials = getInitials(q.first_name, q.last_name);
                  const handle = getHandle(q.first_name, q.last_name);
                  const dateStr = q.created_at
                    ? new Date(q.created_at).toLocaleString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: true,
                      })
                    : "Recent";

                  return (
                    <tr
                      key={q.id || idx}
                      onClick={() => setSelectedQuery(q)}
                      style={{
                        borderBottom: isDark ? "1px solid #334155" : "1px solid #f8fafc",
                        background: isUnread
                          ? isDark ? "rgba(124, 58, 237, 0.05)" : "#faf5ff"
                          : "transparent",
                        cursor: "pointer",
                        transition: "background 0.15s ease",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = tableRowHover)}
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.background = isUnread
                          ? isDark ? "rgba(124, 58, 237, 0.05)" : "#faf5ff"
                          : "transparent")
                      }
                    >
                      {/* CUSTOMER Column */}
                      <td style={{ padding: "18px 24px", verticalAlign: "middle", whiteSpace: "nowrap" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "14px", whiteSpace: "nowrap" }}>
                          <div
                            style={{
                              width: "42px",
                              height: "42px",
                              borderRadius: "50%",
                              background: isUnread
                                ? "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)"
                                : isDark ? "#334155" : "#e2e8f0",
                              color: isUnread ? "#ffffff" : isDark ? "#94a3b8" : "#475569",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "14px",
                              fontWeight: "800",
                              flexShrink: 0,
                              boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
                            }}
                          >
                            {initials}
                          </div>

                          <div>
                            <div style={{ display: "flex", alignItems: "center", gap: "6px", whiteSpace: "nowrap" }}>
                              <span style={{ fontWeight: "800", fontSize: "14.5px", color: textColor, whiteSpace: "nowrap" }}>
                                {fullName}
                              </span>
                              <FaCheckCircle style={{ color: "#3b82f6", fontSize: "14px", flexShrink: 0 }} title="Verified Guest" />
                            </div>
                            <span style={{ fontSize: "12px", color: "#94a3b8", display: "block", marginTop: "1px", whiteSpace: "nowrap" }}>
                              {handle}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* SUBJECT Column */}
                      <td style={{ padding: "18px 24px", verticalAlign: "middle", whiteSpace: "nowrap" }}>
                        <span
                          style={{
                            display: "inline-block",
                            padding: "6px 14px",
                            borderRadius: "10px",
                            background: isDark ? "rgba(99, 102, 241, 0.15)" : "#eff6ff",
                            color: "#6366f1",
                            fontWeight: "700",
                            fontSize: "12.5px",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {q.subject || "General Inquiry"}
                        </span>
                      </td>

                      {/* CONTACT Column */}
                      <td style={{ padding: "18px 24px", verticalAlign: "middle", whiteSpace: "nowrap" }}>
                        <div>
                          <div style={{ fontSize: "13.5px", fontWeight: "700", color: textColor, whiteSpace: "nowrap" }}>
                            {q.email || "No Email"}
                          </div>
                          <div style={{ fontSize: "12.5px", color: "#94a3b8", marginTop: "2px", whiteSpace: "nowrap" }}>
                            {q.phone || "No Phone"}
                          </div>
                        </div>
                      </td>

                      {/* QUERY DETAILS & DATE Column */}
                      <td style={{ padding: "18px 24px", verticalAlign: "middle", maxWidth: "280px" }}>
                        <div
                          style={{
                            fontSize: "13.5px",
                            fontWeight: "700",
                            color: textColor,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            marginBottom: "3px",
                          }}
                        >
                          {q.message || "No message preview"}
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "12px", color: "#94a3b8", whiteSpace: "nowrap" }}>
                          <FaClock style={{ fontSize: "11px", color: "#8b5cf6" }} />
                          <span>{dateStr}</span>
                        </div>
                      </td>

                      {/* STATUS Column */}
                      <td style={{ padding: "18px 24px", verticalAlign: "middle", whiteSpace: "nowrap" }}>
                        {isUnread ? (
                          <span
                            style={{
                              fontSize: "11.5px",
                              fontWeight: "800",
                              padding: "6px 14px",
                              borderRadius: "99px",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "6px",
                              whiteSpace: "nowrap",
                              background: isDark ? "rgba(249, 115, 22, 0.2)" : "#fff7ed",
                              color: "#f97316",
                            }}
                          >
                            ● Unread
                          </span>
                        ) : (
                          <div
                            style={{
                              width: "36px",
                              height: "36px",
                              borderRadius: "12px",
                              background: isDark ? "rgba(16, 185, 129, 0.2)" : "#dcfce7",
                              color: "#10b981",
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "16px",
                              boxShadow: "0 2px 6px rgba(16, 185, 129, 0.15)",
                            }}
                            title="Query Read / Resolved"
                          >
                            <FaCheck />
                          </div>
                        )}
                      </td>

                      {/* ACTIONS Column */}
                      <td style={{ padding: "18px 24px", verticalAlign: "middle", textAlign: "right", whiteSpace: "nowrap" }}>
                        <div
                          style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          {isUnread && (
                            <button
                              type="button"
                              onClick={() => handleMarkRead(q.id)}
                              title="Mark as Read"
                              style={{
                                background: isDark ? "rgba(16, 185, 129, 0.18)" : "#dcfce7",
                                border: "none",
                                color: "#10b981",
                                width: "36px",
                                height: "36px",
                                borderRadius: "10px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: "14px",
                                cursor: "pointer",
                                transition: "all 0.15s ease",
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.08)")}
                              onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
                            >
                              <FaCheckCircle />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleDelete(q.id)}
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
                            onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.08)")}
                            onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          /* GRID VIEW MODE INSIDE UNIFIED CARD */
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(420px, 1fr))",
              gap: "20px",
            }}
          >
            {filteredQueries.map((q, idx) => {
              const isUnread = !q.status || q.status === "New" || q.status === "Unread";
              const fullName = q.first_name || q.last_name
                ? `${q.first_name || ""} ${q.last_name || ""}`.trim()
                : "Website Guest";
              const initials = getInitials(q.first_name, q.last_name);
              const handle = getHandle(q.first_name, q.last_name);
              const dateStr = q.created_at
                ? new Date(q.created_at).toLocaleString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: true,
                  })
                : "Recent";

              return (
                <div
                  key={q.id || idx}
                  onClick={() => setSelectedQuery(q)}
                  style={{
                    background: isDark ? "#0f172a" : "#f8fafc",
                    borderRadius: "20px",
                    border: border,
                    padding: "20px 22px",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-2px)")}
                  onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
                >
                  {/* Header */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "10px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
                      <div
                        style={{
                          width: "42px",
                          height: "42px",
                          borderRadius: "50%",
                          background: isUnread
                            ? "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)"
                            : isDark ? "#334155" : "#e2e8f0",
                          color: isUnread ? "#ffffff" : isDark ? "#94a3b8" : "#475569",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "14px",
                          fontWeight: "800",
                          flexShrink: 0,
                        }}
                      >
                        {initials}
                      </div>

                      <div style={{ minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "5px", whiteSpace: "nowrap" }}>
                          <span style={{ fontWeight: "800", fontSize: "14.5px", color: textColor, whiteSpace: "nowrap" }}>
                            {fullName}
                          </span>
                          <FaCheckCircle style={{ color: "#3b82f6", fontSize: "14px", flexShrink: 0 }} title="Verified Guest" />
                        </div>
                        <span style={{ fontSize: "11.5px", color: "#94a3b8", display: "block", marginTop: "1px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {handle} • {q.phone || q.email || "Daily Guest"}
                        </span>
                      </div>
                    </div>

                    <span
                      style={{
                        padding: "4px 10px",
                        borderRadius: "8px",
                        background: isDark ? "rgba(99, 102, 241, 0.15)" : "#eff6ff",
                        color: "#6366f1",
                        fontWeight: "700",
                        fontSize: "11.5px",
                        whiteSpace: "nowrap",
                        flexShrink: 0,
                      }}
                    >
                      {q.subject || "General Inquiry"}
                    </span>
                  </div>

                  {/* Middle Box */}
                  <div
                    style={{
                      background: cardBg,
                      border: border,
                      borderRadius: "14px",
                      padding: "14px 18px",
                      margin: "18px 0",
                    }}
                  >
                    <div style={{ fontSize: "13.5px", fontWeight: "700", color: textColor, marginBottom: "8px", lineHeight: "1.4" }}>
                      📌 "{q.message || "No message content"}"
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "10px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: subColor }}>
                        <span style={{ fontWeight: "600" }}>Status:</span>
                        {isUnread ? (
                          <span style={{ fontWeight: "800", color: "#f97316", background: isDark ? "rgba(249, 115, 22, 0.2)" : "#fff7ed", padding: "2px 8px", borderRadius: "99px", fontSize: "11px" }}>
                            ● Unread
                          </span>
                        ) : (
                          <span style={{ fontWeight: "800", color: "#10b981", background: isDark ? "rgba(16, 185, 129, 0.2)" : "#dcfce7", padding: "2px 8px", borderRadius: "99px", fontSize: "11px", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                            <FaCheck style={{ fontSize: "10px" }} /> Read
                          </span>
                        )}
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "12px", color: "#8b5cf6", fontWeight: "600" }}>
                        <FaClock style={{ fontSize: "11px" }} />
                        <span>{dateStr}</span>
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }} onClick={(e) => e.stopPropagation()}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      {q.email && (
                        <span style={{ fontSize: "12px", color: subColor, display: "flex", alignItems: "center", gap: "4px" }}>
                          <FaEnvelope style={{ color: "#6366f1" }} /> {q.email}
                        </span>
                      )}
                    </div>

                    <div style={{ display: "flex", gap: "8px" }}>
                      {isUnread && (
                        <button
                          type="button"
                          onClick={() => handleMarkRead(q.id)}
                          title="Mark as Read"
                          style={{
                            background: isDark ? "rgba(16, 185, 129, 0.18)" : "#dcfce7",
                            border: "none",
                            color: "#10b981",
                            padding: "6px 12px",
                            borderRadius: "10px",
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                            fontSize: "12.5px",
                            fontWeight: "700",
                            cursor: "pointer",
                          }}
                        >
                          <FaCheckCircle /> Mark Read
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleDelete(q.id)}
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
                        onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.08)")}
                        onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. SELECTED QUERY DETAIL MODAL / DRAWER */}
      {selectedQuery && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.5)",
            backdropFilter: "blur(4px)",
            zIndex: 999999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
          onClick={() => setSelectedQuery(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: cardBg,
              borderRadius: "20px",
              border: border,
              width: "560px",
              maxWidth: "95vw",
              padding: "28px",
              boxShadow: isDark
                ? "0 20px 50px rgba(0,0,0,0.7)"
                : "0 20px 50px rgba(0,0,0,0.15)",
              animation: "slideInDown 0.2s ease-out forwards",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
              <div>
                <h2 style={{ margin: 0, fontSize: "20px", fontWeight: "800", color: textColor }}>
                  {selectedQuery.first_name || selectedQuery.last_name
                    ? `${selectedQuery.first_name || ""} ${selectedQuery.last_name || ""}`.trim()
                    : "Website Guest"}
                </h2>
                <span style={{ fontSize: "13px", color: subColor, display: "block", marginTop: "4px" }}>
                  Submitted on {selectedQuery.created_at ? new Date(selectedQuery.created_at).toLocaleString("en-IN") : "N/A"}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedQuery(null)}
                style={{
                  background: isDark ? "#0f172a" : "#f1f5f9",
                  color: subColor,
                  border: "none",
                  borderRadius: "50%",
                  width: "32px",
                  height: "32px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "14px",
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ background: isDark ? "#0f172a" : "#f8fafc", padding: "16px", borderRadius: "14px", marginBottom: "20px", border: border }}>
              <div style={{ fontSize: "12px", fontWeight: "700", color: subColor, marginBottom: "8px" }}>GUEST CONTACT DETAILS</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "14px" }}>
                {selectedQuery.email && (
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <FaEnvelope style={{ color: "#6366f1", fontSize: "16px" }} />
                    <a href={`mailto:${selectedQuery.email}`} style={{ color: "#6366f1", fontWeight: "600", textDecoration: "none" }}>
                      {selectedQuery.email}
                    </a>
                  </div>
                )}
                {selectedQuery.phone && (
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <FaPhone style={{ color: "#10b981", fontSize: "16px" }} />
                    <a href={`tel:${selectedQuery.phone}`} style={{ color: "#10b981", fontWeight: "600", textDecoration: "none" }}>
                      {selectedQuery.phone}
                    </a>
                  </div>
                )}
              </div>
            </div>

            <div style={{ marginBottom: "18px" }}>
              <div style={{ fontSize: "12px", fontWeight: "700", color: subColor, marginBottom: "4px" }}>SUBJECT</div>
              <div style={{ fontSize: "15px", fontWeight: "700", color: "#3b82f6" }}>
                📌 {selectedQuery.subject || "General Inquiry"}
              </div>
            </div>

            <div style={{ marginBottom: "24px" }}>
              <div style={{ fontSize: "12px", fontWeight: "700", color: subColor, marginBottom: "8px" }}>CUSTOMER MESSAGE</div>
              <div
                style={{
                  background: isDark ? "#0f172a" : "#ffffff",
                  border: border,
                  borderRadius: "12px",
                  padding: "16px",
                  fontSize: "14.5px",
                  color: textColor,
                  lineHeight: "1.6",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                }}
              >
                "{selectedQuery.message}"
              </div>
            </div>

            <div style={{ display: "flex", gap: "12px" }}>
              {(!selectedQuery.status || selectedQuery.status === "New" || selectedQuery.status === "Unread") && (
                <button
                  type="button"
                  onClick={() => handleMarkRead(selectedQuery.id)}
                  style={{
                    flex: 1,
                    background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "12px",
                    padding: "12px",
                    fontWeight: "700",
                    fontSize: "14px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    boxShadow: "0 4px 12px rgba(16, 185, 129, 0.3)",
                  }}
                >
                  <FaCheckCircle /> Mark as Read
                </button>
              )}
              <button
                type="button"
                onClick={() => handleDelete(selectedQuery.id)}
                style={{
                  background: isDark ? "rgba(239, 68, 68, 0.18)" : "#ffe4e6",
                  color: "#ef4444",
                  border: "none",
                  borderRadius: "12px",
                  padding: "12px 20px",
                  fontWeight: "700",
                  fontSize: "14px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <FaTrash /> Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
