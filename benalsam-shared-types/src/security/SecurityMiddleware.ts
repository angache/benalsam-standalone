/**
 * Security Middleware for Microservices
 * Tüm servisler için standardize edilmiş güvenlik katmanı
 */

import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import cors from 'cors';

/**
 * Security Configuration Interface
 */
export interface SecurityConfig {
  rateLimit: {
    windowMs: number;
    max: number;
    message: string;
    standardHeaders: boolean;
    legacyHeaders: boolean;
  };
  cors: {
    origin: string | string[];
    credentials: boolean;
    methods: string[];
    allowedHeaders: string[];
  };
  helmet: {
    contentSecurityPolicy: boolean;
    crossOriginEmbedderPolicy: boolean;
    hsts: boolean;
  };
}

/**
 * Default Security Configuration
 */
export const DEFAULT_SECURITY_CONFIG: SecurityConfig = {
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false
  },
  cors: {
    origin: process.env['NODE_ENV'] === 'production' 
      ? ['https://admin.benalsam.com', 'https://benalsam.com']
      : ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-API-Key']
  },
  helmet: {
    contentSecurityPolicy: true,
    crossOriginEmbedderPolicy: true,
    hsts: true
  }
};

/**
 * Security Middleware Class
 */
export class SecurityMiddleware {
  private config: SecurityConfig;

  constructor(config: SecurityConfig = DEFAULT_SECURITY_CONFIG) {
    this.config = config;
  }

  /**
   * Rate Limiting Middleware
   */
  getRateLimit() {
    return rateLimit({
      windowMs: this.config.rateLimit.windowMs,
      max: this.config.rateLimit.max,
      message: {
        error: 'Rate limit exceeded',
        message: this.config.rateLimit.message,
        retryAfter: Math.ceil(this.config.rateLimit.windowMs / 1000)
      },
      standardHeaders: this.config.rateLimit.standardHeaders,
      legacyHeaders: this.config.rateLimit.legacyHeaders,
      handler: (req: Request, res: Response) => {
        res.status(429).json({
          error: 'Rate limit exceeded',
          message: this.config.rateLimit.message,
          retryAfter: Math.ceil(this.config.rateLimit.windowMs / 1000),
          timestamp: new Date().toISOString()
        });
      }
    });
  }

  /**
   * CORS Middleware
   */
  getCors() {
    return cors({
      origin: this.config.cors.origin,
      credentials: this.config.cors.credentials,
      methods: this.config.cors.methods,
      allowedHeaders: this.config.cors.allowedHeaders,
      optionsSuccessStatus: 200
    });
  }

  /**
   * Helmet Security Middleware
   */
  getHelmet() {
    return helmet({
      contentSecurityPolicy: this.config.helmet.contentSecurityPolicy ? {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'"],
          fontSrc: ["'self'"],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          frameSrc: ["'none'"]
        }
      } : false,
      crossOriginEmbedderPolicy: this.config.helmet.crossOriginEmbedderPolicy,
      hsts: this.config.helmet.hsts ? {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
      } : false
    });
  }

  /**
   * API Key Validation Middleware
   */
  getApiKeyValidation() {
    return (req: Request, res: Response, next: NextFunction) => {
      const apiKey = req.headers['x-api-key'] as string;
      const validApiKey = process.env['API_KEY'];

      if (!validApiKey) {
        return next(); // Skip validation if no API key is configured
      }

      if (!apiKey) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'API key is required',
          timestamp: new Date().toISOString()
        });
      }

      if (apiKey !== validApiKey) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Invalid API key',
          timestamp: new Date().toISOString()
        });
      }

      next();
    };
  }

  /**
   * Request Size Limiter
   */
  getRequestSizeLimit() {
    return (req: Request, res: Response, next: NextFunction) => {
      const contentLength = parseInt(req.headers['content-length'] || '0');
      const maxSize = 10 * 1024 * 1024; // 10MB

      if (contentLength > maxSize) {
        return res.status(413).json({
          error: 'Payload too large',
          message: 'Request size exceeds maximum allowed size',
          maxSize: maxSize,
          timestamp: new Date().toISOString()
        });
      }

      next();
    };
  }

  /**
   * IP Whitelist Middleware
   */
  getIpWhitelist(allowedIPs: string[]) {
    return (req: Request, res: Response, next: NextFunction) => {
      const clientIP = req.ip || req.connection.remoteAddress || '';

      if (allowedIPs.length === 0) {
        return next(); // Skip if no IPs configured
      }

      if (!allowedIPs.includes(clientIP)) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'Access denied from this IP address',
          clientIP: clientIP,
          timestamp: new Date().toISOString()
        });
      }

      next();
    };
  }

  /**
   * Request Logging Middleware
   */
  getRequestLogger() {
    return (req: Request, res: Response, next: NextFunction) => {
      const startTime = Date.now();
      const clientIP = req.ip || req.connection.remoteAddress || '';
      const userAgent = req.get('User-Agent') || '';

      res.on('finish', () => {
        const duration = Date.now() - startTime;
        const logData = {
          method: req.method,
          url: req.url,
          statusCode: res.statusCode,
          duration: `${duration}ms`,
          clientIP,
          userAgent,
          timestamp: new Date().toISOString()
        };

        // Log based on status code
        if (res.statusCode >= 400) {
          console.error('HTTP Request Error:', logData);
        } else {
          console.log('HTTP Request:', logData);
        }
      });

      next();
    };
  }

  /**
   * Security Headers Middleware
   */
  getSecurityHeaders() {
    return (req: Request, res: Response, next: NextFunction) => {
      // Remove X-Powered-By header
      res.removeHeader('X-Powered-By');

      // Add security headers
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('X-Frame-Options', 'DENY');
      res.setHeader('X-XSS-Protection', '1; mode=block');
      res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
      res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');

      next();
    };
  }

  /**
   * Health Check Bypass Middleware
   */
  getHealthCheckBypass() {
    return (req: Request, res: Response, next: NextFunction) => {
      // Bypass rate limiting for health checks
      if (req.path === '/health' || req.path === '/api/v1/health') {
        return next();
      }

      // Apply rate limiting for other routes
      return this.getRateLimit()(req, res, next);
    };
  }

  /**
   * Get all security middleware as array
   */
  getAllMiddleware() {
    return [
      this.getHelmet(),
      this.getCors(),
      this.getSecurityHeaders(),
      this.getRequestLogger(),
      this.getRequestSizeLimit(),
      this.getHealthCheckBypass()
    ];
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<SecurityConfig>) {
    this.config = { ...this.config, ...newConfig };
  }
}

/**
 * Factory function to create security middleware
 */
export function createSecurityMiddleware(config?: Partial<SecurityConfig>) {
  const fullConfig = { ...DEFAULT_SECURITY_CONFIG, ...config };
  return new SecurityMiddleware(fullConfig);
}

/**
 * Environment-specific security configurations
 */
export const SECURITY_CONFIGS = {
  development: {
    rateLimit: {
      windowMs: 15 * 60 * 1000,
      max: 1000, // More lenient in development
      message: 'Too many requests from this IP, please try again later.',
      standardHeaders: true,
      legacyHeaders: false
    },
    cors: {
      origin: true, // Allow all origins in development
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-API-Key']
    }
  },
  production: {
    rateLimit: {
      windowMs: 15 * 60 * 1000,
      max: 100, // Stricter in production
      message: 'Too many requests from this IP, please try again later.',
      standardHeaders: true,
      legacyHeaders: false
    },
    cors: {
      origin: ['https://admin.benalsam.com', 'https://benalsam.com'],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-API-Key']
    }
  }
};
