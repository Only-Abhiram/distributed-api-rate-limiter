
-- KEYS[1] = bucket key
-- ARGV[1] = capacity
-- ARGV[2] = refill rate (tokens per second)
-- ARGV[3] = request cost

local key = KEYS[1]

local capacity = tonumber(ARGV[1])
local rate = tonumber(ARGV[2])
local cost = tonumber(ARGV[3])

-- Get Redis server time
local time = redis.call('TIME')

local now = tonumber(time[1]) * 1000
          + math.floor(tonumber(time[2]) / 1000)

-- Read existing bucket state
local data = redis.call('HMGET', key, 'tokens', 'ts')

local tokens = tonumber(data[1])
local last_time = tonumber(data[2])

-- Initialize bucket for a new client
if tokens == nil then
    tokens = capacity
    last_time = now
end

-- Calculate elapsed time
local elapsed = math.max(0, now - last_time)

-- Refill tokens
tokens = math.min(
    capacity,
    tokens + elapsed * rate / 1000
)

-- Check whether request is allowed
local allowed = 0
local retry_ms = 0

if tokens >= cost then
    tokens = tokens - cost
    allowed = 1
else
    retry_ms = math.ceil((cost - tokens) * 1000 / rate)
end

-- Save bucket state
redis.call('HSET', key,
    'tokens', tokens,
    'ts', now
)

-- Expire idle buckets
local ttl = math.ceil(capacity / rate * 2000)
redis.call('PEXPIRE', key, ttl)

-- Return decision
return {
    allowed,
    math.floor(tokens),
    retry_ms
}
