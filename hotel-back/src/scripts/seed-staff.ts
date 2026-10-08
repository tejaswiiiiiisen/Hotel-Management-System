import "dotenv/config";
import mysql from "mysql2/promise";

import { PERMANENT_STAFF_MEMBERS } from "../routes/staff.js";

function connectionConfig(): mysql.ConnectionOptions {
  return {
    host: process.env.MYSQL_HOST || "localhost",
    port: Number(process.env.MYSQL_PORT || 3306),
    user: process.env.MYSQL_USER || "root",
    password: process.env.MYSQL_PASSWORD || "",
    database: process.env.MYSQL_DATABASE || "hotel_website",
  };
}

export async function seedStaffData() {
  const config = connectionConfig();
  const conn = await mysql.createConnection(config);
  console.log("🌱 Seeding Staff members for all organizations (Matcha Tea, Cheery Clothing, Ashirwad)...");

  // Ensure staff table exists
  await conn.query(`
    CREATE TABLE IF NOT EXISTS staff (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      staff_id VARCHAR(50) NOT NULL,
      name VARCHAR(255) NOT NULL,
      role VARCHAR(100) NOT NULL,
      department VARCHAR(100) NOT NULL,
      shift VARCHAR(100) NOT NULL DEFAULT 'Morning (07:00 - 15:00)',
      status VARCHAR(50) NOT NULL DEFAULT 'Active',
      assigned_area VARCHAR(255) DEFAULT 'Main Building',
      work_status VARCHAR(50) NOT NULL DEFAULT 'On Duty',
      phone VARCHAR(50) DEFAULT NULL,
      email VARCHAR(255) DEFAULT NULL,
      org_id VARCHAR(50) NOT NULL DEFAULT 'MA330',
      org_name VARCHAR(255) NOT NULL DEFAULT 'Matcha Tea',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  // Ensure org_id and org_name exist on staff, employees, and users tables if missing
  try { await conn.query("ALTER TABLE staff ADD COLUMN org_id VARCHAR(50) NULL"); } catch {}
  try { await conn.query("ALTER TABLE staff ADD COLUMN org_name VARCHAR(255) NULL"); } catch {}
  try { await conn.query("ALTER TABLE employees ADD COLUMN org_id VARCHAR(50) NULL"); } catch {}
  try { await conn.query("ALTER TABLE employees ADD COLUMN org_name VARCHAR(255) NULL"); } catch {}
  try { await conn.query("ALTER TABLE users ADD COLUMN org_id VARCHAR(50) NULL"); } catch {}
  try { await conn.query("ALTER TABLE users ADD COLUMN org_name VARCHAR(255) NULL"); } catch {}

  await conn.query("SET FOREIGN_KEY_CHECKS = 0");
  await conn.query("TRUNCATE TABLE staff");
  await conn.query("SET FOREIGN_KEY_CHECKS = 1");
  console.log("Cleared existing staff table.");

  const staffMembers = PERMANENT_STAFF_MEMBERS;

  for (const s of staffMembers) {
    await conn.query(
      `INSERT INTO staff
         (staff_id, name, role, department, shift, status, assigned_area, work_status, phone, email, org_id, org_name)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        s.staff_id,
        s.name,
        s.role,
        s.department,
        s.shift,
        s.status,
        s.assigned_area,
        s.work_status,
        s.phone,
        s.email,
        s.org_id,
        s.org_name,
      ]
    );

    // Also sync/insert into employees table
    try {
      await conn.query(
        `INSERT INTO employees (employee_code, name, email, role, department, phone, status, org, org_id, org_name)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE name = VALUES(name), role = VALUES(role), department = VALUES(department), phone = VALUES(phone), org = VALUES(org), org_id = VALUES(org_id), org_name = VALUES(org_name)`,
        [s.staff_id, s.name, s.email, s.role, s.department, s.phone, s.status, s.org_name, s.org_id, s.org_name]
      );
    } catch {}

    // Also sync/insert into users table
    try {
      await conn.query(
        `INSERT INTO users (name, email, password_hash, role, phone, staff_id, org_id, org_name)
         VALUES (?, ?, '$2a$10$w8T0M4j6l8084hNq32488.2a9m2c0/7w676u/025983794711311.', 'manager', ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE name = VALUES(name), org_id = VALUES(org_id), org_name = VALUES(org_name), staff_id = VALUES(staff_id)`,
        [s.name, s.email, s.phone, s.staff_id, s.org_id, s.org_name]
      );
    } catch {}

    console.log(
      `+ Staff ID: ${s.staff_id} | Name: ${s.name} | Dept: ${s.department} | Shift: ${s.shift} | Status: ${s.status} | Area: ${s.assigned_area} | WorkStatus: ${s.work_status} | Org: ${s.org_name} (${s.org_id})`
    );
  }

  console.log(`\n🎉 Successfully seeded ${staffMembers.length} staff members into database across all organizations!`);
  await conn.end();
  process.exit(0);
}

run().catch((err) => {
  console.error("Staff seed failed:", err);
  process.exit(1);
});

function run() {
  return seedStaffData();
}
