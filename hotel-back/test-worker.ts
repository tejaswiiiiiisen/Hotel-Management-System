import "dotenv/config";
import { publishBookingNotification } from "./src/lib/rabbitmq.js";

async function testWorker() {
  console.log("🧪 Testing Live Twilio SMS & Nodemailer Email Worker...\n");

  const testPayload = {
    bookingId: `TEST-${Math.floor(1000 + Math.random() * 9000)}`,
    guestName: "Neha Sharma",
    guestEmail: "wei2606wei@gmail.com",
    guestPhone: "9026328642",
    roomName: "Royal Luxury Suite (Room 501)",
    amount: 18500,
    checkInDate: "28 Sept 2026",
    checkOutDate: "30 Sept 2026",
    action: "CREATED" as const,
  };

  console.log("📩 Publishing test booking notification event to worker...");
  await publishBookingNotification(testPayload);

  // Wait 4 seconds for worker async processing to complete
  await new Promise((res) => setTimeout(res, 4000));
  console.log("\n✅ Execution completed!");
  process.exit(0);
}

testWorker();
