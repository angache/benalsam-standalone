import { config } from 'dotenv';

// Load environment variables FIRST
config();

import express from 'express';
import { createServer } from 'http';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { createSecurityMiddleware, SECURITY_CONFIGS } from 'benalsam-shared-types/server';
import logger from './config/logger';
import { errorHandler } from './middleware/errorHandler';
import { healthRoutes } from './routes/health';
import { cleanupRoutes } from './routes/cleanup';
import { testRoutes } from './routes/test';
import { statusChangeRoutes } from './routes/statusChange';
import './config/firebase'; // Initialize Firebase
import firebaseEventListener from './services/firebaseEventListener';
import jobCleanupService from './services/jobCleanupService';

const app = express();
const PORT = process.env['PORT'] || 3007;

// Security middleware configuration
const environment = process.env['NODE_ENV'] || 'development';
const baseSecurityConfig = SECURITY_CONFIGS[environment as keyof typeof SECURITY_CONFIGS] || SECURITY_CONFIGS.development;

// Override CORS origin if CORS_ORIGIN environment variable is set
const corsOrigin = process.env.CORS_ORIGIN 
  ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim())
  : baseSecurityConfig.cors?.origin;

const securityConfig = {
  ...baseSecurityConfig,
  cors: {
    ...baseSecurityConfig.cors,
    origin: corsOrigin || baseSecurityConfig.cors?.origin,
  }
};

const securityMiddleware = createSecurityMiddleware(securityConfig as any);
securityMiddleware.getAllMiddleware().forEach(m => app.use(m));

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
app.use('/api/v1/cleanup', cleanupRoutes);
app.use('/api/v1/status-change', statusChangeRoutes);
app.use('/test', testRoutes);

// Error handling
app.use(errorHandler);

// Start server
const server = createServer(app);

server.listen(PORT, async () => {
  logger.info(`🚀 Realtime Service started on port ${PORT}`);
  logger.info(`📊 Health check: http://localhost:${PORT}/api/v1/health`);
  
  // Firebase event listener'ı başlat
  try {
    await firebaseEventListener.startListening();
    logger.info('✅ Firebase event listener started');
  } catch (error) {
    logger.error('❌ Failed to start Firebase event listener:', error);
  }
  
  // Job cleanup scheduler'ı başlat (Her gün saat 02:00'de çalışır)
  try {
    jobCleanupService.start('0 2 * * *', 7); // Daily at 2 AM, delete jobs older than 7 days
    logger.info('✅ Job cleanup scheduler started (daily at 02:00, 7+ days old jobs)');
  } catch (error) {
    logger.error('❌ Failed to start job cleanup scheduler:', error);
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  firebaseEventListener.stopListening();
  jobCleanupService.stop();
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  firebaseEventListener.stopListening();
  jobCleanupService.stop();
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});
