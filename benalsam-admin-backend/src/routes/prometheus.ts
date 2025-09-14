import express, { IRouter } from 'express';
import { register, collectDefaultMetrics, Counter, Histogram, Gauge } from 'prom-client';
import { redis } from '../config/redis';
import { elasticsearchClient } from '../services/elasticsearchService';
import { supabase } from '../config/supabase';
import logger from '../config/logger';

const router: IRouter = express.Router();

// Enable default metrics collection
collectDefaultMetrics({ register });

// Custom metrics
const httpRequestsTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});

const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10]
});

const databaseConnections = new Gauge({
  name: 'database_connections_active',
  help: 'Number of active database connections'
});

const redisConnections = new Gauge({
  name: 'redis_connections_active',
  help: 'Number of active Redis connections'
});

const elasticsearchIndices = new Gauge({
  name: 'elasticsearch_indices_total',
  help: 'Total number of Elasticsearch indices'
});

const elasticsearchDocuments = new Gauge({
  name: 'elasticsearch_documents_total',
  help: 'Total number of documents in Elasticsearch'
});

const systemUptime = new Gauge({
  name: 'system_uptime_seconds',
  help: 'System uptime in seconds'
});

const memoryUsage = new Gauge({
  name: 'process_memory_usage_bytes',
  help: 'Process memory usage in bytes',
  labelNames: ['type']
});

// Register custom metrics
register.registerMetric(httpRequestsTotal);
register.registerMetric(httpRequestDuration);
register.registerMetric(databaseConnections);
register.registerMetric(redisConnections);
register.registerMetric(elasticsearchIndices);
register.registerMetric(elasticsearchDocuments);
register.registerMetric(systemUptime);
register.registerMetric(memoryUsage);

// Prometheus metrics endpoint
router.get('/metrics', async (req, res) => {
  try {
    // Update system metrics
    systemUptime.set(process.uptime());
    
    // Update memory metrics
    const memUsage = process.memoryUsage();
    memoryUsage.set({ type: 'rss' }, memUsage.rss);
    memoryUsage.set({ type: 'heapTotal' }, memUsage.heapTotal);
    memoryUsage.set({ type: 'heapUsed' }, memUsage.heapUsed);
    memoryUsage.set({ type: 'external' }, memUsage.external);

    // Update database metrics
    try {
      const dbStart = Date.now();
      await supabase.from('admin_users').select('count').limit(1);
      const dbResponseTime = Date.now() - dbStart;
      databaseConnections.set(1);
    } catch (error) {
      databaseConnections.set(0);
    }

    // Update Redis metrics
    try {
      await redis.ping();
      redisConnections.set(1);
    } catch (error) {
      redisConnections.set(0);
    }

    // Update Elasticsearch metrics
    try {
      const indices = await elasticsearchClient.cat.indices({ format: 'json' });
      elasticsearchIndices.set(indices.length);
      
      let totalDocuments = 0;
      indices.forEach((index: any) => {
        totalDocuments += parseInt(index['docs.count'] || '0');
      });
      elasticsearchDocuments.set(totalDocuments);
    } catch (error) {
      elasticsearchIndices.set(0);
      elasticsearchDocuments.set(0);
    }

    // Set content type to text/plain for Prometheus
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());

  } catch (error) {
    logger.error('Error generating Prometheus metrics:', error);
    res.status(500).end('Error generating metrics');
  }
});

// Health check for Prometheus
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default router;
