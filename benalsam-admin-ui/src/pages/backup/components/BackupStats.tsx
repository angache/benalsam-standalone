// ===========================
// BACKUP STATS COMPONENT
// ===========================

import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  CircularProgress,
  Alert,
  AlertTitle
} from '@mui/material';
import {
  Storage as StorageIcon,
  Backup as BackupIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Schedule as ScheduleIcon,
  FolderZip as FolderZipIcon
} from '@mui/icons-material';
import { BackupStatsProps } from '../types';

const BackupStats: React.FC<BackupStatsProps> = ({
  stats,
  isLoading,
  error
}) => {
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (timestamp: number | null) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp).toLocaleDateString();
  };

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

  const statCards = [
    {
      title: 'Total Backups',
      value: stats.totalBackups.toString(),
      icon: <BackupIcon />,
      color: 'primary' as const
    },
    {
      title: 'Total Size',
      value: formatFileSize(stats.totalSize),
      icon: <StorageIcon />,
      color: 'info' as const
    },
    {
      title: 'Average Size',
      value: formatFileSize(stats.averageSize),
      icon: <FolderZipIcon />,
      color: 'secondary' as const
    },
    {
      title: 'Successful',
      value: stats.successfulBackups.toString(),
      icon: <CheckCircleIcon />,
      color: 'success' as const
    },
    {
      title: 'Failed',
      value: stats.failedBackups.toString(),
      icon: <ErrorIcon />,
      color: 'error' as const
    },
    {
      title: 'In Progress',
      value: stats.inProgressBackups.toString(),
      icon: <ScheduleIcon />,
      color: 'warning' as const
    }
  ];

  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="h5" gutterBottom>
        Backup Statistics
      </Typography>
      
      <Grid container spacing={2}>
        {statCards.map((card, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={1}>
                  <Box color={`${card.color}.main`} mr={1}>
                    {card.icon}
                  </Box>
                  <Typography variant="h6" component="div">
                    {card.value}
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  {card.title}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Box mt={2}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Time Range
                </Typography>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2">
                    Oldest: {formatDate(stats.oldestBackup)}
                  </Typography>
                  <Typography variant="body2">
                    Newest: {formatDate(stats.newestBackup)}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Components
                </Typography>
                <Box display="flex" gap={1} flexWrap="wrap">
                  <Chip 
                    label={`${stats.totalEdgeFunctions} Edge Functions`}
                    size="small"
                    color="primary"
                  />
                  <Chip 
                    label={`${stats.totalMigrations} Migrations`}
                    size="small"
                    color="secondary"
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

export default BackupStats;
