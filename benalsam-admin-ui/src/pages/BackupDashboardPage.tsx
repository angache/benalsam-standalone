import React, { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  Alert,
  AlertTitle,
  CircularProgress,
  Tooltip,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  Backup as BackupIcon,
  Restore as RestoreIcon,
  Delete as DeleteIcon,
  Download as DownloadIcon,
  Add as AddIcon,
  Refresh as RefreshIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Storage as StorageIcon,
  Schedule as ScheduleIcon,
  Security as SecurityIcon,
  ExpandMore as ExpandMoreIcon,
  Terminal as TerminalIcon,
  FolderZip as FolderZipIcon
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiService from '../services/api';
import ZipViewer from '../components/ZipViewer';
import ActionButtonGroup from '../components/ActionButtonGroup';

// Backup types
interface BackupInfo {
  id: string;
  timestamp: string;
  size: number;
  type: 'full' | 'incremental';
  status: 'completed' | 'failed' | 'in_progress';
  databaseSize: number;
  edgeFunctionsCount: number;
  migrationsCount: number;
  checksum: string;
  description?: string;
  tags?: string[];
}

interface BackupStats {
  totalBackups: number;
  totalSize: number;
  averageSize: number;
  oldestBackup: number | null;
  newestBackup: number | null;
  successfulBackups: number;
  failedBackups: number;
  inProgressBackups: number;
  totalEdgeFunctions: number;
  totalMigrations: number;
}

const BackupDashboardPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { mode } = useTheme();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState<BackupInfo | null>(null);
  const [createForm, setCreateForm] = useState({
    description: '',
    tags: [] as string[]
  });
  const [restoreOptions, setRestoreOptions] = useState({
    dryRun: false,
    includeEdgeFunctions: true,
    includeMigrations: true,
    backupBeforeRestore: true
  });
  const [zipViewerOpen, setZipViewerOpen] = useState(false);
  const [selectedBackupForZip, setSelectedBackupForZip] = useState<string>('');

  // Supabase CLI states
  const [supabaseStatus, setSupabaseStatus] = useState<any>(null);
  const [supabaseProject, setSupabaseProject] = useState<any>(null);
  const [supabaseFunctions, setSupabaseFunctions] = useState<any>(null);
  const [commandDialogOpen, setCommandDialogOpen] = useState(false);
  const [commandInput, setCommandInput] = useState('');
  const [commandResult, setCommandResult] = useState<any>(null);

  // Fetch backups
  const { 
    data: backupsData, 
    isLoading: backupsLoading, 
    error: backupsError,
    refetch: refetchBackups
  } = useQuery({
    queryKey: ['backups'],
    queryFn: () => apiService.getBackups(),
    refetchInterval: 30000, // 30 seconds
  });

  // Fetch backup statistics
  const { 
    data: statsData, 
    isLoading: statsLoading 
  } = useQuery({
    queryKey: ['backup-stats'],
    queryFn: () => apiService.getBackupStats(),
    refetchInterval: 60000, // 1 minute
  });

  // Supabase CLI queries
  const { 
    data: supabaseStatusData, 
    isLoading: supabaseStatusLoading 
  } = useQuery({
    queryKey: ['supabaseStatus'],
    queryFn: () => apiService.getSupabaseStatus(),
    refetchInterval: 60000 // Refresh every minute
  });

  const { 
    data: supabaseProjectData, 
    isLoading: supabaseProjectLoading 
  } = useQuery({
    queryKey: ['supabaseProject'],
    queryFn: () => apiService.getSupabaseProject(),
    refetchInterval: 300000 // Refresh every 5 minutes
  });

  const { 
    data: supabaseFunctionsData, 
    isLoading: supabaseFunctionsLoading 
  } = useQuery({
    queryKey: ['supabaseFunctions'],
    queryFn: () => apiService.getSupabaseFunctions(),
    refetchInterval: 300000 // Refresh every 5 minutes
  });

  // Create backup mutation
  const createBackup = useMutation({
    mutationFn: (data: { description?: string; tags?: string[] }) => 
      apiService.createBackup(data.description, data.tags),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['backups'] });
      queryClient.invalidateQueries({ queryKey: ['backup-stats'] });
      setCreateDialogOpen(false);
      setCreateForm({ description: '', tags: [] });
    },
  });

  // Restore backup mutation
  const restoreBackup = useMutation({
    mutationFn: (data: { backupId: string; options: any }) => 
      apiService.restoreBackup(data.backupId, data.options),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['backups'] });
      setRestoreDialogOpen(false);
      setSelectedBackup(null);
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

  // Download backup
  const downloadBackup = async (backupId: string) => {
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

  // Validate backup
  const validateBackup = useMutation({
    mutationFn: (backupId: string) => apiService.validateBackup(backupId),
  });

  const backups = backupsData?.data?.backups || [];
  const stats = statsData?.data || {};

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'failed': return 'error';
      case 'in_progress': return 'warning';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircleIcon />;
      case 'failed': return <ErrorIcon />;
      case 'in_progress': return <WarningIcon />;
      default: return <InfoIcon />;
    }
  };

  const handleCreateBackup = () => {
    createBackup.mutate({
      description: createForm.description || undefined,
      tags: createForm.tags.length > 0 ? createForm.tags : undefined
    });
  };

  const handleRestoreBackup = () => {
    if (selectedBackup) {
      restoreBackup.mutate({
        backupId: selectedBackup.id,
        options: restoreOptions
      });
    }
  };

  const handleDeleteBackup = (backupId: string) => {
    if (window.confirm('Are you sure you want to delete this backup? This action cannot be undone.')) {
      deleteBackup.mutate(backupId);
    }
  };

  const handleExecuteCommand = async () => {
    if (!commandInput.trim()) return;
    
    try {
      setCommandDialogOpen(true);
      const result = await apiService.executeSupabaseCommand(commandInput);
      setCommandResult(result);
    } catch (error) {
      setCommandResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  const handleBatchCommand = async (title: string, command: string) => {
    try {
      setCommandDialogOpen(true);
      setCommandResult(null); // Reset previous result
      
      // Show loading state with better messaging
      setCommandResult({
        success: true,
        data: {
          command,
          stdout: `🚀 Executing: ${title}\n\n⏳ Please wait, this operation may take 2-5 minutes depending on the command.\n\n📋 Command: ${command}\n\n🔄 Processing...`,
          stderr: '',
          message: 'Command is running...'
        }
      });

      console.log(`🔄 Starting batch command: ${title}`, { command });
      const result = await apiService.executeSupabaseCommand(command);
      setCommandResult(result);
      
      // Refresh data after successful command
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ['supabaseStatus'] });
        queryClient.invalidateQueries({ queryKey: ['supabaseProject'] });
        queryClient.invalidateQueries({ queryKey: ['supabaseFunctions'] });
      }
    } catch (error) {
      setCommandResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Database Backup Management
      </Typography>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <StorageIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6" component="div">
                  {stats.totalBackups || 0}
                </Typography>
              </Box>
              <Typography color="text.secondary">Total Backups</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <CheckCircleIcon color="success" sx={{ mr: 1 }} />
                <Typography variant="h6" component="div" color="success.main">
                  {stats.successfulBackups || 0}
                </Typography>
              </Box>
              <Typography color="text.secondary">Successful</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <ErrorIcon color="error" sx={{ mr: 1 }} />
                <Typography variant="h6" component="div" color="error.main">
                  {stats.failedBackups || 0}
                </Typography>
              </Box>
              <Typography color="text.secondary">Failed</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <SecurityIcon color="info" sx={{ mr: 1 }} />
                <Typography variant="h6" component="div">
                  {formatFileSize(stats.totalSize || 0)}
                </Typography>
              </Box>
              <Typography color="text.secondary">Total Size</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Action Buttons */}
      <Box sx={{ mb: 3, display: 'flex', gap: 2 }}>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setCreateDialogOpen(true)}
          disabled={createBackup.isPending}
        >
          Create Backup
        </Button>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={() => refetchBackups()}
          disabled={backupsLoading}
        >
          Refresh
        </Button>
      </Box>

      {/* Backups Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" component="h2" mb={2}>
            Backup History
          </Typography>
          
          {backupsLoading ? (
            <Box display="flex" justifyContent="center" p={3}>
              <CircularProgress />
            </Box>
          ) : backupsError ? (
            <Alert severity="error" sx={{ 
              backgroundColor: mode === 'light' ? '#ffebee' : '#3e2723',
              color: mode === 'light' ? '#c62828' : '#ffcdd2'
            }}>
              <AlertTitle sx={{ color: mode === 'light' ? '#c62828' : '#ffcdd2' }}>Error</AlertTitle>
              Failed to load backups
            </Alert>
          ) : backups.length === 0 ? (
            <Alert severity="info" sx={{ 
              backgroundColor: mode === 'light' ? '#e3f2fd' : '#1a237e',
              color: mode === 'light' ? '#0d47a1' : '#e3f2fd'
            }}>
              <AlertTitle sx={{ color: mode === 'light' ? '#0d47a1' : '#e3f2fd' }}>No Backups</AlertTitle>
              No backups found. Create your first backup to get started.
            </Alert>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>ID</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Size</TableCell>
                    <TableCell>Created</TableCell>
                    <TableCell>Components</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {backups.map((backup: BackupInfo) => (
                    <TableRow key={backup.id}>
                      <TableCell>
                        <Typography variant="body2" fontFamily="monospace">
                          {backup.id.slice(0, 8)}...
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {backup.description || 'No description'}
                        </Typography>
                        {backup.tags && backup.tags.length > 0 && (
                          <Box sx={{ mt: 1 }}>
                            {backup.tags.map((tag, index) => (
                              <Chip
                                key={index}
                                label={tag}
                                size="small"
                                sx={{ mr: 0.5, mb: 0.5 }}
                              />
                            ))}
                          </Box>
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip
                          icon={getStatusIcon(backup.status)}
                          label={backup.status.replace('_', ' ')}
                          color={getStatusColor(backup.status) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {formatFileSize(backup.size)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {formatDate(backup.timestamp)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2">
                            DB: {formatFileSize(backup.databaseSize)}
                          </Typography>
                          <Typography variant="body2">
                            Functions: {backup.edgeFunctionsCount}
                          </Typography>
                          <Typography variant="body2">
                            Migrations: {backup.migrationsCount}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <ActionButtonGroup
                          primaryActions={[
                            {
                              icon: <FolderZipIcon fontSize="small" />,
                              tooltip: "İçeriği Görüntüle",
                              onClick: () => {
                                setSelectedBackupForZip(backup.id);
                                setZipViewerOpen(true);
                              },
                              disabled: backup.status !== 'completed',
                              color: 'secondary',
                              ariaLabel: "Backup içeriğini görüntüle"
                            },
                            {
                              icon: <DownloadIcon fontSize="small" />,
                              tooltip: "İndir",
                              onClick: () => downloadBackup(backup.id),
                              disabled: backup.status !== 'completed',
                              color: 'success',
                              ariaLabel: "Backup dosyasını indir"
                            }
                          ]}
                          secondaryActions={[
                            {
                              icon: <RestoreIcon fontSize="small" />,
                              tooltip: "Geri Yükle",
                              onClick: () => {
                                setSelectedBackup(backup);
                                setRestoreDialogOpen(true);
                              },
                              disabled: backup.status !== 'completed',
                              color: 'warning',
                              ariaLabel: "Backup'ı geri yükle"
                            },
                            {
                              icon: <CheckCircleIcon fontSize="small" />,
                              tooltip: "Doğrula",
                              onClick: () => validateBackup.mutate(backup.id),
                              loading: validateBackup.isPending,
                              color: 'primary',
                              ariaLabel: "Backup'ı doğrula"
                            }
                          ]}
                          destructiveActions={[
                            {
                              icon: <DeleteIcon fontSize="small" />,
                              tooltip: "Sil",
                              onClick: () => handleDeleteBackup(backup.id),
                              loading: deleteBackup.isPending,
                              color: 'error',
                              ariaLabel: "Backup'ı sil"
                            }
                          ]}
                          size="small"
                          justifyContent="flex-end"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Create Backup Dialog */}
      <Dialog 
        open={createDialogOpen} 
        onClose={() => setCreateDialogOpen(false)} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: mode === 'light' ? '#ffffff' : '#1e1e1e',
            color: mode === 'light' ? '#212121' : '#ffffff'
          }
        }}
      >
        <DialogTitle sx={{ backgroundColor: mode === 'light' ? '#ffffff' : '#1e1e1e', color: mode === 'light' ? '#212121' : '#ffffff' }}>Create New Backup</DialogTitle>
        <DialogContent sx={{ backgroundColor: mode === 'light' ? '#ffffff' : '#1e1e1e', color: mode === 'light' ? '#212121' : '#ffffff' }}>
          <TextField
            fullWidth
            label="Description"
            value={createForm.description}
            onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
            margin="normal"
            placeholder="e.g., Pre-deployment backup"
            sx={{
              '& .MuiInputLabel-root': {
                color: mode === 'light' ? '#666666' : '#b0b0b0'
              },
              '& .MuiOutlinedInput-root': {
                '& fieldset': {
                  borderColor: mode === 'light' ? '#e0e0e0' : '#444444'
                },
                '&:hover fieldset': {
                  borderColor: mode === 'light' ? '#1976d2' : '#42a5f5'
                },
                '&.Mui-focused fieldset': {
                  borderColor: mode === 'light' ? '#1976d2' : '#42a5f5'
                }
              },
              '& .MuiInputBase-input': {
                color: mode === 'light' ? '#212121' : '#ffffff'
              }
            }}
          />
          <TextField
            fullWidth
            label="Tags (comma-separated)"
            value={createForm.tags.join(', ')}
            onChange={(e) => setCreateForm({ 
              ...createForm, 
              tags: e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag)
            })}
            margin="normal"
            placeholder="e.g., production, deployment, critical"
            sx={{
              '& .MuiInputLabel-root': {
                color: mode === 'light' ? '#666666' : '#b0b0b0'
              },
              '& .MuiOutlinedInput-root': {
                '& fieldset': {
                  borderColor: mode === 'light' ? '#e0e0e0' : '#444444'
                },
                '&:hover fieldset': {
                  borderColor: mode === 'light' ? '#1976d2' : '#42a5f5'
                },
                '&.Mui-focused fieldset': {
                  borderColor: mode === 'light' ? '#1976d2' : '#42a5f5'
                }
              },
              '& .MuiInputBase-input': {
                color: mode === 'light' ? '#212121' : '#ffffff'
              }
            }}
          />
        </DialogContent>
        <DialogActions sx={{ backgroundColor: mode === 'light' ? '#ffffff' : '#1e1e1e', color: mode === 'light' ? '#212121' : '#ffffff' }}>
          <Button onClick={() => setCreateDialogOpen(false)} sx={{ color: mode === 'light' ? '#666666' : '#b0b0b0' }}>Cancel</Button>
          <Button 
            onClick={handleCreateBackup} 
            variant="contained"
            disabled={createBackup.isPending}
          >
            {createBackup.isPending ? <CircularProgress size={20} /> : 'Create Backup'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Supabase CLI Section */}
      <Accordion sx={{ mt: 3 }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Box display="flex" alignItems="center" gap={1}>
            <TerminalIcon />
            <Typography variant="h6">Supabase CLI Operations</Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={3}>
            {/* CLI Status */}
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    CLI Status
                  </Typography>
                  {supabaseStatusLoading ? (
                    <CircularProgress size={20} />
                  ) : supabaseStatusData?.data?.cliInstalled ? (
                    <Box>
                      <Chip 
                        label="Installed" 
                        color="success" 
                        size="small" 
                        sx={{ mb: 1 }}
                      />
                      <Typography variant="body2">
                        Version: {supabaseStatusData.data.version}
                      </Typography>
                    </Box>
                  ) : (
                    <Chip label="Not Installed" color="error" size="small" />
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* Project Info */}
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Project Info
                  </Typography>
                  {supabaseProjectLoading ? (
                    <CircularProgress size={20} />
                  ) : (
                    <Box>
                      <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
                        {supabaseProjectData?.data?.projects ? (
                          <Box>
                            {supabaseProjectData.data.projects.split('\n').map((line: string, index: number) => {
                              // Skip header lines and empty lines
                              if (line.includes('LINKED') || line.includes('--------') || line.trim() === '') {
                                return null;
                              }
                              
                              if (line.includes('|')) {
                                const parts = line.split('|').map(part => part.trim());
                                if (parts.length >= 5) {
                                  return (
                                    <Card key={index} sx={{ 
                                      mb: 1, 
                                      p: 2, 
                                      bgcolor: mode === 'light' ? '#f8f9fa' : '#3a3a3a',
                                      border: '1px solid',
                                      borderColor: mode === 'light' ? '#e9ecef' : '#555555'
                                    }}>
                                      <Typography variant="subtitle2" sx={{ 
                                        color: mode === 'light' ? '#1976d2' : '#42a5f5',
                                        fontWeight: 'bold',
                                        mb: 1
                                      }}>
                                        {parts[3]} {/* NAME */}
                                      </Typography>
                                      <Grid container spacing={1}>
                                        <Grid item xs={6}>
                                          <Typography variant="caption" sx={{ color: mode === 'light' ? '#666666' : '#b0b0b0' }}>
                                            Reference ID:
                                          </Typography>
                                          <Typography variant="body2" sx={{ color: mode === 'light' ? '#212121' : '#ffffff', fontFamily: 'monospace' }}>
                                            {parts[2]}
                                          </Typography>
                                        </Grid>
                                        <Grid item xs={6}>
                                          <Typography variant="caption" sx={{ color: mode === 'light' ? '#666666' : '#b0b0b0' }}>
                                            Region:
                                          </Typography>
                                          <Typography variant="body2" sx={{ color: mode === 'light' ? '#212121' : '#ffffff' }}>
                                            {parts[4]}
                                          </Typography>
                                        </Grid>
                                        <Grid item xs={6}>
                                          <Typography variant="caption" sx={{ color: mode === 'light' ? '#666666' : '#b0b0b0' }}>
                                            Created:
                                          </Typography>
                                          <Typography variant="body2" sx={{ color: mode === 'light' ? '#212121' : '#ffffff' }}>
                                            {parts[5]}
                                          </Typography>
                                        </Grid>
                                        <Grid item xs={6}>
                                          <Typography variant="caption" sx={{ color: mode === 'light' ? '#666666' : '#b0b0b0' }}>
                                            Org ID:
                                          </Typography>
                                          <Typography variant="body2" sx={{ color: mode === 'light' ? '#212121' : '#ffffff', fontFamily: 'monospace' }}>
                                            {parts[1]}
                                          </Typography>
                                        </Grid>
                                      </Grid>
                                    </Card>
                                  );
                                }
                              }
                              return null;
                            })}
                          </Box>
                        ) : (
                          <Typography variant="body2" sx={{ color: mode === 'light' ? '#666666' : '#b0b0b0' }}>
                            No project data
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* Functions */}
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Edge Functions
                  </Typography>
                  {supabaseFunctionsLoading ? (
                    <CircularProgress size={20} />
                  ) : (
                    <Box>
                      <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
                        {supabaseFunctionsData?.data?.functions ? (
                          <Box>
                            {supabaseFunctionsData.data.functions.split('\n').map((line: string, index: number) => {
                              // Skip header lines and empty lines
                              if (line.includes('ID') || line.includes('-----') || line.trim() === '') {
                                return null;
                              }
                              
                              if (line.includes('|')) {
                                const parts = line.split('|').map(part => part.trim());
                                if (parts.length >= 5) {
                                  return (
                                    <Card key={index} sx={{ 
                                      mb: 1, 
                                      p: 2, 
                                      bgcolor: mode === 'light' ? '#f8f9fa' : '#3a3a3a',
                                      border: '1px solid',
                                      borderColor: mode === 'light' ? '#e9ecef' : '#555555'
                                    }}>
                                      <Typography variant="subtitle2" sx={{ 
                                        color: mode === 'light' ? '#1976d2' : '#42a5f5',
                                        fontWeight: 'bold',
                                        mb: 1
                                      }}>
                                        {parts[1]} {/* NAME */}
                                      </Typography>
                                      <Typography variant="caption" sx={{ 
                                        color: mode === 'light' ? '#666666' : '#b0b0b0',
                                        fontFamily: 'monospace',
                                        display: 'block',
                                        mb: 1
                                      }}>
                                        ID: {parts[0]}
                                      </Typography>
                                      <Grid container spacing={1}>
                                        <Grid item xs={6}>
                                          <Typography variant="caption" sx={{ color: mode === 'light' ? '#666666' : '#b0b0b0' }}>
                                            Status:
                                          </Typography>
                                          <Chip 
                                            label={parts[3]} 
                                            size="small" 
                                            color={parts[3] === 'ACTIVE' ? 'success' : 'warning'}
                                            sx={{ ml: 1 }}
                                          />
                                        </Grid>
                                        <Grid item xs={6}>
                                          <Typography variant="caption" sx={{ color: mode === 'light' ? '#666666' : '#b0b0b0' }}>
                                            Version:
                                          </Typography>
                                          <Typography variant="body2" sx={{ color: mode === 'light' ? '#212121' : '#ffffff', fontFamily: 'monospace' }}>
                                            {parts[4]}
                                          </Typography>
                                        </Grid>
                                        <Grid item xs={6}>
                                          <Typography variant="caption" sx={{ color: mode === 'light' ? '#666666' : '#b0b0b0' }}>
                                            Updated:
                                          </Typography>
                                          <Typography variant="body2" sx={{ color: mode === 'light' ? '#212121' : '#ffffff' }}>
                                            {parts[5]}
                                          </Typography>
                                        </Grid>
                                        <Grid item xs={6}>
                                          <Typography variant="caption" sx={{ color: mode === 'light' ? '#666666' : '#b0b0b0' }}>
                                            Slug:
                                          </Typography>
                                          <Typography variant="body2" sx={{ color: mode === 'light' ? '#212121' : '#ffffff', fontFamily: 'monospace' }}>
                                            {parts[2]}
                                          </Typography>
                                        </Grid>

                                      </Grid>
                                    </Card>
                                  );
                                }
                              }
                              return null;
                            })}
                          </Box>
                        ) : (
                          <Typography variant="body2" sx={{ color: mode === 'light' ? '#666666' : '#b0b0b0' }}>
                            No functions data
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* Batch Commands */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Batch Operations
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={4}>
                      <Button
                        variant="outlined"
                        fullWidth
                        onClick={() => handleBatchCommand('Database Schema Dump', 'supabase db pull')}
                        disabled={supabaseStatusLoading}
                        sx={{ 
                          height: 80, 
                          flexDirection: 'column', 
                          gap: 1,
                          borderColor: 'primary.main',
                          '&:hover': {
                            borderColor: 'primary.dark',
                            backgroundColor: 'primary.50'
                          }
                        }}
                      >
                        <StorageIcon color="primary" />
                        <Typography variant="body2" color="primary.main" fontWeight="medium">
                          Database Schema
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Pull current schema
                        </Typography>
                      </Button>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Button
                        variant="outlined"
                        fullWidth
                        onClick={() => handleBatchCommand('Functions Backup', 'supabase functions list')}
                        disabled={supabaseStatusLoading}
                        sx={{ 
                          height: 80, 
                          flexDirection: 'column', 
                          gap: 1,
                          borderColor: 'primary.main',
                          '&:hover': {
                            borderColor: 'primary.dark',
                            backgroundColor: 'primary.50'
                          }
                        }}
                      >
                        <TerminalIcon color="primary" />
                        <Typography variant="body2" color="primary.main" fontWeight="medium">
                          Edge Functions
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          List all functions
                        </Typography>
                      </Button>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Button
                        variant="outlined"
                        fullWidth
                        onClick={() => handleBatchCommand('Migration Status', 'supabase migration list')}
                        disabled={supabaseStatusLoading}
                        sx={{ 
                          height: 80, 
                          flexDirection: 'column', 
                          gap: 1,
                          borderColor: 'primary.main',
                          '&:hover': {
                            borderColor: 'primary.dark',
                            backgroundColor: 'primary.50'
                          }
                        }}
                      >
                        <InfoIcon color="primary" />
                        <Typography variant="body2" color="primary.main" fontWeight="medium">
                          Migrations
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Check migration status
                        </Typography>
                      </Button>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Button
                        variant="outlined"
                        fullWidth
                        onClick={() => handleBatchCommand('Project Status', 'supabase status')}
                        disabled={supabaseStatusLoading}
                        sx={{ 
                          height: 80, 
                          flexDirection: 'column', 
                          gap: 1,
                          borderColor: 'primary.main',
                          '&:hover': {
                            borderColor: 'primary.dark',
                            backgroundColor: 'primary.50'
                          }
                        }}
                      >
                        <CheckCircleIcon color="primary" />
                        <Typography variant="body2" color="primary.main" fontWeight="medium">
                          Project Status
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Check project health
                        </Typography>
                      </Button>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Button
                        variant="outlined"
                        fullWidth
                        onClick={() => handleBatchCommand('Database Diff', 'supabase db diff')}
                        disabled={supabaseStatusLoading}
                        sx={{ 
                          height: 80, 
                          flexDirection: 'column', 
                          gap: 1,
                          borderColor: 'primary.main',
                          '&:hover': {
                            borderColor: 'primary.dark',
                            backgroundColor: 'primary.50'
                          }
                        }}
                      >
                        <WarningIcon color="primary" />
                        <Typography variant="body2" color="primary.main" fontWeight="medium">
                          Schema Diff
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Compare schemas
                        </Typography>
                      </Button>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Button
                        variant="outlined"
                        fullWidth
                        onClick={() => handleBatchCommand('Complete Backup', 'supabase db pull && supabase functions list')}
                        disabled={supabaseStatusLoading}
                        sx={{ 
                          height: 80, 
                          flexDirection: 'column', 
                          gap: 1,
                          borderColor: 'primary.main',
                          '&:hover': {
                            borderColor: 'primary.dark',
                            backgroundColor: 'primary.50'
                          }
                        }}
                      >
                        <BackupIcon color="primary" />
                        <Typography variant="body2" color="primary.main" fontWeight="medium">
                          Complete Backup
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Schema + Functions
                        </Typography>
                      </Button>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            {/* Manual Command Execution */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Manual Command
                  </Typography>
                  <Box display="flex" gap={2} alignItems="center">
                    <TextField
                      fullWidth
                      label="Supabase CLI Command"
                      value={commandInput}
                      onChange={(e) => setCommandInput(e.target.value)}
                      placeholder="e.g., supabase db pull"
                      sx={{ 
                        flexGrow: 1,
                        '& .MuiInputLabel-root': {
                          color: mode === 'light' ? '#666666' : '#b0b0b0'
                        },
                        '& .MuiOutlinedInput-root': {
                          '& fieldset': {
                            borderColor: mode === 'light' ? '#e0e0e0' : '#444444'
                          },
                          '&:hover fieldset': {
                            borderColor: mode === 'light' ? '#1976d2' : '#42a5f5'
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: mode === 'light' ? '#1976d2' : '#42a5f5'
                          }
                        },
                        '& .MuiInputBase-input': {
                          color: mode === 'light' ? '#212121' : '#ffffff'
                        }
                      }}
                    />
                    <Button
                      variant="contained"
                      onClick={handleExecuteCommand}
                      disabled={!commandInput.trim()}
                    >
                      Execute
                    </Button>
                  </Box>
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                    Allowed commands: db pull, functions list, projects list, status, migration list, db diff, migration repair
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>

      {/* Command Result Dialog */}
      <Dialog 
        open={commandDialogOpen} 
        onClose={() => setCommandDialogOpen(false)} 
        maxWidth="md" 
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: mode === 'light' ? '#ffffff' : '#1e1e1e',
            color: mode === 'light' ? '#212121' : '#ffffff'
          }
        }}
      >
        <DialogTitle sx={{ backgroundColor: mode === 'light' ? '#ffffff' : '#1e1e1e', color: mode === 'light' ? '#212121' : '#ffffff' }}>
          <Box display="flex" alignItems="center" gap={2}>
            {commandResult?.success ? (
              <CheckCircleIcon color="success" />
            ) : commandResult?.error ? (
              <ErrorIcon color="error" />
            ) : (
              <CircularProgress size={20} />
            )}
            <Typography variant="h6" sx={{ color: mode === 'light' ? '#212121' : '#ffffff' }}>
              Command Result
              {commandResult?.success && (
                <Chip 
                  label="SUCCESS" 
                  color="success" 
                  size="small" 
                  sx={{ ml: 2 }}
                />
              )}
              {commandResult?.error && (
                <Chip 
                  label="ERROR" 
                  color="error" 
                  size="small" 
                  sx={{ ml: 2 }}
                />
              )}
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ backgroundColor: mode === 'light' ? '#ffffff' : '#1e1e1e', color: mode === 'light' ? '#212121' : '#ffffff' }}>
          {commandResult ? (
            <Box>
                              <Box sx={{ mb: 2, p: 2, bgcolor: mode === 'light' ? 'grey.50' : 'grey.800', borderRadius: 1 }}>
                <Typography variant="subtitle1" fontWeight="medium" gutterBottom sx={{ color: mode === 'light' ? '#212121' : '#ffffff' }}>
                  Executed Command:
                </Typography>
                                 <Typography 
                   variant="body2" 
                   fontFamily="monospace" 
                   sx={{ 
                     bgcolor: mode === 'light' ? '#f5f5f5' : '#2d2d2d', 
                     color: mode === 'light' ? '#212121' : '#ffffff',
                     p: 1, 
                     borderRadius: 0.5,
                     border: '1px solid',
                     borderColor: mode === 'light' ? '#e0e0e0' : '#444444'
                   }}
                 >
                   {commandResult.data?.command || 'N/A'}
                 </Typography>
              </Box>
              
              <Divider sx={{ my: 2, borderColor: mode === 'light' ? '#e0e0e0' : '#444444' }} />
              
              {commandResult.error ? (
                <Alert severity="error" sx={{ 
                  mb: 2,
                  backgroundColor: mode === 'light' ? '#ffebee' : '#3e2723',
                  color: mode === 'light' ? '#c62828' : '#ffcdd2'
                }}>
                  <AlertTitle sx={{ color: mode === 'light' ? '#c62828' : '#ffcdd2' }}>Command Failed</AlertTitle>
                  {commandResult.error}
                </Alert>
              ) : null}
              
              {commandResult.data?.stdout && (
                <Box>
                  <Box display="flex" alignItems="center" gap={1} mb={1}>
                    <CheckCircleIcon color="success" fontSize="small" />
                    <Typography variant="subtitle2" fontWeight="medium" sx={{ color: mode === 'light' ? '#212121' : '#ffffff' }}>
                      Command Output ({commandResult.data.stdout.split('\n').length} lines):
                    </Typography>
                  </Box>
                  <Paper 
                    sx={{ 
                      p: 2, 
                      bgcolor: mode === 'light' ? '#f5f5f5' : '#2d2d2d', 
                      fontFamily: 'monospace', 
                      fontSize: '0.8rem',
                      border: '1px solid',
                      borderColor: mode === 'light' ? '#e0e0e0' : '#444444',
                      maxHeight: 400,
                      overflow: 'auto'
                    }}
                  >
                    <pre style={{ 
                      margin: 0, 
                      whiteSpace: 'pre-wrap',
                      color: mode === 'light' ? '#212121' : '#ffffff',
                      fontFamily: 'monospace',
                      lineHeight: '1.4'
                    }}>
                      {commandResult.data.stdout}
                    </pre>
                  </Paper>
                </Box>
              )}
              
              {commandResult.data?.stderr && (
                <Box sx={{ mt: 2 }}>
                  <Box display="flex" alignItems="center" gap={1} mb={1}>
                    <WarningIcon color="warning" fontSize="small" />
                    <Typography variant="subtitle2" fontWeight="medium" sx={{ color: mode === 'light' ? '#856404' : '#ffcc02' }}>
                      Warnings/Errors ({commandResult.data.stderr.split('\n').length} lines):
                    </Typography>
                  </Box>
                  <Paper 
                    sx={{ 
                      p: 2, 
                      bgcolor: mode === 'light' ? '#fff3cd' : '#3d2c02', 
                      fontFamily: 'monospace', 
                      fontSize: '0.8rem',
                      border: '1px solid',
                      borderColor: mode === 'light' ? '#ffc107' : '#ffb74d',
                      maxHeight: 200,
                      overflow: 'auto'
                    }}
                  >
                    <pre style={{ 
                      margin: 0, 
                      whiteSpace: 'pre-wrap', 
                      color: mode === 'light' ? '#856404' : '#ffcc02',
                      fontFamily: 'monospace',
                      lineHeight: '1.4'
                    }}>
                      {commandResult.data.stderr}
                    </pre>
                  </Paper>
                </Box>
              )}
              
              {!commandResult.data?.stdout && !commandResult.data?.stderr && !commandResult.error && (
                <Alert severity="info" sx={{ 
                  backgroundColor: mode === 'light' ? '#e3f2fd' : '#1a237e',
                  color: mode === 'light' ? '#0d47a1' : '#e3f2fd'
                }}>
                  <AlertTitle sx={{ color: mode === 'light' ? '#0d47a1' : '#e3f2fd' }}>No Output</AlertTitle>
                  Command executed successfully but produced no output.
                </Alert>
              )}
            </Box>
          ) : (
            <Box display="flex" justifyContent="center" p={3}>
              <CircularProgress />
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ backgroundColor: mode === 'light' ? '#ffffff' : '#1e1e1e', color: mode === 'light' ? '#212121' : '#ffffff' }}>
          <Button onClick={() => setCommandDialogOpen(false)} sx={{ color: mode === 'light' ? '#1976d2' : '#42a5f5' }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Restore Backup Dialog */}
      <Dialog 
        open={restoreDialogOpen} 
        onClose={() => setRestoreDialogOpen(false)} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: mode === 'light' ? '#ffffff' : '#1e1e1e',
            color: mode === 'light' ? '#212121' : '#ffffff'
          }
        }}
      >
        <DialogTitle sx={{ backgroundColor: mode === 'light' ? '#ffffff' : '#1e1e1e', color: mode === 'light' ? '#212121' : '#ffffff' }}>Restore Backup</DialogTitle>
        <DialogContent sx={{ backgroundColor: mode === 'light' ? '#ffffff' : '#1e1e1e', color: mode === 'light' ? '#212121' : '#ffffff' }}>
          {selectedBackup && (
            <Box>
              <Typography variant="body1" gutterBottom sx={{ color: mode === 'light' ? '#212121' : '#ffffff' }}>
                Restore backup: <strong>{selectedBackup.description || selectedBackup.id}</strong>
              </Typography>
              <Typography variant="body2" gutterBottom sx={{ color: mode === 'light' ? '#666666' : '#b0b0b0' }}>
                Created: {formatDate(selectedBackup.timestamp)}
              </Typography>
              
              <Divider sx={{ my: 2, borderColor: mode === 'light' ? '#e0e0e0' : '#444444' }} />
              
              <FormControlLabel
                control={
                  <Checkbox
                    checked={restoreOptions.dryRun}
                    onChange={(e) => setRestoreOptions({ ...restoreOptions, dryRun: e.target.checked })}
                  />
                }
                label="Dry Run (test without applying changes)"
                sx={{ color: mode === 'light' ? '#212121' : '#ffffff' }}
              />
              
              <FormControlLabel
                control={
                  <Checkbox
                    checked={restoreOptions.backupBeforeRestore}
                    onChange={(e) => setRestoreOptions({ ...restoreOptions, backupBeforeRestore: e.target.checked })}
                  />
                }
                label="Create backup before restore"
                sx={{ color: mode === 'light' ? '#212121' : '#ffffff' }}
              />
              
              <FormControlLabel
                control={
                  <Checkbox
                    checked={restoreOptions.includeEdgeFunctions}
                    onChange={(e) => setRestoreOptions({ ...restoreOptions, includeEdgeFunctions: e.target.checked })}
                  />
                }
                label="Include Edge Functions"
                sx={{ color: mode === 'light' ? '#212121' : '#ffffff' }}
              />
              
              <FormControlLabel
                control={
                  <Checkbox
                    checked={restoreOptions.includeMigrations}
                    onChange={(e) => setRestoreOptions({ ...restoreOptions, includeMigrations: e.target.checked })}
                  />
                }
                label="Include Migrations"
                sx={{ color: mode === 'light' ? '#212121' : '#ffffff' }}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ backgroundColor: mode === 'light' ? '#ffffff' : '#1e1e1e', color: mode === 'light' ? '#212121' : '#ffffff' }}>
          <Button onClick={() => setRestoreDialogOpen(false)} sx={{ color: mode === 'light' ? '#666666' : '#b0b0b0' }}>Cancel</Button>
          <Button 
            onClick={handleRestoreBackup} 
            variant="contained"
            color="warning"
            disabled={restoreBackup.isPending}
          >
            {restoreBackup.isPending ? <CircularProgress size={20} /> : 'Restore Backup'}
          </Button>
        </DialogActions>
      </Dialog>

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

export default BackupDashboardPage;
