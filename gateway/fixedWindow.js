import { redis } from "./redis.js";
import fs from "fs";
import path from "path";

redis.defineCommand("fixedWindow", {
  numberOfKeys: 1,
  lua: fs.readFileSync(
    path.join(import.meta.dirname, "lua", "fixedWindow.lua"),
    "utf8"
  ),
});

async function fixedWindow(clientId, limit, windowSeconds) {
  const key = `rl:fixed:${clientId}`;

  const [allowed, remaining, ttl] = await redis.fixedWindow(
    key,
    limit,
    windowSeconds
  );
  return {
    allowed: allowed===1,
    remaining: remaining,
    retryAfter: Math.max(0, ttl),
  };
}

export default fixedWindow;
