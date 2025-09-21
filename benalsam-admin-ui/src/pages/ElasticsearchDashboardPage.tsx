import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
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
  Collapse,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Bolt as BoltIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Timeline as TimelineIcon,
  Storage as StorageIcon,
  Queue as QueueIcon,
  Sync as SyncIcon,
  TableChart as TableChartIcon,
  Visibility as VisibilityIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Close as CloseIcon
} from '@mui/icons-material';

interface HealthStatus {
  elasticsearch: boolean;
  redis: boolean;
  indexer: boolean;
  syncService: boolean;
}

interface SyncStatus {
  isRunning: boolean;
  lastSyncAt: string | null;
  nextSyncAt: string | null;
  totalSynced: number;
  errors: string[];
  progress: number;
}

interface QueueStats {
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  total: number;
}

interface IndexerStats {
  totalProcessed: number;
  totalSuccess: number;
  totalFailed: number;
  avgProcessingTime: number;
  lastProcessedAt: string | null;
  isRunning: boolean;
}

interface ElasticsearchIndex {
  name: string;
  health: string;
  status: string;
  docs_count: number;
  store_size: string;
  primary_shards: number;
  replica_shards: number;
}

interface ElasticsearchDocument {
  _id: string;
  _source: any;
  _index: string;
  _type?: string;
  _score?: number;
}

// Helper functions for data formatting
const formatEventData = (source: any, indexName: string) => {
  // Check if this is a listing document
  if (indexName === 'benalsam_listings') {
    return formatListingData(source);
  }
  
  // User behavior data
  const { event_type, event_data, session_id, device_info, timestamp, user_profile } = source;
  
  const formattedData: any = {
    timestamp: new Date(timestamp).toLocaleString('tr-TR'),
    eventType: event_type,
    sessionId: session_id?.substring(0, 20) + '...',
    device: `${device_info?.platform} ${device_info?.version} (${device_info?.model})`,
  };

  // Add user info if available (handle both old and new formats)
  if (user_profile) {
    // New format: user_profile object
    formattedData.user = user_profile.name || user_profile.email || 'Unknown User';
    if (user_profile.avatar) {
      formattedData.avatar = user_profile.avatar;
    }
  } else if (event_data?.user_name || event_data?.user_email) {
    // Old format: user data in event_data
    formattedData.user = event_data.user_name || event_data.user_email || 'Unknown User';
    if (event_data.user_avatar) {
      formattedData.avatar = event_data.user_avatar;
    }
  } else {
    // Fallback
    formattedData.user = 'Unknown User';
  }

  // Format event-specific data
  switch (event_type) {
    case 'view':
      formattedData.details = {
        screen: event_data?.screen_name,
        timeSpent: `${event_data?.time_spent || 0}s`,
        scrollDepth: `${event_data?.scroll_depth || 0}%`
      };
      break;
    case 'click':
      formattedData.details = {
        element: event_data?.element_type,
        screen: event_data?.screen_name,
        action: event_data?.action_type
      };
      break;
    case 'performance':
      formattedData.details = {
        metric: event_data?.metric_type,
        value: event_data?.value || event_data?.used_mb || event_data?.percentage,
        unit: event_data?.unit || 'MB'
      };
      break;
    case 'error':
      formattedData.details = {
        error: event_data?.error_message,
        stack: event_data?.stack_trace?.substring(0, 100) + '...'
      };
      break;
    default:
      formattedData.details = event_data;
  }

  return formattedData;
};

const formatListingData = (source: any) => {
  const {
    id,
    title,
    description,
    category,
    budget,
    location,
    urgency,
    status,
    user_id,
    created_at,
    updated_at,
    popularity_score,
    is_premium
  } = source;

  return {
    timestamp: new Date(created_at).toLocaleString('tr-TR'),
    eventType: 'listing',
    sessionId: id?.substring(0, 20) + '...',
    device: 'Web/Mobile App',
    session: `Session ${user_id?.substring(0, 8)}...`,
    details: {
      title: title?.substring(0, 50) + (title?.length > 50 ? '...' : ''),
      category: category,
      budget: budget ? `${budget} TL` : 'Belirtilmemiş',
      location: location,
      urgency: urgency,
      status: status,
      premium: is_premium ? 'Evet' : 'Hayır',
      popularity: popularity_score || 0
    }
  };
};

const getEventIcon = (eventType: string) => {
  switch (eventType) {
    case 'view': return <VisibilityIcon fontSize="small" />;
    case 'click': return <BoltIcon fontSize="small" />;
    case 'performance': return <TimelineIcon fontSize="small" />;
    case 'error': return <ErrorIcon fontSize="small" />;
    case 'listing': return <TableChartIcon fontSize="small" />;
    default: return <InfoIcon fontSize="small" />;
  }
};

const getEventColor = (eventType: string) => {
  switch (eventType) {
    case 'view': return 'primary';
    case 'click': return 'secondary';
    case 'performance': return 'info';
    case 'error': return 'error';
    case 'listing': return 'success';
    default: return 'default';
  }
};

const ElasticsearchDashboardPage: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [healthStatus, setHealthStatus] = useState<HealthStatus>({
    elasticsearch: false,
    redis: false,
    indexer: false,
    syncService: false
  });
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isRunning: false,
    lastSyncAt: null,
    nextSyncAt: null,
    totalSynced: 0,
    errors: [],
    progress: 0
  });
  const [queueStats, setQueueStats] = useState<QueueStats>({
    pending: 0,
    processing: 0,
    completed: 0,
    failed: 0,
    total: 0
  });
  const [indexerStats, setIndexerStats] = useState<IndexerStats>({
    totalProcessed: 0,
    totalSuccess: 0,
    totalFailed: 0,
    avgProcessingTime: 0,
    lastProcessedAt: null,
    isRunning: false
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [elasticsearchIndexes, setElasticsearchIndexes] = useState<ElasticsearchIndex[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<string>('');
  const [indexDocuments, setIndexDocuments] = useState<ElasticsearchDocument[]>([]);
  const [expandedIndex, setExpandedIndex] = useState<string | null>(null);
  const [loadingIndexes, setLoadingIndexes] = useState(false);
  const [loadingDocuments, setLoadingDocuments] = useState(false);

  // Modal state for details
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<any>(null);

  // Queue jobs state
  const [queueJobs, setQueueJobs] = useState<any[]>([]);
  const [loadingQueueJobs, setLoadingQueueJobs] = useState(false);
  const [queueJobFilter, setQueueJobFilter] = useState<string>('all');

  // Mock data for development
  const mockData = {
    healthStatus: {
      elasticsearch: true,
      redis: true,
      indexer: true,
      syncService: true
    },
    syncStatus: {
      isRunning: false,
      lastSyncAt: new Date(Date.now() - 300000).toISOString(), // 5 minutes ago
      nextSyncAt: new Date(Date.now() + 300000).toISOString(), // 5 minutes from now
      totalSynced: 15420,
      errors: [],
      progress: 100
    },
    queueStats: {
      pending: 5,
      processing: 2,
      completed: 15420,
      failed: 3,
      total: 15430
    },
    indexerStats: {
      totalProcessed: 15420,
      totalSuccess: 15417,
      totalFailed: 3,
      avgProcessingTime: 125,
      lastProcessedAt: new Date(Date.now() - 60000).toISOString(), // 1 minute ago
      isRunning: true
    }
  };

  useEffect(() => {
    loadDashboardData();
    loadElasticsearchIndexes();
    const interval = setInterval(loadDashboardData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // In development, use mock data
      if (process.env.NODE_ENV === 'development') {
        setHealthStatus(mockData.healthStatus);
        setSyncStatus(mockData.syncStatus);
        setQueueStats(mockData.queueStats);
        setIndexerStats(mockData.indexerStats);
      } else {
        // In production, fetch real data
        const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002/api/v1';
        const [healthRes, syncRes, queueRes] = await Promise.all([
          fetch(`${API_BASE_URL}/elasticsearch/health-check`),
          fetch(`${API_BASE_URL}/elasticsearch/sync/status`),
          fetch(`${API_BASE_URL}/elasticsearch/queue/stats`)
        ]);

        if (healthRes.ok) {
          const healthData = await healthRes.json();
          setHealthStatus(healthData.data);
        }

        if (syncRes.ok) {
          const syncData = await syncRes.json();
          setSyncStatus(syncData.data.status);
          setIndexerStats(syncData.data.stats);
        }

        if (queueRes.ok) {
          const queueData = await queueRes.json();
          setQueueStats(queueData.data.queue);
        }
      }
    } catch (err) {
      setError('Failed to load dashboard data');
      console.error('Dashboard load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const triggerManualSync = async () => {
    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002/api/v1';
      const response = await fetch(`${API_BASE_URL}/elasticsearch/sync/trigger`, {
        method: 'POST'
      });
      
      if (response.ok) {
        // Reload data after sync
        setTimeout(loadDashboardData, 2000);
      }
    } catch (err) {
      console.error('Manual sync error:', err);
    }
  };

  const retryFailedJobs = async () => {
    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002/api/v1';
      const response = await fetch(`${API_BASE_URL}/elasticsearch/queue/retry-failed`, {
        method: 'POST'
      });
      
      if (response.ok) {
        loadDashboardData();
      }
    } catch (err) {
      console.error('Retry failed jobs error:', err);
    }
  };

  const loadElasticsearchIndexes = async () => {
    try {
      setLoadingIndexes(true);
      const data = await apiService.getElasticsearchStats();
      
      if (data.success && data.data?.indices) {
        const indexes: ElasticsearchIndex[] = Object.entries(data.data.indices).map(([name, stats]: [string, any]) => ({
          name,
          health: stats.health || 'unknown',
          status: stats.status || 'unknown',
          docs_count: stats.primaries?.docs?.count || 0,
          store_size: stats.primaries?.store?.size_in_bytes ? `${(stats.primaries.store.size_in_bytes / 1024 / 1024).toFixed(2)} MB` : '0 MB',
          primary_shards: stats.primaries?.shard_stats?.total_count || 0,
          replica_shards: stats.total?.shard_stats?.total_count - stats.primaries?.shard_stats?.total_count || 0
        }));
        setElasticsearchIndexes(indexes);
      }
    } catch (err) {
      console.error('Failed to load Elasticsearch indexes:', err);
    } finally {
      setLoadingIndexes(false);
    }
  };

  const loadIndexDocuments = async (indexName: string) => {
    try {
      setLoadingDocuments(true);
      console.log('🔍 Loading documents for index:', indexName);
      
      const data = await apiService.searchElasticsearchIndex(indexName, 20);
      console.log('📊 API Response:', data);
      
      console.log('🔍 Checking response structure:');
      console.log('  - data.success:', data.success);
      console.log('  - data.data:', data.data);
      console.log('  - data.data?.hits:', data.data?.hits);
      console.log('  - data.data?.hits?.hits:', data.data?.hits?.hits);
      console.log('  - data.data?.hits?.hits?.length:', data.data?.hits?.hits?.length);
      
      if (data.success && data.data?.hits?.hits) {
        console.log('✅ Setting documents:', data.data.hits.hits.length, 'documents');
        setIndexDocuments(data.data.hits.hits);
      } else {
        console.log('❌ No documents found or invalid response structure');
        console.log('Response structure:', data);
      }
    } catch (err) {
      console.error('❌ Failed to load index documents:', err);
    } finally {
      setLoadingDocuments(false);
    }
  };

  const handleIndexExpand = (indexName: string) => {
    if (expandedIndex === indexName) {
      setExpandedIndex(null);
      setIndexDocuments([]);
    } else {
      setExpandedIndex(indexName);
      loadIndexDocuments(indexName);
    }
  };

  const getStatusChip = (status: boolean, label: string) => {
    return (
      <Chip
        icon={status ? <CheckCircleIcon /> : <ErrorIcon />}
        label={label}
        color={status ? 'success' : 'error'}
        variant="outlined"
        size="small"
      />
    );
  };

  const handleDetailsClick = (document: any, indexName: string) => {
    setSelectedDocument({
      ...document,
      indexName,
      formattedData: formatEventData(document._source, indexName)
    });
    setDetailsModalOpen(true);
  };

  const handleCloseModal = () => {
    setDetailsModalOpen(false);
    setSelectedDocument(null);
  };

  if (loading) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        minHeight="400px"
        gap={2}
      >
        <CircularProgress size={60} />
        <Typography variant="h6" color="text.secondary">
          Loading dashboard...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: '100%', mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'stretch' : 'center', gap: 2 }}>
          <Box>
            <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
              Elasticsearch Dashboard
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              Monitor Elasticsearch sync status and system health
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 2, flexDirection: isMobile ? 'column' : 'row' }}>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={loadDashboardData}
              sx={{ minWidth: 120 }}
            >
              Refresh
            </Button>
            <Button
              variant="contained"
              startIcon={<BoltIcon />}
              onClick={triggerManualSync}
              disabled={syncStatus.isRunning}
              sx={{ minWidth: 140 }}
            >
              Manual Sync
            </Button>
          </Box>
        </Box>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Health Status Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} lg={3}>
          <Card sx={{ height: '100%', transition: 'all 0.2s', '&:hover': { transform: 'translateY(-2px)', boxShadow: 3 } }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 'bold' }}>
                    Elasticsearch
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', mt: 1 }}>
                    Active
                  </Typography>
                </Box>
                {getStatusChip(healthStatus.elasticsearch, 'Healthy')}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} lg={3}>
          <Card sx={{ height: '100%', transition: 'all 0.2s', '&:hover': { transform: 'translateY(-2px)', boxShadow: 3 } }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 'bold' }}>
                    Redis
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', mt: 1 }}>
                    Connected
                  </Typography>
                </Box>
                {getStatusChip(healthStatus.redis, 'Connected')}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} lg={3}>
          <Card sx={{ height: '100%', transition: 'all 0.2s', '&:hover': { transform: 'translateY(-2px)', boxShadow: 3 } }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 'bold' }}>
                    Indexer
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', mt: 1 }}>
                    Running
                  </Typography>
                </Box>
                {getStatusChip(healthStatus.indexer, 'Running')}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} lg={3}>
          <Card sx={{ height: '100%', transition: 'all 0.2s', '&:hover': { transform: 'translateY(-2px)', boxShadow: 3 } }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 'bold' }}>
                    Sync Service
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', mt: 1 }}>
                    Active
                  </Typography>
                </Box>
                {getStatusChip(healthStatus.syncService, 'Active')}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Main Dashboard Content */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Sync Progress */}
        <Grid item xs={12} lg={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <TimelineIcon sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  Sync Progress
                </Typography>
              </Box>
              
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Progress
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                    {syncStatus.progress}%
                  </Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={syncStatus.progress} 
                  sx={{ height: 8, borderRadius: 4 }}
                />
              </Box>
              
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={6}>
                  <Paper sx={{ 
                    p: 2, 
                    bgcolor: theme.palette.mode === 'dark' ? 'grey.800' : 'grey.50',
                    color: theme.palette.mode === 'dark' ? 'white' : 'inherit'
                  }}>
                    <Typography variant="body2" color="text.secondary">
                      Total Synced
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                      {syncStatus.totalSynced.toLocaleString()}
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6}>
                  <Paper sx={{ 
                    p: 2, 
                    bgcolor: theme.palette.mode === 'dark' ? 'grey.800' : 'grey.50',
                    color: theme.palette.mode === 'dark' ? 'white' : 'inherit'
                  }}>
                    <Typography variant="body2" color="text.secondary">
                      Status
                    </Typography>
                    <Chip
                      icon={syncStatus.isRunning ? <SyncIcon /> : <InfoIcon />}
                      label={syncStatus.isRunning ? 'Running' : 'Idle'}
                      color={syncStatus.isRunning ? 'primary' : 'default'}
                      size="small"
                      sx={{ mt: 0.5 }}
                    />
                  </Paper>
                </Grid>
              </Grid>

              {syncStatus.lastSyncAt && (
                <Paper sx={{ 
                  p: 2, 
                  bgcolor: theme.palette.mode === 'dark' ? 'grey.800' : 'grey.50',
                  color: theme.palette.mode === 'dark' ? 'white' : 'inherit'
                }}>
                  <Typography variant="body2" color="text.secondary">
                    Last Sync
                  </Typography>
                  <Typography variant="body2">
                    {new Date(syncStatus.lastSyncAt).toLocaleString()}
                  </Typography>
                </Paper>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Indexer Stats */}
        <Grid item xs={12} lg={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <StorageIcon sx={{ mr: 1, color: 'secondary.main' }} />
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  Indexer Statistics
                </Typography>
              </Box>
              
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={6}>
                  <Paper sx={{ p: 2, bgcolor: 'primary.50' }}>
                    <Typography variant="body2" color="primary.main">
                      Total Processed
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                      {indexerStats.totalProcessed.toLocaleString()}
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6}>
                  <Paper sx={{ p: 2, bgcolor: 'success.50' }}>
                    <Typography variant="body2" color="success.main">
                      Success Rate
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                      {indexerStats.totalProcessed > 0 
                        ? ((indexerStats.totalSuccess / indexerStats.totalProcessed) * 100).toFixed(1)
                        : 0}%
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6}>
                  <Paper sx={{ p: 2, bgcolor: 'error.50' }}>
                    <Typography variant="body2" color="error.main">
                      Failed
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'error.main' }}>
                      {indexerStats.totalFailed}
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6}>
                  <Paper sx={{ p: 2, bgcolor: 'warning.50' }}>
                    <Typography variant="body2" color="warning.main">
                      Avg Time
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'warning.main' }}>
                      {indexerStats.avgProcessingTime}ms
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>

              {indexerStats.lastProcessedAt && (
                <Paper sx={{ 
                  p: 2, 
                  bgcolor: theme.palette.mode === 'dark' ? 'grey.800' : 'grey.50',
                  color: theme.palette.mode === 'dark' ? 'white' : 'inherit'
                }}>
                  <Typography variant="body2" color="text.secondary">
                    Last Processed
                  </Typography>
                  <Typography variant="body2">
                    {new Date(indexerStats.lastProcessedAt).toLocaleString()}
                  </Typography>
                </Paper>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Queue Management */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <QueueIcon sx={{ mr: 1, color: 'warning.main' }} />
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              Queue Management
            </Typography>
          </Box>
          
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={6} sm={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'primary.main', mb: 1 }}>
                  {queueStats.pending}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Pending
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'warning.main', mb: 1 }}>
                  {queueStats.processing}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Processing
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'success.main', mb: 1 }}>
                  {queueStats.completed}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Completed
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'error.main', mb: 1 }}>
                  {queueStats.failed}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Failed
                </Typography>
              </Box>
            </Grid>
          </Grid>

          <Button
            variant="contained"
            color="warning"
            startIcon={<RefreshIcon />}
            onClick={retryFailedJobs}
            disabled={queueStats.failed === 0}
            sx={{ minWidth: 200 }}
          >
            Retry Failed Jobs ({queueStats.failed})
          </Button>
        </CardContent>
      </Card>

      {/* Sync Management */}
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <SyncIcon sx={{ mr: 1, color: 'info.main' }} />
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              Sync Management
            </Typography>
          </Box>
          
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} md={6}>
              <Paper sx={{ 
                p: 2, 
                bgcolor: theme.palette.mode === 'dark' ? 'grey.800' : 'grey.50',
                color: theme.palette.mode === 'dark' ? 'white' : 'inherit'
              }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                  Sync Status
                </Typography>
                <Chip
                  icon={syncStatus.isRunning ? <SyncIcon /> : <InfoIcon />}
                  label={syncStatus.isRunning ? 'Running' : 'Idle'}
                  color={syncStatus.isRunning ? 'primary' : 'default'}
                />
              </Paper>
            </Grid>

            <Grid item xs={12} md={6}>
              <Paper sx={{ 
                p: 2, 
                bgcolor: theme.palette.mode === 'dark' ? 'grey.800' : 'grey.50',
                color: theme.palette.mode === 'dark' ? 'white' : 'inherit'
              }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                  Next Sync
                </Typography>
                <Typography variant="body2">
                  {syncStatus.nextSyncAt 
                    ? new Date(syncStatus.nextSyncAt).toLocaleString()
                    : "Not scheduled"
                  }
                </Typography>
              </Paper>
            </Grid>
          </Grid>

          {syncStatus.errors.length > 0 && (
            <Alert severity="error" sx={{ mt: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                Sync Errors
              </Typography>
              <Box component="ul" sx={{ m: 0, pl: 2 }}>
                {syncStatus.errors.map((error, index) => (
                  <Typography component="li" key={index} variant="body2">
                    {error}
                  </Typography>
                ))}
              </Box>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Elasticsearch Indexes */}
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <TableChartIcon sx={{ mr: 1, color: 'primary.main' }} />
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                Elasticsearch Indexes
              </Typography>
            </Box>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={loadElasticsearchIndexes}
              disabled={loadingIndexes}
              size="small"
            >
              {loadingIndexes ? 'Loading...' : 'Refresh'}
            </Button>
          </Box>

          {loadingIndexes ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : elasticsearchIndexes.length > 0 ? (
            <Box>
              {elasticsearchIndexes.map((index) => (
                <Accordion
                  key={index.name}
                  expanded={expandedIndex === index.name}
                  onChange={() => handleIndexExpand(index.name)}
                  sx={{ mb: 1 }}
                >
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                          {index.name}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                          <Chip
                            label={index.health}
                            color={index.health === 'green' ? 'success' : index.health === 'yellow' ? 'warning' : 'error'}
                            size="small"
                          />
                          <Chip
                            label={index.status}
                            color={index.status === 'open' ? 'success' : 'default'}
                            size="small"
                          />
                          <Chip
                            label={`${index.docs_count} docs`}
                            variant="outlined"
                            size="small"
                          />
                          <Chip
                            label={index.store_size}
                            variant="outlined"
                            size="small"
                          />
                        </Box>
                      </Box>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    {expandedIndex === index.name && (
                      <Box>
                        {loadingDocuments ? (
                          <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                            <CircularProgress size={24} />
                          </Box>
                        ) : indexDocuments.length > 0 ? (
                          <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
                            <Table size="small">
                              <TableHead>
                                <TableRow>
                                  <TableCell>Timestamp</TableCell>
                                  <TableCell>Event Type</TableCell>
                                  <TableCell>User</TableCell>
                                  <TableCell>Device</TableCell>
                                  <TableCell>Title</TableCell>
                                  <TableCell>Session</TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {indexDocuments.map((doc) => {
                                  const formattedData = formatEventData(doc._source, index.name);
                                  return (
                                    <TableRow key={doc._id} hover>
                                      <TableCell>
                                        <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                                          {formattedData.timestamp}
                                        </Typography>
                                      </TableCell>
                                      <TableCell>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                          {getEventIcon(formattedData.eventType)}
                                          <Chip 
                                            label={formattedData.eventType} 
                                            size="small" 
                                            color={getEventColor(formattedData.eventType) as any}
                                          />
                                        </Box>
                                      </TableCell>
                                      <TableCell>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                          {formattedData.avatar && (
                                            <Box
                                              component="img"
                                              src={formattedData.avatar}
                                              sx={{ width: 24, height: 24, borderRadius: '50%' }}
                                            />
                                          )}
                                          <Typography variant="body2">
                                            {formattedData.user || 'Anonymous'}
                                          </Typography>
                                        </Box>
                                      </TableCell>
                                      <TableCell>
                                        <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                                          {formattedData.device}
                                        </Typography>
                                      </TableCell>
                                      <TableCell>
                                        <Box 
                                          sx={{ 
                                            cursor: 'pointer',
                                            '&:hover': {
                                              backgroundColor: 'action.hover',
                                              borderRadius: 1,
                                              p: 0.5
                                            }
                                          }}
                                          onClick={() => handleDetailsClick(doc, index.name)}
                                        >
                                          <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                                            {index.name === 'benalsam_listings' 
                                              ? formattedData.details?.title || 'Başlıksız İlan'
                                              : formattedData.eventType === 'view'
                                                ? `${formattedData.details?.screen || 'Bilinmeyen'} Ekranı`
                                                : formattedData.eventType === 'click'
                                                  ? `${formattedData.details?.element || 'Element'} Tıklaması`
                                                  : formattedData.eventType === 'performance'
                                                    ? `${formattedData.details?.metric || 'Metrik'} Ölçümü`
                                                    : formattedData.eventType === 'error'
                                                      ? 'Hata Raporu'
                                                      : formattedData.eventType
                                            }
                                          </Typography>
                                          <Typography variant="caption" color="text.secondary">
                                            Detaylar için tıklayın
                                          </Typography>
                                        </Box>
                                      </TableCell>
                                      <TableCell>
                                        <Typography variant="body2" sx={{ fontSize: '0.75rem', fontFamily: 'monospace' }}>
                                          {formattedData.sessionId}
                                        </Typography>
                                      </TableCell>
                                    </TableRow>
                                  );
                                })}
                              </TableBody>
                            </Table>
                          </TableContainer>
                        ) : (
                          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                            No documents found in this index
                          </Typography>
                        )}
                      </Box>
                    )}
                  </AccordionDetails>
                </Accordion>
              ))}
            </Box>
          ) : (
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
              No Elasticsearch indexes found
            </Typography>
          )}
        </CardContent>
      </Card>

      {/* Details Modal */}
      <Dialog
        open={detailsModalOpen}
        onClose={handleCloseModal}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6">
              Detaylı Bilgiler - {selectedDocument?.indexName}
            </Typography>
            <IconButton onClick={handleCloseModal}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedDocument && (
            <Box sx={{ mt: 2 }}>
              {/* Basic Info */}
              <Paper sx={{ p: 2, mb: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Temel Bilgiler
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">Document ID:</Typography>
                    <Typography variant="body1" sx={{ fontFamily: 'monospace' }}>
                      {selectedDocument._id}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">Index:</Typography>
                    <Typography variant="body1">
                      {selectedDocument.indexName}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">Timestamp:</Typography>
                    <Typography variant="body1">
                      {selectedDocument.formattedData.timestamp}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">Event Type:</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {getEventIcon(selectedDocument.formattedData.eventType)}
                      <Chip 
                        label={selectedDocument.formattedData.eventType} 
                        size="small" 
                        color={getEventColor(selectedDocument.formattedData.eventType) as any}
                      />
                    </Box>
                  </Grid>
                </Grid>
              </Paper>

              {/* User Info */}
              {selectedDocument.formattedData.user && (
                <Paper sx={{ p: 2, mb: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Kullanıcı Bilgileri
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    {selectedDocument.formattedData.avatar && (
                      <Box
                        component="img"
                        src={selectedDocument.formattedData.avatar}
                        sx={{ width: 48, height: 48, borderRadius: '50%' }}
                      />
                    )}
                    <Typography variant="body1">
                      {selectedDocument.formattedData.user}
                    </Typography>
                  </Box>
                </Paper>
              )}

              {/* Device Info */}
              <Paper sx={{ p: 2, mb: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Cihaz Bilgileri
                </Typography>
                <Typography variant="body1">
                  {selectedDocument.formattedData.device}
                </Typography>
              </Paper>

              {/* Details */}
              <Paper sx={{ p: 2, mb: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Detaylar
                </Typography>
                {selectedDocument.formattedData.details && typeof selectedDocument.formattedData.details === 'object' ? (
                  <Grid container spacing={2}>
                    {Object.entries(selectedDocument.formattedData.details).map(([key, value]) => (
                      <Grid item xs={12} sm={6} key={key}>
                        <Typography variant="body2" color="text.secondary" sx={{ textTransform: 'capitalize' }}>
                          {key.replace(/([A-Z])/g, ' $1').trim()}:
                        </Typography>
                        <Typography variant="body1">
                          {String(value)}
                        </Typography>
                      </Grid>
                    ))}
                  </Grid>
                ) : (
                  <Typography variant="body1">
                    {String(selectedDocument.formattedData.details)}
                  </Typography>
                )}
              </Paper>

              {/* Raw Data */}
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Ham Veri
                </Typography>
                <Box sx={{ 
                  bgcolor: 'grey.100', 
                  p: 2, 
                  borderRadius: 1,
                  maxHeight: 300,
                  overflow: 'auto'
                }}>
                  <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                    {JSON.stringify(selectedDocument._source, null, 2)}
                  </Typography>
                </Box>
              </Paper>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseModal}>
            Kapat
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ElasticsearchDashboardPage; 