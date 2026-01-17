/**
 * Benalsam Listing Service
 * 
 * @fileoverview Dedicated microservice for listing management with job system
 * @author Benalsam Team
 * @version 1.0.0
 */

import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import compression from 'compression';
import morgan from 'morgan';
import { createSecurityMiddleware, SECURITY_CONFIGS } from './sharedTypesServer';
import { logger } from './config/logger';
import { errorHandler } from './middleware/errorHandler';
import { rateLimiter } from './middleware/rateLimiter';
import { authMiddleware } from './middleware/auth';
import listingRoutes from './routes/listings';
import aiRoutes from './routes/ai';
import aiLearningRoutes from './routes/ai-learning';
import jobRoutes from './routes/jobs';
import healthRoutes from './routes/health';
import metricsRoutes from './routes/metrics';
import { connectRedis, disconnectRedis } from './config/redis';
import { connectRabbitMQ, disconnectRabbitMQ } from './config/rabbitmq';
import { connectDatabase, disconnectDatabase } from './config/database';
import { jobProcessorService } from './services/jobProcessor';
import { listingService } from './services/listingService';
import { learningScheduler } from './services/ai/learningScheduler';

const app = express();
const PORT = process.env['PORT'] || 3008;
const API_VERSION = process.env['API_VERSION'] || 'v1';

// Security middleware configuration
const environment = process.env['NODE_ENV'] || 'development';
const baseSecurityConfig = SECURITY_CONFIGS[environment as keyof typeof SECURITY_CONFIGS] || SECURITY_CONFIGS.development;

// Override CORS origin if CORS_ORIGIN environment variable is set
const corsOrigin = process.env['CORS_ORIGIN'] 
  ? process.env['CORS_ORIGIN'].split(',').map((origin: string) => origin.trim())
  : baseSecurityConfig.cors?.origin;

const securityConfig = {
  ...baseSecurityConfig,
  cors: {
    ...baseSecurityConfig.cors,
    origin: corsOrigin || baseSecurityConfig.cors?.origin,
  }
};

const securityMiddleware = createSecurityMiddleware(securityConfig as any);
securityMiddleware.getAllMiddleware().forEach((m: any) => app.use(m));

app.use(compression());

// Body parsing middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Logging middleware
app.use(morgan('combined', {
  stream: { write: (message) => logger.info(message.trim()) }
}));

// Rate limiting
app.use(rateLimiter);

// Request logging
app.use((req, _res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });
  next();
});

// Routes
app.use(`/api/${API_VERSION}/listings`, authMiddleware, listingRoutes);
app.use(`/api/${API_VERSION}/listings/ai`, authMiddleware, aiRoutes);
app.use(`/api/${API_VERSION}/ai-learning`, authMiddleware, aiLearningRoutes);
app.use(`/api/${API_VERSION}/jobs`, authMiddleware, jobRoutes);
app.use(`/api/${API_VERSION}/health`, healthRoutes);
app.use(`/api/${API_VERSION}`, metricsRoutes);

// Root endpoint
app.get('/', (_req, res) => {
  res.json({
    service: 'Benalsam Listing Service',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString(),
    endpoints: {
      listings: `/api/${API_VERSION}/listings`,
      ai: `/api/${API_VERSION}/listings/ai`,
      jobs: `/api/${API_VERSION}/jobs`,
      health: `/api/${API_VERSION}/health`
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

// Global server instance
let server: any;

// Start server
async function startServer() {
  try {
    // Connect to Redis
    await connectRedis();
    logger.info('✅ Redis connected');

    // Connect to RabbitMQ (required for job processing and event system)
    await connectRabbitMQ();
    logger.info('✅ RabbitMQ connected');

    // Connect to Database
    await connectDatabase();
    logger.info('✅ Database connected');

    // Start Job Processor
    if (process.env['JOB_PROCESSING_ENABLED'] === 'true') {
      await jobProcessorService.start();
      logger.info('✅ Job Processor started');
    }

    // Start Listing Service
    await listingService.start();
    logger.info('✅ Listing Service started');

    // Start AI Learning Scheduler (if enabled)
    if (process.env['AI_LEARNING_ENABLED'] !== 'false') {
      learningScheduler.start();
      logger.info('✅ AI Learning Scheduler started');
    }

    // Start server
    server = app.listen(PORT, () => {
      logger.info(`🚀 Listing Service running on port ${PORT}`);
      logger.info(`📚 API version: ${API_VERSION}`);
      logger.info(`🔗 Health check: http://localhost:${PORT}/api/${API_VERSION}/health`);
    });

  } catch (error) {
    logger.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Enterprise Graceful Shutdown Handler
const gracefulShutdown = async (signal: string) => {
  logger.info(`🛑 ${signal} received, starting enterprise graceful shutdown...`);
  
  try {
    // Stop accepting new requests
    server.close(() => {
      logger.info('✅ HTTP server closed gracefully');
    });

    // Stop job processor with timeout
    const shutdownTimeout = setTimeout(() => {
      logger.warn('⚠️ Shutdown timeout reached, forcing exit');
      process.exit(1);
    }, 10000); // 10 second timeout

    // Stop job processor
    if (process.env['JOB_PROCESSING_ENABLED'] === 'true') {
      await jobProcessorService.stop();
      logger.info('✅ Job Processor stopped gracefully');
    }

    // Stop listing service
    await listingService.stop();
    logger.info('✅ Listing Service stopped gracefully');

    // Stop AI Learning Scheduler
    if (process.env['AI_LEARNING_ENABLED'] !== 'false') {
      learningScheduler.stop();
      logger.info('✅ AI Learning Scheduler stopped gracefully');
    }

    // Disconnect from external services
    await disconnectDatabase();
    logger.info('✅ Database disconnected gracefully');

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
