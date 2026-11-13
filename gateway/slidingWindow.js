import { redis } from "./redis.js";
import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";

redis.defineCommand("slidingWindow", {
  numberOfKeys: 1,
  lua: fs.readFileSync(
    path.join(import.meta.dirname, "lua", "slidingWindow.lua"),
    "utf8"
  ),
});

async function slidingWindow(clientId, limit, windowSeconds=10) {
  const key = `rl:sliding:${clientId}`;
  const requestId = randomUUID();

  const [allowed, remaining, retryMs] =
    await redis.slidingWindow(
      key,
      windowSeconds*1000,
      limit,
      requestId
    );

  return {
    allowed: allowed === 1,
    remaining,
    retryAfter: Math.max(0, retryMs),
    };
}

export default slidingWindow;
