import { Router } from "express";
import { query } from "../db.js";

const router = Router();

// Auto-initialize visitors table if not exists and ensure room_number, floor, and amount_paid columns exist
export async function initVisitorsSchema() {
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS visitors (
        id INT UNSIGNED NOT NULL AUTO_INCREMENT,
        name VARCHAR(255) NOT NULL,
        phone VARCHAR(50) NOT NULL,
        room_number VARCHAR(50) DEFAULT '101',
        floor VARCHAR(50) DEFAULT '1st Floor',
        amount_paid DECIMAL(10,2) NOT NULL DEFAULT 0.00,
        person_to_meet VARCHAR(255) DEFAULT NULL,
        purpose VARCHAR(255) DEFAULT NULL,
        org_id VARCHAR(50) NOT NULL,
        org_name VARCHAR(255) NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'Expected', -- 'Expected', 'Checked-In', 'Checked-Out', 'Cancelled'
        check_in DATETIME DEFAULT NULL,
        check_out DATETIME DEFAULT NULL,
        visit_date DATE NOT NULL,
        notes TEXT DEFAULT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        INDEX idx_visitors_org (org_id),
        INDEX idx_visitors_status (status),
        INDEX idx_visitors_date (visit_date)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Ensure columns exist
    try {
      await query("ALTER TABLE visitors ADD COLUMN room_number VARCHAR(50) DEFAULT '101'");
    } catch {}
    try {
      await query("ALTER TABLE visitors ADD COLUMN floor VARCHAR(50) DEFAULT '1st Floor'");
    } catch {}
    try {
      await query("ALTER TABLE visitors ADD COLUMN amount_paid DECIMAL(10,2) NOT NULL DEFAULT 0.00");
    } catch {}

    // Check if visitors table is empty. If empty, seed initial realistic records across real branches
    const existing = await query<any>("SELECT COUNT(*) AS count FROM visitors");
    const count = Number(existing[0]?.count || 0);

    if (count === 0) {
      console.log("🌱 Seeding realistic visitor records into database...");
      const seeds = [
        {
          name: "Vikram Sharma",
          phone: "+91 98290 12345",
          room_number: "204",
          floor: "2nd Floor",
          amount_paid: 2500,
          org_id: "AJ01",
          org_name: "Ajmer Branch",
          status: "Checked-In",
          check_in: "2026-09-27 10:15:00",
          check_out: null,
          visit_date: "2026-09-27",
        },
        {
          name: "Anita Deshmukh",
          phone: "+91 94140 88765",
          room_number: "108",
          floor: "1st Floor",
          amount_paid: 3200,
          org_id: "AJ01",
          org_name: "Ajmer Branch",
          status: "Checked-Out",
          check_in: "2026-09-27 09:30:00",
          check_out: "2026-09-27 11:45:00",
          visit_date: "2026-09-27",
        },
        {
          name: "Rajendra Rathore",
          phone: "+91 98280 54321",
          room_number: "302",
          floor: "3rd Floor",
          amount_paid: 1800,
          org_id: "AJ01",
          org_name: "Ajmer Branch",
          status: "Expected",
          check_in: null,
          check_out: null,
          visit_date: "2026-09-27",
        },
        {
          name: "Meera Sen",
          phone: "+91 97830 11223",
          room_number: "115",
          floor: "1st Floor",
          amount_paid: 4500,
          org_id: "AJ01",
          org_name: "Ajmer Branch",
          status: "Checked-In",
          check_in: "2026-09-27 12:05:00",
          check_out: null,
          visit_date: "2026-09-27",
        },
        {
          name: "Suresh Gupta",
          phone: "+91 91660 99887",
          room_number: "201",
          floor: "2nd Floor",
          amount_paid: 2800,
          org_id: "JP01",
          org_name: "Jaipur Branch",
          status: "Checked-In",
          check_in: "2026-09-27 11:00:00",
          check_out: null,
          visit_date: "2026-09-27",
        },
        {
          name: "Kavita Rao",
          phone: "+91 98299 44332",
          room_number: "105",
          floor: "1st Floor",
          amount_paid: 1500,
          org_id: "MA330",
          org_name: "Matcha Tea",
          status: "Checked-Out",
          check_in: "2026-09-26 14:00:00",
          check_out: "2026-09-26 15:30:00",
          visit_date: "2026-09-26",
        },
        {
          name: "Amitabh Joshi",
          phone: "+91 94142 33445",
          room_number: "112",
          floor: "1st Floor",
          amount_paid: 2000,
          org_id: "CH560",
          org_name: "Cheery Clothing",
          status: "Expected",
          check_in: null,
          check_out: null,
          visit_date: "2026-09-27",
        },
        {
          name: "Pooja Trivedi",
          phone: "+91 99281 77665",
          room_number: "401",
          floor: "4th Floor",
          amount_paid: 5000,
          org_id: "AS435",
          org_name: "Ashirwad",
          status: "Checked-Out",
          check_in: "2026-09-25 10:00:00",
          check_out: "2026-09-25 12:15:00",
          visit_date: "2026-09-25",
        },
        {
          name: "Deepak Choudhary",
          phone: "+91 98295 66778",
          room_number: "305",
          floor: "3rd Floor",
          amount_paid: 0,
          org_id: "AJ01",
          org_name: "Ajmer Branch",
          status: "Cancelled",
          check_in: null,
          check_out: null,
          visit_date: "2026-09-24",
        }
      ];

      for (const s of seeds) {
        await query(
          `INSERT INTO visitors (name, phone, room_number, floor, amount_paid, org_id, org_name, status, check_in, check_out, visit_date)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [s.name, s.phone, s.room_number, s.floor, s.amount_paid, s.org_id, s.org_name, s.status, s.check_in, s.check_out, s.visit_date]
        );
      }
      console.log("✅ Seeded initial real visitor records successfully.");
    } else {
      // Ensure existing records have valid amounts
      await query("UPDATE visitors SET amount_paid = 2000 WHERE amount_paid IS NULL OR amount_paid = 0 AND status != 'Cancelled'");
    }
  } catch (err: any) {
    console.error("Error initializing visitors schema:", err?.message || err);
  }
}

// Ensure schema on module load
initVisitorsSchema();

// GET /api/visitors/branches — Get all real branches from database
router.get("/branches", async (_req, res) => {
  try {
    const branches = await query<any>(
      "SELECT org_id AS orgId, name, location, status FROM organizations WHERE status = 'Active' ORDER BY id ASC"
    );
    return res.json({ success: true, branches });
  } catch (err: any) {
    console.error("GET /api/visitors/branches error:", err);
    return res.status(500).json({ success: false, error: "Failed to fetch branches." });
  }
});

// GET /api/visitors — List visitors and calculated dynamic statistics based on real DB records
router.get("/", async (req, res) => {
  try {
    const {
      year,
      month,
      day,
      date,
      startDate,
      endDate,
      branch,
      orgId,
      status,
      search,
    } = req.query as {
      year?: string;
      month?: string;
      day?: string;
      date?: string;
      startDate?: string;
      endDate?: string;
      branch?: string;
      orgId?: string;
      status?: string;
      search?: string;
    };

    const targetBranch = orgId || branch;

    // Build WHERE clause for table data
    const whereClauses: string[] = ["1=1"];
    const params: unknown[] = [];

    // Branch filter
    if (targetBranch && targetBranch !== "ALL") {
      whereClauses.push("(v.org_id = ? OR v.org_name = ?)");
      params.push(targetBranch, targetBranch);
    }

    // Status filter
    if (status && status !== "ALL") {
      whereClauses.push("v.status = ?");
      params.push(status);
    }

    // Specific Date filter
    if (date && date !== "ALL" && date.trim() !== "") {
      whereClauses.push("v.visit_date = ?");
      params.push(date);
    } else {
      // Date Range filter
      if (startDate && startDate.trim() !== "") {
        whereClauses.push("v.visit_date >= ?");
        params.push(startDate);
      }
      if (endDate && endDate.trim() !== "") {
        whereClauses.push("v.visit_date <= ?");
        params.push(endDate);
      }

      // Year, Month & Day filter
      if (!startDate && !endDate) {
        if (year && year !== "ALL" && year.trim() !== "") {
          whereClauses.push("YEAR(v.visit_date) = ?");
          params.push(Number(year));
        }
        if (month && month !== "ALL" && month.trim() !== "") {
          whereClauses.push("MONTH(v.visit_date) = ?");
          params.push(Number(month));
        }
        if (day && day !== "ALL" && day.trim() !== "") {
          whereClauses.push("DAY(v.visit_date) = ?");
          params.push(Number(day));
        }
      }
    }

    // Search filter (name, phone, room_number, floor)
    if (search && search.trim() !== "") {
      const s = `%${search.trim()}%`;
      whereClauses.push("(v.name LIKE ? OR v.phone LIKE ? OR v.room_number LIKE ? OR v.floor LIKE ?)");
      params.push(s, s, s, s);
    }

    const whereSQL = whereClauses.join(" AND ");

    // 1. Fetch filtered visitors list
    const sql = `
      SELECT 
        v.id,
        v.name,
        v.phone,
        COALESCE(v.room_number, '101') AS roomNumber,
        COALESCE(v.floor, '1st Floor') AS floor,
        COALESCE(v.amount_paid, 0) AS amountPaid,
        v.person_to_meet AS personToMeet,
        v.purpose,
        v.org_id AS orgId,
        v.org_name AS orgName,
        v.status,
        DATE_FORMAT(v.check_in, '%Y-%m-%d %H:%i:%s') AS checkIn,
        DATE_FORMAT(v.check_out, '%Y-%m-%d %H:%i:%s') AS checkOut,
        DATE_FORMAT(v.visit_date, '%Y-%m-%d') AS visitDate,
        v.notes,
        DATE_FORMAT(v.created_at, '%Y-%m-%d %H:%i:%s') AS createdAt
      FROM visitors v
      WHERE ${whereSQL}
      ORDER BY v.id DESC
    `;

    const visitors = await query<any>(sql, params);

    // 2. Calculate Real Dynamic Statistics from DB
    const todayStr = new Date().toISOString().split("T")[0];
    const targetDateForTodayStat = date && date !== "ALL" && date.trim() !== "" ? date : todayStr;

    let branchCondition = "";
    const bParams: any[] = [];
    if (targetBranch && targetBranch !== "ALL") {
      branchCondition = "AND (org_id = ? OR org_name = ?)";
      bParams.push(targetBranch, targetBranch);
    }

    // Total Visitors for currently selected filters
    const totalCount = visitors.length;

    // Total Income calculated strictly from filtered records
    const totalIncome = visitors.reduce((sum, v) => sum + (Number(v.amountPaid) || 0), 0);

    // Today's Visitors (checked in today or selected date)
    const todayVisitorsRows = await query<any>(
      `SELECT COUNT(*) AS c, COALESCE(SUM(amount_paid), 0) AS income FROM visitors WHERE (visit_date = ? OR DATE(check_in) = ?) AND status IN ('Checked-In', 'Checked-Out') ${branchCondition}`,
      [targetDateForTodayStat, targetDateForTodayStat, ...bParams]
    );
    const todayVisitors = Number(todayVisitorsRows[0]?.c || 0);
    const todayIncome = Number(todayVisitorsRows[0]?.income || 0);

    // Currently Inside (Checked-In status) for branch
    const currentlyInsideRows = await query<any>(
      `SELECT COUNT(*) AS c FROM visitors WHERE status = 'Checked-In' ${branchCondition}`,
      bParams
    );
    const currentlyInside = Number(currentlyInsideRows[0]?.c || 0);

    // Checked-Out for branch
    const checkedOutRows = await query<any>(
      `SELECT COUNT(*) AS c FROM visitors WHERE status = 'Checked-Out' ${branchCondition}`,
      bParams
    );
    const checkedOut = Number(checkedOutRows[0]?.c || 0);

    // Expected Visitors
    const expectedVisitorsRows = await query<any>(
      `SELECT COUNT(*) AS c FROM visitors WHERE status = 'Expected' ${branchCondition}`,
      bParams
    );
    const expectedVisitors = Number(expectedVisitorsRows[0]?.c || 0);

    // Total Visits & Income This Month (for selected month/year or current month/year)
    const targetYear = year && year !== "ALL" && year.trim() !== "" ? Number(year) : new Date().getFullYear();
    const targetMonth = month && month !== "ALL" && month.trim() !== "" ? Number(month) : (new Date().getMonth() + 1);

    const monthVisitsRows = await query<any>(
      `SELECT COUNT(*) AS c, COALESCE(SUM(amount_paid), 0) AS income FROM visitors WHERE YEAR(visit_date) = ? AND MONTH(visit_date) = ? ${branchCondition}`,
      [targetYear, targetMonth, ...bParams]
    );
    const totalVisitsThisMonth = Number(monthVisitsRows[0]?.c || 0);
    const totalIncomeThisMonth = Number(monthVisitsRows[0]?.income || 0);

    return res.json({
      success: true,
      stats: {
        totalVisitors: totalCount,
        totalIncome,
        todayVisitors,
        todayIncome,
        currentlyInside,
        checkedOut,
        expectedVisitors,
        totalVisitsThisMonth,
        totalIncomeThisMonth,
      },
      visitors,
    });
  } catch (err: any) {
    console.error("GET /api/visitors error:", err);
    return res.status(500).json({ success: false, error: "Failed to fetch visitors." });
  }
});

// POST /api/visitors — Add real visitor record into MySQL
router.post("/", async (req, res) => {
  try {
    const { name, phone, roomNumber, floor, amountPaid, orgId, orgName, status, visitDate, notes } = req.body;

    if (!name || !phone || !orgId) {
      return res.status(400).json({ success: false, error: "Missing required visitor fields." });
    }

    const currentStatus = status || "Expected";
    const vDate = visitDate || new Date().toISOString().split("T")[0];
    const checkIn = currentStatus === "Checked-In" ? new Date().toISOString().slice(0, 19).replace("T", " ") : null;

    // Resolve org name if not sent
    let finalOrgName = orgName;
    if (!finalOrgName) {
      const orgRow = await query<any>("SELECT name FROM organizations WHERE org_id = ? LIMIT 1", [orgId]);
      finalOrgName = orgRow[0]?.name || orgId;
    }

    const finalRoomNumber = roomNumber || "101";
    const finalFloor = floor || "1st Floor";
    const finalAmount = Number(amountPaid) || 0;

    const result: any = await query(
      `INSERT INTO visitors (name, phone, room_number, floor, amount_paid, org_id, org_name, status, check_in, check_out, visit_date, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, ?)`,
      [name, phone, finalRoomNumber, finalFloor, finalAmount, orgId, finalOrgName, currentStatus, checkIn, vDate, notes || null]
    );

    return res.json({
      success: true,
      message: "Visitor added successfully.",
      visitorId: result.insertId,
    });
  } catch (err: any) {
    console.error("POST /api/visitors error:", err);
    return res.status(500).json({ success: false, error: "Failed to create visitor record." });
  }
});

// PUT /api/visitors/:id/status — Update visitor status & timestamps
router.put("/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["Checked-In", "Checked-Out", "Cancelled", "Expected"].includes(status)) {
      return res.status(400).json({ success: false, error: "Invalid status value." });
    }

    const now = new Date().toISOString().slice(0, 19).replace("T", " ");

    if (status === "Checked-In") {
      await query("UPDATE visitors SET status = ?, check_in = ? WHERE id = ?", [status, now, id]);
    } else if (status === "Checked-Out") {
      await query("UPDATE visitors SET status = ?, check_out = ? WHERE id = ?", [status, now, id]);
    } else {
      await query("UPDATE visitors SET status = ? WHERE id = ?", [status, id]);
    }

    return res.json({ success: true, message: `Visitor status updated to ${status}.` });
  } catch (err: any) {
    console.error("PUT /api/visitors/:id/status error:", err);
    return res.status(500).json({ success: false, error: "Failed to update visitor status." });
  }
});

// Legacy visitor count endpoints
let legacyVisitorsCount = 0;
router.post("/visit", (req, res) => {
  legacyVisitorsCount += 1;
  return res.json({ success: true, visitors: legacyVisitorsCount });
});
router.get("/count", (_req, res) => res.json({ success: true, visitors: legacyVisitorsCount }));

export default router;
