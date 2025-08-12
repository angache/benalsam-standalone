import { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import logger from '../config/logger';

// User input validation
export const validateUserInput = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Geçerli bir email adresi giriniz'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Şifre en az 8 karakter olmalıdır')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Şifre en az bir büyük harf, bir küçük harf ve bir rakam içermelidir'),
  body('firstName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Ad 2-50 karakter arasında olmalıdır'),
  body('lastName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Soyad 2-50 karakter arasında olmalıdır'),
  (req: Request, res: Response, next: NextFunction): void => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.warn('Validation failed', {
        endpoint: req.path,
        errors: errors.array(),
        ip: req.ip
      });
      res.status(400).json({ 
        success: false,
        message: 'Validation failed',
        errors: errors.array() 
      });
      return;
    }
    next();
  }
];

// Login validation
export const validateLoginInput = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Geçerli bir email adresi giriniz'),
  body('password')
    .notEmpty()
    .withMessage('Şifre gereklidir'),
  (req: Request, res: Response, next: NextFunction): void => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.warn('Login validation failed', {
        endpoint: req.path,
        errors: errors.array(),
        ip: req.ip
      });
      res.status(400).json({ 
        success: false,
        message: 'Login validation failed',
        errors: errors.array() 
      });
      return;
    }
    next();
  }
];

// Listing validation
export const validateListingInput = [
  body('title')
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Başlık 5-200 karakter arasında olmalıdır'),
  body('description')
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage('Açıklama 10-2000 karakter arasında olmalıdır'),
  body('price')
    .isFloat({ min: 0 })
    .withMessage('Geçerli bir fiyat giriniz'),
  body('categoryId')
    .isUUID()
    .withMessage('Geçerli bir kategori seçiniz'),
  (req: Request, res: Response, next: NextFunction): void => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.warn('Listing validation failed', {
        endpoint: req.path,
        errors: errors.array(),
        ip: req.ip
      });
      res.status(400).json({ 
        success: false,
        message: 'Listing validation failed',
        errors: errors.array() 
      });
      return;
    }
    next();
  }
];

// Search validation
export const validateSearchInput = [
  body('query')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Arama terimi 2-100 karakter arasında olmalıdır'),
  body('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit 1-100 arasında olmalıdır'),
  (req: Request, res: Response, next: NextFunction): void => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.warn('Search validation failed', {
        endpoint: req.path,
        errors: errors.array(),
        ip: req.ip
      });
      res.status(400).json({ 
        success: false,
        message: 'Search validation failed',
        errors: errors.array() 
      });
      return;
    }
    next();
  }
];

// Generic validation handler
export const handleValidationErrors = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    logger.warn('Validation failed', {
      endpoint: req.path,
      method: req.method,
      errors: errors.array(),
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
    return;
  }
  next();
};

// XSS Protection
export const sanitizeInput = (req: Request, res: Response, next: NextFunction) => {
  // Basic XSS protection
  const sanitize = (obj: any): any => {
    if (typeof obj === 'string') {
      return obj
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=/gi, '');
    }
    if (typeof obj === 'object' && obj !== null) {
      const sanitized: any = Array.isArray(obj) ? [] : {};
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          sanitized[key] = sanitize(obj[key]);
        }
      }
      return sanitized;
    }
    return obj;
  };

  if (req.body) {
    req.body = sanitize(req.body);
  }
  if (req.query) {
    req.query = sanitize(req.query);
  }
  if (req.params) {
    req.params = sanitize(req.params);
  }

  next();
};
