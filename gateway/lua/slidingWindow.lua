
-- KEYS[1] = sorted set key
-- ARGV[1] = window duration in milliseconds
-- ARGV[2] = request limit
-- ARGV[3] = unique request ID

local key = KEYS[1]
local window = tonumber(ARGV[1])
local limit = tonumber(ARGV[2])
local request_id = ARGV[3]

-- Get Redis server time in milliseconds
local time = redis.call('TIME')

local now = tonumber(time[1]) * 1000
          + math.floor(tonumber(time[2]) / 1000)

-- Remove expired requests
redis.call('ZREMRANGEBYSCORE', key, '-inf', now - window)

-- Count requests inside the current window
local count = redis.call('ZCARD', key)

if count < limit then

    -- Record this request
    redis.call('ZADD', key, now, request_id)

    -- Keep the key from leaking memory
    redis.call('PEXPIRE', key, window)

    return {1, limit - count - 1, 0}

end

-- Find the oldest request to calculate retry time
local oldest = redis.call('ZRANGE', key, 0, 0, 'WITHSCORES')

local retry_ms = tonumber(oldest[2]) + window - now

return {0, 0, retry_ms}
