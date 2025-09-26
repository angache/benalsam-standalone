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
      service: 'search-service',
      ...context
    });
  }
}

export const errorHandler = (
  error: AppError | ServiceError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
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
    error: {
      message: error.message,
      stack: error.stack,
      statusCode: error.statusCode
    },
    request: {
      method: req.method,
      url: req.url,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    }
  });

  res.status(statusCode).json({
    success: false,
    message,
    code: 'LEGACY_ERROR',
    service: 'search-service',
    timestamp: new Date().toISOString(),
    path: req.url,
    ...(process.env.NODE_ENV === 'development' && {
      stack: error.stack,
      details: error
    })
  });
};

export const notFoundHandler = (req: Request, res: Response) => {
  logger.warn('Route not found:', {
    method: req.method,
    url: req.url,
    ip: req.ip
  });

  res.status(404).json({
    success: false,
    message: 'Route not found',
    error: 'NOT_FOUND',
    timestamp: new Date().toISOString(),
    path: req.url
  });
};
