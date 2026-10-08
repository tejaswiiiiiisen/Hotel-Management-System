import { useState, useEffect } from "react";
import {
  FaCamera,
  FaCheckCircle,
  FaSync,
  FaClock,
  FaUserCheck,
  FaBroom,
  FaTimes,
  FaExclamationTriangle,
  FaCheck,
  FaList,
  FaThLarge,
  FaBed,
  FaImage,
} from "react-icons/fa";
import { getUserName, getUserRole } from "../auth.js";
import {
  getHkTasks,
  approveHkTask,
  rejectAndRescheduleHkTask,
  subscribeHkTasks,
} from "../services/housekeepingStore.js";

export default function HkVideoApprovalWidget({ title = "⚡ Live Housekeeping Photo Approvals" }) {
  const [tasks, setTasks] = useState(getHkTasks());
  const [activeVideoModal, setActiveVideoModal] = useState(null);
  const [rejectReasonModal, setRejectReasonModal] = useState(null);
  const [customReason, setCustomReason] = useState("");
  const [actionToast, setActionToast] = useState("");
  const [viewMode, setViewMode] = useState("list"); // "list" | "card" - LIST FORM IS DEFAULT

  const role = getUserRole();
  const userName = getUserName() || "Super Admin";

  useEffect(() => {
    // Subscribe to real-time housekeeping store changes across windows/tabs
    const unsubscribe = subscribeHkTasks((updatedTasks, eventDetail) => {
      setTasks(updatedTasks);
      if (eventDetail?.message && (role === "super_admin" || role === "manager" || role === "front_desk")) {
        setActionToast(eventDetail.message);
        setTimeout(() => setActionToast(""), 6000);
      }
    });

    return () => unsubscribe();
  }, [role]);

  // Filter tasks that need decision (Pending Approval / Photo Uploaded)
  const pendingTasks = tasks.filter(
    (t) =>
      t.staff && t.staff !== "Unassigned" &&
      (t.status === "Photo Uploaded" || (t.approvalStatus && t.approvalStatus.includes("Pending")))
  );

  const handleApprove = (taskId) => {
    const res = approveHkTask(taskId, userName, role);
    if (activeVideoModal?.id === taskId) setActiveVideoModal(null);
    setActionToast(`✅ ${res?.room || "Room"} approved & marked Clean by ${userName}!`);
    setTimeout(() => setActionToast(""), 5000);
  };

  const handleOpenReject = (task) => {
    setRejectReasonModal(task);
    setCustomReason("Incomplete cleaning, floor dust / stains remaining.");
  };

  const handleConfirmReject = () => {
    if (!rejectReasonModal) return;
    const res = rejectAndRescheduleHkTask(
      rejectReasonModal.id,
      userName,
      role,
      customReason || "Re-cleaning required"
    );
    if (activeVideoModal?.id === rejectReasonModal.id) setActiveVideoModal(null);
    setRejectReasonModal(null);
    setActionToast(`⚠️ ${res?.room || "Room"} rejected. Cleaning re-scheduled for Housekeeping.`);
    setTimeout(() => setActionToast(""), 5000);
  };

  return (
    <div style={{ marginBottom: "28px" }}>
      {/* REAL-TIME TOAST NOTIFICATION */}
      {actionToast && (
        <div
          style={{
            background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
            color: "#ffffff",
            padding: "14px 20px",
            borderRadius: "14px",
            marginBottom: "18px",
            fontSize: "13.5px",
            fontWeight: "700",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.3)",
            borderLeft: "5px solid #8b5cf6",
            animation: "fadeIn 0.3s ease",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "16px" }}>⚡</span>
            <span>{actionToast}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionToast("")}
            style={{ background: "transparent", border: "none", color: "#94a3b8", cursor: "pointer" }}
          >
            <FaTimes />
          </button>
        </div>
      )}

      {/* CONTAINER PANEL CARD */}
      <div
        className="hk-video-widget-panel travl-card"
        style={{
          borderRadius: "20px",
          padding: "24px",
          border: "1px solid rgba(139, 92, 246, 0.2)",
          boxShadow: "0 10px 30px -10px rgba(139, 92, 246, 0.1)",
          marginBottom: "24px",
        }}
      >
        {/* HEADER BAR WITH TOP RIGHT CORNER VIEW ICON */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "20px",
            flexWrap: "nowrap",
            gap: "16px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "42px",
                height: "42px",
                borderRadius: "12px",
                background: "linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#ffffff",
                fontSize: "18px",
                boxShadow: "0 4px 12px rgba(124, 58, 237, 0.3)",
                flexShrink: 0,
              }}
            >
              <FaCamera style={{ margin: "auto" }} />
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <h3 className="hk-widget-title" style={{ margin: 0, fontSize: "17px", fontWeight: "800" }}>
                  {title}
                </h3>
                <span
                  style={{
                    background: pendingTasks.length > 0 ? "#ede9fe" : "#dcfce7",
                    color: pendingTasks.length > 0 ? "#7c3aed" : "#15803d",
                    padding: "3px 10px",
                    borderRadius: "999px",
                    fontSize: "11.5px",
                    fontWeight: "800",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "5px",
                  }}
                >
                  <span
                    style={{
                      width: "7px",
                      height: "7px",
                      borderRadius: "50%",
                      background: pendingTasks.length > 0 ? "#7c3aed" : "#16a34a",
                      boxShadow: pendingTasks.length > 0 ? "0 0 6px #7c3aed" : "none",
                    }}
                  />
                  {pendingTasks.length} Pending
                </span>
              </div>
              <p className="hk-widget-sub" style={{ margin: "2px 0 0", fontSize: "12.5px" }}>
                Housekeeping uploaded photo proofs requiring Admin / Manager / Front Desk approval
              </p>
            </div>
          </div>

          {/* TOP RIGHT CORNER: ICON-ONLY VIEW SWITCHER PILL (MATCHING USER SCREENSHOT & DARK THEME) */}
          <div
            className="hk-view-switcher-pill"
            style={{
              display: "inline-flex",
              alignItems: "center",
              background: "#eef2ff",
              borderRadius: "16px",
              padding: "4px",
              gap: "4px",
              border: "1px solid #e0e7ff",
              boxShadow: "inset 0 1px 2px rgba(0, 0, 0, 0.04)",
              flexShrink: 0,
            }}
          >
            <button
              type="button"
              className={`hk-view-btn ${viewMode === "card" ? "active" : ""}`}
              onClick={() => setViewMode("card")}
              title="Card View (Grid)"
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "12px",
                border: "none",
                background: viewMode === "card" ? "#ffffff" : "transparent",
                color: viewMode === "card" ? "#4f46e5" : "#64748b",
                fontSize: "15px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: viewMode === "card" ? "0 3px 10px rgba(79, 70, 229, 0.15), 0 1px 3px rgba(0,0,0,0.06)" : "none",
                transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
              }}
            >
              <FaThLarge />
            </button>

            <button
              type="button"
              className={`hk-view-btn ${viewMode === "list" ? "active" : ""}`}
              onClick={() => setViewMode("list")}
              title="List View (Single Line Table)"
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "12px",
                border: "none",
                background: viewMode === "list" ? "#ffffff" : "transparent",
                color: viewMode === "list" ? "#4f46e5" : "#64748b",
                fontSize: "15px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: viewMode === "list" ? "0 3px 10px rgba(79, 70, 229, 0.15), 0 1px 3px rgba(0,0,0,0.06)" : "none",
                transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
              }}
            >
              <FaList />
            </button>
          </div>
        </div>

        {/* PENDING APPROVALS LIST FORM OR EMPTY STATE */}
        {pendingTasks.length === 0 ? (
          <div
            className="hk-video-widget-empty"
            style={{
              padding: "36px 20px",
              textAlign: "center",
              borderRadius: "14px",
            }}
          >
            <FaCheckCircle style={{ fontSize: "36px", color: "#10b981", marginBottom: "10px" }} />
            <h4 style={{ margin: "0 0 6px", fontSize: "15px", fontWeight: "700" }}>
              All Housekeeping Photos Reviewed!
            </h4>
            <p style={{ margin: 0, fontSize: "13px" }}>
              There are currently no room cleaning photos awaiting approval. New uploads by housekeeping will show here live.
            </p>
          </div>
        ) : viewMode === "list" ? (
          /* ==================== 1. LIST FORM VIEW (SINGLE LINE PER ROW) ==================== */
          <div className="hk-approval-list-container" style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "separate",
                borderSpacing: "0 8px",
                fontSize: "13.5px",
              }}
            >
              <thead>
                <tr
                  style={{
                    color: "var(--text-sub, #94a3b8)",
                    fontSize: "11.5px",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    whiteSpace: "nowrap",
                  }}
                >
                  <th style={{ padding: "8px 16px", textAlign: "left" }}>Room & Floor</th>
                  <th style={{ padding: "8px 16px", textAlign: "left" }}>Cleaned By</th>
                  <th style={{ padding: "8px 16px", textAlign: "center" }}>Priority Tag</th>
                  <th style={{ padding: "8px 16px", textAlign: "center" }}>Photo Proof</th>
                  <th style={{ padding: "8px 16px", textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingTasks.map((t) => (
                  <tr
                    key={t.id}
                    className="hk-approval-table-row"
                    style={{
                      background: "var(--nested-bg, #ffffff)",
                      boxShadow: "0 2px 10px rgba(124, 58, 237, 0.04)",
                      borderRadius: "12px",
                      border: "1px solid rgba(139, 92, 246, 0.12)",
                      transition: "all 0.2s ease",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {/* ROOM & FLOOR - SINGLE LINE */}
                    <td style={{ padding: "12px 16px", borderRadius: "12px 0 0 12px", whiteSpace: "nowrap" }}>
                      <div style={{ display: "inline-flex", alignItems: "center", gap: "10px" }}>
                        <div
                          style={{
                            width: "34px",
                            height: "34px",
                            borderRadius: "8px",
                            background: "linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)",
                            color: "#ffffff",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontWeight: "800",
                            fontSize: "13px",
                            flexShrink: 0,
                          }}
                        >
                          <FaBed />
                        </div>
                        <div style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
                          <strong className="hk-row-room-name" style={{ fontSize: "14.5px", color: "var(--text-main, inherit)" }}>
                            {t.room}
                          </strong>
                          <span className="hk-row-subtext" style={{ fontSize: "12px", color: "var(--text-sub, #64748b)" }}>
                            ({t.floor})
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* STAFF & TIME - SINGLE LINE */}
                    <td style={{ padding: "12px 16px", whiteSpace: "nowrap" }}>
                      <div style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
                        <img
                          src={
                            t.staffAvatar ||
                            "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80"
                          }
                          alt={t.staff}
                          style={{ width: "28px", height: "28px", borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
                        />
                        <strong className="hk-row-staff-name" style={{ fontSize: "13px", color: "var(--text-main, inherit)" }}>
                          {t.staff}
                        </strong>
                        <span className="hk-row-subtext" style={{ fontSize: "11px", color: "var(--text-sub, #64748b)", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                          • <FaClock style={{ fontSize: "10px" }} /> Uploaded {t.photoUploadedAt || t.videoUploadedAt || "Today"}
                        </span>
                      </div>
                    </td>

                    {/* PRIORITY TAG - SINGLE LINE */}
                    <td style={{ padding: "12px 16px", textAlign: "center", whiteSpace: "nowrap" }}>
                      <span
                        style={{
                          background: t.priority?.includes("Urgent") ? "#fee2e2" : "#ede9fe",
                          color: t.priority?.includes("Urgent") ? "#dc2626" : "#7c3aed",
                          fontSize: "11px",
                          fontWeight: "800",
                          padding: "4px 10px",
                          borderRadius: "999px",
                          display: "inline-block",
                        }}
                      >
                        {t.priority || "Normal"}
                      </span>
                    </td>

                    {/* PHOTO PROOF BUTTON - SINGLE LINE */}
                    <td style={{ padding: "12px 16px", textAlign: "center", whiteSpace: "nowrap" }}>
                      <button
                        type="button"
                        onClick={() => setActiveVideoModal(t)}
                        style={{
                          background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
                          color: "#ffffff",
                          border: "none",
                          padding: "7px 13px",
                          borderRadius: "8px",
                          fontSize: "12px",
                          fontWeight: "700",
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          boxShadow: "0 3px 10px rgba(15, 23, 42, 0.2)",
                          transition: "all 0.2s ease",
                        }}
                      >
                        <FaCamera style={{ fontSize: "11px", color: "#a855f7" }} /> View Photo Proof
                      </button>
                    </td>

                    {/* ACTIONS: MARK CLEAN / RESCHEDULE - SINGLE LINE */}
                    <td style={{ padding: "12px 16px", textAlign: "right", borderRadius: "0 12px 12px 0", whiteSpace: "nowrap" }}>
                      <div style={{ display: "inline-flex", gap: "8px", justifyContent: "flex-end", alignItems: "center" }}>
                        <button
                          type="button"
                          onClick={() => handleApprove(t.id)}
                          style={{
                            background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                            color: "#ffffff",
                            border: "none",
                            padding: "7px 13px",
                            borderRadius: "8px",
                            fontSize: "12px",
                            fontWeight: "800",
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "5px",
                            boxShadow: "0 3px 10px rgba(16, 185, 129, 0.25)",
                          }}
                        >
                          <FaCheckCircle /> Mark Clean
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenReject(t)}
                          style={{
                            background: "#fee2e2",
                            color: "#dc2626",
                            border: "1px solid #fca5a5",
                            padding: "7px 13px",
                            borderRadius: "8px",
                            fontSize: "12px",
                            fontWeight: "800",
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "5px",
                          }}
                        >
                          <FaSync /> Reschedule
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          /* ==================== 2. CARD VIEW (TOGGLE OPTION) ==================== */
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
              gap: "18px",
            }}
          >
            {pendingTasks.map((t) => (
              <div
                key={t.id}
                className="hk-video-widget-task-card"
                style={{
                  borderRadius: "16px",
                  padding: "18px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  position: "relative",
                  transition: "all 0.2s ease",
                  boxShadow: "0 4px 16px rgba(124, 58, 237, 0.06)",
                }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                    <div>
                      <span
                        className="hk-row-room-name"
                        style={{
                          fontSize: "16px",
                          fontWeight: "800",
                          color: "var(--text-main, inherit)",
                          display: "block",
                        }}
                      >
                        {t.room}
                      </span>
                      <span className="hk-row-subtext" style={{ fontSize: "12px", color: "var(--text-sub, #64748b)", fontWeight: "600" }}>
                        {t.floor}
                      </span>
                    </div>

                    <span
                      style={{
                        background: t.priority?.includes("Urgent") ? "#fee2e2" : "#ede9fe",
                        color: t.priority?.includes("Urgent") ? "#dc2626" : "#7c3aed",
                        fontSize: "11px",
                        fontWeight: "800",
                        padding: "4px 10px",
                        borderRadius: "8px",
                      }}
                    >
                      {t.priority || "High Priority"}
                    </span>
                  </div>

                  <div
                    className="hk-staff-card-bg"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      background: "var(--nested-bg, #f8fafc)",
                      padding: "8px 12px",
                      borderRadius: "10px",
                      marginBottom: "14px",
                    }}
                  >
                    <img
                      src={
                        t.staffAvatar ||
                        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80"
                      }
                      alt={t.staff}
                      style={{ width: "32px", height: "32px", borderRadius: "50%", objectFit: "cover" }}
                    />
                    <div style={{ flex: 1 }}>
                      <div className="hk-row-staff-name" style={{ fontSize: "12.5px", fontWeight: "700", color: "var(--text-main, inherit)" }}>{t.staff}</div>
                      <div className="hk-row-subtext" style={{ fontSize: "11px", color: "var(--text-sub, #64748b)", display: "flex", alignItems: "center", gap: "4px" }}>
                        <FaClock style={{ fontSize: "10px" }} /> Uploaded {t.photoUploadedAt || t.videoUploadedAt || "Just Now"}
                      </div>
                    </div>
                  </div>

                  {/* PHOTO PREVIEW CONTAINER */}
                  <div
                    style={{
                      position: "relative",
                      borderRadius: "12px",
                      overflow: "hidden",
                      background: "#0f172a",
                      aspectRatio: "16/9",
                      marginBottom: "16px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                    onClick={() => setActiveVideoModal(t)}
                  >
                    <img
                      src={t.photoProofUrl || t.videoProofUrl || "https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=800&q=80"}
                      alt="Photo proof"
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                    <div
                      style={{
                        position: "absolute",
                        width: "44px",
                        height: "44px",
                        borderRadius: "50%",
                        background: "rgba(124, 58, 237, 0.9)",
                        color: "#ffffff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: "0 0 20px rgba(124, 58, 237, 0.6)",
                      }}
                    >
                      <FaCamera style={{ fontSize: "16px" }} />
                    </div>
                    <span
                      style={{
                        position: "absolute",
                        bottom: "8px",
                        left: "8px",
                        background: "rgba(0,0,0,0.75)",
                        color: "#ffffff",
                        fontSize: "11px",
                        padding: "3px 8px",
                        borderRadius: "6px",
                        fontWeight: "700",
                      }}
                    >
                      Click to View Photo Proof
                    </span>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <button
                    type="button"
                    onClick={() => handleApprove(t.id)}
                    style={{
                      background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                      color: "#ffffff",
                      border: "none",
                      padding: "10px",
                      borderRadius: "10px",
                      fontSize: "12.5px",
                      fontWeight: "800",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px",
                      boxShadow: "0 4px 12px rgba(16, 185, 129, 0.25)",
                    }}
                  >
                    <FaCheckCircle /> Mark Clean
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenReject(t)}
                    style={{
                      background: "#fee2e2",
                      color: "#dc2626",
                      border: "1px solid #fca5a5",
                      padding: "10px",
                      borderRadius: "10px",
                      fontSize: "12.5px",
                      fontWeight: "800",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px",
                    }}
                  >
                    <FaSync /> Reschedule
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* FULL PHOTO INSPECTION MODAL */}
      {activeVideoModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 9999,
            background: "rgba(15, 23, 42, 0.85)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
        >
          <div
            className="hk-inspection-modal-content"
            style={{
              background: "var(--panel-bg, #ffffff)",
              borderRadius: "20px",
              maxWidth: "680px",
              width: "100%",
              overflow: "hidden",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.6)",
              border: "1px solid rgba(255,255,255,0.15)",
            }}
          >
            <div
              style={{
                padding: "18px 24px",
                background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
                color: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div>
                <h3 className="hk-inspection-modal-title" style={{ margin: 0, fontSize: "17px", fontWeight: "800", display: "flex", alignItems: "center", gap: "8px", color: "#ffffff" }}>
                  <FaCamera style={{ color: "#a855f7" }} /> Photo Inspection: {activeVideoModal.room}
                </h3>
                <span style={{ fontSize: "12px", color: "#94a3b8" }}>
                  Uploaded by {activeVideoModal.staff} ({activeVideoModal.floor})
                </span>
              </div>
              <button
                type="button"
                onClick={() => setActiveVideoModal(null)}
                style={{ background: "transparent", border: "none", color: "#94a3b8", fontSize: "18px", cursor: "pointer" }}
              >
                <FaTimes />
              </button>
            </div>

            <div style={{ padding: "20px" }}>
              <div
                style={{
                  background: "#000000",
                  borderRadius: "14px",
                  overflow: "hidden",
                  marginBottom: "18px",
                  boxShadow: "0 8px 20px rgba(0,0,0,0.4)",
                }}
              >
                <img
                  src={
                    activeVideoModal.photoProofUrl ||
                    activeVideoModal.videoProofUrl ||
                    "https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=800&q=80"
                  }
                  alt="Cleaning photo proof"
                  style={{ width: "100%", maxHeight: "380px", objectFit: "cover", display: "block" }}
                />
              </div>

              <div
                className="hk-inspection-details-box"
                style={{
                  background: "var(--nested-bg, #f8fafc)",
                  padding: "14px",
                  borderRadius: "12px",
                  marginBottom: "20px",
                  fontSize: "13px",
                  color: "var(--text-main, #334155)",
                }}
              >
                <strong style={{ color: "inherit" }}>Cleaning Details:</strong> {activeVideoModal.task} | {activeVideoModal.notes || "Standard cleaning photo proof."}
              </div>

              {/* DECISION ACTION BAR */}
              <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
                <button
                  type="button"
                  onClick={() => handleOpenReject(activeVideoModal)}
                  style={{
                    background: "#fee2e2",
                    color: "#dc2626",
                    border: "1px solid #fca5a5",
                    padding: "12px 20px",
                    borderRadius: "12px",
                    fontSize: "14px",
                    fontWeight: "800",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <FaSync /> Reschedule Cleaning
                </button>

                <button
                  type="button"
                  onClick={() => handleApprove(activeVideoModal.id)}
                  style={{
                    background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                    color: "#ffffff",
                    border: "none",
                    padding: "12px 24px",
                    borderRadius: "12px",
                    fontSize: "14px",
                    fontWeight: "800",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
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
            zIndex: 10000,
            background: "rgba(15, 23, 42, 0.75)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
        >
          <div
            style={{
              background: "var(--panel-bg, #ffffff)",
              borderRadius: "20px",
              maxWidth: "500px",
              width: "100%",
              padding: "24px",
              boxShadow: "0 25px 50px -12px rgba(0,0,0,0.3)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "#dc2626", marginBottom: "12px" }}>
              <FaExclamationTriangle style={{ fontSize: "22px" }} />
              <h3 style={{ margin: 0, fontSize: "17px", fontWeight: "800", color: "#0f172a" }}>
                Reschedule Cleaning for {rejectReasonModal.room}?
              </h3>
            </div>

            <p style={{ fontSize: "13px", color: "#64748b", marginBottom: "16px" }}>
              This will reject the current photo proof and re-schedule room cleaning for housekeeping in real-time.
            </p>

            <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#334155", marginBottom: "6px" }}>
              Specify Reason / Feedback for Housekeeping:
            </label>
            <textarea
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              rows={3}
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: "10px",
                border: "1px solid #cbd5e1",
                fontSize: "13px",
                marginBottom: "20px",
                outline: "none",
                fontFamily: "inherit",
              }}
            />

            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={() => setRejectReasonModal(null)}
                style={{
                  background: "#f1f5f9",
                  color: "#475569",
                  border: "none",
                  padding: "10px 18px",
                  borderRadius: "10px",
                  fontSize: "13.5px",
                  fontWeight: "700",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                style={{
                  background: "#dc2626",
                  color: "#ffffff",
                  border: "none",
                  padding: "10px 20px",
                  borderRadius: "10px",
                  fontSize: "13.5px",
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
    </div>
  );
}

