import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  LinearProgress,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Bug,
  Users,
  Clock,
  Globe,
  Monitor,
  Activity,
  BarChart3,
  PieChart,
} from 'lucide-react';

interface ErrorAnalyticsData {
  totalErrors: number;
  errorRate: number;
  userImpact: number;
  avgResolutionTime: number;
  topErrorTypes: Array<{
    type: string;
    count: number;
    percentage: number;
    trend: 'up' | 'down' | 'stable';
  }>;
  topAffectedUsers: Array<{
    userId: string;
    email: string;
    errorCount: number;
    lastError: string;
  }>;
  topAffectedEndpoints: Array<{
    endpoint: string;
    errorCount: number;
    avgResponseTime: number;
    errorRate: number;
  }>;
  browserBreakdown: Array<{
    browser: string;
    count: number;
    percentage: number;
  }>;
  deviceBreakdown: Array<{
    device: string;
    count: number;
    percentage: number;
  }>;
  geographicBreakdown: Array<{
    country: string;
    count: number;
    percentage: number;
  }>;
  timeDistribution: Array<{
    hour: number;
    errorCount: number;
  }>;
}

interface ErrorAnalyticsProps {
  data: ErrorAnalyticsData;
  timeRange: string;
  onTimeRangeChange: (range: string) => void;
}

const ErrorAnalytics: React.FC<ErrorAnalyticsProps> = ({ data, timeRange, onTimeRangeChange }) => {
  const [selectedMetric, setSelectedMetric] = useState('error_rate');

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp size={16} color="#f44336" />;
      case 'down': return <TrendingDown size={16} color="#4caf50" />;
      default: return <Activity size={16} color="#757575" />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up': return 'error';
      case 'down': return 'success';
      default: return 'default';
    }
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    if (minutes < 1440) return `${Math.floor(minutes / 60)}h`;
    return `${Math.floor(minutes / 1440)}d`;
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  return (
    <Card>
      <CardContent>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <BarChart3 size={20} />
            <Typography variant="h6">Error Analytics</Typography>
          </Box>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Time Range</InputLabel>
            <Select
              value={timeRange}
              label="Time Range"
              onChange={(e) => onTimeRangeChange(e.target.value)}
            >
              <MenuItem value="1h">Last 1 hour</MenuItem>
              <MenuItem value="24h">Last 24 hours</MenuItem>
              <MenuItem value="7d">Last 7 days</MenuItem>
              <MenuItem value="30d">Last 30 days</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {/* Key Metrics */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ textAlign: 'center', p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
              <Bug size={32} color="#f44336" />
              <Typography variant="h4" color="error.main" fontWeight="bold" sx={{ mt: 1 }}>
                {data.totalErrors}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Errors
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ textAlign: 'center', p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
              <AlertTriangle size={32} color="#ff9800" />
              <Typography variant="h4" color="warning.main" fontWeight="bold" sx={{ mt: 1 }}>
                {formatPercentage(data.errorRate)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Error Rate
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ textAlign: 'center', p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
              <Users size={32} color="#2196f3" />
              <Typography variant="h4" color="info.main" fontWeight="bold" sx={{ mt: 1 }}>
                {data.userImpact}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Users Affected
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ textAlign: 'center', p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
              <Clock size={32} color="#4caf50" />
              <Typography variant="h4" color="success.main" fontWeight="bold" sx={{ mt: 1 }}>
                {formatDuration(data.avgResolutionTime)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Avg Resolution Time
              </Typography>
            </Box>
          </Grid>
        </Grid>

        <Grid container spacing={3}>
          {/* Top Error Types */}
          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Top Error Types
                </Typography>
                <List dense>
                  {data.topErrorTypes.map((errorType, index) => (
                    <ListItem key={errorType.type} sx={{ px: 0 }}>
                      <ListItemIcon>
                        {getTrendIcon(errorType.trend)}
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Typography variant="body2" fontWeight="medium">
                              {errorType.type}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="body2">
                                {errorType.count}
                              </Typography>
                              <Chip
                                label={formatPercentage(errorType.percentage)}
                                size="small"
                                color={getTrendColor(errorType.trend)}
                              />
                            </Box>
                          </Box>
                        }
                        secondary={
                          <Box sx={{ mt: 1 }}>
                            <LinearProgress
                              variant="determinate"
                              value={errorType.percentage}
                              sx={{ height: 4, borderRadius: 2 }}
                            />
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>

          {/* Top Affected Endpoints */}
          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Top Affected Endpoints
                </Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Endpoint</TableCell>
                        <TableCell align="right">Errors</TableCell>
                        <TableCell align="right">Error Rate</TableCell>
                        <TableCell align="right">Avg Time</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {data.topAffectedEndpoints.map((endpoint) => (
                        <TableRow key={endpoint.endpoint}>
                          <TableCell>
                            <Typography variant="body2" fontFamily="monospace">
                              {endpoint.endpoint}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">{endpoint.errorCount}</TableCell>
                          <TableCell align="right">
                            <Chip
                              label={formatPercentage(endpoint.errorRate)}
                              size="small"
                              color={endpoint.errorRate > 5 ? 'error' : endpoint.errorRate > 1 ? 'warning' : 'success'}
                            />
                          </TableCell>
                          <TableCell align="right">{endpoint.avgResponseTime}ms</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* Browser & Device Breakdown */}
          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Browser Breakdown
                </Typography>
                <List dense>
                  {data.browserBreakdown.map((browser) => (
                    <ListItem key={browser.browser} sx={{ px: 0 }}>
                      <ListItemIcon>
                        <Monitor size={16} />
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Typography variant="body2">
                              {browser.browser}
                            </Typography>
                            <Typography variant="body2" fontWeight="medium">
                              {browser.count} ({formatPercentage(browser.percentage)})
                            </Typography>
                          </Box>
                        }
                        secondary={
                          <Box sx={{ mt: 1 }}>
                            <LinearProgress
                              variant="determinate"
                              value={browser.percentage}
                              sx={{ height: 4, borderRadius: 2 }}
                            />
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>

          {/* Geographic Breakdown */}
          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Geographic Distribution
                </Typography>
                <List dense>
                  {data.geographicBreakdown.map((geo) => (
                    <ListItem key={geo.country} sx={{ px: 0 }}>
                      <ListItemIcon>
                        <Globe size={16} />
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Typography variant="body2">
                              {geo.country}
                            </Typography>
                            <Typography variant="body2" fontWeight="medium">
                              {geo.count} ({formatPercentage(geo.percentage)})
                            </Typography>
                          </Box>
                        }
                        secondary={
                          <Box sx={{ mt: 1 }}>
                            <LinearProgress
                              variant="determinate"
                              value={geo.percentage}
                              sx={{ height: 4, borderRadius: 2 }}
                            />
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>

          {/* Top Affected Users */}
          <Grid item xs={12}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Top Affected Users
                </Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>User</TableCell>
                        <TableCell align="right">Error Count</TableCell>
                        <TableCell align="right">Last Error</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {data.topAffectedUsers.map((user) => (
                        <TableRow key={user.userId}>
                          <TableCell>
                            <Typography variant="body2" fontWeight="medium">
                              {user.email}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Chip
                              label={user.errorCount}
                              size="small"
                              color={user.errorCount > 10 ? 'error' : user.errorCount > 5 ? 'warning' : 'default'}
                            />
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" color="text.secondary">
                              {new Date(user.lastError).toLocaleString()}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

export default ErrorAnalytics;
