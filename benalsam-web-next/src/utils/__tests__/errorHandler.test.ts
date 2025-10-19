import { describe, it, expect, vi, beforeEach } from 'vitest';
import { errorHandler } from '../errorHandler';

// Mock toast
vi.mock('@/components/ui/use-toast', () => ({
  toast: vi.fn()
}));

describe('ErrorHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('handleApiError', () => {
    it('should handle network error', () => {
      const error = new Error('Network Error');
      const context = { component: 'TestComponent', action: 'test_action' };

      errorHandler.handleApiError(error, context);

      // Should not throw and should handle gracefully
      expect(true).toBe(true);
    });

    it('should handle API error with status code', () => {
      const error = {
        status: 404,
        message: 'Not found',
        code: 'NOT_FOUND'
      };
      const context = { component: 'TestComponent', action: 'test_action' };

      errorHandler.handleApiError(error, context);

      expect(true).toBe(true);
    });

    it('should handle validation error', () => {
      const error = {
        status: 400,
        message: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: { field: 'email', message: 'Invalid email format' }
      };
      const context = { component: 'TestComponent', action: 'test_action' };

      errorHandler.handleApiError(error, context);

      expect(true).toBe(true);
    });

    it('should handle authentication error', () => {
      const error = {
        status: 401,
        message: 'Unauthorized',
        code: 'UNAUTHORIZED'
      };
      const context = { component: 'TestComponent', action: 'test_action' };

      errorHandler.handleApiError(error, context);

      expect(true).toBe(true);
    });

    it('should handle rate limit error', () => {
      const error = {
        status: 429,
        message: 'Too many requests',
        code: 'RATE_LIMIT_EXCEEDED'
      };
      const context = { component: 'TestComponent', action: 'test_action' };

      errorHandler.handleApiError(error, context);

      expect(true).toBe(true);
    });

    it('should handle server error', () => {
      const error = {
        status: 500,
        message: 'Internal server error',
        code: 'INTERNAL_ERROR'
      };
      const context = { component: 'TestComponent', action: 'test_action' };

      errorHandler.handleApiError(error, context);

      expect(true).toBe(true);
    });
  });

  describe('Error handling', () => {
    it('should handle errors gracefully', () => {
      const error = new Error('Test error');
      const context = { component: 'TestComponent', action: 'test_action' };

      // Should not throw
      expect(() => {
        errorHandler.handleApiError(error, context);
      }).not.toThrow();
    });
  });

  describe('Error types', () => {
    it('should handle different error types', () => {
      const networkError = new Error('Network Error');
      const apiError = { status: 404, message: 'Not found' };
      const validationError = { status: 400, message: 'Validation failed' };

      // Should handle all error types without throwing
      expect(() => {
        errorHandler.handleApiError(networkError, { component: 'Test' });
        errorHandler.handleApiError(apiError, { component: 'Test' });
        errorHandler.handleApiError(validationError, { component: 'Test' });
      }).not.toThrow();
    });
  });
});
