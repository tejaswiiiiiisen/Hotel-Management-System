import { Router } from "express";
import bcrypt from "bcryptjs";
import { query } from "../db.js";

const router = Router();

// Auto-initialize `staff` table schema in MySQL
(async () => {
  try {
    await query(`
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
        salary DECIMAL(12,2) DEFAULT NULL,
        joining_date DATE DEFAULT NULL,
        org_id VARCHAR(50) NOT NULL DEFAULT 'MA330',
        org_name VARCHAR(255) NOT NULL DEFAULT 'Matcha Tea',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS staff_attendance (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        org_id VARCHAR(50) NOT NULL DEFAULT 'MA330',
        staff_id VARCHAR(50) NOT NULL,
        staff_name VARCHAR(255) NOT NULL,
        staff_email VARCHAR(255) DEFAULT NULL,
        date DATE NOT NULL,
        shift VARCHAR(100) DEFAULT 'Morning (07:00 - 15:00)',
        assigned_area VARCHAR(255) DEFAULT '1st Floor & Suites',
        clock_in VARCHAR(50) DEFAULT NULL,
        clock_out VARCHAR(50) DEFAULT NULL,
        duration_minutes INT DEFAULT 0,
        status VARCHAR(50) NOT NULL DEFAULT 'On Duty',
        notes TEXT DEFAULT NULL,
        override_by VARCHAR(255) DEFAULT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uq_staff_date (org_id, staff_id, date)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS staff_leaves (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        org_id VARCHAR(50) NOT NULL DEFAULT 'MA330',
        staff_id VARCHAR(50) NOT NULL,
        staff_name VARCHAR(255) NOT NULL,
        staff_email VARCHAR(255) DEFAULT NULL,
        leave_type VARCHAR(100) NOT NULL DEFAULT 'Casual Leave',
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        reason TEXT DEFAULT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'Pending',
        action_by VARCHAR(255) DEFAULT NULL,
        action_at VARCHAR(100) DEFAULT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Ensure columns exist if table was already created
    try { await query("ALTER TABLE staff ADD COLUMN staff_id VARCHAR(50) NULL"); } catch {}
    try { await query("ALTER TABLE staff ADD COLUMN department VARCHAR(100) NULL"); } catch {}
    try { await query("ALTER TABLE staff ADD COLUMN shift VARCHAR(100) NULL"); } catch {}
    try { await query("ALTER TABLE staff ADD COLUMN assigned_area VARCHAR(255) NULL"); } catch {}
    try { await query("ALTER TABLE staff ADD COLUMN work_status VARCHAR(50) NULL"); } catch {}
    try { await query("ALTER TABLE staff ADD COLUMN org_id VARCHAR(50) NULL"); } catch {}
    try { await query("ALTER TABLE staff ADD COLUMN org_name VARCHAR(255) NULL"); } catch {}
    try { await query("ALTER TABLE staff ADD COLUMN salary DECIMAL(12,2) NULL"); } catch {}
    try { await query("ALTER TABLE staff ADD COLUMN joining_date DATE NULL"); } catch {}
    try { await query("ALTER TABLE staff ADD COLUMN assigned_work VARCHAR(255) NULL"); } catch {}
    try { await query("ALTER TABLE staff ADD COLUMN username VARCHAR(100) NULL"); } catch {}
    try { await query("ALTER TABLE staff ADD COLUMN password VARCHAR(100) NULL"); } catch {}
    try { await query("ALTER TABLE users ADD COLUMN staff_id VARCHAR(50) NULL"); } catch {}
    try { await query("ALTER TABLE users ADD COLUMN org_id VARCHAR(50) NULL"); } catch {}
    try { await query("ALTER TABLE users ADD COLUMN org_name VARCHAR(255) NULL"); } catch {}
    try { await query("ALTER TABLE users ADD COLUMN username VARCHAR(100) NULL"); } catch {}
    try { await query("ALTER TABLE employees ADD COLUMN username VARCHAR(100) NULL"); } catch {}
  } catch (e: any) {
    console.warn("Staff & Attendance table init error:", e.message);
  }

  // Auto-seed permanent real housekeeping, kitchen & accounting staff (5 per department = 15 total per org)
  try {
    await seedPermanentStaffData();
  } catch (err: any) {
    console.warn("Failed initial staff seed:", err.message);
  }
})();

export const PERMANENT_STAFF_MEMBERS = [
  // ==========================================
  // 1. MATCHA TEA (MA330) — 15 EMPLOYEES
  // ==========================================
  // HOUSEKEEPING (5 EMPLOYEES)
  {
    staff_id: "HK-101",
    name: "Sunita Devi",
    username: "sunita.devi",
    password: "matcha123",
    role: "housekeeping",
    department: "Housekeeping",
    shift: "Morning (07:00 AM - 03:30 PM)",
    status: "Active",
    assigned_area: "1st & 2nd Floor Rooms",
    assigned_work: "1st & 2nd Floor Room Turnover & Sanitization (Rooms 101, 102)",
    work_status: "On Duty",
    phone: "+91 98765 43213",
    email: "sunita.hk@hotel.com",
    salary: 26000,
    joining_date: "2025-02-10",
    org_id: "MA330",
    org_name: "Matcha Tea",
    clock_in: "07:05 AM",
  },
  {
    staff_id: "HK-102",
    name: "Ramesh Kumar",
    username: "ramesh.kumar",
    password: "matcha123",
    role: "housekeeping",
    department: "Housekeeping",
    shift: "Morning (07:00 AM - 03:30 PM)",
    status: "Active",
    assigned_area: "3rd & 4th Floor Rooms",
    assigned_work: "3rd & 4th Floor Deep Clean & Inspection (Rooms 104, 105)",
    work_status: "On Duty",
    phone: "+91 98765 43214",
    email: "ramesh.hk@hotel.com",
    salary: 24000,
    joining_date: "2025-03-01",
    org_id: "MA330",
    org_name: "Matcha Tea",
    clock_in: "07:12 AM",
  },
  {
    staff_id: "HK-103",
    name: "Anita Sharma",
    username: "anita.sharma",
    password: "matcha123",
    role: "housekeeping",
    department: "Housekeeping",
    shift: "Morning (07:00 AM - 03:30 PM)",
    status: "Active",
    assigned_area: "Suites & VIP Rooms",
    assigned_work: "VIP Suites & Executive Floor Refresh (Room 1001)",
    work_status: "On Duty",
    phone: "+91 98765 43215",
    email: "anita.hk@hotel.com",
    salary: 25000,
    joining_date: "2025-03-15",
    org_id: "MA330",
    org_name: "Matcha Tea",
    clock_in: "06:58 AM",
  },
  {
    staff_id: "HK-104",
    name: "Kavita Rao",
    username: "kavita.rao",
    password: "matcha123",
    role: "housekeeping",
    department: "Housekeeping",
    shift: "Evening (03:00 PM - 11:30 PM)",
    status: "Active",
    assigned_area: "5th to 8th Floor Rooms",
    assigned_work: "Evening Turndown & Linen Refresh (Rooms 107, 108)",
    work_status: "On Duty",
    phone: "+91 98765 43216",
    email: "kavita.hk@hotel.com",
    salary: 23500,
    joining_date: "2025-04-12",
    org_id: "MA330",
    org_name: "Matcha Tea",
    clock_in: null,
  },
  {
    staff_id: "HK-105",
    name: "Vikas Joshi",
    username: "vikas.joshi",
    password: "matcha123",
    role: "housekeeping",
    department: "Housekeeping",
    shift: "Night (11:00 PM - 07:30 AM)",
    status: "Active",
    assigned_area: "Public Areas & Deep Clean",
    assigned_work: "Lobby, Lounge & Public Restrooms Sanitization",
    work_status: "On Duty",
    phone: "+91 98765 43217",
    email: "vikas.hk@hotel.com",
    salary: 24500,
    joining_date: "2025-05-18",
    org_id: "MA330",
    org_name: "Matcha Tea",
    clock_in: null,
  },
  // KITCHEN (5 EMPLOYEES)
  {
    staff_id: "KIT-101",
    name: "Sanjeev Kapoor",
    username: "sanjeev.kapoor",
    password: "matcha123",
    role: "chef",
    department: "Kitchen",
    shift: "Morning (07:00 - 15:30)",
    status: "Active",
    assigned_area: "Main Kitchen & Fine Dining",
    assigned_work: "Head Chef: Menu Planning & Breakfast/Dinner Buffet",
    work_status: "On Duty",
    phone: "+91 98765 44001",
    email: "sanjeev.chef@hotel.com",
    salary: 65000,
    joining_date: "2025-01-10",
    org_id: "MA330",
    org_name: "Matcha Tea",
    clock_in: "06:45 AM",
  },
  {
    staff_id: "KIT-102",
    name: "Rahul Rawat",
    username: "rahul.rawat",
    password: "matcha123",
    role: "chef",
    department: "Kitchen",
    shift: "Evening (15:00 - 23:30)",
    status: "Active",
    assigned_area: "Hot Kitchen & Grills",
    assigned_work: "Sous Chef: Hot Kitchen, Tandoor & Room Service KOTs",
    work_status: "On Duty",
    phone: "+91 98765 44002",
    email: "rahul.cook@hotel.com",
    salary: 42000,
    joining_date: "2025-02-15",
    org_id: "MA330",
    org_name: "Matcha Tea",
    clock_in: "02:50 PM",
  },
  {
    staff_id: "KIT-103",
    name: "Manjeet Kaur",
    username: "manjeet.kaur",
    password: "matcha123",
    role: "chef",
    department: "Kitchen",
    shift: "Morning (06:00 - 14:30)",
    status: "Active",
    assigned_area: "Bakery & Cold Pantry",
    assigned_work: "Pastry & Cold Pantry: Fresh Bakes, Desserts & Salads",
    work_status: "On Duty",
    phone: "+91 98765 44003",
    email: "manjeet.bakery@hotel.com",
    salary: 38000,
    joining_date: "2025-03-20",
    org_id: "MA330",
    org_name: "Matcha Tea",
    clock_in: "05:55 AM",
  },
  {
    staff_id: "KIT-104",
    name: "Vikram Malhotra",
    username: "vikram.malhotra",
    password: "matcha123",
    role: "chef",
    department: "Kitchen",
    shift: "Evening (15:00 - 23:30)",
    status: "Active",
    assigned_area: "Live Counter & Banquet",
    assigned_work: "Line Cook & Grill Specialist: Live Counter & Fast Orders",
    work_status: "On Duty",
    phone: "+91 98765 44004",
    email: "vikram.chef@hotel.com",
    salary: 36000,
    joining_date: "2025-04-01",
    org_id: "MA330",
    org_name: "Matcha Tea",
    clock_in: "03:00 PM",
  },
  {
    staff_id: "KIT-105",
    name: "Deepak Negi",
    username: "deepak.negi",
    password: "matcha123",
    role: "chef",
    department: "Kitchen",
    shift: "Morning (07:00 - 15:30)",
    status: "Active",
    assigned_area: "Buffet Prep & Cold Pantry",
    assigned_work: "Breakfast Buffet Station, Pantry Prep & Ingredient Quality Check",
    work_status: "On Duty",
    phone: "+91 98765 44005",
    email: "deepak.chef@hotel.com",
    salary: 33000,
    joining_date: "2025-04-15",
    org_id: "MA330",
    org_name: "Matcha Tea",
    clock_in: "06:30 AM",
  },
  // ACCOUNTING (5 EMPLOYEES)
  {
    staff_id: "ACC-101",
    name: "Priya Sharma",
    username: "priya.sharma",
    password: "matcha123",
    role: "accountant",
    department: "Accounting",
    shift: "General (09:00 - 18:00)",
    status: "Active",
    assigned_area: "Finance & Audit Desk",
    assigned_work: "Daily Ledger Balancing, GST Tax Audits & Cash Reports",
    work_status: "On Duty",
    phone: "+91 98765 43212",
    email: "accountant@hotel.com",
    salary: 52000,
    joining_date: "2025-02-01",
    org_id: "MA330",
    org_name: "Matcha Tea",
    clock_in: "08:50 AM",
  },
  {
    staff_id: "ACC-102",
    name: "Amit Patel",
    username: "amit.patel",
    password: "matcha123",
    role: "accountant",
    department: "Accounting",
    shift: "General (09:00 - 18:00)",
    status: "Active",
    assigned_area: "Invoicing & Billing Desk",
    assigned_work: "Guest Folio Invoicing & POS Cash Register Management",
    work_status: "On Duty",
    phone: "+91 98765 45002",
    email: "amit.billing@hotel.com",
    salary: 40000,
    joining_date: "2025-03-01",
    org_id: "MA330",
    org_name: "Matcha Tea",
    clock_in: "08:55 AM",
  },
  {
    staff_id: "ACC-103",
    name: "Divya Mehra",
    username: "divya.mehra",
    password: "matcha123",
    role: "accountant",
    department: "Accounting",
    shift: "General (09:00 - 18:00)",
    status: "Active",
    assigned_area: "Audit & Payroll Desk",
    assigned_work: "Monthly Payroll Reconciliation & Supplier Ledger Audits",
    work_status: "On Duty",
    phone: "+91 98765 45003",
    email: "divya.acc@hotel.com",
    salary: 46000,
    joining_date: "2025-03-10",
    org_id: "MA330",
    org_name: "Matcha Tea",
    clock_in: "09:00 AM",
  },
  {
    staff_id: "ACC-104",
    name: "Rajesh Singhania",
    username: "rajesh.singhania",
    password: "matcha123",
    role: "accountant",
    department: "Accounting",
    shift: "General (09:00 - 18:00)",
    status: "Active",
    assigned_area: "Tax & Compliance Office",
    assigned_work: "TDS Filings, Corporate Tax Reconciliation & Quarterly Reviews",
    work_status: "On Duty",
    phone: "+91 98765 45004",
    email: "rajesh.acc@hotel.com",
    salary: 48000,
    joining_date: "2025-03-15",
    org_id: "MA330",
    org_name: "Matcha Tea",
    clock_in: "08:55 AM",
  },
  {
    staff_id: "ACC-105",
    name: "Neha Bansal",
    username: "neha.bansal",
    password: "matcha123",
    role: "accountant",
    department: "Accounting",
    shift: "General (09:00 - 18:00)",
    status: "Active",
    assigned_area: "Front Desk Cash Counter",
    assigned_work: "Daily Shift Float Reconciliation & Credit Card Settlement",
    work_status: "On Duty",
    phone: "+91 98765 45005",
    email: "neha.acc@hotel.com",
    salary: 37000,
    joining_date: "2025-04-01",
    org_id: "MA330",
    org_name: "Matcha Tea",
    clock_in: "09:05 AM",
  },

  // ==========================================
  // 2. ASHIRWAD (AS435) — 15 EMPLOYEES
  // ==========================================
  // HOUSEKEEPING (5 EMPLOYEES)
  {
    staff_id: "HK-ASH-101",
    name: "Kavita Shinde",
    username: "kavita.shinde",
    password: "ashirwad123",
    role: "housekeeping",
    department: "Housekeeping",
    shift: "Morning (07:00 - 15:30)",
    status: "Active",
    assigned_area: "1st & 2nd Floor Wing",
    assigned_work: "1st & 2nd Floor Rooms Turnover & Linen Clean (Rooms 101-105)",
    work_status: "On Duty",
    phone: "+91 98000 44001",
    email: "kavita.s@ashirwad.com",
    salary: 28000,
    joining_date: "2025-01-15",
    org_id: "AS435",
    org_name: "Ashirwad",
    clock_in: "07:00 AM",
  },
  {
    staff_id: "HK-ASH-102",
    name: "Vikas Joshi",
    username: "vikas.joshi",
    password: "ashirwad123",
    role: "housekeeping",
    department: "Housekeeping",
    shift: "Evening (15:00 - 23:00)",
    status: "Active",
    assigned_area: "3rd & 4th Floor Wing",
    assigned_work: "3rd & 4th Floor Stayover Clean & Restock (Rooms 106-110)",
    work_status: "On Duty",
    phone: "+91 98000 44002",
    email: "vikas.j@ashirwad.com",
    salary: 26000,
    joining_date: "2025-02-01",
    org_id: "AS435",
    org_name: "Ashirwad",
    clock_in: null,
  },
  {
    staff_id: "HK-ASH-103",
    name: "Suresh Kumar",
    username: "suresh.kumar",
    password: "ashirwad123",
    role: "housekeeping",
    department: "Housekeeping",
    shift: "Morning (07:00 - 15:00)",
    status: "Active",
    assigned_area: "Lobby, Lawns & Banquet Halls",
    assigned_work: "Public Area Sanitization, Lobby, Restrooms & Lawn Maintenance",
    work_status: "On Duty",
    phone: "+91 98000 44003",
    email: "suresh.k@ashirwad.com",
    salary: 25000,
    joining_date: "2025-02-15",
    org_id: "AS435",
    org_name: "Ashirwad",
    clock_in: null,
  },
  {
    staff_id: "HK-ASH-104",
    name: "Radhika Nair",
    username: "radhika.nair",
    password: "ashirwad123",
    role: "housekeeping",
    department: "Housekeeping",
    shift: "Morning (07:00 - 15:00)",
    status: "Active",
    assigned_area: "Royal Villas & Suites",
    assigned_work: "Luxury Villa Deep Clean, Turndown & VIP Guest Amenities",
    work_status: "On Duty",
    phone: "+91 98000 44004",
    email: "radhika.n@ashirwad.com",
    salary: 27500,
    joining_date: "2025-03-01",
    org_id: "AS435",
    org_name: "Ashirwad",
    clock_in: "07:10 AM",
  },
  {
    staff_id: "HK-ASH-105",
    name: "Manoj Yadav",
    username: "manoj.yadav",
    password: "ashirwad123",
    role: "housekeeping",
    department: "Housekeeping",
    shift: "Night (23:00 - 07:00)",
    status: "Active",
    assigned_area: "Night Facility & Linen Laundry",
    assigned_work: "Night Sanitization, Emergency Turnovers & Laundry Facility",
    work_status: "On Duty",
    phone: "+91 98000 44005",
    email: "manoj.y@ashirwad.com",
    salary: 25500,
    joining_date: "2025-03-15",
    org_id: "AS435",
    org_name: "Ashirwad",
    clock_in: null,
  },
  // KITCHEN (5 EMPLOYEES)
  {
    staff_id: "KIT-ASH-101",
    name: "Ranveer Brar",
    username: "ranveer.brar",
    password: "ashirwad123",
    role: "chef",
    department: "Kitchen",
    shift: "Morning (07:00 - 15:30)",
    status: "Active",
    assigned_area: "Main Kitchen & Fine Dining",
    assigned_work: "Executive Chef: Royal Rajasthani & Continental Cuisine, Menu Planning",
    work_status: "On Duty",
    phone: "+91 98000 55001",
    email: "ranveer.b@ashirwad.com",
    salary: 68000,
    joining_date: "2025-01-10",
    org_id: "AS435",
    org_name: "Ashirwad",
    clock_in: "06:40 AM",
  },
  {
    staff_id: "KIT-ASH-102",
    name: "Ajay Chopra",
    username: "ajay.chopra",
    password: "ashirwad123",
    role: "chef",
    department: "Kitchen",
    shift: "Evening (15:00 - 23:30)",
    status: "Active",
    assigned_area: "Tandoor & Live Grill Station",
    assigned_work: "Sous Chef: Live Grill, Tandoor & Evening Dining Service",
    work_status: "On Duty",
    phone: "+91 98000 55002",
    email: "ajay.c@ashirwad.com",
    salary: 45000,
    joining_date: "2025-02-15",
    org_id: "AS435",
    org_name: "Ashirwad",
    clock_in: "02:45 PM",
  },
  {
    staff_id: "KIT-ASH-103",
    name: "Meenakshi Sharma",
    username: "meenakshi.sharma",
    password: "ashirwad123",
    role: "chef",
    department: "Kitchen",
    shift: "Morning (06:00 - 14:30)",
    status: "Active",
    assigned_area: "Pastry & Bakery Kitchen",
    assigned_work: "Pastry Chef: Breakfast Buffet & Artisanal Bakery Items",
    work_status: "On Duty",
    phone: "+91 98000 55003",
    email: "meenakshi.s@ashirwad.com",
    salary: 38000,
    joining_date: "2025-03-01",
    org_id: "AS435",
    org_name: "Ashirwad",
    clock_in: "05:50 AM",
  },
  {
    staff_id: "KIT-ASH-104",
    name: "Vikram Malhotra",
    username: "vikram.malhotra",
    password: "ashirwad123",
    role: "chef",
    department: "Kitchen",
    shift: "Evening (15:00 - 23:30)",
    status: "Active",
    assigned_area: "Hot Kitchen & Banquet Line",
    assigned_work: "Line Cook: Fast Order Processing, Sauce Station & Banquet Prep",
    work_status: "On Duty",
    phone: "+91 98000 55004",
    email: "vikram.m@ashirwad.com",
    salary: 36000,
    joining_date: "2025-03-20",
    org_id: "AS435",
    org_name: "Ashirwad",
    clock_in: "03:00 PM",
  },
  {
    staff_id: "KIT-ASH-105",
    name: "Sunil Verma",
    username: "sunil.verma",
    password: "ashirwad123",
    role: "chef",
    department: "Kitchen",
    shift: "Morning (07:00 - 15:30)",
    status: "Active",
    assigned_area: "Cold Kitchen & Salad Bar",
    assigned_work: "Salad Prep, Fresh Juices, Cold Pantry & HACCP Food Hygiene",
    work_status: "On Duty",
    phone: "+91 98000 55005",
    email: "sunil.v@ashirwad.com",
    salary: 32000,
    joining_date: "2025-04-01",
    org_id: "AS435",
    org_name: "Ashirwad",
    clock_in: "06:30 AM",
  },
  // ACCOUNTING (5 EMPLOYEES)
  {
    staff_id: "ACC-ASH-101",
    name: "Sanjay Rao",
    username: "sanjay.rao",
    password: "ashirwad123",
    role: "accountant",
    department: "Accounting",
    shift: "General (09:00 - 18:00)",
    status: "Active",
    assigned_area: "Finance & Audit Office",
    assigned_work: "Chief Accountant: Balance Sheets, GST Returns & Financial Audits",
    work_status: "On Duty",
    phone: "+91 98000 66001",
    email: "sanjay.r@ashirwad.com",
    salary: 55000,
    joining_date: "2025-01-15",
    org_id: "AS435",
    org_name: "Ashirwad",
    clock_in: "08:50 AM",
  },
  {
    staff_id: "ACC-ASH-102",
    name: "Pooja Agarwal",
    username: "pooja.agarwal",
    password: "ashirwad123",
    role: "accountant",
    department: "Accounting",
    shift: "General (09:00 - 18:00)",
    status: "Active",
    assigned_area: "Billing & Collections Desk",
    assigned_work: "Guest Billing, Folio Invoicing & Night Audit Verification",
    work_status: "On Duty",
    phone: "+91 98000 66002",
    email: "pooja.a@ashirwad.com",
    salary: 42000,
    joining_date: "2025-02-01",
    org_id: "AS435",
    org_name: "Ashirwad",
    clock_in: "08:55 AM",
  },
  {
    staff_id: "ACC-ASH-103",
    name: "Amit Patel",
    username: "amit.patel",
    password: "ashirwad123",
    role: "accountant",
    department: "Accounting",
    shift: "General (09:00 - 18:00)",
    status: "Active",
    assigned_area: "Accounts Payable Office",
    assigned_work: "Vendor Invoices, Purchase Orders & Supplier Payments Reconciliation",
    work_status: "On Duty",
    phone: "+91 98000 66003",
    email: "amit.p@ashirwad.com",
    salary: 40000,
    joining_date: "2025-02-20",
    org_id: "AS435",
    org_name: "Ashirwad",
    clock_in: "09:00 AM",
  },
  {
    staff_id: "ACC-ASH-104",
    name: "Divya Mehra",
    username: "divya.mehra",
    password: "ashirwad123",
    role: "accountant",
    department: "Accounting",
    shift: "General (09:00 - 18:00)",
    status: "Active",
    assigned_area: "Payroll & Compliance Desk",
    assigned_work: "Monthly Staff Payroll, PF / ESI Compliance & Employee Advances",
    work_status: "On Duty",
    phone: "+91 98000 66004",
    email: "divya.m@ashirwad.com",
    salary: 46000,
    joining_date: "2025-03-01",
    org_id: "AS435",
    org_name: "Ashirwad",
    clock_in: "09:00 AM",
  },
  {
    staff_id: "ACC-ASH-105",
    name: "Rohit Singh",
    username: "rohit.singh",
    password: "ashirwad123",
    role: "accountant",
    department: "Accounting",
    shift: "General (09:00 - 18:00)",
    status: "Active",
    assigned_area: "Cash Counter & Vault",
    assigned_work: "Daily Cash Inflow Tracking, Bank Deposits & POS Terminal Balancing",
    work_status: "On Duty",
    phone: "+91 98000 66005",
    email: "rohit.s@ashirwad.com",
    salary: 39000,
    joining_date: "2025-03-25",
    org_id: "AS435",
    org_name: "Ashirwad",
    clock_in: "08:55 AM",
  },

  // ==========================================
  // 3. CHEERY CLOTHING (CH560) — 15 EMPLOYEES
  // ==========================================
  // HOUSEKEEPING (5 EMPLOYEES)
  {
    staff_id: "HK-CH-201",
    name: "Rhea Kapoor",
    username: "rhea.kapoor",
    password: "cheery123",
    role: "housekeeping",
    department: "Housekeeping",
    shift: "Morning (07:00 - 15:00)",
    status: "Active",
    assigned_area: "Dressing Vanity Suites",
    assigned_work: "Wardrobe & VIP Suite Turnovers",
    work_status: "On Duty",
    phone: "+91 98111 20002",
    email: "rhea.k@cheeryclothing.com",
    salary: 30000,
    joining_date: "2025-02-05",
    org_id: "CH560",
    org_name: "Cheery Clothing",
    clock_in: "07:00 AM",
  },
  {
    staff_id: "HK-CH-202",
    name: "Tina Dsouza",
    username: "tina.dsouza",
    password: "cheery123",
    role: "housekeeping",
    department: "Housekeeping",
    shift: "Evening (15:00 - 23:00)",
    status: "Active",
    assigned_area: "Runway Lounge & Suites",
    assigned_work: "Public Area Sanitization & Evening Turnovers",
    work_status: "On Duty",
    phone: "+91 98111 20013",
    email: "tina.d@cheeryclothing.com",
    salary: 27000,
    joining_date: "2025-03-20",
    org_id: "CH560",
    org_name: "Cheery Clothing",
    clock_in: null,
  },
  {
    staff_id: "HK-CH-203",
    name: "Aakash Bose",
    username: "aakash.bose",
    password: "cheery123",
    role: "housekeeping",
    department: "Housekeeping",
    shift: "Morning (07:00 - 15:00)",
    status: "Active",
    assigned_area: "Lobby & Designer Suites",
    assigned_work: "Designer Suite Refresh & Public Restroom Disinfection",
    work_status: "On Duty",
    phone: "+91 98111 20014",
    email: "aakash.b@cheeryclothing.com",
    salary: 26500,
    joining_date: "2025-04-01",
    org_id: "CH560",
    org_name: "Cheery Clothing",
    clock_in: "07:15 AM",
  },
  {
    staff_id: "HK-CH-204",
    name: "Preeti Sen",
    username: "preeti.sen",
    password: "cheery123",
    role: "housekeeping",
    department: "Housekeeping",
    shift: "Evening (15:00 - 23:00)",
    status: "Active",
    assigned_area: "Boutique Fitting Suites",
    assigned_work: "Linen Exchange, Evening Restock & Fitting Suite Prep",
    work_status: "On Duty",
    phone: "+91 98111 20015",
    email: "preeti.s@cheeryclothing.com",
    salary: 26000,
    joining_date: "2025-04-15",
    org_id: "CH560",
    org_name: "Cheery Clothing",
    clock_in: null,
  },
  {
    staff_id: "HK-CH-205",
    name: "Mohan Lal",
    username: "mohan.lal",
    password: "cheery123",
    role: "housekeeping",
    department: "Housekeeping",
    shift: "Night (23:00 - 07:00)",
    status: "Active",
    assigned_area: "Night Facility & Stock Rooms",
    assigned_work: "Night Deep Clean, Stock Room Sanitization & Garbage Dispatch",
    work_status: "On Duty",
    phone: "+91 98111 20016",
    email: "mohan.l@cheeryclothing.com",
    salary: 25500,
    joining_date: "2025-05-01",
    org_id: "CH560",
    org_name: "Cheery Clothing",
    clock_in: null,
  },
  // KITCHEN (5 EMPLOYEES)
  {
    staff_id: "KIT-CH-201",
    name: "Manish Malhotra",
    username: "manish.malhotra",
    password: "cheery123",
    role: "chef",
    department: "Kitchen",
    shift: "Morning (07:00 - 15:30)",
    status: "Active",
    assigned_area: "Runway Cafe & Bar",
    assigned_work: "Executive Chef: Gourmet Fusion Cuisine & Special Tastings",
    work_status: "On Duty",
    phone: "+91 98111 20003",
    email: "manish.m@cheeryclothing.com",
    salary: 55000,
    joining_date: "2025-02-10",
    org_id: "CH560",
    org_name: "Cheery Clothing",
    clock_in: "07:00 AM",
  },
  {
    staff_id: "KIT-CH-202",
    name: "Karan Khurana",
    username: "karan.khurana",
    password: "cheery123",
    role: "chef",
    department: "Kitchen",
    shift: "Evening (15:00 - 23:30)",
    status: "Active",
    assigned_area: "Boutique Bistro",
    assigned_work: "Sous Chef: Evening Bistro & Beverages Prep",
    work_status: "On Duty",
    phone: "+91 98111 20012",
    email: "karan.k@cheeryclothing.com",
    salary: 40000,
    joining_date: "2025-03-15",
    org_id: "CH560",
    org_name: "Cheery Clothing",
    clock_in: "02:50 PM",
  },
  {
    staff_id: "KIT-CH-203",
    name: "Tara Dsouza",
    username: "tara.dsouza",
    password: "cheery123",
    role: "chef",
    department: "Kitchen",
    shift: "Morning (06:00 - 14:30)",
    status: "Active",
    assigned_area: "Bakery & Artisan Desserts",
    assigned_work: "Artisanal Pastries, Croissants & Coffee Service",
    work_status: "On Duty",
    phone: "+91 98111 20017",
    email: "tara.d@cheeryclothing.com",
    salary: 37000,
    joining_date: "2025-03-25",
    org_id: "CH560",
    org_name: "Cheery Clothing",
    clock_in: "05:55 AM",
  },
  {
    staff_id: "KIT-CH-204",
    name: "Varun Bajaj",
    username: "varun.bajaj",
    password: "cheery123",
    role: "chef",
    department: "Kitchen",
    shift: "Evening (15:00 - 23:30)",
    status: "Active",
    assigned_area: "Grill & Live Bar Counter",
    assigned_work: "Live Bar Snacks, Finger Foods & Tapas Preparation",
    work_status: "On Duty",
    phone: "+91 98111 20018",
    email: "varun.b@cheeryclothing.com",
    salary: 35000,
    joining_date: "2025-04-10",
    org_id: "CH560",
    org_name: "Cheery Clothing",
    clock_in: "03:00 PM",
  },
  {
    staff_id: "KIT-CH-205",
    name: "Simran Arora",
    username: "simran.arora",
    password: "cheery123",
    role: "chef",
    department: "Kitchen",
    shift: "Morning (07:00 - 15:30)",
    status: "Active",
    assigned_area: "Cold Pantry & Salads",
    assigned_work: "Gourmet Salads, Fresh Juices & Kitchen HACCP Sanitation",
    work_status: "On Duty",
    phone: "+91 98111 20019",
    email: "simran.a@cheeryclothing.com",
    salary: 32000,
    joining_date: "2025-04-20",
    org_id: "CH560",
    org_name: "Cheery Clothing",
    clock_in: "06:45 AM",
  },
  // ACCOUNTING (5 EMPLOYEES)
  {
    staff_id: "ACC-CH-201",
    name: "Rakesh Jhunjhunwala",
    username: "rakesh.j",
    password: "cheery123",
    role: "accountant",
    department: "Accounting",
    shift: "General (09:00 - 18:00)",
    status: "Active",
    assigned_area: "Finance Office",
    assigned_work: "Finance Controller: Balance Sheets & Strategic Budgets",
    work_status: "On Duty",
    phone: "+91 98111 20010",
    email: "rakesh.j@cheeryclothing.com",
    salary: 60000,
    joining_date: "2025-01-15",
    org_id: "CH560",
    org_name: "Cheery Clothing",
    clock_in: "09:00 AM",
  },
  {
    staff_id: "ACC-CH-202",
    name: "Simran Kaur",
    username: "simran.kaur",
    password: "cheery123",
    role: "accountant",
    department: "Accounting",
    shift: "General (09:00 - 18:00)",
    status: "Active",
    assigned_area: "Billing Counter",
    assigned_work: "POS Store Invoicing & GST Returns Reconciliation",
    work_status: "On Duty",
    phone: "+91 98111 20011",
    email: "simran.k@cheeryclothing.com",
    salary: 40000,
    joining_date: "2025-03-01",
    org_id: "CH560",
    org_name: "Cheery Clothing",
    clock_in: "08:55 AM",
  },
  {
    staff_id: "ACC-CH-203",
    name: "Hardik Mehta",
    username: "hardik.mehta",
    password: "cheery123",
    role: "accountant",
    department: "Accounting",
    shift: "General (09:00 - 18:00)",
    status: "Active",
    assigned_area: "Accounts Payable Office",
    assigned_work: "Vendor Bills, Purchase Orders & Supplier Reconciliation",
    work_status: "On Duty",
    phone: "+91 98111 20020",
    email: "hardik.m@cheeryclothing.com",
    salary: 42000,
    joining_date: "2025-03-20",
    org_id: "CH560",
    org_name: "Cheery Clothing",
    clock_in: "09:00 AM",
  },
  {
    staff_id: "ACC-CH-204",
    name: "Ananya Roy",
    username: "ananya.roy",
    password: "cheery123",
    role: "accountant",
    department: "Accounting",
    shift: "General (09:00 - 18:00)",
    status: "Active",
    assigned_area: "Payroll Desk",
    assigned_work: "Staff Payroll, ESI/PF Deductions & Monthly Audit",
    work_status: "On Duty",
    phone: "+91 98111 20021",
    email: "ananya.r@cheeryclothing.com",
    salary: 45000,
    joining_date: "2025-04-01",
    org_id: "CH560",
    org_name: "Cheery Clothing",
    clock_in: "08:50 AM",
  },
  {
    staff_id: "ACC-CH-205",
    name: "Kunal Shah",
    username: "kunal.shah",
    password: "cheery123",
    role: "accountant",
    department: "Accounting",
    shift: "General (09:00 - 18:00)",
    status: "Active",
    assigned_area: "Cash Counter & Banking",
    assigned_work: "Daily Retail Cash Balance & Bank Credit Verification",
    work_status: "On Duty",
    phone: "+91 98111 20022",
    email: "kunal.s@cheeryclothing.com",
    salary: 38000,
    joining_date: "2025-04-15",
    org_id: "CH560",
    org_name: "Cheery Clothing",
    clock_in: "09:05 AM",
  },

  // ==========================================
  // 4. JAIPUR BRANCH (JP01) — 15 EMPLOYEES
  // ==========================================
  // HOUSEKEEPING (5 EMPLOYEES)
  {
    staff_id: "HK-JP-101",
    name: "Priya Meena",
    username: "priya.meena",
    password: "jaipur123",
    role: "housekeeping",
    department: "Housekeeping",
    shift: "Morning (07:00 AM - 03:30 PM)",
    status: "Active",
    assigned_area: "Royal Heritage Wing",
    assigned_work: "1st & 2nd Floor Room Turnover & Sanitization (Rooms 101, 102)",
    work_status: "On Duty",
    phone: "+91 98290 11001",
    email: "priya.jp@hotel.com",
    salary: 26000,
    joining_date: "2025-02-10",
    org_id: "JP01",
    org_name: "Jaipur Branch",
    clock_in: "07:05 AM",
  },
  {
    staff_id: "HK-JP-102",
    name: "Suresh Gurjar",
    username: "suresh.gurjar",
    password: "jaipur123",
    role: "housekeeping",
    department: "Housekeeping",
    shift: "Morning (07:00 AM - 03:30 PM)",
    status: "Active",
    assigned_area: "Haveli Suites & Rooms",
    assigned_work: "3rd & 4th Floor Deep Clean & Inspection (Rooms 104, 105)",
    work_status: "On Duty",
    phone: "+91 98290 11002",
    email: "suresh.jp@hotel.com",
    salary: 25000,
    joining_date: "2025-03-01",
    org_id: "JP01",
    org_name: "Jaipur Branch",
    clock_in: "07:15 AM",
  },
  {
    staff_id: "HK-JP-103",
    name: "Meera Rathore",
    username: "meera.rathore",
    password: "jaipur123",
    role: "housekeeping",
    department: "Housekeeping",
    shift: "Evening (03:00 PM - 11:30 PM)",
    status: "Active",
    assigned_area: "Palace Floor & Courtyard",
    assigned_work: "VIP Palace Suites & Evening Turndown (Room 201)",
    work_status: "On Duty",
    phone: "+91 98290 11003",
    email: "meera.jp@hotel.com",
    salary: 24500,
    joining_date: "2025-03-15",
    org_id: "JP01",
    org_name: "Jaipur Branch",
    clock_in: null,
  },
  {
    staff_id: "HK-JP-104",
    name: "Govind Sharma",
    username: "govind.sharma",
    password: "jaipur123",
    role: "housekeeping",
    department: "Housekeeping",
    shift: "Evening (03:00 PM - 11:30 PM)",
    status: "Active",
    assigned_area: "2nd & 3rd Floor Rooms",
    assigned_work: "Evening Room Service & Linen Refresh (Rooms 202, 203)",
    work_status: "On Duty",
    phone: "+91 98290 11004",
    email: "govind.jp@hotel.com",
    salary: 24000,
    joining_date: "2025-04-10",
    org_id: "JP01",
    org_name: "Jaipur Branch",
    clock_in: null,
  },
  {
    staff_id: "HK-JP-105",
    name: "Rekha Kanwar",
    username: "rekha.kanwar",
    password: "jaipur123",
    role: "housekeeping",
    department: "Housekeeping",
    shift: "Night (11:00 PM - 07:30 AM)",
    status: "Active",
    assigned_area: "Lobby & Heritage Gardens",
    assigned_work: "Heritage Lobby, Courtyard & Night Disinfection",
    work_status: "On Duty",
    phone: "+91 98290 11005",
    email: "rekha.jp@hotel.com",
    salary: 25500,
    joining_date: "2025-05-01",
    org_id: "JP01",
    org_name: "Jaipur Branch",
    clock_in: null,
  },

  // KITCHEN (5 EMPLOYEES)
  {
    staff_id: "KIT-JP-101",
    name: "Mahendra Singh",
    username: "mahendra.singh",
    password: "jaipur123",
    role: "chef",
    department: "Kitchen",
    shift: "Morning (07:00 - 15:30)",
    status: "Active",
    assigned_area: "Royal Dining Kitchen",
    assigned_work: "Head Chef: Royal Rajasthani Thali, Dal Baati Churma & Breakfast Buffet",
    work_status: "On Duty",
    phone: "+91 98290 22001",
    email: "mahendra.chef@jaipur.com",
    salary: 65000,
    joining_date: "2025-01-15",
    org_id: "JP01",
    org_name: "Jaipur Branch",
    clock_in: "06:45 AM",
  },
  {
    staff_id: "KIT-JP-102",
    name: "Bhanwar Lal",
    username: "bhanwar.lal",
    password: "jaipur123",
    role: "chef",
    department: "Kitchen",
    shift: "Evening (15:00 - 23:30)",
    status: "Active",
    assigned_area: "Tandoor & Kebab Station",
    assigned_work: "Sous Chef: Tandoor Breads, Laal Maas & Grills",
    work_status: "On Duty",
    phone: "+91 98290 22002",
    email: "bhanwar.cook@jaipur.com",
    salary: 44000,
    joining_date: "2025-02-20",
    org_id: "JP01",
    org_name: "Jaipur Branch",
    clock_in: "02:40 PM",
  },
  {
    staff_id: "KIT-JP-103",
    name: "Geeta Soni",
    username: "geeta.soni",
    password: "jaipur123",
    role: "chef",
    department: "Kitchen",
    shift: "Morning (06:00 - 14:30)",
    status: "Active",
    assigned_area: "Halwai & Sweets Counter",
    assigned_work: "Pastry & Sweets: Fresh Ghevar, Mawa Kachori & Desserts",
    work_status: "On Duty",
    phone: "+91 98290 22003",
    email: "geeta.halwai@jaipur.com",
    salary: 38000,
    joining_date: "2025-03-01",
    org_id: "JP01",
    org_name: "Jaipur Branch",
    clock_in: "05:50 AM",
  },
  {
    staff_id: "KIT-JP-104",
    name: "Ratan Kumawat",
    username: "ratan.kumawat",
    password: "jaipur123",
    role: "chef",
    department: "Kitchen",
    shift: "Evening (15:00 - 23:30)",
    status: "Active",
    assigned_area: "Courtyard Live Counter",
    assigned_work: "Live Counter Chef: Snacks, Chaat & Quick Bites",
    work_status: "On Duty",
    phone: "+91 98290 22004",
    email: "ratan.cook@jaipur.com",
    salary: 35000,
    joining_date: "2025-03-25",
    org_id: "JP01",
    org_name: "Jaipur Branch",
    clock_in: "03:00 PM",
  },
  {
    staff_id: "KIT-JP-105",
    name: "Dinesh Prajapat",
    username: "dinesh.prajapat",
    password: "jaipur123",
    role: "chef",
    department: "Kitchen",
    shift: "Morning (07:00 - 15:30)",
    status: "Active",
    assigned_area: "Cold Pantry & Grocery Store",
    assigned_work: "Pantry Prep, Veg/Fruit Washing & Inventory Checks",
    work_status: "On Duty",
    phone: "+91 98290 22005",
    email: "dinesh.kitchen@jaipur.com",
    salary: 32000,
    joining_date: "2025-04-15",
    org_id: "JP01",
    org_name: "Jaipur Branch",
    clock_in: "06:55 AM",
  },

  // ACCOUNTING (5 EMPLOYEES)
  {
    staff_id: "ACC-JP-101",
    name: "Rakesh Agarwal",
    username: "rakesh.agarwal",
    password: "jaipur123",
    role: "accountant",
    department: "Accounting",
    shift: "General (09:00 - 18:00)",
    status: "Active",
    assigned_area: "Finance & Accounts Office",
    assigned_work: "Senior Accounts Controller: Daily Ledger Balancing & Financial Audits",
    work_status: "On Duty",
    phone: "+91 98290 33001",
    email: "rakesh.acc@jaipur.com",
    salary: 55000,
    joining_date: "2025-01-20",
    org_id: "JP01",
    org_name: "Jaipur Branch",
    clock_in: "08:50 AM",
  },
  {
    staff_id: "ACC-JP-102",
    name: "Sunita Khandelwal",
    username: "sunita.khandelwal",
    password: "jaipur123",
    role: "accountant",
    department: "Accounting",
    shift: "General (09:00 - 18:00)",
    status: "Active",
    assigned_area: "Guest Billing & POS Desk",
    assigned_work: "Front Office Billing, Guest Checkout Folios & GST Invoices",
    work_status: "On Duty",
    phone: "+91 98290 33002",
    email: "sunita.bill@jaipur.com",
    salary: 42000,
    joining_date: "2025-02-15",
    org_id: "JP01",
    org_name: "Jaipur Branch",
    clock_in: "09:00 AM",
  },
  {
    staff_id: "ACC-JP-103",
    name: "Mohit Singhal",
    username: "mohit.singhal",
    password: "jaipur123",
    role: "accountant",
    department: "Accounting",
    shift: "General (09:00 - 18:00)",
    status: "Active",
    assigned_area: "Vendor & Expense Cell",
    assigned_work: "Vendor Invoices, Purchase Orders & Expense Ledger Reconciliation",
    work_status: "On Duty",
    phone: "+91 98290 33003",
    email: "mohit.acc@jaipur.com",
    salary: 44000,
    joining_date: "2025-03-10",
    org_id: "JP01",
    org_name: "Jaipur Branch",
    clock_in: "09:05 AM",
  },
  {
    staff_id: "ACC-JP-104",
    name: "Pooja Maheshwari",
    username: "pooja.maheshwari",
    password: "jaipur123",
    role: "accountant",
    department: "Accounting",
    shift: "General (09:00 - 18:00)",
    status: "Active",
    assigned_area: "Cash Vault & Settlement",
    assigned_work: "Daily Cash Counter Reconciliation & Bank Deposit Verification",
    work_status: "On Duty",
    phone: "+91 98290 33004",
    email: "pooja.cash@jaipur.com",
    salary: 40000,
    joining_date: "2025-03-25",
    org_id: "JP01",
    org_name: "Jaipur Branch",
    clock_in: "08:55 AM",
  },
  {
    staff_id: "ACC-JP-105",
    name: "Ashok Goyal",
    username: "ashok.goyal",
    password: "jaipur123",
    role: "accountant",
    department: "Accounting",
    shift: "General (09:00 - 18:00)",
    status: "Active",
    assigned_area: "Tax & Compliance Office",
    assigned_work: "GST Returns, TDS Compliance & Monthly Balance Sheet Filing",
    work_status: "On Duty",
    phone: "+91 98290 33005",
    email: "ashok.tax@jaipur.com",
    salary: 48000,
    joining_date: "2025-04-05",
    org_id: "JP01",
    org_name: "Jaipur Branch",
    clock_in: "09:00 AM",
  },

  // ==========================================
  // 5. AJMER BRANCH (AJ01) — 15 EMPLOYEES
  // ==========================================
  // HOUSEKEEPING (5 EMPLOYEES)
  {
    staff_id: "HK-AJ-101",
    name: "Sunita Rawat",
    username: "sunita.rawat",
    password: "ajmer123",
    role: "housekeeping",
    department: "Housekeeping",
    shift: "Morning (07:00 AM - 03:30 PM)",
    status: "Active",
    assigned_area: "Lake View Deluxe Wing",
    assigned_work: "1st & 2nd Floor Room Turnover & Sanitization (Rooms 101, 102)",
    work_status: "On Duty",
    phone: "+91 98280 11001",
    email: "sunita.aj@hotel.com",
    salary: 26000,
    joining_date: "2025-02-10",
    org_id: "AJ01",
    org_name: "Ajmer Branch",
    clock_in: "07:08 AM",
  },
  {
    staff_id: "HK-AJ-102",
    name: "Mukesh Bairwa",
    username: "mukesh.bairwa",
    password: "ajmer123",
    role: "housekeeping",
    department: "Housekeeping",
    shift: "Morning (07:00 AM - 03:30 PM)",
    status: "Active",
    assigned_area: "Dargah View Suites",
    assigned_work: "3rd & 4th Floor Deep Clean & Inspection (Rooms 104, 105)",
    work_status: "On Duty",
    phone: "+91 98280 11002",
    email: "mukesh.aj@hotel.com",
    salary: 25000,
    joining_date: "2025-03-01",
    org_id: "AJ01",
    org_name: "Ajmer Branch",
    clock_in: "07:12 AM",
  },
  {
    staff_id: "HK-AJ-103",
    name: "Santosh Devi",
    username: "santosh.devi",
    password: "ajmer123",
    role: "housekeeping",
    department: "Housekeeping",
    shift: "Evening (03:00 PM - 11:30 PM)",
    status: "Active",
    assigned_area: "Lakefront Suites & Rooms",
    assigned_work: "Lakefront Suites & Evening Turndown (Room 106)",
    work_status: "On Duty",
    phone: "+91 98280 11003",
    email: "santosh.aj@hotel.com",
    salary: 24500,
    joining_date: "2025-03-15",
    org_id: "AJ01",
    org_name: "Ajmer Branch",
    clock_in: null,
  },
  {
    staff_id: "HK-AJ-104",
    name: "Manoj Chouhan",
    username: "manoj.chouhan",
    password: "ajmer123",
    role: "housekeeping",
    department: "Housekeeping",
    shift: "Evening (03:00 PM - 11:30 PM)",
    status: "Active",
    assigned_area: "2nd Floor Guest Rooms",
    assigned_work: "Guest Room Turnover & Restocking (Rooms 107, 108)",
    work_status: "On Duty",
    phone: "+91 98280 11004",
    email: "manoj.aj@hotel.com",
    salary: 24000,
    joining_date: "2025-04-10",
    org_id: "AJ01",
    org_name: "Ajmer Branch",
    clock_in: null,
  },
  {
    staff_id: "HK-AJ-105",
    name: "Pushpa Solanki",
    username: "pushpa.solanki",
    password: "ajmer123",
    role: "housekeeping",
    department: "Housekeeping",
    shift: "Night (11:00 PM - 07:30 AM)",
    status: "Active",
    assigned_area: "Reception, Lobby & Lawns",
    assigned_work: "Night Public Area Sanitization, Lobby & Guest Washrooms",
    work_status: "On Duty",
    phone: "+91 98280 11005",
    email: "pushpa.aj@hotel.com",
    salary: 25500,
    joining_date: "2025-05-01",
    org_id: "AJ01",
    org_name: "Ajmer Branch",
    clock_in: null,
  },

  // KITCHEN (5 EMPLOYEES)
  {
    staff_id: "KIT-AJ-101",
    name: "Harish Chand",
    username: "harish.chand",
    password: "ajmer123",
    role: "chef",
    department: "Kitchen",
    shift: "Morning (07:00 - 15:30)",
    status: "Active",
    assigned_area: "Main Dining Kitchen",
    assigned_work: "Executive Chef: Mughlai Curries, North Indian Thali & Breakfast Buffet",
    work_status: "On Duty",
    phone: "+91 98280 22001",
    email: "harish.chef@ajmer.com",
    salary: 62000,
    joining_date: "2025-01-15",
    org_id: "AJ01",
    org_name: "Ajmer Branch",
    clock_in: "06:40 AM",
  },
  {
    staff_id: "KIT-AJ-102",
    name: "Kailash Mali",
    username: "kailash.mali",
    password: "ajmer123",
    role: "chef",
    department: "Kitchen",
    shift: "Evening (15:00 - 23:30)",
    status: "Active",
    assigned_area: "Tandoor & Biryani Counter",
    assigned_work: "Sous Chef: Dum Biryani, Kebabs & Tandoori Roti",
    work_status: "On Duty",
    phone: "+91 98280 22002",
    email: "kailash.cook@ajmer.com",
    salary: 43000,
    joining_date: "2025-02-20",
    org_id: "AJ01",
    org_name: "Ajmer Branch",
    clock_in: "02:45 PM",
  },
  {
    staff_id: "KIT-AJ-103",
    name: "Shanti Vaishnav",
    username: "shanti.vaishnav",
    password: "ajmer123",
    role: "chef",
    department: "Kitchen",
    shift: "Morning (06:00 - 14:30)",
    status: "Active",
    assigned_area: "Sweets & Breakfast Prep",
    assigned_work: "Halwai & Sweets: Ajmer Sohan Halwa, Kachori & Breakfast Line",
    work_status: "On Duty",
    phone: "+91 98280 22003",
    email: "shanti.kitchen@ajmer.com",
    salary: 37000,
    joining_date: "2025-03-01",
    org_id: "AJ01",
    org_name: "Ajmer Branch",
    clock_in: "05:45 AM",
  },
  {
    staff_id: "KIT-AJ-104",
    name: "Narendra Verma",
    username: "narendra.verma",
    password: "ajmer123",
    role: "chef",
    department: "Kitchen",
    shift: "Evening (15:00 - 23:30)",
    status: "Active",
    assigned_area: "Banquet & Room Service",
    assigned_work: "Room Service Fast Orders, Snacks & Banquet Curries",
    work_status: "On Duty",
    phone: "+91 98280 22004",
    email: "narendra.cook@ajmer.com",
    salary: 35000,
    joining_date: "2025-03-25",
    org_id: "AJ01",
    org_name: "Ajmer Branch",
    clock_in: "03:10 PM",
  },
  {
    staff_id: "KIT-AJ-105",
    name: "Pappu Gurjar",
    username: "pappu.gurjar",
    password: "ajmer123",
    role: "chef",
    department: "Kitchen",
    shift: "Morning (07:00 - 15:30)",
    status: "Active",
    assigned_area: "Cold Pantry & Storage",
    assigned_work: "Vegetable Prep, Salad Station & Dairy/Pantry Stock",
    work_status: "On Duty",
    phone: "+91 98280 22005",
    email: "pappu.pantry@ajmer.com",
    salary: 32000,
    joining_date: "2025-04-15",
    org_id: "AJ01",
    org_name: "Ajmer Branch",
    clock_in: "06:50 AM",
  },

  // ACCOUNTING (5 EMPLOYEES)
  {
    staff_id: "ACC-AJ-101",
    name: "Vijay Sharma",
    username: "vijay.sharma",
    password: "ajmer123",
    role: "accountant",
    department: "Accounting",
    shift: "General (09:00 - 18:00)",
    status: "Active",
    assigned_area: "Main Accounts Office",
    assigned_work: "Senior Accounts Officer: Ledger Balancing & Daily Financial Audit",
    work_status: "On Duty",
    phone: "+91 98280 33001",
    email: "vijay.acc@ajmer.com",
    salary: 54000,
    joining_date: "2025-01-20",
    org_id: "AJ01",
    org_name: "Ajmer Branch",
    clock_in: "08:50 AM",
  },
  {
    staff_id: "ACC-AJ-102",
    name: "Anjali Mathur",
    username: "anjali.mathur",
    password: "ajmer123",
    role: "accountant",
    department: "Accounting",
    shift: "General (09:00 - 18:00)",
    status: "Active",
    assigned_area: "Front Desk Cash Counter",
    assigned_work: "Guest Room Billing, Advance Deposits & Folio Settling",
    work_status: "On Duty",
    phone: "+91 98280 33002",
    email: "anjali.bill@ajmer.com",
    salary: 41000,
    joining_date: "2025-02-15",
    org_id: "AJ01",
    org_name: "Ajmer Branch",
    clock_in: "08:55 AM",
  },
  {
    staff_id: "ACC-AJ-103",
    name: "Pradeep Jain",
    username: "pradeep.jain",
    password: "ajmer123",
    role: "accountant",
    department: "Accounting",
    shift: "General (09:00 - 18:00)",
    status: "Active",
    assigned_area: "Procurement & Vendor Desk",
    assigned_work: "Vendor Ledger, Grocery Purchase Invoices & Voucher Entry",
    work_status: "On Duty",
    phone: "+91 98280 33003",
    email: "pradeep.acc@ajmer.com",
    salary: 43000,
    joining_date: "2025-03-10",
    org_id: "AJ01",
    org_name: "Ajmer Branch",
    clock_in: "09:00 AM",
  },
  {
    staff_id: "ACC-AJ-104",
    name: "Suman Choudhary",
    username: "suman.choudhary",
    password: "ajmer123",
    role: "accountant",
    department: "Accounting",
    shift: "General (09:00 - 18:00)",
    status: "Active",
    assigned_area: "Payroll & HR Cell",
    assigned_work: "Staff Monthly Payroll, Overtime & Attendance Audits",
    work_status: "On Duty",
    phone: "+91 98280 33004",
    email: "suman.payroll@ajmer.com",
    salary: 42000,
    joining_date: "2025-03-25",
    org_id: "AJ01",
    org_name: "Ajmer Branch",
    clock_in: "09:05 AM",
  },
  {
    staff_id: "ACC-AJ-105",
    name: "Deepak Kumawat",
    username: "deepak.kumawat",
    password: "ajmer123",
    role: "accountant",
    department: "Accounting",
    shift: "General (09:00 - 18:00)",
    status: "Active",
    assigned_area: "Bank & Tax Compliance",
    assigned_work: "GST Returns, TDS Reconciliation & Bank Statement Matching",
    work_status: "On Duty",
    phone: "+91 98280 33005",
    email: "deepak.tax@ajmer.com",
    salary: 46000,
    joining_date: "2025-04-05",
    org_id: "AJ01",
    org_name: "Ajmer Branch",
    clock_in: "08:50 AM",
  },
];

export async function seedPermanentStaffData() {
  try {
    const todayStr = new Date().toISOString().split("T")[0];

    // Clean up unwanted Front Desk & Management / dummy records in MySQL
    try {
      const canonicalIds = PERMANENT_STAFF_MEMBERS.map((s) => s.staff_id);
      await query(`
        DELETE FROM staff 
        WHERE department IN ('Front Desk', 'Management') 
           OR role IN ('manager', 'front_desk')
           OR staff_id LIKE 'MGR-%'
           OR staff_id LIKE 'FD-%'
           OR staff_id IN ('HK-106', 'HK-107', 'HK-108', 'EMP-ASH-01', 'EMP-ASH-02', 'STF-CH-201', 'STF-CH-204');
      `);
      await query(`
        DELETE FROM staff_attendance 
        WHERE staff_id LIKE 'MGR-%'
           OR staff_id LIKE 'FD-%'
           OR staff_id IN ('HK-106', 'HK-107', 'HK-108', 'EMP-ASH-01', 'EMP-ASH-02', 'STF-CH-201', 'STF-CH-204');
      `);
      await query(`
        DELETE FROM employees 
        WHERE department IN ('Front Desk', 'Management')
           OR role IN ('manager', 'front_desk')
           OR employee_code LIKE 'MGR-%'
           OR employee_code LIKE 'FD-%'
           OR employee_code IN ('HK-106', 'HK-107', 'HK-108', 'EMP-ASH-01', 'EMP-ASH-02', 'STF-CH-201', 'STF-CH-204');
      `);
      await query(`
        DELETE FROM users 
        WHERE role IN ('manager', 'front_desk')
           OR staff_id LIKE 'MGR-%'
           OR staff_id LIKE 'FD-%'
           OR staff_id IN ('HK-106', 'HK-107', 'HK-108', 'EMP-ASH-01', 'EMP-ASH-02', 'STF-CH-201', 'STF-CH-204');
      `);
    } catch (e: any) {
      console.warn("Cleanup error in seedPermanentStaffData:", e.message);
    }

    for (const s of PERMANENT_STAFF_MEMBERS) {
      const passwordHash = await bcrypt.hash(s.password || "ashirwad123", 10);
      try {
        // 1. Staff table
        const existingStaff = await query<any>(
          "SELECT id, staff_id FROM staff WHERE staff_id = ? OR email = ? LIMIT 1",
          [s.staff_id, s.email]
        );

        if (existingStaff.length > 0) {
          await query(
            `UPDATE staff 
             SET staff_id = ?, name = ?, username = ?, password = ?, role = ?, department = ?, shift = ?, status = ?,
                 assigned_area = ?, assigned_work = ?, work_status = ?, phone = ?, email = ?, salary = ?,
                 joining_date = ?, org_id = ?, org_name = ?
             WHERE id = ?`,
            [
              s.staff_id,
              s.name,
              s.username,
              s.password,
              s.role,
              s.department,
              s.shift,
              s.status,
              s.assigned_area,
              s.assigned_work,
              s.work_status,
              s.phone,
              s.email,
              s.salary,
              s.joining_date,
              s.org_id,
              s.org_name,
              existingStaff[0].id,
            ]
          );
        } else {
          await query(
            `INSERT INTO staff 
              (staff_id, name, username, password, role, department, shift, status, assigned_area, assigned_work, work_status, phone, email, salary, joining_date, org_id, org_name)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              s.staff_id,
              s.name,
              s.username,
              s.password,
              s.role,
              s.department,
              s.shift,
              s.status,
              s.assigned_area,
              s.assigned_work,
              s.work_status,
              s.phone,
              s.email,
              s.salary,
              s.joining_date,
              s.org_id,
              s.org_name,
            ]
          );
        }
      } catch (err: any) {
        console.warn(`Staff insert error for ${s.name}:`, err.message);
      }

      try {
        // 2. Users table (login accounts)
        const existingUser = await query<any>(
          "SELECT id FROM users WHERE LOWER(email) = ? OR staff_id = ? OR (username IS NOT NULL AND LOWER(username) = ?) LIMIT 1",
          [s.email.toLowerCase(), s.staff_id, s.username.toLowerCase()]
        );

        if (existingUser.length > 0) {
          await query(
            "UPDATE users SET name = ?, username = ?, email = ?, password_hash = ?, role = ?, phone = ?, staff_id = ?, org_id = ?, org_name = ? WHERE id = ?",
            [s.name, s.username, s.email.toLowerCase(), passwordHash, s.role, s.phone, s.staff_id, s.org_id, s.org_name, existingUser[0].id]
          );
        } else {
          await query(
            "INSERT INTO users (name, username, email, password_hash, role, phone, staff_id, org_id, org_name) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
            [s.name, s.username, s.email.toLowerCase(), passwordHash, s.role, s.phone, s.staff_id, s.org_id, s.org_name]
          );
        }
      } catch (err: any) {
        console.warn(`User insert error for ${s.name}:`, err.message);
      }

      // 3. Employees table
      try {
        await query(
          `INSERT INTO employees 
            (employee_code, name, username, email, role, department, phone, status, salary, org_id, org, org_name)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE 
             name = VALUES(name), username = VALUES(username), role = VALUES(role), department = VALUES(department),
             phone = VALUES(phone), status = VALUES(status), salary = VALUES(salary),
             org_id = VALUES(org_id), org = VALUES(org), org_name = VALUES(org_name)`,
          [s.staff_id, s.name, s.username, s.email, s.role, s.department, s.phone, s.status, s.salary, s.org_id, s.org_name, s.org_name]
        );
      } catch (e) {}

      // 4. Staff attendance for today
      if (s.clock_in) {
        try {
          await query(
            `INSERT INTO staff_attendance 
              (org_id, staff_id, staff_name, staff_email, date, shift, assigned_area, clock_in, status, duration_minutes)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'On Duty', 270)
             ON DUPLICATE KEY UPDATE 
               staff_name = VALUES(staff_name), staff_email = VALUES(staff_email),
               shift = VALUES(shift), assigned_area = VALUES(assigned_area),
               clock_in = COALESCE(clock_in, VALUES(clock_in))`,
            [s.org_id, s.staff_id, s.name, s.email, todayStr, s.shift, s.assigned_area, s.clock_in]
          );
        } catch (e) {}
      }
    }
    console.log("✅ 15 Canonical staff members (Housekeeping, Kitchen, Accounting) synchronized successfully.");
  } catch (err: any) {
    console.warn("seedPermanentStaffData error:", err.message);
  }
}

function formatStaffRow(r: any) {
  if (!r) return r;
  const staffId = r.staff_id || r.staffId || (typeof r.id === "string" ? r.id : `STF-${r.id}`);
  const assignedArea = r.assigned_area || r.assignedArea || "Main Building";
  const assignedWork = r.assigned_work || r.assignedWork || "";
  const workStatus = r.work_status || r.workStatus || "On Duty";
  const shift = r.shift || "Morning (07:00 - 15:00)";
  const department = r.department || "Housekeeping";
  const status = r.status || "Active";
  const orgId = r.org_id || r.orgId || "AS435";
  const orgName = r.org_name || r.orgName || "Ashirwad";
  const username = r.username || (r.email ? r.email.split("@")[0] : "");
  const password = r.password || "ashirwad123";

  return {
    ...r,
    id: r.id,
    staff_id: staffId,
    staffId: staffId,
    name: r.name,
    username: username,
    password: password,
    role: r.role,
    department: department,
    shift: shift,
    status: status,
    assigned_area: assignedArea,
    assignedArea: assignedArea,
    assigned_work: assignedWork,
    assignedWork: assignedWork,
    work_status: workStatus,
    workStatus: workStatus,
    phone: r.phone || "",
    email: r.email || "",
    salary: r.salary ?? 30000,
    joining_date: r.joining_date || r.joiningDate || "2025-01-15",
    joiningDate: r.joining_date || r.joiningDate || "2025-01-15",
    org_id: orgId,
    orgId: orgId,
    org_name: orgName,
    orgName: orgName,
  };
}

// GET /api/staff — List staff members for organization
router.get("/", async (req, res) => {
  try {
    const { orgId, org } = req.query as { orgId?: string; org?: string };
    const targetOrgId = orgId || (org === "Ashirwad" ? "AS435" : org === "Cheery Clothing" ? "CH560" : org === "Matcha Tea" ? "MA330" : undefined);

    let sql = `SELECT * FROM staff WHERE department IN ('Housekeeping', 'Kitchen', 'Accounting')`;
    const params: unknown[] = [];

    if (targetOrgId) {
      sql += " AND (org_id = ? OR org_name = ?)";
      params.push(targetOrgId, org || targetOrgId);
    } else if (org) {
      sql += " AND org_name = ?";
      params.push(org);
    }

    sql += " ORDER BY id ASC";

    let rows = await query<any>(sql, params);
    if (!rows || rows.length === 0) {
      await seedPermanentStaffData();
      rows = await query<any>(sql, params);
    }
    const staffList = rows.map(formatStaffRow);

    return res.json({ success: true, staff: staffList, employees: staffList });
  } catch (err: any) {
    console.error("GET /api/staff error:", err);
    return res.status(500).json({ success: false, error: "Failed to fetch staff members.", details: err?.message });
  }
});

// POST /api/staff/seed — Explicitly re-seed and purge MySQL staff database
router.post("/seed", async (req, res) => {
  try {
    await seedPermanentStaffData();
    return res.json({ success: true, message: "Staff seed and purge completed successfully." });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/staff — Create or Update staff member
router.post("/", async (req, res) => {
  try {
    const {
      id,
      staff_id,
      staffId: rawStaffId,
      name,
      username: rawUsername,
      role = "housekeeping",
      department = "Housekeeping",
      shift = "Morning (07:00 - 15:00)",
      status = "Active",
      assigned_area,
      assignedArea: rawAssignedArea,
      assigned_work,
      assignedWork: rawAssignedWork,
      work_status,
      workStatus: rawWorkStatus,
      phone = "",
      email = "",
      password = "",
      salary = null,
      joining_date,
      joiningDate,
      orgId: rawOrgId,
      orgName: rawOrgName,
      org,
    } = req.body ?? {};

    if (!name) {
      return res.status(400).json({ success: false, error: "Name is required." });
    }
    if (!email || !String(email).trim()) {
      return res.status(400).json({ success: false, error: "Email is required." });
    }
    if (!id && (!password || String(password).length < 6)) {
      return res.status(400).json({ success: false, error: "Password must be at least 6 characters." });
    }

    const finalStaffId = staff_id || rawStaffId || (id && String(id).includes("STF") ? String(id) : `STF-${Math.floor(100 + Math.random() * 900)}`);
    const finalAssignedArea = assigned_area || rawAssignedArea || "Main Building";
    const finalAssignedWork = assigned_work || rawAssignedWork || (department === "Housekeeping" ? "Room turnover & sanitization" : department === "Kitchen" ? "Culinary prep & meal service" : "Ledger balancing & invoicing");
    const finalWorkStatus = work_status || rawWorkStatus || "On Duty";
    const finalOrgName = rawOrgName || org || (rawOrgId === "AS435" ? "Ashirwad" : rawOrgId === "CH560" ? "Cheery Clothing" : "Matcha Tea");
    const finalOrgId = rawOrgId || (finalOrgName === "Ashirwad" ? "AS435" : finalOrgName === "Cheery Clothing" ? "CH560" : "MA330");
    const finalUsername = (rawUsername || String(email).split("@")[0] || name.toLowerCase().replace(/\s+/g, ".")).toLowerCase().trim();

    // Update if numeric id exists or staff_id exists
    const isNumericId = id && typeof id === "number";
    const updateId = isNumericId ? id : null;
    const isStaffId = id && typeof id === "string" && id.includes("-");
    const updateStaffId = isStaffId ? id : null;

    if (updateId || updateStaffId) {
      const sqlWhere = updateId ? "id = ?" : "staff_id = ?";
      const sqlParam = updateId || updateStaffId;
      
      await query(
        `UPDATE staff 
         SET staff_id = ?, name = ?, username = ?, role = ?, department = ?, shift = ?, status = ?, assigned_area = ?, assigned_work = ?, work_status = ?, phone = ?, email = ?, salary = ?, joining_date = ?, org_id = ?, org_name = ?
         WHERE ${sqlWhere}`,
        [finalStaffId, name.trim(), finalUsername, role, department, shift, status, finalAssignedArea, finalAssignedWork, finalWorkStatus, phone, email, salary || null, joining_date || joiningDate || null, finalOrgId, finalOrgName, sqlParam]
      );

      // Keep the staff login account in sync when a password is supplied.
      const normalizedEmail = String(email).trim().toLowerCase();
      const existingUsers = await query<any>(`SELECT id FROM users WHERE LOWER(email) = ? OR staff_id = ? OR (username IS NOT NULL AND LOWER(username) = ?) LIMIT 1`, [normalizedEmail, finalStaffId, finalUsername]);
      if (existingUsers.length) {
        if (password && String(password).trim() !== "" && String(password).trim() !== "password123") {
          await query("UPDATE users SET name = ?, username = ?, email = ?, password_hash = ?, role = ?, org_id = ?, org_name = ?, staff_id = ? WHERE id = ?", [name.trim(), finalUsername, normalizedEmail, await bcrypt.hash(password, 10), role, finalOrgId, finalOrgName, finalStaffId, existingUsers[0].id]);
        } else {
          await query("UPDATE users SET name = ?, username = ?, role = ?, org_id = ?, org_name = ?, staff_id = ? WHERE id = ?", [name.trim(), finalUsername, role, finalOrgId, finalOrgName, finalStaffId, existingUsers[0].id]);
        }
      }
      
      try {
        await query(
          "UPDATE employees SET name = ?, username = ?, role = ?, department = ?, salary = ?, status = ?, org_id = ?, org = ? WHERE employee_code = ?",
          [name.trim(), finalUsername, role, department, salary || 0, status, finalOrgId, finalOrgName, finalStaffId]
        );
      } catch (e: any) {
        console.warn("Failed to update employees table:", e.message);
      }
      
      const updated = formatStaffRow({
        id: updateId || id, staff_id: finalStaffId, name: name.trim(), username: finalUsername, role, department, shift, status, assigned_area: finalAssignedArea, assigned_work: finalAssignedWork, work_status: finalWorkStatus, phone, email, org_id: finalOrgId, org_name: finalOrgName
      });

      const { logActivity } = await import("../lib/audit.js");
      logActivity({
        req,
        action: "Updated Staff Member",
        module: "Staff",
        activity_type: "Update",
        entity_type: "Staff",
        entity_id: finalStaffId,
        description: `Updated details for staff member ${name.trim()}`,
        new_value: updated
      });

      return res.json({ success: true, message: `Staff member updated successfully.`, staff: updated });
    }

    // Insert new staff
    const result: any = await query(
      `INSERT INTO staff 
        (staff_id, name, username, password, role, department, shift, status, assigned_area, assigned_work, work_status, phone, email, salary, joining_date, org_id, org_name)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [finalStaffId, name.trim(), finalUsername, password, role, department, shift, status, finalAssignedArea, finalAssignedWork, finalWorkStatus, phone, email, salary || null, joining_date || joiningDate || null, finalOrgId, finalOrgName]
    );

    const normalizedEmail = String(email).trim().toLowerCase();
    const duplicateUser = await query<any>("SELECT id FROM users WHERE LOWER(email) = ? OR (username IS NOT NULL AND LOWER(username) = ?) LIMIT 1", [normalizedEmail, finalUsername]);
    if (duplicateUser.length) {
      return res.status(409).json({ success: false, error: "An account with this email or username already exists." });
    }
    const passwordHash = await bcrypt.hash(String(password), 10);
    await query(
      "INSERT INTO users (name, username, email, password_hash, role, org_id, org_name, staff_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [name.trim(), finalUsername, normalizedEmail, passwordHash, role, finalOrgId, finalOrgName, finalStaffId]
    );

    try {
      await query(
        "INSERT INTO employees (employee_code, name, username, email, role, department, salary, status, org_id, org, payroll_status, pay_period) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE name = VALUES(name), username = VALUES(username), role = VALUES(role), department = VALUES(department), salary = VALUES(salary), status = VALUES(status), org_id = VALUES(org_id), org = VALUES(org)",
        [finalStaffId, name.trim(), finalUsername, email, role, department, salary || 0, status, finalOrgId, finalOrgName, "Pending", new Date().toLocaleDateString("en-US", { month: "short", year: "numeric" })]
      );
    } catch (e: any) {
      console.warn("Failed to insert into employees table:", e.message);
    }

    const newStaff = formatStaffRow({
      id: result.insertId, staff_id: finalStaffId, name: name.trim(), username: finalUsername, role, department, shift, status, assigned_area: finalAssignedArea, assigned_work: finalAssignedWork, work_status: finalWorkStatus, phone, email, org_id: finalOrgId, org_name: finalOrgName
    });

    const { logActivity } = await import("../lib/audit.js");
    logActivity({
      req,
      action: "Created Staff Member",
      module: "Staff",
      activity_type: "Create",
      entity_type: "Staff",
      entity_id: finalStaffId,
      description: `Added new staff member ${name.trim()} as ${role}`,
      new_value: newStaff
    });

    return res.status(201).json({ success: true, message: `Staff member created successfully.`, staff: newStaff });
  } catch (err: any) {
    console.error("POST /api/staff error:", err);
    return res.status(500).json({ success: false, error: "Failed to save staff member." });
  }
});

// DELETE /api/staff/:id — Delete staff member
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const oldStaffRaw = (await query<any>("SELECT * FROM staff WHERE id = ? OR staff_id = ?", [id, id]))[0] 
      || (await query<any>("SELECT * FROM staff WHERE id = ? OR staff_id = ?", [isNaN(Number(id)) ? 0 : Number(id), id]))[0];
    const numId = isNaN(Number(id)) ? 0 : Number(id);
    await query("DELETE FROM staff WHERE id = ? OR staff_id = ?", [numId, id]);
    await query("DELETE FROM employees WHERE employee_code = ?", [id]).catch(() => {});
    await query("DELETE FROM users WHERE id = ? OR staff_id = ?", [numId, id]).catch(() => {});
    
    if (oldStaffRaw) {
      const { logActivity } = await import("../lib/audit.js");
      logActivity({
        req,
        action: "Deleted Staff Member",
        module: "Staff",
        activity_type: "Delete",
        entity_type: "Staff",
        entity_id: oldStaffRaw.staff_id,
        description: `Deleted staff member ${oldStaffRaw.name}`,
        old_value: oldStaffRaw
      });
    }

    return res.status(200).json({ success: true, message: "Staff member deleted successfully." });
  } catch (err: any) {
    console.error("DELETE /api/staff/:id error:", err);
    return res.status(500).json({ success: false, error: "Failed to delete staff member." });
  }
});
// ==========================================
// STAFF ATTENDANCE & ROSTER ENDPOINTS
// ==========================================

// Auto-sync staff from users table if not yet present
(async () => {
  try {
    await query(`
      INSERT INTO staff (staff_id, name, role, department, shift, status, assigned_area, work_status, phone, email, org_id, org_name)
      SELECT 
        COALESCE(u.staff_id, CONCAT('STF-', u.id)),
        u.name,
        COALESCE(u.role, 'Housekeeper'),
        CASE 
          WHEN LOWER(u.role) LIKE '%housekeep%' THEN 'Housekeeping'
          WHEN LOWER(u.role) LIKE '%chef%' OR LOWER(u.role) LIKE '%cook%' OR LOWER(u.role) LIKE '%kitchen%' THEN 'Kitchen'
          WHEN LOWER(u.role) LIKE '%account%' THEN 'Accounting'
          ELSE 'Housekeeping'
        END,
        'Morning (07:00 - 15:30)',
        'Active',
        '1st Floor & Suites',
        'On Duty',
        u.phone,
        u.email,
        COALESCE(u.org_id, 'MA330'),
        COALESCE(u.org_name, 'Matcha Tea')
      FROM users u
      WHERE u.role NOT IN ('super_admin', 'user', 'manager', 'front_desk')
        AND NOT EXISTS (
          SELECT 1 FROM staff s WHERE (s.email IS NOT NULL AND s.email = u.email) OR (s.staff_id IS NOT NULL AND s.staff_id = u.staff_id)
        )
    `);
  } catch (e: any) {
    console.warn("Auto-sync users to staff error:", e.message);
  }
})();

// GET /api/staff/attendance - Today's Roster & Attendance
router.get("/attendance", async (req, res) => {
  try {
    const orgId = (req.query.orgId as string) || (req.query.org_id as string) || "MA330";
    const todayStr = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

    // Fetch all active staff
    let staffList = await query<any>(
      "SELECT * FROM staff WHERE (org_id = ? OR org_id IS NULL) AND department IN ('Housekeeping', 'Kitchen', 'Accounting') AND status <> 'Inactive' ORDER BY name ASC",
      [orgId]
    );

    if (!staffList || staffList.length === 0) {
      await seedPermanentStaffData();
      staffList = await query<any>(
        "SELECT * FROM staff WHERE (org_id = ? OR org_id IS NULL) AND department IN ('Housekeeping', 'Kitchen', 'Accounting') AND status <> 'Inactive' ORDER BY name ASC",
        [orgId]
      );
    }

    // Fetch today's existing attendance entries
    const attendanceEntries = await query<any>(
      "SELECT * FROM staff_attendance WHERE org_id = ? AND date = ?",
      [orgId, todayStr]
    );
    const attendanceMap = new Map();
    attendanceEntries.forEach((a) => attendanceMap.set(String(a.staff_id), a));

    // Fetch today's approved leaves
    const activeLeaves = await query<any>(
      "SELECT * FROM staff_leaves WHERE org_id = ? AND status = 'Approved' AND start_date <= ? AND end_date >= ?",
      [orgId, todayStr, todayStr]
    );
    const leaveMap = new Map();
    activeLeaves.forEach((l) => leaveMap.set(String(l.staff_id), l));

    // Fetch active housekeeping tasks to correlate current task per staff
    const activeTasks = await query<any>(
      "SELECT id, room, task, status, staff, staff_email, priority, shift, icon FROM housekeeping_tasks WHERE status NOT IN ('Cleaned & Approved', 'Completed')"
    );

    let totalDurationMinutesAll = 0;

    // Combine into full roster
    const roster = staffList.map((stf: any) => {
      const att = attendanceMap.get(String(stf.staff_id));
      const onLeave = leaveMap.get(String(stf.staff_id));
      const clockIn = att ? att.clock_in : null;
      const clockOut = att ? att.clock_out : null;

      // Status determination: Present, Absent, On Leave
      let status = "Absent";
      if (onLeave) {
        status = "On Leave";
      } else if (clockIn) {
        status = clockOut ? "Checked Out" : "Present";
      } else if (att?.status === "On Duty") {
        status = "Present";
      }

      // Duration calculation
      let durationMinutes = att ? Number(att.duration_minutes || 0) : 0;
      if (clockIn && !clockOut && att?.created_at) {
        const diffMs = Date.now() - new Date(att.created_at).getTime();
        if (diffMs > 0) durationMinutes = Math.round(diffMs / 60000);
      }
      if (clockIn) {
        totalDurationMinutesAll += durationMinutes;
      }

      const hours = Math.floor(durationMinutes / 60);
      const mins = durationMinutes % 60;
      const durationText = clockIn ? (clockOut ? `${hours}h ${mins}m` : `${hours}h ${mins}m (Active)`) : null;

      // Find currently assigned housekeeping task
      const assignedTask = activeTasks.find(
        (t) =>
          (t.staff_email && stf.email && t.staff_email.toLowerCase() === stf.email.toLowerCase()) ||
          (t.staff && stf.name && t.staff.toLowerCase().includes(stf.name.toLowerCase().split(" ")[0]))
      );

      return {
        id: att ? att.id : `tmp-${stf.id}`,
        attendanceId: att ? att.id : null,
        staffId: stf.staff_id || `STF-${stf.id}`,
        staffName: stf.name,
        staffEmail: stf.email,
        department: stf.department || "Housekeeping",
        role: stf.role || "Housekeeper",
        shift: att?.shift || stf.shift || "Morning (07:00 - 15:30)",
        assignedArea: att?.assigned_area || stf.assigned_area || "1st Floor & Suites",
        clockIn: clockIn,
        clockOut: clockOut,
        durationMinutes,
        durationText,
        hoursWorked: durationText,
        status: status,
        notes: att?.notes || "",
        overrideBy: att?.override_by || null,
        currentTask: assignedTask
          ? {
              id: assignedTask.id,
              room: assignedTask.room,
              task: assignedTask.task,
              status: assignedTask.status,
              priority: assignedTask.priority,
              icon: assignedTask.icon || "🛏️",
            }
          : null,
      };
    });

    const totalStaff = roster.length;
    const presentToday = roster.filter((r) => r.status === "Present" || r.status === "Checked Out").length;
    const absentToday = roster.filter((r) => r.status === "Absent").length;
    const checkedInCount = roster.filter((r) => r.clockIn && !r.clockOut).length;
    const checkedOutCount = roster.filter((r) => r.clockOut).length;
    const onLeaveCount = roster.filter((r) => r.status === "On Leave").length;

    const totalHoursAll = (totalDurationMinutesAll / 60).toFixed(1);

    return res.json({
      success: true,
      date: todayStr,
      roster,
      metrics: {
        totalStaff,
        presentToday,
        absentToday,
        checkedIn: checkedInCount,
        checkedOut: checkedOutCount,
        onLeave: onLeaveCount,
        totalHoursWorked: `${totalHoursAll} hrs`,
        // Backwards compatibility keys
        onDuty: presentToday,
        offDuty: absentToday,
      },
    });
  } catch (err: any) {
    console.error("GET /api/staff/attendance error:", err);
    return res.status(500).json({ success: false, error: "Failed to fetch attendance roster." });
  }
});

// POST /api/staff/attendance/clock-in - Record clock in
router.post("/attendance/clock-in", async (req, res) => {
  try {
    const { staffId, staffName, staffEmail, orgId, shift, assignedArea } = req.body ?? {};
    if (!staffId) return res.status(400).json({ success: false, error: "staffId is required." });

    const targetOrgId = orgId || "MA330";
    const todayStr = new Date().toISOString().split("T")[0];
    const nowTimeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    // Insert or update attendance
    await query(
      `INSERT INTO staff_attendance
       (org_id, staff_id, staff_name, staff_email, date, shift, assigned_area, clock_in, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'On Duty')
       ON DUPLICATE KEY UPDATE
         clock_in = VALUES(clock_in),
         clock_out = NULL,
         status = 'On Duty'`,
      [
        targetOrgId,
        staffId,
        staffName || "Housekeeper",
        staffEmail || null,
        todayStr,
        shift || "Morning (07:00 - 15:00)",
        assignedArea || "1st Floor & Suites",
        nowTimeStr,
      ]
    );

    // Update staff work_status
    await query("UPDATE staff SET work_status = 'On Duty' WHERE staff_id = ? OR id = ?", [staffId, staffId]).catch(() => {});

    return res.json({
      success: true,
      message: `Clocked in at ${nowTimeStr}. Have a great shift!`,
      clockInTime: nowTimeStr,
      status: "On Duty",
    });
  } catch (err: any) {
    console.error("Clock-in error:", err);
    return res.status(500).json({ success: false, error: "Failed to record clock-in." });
  }
});

// POST /api/staff/attendance/clock-out - Record clock out
router.post("/attendance/clock-out", async (req, res) => {
  try {
    const { staffId, orgId } = req.body ?? {};
    if (!staffId) return res.status(400).json({ success: false, error: "staffId is required." });

    const targetOrgId = orgId || "MA330";
    const todayStr = new Date().toISOString().split("T")[0];
    const nowTimeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    // Calculate duration
    const existing = await query<any>(
      "SELECT * FROM staff_attendance WHERE org_id = ? AND staff_id = ? AND date = ? LIMIT 1",
      [targetOrgId, staffId, todayStr]
    );

    let durationMins = 480; // default 8 hours if clock_in not found
    if (existing.length > 0 && existing[0].created_at) {
      const diffMs = Date.now() - new Date(existing[0].created_at).getTime();
      durationMins = Math.max(1, Math.round(diffMs / (1000 * 60)));
    }

    await query(
      `UPDATE staff_attendance
       SET clock_out = ?, duration_minutes = ?, status = 'Off Duty'
       WHERE org_id = ? AND staff_id = ? AND date = ?`,
      [nowTimeStr, durationMins, targetOrgId, staffId, todayStr]
    );

    // Update staff work_status
    await query("UPDATE staff SET work_status = 'Off Duty' WHERE staff_id = ? OR id = ?", [staffId, staffId]).catch(() => {});

    const hours = Math.floor(durationMins / 60);
    const mins = durationMins % 60;

    return res.json({
      success: true,
      message: `Clocked out at ${nowTimeStr}. Total shift: ${hours}h ${mins}m.`,
      clockOutTime: nowTimeStr,
      durationText: `${hours}h ${mins}m`,
      status: "Off Duty",
    });
  } catch (err: any) {
    console.error("Clock-out error:", err);
    return res.status(500).json({ success: false, error: "Failed to record clock-out." });
  }
});

// PUT /api/staff/attendance/:id/override - Admin manual override
router.put("/attendance/:id/override", async (req, res) => {
  try {
    const { id } = req.params;
    const { clockIn, clockOut, status, notes, adminName } = req.body ?? {};

    await query(
      `UPDATE staff_attendance
       SET clock_in = COALESCE(?, clock_in),
           clock_out = COALESCE(?, clock_out),
           status = COALESCE(?, status),
           notes = COALESCE(?, notes),
           override_by = ?
       WHERE id = ?`,
      [clockIn || null, clockOut || null, status || null, notes || null, adminName || "Admin", id]
    );

    return res.json({ success: true, message: "Attendance record adjusted successfully." });
  } catch (err: any) {
    console.error("Attendance override error:", err);
    return res.status(500).json({ success: false, error: "Failed to override attendance." });
  }
});

// GET /api/staff/attendance/leaves - List leave requests
router.get("/attendance/leaves", async (req, res) => {
  try {
    const orgId = (req.query.orgId as string) || (req.query.org_id as string) || "MA330";
    const leaves = await query<any>(
      "SELECT * FROM staff_leaves WHERE org_id = ? ORDER BY id DESC LIMIT 50",
      [orgId]
    );
    return res.json({ success: true, leaves });
  } catch (err: any) {
    console.error("GET leaves error:", err);
    return res.status(500).json({ success: false, error: "Failed to fetch leaves." });
  }
});

// POST /api/staff/attendance/leave - Apply for Leave
router.post("/attendance/leave", async (req, res) => {
  try {
    const { staffId, staffName, staffEmail, orgId, leaveType, startDate, endDate, reason } = req.body ?? {};
    if (!staffId || !startDate || !endDate) {
      return res.status(400).json({ success: false, error: "staffId, startDate, and endDate are required." });
    }

    const result: any = await query(
      `INSERT INTO staff_leaves
       (org_id, staff_id, staff_name, staff_email, leave_type, start_date, end_date, reason, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Pending')`,
      [
        orgId || "MA330",
        staffId,
        staffName || "Staff",
        staffEmail || null,
        leaveType || "Casual Leave",
        startDate,
        endDate,
        reason || "Personal Leave",
      ]
    );

    return res.status(201).json({ success: true, message: "Leave request submitted successfully for approval.", leaveId: result.insertId });
  } catch (err: any) {
    console.error("Apply leave error:", err);
    return res.status(500).json({ success: false, error: "Failed to apply for leave." });
  }
});

// POST /api/staff/withdraw — Record a permanent salary withdrawal in MySQL database
router.post("/withdraw", async (req, res) => {
  try {
    const {
      staffId,
      staffName,
      staffEmail,
      amount,
      month,
      date,
      day,
      time,
      mode = "Instant Bank Withdrawal",
      ref,
      orgId = "AJ01",
    } = req.body ?? {};

    if (!amount) {
      return res.status(400).json({ success: false, error: "Amount is required." });
    }

    // Ensure staff_withdrawals table exists in MySQL database
    await query(`
      CREATE TABLE IF NOT EXISTS staff_withdrawals (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        staff_id VARCHAR(50) DEFAULT NULL,
        staff_name VARCHAR(255) DEFAULT NULL,
        staff_email VARCHAR(255) DEFAULT NULL,
        amount DECIMAL(12,2) NOT NULL,
        month VARCHAR(100) NOT NULL,
        date_str VARCHAR(100) NOT NULL,
        day_str VARCHAR(100) NOT NULL,
        time_str VARCHAR(100) NOT NULL,
        payment_mode VARCHAR(100) NOT NULL,
        transaction_ref VARCHAR(100) NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'Credited / Received',
        org_id VARCHAR(50) DEFAULT 'AJ01',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    const finalRef = ref || `TXN-WDL-${Date.now().toString().slice(-5)}`;
    const finalDate = date || new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
    const finalDay = day || new Date().toLocaleDateString("en-US", { weekday: "long" });
    const finalTime = time || new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
    const finalMonth = month || new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" });

    const insertResult: any = await query(
      `INSERT INTO staff_withdrawals
       (staff_id, staff_name, staff_email, amount, month, date_str, day_str, time_str, payment_mode, transaction_ref, status, org_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Credited / Received', ?)`,
      [
        staffId || null,
        staffName || "Staff",
        staffEmail || null,
        Number(amount),
        finalMonth,
        finalDate,
        finalDay,
        finalTime,
        mode,
        finalRef,
        orgId,
      ]
    );

    const newRecord = {
      id: insertResult.insertId,
      staffId,
      staffName,
      month: finalMonth,
      date: finalDate,
      day: finalDay,
      time: finalTime,
      amount: `₹${Number(amount).toLocaleString("en-IN")}`,
      mode,
      ref: finalRef,
      status: "Credited / Received",
      orgId,
    };

    return res.status(201).json({
      success: true,
      message: "Withdrawal permanently saved in database.",
      transaction: newRecord,
    });
  } catch (err: any) {
    console.error("Staff withdraw DB error:", err);
    return res.status(500).json({ success: false, error: "Failed to record withdrawal in database." });
  }
});

// GET /api/staff/withdraw — Fetch all permanent withdrawal transactions from MySQL database
router.get("/withdraw", async (req, res) => {
  try {
    const { staffEmail, staffId } = req.query;

    await query(`
      CREATE TABLE IF NOT EXISTS staff_withdrawals (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        staff_id VARCHAR(50) DEFAULT NULL,
        staff_name VARCHAR(255) DEFAULT NULL,
        staff_email VARCHAR(255) DEFAULT NULL,
        amount DECIMAL(12,2) NOT NULL,
        month VARCHAR(100) NOT NULL,
        date_str VARCHAR(100) NOT NULL,
        day_str VARCHAR(100) NOT NULL,
        time_str VARCHAR(100) NOT NULL,
        payment_mode VARCHAR(100) NOT NULL,
        transaction_ref VARCHAR(100) NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'Credited / Received',
        org_id VARCHAR(50) DEFAULT 'AJ01',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    let sql = "SELECT * FROM staff_withdrawals";
    let params: any[] = [];

    if (staffEmail && staffId) {
      sql += " WHERE staff_email = ? OR staff_id = ?";
      params.push(staffEmail, staffId);
    } else if (staffEmail) {
      sql += " WHERE staff_email = ?";
      params.push(staffEmail);
    } else if (staffId) {
      sql += " WHERE staff_id = ?";
      params.push(staffId);
    }

    sql += " ORDER BY id DESC";

    const rows = await query<any[]>(sql, params);
    const formatted = rows.map((r) => ({
      id: r.id,
      month: r.month,
      date: r.date_str,
      day: r.day_str,
      time: r.time_str,
      amount: `₹${Number(r.amount).toLocaleString("en-IN")}`,
      mode: r.payment_mode,
      ref: r.transaction_ref,
      status: r.status || "Credited / Received",
      staffId: r.staff_id,
      staffEmail: r.staff_email,
    }));

    return res.json({ success: true, transactions: formatted });
  } catch (err: any) {
    console.error("Fetch staff withdrawals error:", err);
    return res.status(500).json({ success: false, error: "Failed to fetch withdrawals." });
  }
});

export default router;
