import { config } from 'dotenv';

// Load environment variables FIRST
config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { createClient } from '@supabase/supabase-js';
import Redis from 'ioredis';

// Import routes
import authRoutes from './routes/auth';
import { listingsRouter } from './routes/listings';
import { usersRouter } from './routes/users';
import { categoriesRouter } from './routes/categories';
import healthRoutes from './routes/health';
import monitoringRoutes from './routes/monitoring';
import elasticsearchRoutes from './routes/elasticsearch';
import adminManagementRoutes from './routes/admin-management';
import analyticsRoutes from './routes/analytics';
import performanceRoutes from './routes/performance';
import userJourneyRoutes from './routes/userJourney';
import analyticsAlertsRoutes from './routes/analyticsAlerts';
import alertRoutes from './routes/alerts';
import dataExportRoutes from './routes/dataExport';
import dataExportV2Routes from './routes/dataExportV2';
import loadTestingRoutes from './routes/loadTesting';
import sessionManagementRoutes from './routes/sessionManagement';
import cacheRoutes from './routes/cache';
import searchRoutes from './routes/search';
import apiCacheRoutes from './routes/apiCache';
import testRoutes from './routes/test';
import cacheAnalyticsRoutes from './routes/cacheAnalytics';
import predictiveCacheRoutes from './routes/predictiveCache';
import geographicCacheRoutes from './routes/geographicCache';
import smartInvalidationRoutes from './routes/smartInvalidation';
import cacheCompressionRoutes from './routes/cacheCompression';
import rateLimitRoutes from './routes/rateLimitRoutes';
import twoFactorRoutes from './routes/twoFactor';

// Import services
import { AdminElasticsearchService } from './services/elasticsearchService';
import QueueProcessorService from './services/queueProcessorService';
import sessionCleanupService from './services/sessionCleanupService';

// Import middleware
import { authenticateToken } from './middleware/auth';
import { errorHandler } from './middleware/errorHandler';
import { securityConfig } from './config/app';

// Import logger
import logger from './config/logger';

const app = express();
// 🚀 Hot reload test - bu yorum değişikliği otomatik yansımalı
const PORT = process.env.PORT || 3002;

// Initialize Supabase client
export const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Initialize services
const elasticsearchService = new AdminElasticsearchService();
const queueProcessor = new QueueProcessorService();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// CORS configuration
const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Origin yoksa (postman, curl) veya whitelist'te ise izin ver
    if (!origin || securityConfig.corsOrigin.includes(origin) || origin === undefined) {
      callback(null, true);
    } else {
      console.error('CORS BLOCKED:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Analytics için daha yüksek rate limit
const analyticsLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 300, // limit each IP to 300 requests per minute (5x artırıldı)
  message: 'Too many analytics requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// app.use('/api/', limiter); // Rate limiting geçici olarak devre dışı
// app.use('/api/v1/analytics/', analyticsLimiter); // Analytics rate limiting geçici olarak devre dışı

// Body parsing middleware
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });
  next();
});

// Health check endpoint (no auth required)
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Admin Backend API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    version: 'v1'
  });
});

// API routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/listings', authenticateToken, listingsRouter);
app.use('/api/v1/users', authenticateToken, usersRouter);
app.use('/api/v1/categories', authenticateToken, categoriesRouter);
app.use('/api/v1/health', healthRoutes);
app.use('/api/v1/monitoring', monitoringRoutes);
app.use('/api/v1/elasticsearch', elasticsearchRoutes);
app.use('/api/v1/admin-management', authenticateToken, adminManagementRoutes);
app.use('/api/v1/analytics', analyticsRoutes); // Analytics aktif edildi
app.use('/api/v1/performance', performanceRoutes); // Performance monitoring aktif edildi
app.use('/api/v1/user-journey', userJourneyRoutes); // User Journey tracking aktif edildi
app.use('/api/v1/analytics-alerts', analyticsAlertsRoutes); // Analytics Alerts sistemi aktif edildi
app.use('/api/v1/alerts', alertRoutes); // Alert System aktif edildi
app.use('/api/v1/data-export', dataExportRoutes); // Data Export sistemi aktif edildi
app.use('/api/v1/data-export-v2', dataExportV2Routes); // Data Export V2 sistemi aktif edildi
app.use('/api/v1/load-testing', loadTestingRoutes); // Load Testing sistemi aktif edildi
app.use('/api/v1/session-management', sessionManagementRoutes); // Session Management sistemi aktif edildi
app.use('/api/v1/cache', cacheRoutes); // Cache Management sistemi aktif edildi
app.use('/api/v1/search', searchRoutes); // Search Cache sistemi aktif edildi
app.use('/api/v1/api-cache', apiCacheRoutes); // API Cache sistemi aktif edildi
app.use('/api/v1/test', testRoutes); // Test routes aktif edildi
app.use('/api/v1/cache-analytics', cacheAnalyticsRoutes); // Cache Analytics sistemi aktif edildi
app.use('/api/v1/predictive-cache', predictiveCacheRoutes); // Predictive Cache sistemi aktif edildi
app.use('/api/v1/geographic-cache', geographicCacheRoutes); // Geographic Cache sistemi aktif edildi
app.use('/api/v1/smart-invalidation', smartInvalidationRoutes); // Smart Invalidation sistemi aktif edildi
app.use('/api/v1/cache-compression', cacheCompressionRoutes); // Cache Compression sistemi aktif edildi
app.use('/api/v1/rate-limit', rateLimitRoutes);
app.use('/api/v1/2fa', twoFactorRoutes); // Cross-Platform Rate Limiting sistemi aktif edildi

// Global error handler
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
    path: req.originalUrl
  });
});

// Start server
const startServer = async () => {
  try {
    // Test database connection
    const { data, error } = await supabase.from('admin_users').select('count').limit(1);
    if (error) {
      logger.error('❌ Database connection failed:', error);
      process.exit(1);
    }
    logger.info('✅ Database connection verified');

    // Test Elasticsearch connection
    try {
      await elasticsearchService.getHealth();
      logger.info('✅ Elasticsearch connection verified');
    } catch (error) {
      logger.warn('⚠️ Elasticsearch connection failed:', error);
    }

    // Start queue processor
    try {
      await queueProcessor.startProcessing(10000); // 10 saniye aralıklarla
      logger.info('✅ Queue processor started');
    } catch (error) {
      logger.error('❌ Queue processor failed to start:', error);
    }

    // Start session cleanup service
    try {
      await sessionCleanupService.start();
      logger.info('✅ Session cleanup service started');
    } catch (error) {
      logger.error('❌ Session cleanup service failed to start:', error);
    }

    // Test Redis connection
    try {
      const redis = new Redis({
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD,
        maxRetriesPerRequest: 3
      });
      
      await redis.ping();
      logger.info('✅ Redis connection verified');
      redis.disconnect();
    } catch (error) {
      logger.warn('⚠️ Redis connection failed:', error);
    }

    app.listen(PORT, () => {
      logger.info(`🚀 Admin Backend API running on port ${PORT}`);
      logger.info(`📊 Environment: ${process.env.NODE_ENV}`);
      logger.info(`🔗 Health check: http://localhost:${PORT}/health`);
      logger.info(`📚 API version: v1`);
    });

  } catch (error) {
    logger.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('🛑 SIGTERM received, shutting down gracefully...');
  
  try {
    await queueProcessor.stopProcessing();
    logger.info('✅ Queue processor stopped');
  } catch (error) {
    logger.error('❌ Error stopping queue processor:', error);
  }
  
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('🛑 SIGINT received, shutting down gracefully...');
  
  try {
    await queueProcessor.stopProcessing();
    logger.info('✅ Queue processor stopped');
  } catch (error) {
    logger.error('❌ Error stopping queue processor:', error);
  }
  
  process.exit(0);
});

// Start the server
startServer();

// Test değişikliği Sun Aug 10 10:52:51 +03 2025
// Hot reload test Sun Aug 10 10:57:18 +03 2025
