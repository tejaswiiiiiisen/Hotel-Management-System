const mysql = require('mysql2/promise');

async function checkDB() {
  const conn = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Sunil2004',
    database: 'hotel_website'
  });

  const [orgs] = await conn.query("SELECT org_id, name, location FROM organizations");
  console.table(orgs);

  await conn.end();
}

checkDB().catch(console.error);
