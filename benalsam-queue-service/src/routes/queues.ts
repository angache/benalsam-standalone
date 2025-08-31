import { Router } from 'express';
import { body } from 'express-validator';
import { getQueueStats, cleanQueues, pauseQueues, resumeQueues } from '../controllers/queueController';
import { validateRequest } from '../middleware/validation';

const router = Router();

// Get all queue statistics
router.get('/stats', getQueueStats);

// Clean all queues
router.post('/clean', [
  body('type')
    .isIn(['completed', 'failed', 'wait', 'active', 'delayed', 'paused'])
    .withMessage('Invalid clean type'),
  body('grace')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Grace period must be a positive integer'),
  validateRequest,
], cleanQueues);

// Pause all queues
router.post('/pause', pauseQueues);

// Resume all queues
router.post('/resume', resumeQueues);

export default router;
