import mysql from 'mysql2/promise';
async function fix() {
  const c = await mysql.createConnection({host: 'localhost', user: 'root', password: 'Sunil2004', database: 'hotel_website'});
  try {
    await c.query("ALTER TABLE bookings MODIFY COLUMN user_id INT UNSIGNED DEFAULT NULL");
    console.log("Alter success!");
  } catch (e) {
    console.error("Alter error:", e.message);
  }
  await c.end();
}
fix();
