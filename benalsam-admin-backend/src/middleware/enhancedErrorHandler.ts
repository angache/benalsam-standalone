import { Request, Response, NextFunction } from 'express';
import logger from '../config/logger';
import enhancedErrorTrackingService from '../services/enhancedErrorTrackingService';
import apmMiddleware from './apmMiddleware';

interface ErrorResponse {
  success: false;
  message: string;
  error?: string;
  errorId?: string;
  timestamp: string;
  path?: string;
  method?: string;
  statusCode: number;
  details?: any;
}

class EnhancedErrorHandler {
  private isDevelopment: boolean;
  private isProduction: boolean;

  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
    this.isProduction = process.env.NODE_ENV === 'production';
  }

  // Main error handler middleware
  handle = async (error: any, req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Generate error ID
      const errorId = await enhancedErrorTrackingService.trackError(error, {
        requestId: (req as any).apm?.requestId,
        endpoint: req.path,
        method: req.method,
        userId: (req as any).user?.id,
        userAgent: req.get('User-Agent'),
        ip: req.ip,
        timestamp: new Date().toISOString(),
        stackTrace: error.stack,
        requestBody: req.body,
        queryParams: req.query,
        headers: req.headers,
        sessionId: (req as any).sessionID,
        correlationId: req.get('X-Correlation-ID')
      }, req, res);

      // Determine status code
      const statusCode = this.getStatusCode(error);
      
      // Create error response
      const errorResponse: ErrorResponse = {
        success: false,
        message: this.getErrorMessage(error),
        errorId,
        timestamp: new Date().toISOString(),
        path: req.path,
        method: req.method,
        statusCode
      };

      // Add error details in development
      if (this.isDevelopment) {
        errorResponse.error = error.message;
        errorResponse.details = {
          stack: error.stack,
          name: error.name,
          cause: error.cause
        };
      }

      // Add specific error details for certain error types
      if (error.name === 'ValidationError') {
        errorResponse.details = error.details || error.errors;
      }

      if (error.name === 'PrismaClientKnownRequestError') {
        errorResponse.details = {
          code: error.code,
          meta: error.meta
        };
      }

      // Log error
      this.logError(error, req, errorId, statusCode);

      // Send response
      res.status(statusCode).json(errorResponse);

    } catch (trackingError) {
      // Fallback error handling if tracking fails
      logger.error('Error tracking failed:', trackingError);
      
      const fallbackResponse: ErrorResponse = {
        success: false,
        message: 'Internal server error',
        timestamp: new Date().toISOString(),
        path: req.path,
        method: req.method,
        statusCode: 500
      };

      if (this.isDevelopment) {
        fallbackResponse.error = error.message;
        fallbackResponse.details = {
          originalError: error.message,
          trackingError: trackingError.message
        };
      }

      res.status(500).json(fallbackResponse);
    }
  };

  // Handle 404 errors
  handleNotFound = (req: Request, res: Response, next: NextFunction): void => {
    const error = new Error(`Route not found: ${req.method} ${req.path}`);
    (error as any).statusCode = 404;
    (error as any).name = 'NotFoundError';
    
    this.handle(error, req, res, next);
  };

  // Handle async errors
  handleAsync = (fn: Function) => {
    return (req: Request, res: Response, next: NextFunction) => {
      Promise.resolve(fn(req, res, next)).catch(next);
    };
  };

  // Handle unhandled promise rejections
  handleUnhandledRejection = (reason: any, promise: Promise<any>): void => {
    logger.error('Unhandled Promise Rejection:', {
      reason: reason?.message || reason,
      stack: reason?.stack,
      promise: promise.toString(),
      timestamp: new Date().toISOString()
    });

    // Track the error
    enhancedErrorTrackingService.trackError(reason, {
      timestamp: new Date().toISOString(),
      stackTrace: reason?.stack
    }).catch(trackingError => {
      logger.error('Failed to track unhandled rejection:', trackingError);
    });
  };

  // Handle uncaught exceptions
  handleUncaughtException = (error: Error): void => {
    logger.error('Uncaught Exception:', {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });

    // Track the error
    enhancedErrorTrackingService.trackError(error, {
      timestamp: new Date().toISOString(),
      stackTrace: error.stack
    }).catch(trackingError => {
      logger.error('Failed to track uncaught exception:', trackingError);
    });

    // Graceful shutdown
    process.exit(1);
  };

  private getStatusCode(error: any): number {
    // Check if error has statusCode property
    if (error.statusCode || error.status) {
      return error.statusCode || error.status;
    }

    // Check error name
    switch (error.name) {
      case 'ValidationError':
        return 400;
      case 'UnauthorizedError':
      case 'AuthenticationError':
        return 401;
      case 'ForbiddenError':
        return 403;
      case 'NotFoundError':
        return 404;
      case 'ConflictError':
        return 409;
      case 'RateLimitError':
        return 429;
      case 'PrismaClientKnownRequestError':
        return this.getPrismaErrorStatusCode(error);
      case 'PrismaClientUnknownRequestError':
        return 500;
      case 'PrismaClientValidationError':
        return 400;
      case 'PrismaClientInitializationError':
        return 503;
      case 'PrismaClientRustPanicError':
        return 500;
      default:
        return 500;
    }
  }

  private getPrismaErrorStatusCode(error: any): number {
    switch (error.code) {
      case 'P2000':
        return 400; // The provided value is too long
      case 'P2001':
        return 404; // Record not found
      case 'P2002':
        return 409; // Unique constraint failed
      case 'P2003':
        return 400; // Foreign key constraint failed
      case 'P2004':
        return 400; // A constraint failed
      case 'P2005':
        return 400; // The value stored in the database is invalid
      case 'P2006':
        return 400; // The provided value is not valid
      case 'P2007':
        return 400; // Data validation error
      case 'P2008':
        return 400; // Failed to parse the query
      case 'P2009':
        return 400; // Failed to validate the query
      case 'P2010':
        return 500; // Raw query failed
      case 'P2011':
        return 400; // Null constraint violation
      case 'P2012':
        return 400; // Missing a required value
      case 'P2013':
        return 400; // Missing the required argument
      case 'P2014':
        return 400; // The change you are trying to make would violate the required relation
      case 'P2015':
        return 404; // A related record could not be found
      case 'P2016':
        return 400; // Query interpretation error
      case 'P2017':
        return 400; // The records for relation are not connected
      case 'P2018':
        return 400; // The required connected records were not found
      case 'P2019':
        return 400; // Input error
      case 'P2020':
        return 400; // Value out of range
      case 'P2021':
        return 404; // The table does not exist
      case 'P2022':
        return 404; // The column does not exist
      case 'P2025':
        return 404; // An operation failed because it depends on one or more records that were required but not found
      default:
        return 500;
    }
  }

  private getErrorMessage(error: any): string {
    // Check if error has a user-friendly message
    if (error.message && !error.message.includes('Error:')) {
      return error.message;
    }

    // Check error name for user-friendly messages
    switch (error.name) {
      case 'ValidationError':
        return 'Validation failed. Please check your input.';
      case 'UnauthorizedError':
      case 'AuthenticationError':
        return 'Authentication required. Please log in.';
      case 'ForbiddenError':
        return 'Access denied. You do not have permission to perform this action.';
      case 'NotFoundError':
        return 'The requested resource was not found.';
      case 'ConflictError':
        return 'The request conflicts with the current state of the resource.';
      case 'RateLimitError':
        return 'Too many requests. Please try again later.';
      case 'PrismaClientKnownRequestError':
        return this.getPrismaErrorMessage(error);
      case 'PrismaClientUnknownRequestError':
        return 'Database operation failed. Please try again.';
      case 'PrismaClientValidationError':
        return 'Invalid data provided. Please check your input.';
      case 'PrismaClientInitializationError':
        return 'Database connection failed. Please try again later.';
      case 'PrismaClientRustPanicError':
        return 'Database error occurred. Please try again.';
      default:
        return this.isProduction 
          ? 'An unexpected error occurred. Please try again.' 
          : error.message || 'An unexpected error occurred.';
    }
  }

  private getPrismaErrorMessage(error: any): string {
    switch (error.code) {
      case 'P2000':
        return 'The provided value is too long.';
      case 'P2001':
        return 'The requested record was not found.';
      case 'P2002':
        return 'A record with this information already exists.';
      case 'P2003':
        return 'Invalid reference. The related record does not exist.';
      case 'P2004':
        return 'Data validation failed.';
      case 'P2005':
        return 'Invalid data format.';
      case 'P2006':
        return 'The provided value is not valid.';
      case 'P2007':
        return 'Data validation error.';
      case 'P2008':
        return 'Query parsing failed.';
      case 'P2009':
        return 'Query validation failed.';
      case 'P2010':
        return 'Database query failed.';
      case 'P2011':
        return 'Required field cannot be empty.';
      case 'P2012':
        return 'Missing required information.';
      case 'P2013':
        return 'Missing required argument.';
      case 'P2014':
        return 'This action would violate data relationships.';
      case 'P2015':
        return 'Related record not found.';
      case 'P2016':
        return 'Query interpretation error.';
      case 'P2017':
        return 'Records are not properly connected.';
      case 'P2018':
        return 'Required connected records not found.';
      case 'P2019':
        return 'Input error.';
      case 'P2020':
        return 'Value is out of acceptable range.';
      case 'P2021':
        return 'Database table not found.';
      case 'P2022':
        return 'Database column not found.';
      case 'P2025':
        return 'Operation failed due to missing required records.';
      default:
        return 'Database operation failed.';
    }
  }

  private logError(error: any, req: Request, errorId: string, statusCode: number): void {
    const logData = {
      errorId,
      message: error.message,
      name: error.name,
      statusCode,
      endpoint: req.path,
      method: req.method,
      userId: (req as any).user?.id,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      timestamp: new Date().toISOString(),
      stack: error.stack
    };

    // Log based on status code
    if (statusCode >= 500) {
      logger.error('Server error occurred:', logData);
    } else if (statusCode >= 400) {
      logger.warn('Client error occurred:', logData);
    } else {
      logger.info('Error occurred:', logData);
    }
  }
}

// Create singleton instance
const enhancedErrorHandler = new EnhancedErrorHandler();

export default enhancedErrorHandler;
export { EnhancedErrorHandler, ErrorResponse };
