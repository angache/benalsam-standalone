import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControlLabel,
  Checkbox,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Chip,
  IconButton,
  Alert,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
  Tooltip
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  PlayArrow as PlayIcon,
  Schedule as ScheduleIcon,
  ExpandMore as ExpandMoreIcon,
  Refresh as RefreshIcon,
  History as HistoryIcon,
  FolderZip as FolderZipIcon
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTheme } from '@mui/material/styles';
import { apiService } from '../services/api';
import ZipViewer from '../components/ZipViewer';
import ActionButtonGroup from '../components/ActionButtonGroup';
import { useBackupService } from '../hooks/useBackupService';

interface Schedule {
  id: string;
  name: string;
  description?: string;
  cronExpression: string;
  backupOptions: {
    includeDatabase: boolean;
    includeEdgeFunctions: boolean;
    includeMigrations: boolean;
    compression: boolean;
  };
  timezone: string;
  enabled: boolean;
  lastRun?: string;
  nextRun?: string;
  createdAt: string;
  updatedAt: string;
}

interface ScheduleExecution {
  id: string;
  scheduleId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startedAt?: string;
  completedAt?: string;
  error?: string;
  backupId?: string;
  progress?: number;
}

const SchedulingDashboardPage: React.FC = () => {
  const theme = useTheme();
  const queryClient = useQueryClient();
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null);
  const [expandedSchedule, setExpandedSchedule] = useState<string | null>(null);
  const [zipViewerOpen, setZipViewerOpen] = useState(false);
  const [selectedBackupForZip, setSelectedBackupForZip] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [showError, setShowError] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    cronExpression: '0 2 * * *',
    timezone: 'Europe/Istanbul',
    enabled: true,
    backupOptions: {
      includeDatabase: true,
      includeEdgeFunctions: true,
      includeMigrations: true,
      compression: true
    }
  });

  // Fetch schedules
  const { data: schedulesData, isLoading: schedulesLoading } = useQuery({
    queryKey: ['schedules'],
    queryFn: () => apiService.getSchedules(),
    refetchInterval: 5000 // Refresh every 5 seconds
  });

  // Enterprise backup service
  const backupService = useBackupService();

  // Fetch scheduling health
  const { data: healthData } = useQuery({
    queryKey: ['scheduling-health'],
    queryFn: () => apiService.getSchedulingHealth(),
    refetchInterval: 10000 // Refresh every 10 seconds
  });

  // Mutations
  const createScheduleMutation = useMutation({
    mutationFn: (data: any) => apiService.createSchedule(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
      setOpenCreateDialog(false);
      resetForm();
    }
  });

  const updateScheduleMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => apiService.updateSchedule(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
      setOpenEditDialog(false);
      setSelectedSchedule(null);
      resetForm();
    }
  });

  const deleteScheduleMutation = useMutation({
    mutationFn: (id: string) => apiService.deleteSchedule(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
    }
  });

  const triggerScheduleMutation = useMutation({
    mutationFn: (id: string) => apiService.triggerSchedule(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
    }
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      cronExpression: '0 2 * * *',
      timezone: 'Europe/Istanbul',
      enabled: true,
      backupOptions: {
        includeDatabase: true,
        includeEdgeFunctions: true,
        includeMigrations: true,
        compression: true
      }
    });
  };

  const handleCreateSchedule = () => {
    createScheduleMutation.mutate(formData);
  };

  const handleEditSchedule = () => {
    if (selectedSchedule) {
      updateScheduleMutation.mutate({ id: selectedSchedule.id, data: formData });
    }
  };

  const handleDeleteSchedule = (id: string) => {
    if (window.confirm('Bu schedule\'ı silmek istediğinizden emin misiniz?')) {
      deleteScheduleMutation.mutate(id);
    }
  };

  const handleTriggerSchedule = (id: string) => {
    triggerScheduleMutation.mutate(id);
  };

  const handleViewScheduleHistory = (schedule: Schedule) => {
    console.log('📋 Viewing history for schedule:', schedule.name);
    
    // Schedule için backup'ları bul
    const scheduleBackups = backupService.backups.filter(backup => {
      const description = backup.description?.toLowerCase() || '';
      const tags = backup.tags || [];
      const normalizedName = schedule.name.toLowerCase();
      
      return description.includes(normalizedName) ||
             tags.some(tag => tag.toLowerCase().includes(normalizedName));
    });
    
    console.log('📋 Found backups for schedule:', scheduleBackups);
    
    if (scheduleBackups.length === 0) {
      alert(`"${schedule.name}" için henüz backup geçmişi bulunamadı.`);
      return;
    }
    
    // Backup geçmişini göster
    const historyText = scheduleBackups.map(backup => {
      const date = new Date(backup.timestamp).toLocaleString('tr-TR');
      const size = (backup.size / 1024).toFixed(2);
      return `📅 ${date} - ${size} KB - ${backup.status}`;
    }).join('\n');
    
    alert(`${schedule.name} Backup Geçmişi:\n\n${historyText}`);
  };

  const handleEditClick = (schedule: Schedule) => {
    setSelectedSchedule(schedule);
    setFormData({
      name: schedule.name,
      description: schedule.description || '',
      cronExpression: schedule.cronExpression,
      timezone: schedule.timezone,
      enabled: schedule.enabled,
      backupOptions: schedule.backupOptions
    });
    setOpenEditDialog(true);
  };

  // Enterprise backup finding - artık store'dan geliyor
  const findLatestBackupForSchedule = (schedule: Schedule) => {
    console.log('🔍 Looking for backup for schedule:', schedule.name);
    console.log('🔍 Current backups in store:', backupService.backups);
    console.log('🔍 Backup service state:', {
      loading: backupService.loading,
      error: backupService.error,
      lastFetched: backupService.lastFetched
    });
    
    const backup = backupService.findBackupForSchedule(schedule.name);
    console.log('🔍 Found backup:', backup);
    
    return backup;
  };

  const getStatusColor = (enabled: boolean) => {
    return enabled ? 'success' : 'default';
  };

  const getCronDescription = (cronExpression: string) => {
    const parts = cronExpression.split(' ');
    if (parts.length === 5) {
      const [minute, hour, day, month, weekday] = parts;
      if (minute === '0' && hour === '2' && day === '*' && month === '*' && weekday === '*') {
        return 'Her gün saat 2:00';
      }
      if (minute === '0' && hour === '0' && day === '1' && month === '*' && weekday === '*') {
        return 'Her ayın 1\'inde saat 00:00';
      }
      if (minute === '0' && hour === '0' && day === '*' && month === '*' && weekday === '0') {
        return 'Her Pazar saat 00:00';
      }
    }
    return cronExpression;
  };

  const schedules = schedulesData?.data || [];

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
          <ScheduleIcon />
          Backup Scheduling
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenCreateDialog(true)}
          sx={{ 
            bgcolor: theme.palette.mode === 'light' ? '#1976d2' : '#90caf9',
            color: theme.palette.mode === 'light' ? '#ffffff' : '#000000'
          }}
        >
          Create Schedule
        </Button>
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
                Scheduling Service Status
              </Typography>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Schedules List */}
      {schedulesLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : schedules.length === 0 ? (
        <Card sx={{ bgcolor: theme.palette.mode === 'light' ? '#f5f5f5' : '#424242' }}>
          <CardContent sx={{ textAlign: 'center', py: 4 }}>
            <ScheduleIcon sx={{ fontSize: 64, color: 'grey.500', mb: 2 }} />
            <Typography variant="h6" sx={{ color: theme.palette.mode === 'light' ? '#666' : '#ccc', mb: 1 }}>
              No Schedules Found
            </Typography>
            <Typography variant="body2" sx={{ color: theme.palette.mode === 'light' ? '#999' : '#888' }}>
              Create your first backup schedule to get started
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={2}>
          {schedules.map((schedule: Schedule) => (
            <Grid item xs={12} key={schedule.id}>
              <Accordion
                expanded={expandedSchedule === schedule.id}
                onChange={() => setExpandedSchedule(expandedSchedule === schedule.id ? null : schedule.id)}
                sx={{ bgcolor: theme.palette.mode === 'light' ? '#ffffff' : '#424242' }}
              >
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                    <Chip
                      label={schedule.enabled ? 'Active' : 'Inactive'}
                      color={getStatusColor(schedule.enabled)}
                      size="small"
                    />
                    <Typography variant="h6" sx={{ flexGrow: 1, color: theme.palette.mode === 'light' ? '#212121' : '#ffffff' }}>
                      {schedule.name}
                    </Typography>
                    <Typography variant="body2" sx={{ color: theme.palette.mode === 'light' ? '#666' : '#ccc' }}>
                      {getCronDescription(schedule.cronExpression)}
                    </Typography>
                    
                    {/* Quick Action Buttons in Header */}
                    <Box sx={{ display: 'flex', gap: 0.5, ml: 'auto' }}>
                      <Tooltip title="Hemen Çalıştır">
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTriggerSchedule(schedule.id);
                          }}
                          disabled={triggerScheduleMutation.isPending}
                          sx={{
                            bgcolor: theme.palette.mode === 'light' ? '#2e7d32' : '#66bb6a',
                            color: '#ffffff',
                            '&:hover': {
                              bgcolor: theme.palette.mode === 'light' ? '#1b5e20' : '#81c784'
                            }
                          }}
                        >
                          <PlayIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      

                    </Box>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={8}>
                      <Typography variant="body2" sx={{ mb: 2, color: theme.palette.mode === 'light' ? '#666' : '#ccc' }}>
                        {schedule.description || 'No description'}
                      </Typography>
                      
                      <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                        {schedule.backupOptions.includeDatabase && (
                          <Chip label="Database" size="small" color="primary" />
                        )}
                        {schedule.backupOptions.includeEdgeFunctions && (
                          <Chip label="Edge Functions" size="small" color="secondary" />
                        )}
                        {schedule.backupOptions.includeMigrations && (
                          <Chip label="Migrations" size="small" color="info" />
                        )}
                        {schedule.backupOptions.compression && (
                          <Chip label="Compressed" size="small" color="success" />
                        )}
                      </Box>

                      <Typography variant="body2" sx={{ color: theme.palette.mode === 'light' ? '#666' : '#ccc' }}>
                        <strong>Timezone:</strong> {schedule.timezone}
                      </Typography>
                      {schedule.lastRun && (
                        <Typography variant="body2" sx={{ color: theme.palette.mode === 'light' ? '#666' : '#ccc' }}>
                          <strong>Last Run:</strong> {new Date(schedule.lastRun).toLocaleString()}
                        </Typography>
                      )}
                      {schedule.nextRun && (
                        <Typography variant="body2" sx={{ color: theme.palette.mode === 'light' ? '#666' : '#ccc' }}>
                          <strong>Next Run:</strong> {new Date(schedule.nextRun).toLocaleString()}
                        </Typography>
                      )}
                    </Grid>
                                        <Grid item xs={12} md={4}>
                      <Typography variant="subtitle2" sx={{ mb: 2, color: theme.palette.mode === 'light' ? '#666' : '#ccc' }}>
                        Detaylı İşlemler:
                      </Typography>
                      <ActionButtonGroup
                        primaryActions={[
                          {
                            icon: <EditIcon fontSize="small" />,
                            tooltip: "Düzenle",
                            onClick: () => handleEditClick(schedule),
                            color: 'primary',
                            ariaLabel: "Schedule'ı düzenle"
                          },
                          {
                            icon: <HistoryIcon fontSize="small" />,
                            tooltip: "Geçmiş",
                            onClick: () => handleViewScheduleHistory(schedule),
                            color: 'warning',
                            ariaLabel: "Schedule geçmişini görüntüle"
                          },
                          {
                            icon: <FolderZipIcon fontSize="small" />,
                            tooltip: "Son Backup İçeriğini Görüntüle",
                            onClick: () => {
                              const latestBackup = findLatestBackupForSchedule(schedule);
                              
                              if (latestBackup) {
                                setSelectedBackupForZip(latestBackup.id);
                                setZipViewerOpen(true);
                                                             } else {
                                 // Daha detaylı hata mesajı
                                 let errorMessage = '';
                                 
                                 if (!schedule.lastRun) {
                                   errorMessage = `"${schedule.name}" schedule'ı henüz hiç çalıştırılmamış.`;
                                 } else if (backupService.loading) {
                                   errorMessage = 'Backup verileri yükleniyor...';
                                 } else if (backupService.error) {
                                   errorMessage = `Backup verisi yüklenemedi: ${backupService.error}`;
                                 } else if (backupService.backups.length === 0) {
                                   errorMessage = 'Henüz hiç backup oluşturulmamış.';
                                 } else {
                                   errorMessage = `"${schedule.name}" için uygun backup bulunamadı. Son çalıştırma: ${new Date(schedule.lastRun).toLocaleString('tr-TR')}`;
                                 }
                                 
                                 console.warn('Backup bulunamadı:', { 
                                   schedule: schedule.name, 
                                   lastRun: schedule.lastRun, 
                                   totalBackups: backupService.backups.length,
                                   backupCount: backupService.getBackupCountForSchedule(schedule.name),
                                   hasBackup: backupService.hasBackupForSchedule(schedule.name)
                                 });
                                 alert(errorMessage);
                               }
                            },
                            color: 'secondary',
                            ariaLabel: "Son backup içeriğini görüntüle"
                          }
                        ]}
                        destructiveActions={[
                          {
                            icon: <DeleteIcon fontSize="small" />,
                            tooltip: "Sil",
                            onClick: () => handleDeleteSchedule(schedule.id),
                            loading: deleteScheduleMutation.isPending,
                            color: 'error',
                            ariaLabel: "Schedule'ı sil"
                          }
                        ]}
                        size="small"
                        justifyContent="flex-end"
                      />
                    </Grid>
                  </Grid>
                </AccordionDetails>
              </Accordion>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Create Schedule Dialog */}
      <Dialog open={openCreateDialog} onClose={() => setOpenCreateDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ 
          bgcolor: theme.palette.mode === 'light' ? '#f5f5f5' : '#424242',
          color: theme.palette.mode === 'light' ? '#212121' : '#ffffff'
        }}>
          Create New Schedule
        </DialogTitle>
        <DialogContent sx={{ bgcolor: theme.palette.mode === 'light' ? '#ffffff' : '#424242' }}>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Schedule Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                sx={{
                  '& .MuiInputLabel-root': {
                    color: theme.palette.mode === 'light' ? '#666' : '#ccc'
                  },
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': {
                      borderColor: theme.palette.mode === 'light' ? '#ccc' : '#666'
                    }
                  }
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={2}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                sx={{
                  '& .MuiInputLabel-root': {
                    color: theme.palette.mode === 'light' ? '#666' : '#ccc'
                  },
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': {
                      borderColor: theme.palette.mode === 'light' ? '#ccc' : '#666'
                    }
                  }
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Cron Expression"
                value={formData.cronExpression}
                onChange={(e) => setFormData({ ...formData, cronExpression: e.target.value })}
                helperText="Format: minute hour day month weekday"
                sx={{
                  '& .MuiInputLabel-root': {
                    color: theme.palette.mode === 'light' ? '#666' : '#ccc'
                  },
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': {
                      borderColor: theme.palette.mode === 'light' ? '#ccc' : '#666'
                    }
                  }
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel sx={{ color: theme.palette.mode === 'light' ? '#666' : '#ccc' }}>
                  Timezone
                </InputLabel>
                <Select
                  value={formData.timezone}
                  onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                  sx={{
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: theme.palette.mode === 'light' ? '#ccc' : '#666'
                    }
                  }}
                >
                  <MenuItem value="Europe/Istanbul">Europe/Istanbul</MenuItem>
                  <MenuItem value="UTC">UTC</MenuItem>
                  <MenuItem value="America/New_York">America/New_York</MenuItem>
                  <MenuItem value="Europe/London">Europe/London</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <Divider sx={{ my: 2, borderColor: theme.palette.mode === 'light' ? '#ccc' : '#666' }} />
              <Typography variant="h6" sx={{ mb: 2, color: theme.palette.mode === 'light' ? '#212121' : '#ffffff' }}>
                Backup Options
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6} md={3}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={formData.backupOptions.includeDatabase}
                        onChange={(e) => setFormData({
                          ...formData,
                          backupOptions: {
                            ...formData.backupOptions,
                            includeDatabase: e.target.checked
                          }
                        })}
                      />
                    }
                    label="Database"
                    sx={{ color: theme.palette.mode === 'light' ? '#212121' : '#ffffff' }}
                  />
                </Grid>
                <Grid item xs={6} md={3}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={formData.backupOptions.includeEdgeFunctions}
                        onChange={(e) => setFormData({
                          ...formData,
                          backupOptions: {
                            ...formData.backupOptions,
                            includeEdgeFunctions: e.target.checked
                          }
                        })}
                      />
                    }
                    label="Edge Functions"
                    sx={{ color: theme.palette.mode === 'light' ? '#212121' : '#ffffff' }}
                  />
                </Grid>
                <Grid item xs={6} md={3}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={formData.backupOptions.includeMigrations}
                        onChange={(e) => setFormData({
                          ...formData,
                          backupOptions: {
                            ...formData.backupOptions,
                            includeMigrations: e.target.checked
                          }
                        })}
                      />
                    }
                    label="Migrations"
                    sx={{ color: theme.palette.mode === 'light' ? '#212121' : '#ffffff' }}
                  />
                </Grid>
                <Grid item xs={6} md={3}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={formData.backupOptions.compression}
                        onChange={(e) => setFormData({
                          ...formData,
                          backupOptions: {
                            ...formData.backupOptions,
                            compression: e.target.checked
                          }
                        })}
                      />
                    }
                    label="Compression"
                    sx={{ color: theme.palette.mode === 'light' ? '#212121' : '#ffffff' }}
                  />
                </Grid>
              </Grid>
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.enabled}
                    onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
                  />
                }
                label="Enable Schedule"
                sx={{ color: theme.palette.mode === 'light' ? '#212121' : '#ffffff' }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ bgcolor: theme.palette.mode === 'light' ? '#f5f5f5' : '#424242' }}>
          <Button onClick={() => setOpenCreateDialog(false)} sx={{ color: theme.palette.mode === 'light' ? '#666' : '#ccc' }}>
            Cancel
          </Button>
          <Button
            onClick={handleCreateSchedule}
            variant="contained"
            disabled={createScheduleMutation.isPending || !formData.name}
            sx={{ 
              bgcolor: theme.palette.mode === 'light' ? '#1976d2' : '#90caf9',
              color: theme.palette.mode === 'light' ? '#ffffff' : '#000000'
            }}
          >
            {createScheduleMutation.isPending ? <CircularProgress size={20} /> : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Schedule Dialog */}
      <Dialog open={openEditDialog} onClose={() => setOpenEditDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ 
          bgcolor: theme.palette.mode === 'light' ? '#f5f5f5' : '#424242',
          color: theme.palette.mode === 'light' ? '#212121' : '#ffffff'
        }}>
          Edit Schedule
        </DialogTitle>
        <DialogContent sx={{ bgcolor: theme.palette.mode === 'light' ? '#ffffff' : '#424242' }}>
          {/* Same form as create dialog */}
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Schedule Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                sx={{
                  '& .MuiInputLabel-root': {
                    color: theme.palette.mode === 'light' ? '#666' : '#ccc'
                  },
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': {
                      borderColor: theme.palette.mode === 'light' ? '#ccc' : '#666'
                    }
                  }
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={2}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                sx={{
                  '& .MuiInputLabel-root': {
                    color: theme.palette.mode === 'light' ? '#666' : '#ccc'
                  },
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': {
                      borderColor: theme.palette.mode === 'light' ? '#ccc' : '#666'
                    }
                  }
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Cron Expression"
                value={formData.cronExpression}
                onChange={(e) => setFormData({ ...formData, cronExpression: e.target.value })}
                helperText="Format: minute hour day month weekday"
                sx={{
                  '& .MuiInputLabel-root': {
                    color: theme.palette.mode === 'light' ? '#666' : '#ccc'
                  },
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': {
                      borderColor: theme.palette.mode === 'light' ? '#ccc' : '#666'
                    }
                  }
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel sx={{ color: theme.palette.mode === 'light' ? '#666' : '#ccc' }}>
                  Timezone
                </InputLabel>
                <Select
                  value={formData.timezone}
                  onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                  sx={{
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: theme.palette.mode === 'light' ? '#ccc' : '#666'
                    }
                  }}
                >
                  <MenuItem value="Europe/Istanbul">Europe/Istanbul</MenuItem>
                  <MenuItem value="UTC">UTC</MenuItem>
                  <MenuItem value="America/New_York">America/New_York</MenuItem>
                  <MenuItem value="Europe/London">Europe/London</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <Divider sx={{ my: 2, borderColor: theme.palette.mode === 'light' ? '#ccc' : '#666' }} />
              <Typography variant="h6" sx={{ mb: 2, color: theme.palette.mode === 'light' ? '#212121' : '#ffffff' }}>
                Backup Options
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6} md={3}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={formData.backupOptions.includeDatabase}
                        onChange={(e) => setFormData({
                          ...formData,
                          backupOptions: {
                            ...formData.backupOptions,
                            includeDatabase: e.target.checked
                          }
                        })}
                      />
                    }
                    label="Database"
                    sx={{ color: theme.palette.mode === 'light' ? '#212121' : '#ffffff' }}
                  />
                </Grid>
                <Grid item xs={6} md={3}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={formData.backupOptions.includeEdgeFunctions}
                        onChange={(e) => setFormData({
                          ...formData,
                          backupOptions: {
                            ...formData.backupOptions,
                            includeEdgeFunctions: e.target.checked
                          }
                        })}
                      />
                    }
                    label="Edge Functions"
                    sx={{ color: theme.palette.mode === 'light' ? '#212121' : '#ffffff' }}
                  />
                </Grid>
                <Grid item xs={6} md={3}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={formData.backupOptions.includeMigrations}
                        onChange={(e) => setFormData({
                          ...formData,
                          backupOptions: {
                            ...formData.backupOptions,
                            includeMigrations: e.target.checked
                          }
                        })}
                      />
                    }
                    label="Migrations"
                    sx={{ color: theme.palette.mode === 'light' ? '#212121' : '#ffffff' }}
                  />
                </Grid>
                <Grid item xs={6} md={3}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={formData.backupOptions.compression}
                        onChange={(e) => setFormData({
                          ...formData,
                          backupOptions: {
                            ...formData.backupOptions,
                            compression: e.target.checked
                          }
                        })}
                      />
                    }
                    label="Compression"
                    sx={{ color: theme.palette.mode === 'light' ? '#212121' : '#ffffff' }}
                  />
                </Grid>
              </Grid>
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.enabled}
                    onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
                  />
                }
                label="Enable Schedule"
                sx={{ color: theme.palette.mode === 'light' ? '#212121' : '#ffffff' }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ bgcolor: theme.palette.mode === 'light' ? '#f5f5f5' : '#424242' }}>
          <Button onClick={() => setOpenEditDialog(false)} sx={{ color: theme.palette.mode === 'light' ? '#666' : '#ccc' }}>
            Cancel
          </Button>
          <Button
            onClick={handleEditSchedule}
            variant="contained"
            disabled={updateScheduleMutation.isPending || !formData.name}
            sx={{ 
              bgcolor: theme.palette.mode === 'light' ? '#1976d2' : '#90caf9',
              color: theme.palette.mode === 'light' ? '#ffffff' : '#000000'
            }}
          >
            {updateScheduleMutation.isPending ? <CircularProgress size={20} /> : 'Update'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Error Alerts */}
      {createScheduleMutation.isError && (
        <Alert severity="error" sx={{ mt: 2, bgcolor: theme.palette.mode === 'light' ? '#ffebee' : '#4a1c1c' }}>
          Failed to create schedule: {createScheduleMutation.error?.message}
        </Alert>
      )}

      {updateScheduleMutation.isError && (
        <Alert severity="error" sx={{ mt: 2, bgcolor: theme.palette.mode === 'light' ? '#ffebee' : '#4a1c1c' }}>
          Failed to update schedule: {updateScheduleMutation.error?.message}
        </Alert>
      )}

      {deleteScheduleMutation.isError && (
        <Alert severity="error" sx={{ mt: 2, bgcolor: theme.palette.mode === 'light' ? '#ffebee' : '#4a1c1c' }}>
          Failed to delete schedule: {deleteScheduleMutation.error?.message}
        </Alert>
      )}

      {triggerScheduleMutation.isError && (
        <Alert severity="error" sx={{ mt: 2, bgcolor: theme.palette.mode === 'light' ? '#ffebee' : '#4a1c1c' }}>
          Failed to trigger schedule: {triggerScheduleMutation.error?.message}
        </Alert>
      )}

      {/* Zip Viewer Dialog */}
      {zipViewerOpen && selectedBackupForZip && (
        <ZipViewer
          backupId={selectedBackupForZip}
          onClose={() => {
            setZipViewerOpen(false);
            setSelectedBackupForZip('');
          }}
        />
      )}
    </Box>
  );
};

export default SchedulingDashboardPage;
