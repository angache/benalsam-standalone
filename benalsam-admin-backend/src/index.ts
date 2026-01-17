import 'dotenv/config';
import express from 'express';
import compression from 'compression';
import { createSecurityMiddleware, SECURITY_CONFIGS } from 'benalsam-shared-types/server';
import { errorHandler } from './middleware/errorHandler';
import routes from './routes';
import logger from './config/logger';
import { initializeSentry } from './config/sentry';

const app = express();
const PORT = process.env.PORT || 3002;

// Initialize Sentry BEFORE other middleware
initializeSentry(app);

const environment = process.env.NODE_ENV || 'development';
const baseSecurityConfig = SECURITY_CONFIGS[environment as keyof typeof SECURITY_CONFIGS] || SECURITY_CONFIGS.development;

// Override CORS origin if CORS_ORIGIN environment variable is set
const corsOrigin = process.env['CORS_ORIGIN'] 
  ? process.env['CORS_ORIGIN'].split(',').map((origin: string) => origin.trim())
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
app.use(express.json({ limit: '10mb' }));
app.use('/api/v1', routes);

app.use(errorHandler);

// Global server instance
let server: any;

// Start server
server = app.listen(PORT, () => {
  logger.info(`🚀 Admin Backend running on port ${PORT}`, {
    port: PORT,
    environment: process.env.NODE_ENV || 'development',
    service: 'admin-backend'
  });
  logger.info(`📊 Environment: ${environment}`, { service: 'admin-backend' });
  logger.info(`🔗 Health check: http://localhost:${PORT}/api/v1/health`, { service: 'admin-backend' });
});

// Enterprise Graceful Shutdown Handler
const gracefulShutdown = async (signal: string) => {
  logger.info(`🛑 ${signal} received, starting graceful shutdown...`, { service: 'admin-backend' });
  
  try {
    // Stop accepting new requests
      server.close(() => {
      logger.info('✅ HTTP server closed', { service: 'admin-backend' });
      process.exit(0);
    });

    // Force close after 10 seconds
    setTimeout(() => {
      logger.warn('⚠️ Forcing shutdown after timeout', { service: 'admin-backend' });
      process.exit(1);
    }, 10000);

  } catch (error) {
    logger.error('❌ Error during shutdown:', { error: error.message, stack: error.stack, service: 'admin-backend' });
    process.exit(1);
  }
};

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('uncaughtException', (error) => {
  logger.error('❌ Uncaught Exception:', { error: error.message, stack: error.stack, service: 'admin-backend' });
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});
process.on('unhandledRejection', (reason, promise) => {
  logger.error('❌ Unhandled Rejection at:', { promise, reason, service: 'admin-backend' });
  gracefulShutdown('UNHANDLED_REJECTION');
});
