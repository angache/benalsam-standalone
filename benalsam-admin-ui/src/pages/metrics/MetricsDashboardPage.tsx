// ===========================
// PROMETHEUS METRICS DASHBOARD PAGE
// ===========================

import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Chip,
  LinearProgress,
  Alert,
  AlertTitle,
  Button,
  IconButton,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { useMediaQuery } from '@mui/material';

// Types
interface MetricData {
  name: string;
  value: number;
  labels?: Record<string, string>;
  timestamp?: number;
}

interface SystemMetrics {
  messageProcessingDuration: MetricData[];
  messagesProcessed: MetricData[];
  messagesFailed: MetricData[];
  queueDepth: MetricData;
  activeConsumers: MetricData;
  elasticsearchHealth: MetricData;
  rabbitmqHealth: MetricData;
  supabaseHealth: MetricData;
  jobStatusCount: MetricData[];
  errorRate: MetricData;
}

const MetricsDashboardPage: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Fetch metrics data
  const fetchMetrics = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('http://localhost:3006/metrics');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const metricsText = await response.text();
      const parsedMetrics = parsePrometheusMetrics(metricsText);
      setMetrics(parsedMetrics);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch metrics');
      console.error('Error fetching metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  // Parse Prometheus metrics text
  const parsePrometheusMetrics = (metricsText: string): SystemMetrics => {
    const lines = metricsText.split('\n');
    const metrics: Partial<SystemMetrics> = {};

    lines.forEach(line => {
      if (line.startsWith('#') || line.trim() === '') return;

      const [name, value] = line.split(' ');
      if (!name || !value) return;

      const numValue = parseFloat(value);

      switch (name) {
        case 'elasticsearch_message_processing_duration_seconds':
          // This is a histogram, we'll use the sum for now
          if (!metrics.messageProcessingDuration) {
            metrics.messageProcessingDuration = [];
          }
          metrics.messageProcessingDuration.push({
            name: 'Processing Duration',
            value: numValue,
            timestamp: Date.now()
          });
          break;

        case 'elasticsearch_messages_processed_total':
          if (!metrics.messagesProcessed) {
            metrics.messagesProcessed = [];
          }
          metrics.messagesProcessed.push({
            name: 'Messages Processed',
            value: numValue,
            timestamp: Date.now()
          });
          break;

        case 'elasticsearch_messages_failed_total':
          if (!metrics.messagesFailed) {
            metrics.messagesFailed = [];
          }
          metrics.messagesFailed.push({
            name: 'Messages Failed',
            value: numValue,
            timestamp: Date.now()
          });
          break;

        case 'elasticsearch_queue_depth':
          metrics.queueDepth = {
            name: 'Queue Depth',
            value: numValue,
            timestamp: Date.now()
          };
          break;

        case 'elasticsearch_active_consumers':
          metrics.activeConsumers = {
            name: 'Active Consumers',
            value: numValue,
            timestamp: Date.now()
          };
          break;

        case 'elasticsearch_health_status':
          metrics.elasticsearchHealth = {
            name: 'Elasticsearch Health',
            value: numValue,
            timestamp: Date.now()
          };
          break;

        case 'rabbitmq_health_status':
          metrics.rabbitmqHealth = {
            name: 'RabbitMQ Health',
            value: numValue,
            timestamp: Date.now()
          };
          break;

        case 'supabase_health_status':
          metrics.supabaseHealth = {
            name: 'Supabase Health',
            value: numValue,
            timestamp: Date.now()
          };
          break;

        case 'elasticsearch_job_status_count':
          if (!metrics.jobStatusCount) {
            metrics.jobStatusCount = [];
          }
          metrics.jobStatusCount.push({
            name: 'Job Status Count',
            value: numValue,
            timestamp: Date.now()
          });
          break;

        case 'elasticsearch_error_rate':
          metrics.errorRate = {
            name: 'Error Rate',
            value: numValue,
            timestamp: Date.now()
          };
          break;
      }
    });

    return metrics as SystemMetrics;
  };

  // Auto-refresh every 30 seconds
  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 30000);
    return () => clearInterval(interval);
  }, []);

  const getHealthIcon = (value: number) => {
    if (value === 1) return <CheckCircleIcon color="success" />;
    if (value === 0) return <ErrorIcon color="error" />;
    return <WarningIcon color="warning" />;
  };

  const getHealthColor = (value: number) => {
    if (value === 1) return 'success';
    if (value === 0) return 'error';
    return 'warning';
  };

  const getHealthText = (value: number) => {
    if (value === 1) return 'Healthy';
    if (value === 0) return 'Unhealthy';
    return 'Unknown';
  };

  if (loading && !metrics) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress size={60} />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            System Metrics Dashboard
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Real-time monitoring of Elasticsearch Service performance
          </Typography>
        </Box>
        <Box display="flex" alignItems="center" gap={2}>
          {lastUpdated && (
            <Typography variant="caption" color="text.secondary">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </Typography>
          )}
          <Tooltip title="Refresh Metrics">
            <IconButton onClick={fetchMetrics} disabled={loading}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          <AlertTitle>Error Loading Metrics</AlertTitle>
          {error}
        </Alert>
      )}

      {/* Metrics Grid */}
      <Grid container spacing={3}>
        {/* System Health Status */}
        <Grid item xs={12} md={6} lg={4}>
          <Card>
            <CardHeader title="System Health" />
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Box textAlign="center">
                    {getHealthIcon(metrics?.elasticsearchHealth?.value || 0)}
                    <Typography variant="body2" color="text.secondary">
                      Elasticsearch
                    </Typography>
                    <Chip
                      label={getHealthText(metrics?.elasticsearchHealth?.value || 0)}
                      color={getHealthColor(metrics?.elasticsearchHealth?.value || 0) as any}
                      size="small"
                    />
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box textAlign="center">
                    {getHealthIcon(metrics?.rabbitmqHealth?.value || 0)}
                    <Typography variant="body2" color="text.secondary">
                      RabbitMQ
                    </Typography>
                    <Chip
                      label={getHealthText(metrics?.rabbitmqHealth?.value || 0)}
                      color={getHealthColor(metrics?.rabbitmqHealth?.value || 0) as any}
                      size="small"
                    />
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box textAlign="center">
                    {getHealthIcon(metrics?.supabaseHealth?.value || 0)}
                    <Typography variant="body2" color="text.secondary">
                      Supabase
                    </Typography>
                    <Chip
                      label={getHealthText(metrics?.supabaseHealth?.value || 0)}
                      color={getHealthColor(metrics?.supabaseHealth?.value || 0) as any}
                      size="small"
                    />
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box textAlign="center">
                    <InfoIcon color="info" />
                    <Typography variant="body2" color="text.secondary">
                      Error Rate
                    </Typography>
                    <Typography variant="h6" color="error">
                      {metrics?.errorRate?.value?.toFixed(2) || 0}%
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Queue Status */}
        <Grid item xs={12} md={6} lg={4}>
          <Card>
            <CardHeader title="Queue Status" />
            <CardContent>
              <Box mb={2}>
                <Typography variant="body2" color="text.secondary">
                  Queue Depth
                </Typography>
                <Typography variant="h4" color="primary">
                  {metrics?.queueDepth?.value || 0}
                </Typography>
              </Box>
              <Box mb={2}>
                <Typography variant="body2" color="text.secondary">
                  Active Consumers
                </Typography>
                <Typography variant="h4" color="success">
                  {metrics?.activeConsumers?.value || 0}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Message Statistics */}
        <Grid item xs={12} md={6} lg={4}>
          <Card>
            <CardHeader title="Message Statistics" />
            <CardContent>
              <Box mb={2}>
                <Typography variant="body2" color="text.secondary">
                  Messages Processed
                </Typography>
                <Typography variant="h4" color="success">
                  {metrics?.messagesProcessed?.reduce((sum, m) => sum + m.value, 0) || 0}
                </Typography>
              </Box>
              <Box mb={2}>
                <Typography variant="body2" color="text.secondary">
                  Messages Failed
                </Typography>
                <Typography variant="h4" color="error">
                  {metrics?.messagesFailed?.reduce((sum, m) => sum + m.value, 0) || 0}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Processing Duration */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader title="Processing Performance" />
            <CardContent>
              <Box mb={2}>
                <Typography variant="body2" color="text.secondary">
                  Average Processing Duration
                </Typography>
                <Typography variant="h4" color="info">
                  {metrics?.messageProcessingDuration?.length 
                    ? (metrics.messageProcessingDuration.reduce((sum, m) => sum + m.value, 0) / metrics.messageProcessingDuration.length).toFixed(3)
                    : 0}s
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={Math.min((metrics?.messageProcessingDuration?.length || 0) * 10, 100)}
                sx={{ height: 8, borderRadius: 4 }}
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Job Status Count */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader title="Job Status Distribution" />
            <CardContent>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Status</TableCell>
                      <TableCell align="right">Count</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {metrics?.jobStatusCount?.map((job, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <Chip
                            label={job.labels?.status || 'Unknown'}
                            color={job.labels?.status === 'completed' ? 'success' : 'default'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="right">
                          {job.value}
                        </TableCell>
                      </TableRow>
                    )) || (
                      <TableRow>
                        <TableCell colSpan={2} align="center">
                          No job data available
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Refresh Button */}
      <Box mt={4} textAlign="center">
        <Button
          variant="contained"
          startIcon={<RefreshIcon />}
          onClick={fetchMetrics}
          disabled={loading}
          size="large"
        >
          {loading ? 'Refreshing...' : 'Refresh Metrics'}
        </Button>
      </Box>
    </Container>
  );
};

export default MetricsDashboardPage;
