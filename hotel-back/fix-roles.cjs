const mysql = require('./node_modules/mysql2/promise');
async function fix() {
  const c = await mysql.createConnection({host:'localhost', user:'root', password:'Sunil2004', database:'hotel_website'});
  await c.query("UPDATE users SET role = 'manager' WHERE role = 'user'");
  console.log('Fixed users.');
  process.exit(0);
}
fix();
