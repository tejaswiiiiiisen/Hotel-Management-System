import "dotenv/config";
import { query } from "../db.js";

const DEFAULT_ROLES = [
  "super_admin",
  "manager",
  "front_desk",
  "housekeeping",
  "accountant",
  "guest",
  "chef",
];

const DEFAULT_ACCESS: Record<string, Record<string, string>> = {
  super_admin: {
    dashboard: "Full Dashboard",
    calendar: "Full Schedule",
    rooms: "Full CRUD",
    customers: "Full",
    billing: "Full",
    housekeeping: "Full",
    maintenance: "Full",
    payroll: "Full",
    reports: "All Reports",
    crm: "Full",
    ota: "Full",
    inventory: "Full",
    settings: "Full",
    employees: "Full CRUD",
    organizations: "Manage Organizations",
    roles: "Manage Roles & Permissions",
    ai: "Manage AI Integrations",
  },
  manager: {
    dashboard: "Hotel Dashboard",
    calendar: "Full Schedule",
    rooms: "Full CRUD",
    customers: "Full",
    billing: "Full",
    housekeeping: "Assign & Monitor",
    maintenance: "Manage",
    reports: "Hotel Reports",
    crm: "Manage",
    ota: "Manage",
    inventory: "Manage Stock",
    employees: "Create Accountant",
  },
  front_desk: {
    dashboard: "Reception Dashboard",
    calendar: "View Schedule",
    rooms: "View + Room Status Update",
    customers: "Add / Edit / View Guest",
    billing: "Generate Bill / Receive Payment",
    housekeeping: "View & Approve Cleaning",
    maintenance: "Report Issue",
    reports: "Booking Reports",
    crm: "Add Loyalty Points",
    inventory: "View Stock",
    employees: "Create Housekeeping",
  },
  housekeeping: {
    dashboard: "Housekeeping Dashboard",
    calendar: "View Tasks",
    housekeeping: "Update Cleaning Status",
  },
  accountant: {
    dashboard: "Finance Dashboard",
    billing: "Invoice & Reports",
    payroll: "Manage Payroll",
    reports: "Financial Reports",
    inventory: "Purchase & Expense",
  },
  guest: {
    dashboard: "Booking Dashboard",
    customers: "View Own Profile",
    billing: "Pay Bill / Download Invoice",
    crm: "View Points / Offers",
  },
};

export async function initRbacSchema() {
  console.log("🔄 Initializing RBAC Tables & Role Permissions...");

  // 1. Create tables if not exist
  await query(`
    CREATE TABLE IF NOT EXISTS roles (
      id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
      name        VARCHAR(50) NOT NULL UNIQUE,
      description TEXT,
      created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS permissions (
      id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
      module_key  VARCHAR(100) NOT NULL,
      action_name VARCHAR(100) NOT NULL,
      description TEXT,
      created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY uq_perm_module_action (module_key, action_name)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS role_permissions (
      id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
      role_id       INT UNSIGNED NOT NULL,
      permission_id INT UNSIGNED DEFAULT NULL,
      module_key    VARCHAR(100) DEFAULT NULL,
      can_view      TINYINT(1) NOT NULL DEFAULT 1,
      can_edit      TINYINT(1) NOT NULL DEFAULT 1,
      created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      KEY idx_rp_role (role_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  // Migrate legacy installations where these tables predate the current RBAC schema.
  try { await query("ALTER TABLE permissions ADD COLUMN id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY FIRST"); } catch {}
  try { await query("ALTER TABLE permissions ADD COLUMN action_name VARCHAR(100) NOT NULL DEFAULT 'View'"); } catch {}
  try { await query("ALTER TABLE permissions ADD COLUMN description TEXT"); } catch {}
  try { await query("ALTER TABLE role_permissions ADD COLUMN permission_id INT UNSIGNED DEFAULT NULL"); } catch {}

  // Ensure can_view, can_edit, module_key exist
  try { await query("ALTER TABLE role_permissions ADD COLUMN module_key VARCHAR(100) DEFAULT NULL"); } catch {}
  try { await query("ALTER TABLE role_permissions ADD COLUMN can_view TINYINT(1) NOT NULL DEFAULT 1"); } catch {}
  try { await query("ALTER TABLE role_permissions ADD COLUMN can_edit TINYINT(1) NOT NULL DEFAULT 1"); } catch {}

  // 2. Ensure Roles
  for (const roleName of DEFAULT_ROLES) {
    await query("INSERT IGNORE INTO roles (name, description) VALUES (?, ?)", [
      roleName,
      `Default ${roleName} role`,
    ]);
  }

  // 3. Ensure Permissions
  const allPermissions = new Map<string, string>();
  for (const [role, modules] of Object.entries(DEFAULT_ACCESS)) {
    for (const [moduleKey, actionName] of Object.entries(modules)) {
      if (!allPermissions.has(moduleKey + "_" + actionName)) {
        await query(
          "INSERT IGNORE INTO permissions (module_key, action_name, description) VALUES (?, ?, ?)",
          [moduleKey, actionName, `Access to ${moduleKey} - ${actionName}`]
        );
        allPermissions.set(moduleKey + "_" + actionName, "inserted");
      }
    }
  }

  // 4. Map Role Permissions
  for (const [roleName, modules] of Object.entries(DEFAULT_ACCESS)) {
    const rows = await query<any>("SELECT id FROM roles WHERE name = ?", [roleName]);
    if (rows.length === 0) continue;
    const roleId = rows[0].id;

    for (const [moduleKey, actionName] of Object.entries(modules)) {
      const permRows = await query<any>(
        "SELECT id FROM permissions WHERE module_key = ? AND action_name = ?",
        [moduleKey, actionName]
      );
      const permId = permRows.length > 0 ? permRows[0].id : null;

      const existingMapping = await query<any>(
        "SELECT role_id FROM role_permissions WHERE role_id = ? AND module_key = ? LIMIT 1",
        [roleId, moduleKey]
      );

      if (existingMapping.length === 0) {
        const canEdit = roleName === "super_admin" || actionName.toLowerCase().includes("full") || actionName.toLowerCase().includes("crud") || actionName.toLowerCase().includes("manage");
        await query(
          "INSERT INTO role_permissions (role_id, permission_id, module_key, can_view, can_edit) VALUES (?, ?, ?, 1, ?)",
          [roleId, permId, moduleKey, canEdit ? 1 : 0]
        );
      }
    }
  }

  console.log("✅ RBAC schema & role permissions initialized successfully!");
}

if (process.argv[1]?.includes("init-rbac-schema")) {
  initRbacSchema().then(() => process.exit(0)).catch((e) => {
    console.error("RBAC init error:", e);
    process.exit(1);
  });
}
