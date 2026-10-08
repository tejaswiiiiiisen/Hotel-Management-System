const { db } = require('./src/db.js');
db.query("SELECT id, guest_name, status, type FROM bookings").then(res => {
  console.log(res[0]);
  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
