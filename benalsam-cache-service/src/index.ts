import { config } from 'dotenv';

// Load environment variables FIRST
config();

import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import logger from './config/logger';
import { errorHandler } from './middleware/errorHandler';
import { healthRoutes } from './routes/health';
import { cacheRoutes } from './routes/cache';

const app = express();
const PORT = process.env['PORT'] || 3014;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env['CORS_ORIGIN']?.split(',') || ['http://localhost:3000', 'http://localhost:3002'],
  credentials: true
}));
app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env['RATE_LIMIT_WINDOW_MS'] || '900000'), // 15 minutes
  max: parseInt(process.env['RATE_LIMIT_MAX_REQUESTS'] || '1000'), // limit each IP to 1000 requests per windowMs
  message: 'Too many requests from this IP'
});
app.use(limiter);

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
