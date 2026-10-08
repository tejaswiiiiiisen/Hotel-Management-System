import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaWallet,
  FaCalendarCheck,
  FaCalendarTimes,
  FaSun,
  FaInfoCircle,
  FaArrowLeft,
  FaUserTie,
  FaCheckCircle,
  FaTimesCircle,
  FaHistory,
  FaFileInvoiceDollar,
  FaSyncAlt,
  FaMoneyBillWave,
} from "react-icons/fa";
import { getUserEmail, getUserName, getUserRole, getCurrentOrg, getCurrentOrgId } from "../auth.js";
import { getEmployees } from "../employees.js";
import { calculateHousekeepingSalaryAndBalance } from "../services/housekeepingStore.js";
import { showSuccess, showInfo } from "../utils/toast.js";

export default function Balance() {
  const navigate = useNavigate();
  const userEmail = getUserEmail();
  const userName = getUserName();
  const userRole = getUserRole();
  const cleanRole = (userRole || "").toLowerCase().trim();
  const isKitchen = cleanRole === "chef" || cleanRole === "kitchen";
  const currentOrg = getCurrentOrg() || "Ashirwad Hotel";
  const currentOrgId = getCurrentOrgId() || "AJ01";

  // Dynamic employee name & staffId
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

  const hkDisplayName = currentHkEmp?.name || (userName && userName !== "Super Admin" ? userName : (isKitchen ? "Executive Chef" : "Sunita Devi"));
  const hkStaffId = currentHkEmp?.staff_id || currentHkEmp?.staffId || (isKitchen ? "KIT-101" : "HK-101");

  // Dynamic salary data (Base ₹30,000 for 20 days, -₹1,000 auto-deducted except Sunday)
  const [salaryData, setSalaryData] = useState(() => {
    return calculateHousekeepingSalaryAndBalance({
      staffEmail: userEmail,
      baseSalary: 30000,
      baseDays: 20,
    });
  });

  // Real-time Punch / Duty Status
  const [punchStatus, setPunchStatus] = useState(() => {
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

  const refreshData = () => {
    setSalaryData(
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
          setPunchStatus(parsed.isCheckedIn ? "Checked In" : "Off Duty");
        } else {
          setPunchStatus("Off Duty");
        }
      }
    } catch (e) {}
  };

  useEffect(() => {
    window.addEventListener("staff_attendance_changed", refreshData);
    window.addEventListener("storage", refreshData);
    const interval = setInterval(refreshData, 3000);
    return () => {
      window.removeEventListener("staff_attendance_changed", refreshData);
      window.removeEventListener("storage", refreshData);
      clearInterval(interval);
    };
  }, []);

  // Initial default transactions as fallback
  const defaultTransactions = [
    {
      month: "March 2026",
      date: "01 Mar 2026",
      day: "Sunday",
      time: "10:30 AM",
      amount: "₹30,000",
      mode: "Bank Transfer (NEFT)",
      ref: "TXN-SAL-98231",
      status: "Credited / Received",
    },
    {
      month: "February 2026",
      date: "01 Feb 2026",
      day: "Sunday",
      time: "11:15 AM",
      amount: "₹29,000",
      mode: "Direct Bank Transfer",
      ref: "TXN-SAL-94112",
      status: "Credited / Received",
    },
    {
      month: "January 2026",
      date: "01 Jan 2026",
      day: "Thursday",
      time: "09:45 AM",
      amount: "₹30,000",
      mode: "Direct Bank Transfer",
      ref: "TXN-SAL-88741",
      status: "Credited / Received",
    },
  ];

  const [transactions, setTransactions] = useState(defaultTransactions);
  const [currentBalance, setCurrentBalance] = useState(salaryData.netBalance);
  const [withdrawStatus, setWithdrawStatus] = useState("idle"); // 'idle' | 'processing' | 'withdrawn'

  // Fetch permanent withdrawals from database on mount
  useEffect(() => {
    const fetchDbTransactions = async () => {
      try {
        const queryParams = new URLSearchParams();
        if (userEmail) queryParams.append("staffEmail", userEmail);
        if (hkStaffId) queryParams.append("staffId", hkStaffId);

        const res = await fetch(`http://localhost:4000/api/staff/withdraw?${queryParams.toString()}`);
        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.transactions) && data.transactions.length > 0) {
            // Merge DB withdrawals with past default history
            setTransactions([...data.transactions, ...defaultTransactions]);
            // If already withdrawn previously in this cycle, balance is 0
            setCurrentBalance(0);
            setWithdrawStatus("withdrawn");
          }
        }
      } catch (err) {
        console.warn("Could not load withdrawals from DB:", err);
      }
    };

    fetchDbTransactions();
  }, [userEmail, hkStaffId]);

  // Sync if underlying calculation changes and hasn't been withdrawn yet
  useEffect(() => {
    if (withdrawStatus === "idle") {
      setCurrentBalance(salaryData.netBalance);
    }
  }, [salaryData.netBalance, withdrawStatus]);

  const handleWithdraw = async () => {
    if (withdrawStatus === "processing" || withdrawStatus === "withdrawn" || currentBalance <= 0) return;
    setWithdrawStatus("processing");
    
    const now = new Date();
    const withdrawAmount = currentBalance;
    const formattedDate = now.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
    const formattedDay = now.toLocaleDateString("en-US", { weekday: "long" });
    const formattedTime = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
    const currentMonthStr = now.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    const txnRef = `TXN-WDL-${Date.now().toString().slice(-5)}`;

    const newTxn = {
      month: currentMonthStr,
      date: formattedDate,
      day: formattedDay,
      time: formattedTime,
      amount: `₹${withdrawAmount.toLocaleString("en-IN")}`,
      mode: "Instant Bank Withdrawal",
      ref: txnRef,
      status: "Credited / Received",
      staffId: hkStaffId,
      staffEmail: userEmail,
      staffName: hkDisplayName,
      orgId: currentOrgId,
    };

    try {
      // 1. Permanently save in MySQL Database
      await fetch("http://localhost:4000/api/staff/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          staffId: hkStaffId,
          staffName: hkDisplayName,
          staffEmail: userEmail,
          amount: withdrawAmount,
          month: currentMonthStr,
          date: formattedDate,
          day: formattedDay,
          time: formattedTime,
          mode: "Instant Bank Withdrawal",
          ref: txnRef,
          orgId: currentOrgId,
        }),
      });
    } catch (dbErr) {
      console.warn("Failed to persist withdrawal to DB:", dbErr);
    }

    // 2. Update UI state: Balance 0, append transaction at top
    setCurrentBalance(0);
    setTransactions((prev) => [newTxn, ...prev]);
    setWithdrawStatus("withdrawn");
    showSuccess(`₹${withdrawAmount.toLocaleString("en-IN")} withdrawn successfully to registered bank account! 🎉`);
  };

  const handlePunchToggle = () => {
    const isCurrentlyCheckedIn = punchStatus === "Checked In";
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
    setPunchStatus(nextStatus);
    window.dispatchEvent(new Event("staff_attendance_changed"));
    if (nextCheckedIn) {
      showSuccess("Punch In recorded! Status: On Duty 🟢");
    } else {
      showInfo("Punched Out recorded. Status: Off Duty ⚪");
    }
  };

  return (
    <div className="hk-balance-page" style={{ maxWidth: "1280px", margin: "0 auto", padding: "10px 15px 40px" }}>
      {/* TOP BREADCRUMB & CONTROLS */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "20px",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              background: "#f1f5f9",
              border: "1px solid #cbd5e1",
              borderRadius: "10px",
              padding: "8px 14px",
              fontSize: "13px",
              fontWeight: "700",
              color: "#334155",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#e2e8f0")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#f1f5f9")}
          >
            <FaArrowLeft size={12} /> Dashboard
          </button>
          <div>
            <h1 style={{ margin: 0, fontSize: "24px", fontWeight: "900", color: "#0f172a" }}>
              {isKitchen ? "Kitchen Salary & Balance" : "Housekeeping Salary & Balance"}
            </h1>
            <p style={{ margin: "2px 0 0", fontSize: "13px", color: "#64748b", fontWeight: "500" }}>
              Automated Deduction Engine • Sunday Exemption Rule Active
            </p>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button
            type="button"
            onClick={refreshData}
            title="Refresh Salary Calculation"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: "10px",
              padding: "8px 14px",
              fontSize: "13px",
              fontWeight: "700",
              color: "#059669",
              cursor: "pointer",
              boxShadow: "0 2px 4px rgba(0,0,0,0.04)",
            }}
          >
            <FaSyncAlt size={12} /> Refresh
          </button>
          <button
            type="button"
            onClick={() => navigate("/profile")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
              border: "none",
              borderRadius: "10px",
              padding: "8px 16px",
              fontSize: "13px",
              fontWeight: "700",
              color: "#ffffff",
              cursor: "pointer",
              boxShadow: "0 3px 8px rgba(99, 102, 241, 0.3)",
            }}
          >
            <FaUserTie size={12} /> View Profile
          </button>
        </div>
      </div>

      {/* CSS FOR WITHDRAW BLINKING PULSE ANIMATION */}
      <style>{`
        @keyframes withdrawGlowPulse {
          0% {
            box-shadow: 0 0 0 0 rgba(250, 204, 21, 0.7);
            transform: scale(1);
          }
          50% {
            box-shadow: 0 0 0 10px rgba(250, 204, 21, 0);
            transform: scale(1.03);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(250, 204, 21, 0);
            transform: scale(1);
          }
        }
        @keyframes successBlink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.75; }
        }
        .btn-withdraw-blink {
          animation: withdrawGlowPulse 1.8s infinite ease-in-out;
        }
        .withdrawn-success-blink {
          animation: successBlink 2s infinite ease-in-out;
        }
      `}</style>

      {/* KPI HERO STATS ROW (SINGLE CLEAN HERO WITH WITHDRAW BUTTON) */}
      <div style={{ marginBottom: "24px" }}>
        {/* CARD: NET PAYABLE SALARY (HERO) */}
        <div
          style={{
            background: "linear-gradient(135deg, #064e3b 0%, #047857 50%, #059669 100%)",
            borderRadius: "24px",
            padding: "26px 30px",
            color: "#ffffff",
            boxShadow: "0 14px 30px -5px rgba(5, 150, 105, 0.45)",
            position: "relative",
            overflow: "hidden",
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "20px",
          }}
        >
          {/* LEFT SIDE: SALARY DETAILS */}
          <div style={{ position: "relative", zIndex: 2, minWidth: "260px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
              <span style={{ fontSize: "12.5px", fontWeight: "800", textTransform: "uppercase", letterSpacing: "1px", color: "#a7f3d0" }}>
                Net Payable Salary
              </span>
              <span style={{ fontSize: "12px", fontWeight: "800", background: "rgba(255,255,255,0.2)", padding: "3px 10px", borderRadius: "999px" }}>
                {new Date().toLocaleString("en-US", { month: "short", year: "numeric" })}
              </span>
            </div>
            <div style={{ fontSize: "40px", fontWeight: "900", letterSpacing: "-0.5px", margin: "4px 0" }}>
              ₹{currentBalance.toLocaleString("en-IN")}
            </div>
            <div style={{ fontSize: "13px", color: "#d1fae5", display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
              <span>Base ₹{salaryData.baseSalary.toLocaleString("en-IN")}</span>
              <span>•</span>
              <span>Deductions ₹{salaryData.totalDeductions.toLocaleString("en-IN")}</span>
            </div>
          </div>

          {/* RIGHT SIDE: INTERACTIVE WITHDRAW BUTTON WITH TICK & BLINK */}
          <div style={{ position: "relative", zIndex: 2 }}>
            {withdrawStatus === "idle" && (
              <button
                type="button"
                onClick={handleWithdraw}
                className="btn-withdraw-blink"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  background: "linear-gradient(135deg, #facc15 0%, #eab308 100%)",
                  color: "#713f12",
                  border: "none",
                  borderRadius: "16px",
                  padding: "14px 26px",
                  fontSize: "15px",
                  fontWeight: "900",
                  cursor: "pointer",
                  letterSpacing: "0.3px",
                  transition: "all 0.2s ease",
                }}
              >
                <FaWallet size={18} />
                <span>Withdraw Money</span>
              </button>
            )}

            {withdrawStatus === "processing" && (
              <button
                type="button"
                disabled
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  background: "#ffffff",
                  color: "#059669",
                  border: "none",
                  borderRadius: "16px",
                  padding: "14px 26px",
                  fontSize: "15px",
                  fontWeight: "900",
                  cursor: "wait",
                  boxShadow: "0 6px 18px rgba(0,0,0,0.15)",
                }}
              >
                <FaSyncAlt className="spin" size={16} />
                <span>Processing Transfer...</span>
              </button>
            )}

            {withdrawStatus === "withdrawn" && (
              <div
                className="withdrawn-success-blink"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  background: "#ffffff",
                  color: "#15803d",
                  borderRadius: "16px",
                  padding: "12px 22px",
                  fontSize: "15px",
                  fontWeight: "900",
                  boxShadow: "0 6px 20px rgba(0,0,0,0.15)",
                  border: "2px solid #86efac",
                }}
              >
                <FaCheckCircle size={22} color="#16a34a" />
                <div>
                  <div style={{ fontSize: "14.5px", fontWeight: "900", color: "#15803d" }}>
                    Money Withdrawn ✓
                  </div>
                  <div style={{ fontSize: "11.5px", color: "#166534", fontWeight: "600" }}>
                    Credited to Bank Account
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* SALARY PAYMENT HISTORY TABLE */}
      <div
        style={{
          background: "#ffffff",
          borderRadius: "20px",
          padding: "24px",
          border: "1px solid #e2e8f0",
          boxShadow: "0 4px 12px rgba(0,0,0,0.04)",
          marginBottom: "24px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
          <div>
            <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "800", color: "#0f172a", display: "flex", alignItems: "center", gap: "8px" }}>
              <FaMoneyBillWave style={{ color: "#059669" }} /> All Transactions History
            </h3>
          </div>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
            <thead>
              <tr style={{ background: "#f8fafc", borderBottom: "1.5px solid #e2e8f0", textAlign: "left" }}>
                <th style={{ padding: "12px 14px", fontWeight: "800", color: "#475569" }}>Month</th>
                <th style={{ padding: "12px 14px", fontWeight: "800", color: "#475569" }}>Payment Date & Day</th>
                <th style={{ padding: "12px 14px", fontWeight: "800", color: "#475569" }}>Disbursed Time</th>
                <th style={{ padding: "12px 14px", fontWeight: "800", color: "#475569" }}>Amount Disbursed</th>
                <th style={{ padding: "12px 14px", fontWeight: "800", color: "#475569" }}>Payment Mode</th>
                <th style={{ padding: "12px 14px", fontWeight: "800", color: "#475569", textAlign: "right" }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((item, idx) => (
                <tr
                  key={idx}
                  style={{
                    borderBottom: "1px solid #f1f5f9",
                    background: idx % 2 === 0 ? "#ffffff" : "#fcfdfd",
                  }}
                >
                  <td style={{ padding: "12px 14px", fontWeight: "800", color: "#0f172a" }}>
                    <span style={{ display: "inline-block", background: "#e0e7ff", color: "#4338ca", padding: "3px 8px", borderRadius: "6px", fontSize: "11.5px" }}>
                      {item.month}
                    </span>
                  </td>
                  <td style={{ padding: "12px 14px", fontWeight: "700", color: "#1e293b" }}>
                    {item.date} <span style={{ color: "#64748b", fontWeight: "500", fontSize: "12px" }}>({item.day})</span>
                  </td>
                  <td style={{ padding: "12px 14px", fontWeight: "600", color: "#64748b" }}>
                    {item.time}
                  </td>
                  <td style={{ padding: "12px 14px", fontWeight: "900", color: "#059669", fontSize: "14px" }}>
                    {item.amount}
                  </td>
                  <td style={{ padding: "12px 14px", color: "#475569", fontWeight: "600", fontSize: "12px" }}>
                    {item.mode}
                    <div style={{ fontSize: "10.5px", color: "#94a3b8" }}>Ref: {item.ref}</div>
                  </td>
                  <td style={{ padding: "12px 14px", textAlign: "right" }}>
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                        fontSize: "11.5px",
                        fontWeight: "800",
                        padding: "3px 10px",
                        borderRadius: "999px",
                        background: "#dcfce7",
                        color: "#15803d",
                      }}
                    >
                      <FaCheckCircle size={10} /> {item.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>



    </div>
  );
}
