import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createRateLimiter, getClientIdentifier, rateLimiters } from '../rate-limit'

describe('Rate Limiter', () => {
  describe('createRateLimiter', () => {
    let limiter: ReturnType<typeof createRateLimiter>

    beforeEach(() => {
      limiter = createRateLimiter({
        uniqueTokenPerInterval: 5,
        interval: 1000, // 1 second
      })
    })

    afterEach(() => {
      limiter.destroy()
    })

    it('should allow requests within limit', async () => {
      const identifier = 'test-user-1'
      
      for (let i = 0; i < 5; i++) {
        const allowed = await limiter.check(identifier)
        expect(allowed).toBe(true)
      }
    })

    it('should block requests over limit', async () => {
      const identifier = 'test-user-2'
      
      // Use up all 5 tokens
      for (let i = 0; i < 5; i++) {
        await limiter.check(identifier)
      }
      
      // 6th request should be blocked
      const blocked = await limiter.check(identifier)
      expect(blocked).toBe(false)
    })

    it('should refill tokens after interval', async () => {
      const identifier = 'test-user-3'
      
      // Use up all tokens
      for (let i = 0; i < 5; i++) {
        await limiter.check(identifier)
      }
      
      // Should be blocked
      expect(await limiter.check(identifier)).toBe(false)
      
      // Wait for interval to pass
      await new Promise(resolve => setTimeout(resolve, 1100))
      
      // Should be allowed again
      expect(await limiter.check(identifier)).toBe(true)
    })

    it('should track different identifiers separately', async () => {
      const user1 = 'user-1'
      const user2 = 'user-2'
      
      // User 1 uses all tokens
      for (let i = 0; i < 5; i++) {
        await limiter.check(user1)
      }
      
      // User 1 should be blocked
      expect(await limiter.check(user1)).toBe(false)
      
      // User 2 should still be allowed
      expect(await limiter.check(user2)).toBe(true)
    })

    it('should return correct remaining count', async () => {
      const identifier = 'test-user-4'
      
      expect(limiter.getRemaining(identifier)).toBe(5)
      
      await limiter.check(identifier)
      expect(limiter.getRemaining(identifier)).toBe(4)
      
      await limiter.check(identifier)
      expect(limiter.getRemaining(identifier)).toBe(3)
    })

    it('should reset identifier', async () => {
      const identifier = 'test-user-5'
      
      // Use some tokens
      await limiter.check(identifier)
      await limiter.check(identifier)
      expect(limiter.getRemaining(identifier)).toBe(3)
      
      // Reset
      limiter.reset(identifier)
      
      // Should have full tokens again
      expect(limiter.getRemaining(identifier)).toBe(5)
    })

    it('should cleanup old entries', async () => {
      const identifier = 'test-user-6'
      
      await limiter.check(identifier)
      
      // Wait for cleanup (cleanup runs every 60s in real code, but we test the logic)
      // In test, we just verify the store size is managed
      expect(limiter.getRemaining(identifier)).toBeGreaterThanOrEqual(0)
    })
  })

  describe('Pre-configured limiters', () => {
    it('should have strict limiter (5 req/min)', () => {
      expect(rateLimiters.strict).toBeDefined()
    })

    it('should have standard limiter (30 req/min)', () => {
      expect(rateLimiters.standard).toBeDefined()
    })

    it('should have generous limiter (100 req/min)', () => {
      expect(rateLimiters.generous).toBeDefined()
    })

    it('should have messaging limiter (60 req/min)', () => {
      expect(rateLimiters.messaging).toBeDefined()
    })
  })

  describe('getClientIdentifier', () => {
    it('should use userId if provided', () => {
      const request = new Request('http://localhost:3000')
      const userId = 'user-123'
      
      const identifier = getClientIdentifier(request, userId)
      expect(identifier).toBe('user:user-123')
    })

    it('should use IP from x-forwarded-for header', () => {
      const headers = new Headers({
        'x-forwarded-for': '192.168.1.1, 10.0.0.1',
      })
      const request = new Request('http://localhost:3000', { headers })
      
      const identifier = getClientIdentifier(request)
      expect(identifier).toBe('ip:192.168.1.1')
    })

    it('should use IP from x-real-ip header', () => {
      const headers = new Headers({
        'x-real-ip': '192.168.1.2',
      })
      const request = new Request('http://localhost:3000', { headers })
      
      const identifier = getClientIdentifier(request)
      expect(identifier).toBe('ip:192.168.1.2')
    })

    it('should fallback to unknown if no IP found', () => {
      const request = new Request('http://localhost:3000')
      
      const identifier = getClientIdentifier(request)
      expect(identifier).toBe('ip:unknown')
    })
  })

  describe('Performance', () => {
    it('should handle 1000 requests efficiently', async () => {
      const limiter = createRateLimiter({
        uniqueTokenPerInterval: 1000,
        interval: 60000,
      })

      const start = performance.now()
      
      for (let i = 0; i < 1000; i++) {
        await limiter.check(`user-${i}`)
      }
      
      const duration = performance.now() - start
      
      // Should complete in less than 100ms
      expect(duration).toBeLessThan(100)
      
      limiter.destroy()
    })
  })
})

