-- KEYS[1] = rate limit key
-- ARGV[1] = request limit
-- ARGV[2] = window duration in seconds

local key = KEYS[1]
local limit = tonumber(ARGV[1])
local window = tonumber(ARGV[2])

-- Increment request count
local count = redis.call('INCR', key)

-- Set expiration only on the first request
if count == 1 then
    redis.call('EXPIRE', key, window)
end

-- Get remaining time
local ttl = redis.call('TTL', key)

-- Determine whether request is allowed
local allowed = 0

if count <= limit then
    allowed = 1
end

local remaining = math.max(0, limit - count)

return {allowed, remaining, ttl}