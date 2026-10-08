import { useState, useEffect } from "react";
import {
  FaTimes,
  FaUser,
  FaBriefcase,
  FaBuilding,
  FaCalendarAlt,
  FaCreditCard,
  FaCheckCircle,
  FaClock,
} from "react-icons/fa";
import PaymentWalletIcon from "./PaymentWalletIcon.jsx";

const DEPARTMENTS = [
  "Housekeeping",
  "Front Office",
  "Administration",
  "Kitchen & Food",
  "Maintenance",
  "Security",
  "Finance & Accounts",
];

const DEFAULT_AVATARS = [
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80",
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80",
  "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=120&q=80",
  "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=120&q=80",
];

export default function GeneratePayrollModal({ isOpen, onClose, onSave, existingRows = [] }) {
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

  // Form states
  const [selectedStaffId, setSelectedStaffId] = useState("custom");
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [department, setDepartment] = useState("Front Office");
  const [salary, setSalary] = useState("");
  const [payPeriod, setPayPeriod] = useState("Aug 2026");
  const [accountNo, setAccountNo] = useState("");
  const [status, setStatus] = useState("Pending");
  const [paymentDate, setPaymentDate] = useState("Pending (Due 01 Sept)");
  const [error, setError] = useState("");

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      const now = new Date();
      const currentMonthStr = now.toLocaleDateString("en-US", { month: "short", year: "numeric" });
      const nextMonthStr = new Date(now.getFullYear(), now.getMonth() + 1, 1).toLocaleDateString("en-US", { month: "short" });
      
      setSelectedStaffId("custom");
      setName("");
      setRole("");
      setDepartment("Front Office");
      setSalary("");
      setPayPeriod(currentMonthStr || "Aug 2026");
      setAccountNo("");
      setStatus("Pending");
      setPaymentDate(`Pending (Due 01 ${nextMonthStr})`);
      setError("");
    }
  }, [isOpen]);

  // Handle staff dropdown selection
  const handleStaffSelect = (e) => {
    const val = e.target.value;
    setSelectedStaffId(val);

    if (val === "custom") {
      setName("");
      setRole("");
      setDepartment("Front Office");
      setSalary("");
      setAccountNo("");
    } else {
      const found = existingRows.find((r) => String(r.dbId) === String(val) || String(r.id) === String(val));
      if (found) {
        setName(found.name || "");
        setRole(found.role || "");
        setDepartment(found.department || "Front Office");
        setSalary(found.salary ? String(found.salary).replace(/[^0-9]/g, "") : "");
        setAccountNo(found.accountNo || found.phone || "");
      }
    }
  };

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Please enter staff member's name.");
      return;
    }
    const numericSal = Number(String(salary).replace(/[^0-9]/g, ""));
    if (!salary || isNaN(numericSal) || numericSal <= 0) {
      setError("Please enter a valid salary amount.");
      return;
    }

    const cleanSalary = String(salary).startsWith("₹")
      ? salary
      : `₹${numericSal.toLocaleString("en-IN")}`;

    const randomAvatar = DEFAULT_AVATARS[Math.floor(Math.random() * DEFAULT_AVATARS.length)];

    const payload = {
      id: Date.now(),
      employeeId: selectedStaffId !== "custom" ? selectedStaffId : null,
      name: name.trim(),
      role: role.trim() || "Staff Member",
      department,
      salary: cleanSalary,
      payPeriod: payPeriod || "Aug 2026",
      paymentDate: status === "Paid" ? "Paid Today" : (paymentDate || "Pending (Due 01 Sept)"),
      accountNo: accountNo.trim() || "•••• 0000 (Bank)",
      status,
      statusColor: status === "Paid" ? "#16a34a" : "#d97706",
      statusBg: status === "Paid" ? "#dcfce7" : "#fef3c7",
      avatar: randomAvatar,
    };

    onSave(payload);
    onClose();
  };

  // Styles object
  const modalStyles = {
    overlay: {
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(15, 23, 42, 0.65)",
      backdropFilter: "blur(6px)",
      zIndex: 9999,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "16px",
    },
    modal: {
      backgroundColor: isDark ? "#1e293b" : "#ffffff",
      color: isDark ? "#f8fafc" : "#0f172a",
      borderRadius: "20px",
      width: "100%",
      maxWidth: "560px",
      maxHeight: "90vh",
      overflowY: "auto",
      boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
      border: isDark ? "1px solid #334155" : "1px solid #e2e8f0",
    },
    header: {
      padding: "20px 24px",
      borderBottom: isDark ? "1px solid #334155" : "1px solid #f1f5f9",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
    },
    title: {
      fontSize: "18px",
      fontWeight: "700",
      margin: 0,
      color: isDark ? "#f8fafc" : "#0f172a",
    },
    subtitle: {
      fontSize: "12px",
      color: isDark ? "#94a3b8" : "#64748b",
      marginTop: "2px",
    },
    closeBtn: {
      background: isDark ? "rgba(255,255,255,0.08)" : "#f1f5f9",
      color: isDark ? "#cbd5e1" : "#64748b",
      border: "none",
      borderRadius: "50%",
      width: "34px",
      height: "34px",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      transition: "all 0.2s",
    },
    body: {
      padding: "24px",
    },
    inputGroup: {
      marginBottom: "16px",
    },
    label: {
      display: "block",
      fontSize: "13px",
      fontWeight: "600",
      color: isDark ? "#cbd5e1" : "#334155",
      marginBottom: "6px",
    },
    input: {
      width: "100%",
      padding: "10px 14px",
      borderRadius: "10px",
      border: isDark ? "1px solid #334155" : "1px solid #cbd5e1",
      backgroundColor: isDark ? "#0f172a" : "#ffffff",
      color: isDark ? "#f8fafc" : "#0f172a",
      fontSize: "14px",
      outline: "none",
      boxSizing: "border-box",
    },
    select: {
      width: "100%",
      padding: "10px 14px",
      borderRadius: "10px",
      border: isDark ? "1px solid #334155" : "1px solid #cbd5e1",
      backgroundColor: isDark ? "#0f172a" : "#ffffff",
      color: isDark ? "#f8fafc" : "#0f172a",
      fontSize: "14px",
      outline: "none",
      boxSizing: "border-box",
      cursor: "pointer",
    },
    footer: {
      padding: "18px 24px",
      borderTop: isDark ? "1px solid #334155" : "1px solid #f1f5f9",
      display: "flex",
      justifyContent: "flex-end",
      gap: "12px",
    },
    cancelBtn: {
      padding: "10px 18px",
      borderRadius: "10px",
      border: isDark ? "1px solid #334155" : "1px solid #cbd5e1",
      backgroundColor: "transparent",
      color: isDark ? "#cbd5e1" : "#475569",
      fontSize: "14px",
      fontWeight: "600",
      cursor: "pointer",
    },
    saveBtn: {
      padding: "10px 22px",
      borderRadius: "10px",
      border: "none",
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      color: "#ffffff",
      fontSize: "14px",
      fontWeight: "700",
      cursor: "pointer",
      boxShadow: "0 4px 14px rgba(102, 126, 234, 0.4)",
    },
    errorBanner: {
      backgroundColor: "#fef2f2",
      border: "1px solid #fecaca",
      color: "#991b1b",
      padding: "10px 14px",
      borderRadius: "10px",
      fontSize: "13px",
      marginBottom: "16px",
    },
  };

  return (
    <div style={modalStyles.overlay} onClick={onClose}>
      <div style={modalStyles.modal} onClick={(e) => e.stopPropagation()}>
        {/* MODAL HEADER */}
        <div style={modalStyles.header}>
          <div>
            <h2 style={modalStyles.title}>Generate Payroll</h2>
            <div style={modalStyles.subtitle}>
              Enter staff salary information to generate payroll record
            </div>
          </div>
          <button style={modalStyles.closeBtn} onClick={onClose} type="button">
            <FaTimes />
          </button>
        </div>

        {/* FORM BODY */}
        <form onSubmit={handleSubmit}>
          <div style={modalStyles.body}>
            {error && <div style={modalStyles.errorBanner}>{error}</div>}

            {/* QUICK PRE-FILL DROPDOWN */}
            {existingRows.length > 0 && (
              <div style={modalStyles.inputGroup}>
                <label style={modalStyles.label}>Select Staff Member (Optional)</label>
                <select
                  style={modalStyles.select}
                  value={selectedStaffId}
                  onChange={handleStaffSelect}
                >
                  <option value="custom">+ Add New Staff / Custom Entry</option>
                  {existingRows.map((r) => (
                    <option key={r.dbId || r.id} value={r.dbId || r.id}>
                      {r.name} ({r.role} - {r.department || "Staff"})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* GRID FOR NAME & ROLE */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
              <div style={modalStyles.inputGroup}>
                <label style={modalStyles.label}>
                  <FaUser style={{ marginRight: "6px", color: "#667eea" }} />
                  Staff Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Ramesh Kumar"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={modalStyles.input}
                  required
                />
              </div>

              <div style={modalStyles.inputGroup}>
                <label style={modalStyles.label}>
                  <FaBriefcase style={{ marginRight: "6px", color: "#667eea" }} />
                  Designation / Role
                </label>
                <input
                  type="text"
                  placeholder="e.g. Housekeeping Supervisor"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  style={modalStyles.input}
                />
              </div>
            </div>

            {/* GRID FOR DEPARTMENT & SALARY */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
              <div style={modalStyles.inputGroup}>
                <label style={modalStyles.label}>
                  <FaBuilding style={{ marginRight: "6px", color: "#667eea" }} />
                  Department
                </label>
                <select
                  style={modalStyles.select}
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                >
                  {DEPARTMENTS.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>

              <div style={modalStyles.inputGroup}>
                <label style={modalStyles.label}>
                  <PaymentWalletIcon color="#667eea" size={16} style={{ marginRight: "6px" }} />
                  Monthly Salary (₹) *
                </label>
                <input
                  type="text"
                  placeholder="e.g. 25000"
                  value={salary}
                  onChange={(e) => setSalary(e.target.value)}
                  style={modalStyles.input}
                  required
                />
              </div>
            </div>

            {/* GRID FOR PAY PERIOD & BANK DETAILS */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
              <div style={modalStyles.inputGroup}>
                <label style={modalStyles.label}>
                  <FaCalendarAlt style={{ marginRight: "6px", color: "#667eea" }} />
                  Pay Period
                </label>
                <input
                  type="text"
                  placeholder="e.g. Aug 2026"
                  value={payPeriod}
                  onChange={(e) => setPayPeriod(e.target.value)}
                  style={modalStyles.input}
                />
              </div>

              <div style={modalStyles.inputGroup}>
                <label style={modalStyles.label}>
                  <FaCreditCard style={{ marginRight: "6px", color: "#667eea" }} />
                  Bank Account / Details
                </label>
                <input
                  type="text"
                  placeholder="e.g. •••• 4829 (HDFC Bank)"
                  value={accountNo}
                  onChange={(e) => setAccountNo(e.target.value)}
                  style={modalStyles.input}
                />
              </div>
            </div>

            {/* PAYMENT STATUS & PAYMENT DATE */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
              <div style={modalStyles.inputGroup}>
                <label style={modalStyles.label}>
                  <FaCheckCircle style={{ marginRight: "6px", color: "#667eea" }} />
                  Payment Status
                </label>
                <select
                  style={modalStyles.select}
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <option value="Pending">Pending</option>
                  <option value="Paid">Paid</option>
                </select>
              </div>

              <div style={modalStyles.inputGroup}>
                <label style={modalStyles.label}>
                  <FaClock style={{ marginRight: "6px", color: "#667eea" }} />
                  Payment Date / Note
                </label>
                <input
                  type="text"
                  placeholder={status === "Paid" ? "Paid Today" : "Pending (Due 01 Sept)"}
                  value={status === "Paid" ? "Paid Today" : paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  style={modalStyles.input}
                  disabled={status === "Paid"}
                />
              </div>
            </div>
          </div>

          {/* FOOTER ACTIONS */}
          <div style={modalStyles.footer}>
            <button style={modalStyles.cancelBtn} type="button" onClick={onClose}>
              Cancel
            </button>
            <button style={modalStyles.saveBtn} type="submit">
              Generate Payroll
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
