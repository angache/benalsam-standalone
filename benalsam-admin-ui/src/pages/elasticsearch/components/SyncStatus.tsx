// ===========================
// SYNC STATUS COMPONENT
// ===========================

import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  LinearProgress,
  Chip,
  CircularProgress,
  Alert,
  AlertTitle,
  Grid
} from '@mui/material';
import {
  Sync as SyncIcon,
  Stop as StopIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon
} from '@mui/icons-material';
import { SyncStatusProps } from '../types';
import { formatDate, formatNumber } from '../utils/formatters';

const SyncStatus: React.FC<SyncStatusProps> = ({
  syncStatus,
  isLoading,
  error,
  onStartSync,
  onStopSync
}) => {
  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" p={3}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        <AlertTitle>Error</AlertTitle>
        {error}
      </Alert>
    );
  }

  const getStatusColor = () => {
    if (syncStatus.isRunning) return 'warning';
    if (syncStatus.errors.length > 0) return 'error';
    return 'success';
  };

  const getStatusText = () => {
    if (syncStatus.isRunning) return 'Running';
    if (syncStatus.errors.length > 0) return 'Error';
    return 'Idle';
  };

  const getStatusIcon = () => {
    if (syncStatus.isRunning) return <SyncIcon />;
    if (syncStatus.errors.length > 0) return <ErrorIcon />;
    return <CheckCircleIcon />;
  };

  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="h5" gutterBottom>
        Sync Status
      </Typography>
      
      <Card>
        <CardContent>
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
            <Box display="flex" alignItems="center">
              {getStatusIcon()}
              <Typography variant="h6" sx={{ ml: 1 }}>
                Sync Service: {getStatusText()}
              </Typography>
              <Chip
                label={getStatusText()}
                color={getStatusColor()}
                size="small"
                sx={{ ml: 2 }}
              />
            </Box>
            
            <Box>
              {syncStatus.isRunning ? (
                <Button
                  variant="contained"
                  color="error"
                  startIcon={<StopIcon />}
                  onClick={onStopSync}
                  disabled={isLoading}
                >
                  Stop Sync
                </Button>
              ) : (
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<SyncIcon />}
                  onClick={onStartSync}
                  disabled={isLoading}
                >
                  Start Sync
                </Button>
              )}
            </Box>
          </Box>

          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Last Sync
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {syncStatus.lastSyncAt ? formatDate(syncStatus.lastSyncAt) : 'Never'}
                </Typography>
              </Box>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Next Sync
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {syncStatus.nextSyncAt ? formatDate(syncStatus.nextSyncAt) : 'Not scheduled'}
                </Typography>
              </Box>
            </Grid>
          </Grid>

          <Box mt={2}>
            <Typography variant="subtitle2" gutterBottom>
              Total Synced: {formatNumber(syncStatus.totalSynced)}
            </Typography>
            
            {syncStatus.isRunning && (
              <Box mt={1}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Progress: {syncStatus.progress}%
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={syncStatus.progress}
                  sx={{ height: 8, borderRadius: 4 }}
                />
              </Box>
            )}
          </Box>

          {syncStatus.errors.length > 0 && (
            <Alert severity="error" sx={{ mt: 2 }}>
              <AlertTitle>Sync Errors ({syncStatus.errors.length})</AlertTitle>
              <Box component="ul" sx={{ mt: 1, mb: 0 }}>
                {syncStatus.errors.map((error, index) => (
                  <Box component="li" key={index} sx={{ fontSize: '0.875rem' }}>
                    {error}
                  </Box>
                ))}
              </Box>
            </Alert>
          )}

          {syncStatus.isRunning && (
            <Alert severity="info" sx={{ mt: 2 }}>
              <AlertTitle>Sync in Progress</AlertTitle>
              The sync service is currently running. You can stop it at any time.
            </Alert>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default SyncStatus;
