import "dotenv/config";
import bcrypt from "bcryptjs";
import { query, db } from "../db.js";

export function generateOrgId(orgName?: string): string {
  let prefix = "OG";
  if (orgName && typeof orgName === "string") {
    const clean = orgName.replace(/[^a-zA-Z]/g, "").toUpperCase();
    if (clean.length >= 2) {
      prefix = clean.substring(0, 2);
    } else if (clean.length === 1) {
      prefix = clean + "X";
    }
  }
  const nums = Math.floor(100 + Math.random() * 900);
  return `${prefix}${nums}`;
}

export async function initAdminAndOrgs() {
  try {
    console.log("🔄 Initializing Organizations table, multi-tenant schemas & default users...");

    // 1. Create `users` table if not exists
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
        name          VARCHAR(255) NOT NULL,
        email         VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        phone         VARCHAR(50) DEFAULT NULL,
        staff_id      VARCHAR(50) DEFAULT NULL,
        role          VARCHAR(50) NOT NULL DEFAULT 'user',
        org_id        VARCHAR(50) DEFAULT NULL,
        org_name      VARCHAR(255) DEFAULT NULL,
        created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Ensure all required columns exist in `users` table
    const userAlterColumns = [
      "ALTER TABLE users ADD COLUMN phone VARCHAR(50) DEFAULT NULL",
      "ALTER TABLE users ADD COLUMN staff_id VARCHAR(50) DEFAULT NULL",
      "ALTER TABLE users ADD COLUMN role VARCHAR(50) NOT NULL DEFAULT 'user'",
      "ALTER TABLE users ADD COLUMN org_id VARCHAR(50) DEFAULT NULL",
      "ALTER TABLE users ADD COLUMN org_name VARCHAR(255) DEFAULT NULL",
      "ALTER TABLE users ADD COLUMN avatar LONGTEXT DEFAULT NULL",
      "ALTER TABLE users ADD COLUMN username VARCHAR(255) DEFAULT NULL",
      "ALTER TABLE users ADD COLUMN dob VARCHAR(50) DEFAULT NULL",
      "ALTER TABLE users ADD COLUMN country VARCHAR(100) DEFAULT NULL",
      "ALTER TABLE users ADD COLUMN address TEXT DEFAULT NULL",
      "ALTER TABLE users ADD COLUMN reset_token_hash VARCHAR(255) DEFAULT NULL",
      "ALTER TABLE users ADD COLUMN reset_token_expiry DATETIME DEFAULT NULL",
    ];
    for (const sql of userAlterColumns) {
      try {
        await query(sql);
      } catch {}
    }

    // 2. Create `organizations` table if not exists with UNIQUE org_id
    await query(`
      CREATE TABLE IF NOT EXISTS organizations (
        id           INT UNSIGNED NOT NULL AUTO_INCREMENT,
        org_id       VARCHAR(50) NOT NULL UNIQUE,
        name         VARCHAR(255) NOT NULL,
        location     VARCHAR(255) DEFAULT NULL,
        description  TEXT,
        status       VARCHAR(50) NOT NULL DEFAULT 'Active',
        logo         VARCHAR(255) DEFAULT NULL,
        created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    try {
      await query("ALTER TABLE organizations ADD COLUMN location VARCHAR(255) DEFAULT NULL");
    } catch {}

    await query(`
      CREATE TABLE IF NOT EXISTS organization_settings (
        org_id VARCHAR(50) NOT NULL,
        logo LONGTEXT DEFAULT NULL,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (org_id),
        CONSTRAINT fk_org_settings_org FOREIGN KEY (org_id) REFERENCES organizations(org_id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    try {
      await query("ALTER TABLE organizations ADD UNIQUE INDEX uq_org_id (org_id)");
    } catch {}

    // Seed default branches into `organizations` if missing
    const defaultBranches = [
      { org_id: "AJ01", name: "Ajmer Branch", location: "Ajmer, Rajasthan", description: "Ajmer prime location hotel branch", status: "Active" },
      { org_id: "JP01", name: "Jaipur Branch", location: "Jaipur, Rajasthan", description: "Jaipur pink city heritage branch", status: "Active" },
      { org_id: "MA330", name: "Matcha Tea", location: "Main Branch", description: "Premium hospitality & cafe franchise", status: "Active" },
      { org_id: "CH560", name: "Cheery Clothing", location: "Apparel Hub", description: "Boutique hotel apparel & merchandise", status: "Active" },
      { org_id: "AS435", name: "Ashirwad", location: "Ashirwad Complex", description: "Luxury resort & suites", status: "Active" },
    ];

    for (const b of defaultBranches) {
      const existing = await query("SELECT id FROM organizations WHERE org_id = ? OR name = ? LIMIT 1", [b.org_id, b.name]);
      if (existing.length === 0) {
        await query(
          "INSERT INTO organizations (org_id, name, location, description, status) VALUES (?, ?, ?, ?, ?)",
          [b.org_id, b.name, b.location, b.description, b.status]
        );
      } else {
        await query(
          "UPDATE organizations SET org_id = ?, location = COALESCE(location, ?) WHERE id = ?",
          [b.org_id, b.location, existing[0].id]
        );
      }
    }
    console.log("🏢 Seeded & verified multi-tenant organization branches (AJ01, JP01, MA330, CH560, AS435).");

    // 3. Seed default admin user & demo branch managers
    const adminEmail = (process.env.ADMIN_EMAIL || "adminhotel@hotel.com").toLowerCase().trim();
    const adminRawPassword = process.env.ADMIN_PASSWORD || "admin123";

    const existingAdmin = await query("SELECT id FROM users WHERE LOWER(email) = ? LIMIT 1", [adminEmail]);
    if (existingAdmin.length === 0) {
      const hashedPassword = await bcrypt.hash(adminRawPassword, 10);
      await query(
        "INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)",
        ["Super Admin", adminEmail, hashedPassword, "super_admin"]
      );
      console.log(`👤 Seeded default admin user: ${adminEmail}`);
    }

    // Seed Manager Rahul (Ajmer AJ01) and Manager Priya (Jaipur JP01)
    const demoManagers = [
      { name: "Rahul (Ajmer Manager)", email: "rahul.manager@ajmer.com", role: "manager", org_id: "AJ01", org_name: "Ajmer Branch" },
      { name: "Priya (Jaipur Manager)", email: "priya.manager@jaipur.com", role: "manager", org_id: "JP01", org_name: "Jaipur Branch" },
      { name: "Rajesh Manager", email: "manager@hotel.com", role: "manager", org_id: "MA330", org_name: "Matcha Tea" },
    ];

    const demoHousekeepers = [
      { name: "Sunita Devi", email: "sunita.jp@hotel.com", org_id: "JP01", org_name: "Jaipur Branch" },
      { name: "Ramesh Kumar", email: "ramesh.jp@hotel.com", org_id: "JP01", org_name: "Jaipur Branch" },
      { name: "Kavita Shinde", email: "kavita.aj@hotel.com", org_id: "AJ01", org_name: "Ajmer Branch" },
      { name: "Meera Nair", email: "meera.ma@hotel.com", org_id: "MA330", org_name: "Matcha Tea" },
    ];

    const defaultPassHash = await bcrypt.hash("manager123", 10);
    for (const m of demoManagers) {
      const existingMgr = await query<any>("SELECT id FROM users WHERE LOWER(email) = ? LIMIT 1", [m.email]);
      if (existingMgr.length === 0) {
        await query(
          "INSERT INTO users (name, email, password_hash, role, org_id, org_name) VALUES (?, ?, ?, ?, ?, ?)",
          [m.name, m.email, defaultPassHash, m.role, m.org_id, m.org_name]
        );
      } else {
        await query(
          "UPDATE users SET role = ?, org_id = ?, org_name = ? WHERE id = ?",
          [m.role, m.org_id, m.org_name, existingMgr[0].id]
        );
      }
    }
    for (const h of demoHousekeepers) {
      const existing = await query<any>("SELECT id FROM users WHERE LOWER(email) = ? LIMIT 1", [h.email]);
      if (existing.length === 0) {
        await query("INSERT INTO users (name, email, password_hash, role, org_id, org_name) VALUES (?, ?, ?, 'housekeeping', ?, ?)", [h.name, h.email, defaultPassHash, h.org_id, h.org_name]);
      } else {
        await query("UPDATE users SET name = ?, role = 'housekeeping', org_id = ?, org_name = ? WHERE id = ?", [h.name, h.org_id, h.org_name, existing[0].id]);
      }
    }
    console.log("👤 Verified demo managers (Rahul AJ01, Priya JP01).");

    console.log("✅ Admin & Organizations database setup complete.");
  } catch (error: any) {
    console.warn("⚠️ Warning during initAdminAndOrgs:", error.message);
  }
}

if (process.argv[1]?.endsWith("init-admin-orgs.ts") || process.argv[1]?.endsWith("init-admin-orgs.js")) {
  initAdminAndOrgs().then(() => {
    db.end();
  });
}
