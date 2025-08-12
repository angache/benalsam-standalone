// Server configuration
export const serverConfig = {
  port: parseInt(process.env.PORT || '3002'),
  nodeEnv: process.env.NODE_ENV || 'development',
  apiVersion: process.env.API_VERSION || 'v1',
  host: process.env.HOST || 'localhost',
};

// Security configuration
export const securityConfig = {
  corsOrigin: process.env.NODE_ENV === 'production'
    ? [
        'https://benalsam.com',
        'https://admin.benalsam.com',
        'https://www.benalsam.com'
      ]
    : [
        'http://localhost:3003',
        'http://localhost:5173',
        'http://localhost:4173',
        'http://localhost:8081', // Mobile development
        'http://192.168.1.6:3003', // Local network
        'http://192.168.1.6:5173',
        'http://192.168.1.6:8081'
      ],
  rateLimitWindowMs: 15 * 60 * 1000, // 15 minutes
  rateLimitMaxRequests: 100, // limit each IP to 100 requests per windowMs
  jwtSecret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '15m', // Reduced from 24h to 15m
  bcryptRounds: 12,
};

// JWT configuration
export const jwtConfig = {
  secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
  expiresIn: process.env.JWT_EXPIRES_IN || '15m', // Reduced from 24h to 15m
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  refreshSecret: process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key-change-in-production',
};

// Database configuration
export const databaseConfig = {
  url: process.env.DATABASE_URL || 'postgresql://username:password@localhost:5432/benalsam_admin',
  maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS || '10'),
  idleTimeout: parseInt(process.env.DB_IDLE_TIMEOUT || '30000'),
  connectionTimeout: parseInt(process.env.DB_CONNECTION_TIMEOUT || '2000'),
};

// File upload configuration
export const uploadConfig = {
  maxFileSize: 10 * 1024 * 1024, // 10MB
  allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
  uploadPath: process.env.UPLOAD_PATH || './uploads',
};

// Email configuration
export const emailConfig = {
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER || '',
    pass: process.env.EMAIL_PASS || '',
  },
  from: process.env.EMAIL_FROM || 'noreply@benalsam.com',
};

// Redis configuration
export const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD || undefined,
  db: parseInt(process.env.REDIS_DB || '0'),
};

// Logging configuration
export const loggingConfig = {
  level: process.env.LOG_LEVEL || 'info',
  filename: process.env.LOG_FILENAME || 'logs/app.log',
  maxSize: process.env.LOG_MAX_SIZE || '10m',
  maxFiles: process.env.LOG_MAX_FILES || '5',
}; 