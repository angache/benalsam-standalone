// ===========================
// BACKUP DASHBOARD TYPES
// ===========================

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

export interface CreateBackupForm {
  description: string;
  tags: string[];
}

export interface RestoreOptions {
  dryRun: boolean;
  includeEdgeFunctions: boolean;
  includeMigrations: boolean;
  backupBeforeRestore: boolean;
}

export interface SupabaseStatus {
  status: string;
  version: string;
  projectId: string;
  apiUrl: string;
  dbUrl: string;
  studioUrl: string;
  inBucket: string;
  outBucket: string;
  fileSizeLimit: string;
  edgeRuntime: string;
}

export interface SupabaseProject {
  id: string;
  name: string;
  organization_id: string;
  created_at: string;
  updated_at: string;
  region: string;
  status: string;
}

export interface SupabaseFunction {
  id: string;
  name: string;
  status: string;
  version: number;
  created_at: string;
  updated_at: string;
}

export interface CommandResult {
  success: boolean;
  data?: any;
  error?: string;
  output?: string;
}

export interface BackupActions {
  onCreateBackup: (form: CreateBackupForm) => void;
  onRestoreBackup: (backupId: string, options: RestoreOptions) => void;
  onDeleteBackup: (backupId: string) => void;
  onDownloadBackup: (backupId: string) => void;
  onValidateBackup: (backupId: string) => void;
  onRefreshBackups: () => void;
  onExecuteCommand: (command: string) => Promise<CommandResult>;
}

export interface BackupData {
  backups: BackupInfo[];
  stats: BackupStats;
  supabaseStatus: SupabaseStatus | null;
  supabaseProject: SupabaseProject | null;
  supabaseFunctions: SupabaseFunction[];
}

export interface BackupLoadingStates {
  backups: boolean;
  stats: boolean;
  supabaseStatus: boolean;
  supabaseProject: boolean;
  supabaseFunctions: boolean;
  createBackup: boolean;
  restoreBackup: boolean;
  deleteBackup: boolean;
  validateBackup: boolean;
}

export interface BackupErrorStates {
  backups: string | null;
  stats: string | null;
  supabaseStatus: string | null;
  supabaseProject: string | null;
  supabaseFunctions: string | null;
  createBackup: string | null;
  restoreBackup: string | null;
  deleteBackup: string | null;
  validateBackup: string | null;
}

export interface BackupStatsProps {
  stats: BackupStats;
  isLoading: boolean;
  error: string | null;
}

export interface BackupTableProps {
  backups: BackupInfo[];
  isLoading: boolean;
  error: string | null;
  onBackupSelect: (backup: BackupInfo) => void;
  onBackupDelete: (backupId: string) => void;
  onBackupDownload: (backupId: string) => void;
  onBackupValidate: (backupId: string) => void;
}

export interface BackupActionsProps {
  onCreateBackup: () => void;
  onRefreshBackups: () => void;
  onExecuteCommand: () => void;
  isLoading: boolean;
}

export interface CreateBackupDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (form: CreateBackupForm) => void;
  isLoading: boolean;
  error: string | null;
}

export interface RestoreBackupDialogProps {
  open: boolean;
  backup: BackupInfo | null;
  onClose: () => void;
  onSubmit: (backupId: string, options: RestoreOptions) => void;
  isLoading: boolean;
  error: string | null;
}
