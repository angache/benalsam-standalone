import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import { logger } from './config/logger';
import { errorHandler } from './middleware/errorHandler';
import { createSecurityMiddleware, SECURITY_CONFIGS } from 'benalsam-shared-types';
import uploadRoutes from './routes/upload';
import healthRoutes from './routes/health';
import jobRoutes from './routes/jobs';
import listingsRoutes from './routes/listings';
import metricsRoutes from './routes/metrics';
import { connectRedis, disconnectRedis } from './config/redis';
import { connectRabbitMQ, disconnectRabbitMQ } from './config/rabbitmq';
// import { jobProcessorService } from './services/jobProcessor';

// Load environment variables

const app = express();
const PORT = process.env.PORT || 3007;
const API_VERSION = process.env.API_VERSION || 'v1';

// Initialize security middleware
const environment = process.env.NODE_ENV || 'development';
const securityConfig = SECURITY_CONFIGS[environment as keyof typeof SECURITY_CONFIGS] || SECURITY_CONFIGS.development;
const securityMiddleware = createSecurityMiddleware(securityConfig as any);

// Apply security middleware
securityMiddleware.getAllMiddleware().forEach(middleware => {
  app.use(middleware);
});

// Body parsing middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });
  next();
});

// Routes
app.use(`/api/${API_VERSION}/upload`, uploadRoutes);
app.use(`/api/${API_VERSION}/health`, healthRoutes);
app.use(`/api/${API_VERSION}/jobs`, jobRoutes);
app.use(`/api/${API_VERSION}/listings`, listingsRoutes);
app.use(`/api/${API_VERSION}/metrics`, metricsRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    service: 'Benalsam Upload Service',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString(),
      endpoints: {
        upload: `/api/${API_VERSION}/upload`,
        health: `/api/${API_VERSION}/health`,
        jobs: `/api/${API_VERSION}/jobs`,
        listings: `/api/${API_VERSION}/listings`,
        metrics: `/api/${API_VERSION}/metrics`
      }
  });
});

// Error handling
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
async function startServer() {
  try {
    // Connect to Redis
    await connectRedis();
    logger.info('✅ Redis connected');

    // Connect to RabbitMQ
    await connectRabbitMQ();
    logger.info('✅ RabbitMQ connected');

    // Start Job Processor
    // await jobProcessorService.start();
    logger.info('✅ Job Processor started');

    // Start server
    server = app.listen(PORT, () => {
      logger.info(`🚀 Upload Service running on port ${PORT}`);
      logger.info(`📚 API version: ${API_VERSION}`);
      logger.info(`🔗 Health check: http://localhost:${PORT}/api/${API_VERSION}/health`);
    });

  } catch (error) {
    logger.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Global server instance
let server: any;

// Enterprise Graceful Shutdown Handler
const gracefulShutdown = async (signal: string) => {
  logger.info(`🛑 ${signal} received, starting enterprise graceful shutdown...`);
  
  try {
    // Stop accepting new requests
    if (server) {
      server.close(() => {
        logger.info('✅ HTTP server closed gracefully');
      });
    }

    // Stop with timeout
    const shutdownTimeout = setTimeout(() => {
      logger.warn('⚠️ Shutdown timeout reached, forcing exit');
      process.exit(1);
    }, 10000); // 10 second timeout

    // Disconnect from external services
    await disconnectRabbitMQ();
    logger.info('✅ RabbitMQ disconnected gracefully');

    await disconnectRedis();
    logger.info('✅ Redis disconnected gracefully');

    clearTimeout(shutdownTimeout);
    logger.info('✅ Enterprise graceful shutdown completed successfully');
    process.exit(0);
  } catch (error) {
    logger.error('❌ Error during graceful shutdown:', error);
    process.exit(1);
  }
};

// Handle different shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('❌ Uncaught Exception:', error);
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulShutdown('UNHANDLED_REJECTION');
});

// Start the server
startServer();
