import { Router } from "express";
import bcrypt from "bcryptjs";
import { query } from "../db.js";
import { isValidEmail } from "../lib/auth.js";

const router = Router();

// Ensure users table schema has required staff columns
(async () => {
  try {
    await query("ALTER TABLE users ADD COLUMN phone VARCHAR(50) NULL");
  } catch {}
  try {
    await query("ALTER TABLE users ADD COLUMN staff_id VARCHAR(50) NULL");
  } catch {}
  try {
    await query("ALTER TABLE users ADD COLUMN org_id VARCHAR(50) NULL");
  } catch {}
  try {
    await query("ALTER TABLE users ADD COLUMN org_name VARCHAR(255) NULL");
  } catch {}
  try {
    await query("UPDATE users SET org_id = 'AS435', org_name = 'Ashirwad' WHERE (org_id IS NULL OR org_name IS NULL OR org_name = '') AND role NOT IN ('super_admin')");
  } catch {}
  try {
    await query("ALTER TABLE users ADD COLUMN username VARCHAR(100) NULL");
  } catch {}
  try {
    await query("ALTER TABLE employees ADD COLUMN username VARCHAR(100) NULL");
  } catch {}
})();

// GET /api/employees — Fetch staff list for an organization from MySQL DB
router.get("/", async (req, res) => {
  try {
    const { orgId, org } = req.query as { orgId?: string; org?: string };
    const targetOrgId = orgId || (org === "Ashirwad" ? "AS435" : org === "Cheery Clothing" ? "CH560" : org === "Matcha Tea" ? "MA330" : undefined);

    let sql = `
      SELECT id, name, email, username, role, phone, staff_id AS staffId, org_id AS orgId, org_name AS orgName, created_at AS createdAt
      FROM users 
      WHERE role NOT IN ('super_admin', 'user', 'manager', 'front_desk')
        AND role IN ('housekeeping', 'chef', 'accountant')
    `;
    const params: unknown[] = [];

    if (targetOrgId) {
      sql += " AND (org_id = ? OR org_name = ?)";
      params.push(targetOrgId, org || targetOrgId);
    } else if (org) {
      sql += " AND org_name = ?";
      params.push(org);
    }

    sql += " ORDER BY id ASC";

    const employees = await query(sql, params);
    return res.json({ success: true, employees });
  } catch (err: any) {
    console.error("GET /api/employees error:", err);
    return res.status(500).json({ success: false, error: "Failed to fetch employees." });
  }
});

// POST /api/employees — Create or update staff account in MySQL DB
router.post("/", async (req, res) => {
  try {
    const {
      name, email, password, role, phone, staffId, id, orgId, orgName, org,
      department, salary, accountNo, bankName, ifscCode, payrollStatus, payPeriod, paymentDate, gender
    } = req.body ?? {};

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, error: "Name, email and password are required." });
    }
    if (!isValidEmail(email)) {
      return res.status(400).json({ success: false, error: "Please enter a valid email address." });
    }

    const cleanEmail = email.toLowerCase().trim();
    const finalOrgName = orgName || org || (orgId === "AS435" ? "Ashirwad" : orgId === "CH560" ? "Cheery Clothing" : orgId === "MA330" ? "Matcha Tea" : "Ashirwad");
    const finalOrgId = orgId || (finalOrgName === "Ashirwad" ? "AS435" : finalOrgName === "Cheery Clothing" ? "CH560" : finalOrgName === "Matcha Tea" ? "MA330" : "AS435");
    const finalStaffId = staffId || (typeof id === "string" && id.includes("-") ? id : `EMP-${Date.now().toString().slice(-6)}`);
    const finalRole = role || "manager";
    const passwordHash = await bcrypt.hash(password, 10);
    const finalDept = department || "General";
    const finalSalary = salary ? Number(String(salary).replace(/[^0-9.-]+/g,"")) || 0 : 0;
    const finalAccount = accountNo || null;
    const finalBankName = bankName || null;
    const finalIfsc = ifscCode || null;
    const finalPayrollStatus = payrollStatus || "Pending";
    const finalPayPeriod = payPeriod || null;
    const finalPaymentDate = paymentDate || null;
    const finalGender = gender || null;
    // 1. UPDATE EXISTING STAFF RECORD BY EXPLICIT DATABASE ID (numeric DB id or staff_id match if editing)

    // 1. UPDATE EXISTING STAFF RECORD BY EXPLICIT DATABASE ID
    if (id && typeof id === "number") {
      await query(
        `UPDATE users 
         SET name = ?, email = ?, password_hash = ?, role = ?, phone = ?, staff_id = ?, org_id = ?, org_name = ?
         WHERE id = ?`,
        [name.trim(), cleanEmail, passwordHash, finalRole, phone || null, finalStaffId, finalOrgId, finalOrgName, id]
      );
      
      try {
        await query(
          `UPDATE employees 
           SET department = ?, salary = ?, account_no = ?, bank_name = ?, ifsc_code = ?, payroll_status = ?, pay_period = ?, payment_date = ?, gender = ?, name = ?, role = ?, phone = ?, email = ?, org = ?, org_id = ?
           WHERE employee_code = ? OR email = ?`,
          [finalDept, finalSalary, finalAccount, finalBankName, finalIfsc, finalPayrollStatus, finalPayPeriod, finalPaymentDate, finalGender, name.trim(), finalRole, phone || null, cleanEmail, finalOrgName, finalOrgId, finalStaffId, cleanEmail]
        );
      } catch (err: any) {
        console.warn("Failed to sync staff details to employees table:", err.message);
      }
      
      // Update linked payroll records to match the new name/role
      try {
        await query(
          `UPDATE payroll_records SET employee_name = ?, role = ? WHERE employee_id = ?`,
          [name.trim(), finalRole, id]
        );
      } catch (err: any) {
        console.warn("Failed to sync staff update to payroll records:", err.message);
      }
      
      return res.json({
        success: true,
        message: `Staff '${name}' updated in database for ${finalOrgName}.`,
        employee: {
          id: id,
          name: name.trim(),
          email: cleanEmail,
          role: finalRole,
          phone,
          staffId: finalStaffId,
          orgId: finalOrgId,
          orgName: finalOrgName,
        },
      });
    }

    // 2. NEW STAFF CREATION: Check if EMAIL already exists in database for a DIFFERENT user
    const existingEmail = await query<any>("SELECT id, org_name FROM users WHERE LOWER(email) = ? LIMIT 1", [cleanEmail]);
    if (existingEmail.length > 0) {
      return res.status(400).json({
        success: false,
        error: `Staff account with email '${cleanEmail}' already exists in organization '${existingEmail[0].org_name || "another org"}'. Email must be unique.`,
      });
    }

    // 3. NEW STAFF CREATION: Check if STAFF_ID already exists in database
    const existingStaffId = await query<any>("SELECT id FROM users WHERE staff_id = ? LIMIT 1", [finalStaffId]);
    if (existingStaffId.length > 0) {
      return res.status(400).json({
        success: false,
        error: `Staff member with Employee ID '${finalStaffId}' already exists. Employee ID must be unique.`,
      });
    }

    // Insert new staff user in MySQL DB (allows duplicate staff names across different or same organizations)
    const result: any = await query(
      `INSERT INTO users (name, email, password_hash, role, phone, staff_id, org_id, org_name)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [name.trim(), cleanEmail, passwordHash, finalRole, phone || null, finalStaffId, finalOrgId, finalOrgName]
    );

    // Also sync/insert into employees table if present
    try {
      await query(
        `INSERT INTO employees (employee_code, name, email, role, phone, department, salary, account_no, bank_name, ifsc_code, payroll_status, pay_period, payment_date, gender, org, org_id, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Active')
         ON DUPLICATE KEY UPDATE name = VALUES(name), role = VALUES(role), phone = VALUES(phone), department = VALUES(department), salary = VALUES(salary), account_no = VALUES(account_no), bank_name = VALUES(bank_name), ifsc_code = VALUES(ifsc_code), payroll_status = VALUES(payroll_status), pay_period = VALUES(pay_period), payment_date = VALUES(payment_date), gender = VALUES(gender), org = VALUES(org), org_id = VALUES(org_id)`,
        [finalStaffId, name.trim(), cleanEmail, finalRole, phone || null, finalDept, finalSalary, finalAccount, finalBankName, finalIfsc, finalPayrollStatus, finalPayPeriod, finalPaymentDate, finalGender, finalOrgName, finalOrgId]
      );
    } catch (err: any) {
        console.warn("Failed to sync staff into employees table:", err.message);
    }

    return res.status(201).json({
      success: true,
      message: `Staff '${name}' created in database for ${finalOrgName}.`,
      employee: {
        id: result.insertId,
        name: name.trim(),
        email: cleanEmail,
        role: finalRole,
        phone,
        staffId: finalStaffId,
        orgId: finalOrgId,
        orgName: finalOrgName,
      },
    });
  } catch (err: any) {
    console.error("POST /api/employees error:", err);
    return res.status(500).json({ success: false, error: "Failed to save employee to database." });
  }
});

// DELETE /api/employees/:id — Delete staff from MySQL DB
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const numId = isNaN(Number(id)) ? 0 : Number(id);
    await query("DELETE FROM users WHERE id = ? OR staff_id = ?", [numId, id]);
    await query("DELETE FROM employees WHERE employee_code = ?", [id]).catch(() => {});
    await query("DELETE FROM staff WHERE id = ? OR staff_id = ?", [numId, id]).catch(() => {});

    const isNumeric = !isNaN(Number(id)) && id.trim() !== "";
    
    let staffIdToDelete = id;
    if ((req as any).userRole !== "super_admin" && (req as any).userRole !== "admin") {
      const sqlSelect = isNumeric ? "SELECT org_id, staff_id FROM users WHERE id = ? OR staff_id = ?" : "SELECT org_id, staff_id FROM users WHERE staff_id = ?";
      const selectParams = isNumeric ? [Number(id), id] : [id];
      const existingUser = await query<any>(sqlSelect, selectParams);
      if (existingUser.length > 0) {
        if (existingUser[0].org_id !== (req as any).userOrgCode) {
           return res.status(403).json({ success: false, error: "Unauthorized to delete staff from another organization." });
        }
        staffIdToDelete = existingUser[0].staff_id;
      }
    } else {
      const sqlSelect = isNumeric ? "SELECT staff_id FROM users WHERE id = ? OR staff_id = ?" : "SELECT staff_id FROM users WHERE staff_id = ?";
      const selectParams = isNumeric ? [Number(id), id] : [id];
      const existingUser = await query<any>(sqlSelect, selectParams);
      if (existingUser.length > 0) {
        staffIdToDelete = existingUser[0].staff_id;
      }
    }
    
    await query("DELETE FROM employees WHERE employee_code = ?", [staffIdToDelete]);
    const sqlDelete = isNumeric ? "DELETE FROM users WHERE id = ? OR staff_id = ?" : "DELETE FROM users WHERE staff_id = ?";
    const deleteParams = isNumeric ? [Number(id), id] : [id];
    await query(sqlDelete, deleteParams);

    return res.json({ success: true, message: "Staff deleted from database." });
  } catch (err: any) {
    console.error("DELETE /api/employees error:", err);
    return res.status(500).json({ success: false, error: "Failed to delete employee." });
  }
});

export default router;
