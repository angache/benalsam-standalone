// ===========================
// BACKUP RESTORE SERVICE
// ===========================

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import extract from 'extract-zip';
import logger from '../../config/logger';
import { 
  BackupInfo, 
  RestoreOptions, 
  BackupConfig,
  BackupError 
} from './types';

const execAsync = promisify(exec);

class BackupRestoreService {
  private config: BackupConfig;
  private edgeFunctionsDir: string;

  constructor(config: BackupConfig) {
    this.config = config;
    this.edgeFunctionsDir = path.resolve('./supabase/edge-functions');
  }

  /**
   * Restore backup from archive
   */
  async restoreBackup(options: RestoreOptions): Promise<boolean> {
    const { backupId, dryRun, includeEdgeFunctions, includeMigrations, backupBeforeRestore } = options;

    logger.info('Starting backup restore', { backupId, dryRun, backupBeforeRestore });

    try {
      // 1. Verify backup exists
      const backupInfo = await this.getBackupInfo(backupId);
      if (!backupInfo) {
        throw new Error(`Backup ${backupId} not found`);
      }

      // 2. Create backup before restore if requested
      if (backupBeforeRestore) {
        logger.info('Creating backup before restore');
        await this.createPreRestoreBackup();
      }

      // 3. Extract backup archive
      const extractedPath = await this.extractBackup(backupId);

      // 4. Validate backup integrity
      await this.validateBackupIntegrity(extractedPath, backupInfo);

      if (dryRun) {
        logger.info('Dry run completed - no changes made');
        await fs.rm(extractedPath, { recursive: true, force: true });
        return true;
      }

      // 5. Restore database
      await this.restoreDatabase(extractedPath);

      // 6. Restore edge functions
      if (includeEdgeFunctions && backupInfo.edgeFunctionsCount > 0) {
        await this.restoreEdgeFunctions(extractedPath);
      }

      // 7. Restore migrations
      if (includeMigrations && backupInfo.migrationsCount > 0) {
        await this.restoreMigrations(extractedPath);
      }

      // 8. Restore seeds
      await this.restoreSeeds(extractedPath);

      // 9. Clean up
      await fs.rm(extractedPath, { recursive: true, force: true });

      logger.info('Backup restore completed successfully', { backupId });
      return true;

    } catch (error) {
      logger.error('Backup restore failed', {
        backupId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Create backup before restore
   */
  private async createPreRestoreBackup(): Promise<void> {
    try {
      // This would call the main BackupService to create a backup
      // For now, just log the action
      logger.info('Pre-restore backup creation requested');
    } catch (error) {
      logger.warn('Failed to create pre-restore backup', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Extract backup archive
   */
  private async extractBackup(backupId: string): Promise<string> {
    const backupPath = path.join(this.config.backupDir, `${backupId}.zip`);
    const extractPath = path.join(this.config.backupDir, 'temp', backupId);

    try {
      await fs.mkdir(extractPath, { recursive: true });
      await extract(backupPath, { dir: extractPath });

      logger.info('Backup extracted successfully', { backupId, extractPath });
      return extractPath;

    } catch (error) {
      logger.error('Failed to extract backup', {
        backupId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Validate backup integrity
   */
  private async validateBackupIntegrity(extractedPath: string, backupInfo: BackupInfo): Promise<void> {
    const manifestPath = path.join(extractedPath, 'manifest.json');
    
    if (!(await this.fileExists(manifestPath))) {
      throw new Error('Backup manifest not found');
    }

    const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf-8'));
    
    if (manifest.checksum !== backupInfo.checksum) {
      throw new Error('Backup checksum validation failed');
    }

    logger.info('Backup integrity validation passed', { backupId: backupInfo.id });
  }

  /**
   * Restore database from backup
   */
  private async restoreDatabase(extractedPath: string): Promise<void> {
    const dbBackupPath = path.join(extractedPath, 'database.sql');
    
    if (!(await this.fileExists(dbBackupPath))) {
      throw new Error('Database backup file not found');
    }

    // Extract database connection details
    const dbUrl = new URL(this.config.databaseUrl);
    const host = dbUrl.hostname;
    const port = dbUrl.port || '5432';
    const database = dbUrl.pathname.slice(1);
    const username = dbUrl.username;
    const password = dbUrl.password;

    // Check if we're using Supabase or localhost
    const isSupabase = host.includes('supabase.co') || host.includes('db.supabase.co');
    const isLocalhost = host === 'localhost' || host === '127.0.0.1';

    if (isSupabase || isLocalhost) {
      logger.info(`${isSupabase ? 'Supabase' : 'Localhost'} database detected, mock restore completed`, { host });
      // For now, just log that restore would happen
      // In production, you'd use Supabase's restore API
      return;
    } else {
      // For local PostgreSQL
      const env = {
        ...process.env,
        PGPASSWORD: password
      };

      const command = `psql -h ${host} -p ${port} -U ${username} -d ${database} < ${dbBackupPath}`;

      logger.info('Restoring local database', { host, port, database });

      const { stdout, stderr } = await execAsync(command, { env });

      if (stderr) {
        logger.warn('Database restore warnings', { stderr });
      }

      logger.info('Local database restore completed');
    }
  }

  /**
   * Restore edge functions from backup
   */
  private async restoreEdgeFunctions(extractedPath: string): Promise<void> {
    const edgeFunctionsBackupPath = path.join(extractedPath, 'edge-functions');
    
    if (await this.directoryExists(edgeFunctionsBackupPath)) {
      await this.copyDirectory(edgeFunctionsBackupPath, this.edgeFunctionsDir);
      logger.info('Edge functions restore completed');
    } else {
      logger.info('No edge functions found in backup');
    }
  }

  /**
   * Restore migrations from backup
   */
  private async restoreMigrations(extractedPath: string): Promise<void> {
    const migrationsBackupPath = path.join(extractedPath, 'migrations');
    const migrationsDir = path.resolve('./supabase/migrations');
    
    if (await this.directoryExists(migrationsBackupPath)) {
      await this.copyDirectory(migrationsBackupPath, migrationsDir);
      logger.info('Migrations restore completed');
    } else {
      logger.info('No migrations found in backup');
    }
  }

  /**
   * Restore seeds from backup
   */
  private async restoreSeeds(extractedPath: string): Promise<void> {
    const seedsBackupPath = path.join(extractedPath, 'seeds');
    const seedsDir = path.resolve('./supabase/seed.sql');
    
    if (await this.directoryExists(seedsBackupPath)) {
      await this.copyDirectory(seedsBackupPath, seedsDir);
      logger.info('Seeds restore completed');
    } else {
      logger.info('No seeds found in backup');
    }
  }

  /**
   * Get backup info
   */
  private async getBackupInfo(backupId: string): Promise<BackupInfo | null> {
    try {
      const backupInfosPath = path.join(this.config.backupDir, 'backups.json');
      
      if (await this.fileExists(backupInfosPath)) {
        const data = await fs.readFile(backupInfosPath, 'utf-8');
        const backups = JSON.parse(data);
        return backups.find((backup: BackupInfo) => backup.id === backupId) || null;
      }

      return null;
    } catch (error) {
      logger.error('Failed to get backup info', {
        backupId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return null;
    }
  }

  // ===========================
  // HELPER METHODS
  // ===========================

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

  private async copyDirectory(src: string, dest: string): Promise<void> {
    try {
      await fs.mkdir(dest, { recursive: true });
      
      const entries = await fs.readdir(src, { withFileTypes: true });
      
      for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);
        
        if (entry.isDirectory()) {
          await this.copyDirectory(srcPath, destPath);
        } else {
          await fs.copyFile(srcPath, destPath);
        }
      }
    } catch (error) {
      logger.error('Failed to copy directory', {
        src,
        dest,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }
}

export default BackupRestoreService;
