import { useState, useEffect, useMemo, useRef } from "react";
import PageHeader from "../components/PageHeader.jsx";
import { getUserRole, getUserName, getUserEmail } from "../auth.js";
import { showSuccess, showError, showInfo } from "../utils/toast.js";
import {
  getStoredExpenses,
  addExpenseRecord,
  getOrCreateMonthlySalaries,
  markSalaryAsPaid,
  getAllHotelIncome,
  addCustomIncome,
  getMaintenanceExpenses,
  getPermanentAccountingLedger,
  getAuditTrail,
  calculateFinancialSummary,
  getDailyCashFlow,
  updateExpenseRecord,
} from "../services/accountingStore.js";
import {
  FaMoneyBillWave,
  FaFileInvoiceDollar,
  FaPlus,
  FaSearch,
  FaCheckCircle,
  FaClock,
  FaBuilding,
  FaCreditCard,
  FaThLarge,
  FaList,
  FaWrench,
  FaCalendarAlt,
  FaExchangeAlt,
  FaHistory,
  FaPrint,
  FaDownload,
  FaUserTie,
  FaCopy,
  FaCheck,
  FaFilter,
  FaArrowUp,
  FaArrowDown,
  FaUtensils,
  FaBroom,
  FaShieldAlt,
  FaReceipt,
  FaInfoCircle,
} from "react-icons/fa";

import AccountantVisitorView from "../components/AccountantVisitorView.jsx";

export default function Payroll() {
  const userRole = getUserRole();
  const userName = getUserName();
  const userEmail = getUserEmail();

  // If logged in as accountant, render dedicated Visitor Management page
  if (userRole === "accountant") {
    return (
      <div style={{ padding: "0 0 24px 0", maxWidth: "1500px", margin: "0 auto", color: "#1e293b" }}>
        <AccountantVisitorView />
      </div>
    );
  }

  // Active Tab
  const [activeTab, setActiveTab] = useState("dashboard"); // dashboard, salary, income, expenses, maintenance, cashflow, history, reports

  // Global Month Filter (defaults to Current Month: 2026-09)
  const [selectedMonth, setSelectedMonth] = useState("2026-09");
  const [searchQuery, setSearchQuery] = useState("");

  // Store subscription trigger
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Listen to accounting store change events
  useEffect(() => {
    const handleStoreChange = () => setRefreshTrigger((prev) => prev + 1);
    window.addEventListener("accounting_store_updated", handleStoreChange);
    return () => window.removeEventListener("accounting_store_updated", handleStoreChange);
  }, []);

  // ----------------------------------------------------
  // DATA QUERIES
  // ----------------------------------------------------
  const summary = useMemo(() => {
    return calculateFinancialSummary(selectedMonth);
  }, [selectedMonth, refreshTrigger]);

  const monthlySalaries = useMemo(() => {
    return getOrCreateMonthlySalaries(selectedMonth);
  }, [selectedMonth, refreshTrigger]);

  const hotelIncomes = useMemo(() => {
    return getAllHotelIncome(selectedMonth);
  }, [selectedMonth, refreshTrigger]);

  const hotelExpenses = useMemo(() => {
    return getStoredExpenses().filter(
      (e) => !selectedMonth || selectedMonth === "ALL" || e.month === selectedMonth || (e.date || "").startsWith(selectedMonth)
    );
  }, [selectedMonth, refreshTrigger]);

  const maintenanceList = useMemo(() => {
    return getMaintenanceExpenses(selectedMonth);
  }, [selectedMonth, refreshTrigger]);

  const permanentLedger = useMemo(() => {
    return getPermanentAccountingLedger(selectedMonth);
  }, [selectedMonth, refreshTrigger]);

  const cashFlowData = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    return getDailyCashFlow(today);
  }, [refreshTrigger]);

  const auditTrail = useMemo(() => {
    return getAuditTrail();
  }, [refreshTrigger]);

  // ----------------------------------------------------
  // MODAL STATES
  // ----------------------------------------------------
  const [paySalaryModal, setPaySalaryModal] = useState(null); // salary record
  const [paySlipModal, setPaySlipModal] = useState(null); // salary record
  const [addExpenseModal, setAddExpenseModal] = useState(false);
  const [addIncomeModal, setAddIncomeModal] = useState(false);
  const [auditModal, setAuditModal] = useState(false);

  // Form states
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split("T")[0]);
  const [paymentMethod, setPaymentMethod] = useState("Bank Transfer");
  const [transactionRef, setTransactionRef] = useState("");
  const [paymentNotes, setPaymentNotes] = useState("");

  // New Expense form
  const [newExpCategory, setNewExpCategory] = useState("Electricity");
  const [newExpDesc, setNewExpDesc] = useState("");
  const [newExpAmount, setNewExpAmount] = useState("");
  const [newExpDate, setNewExpDate] = useState(new Date().toISOString().split("T")[0]);
  const [newExpMethod, setNewExpMethod] = useState("Bank Transfer");
  const [newExpStatus, setNewExpStatus] = useState("Paid");

  // New Income form
  const [newIncSource, setNewIncSource] = useState("Room Booking Income");
  const [newIncCustomer, setNewIncCustomer] = useState("");
  const [newIncRoom, setNewIncRoom] = useState("");
  const [newIncAmount, setNewIncAmount] = useState("");
  const [newIncDate, setNewIncDate] = useState(new Date().toISOString().split("T")[0]);
  const [newIncMethod, setNewIncMethod] = useState("UPI");
  const [newIncDesc, setNewIncDesc] = useState("");

  // Salary table filters
  const [deptFilter, setDeptFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // History ledger filters & pagination
  const [historyTypeFilter, setHistoryTypeFilter] = useState("ALL");
  const [historySearch, setHistorySearch] = useState("");
  const [historyPage, setHistoryPage] = useState(1);
  const ITEMS_PER_PAGE = 12;

  // Copy state for Accountant username
  const [copiedAccountant, setCopiedAccountant] = useState(false);

  function handleCopyUsername(text) {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedAccountant(true);
      showSuccess("Accountant username copied to clipboard!");
      setTimeout(() => setCopiedAccountant(false), 2000);
    }
  }

  // Handle Mark Salary as Paid submit
  function handleConfirmPaySalary() {
    if (!paySalaryModal) return;
    try {
      const ref = transactionRef.trim() || `TXN-SAL-${Date.now().toString().slice(-6)}`;
      markSalaryAsPaid(paySalaryModal.id, {
        paymentDate,
        paymentMethod,
        transactionRef: ref,
        paidAmount: paySalaryModal.finalSalary,
        notes: paymentNotes,
      });
      showSuccess(`Salary of ₹${paySalaryModal.finalSalary.toLocaleString("en-IN")} marked as Paid for ${paySalaryModal.employeeName}`);
      setPaySalaryModal(null);
      setTransactionRef("");
      setPaymentNotes("");
    } catch (err) {
      showError("Failed to record salary payment.");
    }
  }

  // Handle Add Expense submit
  function handleSaveExpense(e) {
    e.preventDefault();
    if (!newExpAmount || Number(newExpAmount) <= 0) {
      showError("Please enter a valid expense amount.");
      return;
    }
    if (!newExpDesc.trim()) {
      showError("Please enter an expense description.");
      return;
    }

    try {
      addExpenseRecord({
        category: newExpCategory,
        description: newExpDesc.trim(),
        amount: Number(newExpAmount),
        date: newExpDate,
        paymentMethod: newExpMethod,
        status: newExpStatus,
        addedBy: userName || "Staff",
      });
      showSuccess(`Expense of ₹${Number(newExpAmount).toLocaleString("en-IN")} added successfully!`);
      setAddExpenseModal(false);
      setNewExpDesc("");
      setNewExpAmount("");
    } catch (err) {
      showError("Failed to save expense.");
    }
  }

  // Handle Add Income submit
  function handleSaveIncome(e) {
    e.preventDefault();
    if (!newIncAmount || Number(newIncAmount) <= 0) {
      showError("Please enter a valid income amount.");
      return;
    }

    try {
      addCustomIncome({
        source: newIncSource,
        customerName: newIncCustomer.trim() || "Walk-in Guest",
        room: newIncRoom.trim() || "N/A",
        amount: Number(newIncAmount),
        date: newIncDate,
        paymentMethod: newIncMethod,
        description: newIncDesc.trim() || "Hotel Revenue",
        status: "Paid",
      });
      showSuccess(`Income of ₹${Number(newIncAmount).toLocaleString("en-IN")} recorded successfully!`);
      setAddIncomeModal(false);
      setNewIncCustomer("");
      setNewIncRoom("");
      setNewIncAmount("");
      setNewIncDesc("");
    } catch (err) {
      showError("Failed to save income.");
    }
  }

  // Filtered salaries list
  const filteredSalaries = useMemo(() => {
    return monthlySalaries.filter((s) => {
      const matchDept = deptFilter === "ALL" || s.department.toLowerCase() === deptFilter.toLowerCase();
      const matchStatus = statusFilter === "ALL" || s.status.toLowerCase() === statusFilter.toLowerCase();
      const matchSearch =
        !searchQuery ||
        s.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.employeeId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.department.toLowerCase().includes(searchQuery.toLowerCase());
      return matchDept && matchStatus && matchSearch;
    });
  }, [monthlySalaries, deptFilter, statusFilter, searchQuery]);

  // Filtered history ledger
  const filteredHistory = useMemo(() => {
    return permanentLedger.filter((item) => {
      const matchType = historyTypeFilter === "ALL" || item.type.toLowerCase() === historyTypeFilter.toLowerCase();
      const matchSearch =
        !historySearch ||
        item.description.toLowerCase().includes(historySearch.toLowerCase()) ||
        item.person.toLowerCase().includes(historySearch.toLowerCase()) ||
        item.category.toLowerCase().includes(historySearch.toLowerCase()) ||
        item.id.toLowerCase().includes(historySearch.toLowerCase());
      return matchType && matchSearch;
    });
  }, [permanentLedger, historyTypeFilter, historySearch]);

  const totalHistoryPages = Math.ceil(filteredHistory.length / ITEMS_PER_PAGE) || 1;
  const paginatedHistory = useMemo(() => {
    const start = (historyPage - 1) * ITEMS_PER_PAGE;
    return filteredHistory.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredHistory, historyPage]);

  return (
    <div style={{ padding: "24px", maxWidth: "1500px", margin: "0 auto", color: "#1e293b" }}>
      {/* Top Header & Month Filter */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <PageHeader
            title={userRole === "accountant" ? "Visitor" : "Accounting & Finance"}
            subtitle="Accurate Dynamic Ledgers • Real Attendance Payroll • Permanent Financial History"
          />
        </div>

        {/* Global Month Selector & Quick Actions */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", background: "#f8fafc", padding: "8px 14px", borderRadius: "10px", border: "1px solid #cbd5e1" }}>
            <FaCalendarAlt style={{ color: "#64748b", marginRight: "8px" }} />
            <label style={{ fontSize: "12px", fontWeight: "600", color: "#475569", marginRight: "6px" }}>Month:</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              style={{ background: "transparent", border: "none", fontWeight: "700", color: "#0f172a", fontSize: "14px", outline: "none", cursor: "pointer" }}
            >
              <option value="2026-09">Sep 2026 (Current)</option>
              <option value="2026-08">Aug 2026 (Previous)</option>
              <option value="2026-07">Jul 2026</option>
              <option value="2026-06">Jun 2026</option>
              <option value="ALL">All Time History</option>
            </select>
          </div>

          <button
            onClick={() => setAddExpenseModal(true)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "9px 16px",
              background: "#ef4444",
              color: "#ffffff",
              border: "none",
              borderRadius: "8px",
              fontWeight: "600",
              fontSize: "13px",
              cursor: "pointer",
            }}
          >
            <FaPlus size={12} /> Add Expense
          </button>

          <button
            onClick={() => setAddIncomeModal(true)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "9px 16px",
              background: "#16a34a",
              color: "#ffffff",
              border: "none",
              borderRadius: "8px",
              fontWeight: "600",
              fontSize: "13px",
              cursor: "pointer",
            }}
          >
            <FaPlus size={12} /> Add Income
          </button>

          <button
            onClick={() => setAuditModal(true)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "9px 14px",
              background: "#475569",
              color: "#ffffff",
              border: "none",
              borderRadius: "8px",
              fontWeight: "600",
              fontSize: "13px",
              cursor: "pointer",
            }}
            title="View Audit Trail for Corrections"
          >
            <FaHistory size={12} /> Audit Trail ({auditTrail.length})
          </button>
        </div>
      </div>

      {/* Accountant Credentials Banner */}
      <div
        style={{
          background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
          borderRadius: "12px",
          padding: "16px 20px",
          color: "#ffffff",
          marginBottom: "24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "14px",
          boxShadow: "0 4px 12px rgba(15, 23, 42, 0.12)",
          border: "1px solid #334155",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <div style={{ width: "44px", height: "44px", borderRadius: "10px", background: "rgba(217, 158, 38, 0.2)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fbbf24", flexShrink: 0 }}>
            <FaShieldAlt size={22} />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
              <span style={{ fontSize: "14px", fontWeight: "700", color: "#f8fafc" }}>Accountant Login:</span>
              
              {/* Username */}
              <div style={{ display: "flex", alignItems: "center", gap: "6px", background: "#334155", padding: "4px 8px", borderRadius: "6px" }}>
                <span style={{ fontSize: "11px", color: "#94a3b8" }}>User:</span>
                <code style={{ color: "#38bdf8", fontSize: "13px", fontWeight: "700" }}>accountant@hotel.com</code>
                <button
                  onClick={() => handleCopyUsername("accountant@hotel.com")}
                  style={{
                    background: copiedAccountant ? "#16a34a" : "rgba(255, 255, 255, 0.15)",
                    border: "none",
                    borderRadius: "4px",
                    color: "#ffffff",
                    padding: "3px 6px",
                    fontSize: "11px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "3px",
                  }}
                  title="Copy Username"
                >
                  {copiedAccountant ? <FaCheck size={10} /> : <FaCopy size={10} />}
                </button>
              </div>

              {/* Password */}
              <div style={{ display: "flex", alignItems: "center", gap: "6px", background: "#334155", padding: "4px 8px", borderRadius: "6px" }}>
                <span style={{ fontSize: "11px", color: "#94a3b8" }}>Pass:</span>
                <code style={{ color: "#4ade80", fontSize: "13px", fontWeight: "700" }}>account123</code>
                <button
                  onClick={() => handleCopyUsername("account123")}
                  style={{
                    background: "rgba(255, 255, 255, 0.15)",
                    border: "none",
                    borderRadius: "4px",
                    color: "#ffffff",
                    padding: "3px 6px",
                    fontSize: "11px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "3px",
                  }}
                  title="Copy Password"
                >
                  <FaCopy size={10} />
                </button>
              </div>
            </div>

            <p style={{ margin: "6px 0 0 0", fontSize: "12px", color: "#94a3b8" }}>
              Role: <strong style={{ color: "#e2e8f0" }}>Accountant (Finance & Payroll)</strong> • Multi-branch accounts: <code style={{ color: "#cbd5e1" }}>sanjay.r@ashirwad.com</code> / <code style={{ color: "#cbd5e1" }}>ashirwad123</code>
            </p>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "12px", color: "#38bdf8", background: "rgba(56, 189, 248, 0.1)", padding: "6px 12px", borderRadius: "6px", border: "1px solid rgba(56, 189, 248, 0.2)", fontWeight: "600" }}>
            ✓ Ready to Login
          </span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div style={{ display: "flex", gap: "8px", borderBottom: "2px solid #e2e8f0", marginBottom: "24px", overflowX: "auto", paddingBottom: "4px" }}>
        {[
          { key: "dashboard", label: "Dashboard", icon: FaThLarge },
          { key: "salary", label: "Salary Management", icon: FaMoneyBillWave },
          { key: "income", label: "Hotel Income", icon: FaArrowUp },
          { key: "expenses", label: "Expenses", icon: FaArrowDown },
          { key: "maintenance", label: "Maintenance & Repairs", icon: FaWrench },
          { key: "cashflow", label: "Daily Cash Flow", icon: FaExchangeAlt },
          { key: "history", label: "Accounting History", icon: FaHistory },
          { key: "reports", label: "Monthly Reports", icon: FaFileInvoiceDollar },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 18px",
                background: isActive ? "#ffffff" : "transparent",
                color: isActive ? "#2563eb" : "#64748b",
                border: "none",
                borderBottom: isActive ? "3px solid #2563eb" : "3px solid transparent",
                fontWeight: isActive ? "700" : "600",
                fontSize: "14px",
                cursor: "pointer",
                whiteSpace: "nowrap",
                borderRadius: "6px 6px 0 0",
                transition: "all 0.15s ease",
              }}
            >
              <Icon size={14} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* 1. SIMPLE ACCOUNTING DASHBOARD */}
      {/* ========================================================================= */}
      {activeTab === "dashboard" && (
        <div>
          {/* 7 Clean Summary Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "24px" }}>
            {/* Card 1: Total Income */}
            <div style={{ background: "#ffffff", padding: "18px 20px", borderRadius: "12px", border: "1px solid #e2e8f0", boxShadow: "0 2px 6px rgba(0,0,0,0.03)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", color: "#16a34a", marginBottom: "8px" }}>
                <span style={{ fontSize: "13px", fontWeight: "600", color: "#64748b" }}>Total Income</span>
                <span style={{ background: "#dcfce7", padding: "6px", borderRadius: "8px" }}><FaArrowUp size={14} /></span>
              </div>
              <div style={{ fontSize: "22px", fontWeight: "800", color: "#0f172a" }}>₹{summary.totalIncome.toLocaleString("en-IN")}</div>
              <div style={{ fontSize: "11px", color: "#64748b", marginTop: "4px" }}>Room bookings + services</div>
            </div>

            {/* Card 2: Total Expenses */}
            <div style={{ background: "#ffffff", padding: "18px 20px", borderRadius: "12px", border: "1px solid #e2e8f0", boxShadow: "0 2px 6px rgba(0,0,0,0.03)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", color: "#ef4444", marginBottom: "8px" }}>
                <span style={{ fontSize: "13px", fontWeight: "600", color: "#64748b" }}>Total Expenses</span>
                <span style={{ background: "#fee2e2", padding: "6px", borderRadius: "8px" }}><FaArrowDown size={14} /></span>
              </div>
              <div style={{ fontSize: "22px", fontWeight: "800", color: "#0f172a" }}>₹{summary.totalExpenses.toLocaleString("en-IN")}</div>
              <div style={{ fontSize: "11px", color: "#64748b", marginTop: "4px" }}>Operating + Salary + Mnt.</div>
            </div>

            {/* Card 3: Total Salary */}
            <div style={{ background: "#ffffff", padding: "18px 20px", borderRadius: "12px", border: "1px solid #e2e8f0", boxShadow: "0 2px 6px rgba(0,0,0,0.03)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", color: "#3b82f6", marginBottom: "8px" }}>
                <span style={{ fontSize: "13px", fontWeight: "600", color: "#64748b" }}>Total Salary (Paid)</span>
                <span style={{ background: "#dbeafe", padding: "6px", borderRadius: "8px" }}><FaMoneyBillWave size={14} /></span>
              </div>
              <div style={{ fontSize: "22px", fontWeight: "800", color: "#0f172a" }}>₹{summary.totalSalaryExpense.toLocaleString("en-IN")}</div>
              <div style={{ fontSize: "11px", color: "#64748b", marginTop: "4px" }}>Disbursed staff payroll</div>
            </div>

            {/* Card 4: Pending Salary */}
            <div style={{ background: "#ffffff", padding: "18px 20px", borderRadius: "12px", border: "1px solid #e2e8f0", boxShadow: "0 2px 6px rgba(0,0,0,0.03)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", color: "#d97706", marginBottom: "8px" }}>
                <span style={{ fontSize: "13px", fontWeight: "600", color: "#64748b" }}>Pending Salary</span>
                <span style={{ background: "#fef3c7", padding: "6px", borderRadius: "8px" }}><FaClock size={14} /></span>
              </div>
              <div style={{ fontSize: "22px", fontWeight: "800", color: "#d97706" }}>₹{summary.pendingSalaryExpense.toLocaleString("en-IN")}</div>
              <div style={{ fontSize: "11px", color: "#64748b", marginTop: "4px" }}>Due for {selectedMonth}</div>
            </div>

            {/* Card 5: Maintenance Expense */}
            <div style={{ background: "#ffffff", padding: "18px 20px", borderRadius: "12px", border: "1px solid #e2e8f0", boxShadow: "0 2px 6px rgba(0,0,0,0.03)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", color: "#8b5cf6", marginBottom: "8px" }}>
                <span style={{ fontSize: "13px", fontWeight: "600", color: "#64748b" }}>Maintenance</span>
                <span style={{ background: "#ede9fe", padding: "6px", borderRadius: "8px" }}><FaWrench size={14} /></span>
              </div>
              <div style={{ fontSize: "22px", fontWeight: "800", color: "#0f172a" }}>₹{summary.totalMaintenanceExpense.toLocaleString("en-IN")}</div>
              <div style={{ fontSize: "11px", color: "#64748b", marginTop: "4px" }}>Repairs & room upkeep</div>
            </div>

            {/* Card 6: Pending Customer Payment */}
            <div style={{ background: "#ffffff", padding: "18px 20px", borderRadius: "12px", border: "1px solid #e2e8f0", boxShadow: "0 2px 6px rgba(0,0,0,0.03)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", color: "#ec4899", marginBottom: "8px" }}>
                <span style={{ fontSize: "13px", fontWeight: "600", color: "#64748b" }}>Pending Customer</span>
                <span style={{ background: "#fce7f3", padding: "6px", borderRadius: "8px" }}><FaReceipt size={14} /></span>
              </div>
              <div style={{ fontSize: "22px", fontWeight: "800", color: "#db2777" }}>₹{summary.pendingCustomerPayments.toLocaleString("en-IN")}</div>
              <div style={{ fontSize: "11px", color: "#64748b", marginTop: "4px" }}>Uncollected checkout bills</div>
            </div>

            {/* Card 7: Net Balance */}
            <div style={{ background: summary.netBalance >= 0 ? "#f0fdf4" : "#fef2f2", padding: "18px 20px", borderRadius: "12px", border: summary.netBalance >= 0 ? "1px solid #bbf7d0" : "1px solid #fecaca", boxShadow: "0 2px 6px rgba(0,0,0,0.03)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", color: summary.netBalance >= 0 ? "#16a34a" : "#dc2626", marginBottom: "8px" }}>
                <span style={{ fontSize: "13px", fontWeight: "700" }}>Net Balance</span>
                <span style={{ fontWeight: "800", fontSize: "12px" }}>{summary.netBalance >= 0 ? "SURPLUS" : "DEFICIT"}</span>
              </div>
              <div style={{ fontSize: "22px", fontWeight: "900", color: summary.netBalance >= 0 ? "#15803d" : "#b91c1c" }}>
                ₹{summary.netBalance.toLocaleString("en-IN")}
              </div>
              <div style={{ fontSize: "11px", color: "#64748b", marginTop: "4px" }}>Income minus all expenses</div>
            </div>
          </div>

          {/* Simple Clean Income vs Expense Bar */}
          <div style={{ background: "#ffffff", padding: "20px 24px", borderRadius: "12px", border: "1px solid #e2e8f0", marginBottom: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
              <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "700", color: "#0f172a" }}>
                Monthly Financial Comparison ({selectedMonth})
              </h3>
              <span style={{ fontSize: "13px", fontWeight: "600", color: "#64748b" }}>
                Net Profit Margin: <strong style={{ color: summary.netBalance >= 0 ? "#16a34a" : "#dc2626" }}>{summary.totalIncome > 0 ? Math.round((summary.netBalance / summary.totalIncome) * 100) : 0}%</strong>
              </span>
            </div>

            {/* Visual ratio bar */}
            <div style={{ height: "24px", width: "100%", background: "#e2e8f0", borderRadius: "12px", overflow: "hidden", display: "flex" }}>
              <div
                style={{
                  width: `${summary.totalIncome + summary.totalExpenses > 0 ? Math.min(100, Math.max(10, Math.round((summary.totalIncome / (summary.totalIncome + summary.totalExpenses)) * 100))) : 50}%`,
                  background: "#16a34a",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#ffffff",
                  fontSize: "11px",
                  fontWeight: "700",
                }}
              >
                Income: ₹{summary.totalIncome.toLocaleString("en-IN")}
              </div>
              <div
                style={{
                  width: `${summary.totalIncome + summary.totalExpenses > 0 ? Math.min(100, Math.max(10, Math.round((summary.totalExpenses / (summary.totalIncome + summary.totalExpenses)) * 100))) : 50}%`,
                  background: "#ef4444",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#ffffff",
                  fontSize: "11px",
                  fontWeight: "700",
                }}
              >
                Expenses: ₹{summary.totalExpenses.toLocaleString("en-IN")}
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "10px", fontSize: "12px", color: "#64748b" }}>
              <span>🟢 Income: ₹{summary.totalIncome.toLocaleString("en-IN")}</span>
              <span>🔴 Operating: ₹{summary.totalOperatingExpenses.toLocaleString("en-IN")}</span>
              <span>🔵 Salaries: ₹{summary.totalSalaryExpense.toLocaleString("en-IN")}</span>
              <span>🟣 Maintenance: ₹{summary.totalMaintenanceExpense.toLocaleString("en-IN")}</span>
            </div>
          </div>

          {/* 4 Simple Recent Activity Feeds */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "20px" }}>
            {/* Feed 1: Recent Transactions */}
            <div style={{ background: "#ffffff", padding: "18px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <h4 style={{ margin: 0, fontSize: "14px", fontWeight: "700", color: "#0f172a" }}>Recent Incomes</h4>
                <button onClick={() => setActiveTab("income")} style={{ background: "none", border: "none", color: "#2563eb", fontSize: "12px", fontWeight: "600", cursor: "pointer" }}>View All →</button>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {hotelIncomes.slice(0, 4).map((inc) => (
                  <div key={inc.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 10px", background: "#f8fafc", borderRadius: "8px" }}>
                    <div>
                      <div style={{ fontSize: "13px", fontWeight: "600", color: "#1e293b" }}>{inc.customerName}</div>
                      <div style={{ fontSize: "11px", color: "#64748b" }}>{inc.room} • {inc.date}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: "13px", fontWeight: "700", color: "#16a34a" }}>+₹{inc.amount.toLocaleString("en-IN")}</div>
                      <span style={{ fontSize: "10px", padding: "2px 6px", borderRadius: "4px", background: inc.status === "Paid" ? "#dcfce7" : "#fef3c7", color: inc.status === "Paid" ? "#15803d" : "#b45309" }}>{inc.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Feed 2: Recent Expenses */}
            <div style={{ background: "#ffffff", padding: "18px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <h4 style={{ margin: 0, fontSize: "14px", fontWeight: "700", color: "#0f172a" }}>Recent Expenses</h4>
                <button onClick={() => setActiveTab("expenses")} style={{ background: "none", border: "none", color: "#2563eb", fontSize: "12px", fontWeight: "600", cursor: "pointer" }}>View All →</button>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {hotelExpenses.slice(0, 4).map((exp) => (
                  <div key={exp.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 10px", background: "#f8fafc", borderRadius: "8px" }}>
                    <div>
                      <div style={{ fontSize: "13px", fontWeight: "600", color: "#1e293b" }}>{exp.category}</div>
                      <div style={{ fontSize: "11px", color: "#64748b" }}>{exp.description}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: "13px", fontWeight: "700", color: "#ef4444" }}>-₹{exp.amount.toLocaleString("en-IN")}</div>
                      <span style={{ fontSize: "10px", color: "#64748b" }}>{exp.date}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Feed 3: Recent Salary Payments */}
            <div style={{ background: "#ffffff", padding: "18px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <h4 style={{ margin: 0, fontSize: "14px", fontWeight: "700", color: "#0f172a" }}>Salaries Status</h4>
                <button onClick={() => setActiveTab("salary")} style={{ background: "none", border: "none", color: "#2563eb", fontSize: "12px", fontWeight: "600", cursor: "pointer" }}>View All →</button>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {monthlySalaries.slice(0, 4).map((sal) => (
                  <div key={sal.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 10px", background: "#f8fafc", borderRadius: "8px" }}>
                    <div>
                      <div style={{ fontSize: "13px", fontWeight: "600", color: "#1e293b" }}>{sal.employeeName}</div>
                      <div style={{ fontSize: "11px", color: "#64748b" }}>{sal.department} • Base: ₹{sal.monthlySalary.toLocaleString("en-IN")}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: "13px", fontWeight: "700", color: "#0f172a" }}>₹{sal.finalSalary.toLocaleString("en-IN")}</div>
                      <span style={{ fontSize: "10px", padding: "2px 6px", borderRadius: "4px", background: sal.status === "Paid" ? "#dcfce7" : "#fef3c7", color: sal.status === "Paid" ? "#15803d" : "#b45309" }}>{sal.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Feed 4: Recent Maintenance */}
            <div style={{ background: "#ffffff", padding: "18px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <h4 style={{ margin: 0, fontSize: "14px", fontWeight: "700", color: "#0f172a" }}>Recent Maintenance</h4>
                <button onClick={() => setActiveTab("maintenance")} style={{ background: "none", border: "none", color: "#2563eb", fontSize: "12px", fontWeight: "600", cursor: "pointer" }}>View All →</button>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {maintenanceList.slice(0, 4).map((mnt) => (
                  <div key={mnt.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 10px", background: "#f8fafc", borderRadius: "8px" }}>
                    <div>
                      <div style={{ fontSize: "13px", fontWeight: "600", color: "#1e293b" }}>{mnt.type}</div>
                      <div style={{ fontSize: "11px", color: "#64748b" }}>{mnt.area}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: "13px", fontWeight: "700", color: "#8b5cf6" }}>₹{mnt.amount.toLocaleString("en-IN")}</div>
                      <span style={{ fontSize: "10px", padding: "2px 6px", borderRadius: "4px", background: mnt.paidStatus === "Paid" ? "#dcfce7" : "#fef3c7", color: mnt.paidStatus === "Paid" ? "#15803d" : "#b45309" }}>{mnt.paidStatus}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. EMPLOYEE SALARY MANAGEMENT & PERMANENT HISTORY */}
      {/* ========================================================================= */}
      {activeTab === "salary" && (
        <div style={{ background: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0", padding: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "12px" }}>
            <div>
              <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "700", color: "#0f172a" }}>
                Staff Salary Management ({selectedMonth})
              </h3>
              <p style={{ margin: "4px 0 0 0", fontSize: "12px", color: "#64748b" }}>
                Dynamic automatic calculation based on 30 days base, unpaid leave deduction, & ₹0 deduction for paid leaves.
              </p>
            </div>

            {/* Filters */}
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "center", background: "#f1f5f9", padding: "6px 12px", borderRadius: "8px" }}>
                <FaSearch style={{ color: "#64748b", marginRight: "8px" }} />
                <input
                  type="text"
                  placeholder="Search staff..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ border: "none", background: "transparent", outline: "none", fontSize: "13px" }}
                />
              </div>

              <select
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value)}
                style={{ padding: "6px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px", background: "#f8fafc" }}
              >
                <option value="ALL">All Departments</option>
                <option value="Housekeeping">Housekeeping</option>
                <option value="Kitchen">Kitchen</option>
                <option value="Accounting">Accounting</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{ padding: "6px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px", background: "#f8fafc" }}
              >
                <option value="ALL">All Status</option>
                <option value="Paid">Paid</option>
                <option value="Pending">Pending</option>
              </select>
            </div>
          </div>

          {/* Salary Table */}
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0", color: "#475569" }}>
                  <th style={{ padding: "12px 14px", fontWeight: "700" }}>Employee</th>
                  <th style={{ padding: "12px 14px", fontWeight: "700" }}>Department & Role</th>
                  <th style={{ padding: "12px 14px", fontWeight: "700" }}>Monthly Salary</th>
                  <th style={{ padding: "12px 14px", fontWeight: "700" }}>Days (Present/Unpaid)</th>
                  <th style={{ padding: "12px 14px", fontWeight: "700" }}>Per Day</th>
                  <th style={{ padding: "12px 14px", fontWeight: "700" }}>Deduction</th>
                  <th style={{ padding: "12px 14px", fontWeight: "700" }}>Final Payable</th>
                  <th style={{ padding: "12px 14px", fontWeight: "700" }}>Status</th>
                  <th style={{ padding: "12px 14px", fontWeight: "700", textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredSalaries.length === 0 ? (
                  <tr>
                    <td colSpan="9" style={{ padding: "24px", textAlign: "center", color: "#94a3b8" }}>
                      No salary records found for the selected criteria.
                    </td>
                  </tr>
                ) : (
                  filteredSalaries.map((sal) => {
                    const isPaid = sal.status === "Paid";
                    return (
                      <tr key={sal.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                        <td style={{ padding: "12px 14px" }}>
                          <div style={{ fontWeight: "700", color: "#0f172a" }}>{sal.employeeName}</div>
                          <div style={{ fontSize: "11px", color: "#64748b" }}>ID: {sal.employeeId}</div>
                        </td>
                        <td style={{ padding: "12px 14px" }}>
                          <span style={{ fontWeight: "600", color: "#334155" }}>{sal.department}</span>
                          <div style={{ fontSize: "11px", color: "#64748b" }}>{sal.role}</div>
                        </td>
                        <td style={{ padding: "12px 14px", fontWeight: "700", color: "#0f172a" }}>
                          ₹{sal.monthlySalary.toLocaleString("en-IN")}
                        </td>
                        <td style={{ padding: "12px 14px" }}>
                          <div><strong style={{ color: "#16a34a" }}>{sal.presentDays}d</strong> Present / {sal.workingDays}d</div>
                          <div style={{ fontSize: "11px", color: sal.unpaidLeaveDays > 0 ? "#ef4444" : "#64748b" }}>
                            {sal.paidLeaveDays}d Paid Leave • {sal.unpaidLeaveDays}d Unpaid
                          </div>
                        </td>
                        <td style={{ padding: "12px 14px", color: "#64748b" }}>
                          ₹{sal.perDaySalary.toLocaleString("en-IN")}
                        </td>
                        <td style={{ padding: "12px 14px", color: sal.salaryDeduction > 0 ? "#ef4444" : "#64748b", fontWeight: "600" }}>
                          {sal.salaryDeduction > 0 ? `-₹${sal.salaryDeduction.toLocaleString("en-IN")}` : "₹0"}
                        </td>
                        <td style={{ padding: "12px 14px", fontWeight: "800", color: "#1e293b", fontSize: "14px" }}>
                          ₹{sal.finalSalary.toLocaleString("en-IN")}
                        </td>
                        <td style={{ padding: "12px 14px" }}>
                          <span
                            style={{
                              padding: "4px 8px",
                              borderRadius: "6px",
                              fontSize: "11px",
                              fontWeight: "700",
                              background: isPaid ? "#dcfce7" : "#fef3c7",
                              color: isPaid ? "#15803d" : "#b45309",
                              display: "inline-block",
                            }}
                          >
                            {isPaid ? `Paid (${sal.paymentDate || 'Recorded'})` : "Pending"}
                          </span>
                        </td>
                        <td style={{ padding: "12px 14px", textAlign: "right" }}>
                          <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end" }}>
                            <button
                              onClick={() => setPaySlipModal(sal)}
                              style={{
                                padding: "5px 10px",
                                background: "#f1f5f9",
                                color: "#334155",
                                border: "1px solid #cbd5e1",
                                borderRadius: "6px",
                                fontSize: "12px",
                                fontWeight: "600",
                                cursor: "pointer",
                              }}
                            >
                              Pay Slip
                            </button>
                            {!isPaid && (
                              <button
                                onClick={() => {
                                  setPaySalaryModal(sal);
                                  setTransactionRef(`TXN-SAL-${Date.now().toString().slice(-6)}`);
                                }}
                                style={{
                                  padding: "5px 10px",
                                  background: "#16a34a",
                                  color: "#ffffff",
                                  border: "none",
                                  borderRadius: "6px",
                                  fontSize: "12px",
                                  fontWeight: "700",
                                  cursor: "pointer",
                                }}
                              >
                                Mark as Paid
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. HOTEL INCOME */}
      {/* ========================================================================= */}
      {activeTab === "income" && (
        <div style={{ background: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0", padding: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "12px" }}>
            <div>
              <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "700", color: "#0f172a" }}>Hotel Income Records</h3>
              <p style={{ margin: "4px 0 0 0", fontSize: "12px", color: "#64748b" }}>
                Total Income for {selectedMonth}: <strong style={{ color: "#16a34a" }}>₹{summary.totalIncome.toLocaleString("en-IN")}</strong>
              </p>
            </div>
            <button
              onClick={() => setAddIncomeModal(true)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 14px",
                background: "#16a34a",
                color: "#ffffff",
                border: "none",
                borderRadius: "8px",
                fontWeight: "600",
                fontSize: "13px",
                cursor: "pointer",
              }}
            >
              <FaPlus size={12} /> Add Income
            </button>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0", color: "#475569" }}>
                  <th style={{ padding: "12px 14px", fontWeight: "700" }}>Transaction ID</th>
                  <th style={{ padding: "12px 14px", fontWeight: "700" }}>Customer</th>
                  <th style={{ padding: "12px 14px", fontWeight: "700" }}>Room / Source</th>
                  <th style={{ padding: "12px 14px", fontWeight: "700" }}>Description</th>
                  <th style={{ padding: "12px 14px", fontWeight: "700" }}>Date</th>
                  <th style={{ padding: "12px 14px", fontWeight: "700" }}>Method</th>
                  <th style={{ padding: "12px 14px", fontWeight: "700" }}>Amount</th>
                  <th style={{ padding: "12px 14px", fontWeight: "700" }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {hotelIncomes.map((inc) => (
                  <tr key={inc.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "12px 14px", fontWeight: "600", color: "#2563eb" }}>{inc.id}</td>
                    <td style={{ padding: "12px 14px", fontWeight: "700", color: "#0f172a" }}>{inc.customerName}</td>
                    <td style={{ padding: "12px 14px", color: "#334155" }}>{inc.room}</td>
                    <td style={{ padding: "12px 14px", color: "#64748b" }}>{inc.description}</td>
                    <td style={{ padding: "12px 14px", color: "#64748b" }}>{inc.date}</td>
                    <td style={{ padding: "12px 14px", color: "#334155", fontWeight: "600" }}>{inc.paymentMethod}</td>
                    <td style={{ padding: "12px 14px", fontWeight: "800", color: "#16a34a", fontSize: "14px" }}>
                      +₹{inc.amount.toLocaleString("en-IN")}
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      <span style={{ padding: "3px 8px", borderRadius: "5px", fontSize: "11px", fontWeight: "700", background: inc.status === "Paid" ? "#dcfce7" : "#fef3c7", color: inc.status === "Paid" ? "#15803d" : "#b45309" }}>
                        {inc.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. EXPENSES MANAGEMENT */}
      {/* ========================================================================= */}
      {activeTab === "expenses" && (
        <div style={{ background: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0", padding: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "12px" }}>
            <div>
              <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "700", color: "#0f172a" }}>Hotel Operating Expenses</h3>
              <p style={{ margin: "4px 0 0 0", fontSize: "12px", color: "#64748b" }}>
                Total Operating Expenses for {selectedMonth}: <strong style={{ color: "#ef4444" }}>₹{summary.totalOperatingExpenses.toLocaleString("en-IN")}</strong>
              </p>
            </div>
            <button
              onClick={() => setAddExpenseModal(true)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 14px",
                background: "#ef4444",
                color: "#ffffff",
                border: "none",
                borderRadius: "8px",
                fontWeight: "600",
                fontSize: "13px",
                cursor: "pointer",
              }}
            >
              <FaPlus size={12} /> Add Expense
            </button>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0", color: "#475569" }}>
                  <th style={{ padding: "12px 14px", fontWeight: "700" }}>Expense ID</th>
                  <th style={{ padding: "12px 14px", fontWeight: "700" }}>Category</th>
                  <th style={{ padding: "12px 14px", fontWeight: "700" }}>Description</th>
                  <th style={{ padding: "12px 14px", fontWeight: "700" }}>Date</th>
                  <th style={{ padding: "12px 14px", fontWeight: "700" }}>Method</th>
                  <th style={{ padding: "12px 14px", fontWeight: "700" }}>Amount</th>
                  <th style={{ padding: "12px 14px", fontWeight: "700" }}>Status</th>
                  <th style={{ padding: "12px 14px", fontWeight: "700" }}>Added By</th>
                </tr>
              </thead>
              <tbody>
                {hotelExpenses.map((exp) => (
                  <tr key={exp.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "12px 14px", fontWeight: "600", color: "#64748b" }}>{exp.id}</td>
                    <td style={{ padding: "12px 14px", fontWeight: "700", color: "#0f172a" }}>{exp.category}</td>
                    <td style={{ padding: "12px 14px", color: "#334155" }}>{exp.description}</td>
                    <td style={{ padding: "12px 14px", color: "#64748b" }}>{exp.date}</td>
                    <td style={{ padding: "12px 14px", color: "#475569", fontWeight: "600" }}>{exp.paymentMethod}</td>
                    <td style={{ padding: "12px 14px", fontWeight: "800", color: "#ef4444", fontSize: "14px" }}>
                      -₹{exp.amount.toLocaleString("en-IN")}
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      <span style={{ padding: "3px 8px", borderRadius: "5px", fontSize: "11px", fontWeight: "700", background: exp.status === "Paid" ? "#dcfce7" : "#fef3c7", color: exp.status === "Paid" ? "#15803d" : "#b45309" }}>
                        {exp.status}
                      </span>
                    </td>
                    <td style={{ padding: "12px 14px", color: "#64748b" }}>{exp.addedBy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. MAINTENANCE & REPAIRS */}
      {/* ========================================================================= */}
      {activeTab === "maintenance" && (
        <div style={{ background: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0", padding: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "12px" }}>
            <div>
              <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "700", color: "#0f172a" }}>Maintenance & Repairs Ledger</h3>
              <p style={{ margin: "4px 0 0 0", fontSize: "12px", color: "#64748b" }}>
                Total Maintenance for {selectedMonth}: <strong style={{ color: "#8b5cf6" }}>₹{summary.totalMaintenanceExpense.toLocaleString("en-IN")}</strong>
              </p>
            </div>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0", color: "#475569" }}>
                  <th style={{ padding: "12px 14px", fontWeight: "700" }}>ID</th>
                  <th style={{ padding: "12px 14px", fontWeight: "700" }}>Area / Room</th>
                  <th style={{ padding: "12px 14px", fontWeight: "700" }}>Maintenance Type</th>
                  <th style={{ padding: "12px 14px", fontWeight: "700" }}>Description</th>
                  <th style={{ padding: "12px 14px", fontWeight: "700" }}>Date</th>
                  <th style={{ padding: "12px 14px", fontWeight: "700" }}>Priority</th>
                  <th style={{ padding: "12px 14px", fontWeight: "700" }}>Amount</th>
                  <th style={{ padding: "12px 14px", fontWeight: "700" }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {maintenanceList.map((mnt) => (
                  <tr key={mnt.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "12px 14px", fontWeight: "600", color: "#64748b" }}>{mnt.id}</td>
                    <td style={{ padding: "12px 14px", fontWeight: "700", color: "#0f172a" }}>{mnt.area}</td>
                    <td style={{ padding: "12px 14px", color: "#8b5cf6", fontWeight: "600" }}>{mnt.type}</td>
                    <td style={{ padding: "12px 14px", color: "#334155" }}>{mnt.description}</td>
                    <td style={{ padding: "12px 14px", color: "#64748b" }}>{mnt.date}</td>
                    <td style={{ padding: "12px 14px" }}>
                      <span style={{ fontSize: "11px", fontWeight: "700", color: mnt.priority === "High" ? "#dc2626" : "#475569" }}>{mnt.priority}</span>
                    </td>
                    <td style={{ padding: "12px 14px", fontWeight: "800", color: "#8b5cf6", fontSize: "14px" }}>
                      ₹{mnt.amount.toLocaleString("en-IN")}
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      <span style={{ padding: "3px 8px", borderRadius: "5px", fontSize: "11px", fontWeight: "700", background: mnt.paidStatus === "Paid" ? "#dcfce7" : "#fef3c7", color: mnt.paidStatus === "Paid" ? "#15803d" : "#b45309" }}>
                        {mnt.paidStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. DAILY CASH FLOW REGISTER */}
      {/* ========================================================================= */}
      {activeTab === "cashflow" && (
        <div>
          {/* Simple Cash Flow Formula Box */}
          <div style={{ background: "#ffffff", padding: "20px 24px", borderRadius: "12px", border: "1px solid #e2e8f0", marginBottom: "20px" }}>
            <h3 style={{ margin: "0 0 16px 0", fontSize: "17px", fontWeight: "700", color: "#0f172a" }}>
              Daily Cash Register ({cashFlowData.date})
            </h3>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "16px", textAlign: "center" }}>
              <div style={{ background: "#f8fafc", padding: "14px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                <div style={{ fontSize: "12px", color: "#64748b", fontWeight: "600" }}>Opening Balance</div>
                <div style={{ fontSize: "20px", fontWeight: "800", color: "#0f172a", marginTop: "4px" }}>₹{cashFlowData.openingBalance.toLocaleString("en-IN")}</div>
              </div>

              <div style={{ background: "#f0fdf4", padding: "14px", borderRadius: "10px", border: "1px solid #bbf7d0" }}>
                <div style={{ fontSize: "12px", color: "#16a34a", fontWeight: "600" }}>+ Today's Income</div>
                <div style={{ fontSize: "20px", fontWeight: "800", color: "#15803d", marginTop: "4px" }}>+₹{cashFlowData.todayIncome.toLocaleString("en-IN")}</div>
              </div>

              <div style={{ background: "#fef2f2", padding: "14px", borderRadius: "10px", border: "1px solid #fecaca" }}>
                <div style={{ fontSize: "12px", color: "#ef4444", fontWeight: "600" }}>- Today's Outflows</div>
                <div style={{ fontSize: "20px", fontWeight: "800", color: "#b91c1c", marginTop: "4px" }}>-₹{cashFlowData.totalTodayOutflow.toLocaleString("en-IN")}</div>
              </div>

              <div style={{ background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)", padding: "14px", borderRadius: "10px", color: "#ffffff" }}>
                <div style={{ fontSize: "12px", color: "#94a3b8", fontWeight: "600" }}>= Closing Balance</div>
                <div style={{ fontSize: "20px", fontWeight: "800", color: "#38bdf8", marginTop: "4px" }}>₹{cashFlowData.closingBalance.toLocaleString("en-IN")}</div>
              </div>
            </div>
          </div>

          {/* Payment Method Breakdown */}
          <div style={{ background: "#ffffff", padding: "20px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
            <h4 style={{ margin: "0 0 14px 0", fontSize: "15px", fontWeight: "700", color: "#0f172a" }}>Payment Method Flow (Today)</h4>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px" }}>
              {Object.entries(cashFlowData.methodBreakdown).map(([method, val]) => (
                <div key={method} style={{ background: "#f8fafc", padding: "12px 14px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                  <div style={{ fontWeight: "700", color: "#334155", fontSize: "13px", marginBottom: "6px" }}>{method}</div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                    <span style={{ color: "#16a34a" }}>In: ₹{val.income.toLocaleString("en-IN")}</span>
                    <span style={{ color: "#ef4444" }}>Out: ₹{val.expense.toLocaleString("en-IN")}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. PERMANENT ACCOUNTING HISTORY (THE CORE REPOSITORY) */}
      {/* ========================================================================= */}
      {activeTab === "history" && (
        <div style={{ background: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0", padding: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "12px" }}>
            <div>
              <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "700", color: "#0f172a" }}>Permanent Accounting History</h3>
              <p style={{ margin: "4px 0 0 0", fontSize: "12px", color: "#64748b" }}>
                Un-deletable comprehensive audit ledger of every financial activity across the hotel.
              </p>
            </div>

            {/* History Filters */}
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "center", background: "#f1f5f9", padding: "6px 12px", borderRadius: "8px" }}>
                <FaSearch style={{ color: "#64748b", marginRight: "8px" }} />
                <input
                  type="text"
                  placeholder="Search ledger..."
                  value={historySearch}
                  onChange={(e) => {
                    setHistorySearch(e.target.value);
                    setHistoryPage(1);
                  }}
                  style={{ border: "none", background: "transparent", outline: "none", fontSize: "13px" }}
                />
              </div>

              <select
                value={historyTypeFilter}
                onChange={(e) => {
                  setHistoryTypeFilter(e.target.value);
                  setHistoryPage(1);
                }}
                style={{ padding: "6px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px", background: "#f8fafc" }}
              >
                <option value="ALL">All Types</option>
                <option value="Income">Income</option>
                <option value="Expense">Expense</option>
                <option value="Salary">Salary</option>
                <option value="Maintenance">Maintenance</option>
              </select>
            </div>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0", color: "#475569" }}>
                  <th style={{ padding: "12px 14px", fontWeight: "700" }}>Date</th>
                  <th style={{ padding: "12px 14px", fontWeight: "700" }}>Type</th>
                  <th style={{ padding: "12px 14px", fontWeight: "700" }}>Description / Reference</th>
                  <th style={{ padding: "12px 14px", fontWeight: "700" }}>Person / Customer</th>
                  <th style={{ padding: "12px 14px", fontWeight: "700" }}>Method</th>
                  <th style={{ padding: "12px 14px", fontWeight: "700", textAlign: "right" }}>Amount</th>
                  <th style={{ padding: "12px 14px", fontWeight: "700", textAlign: "center" }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {paginatedHistory.map((item) => (
                  <tr key={item.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "12px 14px", color: "#64748b", whiteSpace: "nowrap" }}>{item.date}</td>
                    <td style={{ padding: "12px 14px" }}>
                      <span
                        style={{
                          padding: "3px 8px",
                          borderRadius: "6px",
                          fontSize: "11px",
                          fontWeight: "700",
                          background:
                            item.type === "Income"
                              ? "#dcfce7"
                              : item.type === "Salary"
                              ? "#dbeafe"
                              : item.type === "Maintenance"
                              ? "#ede9fe"
                              : "#fee2e2",
                          color:
                            item.type === "Income"
                              ? "#15803d"
                              : item.type === "Salary"
                              ? "#1d4ed8"
                              : item.type === "Maintenance"
                              ? "#6d28d9"
                              : "#b91c1c",
                        }}
                      >
                        {item.type}
                      </span>
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      <div style={{ fontWeight: "600", color: "#1e293b" }}>{item.description}</div>
                      <div style={{ fontSize: "11px", color: "#94a3b8" }}>{item.category} • ID: {item.id}</div>
                    </td>
                    <td style={{ padding: "12px 14px", color: "#334155" }}>{item.person}</td>
                    <td style={{ padding: "12px 14px", color: "#64748b" }}>{item.paymentMethod}</td>
                    <td style={{ padding: "12px 14px", textAlign: "right", fontWeight: "800", color: item.isCredit ? "#16a34a" : "#ef4444" }}>
                      {item.isCredit ? `+₹${item.amount.toLocaleString("en-IN")}` : `-₹${item.amount.toLocaleString("en-IN")}`}
                    </td>
                    <td style={{ padding: "12px 14px", textAlign: "center" }}>
                      <span style={{ fontSize: "11px", padding: "2px 6px", borderRadius: "4px", background: item.status === "Paid" ? "#f0fdf4" : "#fef3c7", color: item.status === "Paid" ? "#16a34a" : "#b45309" }}>
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "16px", fontSize: "13px", color: "#64748b" }}>
            <div>
              Showing {((historyPage - 1) * ITEMS_PER_PAGE) + 1} to {Math.min(historyPage * ITEMS_PER_PAGE, filteredHistory.length)} of {filteredHistory.length} records
            </div>
            <div style={{ display: "flex", gap: "6px" }}>
              <button
                disabled={historyPage === 1}
                onClick={() => setHistoryPage((p) => Math.max(1, p - 1))}
                style={{ padding: "6px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", background: historyPage === 1 ? "#f8fafc" : "#ffffff", cursor: historyPage === 1 ? "not-allowed" : "pointer" }}
              >
                Previous
              </button>
              <button
                disabled={historyPage >= totalHistoryPages}
                onClick={() => setHistoryPage((p) => p + 1)}
                style={{ padding: "6px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", background: historyPage >= totalHistoryPages ? "#f8fafc" : "#ffffff", cursor: historyPage >= totalHistoryPages ? "not-allowed" : "pointer" }}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 8. MONTHLY FINANCIAL REPORT */}
      {/* ========================================================================= */}
      {activeTab === "reports" && (
        <div style={{ background: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0", padding: "24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", borderBottom: "1px solid #e2e8f0", paddingBottom: "16px" }}>
            <div>
              <h3 style={{ margin: 0, fontSize: "20px", fontWeight: "800", color: "#0f172a" }}>
                Monthly Profit & Loss Statement ({selectedMonth})
              </h3>
              <p style={{ margin: "4px 0 0 0", fontSize: "13px", color: "#64748b" }}>
                Certified Hotel Financial Performance Summary from Immutable Database Records.
              </p>
            </div>
            <button
              onClick={() => window.print()}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 16px",
                background: "#2563eb",
                color: "#ffffff",
                border: "none",
                borderRadius: "8px",
                fontWeight: "600",
                fontSize: "13px",
                cursor: "pointer",
              }}
            >
              <FaPrint size={13} /> Print Statement
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
            {/* Revenue breakdown */}
            <div style={{ background: "#f8fafc", padding: "18px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
              <h4 style={{ margin: "0 0 12px 0", fontSize: "15px", color: "#16a34a", fontWeight: "700" }}>Total Income & Revenues</h4>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "13px" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>Room Bookings & Packages:</span>
                  <strong>₹{summary.totalIncome.toLocaleString("en-IN")}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", color: "#d97706" }}>
                  <span>Pending Customer Receivables:</span>
                  <strong>₹{summary.pendingCustomerPayments.toLocaleString("en-IN")}</strong>
                </div>
                <div style={{ borderTop: "1px solid #cbd5e1", paddingTop: "8px", display: "flex", justifyContent: "space-between", fontWeight: "800", fontSize: "15px" }}>
                  <span>Gross Operating Income:</span>
                  <span style={{ color: "#16a34a" }}>₹{summary.totalIncome.toLocaleString("en-IN")}</span>
                </div>
              </div>
            </div>

            {/* Expenses breakdown */}
            <div style={{ background: "#f8fafc", padding: "18px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
              <h4 style={{ margin: "0 0 12px 0", fontSize: "15px", color: "#ef4444", fontWeight: "700" }}>Operating & Staff Expenses</h4>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "13px" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>Staff Payroll (Paid):</span>
                  <strong>₹{summary.totalSalaryExpense.toLocaleString("en-IN")}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>Facility Maintenance:</span>
                  <strong>₹{summary.totalMaintenanceExpense.toLocaleString("en-IN")}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>Utilities & Operations:</span>
                  <strong>₹{summary.totalOperatingExpenses.toLocaleString("en-IN")}</strong>
                </div>
                <div style={{ borderTop: "1px solid #cbd5e1", paddingTop: "8px", display: "flex", justifyContent: "space-between", fontWeight: "800", fontSize: "15px" }}>
                  <span>Total Hotel Expenses:</span>
                  <span style={{ color: "#ef4444" }}>₹{summary.totalExpenses.toLocaleString("en-IN")}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Final Net Summary Banner */}
          <div style={{ marginTop: "24px", background: summary.netBalance >= 0 ? "#f0fdf4" : "#fef2f2", border: summary.netBalance >= 0 ? "2px solid #16a34a" : "2px solid #dc2626", borderRadius: "12px", padding: "18px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: "13px", fontWeight: "700", color: "#64748b" }}>NET HOTEL BALANCE ({selectedMonth})</div>
              <div style={{ fontSize: "28px", fontWeight: "900", color: summary.netBalance >= 0 ? "#15803d" : "#b91c1c", marginTop: "4px" }}>
                ₹{summary.netBalance.toLocaleString("en-IN")}
              </div>
            </div>
            <div style={{ textAlign: "right", fontSize: "13px", color: "#64748b" }}>
              Status: <strong style={{ color: summary.netBalance >= 0 ? "#16a34a" : "#dc2626" }}>{summary.netBalance >= 0 ? "Profitable Period" : "Loss Period"}</strong>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: MARK SALARY AS PAID */}
      {/* ========================================================================= */}
      {paySalaryModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: "20px" }}>
          <div style={{ background: "#ffffff", borderRadius: "14px", width: "100%", maxWidth: "480px", padding: "24px", boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)" }}>
            <h3 style={{ margin: "0 0 12px 0", fontSize: "18px", fontWeight: "700", color: "#0f172a" }}>
              Disburse Salary Payment
            </h3>
            <p style={{ margin: "0 0 18px 0", fontSize: "13px", color: "#64748b" }}>
              Paying salary for <strong>{paySalaryModal.employeeName}</strong> ({paySalaryModal.month})
            </p>

            <div style={{ background: "#f8fafc", padding: "12px", borderRadius: "8px", marginBottom: "16px", fontSize: "13px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                <span>Monthly Base:</span>
                <span>₹{paySalaryModal.monthlySalary.toLocaleString("en-IN")}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px", color: "#ef4444" }}>
                <span>Unpaid Leave Deductions:</span>
                <span>-₹{paySalaryModal.salaryDeduction.toLocaleString("en-IN")}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "800", color: "#0f172a", borderTop: "1px solid #e2e8f0", paddingTop: "6px" }}>
                <span>Final Payable:</span>
                <span style={{ color: "#16a34a" }}>₹{paySalaryModal.finalSalary.toLocaleString("en-IN")}</span>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "20px" }}>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#475569", marginBottom: "4px" }}>Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                >
                  <option value="Bank Transfer">Bank Transfer (NEFT/RTGS)</option>
                  <option value="UPI">UPI Instant</option>
                  <option value="Cash">Cash</option>
                  <option value="Cheque">Cheque</option>
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#475569", marginBottom: "4px" }}>Payment Date</label>
                <input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#475569", marginBottom: "4px" }}>Transaction Reference</label>
                <input
                  type="text"
                  placeholder="e.g. TXN-SAL-991244"
                  value={transactionRef}
                  onChange={(e) => setTransactionRef(e.target.value)}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                />
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button
                onClick={() => setPaySalaryModal(null)}
                style={{ padding: "8px 16px", borderRadius: "8px", border: "1px solid #cbd5e1", background: "#f8fafc", color: "#475569", fontWeight: "600", cursor: "pointer" }}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmPaySalary}
                style={{ padding: "8px 18px", borderRadius: "8px", border: "none", background: "#16a34a", color: "#ffffff", fontWeight: "700", cursor: "pointer" }}
              >
                Confirm Payment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: PAY SLIP DETAIL */}
      {/* ========================================================================= */}
      {paySlipModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: "20px" }}>
          <div style={{ background: "#ffffff", borderRadius: "14px", width: "100%", maxWidth: "520px", padding: "28px", boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)" }}>
            <div style={{ textAlign: "center", borderBottom: "2px solid #e2e8f0", paddingBottom: "14px", marginBottom: "16px" }}>
              <h2 style={{ margin: 0, fontSize: "20px", color: "#0f172a", fontWeight: "800" }}>HOTEL PAY SLIP</h2>
              <div style={{ fontSize: "12px", color: "#64748b" }}>Pay Period: {paySlipModal.month} • Status: {paySlipModal.status}</div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", fontSize: "13px", marginBottom: "18px" }}>
              <div>
                <span style={{ color: "#64748b" }}>Employee Name:</span>
                <div style={{ fontWeight: "700", color: "#0f172a" }}>{paySlipModal.employeeName}</div>
              </div>
              <div>
                <span style={{ color: "#64748b" }}>Staff ID:</span>
                <div style={{ fontWeight: "700", color: "#0f172a" }}>{paySlipModal.employeeId}</div>
              </div>
              <div>
                <span style={{ color: "#64748b" }}>Department:</span>
                <div style={{ fontWeight: "600" }}>{paySlipModal.department}</div>
              </div>
              <div>
                <span style={{ color: "#64748b" }}>Role:</span>
                <div style={{ fontWeight: "600" }}>{paySlipModal.role}</div>
              </div>
            </div>

            <div style={{ background: "#f8fafc", padding: "14px", borderRadius: "10px", fontSize: "13px", marginBottom: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                <span>Base Monthly Salary:</span>
                <span>₹{paySlipModal.monthlySalary.toLocaleString("en-IN")}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                <span>Working Days Base:</span>
                <span>{paySlipModal.workingDays} Days</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                <span>Per Day Rate:</span>
                <span>₹{paySlipModal.perDaySalary.toLocaleString("en-IN")}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px", color: "#ef4444" }}>
                <span>Unpaid Leave Deductions ({paySlipModal.unpaidLeaveDays}d):</span>
                <span>-₹{paySlipModal.salaryDeduction.toLocaleString("en-IN")}</span>
              </div>
              <div style={{ borderTop: "2px solid #e2e8f0", paddingTop: "8px", marginTop: "8px", display: "flex", justifyContent: "space-between", fontWeight: "900", fontSize: "16px" }}>
                <span>Net Payable Salary:</span>
                <span style={{ color: "#16a34a" }}>₹{paySlipModal.finalSalary.toLocaleString("en-IN")}</span>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button
                onClick={() => setPaySlipModal(null)}
                style={{ padding: "8px 18px", borderRadius: "8px", border: "1px solid #cbd5e1", background: "#f8fafc", color: "#475569", fontWeight: "600", cursor: "pointer" }}
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                style={{ padding: "8px 18px", borderRadius: "8px", border: "none", background: "#2563eb", color: "#ffffff", fontWeight: "700", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}
              >
                <FaPrint size={12} /> Print
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD EXPENSE */}
      {/* ========================================================================= */}
      {addExpenseModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: "20px" }}>
          <form onSubmit={handleSaveExpense} style={{ background: "#ffffff", borderRadius: "14px", width: "100%", maxWidth: "480px", padding: "24px", boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)" }}>
            <h3 style={{ margin: "0 0 16px 0", fontSize: "18px", fontWeight: "700", color: "#0f172a" }}>Record New Expense</h3>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "20px" }}>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#475569", marginBottom: "4px" }}>Category</label>
                <select
                  value={newExpCategory}
                  onChange={(e) => setNewExpCategory(e.target.value)}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                >
                  <option value="Electricity">Electricity</option>
                  <option value="Water">Water</option>
                  <option value="Internet">Internet</option>
                  <option value="Maintenance">Maintenance</option>
                  <option value="Cleaning Supplies">Cleaning Supplies</option>
                  <option value="Kitchen / Raw Materials">Kitchen / Raw Materials</option>
                  <option value="Laundry">Laundry</option>
                  <option value="Repairs">Repairs</option>
                  <option value="Other">Other Expenses</option>
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#475569", marginBottom: "4px" }}>Description</label>
                <input
                  type="text"
                  placeholder="e.g. Generator Fuel & Grid Refill"
                  value={newExpDesc}
                  onChange={(e) => setNewExpDesc(e.target.value)}
                  required
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#475569", marginBottom: "4px" }}>Amount (₹)</label>
                  <input
                    type="number"
                    placeholder="e.g. 15000"
                    value={newExpAmount}
                    onChange={(e) => setNewExpAmount(e.target.value)}
                    required
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#475569", marginBottom: "4px" }}>Date</label>
                  <input
                    type="date"
                    value={newExpDate}
                    onChange={(e) => setNewExpDate(e.target.value)}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#475569", marginBottom: "4px" }}>Payment Method</label>
                  <select
                    value={newExpMethod}
                    onChange={(e) => setNewExpMethod(e.target.value)}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                  >
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="UPI">UPI</option>
                    <option value="Cash">Cash</option>
                    <option value="Card">Card</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#475569", marginBottom: "4px" }}>Status</label>
                  <select
                    value={newExpStatus}
                    onChange={(e) => setNewExpStatus(e.target.value)}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                  >
                    <option value="Paid">Paid</option>
                    <option value="Pending">Pending</option>
                  </select>
                </div>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button
                type="button"
                onClick={() => setAddExpenseModal(false)}
                style={{ padding: "8px 16px", borderRadius: "8px", border: "1px solid #cbd5e1", background: "#f8fafc", color: "#475569", fontWeight: "600", cursor: "pointer" }}
              >
                Cancel
              </button>
              <button
                type="submit"
                style={{ padding: "8px 18px", borderRadius: "8px", border: "none", background: "#ef4444", color: "#ffffff", fontWeight: "700", cursor: "pointer" }}
              >
                Save Expense
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD INCOME */}
      {/* ========================================================================= */}
      {addIncomeModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: "20px" }}>
          <form onSubmit={handleSaveIncome} style={{ background: "#ffffff", borderRadius: "14px", width: "100%", maxWidth: "480px", padding: "24px", boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)" }}>
            <h3 style={{ margin: "0 0 16px 0", fontSize: "18px", fontWeight: "700", color: "#0f172a" }}>Record New Income</h3>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "20px" }}>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#475569", marginBottom: "4px" }}>Source / Category</label>
                <select
                  value={newIncSource}
                  onChange={(e) => setNewIncSource(e.target.value)}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                >
                  <option value="Room Booking Income">Room Booking Income</option>
                  <option value="Customer Payment">Customer Payment</option>
                  <option value="Advance Payment">Advance Payment</option>
                  <option value="Food/Kitchen Income">Food/Kitchen Income</option>
                  <option value="Other Hotel Income">Other Hotel Income</option>
                </select>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#475569", marginBottom: "4px" }}>Customer / Guest</label>
                  <input
                    type="text"
                    placeholder="Guest name"
                    value={newIncCustomer}
                    onChange={(e) => setNewIncCustomer(e.target.value)}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#475569", marginBottom: "4px" }}>Room / Area</label>
                  <input
                    type="text"
                    placeholder="e.g. Room 101"
                    value={newIncRoom}
                    onChange={(e) => setNewIncRoom(e.target.value)}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#475569", marginBottom: "4px" }}>Amount (₹)</label>
                  <input
                    type="number"
                    placeholder="e.g. 12000"
                    value={newIncAmount}
                    onChange={(e) => setNewIncAmount(e.target.value)}
                    required
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#475569", marginBottom: "4px" }}>Date</label>
                  <input
                    type="date"
                    value={newIncDate}
                    onChange={(e) => setNewIncDate(e.target.value)}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#475569", marginBottom: "4px" }}>Payment Method</label>
                <select
                  value={newIncMethod}
                  onChange={(e) => setNewIncMethod(e.target.value)}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                >
                  <option value="UPI">UPI</option>
                  <option value="Card">Card</option>
                  <option value="Cash">Cash</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                </select>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button
                type="button"
                onClick={() => setAddIncomeModal(false)}
                style={{ padding: "8px 16px", borderRadius: "8px", border: "1px solid #cbd5e1", background: "#f8fafc", color: "#475569", fontWeight: "600", cursor: "pointer" }}
              >
                Cancel
              </button>
              <button
                type="submit"
                style={{ padding: "8px 18px", borderRadius: "8px", border: "none", background: "#16a34a", color: "#ffffff", fontWeight: "700", cursor: "pointer" }}
              >
                Save Income
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: AUDIT TRAIL */}
      {/* ========================================================================= */}
      {auditModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: "20px" }}>
          <div style={{ background: "#ffffff", borderRadius: "14px", width: "100%", maxWidth: "680px", maxHeight: "80vh", display: "flex", flexDirection: "column", padding: "24px", boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #e2e8f0", paddingBottom: "12px", marginBottom: "14px" }}>
              <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "700", color: "#0f172a" }}>Financial Audit Trail ({auditTrail.length})</h3>
              <button onClick={() => setAuditModal(false)} style={{ background: "none", border: "none", fontSize: "16px", cursor: "pointer", color: "#64748b" }}>✕</button>
            </div>

            <div style={{ overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: "10px" }}>
              {auditTrail.length === 0 ? (
                <div style={{ padding: "24px", textAlign: "center", color: "#94a3b8" }}>No audit log entries found.</div>
              ) : (
                auditTrail.map((log) => (
                  <div key={log.id} style={{ background: "#f8fafc", padding: "12px 14px", borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "12px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                      <strong style={{ color: "#2563eb" }}>{log.action} ({log.recordType})</strong>
                      <span style={{ color: "#94a3b8" }}>{new Date(log.timestamp).toLocaleString()}</span>
                    </div>
                    <div style={{ color: "#334155", marginBottom: "4px" }}>{log.reason}</div>
                    <div style={{ color: "#64748b", fontSize: "11px" }}>Modified by: <strong>{log.changedBy}</strong> • Log ID: {log.id}</div>
                  </div>
                ))
              )}
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "16px", paddingTop: "12px", borderTop: "1px solid #e2e8f0" }}>
              <button
                onClick={() => setAuditModal(false)}
                style={{ padding: "8px 18px", borderRadius: "8px", border: "none", background: "#334155", color: "#ffffff", fontWeight: "700", cursor: "pointer" }}
              >
                Close Audit Trail
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}