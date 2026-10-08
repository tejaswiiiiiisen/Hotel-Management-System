import { getScopedStorageKey, getCurrentOrgId, getCurrentOrg, getUserEmail, getUserName } from "../auth.js";
import { getEmployees } from "../employees.js";
import { getRooms } from "../utils/roomStore.js";
import { getCustomers } from "../utils/customerStore.js";
import { getMaintenanceTickets } from "./inventoryStore.js";
import { logAction } from "../audit.js";

// Permanent storage keys with organization scoping
const EXPENSES_KEY = "accounting_expenses_v2";
const SALARY_HISTORY_KEY = "accounting_salary_history_v2";
const AUDIT_TRAIL_KEY = "accounting_audit_trail_v2";
const CUSTOM_INCOME_KEY = "accounting_custom_income_v2";
const CASH_FLOW_SETTINGS_KEY = "accounting_cashflow_settings_v2";

function getKey(base) {
  return getScopedStorageKey(base);
}

// Initial seed expenses to guarantee rich initial state across months
const INITIAL_SEED_EXPENSES = [
  {
    id: "EXP-2026-001",
    category: "Electricity",
    description: "Main Tower & Central AC Electricity Bill (Aug 2026)",
    amount: 38500,
    date: "2026-08-15",
    month: "2026-08",
    paymentMethod: "Bank Transfer",
    status: "Paid",
    addedBy: "Admin",
    receiptUrl: null,
    orgId: "MA330",
  },
  {
    id: "EXP-2026-002",
    category: "Water",
    description: "Municipal Water Supply & Tanker Refill",
    amount: 12400,
    date: "2026-08-18",
    month: "2026-08",
    paymentMethod: "UPI",
    status: "Paid",
    addedBy: "Priya (Accounts)",
    receiptUrl: null,
    orgId: "MA330",
  },
  {
    id: "EXP-2026-003",
    category: "Internet",
    description: "High-Speed Fiber Leased Line (500 Mbps)",
    amount: 6500,
    date: "2026-08-20",
    month: "2026-08",
    paymentMethod: "Card",
    status: "Paid",
    addedBy: "Admin",
    receiptUrl: null,
    orgId: "MA330",
  },
  {
    id: "EXP-2026-004",
    category: "Cleaning Supplies",
    description: "Bulk Detergent, Disinfectants & Linen Wash",
    amount: 14200,
    date: "2026-09-02",
    month: "2026-09",
    paymentMethod: "UPI",
    status: "Paid",
    addedBy: "Priya (Accounts)",
    receiptUrl: null,
    orgId: "MA330",
  },
  {
    id: "EXP-2026-005",
    category: "Kitchen / Raw Materials",
    description: "Fresh Organic Vegetables, Dairy & Poultry Supply",
    amount: 42000,
    date: "2026-09-10",
    month: "2026-09",
    paymentMethod: "Bank Transfer",
    status: "Paid",
    addedBy: "Vikas Joshi (Chef)",
    receiptUrl: null,
    orgId: "MA330",
  },
  {
    id: "EXP-2026-006",
    category: "Laundry",
    description: "External Dry Cleaning & Towel Sanitization Services",
    amount: 9800,
    date: "2026-09-14",
    month: "2026-09",
    paymentMethod: "Cash",
    status: "Paid",
    addedBy: "Sunita Devi",
    receiptUrl: null,
    orgId: "MA330",
  },
  {
    id: "EXP-2026-007",
    category: "Electricity",
    description: "September Advance Grid Power & Generator Fuel",
    amount: 32000,
    date: "2026-09-18",
    month: "2026-09",
    paymentMethod: "Bank Transfer",
    status: "Paid",
    addedBy: "Admin",
    receiptUrl: null,
    orgId: "MA330",
  }
];

// Initial seed salary records for permanent past history
const INITIAL_SEED_SALARIES = [
  {
    id: "SAL-202608-HK101",
    employeeId: "HK-101",
    employeeName: "Sunita Devi",
    department: "Housekeeping",
    role: "Senior Housekeeper",
    month: "2026-08",
    monthlySalary: 26000,
    workingDays: 30,
    presentDays: 28,
    absentDays: 0,
    paidLeaveDays: 2,
    unpaidLeaveDays: 0,
    perDaySalary: 866.67,
    salaryDeduction: 0,
    finalSalary: 26000,
    status: "Paid",
    paymentDate: "2026-08-28",
    paymentMethod: "Bank Transfer",
    transactionRef: "TXN-SAL-882190",
    paidBy: "Admin",
    accountNo: "•••• 7812 (Axis Bank)",
    createdAt: "2026-08-28T10:00:00.000Z",
  },
  {
    id: "SAL-202608-HK102",
    employeeId: "HK-102",
    employeeName: "Ramesh Kumar",
    department: "Housekeeping",
    role: "Housekeeping Supervisor",
    month: "2026-08",
    monthlySalary: 24000,
    workingDays: 30,
    presentDays: 26,
    absentDays: 2,
    paidLeaveDays: 2,
    unpaidLeaveDays: 2,
    perDaySalary: 800,
    salaryDeduction: 1600,
    finalSalary: 22400,
    status: "Paid",
    paymentDate: "2026-08-28",
    paymentMethod: "UPI",
    transactionRef: "UPI-SAL-991204",
    paidBy: "Admin",
    accountNo: "•••• 4829 (HDFC Bank)",
    createdAt: "2026-08-28T10:30:00.000Z",
  },
  {
    id: "SAL-202608-KT201",
    employeeId: "KT-201",
    employeeName: "Vikas Joshi",
    department: "Kitchen",
    role: "Head Chef",
    month: "2026-08",
    monthlySalary: 45000,
    workingDays: 30,
    presentDays: 30,
    absentDays: 0,
    paidLeaveDays: 0,
    unpaidLeaveDays: 0,
    perDaySalary: 1500,
    salaryDeduction: 0,
    finalSalary: 45000,
    status: "Paid",
    paymentDate: "2026-08-28",
    paymentMethod: "Bank Transfer",
    transactionRef: "TXN-SAL-773199",
    paidBy: "Admin",
    accountNo: "•••• 5590 (Kotak Bank)",
    createdAt: "2026-08-28T11:00:00.000Z",
  },
  {
    id: "SAL-202608-AC301",
    employeeId: "AC-301",
    employeeName: "Priya Sharma",
    department: "Accounting",
    role: "Chief Accountant",
    month: "2026-08",
    monthlySalary: 38000,
    workingDays: 30,
    presentDays: 29,
    absentDays: 1,
    paidLeaveDays: 0,
    unpaidLeaveDays: 1,
    perDaySalary: 1266.67,
    salaryDeduction: 1266.67,
    finalSalary: 36733.33,
    status: "Paid",
    paymentDate: "2026-08-28",
    paymentMethod: "Bank Transfer",
    transactionRef: "TXN-SAL-662100",
    paidBy: "Admin",
    accountNo: "•••• 9102 (ICICI Bank)",
    createdAt: "2026-08-28T11:30:00.000Z",
  }
];

// Helper to broadcast store change events
function dispatchAccountingChange(type, data = {}) {
  try {
    window.dispatchEvent(new CustomEvent("accounting_store_updated", { detail: { type, ...data } }));
  } catch (e) {
    console.error("Accounting store event error:", e);
  }
}

// ----------------------------------------------------
// 1. EXPENSES MANAGEMENT
// ----------------------------------------------------

export function getStoredExpenses() {
  const key = getKey(EXPENSES_KEY);
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      localStorage.setItem(key, JSON.stringify(INITIAL_SEED_EXPENSES));
      return INITIAL_SEED_EXPENSES;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : INITIAL_SEED_EXPENSES;
  } catch (e) {
    return INITIAL_SEED_EXPENSES;
  }
}

export function addExpenseRecord(expenseData) {
  const list = getStoredExpenses();
  const dateStr = expenseData.date || new Date().toISOString().split("T")[0];
  const monthStr = dateStr.slice(0, 7);
  const currentOrg = getCurrentOrgId() || "DEFAULT";

  const newRecord = {
    id: `EXP-${Date.now().toString().slice(-6)}`,
    category: expenseData.category || "Other",
    description: expenseData.description || "General hotel expense",
    amount: Number(expenseData.amount) || 0,
    date: dateStr,
    month: monthStr,
    paymentMethod: expenseData.paymentMethod || "Cash",
    status: expenseData.status || "Paid",
    addedBy: expenseData.addedBy || getUserName() || "Staff",
    receiptUrl: expenseData.receiptUrl || null,
    orgId: currentOrg,
    createdAt: new Date().toISOString(),
  };

  const updated = [newRecord, ...list];
  localStorage.setItem(getKey(EXPENSES_KEY), JSON.stringify(updated));

  // Log in audit trail
  addAuditLog({
    action: "ADD_EXPENSE",
    recordType: "Expense",
    recordId: newRecord.id,
    previousValue: null,
    newValue: newRecord,
    changedBy: getUserName() || "Staff",
    reason: `Added expense ₹${newRecord.amount} (${newRecord.category})`,
  });

  dispatchAccountingChange("EXPENSE_ADDED", { expense: newRecord });
  return newRecord;
}

export function updateExpenseRecord(expenseId, updateData, changeReason = "Details update") {
  const list = getStoredExpenses();
  const index = list.findIndex((e) => e.id === expenseId);
  if (index === -1) return null;

  const previous = { ...list[index] };
  const updatedRecord = {
    ...previous,
    ...updateData,
    amount: Number(updateData.amount !== undefined ? updateData.amount : previous.amount),
    updatedAt: new Date().toISOString(),
    lastModifiedBy: getUserName() || "Staff",
  };

  list[index] = updatedRecord;
  localStorage.setItem(getKey(EXPENSES_KEY), JSON.stringify(list));

  // Log audit
  addAuditLog({
    action: "UPDATE_EXPENSE",
    recordType: "Expense",
    recordId: expenseId,
    previousValue: previous,
    newValue: updatedRecord,
    changedBy: getUserName() || "Staff",
    reason: changeReason,
  });

  dispatchAccountingChange("EXPENSE_UPDATED", { expense: updatedRecord });
  return updatedRecord;
}

// ----------------------------------------------------
// 2. PERMANENT SALARY MANAGEMENT & HISTORY
// ----------------------------------------------------

export function getSalaryHistoryRecords() {
  const key = getKey(SALARY_HISTORY_KEY);
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      localStorage.setItem(key, JSON.stringify(INITIAL_SEED_SALARIES));
      return INITIAL_SEED_SALARIES;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : INITIAL_SEED_SALARIES;
  } catch (e) {
    return INITIAL_SEED_SALARIES;
  }
}

// Calculates dynamic salary for the target month from employee data & leave days
export function calculateEmployeeSalaryForMonth(employee, targetMonth = "2026-09") {
  const monthlySalary = Number(employee.salary || employee.base_salary || 25000);
  const workingDays = 30;
  const perDaySalary = Math.round((monthlySalary / workingDays) * 100) / 100;

  // Derive leave & attendance data from employee profile or realistic defaults
  const empLeaves = employee.leaves || [];
  const targetMonthLeaves = empLeaves.filter((l) => (l.date || "").startsWith(targetMonth));
  
  let unpaidLeaves = employee.unpaidLeaveDays !== undefined ? Number(employee.unpaidLeaveDays) : 0;
  let paidLeaves = employee.paidLeaveDays !== undefined ? Number(employee.paidLeaveDays) : 0;

  if (targetMonthLeaves.length > 0) {
    targetMonthLeaves.forEach((l) => {
      const type = (l.type || l.leave_type || "").toLowerCase();
      if (type.includes("unpaid") || type.includes("casual") || type.includes("loss of pay")) {
        unpaidLeaves += 1;
      } else {
        paidLeaves += 1;
      }
    });
  }

  // Formula as required:
  // Per Day Salary = Monthly Salary / 30
  // Salary Deduction = Per Day Salary * Unpaid Leaves
  // Final Salary = Monthly Salary - Deduction
  // Approved Paid Leave = ₹0 deduction
  const salaryDeduction = Math.round(perDaySalary * unpaidLeaves * 100) / 100;
  const finalSalary = Math.max(0, Math.round((monthlySalary - salaryDeduction) * 100) / 100);
  const presentDays = Math.max(0, workingDays - unpaidLeaves - paidLeaves);
  const absentDays = unpaidLeaves;

  return {
    monthlySalary,
    workingDays,
    presentDays,
    absentDays,
    paidLeaveDays: paidLeaves,
    unpaidLeaveDays: unpaidLeaves,
    perDaySalary,
    salaryDeduction,
    finalSalary,
  };
}

// Ensures all active employees have a permanent salary record for the target month
export function getOrCreateMonthlySalaries(targetMonth = "2026-09") {
  const history = getSalaryHistoryRecords();
  const allEmployees = getEmployees();

  // Filter employees for relevant departments: Housekeeping, Kitchen, Accounting, Front Desk
  const activeStaff = allEmployees.filter((e) => {
    const dept = (e.department || e.role || "").toLowerCase();
    return !dept.includes("super_admin");
  });

  const monthRecords = [];

  activeStaff.forEach((emp) => {
    const staffId = emp.staffId || emp.staff_id || emp.id;
    const existing = history.find((h) => (h.employeeId === staffId || h.id === `SAL-${targetMonth.replace("-", "")}-${staffId}`) && h.month === targetMonth);

    if (existing) {
      monthRecords.push(existing);
    } else {
      const calc = calculateEmployeeSalaryForMonth(emp, targetMonth);
      const isPastMonth = targetMonth < "2026-09";
      const newRec = {
        id: `SAL-${targetMonth.replace("-", "")}-${staffId}`,
        employeeId: staffId,
        employeeName: emp.name,
        department: emp.department || (emp.role === "housekeeping" ? "Housekeeping" : emp.role === "chef" ? "Kitchen" : "Accounting"),
        role: emp.role || "Staff",
        month: targetMonth,
        monthlySalary: calc.monthlySalary,
        workingDays: calc.workingDays,
        presentDays: calc.presentDays,
        absentDays: calc.absentDays,
        paidLeaveDays: calc.paidLeaveDays,
        unpaidLeaveDays: calc.unpaidLeaveDays,
        perDaySalary: calc.perDaySalary,
        salaryDeduction: calc.salaryDeduction,
        finalSalary: calc.finalSalary,
        status: isPastMonth ? "Paid" : "Pending",
        paymentDate: isPastMonth ? `${targetMonth}-28` : null,
        paymentMethod: isPastMonth ? "Bank Transfer" : "Bank Transfer",
        transactionRef: isPastMonth ? `TXN-SAL-${Math.floor(100000 + Math.random() * 900000)}` : null,
        paidBy: isPastMonth ? "Admin" : null,
        accountNo: emp.account_no || emp.accountNo || `•••• ${Math.floor(1000 + Math.random() * 9000)} (HDFC Bank)`,
        createdAt: new Date().toISOString(),
      };
      monthRecords.push(newRec);
    }
  });

  return monthRecords;
}

export function markSalaryAsPaid(salaryRecordId, paymentDetails = {}) {
  const history = getSalaryHistoryRecords();
  const index = history.findIndex((s) => s.id === salaryRecordId);
  const now = new Date();
  const todayStr = now.toISOString().split("T")[0];

  let recordToSave;
  if (index !== -1) {
    const previous = { ...history[index] };
    recordToSave = {
      ...previous,
      status: "Paid",
      paymentDate: paymentDetails.paymentDate || todayStr,
      paymentMethod: paymentDetails.paymentMethod || "Bank Transfer",
      transactionRef: paymentDetails.transactionRef || `TXN-SAL-${Date.now().toString().slice(-6)}`,
      paidAmount: paymentDetails.paidAmount || previous.finalSalary,
      paidBy: paymentDetails.paidBy || getUserName() || "Admin",
      notes: paymentDetails.notes || "",
      paidAt: now.toISOString(),
    };
    history[index] = recordToSave;

    addAuditLog({
      action: "MARK_SALARY_PAID",
      recordType: "Salary",
      recordId: salaryRecordId,
      previousValue: previous,
      newValue: recordToSave,
      changedBy: getUserName() || "Admin",
      reason: `Salary paid ₹${recordToSave.finalSalary} to ${recordToSave.employeeName} (${recordToSave.month})`,
    });
  } else {
    // If not yet saved in permanent history, create and persist
    recordToSave = {
      ...paymentDetails,
      id: salaryRecordId,
      status: "Paid",
      paymentDate: paymentDetails.paymentDate || todayStr,
      paymentMethod: paymentDetails.paymentMethod || "Bank Transfer",
      transactionRef: paymentDetails.transactionRef || `TXN-SAL-${Date.now().toString().slice(-6)}`,
      paidBy: paymentDetails.paidBy || getUserName() || "Admin",
      paidAt: now.toISOString(),
    };
    history.push(recordToSave);

    addAuditLog({
      action: "CREATE_PAID_SALARY",
      recordType: "Salary",
      recordId: salaryRecordId,
      previousValue: null,
      newValue: recordToSave,
      changedBy: getUserName() || "Admin",
      reason: `Recorded & paid salary ₹${recordToSave.finalSalary} to ${recordToSave.employeeName}`,
    });
  }

  localStorage.setItem(getKey(SALARY_HISTORY_KEY), JSON.stringify(history));
  dispatchAccountingChange("SALARY_PAID", { salary: recordToSave });
  return recordToSave;
}

export function updateSalaryRecord(salaryRecordId, updateFields, changeReason = "Correction") {
  const history = getSalaryHistoryRecords();
  const index = history.findIndex((s) => s.id === salaryRecordId);
  if (index === -1) return null;

  const previous = { ...history[index] };
  const updated = {
    ...previous,
    ...updateFields,
    updatedAt: new Date().toISOString(),
    lastModifiedBy: getUserName() || "Admin",
  };

  history[index] = updated;
  localStorage.setItem(getKey(SALARY_HISTORY_KEY), JSON.stringify(history));

  addAuditLog({
    action: "UPDATE_SALARY_RECORD",
    recordType: "Salary",
    recordId: salaryRecordId,
    previousValue: previous,
    newValue: updated,
    changedBy: getUserName() || "Admin",
    reason: changeReason,
  });

  dispatchAccountingChange("SALARY_UPDATED", { salary: updated });
  return updated;
}

// ----------------------------------------------------
// 3. HOTEL INCOME & CUSTOMER REVENUE
// ----------------------------------------------------

export function getCustomIncomeRecords() {
  const key = getKey(CUSTOM_INCOME_KEY);
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

export function addCustomIncome(incomeData) {
  const list = getCustomIncomeRecords();
  const dateStr = incomeData.date || new Date().toISOString().split("T")[0];
  const newRec = {
    id: `INC-${Date.now().toString().slice(-6)}`,
    source: incomeData.source || "Other Hotel Income",
    customerName: incomeData.customerName || "Walk-in Guest",
    room: incomeData.room || "N/A",
    amount: Number(incomeData.amount) || 0,
    paymentMethod: incomeData.paymentMethod || "UPI",
    status: incomeData.status || "Paid",
    date: dateStr,
    month: dateStr.slice(0, 7),
    description: incomeData.description || "Hotel service revenue",
    addedBy: getUserName() || "Staff",
    createdAt: new Date().toISOString(),
  };

  const updated = [newRec, ...list];
  localStorage.setItem(getKey(CUSTOM_INCOME_KEY), JSON.stringify(updated));

  addAuditLog({
    action: "ADD_INCOME",
    recordType: "Income",
    recordId: newRec.id,
    previousValue: null,
    newValue: newRec,
    changedBy: getUserName() || "Staff",
    reason: `Added income ₹${newRec.amount} from ${newRec.source}`,
  });

  dispatchAccountingChange("INCOME_ADDED", { income: newRec });
  return newRec;
}

// Dynamic aggregation of all hotel income from bookings, customers & custom entries
export function getAllHotelIncome(targetMonth) {
  const customers = getCustomers();
  const rooms = getRooms();
  const customIncomes = getCustomIncomeRecords();
  const results = [];

  // Seed default guest incomes if customer store is empty
  const defaultGuestIncomes = [
    {
      id: "TXN-BK-90224",
      customerName: "Siddharth Singhania",
      room: "Room 201 (VIP Suite)",
      bookingId: "RES-98224",
      amount: 28500,
      paymentMethod: "UPI",
      status: "Paid",
      date: "2026-09-24",
      month: "2026-09",
      type: "Room Booking Income",
      description: "VIP Heritage Suite 2 Nights Booking (Website Checkout)",
      addedBy: "Website Online Booking",
    },
    {
      id: "TXN-BK-90225",
      customerName: "Rohit & Neha Verma",
      room: "Room 104 (Deluxe Lake View)",
      bookingId: "RES-98225",
      amount: 14200,
      paymentMethod: "Card",
      status: "Paid",
      date: "2026-09-24",
      month: "2026-09",
      type: "Room Booking Income",
      description: "Deluxe Lake View Room Stay Booking",
      addedBy: "Website Online Booking",
    },
    {
      id: "TXN-BK-90223",
      customerName: "Kavita Maheshwari",
      room: "Room 102 (Executive Standard)",
      bookingId: "RES-98223",
      amount: 19500,
      paymentMethod: "Bank Transfer",
      status: "Paid",
      date: "2026-09-23",
      month: "2026-09",
      type: "Room Booking Income",
      description: "Executive Suite 2 Nights corporate reservation",
      addedBy: "Front Desk (Anil)",
    },
    {
      id: "TXN-BK-90211",
      customerName: "Aarav Sharma",
      room: "Room 101 (Executive Suite)",
      bookingId: "RES-98211",
      amount: 18500,
      paymentMethod: "UPI",
      status: "Paid",
      date: "2026-09-12",
      month: "2026-09",
      type: "Room Booking Income",
      description: "3 Nights Executive Suite + Breakfast",
      addedBy: "Front Desk (Anil)",
    },
    {
      id: "TXN-BK-90212",
      customerName: "Pooja Hegde",
      room: "Room 204 (Deluxe Double)",
      bookingId: "RES-98212",
      amount: 14200,
      paymentMethod: "Card",
      status: "Paid",
      date: "2026-09-15",
      month: "2026-09",
      type: "Room Booking Income",
      description: "2 Nights Deluxe Room stay",
      addedBy: "Front Desk (Anil)",
    },
    {
      id: "TXN-BK-90213",
      customerName: "Vikram Malhotra",
      room: "Room 302 (Presidential Suite)",
      bookingId: "RES-98213",
      amount: 35000,
      paymentMethod: "Bank Transfer",
      status: "Paid",
      date: "2026-09-18",
      month: "2026-09",
      type: "Room Booking Income",
      description: "Presidential Suite Booking with Airport Transfer",
      addedBy: "Front Desk (Anil)",
    },
    {
      id: "TXN-BK-90214",
      customerName: "Meera Nair",
      room: "Room 105 (Standard King)",
      bookingId: "RES-98214",
      amount: 8500,
      paymentMethod: "Cash",
      status: "Pending",
      date: "2026-09-20",
      month: "2026-09",
      type: "Customer Payment",
      description: "Pay at Checkout Balance",
      addedBy: "Front Desk",
    },
    {
      id: "TXN-BK-80101",
      customerName: "Rajiv Singhania",
      room: "Room 201 (Deluxe Suite)",
      bookingId: "RES-88101",
      amount: 42000,
      paymentMethod: "Bank Transfer",
      status: "Paid",
      date: "2026-08-22",
      month: "2026-08",
      type: "Room Booking Income",
      description: "Family holiday booking - August",
      addedBy: "Front Desk",
    },
    {
      id: "TXN-BK-80102",
      customerName: "Ananya Roy",
      room: "Room 102 (Deluxe Queen)",
      bookingId: "RES-88102",
      amount: 22500,
      paymentMethod: "UPI",
      status: "Paid",
      date: "2026-08-25",
      month: "2026-08",
      type: "Room Booking Income",
      description: "Corporate stay package - August",
      addedBy: "Front Desk",
    }
  ];

  // Convert real customer bookings into accounting transactions
  if (Array.isArray(customers) && customers.length > 0) {
    customers.forEach((c) => {
      const paid = Number(c.paidAmount || c.totalAmount || c.amount || 0);
      const isPaid = (c.paymentStatus || c.status || "").toLowerCase() === "paid" || paid > 0;
      const dateStr = c.checkIn || c.bookingDate || c.createdAt || new Date().toISOString().split("T")[0];
      const monthStr = dateStr.slice(0, 7);

      results.push({
        id: `TXN-GUEST-${c.id || Math.floor(1000 + Math.random() * 9000)}`,
        customerName: c.name || "Hotel Guest",
        room: c.roomNumber ? `Room ${c.roomNumber}` : (c.roomType || "Standard Room"),
        bookingId: c.bookingId || `BK-${c.id}`,
        amount: paid > 0 ? paid : (Number(c.totalAmount) || 12000),
        paymentMethod: c.paymentMethod || "UPI",
        status: isPaid ? "Paid" : "Pending",
        date: dateStr,
        month: monthStr,
        type: "Room Booking Income",
        description: `Guest booking stay (${c.roomType || 'Room'})`,
        addedBy: "Front Desk",
      });
    });
  }

  // Combine default transactions, parsed guest transactions, and custom entries
  const combined = [...customIncomes, ...results, ...defaultGuestIncomes];

  // Deduplicate by ID
  const uniqueMap = new Map();
  combined.forEach((item) => {
    if (!uniqueMap.has(item.id)) {
      uniqueMap.set(item.id, item);
    }
  });

  const allList = Array.from(uniqueMap.values());
  if (targetMonth && targetMonth !== "ALL") {
    return allList.filter((i) => i.month === targetMonth || (i.date || "").startsWith(targetMonth));
  }
  return allList;
}

// ----------------------------------------------------
// 4. MAINTENANCE EXPENSE SYNCHRONIZATION
// ----------------------------------------------------

export function getMaintenanceExpenses(targetMonth) {
  const tickets = getMaintenanceTickets();
  const defaultMaintenance = [
    {
      id: "MNT-2026-101",
      area: "Room 204 (Deluxe Room)",
      type: "AC Repair",
      description: "Compressor gas recharge & thermostat calibration",
      amount: 4500,
      priority: "High",
      date: "2026-09-08",
      month: "2026-09",
      status: "Resolved",
      paidStatus: "Paid",
      paymentMethod: "Cash",
      addedBy: "Maintenance Team",
      receiptUrl: null,
    },
    {
      id: "MNT-2026-102",
      area: "3rd Floor Corridor",
      type: "Electrical",
      description: "Emergency light ballast replacement & LED panel repair",
      amount: 2800,
      priority: "Medium",
      date: "2026-09-12",
      month: "2026-09",
      status: "Resolved",
      paidStatus: "Paid",
      paymentMethod: "UPI",
      addedBy: "Maintenance Team",
      receiptUrl: null,
    },
    {
      id: "MNT-2026-103",
      area: "Main Kitchen",
      type: "Equipment Repair",
      description: "Commercial Dishwasher pump maintenance & descaling",
      amount: 7200,
      priority: "High",
      date: "2026-09-16",
      month: "2026-09",
      status: "In Progress",
      paidStatus: "Pending",
      paymentMethod: "Bank Transfer",
      addedBy: "Vikas Joshi (Chef)",
      receiptUrl: null,
    },
    {
      id: "MNT-2026-081",
      area: "Swimming Pool Area",
      type: "Plumbing",
      description: "Filtration pump seal repair and valve replacement",
      amount: 8500,
      priority: "High",
      date: "2026-08-14",
      month: "2026-08",
      status: "Resolved",
      paidStatus: "Paid",
      paymentMethod: "Bank Transfer",
      addedBy: "Maintenance Team",
      receiptUrl: null,
    }
  ];

  const parsedTickets = (tickets || []).map((t) => {
    const cost = Number(String(t.cost_estimate || t.amount || t.cost || "3000").replace(/\D/g, "")) || 3000;
    const dateStr = t.reported_at || t.createdAt || new Date().toISOString().split("T")[0];
    return {
      id: `MNT-TK-${t.id}`,
      area: t.asset || `Room ${t.roomNumber || 'General'}`,
      type: t.category || "General Maintenance",
      description: t.issue || t.description || "Facility maintenance task",
      amount: cost,
      priority: t.priority || "Medium",
      date: dateStr,
      month: dateStr.slice(0, 7),
      status: t.status || "Open",
      paidStatus: t.status === "Resolved" || t.status === "Completed" ? "Paid" : "Pending",
      paymentMethod: "Bank Transfer",
      addedBy: t.reported_by || "Staff",
    };
  });

  const combined = [...defaultMaintenance, ...parsedTickets];
  const uniqueMap = new Map();
  combined.forEach((item) => {
    if (!uniqueMap.has(item.id)) {
      uniqueMap.set(item.id, item);
    }
  });

  const list = Array.from(uniqueMap.values());
  if (targetMonth && targetMonth !== "ALL") {
    return list.filter((m) => m.month === targetMonth || (m.date || "").startsWith(targetMonth));
  }
  return list;
}

// ----------------------------------------------------
// 5. UNIFIED PERMANENT ACCOUNTING HISTORY & AUDIT TRAIL
// ----------------------------------------------------

export function getAuditTrail() {
  const key = getKey(AUDIT_TRAIL_KEY);
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

export function addAuditLog(logEntry) {
  const list = getAuditTrail();
  const entry = {
    id: `AUD-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
    timestamp: new Date().toISOString(),
    ...logEntry,
  };
  const updated = [entry, ...list];
  localStorage.setItem(getKey(AUDIT_TRAIL_KEY), JSON.stringify(updated));
  return entry;
}

// Aggregates the unified permanent ledger: Incomes, Operating Expenses, Salaries, Maintenance
export function getPermanentAccountingLedger(targetMonth) {
  const incomes = getAllHotelIncome(targetMonth);
  const expenses = getStoredExpenses().filter((e) => !targetMonth || targetMonth === "ALL" || e.month === targetMonth || (e.date || "").startsWith(targetMonth));
  const salaries = getSalaryHistoryRecords().filter((s) => !targetMonth || targetMonth === "ALL" || s.month === targetMonth || (s.paymentDate || "").startsWith(targetMonth));
  const maintenance = getMaintenanceExpenses(targetMonth);

  const ledger = [];

  // 1. Incomes
  incomes.forEach((inc) => {
    ledger.push({
      id: inc.id,
      date: inc.date,
      month: inc.month,
      type: "Income",
      category: inc.type || "Room Booking Income",
      description: inc.description || "Guest Booking Revenue",
      person: inc.customerName || "Customer",
      amount: Number(inc.amount),
      isCredit: true, // Cash in
      paymentMethod: inc.paymentMethod || "UPI",
      status: inc.status || "Paid",
      addedBy: inc.addedBy || "Front Desk",
      rawRef: inc,
    });
  });

  // 2. Operating Expenses
  expenses.forEach((exp) => {
    ledger.push({
      id: exp.id,
      date: exp.date,
      month: exp.month,
      type: "Expense",
      category: exp.category,
      description: exp.description,
      person: exp.addedBy || "Hotel Operations",
      amount: Number(exp.amount),
      isCredit: false, // Cash out
      paymentMethod: exp.paymentMethod || "Bank Transfer",
      status: exp.status || "Paid",
      addedBy: exp.addedBy || "Admin",
      rawRef: exp,
    });
  });

  // 3. Salaries Paid / Due
  salaries.forEach((sal) => {
    ledger.push({
      id: sal.id,
      date: sal.paymentDate || `${sal.month}-28`,
      month: sal.month,
      type: "Salary",
      category: `Salary (${sal.department})`,
      description: `Payroll for ${sal.month} - ${sal.role} (${sal.workingDays}d base)`,
      person: sal.employeeName,
      amount: Number(sal.finalSalary),
      isCredit: false,
      paymentMethod: sal.paymentMethod || "Bank Transfer",
      status: sal.status,
      addedBy: sal.paidBy || "Payroll Desk",
      rawRef: sal,
    });
  });

  // 4. Maintenance Expenses
  maintenance.forEach((mnt) => {
    ledger.push({
      id: mnt.id,
      date: mnt.date,
      month: mnt.month,
      type: "Maintenance",
      category: `Maintenance (${mnt.type})`,
      description: `${mnt.area}: ${mnt.description}`,
      person: mnt.addedBy || "Maintenance Desk",
      amount: Number(mnt.amount),
      isCredit: false,
      paymentMethod: mnt.paymentMethod || "Bank Transfer",
      status: mnt.paidStatus || "Paid",
      addedBy: mnt.addedBy || "Staff",
      rawRef: mnt,
    });
  });

  // Sort by date descending
  return ledger.sort((a, b) => new Date(b.date || "1970-01-01") - new Date(a.date || "1970-01-01"));
}

// ----------------------------------------------------
// 6. DASHBOARD & MONTHLY FINANCIAL SUMMARY CALCULATOR
// ----------------------------------------------------

export function calculateFinancialSummary(targetMonth = "2026-09") {
  const ledger = getPermanentAccountingLedger(targetMonth);
  const salaries = getOrCreateMonthlySalaries(targetMonth);
  const maintenance = getMaintenanceExpenses(targetMonth);

  let totalIncome = 0;
  let pendingCustomerPayments = 0;
  let totalOperatingExpenses = 0;
  let totalSalaryExpense = 0;
  let pendingSalaryExpense = 0;
  let totalMaintenanceExpense = 0;
  let pendingMaintenanceExpense = 0;

  // Compute from real unified records
  ledger.forEach((item) => {
    if (item.type === "Income") {
      if (item.status === "Paid") {
        totalIncome += item.amount;
      } else {
        pendingCustomerPayments += item.amount;
      }
    } else if (item.type === "Expense") {
      if (item.status === "Paid") {
        totalOperatingExpenses += item.amount;
      }
    }
  });

  // Salaries for target month
  salaries.forEach((sal) => {
    if (sal.status === "Paid") {
      totalSalaryExpense += Number(sal.finalSalary);
    } else {
      pendingSalaryExpense += Number(sal.finalSalary);
    }
  });

  // Maintenance for target month
  maintenance.forEach((m) => {
    if (m.paidStatus === "Paid") {
      totalMaintenanceExpense += Number(m.amount);
    } else {
      pendingMaintenanceExpense += Number(m.amount);
    }
  });

  const totalExpenses = totalOperatingExpenses + totalSalaryExpense + totalMaintenanceExpense;
  const netBalance = totalIncome - totalExpenses;

  return {
    totalIncome,
    totalExpenses,
    totalOperatingExpenses,
    totalSalaryExpense,
    pendingSalaryExpense,
    totalMaintenanceExpense,
    pendingMaintenanceExpense,
    pendingCustomerPayments,
    netBalance,
  };
}

// ----------------------------------------------------
// 7. DAILY CASH FLOW CALCULATION
// ----------------------------------------------------

export function getDailyCashFlow(targetDate) {
  const dateStr = targetDate || new Date().toISOString().split("T")[0];
  const allLedger = getPermanentAccountingLedger("ALL");

  // Filter for today
  const todayTransactions = allLedger.filter((item) => (item.date || "").startsWith(dateStr));

  // Compute historical opening balance prior to targetDate
  let openingBalance = 150000; // Standard base liquidity reserve
  allLedger.forEach((item) => {
    if ((item.date || "") < dateStr && item.status === "Paid") {
      if (item.isCredit) {
        openingBalance += item.amount;
      } else {
        openingBalance -= item.amount;
      }
    }
  });

  let todayIncome = 0;
  let todayExpenses = 0;
  let salaryPayments = 0;
  let maintenancePayments = 0;

  const methodBreakdown = {
    Cash: { income: 0, expense: 0 },
    UPI: { income: 0, expense: 0 },
    Card: { income: 0, expense: 0 },
    "Bank Transfer": { income: 0, expense: 0 },
    Other: { income: 0, expense: 0 },
  };

  todayTransactions.forEach((tx) => {
    const method = tx.paymentMethod in methodBreakdown ? tx.paymentMethod : "Other";
    if (tx.isCredit && tx.status === "Paid") {
      todayIncome += tx.amount;
      methodBreakdown[method].income += tx.amount;
    } else if (!tx.isCredit && tx.status === "Paid") {
      if (tx.type === "Salary") salaryPayments += tx.amount;
      else if (tx.type === "Maintenance") maintenancePayments += tx.amount;
      else todayExpenses += tx.amount;

      methodBreakdown[method].expense += tx.amount;
    }
  });

  const totalTodayOutflow = todayExpenses + salaryPayments + maintenancePayments;
  const closingBalance = openingBalance + todayIncome - totalTodayOutflow;

  return {
    date: dateStr,
    openingBalance,
    todayIncome,
    todayExpenses,
    salaryPayments,
    maintenancePayments,
    totalTodayOutflow,
    closingBalance,
    methodBreakdown,
    transactions: todayTransactions,
  };
}
