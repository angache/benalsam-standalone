// ===========================
// RESTORE BACKUP DIALOG COMPONENT
// ===========================

import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  FormControlLabel,
  Checkbox,
  Box,
  Alert,
  CircularProgress,
  Typography,
  Chip
} from '@mui/material';
import { RestoreBackupDialogProps, RestoreOptions } from '../types';

const RestoreBackupDialog: React.FC<RestoreBackupDialogProps> = ({
  open,
  backup,
  onClose,
  onSubmit,
  isLoading,
  error
}) => {
  const [options, setOptions] = useState<RestoreOptions>({
    dryRun: false,
    includeEdgeFunctions: true,
    includeMigrations: true,
    backupBeforeRestore: true
  });

  const handleSubmit = () => {
    if (backup) {
      onSubmit(backup.id, options);
    }
  };

  const handleClose = () => {
    setOptions({
      dryRun: false,
      includeEdgeFunctions: true,
      includeMigrations: true,
      backupBeforeRestore: true
    });
    onClose();
  };

  const handleOptionChange = (option: keyof RestoreOptions) => {
    setOptions(prev => ({
      ...prev,
      [option]: !prev[option]
    }));
  };

  if (!backup) return null;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>Restore Backup</DialogTitle>
      
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Backup Details
          </Typography>
          
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
            <Chip label={`ID: ${backup.id}`} size="small" />
            <Chip label={`Type: ${backup.type}`} size="small" />
            <Chip label={`Status: ${backup.status}`} size="small" />
            {backup.description && (
              <Chip label={`Description: ${backup.description}`} size="small" />
            )}
          </Box>

          <Typography variant="body2" color="text.secondary">
            Created: {new Date(backup.timestamp).toLocaleString()}
          </Typography>
        </Box>

        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Restore Options
          </Typography>

          <FormControlLabel
            control={
              <Checkbox
                checked={options.dryRun}
                onChange={() => handleOptionChange('dryRun')}
              />
            }
            label="Dry Run (Simulate restore without making changes)"
          />

          <FormControlLabel
            control={
              <Checkbox
                checked={options.includeEdgeFunctions}
                onChange={() => handleOptionChange('includeEdgeFunctions')}
              />
            }
            label="Include Edge Functions"
          />

          <FormControlLabel
            control={
              <Checkbox
                checked={options.includeMigrations}
                onChange={() => handleOptionChange('includeMigrations')}
              />
            }
            label="Include Migrations"
          />

          <FormControlLabel
            control={
              <Checkbox
                checked={options.backupBeforeRestore}
                onChange={() => handleOptionChange('backupBeforeRestore')}
              />
            }
            label="Create backup before restore"
          />
        </Box>

        <Alert severity="warning" sx={{ mb: 2 }}>
          <Typography variant="body2">
            <strong>Warning:</strong> This action will overwrite your current data. 
            Make sure you have a recent backup before proceeding.
          </Typography>
        </Alert>

        {options.dryRun && (
          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="body2">
              <strong>Dry Run Mode:</strong> This will simulate the restore process 
              without making any actual changes to your data.
            </Typography>
          </Alert>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={isLoading}>
          Cancel
        </Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained"
          color="warning"
          disabled={isLoading}
          startIcon={isLoading ? <CircularProgress size={16} /> : undefined}
        >
          {isLoading ? 'Restoring...' : 'Restore Backup'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RestoreBackupDialog;
