// ===========================
// USE BACKUP DATA HOOK
// ===========================

import { useQuery } from '@tanstack/react-query';
import apiService from '../../../services/api';
import { BackupData, BackupLoadingStates, BackupErrorStates } from '../types';

const useBackupData = () => {
  // Fetch backups
  const { 
    data: backupsData, 
    isLoading: backupsLoading, 
    error: backupsError,
    refetch: refetchBackups
  } = useQuery({
    queryKey: ['backups'],
    queryFn: () => apiService.getBackups(),
    refetchInterval: 30000, // 30 seconds
  });

  // Fetch backup statistics
  const { 
    data: statsData, 
    isLoading: statsLoading 
  } = useQuery({
    queryKey: ['backup-stats'],
    queryFn: () => apiService.getBackupStats(),
    refetchInterval: 60000, // 1 minute
  });

  // Supabase CLI queries
  const { 
    data: supabaseStatusData, 
    isLoading: supabaseStatusLoading 
  } = useQuery({
    queryKey: ['supabaseStatus'],
    queryFn: () => apiService.getSupabaseStatus(),
    refetchInterval: 60000 // Refresh every minute
  });

  const { 
    data: supabaseProjectData, 
    isLoading: supabaseProjectLoading 
  } = useQuery({
    queryKey: ['supabaseProject'],
    queryFn: () => apiService.getSupabaseProject(),
    refetchInterval: 300000 // Refresh every 5 minutes
  });

  const { 
    data: supabaseFunctionsData, 
    isLoading: supabaseFunctionsLoading 
  } = useQuery({
    queryKey: ['supabaseFunctions'],
    queryFn: () => apiService.getSupabaseFunctions(),
    refetchInterval: 300000 // Refresh every 5 minutes
  });

  // Combine data
  const data: BackupData = {
    backups: backupsData?.data?.backups || [],
    stats: statsData?.data || {
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
    },
    supabaseStatus: supabaseStatusData?.data || null,
    supabaseProject: supabaseProjectData?.data || null,
    supabaseFunctions: supabaseFunctionsData?.data || []
  };

  // Loading states
  const loadingStates: BackupLoadingStates = {
    backups: backupsLoading,
    stats: statsLoading,
    supabaseStatus: supabaseStatusLoading,
    supabaseProject: supabaseProjectLoading,
    supabaseFunctions: supabaseFunctionsLoading,
    createBackup: false, // Will be set by mutations
    restoreBackup: false,
    deleteBackup: false,
    validateBackup: false
  };

  // Error states
  const errorStates: BackupErrorStates = {
    backups: backupsError ? (backupsError as Error).message : null,
    stats: null,
    supabaseStatus: null,
    supabaseProject: null,
    supabaseFunctions: null,
    createBackup: null,
    restoreBackup: null,
    deleteBackup: null,
    validateBackup: null
  };

  // Combined loading state
  const isLoading = Object.values(loadingStates).some(Boolean);

  // Combined error state
  const error = Object.values(errorStates).find(Boolean) || null;

  return {
    data,
    loadingStates,
    errorStates,
    isLoading,
    error,
    refetchBackups
  };
};

export default useBackupData;
