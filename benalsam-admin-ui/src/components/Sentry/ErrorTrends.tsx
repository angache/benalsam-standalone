import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  Chip,
  LinearProgress,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Bug,
  Activity,
} from 'lucide-react';

interface ErrorTrend {
  date: string;
  fatal: number;
  error: number;
  warning: number;
  info: number;
  debug: number;
  total: number;
}

interface ErrorTrendsProps {
  trends: ErrorTrend[];
  timeRange: string;
  onTimeRangeChange: (range: string) => void;
}

const ErrorTrends: React.FC<ErrorTrendsProps> = ({ trends, timeRange, onTimeRangeChange }) => {
  const [selectedPeriod, setSelectedPeriod] = useState('7d');

  const getTrendIcon = (current: number, previous: number) => {
    if (current > previous) return <TrendingUp size={16} color="#f44336" />;
    if (current < previous) return <TrendingDown size={16} color="#4caf50" />;
    return <Activity size={16} color="#757575" />;
  };

  const getTrendPercentage = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  const getTrendColor = (percentage: number) => {
    if (percentage > 0) return 'error';
    if (percentage < 0) return 'success';
    return 'default';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const calculateAverages = () => {
    if (trends.length === 0) return null;

    const totals = trends.reduce((acc, trend) => ({
      fatal: acc.fatal + trend.fatal,
      error: acc.error + trend.error,
      warning: acc.warning + trend.warning,
      info: acc.info + trend.info,
      debug: acc.debug + trend.debug,
      total: acc.total + trend.total,
    }), { fatal: 0, error: 0, warning: 0, info: 0, debug: 0, total: 0 });

    const count = trends.length;
    return {
      fatal: Math.round(totals.fatal / count),
      error: Math.round(totals.error / count),
      warning: Math.round(totals.warning / count),
      info: Math.round(totals.info / count),
      debug: Math.round(totals.debug / count),
      total: Math.round(totals.total / count),
    };
  };

  const averages = calculateAverages();

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6">Error Trends</Typography>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Period</InputLabel>
            <Select
              value={selectedPeriod}
              label="Period"
              onChange={(e) => setSelectedPeriod(e.target.value)}
            >
              <MenuItem value="1d">Last 24h</MenuItem>
              <MenuItem value="7d">Last 7 days</MenuItem>
              <MenuItem value="30d">Last 30 days</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {averages && (
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={2}>
              <Box sx={{ textAlign: 'center', p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
                <Typography variant="h4" color="error.main" fontWeight="bold">
                  {averages.fatal}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Fatal
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mt: 1 }}>
                  <AlertTriangle size={16} color="#d32f2f" />
                </Box>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <Box sx={{ textAlign: 'center', p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
                <Typography variant="h4" color="error.main" fontWeight="bold">
                  {averages.error}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Errors
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mt: 1 }}>
                  <Bug size={16} color="#f44336" />
                </Box>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <Box sx={{ textAlign: 'center', p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
                <Typography variant="h4" color="warning.main" fontWeight="bold">
                  {averages.warning}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Warnings
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mt: 1 }}>
                  <AlertTriangle size={16} color="#ff9800" />
                </Box>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <Box sx={{ textAlign: 'center', p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
                <Typography variant="h4" color="info.main" fontWeight="bold">
                  {averages.info}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Info
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mt: 1 }}>
                  <Activity size={16} color="#2196f3" />
                </Box>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <Box sx={{ textAlign: 'center', p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
                <Typography variant="h4" color="text.secondary" fontWeight="bold">
                  {averages.debug}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Debug
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mt: 1 }}>
                  <Activity size={16} color="#757575" />
                </Box>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <Box sx={{ textAlign: 'center', p: 2, border: 1, borderColor: 'primary.main', borderRadius: 1, backgroundColor: 'primary.50' }}>
                <Typography variant="h4" color="primary.main" fontWeight="bold">
                  {averages.total}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Total
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mt: 1 }}>
                  <Activity size={16} color="#1976d2" />
                </Box>
              </Box>
            </Grid>
          </Grid>
        )}

        {/* Trend Chart */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>Daily Error Count</Typography>
          <Box sx={{ height: 200, display: 'flex', alignItems: 'end', gap: 1, p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
            {trends.slice(-7).map((trend, index) => {
              const maxTotal = Math.max(...trends.map(t => t.total));
              const height = maxTotal > 0 ? (trend.total / maxTotal) * 100 : 0;
              
              return (
                <Box key={trend.date} sx={{ flex: 1, textAlign: 'center' }}>
                  <Box
                    sx={{
                      height: `${height}%`,
                      backgroundColor: 'error.main',
                      borderRadius: '4px 4px 0 0',
                      minHeight: 4,
                      position: 'relative',
                    }}
                  />
                  <Typography variant="caption" sx={{ display: 'block', mt: 1 }}>
                    {formatDate(trend.date)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {trend.total}
                  </Typography>
                </Box>
              );
            })}
          </Box>
        </Box>

        {/* Recent Trends */}
        <Box>
          <Typography variant="subtitle2" gutterBottom>Recent Changes</Typography>
          {trends.length >= 2 && (
            <Box sx={{ spaceY: 1 }}>
              {['fatal', 'error', 'warning', 'info', 'debug'].map((level) => {
                const current = trends[trends.length - 1][level as keyof ErrorTrend] as number;
                const previous = trends[trends.length - 2][level as keyof ErrorTrend] as number;
                const percentage = getTrendPercentage(current, previous);
                const trendIcon = getTrendIcon(current, previous);
                
                return (
                  <Box key={level} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                        {level}
                      </Typography>
                      {trendIcon}
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2">
                        {current} ({previous})
                      </Typography>
                      <Chip
                        label={`${percentage > 0 ? '+' : ''}${percentage.toFixed(1)}%`}
                        size="small"
                        color={getTrendColor(percentage)}
                      />
                    </Box>
                  </Box>
                );
              })}
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default ErrorTrends;
