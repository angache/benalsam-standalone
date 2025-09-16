import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';
import { logger } from '../config/logger';

// General API rate limiter
export const rateLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'), // 100 requests per window
  message: {
    success: false,
    message: 'Too many requests, please try again later',
    retryAfter: Math.ceil(parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000') / 1000)
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    logger.warn('Rate limit exceeded', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      path: req.path
    });
    
    res.status(429).json({
      success: false,
      message: 'Too many requests, please try again later',
      retryAfter: Math.ceil(parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000') / 1000)
    });
  }
});

// Upload-specific rate limiter
export const uploadRateLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: parseInt(process.env.RATE_LIMIT_MAX_UPLOADS_PER_DAY || '50'), // 50 uploads per day
  message: {
    success: false,
    message: 'Daily upload limit exceeded',
    retryAfter: 24 * 60 * 60 // 24 hours in seconds
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    // Use user ID if available, otherwise IP
    const userId = req.headers['x-user-id'] as string;
    return userId || req.ip || 'anonymous';
  },
  handler: (req: Request, res: Response) => {
    const userId = req.headers['x-user-id'] as string;
    logger.warn('Upload rate limit exceeded', {
      userId: userId || 'anonymous',
      ip: req.ip,
      path: req.path
    });
    
    res.status(429).json({
      success: false,
      message: 'Daily upload limit exceeded',
      retryAfter: 24 * 60 * 60
    });
  }
});

// File size limiter
export const fileSizeLimiter = (req: Request, res: Response, next: any): void => {
  const maxFileSize = parseInt(process.env.RATE_LIMIT_MAX_FILE_SIZE || '10485760'); // 10MB
  const maxFiles = parseInt(process.env.RATE_LIMIT_MAX_FILES_PER_REQUEST || '10');
  
  if (req.files && Array.isArray(req.files)) {
    // Check number of files
    if (req.files.length > maxFiles) {
      res.status(400).json({
        success: false,
        message: `Maximum ${maxFiles} files allowed per request`
      });
      return;
    }
    
    // Check file sizes
    for (const file of req.files) {
      if (file.size > maxFileSize) {
        res.status(400).json({
          success: false,
          message: `File ${file.originalname} exceeds maximum size of ${maxFileSize / 1024 / 1024}MB`
        });
        return;
      }
    }
  }
  
  next();
};
