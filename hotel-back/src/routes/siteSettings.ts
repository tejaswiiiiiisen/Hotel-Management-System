import { Router } from "express";
import { query } from "../db.js";

const router = Router();
const logos = new Map<string, string>();

router.get("/", async (req, res) => {
  const orgId = String(req.query.orgId || "").trim();
  try {
    const rows = orgId
      ? await query<any>("SELECT logo FROM organization_settings WHERE org_id = ? LIMIT 1", [orgId])
      : [];
    const logo = rows[0]?.logo || (orgId ? "" : (logos.get("global") || logos.values().next().value || ""));
    return res.json({ success: true, logo });
  } catch {
    const logo = orgId ? (logos.get(orgId) || "") : (logos.get("global") || logos.values().next().value || "");
    return res.json({ success: true, logo });
  }
});
router.post("/", async (req, res) => {
  const orgId = String(req.body?.orgId || "").trim();
  const logo = typeof req.body?.logo === "string" ? req.body.logo : "";
  if (!orgId) return res.status(400).json({ success: false, message: "orgId is required" });
  try {
    await query("INSERT INTO organization_settings (org_id, logo) VALUES (?, ?) ON DUPLICATE KEY UPDATE logo = VALUES(logo)", [orgId, logo]);
  } catch {
    logos.set(orgId, logo);
  }
  return res.json({ success: true, logo });
});

export default router;
