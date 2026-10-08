
const mysql = require("mysql2/promise");
require("dotenv").config();

async function run() {
  const db = await mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "hotel_website",
  });
  
  const [cols] = await db.query("SHOW COLUMNS FROM bookings");
  console.log(cols.map(c => c.Field).join(", "));
  process.exit(0);
}
run();

