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

// Get all backups
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    logger.info('Fetching backups from backup service');
    
    const result = await makeBackupServiceRequest('GET', '/backup/list');
    
    logger.info('Backups retrieved from backup service', {
      backupCount: result.data?.length || 0
    });
    
    res.json({
      success: true,
      data: result.data,
      meta: {
        total: result.data?.length || 0,
        totalSize: result.data?.reduce((sum: number, backup: any) => sum + backup.size, 0) || 0,
        oldest: result.data?.length > 0 ? Math.min(...result.data.map((b: any) => new Date(b.timestamp).getTime())) : null,
        newest: result.data?.length > 0 ? Math.max(...result.data.map((b: any) => new Date(b.timestamp).getTime())) : null
      }
    });
  } catch (error) {
    logger.error('Failed to get backups from backup service:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get backups',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get specific backup info
router.get('/:backupId', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { backupId } = req.params;
    
    logger.info('Fetching backup info from backup service', { backupId });
    
    const result = await makeBackupServiceRequest('GET', `/backup/${backupId}`);
    
    if (!result.success) {
      return res.status(404).json({
        success: false,
        message: 'Backup not found'
      });
    }
    
    logger.info('Backup info retrieved from backup service', {
      backupId,
      size: result.data?.size
    });
    
    res.json({
      success: true,
      data: result.data
    });
  } catch (error) {
    logger.error('Failed to get backup info from backup service:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get backup info',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Create new backup
router.post('/', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { description, tags } = req.body;
    
    logger.info('Creating backup via backup service', {
      description,
      tags,
      userId: req.admin?.id || req.user?.id
    });
    
    const result = await makeBackupServiceRequest('POST', '/backup/create', {
      description,
      tags
    });
    
    logger.info('Backup created via backup service', {
      backupId: result.data?.id,
      size: result.data?.size
    });
    
    res.json({
      success: true,
      message: 'Backup created successfully',
      data: result.data
    });
  } catch (error) {
    logger.error('Failed to create backup via backup service:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create backup',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Restore backup
router.post('/:backupId/restore', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { backupId } = req.params;
    const { 
      dryRun = false, 
      includeEdgeFunctions = true, 
      includeMigrations = true, 
      backupBeforeRestore = true 
    } = req.body;
    
    logger.info('Starting backup restore via backup service', {
      backupId,
      dryRun,
      includeEdgeFunctions,
      includeMigrations,
      backupBeforeRestore,
      userId: req.admin?.id || req.user?.id
    });
    
    const result = await makeBackupServiceRequest('POST', `/backup/${backupId}/restore`, {
      dryRun,
      includeEdgeFunctions,
      includeMigrations,
      backupBeforeRestore
    });
    
    logger.info('Backup restore completed via backup service', {
      backupId,
      success: result.success
    });
    
    res.json({
      success: true,
      message: dryRun ? 'Dry run completed successfully' : 'Backup restored successfully',
      data: { success: result.success, backupId }
    });
  } catch (error) {
    logger.error('Failed to restore backup via backup service:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to restore backup',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Delete backup
router.delete('/:backupId', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { backupId } = req.params;
    
    logger.info('Deleting backup via backup service', {
      backupId,
      userId: req.admin?.id || req.user?.id
    });
    
    const result = await makeBackupServiceRequest('DELETE', `/backup/${backupId}`);
    
    if (!result.success) {
      return res.status(404).json({
        success: false,
        message: 'Backup not found'
      });
    }
    
    logger.info('Backup deleted via backup service', {
      backupId
    });
    
    res.json({
      success: true,
      message: 'Backup deleted successfully',
      data: { backupId }
    });
  } catch (error) {
    logger.error('Failed to delete backup via backup service:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete backup',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get backup statistics
router.get('/stats/overview', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    logger.info('Fetching backup statistics from backup service');
    
    const result = await makeBackupServiceRequest('GET', '/backup/list');
    
    const backups = result.data || [];
    const stats = {
      totalBackups: backups.length,
      totalSize: backups.reduce((sum: number, backup: any) => sum + backup.size, 0),
      averageSize: backups.length > 0 ? backups.reduce((sum: number, backup: any) => sum + backup.size, 0) / backups.length : 0,
      oldestBackup: backups.length > 0 ? Math.min(...backups.map((b: any) => new Date(b.timestamp).getTime())) : null,
      newestBackup: backups.length > 0 ? Math.max(...backups.map((b: any) => new Date(b.timestamp).getTime())) : null,
      successfulBackups: backups.filter((b: any) => b.status === 'completed').length,
      failedBackups: backups.filter((b: any) => b.status === 'failed').length,
      inProgressBackups: backups.filter((b: any) => b.status === 'in_progress').length
    };
    
    logger.info('Backup statistics retrieved from backup service', {
      totalBackups: stats.totalBackups,
      totalSize: stats.totalSize
    });
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error('Failed to get backup statistics from backup service:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get backup statistics',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;