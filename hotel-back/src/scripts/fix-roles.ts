import "dotenv/config";
import { query } from "../db.js";

async function fix() {
  await query("UPDATE users SET role = 'user' WHERE LOWER(email) != 'adminhotel@hotel.com'");
  await query("ALTER TABLE users ALTER COLUMN role SET DEFAULT 'user'");
  const users = await query("SELECT id, name, email, role FROM users");
  console.log("Updated Users:", users);
  process.exit(0);
}

fix().catch(err => {
  console.error(err);
  process.exit(1);
});
