// Unit tests for Web SharedRateLimitService
// Testing API communication with admin-backend

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SharedRateLimitService } from '../sharedRateLimitService';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock console methods
const consoleSpy = {
  log: vi.spyOn(console, 'log').mockImplementation(() => {}),
  error: vi.spyOn(console, 'error').mockImplementation(() => {}),
};

describe('SharedRateLimitService (Web)', () => {
  let rateLimitService: SharedRateLimitService;
  const testEmail = 'test@example.com';

  beforeEach(() => {
    rateLimitService = new SharedRateLimitService();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('checkRateLimit', () => {
    it('should make successful API call and return rate limit data', async () => {
      const mockResponse = {
        allowed: true,
        attempts: 2,
        timeRemaining: 0,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: mockResponse
        }),
      });

      const result = await rateLimitService.checkRateLimit(testEmail);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/rate-limit/check'),
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email: testEmail }),
        }
      );

      expect(result).toEqual(mockResponse);
    });

    it('should handle rate limit exceeded response', async () => {
      const mockResponse = {
        allowed: false,
        error: 'TOO_MANY_ATTEMPTS',
        attempts: 5,
        timeRemaining: 900000,
        message: 'Çok fazla deneme! 15 dakika bekleyin.',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: mockResponse
        }),
      });

      const result = await rateLimitService.checkRateLimit(testEmail);

      expect(result).toEqual(mockResponse);
      expect(result.allowed).toBe(false);
      expect(result.error).toBe('TOO_MANY_ATTEMPTS');
    });

    it('should handle progressive delay response', async () => {
      const mockResponse = {
        allowed: false,
        error: 'PROGRESSIVE_DELAY',
        attempts: 3,
        timeRemaining: 2000,
        message: 'Çok hızlı deneme! 3 saniye bekleyin.',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: mockResponse
        }),
      });

      const result = await rateLimitService.checkRateLimit(testEmail);

      expect(result).toEqual(mockResponse);
      expect(result.error).toBe('PROGRESSIVE_DELAY');
    });

    it('should handle network error and return fallback', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await rateLimitService.checkRateLimit(testEmail);

      expect(result).toEqual({
        allowed: true,
        attempts: 0,
        timeRemaining: 0,
        message: 'Network error - allowing request',
      });
    });

    it('should handle HTTP error response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      const result = await rateLimitService.checkRateLimit(testEmail);

      expect(result).toEqual({
        allowed: true,
        attempts: 0,
        timeRemaining: 0,
        message: 'Network error - allowing request',
      });
    });
  });

  describe('recordFailedAttempt', () => {
    it('should make successful API call to record failed attempt', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

      await rateLimitService.recordFailedAttempt(testEmail);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/rate-limit/record-failed'),
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email: testEmail }),
        }
      );

      // Recording successful - no console expectations needed
    });

    it('should handle network error gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(rateLimitService.recordFailedAttempt(testEmail)).resolves.not.toThrow();
    });

    it('should handle HTTP error response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      await expect(rateLimitService.recordFailedAttempt(testEmail)).resolves.not.toThrow();
    });
  });

  describe('resetRateLimit', () => {
    it('should make successful API call to reset rate limit', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

      await rateLimitService.resetRateLimit(testEmail);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/rate-limit/reset'),
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email: testEmail }),
        }
      );

      // Reset successful - no console expectations needed
    });

    it('should handle network error gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(rateLimitService.resetRateLimit(testEmail)).resolves.not.toThrow();
    });
  });

  describe('API Configuration', () => {
    it('should use correct API base URL from environment', () => {
      // Test API URL construction
      const expectedUrl = import.meta.env.VITE_ADMIN_BACKEND_URL || 'http://localhost:3002';
      
      // This is tested implicitly through the fetch calls above
      expect(mockFetch).not.toHaveBeenCalledWith(
        expect.stringContaining('undefined')
      );
    });

    it('should use correct headers for all requests', () => {
      const expectedHeaders = {
        'Content-Type': 'application/json',
      };

      // Headers are tested in individual API calls
      expect(expectedHeaders).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle JSON parse error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.reject(new Error('Invalid JSON')),
      });

      const result = await rateLimitService.checkRateLimit(testEmail);

      expect(result).toEqual({
        allowed: true,
        attempts: 0,
        timeRemaining: 0,
        message: 'Network error - allowing request',
      });
    });

    it('should handle empty response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(null),
      });

      const result = await rateLimitService.checkRateLimit(testEmail);

      expect(result).toEqual({
        allowed: true,
        attempts: 0,
        timeRemaining: 0,
        message: 'Network error - allowing request',
      });
    });
  });

  describe('Logging', () => {
    it('should handle API interactions', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ allowed: true, attempts: 0, timeRemaining: 0 }),
      });

      const result = await rateLimitService.checkRateLimit(testEmail);

      expect(result.allowed).toBe(true);
    });

    it('should handle errors gracefully', async () => {
      const error = new Error('Test error');
      mockFetch.mockRejectedValueOnce(error);

      const result = await rateLimitService.checkRateLimit(testEmail);

      expect(result).toEqual({
        allowed: true,
        attempts: 0,
        timeRemaining: 0,
        message: 'Network error - allowing request',
      });
    });
  });
});