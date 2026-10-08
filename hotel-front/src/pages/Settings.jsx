import { useState, useEffect } from "react";
import PageHeader from "../components/PageHeader.jsx";
import { fetchAuditLogs } from "../services/auditService.js";
import { logAction, getAuditLog } from "../audit.js";
import { getCurrentOrgId } from "../auth.js";
import { ROLES } from "../rbac.js";
import {
  FaSlidersH,
  FaHistory,
  FaShieldAlt,
  FaTerminal,
  FaSignInAlt,
  FaCog,
  FaExpandArrowsAlt,
  FaCheck,
  FaSave,
  FaHotel,
  FaFileInvoiceDollar,
  FaKey,
  FaEye,
  FaEyeSlash,
} from "react-icons/fa";
import "./Settings.css";

export default function Settings() {
  const [activeTab, setActiveTab] = useState("audit");
  const [passwordForm, setPasswordForm] = useState({ targetEmail: "", currentPassword: "", newPassword: "", confirmPassword: "" });
  const [staffSearch, setStaffSearch] = useState("");
  const [staffResults, setStaffResults] = useState([]);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [passwordMsg, setPasswordMsg] = useState("");
  const [showPasswords, setShowPasswords] = useState({ current: false, new: false, confirm: false });
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const isAdmin = ["super_admin", "admin"].includes(sessionStorage.getItem("userRole"));

  useEffect(() => {
    if (!isAdmin) setActiveTab("password");
  }, [isAdmin]);

  useEffect(() => {
    if (!isAdmin || !staffSearch.trim()) { setStaffResults([]); return; }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch("http://localhost:4000/api/staff", { credentials: "include" });
        const data = await res.json();
        const q = staffSearch.trim().toLowerCase();
        setStaffResults((data.staff || []).filter((s) => `${s.name || ""} ${s.email || ""}`.toLowerCase().includes(q)).slice(0, 8));
      } catch { setStaffResults([]); }
    }, 250);
    return () => clearTimeout(timer);
  }, [staffSearch, isAdmin]);
  const [expandedItems, setExpandedItems] = useState({});
  const [auditLog, setAuditLog] = useState([]);
  const [filters, setFilters] = useState({ search: '', module: '', action: '', branch_id: '' });
  const [selectedAudit, setSelectedAudit] = useState(null);

  useEffect(() => {
    if (activeTab !== "audit") return;
    loadLogs();
  }, [activeTab, filters]);

  async function loadLogs() {
    const rawLogs = getAuditLog(); // Use local storage instead of backend
    const filteredLogs = rawLogs.filter(log => {
      if (filters.search && !`${log.action} ${log.target} ${log.user}`.toLowerCase().includes(filters.search.toLowerCase())) return false;
      // other filters can be ignored for simple mock
      return true;
    });

    const grouped = {};
    filteredLogs.forEach(log => {
      const d = log.date || new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
      if (!grouped[d]) grouped[d] = [];
      grouped[d].push(log);
    });
    const timeline = Object.keys(grouped).map(dateGroup => ({
      dateGroup,
      items: grouped[dateGroup]
    }));
    setAuditLog(timeline);
  }
  const [hotelConfig, setHotelConfig] = useState(() => {
    try {
      const saved = localStorage.getItem("hotelConfig");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.logo === undefined) parsed.logo = "";
        return parsed;
      }
    } catch { }
    return {
      name: "Luxury Stay & Suites",
      email: "admin@luxurystay.com",
      phone: "9876543210",
      checkIn: "14:00",
      checkOut: "11:00",
      gstRate: "18",
      currency: "INR (₹)",
      welcomeMsg: "Welcome to Luxury Stay & Suites! We hope you enjoy your experience.",
      logo: "",
    };
  });

  const [savedMsg, setSavedMsg] = useState(false);

  useEffect(() => {
    const orgId = getCurrentOrgId() || "global";
    fetch(`http://localhost:4000/api/site-settings?orgId=${encodeURIComponent(orgId)}`)
      .then((r) => r.json())
      .then((data) => setHotelConfig((prev) => ({ ...prev, logo: data.logo || "" })))
      .catch(() => { });
  }, []);

  const handleSaveConfig = (e) => {
    e.preventDefault();
    localStorage.setItem("hotelConfig", JSON.stringify(hotelConfig));
    const orgId = getCurrentOrgId() || "global";
    fetch("http://localhost:4000/api/site-settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orgId, logo: hotelConfig.logo }),
    }).then((r) => r.json()).then(() => window.dispatchEvent(new CustomEvent("branch_logo_changed", { detail: { orgId, logo: hotelConfig.logo } }))).catch(() => { });
    logAction("Updated hotel configuration", "General Settings", "settings");
    setSavedMsg(true);
    setTimeout(() => setSavedMsg(false), 3000);
    // Reload logs so the new action appears in the timeline immediately
    loadLogs();
  };

  const toggleExpand = (id) => {
    setExpandedItems((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="settings-page-container">
      <PageHeader
        title="Settings & Audit Log"
        subtitle="Manage hotel configuration, tax rates, RBAC policies, and view immutable audit history"
      />

      {/* SINGLE CONTAINER PANEL */}
      <section className="settings-panel">
        {/* TABS HEADER */}
        <div className="settings-tab-header">
          {isAdmin && <button
            type="button"
            className={`settings-tab-btn ${activeTab === "audit" ? "active" : ""}`}
            onClick={() => setActiveTab("audit")}
          >
            <FaHistory /> Audit Log & Activity Trail
          </button>}

          {isAdmin && <button
            type="button"
            className={`settings-tab-btn ${activeTab === "general" ? "active" : ""}`}
            onClick={() => setActiveTab("general")}
          >
            <FaSlidersH /> General & Hotel Settings
          </button>}

          {isAdmin && <button
            type="button"
            className={`settings-tab-btn ${activeTab === "password" ? "active" : ""}`}
            onClick={() => setActiveTab("password")}
          >
            <FaKey /> Change Password
          </button>}
        </div>

        {activeTab === "password" && (
          <div className="change-password-panel" style={{ maxWidth: "620px", margin: "0 auto", padding: "28px 0 40px" }}>
            <h3 style={{ margin: "0 0 8px" }}>Change Password</h3>
            <p style={{ color: "#64748b", fontSize: "13px", marginBottom: "20px" }}>
              {isAdmin ? "Admin kisi bhi staff account ka password change kar sakta hai." : "Aap sirf apna password change kar sakte hain."}
            </p>
            {isAdmin && <>
              <div className="staff-search-box"><span>⌕</span><input className="settings-input" type="search" placeholder="Search employee by name or email" value={staffSearch} onChange={(e) => { setStaffSearch(e.target.value); setSelectedStaff(null); setPasswordForm({ ...passwordForm, targetEmail: "" }); }} /></div>
              {staffResults.length > 0 && (
                <div className="staff-search-results">
                  {staffResults.map((staff) => (
                    <button type="button" key={staff.id || staff.email} onClick={() => { setSelectedStaff(staff); setStaffSearch(staff.name); setStaffResults([]); setPasswordForm({ ...passwordForm, targetEmail: staff.email }); }}>
                      <strong>{staff.name}</strong>
                      <span>{staff.email}</span>
                    </button>
                  ))}
                </div>
              )}
              {selectedStaff && <div className="selected-staff">Selected: <strong>{selectedStaff.name}</strong> ({selectedStaff.email})</div>}
            </>}

        {[
          ['currentPassword', 'Current password', 'current'],
          ['newPassword', 'New password (minimum 6 characters)', 'new'],
          ['confirmPassword', 'Confirm new password', 'confirm']
        ].map(([field, placeholder, key]) => (
          <div className="password-field-wrap" key={field}>
            <input className="settings-input" type={showPasswords[key] ? "text" : "password"} placeholder={placeholder} value={passwordForm[field]} onChange={(e) => setPasswordForm({ ...passwordForm, [field]: e.target.value })} />
            <button type="button" className="password-eye-btn" onClick={() => setShowPasswords({ ...showPasswords, [key]: !showPasswords[key] })} aria-label={showPasswords[key] ? "Hide password" : "Show password"}>{showPasswords[key] ? <FaEyeSlash /> : <FaEye />}</button>
          </div>
        ))}

        <button type="button" className="settings-save-btn" onClick={async () => {
          setPasswordMsg("");
          if (isAdmin && !passwordForm.targetEmail) return setPasswordMsg("Please search and select an employee first.");
          if (passwordForm.newPassword.length < 6) return setPasswordMsg("Password must be at least 6 characters.");
          if (passwordForm.newPassword !== passwordForm.confirmPassword) return setPasswordMsg("New passwords do not match.");
          const res = await fetch("http://localhost:4000/api/auth/change-password", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${sessionStorage.getItem("authToken") || ""}` }, credentials: "include", body: JSON.stringify(passwordForm) });
          const data = await res.json();
          setPasswordMsg(data.message || data.error || "Password update failed.");
          if (res.ok) {
            setShowSuccessPopup(true);
            setTimeout(() => setShowSuccessPopup(false), 3500);
            setPasswordForm({ targetEmail: "", currentPassword: "", newPassword: "", confirmPassword: "" });
            setStaffSearch("");
            setSelectedStaff(null);
          }
        }}>Change Password</button>
        {passwordMsg && <div style={{ marginTop: "12px", color: passwordMsg.includes("success") ? "#15803d" : "#dc2626" }}>{passwordMsg}</div>}
    </div>
  )
}

{ showSuccessPopup && <div className="password-success-popup"><div className="success-check">✓</div><div><strong>Password changed successfully</strong><span>New password is active now.</span></div><button type="button" onClick={() => setShowSuccessPopup(false)}>×</button></div> }

{/* TAB 1: AUDIT LOG TIMELINE */ }
{
  activeTab === "audit" && (
    <div style={{ maxWidth: "880px", margin: "0 auto", padding: "10px 0 30px" }}>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <input type="text" placeholder="Search..." value={filters.search} onChange={e => setFilters({ ...filters, search: e.target.value })} className="settings-field-input" style={{ flex: 1, minWidth: '200px' }} />
        <select value={filters.module} onChange={e => setFilters({ ...filters, module: e.target.value })} className="settings-field-input" style={{ width: "auto" }}>
          <option value="">All Modules</option>
          <option value="Rooms">Rooms</option>
          <option value="Bookings">Bookings</option>
          <option value="Staff">Staff</option>
          <option value="Authentication">Authentication</option>
        </select>
        <select value={filters.action} onChange={e => setFilters({ ...filters, action: e.target.value })} className="settings-field-input" style={{ width: "auto" }}>
          <option value="">All Actions</option>
          <option value="Created Booking">Created Booking</option>
          <option value="Updated Room">Updated Room</option>
          <option value="Deleted Room">Deleted Room</option>
          <option value="Logged In">Logged In</option>
        </select>
      </div>

      {auditLog.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>
          No audit logs found for this organization.
        </div>
      ) : auditLog.map((group) => (
        <div key={group.dateGroup} style={{ marginBottom: "32px" }}>
          {/* CENTERED DATE BADGE DIVIDER ON TIMELINE */}
          <div style={{ position: "relative", textAlign: "center", marginBottom: "28px" }}>
            <div className="audit-date-divider-line" />
            <span className="audit-date-badge">
              {group.dateGroup}
            </span>
          </div>

          {/* TIMELINE ITEMS CONTAINER */}
          <div style={{ position: "relative", paddingLeft: "100px" }}>
            {/* CONTINUOUS VERTICAL TIMELINE LINE */}
            <div className="audit-vertical-line" />

            {group.items.map((item) => {
              let NodeIcon = FaTerminal;
              let iconBg = "#0284c7";

              if (item.type === "login") {
                NodeIcon = FaSignInAlt;
                iconBg = "#10b981";
              } else if (item.type === "settings") {
                NodeIcon = FaSlidersH;
                iconBg = "#ca8a04";
              } else if (item.type === "permission") {
                NodeIcon = FaShieldAlt;
                iconBg = "#ca8a04";
              }

              return (
                <div
                  key={item.id}
                  style={{
                    position: "relative",
                    marginBottom: "28px",
                    display: "flex",
                    alignItems: "flex-start",
                  }}
                >
                  {/* TIMESTAMP ON THE LEFT */}
                  <div className="audit-timestamp">
                    {item.time || "00:00"}
                  </div>

                  {/* TIMELINE NODE ICON */}
                  <div
                    className="audit-node-icon"
                    style={{ background: iconBg }}
                  >
                    <NodeIcon />
                  </div>

                  {/* CONTENT RIGHT BODY */}
                  <div style={{ paddingLeft: "52px", flex: 1 }}>
                    <div className="audit-content-title">
                      <strong style={{ color: item.userColor || '#16a34a', fontWeight: "700" }}>
                        {item.user || 'System'}
                      </strong>{" "}
                      <strong className="action-title">{item.action}</strong>{" "}
                      {item.target}
                    </div>

                    <div className="audit-meta-text">
                      Role: {item.role || 'System'} | Type: {item.type}
                    </div>

                    {(item.old_value || item.new_value) && (
                      <button
                        type="button"
                        className="audit-expand-btn"
                        onClick={() => setSelectedAudit(item)}
                        style={{ marginTop: '8px' }}
                      >
                        <FaExpandArrowsAlt style={{ fontSize: "11px", marginRight: "4px" }} />
                        View Details
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

{/* TAB 2: GENERAL HOTEL CONFIGURATION */ }
{
  activeTab === "general" && (
    <div style={{ maxWidth: "680px", margin: "0 auto", padding: "10px 0" }}>
      <h3 className="settings-heading">
        Property & Hotel Configuration
      </h3>

      <form onSubmit={handleSaveConfig} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
        <div style={{ display: "flex", gap: "16px" }}>
          <div style={{ flex: 1 }}>
            <label className="settings-label">
              Hotel Brand Name
            </label>
            <input
              value={hotelConfig.name}
              onChange={(e) => setHotelConfig({ ...hotelConfig, name: e.target.value })}
              className="settings-field-input"
            />
          </div>

          <div style={{ flex: 1 }}>
            <label className="settings-label">
              Contact Phone Number
            </label>
            <input
              type="tel"
              inputMode="numeric"
              maxLength={10}
              minLength={10}
              pattern="[0-9]{10}"
              title="Phone number exactly 10 digits ka hona chahiye"
              value={hotelConfig.phone}
              onChange={(e) => setHotelConfig({ ...hotelConfig, phone: e.target.value.replace(/\D/g, "").slice(0, 10) })}
              className="settings-field-input"
            />
          </div>
        </div>

        <div>
          <label className="settings-label">
            Support Email Address
          </label>
          <input
            type="email"
            value={hotelConfig.email}
            onChange={(e) => setHotelConfig({ ...hotelConfig, email: e.target.value })}
            className="settings-field-input"
          />
        </div>

        <div>
          <label className="settings-label">Hotel Logo</label>
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            {hotelConfig.logo ? (
              <img src={hotelConfig.logo} alt="Hotel logo preview" style={{ width: "58px", height: "58px", objectFit: "contain", borderRadius: "10px", border: "1px solid #e2e8f0", background: "#fff" }} />
            ) : (
              <div style={{ width: "58px", height: "58px", display: "grid", placeItems: "center", borderRadius: "10px", border: "1px dashed #cbd5e1", color: "#94a3b8", fontSize: "11px" }}>No logo</div>
            )}
            <label className="settings-save-btn" style={{ margin: 0, cursor: "pointer" }}>
              Upload Logo
              <input type="file" accept="image/*" hidden onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = () => setHotelConfig((prev) => ({ ...prev, logo: String(reader.result || "") }));
                reader.readAsDataURL(file);
              }} />
            </label>
          </div>
          <small style={{ display: "block", marginTop: "6px", color: "#64748b" }}>This logo is saved only for the currently selected branch.</small>
        </div>

        <div style={{ display: "flex", gap: "16px" }}>
          <div style={{ flex: 1 }}>
            <label className="settings-label">
              Check-in Time
            </label>
            <input
              type="time"
              value={hotelConfig.checkIn}
              onChange={(e) => setHotelConfig({ ...hotelConfig, checkIn: e.target.value })}
              className="settings-field-input"
            />
          </div>

          <div style={{ flex: 1 }}>
            <label className="settings-label">
              Check-out Time
            </label>
            <input
              type="time"
              value={hotelConfig.checkOut}
              onChange={(e) => setHotelConfig({ ...hotelConfig, checkOut: e.target.value })}
              className="settings-field-input"
            />
          </div>

          <div style={{ flex: 1 }}>
            <label className="settings-label">
              Default GST Tax (%)
            </label>
            <input
              type="number"
              value={hotelConfig.gstRate}
              onChange={(e) => setHotelConfig({ ...hotelConfig, gstRate: e.target.value })}
              className="settings-field-input"
            />
          </div>
        </div>

        <div>
          <label className="settings-label">
            Guest Welcome Message
          </label>
          <textarea
            rows={3}
            value={hotelConfig.welcomeMsg}
            onChange={(e) => setHotelConfig({ ...hotelConfig, welcomeMsg: e.target.value })}
            className="settings-field-input"
            style={{ fontFamily: "inherit" }}
          />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "14px", marginTop: "10px" }}>
          <button
            type="submit"
            style={{
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              color: "#ffffff",
              padding: "12px 24px",
              borderRadius: "12px",
              fontSize: "14px",
              fontWeight: "700",
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              boxShadow: "0 4px 14px rgba(102, 126, 234, 0.4)",
            }}
          >
            <FaSave /> Save Settings
          </button>

          {savedMsg && (
            <span style={{ color: "#16a34a", fontWeight: "700", fontSize: "13.5px", display: "flex", alignItems: "center", gap: "6px" }}>
              <FaCheck /> Settings saved successfully!
            </span>
          )}
        </div>
      </form>
    </div>
  )
}
{/* DETAILS MODAL */ }
{
  selectedAudit && (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: "20px" }}>
      <div style={{ background: '#fff', padding: '24px', borderRadius: '12px', width: '100%', maxWidth: '800px', maxHeight: '85vh', overflowY: 'auto', boxShadow: "0 10px 25px rgba(0,0,0,0.2)" }}>
        <h3 style={{ margin: "0 0 16px", color: "#1e293b", fontSize: "1.2rem" }}>Audit Details: {selectedAudit.action}</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "20px", fontSize: "13.5px", color: "#475569" }}>
          <div><strong>Date:</strong> {selectedAudit.date} {selectedAudit.time}</div>
          <div><strong>User:</strong> {selectedAudit.user} ({selectedAudit.role})</div>
          <div><strong>Action:</strong> {selectedAudit.action} {selectedAudit.target}</div>
          <div><strong>Type:</strong> {selectedAudit.type}</div>
        </div>

        {selectedAudit.description && (
          <div style={{ padding: "12px", background: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0", marginBottom: "20px" }}>
            <strong>Description:</strong> {selectedAudit.description}
          </div>
        )}

        {(selectedAudit.old_value || selectedAudit.new_value) && (
          <div style={{ display: 'flex', gap: '20px', marginTop: '10px' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h4 style={{ color: "#be123c", margin: "0 0 8px", fontSize: "14px" }}>Before</h4>
              <pre style={{ background: '#ffe4e6', padding: '12px', fontSize: '12.5px', borderRadius: '6px', overflowX: 'auto', margin: 0, minHeight: "100px" }}>
                {selectedAudit.old_value ? JSON.stringify(JSON.parse(selectedAudit.old_value), null, 2) : 'None / Not recorded'}
              </pre>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h4 style={{ color: "#15803d", margin: "0 0 8px", fontSize: "14px" }}>After</h4>
              <pre style={{ background: '#dcfce7', padding: '12px', fontSize: '12.5px', borderRadius: '6px', overflowX: 'auto', margin: 0, minHeight: "100px" }}>
                {selectedAudit.new_value ? JSON.stringify(JSON.parse(selectedAudit.new_value), null, 2) : 'None / Not recorded'}
              </pre>
            </div>
          </div>
        )}

        <div style={{ textAlign: "right", marginTop: '24px' }}>
          <button onClick={() => setSelectedAudit(null)} style={{ padding: '10px 24px', background: '#e2e8f0', color: '#475569', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: "600" }}>Close</button>
        </div>
      </div>
    </div>
  )
}
      </section >
    </div >
  );
}
