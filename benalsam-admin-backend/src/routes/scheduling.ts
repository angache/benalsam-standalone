import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { schedulingService, BackupSchedule } from '../services/schedulingService';
import logger from '../config/logger';

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

// Get all schedules
router.get('/', async (req, res) => {
  try {
    const schedules = await schedulingService.getAllSchedules();
    res.json({
      success: true,
      data: schedules,
      message: 'Schedules retrieved successfully'
    });
  } catch (error) {
    logger.error('Failed to get schedules', { error: error instanceof Error ? error.message : error, stack: error instanceof Error ? error.stack : 'N/A' });
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve schedules',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get specific schedule
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const schedule = await schedulingService.getSchedule(id);
    
    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: 'Schedule not found'
      });
    }

    return res.json({
      success: true,
      data: schedule,
      message: 'Schedule retrieved successfully'
    });
  } catch (error) {
    logger.error('Failed to get schedule', { scheduleId: req.params.id, error });
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve schedule',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Create new schedule
router.post('/', async (req, res) => {
  try {
    const {
      name,
      description,
      cronExpression,
      backupOptions,
      timezone,
      enabled
    } = req.body;

    // Validate required fields
    if (!name || !cronExpression || !backupOptions || !timezone) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: name, cronExpression, backupOptions, timezone'
      });
    }

    // Validate cron expression
    if (!require('node-cron').validate(cronExpression)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid cron expression'
      });
    }

    const schedule = await schedulingService.createSchedule({
      name,
      description,
      cronExpression,
      backupOptions: {
        includeDatabase: backupOptions.includeDatabase ?? true,
        includeEdgeFunctions: backupOptions.includeEdgeFunctions ?? true,
        includeMigrations: backupOptions.includeMigrations ?? true,
        compression: backupOptions.compression ?? true
      },
      timezone,
      enabled: enabled ?? true
    });

    return res.status(201).json({
      success: true,
      data: schedule,
      message: 'Schedule created successfully'
    });
  } catch (error) {
    logger.error('Failed to create schedule', { error, body: req.body });
    return res.status(500).json({
      success: false,
      message: 'Failed to create schedule',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Update schedule
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Validate cron expression if provided
    if (updates.cronExpression && !require('node-cron').validate(updates.cronExpression)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid cron expression'
      });
    }

    const updatedSchedule = await schedulingService.updateSchedule(id, updates);
    
    if (!updatedSchedule) {
      return res.status(404).json({
        success: false,
        message: 'Schedule not found'
      });
    }

    return res.json({
      success: true,
      data: updatedSchedule,
      message: 'Schedule updated successfully'
    });
  } catch (error) {
    logger.error('Failed to update schedule', { scheduleId: req.params.id, error });
    return res.status(500).json({
      success: false,
      message: 'Failed to update schedule',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Delete schedule
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await schedulingService.deleteSchedule(id);
    
    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Schedule not found'
      });
    }

    return res.json({
      success: true,
      message: 'Schedule deleted successfully'
    });
  } catch (error) {
    logger.error('Failed to delete schedule', { scheduleId: req.params.id, error });
    return res.status(500).json({
      success: false,
      message: 'Failed to delete schedule',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get scheduling service health
router.get('/health/status', async (req, res) => {
  try {
    const isHealthy = await schedulingService.isHealthy();
    
    res.json({
      success: true,
      data: {
        healthy: isHealthy,
        timestamp: new Date().toISOString()
      },
      message: isHealthy ? 'Scheduling service is healthy' : 'Scheduling service is unhealthy'
    });
  } catch (error) {
    logger.error('Failed to check scheduling service health', { error });
    res.status(500).json({
      success: false,
      message: 'Failed to check scheduling service health',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get schedule status
router.get('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const status = await schedulingService.getScheduleStatus(id);
    
    if (!status) {
      return res.status(404).json({
        success: false,
        message: 'Schedule status not found'
      });
    }

    return res.json({
      success: true,
      data: status,
      message: 'Schedule status retrieved successfully'
    });
  } catch (error) {
    logger.error('Failed to get schedule status', { scheduleId: req.params.id, error });
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve schedule status',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Manually trigger schedule
router.post('/:id/trigger', async (req, res) => {
  try {
    const { id } = req.params;
    const triggered = await schedulingService.triggerSchedule(id);
    
    if (!triggered) {
      return res.status(404).json({
        success: false,
        message: 'Schedule not found'
      });
    }

    return res.json({
      success: true,
      message: 'Schedule triggered successfully'
    });
  } catch (error) {
    logger.error('Failed to trigger schedule', { scheduleId: req.params.id, error });
    return res.status(500).json({
      success: false,
      message: 'Failed to trigger schedule',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get execution history
router.get('/:id/history', async (req, res) => {
  try {
    const { id } = req.params;
    const limit = parseInt(req.query.limit as string) || 10;
    const history = await schedulingService.getExecutionHistory(id, limit);

    res.json({
      success: true,
      data: history,
      message: 'Execution history retrieved successfully'
    });
  } catch (error) {
    logger.error('Failed to get execution history', { scheduleId: req.params.id, error });
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve execution history',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
