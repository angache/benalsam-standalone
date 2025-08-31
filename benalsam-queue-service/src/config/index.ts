import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export const config = {
  // Server Configuration
  port: process.env['PORT'] || 3003,
  nodeEnv: process.env['NODE_ENV'] || 'development',
  
  // Redis Configuration
  redis: {
    host: process.env['REDIS_HOST'] || 'localhost',
    port: parseInt(process.env['REDIS_PORT'] || '6379'),
    password: process.env['REDIS_PASSWORD'] || undefined,
    db: parseInt(process.env['REDIS_DB'] || '0'),
  },
  
  // Bull Queue Configuration
  bull: {
    prefix: process.env['BULL_PREFIX'] || 'benalsam',
    concurrency: parseInt(process.env['BULL_CONCURRENCY'] || '5'),
    retryAttempts: parseInt(process.env['BULL_RETRY_ATTEMPTS'] || '3'),
    retryDelay: parseInt(process.env['BULL_RETRY_DELAY'] || '5000'),
  },
  
  // Logging
  logging: {
    level: process.env['LOG_LEVEL'] || 'info',
    file: process.env['LOG_FILE'] || 'logs/queue-service.log',
  },
  
  // Security
  security: {
    corsOrigin: process.env['CORS_ORIGIN'] || 'http://localhost:5173',
    rateLimitWindowMs: parseInt(process.env['RATE_LIMIT_WINDOW_MS'] || '900000'),
    rateLimitMaxRequests: parseInt(process.env['RATE_LIMIT_MAX_REQUESTS'] || '100'),
  },
  
  // External Services
  services: {
    adminBackendUrl: process.env['ADMIN_BACKEND_URL'] || 'http://localhost:3002',
    elasticsearchUrl: process.env['ELASTICSEARCH_URL'] || 'http://localhost:9200',
    supabaseUrl: process.env['SUPABASE_URL'] || '',
    supabaseServiceRoleKey: process.env['SUPABASE_SERVICE_ROLE_KEY'] || '',
  },
  
  // Monitoring
  monitoring: {
    enableMetrics: process.env['ENABLE_METRICS'] === 'true',
    metricsPort: parseInt(process.env['METRICS_PORT'] || '9090'),
  },
} as const;

export default config;
