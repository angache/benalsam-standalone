import 'dotenv/config'; // Load environment variables FIRST
import express from 'express';
import compression from 'compression';
import cors from 'cors';
import { createSecurityMiddleware, SECURITY_CONFIGS } from 'benalsam-shared-types/server';
import { errorHandler } from './middleware/errorHandler';
import searchRoutes from './routes/search';
import healthRoutes from './routes/health';
import metricsRoutes from './routes/metrics';

const app = express();
const PORT = process.env.PORT || 3016;

// Trust proxy - Nginx arkasında çalıştığı için gerekli (X-Forwarded-For header'ı için)
// Sadece localhost'tan gelen istekleri trust et (Nginx 127.0.0.1'den geliyor)
// Bu, rate limiting güvenliğini korur
app.set('trust proxy', 1); // Sadece ilk proxy hop'unu trust et

const environment = process.env.NODE_ENV || 'development';
const baseSecurityConfig = SECURITY_CONFIGS[environment as keyof typeof SECURITY_CONFIGS] || SECURITY_CONFIGS.development;

// Override CORS origin if CORS_ORIGIN environment variable is set
const corsOriginEnv = process.env.CORS_ORIGIN;
const corsOrigin = corsOriginEnv 
  ? corsOriginEnv.split(',').map(origin => origin.trim())
  : (baseSecurityConfig.cors?.origin || ['http://localhost:3000', 'http://localhost:5173']);

// Debug: Log CORS configuration
console.log('🔒 CORS Configuration', {
  CORS_ORIGIN_ENV: corsOriginEnv || 'not set',
  corsOrigin: corsOrigin,
  corsOriginType: Array.isArray(corsOrigin) ? 'array' : typeof corsOrigin,
  baseConfigOrigin: baseSecurityConfig.cors?.origin,
  environment: environment
});

const securityConfig = {
  ...baseSecurityConfig,
  cors: {
    ...baseSecurityConfig.cors,
    origin: corsOrigin, // Direct array - cors paketi bunu handle edecek
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-API-Key', 'x-user-id', 'Accept'],
    optionsSuccessStatus: 200
  }
};

const securityMiddleware = createSecurityMiddleware(securityConfig as any);

// Apply CORS middleware FIRST (before other security middleware)
// Bu, CORS'un kesinlikle çalışmasını garanti eder
const corsOriginEnv = process.env.CORS_ORIGIN;
const corsAllowedOrigins = corsOriginEnv 
  ? corsOriginEnv.split(',').map(origin => origin.trim())
  : ['http://localhost:3000', 'http://localhost:5173', 'https://benalsam.vercel.app'];

console.log('🔒 Direct CORS Middleware', {
  allowedOrigins: corsAllowedOrigins
});

app.use(cors({
  origin: corsAllowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-API-Key', 'x-user-id', 'Accept'],
  optionsSuccessStatus: 200
}));

// Apply other security middleware
securityMiddleware.getAllMiddleware().forEach(m => app.use(m));

app.use(compression());
app.use(express.json({ limit: '10mb' }));

app.use('/api/v1/search', searchRoutes);
app.use('/api/v1/health', healthRoutes);
app.use('/api/v1/metrics', metricsRoutes);

app.use(errorHandler);

// Global server instance
let server: any;

// Start server
server = app.listen(PORT, () => {
  console.log(`Search Service running on port ${PORT}`);
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
