const mysql = require('mysql2/promise');
async function check() {
  const c = await mysql.createConnection({host:'localhost', user:'root', password:'Sunil2004', database:'hotel_website'});
  const [rows] = await c.query("SELECT rp.* FROM role_permissions rp JOIN roles r ON rp.role_id = r.id WHERE r.name = 'manager'");
  console.log(rows);
  process.exit(0);
}
check();
