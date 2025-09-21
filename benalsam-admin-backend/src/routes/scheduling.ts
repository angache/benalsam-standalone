import express from 'express';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import logger from '../config/logger';
import axios from 'axios';

const router = express.Router();

// Backup service base URL
const BACKUP_SERVICE_URL = process.env.BACKUP_SERVICE_URL || 'http://localhost:3013';

// Helper function to make requests to backup service
const makeBackupServiceRequest = async (method: string, endpoint: string, data?: any) => {
  try {
    const url = `${BACKUP_SERVICE_URL}/api/v1${endpoint}`;
    const response = await axios({
      method,
      url,
      data,
      timeout: 30000, // 30 seconds timeout
      headers: {
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    logger.error('Backup service request failed:', {
      method,
      endpoint,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  }
};

// Apply authentication to all routes
router.use(authenticateToken);

// Get all schedules
router.get('/', async (req: AuthenticatedRequest, res) => {
  try {
    logger.info('Fetching schedules from backup service');
    
    const result = await makeBackupServiceRequest('GET', '/scheduling/list');
    
    logger.info('Schedules retrieved from backup service', {
      scheduleCount: result.data?.length || 0
    });
    
    res.json({
      success: true,
      data: result.data,
      count: result.count
    });
  } catch (error) {
    logger.error('Failed to get schedules from backup service:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get schedules',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get specific schedule
router.get('/:scheduleId', async (req: AuthenticatedRequest, res) => {
  try {
    const { scheduleId } = req.params;
    
    logger.info('Fetching schedule from backup service', { scheduleId });
    
    const result = await makeBackupServiceRequest('GET', `/scheduling/${scheduleId}`);
    
    if (!result.success) {
      return res.status(404).json({
        success: false,
        message: 'Schedule not found'
      });
    }
    
    logger.info('Schedule retrieved from backup service', {
      scheduleId,
      name: result.data?.name
    });
    
    res.json({
      success: true,
      data: result.data
    });
  } catch (error) {
    logger.error('Failed to get schedule from backup service:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get schedule',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Create new schedule
router.post('/', async (req: AuthenticatedRequest, res) => {
  try {
    const { 
      name, 
      description, 
      cronExpression, 
      enabled = true,
      backupOptions,
      timezone = 'Europe/Istanbul',
      maxBackups = 10
    } = req.body;
    
    if (!name || !cronExpression) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: name, cronExpression'
      });
    }
    
    logger.info('Creating schedule via backup service', {
      name,
      cronExpression,
      enabled,
      userId: req.admin?.id || req.user?.id
    });
    
    const result = await makeBackupServiceRequest('POST', '/scheduling/create', {
      name,
      description,
      cronExpression,
      enabled
    });
    
    logger.info('Schedule created via backup service', {
      scheduleId: result.data?.id,
      name: result.data?.name
    });
    
    res.json({
      success: true,
      message: 'Schedule created successfully',
      data: result.data
    });
  } catch (error) {
    logger.error('Failed to create schedule via backup service:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create schedule',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Update schedule
router.put('/:scheduleId', async (req: AuthenticatedRequest, res) => {
  try {
    const { scheduleId } = req.params;
    const updates = req.body;
    
    logger.info('Updating schedule via backup service', {
      scheduleId,
      updates,
      userId: req.admin?.id || req.user?.id
    });
    
    const result = await makeBackupServiceRequest('PUT', `/scheduling/${scheduleId}`, updates);
    
    if (!result.success) {
      return res.status(404).json({
        success: false,
        message: 'Schedule not found'
      });
    }
    
    logger.info('Schedule updated via backup service', {
      scheduleId,
      name: result.data?.name
    });
    
    res.json({
      success: true,
      message: 'Schedule updated successfully',
      data: result.data
    });
  } catch (error) {
    logger.error('Failed to update schedule via backup service:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update schedule',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Delete schedule
router.delete('/:scheduleId', async (req: AuthenticatedRequest, res) => {
  try {
    const { scheduleId } = req.params;
    
    logger.info('Deleting schedule via backup service', {
      scheduleId,
      userId: req.admin?.id || req.user?.id
    });
    
    const result = await makeBackupServiceRequest('DELETE', `/scheduling/${scheduleId}`);
    
    if (!result.success) {
      return res.status(404).json({
        success: false,
        message: 'Schedule not found'
      });
    }
    
    logger.info('Schedule deleted via backup service', {
      scheduleId
    });
    
    res.json({
      success: true,
      message: 'Schedule deleted successfully'
    });
  } catch (error) {
    logger.error('Failed to delete schedule via backup service:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete schedule',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Trigger schedule manually
router.post('/:scheduleId/trigger', async (req: AuthenticatedRequest, res) => {
  try {
    const { scheduleId } = req.params;
    
    logger.info('Triggering schedule via backup service', {
      scheduleId,
      userId: req.admin?.id || req.user?.id
    });
    
    const result = await makeBackupServiceRequest('POST', `/scheduling/${scheduleId}/trigger`);
    
    if (!result.success) {
      return res.status(404).json({
        success: false,
        message: 'Schedule not found'
      });
    }
    
    logger.info('Schedule triggered via backup service', {
      scheduleId
    });
    
    res.json({
      success: true,
      message: 'Schedule triggered successfully'
    });
  } catch (error) {
    logger.error('Failed to trigger schedule via backup service:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to trigger schedule',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get schedule status
router.get('/:scheduleId/status', async (req: AuthenticatedRequest, res) => {
  try {
    const { scheduleId } = req.params;
    
    logger.info('Fetching schedule status from backup service', { scheduleId });
    
    const result = await makeBackupServiceRequest('GET', `/scheduling/${scheduleId}/status`);
    
    res.json({
      success: true,
      data: result.data
    });
  } catch (error) {
    logger.error('Failed to get schedule status from backup service:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get schedule status',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;