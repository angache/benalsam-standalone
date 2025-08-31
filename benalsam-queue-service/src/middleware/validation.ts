import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { ApiResponse } from '../types/queue';
import logger from '../utils/logger';

export const validateRequest = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => error.msg);
    
    logger.warn('⚠️ Validation failed', {
      url: req.url,
      method: req.method,
      errors: errorMessages,
      userId: req.ip,
    });

    res.status(400).json({
      success: false,
      error: 'Validation failed',
      message: errorMessages.join(', '),
      timestamp: new Date().toISOString(),
    } as ApiResponse);
    return;
  }

  next();
};
