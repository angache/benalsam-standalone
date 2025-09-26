import { config } from 'dotenv';

// Load environment variables FIRST
config();

import express from 'express';
import { createServer } from 'http';
import compression from 'compression';
import { createSecurityMiddleware, SECURITY_CONFIGS } from 'benalsam-shared-types';
import { logger } from './config/logger';
import { errorHandler } from './middleware/errorHandler';
import { disconnectRedis } from './config/redis';
import { healthRoutes } from './routes/health';
import { cacheRoutes } from './routes/cache';
import metricsRoutes from './routes/metrics';

const app = express();
const PORT = process.env['PORT'] || 3014;

// Security middleware using shared types
const environment = process.env['NODE_ENV'] || 'development';
const securityConfig = SECURITY_CONFIGS[environment as keyof typeof SECURITY_CONFIGS] || SECURITY_CONFIGS.development;
const securityMiddleware = createSecurityMiddleware(securityConfig as any);

// Apply security middleware
securityMiddleware.getAllMiddleware().forEach(middleware => {
  app.use(middleware);
});

app.use(compression());

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Routes
app.use('/api/v1/health', healthRoutes);
app.use('/api/v1/cache', cacheRoutes);
app.use('/api/v1', metricsRoutes);

// Error handling
app.use(errorHandler);

// Start server
const server = createServer(app);

server.listen(PORT, () => {
  logger.info(`🚀 Cache Service started on port ${PORT}`, { service: 'cache-service' });
  logger.info(`📊 Health check: http://localhost:${PORT}/api/v1/health`, { service: 'cache-service' });
});

// Enterprise Graceful Shutdown Handler
const gracefulShutdown = async (signal: string) => {
  logger.info(`🛑 ${signal} received, starting enterprise graceful shutdown...`, { service: 'cache-service' });
  
  try {
    // Stop accepting new requests
    server.close(() => {
      logger.info('✅ HTTP server closed gracefully', { service: 'cache-service' });
    });

    // Stop with timeout
    const shutdownTimeout = setTimeout(() => {
      logger.warn('⚠️ Shutdown timeout reached, forcing exit', { service: 'cache-service' });
      process.exit(1);
    }, 10000); // 10 second timeout

    // Disconnect from Redis
    await disconnectRedis();
    logger.info('✅ Redis disconnected gracefully', { service: 'cache-service' });

    clearTimeout(shutdownTimeout);
    logger.info('✅ Enterprise graceful shutdown completed successfully', { service: 'cache-service' });
    process.exit(0);
  } catch (error) {
    logger.error('❌ Error during graceful shutdown:', error, { service: 'cache-service' });
    process.exit(1);
  }
};

// Handle different shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('❌ Uncaught Exception:', error, { service: 'cache-service' });
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('❌ Unhandled Rejection at:', promise, 'reason:', reason, { service: 'cache-service' });
  gracefulShutdown('UNHANDLED_REJECTION');
});

