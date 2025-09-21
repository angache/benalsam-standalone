import { config } from 'dotenv';

// Load environment variables FIRST
config();

import express from 'express';
import { createServer } from 'http';
import compression from 'compression';
import { createSecurityMiddleware, SECURITY_CONFIGS } from 'benalsam-shared-types';
import logger from './config/logger';
import { errorHandler } from './middleware/errorHandler';
import { healthRoutes } from './routes/health';
import { bridgeRoutes } from './routes/bridge';
import { databaseTriggerBridge } from './services/databaseTriggerBridge';

const app = express();
const PORT = process.env['PORT'] || 3012;

// Initialize security middleware
const environment = process.env['NODE_ENV'] || 'development';
const securityConfig = SECURITY_CONFIGS[environment as keyof typeof SECURITY_CONFIGS] || SECURITY_CONFIGS.development;
const securityMiddleware = createSecurityMiddleware(securityConfig as any);

// Apply security middleware
securityMiddleware.getAllMiddleware().forEach((middleware: any) => {
  app.use(middleware);
});

// Compression middleware
app.use(compression());

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Routes
app.use('/api/v1/health', healthRoutes);
app.use('/api/v1/bridge', bridgeRoutes);

// Error handling
app.use(errorHandler);

// Start server
const server = createServer(app);

server.listen(PORT, async () => {
  logger.info(`🚀 Queue Service started on port ${PORT}`);
  logger.info(`📊 Health check: http://localhost:${PORT}/api/v1/health`);
  
  // Start database trigger bridge
  try {
    await databaseTriggerBridge.startProcessing(5000); // 5 saniye aralıklarla
    logger.info('✅ Database trigger bridge started');
  } catch (error) {
    logger.error('❌ Failed to start database trigger bridge:', error);
  }
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  
  // Stop database trigger bridge
  try {
    await databaseTriggerBridge.stopProcessing();
    logger.info('✅ Database trigger bridge stopped');
  } catch (error) {
    logger.error('❌ Error stopping database trigger bridge:', error);
  }
  
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  
  // Stop database trigger bridge
  try {
    await databaseTriggerBridge.stopProcessing();
    logger.info('✅ Database trigger bridge stopped');
  } catch (error) {
    logger.error('❌ Error stopping database trigger bridge:', error);
  }
  
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});
