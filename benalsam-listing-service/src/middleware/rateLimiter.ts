/**
 * Rate Limiter Middleware
 * 
 * @fileoverview Rate limiting middleware for Listing Service
 * @author Benalsam Team
 * @version 1.0.0
 */

import rateLimit from 'express-rate-limit';
import { logger } from '../config/logger';

const windowMs = parseInt(process.env['RATE_LIMIT_WINDOW_MS'] || '900000'); // 15 minutes
const maxRequests = parseInt(process.env['RATE_LIMIT_MAX_REQUESTS'] || '100');

export const rateLimiter = rateLimit({
  windowMs,
  max: maxRequests,
  message: {
    success: false,
    message: 'Too many requests, please try again later.',
    retryAfter: Math.ceil(windowMs / 1000)
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn('⚠️ Rate limit exceeded', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      path: req.path,
      method: req.method
    });
    
    res.status(429).json({
      success: false,
      message: 'Too many requests, please try again later.',
      retryAfter: Math.ceil(windowMs / 1000)
    });
  }
});

// Strict rate limiter for sensitive operations
export const strictRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 requests per window
  message: {
    success: false,
    message: 'Too many sensitive operations, please try again later.',
    retryAfter: 900
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn('⚠️ Strict rate limit exceeded', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      path: req.path,
      method: req.method
    });
    
    res.status(429).json({
      success: false,
      message: 'Too many sensitive operations, please try again later.',
      retryAfter: 900
    });
  }
});
