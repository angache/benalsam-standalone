// ===========================
// INDEXER STATS COMPONENT
// ===========================

import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Chip,
  CircularProgress,
  Alert,
  AlertTitle,
  LinearProgress
} from '@mui/material';
import {
  Storage as StorageIcon,
  PlayArrow as PlayArrowIcon,
  Stop as StopIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Timeline as TimelineIcon
} from '@mui/icons-material';
import { IndexerStatsProps } from '../types';
import { formatNumber, formatDate, formatDuration } from '../utils/formatters';

const IndexerStats: React.FC<IndexerStatsProps> = ({
  indexerStats,
  isLoading,
  error,
  onStartIndexer,
  onStopIndexer
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
    if (indexerStats.isRunning) return 'warning';
    if (indexerStats.totalFailed > 0) return 'error';
    return 'success';
  };

  const getStatusText = () => {
    if (indexerStats.isRunning) return 'Running';
    if (indexerStats.totalFailed > 0) return 'Error';
    return 'Idle';
  };

  const getStatusIcon = () => {
    if (indexerStats.isRunning) return <PlayArrowIcon />;
    if (indexerStats.totalFailed > 0) return <ErrorIcon />;
    return <CheckCircleIcon />;
  };

  const totalProcessed = indexerStats.totalProcessed;
  const successRate = totalProcessed > 0 ? (indexerStats.totalSuccess / totalProcessed) * 100 : 0;
  const failureRate = totalProcessed > 0 ? (indexerStats.totalFailed / totalProcessed) * 100 : 0;

  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="h5" gutterBottom>
        Indexer Statistics
      </Typography>
      
      <Card>
        <CardContent>
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
            <Box display="flex" alignItems="center">
              <StorageIcon />
              <Typography variant="h6" sx={{ ml: 1 }}>
                Indexer: {getStatusText()}
              </Typography>
              <Chip
                label={getStatusText()}
                color={getStatusColor()}
                size="small"
                sx={{ ml: 2 }}
              />
            </Box>
            
            <Box>
              {indexerStats.isRunning ? (
                <Button
                  variant="contained"
                  color="error"
                  startIcon={<StopIcon />}
                  onClick={onStopIndexer}
                  disabled={isLoading}
                >
                  Stop Indexer
                </Button>
              ) : (
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<PlayArrowIcon />}
                  onClick={onStartIndexer}
                  disabled={isLoading}
                >
                  Start Indexer
                </Button>
              )}
            </Box>
          </Box>

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <Box textAlign="center">
                <Typography variant="h4" color="primary">
                  {formatNumber(indexerStats.totalProcessed)}
                </Typography>
                <Typography variant="subtitle2" gutterBottom>
                  Total Processed
                </Typography>
              </Box>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Box textAlign="center">
                <Typography variant="h4" color="success.main">
                  {formatNumber(indexerStats.totalSuccess)}
                </Typography>
                <Typography variant="subtitle2" gutterBottom>
                  Successful
                </Typography>
              </Box>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Box textAlign="center">
                <Typography variant="h4" color="error.main">
                  {formatNumber(indexerStats.totalFailed)}
                </Typography>
                <Typography variant="subtitle2" gutterBottom>
                  Failed
                </Typography>
              </Box>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Box textAlign="center">
                <Typography variant="h4" color="info.main">
                  {formatDuration(indexerStats.avgProcessingTime)}
                </Typography>
                <Typography variant="subtitle2" gutterBottom>
                  Avg Processing Time
                </Typography>
              </Box>
            </Grid>
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
                    {successRate.toFixed(1)}% ({formatNumber(indexerStats.totalSuccess)} items)
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
                    {failureRate.toFixed(1)}% ({formatNumber(indexerStats.totalFailed)} items)
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Box>

          {indexerStats.lastProcessedAt && (
            <Box mt={2}>
              <Typography variant="subtitle2" gutterBottom>
                Last Processed
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {formatDate(indexerStats.lastProcessedAt)}
              </Typography>
            </Box>
          )}

          {indexerStats.totalFailed > 0 && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              <AlertTitle>Failed Items Detected</AlertTitle>
              There are {formatNumber(indexerStats.totalFailed)} failed items. 
              Consider reviewing the indexing process.
            </Alert>
          )}

          {indexerStats.isRunning && (
            <Alert severity="info" sx={{ mt: 2 }}>
              <AlertTitle>Indexer Running</AlertTitle>
              The indexer is currently processing items. You can stop it at any time.
            </Alert>
          )}

          {indexerStats.avgProcessingTime > 30 && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              <AlertTitle>Slow Processing</AlertTitle>
              Average processing time is {formatDuration(indexerStats.avgProcessingTime)}. 
              Consider optimizing the indexing process.
            </Alert>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default IndexerStats;
