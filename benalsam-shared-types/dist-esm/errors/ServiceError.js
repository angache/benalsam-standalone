/**
 * Standardized Error Classes for Microservices
 * Tüm servislerde kullanılacak error handling
 */
export var ErrorCode;
(function (ErrorCode) {
    // General errors
    ErrorCode["INTERNAL_ERROR"] = "INTERNAL_ERROR";
    ErrorCode["VALIDATION_ERROR"] = "VALIDATION_ERROR";
    ErrorCode["NOT_FOUND"] = "NOT_FOUND";
    ErrorCode["UNAUTHORIZED"] = "UNAUTHORIZED";
    ErrorCode["FORBIDDEN"] = "FORBIDDEN";
    ErrorCode["RATE_LIMIT_EXCEEDED"] = "RATE_LIMIT_EXCEEDED";
    // Service-specific errors
    ErrorCode["DATABASE_ERROR"] = "DATABASE_ERROR";
    ErrorCode["ELASTICSEARCH_ERROR"] = "ELASTICSEARCH_ERROR";
    ErrorCode["REDIS_ERROR"] = "REDIS_ERROR";
    ErrorCode["RABBITMQ_ERROR"] = "RABBITMQ_ERROR";
    ErrorCode["CLOUDINARY_ERROR"] = "CLOUDINARY_ERROR";
    ErrorCode["SUPABASE_ERROR"] = "SUPABASE_ERROR";
    // Business logic errors
    ErrorCode["JOB_NOT_FOUND"] = "JOB_NOT_FOUND";
    ErrorCode["JOB_ALREADY_PROCESSING"] = "JOB_ALREADY_PROCESSING";
    ErrorCode["SEARCH_QUERY_INVALID"] = "SEARCH_QUERY_INVALID";
    ErrorCode["UPLOAD_FAILED"] = "UPLOAD_FAILED";
    ErrorCode["FILE_TOO_LARGE"] = "FILE_TOO_LARGE";
    ErrorCode["INVALID_FILE_TYPE"] = "INVALID_FILE_TYPE";
    ErrorCode["QUOTA_EXCEEDED"] = "QUOTA_EXCEEDED";
})(ErrorCode || (ErrorCode = {}));
/**
 * Base Service Error Class
 */
export class ServiceError extends Error {
    constructor(message, code, statusCode = 500, context = {}, isOperational = true) {
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
    toJSON() {
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
    toSafeJSON() {
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
    constructor(message, context = {}, originalError) {
        super(message, ErrorCode.DATABASE_ERROR, 500, {
            ...context,
            metadata: originalError ? { originalError: originalError.message } : undefined
        });
    }
}
/**
 * Elasticsearch-related errors
 */
export class ElasticsearchError extends ServiceError {
    constructor(message, context = {}, originalError) {
        super(message, ErrorCode.ELASTICSEARCH_ERROR, 500, {
            ...context,
            metadata: originalError ? { originalError: originalError.message } : undefined
        });
    }
}
/**
 * Redis-related errors
 */
export class RedisError extends ServiceError {
    constructor(message, context = {}, originalError) {
        super(message, ErrorCode.REDIS_ERROR, 500, {
            ...context,
            metadata: originalError ? { originalError: originalError.message } : undefined
        });
    }
}
/**
 * RabbitMQ-related errors
 */
export class RabbitMQError extends ServiceError {
    constructor(message, context = {}, originalError) {
        super(message, ErrorCode.RABBITMQ_ERROR, 500, {
            ...context,
            metadata: originalError ? { originalError: originalError.message } : undefined
        });
    }
}
/**
 * Validation errors
 */
export class ValidationError extends ServiceError {
    constructor(message, context = {}, validationDetails) {
        super(message, ErrorCode.VALIDATION_ERROR, 400, {
            ...context,
            metadata: validationDetails ? { validationDetails } : undefined
        });
    }
}
/**
 * Not found errors
 */
export class NotFoundError extends ServiceError {
    constructor(resource, context = {}) {
        super(`${resource} not found`, ErrorCode.NOT_FOUND, 404, context);
    }
}
/**
 * Rate limiting errors
 */
export class RateLimitError extends ServiceError {
    constructor(message = 'Rate limit exceeded', context = {}) {
        super(message, ErrorCode.RATE_LIMIT_EXCEEDED, 429, context);
    }
}
/**
 * Upload-related errors
 */
export class UploadError extends ServiceError {
    constructor(message, context = {}, originalError) {
        super(message, ErrorCode.UPLOAD_FAILED, 400, {
            ...context,
            metadata: originalError ? { originalError: originalError.message } : undefined
        });
    }
}
/**
 * File size errors
 */
export class FileTooLargeError extends ServiceError {
    constructor(maxSize, actualSize, context = {}) {
        super(`File size ${actualSize} bytes exceeds maximum allowed size of ${maxSize} bytes`, ErrorCode.FILE_TOO_LARGE, 413, {
            ...context,
            metadata: { maxSize, actualSize }
        });
    }
}
/**
 * Invalid file type errors
 */
export class InvalidFileTypeError extends ServiceError {
    constructor(allowedTypes, actualType, context = {}) {
        super(`File type '${actualType}' is not allowed. Allowed types: ${allowedTypes.join(', ')}`, ErrorCode.INVALID_FILE_TYPE, 400, {
            ...context,
            metadata: { allowedTypes, actualType }
        });
    }
}
/**
 * Quota exceeded errors
 */
export class QuotaExceededError extends ServiceError {
    constructor(quotaType, limit, current, context = {}) {
        super(`${quotaType} quota exceeded. Limit: ${limit}, Current: ${current}`, ErrorCode.QUOTA_EXCEEDED, 429, {
            ...context,
            metadata: { quotaType, limit, current }
        });
    }
}
//# sourceMappingURL=ServiceError.js.map