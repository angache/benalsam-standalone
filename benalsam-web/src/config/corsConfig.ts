/**
 * CORS Configuration for Different Environments
 * Handles origin whitelisting based on current environment
 */

export type Environment = 'development' | 'staging' | 'production';

/**
 * Get current environment
 */
export const getCurrentEnvironment = (): Environment => {
  if (typeof window === 'undefined') return 'development';
  
  const hostname = window.location.hostname;
  
  // Production domains
  if (
    hostname === 'benalsam.com' ||
    hostname === 'www.benalsam.com' ||
    hostname === 'admin.benalsam.com'
  ) {
    return 'production';
  }
  
  // Staging/Preview deployments
  if (
    hostname.includes('vercel.app') ||
    hostname.includes('staging') ||
    hostname.includes('preview')
  ) {
    return 'staging';
  }
  
  // Everything else is development
  return 'development';
};

/**
 * Get allowed CORS origins for current environment
 */
export const getAllowedOrigins = (): (string | RegExp)[] => {
  const env = getCurrentEnvironment();
  
  switch (env) {
    case 'development':
      return [
        'http://localhost:5173',      // Local web development
        'http://localhost:3000',      // Alternative local port
        'http://localhost:3003',      // Local admin UI
        'http://127.0.0.1:5173',     // Loopback address
        'http://127.0.0.1:3003',     // Loopback admin
        // Network addresses for team development
        /^http:\/\/192\.168\.\d+\.\d+:5173$/,
        /^http:\/\/192\.168\.\d+\.\d+:3003$/,
        /^http:\/\/10\.\d+\.\d+\.\d+:5173$/,
        /^http:\/\/10\.\d+\.\d+\.\d+:3003$/,
      ];
    
    case 'staging':
      return [
        /\.vercel\.app$/,             // Vercel preview deployments
        'https://staging.benalsam.com',
        'https://admin-staging.benalsam.com',
        'https://preview.benalsam.com',
      ];
    
    case 'production':
      return [
        'https://benalsam.com',
        'https://www.benalsam.com',
        'https://admin.benalsam.com',
      ];
    
    default:
      return ['http://localhost:5173'];
  }
};

/**
 * Check if origin is allowed
 */
export const isOriginAllowed = (origin: string | undefined): boolean => {
  if (!origin) return true; // Allow requests without origin (mobile apps, etc.)
  
  const allowedOrigins = getAllowedOrigins();
  
  return allowedOrigins.some(allowed => {
    if (typeof allowed === 'string') {
      return origin === allowed;
    }
    // Handle regex patterns
    return allowed instanceof RegExp ? allowed.test(origin) : false;
  });
};

/**
 * Get CORS configuration for backend services
 */
export const getCORSConfig = () => ({
  origin: getAllowedOrigins(),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'X-API-Key',
    'x-user-id',
    'Accept',
    'Cache-Control',
    'X-Requested-With'
  ],
  exposedHeaders: [
    'X-Total-Count',
    'X-RateLimit-Limit',
    'X-RateLimit-Remaining',
    'X-RateLimit-Reset'
  ],
  maxAge: 86400, // 24 hours
  preflightContinue: false,
  optionsSuccessStatus: 204
});

/**
 * Get API base URL based on environment
 */
export const getApiBaseUrl = (): string => {
  const env = getCurrentEnvironment();
  
  switch (env) {
    case 'development':
      // Use VPS backend in development
      return import.meta.env.VITE_API_BASE_URL || 'http://209.227.228.96:3002';
    
    case 'staging':
      return import.meta.env.VITE_API_STAGING_URL || 'https://api-staging.benalsam.com';
    
    case 'production':
      return import.meta.env.VITE_API_PROD_URL || 'https://api.benalsam.com';
    
    default:
      return 'http://localhost:3002';
  }
};

/**
 * Get WebSocket URL based on environment
 */
export const getWebSocketUrl = (): string => {
  const baseUrl = getApiBaseUrl();
  const isHttps = baseUrl.startsWith('https');
  
  return baseUrl.replace(/^http/, 'ws');
};

export default {
  getCurrentEnvironment,
  getAllowedOrigins,
  isOriginAllowed,
  getCORSConfig,
  getApiBaseUrl,
  getWebSocketUrl
};