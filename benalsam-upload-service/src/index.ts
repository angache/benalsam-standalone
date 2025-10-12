import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import { createSecurityMiddleware, SECURITY_CONFIGS } from './sharedTypesServer';
import listingsRouter from './routes/listings';
import uploadRouter from './routes/upload';
import { errorHandler } from './middleware/errorHandler';
import { logger } from './config/logger';
import metricsRoutes from './routes/metrics';
import healthRoutes from './routes/health';
import { uploadEventConsumer } from './services/uploadEventConsumer';

const app = express();
const PORT = process.env.PORT || 3007;

const environment = process.env.NODE_ENV || 'development';
const securityConfig = SECURITY_CONFIGS[environment as keyof typeof SECURITY_CONFIGS] || SECURITY_CONFIGS.development;
const securityMiddleware = createSecurityMiddleware(securityConfig as any);

// Middlewares
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Apply security middleware
securityMiddleware.getAllMiddleware().forEach(mw => app.use(mw));

// Routes
app.use('/api/v1/listings', listingsRouter);
app.use('/api/v1/upload', uploadRouter);
app.use('/api/v1/metrics', metricsRoutes);
app.use('/api/v1/health', healthRoutes);

// Error handler
app.use(errorHandler);

let server: any;
server = app.listen(PORT, async () => {
  logger.info('🚀 Upload Service running on port ' + PORT);
  logger.info('📊 Environment: ' + (process.env.NODE_ENV || 'development'));
  logger.info('🔗 Health check: http://localhost:' + PORT + '/api/v1/health');

  // Start upload event consumer
  try {
    await uploadEventConsumer.start();
    logger.info('✅ Upload Event Consumer started');
  } catch (error) {
    logger.error('❌ Failed to start Upload Event Consumer:', error);
  }
});

// Graceful shutdown
const shutdown = async (signal: string) => {
  logger.info(`🛑 ${signal} received, shutting down Upload Service...`);
  try {
    // Stop upload event consumer
    await uploadEventConsumer.stop();
    logger.info('✅ Upload Event Consumer stopped');

    if (server) {
      server.close(() => {
        logger.info('✅ HTTP server closed gracefully');
      });
    }
  } catch (err) {
    logger.error('❌ Error during shutdown', err as any);
  }
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
