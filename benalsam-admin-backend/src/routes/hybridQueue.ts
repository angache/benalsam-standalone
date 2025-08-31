import { Router } from 'express';
import { hybridQueueController } from '../controllers/hybridQueueController';

const router = Router();

// Transition management
router.get('/transition/status', hybridQueueController.getTransitionStatus.bind(hybridQueueController));
router.put('/transition/percentage', hybridQueueController.updateTransitionPercentage.bind(hybridQueueController));
router.post('/transition/enable-new', hybridQueueController.enableNewQueue.bind(hybridQueueController));
router.post('/transition/fallback-old', hybridQueueController.fallbackToOldQueue.bind(hybridQueueController));

// New queue service management
router.get('/new-queue/health', hybridQueueController.checkNewQueueHealth.bind(hybridQueueController));
router.get('/new-queue/stats', hybridQueueController.getNewQueueStats.bind(hybridQueueController));

// Queue control
router.post('/queues/pause', hybridQueueController.pauseQueues.bind(hybridQueueController));
router.post('/queues/resume', hybridQueueController.resumeQueues.bind(hybridQueueController));
router.post('/queues/clean', hybridQueueController.cleanCompletedJobs.bind(hybridQueueController));

// Test endpoints
router.post('/test/job', hybridQueueController.sendTestJob.bind(hybridQueueController));

export default router;
