import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  CircularProgress,
  Alert,
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
  Tabs,
  Tab,
  Button,
  IconButton,
  Tooltip,
  Divider
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Visibility as EyeIcon,
  People as UsersIcon,
  Schedule as ClockIcon,
  Speed as SpeedIcon,
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  BarChart as BarChartIcon,
  PieChart as PieChartIcon,
  Timeline as TimelineIcon,
  Map as MapIcon
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
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { apiService } from '../services/api';
import type { AnalyticsEvent, AnalyticsEventType } from 'benalsam-shared-types';

// Session-based analytics interfaces
interface SessionAnalyticsSummary {
  session_id: string;
  event_name: string;
  count: number;
  unique_sessions: number;
  avg_session_duration: number;
  daily_trend: Array<{
    date: string;
    count: number;
  }>;
}

interface SessionAnalyticsStats {
  sessionId: string;
  period: string;
  stats: {
    totalEvents: number;
    uniqueSessions: number;
    avgSessionDuration: number;
    eventTypes: Array<{
      key: string;
      doc_count: number;
    }>;
    platforms: Array<{
      key: string;
      doc_count: number;
    }>;
  };
}

interface PerformanceMetrics {
  period: string;
  performance: {
    appLoad: {
      avgLoadTime: number;
      p95LoadTime: number;
    };
    apiCalls: {
      avgDuration: number;
      p95Duration: number;
    };
    errors: {
      totalErrors: number;
      errorTypes: Array<{
        key: string;
        doc_count: number;
      }>;
    };
  };
}

interface PopularPage {
  page_name: string;
  view_count: number;
  unique_sessions: number;
  avg_duration: number;
  bounce_rate: number;
  daily_trend: Array<{
    date: string;
    count: number;
  }>;
}

interface FeatureUsage {
  feature: string;
  usage_count: number;
  unique_sessions: number;
  daily_trend: Array<{
    date: string;
    count: number;
  }>;
}

interface UserJourney {
  session_id: string;
  journey: Array<{
    screen: string;
    action: string;
    timestamp: string;
  }>;
}

interface AnalyticsDashboard {
  popularPages: PopularPage[];
  featureUsage: FeatureUsage[];
  bounceRate: any;
  userActivities: any[];
  performanceMetrics: any;
  summary: {
    totalPages: number;
    totalFeatures: number;
    totalActivities: number;
    avgBounceRate: number;
  };
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const AnalyticsDashboardPage: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [activeTab, setActiveTab] = useState(0);
  const [timeRange, setTimeRange] = useState(7);

  const { data: dashboardData, isLoading, error, refetch } = useQuery({
    queryKey: ['analytics-dashboard', timeRange],
    queryFn: () => apiService.getAnalyticsDashboard(timeRange),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Session-based analytics queries
  const { data: sessionAnalytics, isLoading: eventsLoading } = useQuery({
    queryKey: ['session-analytics', timeRange],
    queryFn: () => apiService.getSessionAnalytics({ limit: 100, start_date: new Date(Date.now() - timeRange * 24 * 60 * 60 * 1000).toISOString() }),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  const { data: sessionStats, isLoading: statsLoading } = useQuery({
    queryKey: ['session-stats', timeRange],
    queryFn: () => apiService.getSessionStats(timeRange),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const { data: eventTypes, isLoading: eventTypesLoading } = useQuery({
    queryKey: ['analytics-event-types', timeRange],
    queryFn: () => apiService.getAnalyticsEventTypes(timeRange),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleRefresh = () => {
    refetch();
  };

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const formatNumber = (num: number | undefined | null) => {
    if (num === undefined || num === null) return '0';
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        Analytics verileri yüklenirken hata oluştu. Lütfen tekrar deneyin.
      </Alert>
    );
  }

  const data = dashboardData?.data as AnalyticsDashboard;

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
          📊 Analytics Dashboard
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={handleRefresh}
          >
            Yenile
          </Button>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
          >
            Rapor İndir
          </Button>
        </Box>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" gutterBottom variant="body2">
                    Toplam Sayfa
                  </Typography>
                  <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                    {data?.summary?.totalPages || 0}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    width: 60,
                    height: 60,
                    borderRadius: '50%',
                    bgcolor: 'primary.main',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <EyeIcon sx={{ color: 'white' }} />
                </Box>
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
                    Toplam Özellik
                  </Typography>
                  <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                    {data?.summary?.totalFeatures || 0}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    width: 60,
                    height: 60,
                    borderRadius: '50%',
                    bgcolor: 'success.main',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <BarChartIcon sx={{ color: 'white' }} />
                </Box>
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
                    Toplam Aktivite
                  </Typography>
                  <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                    {formatNumber(data?.summary?.totalActivities || 0)}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    width: 60,
                    height: 60,
                    borderRadius: '50%',
                    bgcolor: 'warning.main',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <TimelineIcon sx={{ color: 'white' }} />
                </Box>
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
                    Ortalama Bounce Rate
                  </Typography>
                  <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                    {data?.summary?.avgBounceRate?.toFixed(1) || 0}%
                  </Typography>
                </Box>
                <Box
                  sx={{
                    width: 60,
                    height: 60,
                    borderRadius: '50%',
                    bgcolor: 'error.main',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <TrendingDownIcon sx={{ color: 'white' }} />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange} variant="scrollable" scrollButtons="auto">
          <Tab label="Popüler Sayfalar" icon={<EyeIcon />} />
          <Tab label="Özellik Kullanımı" icon={<BarChartIcon />} />
          <Tab label="Kullanıcı Yolculuğu" icon={<MapIcon />} />
          <Tab label="Performans" icon={<SpeedIcon />} />
          <Tab label="Real-time Analytics" icon={<TimelineIcon />} />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      {activeTab === 0 && (
        <Box>
          <Typography variant="h6" sx={{ mb: 2 }}>
            En Çok Ziyaret Edilen Sayfalar
          </Typography>
          
          {/* Popular Pages Chart */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Sayfa Görüntülenme Sayıları
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data?.popularPages?.slice(0, 10) || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="page_name" />
                  <YAxis />
                  <RechartsTooltip />
                  <Bar dataKey="view_count" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Popular Pages Table */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Detaylı Sayfa Analizi
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Sayfa Adı</TableCell>
                      <TableCell align="right">Görüntülenme</TableCell>
                      <TableCell align="right">Benzersiz Kullanıcı</TableCell>
                      <TableCell align="right">Ortalama Süre</TableCell>
                      <TableCell align="right">Bounce Rate</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {data?.popularPages?.map((page, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                            {page.page_name}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Chip 
                            label={formatNumber(page.view_count)} 
                            size="small" 
                            color="primary" 
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Chip 
                            label={formatNumber(page.unique_sessions)} 
                            size="small" 
                            color="secondary" 
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Chip 
                            label={formatDuration(page.avg_duration)} 
                            size="small" 
                            color="info" 
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Chip 
                            label={`${page.bounce_rate.toFixed(1)}%`} 
                            size="small" 
                            color={page.bounce_rate > 50 ? 'error' : 'success'} 
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Box>
      )}

      {activeTab === 1 && (
        <Box>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Özellik Kullanım Analizi
          </Typography>
          
          {/* Feature Usage Chart */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Özellik Kullanım Dağılımı
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={data?.featureUsage?.slice(0, 5) || []}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ feature, usage_count }) => `${feature}: ${formatNumber(usage_count)}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="usage_count"
                  >
                    {data?.featureUsage?.slice(0, 5).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Feature Usage Table */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Özellik Kullanım Detayları
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Özellik</TableCell>
                      <TableCell align="right">Kullanım Sayısı</TableCell>
                      <TableCell align="right">Benzersiz Kullanıcı</TableCell>
                      <TableCell align="right">Trend</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {data?.featureUsage?.map((feature, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                            {feature.feature}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Chip 
                            label={formatNumber(feature.usage_count)} 
                            size="small" 
                            color="primary" 
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Chip 
                            label={formatNumber(feature.unique_sessions)} 
                            size="small" 
                            color="secondary" 
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                            <TrendingUpIcon sx={{ color: 'success.main', mr: 0.5 }} />
                            <Typography variant="body2" color="success.main">
                              +12%
                            </Typography>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Box>
      )}

      {activeTab === 2 && (
        <Box>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Kullanıcı Yolculuğu Analizi
          </Typography>
          
          <Alert severity="info" sx={{ mb: 3 }}>
            Kullanıcı yolculuğu analizi, kullanıcıların platformda nasıl hareket ettiğini gösterir.
          </Alert>

          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Son Kullanıcı Aktiviteleri
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Kullanıcı</TableCell>
                      <TableCell>Ekran</TableCell>
                      <TableCell>Eylem</TableCell>
                      <TableCell>Zaman</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {data?.userActivities?.slice(0, 10).map((activity, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                              {activity.username || 'Unknown User'}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={activity.screen} 
                            size="small" 
                            color="primary" 
                          />
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={activity.action} 
                            size="small" 
                            color="secondary" 
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {new Date(activity.timestamp).toLocaleString('tr-TR')}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Box>
      )}

      {activeTab === 3 && (
        <Box>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Performans Metrikleri
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    API Response Time
                  </Typography>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={data?.performanceMetrics?.apiResponseTime || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="timestamp" />
                      <YAxis />
                      <RechartsTooltip />
                      <Line type="monotone" dataKey="responseTime" stroke="#8884d8" />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Error Rate
                  </Typography>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={data?.performanceMetrics?.errorRate || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="timestamp" />
                      <YAxis />
                      <RechartsTooltip />
                      <Line type="monotone" dataKey="errorRate" stroke="#ff7300" />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      )}

      {activeTab === 4 && (
        <Box>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Real-time Analytics Dashboard
          </Typography>
          
          <Grid container spacing={3}>
            {/* Analytics Events Summary */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Analytics Events ({analyticsEvents?.data?.length || 0})
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {analyticsEvents?.data?.slice(0, 5).map((event: any, index: number) => (
                      <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1, border: '1px solid #e0e0e0', borderRadius: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                          {event.event_name}
                        </Typography>
                        <Chip 
                          label={event.user?.id || 'Unknown'} 
                          size="small" 
                          color="primary" 
                        />
                      </Box>
                    ))}
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Performance Metrics */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Performance Metrics
                  </Typography>
                  {performanceMetrics?.data ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <Box>
                        <Typography variant="body2" color="text.secondary">App Load Time</Typography>
                        <Typography variant="h6">
                          {performanceMetrics.data.performance?.appLoad?.avgLoadTime?.toFixed(2) || 'N/A'}ms
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="body2" color="text.secondary">API Response Time</Typography>
                        <Typography variant="h6">
                          {performanceMetrics.data.performance?.apiCalls?.avgDuration?.toFixed(2) || 'N/A'}ms
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="body2" color="text.secondary">Total Errors</Typography>
                        <Typography variant="h6" color="error">
                          {performanceMetrics.data.performance?.errors?.totalErrors || 0}
                        </Typography>
                      </Box>
                    </Box>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      Performance data loading...
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* Event Types Distribution */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Event Types Distribution
                  </Typography>
                  {eventTypes?.data ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={eventTypes.data}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="key" />
                        <YAxis />
                        <RechartsTooltip />
                        <Bar dataKey="doc_count" fill="#8884d8" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      Event types data loading...
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      )}
    </Box>
  );
};

export default AnalyticsDashboardPage; 