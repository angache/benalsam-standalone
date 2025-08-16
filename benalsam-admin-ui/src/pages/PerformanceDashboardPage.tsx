import React, { useState, useEffect } from 'react';
import {
  Box, Card, CardContent, Typography, Grid, CircularProgress, Alert, AlertTitle,
  LinearProgress, useTheme, useMediaQuery, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Button, IconButton, Tooltip, Badge, Chip,
  Accordion, AccordionSummary, AccordionDetails, Divider, List, ListItem,
  ListItemText, ListItemIcon, Switch, FormControlLabel
} from '@mui/material';
import {
  Speed as SpeedIcon, TrendingUp as TrendingUpIcon, TrendingDown as TrendingDownIcon,
  Refresh as RefreshIcon, Assessment as AssessmentIcon, Warning as WarningIcon,
  CheckCircle as CheckCircleIcon, Error as ErrorIcon, Timeline as TimelineIcon,
  BarChart as BarChartIcon, ExpandMore as ExpandMoreIcon, Memory as MemoryIcon,
  Storage as StorageIcon, NetworkCheck as NetworkCheckIcon, Visibility as VisibilityIcon,
  Settings as SettingsIcon, Notifications as NotificationsIcon
} from '@mui/icons-material';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, BarChart, Bar, Cell, PieChart, Pie, Area, AreaChart
} from 'recharts';
import { usePerformanceMonitoring } from '../utils/performance';

interface PerformanceMetrics {
  LCP: number;
  INP: number;
  CLS: number;
  FCP: number;
  TTFB: number;
  timestamp: number;
}

interface PerformanceData {
  metrics: PerformanceMetrics[];
  averageScore: number;
  totalRequests: number;
  cacheHitRate: number;
  bundleSize: number;
  loadTime: number;
}

const PerformanceDashboardPage: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { metrics, isGood, score } = usePerformanceMonitoring();
  
  const [performanceData, setPerformanceData] = useState<PerformanceData>({
    metrics: [],
    averageScore: 0,
    totalRequests: 0,
    cacheHitRate: 0,
    bundleSize: 0,
    loadTime: 0
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [selectedTimeRange, setSelectedTimeRange] = useState('1h');

  // Simulate performance data
  useEffect(() => {
    const generateMockData = () => {
      const now = Date.now();
      const mockMetrics: PerformanceMetrics[] = Array.from({ length: 24 }, (_, i) => ({
        LCP: Math.random() * 3000 + 1000,
        INP: Math.random() * 200 + 50,
        CLS: Math.random() * 0.2,
        FCP: Math.random() * 1500 + 500,
        TTFB: Math.random() * 200 + 50,
        timestamp: now - (23 - i) * 3600000
      }));

      setPerformanceData({
        metrics: mockMetrics,
        averageScore: Math.random() * 30 + 70,
        totalRequests: Math.floor(Math.random() * 1000) + 500,
        cacheHitRate: Math.random() * 40 + 60,
        bundleSize: Math.random() * 500 + 1000,
        loadTime: Math.random() * 2000 + 1000
      });
      setIsLoading(false);
    };

    generateMockData();
    
    if (autoRefresh) {
      const interval = setInterval(generateMockData, 30000); // 30 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'success';
    if (score >= 70) return 'warning';
    return 'error';
  };

  const getScoreIcon = (score: number) => {
    if (score >= 90) return <CheckCircleIcon />;
    if (score >= 70) return <WarningIcon />;
    return <ErrorIcon />;
  };

  const formatMetric = (value: number | null | undefined, unit: string = 'ms') => {
    if (value === null || value === undefined || isNaN(value)) return 'N/A';
    if (value < 1000) return `${value.toFixed(0)}${unit}`;
    return `${(value / 1000).toFixed(1)}s`;
  };

  const getMetricColor = (metric: string, value: number | null | undefined) => {
    if (value === null || value === undefined || isNaN(value)) return 'default';
    
    const thresholds = {
      LCP: { good: 2500, poor: 4000 },
      INP: { good: 200, poor: 500 },
      CLS: { good: 0.1, poor: 0.25 },
      FCP: { good: 1800, poor: 3000 },
      TTFB: { good: 200, poor: 600 }
    };

    const threshold = thresholds[metric as keyof typeof thresholds];
    if (!threshold) return 'default';

    if (value <= threshold.good) return 'success';
    if (value <= threshold.poor) return 'warning';
    return 'error';
  };

  const getRecommendations = () => {
    const recommendations = [];
    
    if (metrics.LCP > 2500) {
      recommendations.push('LCP yüksek: Image optimization ve critical CSS iyileştirilmeli');
    }
    if (metrics.INP > 200) {
      recommendations.push('INP yüksek: JavaScript optimization gerekli');
    }
    if (metrics.CLS > 0.1) {
      recommendations.push('CLS yüksek: Layout shift prevention gerekli');
    }
    if (performanceData.cacheHitRate < 80) {
      recommendations.push('Cache hit rate düşük: Caching stratejisi iyileştirilmeli');
    }
    
    return recommendations.length > 0 ? recommendations : ['Performance iyi durumda! 🎉'];
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1" fontWeight="bold">
          📊 Performance Dashboard
        </Typography>
        <Box display="flex" gap={2}>
          <FormControlLabel
            control={
              <Switch
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
              />
            }
            label="Auto Refresh"
          />
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={() => window.location.reload()}
          >
            Refresh
          </Button>
        </Box>
      </Box>

      {/* Overall Performance Score */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" alignItems="center" gap={2} mb={2}>
            <SpeedIcon color="primary" />
            <Typography variant="h5" component="h2">
              Overall Performance Score
            </Typography>
          </Box>
          <Grid container spacing={3}>
            <Grid item xs={12} md={3}>
              <Box textAlign="center">
                <CircularProgress
                  variant="determinate"
                  value={score}
                  size={80}
                  color={getScoreColor(score) as any}
                  sx={{ mb: 1 }}
                />
                <Typography variant="h4" fontWeight="bold" color={getScoreColor(score)}>
                  {score}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Performance Score
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={9}>
              <Box display="flex" flexDirection="column" gap={2}>
                <Box display="flex" alignItems="center" gap={1}>
                  {getScoreIcon(score)}
                  <Typography variant="h6">
                    {score >= 90 ? 'Excellent' : score >= 70 ? 'Good' : 'Needs Improvement'}
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  {score >= 90 
                    ? 'Mükemmel performance! Kullanıcı deneyimi optimal.'
                    : score >= 70 
                    ? 'İyi performance, bazı iyileştirmeler yapılabilir.'
                    : 'Performance iyileştirme gerekli. Kullanıcı deneyimi etkilenebilir.'
                  }
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Core Web Vitals */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h5" component="h2" mb={2}>
            🎯 Core Web Vitals
          </Typography>
          <Grid container spacing={2}>
            {Object.entries(metrics).map(([key, value]) => (
              <Grid item xs={12} sm={6} md={2.4} key={key}>
                <Box textAlign="center" p={2} border={1} borderColor="divider" borderRadius={1}>
                  <Typography variant="h6" color={getMetricColor(key, value)}>
                    {formatMetric(value)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {key}
                  </Typography>
                  <Chip
                    size="small"
                    label={getMetricColor(key, value) === 'success' ? 'Good' : 
                           getMetricColor(key, value) === 'warning' ? 'Needs Improvement' : 'Poor'}
                    color={getMetricColor(key, value) as any}
                    sx={{ mt: 1 }}
                  />
                </Box>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>

      {/* Performance Metrics Chart */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h5" component="h2" mb={2}>
            📈 Performance Trends
          </Typography>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={performanceData.metrics}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="timestamp" 
                tickFormatter={(value) => new Date(value).toLocaleTimeString()}
              />
              <YAxis />
              <RechartsTooltip 
                labelFormatter={(value) => new Date(value).toLocaleString()}
                formatter={(value: number, name: string) => [formatMetric(value), name]}
              />
              <Line type="monotone" dataKey="LCP" stroke="#8884d8" name="LCP" />
              <Line type="monotone" dataKey="FCP" stroke="#82ca9d" name="FCP" />
              <Line type="monotone" dataKey="INP" stroke="#ffc658" name="INP" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* System Metrics */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" component="h3" mb={2}>
                🚀 System Performance
              </Typography>
              <List>
                <ListItem>
                  <ListItemIcon>
                    <NetworkCheckIcon />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Total Requests" 
                    secondary={`${performanceData.totalRequests} requests`}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <StorageIcon />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Cache Hit Rate" 
                    secondary={`${performanceData.cacheHitRate.toFixed(1)}%`}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <MemoryIcon />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Bundle Size" 
                    secondary={`${(performanceData.bundleSize / 1024).toFixed(1)} KB`}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <VisibilityIcon />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Load Time" 
                    secondary={formatMetric(performanceData.loadTime)}
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" component="h3" mb={2}>
                💡 Recommendations
              </Typography>
              <List>
                {getRecommendations().map((recommendation, index) => (
                  <ListItem key={index}>
                    <ListItemIcon>
                      <CheckCircleIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText primary={recommendation} />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Detailed Metrics Table */}
      <Card>
        <CardContent>
          <Typography variant="h5" component="h2" mb={2}>
            📋 Detailed Metrics
          </Typography>
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Metric</TableCell>
                  <TableCell align="right">Current Value</TableCell>
                  <TableCell align="center">Status</TableCell>
                  <TableCell align="center">Target</TableCell>
                  <TableCell align="center">Trend</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {Object.entries(metrics).map(([key, value]) => (
                  <TableRow key={key}>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {key}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" color={getMetricColor(key, value)}>
                        {formatMetric(value)}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        size="small"
                        label={getMetricColor(key, value) === 'success' ? 'Good' : 
                               getMetricColor(key, value) === 'warning' ? 'Needs Improvement' : 'Poor'}
                        color={getMetricColor(key, value) as any}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="body2" color="text.secondary">
                        {key === 'LCP' ? '< 2.5s' : 
                         key === 'INP' ? '< 200ms' : 
                         key === 'CLS' ? '< 0.1' : 
                         key === 'FCP' ? '< 1.8s' : 
                         key === 'TTFB' ? '< 200ms' : 'N/A'}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <TrendingDownIcon color="success" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
};

export default PerformanceDashboardPage;
