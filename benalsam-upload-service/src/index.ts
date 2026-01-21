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
import { rabbitmqConfig } from './config/rabbitmq';

const app = express();
app.set('trust proxy', true); // Enable trust proxy for reverse proxy support
const PORT = process.env.PORT || 3007;

const environment = process.env.NODE_ENV || 'development';
const securityConfig = SECURITY_CONFIGS[environment as keyof typeof SECURITY_CONFIGS] || SECURITY_CONFIGS.development;
const securityMiddleware = createSecurityMiddleware(securityConfig as any);

// Middlewares
app.use(helmet());
// Configure CORS for development and production
const corsOptions = {
  origin: [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002',
    'http://localhost:3003',
    'https://benalsam-web-next.vercel.app',
    'https://www.benalsam.com',
    'https://benalsam.com',
    ...(process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : [])
  ],
  credentials: true,
  optionsSuccessStatus: 200,
  preflightContinue: false,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-User-ID', 'X-Forwarded-For'],
};
app.use(cors(corsOptions));
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

  // Setup RabbitMQ queues first
  try {
    await rabbitmqConfig.setupQueue();
    logger.info('✅ RabbitMQ queues configured');
  } catch (error) {
    logger.error('❌ Failed to configure RabbitMQ queues:', error);
  }

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
