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
import { connectRedis } from './config/redis';
import { connectRabbitMQ } from './config/rabbitmq';
import { connectDatabase } from './config/database';
import { jobProcessorService } from './services/jobProcessor';
import { listingService } from './services/listingService';

const app = express();
const PORT = process.env['PORT'] || 3008;
const API_VERSION = process.env['API_VERSION'] || 'v1';

// Security middleware
app.use(helmet());
app.use(compression());
app.use(cors({
  origin: process.env['CORS_ORIGIN']?.split(',') || ['http://localhost:3000'],
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
    app.listen(PORT, () => {
      logger.info(`🚀 Listing Service running on port ${PORT}`);
      logger.info(`📚 API version: ${API_VERSION}`);
      logger.info(`🔗 Health check: http://localhost:${PORT}/api/${API_VERSION}/health`);
    });

  } catch (error) {
    logger.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Start the server
startServer();
