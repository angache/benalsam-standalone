import { useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useBackupStore } from '../stores/backupStore';
import apiService from '../services/api';

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

export const useBackupService = () => {
  const queryClient = useQueryClient();
  const {
    backups,
    stats,
    loading,
    error,
    lastFetched,
    setBackups,
    setStats,
    setLoading,
    setError,
    findLatestBackupForSchedule,
    isDataStale,
    clearCache
  } = useBackupStore();

  // Smart backup fetching with cache management
  const { data: backupData, isLoading: isFetching } = useQuery({
    queryKey: ['backups'],
    queryFn: async () => {
      console.log('🔄 Fetching backup data...');
      setLoading(true);
      try {
        const response = await apiService.getBackups();
        console.log('📦 Raw backup response:', response);
        
        // Normalize backup data - Backend'den gelen veri {backups: Array, summary: Object} şeklinde
        const backupData = response.data?.data || response.data || {};
        const normalizedBackups = backupData.backups || backupData || [];
        console.log('📦 Normalized backups:', normalizedBackups);
        
        if (Array.isArray(normalizedBackups)) {
          setBackups(normalizedBackups);
          setError(null);
          console.log('✅ Backups set successfully:', normalizedBackups.length, 'backups');
          return normalizedBackups;
        } else {
          console.error('❌ Invalid backup data structure:', typeof normalizedBackups, normalizedBackups);
          throw new Error('Invalid backup data structure');
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch backups';
        console.error('❌ Backup fetch error:', err);
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    enabled: true, // Always fetch for now to debug
    staleTime: 0, // No cache for debugging
    cacheTime: 0, // No cache for debugging
    refetchOnWindowFocus: true,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000)
  });

  // Backup mutations
  const createBackupMutation = useMutation({
    mutationFn: async (data: { description: string; tags?: string[] }) => {
      const response = await apiService.createBackup(data.description, data.tags || []);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['backups'] });
      clearCache(); // Clear cache to force fresh data
    },
    onError: (error) => {
      setError(error instanceof Error ? error.message : 'Failed to create backup');
    }
  });

  const deleteBackupMutation = useMutation({
    mutationFn: async (backupId: string) => {
      const response = await apiService.deleteBackup(backupId);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['backups'] });
      clearCache();
    },
    onError: (error) => {
      setError(error instanceof Error ? error.message : 'Failed to delete backup');
    }
  });

  const validateBackupMutation = useMutation({
    mutationFn: async (backupId: string) => {
      const response = await apiService.validateBackup(backupId);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['backups'] });
    },
    onError: (error) => {
      setError(error instanceof Error ? error.message : 'Failed to validate backup');
    }
  });

  // Smart backup finding for schedules
  const findBackupForSchedule = useCallback((scheduleName: string): BackupInfo | null => {
    return findLatestBackupForSchedule(scheduleName);
  }, [findLatestBackupForSchedule]);

  // Manual refresh
  const refreshBackups = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['backups'] });
    clearCache();
  }, [queryClient, clearCache]);

  // Get backup stats
  const getBackupStats = useCallback(() => {
    return stats || {
      totalBackups: backups.length,
      totalSize: backups.reduce((sum, b) => sum + b.size, 0),
      averageSize: backups.length > 0 ? backups.reduce((sum, b) => sum + b.size, 0) / backups.length : 0,
      oldestBackup: backups.length > 0 ? Math.min(...backups.map(b => new Date(b.timestamp).getTime())) : null,
      newestBackup: backups.length > 0 ? Math.max(...backups.map(b => new Date(b.timestamp).getTime())) : null,
      successfulBackups: backups.filter(b => b.status === 'completed').length,
      failedBackups: backups.filter(b => b.status === 'failed').length,
      inProgressBackups: backups.filter(b => b.status === 'in_progress').length,
      totalEdgeFunctions: backups.reduce((sum, b) => sum + b.edgeFunctionsCount, 0),
      totalMigrations: backups.reduce((sum, b) => sum + b.migrationsCount, 0)
    };
  }, [backups, stats]);

  // Check if backup exists for schedule
  const hasBackupForSchedule = useCallback((scheduleName: string): boolean => {
    return findLatestBackupForSchedule(scheduleName) !== null;
  }, [findLatestBackupForSchedule]);

  // Get backup count for schedule
  const getBackupCountForSchedule = useCallback((scheduleName: string): number => {
    const scheduleBackups = backups.filter(backup => {
      const description = backup.description?.toLowerCase() || '';
      const tags = backup.tags || [];
      const normalizedName = scheduleName.toLowerCase();
      
      return description.includes(normalizedName) ||
             tags.some(tag => tag.toLowerCase().includes(normalizedName));
    });
    
    return scheduleBackups.length;
  }, [backups]);

  return {
    // State
    backups,
    stats: getBackupStats(),
    loading: loading || isFetching,
    error,
    lastFetched,
    
    // Actions
    createBackup: createBackupMutation.mutate,
    deleteBackup: deleteBackupMutation.mutate,
    validateBackup: validateBackupMutation.mutate,
    refreshBackups,
    clearCache,
    
    // Smart search
    findBackupForSchedule,
    hasBackupForSchedule,
    getBackupCountForSchedule,
    
    // Mutations state
    isCreating: createBackupMutation.isPending,
    isDeleting: deleteBackupMutation.isPending,
    isValidating: validateBackupMutation.isPending,
    
    // Cache info
    isDataStale: () => isDataStale(5),
    cacheAge: lastFetched ? Date.now() - lastFetched : null
  };
};
