// ===========================
// USE BACKUP ACTIONS HOOK
// ===========================

import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiService from '../../../services/api';
import { BackupActions, CreateBackupForm, RestoreOptions, CommandResult } from '../types';

const useBackupActions = () => {
  const queryClient = useQueryClient();

  // Create backup mutation
  const createBackup = useMutation({
    mutationFn: (data: { description?: string; tags?: string[] }) => 
      apiService.createBackup(data.description, data.tags),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['backups'] });
      queryClient.invalidateQueries({ queryKey: ['backup-stats'] });
    },
  });

  // Restore backup mutation
  const restoreBackup = useMutation({
    mutationFn: (data: { backupId: string; options: any }) => 
      apiService.restoreBackup(data.backupId, data.options),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['backups'] });
    },
  });

  // Delete backup mutation
  const deleteBackup = useMutation({
    mutationFn: (backupId: string) => apiService.deleteBackup(backupId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['backups'] });
      queryClient.invalidateQueries({ queryKey: ['backup-stats'] });
    },
  });

  // Validate backup mutation
  const validateBackup = useMutation({
    mutationFn: (backupId: string) => apiService.validateBackup(backupId),
  });

  // Action handlers
  const onCreateBackup = (form: CreateBackupForm) => {
    createBackup.mutate({
      description: form.description || undefined,
      tags: form.tags.length > 0 ? form.tags : undefined
    });
  };

  const onRestoreBackup = (backupId: string, options: RestoreOptions) => {
    restoreBackup.mutate({
      backupId,
      options
    });
  };

  const onDeleteBackup = (backupId: string) => {
    if (window.confirm('Are you sure you want to delete this backup? This action cannot be undone.')) {
      deleteBackup.mutate(backupId);
    }
  };

  const onDownloadBackup = async (backupId: string) => {
    try {
      const blob = await apiService.downloadBackup(backupId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup_${backupId}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const onValidateBackup = (backupId: string) => {
    validateBackup.mutate(backupId);
  };

  const onRefreshBackups = () => {
    queryClient.invalidateQueries({ queryKey: ['backups'] });
    queryClient.invalidateQueries({ queryKey: ['backup-stats'] });
  };

  const onExecuteCommand = async (command: string): Promise<CommandResult> => {
    try {
      const result = await apiService.executeSupabaseCommand(command);
      return {
        success: true,
        data: result
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  };

  const backupActions: BackupActions = {
    onCreateBackup,
    onRestoreBackup,
    onDeleteBackup,
    onDownloadBackup,
    onValidateBackup,
    onRefreshBackups,
    onExecuteCommand
  };

  // Loading states
  const loadingStates = {
    createBackup: createBackup.isPending,
    restoreBackup: restoreBackup.isPending,
    deleteBackup: deleteBackup.isPending,
    validateBackup: validateBackup.isPending
  };

  // Error states
  const errorStates = {
    createBackup: createBackup.error ? (createBackup.error as Error).message : null,
    restoreBackup: restoreBackup.error ? (restoreBackup.error as Error).message : null,
    deleteBackup: deleteBackup.error ? (deleteBackup.error as Error).message : null,
    validateBackup: validateBackup.error ? (validateBackup.error as Error).message : null
  };

  return {
    ...backupActions,
    loadingStates,
    errorStates
  };
};

export default useBackupActions;
