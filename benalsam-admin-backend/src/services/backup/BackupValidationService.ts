// ===========================
// BACKUP VALIDATION SERVICE
// ===========================

import fs from 'fs/promises';
import path from 'path';
import { createHash } from 'crypto';
import logger from '../../config/logger';
import { 
  BackupInfo, 
  ValidationResult, 
  BackupConfig,
  BackupError 
} from './types';

class BackupValidationService {
  private config: BackupConfig;

  constructor(config: BackupConfig) {
    this.config = config;
  }

  /**
   * Validate backup integrity and structure
   */
  async validateBackup(backupId: string): Promise<ValidationResult> {
    const backupPath = path.join(this.config.backupDir, `${backupId}.zip`);
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      logger.info('Starting backup validation', { backupId });

      // 1. Check if backup file exists
      if (!(await this.fileExists(backupPath))) {
        errors.push(`Backup file not found: ${backupPath}`);
        return this.createValidationResult(false, errors, warnings, 0, '');
      }

      // 2. Validate file size
      const size = await this.getFileSize(backupPath);
      if (size === 0) {
        errors.push('Backup file is empty');
        return this.createValidationResult(false, errors, warnings, size, '');
      }

      // 3. Calculate and validate checksum
      const checksum = await this.calculateChecksum(backupPath);
      
      // 4. Validate backup structure (extract and check)
      const structureValidation = await this.validateBackupStructure(backupId);
      errors.push(...structureValidation.errors);
      warnings.push(...structureValidation.warnings);

      // 5. Validate manifest
      const manifestValidation = await this.validateBackupManifest(backupId);
      errors.push(...manifestValidation.errors);
      warnings.push(...manifestValidation.warnings);

      const isValid = errors.length === 0;

      logger.info('Backup validation completed', {
        backupId,
        isValid,
        errors: errors.length,
        warnings: warnings.length,
        size
      });

      return this.createValidationResult(isValid, errors, warnings, size, checksum);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown validation error';
      errors.push(errorMessage);
      
      logger.error('Backup validation failed', {
        backupId,
        error: errorMessage
      });

      return this.createValidationResult(false, errors, warnings, 0, '');
    }
  }

  /**
   * Validate backup structure and required files
   */
  private async validateBackupStructure(backupId: string): Promise<{ errors: string[], warnings: string[] }> {
    const errors: string[] = [];
    const warnings: string[] = [];
    const extractPath = path.join(this.config.backupDir, 'temp', backupId);

    try {
      // Check if extracted backup exists
      if (!(await this.directoryExists(extractPath))) {
        errors.push('Extracted backup directory not found');
        return { errors, warnings };
      }

      // Check required files
      const requiredFiles = ['manifest.json', 'database.sql'];
      for (const file of requiredFiles) {
        const filePath = path.join(extractPath, file);
        if (!(await this.fileExists(filePath))) {
          errors.push(`Required file missing: ${file}`);
        }
      }

      // Check optional directories
      const optionalDirs = ['edge-functions', 'migrations', 'seeds'];
      for (const dir of optionalDirs) {
        const dirPath = path.join(extractPath, dir);
        if (await this.directoryExists(dirPath)) {
          const fileCount = await this.countFilesInDirectory(dirPath);
          if (fileCount === 0) {
            warnings.push(`Optional directory is empty: ${dir}`);
          }
        }
      }

    } catch (error) {
      errors.push(`Structure validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return { errors, warnings };
  }

  /**
   * Validate backup manifest
   */
  private async validateBackupManifest(backupId: string): Promise<{ errors: string[], warnings: string[] }> {
    const errors: string[] = [];
    const warnings: string[] = [];
    const manifestPath = path.join(this.config.backupDir, 'temp', backupId, 'manifest.json');

    try {
      if (!(await this.fileExists(manifestPath))) {
        errors.push('Manifest file not found');
        return { errors, warnings };
      }

      const manifestContent = await fs.readFile(manifestPath, 'utf-8');
      const manifest = JSON.parse(manifestContent);

      // Validate manifest structure
      const requiredFields = ['id', 'timestamp', 'size', 'type', 'status', 'checksum'];
      for (const field of requiredFields) {
        if (!manifest[field]) {
          errors.push(`Manifest missing required field: ${field}`);
        }
      }

      // Validate backup ID consistency
      if (manifest.id !== backupId) {
        errors.push('Manifest backup ID does not match');
      }

      // Validate timestamp format
      if (manifest.timestamp && !this.isValidTimestamp(manifest.timestamp)) {
        warnings.push('Invalid timestamp format in manifest');
      }

      // Validate backup type
      if (manifest.type && !['full', 'incremental'].includes(manifest.type)) {
        errors.push('Invalid backup type in manifest');
      }

      // Validate status
      if (manifest.status && !['completed', 'failed', 'in_progress'].includes(manifest.status)) {
        errors.push('Invalid backup status in manifest');
      }

    } catch (error) {
      errors.push(`Manifest validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return { errors, warnings };
  }

  /**
   * Validate backup configuration
   */
  validateBackupConfig(config: Partial<BackupConfig>): { isValid: boolean, errors: string[] } {
    const errors: string[] = [];

    if (!config.databaseUrl) {
      errors.push('Database URL is required');
    }

    if (!config.backupDir) {
      errors.push('Backup directory is required');
    }

    if (config.retentionDays && config.retentionDays < 1) {
      errors.push('Retention days must be at least 1');
    }

    if (config.maxBackups && config.maxBackups < 1) {
      errors.push('Max backups must be at least 1');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate restore options
   */
  validateRestoreOptions(options: any): { isValid: boolean, errors: string[] } {
    const errors: string[] = [];

    if (!options.backupId) {
      errors.push('Backup ID is required for restore');
    }

    if (typeof options.dryRun !== 'boolean') {
      errors.push('Dry run option must be a boolean');
    }

    if (typeof options.includeEdgeFunctions !== 'boolean') {
      errors.push('Include edge functions option must be a boolean');
    }

    if (typeof options.includeMigrations !== 'boolean') {
      errors.push('Include migrations option must be a boolean');
    }

    if (typeof options.backupBeforeRestore !== 'boolean') {
      errors.push('Backup before restore option must be a boolean');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // ===========================
  // HELPER METHODS
  // ===========================

  private createValidationResult(
    isValid: boolean, 
    errors: string[], 
    warnings: string[], 
    size: number, 
    checksum: string
  ): ValidationResult {
    return {
      isValid,
      errors,
      warnings,
      size,
      checksum
    };
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

  private async getFileSize(filePath: string): Promise<number> {
    try {
      const stat = await fs.stat(filePath);
      return stat.size;
    } catch {
      return 0;
    }
  }

  private async calculateChecksum(filePath: string): Promise<string> {
    try {
      const fileBuffer = await fs.readFile(filePath);
      return createHash('sha256').update(fileBuffer).digest('hex');
    } catch {
      return '';
    }
  }

  private async countFilesInDirectory(dirPath: string): Promise<number> {
    try {
      const files = await fs.readdir(dirPath);
      return files.length;
    } catch {
      return 0;
    }
  }

  private isValidTimestamp(timestamp: string): boolean {
    const date = new Date(timestamp);
    return !isNaN(date.getTime());
  }
}

export default BackupValidationService;
