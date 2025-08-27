// ===========================
// BACKUP ACTIONS COMPONENT
// ===========================

import React from 'react';
import {
  Box,
  Button,
  ButtonGroup,
  Tooltip,
  CircularProgress
} from '@mui/material';
import {
  Add as AddIcon,
  Refresh as RefreshIcon,
  Terminal as TerminalIcon
} from '@mui/icons-material';
import { BackupActionsProps } from '../types';

const BackupActions: React.FC<BackupActionsProps> = ({
  onCreateBackup,
  onRefreshBackups,
  onExecuteCommand,
  isLoading
}) => {
  return (
    <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <ButtonGroup variant="contained" size="medium">
        <Tooltip title="Create New Backup">
          <Button
            startIcon={isLoading ? <CircularProgress size={16} /> : <AddIcon />}
            onClick={onCreateBackup}
            disabled={isLoading}
          >
            Create Backup
          </Button>
        </Tooltip>
        
        <Tooltip title="Refresh Backups">
          <Button
            startIcon={isLoading ? <CircularProgress size={16} /> : <RefreshIcon />}
            onClick={onRefreshBackups}
            disabled={isLoading}
          >
            Refresh
          </Button>
        </Tooltip>
      </ButtonGroup>

      <ButtonGroup variant="outlined" size="medium">
        <Tooltip title="Execute Supabase Command">
          <Button
            startIcon={<TerminalIcon />}
            onClick={onExecuteCommand}
            disabled={isLoading}
          >
            CLI
          </Button>
        </Tooltip>
      </ButtonGroup>
    </Box>
  );
};

export default BackupActions;
