import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  LinearProgress,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Paper,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  People as PeopleIcon,
  Timeline as TimelineIcon,
  Speed as SpeedIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Refresh as RefreshIcon,
  Analytics as AnalyticsIcon,
  Route as RouteIcon
} from '@mui/icons-material';
import { apiService } from '../services/api';

interface UserJourneyMetrics {
  totalUsers: number;
  totalSessions: number;
  avgSessionDuration: number;
  conversionRate: number;
  dropOffRate: number;
  engagementScore: number;
  topPages: Array<{ page: string; views: number; conversionRate: number }>;
  userFlow: Array<{ from: string; to: string; count: number; conversionRate: number }>;
}

const UserJourneyPage: React.FC = () => {
  const [metrics, setMetrics] = useState<UserJourneyMetrics | null>(null);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<number>(7);

  const fetchUserJourneyData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const [metricsResponse, recommendationsResponse] = await Promise.all([
        apiService.getUserJourneyMetrics(timeRange),
        apiService.getUserJourneyRecommendations(timeRange)
      ]);

      setMetrics(metricsResponse.data);
      setRecommendations(recommendationsResponse.data.recommendations || []);
    } catch (err) {
      setError('User journey verileri yüklenirken hata oluştu');
      console.error('User journey data fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserJourneyData();
  }, [timeRange]);

  const getStatusIcon = (value: number, threshold: number, type: 'positive' | 'negative') => {
    if (type === 'positive') {
      return value >= threshold ? <TrendingUpIcon color="success" /> : <TrendingDownIcon color="error" />;
    } else {
      return value <= threshold ? <TrendingUpIcon color="success" /> : <TrendingDownIcon color="error" />;
    }
  };

  const getStatusColor = (value: number, threshold: number, type: 'positive' | 'negative') => {
    if (type === 'positive') {
      return value >= threshold ? 'success' : 'error';
    } else {
      return value <= threshold ? 'success' : 'error';
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <LinearProgress />
        <Typography variant="h6" sx={{ mt: 2 }}>
          User Journey verileri yükleniyor...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button variant="contained" onClick={fetchUserJourneyData}>
          Tekrar Dene
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          <RouteIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          User Journey Dashboard
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <FormControl size="small">
            <InputLabel>Zaman Aralığı</InputLabel>
            <Select
              value={timeRange}
              label="Zaman Aralığı"
              onChange={(e) => setTimeRange(e.target.value as number)}
            >
              <MenuItem value={1}>Son 1 Gün</MenuItem>
              <MenuItem value={7}>Son 7 Gün</MenuItem>
              <MenuItem value={30}>Son 30 Gün</MenuItem>
              <MenuItem value={90}>Son 90 Gün</MenuItem>
            </Select>
          </FormControl>
          
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchUserJourneyData}
          >
            Yenile
          </Button>
        </Box>
      </Box>

      {metrics && (
        <>
          {/* Key Metrics */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <PeopleIcon color="primary" sx={{ mr: 1 }} />
                    <Typography variant="h6">Toplam Kullanıcı</Typography>
                  </Box>
                  <Typography variant="h4" color="primary">
                    {metrics.totalUsers.toLocaleString()}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Son {timeRange} gün
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <TimelineIcon color="primary" sx={{ mr: 1 }} />
                    <Typography variant="h6">Toplam Session</Typography>
                  </Box>
                  <Typography variant="h4" color="primary">
                    {metrics.totalSessions.toLocaleString()}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Son {timeRange} gün
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <SpeedIcon color="primary" sx={{ mr: 1 }} />
                    <Typography variant="h6">Ortalama Session</Typography>
                  </Box>
                  <Typography variant="h4" color="primary">
                    {Math.round(metrics.avgSessionDuration)}s
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                    {getStatusIcon(metrics.avgSessionDuration, 120, 'positive')}
                    <Typography variant="body2" color="text.secondary" sx={{ ml: 0.5 }}>
                      Hedef: 120s
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <AnalyticsIcon color="primary" sx={{ mr: 1 }} />
                    <Typography variant="h6">Engagement Score</Typography>
                  </Box>
                  <Typography variant="h4" color="primary">
                    {Math.round(metrics.engagementScore)}/100
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                    {getStatusIcon(metrics.engagementScore, 50, 'positive')}
                    <Typography variant="body2" color="text.secondary" sx={{ ml: 0.5 }}>
                      Hedef: 50+
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Conversion and Drop-off Rates */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Conversion Rate
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h3" color="success.main" sx={{ mr: 2 }}>
                      {metrics.conversionRate.toFixed(1)}%
                    </Typography>
                    {getStatusIcon(metrics.conversionRate, 15, 'positive')}
                  </Box>
                                      <Typography variant="body2" color="text.secondary">
                      Hedef: &gt;15% | Mevcut: {metrics.conversionRate.toFixed(1)}%
                    </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Drop-off Rate
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h3" color="error.main" sx={{ mr: 2 }}>
                      {metrics.dropOffRate.toFixed(1)}%
                    </Typography>
                    {getStatusIcon(metrics.dropOffRate, 30, 'negative')}
                  </Box>
                                      <Typography variant="body2" color="text.secondary">
                      Hedef: &lt;30% | Mevcut: {metrics.dropOffRate.toFixed(1)}%
                    </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Top Pages */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                En Popüler Sayfalar
              </Typography>
              <Grid container spacing={2}>
                {metrics.topPages.map((page, index) => (
                  <Grid item xs={12} sm={6} md={4} key={index}>
                    <Paper sx={{ p: 2 }}>
                      <Typography variant="subtitle1" gutterBottom>
                        {page.page}
                      </Typography>
                      <Typography variant="h6" color="primary">
                        {page.views.toLocaleString()} görüntüleme
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Conversion: {page.conversionRate.toFixed(1)}%
                      </Typography>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>

          {/* User Flow */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Kullanıcı Akışı
              </Typography>
              <List>
                {metrics.userFlow.slice(0, 10).map((flow, index) => (
                  <ListItem key={index} divider>
                    <ListItemIcon>
                      <RouteIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary={`${flow.from} → ${flow.to}`}
                      secondary={`${flow.count} kullanıcı | Conversion: ${flow.conversionRate.toFixed(1)}%`}
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </>
      )}

      {/* Recommendations */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Optimizasyon Önerileri
          </Typography>
          {recommendations.length > 0 ? (
            <List>
              {recommendations.map((recommendation, index) => (
                <ListItem key={index}>
                  <ListItemIcon>
                    {recommendation.includes('🚨') ? (
                      <ErrorIcon color="error" />
                    ) : recommendation.includes('⚠️') ? (
                      <WarningIcon color="warning" />
                    ) : (
                      <CheckCircleIcon color="success" />
                    )}
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Typography variant="body1">
                        {recommendation}
                      </Typography>
                    }
                  />
                </ListItem>
              ))}
            </List>
          ) : (
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
              Henüz öneri bulunmuyor. User journey verileri toplandıktan sonra öneriler görünecek.
            </Typography>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default UserJourneyPage; 