import "dotenv/config";
import { query } from "../db.js";

const DEFAULT_EMPLOYEES: any[] = [];
const DEFAULT_PAYROLL_RECORDS: any[] = [];

export async function initPayrollSchema() {
  try {
    console.log("🔄 Initializing Employees & Payroll tables...");

    // 1. Create employees table
    await query(`
      CREATE TABLE IF NOT EXISTS employees (
        id             INT UNSIGNED NOT NULL AUTO_INCREMENT,
        employee_code  VARCHAR(50) NOT NULL,
        name           VARCHAR(255) NOT NULL,
        email          VARCHAR(255) NOT NULL,
        role           VARCHAR(100) NOT NULL,
        department     VARCHAR(100) DEFAULT 'General',
        salary         DECIMAL(10,2) NOT NULL DEFAULT 0.00,
        account_no     VARCHAR(255) DEFAULT NULL,
        phone          VARCHAR(100) DEFAULT NULL,
        status         VARCHAR(50) NOT NULL DEFAULT 'Active',
        avatar         TEXT DEFAULT NULL,
        org            VARCHAR(255) DEFAULT NULL,
        org_id         VARCHAR(50) DEFAULT NULL,
        created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY uq_employee_email (email)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 2. Drop legacy payroll_records table
    await query(`DROP TABLE IF EXISTS payroll_records;`);

    // Ensure columns exist if tables were already created
    try { await query(`ALTER TABLE employees ADD COLUMN org_id VARCHAR(50) DEFAULT NULL`); } catch (e: any) {}
    try { await query(`ALTER TABLE employees ADD COLUMN pay_period VARCHAR(100) DEFAULT NULL`); } catch (e: any) {}
    try { await query(`ALTER TABLE employees ADD COLUMN payment_date VARCHAR(100) DEFAULT NULL`); } catch (e: any) {}
    try { await query(`ALTER TABLE employees ADD COLUMN payroll_status VARCHAR(50) DEFAULT 'Pending'`); } catch (e: any) {}
    try { await query(`ALTER TABLE employees ADD COLUMN bank_name VARCHAR(255) DEFAULT NULL`); } catch (e: any) {}
    try { await query(`ALTER TABLE employees ADD COLUMN ifsc_code VARCHAR(100) DEFAULT NULL`); } catch (e: any) {}
    try { await query(`ALTER TABLE employees ADD COLUMN gender VARCHAR(50) DEFAULT NULL`); } catch (e: any) {}

    // Seed employees if empty
    const empExisting = await query<any>("SELECT COUNT(*) AS count FROM employees");
    if (Number(empExisting[0]?.count || 0) === 0) {
      for (const emp of DEFAULT_EMPLOYEES) {
        await query(
          `INSERT INTO employees 
          (employee_code, name, email, role, department, salary, account_no, phone, status, avatar)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            emp.employee_code,
            emp.name,
            emp.email,
            emp.role,
            emp.department,
            emp.salary,
            emp.account_no,
            emp.phone,
            emp.status,
            emp.avatar,
          ]
        );
      }
      console.log("✅ Seeded initial employees into database.");
    }
  } catch (error: any) {
    console.warn("⚠️ Warning during initPayrollSchema:", error.message);
  }
}
