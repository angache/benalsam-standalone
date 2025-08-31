import { Router } from 'express';
import { getHealthCheck, getMetrics } from '../controllers/healthController';

const router = Router();

// Get detailed health check
router.get('/health', getHealthCheck);

// Get system metrics
router.get('/metrics', getMetrics);

export default router;
