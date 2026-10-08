import { cacheManager } from "../src/lib/redis.js";

async function test() {
  console.log("🧪 Testing Redis Cache Manager...");
  await cacheManager.set("test_key", { message: "Hello Redis real-time cache!" }, 60);
  const val = await cacheManager.get<{ message: string }>("test_key");
  console.log("Fetched value from cache:", val);
  process.exit(0);
}

test();
