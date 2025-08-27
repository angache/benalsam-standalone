// ===========================
// MAIN BACKUP DASHBOARD PAGE
// ===========================

import React, { useState } from 'react';
import { Box, Container, Typography, Alert, AlertTitle } from '@mui/material';
import { useTheme } from '../../contexts/ThemeContext';

// Custom components
import BackupStats from './components/BackupStats';
import BackupTable from './components/BackupTable';
import BackupActions from './components/BackupActions';
import CreateBackupDialog from './components/CreateBackupDialog';
import RestoreBackupDialog from './components/RestoreBackupDialog';

// Custom hooks
import useBackupData from './hooks/useBackupData';
import useBackupActions from './hooks/useBackupActions';

// Types
import { BackupInfo, CreateBackupForm, RestoreOptions } from './types';

const BackupDashboardPage: React.FC = () => {
  const { mode } = useTheme();
  
  // Custom hooks
  const { data, isLoading, error, refetchBackups } = useBackupData();
  const { 
    onCreateBackup, 
    onRestoreBackup, 
    onDeleteBackup, 
    onDownloadBackup, 
    onValidateBackup, 
    onRefreshBackups, 
    onExecuteCommand,
    loadingStates,
    errorStates
  } = useBackupActions();

  // Local state
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState<BackupInfo | null>(null);

  // Handlers
  const handleCreateBackup = () => {
    setCreateDialogOpen(true);
  };

  const handleCreateBackupSubmit = (form: CreateBackupForm) => {
    onCreateBackup(form);
    setCreateDialogOpen(false);
  };

  const handleBackupSelect = (backup: BackupInfo) => {
    setSelectedBackup(backup);
    setRestoreDialogOpen(true);
  };

  const handleRestoreBackupSubmit = (backupId: string, options: RestoreOptions) => {
    onRestoreBackup(backupId, options);
    setRestoreDialogOpen(false);
    setSelectedBackup(null);
  };

  const handleExecuteCommand = () => {
    // This would open a command dialog
    // For now, just log the action
    console.log('Execute command clicked');
  };

  // Combined loading and error states
  const isAnyLoading = isLoading || Object.values(loadingStates).some(Boolean);
  const anyError = error || Object.values(errorStates).find(Boolean);

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Backup Dashboard
      </Typography>

      {anyError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          <AlertTitle>Error</AlertTitle>
          {anyError}
        </Alert>
      )}

      {/* Backup Statistics */}
      <BackupStats
        stats={data.stats}
        isLoading={loadingStates.stats}
        error={errorStates.stats}
      />

      {/* Backup Actions */}
      <BackupActions
        onCreateBackup={handleCreateBackup}
        onRefreshBackups={onRefreshBackups}
        onExecuteCommand={handleExecuteCommand}
        isLoading={isAnyLoading}
      />

      {/* Backup Table */}
      <BackupTable
        backups={data.backups}
        isLoading={loadingStates.backups}
        error={errorStates.backups}
        onBackupSelect={handleBackupSelect}
        onBackupDelete={onDeleteBackup}
        onBackupDownload={onDownloadBackup}
        onBackupValidate={onValidateBackup}
      />

      {/* Create Backup Dialog */}
      <CreateBackupDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onSubmit={handleCreateBackupSubmit}
        isLoading={loadingStates.createBackup}
        error={errorStates.createBackup}
      />

      {/* Restore Backup Dialog */}
      <RestoreBackupDialog
        open={restoreDialogOpen}
        backup={selectedBackup}
        onClose={() => {
          setRestoreDialogOpen(false);
          setSelectedBackup(null);
        }}
        onSubmit={handleRestoreBackupSubmit}
        isLoading={loadingStates.restoreBackup}
        error={errorStates.restoreBackup}
      />
    </Container>
  );
};

export default BackupDashboardPage;
