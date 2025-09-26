import { Request, Response, NextFunction } from 'express';
import logger from '../config/logger';
import { ServiceError, ErrorCode } from 'benalsam-shared-types';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export class CustomError extends ServiceError {
  constructor(message: string, code: ErrorCode = ErrorCode.INTERNAL_ERROR, statusCode: number = 500, context: any = {}) {
    super(message, code, statusCode, {
      service: 'cache-service',
      ...context
    });
  }
}

export const errorHandler = (
  error: AppError | ServiceError,
  req: Request,
  res: Response,
  _next: NextFunction
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

  // Handle legacy AppError instances
  const statusCode = error.statusCode || 500;
  const message = error.message || 'Internal Server Error';

  logger.error('❌ Legacy Error occurred:', {
    error: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    service: 'cache-service'
  });

  res.status(statusCode).json({
    success: false,
    message,
    code: 'LEGACY_ERROR',
    service: 'cache-service',
    timestamp: new Date().toISOString(),
    ...(process.env['NODE_ENV'] === 'development' && { 
      stack: error.stack,
      details: error
    })
  });
};
