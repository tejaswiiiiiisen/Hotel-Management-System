import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "../components/PageHeader.jsx";
import { getRooms } from "../utils/roomStore.js";
import {
  FaBell,
  FaCheckDouble,
  FaSearch,
  FaPaperclip,
  FaReply,
  FaUserCheck,
  FaExclamationTriangle,
  FaFilter,
} from "react-icons/fa";
import {
  getNotifications,
  subscribeNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  toggleNotificationRead,
} from "../services/notificationStore.js";

export default function Notifications() {
  const navigate = useNavigate();
  const [list, setList] = useState(getNotifications());
  const [activeTab, setActiveTab] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");

  const handleItemClick = (item) => {
    markNotificationRead(item.id);

    try {
      const rooms = getRooms() || [];
      const bDetails = item.bookingDetails || {};
      const targetRoomId = bDetails.roomId || bDetails.room_id || item.roomId;
      const roomSearchStr = String(
        item.room || item.target || bDetails.roomName || bDetails.roomNumber || ""
      ).trim().toLowerCase();
      const guestNameStr = String(item.user || bDetails.guestName || "").trim().toLowerCase();

      const matched = rooms.find((r) => {
        if (targetRoomId && String(r.id) === String(targetRoomId)) return true;

        const rNum = String(r.number || r.roomNumber || r.id || "").toLowerCase();
        const rName = String(r.name || r.roomTitle || "").toLowerCase();

        if (roomSearchStr && (rNum === roomSearchStr || rName.includes(roomSearchStr) || roomSearchStr.includes(rName) || roomSearchStr.includes(rNum))) {
          return true;
        }

        if (r.booking && r.booking.guestName && guestNameStr && r.booking.guestName.toLowerCase().includes(guestNameStr)) {
          return true;
        }

        return false;
      });

      if (matched) {
        navigate(`/rooms/${matched.id}`);
        return;
      }
    } catch (err) {
      console.warn("Room navigation error:", err);
    }

    navigate("/rooms");
  };

  // DYNAMIC DARK / LIGHT MODE DETECTOR
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

  const themeStyles = {
    // Header Mark Read Button
    headerBtnBg: isDark ? "#1e293b" : "#ffffff",
    headerBtnBorder: isDark ? "#334155" : "#e2e8f0",
    headerBtnColor: isDark ? "#ffffff" : "#0f172a",

    // Panel
    panelBg: isDark ? "#1e293b" : "#ffffff",
    panelBorder: isDark ? "#334155" : "#e2e8f0",

    // Stat Card 1 (Total)
    card1Bg: isDark ? "#0f172a" : "#f8fafc",
    card1Border: isDark ? "#334155" : "#f1f5f9",
    card1Label: isDark ? "#cbd5e1" : "#64748b",
    card1Val: isDark ? "#ffffff" : "#0f172a",

    // Stat Card 2 (Unread)
    card2Bg: isDark ? "rgba(59, 130, 246, 0.15)" : "#eff6ff",
    card2Border: isDark ? "rgba(59, 130, 246, 0.3)" : "#dbeafe",
    card2Label: isDark ? "#93c5fd" : "#1e40af",
    card2Val: isDark ? "#60a5fa" : "#2563eb",

    // Stat Card 3 (Action Pending)
    card3Bg: isDark ? "rgba(34, 197, 94, 0.15)" : "#f0fdf4",
    card3Border: isDark ? "rgba(34, 197, 94, 0.3)" : "#dcfce7",
    card3Label: isDark ? "#86efac" : "#166534",
    card3Val: isDark ? "#4ade80" : "#16a34a",

    // Search Box
    searchBg: isDark ? "#0f172a" : "#f8fafc",
    searchBorder: isDark ? "#334155" : "#e2e8f0",
    searchText: isDark ? "#ffffff" : "#0f172a",
    searchPlaceholder: isDark ? "#64748b" : "#94a3b8",

    // Filter Tabs
    tabActiveBg: isDark ? "#667eea" : "#0f172a",
    tabActiveColor: "#ffffff",
    tabInactiveBg: isDark ? "#0f172a" : "#ffffff",
    tabInactiveBorder: isDark ? "#334155" : "#e2e8f0",
    tabInactiveColor: isDark ? "#cbd5e1" : "#64748b",

    // Item Card
    itemUnreadBg: isDark ? "rgba(102, 126, 234, 0.12)" : "#f8fafc",
    itemReadBg: isDark ? "#0f172a" : "#ffffff",
    itemUnreadBorder: isDark ? "#667eea" : "#e2e8f0",
    itemReadBorder: isDark ? "#334155" : "#f1f5f9",

    // Item Typography
    userNameColor: isDark ? "#ffffff" : "#0f172a",
    actionTextColor: isDark ? "#f1f5f9" : "#475569",
    targetColor: isDark ? "#ffffff" : "#0f172a",
    timeColor: isDark ? "#cbd5e1" : "#94a3b8",

    // Action Pill
    actionPillUnreadBg: isDark ? "rgba(102, 126, 234, 0.25)" : "#eff6ff",
    actionPillUnreadColor: isDark ? "#c7d2fe" : "#2563eb",
    actionPillReadBg: isDark ? "#1e293b" : "#f1f5f9",
    actionPillReadColor: isDark ? "#94a3b8" : "#64748b",
  };

  const getMessageStyles = (item) => {
    if (isDark) {
      if (
        item.messageBg === "#d1fae5" ||
        item.messageBg === "#dcfce7" ||
        item.messageColor === "#065f46" ||
        item.messageColor === "#166534"
      ) {
        return {
          background: "rgba(34, 197, 94, 0.2)",
          color: "#86efac",
          border: "1px solid rgba(34, 197, 94, 0.35)",
        };
      }
      if (
        item.messageBg === "#e0e7ff" ||
        item.messageBg === "#e0f2fe" ||
        item.messageColor === "#3730a3"
      ) {
        return {
          background: "rgba(99, 102, 241, 0.2)",
          color: "#c7d2fe",
          border: "1px solid rgba(99, 102, 241, 0.35)",
        };
      }
      if (item.isHkApproval) {
        return {
          background: "rgba(168, 85, 247, 0.2)",
          color: "#e9d5ff",
          border: "1px solid rgba(168, 85, 247, 0.35)",
        };
      }
      return {
        background: "#0f172a",
        color: "#f8fafc",
        border: "1px solid #334155",
      };
    } else {
      return {
        background: item.messageBg || "#f1f5f9",
        color: item.messageColor || "#334155",
        border: "none",
      };
    }
  };

  useEffect(() => {
    const unsubscribe = subscribeNotifications((newList) => setList(newList));
    return () => unsubscribe();
  }, []);

  const markAllRead = () => {
    markAllNotificationsRead();
  };

  const toggleRead = (id) => {
    toggleNotificationRead(id);
  };

  const filtered = list.filter((item) => {
    const matchesTab =
      activeTab === "All" ||
      (activeTab === "Unread" && item.unread) ||
      (activeTab === "Mentions" &&
        (item.category === "Mentions" || item.message)) ||
      (activeTab === "Alerts" && item.category === "Alerts");

    const matchesSearch =
      item.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.message &&
        item.message.toLowerCase().includes(searchTerm.toLowerCase()));

    return matchesTab && matchesSearch;
  });

  const unreadCount = list.filter((i) => i.unread).length;

  return (
    <>
      <PageHeader
        title="Notifications Center"
        subtitle="View full notification log, guest alerts, messages and activity updates"
        action={
          <button
            type="button"
            onClick={markAllRead}
            style={{
              background: themeStyles.headerBtnBg,
              border: `1px solid ${themeStyles.headerBtnBorder}`,
              color: themeStyles.headerBtnColor,
              padding: "10px 18px",
              borderRadius: "12px",
              fontSize: "13.5px",
              fontWeight: "700",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              boxShadow: "0 2px 6px rgba(0,0,0,0.04)",
            }}
          >
            <FaCheckDouble style={{ color: "#667eea" }} /> Mark All as Read
          </button>
        }
      />

      <section
        className="panel"
        style={{
          padding: "28px",
          borderRadius: "20px",
          background: themeStyles.panelBg,
          border: `1px solid ${themeStyles.panelBorder}`,
        }}
      >
        {/* SUMMARY STATS */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "16px",
            marginBottom: "24px",
          }}
        >
          <div
            style={{
              background: themeStyles.card1Bg,
              borderRadius: "14px",
              padding: "16px 20px",
              border: `1px solid ${themeStyles.card1Border}`,
            }}
          >
            <span
              style={{
                fontSize: "12px",
                color: themeStyles.card1Label,
                fontWeight: "700",
              }}
            >
              Total Notifications
            </span>
            <div
              style={{
                fontSize: "24px",
                fontWeight: "800",
                color: themeStyles.card1Val,
                marginTop: "4px",
              }}
            >
              {list.length} Logs
            </div>
          </div>

          <div
            style={{
              background: themeStyles.card2Bg,
              borderRadius: "14px",
              padding: "16px 20px",
              border: `1px solid ${themeStyles.card2Border}`,
            }}
          >
            <span
              style={{
                fontSize: "12px",
                color: themeStyles.card2Label,
                fontWeight: "700",
              }}
            >
              Unread Alerts
            </span>
            <div
              style={{
                fontSize: "24px",
                fontWeight: "800",
                color: themeStyles.card2Val,
                marginTop: "4px",
              }}
            >
              {unreadCount} Unread
            </div>
          </div>

          <div
            style={{
              background: themeStyles.card3Bg,
              borderRadius: "14px",
              padding: "16px 20px",
              border: `1px solid ${themeStyles.card3Border}`,
            }}
          >
            <span
              style={{
                fontSize: "12px",
                color: themeStyles.card3Label,
                fontWeight: "700",
              }}
            >
              Action Items
            </span>
            <div
              style={{
                fontSize: "24px",
                fontWeight: "800",
                color: themeStyles.card3Val,
                marginTop: "4px",
              }}
            >
              3 Pending Responses
            </div>
          </div>
        </div>

        {/* SEARCH & FILTER CONTROLS */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "24px",
            gap: "16px",
            flexWrap: "wrap",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              background: themeStyles.searchBg,
              border: `1px solid ${themeStyles.searchBorder}`,
              padding: "8px 14px",
              borderRadius: "12px",
              width: "300px",
            }}
          >
            <FaSearch style={{ color: themeStyles.searchPlaceholder }} />
            <input
              type="text"
              placeholder="Search notifications..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                border: "none",
                background: "transparent",
                color: themeStyles.searchText,
                outline: "none",
                fontSize: "13px",
                width: "100%",
              }}
            />
          </div>

          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {["All", "Unread", "Mentions", "Alerts"].map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: "6px 16px",
                  borderRadius: "20px",
                  fontSize: "12.5px",
                  fontWeight: "700",
                  border:
                    activeTab === tab
                      ? "none"
                      : `1px solid ${themeStyles.tabInactiveBorder}`,
                  background:
                    activeTab === tab
                      ? themeStyles.tabActiveBg
                      : themeStyles.tabInactiveBg,
                  color:
                    activeTab === tab
                      ? themeStyles.tabActiveColor
                      : themeStyles.tabInactiveColor,
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* FULL NOTIFICATION CARDS LIST */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {filtered.map((item) => {
            const msgStyle = getMessageStyles(item);

            return (
              <div
                key={item.id}
                onClick={() => handleItemClick(item)}
                style={{
                  background: item.unread
                    ? themeStyles.itemUnreadBg
                    : themeStyles.itemReadBg,
                  border: item.unread
                    ? `1px solid ${themeStyles.itemUnreadBorder}`
                    : `1px solid ${themeStyles.itemReadBorder}`,
                  borderRadius: "16px",
                  padding: "20px",
                  display: "flex",
                  gap: "16px",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
                  cursor: "pointer",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    gap: "16px",
                    alignItems: "flex-start",
                    flex: 1,
                  }}
                >
                  <div
                    style={{
                      width: "44px",
                      height: "44px",
                      borderRadius: "50%",
                      background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                      color: "#ffffff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "16px",
                      fontWeight: "700",
                      flexShrink: 0,
                    }}
                  >
                    {(item.user || "A")[0]?.toUpperCase()}
                  </div>

                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        marginBottom: "4px",
                        flexWrap: "wrap",
                      }}
                    >
                      <h4
                        style={{
                          margin: 0,
                          fontSize: "15px",
                          fontWeight: "800",
                          color: themeStyles.userNameColor,
                        }}
                      >
                        {item.user}
                      </h4>
                      <span
                        style={{
                          fontSize: "13.5px",
                          color: themeStyles.actionTextColor,
                        }}
                      >
                        {item.action}
                      </span>
                      {item.target && (
                        <strong
                          style={{
                            fontSize: "14px",
                            fontWeight: "800",
                            color: themeStyles.targetColor,
                          }}
                        >
                          {item.target}
                        </strong>
                      )}
                    </div>

                    {/* MESSAGE HIGHLIGHT BOX */}
                    {item.message && (
                      <div
                        style={{
                          background: msgStyle.background,
                          color: msgStyle.color,
                          border: msgStyle.border || "none",
                          padding: "14px 18px",
                          borderRadius: "14px",
                          fontSize: "13px",
                          fontWeight: "600",
                          marginTop: "10px",
                          marginBottom: "8px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: "16px",
                          lineHeight: "1.4",
                          maxWidth: "650px",
                        }}
                      >
                        <span>{item.message}</span>
                        <button
                          type="button"
                          style={{
                            background: isDark ? "#334155" : "#ffffff",
                            border: "none",
                            color: isDark ? "#ffffff" : "#0f172a",
                            padding: "6px 14px",
                            borderRadius: "8px",
                            fontSize: "12px",
                            fontWeight: "700",
                            cursor: "pointer",
                            boxShadow: "0 2px 6px rgba(0,0,0,0.06)",
                            flexShrink: 0,
                          }}
                        >
                          Reply
                        </button>
                      </div>
                    )}

                    {/* ATTACHMENT BOX */}
                    {item.file && (
                      <div
                        style={{
                          background: isDark ? "#0f172a" : "#f8fafc",
                          border: `1px solid ${themeStyles.panelBorder}`,
                          padding: "12px 16px",
                          borderRadius: "12px",
                          fontSize: "13px",
                          marginTop: "10px",
                          marginBottom: "8px",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "12px",
                          color: themeStyles.actionTextColor,
                          fontWeight: "600",
                        }}
                      >
                        <FaPaperclip style={{ color: "#667eea" }} />
                        <span>{item.file}</span>
                        <span
                          style={{
                            fontSize: "11px",
                            color: themeStyles.timeColor,
                          }}
                        >
                          ({item.fileSize})
                        </span>
                      </div>
                    )}

                    <div
                      style={{
                        fontSize: "12px",
                        fontWeight: "600",
                        color: themeStyles.timeColor,
                        marginTop: "4px",
                      }}
                    >
                      {item.time}
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => toggleRead(item.id)}
                    style={{
                      background: item.unread
                        ? themeStyles.actionPillUnreadBg
                        : themeStyles.actionPillReadBg,
                      color: item.unread
                        ? themeStyles.actionPillUnreadColor
                        : themeStyles.actionPillReadColor,
                      border: "none",
                      padding: "6px 12px",
                      borderRadius: "8px",
                      fontSize: "12px",
                      fontWeight: "700",
                      cursor: "pointer",
                    }}
                  >
                    {item.unread ? "Mark Read" : "Read"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </>
  );
}
