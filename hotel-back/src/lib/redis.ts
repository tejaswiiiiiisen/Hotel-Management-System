import Redis from "ioredis";
import "dotenv/config";

const REDIS_HOST = process.env.REDIS_HOST || "127.0.0.1";
const REDIS_PORT = Number(process.env.REDIS_PORT || 6379);
const REDIS_PASSWORD = process.env.REDIS_PASSWORD || undefined;

// Fallback in-memory cache Map if Redis server is unavailable
const memoryCache = new Map<string, { value: string; expiresAt: number }>();

let isRedisConnected = false;

export const redis = new Redis({
  host: REDIS_HOST,
  port: REDIS_PORT,
  password: REDIS_PASSWORD,
  lazyConnect: true,
  maxRetriesPerRequest: 1,
  enableOfflineQueue: false,
  retryStrategy(times) {
    if (times > 3) {
      return null; // Stop reconnecting after 3 attempts, fallback to memory cache
    }
    return Math.min(times * 200, 1000);
  },
});

redis.on("connect", () => {
  isRedisConnected = true;
  console.log("⚡ Redis Client Connected Successfully");
});

redis.on("error", (err) => {
  if (isRedisConnected) {
    console.warn("⚠️ Redis Warning:", err.message);
  }
  isRedisConnected = false;
});

// Attempt initial connection without blocking app startup
redis.connect().catch(() => {
  isRedisConnected = false;
  console.log("ℹ️ Redis server not reachable locally. Falling back to In-Memory RAM Caching.");
});

/**
 * Unified Redis Cache Manager with In-Memory Fallback
 */
export const cacheManager = {
  /**
   * Get parsed JSON data from cache (Redis or Memory)
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      if (isRedisConnected) {
        const raw = await redis.get(key);
        if (raw) return JSON.parse(raw) as T;
      }
    } catch {
      isRedisConnected = false;
    }

    // Memory Fallback
    const item = memoryCache.get(key);
    if (!item) return null;
    if (Date.now() > item.expiresAt) {
      memoryCache.delete(key);
      return null;
    }
    try {
      return JSON.parse(item.value) as T;
    } catch {
      return null;
    }
  },

  /**
   * Store data in cache (Redis and/or Memory) with TTL in seconds (default: 6 hours)
   */
  async set(key: string, value: any, ttlSeconds: number = 21600): Promise<void> {
    const stringValue = JSON.stringify(value);
    try {
      if (isRedisConnected) {
        await redis.set(key, stringValue, "EX", ttlSeconds);
      }
    } catch {
      isRedisConnected = false;
    }

    // Always update memory fallback for ultra-fast local retrieval
    memoryCache.set(key, {
      value: stringValue,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  },

  /**
   * Delete key from cache
   */
  async del(key: string): Promise<void> {
    try {
      if (isRedisConnected) {
        await redis.del(key);
      }
    } catch {
      isRedisConnected = false;
    }
    memoryCache.delete(key);
  },

  /**
   * Delete all keys matching a prefix pattern
   */
  async delPattern(patternPrefix: string): Promise<void> {
    try {
      if (isRedisConnected) {
        const keys = await redis.keys(`${patternPrefix}*`);
        if (keys.length > 0) {
          await redis.del(...keys);
        }
      }
    } catch {
      isRedisConnected = false;
    }

    for (const key of memoryCache.keys()) {
      if (key.startsWith(patternPrefix)) {
        memoryCache.delete(key);
      }
    }
  },

  /**
   * Check connection status
   */
  isReady(): boolean {
    return isRedisConnected;
  }
};
