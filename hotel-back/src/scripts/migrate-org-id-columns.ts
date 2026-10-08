import { query } from "../db.js";

export async function migrateOrgIdColumns() {
  console.log("🔄 Ensuring `org_id` column exists across data tables and backfilling defaults...");
  const tables = ["rooms", "inventory_items", "bookings", "guests", "users", "purchase_orders", "maintenance_tickets"];

  for (const table of tables) {
    try {
      await query(`ALTER TABLE ${table} ADD COLUMN org_id VARCHAR(50) DEFAULT NULL`);
    } catch {
      // Column already exists
    }
  }

  // Backfill unassigned sample rows to default Matcha Tea org ("MA330") so no rows are NULL
  for (const table of tables) {
    try {
      await query(`UPDATE ${table} SET org_id = 'MA330' WHERE org_id IS NULL OR org_id = ''`);
    } catch {
      // Ignore if table doesn't exist yet
    }
  }
}
