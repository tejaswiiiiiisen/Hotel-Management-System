const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function fix() {
  const connection = await mysql.createConnection({
    host: process.env.MYSQL_HOST || 'localhost',
    port: Number(process.env.MYSQL_PORT) || 3306,
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || 'Sunil2004',
    database: process.env.MYSQL_DATABASE || 'hotel_website',
  });

  console.log('Connected to MySQL');

  // Check existing admin
  const [rows] = await connection.query("SELECT id, name, email, role, org_id, org_name FROM users WHERE LOWER(email) IN ('adminhotel@hotel.com', 'admin@gmail.com')");
  console.log('Current admin users before fix:', rows);

  const hash = await bcrypt.hash('admin123', 10);

  if (rows.length === 0) {
    await connection.query(
      "INSERT INTO users (name, email, password_hash, role) VALUES ('Super Admin', 'adminhotel@hotel.com', ?, 'super_admin')",
      [hash]
    );
    console.log('Created Super Admin user in DB.');
  } else {
    await connection.query(
      "UPDATE users SET role = 'super_admin', org_id = NULL, org_name = NULL, password_hash = ? WHERE LOWER(email) IN ('adminhotel@hotel.com', 'admin@gmail.com')",
      [hash]
    );
    console.log('Updated users to super_admin.');
  }

  // Remove adminhotel from staff table if mistakenly added
  await connection.query("DELETE FROM staff WHERE LOWER(email) IN ('adminhotel@hotel.com', 'admin@gmail.com')");

  const [after] = await connection.query("SELECT id, name, email, role, org_id, org_name FROM users WHERE LOWER(email) IN ('adminhotel@hotel.com', 'admin@gmail.com')");
  console.log('Admin users after fix:', after);

  await connection.end();
  process.exit(0);
}

fix().catch((err) => {
  console.error('Fix error:', err);
  process.exit(1);
});
