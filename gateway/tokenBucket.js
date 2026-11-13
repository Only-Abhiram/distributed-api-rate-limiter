import { redis } from "./redis.js";
import fs from "fs";
import path from "path";

redis.defineCommand("tokenBucket", {
  numberOfKeys: 1,
  lua: fs.readFileSync(
    path.join(import.meta.dirname, "lua", "tokenBucket.lua"),
    "utf8"
  ),
});

async function tokenBucket(clientId, capacity, rate, cost = 1) {
  if (capacity <= 0 || rate <= 0 || cost <= 0 || cost > capacity) {
    throw new Error("Invalid token bucket configuration");
  }

  const key = `rl:token:${clientId}`;

  const [allowed, remaining, retryMs] =
    await redis.tokenBucket(key, capacity, rate, cost);

  return {
    allowed: allowed === 1,
    remaining: remaining,
    retryAfter: Math.max(0, retryMs),
  };
}

export default tokenBucket;
