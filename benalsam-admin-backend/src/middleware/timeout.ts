import { Request, Response, NextFunction } from 'express';
import logger from '../config/logger';

export interface TimeoutOptions {
  timeout?: number; // Timeout in milliseconds
  onTimeout?: (req: Request, res: Response) => void;
  message?: string;
}

/**
 * Request timeout middleware
 * 
 * This middleware sets a timeout for requests and returns a 408 status code
 * if the request takes longer than the specified timeout
 */
export function requestTimeout(options: TimeoutOptions = {}) {
  const {
    timeout = 30000, // 30 seconds default
    message = 'Request timeout',
    onTimeout
  } = options;

  return (req: Request, res: Response, next: NextFunction) => {
    // Set timeout
    const timeoutId = setTimeout(() => {
      // If response was already sent, don't do anything
      if (res.headersSent) {
        return;
      }

      logger.warn('Request timeout', {
        url: req.url,
        method: req.method,
        timeout,
        userAgent: req.get('User-Agent'),
        ip: req.ip
      });

      // Call custom timeout handler if provided
      if (onTimeout) {
        onTimeout(req, res);
        return;
      }

      // Send timeout response
      res.status(408).json({
        success: false,
        message,
        error: 'REQUEST_TIMEOUT',
        timeout,
        timestamp: new Date().toISOString()
      });
    }, timeout);

    // Clear timeout when response is sent
    const originalSend = res.send;
    res.send = function(data: any) {
      clearTimeout(timeoutId);
      return originalSend.call(this, data);
    };

    // Clear timeout when response ends
    const originalEnd = res.end;
    res.end = function(chunk?: any, encoding?: any, cb?: any) {
      clearTimeout(timeoutId);
      return originalEnd.call(this, chunk, encoding, cb);
    };

    next();
  };
}

/**
 * Dynamic timeout based on endpoint
 */
export function dynamicTimeout(req: Request): number {
  const path = req.path;
  const method = req.method;

  // Short timeouts for simple operations
  if (path === '/health') return 5000;
  if (path === '/api/v1/performance/cache/performance') return 5000;
  
  // Medium timeouts for standard CRUD operations
  if (method === 'GET' && (path.includes('/listings') || path.includes('/users'))) {
    return 15000;
  }
  
  // Longer timeouts for complex operations
  if (path.includes('/analytics') || path.includes('/search')) {
    return 30000;
  }
  
  // Very long timeouts for heavy operations
  if (path.includes('/export') || path.includes('/bulk')) {
    return 60000;
  }
  
  // Default timeout
  return 20000;
}

/**
 * Adaptive timeout middleware
 */
export function adaptiveTimeout(options: TimeoutOptions = {}) {
  return (req: Request, res: Response, next: NextFunction) => {
    const timeout = dynamicTimeout(req);
    
    logger.debug('Setting adaptive timeout', {
      url: req.url,
      method: req.method,
      timeout
    });

    return requestTimeout({ ...options, timeout })(req, res, next);
  };
}

/**
 * Timeout configuration presets
 */
export const timeoutPresets = {
  // Fast operations (5 seconds)
  fast: {
    timeout: 5000,
    message: 'Request timeout - fast operation'
  },
  
  // Standard operations (15 seconds)
  standard: {
    timeout: 15000,
    message: 'Request timeout - standard operation'
  },
  
  // Complex operations (30 seconds)
  complex: {
    timeout: 30000,
    message: 'Request timeout - complex operation'
  },
  
  // Heavy operations (60 seconds)
  heavy: {
    timeout: 60000,
    message: 'Request timeout - heavy operation'
  },
  
  // Health checks (3 seconds)
  health: {
    timeout: 3000,
    message: 'Health check timeout'
  },
  
  // Performance endpoints (10 seconds)
  performance: {
    timeout: 10000,
    message: 'Performance check timeout'
  }
};
