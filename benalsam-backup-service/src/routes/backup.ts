import { Router, Request, Response } from 'express';
import logger from '../config/logger';
import { SimpleBackupService } from '../services/SimpleBackupService';

const router = Router();
const backupService = new SimpleBackupService();

// Create backup
router.post('/create', async (req: Request, res: Response) => {
  try {
    const { description, tags } = req.body;
    
    logger.info('Creating backup', { description, tags });
    
    const backup = await backupService.createBackup(description, tags);
    
    res.json({
      success: true,
      data: backup,
      message: 'Backup created successfully'
    });
  } catch (error) {
    logger.error('Backup creation failed:', error);
    res.status(500).json({
      success: false,
      message: 'Backup creation failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get all backups
router.get('/list', async (_req: Request, res: Response) => {
  try {
    const backups = await backupService.getBackups();
    
    res.json({
      success: true,
      data: backups,
      count: backups.length
    });
  } catch (error) {
    logger.error('Failed to get backups:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get backups',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get backup details
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Backup ID is required'
      });
    }
    const backup = await backupService.getBackupInfo(id);
    
    if (!backup) {
      return res.status(404).json({
        success: false,
        message: 'Backup not found'
      });
    }
    
    return res.json({
      success: true,
      data: backup
    });
  } catch (error) {
    logger.error('Failed to get backup details:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get backup details',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Restore backup
router.post('/:id/restore', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Backup ID is required'
      });
    }
    const { dryRun = false, includeEdgeFunctions = true, includeMigrations = true, backupBeforeRestore = true } = req.body;
    
    logger.info('Restoring backup', { id, dryRun, includeEdgeFunctions, includeMigrations, backupBeforeRestore });
    
    const success = await backupService.restoreBackup(id, { dryRun });
    
    if (success) {
      return res.json({
        success: true,
        message: dryRun ? 'Backup restore dry run completed' : 'Backup restored successfully'
      });
    } else {
      return res.status(500).json({
        success: false,
        message: 'Backup restore failed'
      });
    }
  } catch (error) {
    logger.error('Backup restore failed:', error);
    return res.status(500).json({
      success: false,
      message: 'Backup restore failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Delete backup
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Backup ID is required'
      });
    }
    
    logger.info('Deleting backup', { id });
    
    const success = await backupService.deleteBackup(id);
    
    if (success) {
      return res.json({
        success: true,
        message: 'Backup deleted successfully'
      });
    } else {
      return res.status(404).json({
        success: false,
        message: 'Backup not found'
      });
    }
  } catch (error) {
    logger.error('Backup deletion failed:', error);
    return res.status(500).json({
      success: false,
      message: 'Backup deletion failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export { router as backupRoutes };
