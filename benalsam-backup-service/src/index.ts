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
import { backupRoutes } from './routes/backup';
import { schedulingRoutes } from './routes/scheduling';

const app = express();
const PORT = process.env['PORT'] || 3013;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env['CORS_ORIGIN']?.split(',') || ['http://localhost:3000'],
  credentials: true
}));
app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP'
});
app.use(limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Routes
app.use('/api/v1/health', healthRoutes);
app.use('/api/v1/backup', backupRoutes);
app.use('/api/v1/scheduling', schedulingRoutes);

// Error handling
app.use(errorHandler);

// Start server
const server = createServer(app);

server.listen(PORT, () => {
  logger.info(`🚀 Backup Service started on port ${PORT}`);
  logger.info(`📊 Health check: http://localhost:${PORT}/api/v1/health`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});
