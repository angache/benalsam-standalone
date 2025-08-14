import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  LinearProgress,
  Chip,
  IconButton,
  Alert,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  Timeline as TimelineIcon,
  PlayArrow as PlayIcon,
  Stop as StopIcon,
  Refresh as RefreshIcon,
  ExpandMore as ExpandMoreIcon,
  History as HistoryIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Schedule as ScheduleIcon,
  Pending as PendingIcon
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTheme } from '@mui/material/styles';
import { apiService } from '../services/api';

interface OperationProgress {
  id: string;
  operationType: 'backup' | 'restore' | 'validation' | 'scheduled_backup';
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  currentStep: string;
  totalSteps: number;
  currentStepNumber: number;
  startedAt: string;
  estimatedCompletion?: string;
  completedAt?: string;
  error?: string;
  metadata?: any;
}

const ProgressDashboardPage: React.FC = () => {
  const theme = useTheme();
  const queryClient = useQueryClient();
  const [selectedProgress, setSelectedProgress] = useState<OperationProgress | null>(null);
  const [openDetailsDialog, setOpenDetailsDialog] = useState(false);
  const [expandedProgress, setExpandedProgress] = useState<string | null>(null);

  // Fetch progress data
  const { data: progressData, isLoading: progressLoading } = useQuery({
    queryKey: ['progress'],
    queryFn: () => apiService.getProgress(),
    refetchInterval: 2000 // Refresh every 2 seconds for real-time updates
  });

  // Fetch progress health
  const { data: healthData } = useQuery({
    queryKey: ['progress-health'],
    queryFn: () => apiService.getProgressHealth(),
    refetchInterval: 10000 // Refresh every 10 seconds
  });

  // Mutations
  const cancelProgressMutation = useMutation({
    mutationFn: (id: string) => apiService.cancelProgress(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['progress'] });
    }
  });

  const cleanupProgressMutation = useMutation({
    mutationFn: (daysToKeep: number) => apiService.cleanupProgress(daysToKeep),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['progress'] });
    }
  });

  const handleCancelProgress = (id: string) => {
    if (window.confirm('Bu işlemi iptal etmek istediğinizden emin misiniz?')) {
      cancelProgressMutation.mutate(id);
    }
  };

  const handleCleanupProgress = () => {
    if (window.confirm('7 günden eski progress kayıtlarını silmek istediğinizden emin misiniz?')) {
      cleanupProgressMutation.mutate(7);
    }
  };

  const handleViewDetails = (progress: OperationProgress) => {
    setSelectedProgress(progress);
    setOpenDetailsDialog(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'running':
        return 'primary';
      case 'failed':
        return 'error';
      case 'cancelled':
        return 'warning';
      case 'pending':
        return 'default';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon color="success" />;
      case 'running':
        return <PlayIcon color="primary" />;
      case 'failed':
        return <ErrorIcon color="error" />;
      case 'cancelled':
        return <StopIcon color="warning" />;
      case 'pending':
        return <PendingIcon color="action" />;
      default:
        return <ScheduleIcon color="action" />;
    }
  };

  const getOperationTypeLabel = (type: string) => {
    switch (type) {
      case 'backup':
        return 'Database Backup';
      case 'restore':
        return 'Database Restore';
      case 'validation':
        return 'Backup Validation';
      case 'scheduled_backup':
        return 'Scheduled Backup';
      default:
        return type;
    }
  };

  const formatDuration = (startTime: string, endTime?: string) => {
    const start = new Date(startTime);
    const end = endTime ? new Date(endTime) : new Date();
    const duration = end.getTime() - start.getTime();
    
    const seconds = Math.floor(duration / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  };

  const progressList = progressData?.data || [];

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ 
          color: theme.palette.mode === 'light' ? '#212121' : '#ffffff',
          display: 'flex', 
          alignItems: 'center', 
          gap: 1 
        }}>
          <TimelineIcon />
          Operation Progress
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={() => queryClient.invalidateQueries({ queryKey: ['progress'] })}
            sx={{ 
              borderColor: theme.palette.mode === 'light' ? '#ccc' : '#666',
              color: theme.palette.mode === 'light' ? '#666' : '#ccc'
            }}
          >
            Refresh
          </Button>
          <Button
            variant="outlined"
            startIcon={<HistoryIcon />}
            onClick={handleCleanupProgress}
            disabled={cleanupProgressMutation.isPending}
            sx={{ 
              borderColor: theme.palette.mode === 'light' ? '#ccc' : '#666',
              color: theme.palette.mode === 'light' ? '#666' : '#ccc'
            }}
          >
            Cleanup
          </Button>
        </Box>
      </Box>

      {/* Health Status */}
      {healthData && (
        <Card sx={{ mb: 3, bgcolor: theme.palette.mode === 'light' ? '#f5f5f5' : '#424242' }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Chip
                label={healthData.data?.healthy ? 'Healthy' : 'Unhealthy'}
                color={healthData.data?.healthy ? 'success' : 'error'}
                size="small"
              />
              <Typography variant="body2" sx={{ color: theme.palette.mode === 'light' ? '#666' : '#ccc' }}>
                Progress Service Status
              </Typography>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Progress List */}
      {progressLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : progressList.length === 0 ? (
        <Card sx={{ bgcolor: theme.palette.mode === 'light' ? '#f5f5f5' : '#424242' }}>
          <CardContent sx={{ textAlign: 'center', py: 4 }}>
            <TimelineIcon sx={{ fontSize: 64, color: 'grey.500', mb: 2 }} />
            <Typography variant="h6" sx={{ color: theme.palette.mode === 'light' ? '#666' : '#ccc', mb: 1 }}>
              No Active Operations
            </Typography>
            <Typography variant="body2" sx={{ color: theme.palette.mode === 'light' ? '#999' : '#888' }}>
              All operations are completed or no operations are running
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={2}>
          {progressList.map((progress: OperationProgress) => (
            <Grid item xs={12} key={progress.id}>
              <Accordion
                expanded={expandedProgress === progress.id}
                onChange={() => setExpandedProgress(expandedProgress === progress.id ? null : progress.id)}
                sx={{ bgcolor: theme.palette.mode === 'light' ? '#ffffff' : '#424242' }}
              >
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                    {getStatusIcon(progress.status)}
                    <Chip
                      label={progress.status.toUpperCase()}
                      color={getStatusColor(progress.status)}
                      size="small"
                    />
                    <Typography variant="h6" sx={{ flexGrow: 1, color: theme.palette.mode === 'light' ? '#212121' : '#ffffff' }}>
                      {getOperationTypeLabel(progress.operationType)}
                    </Typography>
                    <Typography variant="body2" sx={{ color: theme.palette.mode === 'light' ? '#666' : '#ccc' }}>
                      {progress.progress}%
                    </Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={8}>
                      {/* Progress Bar */}
                      <Box sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="body2" sx={{ color: theme.palette.mode === 'light' ? '#666' : '#ccc' }}>
                            Progress: {progress.progress}%
                          </Typography>
                          <Typography variant="body2" sx={{ color: theme.palette.mode === 'light' ? '#666' : '#ccc' }}>
                            Step {progress.currentStepNumber} of {progress.totalSteps}
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={progress.progress}
                          sx={{
                            height: 8,
                            borderRadius: 4,
                            bgcolor: theme.palette.mode === 'light' ? '#e0e0e0' : '#424242',
                            '& .MuiLinearProgress-bar': {
                              borderRadius: 4,
                            }
                          }}
                        />
                      </Box>

                      {/* Current Step */}
                      <Typography variant="body2" sx={{ mb: 2, color: theme.palette.mode === 'light' ? '#666' : '#ccc' }}>
                        <strong>Current Step:</strong> {progress.currentStep}
                      </Typography>

                      {/* Timing Information */}
                      <Box sx={{ display: 'flex', gap: 4, mb: 2 }}>
                        <Typography variant="body2" sx={{ color: theme.palette.mode === 'light' ? '#666' : '#ccc' }}>
                          <strong>Started:</strong> {new Date(progress.startedAt).toLocaleString()}
                        </Typography>
                        {progress.completedAt && (
                          <Typography variant="body2" sx={{ color: theme.palette.mode === 'light' ? '#666' : '#ccc' }}>
                            <strong>Completed:</strong> {new Date(progress.completedAt).toLocaleString()}
                          </Typography>
                        )}
                        <Typography variant="body2" sx={{ color: theme.palette.mode === 'light' ? '#666' : '#ccc' }}>
                          <strong>Duration:</strong> {formatDuration(progress.startedAt, progress.completedAt)}
                        </Typography>
                      </Box>

                      {/* Error Information */}
                      {progress.error && (
                        <Alert severity="error" sx={{ mb: 2, bgcolor: theme.palette.mode === 'light' ? '#ffebee' : '#4a1c1c' }}>
                          <Typography variant="body2">
                            <strong>Error:</strong> {progress.error}
                          </Typography>
                        </Alert>
                      )}

                      {/* Metadata */}
                      {progress.metadata && (
                        <Box sx={{ mt: 2 }}>
                          <Typography variant="body2" sx={{ color: theme.palette.mode === 'light' ? '#666' : '#ccc', mb: 1 }}>
                            <strong>Additional Information:</strong>
                          </Typography>
                          <Card sx={{ bgcolor: theme.palette.mode === 'light' ? '#f9f9f9' : '#2a2a2a' }}>
                            <CardContent sx={{ py: 1 }}>
                              <Typography variant="body2" sx={{ color: theme.palette.mode === 'light' ? '#666' : '#ccc' }}>
                                {JSON.stringify(progress.metadata, null, 2)}
                              </Typography>
                            </CardContent>
                          </Card>
                        </Box>
                      )}
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<HistoryIcon />}
                          onClick={() => handleViewDetails(progress)}
                        >
                          View Details
                        </Button>
                        {progress.status === 'running' && (
                          <Button
                            variant="outlined"
                            size="small"
                            startIcon={<StopIcon />}
                            color="warning"
                            onClick={() => handleCancelProgress(progress.id)}
                            disabled={cancelProgressMutation.isPending}
                          >
                            Cancel
                          </Button>
                        )}
                      </Box>
                    </Grid>
                  </Grid>
                </AccordionDetails>
              </Accordion>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Progress Details Dialog */}
      <Dialog open={openDetailsDialog} onClose={() => setOpenDetailsDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ 
          bgcolor: theme.palette.mode === 'light' ? '#f5f5f5' : '#424242',
          color: theme.palette.mode === 'light' ? '#212121' : '#ffffff'
        }}>
          Progress Details
        </DialogTitle>
        <DialogContent sx={{ bgcolor: theme.palette.mode === 'light' ? '#ffffff' : '#424242' }}>
          {selectedProgress && (
            <Box sx={{ mt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="h6" sx={{ mb: 2, color: theme.palette.mode === 'light' ? '#212121' : '#ffffff' }}>
                    {getOperationTypeLabel(selectedProgress.operationType)}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" sx={{ color: theme.palette.mode === 'light' ? '#666' : '#ccc' }}>
                    <strong>Status:</strong>
                  </Typography>
                  <Chip
                    label={selectedProgress.status.toUpperCase()}
                    color={getStatusColor(selectedProgress.status)}
                    size="small"
                    sx={{ mt: 0.5 }}
                  />
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" sx={{ color: theme.palette.mode === 'light' ? '#666' : '#ccc' }}>
                    <strong>Progress:</strong> {selectedProgress.progress}%
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2" sx={{ color: theme.palette.mode === 'light' ? '#666' : '#ccc' }}>
                    <strong>Current Step:</strong> {selectedProgress.currentStep}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" sx={{ color: theme.palette.mode === 'light' ? '#666' : '#ccc' }}>
                    <strong>Started:</strong> {new Date(selectedProgress.startedAt).toLocaleString()}
                  </Typography>
                </Grid>
                {selectedProgress.completedAt && (
                  <Grid item xs={6}>
                    <Typography variant="body2" sx={{ color: theme.palette.mode === 'light' ? '#666' : '#ccc' }}>
                      <strong>Completed:</strong> {new Date(selectedProgress.completedAt).toLocaleString()}
                    </Typography>
                  </Grid>
                )}
                <Grid item xs={12}>
                  <Typography variant="body2" sx={{ color: theme.palette.mode === 'light' ? '#666' : '#ccc' }}>
                    <strong>Duration:</strong> {formatDuration(selectedProgress.startedAt, selectedProgress.completedAt)}
                  </Typography>
                </Grid>
                {selectedProgress.error && (
                  <Grid item xs={12}>
                    <Alert severity="error" sx={{ bgcolor: theme.palette.mode === 'light' ? '#ffebee' : '#4a1c1c' }}>
                      <Typography variant="body2">
                        <strong>Error:</strong> {selectedProgress.error}
                      </Typography>
                    </Alert>
                  </Grid>
                )}
                {selectedProgress.metadata && (
                  <Grid item xs={12}>
                    <Typography variant="body2" sx={{ color: theme.palette.mode === 'light' ? '#666' : '#ccc', mb: 1 }}>
                      <strong>Metadata:</strong>
                    </Typography>
                    <Card sx={{ bgcolor: theme.palette.mode === 'light' ? '#f9f9f9' : '#2a2a2a' }}>
                      <CardContent sx={{ py: 1 }}>
                        <Typography variant="body2" sx={{ color: theme.palette.mode === 'light' ? '#666' : '#ccc' }}>
                          {JSON.stringify(selectedProgress.metadata, null, 2)}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                )}
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ bgcolor: theme.palette.mode === 'light' ? '#f5f5f5' : '#424242' }}>
          <Button onClick={() => setOpenDetailsDialog(false)} sx={{ color: theme.palette.mode === 'light' ? '#666' : '#ccc' }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Error Alerts */}
      {cancelProgressMutation.isError && (
        <Alert severity="error" sx={{ mt: 2, bgcolor: theme.palette.mode === 'light' ? '#ffebee' : '#4a1c1c' }}>
          Failed to cancel operation: {cancelProgressMutation.error?.message}
        </Alert>
      )}

      {cleanupProgressMutation.isError && (
        <Alert severity="error" sx={{ mt: 2, bgcolor: theme.palette.mode === 'light' ? '#ffebee' : '#4a1c1c' }}>
          Failed to cleanup progress: {cleanupProgressMutation.error?.message}
        </Alert>
      )}

      {/* Success Alerts */}
      {cleanupProgressMutation.isSuccess && (
        <Alert severity="success" sx={{ mt: 2, bgcolor: theme.palette.mode === 'light' ? '#e8f5e8' : '#1c4a1c' }}>
          Successfully cleaned up old progress records
        </Alert>
      )}
    </Box>
  );
};

export default ProgressDashboardPage;
