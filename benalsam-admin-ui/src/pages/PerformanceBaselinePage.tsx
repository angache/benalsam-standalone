import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  CircularProgress,
  Alert,
  AlertTitle,
  Chip,
  LinearProgress,
  useTheme,
  useMediaQuery,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  IconButton,
  Tooltip,
  Badge,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  Speed as SpeedIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Refresh as RefreshIcon,
  Delete as DeleteIcon,
  PlayArrow as PlayArrowIcon,
  Assessment as AssessmentIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Timeline as TimelineIcon,
  BarChart as BarChartIcon,
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from 'recharts';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '../services/api';
import { usePerformanceMonitoring } from '../utils/performance';

interface PerformanceBaseline {
  endpoint: string;
  method: string;
  avgResponseTime: number;
  minResponseTime: number;
  maxResponseTime: number;
  throughput: number;
  errorRate: number;
  timestamp: string;
  testCount: number;
}

interface PerformanceRecommendation {
  type: string;
  endpoint: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  message: string;
  suggestion: string;
}

interface PerformanceTestResult {
  endpoint: string;
  iterations: number;
  concurrent: number;
  results: {
    avgResponseTime: number;
    minResponseTime: number;
    maxResponseTime: number;
    throughput: number;
    totalTime: number;
    results: Array<{
      iteration: number;
      responseTime: number;
      timestamp: string;
    }>;
  };
  baseline: PerformanceBaseline;
}

const PerformanceBaselinePage: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const queryClient = useQueryClient();
  const [refetchKey, setRefetchKey] = useState(0);
  const [testDialogOpen, setTestDialogOpen] = useState(false);
  const [selectedEndpoint, setSelectedEndpoint] = useState('');
  const [testConfig, setTestConfig] = useState({
    iterations: 10,
    concurrent: 1
  });

  // Core Web Vitals monitoring
  const { metrics, isGood, score } = usePerformanceMonitoring();

  // Available endpoints query
  const { 
    data: endpointsData, 
    isLoading: endpointsLoading 
  } = useQuery({
    queryKey: ['available-endpoints'],
    queryFn: () => apiService.getAvailableEndpoints(),
    refetchInterval: 300000, // 5 minutes
  });

  // Performance data queries
  const { 
    data: baselineData, 
    isLoading: baselineLoading, 
    error: baselineError, 
    refetch: refetchBaseline 
  } = useQuery({
    queryKey: ['performance-baseline', refetchKey],
    queryFn: () => apiService.getPerformanceBaseline(),
    refetchInterval: 30000, // 30 seconds
  });

  const { 
    data: recommendationsData, 
    isLoading: recommendationsLoading, 
    error: recommendationsError 
  } = useQuery({
    queryKey: ['performance-recommendations', refetchKey],
    queryFn: () => apiService.getPerformanceRecommendations(),
    refetchInterval: 60000, // 1 minute
  });

  // Monitoring data queries
  const { 
    data: monitoringStatusData, 
    isLoading: monitoringStatusLoading 
  } = useQuery({
    queryKey: ['monitoring-status', refetchKey],
    queryFn: () => apiService.getMonitoringStatus(),
    refetchInterval: 30000, // 30 seconds
  });

  const { 
    data: monitoringAlertsData, 
    isLoading: monitoringAlertsLoading 
  } = useQuery({
    queryKey: ['monitoring-alerts', refetchKey],
    queryFn: () => apiService.getPerformanceAlerts(),
    refetchInterval: 30000, // 30 seconds
  });

  // Performance test mutation
  const runPerformanceTest = useMutation({
    mutationFn: (data: { endpoint: string; iterations: number; concurrent: number }) =>
      apiService.runPerformanceTest(data.endpoint, data.iterations, data.concurrent),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['performance-baseline'] });
      setTestDialogOpen(false);
    },
  });

  // Clear baseline mutation
  const clearBaseline = useMutation({
    mutationFn: () => apiService.clearPerformanceBaseline(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['performance-baseline'] });
      queryClient.invalidateQueries({ queryKey: ['performance-recommendations'] });
    },
  });

  // Monitoring control mutations
  const controlMonitoring = useMutation({
    mutationFn: (action: 'start' | 'stop' | 'clear-alerts') => apiService.controlMonitoring(action),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['monitoring-status'] });
      queryClient.invalidateQueries({ queryKey: ['monitoring-alerts'] });
    },
  });

  const handleRunTest = () => {
    if (selectedEndpoint) {
      runPerformanceTest.mutate({
        endpoint: selectedEndpoint,
        iterations: testConfig.iterations,
        concurrent: testConfig.concurrent
      });
    }
  };

  const handleRefresh = () => {
    setRefetchKey(prev => prev + 1);
    refetchBaseline();
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'HIGH': return 'error';
      case 'MEDIUM': return 'warning';
      case 'LOW': return 'info';
      default: return 'default';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'HIGH': return <ErrorIcon />;
      case 'MEDIUM': return <WarningIcon />;
      case 'LOW': return <CheckCircleIcon />;
      default: return <CheckCircleIcon />;
    }
  };

  const formatResponseTime = (time: number) => `${time.toFixed(2)}ms`;
  const formatThroughput = (throughput: number) => `${throughput.toFixed(2)} req/s`;
  const formatErrorRate = (rate: number) => `${(rate * 100).toFixed(2)}%`;

  if (baselineLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (baselineError) {
    return (
      <Alert severity="error">
        <AlertTitle>Error</AlertTitle>
        Failed to load performance baseline data
      </Alert>
    );
  }

  const baselines = baselineData?.data?.baselines || [];
  const summary = baselineData?.data?.summary || {};
  const recommendations = recommendationsData?.data?.recommendations || [];

  return (
    <Box sx={{ p: 3 }}>
      {/* Core Web Vitals Section */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h5" component="h2" fontWeight="bold">
              📊 Core Web Vitals
            </Typography>
            <Chip
              label={`Score: ${score}`}
              color={score >= 90 ? 'success' : score >= 70 ? 'warning' : 'error'}
              variant="outlined"
            />
          </Box>
          
          <Grid container spacing={2}>
            <Grid item xs={12} md={2}>
              <Box textAlign="center">
                <Typography variant="h6" color="primary">
                  {metrics.LCP ? `${metrics.LCP}ms` : 'N/A'}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  LCP
                </Typography>
                <Chip
                  size="small"
                  label={metrics.LCP && metrics.LCP <= 2500 ? 'Good' : 'Needs Improvement'}
                  color={metrics.LCP && metrics.LCP <= 2500 ? 'success' : 'warning'}
                  sx={{ mt: 1 }}
                />
              </Box>
            </Grid>
            
            <Grid item xs={12} md={2}>
              <Box textAlign="center">
                <Typography variant="h6" color="primary">
                  {metrics.INP ? `${metrics.INP}ms` : 'N/A'}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  INP
                </Typography>
                <Chip
                  size="small"
                  label={metrics.INP && metrics.INP <= 200 ? 'Good' : 'Needs Improvement'}
                  color={metrics.INP && metrics.INP <= 200 ? 'success' : 'warning'}
                  sx={{ mt: 1 }}
                />
              </Box>
            </Grid>
            
            <Grid item xs={12} md={2}>
              <Box textAlign="center">
                <Typography variant="h6" color="primary">
                  {metrics.CLS ? metrics.CLS.toFixed(3) : 'N/A'}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  CLS
                </Typography>
                <Chip
                  size="small"
                  label={metrics.CLS && metrics.CLS <= 0.1 ? 'Good' : 'Needs Improvement'}
                  color={metrics.CLS && metrics.CLS <= 0.1 ? 'success' : 'warning'}
                  sx={{ mt: 1 }}
                />
              </Box>
            </Grid>
            
            <Grid item xs={12} md={2}>
              <Box textAlign="center">
                <Typography variant="h6" color="primary">
                  {metrics.FCP ? `${metrics.FCP}ms` : 'N/A'}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  FCP
                </Typography>
                <Chip
                  size="small"
                  label={metrics.FCP && metrics.FCP <= 1800 ? 'Good' : 'Needs Improvement'}
                  color={metrics.FCP && metrics.FCP <= 1800 ? 'success' : 'warning'}
                  sx={{ mt: 1 }}
                />
              </Box>
            </Grid>
            
            <Grid item xs={12} md={2}>
              <Box textAlign="center">
                <Typography variant="h6" color="primary">
                  {metrics.TTFB ? `${metrics.TTFB}ms` : 'N/A'}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  TTFB
                </Typography>
                <Chip
                  size="small"
                  label={metrics.TTFB && metrics.TTFB <= 800 ? 'Good' : 'Needs Improvement'}
                  color={metrics.TTFB && metrics.TTFB <= 800 ? 'success' : 'warning'}
                  sx={{ mt: 1 }}
                />
              </Box>
            </Grid>
            
            <Grid item xs={12} md={2}>
              <Box textAlign="center">
                <Typography variant="h6" color="primary">
                  {isGood ? '🟢' : '🔴'}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Status
                </Typography>
                <Chip
                  size="small"
                  label={isGood ? 'Good' : 'Needs Improvement'}
                  color={isGood ? 'success' : 'error'}
                  sx={{ mt: 1 }}
                />
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Web App Performance Section */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h5" component="h2" fontWeight="bold">
              🌐 Web App Performance
            </Typography>
            <Chip
              label="Real-time"
              color="info"
              size="small"
              variant="outlined"
            />
          </Box>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                Core Web Vitals
              </Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Metric</TableCell>
                      <TableCell align="right">Value</TableCell>
                      <TableCell align="center">Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow>
                      <TableCell>LCP (Largest Contentful Paint)</TableCell>
                      <TableCell align="right">
                        {metrics.LCP ? `${metrics.LCP.toFixed(0)}ms` : 'N/A'}
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          size="small"
                          label={metrics.LCP && metrics.LCP <= 2500 ? 'Good' : 'Needs Improvement'}
                          color={metrics.LCP && metrics.LCP <= 2500 ? 'success' : 'warning'}
                        />
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>INP (Interaction to Next Paint)</TableCell>
                      <TableCell align="right">
                        {metrics.INP ? `${metrics.INP.toFixed(0)}ms` : 'N/A'}
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          size="small"
                          label={metrics.INP && metrics.INP <= 200 ? 'Good' : 'Needs Improvement'}
                          color={metrics.INP && metrics.INP <= 200 ? 'success' : 'warning'}
                        />
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>CLS (Cumulative Layout Shift)</TableCell>
                      <TableCell align="right">
                        {metrics.CLS ? metrics.CLS.toFixed(3) : 'N/A'}
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          size="small"
                          label={metrics.CLS && metrics.CLS <= 0.1 ? 'Good' : 'Needs Improvement'}
                          color={metrics.CLS && metrics.CLS <= 0.1 ? 'success' : 'warning'}
                        />
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>FCP (First Contentful Paint)</TableCell>
                      <TableCell align="right">
                        {metrics.FCP ? `${metrics.FCP.toFixed(0)}ms` : 'N/A'}
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          size="small"
                          label={metrics.FCP && metrics.FCP <= 1800 ? 'Good' : 'Needs Improvement'}
                          color={metrics.FCP && metrics.FCP <= 1800 ? 'success' : 'warning'}
                        />
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>TTFB (Time to First Byte)</TableCell>
                      <TableCell align="right">
                        {metrics.TTFB ? `${metrics.TTFB.toFixed(0)}ms` : 'N/A'}
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          size="small"
                          label={metrics.TTFB && metrics.TTFB <= 800 ? 'Good' : 'Needs Improvement'}
                          color={metrics.TTFB && metrics.TTFB <= 800 ? 'success' : 'warning'}
                        />
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                Performance Summary
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Card variant="outlined">
                  <CardContent sx={{ py: 2 }}>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography variant="body2" color="text.secondary">
                        Overall Score
                      </Typography>
                      <Typography variant="h4" fontWeight="bold" color="primary">
                        {score}
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={score}
                      color={score >= 90 ? 'success' : score >= 70 ? 'warning' : 'error'}
                      sx={{ mt: 1 }}
                    />
                  </CardContent>
                </Card>
                
                <Card variant="outlined">
                  <CardContent sx={{ py: 2 }}>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography variant="body2" color="text.secondary">
                        Status
                      </Typography>
                      <Chip
                        label={isGood ? 'All Good' : 'Needs Improvement'}
                        color={isGood ? 'success' : 'error'}
                        icon={isGood ? <CheckCircleIcon /> : <WarningIcon />}
                      />
                    </Box>
                  </CardContent>
                </Card>
                
                <Card variant="outlined">
                  <CardContent sx={{ py: 2 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Recommendations
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      {metrics.LCP && metrics.LCP > 2500 && (
                        <Chip
                          size="small"
                          label="Optimize images for faster LCP"
                          color="warning"
                          variant="outlined"
                        />
                      )}
                      {metrics.INP && metrics.INP > 200 && (
                        <Chip
                          size="small"
                          label="Improve interaction responsiveness"
                          color="warning"
                          variant="outlined"
                        />
                      )}
                      {metrics.CLS && metrics.CLS > 0.1 && (
                        <Chip
                          size="small"
                          label="Fix layout shifts"
                          color="warning"
                          variant="outlined"
                        />
                      )}
                      {isGood && (
                        <Chip
                          size="small"
                          label="Performance is excellent!"
                          color="success"
                          variant="outlined"
                        />
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1" fontWeight="bold">
          Performance Baseline
        </Typography>
        <Box>
          <Button
            variant="contained"
            startIcon={<PlayArrowIcon />}
            onClick={() => setTestDialogOpen(true)}
            sx={{ mr: 1 }}
          >
            Run Test
          </Button>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={handleRefresh}
            sx={{ mr: 1 }}
          >
            Refresh
          </Button>
          <Button
            variant="outlined"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={() => clearBaseline.mutate()}
            disabled={clearBaseline.isPending}
            sx={{ mr: 1 }}
          >
            Clear All
          </Button>
          <Button
            variant="outlined"
            color="success"
            startIcon={<PlayArrowIcon />}
            onClick={() => controlMonitoring.mutate('start')}
            disabled={controlMonitoring.isPending}
            sx={{ mr: 1 }}
          >
            Start Monitoring
          </Button>
          <Button
            variant="outlined"
            color="warning"
            startIcon={<DeleteIcon />}
            onClick={() => controlMonitoring.mutate('clear-alerts')}
            disabled={controlMonitoring.isPending}
          >
            Clear Alerts
          </Button>
        </Box>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <SpeedIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6" component="div">
                  {summary.totalEndpoints || 0}
                </Typography>
              </Box>
              <Typography color="text.secondary">Total Endpoints</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <TimelineIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6" component="div">
                  {formatResponseTime(summary.avgResponseTime || 0)}
                </Typography>
              </Box>
              <Typography color="text.secondary">Avg Response Time</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <BarChartIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6" component="div">
                  {summary.totalTests || 0}
                </Typography>
              </Box>
              <Typography color="text.secondary">Total Tests</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <AssessmentIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6" component="div">
                  {recommendations.length}
                </Typography>
              </Box>
              <Typography color="text.secondary">Recommendations</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <BarChartIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6" component="div">
                  {endpointsData?.data?.total || 0}
                </Typography>
              </Box>
              <Typography color="text.secondary">Available Endpoints</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <TimelineIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6" component="div">
                  {monitoringStatusData?.data?.totalEndpoints || 0}
                </Typography>
              </Box>
              <Typography color="text.secondary">Monitored Endpoints</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <WarningIcon color="error" sx={{ mr: 1 }} />
                <Typography variant="h6" component="div" color="error">
                  {monitoringAlertsData?.data?.critical || 0}
                </Typography>
              </Box>
              <Typography color="text.secondary">Critical Alerts</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Available Endpoints Categories */}
      {endpointsData?.data?.categories && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" component="h2" mb={2}>
              Available Endpoints by Category
            </Typography>
            <Grid container spacing={2}>
              {Object.entries(endpointsData.data.categories).map(([category, count]) => (
                <Grid item xs={6} sm={4} md={3} lg={2} key={category}>
                  <Box
                    sx={{
                      p: 2,
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 1,
                      textAlign: 'center',
                      backgroundColor: 'background.paper',
                    }}
                  >
                    <Typography variant="h6" color="primary" fontWeight="bold">
                      {count as number}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ textTransform: 'capitalize' }}>
                      {category.replace(/([A-Z])/g, ' $1').trim()}
                    </Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Performance Baselines Table */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" component="h2" mb={2}>
            Performance Baselines
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Endpoint</TableCell>
                  <TableCell>Method</TableCell>
                  <TableCell>Avg Response Time</TableCell>
                  <TableCell>Min/Max</TableCell>
                  <TableCell>Throughput</TableCell>
                  <TableCell>Error Rate</TableCell>
                  <TableCell>Test Count</TableCell>
                  <TableCell>Last Updated</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {baselines.map((baseline: PerformanceBaseline) => (
                  <TableRow key={`${baseline.method}:${baseline.endpoint}`}>
                    <TableCell>{baseline.endpoint}</TableCell>
                    <TableCell>
                      <Chip 
                        label={baseline.method} 
                        size="small" 
                        color="primary" 
                        variant="outlined" 
                      />
                    </TableCell>
                    <TableCell>
                      <Typography 
                        variant="body2" 
                        color={baseline.avgResponseTime > 1000 ? 'error' : 'text.primary'}
                      >
                        {formatResponseTime(baseline.avgResponseTime)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {formatResponseTime(baseline.minResponseTime)} / {formatResponseTime(baseline.maxResponseTime)}
                      </Typography>
                    </TableCell>
                    <TableCell>{formatThroughput(baseline.throughput)}</TableCell>
                    <TableCell>
                      <Typography 
                        variant="body2" 
                        color={baseline.errorRate > 0.05 ? 'error' : 'text.primary'}
                      >
                        {formatErrorRate(baseline.errorRate)}
                      </Typography>
                    </TableCell>
                    <TableCell>{baseline.testCount}</TableCell>
                    <TableCell>
                      {new Date(baseline.timestamp).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Performance Monitoring Alerts */}
      {monitoringAlertsData?.data?.alerts && monitoringAlertsData.data.alerts.length > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" component="h2" mb={2}>
              Performance Monitoring Alerts
            </Typography>
            <Grid container spacing={2}>
              {monitoringAlertsData.data.alerts.map((alert: any, index: number) => (
                <Grid item xs={12} key={index}>
                  <Alert 
                    severity={alert.severity === 'critical' ? 'error' : 'warning'}
                    icon={alert.severity === 'critical' ? <ErrorIcon /> : <WarningIcon />}
                  >
                    <AlertTitle>{alert.type.replace('_', ' ').toUpperCase()}</AlertTitle>
                    <Typography variant="body2" mb={1}>
                      {alert.message}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      <strong>Endpoint:</strong> {alert.endpoint} | <strong>Value:</strong> {alert.value.toFixed(2)} | <strong>Threshold:</strong> {alert.threshold}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(alert.timestamp).toLocaleString()}
                    </Typography>
                  </Alert>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Performance Recommendations */}
      {recommendations.length > 0 && (
        <Card>
          <CardContent>
            <Typography variant="h6" component="h2" mb={2}>
              Performance Recommendations
            </Typography>
            <Grid container spacing={2}>
              {recommendations.map((rec: PerformanceRecommendation, index: number) => (
                <Grid item xs={12} key={index}>
                  <Alert 
                    severity={getSeverityColor(rec.severity) as any}
                    icon={getSeverityIcon(rec.severity)}
                  >
                    <AlertTitle>{rec.type.replace('_', ' ')}</AlertTitle>
                    <Typography variant="body2" mb={1}>
                      {rec.message}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      <strong>Suggestion:</strong> {rec.suggestion}
                    </Typography>
                  </Alert>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Performance Test Dialog */}
      <Dialog open={testDialogOpen} onClose={() => setTestDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Run Performance Test</DialogTitle>
        <DialogContent>
          <FormControl fullWidth margin="normal">
            <InputLabel>Endpoint</InputLabel>
            <Select
              value={selectedEndpoint}
              onChange={(e) => setSelectedEndpoint(e.target.value)}
              label="Endpoint"
              disabled={endpointsLoading}
            >
              {endpointsData?.data?.endpoints?.map((endpoint: any) => (
                <MenuItem key={endpoint.path} value={endpoint.path}>
                  <Box>
                    <Typography variant="body2" fontWeight="medium">
                      {endpoint.path}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {endpoint.description}
                    </Typography>
                  </Box>
                </MenuItem>
              )) || []}
            </Select>
          </FormControl>
          <TextField
            fullWidth
            label="Iterations"
            type="number"
            value={testConfig.iterations}
            onChange={(e) => setTestConfig(prev => ({ ...prev, iterations: parseInt(e.target.value) || 10 }))}
            margin="normal"
            inputProps={{ min: 1, max: 100 }}
          />
          <TextField
            fullWidth
            label="Concurrent Requests"
            type="number"
            value={testConfig.concurrent}
            onChange={(e) => setTestConfig(prev => ({ ...prev, concurrent: parseInt(e.target.value) || 1 }))}
            margin="normal"
            inputProps={{ min: 1, max: 10 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTestDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleRunTest} 
            variant="contained"
            disabled={!selectedEndpoint || runPerformanceTest.isPending}
          >
            {runPerformanceTest.isPending ? 'Running...' : 'Run Test'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PerformanceBaselinePage;
