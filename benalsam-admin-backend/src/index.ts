import { config } from 'dotenv';

// Load environment variables FIRST
config();

import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { initializeSentry, errorHandler as sentryErrorHandler } from './config/sentry';
import { performanceMiddleware } from './middleware/performanceMonitor';
import { securityMonitoringMiddleware } from './middleware/securityMonitor';
import { adaptiveTimeout } from './middleware/timeout';
import { jwtSecurityService } from './services/jwtSecurityService';
import { 
  sqlInjectionProtection, 
  enhancedXSSProtection, 
  securityHeaders, 
  inputLengthValidation,
  fileUploadValidation 
} from './middleware/securityMiddleware';
import apmMiddleware from './middleware/apmMiddleware';
import enhancedErrorHandler from './middleware/enhancedErrorHandler';
import { createSecurityMiddleware, SECURITY_CONFIGS } from 'benalsam-shared-types';
import compression from 'compression';
import { createClient } from '@supabase/supabase-js';
import Redis from 'ioredis';

// Import routes
import authRoutes from './routes/auth';
import { listingsRouter } from './routes/listings';
import { usersRouter } from './routes/users';
import { categoriesRouter } from './routes/categories';
import healthRoutes from './routes/health';
import monitoringRoutes from './routes/monitoring';
import prometheusRoutes from './routes/prometheus';
import prometheusTestRoutes from './routes/prometheus-test';
import simpleTestRoutes from './routes/simple-test';
import debugTestRoutes from './routes/debug-test';
import elasticsearchRoutes from './routes/elasticsearch';
import adminManagementRoutes from './routes/admin-management';
import analyticsRoutes from './routes/analytics';
import performanceRoutes from './routes/performance';
import trendAnalysisRoutes from './routes/trendAnalysis';
import backupRoutes from './routes/backup';
import schedulingRoutes from './routes/scheduling';
import progressRoutes from './routes/progress';
import sentryRoutes from './routes/sentry';
import userJourneyRoutes from './routes/userJourney';
import analyticsAlertsRoutes from './routes/analyticsAlerts';
import alertRoutes from './routes/alerts';
import dataExportRoutes from './routes/dataExport';
import dataExportV2Routes from './routes/dataExportV2';
import apmRoutes from './routes/apm';
import loadTestingRoutes from './routes/loadTesting';
import sessionManagementRoutes from './routes/sessionManagement';
import { cacheRoutes } from './routes/cache';
import searchRoutes from './routes/search';
// import apiCacheRoutes from './routes/apiCache'; // Deprecated - moved to Cache Service
// import testRoutes from './routes/test'; // Deprecated - moved to Cache Service
// import cacheAnalyticsRoutes from './routes/cacheAnalytics'; // Deprecated - moved to Cache Service
import jwtSecurityRoutes from './routes/jwtSecurity';
// import predictiveCacheRoutes from './routes/predictiveCache'; // Deprecated - moved to Cache Service
// import geographicCacheRoutes from './routes/geographicCache'; // Deprecated - moved to Cache Service
// import smartInvalidationRoutes from './routes/smartInvalidation'; // Deprecated - moved to Cache Service
// import cacheCompressionRoutes from './routes/cacheCompression'; // Deprecated - moved to Cache Service
import triggerTestRoutes from './routes/triggerTest';
import rateLimitRoutes from './routes/rateLimitRoutes';
import twoFactorRoutes from './routes/twoFactor';
import sentryTestRoutes from './routes/sentry-test';
import hybridMonitoringRoutes from './routes/hybridMonitoring';
import healthCheckRoutes from './routes/healthCheck';
import securityRoutes from './routes/security';
import uploadRoutes from './routes/upload';
import aiSuggestionsRoutes from './routes/aiSuggestions';
import inventoryRoutes from './routes/inventory';
import { serviceRegistryRoutes } from './routes/serviceRegistry';
import cacheDashboardRoutes from './routes/cacheDashboard';

// import seoRoutes from './routes/seo';

// Import services
import { AdminElasticsearchService } from './services/elasticsearchService';
import './config/cloudinary'; // Initialize Cloudinary
// import { databaseTriggerBridge } from './services/databaseTriggerBridge'; // Moved to queue service
import sessionCleanupService from './services/sessionCleanupService';
import { AnalyticsAlertsService } from './services/analyticsAlertsService';
import performanceMonitoringService from './services/performanceMonitoringService';
import { initializeRedis } from './services/redisService'; // Redis Cloud enabled
import { serviceRegistry } from './services/serviceRegistry'; // Service Registry for microservices

// Import middleware
import { authenticateToken } from './middleware/auth';
import { errorHandler } from './middleware/errorHandler';
import { sanitizeInput } from './middleware/validation';

// Import logger
import logger from './config/logger';

const app = express();
// 🚀 Hot reload test - bu yorum değişikliği otomatik yansımalı
const PORT = process.env.PORT || 3002;

// Initialize Sentry (must be first middleware)
initializeSentry(app);

// Performance monitoring middleware (must be early)
app.use(performanceMiddleware);

// APM middleware (must be early for request tracking)
app.use(apmMiddleware.middleware);

// Security monitoring middleware (must be early)
app.use(securityMonitoringMiddleware);

// Initialize Supabase client
export const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Initialize services
const elasticsearchService = new AdminElasticsearchService();
// const queueProcessor = new QueueProcessorService(); // Disabled - using new queue service

// Initialize Analytics Alerts Service
const analyticsAlertsService = new AnalyticsAlertsService();
analyticsAlertsService.initializeIndexes().then(() => {
  logger.info('✅ Analytics Alerts Service initialized');
}).catch((error) => {
  logger.error('❌ Analytics Alerts Service initialization failed:', error);
});

// ✅ Initialize JWT Security Service
jwtSecurityService.initialize().then(() => {
  logger.info('✅ JWT Security Service initialized');
}).catch((error) => {
  logger.error('❌ JWT Security Service initialization failed:', error);
});

// Security middleware using shared types
const environment = process.env.NODE_ENV || 'development';
const securityConfig = SECURITY_CONFIGS[environment as keyof typeof SECURITY_CONFIGS] || SECURITY_CONFIGS.development;
const securityMiddleware = createSecurityMiddleware(securityConfig as any);

// Apply security middleware
securityMiddleware.getAllMiddleware().forEach(middleware => {
  app.use(middleware);
});

// CORS is now handled by shared types security middleware

// Rate limiting is handled by shared security middleware

// Body parsing middleware
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ✅ OPTIMIZED: Adaptive timeout middleware
app.use(adaptiveTimeout());

// ✅ ENHANCED: Security middleware stack
app.use(securityHeaders); // Security headers
app.use(sqlInjectionProtection); // SQL injection protection
app.use(enhancedXSSProtection); // Enhanced XSS protection
app.use(inputLengthValidation); // Input length validation
app.use(fileUploadValidation); // File upload validation
app.use(sanitizeInput); // Legacy XSS protection (fallback)

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

// Debug routes (must be first)
app.use('/debug', debugTestRoutes); // Debug test endpoint

// Metrics routes (must be first)
app.use('/simple-metrics', simpleTestRoutes); // Simple test metrics endpoint
app.use('/metrics', prometheusRoutes); // Prometheus metrics endpoint
app.use('/test-metrics', prometheusTestRoutes); // Test Prometheus metrics endpoint

// API routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/listings', authenticateToken, listingsRouter);
app.use('/api/v1/users', authenticateToken, usersRouter);
app.use('/api/v1/categories', categoriesRouter);
app.use('/api/v1/health', healthRoutes);
app.use('/api/v1/monitoring', monitoringRoutes);
app.use('/api/v1/elasticsearch', elasticsearchRoutes);
app.use('/api/v1/admin-management', authenticateToken, adminManagementRoutes);
app.use('/api/v1/analytics', analyticsRoutes); // Analytics aktif edildi
app.use('/api/v1/performance', performanceRoutes); // Performance monitoring aktif edildi
app.use('/api/v1/apm', apmRoutes); // APM (Application Performance Monitoring) sistemi aktif edildi
app.use('/api/v1/trends', trendAnalysisRoutes); // Trend Analysis sistemi aktif edildi
app.use('/api/v1/user-journey', userJourneyRoutes); // User Journey tracking aktif edildi
app.use('/api/v1/analytics-alerts', analyticsAlertsRoutes); // Analytics Alerts sistemi aktif edildi
app.use('/api/v1/alerts', alertRoutes); // Alert System aktif edildi
app.use('/api/v1/data-export', dataExportRoutes); // Data Export sistemi aktif edildi
app.use('/api/v1/data-export-v2', dataExportV2Routes); // Data Export V2 sistemi aktif edildi
app.use('/api/v1/load-testing', loadTestingRoutes); // Load Testing sistemi aktif edildi
app.use('/api/v1/session-management', sessionManagementRoutes); // Session Management sistemi aktif edildi
app.use('/api/v1/cache', cacheRoutes); // Cache Management sistemi aktif edildi
app.use('/api/v1/search', searchRoutes);
app.use('/api/v1', cacheDashboardRoutes); // Temporary cache dashboard endpoints
// app.use('/api/v1/api-cache', apiCacheRoutes); // Deprecated - moved to Cache Service
// app.use('/api/v1/test', testRoutes); // Deprecated - moved to Cache Service
// app.use('/api/v1/cache-analytics', cacheAnalyticsRoutes); // Deprecated - moved to Cache Service
// app.use('/api/v1/predictive-cache', predictiveCacheRoutes); // Deprecated - moved to Cache Service
// app.use('/api/v1/geographic-cache', geographicCacheRoutes); // Deprecated - moved to Cache Service
// app.use('/api/v1/smart-invalidation', smartInvalidationRoutes); // Deprecated - moved to Cache Service
// app.use('/api/v1/cache-compression', cacheCompressionRoutes); // Deprecated - moved to Cache Service
app.use('/api/v1/trigger-test', triggerTestRoutes); // Trigger Test sistemi aktif edildi
app.use('/api/v1/rate-limit', rateLimitRoutes);
app.use('/api/v1/2fa', twoFactorRoutes); // Cross-Platform Rate Limiting sistemi aktif edildi
app.use('/api/v1/sentry-test', sentryTestRoutes); // Sentry test routes
app.use('/api/v1/performance', performanceRoutes); // Performance monitoring routes
app.use('/api/v1/performance-analysis', performanceRoutes); // Performance analysis routes
app.use('/api/v1/backup', backupRoutes);
app.use('/api/v1/scheduling', schedulingRoutes);
app.use('/api/v1/progress', progressRoutes); // Database backup routes
app.use('/api/v1/sentry', sentryRoutes); // Sentry dashboard routes
app.use('/api/v1/hybrid-monitoring', hybridMonitoringRoutes); // Hybrid monitoring routes
app.use('/api/v1/health', healthCheckRoutes); // Health check routes
app.use('/api/v1/security', securityRoutes); // Security monitoring routes
app.use('/api/v1/upload', uploadRoutes); // Cloudinary upload routes
app.use('/api/v1/ai-suggestions', aiSuggestionsRoutes); // AI Suggestions sistemi aktif edildi
app.use('/api/v1/inventory', inventoryRoutes); // Inventory routes
app.use('/api/v1/jwt-security', jwtSecurityRoutes); // JWT Security routes
app.use('/api/v1/service-registry', serviceRegistryRoutes); // Service Registry routes


// SEO routes (no auth required)
// app.use('/', seoRoutes); // Sitemap and robots.txt

// Sentry error handler is now integrated into the main error handler

// Global error handler
app.use(apmMiddleware.errorMiddleware); // APM error tracking
app.use(enhancedErrorHandler.handle); // Enhanced error handling
app.use(errorHandler); // Legacy error handler (fallback)

// 404 handler
app.use('*', enhancedErrorHandler.handleNotFound);

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

    // Database trigger bridge moved to queue service (Port 3012)
    logger.info('✅ Database trigger bridge now running in queue service (Port 3012)');

    // Start queue processor - DISABLED (using RabbitMQ instead)
    // try {
    //   await queueProcessor.startProcessing(10000); // 10 saniye aralıklarla
    //   logger.info('✅ Queue processor started');
    // } catch (error) {
    //   logger.error('❌ Queue processor failed to start:', error);
    // }
    logger.info('✅ Using RabbitMQ for event-driven architecture');

    // Start session cleanup service
    try {
      await sessionCleanupService.start();
      logger.info('✅ Session cleanup service started');
    } catch (error) {
      logger.error('❌ Session cleanup service failed to start:', error);
    }

    // Initialize Redis Cloud for performance analysis (DISABLED - Free tier read-only)
    if (process.env.ENABLE_REDIS_CLOUD === 'true') {
      try {
        await initializeRedis(); // Redis Cloud enabled
        logger.info('✅ Redis Cloud initialized');
      } catch (error) {
        logger.error('❌ Redis Cloud initialization failed:', error);
      }
    } else {
      logger.info('⚠️ Redis Cloud disabled (ENABLE_REDIS_CLOUD=false)');
    }
    // logger.info('ℹ️ Redis Cloud disabled - Free tier is read-only, using local Redis only');

    // Start performance monitoring service (controlled by environment variable)
    if (process.env.ENABLE_PERFORMANCE_MONITORING === 'true') {
      try {
        await performanceMonitoringService.startMonitoring();
        logger.info('✅ Performance monitoring service started');
      } catch (error) {
        logger.error('❌ Performance monitoring service failed to start:', error);
      }
    } else {
      logger.info('⚠️ Performance monitoring service disabled (ENABLE_PERFORMANCE_MONITORING=false)');
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

    // Initialize Service Registry
    logger.info('🔧 Initializing Service Registry...');
    const services = serviceRegistry.getServices();
    logger.info(`✅ Service Registry initialized with services: ${services.join(', ')}`);

    app.listen(PORT, () => {
      logger.info(`🚀 Admin Backend API running on port ${PORT}`);
      logger.info(`📊 Environment: ${process.env.NODE_ENV}`);
      logger.info(`🔗 Health check: http://localhost:${PORT}/health`);
      logger.info(`📚 API version: v1`);
      logger.info(`🔧 Service Registry: ${services.join(', ')}`);
    });

  } catch (error) {
    logger.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Enhanced error handling for unhandled rejections and exceptions
process.on('unhandledRejection', enhancedErrorHandler.handleUnhandledRejection);
process.on('uncaughtException', enhancedErrorHandler.handleUncaughtException);

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('🛑 SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('🛑 SIGINT received, shutting down gracefully...');
  process.exit(0);
});

// Start the server
startServer();

// Test değişikliği Sun Aug 10 10:52:51 +03 2025
// Hot reload test Sun Aug 10 10:57:18 +03 2025
