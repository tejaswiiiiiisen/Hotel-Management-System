import "dotenv/config";
import { query } from "../db.js";

const DEFAULT_MAINTENANCE_TICKETS = [
  {
    ticket_code: "#M-201",
    room_id: 4, // Room 204
    asset: "Room 302 (Deluxe)",
    asset_type: "Room",
    category: "HVAC / Air Conditioning",
    issue: "AC unit making loud noise and not cooling below 24°C",
    assigned_to: "Eng. Ravi Sharma",
    priority: "High",
    status: "Open",
    reported_by: "Admin Desk",
    reported_at: "11 Aug 2026, 10:30 AM",
    cost_estimate: "₹2,500",
  },
  {
    ticket_code: "#M-200",
    room_id: null,
    asset: "Main Lobby Ceiling",
    asset_type: "Facility",
    category: "Electrical",
    issue: "3 LED chandelier lights flickering near reception desk",
    assigned_to: "Eng. Sameer Verma",
    priority: "Low",
    status: "In Progress",
    reported_by: "Reception Team",
    reported_at: "11 Aug 2026, 09:15 AM",
    cost_estimate: "₹450",
  },
  {
    ticket_code: "#M-198",
    room_id: 1, // Room 108 / 115
    asset: "Room 115 (Standard)",
    asset_type: "Room",
    category: "Plumbing",
    issue: "Bathroom washbasin tap leaking water constantly",
    assigned_to: "Eng. Ravi Sharma",
    priority: "Medium",
    status: "Resolved",
    reported_by: "Housekeeping Desk",
    reported_at: "10 Aug 2026, 04:45 PM",
    cost_estimate: "₹350",
  },
  {
    ticket_code: "#M-195",
    room_id: 2, // Room 501
    asset: "Room 501 (Suite)",
    asset_type: "Room",
    category: "Furniture / Woodwork",
    issue: "Balcony sliding door handle loose and jamming",
    assigned_to: "Eng. Vikram Gill",
    priority: "Medium",
    status: "Open",
    reported_by: "Admin Desk",
    reported_at: "10 Aug 2026, 02:20 PM",
    cost_estimate: "₹800",
  },
  {
    ticket_code: "#M-192",
    room_id: null,
    asset: "Elevator B (West Wing)",
    asset_type: "Facility",
    category: "Elevator / Lift",
    issue: "Monthly preventive servicing and safety checkup",
    assigned_to: "Eng. OTIS Service Team",
    priority: "High",
    status: "In Progress",
    reported_by: "Facility Manager",
    reported_at: "09 Aug 2026, 11:00 AM",
    cost_estimate: "₹12,000",
  },
  {
    ticket_code: "#M-189",
    room_id: null,
    asset: "Gym Pool Area",
    asset_type: "Facility",
    category: "Plumbing",
    issue: "Jacuzzi water circulation pump pressure low",
    assigned_to: "Eng. Sameer Verma",
    priority: "Medium",
    status: "Open",
    reported_by: "Spa Desk",
    reported_at: "08 Aug 2026, 03:10 PM",
    cost_estimate: "₹3,200",
  },
  {
    ticket_code: "#M-185",
    room_id: null,
    asset: "Kitchen Bakery Desk",
    asset_type: "Facility",
    category: "Equipment",
    issue: "Industrial convection oven thermostat temperature calibration",
    assigned_to: "Eng. Vikram Gill",
    priority: "High",
    status: "Resolved",
    reported_by: "Executive Chef",
    reported_at: "07 Aug 2026, 08:00 AM",
    cost_estimate: "₹1,800",
  },
];

export async function initMaintenanceSchema() {
  try {
    console.log("🔄 Initializing Maintenance Tickets table & running schema migrations...");

    await query(`
      CREATE TABLE IF NOT EXISTS maintenance_tickets (
        id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
        ticket_code   VARCHAR(50) NOT NULL,
        room_id       INT UNSIGNED DEFAULT NULL,
        asset         VARCHAR(255) NOT NULL,
        asset_type    VARCHAR(50) NOT NULL DEFAULT 'Room',
        category      VARCHAR(100) NOT NULL DEFAULT 'General',
        issue         TEXT NOT NULL,
        assigned_to   VARCHAR(255) DEFAULT 'Eng. Ravi Sharma',
        priority      VARCHAR(50) NOT NULL DEFAULT 'Medium',
        status        VARCHAR(50) NOT NULL DEFAULT 'Open',
        reported_by   VARCHAR(255) DEFAULT 'Admin Desk',
        reported_at   VARCHAR(100) DEFAULT NULL,
        cost_estimate VARCHAR(100) DEFAULT NULL,
        room_number   VARCHAR(50) DEFAULT NULL,
        floor         VARCHAR(100) DEFAULT NULL,
        org_id        VARCHAR(50) DEFAULT NULL,
        org_name      VARCHAR(255) DEFAULT NULL,
        resolved_at   DATETIME DEFAULT NULL,
        created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY uq_maintenance_ticket_code (ticket_code),
        KEY idx_maint_room_id (room_id),
        KEY idx_maint_status (status),
        KEY idx_maint_priority (priority),
        KEY idx_maint_org_id (org_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Safety migrations for existing table columns
    const alterQueries = [
      "ALTER TABLE maintenance_tickets ADD COLUMN room_id INT UNSIGNED DEFAULT NULL",
      "ALTER TABLE maintenance_tickets ADD COLUMN asset_type VARCHAR(50) NOT NULL DEFAULT 'Room'",
      "ALTER TABLE maintenance_tickets ADD COLUMN reported_by VARCHAR(255) DEFAULT 'Admin Desk'",
      "ALTER TABLE maintenance_tickets ADD COLUMN resolved_at DATETIME DEFAULT NULL",
      "ALTER TABLE maintenance_tickets MODIFY COLUMN cost_estimate VARCHAR(100) DEFAULT NULL",
      "ALTER TABLE maintenance_tickets ADD COLUMN room_number VARCHAR(50) DEFAULT NULL",
      "ALTER TABLE maintenance_tickets ADD COLUMN floor VARCHAR(100) DEFAULT NULL",
      "ALTER TABLE maintenance_tickets ADD COLUMN org_id VARCHAR(50) DEFAULT NULL",
      "ALTER TABLE maintenance_tickets ADD COLUMN org_name VARCHAR(255) DEFAULT NULL",
    ];

    for (const q of alterQueries) {
      try {
        await query(q);
      } catch (err: any) {
        // Column already exists or altered, ignore
      }
    }

    // Populate room_number and floor for existing entries
    try {
      await query(`
        UPDATE maintenance_tickets
        SET room_number = REGEXP_SUBSTR(asset, '[0-9]+')
        WHERE room_number IS NULL AND asset REGEXP '[0-9]+';
      `);

      await query(`
        UPDATE maintenance_tickets
        SET floor = CASE
          WHEN room_number IS NOT NULL AND CAST(room_number AS UNSIGNED) >= 500 THEN '5th Floor'
          WHEN room_number IS NOT NULL AND CAST(room_number AS UNSIGNED) >= 400 THEN '4th Floor'
          WHEN room_number IS NOT NULL AND CAST(room_number AS UNSIGNED) >= 300 THEN '3rd Floor'
          WHEN room_number IS NOT NULL AND CAST(room_number AS UNSIGNED) >= 200 THEN '2nd Floor'
          WHEN room_number IS NOT NULL AND CAST(room_number AS UNSIGNED) >= 100 THEN '1st Floor'
          WHEN asset LIKE '%Lobby%' OR asset LIKE '%Entrance%' THEN 'Main Lobby'
          WHEN asset LIKE '%Gym%' OR asset LIKE '%Pool%' THEN 'Ground Floor'
          WHEN asset LIKE '%Kitchen%' OR asset LIKE '%Bakery%' THEN 'Ground Floor'
          WHEN asset LIKE '%Elevator%' OR asset LIKE '%Lift%' THEN 'All Floors'
          ELSE 'Ground Floor'
        END
        WHERE floor IS NULL OR floor = '';
      `);
    } catch (e) {
      // Ignore migration error
    }

    const existing = await query<any>("SELECT COUNT(*) AS count FROM maintenance_tickets");
    const count = Number(existing[0]?.count || 0);

    if (count === 0) {
      for (const t of DEFAULT_MAINTENANCE_TICKETS) {
        await query(
          `INSERT INTO maintenance_tickets (ticket_code, room_id, asset, asset_type, category, issue, assigned_to, priority, status, reported_by, reported_at, cost_estimate)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            t.ticket_code,
            t.room_id,
            t.asset,
            t.asset_type,
            t.category,
            t.issue,
            t.assigned_to,
            t.priority,
            t.status,
            t.reported_by,
            t.reported_at,
            t.cost_estimate,
          ]
        );
      }
      console.log("✅ Seeded initial maintenance tickets into MySQL database.");
    }
  } catch (error: any) {
    console.warn("⚠️ Warning during initMaintenanceSchema:", error.message);
  }
}
