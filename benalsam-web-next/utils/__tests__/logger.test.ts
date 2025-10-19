import { describe, it, expect, vi, beforeEach } from 'vitest';
import { logDebug, logInfo, logWarn, logError, logCritical, logger } from '../logger';

// Mock console methods
const mockConsole = {
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  log: vi.fn()
};

// Replace console with mock
Object.assign(console, mockConsole);

describe('Logger', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('logDebug', () => {
    it('should log debug message with context', () => {
      const message = 'Debug message';
      const context = { component: 'TestComponent', action: 'test_action' };

      logDebug(message, context);

      expect(console.debug).toHaveBeenCalled();
    });

    it('should log debug message without context', () => {
      const message = 'Debug message';

      logDebug(message);

      expect(console.debug).toHaveBeenCalled();
    });
  });

  describe('logInfo', () => {
    it('should log info message with context', () => {
      const message = 'Info message';
      const context = { component: 'TestComponent', action: 'test_action' };

      logInfo(message, context);

      expect(console.info).toHaveBeenCalled();
    });

    it('should log info message without context', () => {
      const message = 'Info message';

      logInfo(message);

      expect(console.info).toHaveBeenCalled();
    });
  });

  describe('logWarn', () => {
    it('should log warning message with context', () => {
      const message = 'Warning message';
      const context = { component: 'TestComponent', action: 'test_action' };

      logWarn(message, context);

      expect(console.warn).toHaveBeenCalled();
    });

    it('should log warning message without context', () => {
      const message = 'Warning message';

      logWarn(message);

      expect(console.warn).toHaveBeenCalled();
    });
  });

  describe('logError', () => {
    it('should log error message with context', () => {
      const message = 'Error message';
      const context = { component: 'TestComponent', action: 'test_action' };

      logError(message, context);

      expect(console.error).toHaveBeenCalled();
    });

    it('should log error message without context', () => {
      const message = 'Error message';

      logError(message);

      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('logCritical', () => {
    it('should log critical message with context', () => {
      const message = 'Critical message';
      const context = { component: 'TestComponent', action: 'test_action' };

      logCritical(message, context);

      expect(console.error).toHaveBeenCalled();
    });

    it('should log critical message without context', () => {
      const message = 'Critical message';

      logCritical(message);

      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('logger object', () => {
    it('should have all log methods', () => {
      expect(typeof logger.debug).toBe('function');
      expect(typeof logger.info).toBe('function');
      expect(typeof logger.warn).toBe('function');
      expect(typeof logger.error).toBe('function');
      expect(typeof logger.critical).toBe('function');
    });

    it('should call corresponding log functions', () => {
      const message = 'Test message';
      const context = { component: 'TestComponent' };

      logger.debug(message, context);
      expect(console.debug).toHaveBeenCalled();

      logger.info(message, context);
      expect(console.info).toHaveBeenCalled();

      logger.warn(message, context);
      expect(console.warn).toHaveBeenCalled();

      logger.error(message, context);
      expect(console.error).toHaveBeenCalled();

      logger.critical(message, context);
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('Log context validation', () => {
    it('should handle empty context object', () => {
      const message = 'Test message';
      const context = {};

      logInfo(message, context);

      expect(console.info).toHaveBeenCalled();
    });

    it('should handle context with various data types', () => {
      const message = 'Test message';
      const context = {
        string: 'test',
        number: 123,
        boolean: true,
        array: [1, 2, 3],
        object: { nested: 'value' },
        null: null,
        undefined: undefined
      };

      logInfo(message, context);

      expect(console.info).toHaveBeenCalled();
    });
  });
});