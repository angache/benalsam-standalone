/**
 * Standardized Error Classes for Microservices
 * Tüm servislerde kullanılacak error handling
 */
export declare enum ErrorCode {
    INTERNAL_ERROR = "INTERNAL_ERROR",
    VALIDATION_ERROR = "VALIDATION_ERROR",
    NOT_FOUND = "NOT_FOUND",
    UNAUTHORIZED = "UNAUTHORIZED",
    FORBIDDEN = "FORBIDDEN",
    RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED",
    DATABASE_ERROR = "DATABASE_ERROR",
    ELASTICSEARCH_ERROR = "ELASTICSEARCH_ERROR",
    REDIS_ERROR = "REDIS_ERROR",
    RABBITMQ_ERROR = "RABBITMQ_ERROR",
    CLOUDINARY_ERROR = "CLOUDINARY_ERROR",
    SUPABASE_ERROR = "SUPABASE_ERROR",
    JOB_NOT_FOUND = "JOB_NOT_FOUND",
    JOB_ALREADY_PROCESSING = "JOB_ALREADY_PROCESSING",
    SEARCH_QUERY_INVALID = "SEARCH_QUERY_INVALID",
    UPLOAD_FAILED = "UPLOAD_FAILED",
    FILE_TOO_LARGE = "FILE_TOO_LARGE",
    INVALID_FILE_TYPE = "INVALID_FILE_TYPE",
    QUOTA_EXCEEDED = "QUOTA_EXCEEDED"
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
export declare class ServiceError extends Error {
    readonly code: ErrorCode;
    readonly statusCode: number;
    readonly context: ErrorContext;
    readonly isOperational: boolean;
    constructor(message: string, code: ErrorCode, statusCode?: number, context?: Partial<ErrorContext>, isOperational?: boolean);
    /**
     * Convert error to JSON for logging/API responses
     */
    toJSON(): Record<string, any>;
    /**
     * Convert error to safe format for API responses
     */
    toSafeJSON(): Record<string, any>;
}
/**
 * Database-related errors
 */
export declare class DatabaseError extends ServiceError {
    constructor(message: string, context?: Partial<ErrorContext>, originalError?: Error);
}
/**
 * Elasticsearch-related errors
 */
export declare class ElasticsearchError extends ServiceError {
    constructor(message: string, context?: Partial<ErrorContext>, originalError?: Error);
}
/**
 * Redis-related errors
 */
export declare class RedisError extends ServiceError {
    constructor(message: string, context?: Partial<ErrorContext>, originalError?: Error);
}
/**
 * RabbitMQ-related errors
 */
export declare class RabbitMQError extends ServiceError {
    constructor(message: string, context?: Partial<ErrorContext>, originalError?: Error);
}
/**
 * Validation errors
 */
export declare class ValidationError extends ServiceError {
    constructor(message: string, context?: Partial<ErrorContext>, validationDetails?: Record<string, string[]>);
}
/**
 * Not found errors
 */
export declare class NotFoundError extends ServiceError {
    constructor(resource: string, context?: Partial<ErrorContext>);
}
/**
 * Rate limiting errors
 */
export declare class RateLimitError extends ServiceError {
    constructor(message?: string, context?: Partial<ErrorContext>);
}
/**
 * Upload-related errors
 */
export declare class UploadError extends ServiceError {
    constructor(message: string, context?: Partial<ErrorContext>, originalError?: Error);
}
/**
 * File size errors
 */
export declare class FileTooLargeError extends ServiceError {
    constructor(maxSize: number, actualSize: number, context?: Partial<ErrorContext>);
}
/**
 * Invalid file type errors
 */
export declare class InvalidFileTypeError extends ServiceError {
    constructor(allowedTypes: string[], actualType: string, context?: Partial<ErrorContext>);
}
/**
 * Quota exceeded errors
 */
export declare class QuotaExceededError extends ServiceError {
    constructor(quotaType: string, limit: number, current: number, context?: Partial<ErrorContext>);
}
//# sourceMappingURL=ServiceError.d.ts.map