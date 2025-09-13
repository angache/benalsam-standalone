/**
 * Error Management Integration Tests
 * Hata yönetimi entegrasyon testleri
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { errorService } from '../services/errorService';
import { ErrorType, ErrorSeverity, ErrorAction } from '../types/errors';

describe('Error Management System', () => {
  beforeEach(() => {
    // Reset error metrics before each test
    errorService.resetMetrics();
  });

  afterEach(() => {
    // Clean up after each test
    errorService.resetMetrics();
  });

  describe('Error Classification', () => {
    it('should classify network timeout errors correctly', () => {
      const error = new Error('Connection timeout');
      const errorType = errorService.classifyError(error);
      expect(errorType).toBe(ErrorType.CONNECTION_TIMEOUT);
    });

    it('should classify connection refused errors correctly', () => {
      const error = new Error('Connection refused');
      const errorType = errorService.classifyError(error);
      expect(errorType).toBe(ErrorType.CONNECTION_REFUSED);
    });

    it('should classify Elasticsearch errors correctly', () => {
      const error = new Error('Elasticsearch index_not_found_exception');
      const errorType = errorService.classifyError(error);
      expect(errorType).toBe(ErrorType.ELASTICSEARCH_INDEX_NOT_FOUND);
    });

    it('should classify RabbitMQ errors correctly', () => {
      const error = new Error('RabbitMQ connection lost');
      const errorType = errorService.classifyError(error);
      expect(errorType).toBe(ErrorType.RABBITMQ_CONNECTION_LOST);
    });

    it('should classify database errors correctly', () => {
      const error = new Error('Database connection error');
      const errorType = errorService.classifyError(error);
      expect(errorType).toBe(ErrorType.DATABASE_CONNECTION_ERROR);
    });

    it('should classify validation errors correctly', () => {
      const error = new Error('Validation error: data validation failed');
      const errorType = errorService.classifyError(error);
      expect(errorType).toBe(ErrorType.VALIDATION_ERROR);
    });

    it('should default to INTERNAL_ERROR for unknown errors', () => {
      const error = new Error('Some unknown error');
      const errorType = errorService.classifyError(error);
      expect(errorType).toBe(ErrorType.INTERNAL_ERROR);
    });
  });

  describe('Error Creation', () => {
    it('should create custom error with proper properties', () => {
      const originalError = new Error('Test error');
      const customError = errorService.createError(
        ErrorType.NETWORK_ERROR,
        'Network connection failed',
        originalError,
        { jobId: 123, operation: 'UPDATE' },
        'trace-123'
      );

      expect(customError.type).toBe(ErrorType.NETWORK_ERROR);
      expect(customError.severity).toBe(ErrorSeverity.HIGH);
      expect(customError.action).toBe(ErrorAction.RETRY);
      expect(customError.retryable).toBe(true);
      expect(customError.traceId).toBe('trace-123');
      expect(customError.context).toEqual({ jobId: 123, operation: 'UPDATE' });
      expect(customError.timestamp).toBeInstanceOf(Date);
      expect(customError.retryCount).toBe(0);
    });
  });

  describe('Error Handling - Retry Actions', () => {
    it('should handle retryable errors with retry action', async () => {
      const customError = errorService.createError(
        ErrorType.CONNECTION_TIMEOUT,
        'Connection timeout',
        undefined,
        { jobId: 123 },
        'trace-123'
      );

      const result = await errorService.handleError(customError, { test: 'message' }, 0);

      expect(result.success).toBe(false);
      expect(result.action).toBe(ErrorAction.RETRY);
      expect(result.retryCount).toBe(1);
      expect(result.nextRetryAt).toBeInstanceOf(Date);
    });

    it('should handle max retries exceeded', async () => {
      const customError = errorService.createError(
        ErrorType.CONNECTION_TIMEOUT,
        'Connection timeout',
        undefined,
        { jobId: 123 },
        'trace-123'
      );

      // This test will use the actual DLQ service from setup.ts
      const result = await errorService.handleError(customError, { test: 'message' }, 5);

      expect(result.success).toBe(true);
      expect(result.action).toBe(ErrorAction.DLQ);
    });
  });

  describe('Error Handling - Skip Actions', () => {
    it('should handle validation errors with skip action', async () => {
      const customError = errorService.createError(
        ErrorType.VALIDATION_ERROR,
        'Invalid data format',
        undefined,
        { jobId: 123 },
        'trace-123'
      );

      const result = await errorService.handleError(customError, { test: 'message' }, 0);

      expect(result.success).toBe(true);
      expect(result.action).toBe(ErrorAction.SKIP);
      expect(result.retryCount).toBe(0);
    });

    it('should handle invalid message format with skip action', async () => {
      const customError = errorService.createError(
        ErrorType.INVALID_MESSAGE_FORMAT,
        'Invalid message format',
        undefined,
        { jobId: 123 },
        'trace-123'
      );

      const result = await errorService.handleError(customError, { test: 'message' }, 0);

      expect(result.success).toBe(true);
      expect(result.action).toBe(ErrorAction.SKIP);
    });
  });

  describe('Error Handling - Alert Actions', () => {
    it('should handle critical errors with alert action', async () => {
      const customError = errorService.createError(
        ErrorType.ELASTICSEARCH_UNAVAILABLE,
        'Elasticsearch service unavailable',
        undefined,
        { jobId: 123 },
        'trace-123'
      );

      const result = await errorService.handleError(customError, { test: 'message' }, 0);

      expect(result.success).toBe(true);
      expect(result.action).toBe(ErrorAction.ALERT);
      expect(result.alertSent).toBe(true);
    });
  });

  describe('Error Metrics', () => {
    it('should track error counts correctly', async () => {
      const customError = errorService.createError(
        ErrorType.NETWORK_ERROR,
        'Network error',
        undefined,
        { jobId: 123 },
        'trace-123'
      );

      await errorService.handleError(customError, { test: 'message' }, 0);

      const metrics = errorService.getErrorMetrics();
      expect(metrics.totalErrors).toBe(1);
      expect(metrics.errorsByType[ErrorType.NETWORK_ERROR]).toBe(1);
      expect(metrics.errorsBySeverity[ErrorSeverity.HIGH]).toBe(1);
      expect(metrics.retryableErrors).toBe(1);
    });

    it('should track multiple error types', async () => {
      const error1 = errorService.createError(ErrorType.NETWORK_ERROR, 'Network error');
      const error2 = errorService.createError(ErrorType.VALIDATION_ERROR, 'Validation error');

      await errorService.handleError(error1, { test: 'message' }, 0);
      await errorService.handleError(error2, { test: 'message' }, 0);

      const metrics = errorService.getErrorMetrics();
      expect(metrics.totalErrors).toBe(2);
      expect(metrics.errorsByType[ErrorType.NETWORK_ERROR]).toBe(1);
      expect(metrics.errorsByType[ErrorType.VALIDATION_ERROR]).toBe(1);
      expect(metrics.retryableErrors).toBe(1);
      expect(metrics.nonRetryableErrors).toBe(1);
    });

    it('should reset metrics correctly', async () => {
      const customError = errorService.createError(
        ErrorType.NETWORK_ERROR,
        'Network error',
        undefined,
        { jobId: 123 },
        'trace-123'
      );

      await errorService.handleError(customError, { test: 'message' }, 0);

      let metrics = errorService.getErrorMetrics();
      expect(metrics.totalErrors).toBe(1);

      errorService.resetMetrics();
      metrics = errorService.getErrorMetrics();
      expect(metrics.totalErrors).toBe(0);
    });
  });

  describe('Error Severity Levels', () => {
    it('should assign correct severity levels', () => {
      const criticalError = errorService.createError(ErrorType.ELASTICSEARCH_UNAVAILABLE, 'ES down');
      const highError = errorService.createError(ErrorType.NETWORK_ERROR, 'Network issue');
      const mediumError = errorService.createError(ErrorType.INVALID_MESSAGE_FORMAT, 'Invalid message format');
      const lowError = errorService.createError(ErrorType.LISTING_ALREADY_EXISTS, 'Duplicate listing');

      expect(criticalError.severity).toBe(ErrorSeverity.CRITICAL);
      expect(highError.severity).toBe(ErrorSeverity.HIGH);
      expect(mediumError.severity).toBe(ErrorSeverity.MEDIUM);
      expect(lowError.severity).toBe(ErrorSeverity.LOW);
    });
  });

  describe('Error Actions', () => {
    it('should assign correct actions based on error type', () => {
      const retryError = errorService.createError(ErrorType.CONNECTION_TIMEOUT, 'Timeout');
      const skipError = errorService.createError(ErrorType.VALIDATION_ERROR, 'Validation');
      const alertError = errorService.createError(ErrorType.ELASTICSEARCH_UNAVAILABLE, 'ES down');
      const dlqError = errorService.createError(ErrorType.MAX_RETRIES_EXCEEDED, 'Max retries');

      expect(retryError.action).toBe(ErrorAction.RETRY);
      expect(skipError.action).toBe(ErrorAction.SKIP);
      expect(alertError.action).toBe(ErrorAction.ALERT);
      expect(dlqError.action).toBe(ErrorAction.DLQ);
    });
  });

  describe('Error Context Preservation', () => {
    it('should preserve original error stack trace', () => {
      const originalError = new Error('Original error');
      originalError.stack = 'Error: Original error\n    at test.js:1:1';
      
      const customError = errorService.createError(
        ErrorType.NETWORK_ERROR,
        'Network error',
        originalError
      );

      expect(customError.stack).toBe(originalError.stack);
    });

    it('should include context information', () => {
      const context = { jobId: 123, operation: 'UPDATE', recordId: 'abc-123' };
      const customError = errorService.createError(
        ErrorType.NETWORK_ERROR,
        'Network error',
        undefined,
        context,
        'trace-123'
      );

      expect(customError.context).toEqual(context);
      expect(customError.traceId).toBe('trace-123');
    });
  });
});
