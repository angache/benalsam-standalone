import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Stack,
  Button,
  Chip,
  Alert,
  LinearProgress,
  Tabs,
  Tab,
  Paper,
  IconButton,
  Tooltip,
  CircularProgress,
  Divider,
  Switch,
  FormControlLabel,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  Warning,
  CheckCircle,
  Schedule,
  Timeline,
  BarChart,
  FlashOn,
  Refresh,
  Visibility,
  VisibilityOff,
  PlayArrow,
  Pause,
  AutoGraph,
  Speed,
  Memory,
  NetworkCheck,
} from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart as RechartsBarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { apiClient } from '../services/api';

interface PerformanceTrend {
  route: string;
  score: number;
  trend: 'improving' | 'degrading' | 'stable';
  change: number;
  period: '1h' | '24h' | '7d' | '30d';
  timestamp: string;
  metrics: {
    lcp: number;
    fid: number;
    cls: number;
    ttfb: number;
  };
}

interface TrendAlert {
  id: string;
  type: 'performance_degradation' | 'performance_improvement' | 'critical_issue';
  severity: 'low' | 'medium' | 'high' | 'critical';
  route: string;
  message: string;
  score: number;
  previousScore: number;
  change: number;
  timestamp: string;
  resolved: boolean;
}

interface PerformanceSummary {
  totalRoutes: number;
  averageScore: number;
  improvingTrends: number;
  degradingTrends: number;
  criticalIssues: number;
  activeAlerts: number;
}

interface HistoricalData {
  timestamp: string;
  score: number;
  lcp: number;
  fcp: number;
  cls: number;
  ttfb: number;
}

const TrendAnalysis: React.FC = () => {
  const [trends, setTrends] = useState<PerformanceTrend[]>([]);
  const [alerts, setAlerts] = useState<TrendAlert[]>([]);
  const [summary, setSummary] = useState<PerformanceSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<'1h' | '24h' | '7d' | '30d'>('24h');
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [realTimeMode, setRealTimeMode] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState<string>('all');
  const [historicalData, setHistoricalData] = useState<HistoricalData[]>([]);
  const [chartType, setChartType] = useState<'line' | 'bar' | 'pie'>('line');

  // Real-time data refresh
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (autoRefresh && realTimeMode) {
      interval = setInterval(() => {
        loadTrendData();
      }, 30000); // 30 saniye
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [autoRefresh, realTimeMode]);

  useEffect(() => {
    loadTrendData();
  }, [selectedPeriod]);

  const loadTrendData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Load trends
      const trendsResponse = await apiClient.get(`/trends/analysis?period=${selectedPeriod}`);
      setTrends(trendsResponse.data.data.trends || []);

      // Load alerts
      const alertsResponse = await apiClient.get('/trends/alerts');
      setAlerts(alertsResponse.data.data.alerts || []);

      // Load summary
      const summaryResponse = await apiClient.get('/trends/summary');
      setSummary(summaryResponse.data.data.summary);

      // Load historical data for charts
      if (selectedRoute !== 'all') {
        const historyResponse = await apiClient.get(`/trends/history/${selectedRoute}?period=${selectedPeriod}`);
        setHistoricalData(historyResponse.data.data.history || []);
      }

    } catch (err: any) {
      console.error('Trend data yükleme hatası:', err);
      
      // Daha detaylı hata mesajı
      if (err.response?.status === 401) {
        setError('Authentication gerekli. Lütfen tekrar giriş yapın.');
      } else if (err.response?.status === 404) {
        setError('Trend endpoint\'leri bulunamadı. Backend servisi kontrol edin.');
      } else if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError('Trend verileri yüklenemedi. Lütfen daha sonra tekrar deneyin.');
      }
      
    } finally {
      setLoading(false);
    }
  }, [selectedPeriod, selectedRoute]);

  const generateAlerts = async () => {
    try {
      const response = await apiClient.post('/trends/alerts/generate');
      await loadTrendData(); // Refresh data
      return response.data;
    } catch (err: any) {
      console.error('Alert oluşturma hatası:', err);
      throw err;
    }
  };

  const resolveAlert = async (alertId: string) => {
    try {
      await apiClient.put(`/trends/alerts/${alertId}/resolve`);
      await loadTrendData(); // Refresh data
    } catch (err: any) {
      console.error('Alert çözme hatası:', err);
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving':
        return <TrendingUp color="success" />;
      case 'degrading':
        return <TrendingDown color="error" />;
      default:
        return <Timeline color="action" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'error';
      case 'high':
        return 'warning';
      case 'medium':
        return 'info';
      case 'low':
        return 'success';
      default:
        return 'default';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'success.main';
    if (score >= 70) return 'warning.main';
    return 'error.main';
  };

  // Chart data preparation
  const getChartData = () => {
    if (chartType === 'pie') {
      return trends.map(trend => ({
        name: trend.route,
        value: trend.score,
        color: getScoreColor(trend.score)
      }));
    }
    
    return historicalData.map(item => ({
      time: new Date(item.timestamp).toLocaleTimeString(),
      score: item.score,
      lcp: item.lcp,
      fcp: item.fcp,
      cls: item.cls,
      ttfb: item.ttfb,
    }));
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  if (loading) {
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
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Performance Trend Analysis
          </Typography>
          <Typography variant="body1" color="text.secondary">
            AI-powered performance trend monitoring and alerting system
          </Typography>
        </Box>
        <Stack direction="row" spacing={2}>
          <FormControlLabel
            control={
              <Switch
                checked={realTimeMode}
                onChange={(e) => setRealTimeMode(e.target.checked)}
                color="primary"
              />
            }
            label="Real-time Mode"
          />
          <FormControlLabel
            control={
              <Switch
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                disabled={!realTimeMode}
                color="primary"
              />
            }
            label="Auto Refresh"
          />
          <Button
            variant="outlined"
            startIcon={<FlashOn />}
            onClick={generateAlerts}
          >
            Generate Alerts
          </Button>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={loadTrendData}
          >
            Refresh Data
          </Button>
        </Stack>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Real-time Status */}
      {realTimeMode && (
        <Alert 
          severity="info" 
          sx={{ mb: 3 }}
          action={
            <Box display="flex" alignItems="center" gap={1}>
              <CircularProgress size={16} />
              <Typography variant="body2">Live</Typography>
            </Box>
          }
        >
          Real-time monitoring aktif. Veriler otomatik olarak güncelleniyor.
          {autoRefresh && ' (30s interval)'}
        </Alert>
      )}

      {/* Summary Cards */}
      {summary && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Typography variant="h6" component="div">
                    Average Score
                  </Typography>
                  <Timeline color="action" />
                </Box>
                <Typography variant="h4" component="div" sx={{ color: getScoreColor(summary.averageScore) }}>
                  {summary.averageScore}
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={summary.averageScore} 
                  sx={{ mt: 1 }}
                />
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Typography variant="h6" component="div">
                    Improving Trends
                  </Typography>
                  <TrendingUp color="success" />
                </Box>
                <Typography variant="h4" component="div" color="success.main">
                  {summary.improvingTrends}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Routes with positive trends
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Typography variant="h6" component="div">
                    Degrading Trends
                  </Typography>
                  <TrendingDown color="error" />
                </Box>
                <Typography variant="h4" component="div" color="error.main">
                  {summary.degradingTrends}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Routes with negative trends
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Typography variant="h6" component="div">
                    Active Alerts
                  </Typography>
                  <Warning color="warning" />
                </Box>
                <Typography variant="h4" component="div" color="warning.main">
                  {summary.activeAlerts}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Critical issues detected
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Charts Section */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">Performance Charts</Typography>
            <Stack direction="row" spacing={2}>
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Route</InputLabel>
                <Select
                  value={selectedRoute}
                  label="Route"
                  onChange={(e) => setSelectedRoute(e.target.value)}
                >
                  <MenuItem value="all">All Routes</MenuItem>
                  {trends.map(trend => (
                    <MenuItem key={trend.route} value={trend.route}>
                      {trend.route}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Chart Type</InputLabel>
                <Select
                  value={chartType}
                  label="Chart Type"
                  onChange={(e) => setChartType(e.target.value as 'line' | 'bar' | 'pie')}
                >
                  <MenuItem value="line">Line Chart</MenuItem>
                  <MenuItem value="bar">Bar Chart</MenuItem>
                  <MenuItem value="pie">Pie Chart</MenuItem>
                </Select>
              </FormControl>
            </Stack>
          </Box>
          
          <Box sx={{ height: 400 }}>
            <ResponsiveContainer width="100%" height="100%">
              {chartType === 'line' && (
                <LineChart data={getChartData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <RechartsTooltip />
                  <Line type="monotone" dataKey="score" stroke="#8884d8" strokeWidth={2} />
                  <Line type="monotone" dataKey="lcp" stroke="#82ca9d" strokeWidth={2} />
                  <Line type="monotone" dataKey="fcp" stroke="#ffc658" strokeWidth={2} />
                </LineChart>
              )}
              
              {chartType === 'bar' && (
                <RechartsBarChart data={getChartData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <RechartsTooltip />
                  <Bar dataKey="score" fill="#8884d8" />
                  <Bar dataKey="lcp" fill="#82ca9d" />
                  <Bar dataKey="fcp" fill="#ffc658" />
                </RechartsBarChart>
              )}
              
              {chartType === 'pie' && (
                <PieChart>
                  <Pie
                    data={getChartData()}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {getChartData().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                </PieChart>
              )}
            </ResponsiveContainer>
          </Box>
        </CardContent>
      </Card>

      {/* Period Selector */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Analysis Period
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Select the time period for trend analysis
          </Typography>
          <Stack direction="row" spacing={1}>
            {(['1h', '24h', '7d', '30d'] as const).map((period) => (
              <Button
                key={period}
                variant={selectedPeriod === period ? 'contained' : 'outlined'}
                onClick={() => setSelectedPeriod(period)}
                size="small"
              >
                {period}
              </Button>
            ))}
          </Stack>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Paper sx={{ width: '100%' }}>
        <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
          <Tab label="Performance Trends" />
          <Tab label="Active Alerts" />
          <Tab label="Metrics Breakdown" />
        </Tabs>

        <Box sx={{ p: 3 }}>
          {activeTab === 0 && (
            <Stack spacing={2}>
              {trends.map((trend) => (
                <Card key={trend.route}>
                  <CardContent>
                    <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                      <Box display="flex" alignItems="center" gap={1}>
                        {getTrendIcon(trend.trend)}
                        <Typography variant="h6">{trend.route}</Typography>
                        <Chip 
                          label={trend.trend} 
                          color={trend.trend === 'improving' ? 'success' : 'error'}
                          size="small"
                        />
                      </Box>
                      <Box textAlign="right">
                        <Typography 
                          variant="h4" 
                          sx={{ color: getScoreColor(trend.score) }}
                        >
                          {trend.score}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {trend.change > 0 ? '+' : ''}{trend.change} points
                        </Typography>
                      </Box>
                    </Box>
                    
                    <Grid container spacing={2}>
                      <Grid item xs={6} sm={3}>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Speed color="action" />
                          <Box>
                            <Typography variant="body2" color="text.secondary">LCP</Typography>
                            <Typography variant="h6">{trend.metrics.lcp}ms</Typography>
                          </Box>
                        </Box>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Box display="flex" alignItems="center" gap={1}>
                          <FlashOn color="action" />
                          <Box>
                            <Typography variant="body2" color="text.secondary">FID</Typography>
                            <Typography variant="h6">{trend.metrics.fid}ms</Typography>
                          </Box>
                        </Box>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Memory color="action" />
                          <Box>
                            <Typography variant="body2" color="text.secondary">CLS</Typography>
                            <Typography variant="h6">{trend.metrics.cls}</Typography>
                          </Box>
                        </Box>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Box display="flex" alignItems="center" gap={1}>
                          <NetworkCheck color="action" />
                          <Box>
                            <Typography variant="body2" color="text.secondary">TTFB</Typography>
                            <Typography variant="h6">{trend.metrics.ttfb}ms</Typography>
                          </Box>
                        </Box>
                      </Grid>
                    </Grid>
                    
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                      Analyzed: {new Date(trend.timestamp).toLocaleString()}
                    </Typography>
                  </CardContent>
                </Card>
              ))}
            </Stack>
          )}

          {activeTab === 1 && (
            <Stack spacing={2}>
              {alerts.length === 0 ? (
                <Card>
                  <CardContent sx={{ textAlign: 'center', py: 4 }}>
                    <CheckCircle color="success" sx={{ fontSize: 48, mb: 2 }} />
                    <Typography variant="h6" color="text.secondary">
                      No active alerts
                    </Typography>
                  </CardContent>
                </Card>
              ) : (
                alerts.map((alert) => (
                  <Card key={alert.id}>
                    <CardContent>
                      <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Chip 
                            label={alert.severity} 
                            color={getSeverityColor(alert.severity) as any}
                            size="small"
                          />
                          <Typography variant="h6">{alert.route}</Typography>
                        </Box>
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => resolveAlert(alert.id)}
                        >
                          Resolve
                        </Button>
                      </Box>
                      
                      <Typography variant="body1" sx={{ mb: 2 }}>
                        {alert.message}
                      </Typography>
                      
                      <Grid container spacing={2}>
                        <Grid item xs={6} sm={3}>
                          <Typography variant="body2" color="text.secondary">Current Score</Typography>
                          <Typography 
                            variant="h6" 
                            sx={{ color: getScoreColor(alert.score) }}
                          >
                            {alert.score}
                          </Typography>
                        </Grid>
                        <Grid item xs={6} sm={3}>
                          <Typography variant="body2" color="text.secondary">Previous Score</Typography>
                          <Typography variant="h6">{alert.previousScore}</Typography>
                        </Grid>
                        <Grid item xs={6} sm={3}>
                          <Typography variant="body2" color="text.secondary">Change</Typography>
                          <Typography 
                            variant="h6" 
                            color={alert.change > 0 ? 'success.main' : 'error.main'}
                          >
                            {alert.change > 0 ? '+' : ''}{alert.change}
                          </Typography>
                        </Grid>
                        <Grid item xs={6} sm={3}>
                          <Typography variant="body2" color="text.secondary">Detected</Typography>
                          <Typography variant="body2" color="text.secondary">
                            {new Date(alert.timestamp).toLocaleString()}
                          </Typography>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                ))
              )}
            </Stack>
          )}

          {activeTab === 2 && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>LCP Distribution</Typography>
                    <Box sx={{ height: 300 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsBarChart data={trends.map(t => ({ route: t.route, lcp: t.metrics.lcp }))}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="route" />
                          <YAxis />
                          <RechartsTooltip />
                          <Bar dataKey="lcp" fill="#82ca9d" />
                        </RechartsBarChart>
                      </ResponsiveContainer>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>CLS Distribution</Typography>
                    <Box sx={{ height: 300 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsBarChart data={trends.map(t => ({ route: t.route, cls: t.metrics.cls }))}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="route" />
                          <YAxis />
                          <RechartsTooltip />
                          <Bar dataKey="cls" fill="#ffc658" />
                        </RechartsBarChart>
                      </ResponsiveContainer>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}
        </Box>
      </Paper>
    </Box>
  );
};

export default TrendAnalysis;
