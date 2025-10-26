/**
 * Simple In-Memory Rate Limiter
 * 
 * Features:
 * - IP-based rate limiting
 * - User-based rate limiting
 * - Configurable limits per endpoint
 * - Automatic cleanup of old entries
 * - Zero external dependencies
 * 
 * Note: This is a memory-based implementation.
 * For production with multiple servers, use Redis (upstash/ratelimit)
 * 
 * Usage:
 * import { createRateLimiter } from '@/lib/rate-limit'
 * 
 * const limiter = createRateLimiter({
 *   uniqueTokenPerInterval: 100,
 *   interval: 60000, // 1 minute
 * })
 * 
 * const isAllowed = await limiter.check(identifier)
 */

interface RateLimiterConfig {
  /**
   * Maximum number of requests per interval
   */
  uniqueTokenPerInterval: number
  
  /**
   * Time window in milliseconds
   */
  interval: number
}

interface TokenBucket {
  tokens: number
  lastRefill: number
}

class RateLimiter {
  private config: RateLimiterConfig
  private store: Map<string, TokenBucket>
  private cleanupInterval: NodeJS.Timeout | null = null

  constructor(config: RateLimiterConfig) {
    this.config = config
    this.store = new Map()
    
    // Cleanup old entries every minute
    this.cleanupInterval = setInterval(() => {
      this.cleanup()
    }, 60000)
  }

  /**
   * Check if a request is allowed
   * @param identifier - Unique identifier (IP, userId, etc.)
   * @returns true if allowed, false if rate limited
   */
  async check(identifier: string): Promise<boolean> {
    const now = Date.now()
    let bucket = this.store.get(identifier)

    if (!bucket) {
      // First request from this identifier
      bucket = {
        tokens: this.config.uniqueTokenPerInterval - 1,
        lastRefill: now,
      }
      this.store.set(identifier, bucket)
      return true
    }

    // Calculate tokens to add based on time elapsed
    const timeSinceLastRefill = now - bucket.lastRefill
    const intervalsElapsed = Math.floor(timeSinceLastRefill / this.config.interval)

    if (intervalsElapsed > 0) {
      // Refill tokens
      bucket.tokens = Math.min(
        this.config.uniqueTokenPerInterval,
        bucket.tokens + intervalsElapsed * this.config.uniqueTokenPerInterval
      )
      bucket.lastRefill = now
    }

    // Check if we have tokens available
    if (bucket.tokens > 0) {
      bucket.tokens -= 1
      return true
    }

    // Rate limited
    return false
  }

  /**
   * Get remaining tokens for an identifier
   */
  getRemaining(identifier: string): number {
    const bucket = this.store.get(identifier)
    return bucket ? bucket.tokens : this.config.uniqueTokenPerInterval
  }

  /**
   * Reset rate limit for an identifier
   */
  reset(identifier: string): void {
    this.store.delete(identifier)
  }

  /**
   * Cleanup old entries (called automatically)
   */
  private cleanup(): void {
    const now = Date.now()
    const maxAge = this.config.interval * 2 // Keep entries for 2x interval

    for (const [identifier, bucket] of this.store.entries()) {
      if (now - bucket.lastRefill > maxAge) {
        this.store.delete(identifier)
      }
    }
  }

  /**
   * Destroy the rate limiter and cleanup resources
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = null
    }
    this.store.clear()
  }
}

/**
 * Create a rate limiter instance
 */
export function createRateLimiter(config: RateLimiterConfig): RateLimiter {
  return new RateLimiter(config)
}

/**
 * Pre-configured rate limiters for common use cases
 */
export const rateLimiters = {
  // Strict: For authentication endpoints
  strict: createRateLimiter({
    uniqueTokenPerInterval: 5,
    interval: 60000, // 5 requests per minute
  }),

  // Standard: For API endpoints
  standard: createRateLimiter({
    uniqueTokenPerInterval: 30,
    interval: 60000, // 30 requests per minute
  }),

  // Generous: For read-heavy endpoints
  generous: createRateLimiter({
    uniqueTokenPerInterval: 100,
    interval: 60000, // 100 requests per minute
  }),

  // Messaging: For messaging endpoints (higher limit)
  messaging: createRateLimiter({
    uniqueTokenPerInterval: 60,
    interval: 60000, // 60 requests per minute
  }),
}

/**
 * Helper to get client identifier (IP or userId)
 */
export function getClientIdentifier(request: Request, userId?: string): string {
  if (userId) {
    return `user:${userId}`
  }

  // Try to get IP from various headers
  const forwarded = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const ip = forwarded?.split(',')[0] || realIp || 'unknown'

  return `ip:${ip}`
}

/**
 * Rate limit response helper
 */
export function rateLimitExceeded(retryAfter: number = 60) {
  return new Response(
    JSON.stringify({
      error: 'Rate limit exceeded',
      message: 'Too many requests. Please try again later.',
      retryAfter,
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': retryAfter.toString(),
        'X-RateLimit-Limit': '60',
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': new Date(Date.now() + retryAfter * 1000).toISOString(),
      },
    }
  )
}

export default rateLimiters

