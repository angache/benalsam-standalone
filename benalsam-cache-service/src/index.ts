import { config } from 'dotenv';

// Load environment variables FIRST
config();

import express from 'express';
import { createServer } from 'http';
import compression from 'compression';
import { createSecurityMiddleware, SECURITY_CONFIGS } from 'benalsam-shared-types';
import { logger } from './config/logger';
import { errorHandler } from './middleware/errorHandler';
import { healthRoutes } from './routes/health';
import { cacheRoutes } from './routes/cache';

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

// Error handling
app.use(errorHandler);

// Start server
const server = createServer(app);

server.listen(PORT, () => {
  logger.info(`🚀 Cache Service started on port ${PORT}`, { service: 'cache-service' });
  logger.info(`📊 Health check: http://localhost:${PORT}/api/v1/health`, { service: 'cache-service' });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully', { service: 'cache-service' });
  server.close(() => {
    logger.info('Process terminated', { service: 'cache-service' });
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully', { service: 'cache-service' });
  server.close(() => {
    logger.info('Process terminated', { service: 'cache-service' });
    process.exit(0);
  });
});
