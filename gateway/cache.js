
import { redis } from "./redis.js";

async function getCache(key) {
  const cached = await redis.get(key);

  if (!cached) {
    return null;
  }

  return JSON.parse(cached);
}

async function setCache(key, value, ttl = 30) {
  await redis.set(key, JSON.stringify(value), "EX", ttl);
}
export {getCache, setCache};

