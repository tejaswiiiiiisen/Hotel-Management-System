import { Router } from "express";
import { query } from "../db.js";
import { requireAuth, type AuthedRequest } from "../lib/auth.js";

const router = Router();

router.use(requireAuth);

function enforceOrgIsolation(req: AuthedRequest, requestedOrgId?: string): string | null {
  if (req.userRole === "super_admin" || req.userRole === "admin") {
    return requestedOrgId || req.userOrgCode || null;
  }
  if (req.userOrgCode) {
    if (requestedOrgId && requestedOrgId !== "ALL" && requestedOrgId !== req.userOrgCode) {
      throw new Error(`Unauthorized. You belong to ${req.userOrgCode}, but requested ${requestedOrgId}.`);
    }
    return req.userOrgCode;
  }
  return requestedOrgId || null;
}

// GET /api/payroll
// We now fetch from employees directly instead of payroll_records
router.get("/", async (req: AuthedRequest, res) => {
  try {
    const { orgId } = req.query;
    const targetOrgId = typeof orgId === "string" ? orgId : undefined;

    let branchOrgId: string | null = null;
    try {
      branchOrgId = enforceOrgIsolation(req, targetOrgId);
    } catch (e: any) {
      return res.status(403).json({ success: false, message: e.message });
    }

    let sql = `
      SELECT e.id, e.name, e.role, e.department, e.salary, e.account_no, 
             e.pay_period, e.payment_date, e.payroll_status, u.avatar
      FROM employees e
      LEFT JOIN users u ON e.email = u.email
      WHERE 1=1
    `;
    const params: unknown[] = [];

    if (branchOrgId && branchOrgId !== "ALL") {
      sql += " AND e.org_id = ?";
      params.push(branchOrgId);
    }

    // Staff created from the Staff page also appears in payroll.
    sql = `(${sql}) UNION ALL SELECT -s.id AS id, s.name, s.role, s.department, s.salary, NULL AS account_no,
      NULL AS pay_period, NULL AS payment_date, NULL AS payroll_status, NULL AS avatar
      FROM staff s WHERE 1=1${branchOrgId && branchOrgId !== "ALL" ? " AND s.org_id = ?" : ""}`;
    if (branchOrgId && branchOrgId !== "ALL") params.push(branchOrgId);

    sql += " ORDER BY id DESC";

    const rows = await query<any[]>(sql, params);

    const formattedRecords = rows.map((r: any) => {
      const isPaid = r.payroll_status === "Paid";
      return {
        id: r.id,
        name: r.name,
        role: r.role,
        department: r.department,
        salary: `₹${Number(r.salary).toLocaleString("en-IN")}`,
        payPeriod: r.pay_period || new Date().toLocaleDateString("en-US", { month: "short", year: "numeric" }),
        paymentDate: r.payment_date || (isPaid ? "Paid Today" : `Pending (Due 01 ${new Date().toLocaleDateString("en-US", { month: "short"})})`),
        accountNo: r.account_no || "",
        status: isPaid ? "Paid" : "Pending",
        statusColor: isPaid ? "#16a34a" : "#d97706",
        statusBg: isPaid ? "#dcfce7" : "#fef3c7",
        avatar: r.avatar || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80",
      };
    });

    return res.json({ success: true, records: formattedRecords });
  } catch (err: any) {
    console.error("GET /api/payroll error:", err);
    return res.status(500).json({ success: false, error: "Failed to fetch payroll records." });
  }
});

// PUT /api/payroll/:id (Mark as Paid/Pending in employees and staff tables)
router.put("/:id", async (req: AuthedRequest, res) => {
  try {
    const { id } = req.params;
    const { status, paymentDate, orgId, amount, baseSalary, deduction, month, transactionRef, notes } = req.body ?? {};

    let branchOrgId: string | null = null;
    try {
      branchOrgId = enforceOrgIsolation(req, orgId);
    } catch (e: any) {
      return res.status(403).json({ success: false, message: e.message });
    }

    const recStatus = status === "Paid" ? "Paid" : "Pending";
    const now = new Date();
    const formattedDateTime = paymentDate || (recStatus === "Paid" 
      ? `Paid on ${now.toLocaleDateString("en-GB", { day: '2-digit', month: 'short', year: 'numeric'})} at ${now.toLocaleTimeString("en-US", { hour: '2-digit', minute: '2-digit', hour12: true })}`
      : "Pending");

    // Ensure columns exist in employees table
    try { await query(`ALTER TABLE employees ADD COLUMN payment_time VARCHAR(100) DEFAULT NULL`); } catch (e: any) {}
    try { await query(`ALTER TABLE employees ADD COLUMN last_paid_amount DECIMAL(10,2) DEFAULT NULL`); } catch (e: any) {}
    try { await query(`ALTER TABLE employees ADD COLUMN salary_history_json LONGTEXT DEFAULT NULL`); } catch (e: any) {}
    
    // Ensure columns exist in staff table
    try { await query(`ALTER TABLE staff ADD COLUMN payroll_status VARCHAR(50) DEFAULT 'Pending'`); } catch (e: any) {}
    try { await query(`ALTER TABLE staff ADD COLUMN payment_date VARCHAR(100) DEFAULT NULL`); } catch (e: any) {}
    try { await query(`ALTER TABLE staff ADD COLUMN payment_time VARCHAR(100) DEFAULT NULL`); } catch (e: any) {}
    try { await query(`ALTER TABLE staff ADD COLUMN last_paid_amount DECIMAL(10,2) DEFAULT NULL`); } catch (e: any) {}
    try { await query(`ALTER TABLE staff ADD COLUMN salary_history_json LONGTEXT DEFAULT NULL`); } catch (e: any) {}

    // Find employee by id, staff_id, or employee_code
    const empRows = await query<any[]>(
      `SELECT * FROM employees WHERE id = ? OR employee_code = ? OR name = ?`,
      [id, id, id]
    );

    const staffRows = await query<any[]>(
      `SELECT * FROM staff WHERE id = ? OR staff_id = ? OR name = ?`,
      [id, id, id]
    );

    const employeeRecord = empRows[0] || staffRows[0] || null;
    const finalAmount = amount !== undefined ? Number(amount) : (employeeRecord?.salary ? Number(employeeRecord.salary) : 0);
    const txnRef = transactionRef || `TXN-SAL-${Date.now().toString().slice(-6)}`;

    // Build history entry
    const newHistoryEntry = {
      id: `PAY-${Date.now()}`,
      month: month || now.toISOString().slice(0, 7),
      amount: finalAmount,
      baseSalary: baseSalary !== undefined ? Number(baseSalary) : finalAmount,
      deduction: deduction !== undefined ? Number(deduction) : 0,
      paymentDate: formattedDateTime,
      status: recStatus,
      paidAt: now.toISOString(),
      transactionRef: txnRef,
      paidBy: req.userName || "Accountant",
      notes: notes || "Disbursed via Accountant portal",
    };

    // Update employees table
    if (empRows.length > 0) {
      let existingHistory: any[] = [];
      try {
        if (empRows[0].salary_history_json) {
          existingHistory = JSON.parse(empRows[0].salary_history_json);
        }
      } catch (e) {}
      if (!Array.isArray(existingHistory)) existingHistory = [];
      existingHistory.unshift(newHistoryEntry);

      await query(
        `UPDATE employees SET payroll_status = ?, payment_date = ?, payment_time = ?, last_paid_amount = ?, salary_history_json = ? WHERE id = ?`,
        [recStatus, formattedDateTime, now.toLocaleTimeString("en-US", { hour: '2-digit', minute: '2-digit', hour12: true }), finalAmount, JSON.stringify(existingHistory), empRows[0].id]
      );
    }

    // Update staff table
    if (staffRows.length > 0) {
      let existingHistory: any[] = [];
      try {
        if (staffRows[0].salary_history_json) {
          existingHistory = JSON.parse(staffRows[0].salary_history_json);
        }
      } catch (e) {}
      if (!Array.isArray(existingHistory)) existingHistory = [];
      existingHistory.unshift(newHistoryEntry);

      await query(
        `UPDATE staff SET payroll_status = ?, payment_date = ?, payment_time = ?, last_paid_amount = ?, salary_history_json = ? WHERE id = ?`,
        [recStatus, formattedDateTime, now.toLocaleTimeString("en-US", { hour: '2-digit', minute: '2-digit', hour12: true }), finalAmount, JSON.stringify(existingHistory), staffRows[0].id]
      );
    }

    return res.json({
      success: true,
      message: `Employee salary of ₹${finalAmount.toLocaleString("en-IN")} recorded as ${recStatus} successfully.`,
      paymentRecord: newHistoryEntry,
    });
  } catch (err: any) {
    console.error("PUT /api/payroll/:id error:", err);
    return res.status(500).json({ success: false, error: "Failed to update payroll status." });
  }
});

export default router;
