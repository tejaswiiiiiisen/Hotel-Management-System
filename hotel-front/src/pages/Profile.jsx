import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaUser,
  FaEnvelope,
  FaPhone,
  FaBuilding,
  FaBriefcase,
  FaMapMarkerAlt,
  FaShieldAlt,
  FaEdit,
  FaTrashAlt,
  FaTimes,
  FaSave,
  FaExclamationTriangle,
  FaCalendarAlt,
  FaIdCard,
  FaLock,
  FaUserCheck,
  FaMoneyBillWave,
  FaCheckCircle,
  FaClock,
  FaReceipt,
} from "react-icons/fa";
import { getProfile, saveProfile, deleteProfile, subscribeProfile } from "../services/profileStore.js";
import { logout, getAuthHeaders, getCurrentOrgId } from "../auth.js";

const PRESET_AVATARS = [
  { label: "Admin Female 1", url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80" },
  { label: "Admin Male 1", url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80" },
  { label: "Admin Female 2", url: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80" },
  { label: "Admin Male 2", url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80" },
  { label: "Staff Female", url: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&q=80" },
];

export default function Profile() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(getProfile());
  const [activeTab, setActiveTab] = useState("view"); // "view" | "edit"
  const [formData, setFormData] = useState(profile);
  const [toastMessage, setToastMessage] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [salaryHistory, setSalaryHistory] = useState([]);
  const [loadingSalary, setLoadingSalary] = useState(false);

  // Load employee salary & payment history
  const loadSalaryHistory = async () => {
    setLoadingSalary(true);
    try {
      const email = (profile.email || "").toLowerCase().trim();
      const staffId = (profile.staff_id || profile.id || "").toLowerCase().trim();
      const name = (profile.name || "").toLowerCase().trim();
      const orgId = getCurrentOrgId();
      
      // 1. Check local employee salary history under all identifiers
      let list = [];
      const keysToCheck = [
        email && `employee_salary_history_${email}`,
        staffId && `employee_salary_history_${staffId}`,
        name && `employee_salary_history_${name}`,
      ].filter(Boolean);

      for (const key of keysToCheck) {
        const saved = localStorage.getItem(key);
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed) && parsed.length > 0) {
              list = parsed;
              break;
            }
          } catch (e) {}
        }
      }

      // 2. Fetch live from backend payroll endpoint
      const queryParam = orgId ? `?orgId=${encodeURIComponent(orgId)}` : "";
      const res = await fetch(`http://localhost:4000/api/payroll${queryParam}`, {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        const records = Array.isArray(data?.records) ? data.records : [];
        const myRecord = records.find(
          (r) =>
            (r.name && profile.name && r.name.toLowerCase() === profile.name.toLowerCase()) ||
            (r.email && email && r.email.toLowerCase() === email.toLowerCase())
        );

        if (myRecord && myRecord.status === "Paid") {
          const exists = list.some((item) => item.month === myRecord.payPeriod || item.paymentDate === myRecord.paymentDate);
          if (!exists) {
            list.unshift({
              id: `SAL-LIVE-${myRecord.id}`,
              month: myRecord.payPeriod || "September 2026",
              finalSalary: Number(String(myRecord.salary || 0).replace(/[^0-9.-]+/g, "")) || 26000,
              baseSalary: Number(String(myRecord.salary || 0).replace(/[^0-9.-]+/g, "")) || 26000,
              deduction: 0,
              status: "Paid",
              paymentDate: myRecord.paymentDate || "Paid Recently",
              accountNo: myRecord.accountNo || "•••• 4829 (Bank Transfer)",
            });
          }
        }
      }

      setSalaryHistory(list);
    } catch (err) {
      console.warn("Could not load salary history:", err);
    } finally {
      setLoadingSalary(false);
    }
  };

  useEffect(() => {
    loadSalaryHistory();
    const handleSalaryPaid = () => loadSalaryHistory();
    window.addEventListener("employee_salary_paid", handleSalaryPaid);
    return () => window.removeEventListener("employee_salary_paid", handleSalaryPaid);
  }, [profile.email, profile.name]);

  useEffect(() => {
    const unsubscribe = subscribeProfile((updated) => {
      if (updated) {
        setProfile(updated);
        setFormData(updated);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveProfile = (e) => {
    e.preventDefault();
    const updated = saveProfile(formData);
    if (updated) {
      setProfile(updated);
      setActiveTab("view");
      setToastMessage("✨ Profile details updated successfully!");
      setTimeout(() => setToastMessage(""), 5000);
    }
  };

  const handleConfirmDelete = () => {
    deleteProfile();
    logout();
    navigate("/login");
  };

  return (
    <div style={{ maxWidth: "1100px", margin: "0 auto", paddingBottom: "40px" }}>
      {/* TOAST NOTIFICATION ALERT */}
      {toastMessage && (
        <div
          style={{
            background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
            color: "#ffffff",
            padding: "14px 20px",
            borderRadius: "14px",
            marginBottom: "20px",
            fontSize: "14px",
            fontWeight: "700",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.3)",
            borderLeft: "5px solid #10b981",
          }}
        >
          <span>{toastMessage}</span>
          <button
            type="button"
            onClick={() => setToastMessage("")}
            style={{ background: "transparent", border: "none", color: "#94a3b8", cursor: "pointer" }}
          >
            <FaTimes />
          </button>
        </div>
      )}

      {/* HERO BANNER CARD (CLEAN HEADER WITHOUT DUPLICATE EDIT/DELETE BUTTONS) */}
      <div
        className="travl-card"
        style={{
          borderRadius: "24px",
          padding: "0",
          overflow: "hidden",
          marginBottom: "24px",
          position: "relative",
          boxShadow: "0 10px 30px rgba(124, 58, 237, 0.08)",
        }}
      >
        {/* TOP DECORATIVE BANNER */}
        <div
          style={{
            height: "140px",
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 50%, #6b21a8 100%)",
            position: "relative",
          }}
        >
          <span
            style={{
              position: "absolute",
              top: "16px",
              right: "20px",
              background: "rgba(255, 255, 255, 0.2)",
              backdropFilter: "blur(8px)",
              color: "#ffffff",
              padding: "6px 14px",
              borderRadius: "999px",
              fontSize: "12px",
              fontWeight: "800",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <FaShieldAlt /> {profile.status || "Active & Verified Account"}
          </span>
        </div>

        {/* HERO INFO SECTION */}
        <div style={{ padding: "0 28px 24px", marginTop: "-55px", display: "flex", flexWrap: "wrap", alignItems: "flex-end", justifyContent: "space-between", gap: "20px" }}>
          <div style={{ display: "flex", alignItems: "flex-end", gap: "20px", flexWrap: "wrap" }}>
            <div style={{ position: "relative" }}>
              <div
                style={{
                  width: "110px",
                  height: "110px",
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                  color: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "42px",
                  fontWeight: "800",
                  border: "4px solid var(--panel-bg, #ffffff)",
                  boxShadow: "0 8px 20px rgba(0,0,0,0.15)",
                }}
              >
                {profile?.name ? profile.name[0]?.toUpperCase() : "A"}
              </div>
              <span
                style={{
                  position: "absolute",
                  bottom: "6px",
                  right: "6px",
                  width: "16px",
                  height: "16px",
                  borderRadius: "50%",
                  background: "#10b981",
                  border: "3px solid #ffffff",
                }}
              />
            </div>

            <div style={{ marginBottom: "6px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <h1 style={{ margin: 0, fontSize: "24px", fontWeight: "800", color: "var(--text-main, #0f172a)" }}>
                  {profile.name}
                </h1>
                <button
                  type="button"
                  onClick={() => {
                    setFormData(profile);
                    setActiveTab(activeTab === "edit" ? "view" : "edit");
                  }}
                  title={activeTab === "edit" ? "Back to Profile View" : "Edit Profile Data"}
                  style={{
                    background: activeTab === "edit" ? "#7c3aed" : "var(--nested-bg, #ede9fe)",
                    color: activeTab === "edit" ? "#ffffff" : "#7c3aed",
                    border: "none",
                    width: "36px",
                    height: "36px",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    fontSize: "14px",
                    boxShadow: "0 2px 8px rgba(124, 58, 237, 0.15)",
                    transition: "all 0.2s ease",
                  }}
                >
                  <FaEdit />
                </button>
              </div>
              <p style={{ margin: "4px 0 0", fontSize: "14px", color: "var(--text-sub, #64748b)", fontWeight: "600" }}>
                {profile.department} • <span style={{ color: "#7c3aed", fontWeight: "800" }}>{profile.hotelName}</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* QUICK STATS ROW */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px", marginBottom: "24px" }}>
        <div className="travl-card" style={{ padding: "18px", borderRadius: "18px", display: "flex", alignItems: "center", gap: "14px" }}>
          <div style={{ width: "42px", height: "42px", borderRadius: "12px", background: "#ede9fe", color: "#7c3aed", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px" }}>
            <FaUserCheck />
          </div>
          <div>
            <span style={{ fontSize: "11.5px", color: "var(--text-sub, #64748b)", textTransform: "uppercase", fontWeight: "700" }}>Account Status</span>
            <strong style={{ display: "block", fontSize: "14.5px", color: "var(--text-main, #0f172a)" }}>{profile.status || "Active"}</strong>
          </div>
        </div>

        <div className="travl-card" style={{ padding: "18px", borderRadius: "18px", display: "flex", alignItems: "center", gap: "14px" }}>
          <div style={{ width: "42px", height: "42px", borderRadius: "12px", background: "#dcfce7", color: "#16a34a", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px" }}>
            <FaShieldAlt />
          </div>
          <div>
            <span style={{ fontSize: "11.5px", color: "var(--text-sub, #64748b)", textTransform: "uppercase", fontWeight: "700" }}>Access Level</span>
            <strong style={{ display: "block", fontSize: "14.5px", color: "var(--text-main, #0f172a)" }}>{profile.role?.toUpperCase() || "STAFF"}</strong>
          </div>
        </div>

        <div className="travl-card" style={{ padding: "18px", borderRadius: "18px", display: "flex", alignItems: "center", gap: "14px" }}>
          <div style={{ width: "42px", height: "42px", borderRadius: "12px", background: "#e0f2fe", color: "#0284c7", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px" }}>
            <FaBuilding />
          </div>
          <div>
            <span style={{ fontSize: "11.5px", color: "var(--text-sub, #64748b)", textTransform: "uppercase", fontWeight: "700" }}>{profile.role === "super_admin" ? "Access Scope" : "Assigned Hotel"}</span>
            <strong style={{ display: "block", fontSize: "14.5px", color: "var(--text-main, #0f172a)" }}>{profile.hotelName || "All Organizations"}</strong>
          </div>
        </div>

        <div className="travl-card" style={{ padding: "18px", borderRadius: "18px", display: "flex", alignItems: "center", gap: "14px" }}>
          <div style={{ width: "42px", height: "42px", borderRadius: "12px", background: "#fef3c7", color: "#d97706", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px" }}>
            <FaCalendarAlt />
          </div>
          <div>
            <span style={{ fontSize: "11.5px", color: "var(--text-sub, #64748b)", textTransform: "uppercase", fontWeight: "700" }}>Member Since</span>
            <strong style={{ display: "block", fontSize: "14.5px", color: "var(--text-main, #0f172a)" }}>{profile.joinedDate || "2024"}</strong>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT AREA BASED ON ACTIVE TAB */}
      {activeTab === "view" ? (
        /* ==================== TAB 1: VIEW PROFILE OVERVIEW ==================== */
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "20px" }}>
          {/* LEFT DETAILS PANEL */}
          <div className="travl-card" style={{ borderRadius: "20px", padding: "24px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px", borderBottom: "1px solid var(--nested-bg, #f1f5f9)", paddingBottom: "12px" }}>
              <h3 style={{ margin: 0, fontSize: "17px", fontWeight: "800", color: "var(--text-main, #0f172a)" }}>
                Personal & Professional Information
              </h3>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "24px" }}>
              <div>
                <span style={{ fontSize: "12px", color: "var(--text-sub, #64748b)", fontWeight: "600", display: "flex", alignItems: "center", gap: "6px" }}>
                  <FaUser style={{ color: "#7c3aed" }} /> Full Name
                </span>
                <strong style={{ fontSize: "15px", color: "var(--text-main, #0f172a)", display: "block", marginTop: "4px" }}>
                  {profile.name}
                </strong>
              </div>

              <div>
                <span style={{ fontSize: "12px", color: "var(--text-sub, #64748b)", fontWeight: "600", display: "flex", alignItems: "center", gap: "6px" }}>
                  <FaEnvelope style={{ color: "#7c3aed" }} /> Email Address
                </span>
                <strong style={{ fontSize: "15px", color: "var(--text-main, #0f172a)", display: "block", marginTop: "4px" }}>
                  {profile.email}
                </strong>
              </div>

              <div>
                <span style={{ fontSize: "12px", color: "var(--text-sub, #64748b)", fontWeight: "600", display: "flex", alignItems: "center", gap: "6px" }}>
                  <FaPhone style={{ color: "#7c3aed" }} /> Phone Number
                </span>
                <strong style={{ fontSize: "15px", color: "var(--text-main, #0f172a)", display: "block", marginTop: "4px" }}>
                  {profile.phone || "Not Specified"}
                </strong>
              </div>

              <div>
                <span style={{ fontSize: "12px", color: "var(--text-sub, #64748b)", fontWeight: "600", display: "flex", alignItems: "center", gap: "6px" }}>
                  <FaBriefcase style={{ color: "#7c3aed" }} /> Department
                </span>
                <strong style={{ fontSize: "15px", color: "var(--text-main, #0f172a)", display: "block", marginTop: "4px" }}>
                  {profile.department}
                </strong>
              </div>

              <div>
                <span style={{ fontSize: "12px", color: "var(--text-sub, #64748b)", fontWeight: "600", display: "flex", alignItems: "center", gap: "6px" }}>
                  <FaBuilding style={{ color: "#7c3aed" }} /> {profile.role === "super_admin" ? "Organization Scope" : "Hotel Organization"}
                </span>
                <strong style={{ fontSize: "15px", color: "var(--text-main, #0f172a)", display: "block", marginTop: "4px" }}>
                  {profile.hotelName}
                </strong>
              </div>

              <div>
                <span style={{ fontSize: "12px", color: "var(--text-sub, #64748b)", fontWeight: "600", display: "flex", alignItems: "center", gap: "6px" }}>
                  <FaPhone style={{ color: "#ef4444" }} /> Emergency Contact
                </span>
                <strong style={{ fontSize: "15px", color: "var(--text-main, #0f172a)", display: "block", marginTop: "4px" }}>
                  {profile.emergencyContact || "Not Specified"}
                </strong>
              </div>
            </div>

            <div style={{ marginBottom: "24px" }}>
              <span style={{ fontSize: "12px", color: "var(--text-sub, #64748b)", fontWeight: "600", display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
                <FaMapMarkerAlt style={{ color: "#7c3aed" }} /> Primary Address
              </span>
              <div style={{ background: "var(--nested-bg, #f8fafc)", padding: "12px 16px", borderRadius: "12px", fontSize: "14px", color: "var(--text-main, #334155)" }}>
                {profile.address || "No address provided."}
              </div>
            </div>

            <div>
              <span style={{ fontSize: "12px", color: "var(--text-sub, #64748b)", fontWeight: "600", display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
                <FaIdCard style={{ color: "#7c3aed" }} /> Bio / About Profile
              </span>
              <div style={{ background: "var(--nested-bg, #f8fafc)", padding: "14px 16px", borderRadius: "12px", fontSize: "13.5px", color: "var(--text-main, #334155)", lineHeight: "1.6" }}>
                {profile.bio || "No profile bio provided."}
              </div>
            </div>

            {/* ========================================================================= */}
            {/* REAL-TIME SALARY DISBURSEMENT & PAYMENT HISTORY WITH DATE AND TIME */}
            {/* ========================================================================= */}
            <div style={{ marginTop: "28px", borderTop: "1px solid var(--nested-bg, #f1f5f9)", paddingTop: "20px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "#dcfce7", color: "#16a34a", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "15px" }}>
                    <FaMoneyBillWave />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "800", color: "var(--text-main, #0f172a)" }}>
                      Salary & Disbursed Payments
                    </h3>
                    <p style={{ margin: "2px 0 0", fontSize: "12px", color: "var(--text-sub, #64748b)" }}>
                      Real-time salary credits, payment dates, timestamps & account records
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={loadSalaryHistory}
                  disabled={loadingSalary}
                  style={{
                    background: "#f1f5f9",
                    border: "none",
                    padding: "6px 12px",
                    borderRadius: "8px",
                    fontSize: "12px",
                    fontWeight: "700",
                    color: "#475569",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  🔄 {loadingSalary ? "Updating..." : "Refresh"}
                </button>
              </div>

              {salaryHistory.length === 0 ? (
                <div style={{ background: "var(--nested-bg, #f8fafc)", padding: "20px", borderRadius: "14px", textAlign: "center", color: "var(--text-sub, #64748b)", fontSize: "13px" }}>
                  <FaClock style={{ fontSize: "20px", color: "#94a3b8", marginBottom: "6px" }} />
                  <p style={{ margin: 0, fontWeight: "600" }}>No disbursed salary records yet.</p>
                  <span style={{ fontSize: "11.5px", color: "#94a3b8" }}>When Accountant disburses payment, real transaction dates & times will appear here.</span>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {salaryHistory.map((item, idx) => (
                    <div
                      key={item.id || idx}
                      style={{
                        background: "linear-gradient(135deg, #f0fdf4 0%, #ffffff 100%)",
                        border: "1px solid #bbf7d0",
                        borderRadius: "14px",
                        padding: "14px 18px",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        flexWrap: "wrap",
                        gap: "12px",
                        boxShadow: "0 2px 8px rgba(34, 197, 94, 0.08)",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)", color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px" }}>
                          ✓
                        </div>
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <strong style={{ fontSize: "15px", color: "#0f172a" }}>
                              {item.month || "Current Pay Cycle"}
                            </strong>
                            <span style={{ fontSize: "11px", fontWeight: "800", color: "#16a34a", background: "#dcfce7", padding: "2px 8px", borderRadius: "6px" }}>
                              Credited to Account
                            </span>
                          </div>
                          <div style={{ fontSize: "12px", color: "#475569", marginTop: "3px", display: "flex", alignItems: "center", gap: "6px" }}>
                            <FaClock style={{ color: "#16a34a", fontSize: "11px" }} />
                            <span>{item.paymentDate}</span>
                          </div>
                          {item.accountNo && (
                            <div style={{ fontSize: "11.5px", color: "#64748b", marginTop: "2px" }}>
                              Account: <strong>{item.accountNo}</strong>
                            </div>
                          )}
                        </div>
                      </div>

                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: "18px", fontWeight: "900", color: "#16a34a" }}>
                          ₹{Number(item.finalSalary || item.amount || 0).toLocaleString("en-IN")}
                        </div>
                        {item.deduction > 0 && (
                          <div style={{ fontSize: "11px", color: "#ef4444", fontWeight: "700" }}>
                            Deduction: -₹{Number(item.deduction).toLocaleString("en-IN")}
                          </div>
                        )}
                        <span style={{ fontSize: "10.5px", color: "#64748b" }}>
                          Status: <strong style={{ color: "#16a34a" }}>Paid Successfully</strong>
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT SIDEBAR PERMISSIONS & DANGER ZONE CARD */}
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div className="travl-card" style={{ borderRadius: "20px", padding: "20px" }}>
              <h4 style={{ margin: "0 0 14px", fontSize: "15px", fontWeight: "800", color: "var(--text-main, #0f172a)", display: "flex", alignItems: "center", gap: "8px" }}>
                <FaLock style={{ color: "#7c3aed" }} /> System Permissions
              </h4>
              <ul style={{ margin: 0, paddingLeft: "18px", fontSize: "13px", color: "var(--text-sub, #475569)", display: "flex", flexDirection: "column", gap: "8px" }}>
                {(profile.permissions || []).map((perm, idx) => (
                  <li key={idx}>{perm}</li>
                ))}
              </ul>
            </div>

            {/* DANGER ZONE - DELETE PROFILE BUTTON (NICHE LOWER CORNER) */}
            <div className="travl-card" style={{ borderRadius: "20px", padding: "20px", border: "1px solid #fecaca", background: "#fef2f2" }}>
              <h4 style={{ margin: "0 0 6px", fontSize: "14px", fontWeight: "800", color: "#dc2626" }}>
                Danger Zone
              </h4>
              <p style={{ margin: "0 0 14px", fontSize: "12px", color: "#7f1d1d", lineHeight: "1.4" }}>
                Reset custom profile settings or delete account data.
              </p>
              <button
                type="button"
                onClick={() => setShowDeleteModal(true)}
                style={{
                  width: "100%",
                  background: "#dc2626",
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
                  boxShadow: "0 4px 12px rgba(220, 38, 38, 0.2)",
                }}
              >
                <FaTrashAlt /> Delete Profile & Reset
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* ==================== TAB 2: EDIT & FILL PROFILE DATA FORM (NICHE LOWER FORM) ==================== */
        <div className="travl-card" style={{ borderRadius: "24px", padding: "28px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px", borderBottom: "1px solid var(--nested-bg, #f1f5f9)", paddingBottom: "14px" }}>
            <div>
              <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "800", color: "var(--text-main, #0f172a)" }}>
                Edit & Fill Profile Information
              </h3>
              <p style={{ margin: "2px 0 0", fontSize: "13px", color: "var(--text-sub, #64748b)" }}>
                Fill in missing details, contact numbers, address, and profile photo.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab("view")}
              style={{ background: "#f1f5f9", border: "none", padding: "8px 14px", borderRadius: "10px", fontSize: "12.5px", fontWeight: "700", cursor: "pointer", color: "#475569" }}
            >
              Cancel
            </button>
          </div>

          <form onSubmit={handleSaveProfile}>

            {/* TWO COLUMN INPUT GRID */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "18px", marginBottom: "20px" }}>
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "var(--text-main, #334155)", marginBottom: "6px" }}>
                  Full Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  style={{ width: "100%", padding: "11px 14px", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "13.5px", outline: "none" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "var(--text-main, #334155)", marginBottom: "6px" }}>
                  Email Address *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  style={{ width: "100%", padding: "11px 14px", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "13.5px", outline: "none" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "var(--text-main, #334155)", marginBottom: "6px" }}>
                  Mobile Number (10 digits)
                </label>
                <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                  <select
                    value={formData.countryCode || "+91"}
                    onChange={(e) => setFormData({ ...formData, countryCode: e.target.value })}
                    style={{ padding: "11px 8px", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "13px", fontWeight: "700", outline: "none", background: "#ffffff" }}
                  >
                    <option value="+91">🇮🇳 +91</option>
                    <option value="+1">🇺🇸 +1</option>
                    <option value="+44">🇬🇧 +44</option>
                    <option value="+971">🇦🇪 +971</option>
                    <option value="+61">🇦🇺 +61</option>
                    <option value="+65">🇸🇬 +65</option>
                  </select>
                  <input
                    type="tel"
                    name="phone"
                    maxLength={10}
                    value={(formData.phone || "").replace(/^\+\d+\s*/, "")}
                    onChange={(e) => {
                      const digits = e.target.value.replace(/\D/g, "").slice(0, 10);
                      const code = formData.countryCode || "+91";
                      setFormData({ ...formData, phone: digits ? `${code} ${digits}` : "" });
                    }}
                    placeholder="9876543210"
                    style={{ flex: 1, width: "100%", padding: "11px 14px", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "13.5px", outline: "none" }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "var(--text-main, #334155)", marginBottom: "6px" }}>
                  Emergency Contact (10 digits)
                </label>
                <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                  <select
                    value={formData.emgCountryCode || "+91"}
                    onChange={(e) => setFormData({ ...formData, emgCountryCode: e.target.value })}
                    style={{ padding: "11px 8px", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "13px", fontWeight: "700", outline: "none", background: "#ffffff" }}
                  >
                    <option value="+91">🇮🇳 +91</option>
                    <option value="+1">🇺🇸 +1</option>
                    <option value="+44">🇬🇧 +44</option>
                    <option value="+971">🇦🇪 +971</option>
                    <option value="+61">🇦🇺 +61</option>
                    <option value="+65">🇸🇬 +65</option>
                  </select>
                  <input
                    type="tel"
                    name="emergencyContact"
                    maxLength={10}
                    value={(formData.emergencyContact || "").replace(/^\+\d+\s*/, "")}
                    onChange={(e) => {
                      const digits = e.target.value.replace(/\D/g, "").slice(0, 10);
                      const code = formData.emgCountryCode || "+91";
                      setFormData({ ...formData, emergencyContact: digits ? `${code} ${digits}` : "" });
                    }}
                    placeholder="9988776655"
                    style={{ flex: 1, width: "100%", padding: "11px 14px", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "13.5px", outline: "none" }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "var(--text-main, #334155)", marginBottom: "6px" }}>
                  Department / Designation
                </label>
                <input
                  type="text"
                  name="department"
                  value={formData.department}
                  onChange={handleInputChange}
                  style={{ width: "100%", padding: "11px 14px", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "13.5px", outline: "none" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "var(--text-main, #334155)", marginBottom: "6px" }}>
                  Hotel / Organization Name
                </label>
                <input
                  type="text"
                  name="hotelName"
                  value={formData.hotelName}
                  onChange={handleInputChange}
                  style={{ width: "100%", padding: "11px 14px", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "13.5px", outline: "none" }}
                />
              </div>
            </div>

            {/* FULL WIDTH TEXTAREAS */}
            <div style={{ marginBottom: "18px" }}>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "var(--text-main, #334155)", marginBottom: "6px" }}>
                Primary Address
              </label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                rows={2}
                style={{ width: "100%", padding: "11px 14px", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "13.5px", outline: "none", fontFamily: "inherit" }}
              />
            </div>

            <div style={{ marginBottom: "28px" }}>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "var(--text-main, #334155)", marginBottom: "6px" }}>
                Bio / About Profile
              </label>
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleInputChange}
                rows={3}
                style={{ width: "100%", padding: "11px 14px", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "13.5px", outline: "none", fontFamily: "inherit" }}
              />
            </div>

            {/* FORM ACTION BUTTONS */}
            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={() => setActiveTab("view")}
                style={{ background: "#f1f5f9", color: "#475569", border: "none", padding: "11px 20px", borderRadius: "12px", fontSize: "13.5px", fontWeight: "700", cursor: "pointer" }}
              >
                Cancel
              </button>
              <button
                type="submit"
                style={{
                  background: "linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)",
                  color: "#ffffff",
                  border: "none",
                  padding: "11px 24px",
                  borderRadius: "12px",
                  fontSize: "13.5px",
                  fontWeight: "800",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  boxShadow: "0 4px 14px rgba(124, 58, 237, 0.35)",
                }}
              >
                <FaSave /> Save Changes
              </button>
            </div>
          </form>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {showDeleteModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 99999,
            background: "rgba(15, 23, 42, 0.8)",
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
              maxWidth: "480px",
              width: "100%",
              padding: "24px",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.4)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px", color: "#dc2626", marginBottom: "12px" }}>
              <FaExclamationTriangle style={{ fontSize: "24px" }} />
              <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "800", color: "#0f172a" }}>
                Delete / Reset Profile Data?
              </h3>
            </div>

            <p style={{ fontSize: "13.5px", color: "#64748b", lineHeight: "1.5", marginBottom: "20px" }}>
              Are you sure you want to delete this profile data? This will clear custom details and log you out.
            </p>

            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
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
                onClick={handleConfirmDelete}
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
                Confirm Delete & Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
