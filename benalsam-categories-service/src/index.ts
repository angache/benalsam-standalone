import { config } from 'dotenv';

// Load environment variables FIRST
config();

import express from 'express';
import compression from 'compression';
import { createSecurityMiddleware, SECURITY_CONFIGS } from './sharedTypesServer';
import { logger } from './config/logger';
import { checkDatabaseHealth, disconnectDatabase } from './config/database';
import { disconnectRedis } from './config/redis';
import categoriesRoutes from './routes/categories';
import healthRoutes from './routes/health';
import metricsRoutes from './routes/metrics';
import { errorHandler } from './middleware/errorHandler';

// Create Express app
const app = express();
const PORT = process.env.PORT || 3015;
const SERVICE_NAME = process.env.SERVICE_NAME || 'categories-service';

// Initialize security middleware
const environment = process.env.NODE_ENV || 'development';
const securityConfig = SECURITY_CONFIGS[environment as keyof typeof SECURITY_CONFIGS] || SECURITY_CONFIGS.development;
const securityMiddleware = createSecurityMiddleware(securityConfig as any);

// Apply security middleware
securityMiddleware.getAllMiddleware().forEach(middleware => {
  app.use(middleware);
});

// Compression middleware
app.use(compression());

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  const startTime = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    logger.info('HTTP Request', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      userAgent: req.get('User-Agent'),
      ip: req.ip,
      service: SERVICE_NAME
    });
  });
  
  next();
});

// API routes
app.use('/api/v1/categories', categoriesRoutes);
app.use('/api/v1/health', healthRoutes);
app.use('/api/v1', metricsRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    service: SERVICE_NAME,
    version: process.env.SERVICE_VERSION || '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/api/v1/health',
      categories: '/api/v1/categories',
      documentation: '/api/v1/docs'
    }
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    message: `Route ${req.method} ${req.originalUrl} not found`,
    service: SERVICE_NAME,
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use(errorHandler);

// Start server
const startServer = async () => {
  try {
    // Test database connection
    logger.info('Testing database connection...', { service: SERVICE_NAME });
    const dbHealth = await checkDatabaseHealth();
    
    if (dbHealth.status !== 'healthy') {
      logger.error('Database connection failed:', { dbHealth, service: SERVICE_NAME });
      process.exit(1);
    }
    
    logger.info('✅ Database connection verified', { service: SERVICE_NAME });
    
    // Start server
    server = app.listen(PORT, () => {
      logger.info(`🚀 ${SERVICE_NAME} started on port ${PORT}`, {
        port: PORT,
        environment: process.env.NODE_ENV || 'development',
        service: SERVICE_NAME,
        version: process.env.SERVICE_VERSION || '1.0.0'
      });
      
      logger.info(`📊 Health check: http://localhost:${PORT}/api/v1/health`, { service: SERVICE_NAME });
      logger.info(`📚 Categories API: http://localhost:${PORT}/api/v1/categories`, { service: SERVICE_NAME });
    });
    
  } catch (error) {
    logger.error('Failed to start server:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      service: SERVICE_NAME
    });
    process.exit(1);
  }
};

// Global server instance
let server: any;

// Enterprise Graceful Shutdown Handler
const gracefulShutdown = async (signal: string) => {
  logger.info(`🛑 ${signal} received, starting enterprise graceful shutdown...`, { service: SERVICE_NAME });
  
  try {
    // Stop accepting new requests
    if (server) {
      server.close(() => {
        logger.info('✅ HTTP server closed gracefully', { service: SERVICE_NAME });
      });
    }

    // Stop with timeout
    const shutdownTimeout = setTimeout(() => {
      logger.warn('⚠️ Shutdown timeout reached, forcing exit', { service: SERVICE_NAME });
      process.exit(1);
    }, 10000); // 10 second timeout

    // Disconnect from external services
    await disconnectDatabase();
    logger.info('✅ Database disconnected gracefully', { service: SERVICE_NAME });

    await disconnectRedis();
    logger.info('✅ Redis disconnected gracefully', { service: SERVICE_NAME });

    clearTimeout(shutdownTimeout);
    logger.info('✅ Enterprise graceful shutdown completed successfully', { service: SERVICE_NAME });
    process.exit(0);
  } catch (error) {
    logger.error('❌ Error during graceful shutdown:', error, { service: SERVICE_NAME });
    process.exit(1);
  }
};

// Handle different shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('❌ Uncaught Exception:', {
    error: error.message,
    stack: error.stack,
    service: SERVICE_NAME
  });
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('❌ Unhandled Rejection at:', {
    promise,
    reason,
    service: SERVICE_NAME
  });
  gracefulShutdown('UNHANDLED_REJECTION');
});

// Start the server
startServer();
