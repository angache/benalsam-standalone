import { config } from 'dotenv';

// Load environment variables FIRST
config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import logger from './config/logger';
import { checkDatabaseHealth } from './config/database';
import categoriesRoutes from './routes/categories';
import healthRoutes from './routes/health';

// Create Express app
const app = express();
const PORT = process.env.PORT || 3015;
const SERVICE_NAME = process.env.SERVICE_NAME || 'categories-service';

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
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://admin.benalsam.com', 'https://benalsam.com']
    : ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

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
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error:', {
    error: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    service: SERVICE_NAME
  });
  
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'production' 
      ? 'An unexpected error occurred' 
      : error.message,
    service: SERVICE_NAME,
    timestamp: new Date().toISOString()
  });
});

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
    app.listen(PORT, () => {
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

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully', { service: SERVICE_NAME });
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully', { service: SERVICE_NAME });
  process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', {
    error: error.message,
    stack: error.stack,
    service: SERVICE_NAME
  });
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', {
    promise,
    reason,
    service: SERVICE_NAME
  });
  process.exit(1);
});

// Start the server
startServer();
