import express from 'express';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { createSecurityMiddleware, SECURITY_CONFIGS } from 'benalsam-shared-types';

// Load environment variables FIRST
dotenv.config();

import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import elasticsearchConfig from './config/elasticsearch';
import { logger } from './config/logger';

// Import routes
import healthRoutes from './routes/health';
import searchRoutes from './routes/search';
import metricsRoutes from './routes/metrics';

// Environment variables already loaded above

const app = express();
const PORT = process.env.PORT || 3016;
const SERVICE_NAME = process.env.SERVICE_NAME || 'search-service';
const SERVICE_VERSION = process.env.SERVICE_VERSION || '1.0.0';

// Initialize security middleware
const environment = process.env.NODE_ENV || 'development';
const securityConfig = SECURITY_CONFIGS[environment as keyof typeof SECURITY_CONFIGS] || SECURITY_CONFIGS.development;
const securityMiddleware = createSecurityMiddleware(securityConfig as any);

// Apply security middleware
securityMiddleware.getAllMiddleware().forEach(middleware => {
  app.use(middleware);
});

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging middleware
app.use(morgan('combined', {
  stream: {
    write: (message: string) => {
      logger.info(message.trim(), { service: SERVICE_NAME });
    }
  }
}));

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

// Routes
app.use('/api/v1/health', healthRoutes);
app.use('/api/v1/search', searchRoutes);
app.use('/api/v1/metrics', metricsRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Benalsam Search Service',
    service: SERVICE_NAME,
    version: SERVICE_VERSION,
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/api/v1/health',
      search: '/api/v1/search'
    }
  });
});

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Initialize and start server
async function startServer() {
  try {
    // Test Elasticsearch connection
    logger.info('Testing Elasticsearch connection...', { version: SERVICE_VERSION });
    const esConnected = await elasticsearchConfig.connect();
    
    if (!esConnected) {
      logger.warn('Elasticsearch connection failed, service will run with limited functionality');
    }

    // Start server
    server = app.listen(PORT, () => {
      logger.info(`🚀 ${SERVICE_NAME} started on port ${PORT}`, {
        version: SERVICE_VERSION,
        port: PORT,
        environment: process.env.NODE_ENV || 'development'
      });
      
      logger.info(`📊 Health check: http://localhost:${PORT}/api/v1/health`, {
        version: SERVICE_VERSION
      });
      
      logger.info(`🔍 Search API: http://localhost:${PORT}/api/v1/search`, {
        version: SERVICE_VERSION
      });
    });

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Global server instance
let server: any;

// Enterprise Graceful Shutdown Handler
const gracefulShutdown = async (signal: string) => {
  logger.info(`🛑 ${signal} received, starting enterprise graceful shutdown...`, { version: SERVICE_VERSION });
  
  try {
    // Stop accepting new requests
    if (server) {
      server.close(() => {
        logger.info('✅ HTTP server closed gracefully', { version: SERVICE_VERSION });
      });
    }

    // Stop with timeout
    const shutdownTimeout = setTimeout(() => {
      logger.warn('⚠️ Shutdown timeout reached, forcing exit', { version: SERVICE_VERSION });
      process.exit(1);
    }, 10000); // 10 second timeout

    // Disconnect from Elasticsearch
    await elasticsearchConfig.closeConnection();
    logger.info('✅ Elasticsearch connection closed gracefully', { version: SERVICE_VERSION });

    clearTimeout(shutdownTimeout);
    logger.info('✅ Enterprise graceful shutdown completed successfully', { version: SERVICE_VERSION });
    process.exit(0);
  } catch (error) {
    logger.error('❌ Error during graceful shutdown:', error, { version: SERVICE_VERSION });
    process.exit(1);
  }
};

// Handle different shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('❌ Uncaught Exception:', error, { version: SERVICE_VERSION });
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('❌ Unhandled Rejection at:', promise, 'reason:', reason, { version: SERVICE_VERSION });
  gracefulShutdown('UNHANDLED_REJECTION');
});

// Start the server
startServer();
