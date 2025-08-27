// ===========================
// BACKUP SERVICE TESTS
// ===========================

import BackupService from '../BackupService';
import { BackupConfig, BackupInfo } from '../types';

// Mock dependencies
jest.mock('../../config/logger');
jest.mock('@supabase/supabase-js');

describe('BackupService', () => {
  let backupService: BackupService;
  let mockConfig: BackupConfig;

  beforeEach(() => {
    mockConfig = {
      databaseUrl: 'postgresql://test:test@localhost:5432/test',
      backupDir: './test-backups',
      retentionDays: 30,
      maxBackups: 50,
      includeEdgeFunctions: true,
      includeMigrations: true,
      includeSeeds: true
    };

    // Mock environment variables
    process.env.DATABASE_URL = mockConfig.databaseUrl;
    process.env.BACKUP_DIR = mockConfig.backupDir;
    process.env.BACKUP_RETENTION_DAYS = '30';
    process.env.MAX_BACKUPS = '50';

    backupService = new BackupService();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createBackup', () => {
    it('should create a backup successfully', async () => {
      const description = 'Test backup';
      const tags = ['test', 'automated'];

      const result = await backupService.createBackup(description, tags);

      expect(result).toBeDefined();
      expect(result.id).toMatch(/^backup_\d+_[a-z0-9]+$/);
      expect(result.timestamp).toBeDefined();
      expect(result.status).toBe('completed');
      expect(result.description).toBe(description);
      expect(result.tags).toEqual(tags);
    });

    it('should handle backup creation failure', async () => {
      // Mock fs.mkdir to throw error
      const fs = require('fs/promises');
      jest.spyOn(fs, 'mkdir').mockRejectedValue(new Error('Permission denied'));

      await expect(backupService.createBackup()).rejects.toThrow('Permission denied');
    });
  });

  describe('getBackups', () => {
    it('should return empty array when no backups exist', async () => {
      const backups = await backupService.getBackups();
      expect(backups).toEqual([]);
    });

    it('should return existing backups', async () => {
      // Mock backup file
      const fs = require('fs/promises');
      const mockBackups = [
        {
          id: 'backup_1',
          timestamp: '2023-01-01T00:00:00.000Z',
          size: 1024,
          type: 'full' as const,
          status: 'completed' as const,
          databaseSize: 512,
          edgeFunctionsCount: 2,
          migrationsCount: 5,
          checksum: 'abc123'
        }
      ];

      jest.spyOn(fs, 'readFile').mockResolvedValue(JSON.stringify(mockBackups));
      jest.spyOn(fs, 'access').mockResolvedValue(undefined);

      const backups = await backupService.getBackups();
      expect(backups).toEqual(mockBackups);
    });
  });

  describe('validateBackup', () => {
    it('should validate backup successfully', async () => {
      const backupId = 'test-backup-id';
      const result = await backupService.validateBackup(backupId);

      expect(result).toBeDefined();
      expect(result.isValid).toBeDefined();
      expect(result.errors).toBeDefined();
      expect(result.warnings).toBeDefined();
    });
  });

  describe('getBackupStats', () => {
    it('should return backup statistics', async () => {
      const stats = await backupService.getBackupStats();

      expect(stats).toBeDefined();
      expect(stats.totalBackups).toBeDefined();
      expect(stats.totalSize).toBeDefined();
      expect(stats.averageSize).toBeDefined();
      expect(stats.successfulBackups).toBeDefined();
      expect(stats.failedBackups).toBeDefined();
    });
  });

  describe('deleteBackup', () => {
    it('should delete backup successfully', async () => {
      const backupId = 'test-backup-id';
      const result = await backupService.deleteBackup(backupId);

      expect(typeof result).toBe('boolean');
    });
  });
});
