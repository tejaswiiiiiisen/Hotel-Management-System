import { query } from './src/db.js';

async function fixGhostBookings() {
  try {
    console.log("Fixing ghost bookings...");
    const rooms = await query("SELECT id, room_number, status, available FROM rooms WHERE status IN ('Available', 'Cleaning') OR available = TRUE");
    
    let count = 0;
    for (const room of rooms) {
      const res = await query(
        "UPDATE bookings SET status = 'Completed', type = 'Previous' WHERE room_id = ? AND status IN ('Active Stay', 'Active', 'Occupied')",
        [room.id]
      );
      if (res && res.affectedRows > 0) {
        console.log(`Cleaned up ${res.affectedRows} ghost bookings for room ${room.room_number || room.id}`);
        count += res.affectedRows;
      }
    }
    console.log(`Successfully cleaned up ${count} ghost bookings.`);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

fixGhostBookings();
