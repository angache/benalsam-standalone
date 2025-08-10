import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  LinearProgress,
  Button,
  Alert,
  AlertTitle,
  Tabs,
  Tab,
  Paper,
  Grid,
  Divider,
} from '@mui/material';
import {
  Activity,
  Database,
  HardDrive,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Clock,
  Zap,
  BarChart3,
  Settings,
  RefreshCw,
  Trash2,
  Eye,
  EyeOff,
} from 'lucide-react';

interface CacheStats {
  memoryCache: {
    totalItems: number;
    totalSize: number;
    hitRate: number;
    averageResponseTime: number;
    evictionCount: number;
  };
  redisCache: {
    totalKeys: number;
    totalSize: number;
    hitRate: number;
    connected: boolean;
  };
  searchCache: {
    totalSearches: number;
    cacheHits: number;
    cacheMisses: number;
    hitRate: number;
    averageResponseTime: number;
    popularQueries: string[];
  };
  apiCache: {
    totalRequests: number;
    cacheHits: number;
    cacheMisses: number;
    hitRate: number;
    averageResponseTime: number;
    popularEndpoints: string[];
  };
  overall: {
    totalRequests: number;
    totalHits: number;
    totalMisses: number;
    overallHitRate: number;
    averageResponseTime: number;
    memoryUsage: number;
    costSavings: number;
  };
}

interface CacheAnalytics {
  current: CacheStats;
  alerts: any[];
  costAnalysis: any;
  trends: any;
  summary: any;
}

interface GeographicStats {
  totalRegions: number;
  activeRegions: number;
  totalEdgeNodes: number;
  activeEdgeNodes: number;
  averageLatency: number;
  cacheHitRate: number;
  regionalDistribution: any;
}

interface PredictiveStats {
  totalSessions: number;
  activeSessions: number;
  averagePredictionScore: number;
  totalPredictions: number;
  modelAccuracy: number;
}

interface CompressionStats {
  totalCompressed: number;
  totalDecompressed: number;
  totalBytesSaved: number;
  averageCompressionRatio: number;
  compressionSpeed: number;
  decompressionSpeed: number;
  algorithms: any;
}

const CacheDashboardPage: React.FC = () => {
  const [cacheAnalytics, setCacheAnalytics] = useState<CacheAnalytics | null>(null);
  const [geographicStats, setGeographicStats] = useState<GeographicStats | null>(null);
  const [predictiveStats, setPredictiveStats] = useState<PredictiveStats | null>(null);
  const [compressionStats, setCompressionStats] = useState<CompressionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  const fetchCacheData = async () => {
    try {
      setLoading(true);
      
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002/api/v1';

      // Fetch cache analytics
      const analyticsResponse = await fetch(`${API_BASE_URL}/cache-analytics/dashboard`);
      const analyticsData = await analyticsResponse.json();
      
      if (analyticsData.success) {
        setCacheAnalytics(analyticsData.data);
      }

      // Fetch geographic stats
      const geographicResponse = await fetch(`${API_BASE_URL}/geographic-cache/stats`);
      const geographicData = await geographicResponse.json();
      
      if (geographicData.success) {
        setGeographicStats(geographicData.data);
      }

      // Fetch predictive stats
      const predictiveResponse = await fetch(`${API_BASE_URL}/predictive-cache/behavior-stats`);
      const predictiveData = await predictiveResponse.json();
      
      if (predictiveData.success) {
        setPredictiveStats(predictiveData.data);
      }

      // Fetch compression stats
      const compressionResponse = await fetch(`${API_BASE_URL}/cache-compression/stats`);
      const compressionData = await compressionResponse.json();
      
      if (compressionData.success) {
        setCompressionStats(compressionData.data);
      }

      setError(null);
    } catch (err) {
      setError('Cache verileri alınamadı');
      console.error('Cache data fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCacheData();
    
    if (autoRefresh) {
      const interval = setInterval(fetchCacheData, 30000); // 30 saniye
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const handleRefresh = () => {
    fetchCacheData();
  };

  const handleClearCache = async () => {
    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002/api/v1';
      await fetch(`${API_BASE_URL}/cache/clear`, { method: 'POST' });
      fetchCacheData();
    } catch (err) {
      console.error('Cache clear error:', err);
    }
  };

  const getHealthStatus = () => {
    if (!cacheAnalytics) return 'unknown';
    
    const { current } = cacheAnalytics;
    const hitRate = current.overall.overallHitRate;
    const responseTime = current.overall.averageResponseTime;
    
    if (hitRate > 0.8 && responseTime < 100) return 'excellent';
    if (hitRate > 0.6 && responseTime < 200) return 'good';
    if (hitRate > 0.4 && responseTime < 500) return 'fair';
    return 'poor';
  };

  const getHealthColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'success';
      case 'good': return 'primary';
      case 'fair': return 'warning';
      case 'poor': return 'error';
      default: return 'default';
    }
  };

  const getHealthIcon = (status: string) => {
    switch (status) {
      case 'excellent': return <CheckCircle className="h-5 w-5" color="green" />;
      case 'good': return <CheckCircle className="h-5 w-5" color="blue" />;
      case 'fair': return <AlertTriangle className="h-5 w-5" color="orange" />;
      case 'poor': return <AlertTriangle className="h-5 w-5" color="red" />;
      default: return <Clock className="h-5 w-5" color="gray" />;
    }
  };

  if (loading && !cacheAnalytics) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <LinearProgress sx={{ width: '50%' }} />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        <AlertTriangle className="h-4 w-4" />
        <Typography>{error}</Typography>
      </Alert>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Cache Dashboard
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Real-time cache system monitoring and management
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            size="small"
            onClick={() => setAutoRefresh(!autoRefresh)}
            startIcon={autoRefresh ? <Eye /> : <EyeOff />}
          >
            {autoRefresh ? 'Auto Refresh On' : 'Auto Refresh Off'}
          </Button>
          <Button variant="outlined" size="small" onClick={handleRefresh} startIcon={<RefreshCw />}>
            Refresh
          </Button>
          <Button variant="contained" color="error" size="small" onClick={handleClearCache} startIcon={<Trash2 />}>
            Clear Cache
          </Button>
        </Box>
      </Box>

      {/* Health Status */}
      {cacheAnalytics && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              {getHealthIcon(getHealthStatus())}
              <Typography variant="h6" sx={{ ml: 1, flexGrow: 1 }}>
                System Health
              </Typography>
              <Chip 
                label={getHealthStatus().toUpperCase()} 
                color={getHealthColor(getHealthStatus())}
                size="small"
              />
            </Box>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="primary">
                    {(cacheAnalytics.current.overall.overallHitRate * 100).toFixed(1)}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Hit Rate
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="success.main">
                    {cacheAnalytics.current.overall.averageResponseTime.toFixed(0)}ms
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Avg Response Time
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="secondary.main">
                    {cacheAnalytics.current.overall.totalRequests.toLocaleString()}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Requests
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="warning.main">
                    {(cacheAnalytics.current.overall.memoryUsage / 1024 / 1024).toFixed(1)}MB
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Memory Usage
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Main Dashboard */}
      <Box sx={{ mt: 3 }}>
        <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
          <Tab label="Overview" value="overview" />
          <Tab label="Performance" value="performance" />
          <Tab label="Geographic" value="geographic" />
          <Tab label="Predictive" value="predictive" />
          <Tab label="Compression" value="compression" />
          <Tab label="Alerts" value="alerts" />
        </Tabs>

        <Box sx={{ mt: 2 }}>
          {/* Overview Tab */}
          {activeTab === 'overview' && cacheAnalytics && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <HardDrive className="h-5 w-5" />
                      <Typography variant="h6" sx={{ ml: 1 }}>
                        Memory Cache
                      </Typography>
                    </Box>
                    <Box sx={{ spaceY: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2">Items:</Typography>
                        <Typography variant="body2" fontWeight="bold">
                          {cacheAnalytics.current.memoryCache.totalItems}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2">Size:</Typography>
                        <Typography variant="body2" fontWeight="bold">
                          {(cacheAnalytics.current.memoryCache.totalSize / 1024).toFixed(1)}KB
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2">Hit Rate:</Typography>
                        <Typography variant="body2" fontWeight="bold">
                          {(cacheAnalytics.current.memoryCache.hitRate * 100).toFixed(1)}%
                        </Typography>
                      </Box>
                      <LinearProgress 
                        variant="determinate" 
                        value={cacheAnalytics.current.memoryCache.hitRate * 100} 
                        sx={{ mt: 1 }}
                      />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={4}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Database className="h-5 w-5" />
                      <Typography variant="h6" sx={{ ml: 1 }}>
                        Redis Cache
                      </Typography>
                      <Chip 
                        label={cacheAnalytics.current.redisCache.connected ? "Connected" : "Disconnected"} 
                        color={cacheAnalytics.current.redisCache.connected ? "success" : "error"}
                        size="small"
                        sx={{ ml: 1 }}
                      />
                    </Box>
                    <Box sx={{ spaceY: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2">Keys:</Typography>
                        <Typography variant="body2" fontWeight="bold">
                          {cacheAnalytics.current.redisCache.totalKeys}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2">Size:</Typography>
                        <Typography variant="body2" fontWeight="bold">
                          {(cacheAnalytics.current.redisCache.totalSize / 1024).toFixed(1)}KB
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2">Hit Rate:</Typography>
                        <Typography variant="body2" fontWeight="bold">
                          {(cacheAnalytics.current.redisCache.hitRate * 100).toFixed(1)}%
                        </Typography>
                      </Box>
                      <LinearProgress 
                        variant="determinate" 
                        value={cacheAnalytics.current.redisCache.hitRate * 100} 
                        sx={{ mt: 1 }}
                      />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={4}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <BarChart3 className="h-5 w-5" />
                      <Typography variant="h6" sx={{ ml: 1 }}>
                        Search Cache
                      </Typography>
                    </Box>
                    <Box sx={{ spaceY: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2">Searches:</Typography>
                        <Typography variant="body2" fontWeight="bold">
                          {cacheAnalytics.current.searchCache.totalSearches}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2">Hits:</Typography>
                        <Typography variant="body2" fontWeight="bold">
                          {cacheAnalytics.current.searchCache.cacheHits}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2">Hit Rate:</Typography>
                        <Typography variant="body2" fontWeight="bold">
                          {(cacheAnalytics.current.searchCache.hitRate * 100).toFixed(1)}%
                        </Typography>
                      </Box>
                      <LinearProgress 
                        variant="determinate" 
                        value={cacheAnalytics.current.searchCache.hitRate * 100} 
                        sx={{ mt: 1 }}
                      />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}

          {/* Performance Tab */}
          {activeTab === 'performance' && cacheAnalytics && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Performance Metrics
                    </Typography>
                    <Box sx={{ spaceY: 2 }}>
                      <Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="body2">Response Time</Typography>
                          <Typography variant="body2" fontWeight="bold">
                            {cacheAnalytics.current.overall.averageResponseTime.toFixed(0)}ms
                          </Typography>
                        </Box>
                        <LinearProgress 
                          variant="determinate" 
                          value={Math.min(cacheAnalytics.current.overall.averageResponseTime / 10, 100)} 
                        />
                      </Box>
                      <Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="body2">Memory Usage</Typography>
                          <Typography variant="body2" fontWeight="bold">
                            {(cacheAnalytics.current.overall.memoryUsage / 1024 / 1024).toFixed(1)}MB
                          </Typography>
                        </Box>
                        <LinearProgress 
                          variant="determinate" 
                          value={Math.min((cacheAnalytics.current.overall.memoryUsage / 1024 / 1024) / 100, 100)} 
                        />
                      </Box>
                      <Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="body2">Cost Savings</Typography>
                          <Typography variant="body2" fontWeight="bold">
                            {cacheAnalytics.current.overall.costSavings.toFixed(0)}ms
                          </Typography>
                        </Box>
                        <LinearProgress 
                          variant="determinate" 
                          value={Math.min(cacheAnalytics.current.overall.costSavings / 1000, 100)} 
                        />
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      API Cache Performance
                    </Typography>
                    <Box sx={{ spaceY: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2">Requests:</Typography>
                        <Typography variant="body2" fontWeight="bold">
                          {cacheAnalytics.current.apiCache.totalRequests}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2">Hits:</Typography>
                        <Typography variant="body2" fontWeight="bold">
                          {cacheAnalytics.current.apiCache.cacheHits}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2">Misses:</Typography>
                        <Typography variant="body2" fontWeight="bold">
                          {cacheAnalytics.current.apiCache.cacheMisses}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2">Hit Rate:</Typography>
                        <Typography variant="body2" fontWeight="bold">
                          {(cacheAnalytics.current.apiCache.hitRate * 100).toFixed(1)}%
                        </Typography>
                      </Box>
                      <LinearProgress 
                        variant="determinate" 
                        value={cacheAnalytics.current.apiCache.hitRate * 100} 
                      />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}

          {/* Geographic Tab */}
          {activeTab === 'geographic' && geographicStats && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Regions
                    </Typography>
                    <Box sx={{ spaceY: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2">Total:</Typography>
                        <Typography variant="body2" fontWeight="bold">
                          {geographicStats.totalRegions}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2">Active:</Typography>
                        <Typography variant="body2" fontWeight="bold">
                          {geographicStats.activeRegions}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2">Hit Rate:</Typography>
                        <Typography variant="body2" fontWeight="bold">
                          {(geographicStats.cacheHitRate * 100).toFixed(1)}%
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Edge Nodes
                    </Typography>
                    <Box sx={{ spaceY: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2">Total:</Typography>
                        <Typography variant="body2" fontWeight="bold">
                          {geographicStats.totalEdgeNodes}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2">Active:</Typography>
                        <Typography variant="body2" fontWeight="bold">
                          {geographicStats.activeEdgeNodes}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2">Avg Latency:</Typography>
                        <Typography variant="body2" fontWeight="bold">
                          {geographicStats.averageLatency.toFixed(0)}ms
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}

          {/* Predictive Tab */}
          {activeTab === 'predictive' && predictiveStats && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Predictive Analytics
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={3}>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="h4" color="primary">
                            {predictiveStats.totalSessions}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Total Sessions
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={3}>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="h4" color="success.main">
                            {predictiveStats.activeSessions}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Active Sessions
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={3}>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="h4" color="warning.main">
                            {(predictiveStats.averagePredictionScore * 100).toFixed(1)}%
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Avg Score
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={3}>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="h4" color="info.main">
                            {(predictiveStats.modelAccuracy * 100).toFixed(1)}%
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Model Accuracy
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}

          {/* Compression Tab */}
          {activeTab === 'compression' && compressionStats && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Compression Stats
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={3}>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="h4" color="primary">
                            {compressionStats.totalCompressed}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Compressed
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={3}>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="h4" color="success.main">
                            {compressionStats.totalDecompressed}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Decompressed
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={3}>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="h4" color="warning.main">
                            {(compressionStats.totalBytesSaved / 1024).toFixed(1)}KB
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Bytes Saved
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={3}>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="h4" color="info.main">
                            {compressionStats.averageCompressionRatio.toFixed(1)}%
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Avg Ratio
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}

          {/* Alerts Tab */}
          {activeTab === 'alerts' && (
            <Card>
              <CardContent>
                {cacheAnalytics?.alerts && cacheAnalytics.alerts.length > 0 ? (
                  <Box sx={{ spaceY: 2 }}>
                    {cacheAnalytics.alerts.map((alert: any, index: number) => (
                      <Alert key={index} severity={alert.severity === 'critical' ? 'error' : 'warning'}>
                        <AlertTriangle className="h-4 w-4" />
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                          <Typography>{alert.message}</Typography>
                          <Chip 
                            label={alert.severity.toUpperCase()} 
                            color={alert.severity === 'critical' ? 'error' : 'warning'}
                            size="small"
                          />
                        </Box>
                      </Alert>
                    ))}
                  </Box>
                ) : (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <CheckCircle className="h-12 w-12" color="green" style={{ margin: '0 auto 16px' }} />
                    <Typography color="text.secondary">No active alerts</Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default CacheDashboardPage; 