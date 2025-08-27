// ===========================
// BACKUP CLEANUP SERVICE
// ===========================

import fs from 'fs/promises';
import path from 'path';
import logger from '../../config/logger';
import { 
  BackupInfo, 
  CleanupResult, 
  BackupConfig,
  BackupStats 
} from './types';

class BackupCleanupService {
  private config: BackupConfig;

  constructor(config: BackupConfig) {
    this.config = config;
  }

  /**
   * Apply retention policy and cleanup old backups
   */
  async applyRetentionPolicy(): Promise<CleanupResult> {
    const result: CleanupResult = {
      deletedBackups: 0,
      freedSpace: 0,
      errors: [],
      success: true
    };

    try {
      logger.info('Starting retention policy cleanup');

      const backups = await this.getBackups();
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.config.retentionDays);

      // Delete backups older than retention period
      const oldBackups = backups.filter(backup => 
        new Date(backup.timestamp) < cutoffDate
      );

      for (const backup of oldBackups) {
        const deleteResult = await this.deleteBackup(backup.id);
        if (deleteResult.success) {
          result.deletedBackups++;
          result.freedSpace += backup.size;
        } else {
          result.errors.push(`Failed to delete backup ${backup.id}: ${deleteResult.error}`);
        }
      }

      // Limit total number of backups
      if (backups.length > this.config.maxBackups) {
        const sortedBackups = backups.sort((a, b) => 
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );

        const backupsToRemove = sortedBackups.slice(0, backups.length - this.config.maxBackups);
        
        for (const backup of backupsToRemove) {
          const deleteResult = await this.deleteBackup(backup.id);
          if (deleteResult.success) {
            result.deletedBackups++;
            result.freedSpace += backup.size;
          } else {
            result.errors.push(`Failed to delete backup ${backup.id}: ${deleteResult.error}`);
          }
        }
      }

      logger.info('Retention policy cleanup completed', {
        deletedBackups: result.deletedBackups,
        freedSpace: result.freedSpace,
        errors: result.errors.length
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown cleanup error';
      result.errors.push(errorMessage);
      result.success = false;
      
      logger.error('Retention policy cleanup failed', { error: errorMessage });
    }

    return result;
  }

  /**
   * Delete specific backup
   */
  async deleteBackup(backupId: string): Promise<{ success: boolean, error?: string }> {
    try {
      const backupPath = path.join(this.config.backupDir, `${backupId}.zip`);
      
      if (await this.fileExists(backupPath)) {
        // Get backup size before deletion
        const stats = await fs.stat(backupPath);
        const size = stats.size;

        // Delete backup file
        await fs.unlink(backupPath);
        
        // Remove from backup info
        const backups = await this.getBackups();
        const filteredBackups = backups.filter(backup => backup.id !== backupId);
        await this.saveBackupInfos(filteredBackups);
        
        logger.info('Backup deleted successfully', { backupId, size });
        return { success: true };
      }

      return { success: false, error: 'Backup file not found' };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to delete backup', { backupId, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Clean up temporary files
   */
  async cleanupTempFiles(): Promise<CleanupResult> {
    const result: CleanupResult = {
      deletedBackups: 0,
      freedSpace: 0,
      errors: [],
      success: true
    };

    try {
      const tempDir = path.join(this.config.backupDir, 'temp');
      
      if (await this.directoryExists(tempDir)) {
        const entries = await fs.readdir(tempDir, { withFileTypes: true });
        
        for (const entry of entries) {
          const entryPath = path.join(tempDir, entry.name);
          
          try {
            if (entry.isDirectory()) {
              await fs.rm(entryPath, { recursive: true, force: true });
            } else {
              const stats = await fs.stat(entryPath);
              await fs.unlink(entryPath);
              result.freedSpace += stats.size;
            }
            result.deletedBackups++;
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            result.errors.push(`Failed to delete ${entry.name}: ${errorMessage}`);
          }
        }

        logger.info('Temp files cleanup completed', {
          deletedFiles: result.deletedBackups,
          freedSpace: result.freedSpace
        });
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown cleanup error';
      result.errors.push(errorMessage);
      result.success = false;
      
      logger.error('Temp files cleanup failed', { error: errorMessage });
    }

    return result;
  }

  /**
   * Get backup statistics
   */
  async getBackupStats(): Promise<BackupStats> {
    try {
      const backups = await this.getBackups();
      
      if (backups.length === 0) {
        return {
          totalBackups: 0,
          totalSize: 0,
          averageSize: 0,
          oldestBackup: null,
          newestBackup: null,
          successfulBackups: 0,
          failedBackups: 0,
          inProgressBackups: 0,
          totalEdgeFunctions: 0,
          totalMigrations: 0
        };
      }

      const totalSize = backups.reduce((sum, backup) => sum + backup.size, 0);
      const averageSize = totalSize / backups.length;
      
      const timestamps = backups.map(backup => new Date(backup.timestamp).getTime());
      const oldestBackup = Math.min(...timestamps);
      const newestBackup = Math.max(...timestamps);

      const successfulBackups = backups.filter(backup => backup.status === 'completed').length;
      const failedBackups = backups.filter(backup => backup.status === 'failed').length;
      const inProgressBackups = backups.filter(backup => backup.status === 'in_progress').length;

      const totalEdgeFunctions = backups.reduce((sum, backup) => sum + backup.edgeFunctionsCount, 0);
      const totalMigrations = backups.reduce((sum, backup) => sum + backup.migrationsCount, 0);

      return {
        totalBackups: backups.length,
        totalSize,
        averageSize,
        oldestBackup,
        newestBackup,
        successfulBackups,
        failedBackups,
        inProgressBackups,
        totalEdgeFunctions,
        totalMigrations
      };

    } catch (error) {
      logger.error('Failed to get backup stats', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      return {
        totalBackups: 0,
        totalSize: 0,
        averageSize: 0,
        oldestBackup: null,
        newestBackup: null,
        successfulBackups: 0,
        failedBackups: 0,
        inProgressBackups: 0,
        totalEdgeFunctions: 0,
        totalMigrations: 0
      };
    }
  }

  /**
   * Clean up old backup files based on age
   */
  async cleanupOldBackups(maxAgeDays: number): Promise<CleanupResult> {
    const result: CleanupResult = {
      deletedBackups: 0,
      freedSpace: 0,
      errors: [],
      success: true
    };

    try {
      const backups = await this.getBackups();
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - maxAgeDays);

      const oldBackups = backups.filter(backup => 
        new Date(backup.timestamp) < cutoffDate
      );

      for (const backup of oldBackups) {
        const deleteResult = await this.deleteBackup(backup.id);
        if (deleteResult.success) {
          result.deletedBackups++;
          result.freedSpace += backup.size;
        } else {
          result.errors.push(`Failed to delete backup ${backup.id}: ${deleteResult.error}`);
        }
      }

      logger.info('Old backups cleanup completed', {
        maxAgeDays,
        deletedBackups: result.deletedBackups,
        freedSpace: result.freedSpace
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown cleanup error';
      result.errors.push(errorMessage);
      result.success = false;
      
      logger.error('Old backups cleanup failed', { error: errorMessage });
    }

    return result;
  }

  // ===========================
  // HELPER METHODS
  // ===========================

  private async getBackups(): Promise<BackupInfo[]> {
    try {
      const backupInfosPath = path.join(this.config.backupDir, 'backups.json');
      
      if (await this.fileExists(backupInfosPath)) {
        const data = await fs.readFile(backupInfosPath, 'utf-8');
        return JSON.parse(data);
      }

      return [];
    } catch (error) {
      logger.error('Failed to get backups', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return [];
    }
  }

  private async saveBackupInfos(backups: BackupInfo[]): Promise<void> {
    try {
      const backupInfosPath = path.join(this.config.backupDir, 'backups.json');
      await fs.writeFile(backupInfosPath, JSON.stringify(backups, null, 2));
    } catch (error) {
      logger.error('Failed to save backup infos', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  private async directoryExists(dirPath: string): Promise<boolean> {
    try {
      const stat = await fs.stat(dirPath);
      return stat.isDirectory();
    } catch {
      return false;
    }
  }
}

export default BackupCleanupService;
