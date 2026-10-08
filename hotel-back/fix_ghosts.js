import { db } from './src/db.js';

async function fixGhostBookings() {
  try {
    console.log("Fixing ghost bookings...");
    // Find rooms that are Available or Cleaning
    const [rooms] = await db.query("SELECT id, room_number, status, available FROM rooms WHERE status IN ('Available', 'Cleaning') OR available = TRUE");
    
    let count = 0;
    for (const room of rooms) {
      // Find any active stays for these rooms and mark them completed
      const [res] = await db.query(
        "UPDATE bookings SET status = 'Completed', type = 'Previous' WHERE room_id = ? AND status IN ('Active Stay', 'Active', 'Occupied')",
        [room.id]
      );
      if (res.affectedRows > 0) {
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
