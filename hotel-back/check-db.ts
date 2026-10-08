
import "dotenv/config";
import { query } from "./src/db.js";

async function run() {
  const cols = await query("SHOW COLUMNS FROM bookings");
  console.log(cols.map((c: any) => c.Field).join(", "));
  process.exit(0);
}
run();

