import { Router } from 'express';
import { newQueueController } from '../controllers/newQueueController';

const router = Router();

// Health check
router.get('/health', newQueueController.checkHealth.bind(newQueueController));

// Queue stats
router.get('/stats', newQueueController.getQueueStats.bind(newQueueController));

// Test endpoints
router.post('/test/job', newQueueController.sendTestJob.bind(newQueueController));

// Job management
router.post('/jobs', newQueueController.addJob.bind(newQueueController));

export default router;
