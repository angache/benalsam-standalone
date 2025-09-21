import { Request, Response, NextFunction } from 'express';
import { ErrorHandler, RequestValidator } from '../middleware/ErrorHandler';
import { ServiceError, ErrorCode, ValidationError } from '../errors/ServiceError';

// Mock Express objects
const mockRequest = {
  method: 'GET',
  url: '/api/test',
  ip: '127.0.0.1',
  get: jest.fn().mockReturnValue('test-user-agent')
} as unknown as Request;

const mockResponse = {
  status: jest.fn().mockReturnThis(),
  json: jest.fn().mockReturnThis()
} as unknown as Response;

const mockNext = jest.fn() as NextFunction;

describe('ErrorHandler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock console.error to avoid noise in tests
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('handle', () => {
    it('should handle ServiceError correctly', () => {
      const error = new ServiceError(
        'Test error',
        ErrorCode.VALIDATION_ERROR,
        400,
        { service: 'test-service' }
      );

      ErrorHandler.handle(error, mockRequest, mockResponse, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Test error',
        code: ErrorCode.VALIDATION_ERROR,
        service: 'test-service',
        timestamp: expect.any(String)
      });
    });

    it('should include stack trace in development mode', () => {
      const originalEnv = process.env['NODE_ENV'];
      process.env['NODE_ENV'] = 'development';

      const error = new ServiceError(
        'Test error',
        ErrorCode.INTERNAL_ERROR,
        500,
        { service: 'test-service' }
      );

      ErrorHandler.handle(error, mockRequest, mockResponse, mockNext);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          stack: expect.any(String),
          context: expect.any(Object)
        })
      );

      process.env['NODE_ENV'] = originalEnv;
    });

    it('should handle ValidationError', () => {
      const error = new Error('Validation failed');
      error.name = 'ValidationError';

      ErrorHandler.handle(error, mockRequest, mockResponse, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Validation failed',
        code: ErrorCode.VALIDATION_ERROR,
        details: 'Validation failed',
        timestamp: expect.any(String)
      });
    });

    it('should handle JWT errors', () => {
      const error = new Error('Invalid token');
      error.name = 'JsonWebTokenError';

      ErrorHandler.handle(error, mockRequest, mockResponse, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid token',
        code: ErrorCode.UNAUTHORIZED,
        timestamp: expect.any(String)
      });
    });

    it('should handle rate limiting errors', () => {
      const error = new Error('Too many requests from this IP');

      ErrorHandler.handle(error, mockRequest, mockResponse, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(429);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Rate limit exceeded',
        code: ErrorCode.RATE_LIMIT_EXCEEDED,
        timestamp: expect.any(String)
      });
    });

    it('should handle generic errors', () => {
      const error = new Error('Generic error');

      ErrorHandler.handle(error, mockRequest, mockResponse, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Internal server error',
        code: ErrorCode.INTERNAL_ERROR,
        timestamp: expect.any(String)
      });
    });
  });

  describe('asyncHandler', () => {
    it('should handle async function errors', async () => {
      const asyncFn = jest.fn().mockRejectedValue(new Error('Async error'));
      const wrappedFn = ErrorHandler.asyncHandler(asyncFn);

      await wrappedFn(mockRequest, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should pass through successful async functions', async () => {
      const asyncFn = jest.fn().mockResolvedValue('success');
      const wrappedFn = ErrorHandler.asyncHandler(asyncFn);

      await wrappedFn(mockRequest, mockResponse, mockNext);

      expect(asyncFn).toHaveBeenCalledWith(mockRequest, mockResponse, mockNext);
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('notFound', () => {
    it('should return 404 response', () => {
      const req = { method: 'GET', originalUrl: '/api/test' } as Request;

      ErrorHandler.notFound(req, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Route not found',
        code: ErrorCode.NOT_FOUND,
        message: 'Route GET /api/test not found',
        timestamp: expect.any(String)
      });
    });
  });

  describe('healthCheckError', () => {
    it('should return 503 response for health check errors', () => {
      const error = new Error('Service unavailable');

      ErrorHandler.healthCheckError('test-service', error, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(503);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Service unhealthy',
        code: ErrorCode.INTERNAL_ERROR,
        service: 'test-service',
        timestamp: expect.any(String)
      });
    });
  });
});

describe('RequestValidator', () => {
  describe('validateRequired', () => {
    it('should pass validation for all required fields', () => {
      const data = { name: 'John', email: 'john@example.com' };
      const requiredFields = ['name', 'email'];

      expect(() => {
        RequestValidator.validateRequired(data, requiredFields);
      }).not.toThrow();
    });

    it('should throw error for missing required fields', () => {
      const data = { name: 'John' };
      const requiredFields = ['name', 'email', 'password'];

      expect(() => {
        RequestValidator.validateRequired(data, requiredFields);
      }).toThrow(ServiceError);
    });

    it('should throw error for null/undefined/empty values', () => {
      const data = { name: '', email: null, password: undefined };
      const requiredFields = ['name', 'email', 'password'];

      expect(() => {
        RequestValidator.validateRequired(data, requiredFields);
      }).toThrow(ServiceError);
    });
  });

  describe('validateTypes', () => {
    it('should pass validation for correct types', () => {
      const data = { name: 'John', age: 25, active: true };
      const typeMap = { name: 'string', age: 'number', active: 'boolean' };

      expect(() => {
        RequestValidator.validateTypes(data, typeMap);
      }).not.toThrow();
    });

    it('should throw error for incorrect types', () => {
      const data = { name: 123, age: '25' };
      const typeMap = { name: 'string', age: 'number' };

      expect(() => {
        RequestValidator.validateTypes(data, typeMap);
      }).toThrow(ServiceError);
    });

    it('should skip validation for undefined fields', () => {
      const data = { name: 'John' };
      const typeMap = { name: 'string', age: 'number' };

      expect(() => {
        RequestValidator.validateTypes(data, typeMap);
      }).not.toThrow();
    });
  });

  describe('validateRange', () => {
    it('should pass validation for values within range', () => {
      expect(() => {
        RequestValidator.validateRange(5, 1, 10, 'count');
      }).not.toThrow();
    });

    it('should throw error for values below minimum', () => {
      expect(() => {
        RequestValidator.validateRange(0, 1, 10, 'count');
      }).toThrow(ServiceError);
    });

    it('should throw error for values above maximum', () => {
      expect(() => {
        RequestValidator.validateRange(15, 1, 10, 'count');
      }).toThrow(ServiceError);
    });
  });
});
