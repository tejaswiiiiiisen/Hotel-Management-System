import { query } from './src/db.js'; query('SELECT * FROM permissions').then(console.log).catch(console.error).finally(() => process.exit(0))

import "dotenv/config";
import { query } from "./src/db.js";
async function run() {
  const rows = await query("SELECT id, name, room_number, type, org_id FROM rooms WHERE name LIKE \"%undefined%\"");
  console.log(rows);
  process.exit(0);
}
run();

