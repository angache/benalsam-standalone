import React, { useState } from 'react';
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
  Divider,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem
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
  Map as MapIcon,
  Search as SearchIcon
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

interface SessionStats {
  totalSessions: number;
  activeSessions: number;
  avgSessionDuration: number;
  totalEvents: number;
  eventTypes: Array<{
    key: string;
    doc_count: number;
  }>;
  platforms: Array<{
    key: string;
    doc_count: number;
  }>;
}

interface SessionEvent {
  session_id: string;
  event_type: string;
  event_data: any;
  timestamp: string;
  device_info: {
    platform: string;
    version: string;
    model?: string;
  };
}

const SessionAnalyticsPage: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [timeRange, setTimeRange] = useState(7);
  const [activeTab, setActiveTab] = useState(0);
  const [searchSessionId, setSearchSessionId] = useState('');
  const [selectedEventType, setSelectedEventType] = useState('all');

  // Session analytics queries
  const { data: sessionAnalytics, isLoading: analyticsLoading, refetch } = useQuery({
    queryKey: ['session-analytics', timeRange, searchSessionId, selectedEventType],
    queryFn: async () => {
      const result = await apiService.getSessionAnalytics({ 
        limit: 100, 
        start_date: new Date(Date.now() - timeRange * 24 * 60 * 60 * 1000).toISOString(),
        session_id: searchSessionId || undefined,
        event_type: selectedEventType === 'all' ? undefined : selectedEventType
      });
      console.log('🔍 Session Analytics API Response:', result);
      return result;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  const { data: sessionStats, isLoading: statsLoading } = useQuery({
    queryKey: ['session-stats', timeRange],
    queryFn: async () => {
      const result = await apiService.getSessionStats(timeRange);
      console.log('🔍 Session Stats API Response:', result);
      return result;
    },
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

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  if (analyticsLoading || statsLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  const stats = sessionStats?.data as SessionStats;

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
          🔐 Session Analytics Dashboard
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

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Session ID Ara"
                value={searchSessionId}
                onChange={(e) => setSearchSessionId(e.target.value)}
                placeholder="Session ID girin..."
                size="small"
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Event Type</InputLabel>
                <Select
                  value={selectedEventType}
                  onChange={(e) => setSelectedEventType(e.target.value)}
                  label="Event Type"
                >
                  <MenuItem value="all">Tüm Event'ler</MenuItem>
                  {eventTypes?.data?.map((type: string) => (
                    <MenuItem key={type} value={type}>{type}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Zaman Aralığı</InputLabel>
                <Select
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value as number)}
                  label="Zaman Aralığı"
                >
                  <MenuItem value={1}>Son 1 Gün</MenuItem>
                  <MenuItem value={7}>Son 7 Gün</MenuItem>
                  <MenuItem value={30}>Son 30 Gün</MenuItem>
                  <MenuItem value={90}>Son 90 Gün</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <Button
                variant="contained"
                startIcon={<SearchIcon />}
                fullWidth
                onClick={handleRefresh}
              >
                Filtrele
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" gutterBottom variant="body2">
                    Toplam Session
                  </Typography>
                  <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                    {formatNumber(stats?.totalSessions || 0)}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    width: 60,
                    height: 60,
                    borderRadius: '50%',
                    backgroundColor: theme.palette.primary.main,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white'
                  }}
                >
                  <UsersIcon />
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
                    Aktif Session
                  </Typography>
                  <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                    {formatNumber(stats?.activeSessions || 0)}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    width: 60,
                    height: 60,
                    borderRadius: '50%',
                    backgroundColor: theme.palette.success.main,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white'
                  }}
                >
                  <TrendingUpIcon />
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
                    Ortalama Session Süresi
                  </Typography>
                  <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                    {formatDuration(stats?.avgSessionDuration || 0)}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    width: 60,
                    height: 60,
                    borderRadius: '50%',
                    backgroundColor: theme.palette.warning.main,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white'
                  }}
                >
                  <ClockIcon />
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
                    Toplam Event
                  </Typography>
                  <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                    {formatNumber(stats?.totalEvents || 0)}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    width: 60,
                    height: 60,
                    borderRadius: '50%',
                    backgroundColor: theme.palette.info.main,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white'
                  }}
                >
                  <BarChartIcon />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={activeTab} onChange={handleTabChange} aria-label="analytics tabs">
            <Tab label="Session Events" />
            <Tab label="Event Types" />
            <Tab label="Platforms" />
            <Tab label="Session Details" />
          </Tabs>
        </Box>

        <Box sx={{ p: 3 }}>
          {/* Session Events Tab */}
          {activeTab === 0 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Session Events
              </Typography>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Session ID</TableCell>
                      <TableCell>Event Type</TableCell>
                      <TableCell>Timestamp</TableCell>
                      <TableCell>Platform</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {sessionAnalytics?.events?.map((event: SessionEvent, index: number) => (
                      <TableRow key={index}>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                            {event.session_id.substring(0, 8)}...
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip label={event.event_type} size="small" />
                        </TableCell>
                        <TableCell>
                          {new Date(event.timestamp).toLocaleString('tr-TR')}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {event.device_info.platform} {event.device_info.version}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <IconButton size="small">
                            <EyeIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}

          {/* Event Types Tab */}
          {activeTab === 1 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Event Types Distribution
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={stats?.eventTypes || []}
                        dataKey="doc_count"
                        nameKey="key"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label
                      >
                        {stats?.eventTypes?.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={theme.palette.primary.main} />
                        ))}
                      </Pie>
                      <RechartsTooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Box>
                    {stats?.eventTypes?.map((eventType: any, index: number) => (
                      <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                        <Typography variant="body2">{eventType.key}</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                          {eventType.doc_count}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </Grid>
              </Grid>
            </Box>
          )}

          {/* Platforms Tab */}
          {activeTab === 2 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Platform Distribution
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={stats?.platforms || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="key" />
                      <YAxis />
                      <RechartsTooltip />
                      <Bar dataKey="doc_count" fill={theme.palette.primary.main} />
                    </BarChart>
                  </ResponsiveContainer>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Box>
                    {stats?.platforms?.map((platform: any, index: number) => (
                      <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                        <Typography variant="body2">{platform.key}</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                          {platform.doc_count}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </Grid>
              </Grid>
            </Box>
          )}

          {/* Session Details Tab */}
          {activeTab === 3 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Session Details
              </Typography>
              <Alert severity="info" sx={{ mb: 2 }}>
                Session detayları için bir Session ID seçin veya arama yapın.
              </Alert>
              <TextField
                fullWidth
                label="Session ID"
                placeholder="Session ID girin..."
                sx={{ mb: 2 }}
              />
              <Button variant="contained" startIcon={<SearchIcon />}>
                Session Detaylarını Getir
              </Button>
            </Box>
          )}
        </Box>
      </Card>
    </Box>
  );
};

export default SessionAnalyticsPage; 