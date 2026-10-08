import { query } from './src/db.js';

async function run() {
  try {
    const res = await query(`
      SELECT COALESCE(SUM(amount_paid), 0) as total_revenue,
             COUNT(*) as total_checkins
      FROM bookings
      WHERE org_id = 'AJ01'
        AND LOWER(status) != 'cancelled'
        AND YEAR(STR_TO_DATE(check_in_date, '%d %b %Y')) = 2026
        AND MONTH(STR_TO_DATE(check_in_date, '%d %b %Y')) = 9
    `);
    console.log("RESULT:", res);
  } catch (e) {
    console.log("ERR:", e);
  }
  process.exit(0);
}
run();
