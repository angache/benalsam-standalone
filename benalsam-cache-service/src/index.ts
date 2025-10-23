import 'dotenv/config';
import express from 'express';
import { createSecurityMiddleware, SECURITY_CONFIGS } from 'benalsam-shared-types/server';
import { errorHandler } from './middleware/errorHandler';
import { cacheRoutes } from './routes/cache';
import { healthRoutes } from './routes/health';
import metricsRoutes from './routes/metrics';

const app = express();
const PORT = process.env['PORT'] || 3020;

const environment = process.env['NODE_ENV'] || 'development';
const securityConfig = SECURITY_CONFIGS[environment as keyof typeof SECURITY_CONFIGS] || SECURITY_CONFIGS.development;
const securityMiddleware = createSecurityMiddleware(securityConfig as any);
securityMiddleware.getAllMiddleware().forEach(m => app.use(m));

// Increase body size limit for large category trees (10MB)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use('/api/v1/cache', cacheRoutes);
app.use('/api/v1/health', healthRoutes);
app.use('/api/v1/metrics', metricsRoutes);

app.use(errorHandler);

// Global server instance
let server: any;

// Start server
server = app.listen(PORT, () => {
  console.log(`Cache Service running on port ${PORT}`);
});

// Enterprise Graceful Shutdown Handler
const gracefulShutdown = async (signal: string) => {
  console.log(`🛑 ${signal} received, starting graceful shutdown...`);
  
  try {
    // Stop accepting new requests
    server.close(() => {
      console.log('✅ HTTP server closed');
      process.exit(0);
    });

    // Force close after 10 seconds
    setTimeout(() => {
      console.log('⚠️ Forcing shutdown after timeout');
      process.exit(1);
    }, 10000);

  } catch (error) {
    console.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
};

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulShutdown('UNHANDLED_REJECTION');
});

