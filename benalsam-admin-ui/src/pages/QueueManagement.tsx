import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  CardHeader,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Divider,
  IconButton,
  Tooltip
} from '@mui/material';
import { 
  Refresh as RefreshIcon, 
  PlayArrow as StartIcon,
  Stop as StopIcon,
  Replay as RetryIcon,
  Delete as ClearIcon,
  Warning as WarningIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon
} from '@mui/icons-material';

interface QueueJob {
  id: number;
  table_name: string;
  operation: string;
  record_id: string;
  change_data: any;
  status: string;
  retry_count: number;
  error_message?: string;
  created_at: string;
  processed_at?: string;
}

interface QueueStats {
  total: number;
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  stuck: number;
  avgProcessingTime: number;
  lastProcessedAt?: string;
}

interface QueueHealth {
  isHealthy: boolean;
  issues: string[];
  recommendations: string[];
}

const QueueManagement: React.FC = () => {
  const [queueStats, setQueueStats] = useState<QueueStats | null>(null);
  const [queueHealth, setQueueHealth] = useState<QueueHealth | null>(null);
  const [queueJobs, setQueueJobs] = useState<QueueJob[]>([]);
  const [selectedJobStatus, setSelectedJobStatus] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);

  // Auto refresh effect
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        fetchQueueStats();
        fetchQueueHealth();
        fetchQueueJobs(selectedJobStatus);
      }, 5000); // 5 saniye

      return () => clearInterval(interval);
    }
  }, [autoRefresh, selectedJobStatus]);

  // Initial load
  useEffect(() => {
    fetchQueueStats();
    fetchQueueHealth();
    fetchQueueJobs();
  }, []);

  const fetchQueueStats = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/elasticsearch/queue/stats`);
      const data = await response.json();
      if (data.success) {
        setQueueStats(data.data);
      }
    } catch (error) {
      console.error('Error fetching queue stats:', error);
    }
  };

  const fetchQueueHealth = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/elasticsearch/queue/health`);
      const data = await response.json();
      if (data.success) {
        setQueueHealth(data.data);
      }
    } catch (error) {
      console.error('Error fetching queue health:', error);
    }
  };

  const fetchQueueJobs = async (status?: string) => {
    try {
      const params = new URLSearchParams();
      if (status) params.append('status', status);
      params.append('limit', '50');
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/elasticsearch/queue/jobs?${params}`);
      const data = await response.json();
      if (data.success) {
        setQueueJobs(data.data);
      }
    } catch (error) {
      console.error('Error fetching queue jobs:', error);
    }
  };

  const startQueueProcessor = async () => {
    setLoading(true);
    setMessage({ text: 'Queue processor başlatılıyor...', type: 'info' });

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/elasticsearch/queue/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await response.json();
      
      if (data.success) {
        setMessage({ text: 'Queue processor başarıyla başlatıldı.', type: 'success' });
        fetchQueueStats();
        fetchQueueHealth();
      } else {
        setMessage({ text: data.message || 'Queue processor başlatılırken hata oluştu', type: 'error' });
      }
    } catch (error) {
      console.error('Error starting queue processor:', error);
      setMessage({ text: 'Queue processor başlatılırken hata oluştu', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const stopQueueProcessor = async () => {
    setLoading(true);
    setMessage({ text: 'Queue processor durduruluyor...', type: 'info' });

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/elasticsearch/queue/stop`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await response.json();
      
      if (data.success) {
        setMessage({ text: 'Queue processor başarıyla durduruldu.', type: 'success' });
        fetchQueueStats();
        fetchQueueHealth();
      } else {
        setMessage({ text: data.message || 'Queue processor durdurulurken hata oluştu', type: 'error' });
      }
    } catch (error) {
      console.error('Error stopping queue processor:', error);
      setMessage({ text: 'Queue processor durdurulurken hata oluştu', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const retryFailedJobs = async () => {
    if (!confirm('Başarısız job\'ları yeniden denemek istediğinizden emin misiniz?')) {
      return;
    }

    setLoading(true);
    setMessage({ text: 'Başarısız job\'lar yeniden deneniyor...', type: 'info' });

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/elasticsearch/queue/retry-failed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await response.json();
      
      if (data.success) {
        setMessage({ text: `${data.data.retriedJobs} başarısız job yeniden denendi.`, type: 'success' });
        fetchQueueStats();
        fetchQueueHealth();
        fetchQueueJobs(selectedJobStatus);
      } else {
        setMessage({ text: data.message || 'Job\'lar yeniden denenirken hata oluştu', type: 'error' });
      }
    } catch (error) {
      console.error('Error retrying failed jobs:', error);
      setMessage({ text: 'Job\'lar yeniden denenirken hata oluştu', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const clearQueue = async (status?: string) => {
    const statusText = status ? ` (${status})` : '';
    if (!confirm(`Queue'yu temizlemek istediğinizden emin misiniz?${statusText}`)) {
      return;
    }

    setLoading(true);
    setMessage({ text: `Queue temizleniyor${statusText}...`, type: 'info' });

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/elasticsearch/queue/clear`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });

      const data = await response.json();
      
      if (data.success) {
        setMessage({ text: `${data.data.clearedJobs} job queue'dan temizlendi.`, type: 'success' });
        fetchQueueStats();
        fetchQueueHealth();
        fetchQueueJobs(selectedJobStatus);
      } else {
        setMessage({ text: data.message || 'Queue temizlenirken hata oluştu', type: 'error' });
      }
    } catch (error) {
      console.error('Error clearing queue:', error);
      setMessage({ text: 'Queue temizlenirken hata oluştu', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'failed': return 'error';
      case 'processing': return 'info';
      case 'pending': return 'warning';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <SuccessIcon />;
      case 'failed': return <ErrorIcon />;
      case 'processing': return <CircularProgress size={16} />;
      case 'pending': return <WarningIcon />;
      default: return null;
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Queue Yönetimi
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <Button
            variant={autoRefresh ? 'contained' : 'outlined'}
            color={autoRefresh ? 'success' : 'primary'}
            onClick={() => setAutoRefresh(!autoRefresh)}
            size="small"
          >
            {autoRefresh ? 'Auto Refresh Açık' : 'Auto Refresh Kapalı'}
          </Button>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={() => {
              fetchQueueStats();
              fetchQueueHealth();
              fetchQueueJobs(selectedJobStatus);
            }}
            disabled={loading}
          >
            Yenile
          </Button>
        </Box>
      </Box>

      {message && (
        <Alert severity={message.type} sx={{ mb: 3 }} onClose={() => setMessage(null)}>
          {message.text}
        </Alert>
      )}

      {/* Queue Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="primary">
                {queueStats?.total || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Toplam Job
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="warning.main">
                {queueStats?.pending || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Bekleyen
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="info.main">
                {queueStats?.processing || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                İşlenen
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="success.main">
                {queueStats?.completed || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Tamamlanan
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="error.main">
                {queueStats?.failed || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Başarısız
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="error.main">
                {queueStats?.stuck || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Takılı
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Queue Health */}
      {queueHealth && (
        <Card sx={{ mb: 3 }}>
          <CardHeader 
            title="Queue Sağlık Durumu"
            action={
              <Chip 
                label={queueHealth.isHealthy ? 'Sağlıklı' : 'Sorunlu'} 
                color={queueHealth.isHealthy ? 'success' : 'error'} 
                icon={queueHealth.isHealthy ? <SuccessIcon /> : <ErrorIcon />}
              />
            }
          />
          <CardContent>
            {queueHealth.issues.length > 0 ? (
              <Box>
                <Typography variant="subtitle2" color="error" gutterBottom>
                  Tespit Edilen Sorunlar:
                </Typography>
                <ul>
                  {queueHealth.issues.map((issue, index) => (
                    <li key={index}>
                      <Typography variant="body2" color="error">
                        {issue}
                      </Typography>
                    </li>
                  ))}
                </ul>
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Öneriler:
                </Typography>
                <ul>
                  {queueHealth.recommendations.map((rec, index) => (
                    <li key={index}>
                      <Typography variant="body2" color="text.secondary">
                        {rec}
                      </Typography>
                    </li>
                  ))}
                </ul>
              </Box>
            ) : (
              <Typography variant="body2" color="success.main">
                Queue sağlıklı durumda. Herhangi bir sorun tespit edilmedi.
              </Typography>
            )}
          </CardContent>
        </Card>
      )}

      {/* Queue Controls */}
      <Card sx={{ mb: 3 }}>
        <CardHeader title="Queue Kontrolleri" />
        <CardContent>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              color="success"
              startIcon={<StartIcon />}
              onClick={startQueueProcessor}
              disabled={loading}
            >
              Queue Processor Başlat
            </Button>
            <Button
              variant="contained"
              color="error"
              startIcon={<StopIcon />}
              onClick={stopQueueProcessor}
              disabled={loading}
            >
              Queue Processor Durdur
            </Button>
            <Button
              variant="outlined"
              color="warning"
              startIcon={<RetryIcon />}
              onClick={retryFailedJobs}
              disabled={loading}
            >
              Başarısız Job'ları Yeniden Dene
            </Button>
            <Button
              variant="outlined"
              color="error"
              startIcon={<ClearIcon />}
              onClick={() => clearQueue('failed')}
              disabled={loading}
            >
              Başarısız Job'ları Temizle
            </Button>
            <Button
              variant="outlined"
              color="info"
              startIcon={<ClearIcon />}
              onClick={() => clearQueue('completed')}
              disabled={loading}
            >
              Tamamlanan Job'ları Temizle
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Queue Jobs Table */}
      <Card>
        <CardHeader 
          title="Queue Job'ları" 
          subheader={`${queueJobs.length} job bulundu`}
          action={
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel>Durum Filtresi</InputLabel>
                <Select
                  value={selectedJobStatus}
                  onChange={(e) => {
                    setSelectedJobStatus(e.target.value);
                    fetchQueueJobs(e.target.value || undefined);
                  }}
                  label="Durum Filtresi"
                >
                  <MenuItem value="">Tümü</MenuItem>
                  <MenuItem value="pending">Bekleyen</MenuItem>
                  <MenuItem value="processing">İşlenen</MenuItem>
                  <MenuItem value="completed">Tamamlanan</MenuItem>
                  <MenuItem value="failed">Başarısız</MenuItem>
                </Select>
              </FormControl>
            </Box>
          }
        />
        <CardContent>
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Tablo</TableCell>
                  <TableCell>İşlem</TableCell>
                  <TableCell>Record ID</TableCell>
                  <TableCell>Durum</TableCell>
                  <TableCell>Retry</TableCell>
                  <TableCell>Oluşturulma</TableCell>
                  <TableCell>İşlenme</TableCell>
                  <TableCell>Hata</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {queueJobs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center">
                      Job bulunamadı
                    </TableCell>
                  </TableRow>
                ) : (
                  queueJobs.map((job) => (
                    <TableRow key={job.id} hover>
                      <TableCell>{job.id}</TableCell>
                      <TableCell>
                        <Chip 
                          label={job.table_name} 
                          size="small" 
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={job.operation} 
                          size="small"
                          color={
                            job.operation === 'INSERT' ? 'success' :
                            job.operation === 'DELETE' ? 'error' :
                            job.operation === 'UPDATE' ? 'warning' : 'info'
                          }
                        />
                      </TableCell>
                      <TableCell>{job.record_id}</TableCell>
                      <TableCell>
                        <Chip 
                          label={job.status} 
                          color={getStatusColor(job.status) as any}
                          size="small"
                          icon={getStatusIcon(job.status)}
                        />
                      </TableCell>
                      <TableCell>
                        {job.retry_count > 0 ? (
                          <Chip 
                            label={job.retry_count} 
                            size="small" 
                            color="warning"
                            variant="outlined"
                          />
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption">
                          {new Date(job.created_at).toLocaleString('tr-TR')}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {job.processed_at ? (
                          <Typography variant="caption">
                            {new Date(job.processed_at).toLocaleString('tr-TR')}
                          </Typography>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>
                        {job.error_message && job.status !== 'completed' ? (
                          <Tooltip title={job.error_message}>
                            <Typography variant="caption" color="error" sx={{ maxWidth: 150, display: 'block' }}>
                              {job.error_message.length > 50 
                                ? `${job.error_message.substring(0, 50)}...` 
                                : job.error_message
                              }
                            </Typography>
                          </Tooltip>
                        ) : job.error_message && job.status === 'completed' ? (
                          <Tooltip title={job.error_message}>
                            <Typography variant="caption" color="success.main" sx={{ maxWidth: 150, display: 'block' }}>
                              {job.error_message.includes('Reset from stuck state') ? '🔄 Auto-fixed' : 
                                job.error_message.includes('Reset') ? '🔄 Reset' : 
                                job.error_message.length > 50 
                                  ? `${job.error_message.substring(0, 50)}...` 
                                  : job.error_message
                              }
                            </Typography>
                          </Tooltip>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
};

export default QueueManagement;
