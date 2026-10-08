
const mysql = require("mysql2/promise");
require("dotenv").config();

async function run() {
  const db = await mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "hotel_website",
  });
  
  try {
    await db.query("ALTER TABLE wishlists ADD COLUMN branch_id VARCHAR(255);");
    console.log("Added branch_id");
  } catch (err) {
    if (err.code === "ER_DUP_FIELDNAME") {
      console.log("branch_id already exists");
    } else {
      console.error(err);
    }
  }
  process.exit(0);
}
run();

