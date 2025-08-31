import { Router } from 'express';
import { createJob, getJob, getJobs, retryJob, removeJob } from '../controllers/jobController';
import { body, param, query } from 'express-validator';
import { validateRequest } from '../middleware/validation';

const router = Router();

// Validation rules
const createJobValidation = [
  body('type').isIn(['elasticsearch-sync', 'email-notification', 'data-export', 'image-processing', 'analytics']).withMessage('Invalid job type'),
  body('data').isObject().withMessage('Job data must be an object'),
  body('priority').optional().isInt({ min: 0, max: 10 }).withMessage('Priority must be between 0 and 10'),
  body('delay').optional().isInt({ min: 0 }).withMessage('Delay must be a positive integer'),
  body('attempts').optional().isInt({ min: 1, max: 10 }).withMessage('Attempts must be between 1 and 10'),
];

const jobIdValidation = [
  param('id').isString().notEmpty().withMessage('Job ID is required'),
];

const jobTypeValidation = [
  query('type').isIn(['elasticsearch-sync', 'email-notification', 'data-export', 'image-processing', 'analytics']).withMessage('Invalid job type'),
];

const getJobsValidation = [
  query('type').isIn(['elasticsearch-sync', 'email-notification', 'data-export', 'image-processing', 'analytics']).withMessage('Invalid job type'),
  query('status').optional().isIn(['pending', 'processing', 'completed', 'failed', 'delayed', 'active', 'waiting', 'paused']).withMessage('Invalid status'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('offset').optional().isInt({ min: 0 }).withMessage('Offset must be a non-negative integer'),
];

// Routes
router.post('/', createJobValidation, validateRequest, createJob);
router.get('/', getJobsValidation, validateRequest, getJobs);
router.get('/:id', jobIdValidation, jobTypeValidation, validateRequest, getJob);
router.put('/:id/retry', jobIdValidation, jobTypeValidation, validateRequest, retryJob);
router.delete('/:id', jobIdValidation, jobTypeValidation, validateRequest, removeJob);

export default router;
