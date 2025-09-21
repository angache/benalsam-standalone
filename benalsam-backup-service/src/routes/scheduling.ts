import { Router, Request, Response } from 'express';
import logger from '../config/logger';
import { simpleSchedulingService } from '../services/SimpleSchedulingService';

const router = Router();

// Create schedule
router.post('/create', async (req: Request, res: Response) => {
  try {
    const scheduleData = req.body;
    
    logger.info('Creating backup schedule', { scheduleData });
    
    const schedule = await simpleSchedulingService.createSchedule(scheduleData);
    
    res.json({
      success: true,
      data: schedule,
      message: 'Backup schedule created successfully'
    });
  } catch (error) {
    logger.error('Schedule creation failed:', error);
    res.status(500).json({
      success: false,
      message: 'Schedule creation failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get all schedules
router.get('/list', async (_req: Request, res: Response) => {
  try {
    const schedules = await simpleSchedulingService.getAllSchedules();
    
    res.json({
      success: true,
      data: schedules,
      count: schedules.length
    });
  } catch (error) {
    logger.error('Failed to get schedules:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get schedules',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get schedule details
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Schedule ID is required'
      });
    }
    const schedule = await simpleSchedulingService.getSchedule(id);
    
    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: 'Schedule not found'
      });
    }
    
    return res.json({
      success: true,
      data: schedule
    });
  } catch (error) {
    logger.error('Failed to get schedule details:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get schedule details',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Update schedule
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Schedule ID is required'
      });
    }
    const updates = req.body;
    
    logger.info('Updating backup schedule', { id, updates });
    
    const schedule = await simpleSchedulingService.updateSchedule(id, updates);
    
    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: 'Schedule not found'
      });
    }
    
    return res.json({
      success: true,
      data: schedule,
      message: 'Schedule updated successfully'
    });
  } catch (error) {
    logger.error('Schedule update failed:', error);
    return res.status(500).json({
      success: false,
      message: 'Schedule update failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Delete schedule
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Schedule ID is required'
      });
    }
    
    logger.info('Deleting backup schedule', { id });
    
    const success = await simpleSchedulingService.deleteSchedule(id);
    
    if (success) {
      return res.json({
        success: true,
        message: 'Schedule deleted successfully'
      });
    } else {
      return res.status(404).json({
        success: false,
        message: 'Schedule not found'
      });
    }
  } catch (error) {
    logger.error('Schedule deletion failed:', error);
    return res.status(500).json({
      success: false,
      message: 'Schedule deletion failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Trigger schedule manually
router.post('/:id/trigger', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Schedule ID is required'
      });
    }
    
    logger.info('Manually triggering schedule', { id });
    
    const success = await simpleSchedulingService.triggerSchedule(id);
    
    if (success) {
      return res.json({
        success: true,
        message: 'Schedule triggered successfully'
      });
    } else {
      return res.status(404).json({
        success: false,
        message: 'Schedule not found'
      });
    }
  } catch (error) {
    logger.error('Schedule trigger failed:', error);
    return res.status(500).json({
      success: false,
      message: 'Schedule trigger failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get schedule status
router.get('/:id/status', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Schedule ID is required'
      });
    }
    const status = await simpleSchedulingService.getScheduleStatus(id);
    
    return res.json({
      success: true,
      data: status
    });
  } catch (error) {
    logger.error('Failed to get schedule status:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get schedule status',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export { router as schedulingRoutes };
