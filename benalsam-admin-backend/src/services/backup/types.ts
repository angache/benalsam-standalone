// ===========================
// BACKUP SERVICE TYPES
// ===========================

export interface BackupConfig {
  databaseUrl: string;
  backupDir: string;
  retentionDays: number;
  maxBackups: number;
  includeEdgeFunctions: boolean;
  includeMigrations: boolean;
  includeSeeds: boolean;
}

export interface BackupInfo {
  id: string;
  timestamp: string;
  size: number;
  type: 'full' | 'incremental';
  status: 'completed' | 'failed' | 'in_progress';
  databaseSize: number;
  edgeFunctionsCount: number;
  migrationsCount: number;
  checksum: string;
  description?: string;
  tags?: string[];
}

export interface RestoreOptions {
  backupId: string;
  dryRun: boolean;
  includeEdgeFunctions: boolean;
  includeMigrations: boolean;
  backupBeforeRestore: boolean;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  size: number;
  checksum: string;
}

export interface CompressionResult {
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  algorithm: string;
  success: boolean;
  error?: string;
}

export interface CleanupResult {
  deletedBackups: number;
  freedSpace: number;
  errors: string[];
  success: boolean;
}

export interface BackupStats {
  totalBackups: number;
  totalSize: number;
  averageSize: number;
  oldestBackup: number | null;
  newestBackup: number | null;
  successfulBackups: number;
  failedBackups: number;
  inProgressBackups: number;
  totalEdgeFunctions: number;
  totalMigrations: number;
}

export interface BackupError {
  code: string;
  message: string;
  details?: any;
  timestamp: string;
}

export interface BackupProgress {
  backupId: string;
  stage: 'preparing' | 'database' | 'files' | 'compressing' | 'uploading' | 'completed';
  progress: number; // 0-100
  message: string;
  timestamp: string;
}
