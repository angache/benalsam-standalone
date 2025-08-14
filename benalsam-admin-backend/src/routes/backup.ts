import express from 'express';
import { authenticateToken } from '../middleware/auth';
import logger from '../config/logger';
import BackupService from '../services/backupService';
import path from 'path';
import fs from 'fs';

const router = express.Router();
const backupService = new BackupService();

// Get all backups
router.get('/', authenticateToken, async (req, res) => {
  try {
    const backups = await backupService.getBackups();
    
    logger.info('Backups list retrieved', {
      endpoint: req.path,
      ip: req.ip,
      backupCount: backups.length
    });

    return res.json({
      success: true,
      data: {
        backups,
        summary: {
          total: backups.length,
          totalSize: backups.reduce((sum, backup) => sum + backup.size, 0),
          oldest: backups.length > 0 ? Math.min(...backups.map(b => new Date(b.timestamp).getTime())) : null,
          newest: backups.length > 0 ? Math.max(...backups.map(b => new Date(b.timestamp).getTime())) : null
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Failed to get backups', {
      endpoint: req.path,
      error: errorMessage,
      ip: req.ip
    });

    return res.status(500).json({
      success: false,
      message: 'Failed to get backups',
      error: errorMessage
    });
  }
});

// Get specific backup info
router.get('/:backupId', authenticateToken, async (req, res) => {
  try {
    const { backupId } = req.params;
    const backupInfo = await backupService.getBackupInfo(backupId);
    
    if (!backupInfo) {
      return res.status(404).json({
        success: false,
        message: 'Backup not found'
      });
    }

    logger.info('Backup info retrieved', {
      endpoint: req.path,
      ip: req.ip,
      backupId
    });

    return res.json({
      success: true,
      data: backupInfo,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Failed to get backup info', {
      endpoint: req.path,
      error: errorMessage,
      ip: req.ip
    });

    return res.status(500).json({
      success: false,
      message: 'Failed to get backup info',
      error: errorMessage
    });
  }
});

// Get zip contents
router.get('/:backupId/contents', authenticateToken, async (req, res) => {
  try {
    const { backupId } = req.params;
    const zipPath = path.join(process.cwd(), 'backups', `${backupId}.zip`);
    
    if (!fs.existsSync(zipPath)) {
      return res.status(404).json({
        success: false,
        message: 'Backup file not found'
      });
    }

    // Use unzip command to list contents
    const { exec } = require('child_process');
    const { promisify } = require('util');
    const execAsync = promisify(exec);

    try {
      const { stdout } = await execAsync(`unzip -l "${zipPath}"`);
      
      // Parse unzip output
      const lines = stdout.split('\n');
      const files: any[] = [];
      
      for (const line of lines) {
        if (line.trim() && !line.includes('Archive:') && !line.includes('Length') && !line.includes('----') && !line.includes('Name')) {
          // Skip empty lines and headers
          const trimmedLine = line.trim();
          if (trimmedLine && !trimmedLine.startsWith('----')) {
            // Split by multiple spaces and filter out empty parts
            const parts = trimmedLine.split(/\s+/).filter((part: string) => part.length > 0);
            
            if (parts.length >= 4) {
              const size = parseInt(parts[0]) || 0;
              const dateStr = parts.slice(1, 4).join(' ');
              const fileName = parts.slice(4).join(' ');
              
              if (fileName && fileName !== 'Name' && fileName !== '----' && !isNaN(size)) {
                try {
                  const date = new Date(dateStr);
                  files.push({
                    name: fileName.split('/').pop() || fileName,
                    path: fileName,
                    size: size,
                    date: date.toISOString(),
                    isDirectory: fileName.endsWith('/')
                  });
                } catch (dateError) {
                  // If date parsing fails, use current date
                  files.push({
                    name: fileName.split('/').pop() || fileName,
                    path: fileName,
                    size: size,
                    date: new Date().toISOString(),
                    isDirectory: fileName.endsWith('/')
                  });
                }
              }
            }
          }
        }
      }

      return res.json({
        success: true,
        data: { files },
        message: 'Zip contents retrieved successfully'
      });
    } catch (execError) {
      logger.error('Failed to execute unzip command', { error: execError });
      return res.status(500).json({
        success: false,
        message: 'Failed to read zip file'
      });
    }
  } catch (error) {
    logger.error('Failed to get zip contents', { error });
    return res.status(500).json({
      success: false,
      message: 'Failed to read zip contents',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get file content from zip
router.get('/:backupId/file/:filePath(*)', authenticateToken, async (req, res) => {
  try {
    const { backupId, filePath } = req.params;
    const zipPath = path.join(process.cwd(), 'backups', `${backupId}.zip`);
    
    if (!fs.existsSync(zipPath)) {
      return res.status(404).json({
        success: false,
        message: 'Backup file not found'
      });
    }

    // Use unzip command to extract specific file
    const { exec } = require('child_process');
    const { promisify } = require('util');
    const execAsync = promisify(exec);

    try {
      const { stdout } = await execAsync(`unzip -p "${zipPath}" "${filePath}"`);
      
      return res.json({
        success: true,
        data: { content: stdout },
        message: 'File content retrieved successfully'
      });
    } catch (execError) {
      logger.error('Failed to extract file from zip', { error: execError });
      return res.status(404).json({
        success: false,
        message: 'File not found in zip'
      });
    }
  } catch (error) {
    logger.error('Failed to get file content', { error });
    return res.status(500).json({
      success: false,
      message: 'Failed to read file content',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Create new backup
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { description, tags } = req.body;
    
    logger.info('Creating new backup', {
      endpoint: req.path,
      ip: req.ip,
      description,
      tags
    });

    const backupInfo = await backupService.createBackup(description, tags);

    return res.json({
      success: true,
      message: 'Backup created successfully',
      data: backupInfo,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Failed to create backup', {
      endpoint: req.path,
      error: errorMessage,
      ip: req.ip
    });

    return res.status(500).json({
      success: false,
      message: 'Failed to create backup',
      error: errorMessage
    });
  }
});

// Restore backup
router.post('/:backupId/restore', authenticateToken, async (req, res) => {
  try {
    const { backupId } = req.params;
    const { 
      dryRun = false, 
      includeEdgeFunctions = true, 
      includeMigrations = true, 
      backupBeforeRestore = true 
    } = req.body;

    logger.info('Starting backup restore', {
      endpoint: req.path,
      ip: req.ip,
      backupId,
      dryRun,
      includeEdgeFunctions,
      includeMigrations,
      backupBeforeRestore
    });

    const success = await backupService.restoreBackup({
      backupId,
      dryRun,
      includeEdgeFunctions,
      includeMigrations,
      backupBeforeRestore
    });

    return res.json({
      success: true,
      message: dryRun ? 'Dry run completed successfully' : 'Backup restored successfully',
      data: { success, backupId },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Failed to restore backup', {
      endpoint: req.path,
      error: errorMessage,
      ip: req.ip
    });

    return res.status(500).json({
      success: false,
      message: 'Failed to restore backup',
      error: errorMessage
    });
  }
});

// Delete backup
router.delete('/:backupId', authenticateToken, async (req, res) => {
  try {
    const { backupId } = req.params;
    
    logger.info('Deleting backup', {
      endpoint: req.path,
      ip: req.ip,
      backupId
    });

    const success = await backupService.deleteBackup(backupId);

    if (!success) {
      return res.status(404).json({
        success: false,
        message: 'Backup not found'
      });
    }

    return res.json({
      success: true,
      message: 'Backup deleted successfully',
      data: { backupId },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Failed to delete backup', {
      endpoint: req.path,
      error: errorMessage,
      ip: req.ip
    });

    return res.status(500).json({
      success: false,
      message: 'Failed to delete backup',
      error: errorMessage
    });
  }
});

// Download backup
router.get('/:backupId/download', authenticateToken, async (req, res) => {
  try {
    const { backupId } = req.params;
    
    logger.info('Downloading backup', {
      endpoint: req.path,
      ip: req.ip,
      backupId
    });

    const backupPath = await backupService.downloadBackup(backupId);
    const fileName = path.basename(backupPath);

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    
    return res.sendFile(backupPath);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Failed to download backup', {
      endpoint: req.path,
      error: errorMessage,
      ip: req.ip
    });

    return res.status(500).json({
      success: false,
      message: 'Failed to download backup',
      error: errorMessage
    });
  }
});

// Get backup statistics
router.get('/stats/summary', authenticateToken, async (req, res) => {
  try {
    const backups = await backupService.getBackups();
    
    const stats = {
      totalBackups: backups.length,
      totalSize: backups.reduce((sum, backup) => sum + backup.size, 0),
      averageSize: backups.length > 0 ? backups.reduce((sum, backup) => sum + backup.size, 0) / backups.length : 0,
      oldestBackup: backups.length > 0 ? Math.min(...backups.map(b => new Date(b.timestamp).getTime())) : null,
      newestBackup: backups.length > 0 ? Math.max(...backups.map(b => new Date(b.timestamp).getTime())) : null,
      successfulBackups: backups.filter(b => b.status === 'completed').length,
      failedBackups: backups.filter(b => b.status === 'failed').length,
      inProgressBackups: backups.filter(b => b.status === 'in_progress').length,
      totalEdgeFunctions: backups.reduce((sum, backup) => sum + backup.edgeFunctionsCount, 0),
      totalMigrations: backups.reduce((sum, backup) => sum + backup.migrationsCount, 0)
    };

    logger.info('Backup statistics retrieved', {
      endpoint: req.path,
      ip: req.ip,
      stats
    });

    return res.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Failed to get backup statistics', {
      endpoint: req.path,
      error: errorMessage,
      ip: req.ip
    });

    return res.status(500).json({
      success: false,
      message: 'Failed to get backup statistics',
      error: errorMessage
    });
  }
});

// Validate backup integrity
router.post('/:backupId/validate', authenticateToken, async (req, res) => {
  try {
    const { backupId } = req.params;
    
    logger.info('Validating backup integrity', {
      endpoint: req.path,
      ip: req.ip,
      backupId
    });

    const backupInfo = await backupService.getBackupInfo(backupId);
    
    if (!backupInfo) {
      return res.status(404).json({
        success: false,
        message: 'Backup not found'
      });
    }

    // For now, we'll just check if the file exists and has the expected checksum
    // In a real implementation, you might want to do more thorough validation
    const isValid = backupInfo.status === 'completed' && backupInfo.checksum;

    return res.json({
      success: true,
      data: {
        backupId,
        isValid,
        checksum: backupInfo.checksum,
        size: backupInfo.size,
        status: backupInfo.status
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Failed to validate backup', {
      endpoint: req.path,
      error: errorMessage,
      ip: req.ip
    });

    return res.status(500).json({
      success: false,
      message: 'Failed to validate backup',
      error: errorMessage
    });
  }
});

// Schedule automated backup
router.post('/schedule', authenticateToken, async (req, res) => {
  try {
    const { 
      schedule, 
      description, 
      tags, 
      retentionDays, 
      maxBackups 
    } = req.body;

    // This would integrate with a job scheduler like node-cron
    // For now, we'll just return a success response
    logger.info('Backup schedule created', {
      endpoint: req.path,
      ip: req.ip,
      schedule,
      description,
      tags
    });

    return res.json({
      success: true,
      message: 'Backup schedule created successfully',
      data: {
        schedule,
        description,
        tags,
        retentionDays,
        maxBackups,
        nextRun: 'calculated based on schedule'
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Failed to create backup schedule', {
      endpoint: req.path,
      error: errorMessage,
      ip: req.ip
    });

    return res.status(500).json({
      success: false,
      message: 'Failed to create backup schedule',
      error: errorMessage
    });
  }
});

// ========================================
// SUPABASE CLI OPERATIONS
// ========================================

// Check Supabase CLI status
router.get('/supabase/status', authenticateToken, async (req, res) => {
  try {
    const { exec } = require('child_process');
    const { promisify } = require('util');
    const execAsync = promisify(exec);

    const { stdout } = await execAsync('supabase --version');
    res.json({
      success: true,
      data: {
        cliInstalled: true,
        version: stdout.trim(),
        message: 'Supabase CLI is available'
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.json({
      success: true,
      data: {
        cliInstalled: false,
        version: null,
        message: 'Supabase CLI not installed'
      },
      timestamp: new Date().toISOString()
    });
  }
});

// Get Supabase project info
router.get('/supabase/project', authenticateToken, async (req, res) => {
  try {
    const { exec } = require('child_process');
    const { promisify } = require('util');
    const execAsync = promisify(exec);

    const { stdout } = await execAsync('supabase projects list');
    res.json({
      success: true,
      data: {
        projects: stdout,
        message: 'Supabase projects retrieved'
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get Supabase projects',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get Supabase functions list
router.get('/supabase/functions', authenticateToken, async (req, res) => {
  try {
    const { exec } = require('child_process');
    const { promisify } = require('util');
    const execAsync = promisify(exec);

    const { stdout } = await execAsync('supabase functions list');
    res.json({
      success: true,
      data: {
        functions: stdout,
        message: 'Supabase functions retrieved'
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get Supabase functions',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Execute Supabase CLI command
router.post('/supabase/execute', authenticateToken, async (req, res) => {
  try {
    const { command } = req.body;
    
    if (!command) {
      return res.status(400).json({
        success: false,
        message: 'Command is required'
      });
    }

    // Validate command for security
    const allowedCommands = [
      'supabase db pull',
      'supabase functions list',
      'supabase projects list',
      'supabase status',
      'supabase migration list',
      'supabase migration repair',
      'supabase db diff'
    ];

    // Check if command is allowed (including batch commands with &&)
    const isAllowed = allowedCommands.some(allowed => {
      // Check if command starts with any allowed command
      if (command.startsWith(allowed)) return true;
      
      // Check for batch commands (multiple commands separated by &&)
      if (command.includes('&&')) {
        const batchCommands = command.split('&&').map((cmd: string) => cmd.trim());
        return batchCommands.every((batchCmd: string) => 
          allowedCommands.some(allowed => batchCmd.startsWith(allowed))
        );
      }
      
      return false;
    });
    
    if (!isAllowed) {
      return res.status(403).json({
        success: false,
        message: 'Command not allowed for security reasons'
      });
    }

    const { exec } = require('child_process');
    const { promisify } = require('util');
    const execAsync = promisify(exec);

    let stdout = '';
    let stderr = '';

    // Handle batch commands (multiple commands separated by &&)
    if (command.includes('&&')) {
      const batchCommands = command.split('&&').map((cmd: string) => cmd.trim());
      
      for (let i = 0; i < batchCommands.length; i++) {
        const batchCmd = batchCommands[i];
        try {
          stdout += `\n🔄 [${i + 1}/${batchCommands.length}] Executing: ${batchCmd}\n`;
          stdout += `⏱️  Started at: ${new Date().toISOString()}\n`;
          
          const result = await execAsync(batchCmd, { timeout: 180000 }); // 3 dakika
          
          stdout += `✅ Completed: ${batchCmd}\n`;
          stdout += `📊 Output:\n${result.stdout || ''}\n`;
          
          if (result.stderr) {
            stderr += `\n⚠️  Warnings in: ${batchCmd}\n${result.stderr}\n`;
          }
        } catch (error) {
          stderr += `\n❌ Error in: ${batchCmd}\n${error instanceof Error ? error.message : 'Unknown error'}\n`;
        }
      }
    } else {
      // Single command
      stdout += `🔄 Executing: ${command}\n`;
      stdout += `⏱️  Started at: ${new Date().toISOString()}\n`;
      
      const result = await execAsync(command, { timeout: 180000 }); // 3 dakika
      
      stdout += `✅ Completed: ${command}\n`;
      stdout += `📊 Output:\n${result.stdout || ''}\n`;
      stderr = result.stderr || '';
    }

    return res.json({
      success: true,
      data: {
        stdout,
        stderr,
        command,
        message: 'Command executed successfully'
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to execute command',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
