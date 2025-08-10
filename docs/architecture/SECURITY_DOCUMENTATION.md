# 🔐 Security Documentation - Benalsam

## 📋 Genel Bakış
Bu döküman, Benalsam uygulamasının güvenlik politikalarını, best practice'lerini ve güvenlik önlemlerini detaylandırır.

## 🛡️ Güvenlik Politikası

### Güvenlik Prensipleri
1. **Defense in Depth**: Çok katmanlı güvenlik yaklaşımı
2. **Least Privilege**: Minimum yetki prensibi
3. **Zero Trust**: Hiçbir şeye güvenme, her şeyi doğrula
4. **Security by Design**: Güvenlik odaklı tasarım
5. **Regular Updates**: Düzenli güncellemeler

### Güvenlik Sorumlulukları
- **Development Team**: Kod güvenliği, input validation
- **DevOps Team**: Infrastructure güvenliği, monitoring
- **Security Team**: Penetration testing, security audits
- **All Users**: Password güvenliği, phishing awareness

## 🔐 Authentication & Authorization

### JWT Token Security
```typescript
// JWT Configuration
const jwtConfig = {
  secret: process.env.JWT_SECRET,
  expiresIn: '24h',
  algorithm: 'HS256',
  issuer: 'benalsam.com',
  audience: 'benalsam-users'
};

// Token Generation
const generateToken = (user: User): string => {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      role: user.role,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
    },
    jwtConfig.secret,
    {
      algorithm: jwtConfig.algorithm,
      issuer: jwtConfig.issuer,
      audience: jwtConfig.audience
    }
  );
};
```

### Password Security
```typescript
// Password Hashing
import bcrypt from 'bcrypt';

const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
};

const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  return await bcrypt.compare(password, hash);
};

// Password Validation
const validatePassword = (password: string): boolean => {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  
  return password.length >= minLength && 
         hasUpperCase && 
         hasLowerCase && 
         hasNumbers && 
         hasSpecialChar;
};
```

### Role-Based Access Control (RBAC)
```typescript
// Permission System
enum Permission {
  USER_READ = 'user:read',
  USER_WRITE = 'user:write',
  USER_DELETE = 'user:delete',
  LISTING_READ = 'listing:read',
  LISTING_WRITE = 'listing:write',
  LISTING_DELETE = 'listing:delete',
  ADMIN_ACCESS = 'admin:access',
  SYSTEM_CONFIG = 'system:config'
}

enum Role {
  USER = 'user',
  MODERATOR = 'moderator',
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin'
}

const rolePermissions: Record<Role, Permission[]> = {
  [Role.USER]: [
    Permission.LISTING_READ,
    Permission.LISTING_WRITE
  ],
  [Role.MODERATOR]: [
    Permission.USER_READ,
    Permission.LISTING_READ,
    Permission.LISTING_WRITE,
    Permission.LISTING_DELETE
  ],
  [Role.ADMIN]: [
    Permission.USER_READ,
    Permission.USER_WRITE,
    Permission.LISTING_READ,
    Permission.LISTING_WRITE,
    Permission.LISTING_DELETE,
    Permission.ADMIN_ACCESS
  ],
  [Role.SUPER_ADMIN]: [
    Permission.USER_READ,
    Permission.USER_WRITE,
    Permission.USER_DELETE,
    Permission.LISTING_READ,
    Permission.LISTING_WRITE,
    Permission.LISTING_DELETE,
    Permission.ADMIN_ACCESS,
    Permission.SYSTEM_CONFIG
  ]
};

// Permission Check Middleware
const checkPermission = (requiredPermission: Permission) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const userRole = req.user?.role as Role;
    const userPermissions = rolePermissions[userRole] || [];
    
    if (!userPermissions.includes(requiredPermission)) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'INSUFFICIENT_PERMISSIONS',
          message: 'You do not have permission to perform this action'
        }
      });
    }
    
    next();
  };
};
```

## 🛡️ Input Validation & Sanitization

### Request Validation
```typescript
// Joi Schema Validation
import Joi from 'joi';

const createListingSchema = Joi.object({
  title: Joi.string()
    .min(3)
    .max(255)
    .required()
    .trim()
    .escape(),
  
  description: Joi.string()
    .min(10)
    .max(2000)
    .required()
    .trim()
    .escape(),
  
  price: Joi.number()
    .positive()
    .max(1000000)
    .required(),
  
  categoryId: Joi.string()
    .uuid()
    .required(),
  
  location: Joi.object({
    city: Joi.string().required(),
    district: Joi.string().required(),
    coordinates: Joi.object({
      lat: Joi.number().min(-90).max(90).required(),
      lng: Joi.number().min(-180).max(180).required()
    }).optional()
  }).required(),
  
  images: Joi.array()
    .items(Joi.string().uri())
    .min(1)
    .max(10)
    .required()
});

// Validation Middleware
const validateRequest = (schema: Joi.Schema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input data',
          details: error.details.map(detail => ({
            field: detail.path.join('.'),
            message: detail.message
          }))
        }
      });
    }
    
    req.body = value; // Sanitized data
    next();
  };
};
```

### SQL Injection Prevention
```typescript
// Parameterized Queries
const getUserById = async (userId: string): Promise<User | null> => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId) // Parameterized query
    .single();
  
  if (error) throw error;
  return data;
};

// Input Sanitization
import DOMPurify from 'isomorphic-dompurify';

const sanitizeInput = (input: string): string => {
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: []
  });
};
```

## 🌐 CORS & CSP Configuration

### CORS Policy
```typescript
// CORS Configuration
import cors from 'cors';

const corsOptions = {
  origin: [
    'https://benalsam.com',
    'https://www.benalsam.com',
    'https://admin.benalsam.com',
    process.env.NODE_ENV === 'development' && 'http://localhost:3000',
    process.env.NODE_ENV === 'development' && 'http://localhost:3003'
  ].filter(Boolean),
  
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin'
  ],
  credentials: true,
  maxAge: 86400 // 24 hours
};

app.use(cors(corsOptions));
```

### Content Security Policy
```typescript
// CSP Headers
app.use((req, res, next) => {
  res.setHeader('Content-Security-Policy', [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.google-analytics.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https: blob:",
    "media-src 'self' https:",
    "connect-src 'self' https://api.benalsam.com wss://benalsam.com",
    "frame-src 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests"
  ].join('; '));
  
  next();
});
```

## 🔒 Rate Limiting

### Rate Limiter Configuration
```typescript
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import Redis from 'ioredis';

const redis = new Redis({
  host: process.env.REDIS_HOST,
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD
});

// General API Rate Limiter
const apiLimiter = rateLimit({
  store: new RedisStore({
    client: redis,
    prefix: 'rate_limit:api:'
  }),
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests, please try again later'
    }
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Authentication Rate Limiter
const authLimiter = rateLimit({
  store: new RedisStore({
    client: redis,
    prefix: 'rate_limit:auth:'
  }),
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: {
    success: false,
    error: {
      code: 'AUTH_RATE_LIMIT_EXCEEDED',
      message: 'Too many authentication attempts, please try again later'
    }
  },
  skipSuccessfulRequests: true
});

// Apply rate limiters
app.use('/api/', apiLimiter);
app.use('/api/auth/', authLimiter);
```

## 🔍 Security Headers

### Security Headers Middleware
```typescript
import helmet from 'helmet';

// Security Headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://api.benalsam.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  noSniff: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  frameguard: { action: 'deny' },
  xssFilter: true
}));

// Additional Security Headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  next();
});
```

## 🔐 Data Encryption

### Database Encryption
```sql
-- PostgreSQL Encryption
-- Enable pgcrypto extension
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Encrypt sensitive data
CREATE OR REPLACE FUNCTION encrypt_sensitive_data(data TEXT, key TEXT)
RETURNS BYTEA AS $$
BEGIN
  RETURN pgp_sym_encrypt(data, key);
END;
$$ LANGUAGE plpgsql;

-- Decrypt sensitive data
CREATE OR REPLACE FUNCTION decrypt_sensitive_data(encrypted_data BYTEA, key TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN pgp_sym_decrypt(encrypted_data, key);
END;
$$ LANGUAGE plpgsql;

-- Encrypt phone numbers
ALTER TABLE users ADD COLUMN phone_encrypted BYTEA;
UPDATE users SET phone_encrypted = encrypt_sensitive_data(phone, 'encryption_key');
```

### File Encryption
```typescript
// File Upload Security
import crypto from 'crypto';

const generateSecureFileName = (originalName: string): string => {
  const timestamp = Date.now();
  const randomBytes = crypto.randomBytes(16).toString('hex');
  const extension = originalName.split('.').pop();
  
  return `${timestamp}-${randomBytes}.${extension}`;
};

const validateFileType = (file: Express.Multer.File): boolean => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  const maxSize = 5 * 1024 * 1024; // 5MB
  
  return allowedTypes.includes(file.mimetype) && file.size <= maxSize;
};

// Secure file upload middleware
const secureFileUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 10
  },
  fileFilter: (req, file, cb) => {
    if (validateFileType(file)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type or size'));
    }
  }
});
```

## 🔍 Security Monitoring

### Security Logging
```typescript
// Security Event Logger
interface SecurityEvent {
  type: 'AUTH_FAILURE' | 'RATE_LIMIT' | 'SQL_INJECTION' | 'XSS_ATTEMPT' | 'UNAUTHORIZED_ACCESS';
  userId?: string;
  ipAddress: string;
  userAgent: string;
  details: Record<string, any>;
  timestamp: Date;
}

class SecurityLogger {
  async logEvent(event: SecurityEvent): Promise<void> {
    const logEntry = {
      ...event,
      timestamp: new Date().toISOString(),
      severity: this.getSeverity(event.type)
    };
    
    // Log to database
    await supabase
      .from('security_logs')
      .insert([logEntry]);
    
    // Log to external service (if configured)
    if (process.env.SECURITY_WEBHOOK_URL) {
      await this.sendToWebhook(logEntry);
    }
    
    // Alert for high severity events
    if (logEntry.severity === 'HIGH') {
      await this.sendAlert(logEntry);
    }
  }
  
  private getSeverity(type: SecurityEvent['type']): 'LOW' | 'MEDIUM' | 'HIGH' {
    const severityMap = {
      'AUTH_FAILURE': 'MEDIUM',
      'RATE_LIMIT': 'LOW',
      'SQL_INJECTION': 'HIGH',
      'XSS_ATTEMPT': 'HIGH',
      'UNAUTHORIZED_ACCESS': 'HIGH'
    };
    
    return severityMap[type] || 'LOW';
  }
  
  private async sendAlert(event: any): Promise<void> {
    // Send email/SMS alert to security team
    console.log('SECURITY ALERT:', event);
  }
}
```

### Intrusion Detection
```typescript
// Security Middleware
const securityMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const securityLogger = new SecurityLogger();
  
  // Check for suspicious patterns
  const suspiciousPatterns = [
    /<script/i,
    /javascript:/i,
    /union\s+select/i,
    /drop\s+table/i,
    /exec\s*\(/i
  ];
  
  const requestBody = JSON.stringify(req.body);
  const requestQuery = JSON.stringify(req.query);
  
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(requestBody) || pattern.test(requestQuery)) {
      securityLogger.logEvent({
        type: 'XSS_ATTEMPT',
        ipAddress: req.ip,
        userAgent: req.get('User-Agent') || '',
        details: {
          pattern: pattern.source,
          body: requestBody,
          query: requestQuery
        },
        timestamp: new Date()
      });
      
      return res.status(400).json({
        success: false,
        error: {
          code: 'SECURITY_VIOLATION',
          message: 'Suspicious request detected'
        }
      });
    }
  }
  
  next();
};
```

## 🔄 Security Updates

### Dependency Security
```json
// package.json security scripts
{
  "scripts": {
    "security:audit": "npm audit",
    "security:fix": "npm audit fix",
    "security:check": "snyk test",
    "security:monitor": "snyk monitor"
  }
}
```

### Automated Security Scanning
```yaml
# GitHub Actions Security Workflow
name: Security Scan
on: [push, pull_request]

jobs:
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Run npm audit
        run: npm audit --audit-level=moderate
        
      - name: Run Snyk security scan
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
        with:
          args: --severity-threshold=high
          
      - name: Run OWASP ZAP scan
        uses: zaproxy/action-full-scan@v0.4.0
        with:
          target: 'https://benalsam.com'
```

## 📋 Security Checklist

### Development Security
- [ ] Input validation implemented
- [ ] SQL injection prevention
- [ ] XSS protection
- [ ] CSRF protection
- [ ] Rate limiting configured
- [ ] Security headers set
- [ ] Error handling without information disclosure
- [ ] Logging and monitoring configured

### Infrastructure Security
- [ ] HTTPS enforced
- [ ] SSL/TLS certificates valid
- [ ] Firewall configured
- [ ] Database access restricted
- [ ] Backup encryption enabled
- [ ] Access logs monitored
- [ ] Security updates automated

### Application Security
- [ ] Authentication system secure
- [ ] Authorization properly implemented
- [ ] Session management secure
- [ ] Password policy enforced
- [ ] Multi-factor authentication available
- [ ] API rate limiting active
- [ ] File upload validation

## 🚨 Incident Response

### Security Incident Response Plan
1. **Detection**: Automated monitoring detects incident
2. **Assessment**: Security team assesses severity
3. **Containment**: Immediate actions to limit damage
4. **Investigation**: Root cause analysis
5. **Remediation**: Fix vulnerabilities
6. **Recovery**: Restore normal operations
7. **Post-Incident**: Lessons learned and improvements

### Contact Information
- **Security Team**: security@benalsam.com
- **Emergency**: +90 XXX XXX XX XX
- **Bug Bounty**: bugs@benalsam.com

---

**Son Güncelleme:** 22 Temmuz 2025  
**Versiyon:** 1.0  
**Security Level:** High  
**Status:** Production Ready ✅ 