const { query } = require('./dist/db.js'); (async () => { try { await query('UPDATE customers SET status = \
Checked
In\ WHERE id = 42'); console.log('1'); await query('UPDATE rooms SET status = \Occupied\, available = FALSE WHERE (room_number = \101\ OR name = \1st
Floor
-
Room
101\) AND (org_id = \AS435\ OR org_id IS NULL)'); console.log('2'); await query('UPDATE bookings SET status = \Checked
In\, type = \Current\ WHERE (room_number = \101\ OR room_name = \1st
Floor
-
Room
101\) AND (org_id = \AS435\ OR org_id IS NULL) AND status IN (\Reserved\, \Upcoming\, \Pending\)'); console.log('3'); } catch(e) { console.error(e); } process.exit(0); })();
