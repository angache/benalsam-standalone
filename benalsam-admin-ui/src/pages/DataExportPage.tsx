import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tooltip,
  Divider
} from '@mui/material';
import {
  Download as DownloadIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Refresh as RefreshIcon,
  Schedule as ScheduleIcon,
  FileDownload as FileDownloadIcon,
  Description as DescriptionIcon
} from '@mui/icons-material';
import { apiService } from '../services/api';
import { usePerformanceMonitoring } from '../hooks/usePerformanceMonitoring';

interface ExportRequest {
  id: string;
  session_id?: string;
  export_type: 'csv' | 'json' | 'excel' | 'pdf';
  data_type: 'session_analytics' | 'performance_metrics' | 'business_metrics' | 'custom';
  filters: {
    date_range?: {
      start: string;
      end: string;
    };
    metrics?: string[];
    user_segments?: string[];
    custom_dimensions?: Record<string, any>;
  };
  schedule?: {
    frequency: 'daily' | 'weekly' | 'monthly' | 'custom';
    time?: string;
    days?: string[];
  };
  status: 'pending' | 'processing' | 'completed' | 'failed';
  created_at: string;
  completed_at?: string;
  file_path?: string;
  file_size?: number;
  error_message?: string;
}

interface ExportFormat {
  type: string;
  name: string;
  description: string;
  extensions: string[];
}

interface DataType {
  type: string;
  name: string;
  description: string;
  available_metrics: string[];
}

const DataExportPage: React.FC = () => {
  // Performance monitoring
  const { startMonitoring, stopMonitoring } = usePerformanceMonitoring('DataExportPage');
  
  const [exportRequests, setExportRequests] = useState<ExportRequest[]>([]);
  const [formats, setFormats] = useState<ExportFormat[]>([]);
  const [dataTypes, setDataTypes] = useState<DataType[]>([]);
  const [statistics, setStatistics] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // New export form state
  const [showNewExportDialog, setShowNewExportDialog] = useState(false);
  const [newExport, setNewExport] = useState({
    export_type: 'csv' as const,
    data_type: 'session_analytics' as const,
    filters: {
      date_range: {
        start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0]
      }
    }
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [requests, formatsData, dataTypesData, stats] = await Promise.all([
        apiService.getExportRequests(),
        apiService.getExportFormats(),
        apiService.getExportDataTypes(),
        apiService.getExportStatistics()
      ]);

      setExportRequests(requests || []);
      setFormats(formatsData || []);
      setDataTypes(dataTypesData || []);
      setStatistics(stats || {});
    } catch (err: any) {
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateExport = async () => {
    try {
      setLoading(true);
      const result = await apiService.quickExport(newExport);
      setSuccess('Export created successfully!');
      setShowNewExportDialog(false);
      loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to create export');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadExport = async (exportId: string) => {
    try {
      const blob = await apiService.downloadExport(exportId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `export_${exportId}.${newExport.export_type}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      setError(err.message || 'Failed to download export');
    }
  };

  const handleDeleteExport = async (exportId: string) => {
    try {
      await apiService.deleteExport(exportId);
      setSuccess('Export deleted successfully!');
      loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to delete export');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'processing': return 'warning';
      case 'failed': return 'error';
      default: return 'default';
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'N/A';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading && exportRequests.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Data Export Dashboard
        </Typography>
        <Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setShowNewExportDialog(true)}
            sx={{ mr: 1 }}
          >
            New Export
          </Button>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={loadData}
          >
            Refresh
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {/* Statistics Cards */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Exports
              </Typography>
              <Typography variant="h4">
                {statistics.total_exports || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Completed
              </Typography>
              <Typography variant="h4" color="success.main">
                {statistics.completed_exports || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Processing
              </Typography>
              <Typography variant="h4" color="warning.main">
                {statistics.processing_exports || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Failed
              </Typography>
              <Typography variant="h4" color="error.main">
                {statistics.failed_exports || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Export Requests Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Export History
          </Typography>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Data Type</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell>File Size</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {exportRequests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell>
                      <Typography variant="body2" fontFamily="monospace">
                        {request.id.substring(0, 8)}...
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={request.export_type.toUpperCase()}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {dataTypes.find(dt => dt.type === request.data_type)?.name || request.data_type}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={request.status}
                        size="small"
                        color={getStatusColor(request.status) as any}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {formatDate(request.created_at)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {formatFileSize(request.file_size)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" gap={1}>
                        {request.status === 'completed' && (
                          <Tooltip title="Download">
                            <IconButton
                              size="small"
                              onClick={() => handleDownloadExport(request.id)}
                            >
                              <DownloadIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                        <Tooltip title="Delete">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDeleteExport(request.id)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* New Export Dialog */}
      <Dialog
        open={showNewExportDialog}
        onClose={() => setShowNewExportDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <AddIcon />
            Create New Export
          </Box>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Export Format</InputLabel>
                <Select
                  value={newExport.export_type}
                  onChange={(e) => setNewExport({
                    ...newExport,
                    export_type: e.target.value as any
                  })}
                >
                  {formats.map((format) => (
                    <MenuItem key={format.type} value={format.type}>
                      <Box>
                        <Typography variant="body1">{format.name}</Typography>
                        <Typography variant="caption" color="textSecondary">
                          {format.description}
                        </Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Data Type</InputLabel>
                <Select
                  value={newExport.data_type}
                  onChange={(e) => setNewExport({
                    ...newExport,
                    data_type: e.target.value as any
                  })}
                >
                  {dataTypes.map((dataType) => (
                    <MenuItem key={dataType.type} value={dataType.type}>
                      <Box>
                        <Typography variant="body1">{dataType.name}</Typography>
                        <Typography variant="caption" color="textSecondary">
                          {dataType.description}
                        </Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Start Date"
                type="date"
                value={newExport.filters.date_range.start}
                onChange={(e) => setNewExport({
                  ...newExport,
                  filters: {
                    ...newExport.filters,
                    date_range: {
                      ...newExport.filters.date_range,
                      start: e.target.value
                    }
                  }
                })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="End Date"
                type="date"
                value={newExport.filters.date_range.end}
                onChange={(e) => setNewExport({
                  ...newExport,
                  filters: {
                    ...newExport.filters,
                    date_range: {
                      ...newExport.filters.date_range,
                      end: e.target.value
                    }
                  }
                })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowNewExportDialog(false)}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleCreateExport}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : <FileDownloadIcon />}
          >
            Create Export
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DataExportPage; 