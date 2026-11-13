import Fastify from "fastify";
import proxy from "@fastify/http-proxy";
import { redis } from "./redis.js";
import fixedWindow from "./fixedWindow.js";
import tokenBucket from "./tokenBucket.js";
import slidingWindow from "./slidingWindow.js";
import { getCache, setCache } from "./cache.js";
const app = Fastify({ logger: true });
app.addHook("onSend", async (request, reply, payload) => {
    reply.header("X-Gateway-Instance", process.env.INSTANCE_ID || "local");
    return payload;
});

app.get("/counter", async () => {
    const count = await redis.incr("requests");

    return {
        message: "Shared counter",
        count,
    };
});

app.get("/fixed-limited", async (request, reply) => {
    const result = await fixedWindow("demo-client", 5, 60);

    reply.header("X-RateLimit-Limit", 5);
    reply.header("X-RateLimit-Remaining", result.remaining);

    if (!result.allowed) {
        reply.header("Retry-After", result.retryAfter);

        return reply.code(429).send({
            error: "Too Many Requests",
            message: "Rate limit exceeded",
            retryAfter: result.retryAfter,
        });
    }

    return {
        message: "Request allowed",
        remaining: result.remaining,
    };
});

app.get("/token-limited", async (request, reply) => {
    const result = await tokenBucket(
        "demo-client",
        5,  // Capacity
        2,  // Refill rate: 2 tokens/sec
        1   // Cost per request
    );

    reply.header("X-RateLimit-Limit", 5);
    reply.header("X-RateLimit-Remaining", result.remaining);

    if (!result.allowed) {
        reply.header(
            "Retry-After",
            Math.ceil(result.retryAfter / 1000)
        );

        return reply.code(429).send({
            error: "Too Many Requests",
            retryAfter: Math.ceil(result.retryAfter / 1000),
        });
    }

    return {
        message: "Request allowed",
        remaining: result.remaining,
    };
});

app.get("/sliding-limited", async (request, reply) => {
    const result = await slidingWindow("demo-client", 5, 60);

    reply.header("X-RateLimit-Limit", 2);
    reply.header("X-RateLimit-Remaining", result.remaining);

    if (!result.allowed) {
        reply.header("Retry-After", Math.ceil(result.retryAfter / 1000));
        return reply.code(429).send({
            error: "Too Many Requests",
            message: "Rate limit exceeded",
            retryAfter: Math.ceil(result.retryAfter / 1000),
        });
    }

    return {
        message: "Request allowed",
        remaining: result.remaining,
    };
});

app.register(proxy, {
    upstream: process.env.UPSTREAM_URL || "http://localhost:4000",
    prefix: "/api",
    rewritePrefix: "",
});




app.get("/cached-items", async (request, reply) => {
    const cacheKey = "cache:items";
  
    const cached = await getCache(cacheKey);
  
    if (cached) {
      return {
        source: "cache",
        ...cached,
      };
    }
  
    const response = await fetch(
      `${process.env.UPSTREAM_URL || "http://localhost:4000"}/items`
    );
  
    const data = await response.json();
  
    await setCache(cacheKey, data, 30);
  
    return {
      source: "upstream",
      ...data,
    };
  });
  
app.listen({
    port: Number(process.env.PORT || 3000),
    host: "0.0.0.0",
});
