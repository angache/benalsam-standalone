import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';

// Load environment variables FIRST
dotenv.config();

import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import elasticsearchConfig from './config/elasticsearch';
import logger from './config/logger';

// Import routes
import healthRoutes from './routes/health';
import searchRoutes from './routes/search';

// Environment variables already loaded above

const app = express();
const PORT = process.env.PORT || 3016;
const SERVICE_NAME = process.env.SERVICE_NAME || 'search-service';
const SERVICE_VERSION = process.env.SERVICE_VERSION || '1.0.0';

// Middleware
app.use(helmet());
app.use(cors());
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
    app.listen(PORT, () => {
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
