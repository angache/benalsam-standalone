import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Chip,
  LinearProgress,
  Alert,
  CircularProgress,
  Paper,
  Divider,
  IconButton,
  Tooltip,
  useTheme,
  useMediaQuery,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Switch,
  FormControlLabel,
  Badge,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Collapse
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Speed as SpeedIcon,
  Memory as MemoryIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Timeline as TimelineIcon,
  People as UsersIcon,
  Bolt as ActivityIcon,
  FlashOn as ZapIcon,
  Visibility as EyeIcon,
  Favorite as HeartIcon,
  Search as SearchIcon,
  Message as MessageIcon,
  Share as ShareIcon,
  Schedule as ClockIcon,
  Settings as SettingsIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiService } from '../services/api';

interface RealTimeMetrics {
  activeUsers: number;
  totalSessions: number;
  pageViews: number;
  avgResponseTime: number;
  errorRate: number;
  memoryUsage: number;
  bundleSize: number;
  apiCalls: number;
}

interface SessionActivity {
  id: string;
  sessionId: string;
  action: string;
  screen: string;
  timestamp: string;
  duration?: number;
  deviceInfo: {
    platform: string;
    model: string;
  };
}

interface PerformanceAlert {
  id: string;
  type: 'error' | 'warning' | 'info';
  message: string;
  timestamp: string;
  severity: 'low' | 'medium' | 'high';
  resolved: boolean;
}

interface ChartData {
  timestamp: string;
  value: number;
  category: string;
}

const RealTimeAnalyticsPage: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const queryClient = useQueryClient();
  
  // State management
  const [isLive, setIsLive] = useState(false); // Changed to false
  const [autoRefresh, setAutoRefresh] = useState(false); // Changed to false
  const [refreshInterval, setRefreshInterval] = useState(60000); // 60 seconds
  const [expandedSections, setExpandedSections] = useState<{[key: string]: boolean}>({
    userActivity: true,
    performance: true,
    alerts: true
  });
  
  // Real-time data
  const [realTimeMetrics, setRealTimeMetrics] = useState<RealTimeMetrics>({
    activeUsers: 0,
    totalSessions: 0,
    pageViews: 0,
    avgResponseTime: 0,
    errorRate: 0,
    memoryUsage: 0,
    bundleSize: 0,
    apiCalls: 0
  });
  
  const [sessionActivities, setSessionActivities] = useState<SessionActivity[]>([]);
  const [performanceAlerts, setPerformanceAlerts] = useState<PerformanceAlert[]>([]);
  const [chartData, setChartData] = useState<ChartData[]>([]);

  // Remove auto-refresh logic since we're using manual refresh
  // const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch analytics data manually instead of using React Query
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalyticsData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('🔄 Fetching analytics data...');
      
      const [metrics, activities, alerts, performance] = await Promise.all([
        apiService.getRealTimeMetrics().catch(err => {
          console.log('❌ Error fetching metrics:', err.message);
          return null;
        }),
        apiService.getSessionActivities().catch(err => {
          console.log('❌ Error fetching activities:', err.message);
          return [];
        }),
        apiService.getPerformanceAlerts().catch(err => {
          console.log('❌ Error fetching alerts:', err.message);
          return [];
        }),
        apiService.getPerformanceMetrics(7).catch(err => {
          console.log('❌ Error fetching performance:', err.message);
          return null;
        })
      ]);

      const data = {
        metrics,
        activities,
        alerts,
        performance
      };

                    console.log('✅ Analytics data fetched:', data);
              setAnalyticsData(data);
    } catch (err) {
      console.error('❌ Error fetching analytics data:', err);
      setError('Failed to fetch analytics data');
    } finally {
      setIsLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  // Manual refresh function
  const handleRefresh = () => {
    fetchAnalyticsData();
  };

  // Mock data for fallback
  const generateMockData = () => {
    const now = new Date();
    const mockMetrics = {
      activeUsers: Math.floor(Math.random() * 50) + 10,
      totalSessions: Math.floor(Math.random() * 100) + 50,
      pageViews: Math.floor(Math.random() * 500) + 200,
      avgResponseTime: Math.floor(Math.random() * 1000) + 200,
      errorRate: Math.random() * 3,
      memoryUsage: Math.floor(Math.random() * 30) + 60,
      bundleSize: Math.floor(Math.random() * 500) + 2000,
      apiCalls: Math.floor(Math.random() * 1000) + 500
    };

    const mockActivities = [
      {
        id: '1',
        userId: 'user1',
        username: 'Ahmet Yılmaz',
        action: 'view',
        screen: 'HomeScreen',
        timestamp: new Date(now.getTime() - Math.random() * 60000).toISOString(),
        deviceInfo: { platform: 'iOS', model: 'iPhone 14' }
      },
      {
        id: '2',
        userId: 'user2',
        username: 'Fatma Demir',
        action: 'favorite',
        screen: 'ListingDetail',
        timestamp: new Date(now.getTime() - Math.random() * 60000).toISOString(),
        deviceInfo: { platform: 'Android', model: 'Samsung Galaxy' }
      },
      {
        id: '3',
        userId: 'user3',
        username: 'Mehmet Kaya',
        action: 'search',
        screen: 'SearchScreen',
        timestamp: new Date(now.getTime() - Math.random() * 60000).toISOString(),
        deviceInfo: { platform: 'iOS', model: 'iPhone 13' }
      }
    ];

    const mockAlerts = [
      {
        id: '1',
        type: 'warning' as const,
        message: 'High memory usage detected (85%)',
        timestamp: new Date(now.getTime() - 5 * 60 * 1000).toISOString(),
        severity: 'medium' as const,
        resolved: false
      },
      {
        id: '2',
        type: 'error' as const,
        message: 'API response time exceeded threshold (5000ms)',
        timestamp: new Date(now.getTime() - 10 * 60 * 1000).toISOString(),
        severity: 'high' as const,
        resolved: false
      }
    ];

    return { metrics: mockMetrics, activities: mockActivities, alerts: mockAlerts };
  };

  // Update state when data changes
  useEffect(() => {
    if (analyticsData) {
      setRealTimeMetrics(analyticsData.metrics || {
        activeUsers: 0,
        totalSessions: 0,
        pageViews: 0,
        avgResponseTime: 0,
        errorRate: 0,
        memoryUsage: 0,
        bundleSize: 0,
        apiCalls: 0
      });
              setSessionActivities(analyticsData.activities || []);
      setPerformanceAlerts(analyticsData.alerts || []);
      
      // Update chart data
      const dataWithPerformance = analyticsData as any;
      if (dataWithPerformance.performance) {
        const newChartData = dataWithPerformance.performance.metric_types?.map((metric: any) => {
          const category = typeof metric.key === 'string' ? metric.key : 
                          (metric.key?.value || metric.key || 'Unknown');
          const value = (metric.avg_value?.value || metric.avg_percentage?.value || metric.avg_duration?.value || 0);
          return {
            timestamp: new Date().toLocaleTimeString(),
            value: value,
            category: category
          };
        }) || [];
        
        setChartData(prev => [...prev.slice(-20), ...newChartData]); // Keep last 20 points
      } else {
        // Fallback chart data
        const newChartData = [{
          timestamp: new Date().toLocaleTimeString(),
          value: analyticsData.metrics?.avgResponseTime || 0,
          category: 'Response Time'
        }];
        
        setChartData(prev => [...prev.slice(-20), ...newChartData]); // Keep last 20 points
      }
    }
  }, [analyticsData]);

  // Remove auto-refresh logic since we're using manual refresh
  // useEffect(() => {
  //   if (isLive && autoRefresh) {
  //     intervalRef.current = setInterval(() => {
  //       queryClient.invalidateQueries({ queryKey: ['real-time-analytics'] });
  //     }, refreshInterval);
  //   } else {
  //     if (intervalRef.current) {
  //       clearInterval(intervalRef.current);
  //       intervalRef.current = null;
  //     }
  //   }

  //   return () => {
  //     if (intervalRef.current) {
  //       clearInterval(intervalRef.current);
  //     }
  //   };
  // }, [isLive, autoRefresh, refreshInterval, queryClient]);

  // Toggle section expansion
  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Get status color
  const getStatusColor = (value: number, threshold: number) => {
    if (value <= threshold * 0.7) return 'success';
    if (value <= threshold) return 'warning';
    return 'error';
  };

  // Get action icon
  const getActionIcon = (action: string) => {
    switch (action) {
      case 'view': return <EyeIcon />;
      case 'favorite': return <HeartIcon />;
      case 'search': return <SearchIcon />;
      case 'message': return <MessageIcon />;
      case 'share': return <ShareIcon />;
      default: return <ActivityIcon />;
    }
  };

  // Get alert severity color
  const getAlertColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'info';
      default: return 'info';
    }
  };

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          Failed to load real-time analytics: {error}
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
          Real-Time Analytics Dashboard
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <FormControlLabel
            control={
              <Switch
                checked={isLive}
                onChange={(e) => setIsLive(e.target.checked)}
                color="primary"
              />
            }
            label="Live Mode"
          />
          
          <FormControlLabel
            control={
              <Switch
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                disabled={!isLive}
                color="primary"
              />
            }
            label="Auto Refresh"
          />
          
          <IconButton
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <RefreshIcon />
          </IconButton>
          
          <Chip
            icon={isLive ? <PlayIcon /> : <PauseIcon />}
            label={isLive ? 'LIVE' : 'PAUSED'}
            color={isLive ? 'success' : 'default'}
            variant="outlined"
          />
        </Box>
      </Box>

      {isLoading && (
        <Box sx={{ width: '100%', mb: 3 }}>
          <LinearProgress />
        </Box>
      )}

      {/* Real-time Metrics Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" gutterBottom variant="body2">
                    Active Users
                  </Typography>
                  <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                    {realTimeMetrics.activeUsers}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'primary.main' }}>
                  <UsersIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" gutterBottom variant="body2">
                    Avg Response Time
                  </Typography>
                  <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                    {realTimeMetrics.avgResponseTime}ms
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: getStatusColor(realTimeMetrics.avgResponseTime, 2000) === 'success' ? 'success.main' : 'warning.main' }}>
                  <SpeedIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" gutterBottom variant="body2">
                    Memory Usage
                  </Typography>
                  <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                    {realTimeMetrics.memoryUsage}%
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: getStatusColor(realTimeMetrics.memoryUsage, 80) === 'success' ? 'success.main' : 'warning.main' }}>
                  <MemoryIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" gutterBottom variant="body2">
                    Error Rate
                  </Typography>
                  <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                    {realTimeMetrics.errorRate}%
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: getStatusColor(realTimeMetrics.errorRate, 5) === 'success' ? 'success.main' : 'error.main' }}>
                  <ErrorIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts Section */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6" component="h2">
                  Performance Metrics Over Time
                </Typography>
                <IconButton onClick={() => toggleSection('performance')}>
                  {expandedSections.performance ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                </IconButton>
              </Box>
              
              <Collapse in={expandedSections.performance}>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="timestamp" />
                    <YAxis />
                    <RechartsTooltip />
                    <Line type="monotone" dataKey="value" stroke="#8884d8" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </Collapse>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" component="h2" sx={{ mb: 2 }}>
                API Calls Distribution
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Success', value: realTimeMetrics.apiCalls * 0.85, color: '#4caf50' },
                      { name: 'Errors', value: realTimeMetrics.apiCalls * 0.15, color: '#f44336' }
                    ]}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                  >
                    {[
                      { name: 'Success', value: realTimeMetrics.apiCalls * 0.85, color: '#4caf50' },
                      { name: 'Errors', value: realTimeMetrics.apiCalls * 0.15, color: '#f44336' }
                    ].map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* User Activity Section */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6" component="h2">
              Live User Activity
            </Typography>
            <IconButton onClick={() => toggleSection('userActivity')}>
              {expandedSections.userActivity ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          </Box>
          
          <Collapse in={expandedSections.userActivity}>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Session</TableCell>
                    <TableCell>Action</TableCell>
                    <TableCell>Screen</TableCell>
                    <TableCell>Device</TableCell>
                    <TableCell>Time</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                                      {sessionActivities.slice(0, 10).map((activity: SessionActivity) => (
                    <TableRow key={activity.id}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Avatar 
                            sx={{ width: 32, height: 32, mr: 1, bgcolor: 'primary.main' }}
                          >
                            S
                          </Avatar>
                          <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                            {activity.sessionId ? `${activity.sessionId.slice(0, 8)}...` : 'Unknown Session'}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          {getActionIcon(activity.action)}
                          <Typography variant="body2" sx={{ ml: 1 }}>
                            {activity.action}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>{activity.screen}</TableCell>
                      <TableCell>
                        <Chip
                          label={activity.deviceInfo?.platform || 'Unknown'}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {new Date(activity.timestamp).toLocaleTimeString()}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Collapse>
        </CardContent>
      </Card>

      {/* Performance Alerts Section */}
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6" component="h2">
              Performance Alerts
            </Typography>
            <IconButton onClick={() => toggleSection('alerts')}>
              {expandedSections.alerts ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          </Box>
          
          <Collapse in={expandedSections.alerts}>
            <List>
              {performanceAlerts.slice(0, 5).map((alert) => (
                <ListItem key={alert.id}>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: `${getAlertColor(alert.severity)}.main` }}>
                      {alert.type === 'error' ? <ErrorIcon /> : 
                       alert.type === 'warning' ? <WarningIcon /> : <InfoIcon />}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={alert.message}
                    secondary={new Date(alert.timestamp).toLocaleString()}
                  />
                  <Chip
                    label={alert.severity}
                    color={getAlertColor(alert.severity)}
                    size="small"
                  />
                </ListItem>
              ))}
            </List>
          </Collapse>
        </CardContent>
      </Card>
    </Box>
  );
};

export default RealTimeAnalyticsPage; 