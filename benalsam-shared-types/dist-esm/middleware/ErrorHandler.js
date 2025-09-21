import { ServiceError, ErrorCode } from '../errors/ServiceError';
/**
 * Standardized Error Handler Middleware
 * Tüm microservices'lerde kullanılacak
 */
export class ErrorHandler {
    /**
     * Express error handling middleware
     */
    static handle(error, req, res, next) {
        // Log the error
        console.error('Error occurred:', {
            error: error.message,
            stack: error.stack,
            url: req.url,
            method: req.method,
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            timestamp: new Date().toISOString()
        });
        // Handle ServiceError instances
        if (error instanceof ServiceError) {
            const isDevelopment = process.env['NODE_ENV'] === 'development';
            res.status(error.statusCode).json({
                success: false,
                error: error.message,
                code: error.code,
                service: error.context.service,
                timestamp: error.context.timestamp,
                ...(isDevelopment && {
                    stack: error.stack,
                    context: error.context
                })
            });
            return;
        }
        // Handle validation errors (express-validator)
        if (error.name === 'ValidationError') {
            res.status(400).json({
                success: false,
                error: 'Validation failed',
                code: ErrorCode.VALIDATION_ERROR,
                details: error.message,
                timestamp: new Date().toISOString()
            });
            return;
        }
        // Handle JWT errors
        if (error.name === 'JsonWebTokenError') {
            res.status(401).json({
                success: false,
                error: 'Invalid token',
                code: ErrorCode.UNAUTHORIZED,
                timestamp: new Date().toISOString()
            });
            return;
        }
        // Handle JWT expiration
        if (error.name === 'TokenExpiredError') {
            res.status(401).json({
                success: false,
                error: 'Token expired',
                code: ErrorCode.UNAUTHORIZED,
                timestamp: new Date().toISOString()
            });
            return;
        }
        // Handle rate limiting errors
        if (error.message.includes('Too many requests')) {
            res.status(429).json({
                success: false,
                error: 'Rate limit exceeded',
                code: ErrorCode.RATE_LIMIT_EXCEEDED,
                timestamp: new Date().toISOString()
            });
            return;
        }
        // Handle generic errors
        const isDevelopment = process.env['NODE_ENV'] === 'development';
        res.status(500).json({
            success: false,
            error: isDevelopment ? error.message : 'Internal server error',
            code: ErrorCode.INTERNAL_ERROR,
            timestamp: new Date().toISOString(),
            ...(isDevelopment && {
                stack: error.stack
            })
        });
    }
    /**
     * Async error wrapper for route handlers
     */
    static asyncHandler(fn) {
        return (req, res, next) => {
            Promise.resolve(fn(req, res, next)).catch(next);
        };
    }
    /**
     * 404 handler
     */
    static notFound(req, res) {
        res.status(404).json({
            success: false,
            error: 'Route not found',
            code: ErrorCode.NOT_FOUND,
            message: `Route ${req.method} ${req.originalUrl} not found`,
            timestamp: new Date().toISOString()
        });
    }
    /**
     * Health check error handler
     */
    static healthCheckError(service, error, res) {
        console.error(`Health check failed for ${service}:`, error);
        res.status(503).json({
            success: false,
            error: 'Service unhealthy',
            code: ErrorCode.INTERNAL_ERROR,
            service,
            timestamp: new Date().toISOString()
        });
    }
}
/**
 * Request validation helper
 */
export class RequestValidator {
    /**
     * Validate required fields
     */
    static validateRequired(data, requiredFields, context = 'request') {
        const missingFields = requiredFields.filter(field => data[field] === undefined || data[field] === null || data[field] === '');
        if (missingFields.length > 0) {
            throw new ServiceError(`Missing required fields: ${missingFields.join(', ')}`, ErrorCode.VALIDATION_ERROR, 400, { operation: context });
        }
    }
    /**
     * Validate field types
     */
    static validateTypes(data, typeMap, context = 'request') {
        for (const [field, expectedType] of Object.entries(typeMap)) {
            if (data[field] !== undefined) {
                const actualType = typeof data[field];
                if (actualType !== expectedType) {
                    throw new ServiceError(`Field '${field}' must be of type ${expectedType}, got ${actualType}`, ErrorCode.VALIDATION_ERROR, 400, { operation: context });
                }
            }
        }
    }
    /**
     * Validate numeric ranges
     */
    static validateRange(value, min, max, fieldName, context = 'request') {
        if (value < min || value > max) {
            throw new ServiceError(`Field '${fieldName}' must be between ${min} and ${max}, got ${value}`, ErrorCode.VALIDATION_ERROR, 400, { operation: context });
        }
    }
}
//# sourceMappingURL=ErrorHandler.js.map