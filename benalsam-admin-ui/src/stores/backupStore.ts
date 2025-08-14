import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

// Backup types
interface BackupInfo {
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
  scheduleId?: string;
  scheduleName?: string;
}

interface BackupStats {
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

interface BackupStore {
  // State
  backups: BackupInfo[];
  stats: BackupStats | null;
  loading: boolean;
  error: string | null;
  lastFetched: number | null;
  
  // Actions
  setBackups: (backups: BackupInfo[]) => void;
  setStats: (stats: BackupStats) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Smart Search & Filtering
  findBackupById: (id: string) => BackupInfo | null;
  findBackupsBySchedule: (scheduleName: string) => BackupInfo[];
  findBackupsByDateRange: (startDate: Date, endDate: Date) => BackupInfo[];
  findLatestSuccessfulBackup: () => BackupInfo | null;
  findBackupsByStatus: (status: BackupInfo['status']) => BackupInfo[];
  
  // Schedule-specific helpers
  findLatestBackupForSchedule: (scheduleName: string) => BackupInfo | null;
  findBackupsForScheduleInTimeRange: (scheduleName: string, hours: number) => BackupInfo[];
  
  // Cache management
  isDataStale: (maxAgeMinutes?: number) => boolean;
  clearCache: () => void;
  
  // Utility methods
  getBackupStats: () => BackupStats;
  getBackupsByType: (type: BackupInfo['type']) => BackupInfo[];
  getBackupsBySize: (minSize: number, maxSize?: number) => BackupInfo[];
}

export const useBackupStore = create<BackupStore>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        backups: [],
        stats: null,
        loading: false,
        error: null,
        lastFetched: null,
        
        // Basic actions
        setBackups: (backups) => set({ 
          backups, 
          lastFetched: Date.now(),
          error: null 
        }),
        
        setStats: (stats) => set({ stats }),
        
        setLoading: (loading) => set({ loading }),
        
        setError: (error) => set({ error }),
        
        // Smart search methods
        findBackupById: (id) => {
          const { backups } = get();
          return backups.find(backup => backup.id === id) || null;
        },
        
        findBackupsBySchedule: (scheduleName) => {
          const { backups } = get();
          const normalizedName = scheduleName.toLowerCase();
          
          return backups.filter(backup => {
            const description = backup.description?.toLowerCase() || '';
            const tags = backup.tags || [];
            const backupScheduleName = backup.scheduleName?.toLowerCase() || '';
            
            return description.includes(normalizedName) ||
                   tags.some(tag => tag.toLowerCase().includes(normalizedName)) ||
                   backupScheduleName.includes(normalizedName);
          });
        },
        
        findBackupsByDateRange: (startDate, endDate) => {
          const { backups } = get();
          const startTime = startDate.getTime();
          const endTime = endDate.getTime();
          
          return backups.filter(backup => {
            const backupTime = new Date(backup.timestamp).getTime();
            return backupTime >= startTime && backupTime <= endTime;
          });
        },
        
        findLatestSuccessfulBackup: () => {
          const { backups } = get();
          const successfulBackups = backups.filter(backup => backup.status === 'completed');
          
          if (successfulBackups.length === 0) return null;
          
          return successfulBackups.sort((a, b) => 
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          )[0];
        },
        
        findBackupsByStatus: (status) => {
          const { backups } = get();
          return backups.filter(backup => backup.status === status);
        },
        
        // Schedule-specific helpers
        findLatestBackupForSchedule: (scheduleName) => {
          const scheduleBackups = get().findBackupsBySchedule(scheduleName);
          
          if (scheduleBackups.length === 0) return null;
          
          // En son başarılı backup'ı döndür
          const successfulBackups = scheduleBackups.filter(backup => backup.status === 'completed');
          
          if (successfulBackups.length === 0) return null;
          
          return successfulBackups.sort((a, b) => 
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          )[0];
        },
        
        findBackupsForScheduleInTimeRange: (scheduleName, hours) => {
          const scheduleBackups = get().findBackupsBySchedule(scheduleName);
          const cutoffTime = Date.now() - (hours * 60 * 60 * 1000);
          
          return scheduleBackups.filter(backup => {
            const backupTime = new Date(backup.timestamp).getTime();
            return backupTime >= cutoffTime;
          });
        },
        
        // Cache management
        isDataStale: (maxAgeMinutes = 5) => {
          const { lastFetched } = get();
          if (!lastFetched) return true;
          
          const maxAgeMs = maxAgeMinutes * 60 * 1000;
          return Date.now() - lastFetched > maxAgeMs;
        },
        
        clearCache: () => set({ 
          backups: [], 
          stats: null, 
          lastFetched: null,
          error: null 
        }),
        
        // Utility methods
        getBackupStats: () => {
          const { backups } = get();
          
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
          
          const successfulBackups = backups.filter(b => b.status === 'completed');
          const failedBackups = backups.filter(b => b.status === 'failed');
          const inProgressBackups = backups.filter(b => b.status === 'in_progress');
          
          const totalSize = backups.reduce((sum, backup) => sum + backup.size, 0);
          const timestamps = backups.map(b => new Date(b.timestamp).getTime());
          
          return {
            totalBackups: backups.length,
            totalSize,
            averageSize: totalSize / backups.length,
            oldestBackup: Math.min(...timestamps),
            newestBackup: Math.max(...timestamps),
            successfulBackups: successfulBackups.length,
            failedBackups: failedBackups.length,
            inProgressBackups: inProgressBackups.length,
            totalEdgeFunctions: backups.reduce((sum, b) => sum + b.edgeFunctionsCount, 0),
            totalMigrations: backups.reduce((sum, b) => sum + b.migrationsCount, 0)
          };
        },
        
        getBackupsByType: (type) => {
          const { backups } = get();
          return backups.filter(backup => backup.type === type);
        },
        
        getBackupsBySize: (minSize, maxSize) => {
          const { backups } = get();
          return backups.filter(backup => {
            if (maxSize) {
              return backup.size >= minSize && backup.size <= maxSize;
            }
            return backup.size >= minSize;
          });
        }
      }),
      {
        name: 'backup-store',
        partialize: (state) => ({
          backups: state.backups,
          stats: state.stats,
          lastFetched: state.lastFetched
        })
      }
    )
  )
);
