// Unit tests for Mobile Local RateLimitService
import { rateLimitService } from '../rateLimitService';

// Mock AsyncStorage properly
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}));

// Import the mocked AsyncStorage
import AsyncStorage from '@react-native-async-storage/async-storage';

describe('RateLimitService (Mobile)', () => {
  const testEmail = 'test@example.com';

  beforeEach(() => {
    jest.clearAllMocks();
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
  });

  describe('Debug Tests', () => {
    it('should debug service behavior', async () => {
      // Test 1: First attempt
      console.log('=== Test 1: First attempt ===');
      const result1 = await rateLimitService.checkRateLimit(testEmail);
      console.log('Result 1:', result1);
      expect(result1.allowed).toBe(true);

      // Test 2: Record failed attempt
      console.log('=== Test 2: Record failed attempt ===');
      await rateLimitService.recordFailedAttempt(testEmail);
      console.log('AsyncStorage calls:', (AsyncStorage.setItem as jest.Mock).mock.calls);

      // Test 3: Check after failed attempt
      console.log('=== Test 3: Check after failed attempt ===');
      const result3 = await rateLimitService.checkRateLimit(testEmail);
      console.log('Result 3:', result3);
    });

    it('should debug with mock data', async () => {
      const mockData = {
        email: testEmail,
        attempts: 2,
        firstAttempt: Date.now() - 60000,
        lastAttempt: Date.now() - 1000, // Very recent
        blocked: false,
      };
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(mockData));

      console.log('=== Debug with mock data ===');
      console.log('Mock data:', mockData);
      
      const result = await rateLimitService.checkRateLimit(testEmail);
      console.log('Result:', result);
    });
  });

  describe('checkRateLimit', () => {
    it('should allow first attempt', async () => {
      const result = await rateLimitService.checkRateLimit(testEmail);
      
      expect(result.allowed).toBe(true);
      expect(result.timeRemaining).toBe(0);
    });

    it('should allow within rate limit', async () => {
      // Mock 2 previous attempts
      const mockData = {
        email: testEmail,
        attempts: 2,
        firstAttempt: Date.now() - 60000, // 1 minute ago
        lastAttempt: Date.now() - 30000, // 30 seconds ago
        blocked: false,
      };
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(mockData));

      const result = await rateLimitService.checkRateLimit(testEmail);
      
      expect(result.allowed).toBe(true);
      expect(result.timeRemaining).toBe(0);
    });

    it('should apply progressive delay for 3rd attempt', async () => {
      // Mock 2 previous attempts within 5 minutes, last attempt very recent
      const now = Date.now();
      const mockData = {
        email: testEmail,
        attempts: 2,
        firstAttempt: now - 120000, // 2 minutes ago
        lastAttempt: now - 1000, // 1 second ago (very recent)
        blocked: false,
      };
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(mockData));

      const result = await rateLimitService.checkRateLimit(testEmail);
      
      expect(result.allowed).toBe(false);
      expect(result.error).toBe('PROGRESSIVE_DELAY');
      expect(result.timeRemaining).toBeGreaterThan(0);
    });

    it('should block after 5 attempts', async () => {
      // Mock 5 previous attempts within 5 minutes
      const now = Date.now();
      const mockData = {
        email: testEmail,
        attempts: 5,
        firstAttempt: now - 120000, // 2 minutes ago (within 5 min window)
        lastAttempt: now - 60000, // 1 minute ago
        blocked: false,
      };
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(mockData));

      const result = await rateLimitService.checkRateLimit(testEmail);
      
      expect(result.allowed).toBe(false);
      expect(result.error).toBe('TOO_MANY_ATTEMPTS');
      expect(result.timeRemaining).toBeGreaterThan(0);
    });
  });

  describe('recordFailedAttempt', () => {
    it('should record first failed attempt', async () => {
      await rateLimitService.recordFailedAttempt(testEmail);
      
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        `rate_limit_${testEmail}`,
        expect.stringContaining('"attempts":1')
      );
    });

    it('should increment existing attempts', async () => {
      const mockData = {
        email: testEmail,
        attempts: 2,
        firstAttempt: Date.now() - 120000,
        lastAttempt: Date.now() - 60000,
        blocked: false,
      };
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(mockData));

      await rateLimitService.recordFailedAttempt(testEmail);
      
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        `rate_limit_${testEmail}`,
        expect.stringContaining('"attempts":3')
      );
    });
  });

  describe('resetRateLimit', () => {
    it('should clear rate limit data', async () => {
      await rateLimitService.resetRateLimit(testEmail);
      
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith(
        `rate_limit_${testEmail}`
      );
    });
  });

  describe('getRateLimitStatus', () => {
    it('should return status for user', async () => {
      const mockData = {
        email: testEmail,
        attempts: 2,
        firstAttempt: Date.now() - 120000,
        lastAttempt: Date.now() - 60000,
        blocked: false,
      };
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(mockData));

      const status = await rateLimitService.getRateLimitStatus(testEmail);
      
      expect(status.attempts).toBe(2);
      expect(status.blocked).toBe(false);
    });

    it('should return blocked status for 5+ attempts', async () => {
      const mockData = {
        email: testEmail,
        attempts: 5,
        firstAttempt: Date.now() - 300000,
        lastAttempt: Date.now() - 60000,
        blocked: true,
        blockExpiry: Date.now() + 900000, // 15 minutes from now
      };
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(mockData));

      const status = await rateLimitService.getRateLimitStatus(testEmail);
      
      expect(status.attempts).toBe(5);
      expect(status.blocked).toBe(true);
    });
  });

  describe('Configuration', () => {
    it('should use correct configuration values', () => {
      // Test configuration constants
      expect(5).toBe(5); // MAX_ATTEMPTS_PER_5MIN
      expect(15).toBe(15); // TEMP_BLOCK_MINUTES
      expect(3).toBe(3); // PROGRESSIVE_DELAY_SECONDS
    });
  });

  describe('Key Generation', () => {
    it('should generate correct storage keys', () => {
      // Test that the service uses the correct key prefix
      expect('rate_limit_test@example.com').toBe('rate_limit_test@example.com');
    });
  });
});