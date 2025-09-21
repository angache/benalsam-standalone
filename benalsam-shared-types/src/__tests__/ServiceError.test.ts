import {
  ServiceError,
  DatabaseError,
  ElasticsearchError,
  RedisError,
  RabbitMQError,
  ValidationError,
  NotFoundError,
  RateLimitError,
  UploadError,
  FileTooLargeError,
  InvalidFileTypeError,
  QuotaExceededError,
  ErrorCode
} from '../errors/ServiceError';

describe('ServiceError', () => {
  describe('Base ServiceError', () => {
    it('should create error with default values', () => {
      const error = new ServiceError('Test error', ErrorCode.INTERNAL_ERROR);
      
      expect(error.message).toBe('Test error');
      expect(error.code).toBe(ErrorCode.INTERNAL_ERROR);
      expect(error.statusCode).toBe(500);
      expect(error.isOperational).toBe(true);
      expect(error.context.service).toBe('unknown');
      expect(error.context.timestamp).toBeDefined();
    });

    it('should create error with custom context', () => {
      const context = {
        service: 'test-service',
        operation: 'test-operation',
        userId: 'user-123'
      };
      
      const error = new ServiceError(
        'Test error',
        ErrorCode.VALIDATION_ERROR,
        400,
        context
      );
      
      expect(error.statusCode).toBe(400);
      expect(error.context.service).toBe('test-service');
      expect(error.context.operation).toBe('test-operation');
      expect(error.context.userId).toBe('user-123');
    });

    it('should convert to JSON', () => {
      const error = new ServiceError('Test error', ErrorCode.INTERNAL_ERROR);
      const json = error.toJSON();
      
      expect(json.name).toBe('ServiceError');
      expect(json.message).toBe('Test error');
      expect(json.code).toBe(ErrorCode.INTERNAL_ERROR);
      expect(json.statusCode).toBe(500);
      expect(json.context).toBeDefined();
      expect(json.stack).toBeDefined();
    });

    it('should convert to safe JSON', () => {
      const error = new ServiceError('Test error', ErrorCode.INTERNAL_ERROR);
      const safeJson = error.toSafeJSON();
      
      expect(safeJson.error).toBe('Test error');
      expect(safeJson.code).toBe(ErrorCode.INTERNAL_ERROR);
      expect(safeJson.statusCode).toBe(500);
      expect(safeJson.service).toBe('unknown');
      expect(safeJson.timestamp).toBeDefined();
      expect(safeJson.stack).toBeUndefined();
    });
  });

  describe('DatabaseError', () => {
    it('should create database error', () => {
      const originalError = new Error('Connection failed');
      const error = new DatabaseError(
        'Database operation failed',
        { service: 'test-service' },
        originalError
      );
      
      expect(error.message).toBe('Database operation failed');
      expect(error.code).toBe(ErrorCode.DATABASE_ERROR);
      expect(error.statusCode).toBe(500);
      expect(error.context.metadata?.originalError).toBe('Connection failed');
    });
  });

  describe('ElasticsearchError', () => {
    it('should create Elasticsearch error', () => {
      const originalError = new Error('Index not found');
      const error = new ElasticsearchError(
        'Search failed',
        { service: 'search-service' },
        originalError
      );
      
      expect(error.message).toBe('Search failed');
      expect(error.code).toBe(ErrorCode.ELASTICSEARCH_ERROR);
      expect(error.statusCode).toBe(500);
      expect(error.context.metadata?.originalError).toBe('Index not found');
    });
  });

  describe('RedisError', () => {
    it('should create Redis error', () => {
      const originalError = new Error('Connection timeout');
      const error = new RedisError(
        'Cache operation failed',
        { service: 'cache-service' },
        originalError
      );
      
      expect(error.message).toBe('Cache operation failed');
      expect(error.code).toBe(ErrorCode.REDIS_ERROR);
      expect(error.statusCode).toBe(500);
      expect(error.context.metadata?.originalError).toBe('Connection timeout');
    });
  });

  describe('RabbitMQError', () => {
    it('should create RabbitMQ error', () => {
      const originalError = new Error('Queue not found');
      const error = new RabbitMQError(
        'Message publish failed',
        { service: 'queue-service' },
        originalError
      );
      
      expect(error.message).toBe('Message publish failed');
      expect(error.code).toBe(ErrorCode.RABBITMQ_ERROR);
      expect(error.statusCode).toBe(500);
      expect(error.context.metadata?.originalError).toBe('Queue not found');
    });
  });

  describe('ValidationError', () => {
    it('should create validation error', () => {
      const validationDetails = {
        email: ['Email is required'],
        password: ['Password must be at least 8 characters']
      };
      
      const error = new ValidationError(
        'Validation failed',
        { service: 'auth-service' },
        validationDetails
      );
      
      expect(error.message).toBe('Validation failed');
      expect(error.code).toBe(ErrorCode.VALIDATION_ERROR);
      expect(error.statusCode).toBe(400);
      expect(error.context.metadata?.validationDetails).toEqual(validationDetails);
    });
  });

  describe('NotFoundError', () => {
    it('should create not found error', () => {
      const error = new NotFoundError(
        'User',
        { service: 'user-service', operation: 'getUser' }
      );
      
      expect(error.message).toBe('User not found');
      expect(error.code).toBe(ErrorCode.NOT_FOUND);
      expect(error.statusCode).toBe(404);
      expect(error.context.operation).toBe('getUser');
    });
  });

  describe('RateLimitError', () => {
    it('should create rate limit error with default message', () => {
      const error = new RateLimitError();
      
      expect(error.message).toBe('Rate limit exceeded');
      expect(error.code).toBe(ErrorCode.RATE_LIMIT_EXCEEDED);
      expect(error.statusCode).toBe(429);
    });

    it('should create rate limit error with custom message', () => {
      const error = new RateLimitError(
        'Too many requests from this IP',
        { service: 'api-gateway' }
      );
      
      expect(error.message).toBe('Too many requests from this IP');
      expect(error.code).toBe(ErrorCode.RATE_LIMIT_EXCEEDED);
      expect(error.statusCode).toBe(429);
    });
  });

  describe('UploadError', () => {
    it('should create upload error', () => {
      const originalError = new Error('File corrupted');
      const error = new UploadError(
        'Upload failed',
        { service: 'upload-service' },
        originalError
      );
      
      expect(error.message).toBe('Upload failed');
      expect(error.code).toBe(ErrorCode.UPLOAD_FAILED);
      expect(error.statusCode).toBe(400);
      expect(error.context.metadata?.originalError).toBe('File corrupted');
    });
  });

  describe('FileTooLargeError', () => {
    it('should create file too large error', () => {
      const error = new FileTooLargeError(
        10485760, // 10MB
        20971520, // 20MB
        { service: 'upload-service' }
      );
      
      expect(error.message).toBe('File size 20971520 bytes exceeds maximum allowed size of 10485760 bytes');
      expect(error.code).toBe(ErrorCode.FILE_TOO_LARGE);
      expect(error.statusCode).toBe(413);
      expect(error.context.metadata?.maxSize).toBe(10485760);
      expect(error.context.metadata?.actualSize).toBe(20971520);
    });
  });

  describe('InvalidFileTypeError', () => {
    it('should create invalid file type error', () => {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
      const actualType = 'application/pdf';
      
      const error = new InvalidFileTypeError(
        allowedTypes,
        actualType,
        { service: 'upload-service' }
      );
      
      expect(error.message).toBe("File type 'application/pdf' is not allowed. Allowed types: image/jpeg, image/png, image/gif");
      expect(error.code).toBe(ErrorCode.INVALID_FILE_TYPE);
      expect(error.statusCode).toBe(400);
      expect(error.context.metadata?.allowedTypes).toEqual(allowedTypes);
      expect(error.context.metadata?.actualType).toBe(actualType);
    });
  });

  describe('QuotaExceededError', () => {
    it('should create quota exceeded error', () => {
      const error = new QuotaExceededError(
        'storage',
        1000000000, // 1GB
        1500000000, // 1.5GB
        { service: 'upload-service', userId: 'user-123' }
      );
      
      expect(error.message).toBe('storage quota exceeded. Limit: 1000000000, Current: 1500000000');
      expect(error.code).toBe(ErrorCode.QUOTA_EXCEEDED);
      expect(error.statusCode).toBe(429);
      expect(error.context.metadata?.quotaType).toBe('storage');
      expect(error.context.metadata?.limit).toBe(1000000000);
      expect(error.context.metadata?.current).toBe(1500000000);
      expect(error.context.userId).toBe('user-123');
    });
  });
});
