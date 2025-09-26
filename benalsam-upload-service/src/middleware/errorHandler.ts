import { Request, Response, NextFunction } from 'express';
import { logger } from '../config/logger';
import { ServiceError, ErrorCode } from 'benalsam-shared-types';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export class CustomError extends ServiceError {
  constructor(message: string, code: ErrorCode = ErrorCode.INTERNAL_ERROR, statusCode: number = 500, context: any = {}) {
    super(message, code, statusCode, {
      service: 'upload-service',
      ...context
    });
  }
}

export const errorHandler = (
  error: AppError | ServiceError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Handle ServiceError instances
  if (error instanceof ServiceError) {
    const statusCode = error.statusCode;
    const errorResponse = error.toSafeJSON();
    
    // Log error with enhanced context
    logger.error('❌ Service Error occurred:', {
      error: {
        message: error.message,
        code: error.code,
        statusCode,
        isOperational: error.isOperational,
        context: error.context,
        stack: error.stack
      },
      request: {
        method: req.method,
        url: req.url,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        correlationId: req.get('X-Correlation-ID')
      }
    });

    // Send standardized error response
    res.status(statusCode).json({
      success: false,
      ...errorResponse,
      ...(process.env['NODE_ENV'] === 'development' && {
        stack: error.stack,
        details: error.toJSON()
      })
    });
    return;
  }

  // Handle legacy AppError instances with specific error types
  let { statusCode = 500, message } = error;

  // Log error
  logger.error('❌ Legacy Error occurred:', {
    error: message,
    stack: error.stack,
    statusCode,
    path: req.path,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  // Handle specific error types
  if (error.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation error';
  } else if (error.name === 'MulterError') {
    statusCode = 400;
    if (error.message.includes('File too large')) {
      message = 'File size exceeds limit';
    } else if (error.message.includes('Too many files')) {
      message = 'Too many files uploaded';
    } else {
      message = 'File upload error';
    }
  } else if (error.name === 'UnauthorizedError') {
    statusCode = 401;
    message = 'Unauthorized';
  } else if (error.name === 'ForbiddenError') {
    statusCode = 403;
    message = 'Forbidden';
  } else if (error.name === 'NotFoundError') {
    statusCode = 404;
    message = 'Resource not found';
  }

  // Don't leak error details in production
  if (process.env.NODE_ENV === 'production' && statusCode === 500) {
    message = 'Internal server error';
  }

  res.status(statusCode).json({
    success: false,
    message,
    code: 'LEGACY_ERROR',
    service: 'upload-service',
    timestamp: new Date().toISOString(),
    ...(process.env.NODE_ENV === 'development' && { 
      stack: error.stack,
      details: error
    })
  });
};

export const createError = (message: string, statusCode: number = 500): AppError => {
  const error: AppError = new Error(message);
  error.statusCode = statusCode;
  error.isOperational = true;
  return error;
};

export const asyncHandler = (fn: any) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
