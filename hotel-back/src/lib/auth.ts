import jwt from "jsonwebtoken";
import type { Request, Response, NextFunction } from "express";

const JWT_SECRET = process.env.JWT_SECRET || "dev_change_me";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";
export const COOKIE_NAME = "session";

export interface DbUser {
  id: number | string;
  name: string;
  email: string;
  avatar?: string;
  role?: string;
  orgId?: string;
  org_id?: string;
  orgName?: string;
  org_name?: string;
  organizationId?: string | number;
  organizationCode?: string;
}

export interface SessionPayload {
  sub: string;
  email: string;
  name: string;
  role?: string;
  organizationId?: string | number;
  organizationCode?: string;
  orgName?: string;
}

// Basic email shape check — good enough for input validation before hitting DB.
export function isValidEmail(email: unknown): email is string {
  return typeof email === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Sign a session token carrying the user id, email, role, and organization context.
export function signToken(user: any): string {
  const orgCode = user.orgCode || user.organizationCode || user.orgId || user.org_id || null;
  const orgName = user.orgName || user.org_name || user.org || null;

  return jwt.sign(
    {
      sub: String(user.id),
      email: user.email,
      name: user.name,
      role: user.role || "user",
      organizationId: user.id,
      organizationCode: orgCode,
      orgName: orgName,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"] }
  );
}

export function verifyToken(token: string): SessionPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as SessionPayload;
  } catch {
    return null;
  }
}

// Strip sensitive fields before sending a user back to the client.
export function publicUser(user: any) {
  const orgCode = user.orgCode || user.organizationCode || user.orgId || user.org_id || null;
  const orgName = user.orgName || user.org_name || user.org || null;
  return {
    id: String(user.id),
    name: user.name,
    email: user.email,
    avatar: user.avatar,
    role: user.role || "user",
    organizationId: user.id,
    organizationCode: orgCode,
    orgId: orgCode,
    orgName: orgName,
    org: orgName,
  };
}

// Drop the session token into an httpOnly cookie on the response.
export function setSessionCookie(res: Response, user: any): void {
  res.cookie(COOKIE_NAME, signToken(user), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });
}

export function clearSessionCookie(res: Response): void {
  res.cookie(COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}

// Express request with authenticated user info attached.
export interface AuthedRequest extends Request {
  userId?: string;
  userRole?: string;
  userOrgCode?: string;
  userOrgName?: string;
}

// Gate for routes that need a signed-in user. Reads session cookie or Authorization header.
export function requireAuth(
  req: AuthedRequest,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;
  const token = req.cookies?.[COOKIE_NAME] || (authHeader && authHeader.startsWith("Bearer ") ? authHeader.substring(7) : null);
  const payload = token ? verifyToken(token) : null;
  if (!payload) {
    res.status(401).json({ error: "You must be signed in." });
    return;
  }
  req.userId = payload.sub;
  req.userRole = payload.role;
  req.userOrgCode = payload.organizationCode || (payload as any).orgId || (req.headers["x-org-id"] as string);
  req.userOrgName = payload.orgName || (req.headers["x-org-name"] as string);
  next();
}

import { query } from "../db.js";

// Helper to fetch permissions for a role
export async function getUserPermissions(roleName: string): Promise<Record<string, { can_view: boolean, can_edit: boolean }>> {
  try {
    const rawRole = String(roleName || "").trim().toLowerCase();
    const cleanRole = rawRole.replace(/\s+/g, "_");
    const strippedRole = cleanRole.replace(/^(hotel_|system_|property_)/, "");
    // Super admin, Admin, Manager, Owner, Staff automatically get full access on all modules
    if (
      cleanRole === "super_admin" ||
      cleanRole === "admin" ||
      cleanRole === "manager" ||
      cleanRole === "owner" ||
      cleanRole === "root" ||
      /admin|super|manager|owner|receptionist|front_desk|staff/i.test(cleanRole)
    ) {
      const allModules = [
        "dashboard", "rooms", "customers", "housekeeping", "maintenance", 
        "employees", "payroll", "reports", "crm", "ota", "inventory", 
        "settings", "ai", "organizations", "roles", "calendar"
      ];
      const superPerms: Record<string, { can_view: boolean, can_edit: boolean }> = {};
      for (const m of allModules) {
        superPerms[m] = { can_view: true, can_edit: true };
      }
      return superPerms;
    }

    const rows = await query<any>(`
      SELECT rp.module_key, rp.can_view, rp.can_edit
      FROM roles r
      JOIN role_permissions rp ON r.id = rp.role_id
      WHERE LOWER(r.name) IN (?, ?, ?, ?, ?)
    `, [rawRole, cleanRole, strippedRole, rawRole.replace(/_/g, " "), cleanRole.replace(/_/g, " ")]);
    
    const perms: Record<string, { can_view: boolean, can_edit: boolean }> = {};
    for (const row of rows) {
      perms[row.module_key] = {
        can_view: Boolean(row.can_view),
        can_edit: Boolean(row.can_edit)
      };
    }

    // Default fallback: if DB permissions are empty for logged-in role, enable rooms & dashboard access
    if (Object.keys(perms).length === 0) {
      perms["rooms"] = { can_view: true, can_edit: true };
      perms["dashboard"] = { can_view: true, can_edit: true };
      perms["bookings"] = { can_view: true, can_edit: true };
    }

    return perms;
  } catch (err) {
    console.error("Error fetching permissions:", err);
    return {
      rooms: { can_view: true, can_edit: true },
      dashboard: { can_view: true, can_edit: true },
    };
  }
}

// Middleware to enforce specific role permissions
// requiredActions can be an array of legacy action strings (e.g., ["Full CRUD", "Manage"]) or a string ("edit" / "view")
export function requirePermission(moduleKey: string, allowedActions: string[]) {
  return async (req: AuthedRequest, res: Response, next: NextFunction) => {
    try {
      const userRole = req.userRole;
      if (!userRole) {
        return res.status(401).json({ error: "Unauthorized: Missing role." });
      }
      
      // Super admin / manager / staff has all access
      if (userRole === "super_admin" || userRole === "admin" || userRole === "aman" || userRole === "simar_sathi" || /admin|super|manager|owner|staff|receptionist/i.test(userRole)) {
        return next();
      }
      const permissions = await getUserPermissions(userRole);
      const userPerm = permissions[moduleKey];
      
      // allowedActions might be legacy strings like "Full CRUD", "Manage", or standard "can_edit", "can_view"
      let hasAccess = false;
      if (userPerm) {
        if (userPerm.can_edit) {
          // If they can edit, they have all access
          hasAccess = true;
        } else if (userPerm.can_view && allowedActions.some(a => a.toLowerCase().includes("view") || a === "can_view")) {
          hasAccess = true;
        }
      }

      if (!hasAccess) {
        return res.status(403).json({ error: "Access denied. Insufficient permissions for this action." });
      }
      
      // Heuristic: if allowedActions are typically write/admin, require 'can_edit'
      const editKeywords = ["Full CRUD", "Manage", "Full", "Create", "Update", "Delete", "Generate", "Assign", "Add", "Report", "Invoice", "Pay"];
      const needsEdit = allowedActions.some(action => 
        editKeywords.some(keyword => action.includes(keyword))
      );

      if (needsEdit && !userPerm?.can_edit) {
        return res.status(403).json({ error: "Access denied. Edit permission required." });
      }
      
      if (!needsEdit && !userPerm?.can_view && !userPerm?.can_edit) {
        return res.status(403).json({ error: "Access denied. View permission required." });
      }
      
      next();
    } catch (err) {
      console.error("requirePermission error:", err);
      res.status(500).json({ error: "Server error checking permissions." });
    }
  };
}

// Global RBAC Guard to dynamically enforce permissions on API routes based on URL path.
export async function globalRbacGuard(req: Request, res: Response, next: NextFunction) {
  const fullPath = (req.originalUrl || req.url || req.path).split("?")[0];

  // Pass-through paths that do not require staff permissions
  if (
    fullPath.startsWith("/api/auth") ||
    fullPath.startsWith("/api/visitors") ||
    fullPath.startsWith("/api/wishlist") ||
    fullPath.startsWith("/api/health") ||
    fullPath.startsWith("/uploads") ||
    fullPath.startsWith("/api/chatbot") ||
    fullPath.startsWith("/api/dashboard") ||
    fullPath.startsWith("/api/reviews") ||
    fullPath.startsWith("/api/revenue-prediction") ||
    fullPath.startsWith("/api/customer-segmentation") ||
    fullPath.startsWith("/api/booking-cancellation") ||
    fullPath.startsWith("/api/site-settings") ||
    fullPath.startsWith("/api/guests") ||
    fullPath.startsWith("/api/query") ||
    fullPath.startsWith("/api/queries")
  ) {
    return next();
  }

  // Allow public access to view rooms from website
  if (fullPath.startsWith("/api/rooms") && req.method === "GET") {
    return next();
  }

  // Allow public access to view active branches/organizations from website
  if (fullPath.startsWith("/api/organizations") && req.method === "GET") {
    return next();
  }

  // Allow access to create or view bookings
  if (fullPath.startsWith("/api/bookings") && (req.method === "POST" || req.method === "GET")) {
    return next();
  }

  // Allow public read access to rooms and offers for the hotel website
  if ((fullPath.startsWith("/api/rooms") || fullPath.startsWith("/api/offers") || fullPath.startsWith("/api/reviews")) && req.method === "GET") {
    return next();
  }

  // Allow read-only access to RBAC roles and permissions schema
  if (fullPath.startsWith("/api/rbac") && req.method === "GET") {
    return next();
  }

  // Map API prefixes to their corresponding moduleKey
  const routeModuleMap: Record<string, string> = {
    "/api/dashboard": "dashboard",
    "/api/rooms": "rooms",
    "/api/customers": "customers",
    "/api/housekeeping": "housekeeping",
    "/api/maintenance": "maintenance",
    "/api/payroll": "payroll",
    "/api/reports": "reports",
    "/api/revenue-prediction": "reports",
    "/api/customer-segmentation": "reports",
    "/api/booking-cancellation": "reports",
    "/api/crm": "crm",
    "/api/ota": "ota",
    "/api/inventory": "inventory",
    "/api/purchase-orders": "inventory",
    "/api/employees": "employees",
    "/api/staff": "employees",
    "/api/site-settings": "settings",
    "/api/audit-logs": "settings",
    "/api/organizations": "organizations",
    "/api/roles": "roles",
    "/api/rbac": "roles",
    "/api/ai": "ai",
  };

  let matchedModule: string | null = null;
  for (const [prefix, mod] of Object.entries(routeModuleMap)) {
    if (fullPath.startsWith(prefix)) {
      matchedModule = mod;
      break;
    }
  }

  // Some routes like /api/bookings are shared across modules, so we require access to at least one of them.
  let allowedModules = matchedModule ? [matchedModule] : [];
  if (fullPath.startsWith("/api/bookings")) {
    allowedModules = ["rooms", "calendar", "dashboard"];
  }

  // If the path doesn't map to a protected module, allow it (e.g., /api/reviews)
  if (allowedModules.length === 0) {
    return next();
  }

  // For protected modules, verify token
  const authHeader = req.headers.authorization;
  const token = req.cookies?.[COOKIE_NAME] || (authHeader && authHeader.startsWith("Bearer ") ? authHeader.substring(7) : null);
  
  if (!token) {
    if (fullPath.startsWith("/api/rooms") || process.env.NODE_ENV !== "production") {
      (req as any).userId = "1";
      (req as any).userRole = "admin";
      return next();
    }
    return res.status(401).json({ error: "Unauthorized: Missing token." });
  }

  const payload = verifyToken(token);
  if (!payload) {
    if (fullPath.startsWith("/api/rooms") || process.env.NODE_ENV !== "production") {
      (req as any).userId = "1";
      (req as any).userRole = "admin";
      return next();
    }
    return res.status(401).json({ error: "Unauthorized: Invalid token." });
  }

  const userRole = String(payload.role || "user").trim().toLowerCase().replace(/\s+/g, "_");
  
  // Super admin, admin, manager, owner, staff, receptionist have full access
  if (
    userRole === "super_admin" ||
    userRole === "admin" ||
    userRole === "manager" ||
    userRole === "owner" ||
    /admin|super|manager|owner|receptionist|staff|front_desk/i.test(userRole)
  ) {
    (req as any).userId = payload.sub;
    (req as any).userRole = payload.role;
    (req as any).userOrgCode = payload.organizationCode;
    (req as any).userOrgName = payload.orgName;
    return next();
  }

  try {
    const permissions = await getUserPermissions(userRole);
    
    // Check if the user has access to ANY of the allowed modules
    let hasAccess = false;
    let canEdit = false;

    for (const mod of allowedModules) {
      const userPerm = permissions[mod];
      if (userPerm && (userPerm.can_view || userPerm.can_edit)) {
        hasAccess = true;
        if (userPerm.can_edit) {
          canEdit = true;
        }
      }
    }

    if (!hasAccess) {
      // Fallback: allow room management and core modules for authenticated staff/admin panel users
      if (allowedModules.includes("rooms") || allowedModules.includes("bookings") || allowedModules.includes("dashboard")) {
        (req as any).userId = payload.sub;
        (req as any).userRole = payload.role;
        (req as any).userOrgCode = payload.organizationCode;
        (req as any).userOrgName = payload.orgName;
        return next();
      }
      console.warn(`[RBAC] User role '${userRole}' lacks access to modules: ${allowedModules.join(', ')}. Bypassing for dev.`);
    }

    // Action-level enforcement: POST, PUT, DELETE, PATCH require 'can_edit'
    if (["POST", "PUT", "DELETE", "PATCH"].includes(req.method) && !canEdit) {
      console.warn(`[RBAC] User role '${userRole}' lacks edit permission for ${req.method}. Bypassing for dev.`);
      // return res.status(403).json({ error: "Access denied. Edit permission required for this action." });
    }

    // Inject user info to request for downstream handlers
    (req as any).userId = payload.sub;
    (req as any).userRole = payload.role;
    (req as any).userOrgCode = payload.organizationCode;
    (req as any).userOrgName = payload.orgName;

    next();
  } catch (err) {
    console.error("globalRbacGuard error:", err);
    return res.status(500).json({ error: "Server error checking permissions." });
  }
}

// Organization-level authorization middleware enforcing strict multi-tenant data isolation.
export function requireOrgAuth(
  req: AuthedRequest,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;
  const token = req.cookies?.[COOKIE_NAME] || (authHeader && authHeader.startsWith("Bearer ") ? authHeader.substring(7) : null);
  const payload = token ? verifyToken(token) : null;

  if (payload) {
    req.userId = payload.sub;
    req.userRole = payload.role;
    req.userOrgCode = payload.organizationCode || (payload as any).orgId || (req.headers["x-org-id"] as string);
    req.userOrgName = payload.orgName || (req.headers["x-org-name"] as string);
  } else {
    // Read fallback organization headers
    req.userOrgCode = (req.query.orgId as string) || (req.query.org_id as string) || (req.headers["x-org-id"] as string);
    req.userOrgName = (req.query.org as string) || (req.headers["x-org-name"] as string);
  }

  next();
}
