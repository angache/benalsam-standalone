import React, { useState, useEffect } from 'react';
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
} from '@mui/icons-material';
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

const TrendAnalysis: React.FC = () => {
  const [trends, setTrends] = useState<PerformanceTrend[]>([]);
  const [alerts, setAlerts] = useState<TrendAlert[]>([]);
  const [summary, setSummary] = useState<PerformanceSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<'1h' | '24h' | '7d' | '30d'>('24h');
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    loadTrendData();
  }, [selectedPeriod]);

  const loadTrendData = async () => {
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
  };

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
                        <Typography variant="body2" color="text.secondary">LCP</Typography>
                        <Typography variant="h6">{trend.metrics.lcp}ms</Typography>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Typography variant="body2" color="text.secondary">FID</Typography>
                        <Typography variant="h6">{trend.metrics.fid}ms</Typography>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Typography variant="body2" color="text.secondary">CLS</Typography>
                        <Typography variant="h6">{trend.metrics.cls}</Typography>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Typography variant="body2" color="text.secondary">TTFB</Typography>
                        <Typography variant="h6">{trend.metrics.ttfb}ms</Typography>
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
        </Box>
      </Paper>
    </Box>
  );
};

export default TrendAnalysis;
