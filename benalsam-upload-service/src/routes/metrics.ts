import { Router } from 'express';
import { collectMetrics } from '../config/metrics';
import { logger } from '../config/logger';

const router = Router();

/**
 * Prometheus metrics endpoint
 */
router.get('/', async (_req, res) => {
  try {
    const metrics = await collectMetrics();
    
    res.set('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
    res.send(metrics);
    
  } catch (error) {
    logger.error('❌ Error serving metrics:', error);
    res.status(500).send('Error collecting metrics');
  }
});

/**
 * Prometheus metrics endpoint (for monitoring)
 */
router.get('/prometheus', async (_req, res) => {
  try {
    const metrics = await collectMetrics();
    
    res.set('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
    res.send(metrics);
    
  } catch (error) {
    logger.error('❌ Error serving Prometheus metrics:', error);
    res.status(500).send('Error collecting metrics');
  }
});

export default router;
