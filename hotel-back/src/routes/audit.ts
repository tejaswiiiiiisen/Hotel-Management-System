import { Router } from "express";
import { query } from "../db.js";

const router = Router();

// GET /api/audit-logs
router.get("/", async (req, res) => {
  try {
    const { 
      organization_id, branch_id, module, action, start_date, end_date, search, 
      page = "1", limit = "50" 
    } = req.query;

    const authOrgId = (req.headers["x-org-id"] as string);
    const authRole = ((req as any).user?.role || req.headers["x-user-role"] as string || "user");

    const conditions: string[] = ["1=1"];
    const params: any[] = [];

    // RBAC logic for branch viewing
    if (authRole !== "super_admin") {
      if (authOrgId) {
        conditions.push("(organization_id = ? OR branch_id = ?)");
        params.push(authOrgId, authOrgId);
      } else {
        // If no authOrgId is provided and not super admin, block access
        return res.status(403).json({ success: false, error: "Access denied." });
      }
    }

    if (organization_id) {
      conditions.push("organization_id = ?");
      params.push(organization_id);
    }
    if (branch_id) {
      conditions.push("branch_id = ?");
      params.push(branch_id);
    }
    if (module) {
      conditions.push("module = ?");
      params.push(module);
    }
    if (action) {
      conditions.push("action = ?");
      params.push(action);
    }
    if (start_date) {
      conditions.push("created_at >= ?");
      params.push(`${start_date} 00:00:00`);
    }
    if (end_date) {
      conditions.push("created_at <= ?");
      params.push(`${end_date} 23:59:59`);
    }
    if (search) {
      conditions.push("(user_name LIKE ? OR action LIKE ? OR description LIKE ? OR entity_id LIKE ?)");
      const searchStr = `%${search}%`;
      params.push(searchStr, searchStr, searchStr, searchStr);
    }

    const whereClause = conditions.join(" AND ");

    // Get Total count
    const [countRow] = await query<any>("SELECT COUNT(*) as total FROM audit_logs WHERE " + whereClause, params);
    const total = countRow.total;

    // Pagination
    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 50;
    const offset = (pageNum - 1) * limitNum;

    const sql = `SELECT * FROM audit_logs WHERE ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`;
    const rows = await query<any[]>(sql, [...params, limitNum, offset]);

    res.json({ success: true, data: rows, total, page: pageNum, limit: limitNum });
  } catch (err: any) {
    console.error("GET /api/audit-logs error:", err);
    res.status(500).json({ success: false, error: "Failed to fetch audit logs." });
  }
});

export default router;
