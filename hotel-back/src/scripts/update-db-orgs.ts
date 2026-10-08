import "dotenv/config";
import mysql from "mysql2/promise";

async function updateDbOrgs() {
  const conn = await mysql.createConnection({
    host: process.env.MYSQL_HOST || "localhost",
    port: Number(process.env.MYSQL_PORT || 3306),
    user: process.env.MYSQL_USER || "root",
    password: process.env.MYSQL_PASSWORD || "",
    database: process.env.MYSQL_DATABASE || "hotel_website",
  });

  console.log("Updating employees table org_id & org_name...");
  await conn.query(`
    UPDATE employees 
    SET org_id = CASE 
          WHEN org = 'Cheery Clothing' THEN 'CH560'
          WHEN org = 'Ashirwad' THEN 'AS435'
          ELSE 'MA330'
        END,
        org_name = CASE 
          WHEN org = 'Cheery Clothing' THEN 'Cheery Clothing'
          WHEN org = 'Ashirwad' THEN 'Ashirwad'
          ELSE 'Matcha Tea'
        END
    WHERE org_id IS NULL OR org_name IS NULL
  `);

  const [rows] = await conn.query("SELECT id, employee_code, name, org, org_id, org_name FROM employees");
  console.log("Updated employees rows:", rows);

  await conn.end();
}

updateDbOrgs().catch(console.error);
