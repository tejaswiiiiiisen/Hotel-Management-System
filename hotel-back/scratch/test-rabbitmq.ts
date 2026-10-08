import { cacheManager } from "../src/lib/redis.js";
import { publishBookingNotification, publishOTASync, isRabbitMQConnected } from "../src/lib/rabbitmq.js";

async function runTest() {
  console.log("\n=======================================================");
  console.log("🧪 Testing Redis Cache & RabbitMQ Queue System");
  console.log("=======================================================\n");

  // 1. Test Redis Cache Manager
  console.log("1️⃣ Testing Redis Caching System...");
  const testKey = "test:room:101";
  const testVal = { id: 101, name: "Deluxe Suite", price: 4500, status: "Available" };
  
  await cacheManager.set(testKey, testVal, 60);
  console.log(`  └─ 💾 Stored key '${testKey}' in Cache.`);

  const fetchedVal = await cacheManager.get<any>(testKey);
  console.log("  └─ 📖 Retrieved value from Cache:", fetchedVal);

  const isRedisReady = cacheManager.isReady();
  console.log(`  └─ ⚡ Redis Client Status: ${isRedisReady ? "CONNECTED (RAM Server)" : "FALLBACK (In-Memory Map)"}`);

  await cacheManager.del(testKey);
  console.log(`  └─ 🗑️ Deleted key '${testKey}'.`);

  // 2. Test RabbitMQ Message Queue System
  console.log("\n2️⃣ Testing RabbitMQ Message Queue System...");
  const isRabbitReady = isRabbitMQConnected();
  console.log(`  └─ 🐰 RabbitMQ Status: ${isRabbitReady ? "CONNECTED (AMQP Server)" : "FALLBACK (Async In-Memory Worker Queue)"}`);

  console.log("\n  📢 Publishing test events to queues...");

  await publishBookingNotification({
    bookingId: "BOOK-TEST-9999",
    guestName: "Rahul Verma",
    guestEmail: "rahul.verma@example.com",
    roomName: "Presidential Suite",
    amount: 12500,
    checkInDate: "24 Sep 2026",
    checkOutDate: "28 Sep 2026",
    action: "CREATED"
  });

  await publishOTASync({
    bookingCode: "OTA-AGD-4821",
    channelId: "agoda",
    roomType: "Executive Room",
    action: "LOCK_ROOM",
    details: { totalAmount: 8900 }
  });

  console.log("\n✅ Test completed! Waiting 2 seconds for worker processes to finish output...\n");
  await new Promise((resolve) => setTimeout(resolve, 2000));
  process.exit(0);
}

runTest().catch((err) => {
  console.error("❌ Test script failed:", err);
  process.exit(1);
});
