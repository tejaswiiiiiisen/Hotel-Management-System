import { query } from './src/db.js';

async function testDelete() {
  try {
    // Insert a dummy room
    const res = await query("INSERT INTO rooms (room_number, room_uid, type) VALUES ('999', 'UID999', 'Standard')");
    const newId = res.insertId;
    console.log("Inserted new room", newId);
    
    // Now delete it with string ID
    const targetId = String(newId);
    console.log("Deleting room", targetId);
    try {
      await query("DELETE FROM rooms WHERE id = ? OR room_number = ? OR room_uid = ?", [targetId, targetId, targetId]);
      console.log(`🗑️ Deleted room #${targetId} from MySQL database.`);
    } catch (e: any) {
      console.log("Hard delete failed, trying soft delete", e.message);
    }
  } catch (err) {
    console.error(err);
  }
  process.exit(0);
}
testDelete();
