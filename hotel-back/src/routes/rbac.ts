import { Router } from "express";
import { query } from "../db.js";
import { requireAuth, getUserPermissions } from "../lib/auth.js";

const router = Router();

// Auto-initialize `roles` and `role_permissions` schema in MySQL if not present
(async () => {
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS roles (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE,
        description VARCHAR(255) DEFAULT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS role_permissions (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        role_id INT UNSIGNED NOT NULL,
        permission_id INT UNSIGNED NULL,
        module_key VARCHAR(100) NOT NULL,
        can_view TINYINT(1) NOT NULL DEFAULT 0,
        can_edit TINYINT(1) NOT NULL DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_role (role_id),
        INDEX idx_module (module_key)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    const defaultRoles = [
      { name: "super_admin", description: "Default super_admin role" },
      { name: "manager", description: "Default manager role" },
      { name: "front_desk", description: "Default front_desk role" },
      { name: "housekeeping", description: "Default housekeeping role" },
      { name: "accountant", description: "Default accountant role" },
      { name: "guest", description: "Default guest role" },
      { name: "chef", description: "Default chef role" },
    ];

    for (const r of defaultRoles) {
      await query("INSERT IGNORE INTO roles (name, description) VALUES (?, ?)", [r.name, r.description]);
    }
  } catch (e: any) {
    console.warn("RBAC tables auto-init notice:", e.message);
  }
})();

// Middleware to ensure user is super_admin
const requireSuperAdmin = async (req: any, res: any, next: any) => {
  try {
    if (req.userId == 1 || req.userId === "1") { // Fallback admin
      return next();
    }
    const rows = await query<any>("SELECT role FROM users WHERE id = ?", [req.userId]);
    if (rows.length === 0 || rows[0].role !== "super_admin") {
      return res.status(403).json({ error: "Only Super Admin can access this." });
    }
    next();
  } catch (err) {
    res.status(500).json({ error: "Database error checking role." });
  }
};

// GET /api/rbac/roles (All authenticated users or system clients can view the list of roles)
router.get("/roles", async (req, res) => {
  try {
    const roles = await query("SELECT * FROM roles ORDER BY id ASC");
    res.json(roles);
  } catch (err) {
    console.error("GET /rbac/roles error:", err);
    res.status(500).json({ error: "Failed to fetch roles." });
  }
});

// GET /api/rbac/permissions
router.get("/permissions", requireAuth, requireSuperAdmin, async (req, res) => {
  try {
    const permissions = await query("SELECT * FROM permissions ORDER BY module_key ASC, id ASC");
    res.json(permissions);
  } catch (err) {
    console.error("GET /rbac/permissions error:", err);
    res.status(500).json({ error: "Failed to fetch permissions." });
  }
});

// GET /api/rbac/role-permissions
// Returns mapping: { [role_id]: { [module_key]: { can_view: boolean, can_edit: boolean } } }
router.get("/role-permissions", async (req, res) => {
  try {
    const mappings = await query<any>("SELECT role_id, module_key, can_view, can_edit FROM role_permissions");
    
    const rolePermissions: Record<number, Record<string, { can_view: boolean, can_edit: boolean }>> = {};
    for (const mapping of mappings) {
      if (!rolePermissions[mapping.role_id]) {
        rolePermissions[mapping.role_id] = {};
      }
      rolePermissions[mapping.role_id][mapping.module_key] = {
        can_view: Boolean(mapping.can_view),
        can_edit: Boolean(mapping.can_edit)
      };
    }
    
    res.json(rolePermissions);
  } catch (err) {
    console.error("GET /rbac/role-permissions error:", err);
    res.status(500).json({ error: "Failed to fetch role permissions." });
  }
});

// GET /api/rbac/role-permissions/:roleName
router.get("/role-permissions/:roleName", async (req, res) => {
  try {
    const roleName = req.params.roleName;
    const perms = await getUserPermissions(roleName);
    res.json(perms);
  } catch (err) {
    console.error("GET /rbac/role-permissions/:roleName error:", err);
    res.status(500).json({ error: "Failed to fetch permissions for role." });
  }
});

// POST /api/rbac/role-permissions
// Assign permissions to a role. Body: { role_id: number, permissions: [{ module_key: string, can_view: boolean, can_edit: boolean }] }
// Assign permissions to a role. Body: { role_id: number, permissions: { module_key: string, can_view: boolean, can_edit: boolean }[] }
router.post("/role-permissions", requireAuth, requireSuperAdmin, async (req, res) => {
  try {
    const { role_id, permissions } = req.body;
    if (!role_id || !Array.isArray(permissions)) {
      return res.status(400).json({ error: "Invalid payload." });
    }

    // Begin a simple transaction-like delete and insert
    await query("DELETE FROM role_permissions WHERE role_id = ?", [role_id]);
    
    for (const p of permissions) {
      if (!p.module_key) continue;
      const permissionRows = await query<any>("SELECT id FROM permissions WHERE module_key = ? LIMIT 1", [p.module_key]);
      const permissionId = permissionRows.length ? permissionRows[0].id : null;
      await query(
        "INSERT INTO role_permissions (role_id, permission_id, module_key, can_view, can_edit) VALUES (?, ?, ?, ?, ?)",
        [role_id, permissionId, p.module_key, p.can_view ? 1 : 0, p.can_edit ? 1 : 0]
      );
    }

    res.json({ message: "Permissions updated successfully." });
  } catch (err) {
    console.error("POST /rbac/role-permissions error:", err);
    res.status(500).json({ error: "Failed to update role permissions." });
  }
});

// POST /api/rbac/roles
// Create a new role
router.post("/roles", requireAuth, requireSuperAdmin, async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ error: "Role name is required." });
    
    // Check if exists
    const existing = await query("SELECT id FROM roles WHERE name = ?", [name]);
    if (existing.length > 0) {
      return res.status(400).json({ error: "Role already exists." });
    }
    
    const desc = description || `Custom user-defined role for ${name}`;
    await query("INSERT INTO roles (name, description) VALUES (?, ?)", [name, desc]);
    const inserted = await query("SELECT * FROM roles WHERE name = ?", [name]);
    res.json(inserted[0]);
  } catch (err) {
    console.error("POST /rbac/roles error:", err);
    res.status(500).json({ error: "Failed to create role." });
  }
});

// DELETE /api/rbac/roles/:id
router.delete("/roles/:id", requireAuth, requireSuperAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const rows = await query<any>("SELECT name FROM roles WHERE id = ?", [id]);
    if (rows.length === 0) return res.status(404).json({ error: "Role not found." });
    if (rows[0].name === "super_admin") return res.status(400).json({ error: "Cannot delete super_admin." });
    
    await query("DELETE FROM role_permissions WHERE role_id = ?", [id]);
    await query("DELETE FROM roles WHERE id = ?", [id]);
    res.json({ message: "Role deleted successfully." });
  } catch (err) {
    console.error("DELETE /rbac/roles error:", err);
    res.status(500).json({ error: "Failed to delete role." });
  }
});

export default router;
