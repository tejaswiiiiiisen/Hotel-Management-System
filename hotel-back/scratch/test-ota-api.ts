import { initOtaTables } from "../src/routes/ota.js";
import { query } from "../src/db.js";

async function testOtaDatabase() {
  console.log("🧪 Initializing & testing MySQL OTA database queries...");
  await initOtaTables();

  const channels: any = await query("SELECT * FROM ota_channels");
  console.log(`✅ Fetched ${channels.length} OTA Channels from MySQL DB:`);
  console.log(channels.map((c: any) => `${c.display_name} (${c.status}) - ₹${c.revenue_30days}`).join("\n"));

  const bookings: any = await query("SELECT * FROM ota_bookings");
  console.log(`\n✅ Fetched ${bookings.length} OTA Bookings from MySQL DB:`);
  console.log(bookings.map((b: any) => `${b.booking_code}: ${b.guest_name} (${b.channel_name}) - ₹${b.amount}`).join("\n"));

  const logs: any = await query("SELECT * FROM ota_sync_logs");
  console.log(`\n✅ Fetched ${logs.length} Sync Audit Logs from MySQL DB:`);
  console.log(logs.map((l: any) => `${l.timestamp}: [${l.status}] ${l.message}`).join("\n"));

  process.exit(0);
}

testOtaDatabase();
