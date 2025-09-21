import { Request, Response, NextFunction } from 'express';
/**
 * Standardized Error Handler Middleware
 * Tüm microservices'lerde kullanılacak
 */
export declare class ErrorHandler {
    /**
     * Express error handling middleware
     */
    static handle(error: Error, req: Request, res: Response, next: NextFunction): void;
    /**
     * Async error wrapper for route handlers
     */
    static asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<any>): (req: Request, res: Response, next: NextFunction) => void;
    /**
     * 404 handler
     */
    static notFound(req: Request, res: Response): void;
    /**
     * Health check error handler
     */
    static healthCheckError(service: string, error: Error, res: Response): void;
}
/**
 * Request validation helper
 */
export declare class RequestValidator {
    /**
     * Validate required fields
     */
    static validateRequired(data: Record<string, any>, requiredFields: string[], context?: string): void;
    /**
     * Validate field types
     */
    static validateTypes(data: Record<string, any>, typeMap: Record<string, string>, context?: string): void;
    /**
     * Validate numeric ranges
     */
    static validateRange(value: number, min: number, max: number, fieldName: string, context?: string): void;
}
//# sourceMappingURL=ErrorHandler.d.ts.map