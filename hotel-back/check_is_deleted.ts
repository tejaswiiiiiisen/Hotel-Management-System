import { query } from './src/db.js';

async function check() {
  try {
    const res = await query('SELECT id, room_number, is_deleted FROM rooms');
    console.log(res);
  } catch(e) {
    console.error(e);
  }
  process.exit(0);
}
check();
