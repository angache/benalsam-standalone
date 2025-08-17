import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  LinearProgress,
  Alert,
  Button,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Speed,
  Memory,
  NetworkCheck,
  FlashOn,
  TrendingUp,
  TrendingDown,
  Refresh,
  Clear,
  Info,
} from '@mui/icons-material';
import { usePerformanceMonitoring } from '../utils/performance';

const AdminPerformanceDashboard: React.FC = () => {
  const { metrics, score, isGood, history, getTrend, getRecommendations } = usePerformanceMonitoring();

  const getMetricColor = (value: number | null, threshold: number) => {
    if (!value) return 'default';
    return value <= threshold ? 'success' : value <= threshold * 1.5 ? 'warning' : 'error';
  };

  const getMetricIcon = (metricName: string) => {
    switch (metricName) {
      case 'LCP': return <Speed />;
      case 'FCP': return <FlashOn />;
      case 'CLS': return <Memory />;
      case 'INP': return <NetworkCheck />;
      case 'TTFB': return <NetworkCheck />;
      default: return <Info />;
    }
  };

  const getMetricDescription = (metricName: string) => {
    switch (metricName) {
      case 'LCP': return 'Largest Contentful Paint - En büyük içerik yükleme süresi';
      case 'FCP': return 'First Contentful Paint - İlk içerik görünme süresi';
      case 'CLS': return 'Cumulative Layout Shift - Toplam layout kayması';
      case 'INP': return 'Interaction to Next Paint - Etkileşim tepki süresi';
      case 'TTFB': return 'Time to First Byte - İlk byte alma süresi';
      default: return '';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'success';
    if (score >= 80) return 'warning';
    return 'error';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 90) return 'Mükemmel';
    if (score >= 80) return 'İyi';
    if (score >= 70) return 'Geliştirilmeli';
    return 'Kritik';
  };

  const trend = getTrend();
  const recommendations = getRecommendations();

  return (
    <Box sx={{ p: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Admin Performance Dashboard
        </Typography>
        <Box>
          <Tooltip title="Yenile">
            <IconButton onClick={() => window.location.reload()}>
              <Refresh />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Overall Score */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" alignItems="center" gap={2} mb={2}>
            <Typography variant="h5">Genel Performans Skoru</Typography>
            <Chip
              label={`${score}/100`}
              color={getScoreColor(score) as any}
              size="large"
            />
            <Chip
              label={getScoreLabel(score)}
              color={getScoreColor(score) as any}
              variant="outlined"
            />
          </Box>
          <LinearProgress
            variant="determinate"
            value={score}
            color={getScoreColor(score) as any}
            sx={{ height: 10, borderRadius: 5 }}
          />
          <Box display="flex" justifyContent="space-between" mt={1}>
            <Typography variant="body2" color="text.secondary">
              {isGood ? '✅ Performans İyi' : '⚠️ Performans İyileştirilmeli'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {history.length} ölçüm kaydedildi
            </Typography>
          </Box>
        </CardContent>
      </Card>

      {/* Metrics Grid */}
      <Grid container spacing={3} mb={3}>
        {Object.entries(metrics).map(([key, value]) => {
          const threshold = key === 'LCP' ? 2000 :
                           key === 'FCP' ? 1500 :
                           key === 'CLS' ? 0.05 :
                           key === 'INP' ? 150 :
                           key === 'TTFB' ? 500 : 0;
          
          return (
            <Grid item xs={12} sm={6} md={4} key={key}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" gap={1} mb={1}>
                    {getMetricIcon(key)}
                    <Typography variant="h6">{key}</Typography>
                  </Box>
                  <Typography variant="h4" color={getMetricColor(value, threshold)}>
                    {value ? `${value}${key === 'CLS' ? '' : 'ms'}` : 'N/A'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" mb={1}>
                    {getMetricDescription(key)}
                  </Typography>
                  <Chip
                    label={value && value <= threshold ? '✅ İyi' : '⚠️ İyileştirilmeli'}
                    color={getMetricColor(value, threshold) as any}
                    size="small"
                  />
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* Trend Analysis */}
      {trend !== 'insufficient_data' && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box display="flex" alignItems="center" gap={1} mb={2}>
              {trend === 'excellent' || trend === 'good' ? <TrendingUp color="success" /> : <TrendingDown color="error" />}
              <Typography variant="h6">Trend Analizi</Typography>
            </Box>
            <Typography variant="body1">
              Son 5 ölçüme göre performans trendi: 
              <Chip
                label={trend === 'excellent' ? 'Mükemmel' :
                       trend === 'good' ? 'İyi' :
                       trend === 'needs_improvement' ? 'Geliştirilmeli' : 'Kritik'}
                color={trend === 'excellent' || trend === 'good' ? 'success' : 'error'}
                sx={{ ml: 1 }}
              />
            </Typography>
          </CardContent>
        </Card>
      )}

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <Card>
          <CardContent>
            <Typography variant="h6" mb={2}>
              Öneriler ({recommendations.length})
            </Typography>
            {recommendations.map((rec, index) => (
              <Alert key={index} severity="warning" sx={{ mb: 1 }}>
                {rec}
              </Alert>
            ))}
          </CardContent>
        </Card>
      )}

      {/* No Issues */}
      {recommendations.length === 0 && Object.values(metrics).some(v => v !== null) && (
        <Card>
          <CardContent>
            <Alert severity="success">
              🎉 Tüm performans metrikleri iyi durumda! Admin paneli optimize edilmiş.
            </Alert>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default AdminPerformanceDashboard;
