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
export class ValidationMiddleware {
  /**
   * Generic validation middleware
   */
  static validate(schema: ValidationSchema) {
    return (req: Request, res: Response, next: NextFunction) => {
      const errors: ValidationError[] = [];

      // Validate body
      if (schema.body) {
        const { error, value } = schema.body.validate(req.body, { 
          abortEarly: false,
          stripUnknown: true 
        });
        
        if (error) {
          error.details.forEach((detail: any) => {
            errors.push({
              field: detail.path.join('.'),
              message: detail.message,
              value: detail.context?.value
            });
          });
        } else {
          req.body = value; // Use sanitized data
        }
      }

      // Validate query parameters
      if (schema.query) {
        const { error, value } = schema.query.validate(req.query, { 
          abortEarly: false,
          stripUnknown: true 
        });
        
        if (error) {
          error.details.forEach((detail: any) => {
            errors.push({
              field: `query.${detail.path.join('.')}`,
              message: detail.message,
              value: detail.context?.value
            });
          });
        } else {
          req.query = value; // Use sanitized data
        }
      }

      // Validate route parameters
      if (schema.params) {
        const { error, value } = schema.params.validate(req.params, { 
          abortEarly: false,
          stripUnknown: true 
        });
        
        if (error) {
          error.details.forEach((detail: any) => {
            errors.push({
              field: `params.${detail.path.join('.')}`,
              message: detail.message,
              value: detail.context?.value
            });
          });
        } else {
          req.params = value; // Use sanitized data
        }
      }

      // Validate headers
      if (schema.headers) {
        const { error, value } = schema.headers.validate(req.headers, { 
          abortEarly: false,
          stripUnknown: true 
        });
        
        if (error) {
          error.details.forEach((detail: any) => {
            errors.push({
              field: `headers.${detail.path.join('.')}`,
              message: detail.message,
              value: detail.context?.value
            });
          });
        }
      }

      // Return validation errors if any
      if (errors.length > 0) {
        return res.status(400).json({
          error: 'Validation failed',
          message: 'Request validation failed',
          details: errors,
          timestamp: new Date().toISOString()
        });
      }

      next();
    };
  }

  /**
   * File upload validation
   */
  static validateFileUpload(options: {
    maxSize?: number;
    allowedTypes?: string[];
    required?: boolean;
    maxFiles?: number;
  } = {}) {
    const {
      maxSize = 10 * 1024 * 1024, // 10MB
      allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
      required = true,
      maxFiles = 10
    } = options;

    return (req: Request, res: Response, next: NextFunction) => {
      const files = (req as any).files as any[] | undefined;
      const file = (req as any).file as any | undefined;

      // Check if files are required
      if (required && !files && !file) {
        return res.status(400).json({
          error: 'Validation failed',
          message: 'File upload is required',
          timestamp: new Date().toISOString()
        });
      }

      // Handle single file
      if (file) {
        const errors = this.validateSingleFile(file, maxSize, allowedTypes);
        if (errors.length > 0) {
          return res.status(400).json({
            error: 'Validation failed',
            message: 'File validation failed',
            details: errors,
            timestamp: new Date().toISOString()
          });
        }
      }

      // Handle multiple files
      if (files) {
        if (files.length > maxFiles) {
          return res.status(400).json({
            error: 'Validation failed',
            message: `Too many files. Maximum allowed: ${maxFiles}`,
            timestamp: new Date().toISOString()
          });
        }

        const errors: ValidationError[] = [];
        files.forEach((file, index) => {
          const fileErrors = this.validateSingleFile(file, maxSize, allowedTypes);
          fileErrors.forEach(error => {
            errors.push({
              field: `files[${index}].${error.field}`,
              message: error.message,
              value: error.value
            });
          });
        });

        if (errors.length > 0) {
          return res.status(400).json({
            error: 'Validation failed',
            message: 'File validation failed',
            details: errors,
            timestamp: new Date().toISOString()
          });
        }
      }

      next();
    };
  }

  /**
   * Validate single file
   */
  private static validateSingleFile(
    file: any, 
    maxSize: number, 
    allowedTypes: string[]
  ): ValidationError[] {
    const errors: ValidationError[] = [];

    // Check file size
    if (file.size > maxSize) {
      errors.push({
        field: 'size',
        message: `File size exceeds maximum allowed size of ${maxSize} bytes`,
        value: file.size
      });
    }

    // Check file type
    if (!allowedTypes.includes(file.mimetype)) {
      errors.push({
        field: 'mimetype',
        message: `File type not allowed. Allowed types: ${allowedTypes.join(', ')}`,
        value: file.mimetype
      });
    }

    // Check filename
    if (!file.originalname || file.originalname.trim() === '') {
      errors.push({
        field: 'originalname',
        message: 'Filename is required',
        value: file.originalname
      });
    }

    return errors;
  }

  /**
   * Authentication validation
   */
  static validateAuthentication() {
    return (req: Request, res: Response, next: NextFunction) => {
      const authHeader = req.headers.authorization;
      const apiKey = req.headers['x-api-key'] as string;

      if (!authHeader && !apiKey) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Authentication required',
          timestamp: new Date().toISOString()
        });
      }

      // Validate Bearer token format
      if (authHeader && !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Invalid authentication format. Use Bearer token.',
          timestamp: new Date().toISOString()
        });
      }

      next();
    };
  }

  /**
   * User ID validation
   */
  static validateUserId() {
    return (req: Request, res: Response, next: NextFunction) => {
      const userId = req.params.userId || req.body.userId || req.query.userId;

      if (!userId) {
        return res.status(400).json({
          error: 'Validation failed',
          message: 'User ID is required',
          timestamp: new Date().toISOString()
        });
      }

      // Validate UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(userId)) {
        return res.status(400).json({
          error: 'Validation failed',
          message: 'Invalid user ID format',
          timestamp: new Date().toISOString()
        });
      }

      next();
    };
  }

  /**
   * Pagination validation
   */
  static validatePagination() {
    return (req: Request, res: Response, next: NextFunction) => {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      if (page < 1) {
        return res.status(400).json({
          error: 'Validation failed',
          message: 'Page number must be greater than 0',
          timestamp: new Date().toISOString()
        });
      }

      if (limit < 1 || limit > 100) {
        return res.status(400).json({
          error: 'Validation failed',
          message: 'Limit must be between 1 and 100',
          timestamp: new Date().toISOString()
        });
      }

      // Add sanitized values to request
      req.query.page = page.toString();
      req.query.limit = limit.toString();

      next();
    };
  }

  /**
   * Search query validation
   */
  static validateSearchQuery() {
    return (req: Request, res: Response, next: NextFunction) => {
      const query = req.query.q as string || req.body.query as string;

      if (!query || query.trim().length === 0) {
        return res.status(400).json({
          error: 'Validation failed',
          message: 'Search query is required',
          timestamp: new Date().toISOString()
        });
      }

      if (query.length > 100) {
        return res.status(400).json({
          error: 'Validation failed',
          message: 'Search query is too long (maximum 100 characters)',
          timestamp: new Date().toISOString()
        });
      }

      // Sanitize query
      const sanitizedQuery = query.trim().replace(/[<>]/g, '');
      
      if (req.query.q) {
        req.query.q = sanitizedQuery;
      }
      if (req.body.query) {
        req.body.query = sanitizedQuery;
      }

      next();
    };
  }
}

/**
 * Common validation schemas
 */
export const COMMON_SCHEMAS = {
  // User ID parameter
  userIdParam: Joi.object({
    userId: Joi.string().uuid().required()
  }),

  // Pagination query
  paginationQuery: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    sort: Joi.string().valid('asc', 'desc').default('desc'),
    orderBy: Joi.string().optional()
  }),

  // Search query
  searchQuery: Joi.object({
    q: Joi.string().min(1).max(100).required(),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20)
  }),

  // Category creation
  categoryCreate: Joi.object({
    name: Joi.string().min(1).max(100).required(),
    slug: Joi.string().min(1).max(100).required(),
    description: Joi.string().max(500).optional(),
    parent_id: Joi.string().uuid().optional(),
    is_active: Joi.boolean().default(true),
    sort_order: Joi.number().integer().min(0).default(0)
  }),

  // Category update
  categoryUpdate: Joi.object({
    name: Joi.string().min(1).max(100).optional(),
    slug: Joi.string().min(1).max(100).optional(),
    description: Joi.string().max(500).optional(),
    parent_id: Joi.string().uuid().optional(),
    is_active: Joi.boolean().optional(),
    sort_order: Joi.number().integer().min(0).optional()
  }),

  // Job creation
  jobCreate: Joi.object({
    type: Joi.string().valid(
      'IMAGE_UPLOAD_REQUESTED',
      'IMAGE_UPLOAD_PROCESSING',
      'IMAGE_UPLOAD_COMPLETED',
      'IMAGE_UPLOAD_FAILED',
      'IMAGE_RESIZE',
      'THUMBNAIL_GENERATE',
      'METADATA_EXTRACT',
      'VIRUS_SCAN',
      'DATABASE_UPDATE',
      'NOTIFICATION_SEND',
      'CLEANUP_TEMP_FILES'
    ).required(),
    priority: Joi.string().valid('low', 'normal', 'high', 'urgent').default('normal'),
    data: Joi.object().required(),
    maxRetries: Joi.number().integer().min(1).max(10).default(3)
  })
};

/**
 * Factory function to create validation middleware
 */
export function createValidationMiddleware(schema: ValidationSchema) {
  return ValidationMiddleware.validate(schema);
}
