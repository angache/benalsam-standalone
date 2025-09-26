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
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import { logger } from './config/logger';
import { errorHandler } from './middleware/errorHandler';
import { rateLimiter } from './middleware/rateLimiter';
import { authMiddleware } from './middleware/auth';
import listingRoutes from './routes/listings';
import jobRoutes from './routes/jobs';
import healthRoutes from './routes/health';
import metricsRoutes from './routes/metrics';
import { connectRedis, disconnectRedis } from './config/redis';
import { connectRabbitMQ, disconnectRabbitMQ } from './config/rabbitmq';
import { connectDatabase, disconnectDatabase } from './config/database';
import { jobProcessorService } from './services/jobProcessor';
import { listingService } from './services/listingService';

const app = express();
const PORT = process.env['PORT'] || 3008;
const API_VERSION = process.env['API_VERSION'] || 'v1';

// Security middleware
app.use(helmet());
app.use(compression());
app.use(cors({
  origin: process.env['CORS_ORIGIN']?.split(',') || [
    'http://localhost:3000',
    'http://localhost:5173',
    'http://localhost:3001'
  ],
  credentials: true
}));

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
app.use(`/api/${API_VERSION}/jobs`, authMiddleware, jobRoutes);
app.use(`/api/${API_VERSION}/health`, healthRoutes);
app.use(`/api/${API_VERSION}/metrics`, metricsRoutes);

// Root endpoint
app.get('/', (_req, res) => {
  res.json({
    service: 'Benalsam Listing Service',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString(),
    endpoints: {
      listings: `/api/${API_VERSION}/listings`,
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

    // Connect to RabbitMQ
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
