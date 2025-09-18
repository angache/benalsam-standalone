import { body, param, query, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';
import logger from '../config/logger';
import { trackValidationFailure } from './securityMonitor';

// Enhanced Email Validation
export const validateEmail = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .isLength({ max: 254 })
    .withMessage('Geçerli bir email adresi giriniz (max 254 karakter)')
    .custom((value) => {
      // Check for suspicious email patterns
      const suspiciousPatterns = [
        /admin/i,
        /root/i,
        /test/i,
        /noreply/i,
        /no-reply/i
      ];
      
      if (suspiciousPatterns.some(pattern => pattern.test(value))) {
        throw new Error('Email adresi güvenlik nedeniyle kabul edilemez');
      }
      
      return true;
    }),
  handleValidationErrors
];

// Enhanced Password Validation
export const validatePassword = [
  body('password')
    .isLength({ min: 8, max: 128 })
    .withMessage('Şifre 8-128 karakter arasında olmalıdır')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Şifre en az bir büyük harf, bir küçük harf, bir rakam ve bir özel karakter içermelidir')
    .custom((value) => {
      // Check for common passwords
      const commonPasswords = [
        'password', '123456', '123456789', 'qwerty', 'abc123',
        'password123', 'admin', 'letmein', 'welcome', 'monkey'
      ];
      
      if (commonPasswords.includes(value.toLowerCase())) {
        throw new Error('Bu şifre çok yaygın kullanılmaktadır, lütfen daha güvenli bir şifre seçin');
      }
      
      return true;
    }),
  handleValidationErrors
];

// Enhanced User Input Validation
export const validateUserInput = [
  body('firstName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Ad 2-50 karakter arasında olmalıdır')
    .matches(/^[a-zA-ZğüşıöçĞÜŞİÖÇ\s]+$/)
    .withMessage('Ad sadece harf ve boşluk içerebilir'),
  body('lastName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Soyad 2-50 karakter arasında olmalıdır')
    .matches(/^[a-zA-ZğüşıöçĞÜŞİÖÇ\s]+$/)
    .withMessage('Soyad sadece harf ve boşluk içerebilir'),
  body('phone')
    .optional()
    .matches(/^(\+90|0)?[5][0-9]{9}$/)
    .withMessage('Geçerli bir Türkiye telefon numarası giriniz'),
  handleValidationErrors
];

// Enhanced Listing Validation
export const validateListingInput = [
  body('title')
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Başlık 5-200 karakter arasında olmalıdır')
    .custom((value) => {
      // Check for spam patterns
      const spamPatterns = [
        /(free|gratis|ücretsiz)/i,
        /(click here|tıkla)/i,
        /(limited time|sınırlı süre)/i,
        /(act now|hemen harekete geç)/i
      ];
      
      if (spamPatterns.some(pattern => pattern.test(value))) {
        throw new Error('Başlık spam içeriği barındırıyor');
      }
      
      return true;
    }),
  body('description')
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage('Açıklama 10-2000 karakter arasında olmalıdır')
    .custom((value) => {
      // Check for excessive repetition
      const words = value.toLowerCase().split(/\s+/);
      const wordCount: { [key: string]: number } = {};
      
      words.forEach(word => {
        if (word.length > 3) {
          wordCount[word] = (wordCount[word] || 0) + 1;
        }
      });
      
      const maxRepetition = Math.max(...Object.values(wordCount));
      if (maxRepetition > words.length * 0.1) {
        throw new Error('Açıklama çok fazla tekrar içeriyor');
      }
      
      return true;
    }),
  body('price')
    .isFloat({ min: 0, max: 1000000 })
    .withMessage('Geçerli bir fiyat giriniz (0-1,000,000 arası)'),
  body('categoryId')
    .isUUID()
    .withMessage('Geçerli bir kategori seçiniz'),
  body('location')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Konum 100 karakterden fazla olamaz'),
  handleValidationErrors
];

// Enhanced Search Validation
export const validateSearchInput = [
  query('query')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Arama terimi 2-100 karakter arasında olmalıdır')
    .custom((value) => {
      // Check for SQL injection patterns
      const sqlPatterns = [
        /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/gi,
        /(\b(OR|AND)\s+\d+\s*=\s*\d+)/gi,
        /('|(\\')|(;)|(--)|(\*)|(\%)|(\+)|(\=))/gi
      ];
      
      if (sqlPatterns.some(pattern => pattern.test(value))) {
        throw new Error('Arama terimi güvenlik nedeniyle kabul edilemez');
      }
      
      return true;
    }),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit 1-100 arasında olmalıdır'),
  query('offset')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Offset 0 veya daha büyük olmalıdır'),
  handleValidationErrors
];

// UUID Parameter Validation
export const validateUUID = [
  param('id')
    .isUUID()
    .withMessage('Geçerli bir UUID giriniz'),
  handleValidationErrors
];

// Admin Input Validation
export const validateAdminInput = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .isLength({ max: 254 })
    .withMessage('Geçerli bir email adresi giriniz'),
  body('role')
    .isIn(['SUPPORT', 'MODERATOR', 'CONTENT_MANAGER', 'ANALYTICS_MANAGER', 'CATEGORY_MANAGER', 'USER_MANAGER', 'ADMIN', 'SUPER_ADMIN'])
    .withMessage('Geçerli bir rol seçiniz'),
  body('firstName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Ad 2-50 karakter arasında olmalıdır'),
  body('lastName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Soyad 2-50 karakter arasında olmalıdır'),
  handleValidationErrors
];

// Generic validation error handler
export const handleValidationErrors = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    logger.warn('Enhanced validation failed', {
      endpoint: req.path,
      method: req.method,
      errors: errors.array(),
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      timestamp: new Date().toISOString()
    });
    
    // Track validation failure for security monitoring
    trackValidationFailure(req, errors.array());
    
    res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(error => ({
        field: error.type === 'field' ? error.path : 'unknown',
        message: error.msg,
        value: error.type === 'field' ? error.value : undefined
      }))
    });
    return;
  }
  
  next();
};

// Rate limiting validation
export const validateRateLimit = (req: Request, res: Response, next: NextFunction): void => {
  const suspiciousPatterns = [
    /bot/i,
    /crawler/i,
    /spider/i,
    /scraper/i
  ];
  
  const userAgent = req.get('User-Agent') || '';
  
  if (suspiciousPatterns.some(pattern => pattern.test(userAgent))) {
    logger.warn('Suspicious user agent detected', {
      userAgent,
      ip: req.ip,
      path: req.path,
      timestamp: new Date().toISOString()
    });
    
    res.status(429).json({
      success: false,
      message: 'Rate limit exceeded',
      error: 'RATE_LIMIT_EXCEEDED'
    });
    return;
  }
  
  next();
};
