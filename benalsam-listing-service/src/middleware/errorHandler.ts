/**
 * Error Handler Middleware
 * 
 * @fileoverview Centralized error handling middleware for Listing Service
 * @author Benalsam Team
 * @version 1.0.0
 */

import { Request, Response, NextFunction } from 'express';
import { logger } from '../config/logger';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export class CustomError extends Error implements AppError {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  error: AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const { statusCode = 500, message, isOperational = false } = error;

  // Log error
  logger.error('❌ Error occurred:', {
    error: {
      message,
      statusCode,
      isOperational,
      stack: error.stack
    },
    request: {
      method: req.method,
      url: req.url,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    }
  });

  // Send error response
  res.status(statusCode).json({
    success: false,
    message: isOperational ? message : 'Internal server error',
    ...(process.env['NODE_ENV'] === 'development' && {
      stack: error.stack,
      details: error
    })
  });
};

export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
