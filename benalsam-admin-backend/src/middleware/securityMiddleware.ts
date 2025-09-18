import { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import logger from '../config/logger';
import { trackValidationFailure } from './securityMonitor';

// SQL Injection Protection
export const sqlInjectionProtection = (req: Request, res: Response, next: NextFunction): void => {
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/gi,
    /(\b(OR|AND)\s+\d+\s*=\s*\d+)/gi,
    /('|(\\')|(;)|(--)|(\*)|(\%)|(\+)|(\=))/gi,
    /(\b(UNION|HAVING|GROUP\s+BY|ORDER\s+BY)\b)/gi
  ];

  const checkForSQLInjection = (obj: any): boolean => {
    if (typeof obj === 'string') {
      return sqlPatterns.some(pattern => pattern.test(obj));
    }
    if (typeof obj === 'object' && obj !== null) {
      return Object.values(obj).some(value => checkForSQLInjection(value));
    }
    return false;
  };

  const hasSQLInjection = 
    checkForSQLInjection(req.body) || 
    checkForSQLInjection(req.query) || 
    checkForSQLInjection(req.params);

  if (hasSQLInjection) {
    logger.warn('🚨 SQL Injection attempt detected', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      path: req.path,
      method: req.method,
      timestamp: new Date().toISOString()
    });

    res.status(400).json({
      success: false,
      message: 'Invalid input detected',
      error: 'INPUT_VALIDATION_FAILED'
    });
    return;
  }

  next();
};

// Enhanced XSS Protection
export const enhancedXSSProtection = (req: Request, res: Response, next: NextFunction): void => {
  const xssPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
    /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi,
    /<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi,
    /<link\b[^<]*(?:(?!<\/link>)<[^<]*)*<\/link>/gi,
    /<meta\b[^<]*(?:(?!<\/meta>)<[^<]*)*<\/meta>/gi,
    /expression\s*\(/gi,
    /url\s*\(/gi,
    /@import/gi
  ];

  const sanitizeXSS = (obj: any): any => {
    if (typeof obj === 'string') {
      let sanitized = obj;
      xssPatterns.forEach(pattern => {
        sanitized = sanitized.replace(pattern, '');
      });
      return sanitized
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;');
    }
    if (typeof obj === 'object' && obj !== null) {
      const sanitized: any = Array.isArray(obj) ? [] : {};
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          sanitized[key] = sanitizeXSS(obj[key]);
        }
      }
      return sanitized;
    }
    return obj;
  };

  req.body = sanitizeXSS(req.body);
  req.query = sanitizeXSS(req.query);
  req.params = sanitizeXSS(req.params);

  next();
};

// Security Headers Middleware
export const securityHeaders = (req: Request, res: Response, next: NextFunction): void => {
  // XSS Protection
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Content Type Options
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Frame Options
  res.setHeader('X-Frame-Options', 'DENY');
  
  // Referrer Policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Content Security Policy
  res.setHeader('Content-Security-Policy', 
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline'; " +
    "style-src 'self' 'unsafe-inline'; " +
    "img-src 'self' data: https:; " +
    "font-src 'self'; " +
    "connect-src 'self'; " +
    "frame-ancestors 'none'"
  );
  
  // Permissions Policy
  res.setHeader('Permissions-Policy', 
    'geolocation=(), microphone=(), camera=(), payment=(), usb=(), magnetometer=(), gyroscope=(), speaker=()'
  );

  next();
};

// Input Length Validation
export const inputLengthValidation = (req: Request, res: Response, next: NextFunction): void => {
  const maxLengths = {
    email: 254,
    password: 128,
    firstName: 50,
    lastName: 50,
    title: 200,
    description: 2000,
    query: 100,
    categoryName: 100,
    userName: 50
  };

  const validateLength = (obj: any, path: string = ''): string[] => {
    const errors: string[] = [];
    
    if (typeof obj === 'string') {
      const fieldName = path.split('.').pop() || '';
      const maxLength = maxLengths[fieldName as keyof typeof maxLengths];
      
      if (maxLength && obj.length > maxLength) {
        errors.push(`${fieldName} cannot exceed ${maxLength} characters`);
      }
    } else if (typeof obj === 'object' && obj !== null) {
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          const newPath = path ? `${path}.${key}` : key;
          errors.push(...validateLength(obj[key], newPath));
        }
      }
    }
    
    return errors;
  };

  const lengthErrors = [
    ...validateLength(req.body, 'body'),
    ...validateLength(req.query, 'query'),
    ...validateLength(req.params, 'params')
  ];

  if (lengthErrors.length > 0) {
    logger.warn('Input length validation failed', {
      endpoint: req.path,
      errors: lengthErrors,
      ip: req.ip
    });

    res.status(400).json({
      success: false,
      message: 'Input validation failed',
      errors: lengthErrors
    });
    return;
  }

  next();
};

// File Upload Validation
export const fileUploadValidation = (req: Request, res: Response, next: NextFunction): void => {
  const allowedMimeTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'text/plain'
  ];

  const maxFileSize = 10 * 1024 * 1024; // 10MB

  if (req.file) {
    // Single file validation
    if (!allowedMimeTypes.includes(req.file.mimetype)) {
      logger.warn('Invalid file type uploaded', {
        mimetype: req.file.mimetype,
        originalname: req.file.originalname,
        ip: req.ip
      });

      res.status(400).json({
        success: false,
        message: 'Invalid file type',
        allowedTypes: allowedMimeTypes
      });
      return;
    }

    if (req.file.size > maxFileSize) {
      logger.warn('File too large uploaded', {
        size: req.file.size,
        maxSize: maxFileSize,
        originalname: req.file.originalname,
        ip: req.ip
      });

      res.status(400).json({
        success: false,
        message: 'File too large',
        maxSize: `${maxFileSize / (1024 * 1024)}MB`
      });
      return;
    }

    // File name validation
    const fileName = req.file.originalname;
    if (fileName.includes('..') || fileName.includes('/') || fileName.includes('\\')) {
      logger.warn('Suspicious file name detected', {
        fileName,
        ip: req.ip
      });

      res.status(400).json({
        success: false,
        message: 'Invalid file name'
      });
      return;
    }
  }

  next();
};
