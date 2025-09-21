/**
 * Validation Middleware for Microservices
 * Request validation ve sanitization için standardize edilmiş middleware
 */
import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
/**
 * Validation Error Interface
 */
export interface ValidationError {
    field: string;
    message: string;
    value?: any;
}
/**
 * Validation Result Interface
 */
export interface ValidationResult {
    isValid: boolean;
    errors: ValidationError[];
    sanitizedData?: any;
}
/**
 * Validation Schema Interface
 */
export interface ValidationSchema {
    body?: Joi.ObjectSchema;
    query?: Joi.ObjectSchema;
    params?: Joi.ObjectSchema;
    headers?: Joi.ObjectSchema;
}
/**
 * Validation Middleware Class
 */
export declare class ValidationMiddleware {
    /**
     * Generic validation middleware
     */
    static validate(schema: ValidationSchema): (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
    /**
     * File upload validation
     */
    static validateFileUpload(options?: {
        maxSize?: number;
        allowedTypes?: string[];
        required?: boolean;
        maxFiles?: number;
    }): (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
    /**
     * Validate single file
     */
    private static validateSingleFile;
    /**
     * Authentication validation
     */
    static validateAuthentication(): (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
    /**
     * User ID validation
     */
    static validateUserId(): (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
    /**
     * Pagination validation
     */
    static validatePagination(): (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
    /**
     * Search query validation
     */
    static validateSearchQuery(): (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
}
/**
 * Common validation schemas
 */
export declare const COMMON_SCHEMAS: {
    userIdParam: Joi.ObjectSchema<any>;
    paginationQuery: Joi.ObjectSchema<any>;
    searchQuery: Joi.ObjectSchema<any>;
    categoryCreate: Joi.ObjectSchema<any>;
    categoryUpdate: Joi.ObjectSchema<any>;
    jobCreate: Joi.ObjectSchema<any>;
};
/**
 * Factory function to create validation middleware
 */
export declare function createValidationMiddleware(schema: ValidationSchema): (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
//# sourceMappingURL=ValidationMiddleware.d.ts.map