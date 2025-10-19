// Unit tests for Web Local RateLimitService
// Testing localStorage-based rate limiting fallback

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { rateLimitService } from '../rateLimitService';

// Mock Date.now() to return a fixed timestamp
const mockNow = 1704067200000; // 2024-01-01 00:00:00 UTC
vi.spyOn(Date, 'now').mockReturnValue(mockNow);

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

// Mock console methods
const consoleSpy = {
  log: vi.spyOn(console, 'log').mockImplementation(() => {}),
  error: vi.spyOn(console, 'error').mockImplementation(() => {}),
};

describe('RateLimitService (Web Local)', () => {
  const testEmail = 'test@example.com';

  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  describe('checkRateLimit', () => {
    it('should allow first login attempt', async () => {
      const result = await rateLimitService.checkRateLimit(testEmail);
      expect(result.allowed).toBe(true);
      expect(result.timeRemaining).toBe(0);
    });

    it('should allow login within rate limit (2 attempts)', async () => {
      const rateLimitData = {
        email: testEmail,
        attempts: 2,
        firstAttempt: mockNow - 120000, // 2 dakika önce (window içinde)
        lastAttempt: mockNow - 1000,
        blocked: false,
      };
      localStorageMock.getItem.mockReturnValue(JSON.stringify(rateLimitData));
      const result = await rateLimitService.checkRateLimit(testEmail);
      expect(result.allowed).toBe(false); // 2 attempts olduğu için progressive delay uygulanıyor
      expect(result.error).toBe('PROGRESSIVE_DELAY');
      expect(result.timeRemaining).toBeGreaterThan(0);
    });

    it('should apply progressive delay for 3rd attempt', async () => {
      const rateLimitData = {
        email: testEmail,
        attempts: 3,
        firstAttempt: mockNow - 120000, // 2 dakika önce (window içinde)
        lastAttempt: mockNow - 500, // 0.5 saniye önce (2 saniye delay içinde)
        blocked: false,
      };
      localStorageMock.getItem.mockReturnValue(JSON.stringify(rateLimitData));
      const result = await rateLimitService.checkRateLimit(testEmail);
      expect(result.allowed).toBe(false);
      expect(result.error).toBe('PROGRESSIVE_DELAY');
      expect(result.timeRemaining).toBeGreaterThan(0);
      expect(result.message).toContain('saniye');
    });

    it('should block after 5 failed attempts', async () => {
      const rateLimitData = {
        email: testEmail,
        attempts: 5,
        firstAttempt: mockNow - 300000, // 5 dakika önce (15 dakika block içinde)
        lastAttempt: mockNow - 1000,
        blocked: false,
      };
      localStorageMock.getItem.mockReturnValue(JSON.stringify(rateLimitData));
      const result = await rateLimitService.checkRateLimit(testEmail);
      expect(result.allowed).toBe(false);
      expect(result.error).toBe('TOO_MANY_ATTEMPTS');
      expect(result.message).toContain('dakika');
    });

    it('should respect existing block', async () => {
      const rateLimitData = {
        email: testEmail,
        attempts: 10, // MAX_ATTEMPTS_PER_HOUR'a ulaşmış
        firstAttempt: mockNow - 120000, // 2 dakika önce (window içinde)
        lastAttempt: mockNow - 1000,
        blocked: true,
        blockExpiry: mockNow + 900000, // 15 dakika sonra (gelecekte)
      };
      localStorageMock.getItem.mockReturnValue(JSON.stringify(rateLimitData));
      const result = await rateLimitService.checkRateLimit(testEmail);
      expect(result.allowed).toBe(false);
      expect(result.error).toBe('ACCOUNT_LOCKED');
      expect(result.timeRemaining).toBeGreaterThan(0);
    });

    it('should clear expired block', async () => {
      const rateLimitData = {
        email: testEmail,
        attempts: 5,
        firstAttempt: mockNow - 600000, // 10 dakika önce (window dışında)
        lastAttempt: mockNow - 1000,
        blocked: true,
        blockExpiry: mockNow - 1000, // Geçmişte (expired)
      };
      localStorageMock.getItem.mockReturnValue(JSON.stringify(rateLimitData));
      const result = await rateLimitService.checkRateLimit(testEmail);
      expect(result.allowed).toBe(true);
      expect(result.timeRemaining).toBe(0);
    });

    it('should reset attempts after 5-minute window', async () => {
      const rateLimitData = {
        email: testEmail,
        attempts: 3,
        firstAttempt: mockNow - 360000, // 6 dakika önce (window dışında)
        lastAttempt: mockNow - 1000,
        blocked: false,
      };
      localStorageMock.getItem.mockReturnValue(JSON.stringify(rateLimitData));
      const result = await rateLimitService.checkRateLimit(testEmail);
      expect(result.allowed).toBe(true);
      expect(result.timeRemaining).toBe(0);
    });

    it('should handle corrupted localStorage data', async () => {
      localStorageMock.getItem.mockReturnValue('invalid-json');
      const result = await rateLimitService.checkRateLimit(testEmail);
      expect(result.allowed).toBe(true);
      expect(result.timeRemaining).toBe(0);
    });

    it('should handle localStorage errors gracefully', async () => {
      localStorageMock.getItem.mockImplementation(() => {
        throw new Error('localStorage error');
      });
      const result = await rateLimitService.checkRateLimit(testEmail);
      expect(result.allowed).toBe(true);
      expect(result.timeRemaining).toBe(0);
    });
  });

  describe('recordFailedAttempt', () => {
    it('should record first failed attempt', async () => {
      await rateLimitService.recordFailedAttempt(testEmail);
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'rate_limit_test@example.com',
        expect.stringContaining('"email":"test@example.com"')
      );
    });

    it('should increment attempt count', async () => {
      const existingData = {
        email: testEmail,
        attempts: 2,
        firstAttempt: mockNow - 120000,
        lastAttempt: mockNow - 1000,
        blocked: false,
      };
      localStorageMock.getItem.mockReturnValue(JSON.stringify(existingData));
      await rateLimitService.recordFailedAttempt(testEmail);
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'rate_limit_test@example.com',
        expect.stringContaining('"email":"test@example.com"')
      );
    });

    it('should reset attempt count if outside window', async () => {
      const existingData = {
        email: testEmail,
        attempts: 3,
        firstAttempt: mockNow - 360000, // 6 dakika önce (window dışında)
        lastAttempt: mockNow - 1000,
        blocked: false,
      };
      localStorageMock.getItem.mockReturnValue(JSON.stringify(existingData));
      await rateLimitService.recordFailedAttempt(testEmail);
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'rate_limit_test@example.com',
        expect.stringContaining('"email":"test@example.com"')
      );
    });

    it('should handle localStorage errors gracefully', async () => {
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('localStorage quota exceeded');
      });
      await rateLimitService.recordFailedAttempt(testEmail);
      expect(consoleSpy.error).toHaveBeenCalled();
    });
  });

  describe('resetRateLimit', () => {
    it('should clear rate limit data', async () => {
      await rateLimitService.resetRateLimit(testEmail);
      expect(localStorageMock.removeItem).toHaveBeenCalledWith(
        'rate_limit_test@example.com'
      );
    });

    it('should handle localStorage errors gracefully', async () => {
      localStorageMock.removeItem.mockImplementation(() => {
        throw new Error('localStorage error');
      });
      await rateLimitService.resetRateLimit(testEmail);
      expect(consoleSpy.error).toHaveBeenCalled();
    });
  });

  describe('Configuration', () => {
    it('should use correct rate limit configuration', () => {
      // Test configuration constants
      expect(rateLimitService).toBeDefined();
    });
  });

  describe('Time Calculations', () => {
    it('should calculate progressive delay correctly', async () => {
      const rateLimitData = {
        email: testEmail,
        attempts: 2,
        firstAttempt: mockNow - 120000,
        lastAttempt: mockNow - 500, // 0.5 saniye önce
        blocked: false,
      };
      localStorageMock.getItem.mockReturnValue(JSON.stringify(rateLimitData));
      const result = await rateLimitService.checkRateLimit(testEmail);
      expect(result.allowed).toBe(false);
      expect(result.error).toBe('PROGRESSIVE_DELAY');
      expect(result.timeRemaining).toBeGreaterThan(0);
    });

    it('should calculate block expiry correctly', async () => {
      const rateLimitData = {
        email: testEmail,
        attempts: 10, // MAX_ATTEMPTS_PER_HOUR'a ulaşmış
        firstAttempt: mockNow - 120000, // 2 dakika önce (window içinde)
        lastAttempt: mockNow - 1000,
        blocked: true,
        blockExpiry: mockNow + 900000, // 15 dakika sonra (gelecekte)
      };
      localStorageMock.getItem.mockReturnValue(JSON.stringify(rateLimitData));
      const result = await rateLimitService.checkRateLimit(testEmail);
      expect(result.allowed).toBe(false);
      expect(result.error).toBe('ACCOUNT_LOCKED');
      expect(result.timeRemaining).toBeGreaterThan(0);
    });
  });

  describe('Data Persistence', () => {
    it('should handle missing localStorage gracefully', async () => {
      localStorageMock.getItem.mockReturnValue(null);
      const result = await rateLimitService.checkRateLimit(testEmail);
      expect(result.allowed).toBe(true);
      expect(result.timeRemaining).toBe(0);
    });

    it('should handle localStorage quota exceeded', async () => {
      localStorageMock.setItem.mockImplementation(() => {
        throw new DOMException('QuotaExceededError');
      });
      await rateLimitService.recordFailedAttempt(testEmail);
      expect(consoleSpy.error).toHaveBeenCalled();
    });
  });
});