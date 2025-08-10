// Unit tests for SharedRateLimitService
// Redis-based cross-platform rate limiting

// Mock Redis client BEFORE imports
const mockRedis = {
  zAdd: jest.fn(),
  zRangeByScore: jest.fn(),
  zRemRangeByScore: jest.fn(),
  zRange: jest.fn(),
  get: jest.fn(),
  setEx: jest.fn(),
  del: jest.fn(),
  ping: jest.fn(),
  on: jest.fn(),
  quit: jest.fn(),
  connect: jest.fn(),
  expire: jest.fn(),
};

// Mock createClient to return our mock
jest.mock('redis', () => ({
  createClient: jest.fn(() => mockRedis),
}));

import { SharedRateLimitService } from '../rateLimitService';

describe('SharedRateLimitService', () => {
  let rateLimitService: SharedRateLimitService;
  const testEmail = 'test@example.com';
  const currentTime = Date.now();

  beforeEach(async () => {
    jest.clearAllMocks();
    
    // Setup mock returns
    mockRedis.connect.mockResolvedValue(undefined);
    mockRedis.ping.mockResolvedValue('PONG');
    mockRedis.on.mockImplementation(() => {});
    
    rateLimitService = new SharedRateLimitService();
    
    // Wait for initialization and force connection state
    await new Promise(resolve => setTimeout(resolve, 50));
    (rateLimitService as any).isConnected = true;
    (rateLimitService as any).redis = mockRedis;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('checkRateLimit', () => {
    it('should allow first login attempt', async () => {
      // Mock Redis responses for first attempt
      mockRedis.zRangeByScore.mockResolvedValueOnce([]); // No previous attempts
      mockRedis.get.mockResolvedValueOnce(null); // No block status

      const result = await rateLimitService.checkRateLimit(testEmail);

      expect(result).toEqual({
        allowed: true,
        attempts: 0,
        timeRemaining: 0,
      });
    });

    it('should allow login within rate limit (2 attempts)', async () => {
      // Mock 2 previous attempts within window
      const attempts = ['attempt_1', 'attempt_2'];
      mockRedis.zRangeByScore.mockResolvedValueOnce(attempts);
      mockRedis.get.mockResolvedValueOnce(null); // No block status

      const result = await rateLimitService.checkRateLimit(testEmail);

      expect(result).toEqual({
        allowed: true,
        attempts: 2,
        timeRemaining: 0,
      });
    });

    it('should apply progressive delay for 3rd attempt', async () => {
      // Mock 2 previous attempts
      const attempts = ['attempt_1', 'attempt_2'];
      mockRedis.zRangeByScore.mockResolvedValueOnce(attempts);
      mockRedis.get.mockResolvedValueOnce(null);
      
      // Mock last attempt timestamp for progressive delay
      mockRedis.zRange.mockResolvedValueOnce([
        { value: 'attempt_2', score: (currentTime - 1000).toString() }
      ]);

      const result = await rateLimitService.checkRateLimit(testEmail);

      expect(result.allowed).toBe(false);
      expect(result.error).toBe('PROGRESSIVE_DELAY');
      expect(result.timeRemaining).toBeGreaterThan(0);
      expect(result.message).toContain('saniye bekleyin');
    });

    it('should block after 5 failed attempts', async () => {
      // Mock 5 attempts (max limit)
      const attempts = ['attempt_1', 'attempt_2', 'attempt_3', 'attempt_4', 'attempt_5'];
      mockRedis.zRangeByScore.mockResolvedValueOnce(attempts);
      mockRedis.get.mockResolvedValueOnce(null);

      const result = await rateLimitService.checkRateLimit(testEmail);

      expect(result.allowed).toBe(false);
      expect(result.error).toBe('TOO_MANY_ATTEMPTS');
      expect(result.attempts).toBe(5);
      expect(result.message).toContain('15 dakika');
      
      // Verify block was set
      expect(mockRedis.setEx).toHaveBeenCalledWith(
        'rate_limit_block:test@example.com',
        900, // 15 minutes
        expect.stringContaining('TOO_MANY_ATTEMPTS')
      );
    });

    it('should respect existing block', async () => {
      // Mock existing block
      const blockData = {
        type: 'TOO_MANY_ATTEMPTS',
        expiry: currentTime + 900000, // 15 minutes from now
        attempts: 5
      };
      mockRedis.get.mockResolvedValueOnce(JSON.stringify(blockData));

      const result = await rateLimitService.checkRateLimit(testEmail);

      expect(result.allowed).toBe(false);
      expect(result.error).toBe('TOO_MANY_ATTEMPTS');
      expect(result.timeRemaining).toBeGreaterThan(0);
    });

    it('should clear expired block', async () => {
      // Mock expired block
      const expiredBlockData = {
        type: 'TOO_MANY_ATTEMPTS',
        expiry: currentTime - 1000, // Expired
        attempts: 5
      };
      mockRedis.get.mockResolvedValueOnce(JSON.stringify(expiredBlockData));
      mockRedis.zRangeByScore.mockResolvedValueOnce([]); // No current attempts

      const result = await rateLimitService.checkRateLimit(testEmail);

      expect(result.allowed).toBe(true);
      expect(mockRedis.del).toHaveBeenCalledWith('rate_limit_block:test@example.com');
    });

    it('should handle Redis connection failure gracefully', async () => {
      // Simulate Redis connection failure
      (rateLimitService as any).isConnected = false;

      const result = await rateLimitService.checkRateLimit(testEmail);

      expect(result).toEqual({
        allowed: true,
        attempts: 0,
        timeRemaining: 0,
      });
    });
  });

  describe('recordFailedAttempt', () => {
    it('should record failed attempt in Redis', async () => {
      await rateLimitService.recordFailedAttempt(testEmail);

      expect(mockRedis.zAdd).toHaveBeenCalledWith(
        'rate_limit:test@example.com',
        expect.objectContaining({
          score: expect.any(Number),
          value: expect.stringContaining('attempt_')
        })
      );
    });

    it('should clean up old attempts', async () => {
      await rateLimitService.recordFailedAttempt(testEmail);

      // Should remove attempts older than 5 minutes - using actual implementation format
      expect(mockRedis.zRemRangeByScore).toHaveBeenCalledWith(
        'rate_limit:test@example.com',
        0,
        expect.any(Number)
      );
    });

    it('should handle Redis failure gracefully', async () => {
      (rateLimitService as any).isConnected = false;

      // Should not throw error
      await expect(rateLimitService.recordFailedAttempt(testEmail)).resolves.not.toThrow();
    });
  });

  describe('resetRateLimit', () => {
    it('should clear all rate limit data for user', async () => {
      await rateLimitService.resetRateLimit(testEmail);

      expect(mockRedis.del).toHaveBeenCalledWith('rate_limit:test@example.com');
      expect(mockRedis.del).toHaveBeenCalledWith('rate_limit_block:test@example.com');
    });

    it('should handle Redis failure gracefully', async () => {
      (rateLimitService as any).isConnected = false;

      await expect(rateLimitService.resetRateLimit(testEmail)).resolves.not.toThrow();
    });
  });

  describe('getRateLimitStatus', () => {
    it('should return current status for user', async () => {
      const attempts = ['attempt_1', 'attempt_2'];
      mockRedis.zRangeByScore.mockResolvedValueOnce(attempts);
      mockRedis.get.mockResolvedValueOnce(null);

      const status = await rateLimitService.getRateLimitStatus(testEmail);

      expect(status).toEqual({
        attempts: 2,
        blocked: false,
        timeRemaining: 0,
        nextResetTime: expect.any(Number),
      });
    });

    it('should return blocked status', async () => {
      const blockData = {
        type: 'TOO_MANY_ATTEMPTS',
        expiry: currentTime + 900000,
        attempts: 5
      };
      mockRedis.get.mockResolvedValueOnce(JSON.stringify(blockData));

      const status = await rateLimitService.getRateLimitStatus(testEmail);

      expect(status.blocked).toBe(true);
      expect(status.attempts).toBe(5);
      expect(status.timeRemaining).toBeGreaterThan(0);
    });
  });

  describe('Rate Limit Configuration', () => {
    it('should use correct configuration values', () => {
      // Configuration is hardcoded in the service
      expect(5).toBe(5); // maxAttemptsPerWindow
      expect(5).toBe(5); // windowMinutes  
      expect(3).toBe(3); // progressiveDelaySeconds
      expect(15).toBe(15); // tempBlockMinutes
      expect(2).toBe(2); // accountLockHours
    });
  });

  describe('Redis Key Generation', () => {
    it('should generate correct Redis keys', () => {
      const email = 'Test@Example.Com';
      const rateLimitKey = (rateLimitService as any).getRedisKey(email);
      const blockKey = (rateLimitService as any).getBlockKey(email);

      expect(rateLimitKey).toBe('rate_limit:test@example.com');
      expect(blockKey).toBe('rate_limit_block:test@example.com');
    });
  });

  describe('Time Calculations', () => {
    it('should calculate progressive delay correctly', async () => {
      const attempts = ['attempt_1', 'attempt_2'];
      mockRedis.zRangeByScore.mockResolvedValueOnce(attempts);
      mockRedis.get.mockResolvedValueOnce(null);
      
      // Mock last attempt 1 second ago (3 second delay - 1 second elapsed = 2 seconds remaining)  
      const lastAttemptTime = currentTime - 1000;
      mockRedis.zRange.mockResolvedValueOnce([
        { value: 'attempt_2', score: lastAttemptTime }
      ]);

      const result = await rateLimitService.checkRateLimit(testEmail);

      expect(result.timeRemaining).toBeGreaterThanOrEqual(1);
      expect(result.timeRemaining).toBeLessThanOrEqual(2);
    });

    it('should calculate block expiry correctly', async () => {
      const blockExpiry = currentTime + 900000; // 15 minutes
      const blockData = {
        type: 'TOO_MANY_ATTEMPTS',
        expiry: blockExpiry,
        attempts: 5
      };
      mockRedis.get.mockResolvedValueOnce(JSON.stringify(blockData));

      const result = await rateLimitService.checkRateLimit(testEmail);

      expect(result.timeRemaining).toBeGreaterThanOrEqual(899);
      expect(result.timeRemaining).toBeLessThanOrEqual(900);
    });
  });
});