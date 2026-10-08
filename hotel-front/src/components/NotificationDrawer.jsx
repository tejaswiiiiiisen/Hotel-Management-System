import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaTimes,
  FaCog,
  FaExpandAlt,
  FaCheckDouble,
  FaCamera,
  FaCheckCircle,
  FaSync,
  FaExclamationTriangle,
} from "react-icons/fa";
import {
  getNotifications,
  subscribeNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  toggleNotificationRead,
} from "../services/notificationStore.js";
import {
  getHkTasks,
  approveHkTask,
  rejectAndRescheduleHkTask,
  subscribeHkTasks,
} from "../services/housekeepingStore.js";
import { getUserName, getUserRole } from "../auth.js";
import { getRooms } from "../utils/roomStore.js";

export default function NotificationDrawer({ onClose }) {
  const navigate = useNavigate();
  const role = getUserRole();
  const userName = getUserName() || "Super Admin";

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
    panelBg: isDark ? "#1e293b" : "#ffffff",
    panelBorder: isDark ? "#334155" : "#e2e8f0",
    headerBg: isDark ? "#1e293b" : "#ffffff",
    headerBorder: isDark ? "#334155" : "#f1f5f9",
    titleColor: isDark ? "#ffffff" : "#0f172a",
    iconColor: isDark ? "#e2e8f0" : "#64748b",

    filterBarBg: isDark ? "#0f172a" : "#fafafa",
    tabContainerBg: isDark ? "#0f172a" : "#e2e8f0",
    tabActiveBg: isDark ? "#334155" : "#ffffff",
    tabActiveColor: isDark ? "#ffffff" : "#0f172a",
    tabInactiveColor: isDark ? "#cbd5e1" : "#64748b",

    itemBorder: isDark ? "#334155" : "#f8fafc",
    itemHoverBg: isDark ? "#334155" : "#f1f5f9",
    itemUnreadBg: isDark
      ? "rgba(102, 126, 234, 0.18)"
      : "rgba(102, 126, 234, 0.04)",
    userNameColor: isDark ? "#ffffff" : "#0f172a",
    actionTextColor: isDark ? "#f1f5f9" : "#334155",
    targetColor: isDark ? "#ffffff" : "#0f172a",
    timeColor: isDark ? "#cbd5e1" : "#94a3b8",

    footerBg: isDark ? "#1e293b" : "#ffffff",
    footerBorder: isDark ? "#334155" : "#f1f5f9",
    btnBg: isDark ? "#0f172a" : "#f8fafc",
    btnBorder: isDark ? "#334155" : "#e2e8f0",
    btnColor: isDark ? "#ffffff" : "#0f172a",
    btnHoverBg: isDark ? "#334155" : "#f1f5f9",

    modalBg: isDark ? "#1e293b" : "#ffffff",
    modalHeaderBg: isDark
      ? "#0f172a"
      : "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
    modalBoxBg: isDark ? "#0f172a" : "#f8fafc",
  };

  const getMessageStyles = (item, matchedTask) => {
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
      if (matchedTask || item.isHkApproval) {
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
      if (matchedTask || item.isHkApproval) {
        return {
          background: "#f3e8ff",
          color: "#6b21a8",
          border: "none",
        };
      }
      return {
        background: item.messageBg || "#f1f5f9",
        color: item.messageColor || "#334155",
        border: "none",
      };
    }
  };

  const [activeTab, setActiveTab] = useState("All");
  const [notifications, setNotifications] = useState(getNotifications());
  const [hkTasks, setHkTasks] = useState(getHkTasks());

  const [activeTaskModal, setActiveTaskModal] = useState(null);
  const [rejectReasonModal, setRejectReasonModal] = useState(null);
  const [customReason, setCustomReason] = useState("");
  const [actionToast, setActionToast] = useState("");

  useEffect(() => {
    const unsubscribeNotif = subscribeNotifications((list) =>
      setNotifications(list)
    );
    const unsubscribeHk = subscribeHkTasks((tasks) => setHkTasks(tasks));
    return () => {
      unsubscribeNotif();
      unsubscribeHk();
    };
  }, []);

  const filtered = notifications.filter((n) => {
    if (activeTab === "Unread") return n.unread;
    if (activeTab === "Mentions")
      return n.category === "Mentions" || n.category === "Alerts" || n.message;
    return true;
  });

  const unreadCount = notifications.filter((n) => n.unread).length;

  const handleViewAll = () => {
    if (onClose) onClose();
    navigate("/notifications");
  };

  const handleItemClick = (item) => {
    markNotificationRead(item.id);

    // 1. Check for associated housekeeping task inspection modal
    const task = hkTasks.find(
      (t) =>
        t.id === item.taskId ||
        (item.room && t.room === item.room) ||
        (item.target && item.target.includes(t.room)) ||
        (item.message && item.message.includes(t.room))
    );

    if (task) {
      setActiveTaskModal(task);
      return;
    }

    // 2. Room Booking / Customer Occupied Room redirection
    try {
      const rooms = getRooms() || [];
      const bDetails = item.bookingDetails || {};
      const targetRoomId = bDetails.roomId || bDetails.room_id || item.roomId;
      const roomSearchStr = String(
        item.room || item.target || bDetails.roomName || bDetails.roomNumber || ""
      ).trim().toLowerCase();
      const guestNameStr = String(item.user || bDetails.guestName || "").trim().toLowerCase();

      // Find matching room in store
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
        if (onClose) onClose();
        navigate(`/rooms/${matched.id}`);
        return;
      }
    } catch (err) {
      console.warn("Room navigation match error:", err);
    }

    // Fallback: Navigate to /rooms page
    if (onClose) onClose();
    navigate("/rooms");
  };

  const handleApproveTask = (taskId) => {
    const res = approveHkTask(taskId, userName, role);
    setActiveTaskModal(null);
    setActionToast(
      `✅ ${res?.room || "Room"} approved & marked Clean by ${userName}!`
    );
    setTimeout(() => setActionToast(""), 5000);
  };

  const handleOpenReject = (task) => {
    setRejectReasonModal(task);
    setCustomReason("Incomplete cleaning, floor dust / stains remaining.");
  };

  const handleConfirmRejectTask = () => {
    if (!rejectReasonModal) return;
    const res = rejectAndRescheduleHkTask(
      rejectReasonModal.id,
      userName,
      role,
      customReason || "Re-cleaning required"
    );
    if (activeTaskModal?.id === rejectReasonModal.id) setActiveTaskModal(null);
    setRejectReasonModal(null);
    setActionToast(
      `⚠️ ${res?.room || "Room"} cleaning re-scheduled for Housekeeping.`
    );
    setTimeout(() => setActionToast(""), 5000);
  };

  return (
    <>
      {/* BACKGROUND OVERLAY CLOSE TRIGGER */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 9998,
          background: isDark ? "rgba(0, 0, 0, 0.6)" : "rgba(15, 23, 42, 0.2)",
          backdropFilter: "blur(2px)",
        }}
      />

      {/* NOTIFICATIONS PANEL POPUP / DRAWER */}
      <div
        style={{
          position: "fixed",
          top: "70px",
          right: "24px",
          width: "430px",
          maxHeight: "85vh",
          background: themeStyles.panelBg,
          color: themeStyles.titleColor,
          borderRadius: "20px",
          boxShadow: isDark
            ? "0 20px 50px rgba(0, 0, 0, 0.7)"
            : "0 20px 50px rgba(0, 0, 0, 0.18), 0 10px 20px rgba(0, 0, 0, 0.05)",
          border: `1px solid ${themeStyles.panelBorder}`,
          zIndex: 9999,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          animation: "fadeInDown 0.25s ease-out",
        }}
      >
        {/* ACTION TOAST FEEDBACK */}
        {actionToast && (
          <div
            style={{
              background: "#0f172a",
              color: "#ffffff",
              padding: "10px 16px",
              fontSize: "12.5px",
              fontWeight: "700",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderBottom: "2px solid #8b5cf6",
            }}
          >
            <span>{actionToast}</span>
            <button
              type="button"
              onClick={() => setActionToast("")}
              style={{
                background: "transparent",
                border: "none",
                color: "#94a3b8",
                cursor: "pointer",
              }}
            >
              <FaTimes />
            </button>
          </div>
        )}

        {/* HEADER BAR */}
        <div
          style={{
            padding: "20px 24px 16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: `1px solid ${themeStyles.headerBorder}`,
            background: themeStyles.headerBg,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <h3
              style={{
                margin: 0,
                fontSize: "20px",
                fontWeight: "800",
                color: themeStyles.titleColor,
                fontFamily: "'Inter', sans-serif",
              }}
            >
              Notifications
            </h3>
            {unreadCount > 0 && (
              <span
                style={{
                  background: "#ef4444",
                  color: "#ffffff",
                  fontSize: "11px",
                  fontWeight: "800",
                  padding: "2px 8px",
                  borderRadius: "999px",
                }}
              >
                {unreadCount} new
              </span>
            )}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <button
              type="button"
              onClick={handleViewAll}
              title="Expand to Full Page"
              style={{
                background: "transparent",
                border: "none",
                color: themeStyles.iconColor,
                cursor: "pointer",
                fontSize: "14px",
                padding: "4px",
                display: "flex",
              }}
            >
              <FaExpandAlt />
            </button>

            <button
              type="button"
              onClick={() => navigate("/settings")}
              title="Notification Settings"
              style={{
                background: "transparent",
                border: "none",
                color: themeStyles.iconColor,
                cursor: "pointer",
                fontSize: "15px",
                padding: "4px",
                display: "flex",
              }}
            >
              <FaCog />
            </button>

            <button
              type="button"
              onClick={onClose}
              title="Close"
              style={{
                background: "transparent",
                border: "none",
                color: themeStyles.iconColor,
                cursor: "pointer",
                fontSize: "16px",
                padding: "4px",
                display: "flex",
              }}
            >
              <FaTimes />
            </button>
          </div>
        </div>

        {/* TABS & FILTER BAR */}
        <div
          style={{
            padding: "12px 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: themeStyles.filterBarBg,
            borderBottom: `1px solid ${themeStyles.headerBorder}`,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              background: themeStyles.tabContainerBg,
              borderRadius: "10px",
              padding: "3px",
              gap: "2px",
            }}
          >
            {[
              { key: "All", label: "All" },
              { key: "Unread", label: "Unread" },
              { key: "Mentions", label: "Mentions" },
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                style={{
                  padding: "6px 14px",
                  borderRadius: "8px",
                  border: "none",
                  background:
                    activeTab === tab.key
                      ? themeStyles.tabActiveBg
                      : "transparent",
                  color:
                    activeTab === tab.key
                      ? themeStyles.tabActiveColor
                      : themeStyles.tabInactiveColor,
                  fontWeight: activeTab === tab.key ? "800" : "600",
                  fontSize: "12.5px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  boxShadow:
                    activeTab === tab.key
                      ? "0 2px 6px rgba(0,0,0,0.15)"
                      : "none",
                  transition: "all 0.2s ease",
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {unreadCount > 0 && (
            <button
              type="button"
              title="Mark all as read"
              onClick={markAllNotificationsRead}
              style={{
                background: "transparent",
                border: "none",
                color: isDark ? "#818cf8" : "#667eea",
                cursor: "pointer",
                fontSize: "12px",
                fontWeight: "700",
                display: "flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              <FaCheckDouble /> Read All
            </button>
          )}
        </div>

        {/* NOTIFICATION ITEMS LIST */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "4px 0",
          }}
        >
          {filtered.length === 0 ? (
            <div
              style={{
                padding: "40px 20px",
                textAlign: "center",
                color: themeStyles.timeColor,
                fontSize: "13px",
              }}
            >
              No notifications found
            </div>
          ) : (
            filtered.map((item) => {
              const matchedTask = hkTasks.find(
                (t) =>
                  t.id === item.taskId ||
                  (item.room && t.room === item.room) ||
                  (item.target && item.target.includes(t.room)) ||
                  (item.message && item.message.includes(t.room))
              );

              const msgStyle = getMessageStyles(item, matchedTask);

              return (
                <div
                  key={item.id}
                  onClick={() => handleItemClick(item)}
                  style={{
                    padding: "14px 24px",
                    borderBottom: `1px solid ${themeStyles.itemBorder}`,
                    display: "flex",
                    gap: "14px",
                    alignItems: "flex-start",
                    background: item.unread
                      ? themeStyles.itemUnreadBg
                      : "transparent",
                    transition: "background 0.15s ease",
                    cursor: "pointer",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = themeStyles.itemHoverBg)
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = item.unread
                      ? themeStyles.itemUnreadBg
                      : "transparent")
                  }
                >
                  <div
                    style={{
                      width: "38px",
                      height: "38px",
                      borderRadius: "50%",
                      background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                      color: "#ffffff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "14px",
                      fontWeight: "700",
                      flexShrink: 0,
                      marginTop: "2px",
                    }}
                  >
                    {(item.user || "A")[0]?.toUpperCase()}
                  </div>

                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: "4px",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "13px",
                          color: themeStyles.actionTextColor,
                          lineHeight: "1.4",
                        }}
                      >
                        <strong
                          style={{
                            fontWeight: "800",
                            color: themeStyles.userNameColor,
                          }}
                        >
                          {item.user}
                        </strong>{" "}
                        <span>{item.action}</span>{" "}
                        {item.target && (
                          <strong
                            style={{
                              fontWeight: "800",
                              color: themeStyles.targetColor,
                            }}
                          >
                            {item.target}
                          </strong>
                        )}
                      </div>

                      {item.unread && (
                        <span
                          style={{
                            width: "8px",
                            height: "8px",
                            borderRadius: "50%",
                            background: "#667eea",
                            flexShrink: 0,
                            marginLeft: "6px",
                          }}
                        />
                      )}
                    </div>

                    {/* MESSAGE BOX */}
                    {item.message && (
                      <div
                        style={{
                          background: msgStyle.background,
                          color: msgStyle.color,
                          border: msgStyle.border || "none",
                          padding: "10px 14px",
                          borderRadius: "10px",
                          fontSize: "12px",
                          fontWeight: "600",
                          marginTop: "6px",
                          marginBottom: "6px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: "10px",
                          lineHeight: "1.4",
                        }}
                      >
                        <span>{item.message}</span>
                        {matchedTask && (
                          <span
                            style={{
                              background: "#7c3aed",
                              color: "#ffffff",
                              fontSize: "10.5px",
                              fontWeight: "800",
                              padding: "4px 9px",
                              borderRadius: "6px",
                              flexShrink: 0,
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                            }}
                          >
                            <FaCamera style={{ fontSize: "10px" }} /> Inspect
                          </span>
                        )}
                      </div>
                    )}

                    <div
                      style={{
                        fontSize: "11.5px",
                        fontWeight: "600",
                        color: themeStyles.timeColor,
                      }}
                    >
                      {item.time}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* BOTTOM FOOTER WITH "VIEW ALL NOTIFICATIONS" BUTTON */}
        <div
          style={{
            padding: "14px 24px",
            borderTop: `1px solid ${themeStyles.footerBorder}`,
            background: themeStyles.footerBg,
            textAlign: "center",
          }}
        >
          <button
            type="button"
            onClick={handleViewAll}
            style={{
              width: "100%",
              padding: "11px 16px",
              borderRadius: "12px",
              border: `1px solid ${themeStyles.btnBorder}`,
              background: themeStyles.btnBg,
              color: themeStyles.btnColor,
              fontWeight: "800",
              fontSize: "13.5px",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = themeStyles.btnHoverBg)
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = themeStyles.btnBg)
            }
          >
            View All Notifications
          </button>
        </div>
      </div>

      {/* HOUSEKEEPING TASK PHOTO INSPECTION MODAL */}
      {activeTaskModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 10000,
            background: isDark
              ? "rgba(0, 0, 0, 0.85)"
              : "rgba(15, 23, 42, 0.85)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
            animation: "fadeIn 0.2s ease",
          }}
        >
          <div
            style={{
              background: themeStyles.modalBg,
              color: themeStyles.titleColor,
              borderRadius: "20px",
              maxWidth: "640px",
              width: "100%",
              overflow: "hidden",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
              border: `1px solid ${themeStyles.panelBorder}`,
            }}
          >
            {/* MODAL HEADER */}
            <div
              style={{
                padding: "18px 24px",
                background: themeStyles.modalHeaderBg,
                color: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div>
                <h3
                  style={{
                    margin: 0,
                    fontSize: "17px",
                    fontWeight: "800",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    color: "#ffffff",
                  }}
                >
                  <FaCamera style={{ color: "#a855f7" }} /> Photo Inspection:{" "}
                  {activeTaskModal.room}
                </h3>
                <span style={{ fontSize: "12px", color: "#94a3b8" }}>
                  Uploaded by {activeTaskModal.staff} ({activeTaskModal.floor})
                </span>
              </div>
              <button
                type="button"
                onClick={() => setActiveTaskModal(null)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#94a3b8",
                  fontSize: "18px",
                  cursor: "pointer",
                }}
              >
                <FaTimes />
              </button>
            </div>

            {/* MODAL BODY */}
            <div style={{ padding: "20px" }}>
              {/* PHOTO PREVIEW */}
              <div
                style={{
                  background: "#000000",
                  borderRadius: "14px",
                  overflow: "hidden",
                  marginBottom: "16px",
                  boxShadow: "0 8px 20px rgba(0,0,0,0.3)",
                }}
              >
                <img
                  src={
                    activeTaskModal.photoProofUrl ||
                    activeTaskModal.videoProofUrl ||
                    "https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=800&q=80"
                  }
                  alt="Cleaning photo proof"
                  style={{
                    width: "100%",
                    maxHeight: "360px",
                    objectFit: "cover",
                    display: "block",
                  }}
                />
              </div>

              {/* TASK DETAILS */}
              <div
                style={{
                  background: themeStyles.modalBoxBg,
                  padding: "14px",
                  borderRadius: "12px",
                  marginBottom: "20px",
                  fontSize: "13px",
                  color: themeStyles.actionTextColor,
                  border: `1px solid ${themeStyles.panelBorder}`,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "6px",
                  }}
                >
                  <strong style={{ color: themeStyles.userNameColor }}>
                    Status:
                  </strong>
                  <span
                    style={{
                      background: activeTaskModal.statusBg || "#ede9fe",
                      color: activeTaskModal.statusColor || "#7c3aed",
                      fontSize: "11px",
                      fontWeight: "800",
                      padding: "2px 10px",
                      borderRadius: "999px",
                    }}
                  >
                    {activeTaskModal.approvalStatus || activeTaskModal.status}
                  </span>
                </div>
                <div>
                  <strong style={{ color: themeStyles.userNameColor }}>
                    Task Notes:
                  </strong>{" "}
                  {activeTaskModal.task} |{" "}
                  {activeTaskModal.notes || "Room cleaning complete."}
                </div>
              </div>

              {/* ACTION BUTTONS */}
              <div
                style={{
                  display: "flex",
                  gap: "12px",
                  justifyContent: "flex-end",
                }}
              >
                <button
                  type="button"
                  onClick={() => handleOpenReject(activeTaskModal)}
                  style={{
                    background: isDark
                      ? "rgba(220, 38, 38, 0.2)"
                      : "#fee2e2",
                    color: isDark ? "#fca5a5" : "#dc2626",
                    border: isDark
                      ? "1px solid rgba(220, 38, 38, 0.4)"
                      : "1px solid #fca5a5",
                    padding: "10px 18px",
                    borderRadius: "10px",
                    fontSize: "13.5px",
                    fontWeight: "800",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <FaSync /> Reschedule Cleaning
                </button>

                <button
                  type="button"
                  onClick={() => handleApproveTask(activeTaskModal.id)}
                  style={{
                    background:
                      "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                    color: "#ffffff",
                    border: "none",
                    padding: "10px 22px",
                    borderRadius: "10px",
                    fontSize: "13.5px",
                    fontWeight: "800",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    boxShadow: "0 4px 14px rgba(16, 185, 129, 0.35)",
                  }}
                >
                  <FaCheckCircle /> Approve & Mark Clean
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* REJECT & RESCHEDULE REASON MODAL */}
      {rejectReasonModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 10001,
            background: isDark
              ? "rgba(0, 0, 0, 0.85)"
              : "rgba(15, 23, 42, 0.75)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
        >
          <div
            style={{
              background: themeStyles.modalBg,
              color: themeStyles.titleColor,
              borderRadius: "20px",
              maxWidth: "500px",
              width: "100%",
              padding: "24px",
              boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)",
              border: `1px solid ${themeStyles.panelBorder}`,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                color: "#dc2626",
                marginBottom: "12px",
              }}
            >
              <FaExclamationTriangle style={{ fontSize: "22px" }} />
              <h3
                style={{
                  margin: 0,
                  fontSize: "17px",
                  fontWeight: "800",
                  color: themeStyles.titleColor,
                }}
              >
                Reschedule Cleaning for {rejectReasonModal.room}?
              </h3>
            </div>

            <p
              style={{
                fontSize: "13px",
                color: themeStyles.timeColor,
                marginBottom: "16px",
              }}
            >
              This will reject the photo proof and re-assign room cleaning to
              housekeeping in real-time.
            </p>

            <label
              style={{
                display: "block",
                fontSize: "13px",
                fontWeight: "700",
                color: themeStyles.actionTextColor,
                marginBottom: "6px",
              }}
            >
              Specify Feedback / Reason:
            </label>
            <textarea
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              rows={3}
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: "10px",
                border: `1px solid ${themeStyles.btnBorder}`,
                background: themeStyles.modalBoxBg,
                color: themeStyles.titleColor,
                fontSize: "13px",
                marginBottom: "20px",
                outline: "none",
                fontFamily: "inherit",
              }}
            />

            <div
              style={{
                display: "flex",
                gap: "10px",
                justifyContent: "flex-end",
              }}
            >
              <button
                type="button"
                onClick={() => setRejectReasonModal(null)}
                style={{
                  background: themeStyles.btnBg,
                  color: themeStyles.btnColor,
                  border: `1px solid ${themeStyles.btnBorder}`,
                  padding: "10px 18px",
                  borderRadius: "10px",
                  fontSize: "13px",
                  fontWeight: "700",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRejectTask}
                style={{
                  background: "#dc2626",
                  color: "#ffffff",
                  border: "none",
                  padding: "10px 20px",
                  borderRadius: "10px",
                  fontSize: "13px",
                  fontWeight: "800",
                  cursor: "pointer",
                  boxShadow: "0 4px 12px rgba(220, 38, 38, 0.3)",
                }}
              >
                Confirm Reschedule
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
