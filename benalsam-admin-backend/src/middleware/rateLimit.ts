import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { securityConfig } from '../config/app';
import logger from '../config/logger';

// Create rate limiter
export const createRateLimiter = (options?: {
  windowMs?: number;
  max?: number;
  message?: string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}) => {
  const {
    windowMs = securityConfig.rateLimitWindowMs,
    max = securityConfig.rateLimitMaxRequests,
    message = 'Too many requests from this IP, please try again later.',
    skipSuccessfulRequests = false,
    skipFailedRequests = false
  } = options || {};

  return rateLimit({
    windowMs,
    max,
    message: {
      error: 'Rate limit exceeded',
      message,
      retryAfter: Math.ceil(windowMs / 1000)
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests,
    skipFailedRequests,
    handler: (req: Request, res: Response) => {
      logger.warn('Rate limit exceeded', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        path: req.path,
        method: req.method
      });

      res.status(429).json({
        error: 'Rate limit exceeded',
        message,
        retryAfter: Math.ceil(windowMs / 1000)
      });
    }
  });
};

// Global rate limiter
export const globalRateLimiter = createRateLimiter();

// Auth rate limiter (more strict)
export const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per 15 minutes
  message: 'Too many authentication attempts, please try again later.',
  skipSuccessfulRequests: true
});

// API rate limiter (less strict)
export const apiRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per 15 minutes
  message: 'Too many API requests, please try again later.'
});

// Upload rate limiter
export const uploadRateLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 uploads per hour
  message: 'Too many file uploads, please try again later.'
});

// Search rate limiter
export const searchRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 searches per minute
  message: 'Too many search requests, please try again later.'
});

// Admin rate limiter (very strict)
export const adminRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // 3 attempts per 15 minutes
  message: 'Too many admin login attempts, please try again later.',
  skipSuccessfulRequests: true
});

// Rate limit middleware for specific routes
export const rateLimitMiddleware = {
  global: globalRateLimiter,
  auth: authRateLimiter,
  api: apiRateLimiter,
  upload: uploadRateLimiter,
  search: searchRateLimiter,
  admin: adminRateLimiter
};

// Custom rate limit middleware for specific IPs
export const customRateLimit = (req: Request, res: Response, next: NextFunction) => {
  const clientIP = req.ip || 'unknown';
  
  // Block known malicious IPs
  const blockedIPs = process.env.BLOCKED_IPS?.split(',') || [];
  if (blockedIPs.includes(clientIP)) {
    logger.warn('Blocked IP attempted access', { ip: clientIP });
    return res.status(403).json({
      error: 'Access denied',
      message: 'Your IP address is blocked.'
    });
  }

  // Allow whitelisted IPs to bypass rate limiting
  const whitelistedIPs = process.env.WHITELISTED_IPS?.split(',') || [];
  if (whitelistedIPs.includes(clientIP)) {
    return next();
  }

  // Apply default rate limiting
  return globalRateLimiter(req, res, next);
};

export default rateLimitMiddleware;
