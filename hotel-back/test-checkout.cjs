const mysql = require('mysql2/promise');
mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'Sunil2004',
  database: 'hotel_website'
}).then(async conn => {
  try {
    await conn.query("UPDATE bookings SET type = 'Previous', status = 'Completed' WHERE id = 58");
    console.log('Bookings updated');
    const [b] = await conn.query("SELECT room_id, org_id FROM bookings WHERE id = 58");
    const roomId = b[0].room_id;
    console.log('room_id:', roomId);
    await conn.query("UPDATE rooms SET status = 'Cleaning', available = FALSE WHERE id = ?", [roomId]);
    console.log('Rooms updated');
    await conn.query("UPDATE customers SET status = 'Checked Out' WHERE room_booked = (SELECT name FROM rooms WHERE id = ?) AND status != 'Checked Out'", [roomId]);
    console.log('Customers updated');
    const orgId = b[0].org_id || 'CH560';
    const [roomsRows] = await conn.query("SELECT name, floor, type FROM rooms WHERE id = ?", [roomId]);
    const rm = roomsRows[0];
    await conn.query("INSERT INTO housekeeping_tasks (org_id, org_name, task_code, room, floor, room_type, staff, staff_email, staff_avatar, status, status_color, status_bg, priority, priority_color, priority_bg, task, last_cleaned, progress, icon, assigned_time, notes, approval_status, status_action_at) VALUES (?, 'Hotel Property', 'HK-1234', ?, ?, ?, 'Unassigned', '', '', 'Cleaning', '#eab308', '#fefce8', 'Urgent', '#ef4444', '#fee2e2', 'Checkout Room Sanitization', 'Pending', 0, 'FiWind', '12:00 PM', 'Auto-checkout generated task', 'Pending', NOW())", [orgId, rm.name, rm.floor || '1st Floor', rm.type || 'Standard']);
    console.log('Housekeeping updated');
  } catch (e) {
    console.error('ERROR:', e);
  } finally {
    conn.end();
  }
});
