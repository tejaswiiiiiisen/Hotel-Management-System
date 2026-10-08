import { Router, Request, Response } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { query } from "../db.js";

const router = Router();

// Static Uploads Directory Configuration
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer Storage Configuration for Logo Uploads
const storage = multer.diskStorage({
  destination: function (_req, _file, cb) {
    cb(null, uploadDir);
  },
  filename: function (_req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, "logo-" + uniqueSuffix + ext);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed!"));
    }
  },
});

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

interface OrgItem {
  id: number;
  org_id?: string;
  name: string;
  description: string;
  status: string;
  logo: string | null;
  branch?: string;
  place?: string;
  city?: string;
  state?: string;
  address?: string;
  created_at: Date;
}

// In-memory fallback array for organizations if MySQL is offline
let inMemoryOrgs: OrgItem[] = [
  { id: 1, org_id: "AJ01", name: "Ajmer Branch", description: "Ajmer prime location hotel branch", status: "Active", logo: null, created_at: new Date("2026-06-01") },
  { id: 2, org_id: "JP01", name: "Jaipur Branch", description: "Jaipur pink city heritage branch", status: "Active", logo: null, created_at: new Date("2026-06-05") },
  { id: 3, org_id: "MA330", name: "Matcha Tea", description: "Premium hospitality & cafe franchise", status: "Active", logo: null, created_at: new Date("2026-06-28") },
  { id: 4, org_id: "CH560", name: "Cheery Clothing", description: "Boutique hotel apparel & merchandise", status: "Active", logo: null, created_at: new Date("2026-06-10") },
  { id: 5, org_id: "AS435", name: "Ashirwad", description: "Luxury resort & suites", status: "Active", logo: null, created_at: new Date("2026-07-01") },
];

function formatOrg(org: any, req: Request) {
  const baseUrl = `${req.protocol}://${req.get("host")}`;
  const createdDate = org.created_at || org.created;
  const orgId = org.org_id || org.orgId || generateOrgId(org.name);
  return {
    id: org.id,
    orgId,
    name: org.name,
    description: org.description || "-",
    status: org.status || "Active",
    logo: org.logo || null,
    branch: org.branch || "",
    place: org.place || "",
    location: org.location || "",
    city: org.city || "",
    state: org.state || "",
    address: org.address || "",
    logoUrl: org.logo ? `${baseUrl}/uploads/${org.logo}` : null,
    created: createdDate ? new Date(createdDate).toLocaleDateString("en-US") : new Date().toLocaleDateString("en-US"),
  };
}

// GET /api/organizations
router.get("/", async (req: Request, res: Response) => {
  try {
    const rows = await query<any>("SELECT * FROM organizations ORDER BY id DESC");
    const result = rows.map((org) => formatOrg(org, req));
    const total = result.length;
    const active = result.filter((o) => o.status === "Active").length;
    const inactive = total - active;

    return res.json({
      success: true,
      stats: { total, active, inactive },
      organizations: result,
    });
  } catch (err: any) {
    console.warn("MySQL unavailable for GET organizations, using in-memory fallback:", err.message);
    const result = inMemoryOrgs.map((org) => formatOrg(org, req));
    const total = result.length;
    const active = result.filter((o) => o.status === "Active").length;
    const inactive = total - active;

    return res.json({
      success: true,
      stats: { total, active, inactive },
      organizations: result,
    });
  }
});

// GET /api/organizations/stats
router.get("/stats", async (_req: Request, res: Response) => {
  try {
    const rows = await query<any>("SELECT status, COUNT(*) as count FROM organizations GROUP BY status");
    let total = 0;
    let active = 0;
    let inactive = 0;

    for (const r of rows) {
      const c = Number(r.count || 0);
      total += c;
      if (r.status === "Active") active += c;
      else inactive += c;
    }

    return res.json({ success: true, stats: { total, active, inactive } });
  } catch (err: any) {
    const total = inMemoryOrgs.length;
    const active = inMemoryOrgs.filter((o) => o.status === "Active").length;
    const inactive = total - active;
    return res.json({ success: true, stats: { total, active, inactive } });
  }
});

// POST /api/organizations
router.post("/", upload.single("logo"), async (req: Request, res: Response) => {
  const { name, description, status, orgId: customOrgId, branch, place, city, state, address } = req.body ?? {};
  const logoFilename = req.file ? req.file.filename : null;

  if (!name || !name.trim()) {
    return res.status(400).json({ success: false, message: "Organization name is required." });
  }

  const cleanName = name.trim();
  const desc = description || "-";
  const stat = status || "Active";
  const finalOrgId = (customOrgId && String(customOrgId).trim()) ? String(customOrgId).trim() : generateOrgId(cleanName);

  try {
    const result: any = await query(
      "INSERT INTO organizations (name, description, status, logo, org_id, branch, place, city, state, address) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [cleanName, desc, stat, logoFilename, finalOrgId, branch || null, place || null, city || null, state || null, address || null]
    );

    const newRows = await query<any>("SELECT * FROM organizations WHERE id = ?", [result.insertId]);
    const createdOrg = newRows[0];

    return res.status(201).json({
      success: true,
      message: "Organization created successfully",
      organization: formatOrg(createdOrg, req),
    });
  } catch (err: any) {
    console.warn("MySQL connection unavailable, saving organization to local fallback store:", err.message);

    const newOrg: OrgItem = {
      id: Date.now(),
      org_id: finalOrgId,
      name: cleanName,
      description: desc,
      status: stat,
      logo: logoFilename,
      branch: branch || null,
      place: place || null,
      city: city || null,
      state: state || null,
      address: address || null,
      created_at: new Date(),
    };
    inMemoryOrgs.unshift(newOrg);

    return res.status(201).json({
      success: true,
      message: "Organization created successfully",
      organization: formatOrg(newOrg, req),
    });
  }
});

// PUT /api/organizations/:id
router.put("/:id", upload.single("logo"), async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, description, status, orgId, branch, place, city, state, address } = req.body ?? {};
  const numericId = parseInt(id, 10);

  try {
    const existing = await query<any>("SELECT * FROM organizations WHERE id = ?", [numericId]);
    if (existing.length > 0) {
      const org = existing[0];
      const newName = name && name.trim() ? name.trim() : org.name;
      const newDesc = description || org.description;
      const newStatus = status || org.status;
      const newLogo = req.file ? req.file.filename : org.logo;
      const newOrgId = orgId || org.org_id;

      await query(
        "UPDATE organizations SET name=?, description=?, status=?, logo=?, org_id=?, branch=?, place=?, city=?, state=?, address=? WHERE id=?",
        [newName, newDesc, newStatus, newLogo, newOrgId, branch || null, place || null, city || null, state || null, address || null, numericId]
      );

      const updatedRows = await query<any>("SELECT * FROM organizations WHERE id = ?", [numericId]);
      return res.json({ success: true, message: "Organization updated successfully", organization: formatOrg(updatedRows[0], req) });
    }
  } catch (err: any) {
    console.warn("MySQL unavailable for PUT organization, updating local fallback store:", err.message);
  }

  // Fallback update in inMemoryOrgs
  const index = inMemoryOrgs.findIndex((o) => o.id === numericId);
  if (index !== -1) {
    const org = inMemoryOrgs[index];
    org.name = name !== undefined ? name.trim() : org.name;
    org.description = description !== undefined ? description : org.description;
    org.status = status !== undefined ? status : org.status;
    if (orgId !== undefined && String(orgId).trim()) org.org_id = String(orgId).trim();
    if (req.file) org.logo = req.file.filename;
    org.branch = branch !== undefined ? branch : org.branch;
    org.place = place !== undefined ? place : org.place;
    org.city = city !== undefined ? city : org.city;
    org.state = state !== undefined ? state : org.state;
    org.address = address !== undefined ? address : org.address;

    return res.json({
      success: true,
      message: "Organization updated successfully",
      organization: formatOrg(org, req),
    });
  }

  return res.status(404).json({ success: false, message: "Organization not found." });
});

// DELETE /api/organizations/:id
router.delete("/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  const numericId = parseInt(id, 10);

  try {
    await query("DELETE FROM organizations WHERE id = ?", [numericId]);
  } catch (err: any) {
    console.warn("MySQL unavailable for DELETE organization, removing from local fallback store:", err.message);
  }

  inMemoryOrgs = inMemoryOrgs.filter((o) => o.id !== numericId);
  return res.json({ success: true, message: "Organization deleted successfully." });
});

// GET /api/organizations/managers — List all managers and their assigned organization
router.get("/managers/all", async (_req: Request, res: Response) => {
  try {
    const managers = await query<any>(
      `SELECT id, name, email, staff_id AS staffId, role, org_id AS orgId, org_id AS organizationCode, org_name AS orgName 
         FROM users 
        WHERE LOWER(role) IN ('manager', 'super_admin', 'admin')
        ORDER BY id DESC`
    );
    return res.json({ success: true, managers });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/organizations/assign-manager — Assign a manager to a specific organization
router.post("/assign-manager", async (req: Request, res: Response) => {
  const { userId, email, orgId, orgName } = req.body ?? {};

  if (!orgId) {
    return res.status(400).json({ success: false, message: "Organization code (orgId) is required." });
  }

  try {
    // Retrieve target organization name if missing
    let targetOrgName = orgName;
    if (!targetOrgName) {
      const orgRows = await query<any>("SELECT name FROM organizations WHERE org_id = ? OR LOWER(name) = LOWER(?) LIMIT 1", [orgId, orgId]);
      if (orgRows.length > 0) targetOrgName = orgRows[0].name;
    }

    if (userId) {
      await query("UPDATE users SET org_id = ?, org_name = ?, role = 'manager' WHERE id = ?", [orgId, targetOrgName, userId]);
    } else if (email) {
      await query("UPDATE users SET org_id = ?, org_name = ?, role = 'manager' WHERE LOWER(email) = ?", [orgId, targetOrgName, String(email).toLowerCase().trim()]);
    } else {
      return res.status(400).json({ success: false, message: "User ID or Email is required." });
    }

    return res.json({
      success: true,
      message: `Manager assigned to ${targetOrgName || orgId} (${orgId}) successfully.`,
      orgId,
      orgName: targetOrgName,
    });
  } catch (err: any) {
    console.error("Assign manager error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
