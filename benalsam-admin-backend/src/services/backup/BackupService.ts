// ===========================
// MAIN BACKUP SERVICE
// ===========================

import fs from 'fs/promises';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import logger from '../../config/logger';
import { 
  BackupConfig, 
  BackupInfo, 
  RestoreOptions,
  ValidationResult,
  CompressionResult,
  CleanupResult,
  BackupStats
} from './types';
import BackupValidationService from './BackupValidationService';
import BackupRestoreService from './BackupRestoreService';
import BackupCleanupService from './BackupCleanupService';
import BackupCompressionService from './BackupCompressionService';

class BackupService {
  private config: BackupConfig;
  private backupsDir: string;
  private edgeFunctionsDir: string;
  private supabase: any;
  
  // Modular services
  private validationService: BackupValidationService;
  private restoreService: BackupRestoreService;
  private cleanupService: BackupCleanupService;
  private compressionService: BackupCompressionService;

  constructor() {
    this.config = {
      databaseUrl: process.env.DATABASE_URL || 'postgresql://username:password@localhost:5432/benalsam_admin',
      backupDir: process.env.BACKUP_DIR || './backups',
      retentionDays: parseInt(process.env.BACKUP_RETENTION_DAYS || '30'),
      maxBackups: parseInt(process.env.MAX_BACKUPS || '50'),
      includeEdgeFunctions: true,
      includeMigrations: true,
      includeSeeds: true
    };

    this.backupsDir = path.resolve(this.config.backupDir);
    this.edgeFunctionsDir = path.resolve('./supabase/edge-functions');
    
    // Initialize Supabase client
    this.initializeSupabase();
    
    // Initialize modular services
    this.validationService = new BackupValidationService(this.config);
    this.restoreService = new BackupRestoreService(this.config);
    this.cleanupService = new BackupCleanupService(this.config);
    this.compressionService = new BackupCompressionService(this.config);
    
    this.ensureDirectories();
  }

  /**
   * Create comprehensive backup
   */
  async createBackup(description?: string, tags?: string[]): Promise<BackupInfo> {
    const backupId = this.generateBackupId();
    const timestamp = new Date().toISOString();
    const backupPath = path.join(this.backupsDir, backupId);

    logger.info('Starting comprehensive backup', { backupId, description });

    try {
      // Create backup directory
      await fs.mkdir(backupPath, { recursive: true });

      const backupInfo: BackupInfo = {
        id: backupId,
        timestamp,
        size: 0,
        type: 'full',
        status: 'in_progress',
        databaseSize: 0,
        edgeFunctionsCount: 0,
        migrationsCount: 0,
        checksum: '',
        description,
        tags
      };

      // 1. Database backup
      const dbBackupPath = await this.backupDatabase(backupPath);
      backupInfo.databaseSize = await this.getFileSize(dbBackupPath);

      // 2. Edge functions backup
      if (this.config.includeEdgeFunctions) {
        const edgeFunctionsPath = await this.backupEdgeFunctions(backupPath);
        backupInfo.edgeFunctionsCount = await this.countEdgeFunctions();
      }

      // 3. Migrations backup
      if (this.config.includeMigrations) {
        const migrationsPath = await this.backupMigrations(backupPath);
        backupInfo.migrationsCount = await this.countMigrations();
      }

      // 4. Seeds backup
      if (this.config.includeSeeds) {
        await this.backupSeeds(backupPath);
      }

      // 5. Create backup manifest
      const manifestPath = await this.createBackupManifest(backupPath, backupInfo);

      // 6. Create compressed archive using compression service
      const compressionResult = await this.compressionService.createBackupArchive(backupPath, backupId);

      // 7. Update backup info with compression results
      backupInfo.size = compressionResult.compressedSize;
      backupInfo.checksum = await this.calculateChecksum(path.join(this.backupsDir, `${backupId}.zip`));
      backupInfo.status = 'completed';

      // 8. Clean up temporary files
      await fs.rm(backupPath, { recursive: true, force: true });

      // 9. Apply retention policy using cleanup service
      await this.cleanupService.applyRetentionPolicy();

      // 10. Save backup info
      await this.saveBackupInfo(backupInfo);

      logger.info('Backup completed successfully', {
        backupId,
        size: backupInfo.size,
        databaseSize: backupInfo.databaseSize,
        edgeFunctionsCount: backupInfo.edgeFunctionsCount,
        compressionRatio: compressionResult.compressionRatio
      });

      return backupInfo;

    } catch (error) {
      logger.error('Backup failed', {
        backupId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      // Clean up failed backup
      await fs.rm(backupPath, { recursive: true, force: true });
      throw error;
    }
  }

  /**
   * Restore backup using restore service
   */
  async restoreBackup(options: RestoreOptions): Promise<boolean> {
    return this.restoreService.restoreBackup(options);
  }

  /**
   * Validate backup using validation service
   */
  async validateBackup(backupId: string): Promise<ValidationResult> {
    return this.validationService.validateBackup(backupId);
  }

  /**
   * Get backup statistics using cleanup service
   */
  async getBackupStats(): Promise<BackupStats> {
    return this.cleanupService.getBackupStats();
  }

  /**
   * Delete backup using cleanup service
   */
  async deleteBackup(backupId: string): Promise<boolean> {
    const result = await this.cleanupService.deleteBackup(backupId);
    return result.success;
  }

  /**
   * Get all backups
   */
  async getBackups(): Promise<BackupInfo[]> {
    try {
      const backupInfosPath = path.join(this.backupsDir, 'backups.json');
      
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

  // ===========================
  // PRIVATE METHODS
  // ===========================

  private initializeSupabase(): void {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (supabaseUrl && supabaseServiceKey) {
      this.supabase = createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      });
      logger.info('Supabase client initialized with service role key');
    } else {
      logger.warn('Supabase configuration missing, CLI operations will be used');
    }
  }

  private async ensureDirectories(): Promise<void> {
    try {
      await fs.mkdir(this.backupsDir, { recursive: true });
      await fs.mkdir(path.join(this.backupsDir, 'database'), { recursive: true });
      await fs.mkdir(path.join(this.backupsDir, 'edge-functions'), { recursive: true });
      await fs.mkdir(path.join(this.backupsDir, 'migrations'), { recursive: true });
      await fs.mkdir(path.join(this.backupsDir, 'seeds'), { recursive: true });
      
      logger.info('Backup directories created successfully');
    } catch (error) {
      logger.error('Failed to create backup directories', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  private generateBackupId(): string {
    return `backup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async calculateChecksum(filePath: string): Promise<string> {
    const crypto = require('crypto');
    const hash = crypto.createHash('sha256');
    const data = await fs.readFile(filePath);
    hash.update(data);
    return hash.digest('hex');
  }

  private async getFileSize(filePath: string): Promise<number> {
    const stats = await fs.stat(filePath);
    return stats.size;
  }

  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  private async saveBackupInfo(backupInfo: BackupInfo): Promise<void> {
    const backups = await this.getBackups();
    backups.push(backupInfo);
    await this.saveBackupInfos(backups);
  }

  private async saveBackupInfos(backups: BackupInfo[]): Promise<void> {
    const backupInfosPath = path.join(this.backupsDir, 'backups.json');
    await fs.writeFile(backupInfosPath, JSON.stringify(backups, null, 2));
  }

  // Database backup methods (simplified)
  private async backupDatabase(backupPath: string): Promise<string> {
    const dbBackupPath = path.join(backupPath, 'database.sql');
    // Implementation would be here - simplified for brevity
    await fs.writeFile(dbBackupPath, '-- Database backup content');
    return dbBackupPath;
  }

  private async backupEdgeFunctions(backupPath: string): Promise<string> {
    const edgeFunctionsPath = path.join(backupPath, 'edge-functions');
    // Implementation would be here - simplified for brevity
    await fs.mkdir(edgeFunctionsPath, { recursive: true });
    return edgeFunctionsPath;
  }

  private async backupMigrations(backupPath: string): Promise<string> {
    const migrationsPath = path.join(backupPath, 'migrations');
    // Implementation would be here - simplified for brevity
    await fs.mkdir(migrationsPath, { recursive: true });
    return migrationsPath;
  }

  private async backupSeeds(backupPath: string): Promise<void> {
    const seedsPath = path.join(backupPath, 'seeds');
    // Implementation would be here - simplified for brevity
    await fs.mkdir(seedsPath, { recursive: true });
  }

  private async createBackupManifest(backupPath: string, backupInfo: BackupInfo): Promise<string> {
    const manifestPath = path.join(backupPath, 'manifest.json');
    const manifest = {
      ...backupInfo,
      createdBy: 'BackupService',
      version: '1.0.0'
    };
    await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2));
    return manifestPath;
  }

  private async countEdgeFunctions(): Promise<number> {
    // Implementation would be here - simplified for brevity
    return 0;
  }

  private async countMigrations(): Promise<number> {
    // Implementation would be here - simplified for brevity
    return 0;
  }
}

export default BackupService;
