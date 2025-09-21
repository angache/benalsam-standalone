/**
 * Standardized Error Classes for Microservices
 * Tüm servislerde kullanılacak error handling
 */

export enum ErrorCode {
  // General errors
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  
  // Service-specific errors
  DATABASE_ERROR = 'DATABASE_ERROR',
  ELASTICSEARCH_ERROR = 'ELASTICSEARCH_ERROR',
  REDIS_ERROR = 'REDIS_ERROR',
  RABBITMQ_ERROR = 'RABBITMQ_ERROR',
  CLOUDINARY_ERROR = 'CLOUDINARY_ERROR',
  SUPABASE_ERROR = 'SUPABASE_ERROR',
  
  // Business logic errors
  JOB_NOT_FOUND = 'JOB_NOT_FOUND',
  JOB_ALREADY_PROCESSING = 'JOB_ALREADY_PROCESSING',
  SEARCH_QUERY_INVALID = 'SEARCH_QUERY_INVALID',
  UPLOAD_FAILED = 'UPLOAD_FAILED',
  FILE_TOO_LARGE = 'FILE_TOO_LARGE',
  INVALID_FILE_TYPE = 'INVALID_FILE_TYPE',
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED'
}

export interface ErrorContext {
  service: string;
  operation?: string;
  userId?: string;
  requestId?: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

/**
 * Base Service Error Class
 */
export class ServiceError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly context: ErrorContext;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    code: ErrorCode,
    statusCode: number = 500,
    context: Partial<ErrorContext> = {},
    isOperational: boolean = true
  ) {
    super(message);
    
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.context = {
      service: 'unknown',
      timestamp: new Date().toISOString(),
      ...context
    };

    // Maintains proper stack trace for where our error was thrown
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Convert error to JSON for logging/API responses
   */
  toJSON(): Record<string, any> {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      context: this.context,
      isOperational: this.isOperational,
      stack: this.stack
    };
  }

  /**
   * Convert error to safe format for API responses
   */
  toSafeJSON(): Record<string, any> {
    return {
      error: this.message,
      code: this.code,
      statusCode: this.statusCode,
      service: this.context.service,
      timestamp: this.context.timestamp
    };
  }
}

/**
 * Database-related errors
 */
export class DatabaseError extends ServiceError {
  constructor(
    message: string,
    context: Partial<ErrorContext> = {},
    originalError?: Error
  ) {
    super(
      message,
      ErrorCode.DATABASE_ERROR,
      500,
      {
        ...context,
        metadata: originalError ? { originalError: originalError.message } : undefined
      }
    );
  }
}

/**
 * Elasticsearch-related errors
 */
export class ElasticsearchError extends ServiceError {
  constructor(
    message: string,
    context: Partial<ErrorContext> = {},
    originalError?: Error
  ) {
    super(
      message,
      ErrorCode.ELASTICSEARCH_ERROR,
      500,
      {
        ...context,
        metadata: originalError ? { originalError: originalError.message } : undefined
      }
    );
  }
}

/**
 * Redis-related errors
 */
export class RedisError extends ServiceError {
  constructor(
    message: string,
    context: Partial<ErrorContext> = {},
    originalError?: Error
  ) {
    super(
      message,
      ErrorCode.REDIS_ERROR,
      500,
      {
        ...context,
        metadata: originalError ? { originalError: originalError.message } : undefined
      }
    );
  }
}

/**
 * RabbitMQ-related errors
 */
export class RabbitMQError extends ServiceError {
  constructor(
    message: string,
    context: Partial<ErrorContext> = {},
    originalError?: Error
  ) {
    super(
      message,
      ErrorCode.RABBITMQ_ERROR,
      500,
      {
        ...context,
        metadata: originalError ? { originalError: originalError.message } : undefined
      }
    );
  }
}

/**
 * Validation errors
 */
export class ValidationError extends ServiceError {
  constructor(
    message: string,
    context: Partial<ErrorContext> = {},
    validationDetails?: Record<string, string[]>
  ) {
    super(
      message,
      ErrorCode.VALIDATION_ERROR,
      400,
      {
        ...context,
        metadata: validationDetails ? { validationDetails } : undefined
      }
    );
  }
}

/**
 * Not found errors
 */
export class NotFoundError extends ServiceError {
  constructor(
    resource: string,
    context: Partial<ErrorContext> = {}
  ) {
    super(
      `${resource} not found`,
      ErrorCode.NOT_FOUND,
      404,
      context
    );
  }
}

/**
 * Rate limiting errors
 */
export class RateLimitError extends ServiceError {
  constructor(
    message: string = 'Rate limit exceeded',
    context: Partial<ErrorContext> = {}
  ) {
    super(
      message,
      ErrorCode.RATE_LIMIT_EXCEEDED,
      429,
      context
    );
  }
}

/**
 * Upload-related errors
 */
export class UploadError extends ServiceError {
  constructor(
    message: string,
    context: Partial<ErrorContext> = {},
    originalError?: Error
  ) {
    super(
      message,
      ErrorCode.UPLOAD_FAILED,
      400,
      {
        ...context,
        metadata: originalError ? { originalError: originalError.message } : undefined
      }
    );
  }
}

/**
 * File size errors
 */
export class FileTooLargeError extends ServiceError {
  constructor(
    maxSize: number,
    actualSize: number,
    context: Partial<ErrorContext> = {}
  ) {
    super(
      `File size ${actualSize} bytes exceeds maximum allowed size of ${maxSize} bytes`,
      ErrorCode.FILE_TOO_LARGE,
      413,
      {
        ...context,
        metadata: { maxSize, actualSize }
      }
    );
  }
}

/**
 * Invalid file type errors
 */
export class InvalidFileTypeError extends ServiceError {
  constructor(
    allowedTypes: string[],
    actualType: string,
    context: Partial<ErrorContext> = {}
  ) {
    super(
      `File type '${actualType}' is not allowed. Allowed types: ${allowedTypes.join(', ')}`,
      ErrorCode.INVALID_FILE_TYPE,
      400,
      {
        ...context,
        metadata: { allowedTypes, actualType }
      }
    );
  }
}

/**
 * Quota exceeded errors
 */
export class QuotaExceededError extends ServiceError {
  constructor(
    quotaType: string,
    limit: number,
    current: number,
    context: Partial<ErrorContext> = {}
  ) {
    super(
      `${quotaType} quota exceeded. Limit: ${limit}, Current: ${current}`,
      ErrorCode.QUOTA_EXCEEDED,
      429,
      {
        ...context,
        metadata: { quotaType, limit, current }
      }
    );
  }
}
