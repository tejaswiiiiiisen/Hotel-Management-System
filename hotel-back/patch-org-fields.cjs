const mysql = require('mysql2/promise');

async function run() {
  const conn = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Sunil2004',
    database: 'hotel_website'
  });

  try {
    const columnsToAdd = [
      'branch VARCHAR(255)',
      'place VARCHAR(255)',
      'city VARCHAR(255)',
      'state VARCHAR(255)',
      'address TEXT'
    ];

    for (const colDef of columnsToAdd) {
      const colName = colDef.split(' ')[0];
      try {
        await conn.query(`ALTER TABLE organizations ADD COLUMN ${colDef}`);
        console.log(`Added column ${colName}`);
      } catch (err) {
        if (err.code === 'ER_DUP_FIELDNAME') {
          console.log(`Column ${colName} already exists.`);
        } else {
          console.error(`Error adding column ${colName}:`, err);
        }
      }
    }
  } catch (err) {
    console.error("Error connecting or altering:", err);
  } finally {
    await conn.end();
  }
}

run();
