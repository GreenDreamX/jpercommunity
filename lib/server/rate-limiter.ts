// Simple, in-memory sliding window rate limiter
const rateLimitMap = new Map<string, number[]>()

export type RateLimitResult = {
  allowed: boolean
  remaining: number
  reset: number
}

/**
 * Checks if a key has exceeded the rate limit.
 * 
 * @param key Unique key to identify the client/action (e.g. IP + email)
 * @param limit Max number of requests allowed in the window
 * @param windowMs Window size in milliseconds
 */
export function checkRateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now()
  const timestamps = rateLimitMap.get(key) || []
  
  // Clean up expired timestamps (older than windowMs)
  const activeTimestamps = timestamps.filter(ts => now - ts < windowMs)
  
  if (activeTimestamps.length >= limit) {
    const oldestActive = activeTimestamps[0]
    const resetTime = oldestActive + windowMs
    return {
      allowed: false,
      remaining: 0,
      reset: Math.max(1, Math.ceil((resetTime - now) / 1000))
    }
  }
  
  activeTimestamps.push(now)
  rateLimitMap.set(key, activeTimestamps)
  
  return {
    allowed: true,
    remaining: limit - activeTimestamps.length,
    reset: Math.max(1, Math.ceil(windowMs / 1000))
  }
}
