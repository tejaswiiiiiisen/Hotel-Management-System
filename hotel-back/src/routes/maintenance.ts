import { Router } from "express";
import { query } from "../db.js";

const router = Router();

query("ALTER TABLE maintenance_tickets ADD COLUMN org_id VARCHAR(50) DEFAULT NULL").catch(() => {});
query("ALTER TABLE maintenance_tickets ADD COLUMN org_name VARCHAR(255) DEFAULT NULL").catch(() => {});

export interface MaintenanceTicketRow {
  id: number;
  ticket_code: string;
  room_id: number | null;
  room_number: string | null;
  floor: string | null;
  asset: string;
  asset_type: string | null;
  category: string;
  issue: string;
  assigned_to: string | null;
  priority: string;
  status: string;
  reported_by: string | null;
  reported_at: string | null;
  cost_estimate?: string | null;
  resolved_at: string | null;
  created_at?: string;
  updated_at?: string;
}

function deriveRoomNumber(asset: string, roomNumArg?: string | null): string | null {
  if (roomNumArg) return String(roomNumArg);
  const match = asset.match(/Room\s*(\d+)/i) || asset.match(/\b(\d{3,4})\b/);
  return match ? match[1] : null;
}

function deriveFloor(asset: string, roomNum?: string | null, floorArg?: string | null): string | null {
  if (floorArg) return floorArg;
  const num = roomNum || deriveRoomNumber(asset);
  if (num) {
    const numVal = parseInt(num, 10);
    if (!isNaN(numVal)) {
      const floorNum = Math.floor(numVal / 100) || 1;
      const suffixes = ["th", "st", "nd", "rd"];
      const v = floorNum % 100;
      const suffix = suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0];
      return `${floorNum}${suffix} Floor`;
    }
  }
  if (/Lobby|Entrance/i.test(asset)) return "Main Lobby";
  if (/Gym|Pool|Spa/i.test(asset)) return "Ground Floor";
  if (/Kitchen|Bakery|Dining/i.test(asset)) return "Ground Floor";
  if (/Elevator|Lift/i.test(asset)) return "All Floors";
  return "Ground Floor";
}

function formatMaintenanceTicket(r: MaintenanceTicketRow) {
  const priority = r.priority || "Medium";
  const status = r.status || "Open";

  let priorityBg = "#ffedd5";
  let priorityColor = "#c2410c";
  if (priority.toLowerCase() === "high") {
    priorityBg = "#fee2e2";
    priorityColor = "#b91c1c";
  } else if (priority.toLowerCase() === "low") {
    priorityBg = "#f1f5f9";
    priorityColor = "#475569";
  }

  let statusBg = "#fef3c7";
  let statusColor = "#d97706";
  if (status.toLowerCase() === "resolved") {
    statusBg = "#dcfce7";
    statusColor = "#15803d";
  } else if (status.toLowerCase().replace(/\s+/g, "") === "inprogress") {
    statusBg = "#e0e7ff";
    statusColor = "#4338ca";
  }

  const roomNumber = r.room_number || deriveRoomNumber(r.asset);
  const floor = r.floor || deriveFloor(r.asset, roomNumber);

  return {
    id: r.ticket_code,
    dbId: r.id,
    ticketCode: r.ticket_code,
    roomId: r.room_id || null,
    roomNumber: roomNumber || null,
    floor: floor || null,
    asset: r.asset,
    assetType: r.asset_type || (r.asset.startsWith("Room") ? "Room" : "Facility"),
    category: r.category || "General",
    issue: r.issue,
    assignedTo: r.assigned_to || "Eng. Ravi Sharma",
    priority,
    priorityBg,
    priorityColor,
    status,
    statusBg,
    statusColor,
    reportedBy: r.reported_by || "Admin Desk",
    reportedAt: r.reported_at || "Just now",
    resolvedAt: r.resolved_at || null,
  };
}

// GET /api/maintenance - Fetch all maintenance tickets
router.get("/", async (req, res) => {
  try {
    const status = req.query.status as string | undefined;
    const priority = req.query.priority as string | undefined;
    const category = req.query.category as string | undefined;
    const search = req.query.search as string | undefined;
    const roomId = req.query.roomId as string | undefined;
    const orgIdParam = (req.query.orgId as string) || (req.query.org_id as string) || (req.headers["x-org-id"] as string);

    const whereClauses: string[] = [];
    const params: unknown[] = [];

    if (orgIdParam) {
      whereClauses.push("org_id = ?");
      params.push(orgIdParam);
    }

    if (roomId) {
      whereClauses.push("room_id = ?");
      params.push(Number(roomId));
    }

    if (category && category !== "All" && category !== "all") {
      whereClauses.push("category = ?");
      params.push(category);
    }

    if (search && search.trim() !== "") {
      whereClauses.push(
        "(ticket_code LIKE ? OR asset LIKE ? OR issue LIKE ? OR assigned_to LIKE ? OR category LIKE ? OR reported_by LIKE ? OR room_number LIKE ? OR floor LIKE ?)"
      );
      const term = `%${search.trim()}%`;
      params.push(term, term, term, term, term, term, term, term);
    }

    const whereSql = whereClauses.length ? `WHERE ${whereClauses.join(" AND ")}` : "";
    const rows = await query<MaintenanceTicketRow>(
      `SELECT * FROM maintenance_tickets ${whereSql} ORDER BY id DESC`,
      params
    );

    let tickets = rows.map(formatMaintenanceTicket);

    if (status && status !== "all" && status !== "All") {
      tickets = tickets.filter(
        (t) => t.status.toLowerCase().replace(/\s+/g, "") === status.toLowerCase().replace(/\s+/g, "")
      );
    }

    if (priority && priority !== "all" && priority !== "All") {
      tickets = tickets.filter((t) => t.priority.toLowerCase() === priority.toLowerCase());
    }

    return res.json({
      success: true,
      count: tickets.length,
      tickets,
    });
  } catch (err: any) {
    console.error("Error fetching maintenance tickets:", err);
    return res.status(500).json({ error: "Failed to fetch maintenance tickets." });
  }
});

// POST /api/maintenance - Log a new maintenance ticket
router.post("/", async (req, res) => {
  try {
    const {
      roomId,
      roomNumber,
      floor,
      asset,
      assetType,
      category,
      issue,
      assignedTo,
      priority,
      reportedBy,
    } = req.body ?? {};

    if (!asset || !issue) {
      return res.status(400).json({ error: "Asset name and issue description are required." });
    }

    const orgIdParam = req.body.orgId || req.body.org_id || req.query.orgId || (req.headers["x-org-id"] as string) || null;
    const ticketCode = `#M-${Math.floor(205 + Math.random() * 800)}`;
    const ticketRoomId = roomId ? Number(roomId) : null;
    const ticketRoomNumber = deriveRoomNumber(asset, roomNumber);
    const ticketFloor = deriveFloor(asset, ticketRoomNumber, floor);
    const ticketAssetType = assetType || (asset.startsWith("Room") ? "Room" : "Custom");
    const ticketCategory = category || "General";
    const ticketAssignedTo = assignedTo || "Eng. Ravi Sharma";
    const ticketPriority = priority || "Medium";
    const ticketReportedBy = reportedBy || "Admin Desk";
    const reportedAt = new Date().toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    const result: any = await query(
      `INSERT INTO maintenance_tickets (ticket_code, room_id, room_number, floor, asset, asset_type, category, issue, assigned_to, priority, status, reported_by, reported_at, org_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Open', ?, ?, ?)`,
      [
        ticketCode,
        ticketRoomId,
        ticketRoomNumber,
        ticketFloor,
        asset,
        ticketAssetType,
        ticketCategory,
        issue,
        ticketAssignedTo,
        ticketPriority,
        ticketReportedBy,
        reportedAt,
        orgIdParam,
      ]
    );

    const inserted = await query<MaintenanceTicketRow>(
      `SELECT * FROM maintenance_tickets WHERE id = ? LIMIT 1`,
      [result.insertId]
    );

    const newTicket = formatMaintenanceTicket(inserted[0]);
    return res.status(201).json({
      message: "Maintenance ticket logged successfully.",
      ticket: newTicket,
    });
  } catch (err: any) {
    console.error("Error logging maintenance ticket:", err);
    return res.status(500).json({ error: "Failed to log maintenance ticket." });
  }
});

// PUT /api/maintenance/:id/status - Update ticket status
router.put("/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body ?? {};

    if (!status) {
      return res.status(400).json({ error: "Status field is required." });
    }

    let existing: MaintenanceTicketRow[];
    if (id.startsWith("#") || isNaN(Number(id))) {
      existing = await query<MaintenanceTicketRow>(
        `SELECT * FROM maintenance_tickets WHERE ticket_code = ? LIMIT 1`,
        [id]
      );
    } else {
      existing = await query<MaintenanceTicketRow>(
        `SELECT * FROM maintenance_tickets WHERE id = ? OR ticket_code = ? LIMIT 1`,
        [Number(id), id]
      );
    }

    if (!existing.length) {
      return res.status(404).json({ error: "Maintenance ticket not found." });
    }

    const current = existing[0];
    const isResolving = status.toLowerCase() === "resolved";

    if (isResolving) {
      await query(
        `UPDATE maintenance_tickets SET status = ?, resolved_at = NOW() WHERE id = ?`,
        [status, current.id]
      );
    } else {
      await query(
        `UPDATE maintenance_tickets SET status = ?, resolved_at = NULL WHERE id = ?`,
        [status, current.id]
      );
    }

    const updated = await query<MaintenanceTicketRow>(
      `SELECT * FROM maintenance_tickets WHERE id = ? LIMIT 1`,
      [current.id]
    );

    const updatedTicket = formatMaintenanceTicket(updated[0]);
    return res.json({
      message: `Ticket status updated to ${status}.`,
      ticket: updatedTicket,
    });
  } catch (err: any) {
    console.error("Error updating maintenance ticket status:", err);
    return res.status(500).json({ error: "Failed to update maintenance ticket status." });
  }
});

// PUT /api/maintenance/:id - Update full ticket details
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const {
      roomId,
      roomNumber,
      floor,
      asset,
      assetType,
      category,
      issue,
      assignedTo,
      priority,
      status,
      reportedBy,
    } = req.body ?? {};

    let existing: MaintenanceTicketRow[];
    if (id.startsWith("#") || isNaN(Number(id))) {
      existing = await query<MaintenanceTicketRow>(
        `SELECT * FROM maintenance_tickets WHERE ticket_code = ? LIMIT 1`,
        [id]
      );
    } else {
      existing = await query<MaintenanceTicketRow>(
        `SELECT * FROM maintenance_tickets WHERE id = ? OR ticket_code = ? LIMIT 1`,
        [Number(id), id]
      );
    }

    if (!existing.length) {
      return res.status(404).json({ error: "Maintenance ticket not found." });
    }

    const current = existing[0];
    const updatedStatus = status ?? current.status;
    const isResolving = updatedStatus.toLowerCase() === "resolved";
    const updatedAsset = asset ?? current.asset;
    const updatedRoomNumber = deriveRoomNumber(updatedAsset, roomNumber ?? current.room_number);
    const updatedFloor = deriveFloor(updatedAsset, updatedRoomNumber, floor ?? current.floor);

    await query(
      `UPDATE maintenance_tickets
       SET room_id = ?, room_number = ?, floor = ?, asset = ?, asset_type = ?, category = ?, issue = ?, assigned_to = ?, priority = ?, status = ?, reported_by = ?, resolved_at = ?
       WHERE id = ?`,
      [
        roomId !== undefined ? (roomId ? Number(roomId) : null) : current.room_id,
        updatedRoomNumber,
        updatedFloor,
        updatedAsset,
        assetType ?? current.asset_type,
        category ?? current.category,
        issue ?? current.issue,
        assignedTo ?? current.assigned_to,
        priority ?? current.priority,
        updatedStatus,
        reportedBy ?? current.reported_by,
        isResolving ? (current.resolved_at || new Date()) : null,
        current.id,
      ]
    );

    const updated = await query<MaintenanceTicketRow>(
      `SELECT * FROM maintenance_tickets WHERE id = ? LIMIT 1`,
      [current.id]
    );

    return res.json({
      message: "Maintenance ticket updated successfully.",
      ticket: formatMaintenanceTicket(updated[0]),
    });
  } catch (err: any) {
    console.error("Error updating maintenance ticket:", err);
    return res.status(500).json({ error: "Failed to update maintenance ticket." });
  }
});

// DELETE /api/maintenance/:id - Delete a maintenance ticket
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    let result: any;
    if (id.startsWith("#") || isNaN(Number(id))) {
      result = await query(`DELETE FROM maintenance_tickets WHERE ticket_code = ?`, [id]);
    } else {
      result = await query(`DELETE FROM maintenance_tickets WHERE id = ? OR ticket_code = ?`, [Number(id), id]);
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Maintenance ticket not found." });
    }

    return res.json({ message: "Maintenance ticket deleted successfully.", id });
  } catch (err: any) {
    console.error("Error deleting maintenance ticket:", err);
    return res.status(500).json({ error: "Failed to delete maintenance ticket." });
  }
});

export default router;
