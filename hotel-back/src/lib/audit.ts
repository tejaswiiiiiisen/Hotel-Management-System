import { query } from "../db.js";
import { Request } from "express";

export interface AuditLogOptions {
  req?: Request;
  action: string;
  module: string;
  activity_type: "Create" | "Update" | "Delete" | "Login" | "Logout" | "System" | "Other";
  description?: string;
  entity_type?: string;
  entity_id?: string;
  old_value?: any;
  new_value?: any;
  status?: "Success" | "Failed";
  overrideUser?: {
    id?: string;
    name?: string;
    role?: string;
    organization_id?: string;
    branch_id?: string;
  };
}

/**
 * Asynchronously logs an activity to the audit_logs table.
 */
export async function logActivity(options: AuditLogOptions) {
  try {
    const { req, overrideUser, action, module, activity_type, description, entity_type, entity_id, old_value, new_value, status } = options;

    // Determine user info
    let user_id = overrideUser?.id || null;
    let user_name = overrideUser?.name || null;
    let user_role = overrideUser?.role || null;
    let organization_id = overrideUser?.organization_id || null;
    let branch_id = overrideUser?.branch_id || null;
    let ip_address = null;
    let user_agent = null;

    if (req) {
      if (!user_id && (req as any).user) user_id = (req as any).user.id;
      if (!user_name && (req as any).user) user_name = (req as any).user.name;
      if (!user_role && (req as any).user) user_role = (req as any).user.role;
      if (!organization_id && (req as any).user) organization_id = (req as any).user.orgId;
      if (!branch_id) {
        branch_id = (req.query.branch_id as string) || (req.query.orgId as string) || (req.headers["x-org-id"] as string) || ((req as any).user?.orgId) || null;
      }
      ip_address = req.ip || req.connection?.remoteAddress || null;
      user_agent = req.headers["user-agent"] || null;
    }

    // Only set org_id if not present but branch is, or just keep whatever we found
    if (!organization_id && branch_id) {
       organization_id = branch_id; // in this system, orgId acts as branch ID in some places
    }

    const sql = `
      INSERT INTO audit_logs (
        organization_id, branch_id, user_id, user_name, user_role, 
        action, module, activity_type, description, entity_type, entity_id, 
        old_value, new_value, ip_address, user_agent, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      organization_id, branch_id, user_id, user_name, user_role,
      action, module, activity_type, description || null, entity_type || null, entity_id || null,
      old_value ? JSON.stringify(old_value) : null,
      new_value ? JSON.stringify(new_value) : null,
      ip_address, user_agent, status || "Success"
    ];

    // Fire and forget
    query(sql, params).catch(e => {
      console.warn("Failed to write audit log to database:", e.message);
    });
  } catch (err) {
    console.error("Audit log error:", err);
  }
}
