// ===========================
// QUEUE STATS COMPONENT
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
  AlertTitle,
  LinearProgress
} from '@mui/material';
import {
  Queue as QueueIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Schedule as ScheduleIcon,
  PlayArrow as PlayArrowIcon
} from '@mui/icons-material';
import { QueueStatsProps } from '../types';
import { formatNumber, formatPercentage } from '../utils/formatters';

const QueueStats: React.FC<QueueStatsProps> = ({
  queueStats,
  isLoading,
  error
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

  const getStatusColor = (type: string) => {
    switch (type) {
      case 'pending': return 'warning';
      case 'processing': return 'info';
      case 'completed': return 'success';
      case 'failed': return 'error';
      default: return 'default';
    }
  };

  const getStatusIcon = (type: string) => {
    switch (type) {
      case 'pending': return <ScheduleIcon />;
      case 'processing': return <PlayArrowIcon />;
      case 'completed': return <CheckCircleIcon />;
      case 'failed': return <ErrorIcon />;
      default: return <QueueIcon />;
    }
  };

  const queueItems = [
    {
      type: 'pending',
      label: 'Pending',
      value: queueStats.pending,
      description: 'Waiting to be processed'
    },
    {
      type: 'processing',
      label: 'Processing',
      value: queueStats.processing,
      description: 'Currently being processed'
    },
    {
      type: 'completed',
      label: 'Completed',
      value: queueStats.completed,
      description: 'Successfully processed'
    },
    {
      type: 'failed',
      label: 'Failed',
      value: queueStats.failed,
      description: 'Failed to process'
    }
  ];

  const totalItems = queueStats.total;
  const successRate = totalItems > 0 ? (queueStats.completed / totalItems) * 100 : 0;
  const failureRate = totalItems > 0 ? (queueStats.failed / totalItems) * 100 : 0;

  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="h5" gutterBottom>
        Queue Statistics
      </Typography>
      
      <Card>
        <CardContent>
          <Box display="flex" alignItems="center" mb={2}>
            <QueueIcon />
            <Typography variant="h6" sx={{ ml: 1 }}>
              Total Items: {formatNumber(totalItems)}
            </Typography>
          </Box>

          <Grid container spacing={2}>
            {queueItems.map((item, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <Box
                  sx={{
                    p: 2,
                    border: 1,
                    borderColor: 'divider',
                    borderRadius: 1,
                    textAlign: 'center'
                  }}
                >
                  <Box display="flex" alignItems="center" justifyContent="center" mb={1}>
                    {getStatusIcon(item.type)}
                    <Typography variant="h6" sx={{ ml: 1 }}>
                      {formatNumber(item.value)}
                    </Typography>
                  </Box>
                  
                  <Typography variant="subtitle2" gutterBottom>
                    {item.label}
                  </Typography>
                  
                  <Typography variant="caption" color="text.secondary" display="block">
                    {item.description}
                  </Typography>
                  
                  {totalItems > 0 && (
                    <Chip
                      label={formatPercentage(item.value, totalItems)}
                      color={getStatusColor(item.type)}
                      size="small"
                      sx={{ mt: 1 }}
                    />
                  )}
                </Box>
              </Grid>
            ))}
          </Grid>

          <Box mt={3}>
            <Typography variant="subtitle2" gutterBottom>
              Processing Statistics
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Success Rate
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={successRate}
                    color="success"
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    {successRate.toFixed(1)}% ({formatNumber(queueStats.completed)} items)
                  </Typography>
                </Box>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Failure Rate
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={failureRate}
                    color="error"
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    {failureRate.toFixed(1)}% ({formatNumber(queueStats.failed)} items)
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Box>

          {queueStats.failed > 0 && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              <AlertTitle>Failed Items Detected</AlertTitle>
              There are {formatNumber(queueStats.failed)} failed items in the queue. 
              Consider reviewing and retrying these items.
            </Alert>
          )}

          {queueStats.pending > 0 && (
            <Alert severity="info" sx={{ mt: 2 }}>
              <AlertTitle>Pending Items</AlertTitle>
              There are {formatNumber(queueStats.pending)} items waiting to be processed.
            </Alert>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default QueueStats;
