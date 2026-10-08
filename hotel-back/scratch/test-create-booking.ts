import { query } from "../src/db.js";

async function testCreate() {
  console.log("🧪 Testing POST /api/ota/bookings logic directly...");
  const channelId = "expedia";
  const rType = "Premium Room";
  const gName = "Neha";
  const inDate = "2026-09-18";
  const outDate = "2026-09-20";
  const guests = 2;
  const totalAmount = 9500;
  const commAmount = 1425;
  const netPayout = 8075;
  const bookingCode = `OTA-EXP-${Math.floor(1000 + Math.random() * 9000)}`;

  try {
    const res: any = await query(
      `INSERT INTO ota_bookings
       (booking_code, channel_id, channel_name, guest_name, room_type, check_in, check_out, guests, amount, commission_amount, net_payout, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'CONFIRMED')`,
      [bookingCode, channelId, "Expedia Group", gName, rType, inDate, outDate, guests, totalAmount, commAmount, netPayout]
    );
    console.log("✅ Inserted into ota_bookings, insertId:", res.insertId);

    const check: any = await query("SELECT * FROM ota_bookings WHERE id = ?", [res.insertId]);
    console.log("Fetched created booking:", check[0]);
  } catch (err: any) {
    console.error("❌ Insert failed:", err);
  }

  process.exit(0);
}

testCreate();
