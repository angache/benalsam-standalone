import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { elasticsearchConfig } from './config/elasticsearch';
import { queueConsumer } from './services/queueConsumer';
import { dlqService } from './services/dlqService';
import healthRoutes from './routes/health';
import metricsRoutes from './routes/metrics';
import searchRoutes from './routes/search';
import logger from './config/logger';

// Express uygulamasını oluştur
const app = express();
const port = process.env.PORT || 3006;

// Middleware'leri ekle
app.use(helmet());
app.use(cors());
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info(`${req.method} ${req.path} ${res.statusCode} - ${duration}ms`, {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration,
      ip: req.ip,
      userAgent: req.get('user-agent')
    });
  });
  next();
});

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message
  });
});

// Health check route'larını ekle
app.use('/health', healthRoutes);
app.use('/api/v1/health', healthRoutes);

// Search route'larını ekle
app.use('/api/v1/search', searchRoutes);

// Metrics route'larını ekle
app.use('/', metricsRoutes);
app.use('/api/v1/monitoring', metricsRoutes);

// Ana endpoint
app.get('/', (req, res) => {
  res.json({
    service: 'elasticsearch-service',
    version: process.env.npm_package_version || '1.0.0',
    health: '/health'
  });
});

// Servisi başlat
async function startServer() {
  try {
    // Elasticsearch index'ini başlat
    await elasticsearchConfig.initializeIndex('benalsam_listings');
    logger.info('✅ Elasticsearch index initialized');

  // DLQ service'i başlat
  await dlqService.initialize();
  logger.info('✅ DLQ service initialized');

  // Queue consumer'ı başlat
  await queueConsumer.start();
  logger.info('✅ Queue consumer started');

    // Express sunucusunu başlat
    app.listen(port, () => {
      logger.info(`🚀 Elasticsearch Service running on port ${port}`);
      logger.info(`📊 Environment: ${process.env.NODE_ENV}`);
      logger.info(`🔗 Health check: http://localhost:${port}/health`);
    });

  } catch (error) {
    logger.error('❌ Failed to start service:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received. Starting graceful shutdown...');
  
  try {
    // Queue consumer'ı durdur
    await queueConsumer.stop();
    logger.info('✅ Queue consumer stopped');

    // Elasticsearch bağlantısını kapat
    await elasticsearchConfig.closeConnection();
    logger.info('✅ Elasticsearch connection closed');

    process.exit(0);
  } catch (error) {
    logger.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
});

// Servisi başlat
startServer();
