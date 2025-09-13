import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
  AlertTitle,
  CircularProgress,
  IconButton,
  Tooltip,
  Divider
} from '@mui/material';
import {
  CheckCircle,
  Error,
  Warning,
  Refresh,
  TrendingUp,
  AccessTime,
  Memory,
  Storage,
  CloudQueue,
  Storage as Database,
  Settings
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { useMediaQuery } from '@mui/material';

interface ComponentHealth {
  name: string;
  healthy: boolean;
  status: string;
  responseTime: number;
  lastChecked: string;
  details: any;
}

interface HealthResult {
  healthy: boolean;
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  duration: number;
  details: {
    components: Record<string, ComponentHealth>;
    summary: {
      totalComponents: number;
      healthyComponents: number;
      degradedComponents: number;
    };
  };
}

interface HealthTrends {
  uptime: number;
  averageResponseTime: number;
  healthScore: number;
  last24Hours: {
    healthy: number;
    degraded: number;
    unhealthy: number;
  };
}

const HealthDashboardPage: React.FC = () => {
  const [healthData, setHealthData] = useState<HealthResult | null>(null);
  const [trends, setTrends] = useState<HealthTrends | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const fetchHealthData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [healthResponse, trendsResponse] = await Promise.all([
        fetch('http://localhost:3006/health/comprehensive'),
        fetch('http://localhost:3006/health/trends')
      ]);

      if (!healthResponse.ok) {
        throw new Error(`Health check failed: ${healthResponse.status}`);
      }

      const healthData = await healthResponse.json();
      const trendsData = await trendsResponse.json();

      setHealthData(healthData);
      setTrends(trendsData);
      setLastRefresh(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealthData();
    const interval = setInterval(fetchHealthData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (healthy: boolean, status: string) => {
    if (healthy) {
      return <CheckCircle color="success" />;
    } else if (status === 'degraded') {
      return <Warning color="warning" />;
    } else {
      return <Error color="error" />;
    }
  };

  const getStatusColor = (healthy: boolean, status: string) => {
    if (healthy) {
      return 'success';
    } else if (status === 'degraded') {
      return 'warning';
    } else {
      return 'error';
    }
  };

  const getComponentIcon = (name: string) => {
    switch (name) {
      case 'elasticsearch':
        return <Storage />;
      case 'rabbitmq':
        return <CloudQueue />;
      case 'database':
        return <Database />;
      case 'consumer':
        return <Settings />;
      case 'circuitBreakers':
        return <Warning />;
      default:
        return <Settings />;
    }
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  };

  if (loading && !healthData) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error">
        <AlertTitle>Health Check Failed</AlertTitle>
        {error}
        <IconButton onClick={fetchHealthData} size="small" sx={{ ml: 1 }}>
          <Refresh />
        </IconButton>
      </Alert>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          System Health Dashboard
        </Typography>
        <Box display="flex" alignItems="center" gap={2}>
          {lastRefresh && (
            <Typography variant="body2" color="text.secondary">
              Last updated: {lastRefresh.toLocaleTimeString()}
            </Typography>
          )}
          <IconButton onClick={fetchHealthData} disabled={loading}>
            <Refresh />
          </IconButton>
        </Box>
      </Box>

      {/* Overall Status */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" alignItems="center" gap={2} mb={2}>
            {getStatusIcon(healthData?.healthy || false, healthData?.status || '')}
            <Typography variant="h5">
              Overall Status: {healthData?.status?.toUpperCase()}
            </Typography>
            <Chip
              label={healthData?.status?.toUpperCase()}
              color={getStatusColor(healthData?.healthy || false, healthData?.status || '')}
              size="small"
            />
          </Box>
          
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <Box textAlign="center">
                <Typography variant="h6" color="primary">
                  {healthData?.details.summary.healthyComponents || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Healthy Components
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box textAlign="center">
                <Typography variant="h6" color="warning.main">
                  {healthData?.details.summary.degradedComponents || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Degraded Components
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box textAlign="center">
                <Typography variant="h6" color="primary">
                  {healthData?.duration || 0}ms
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Response Time
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box textAlign="center">
                <Typography variant="h6" color="primary">
                  {trends?.healthScore?.toFixed(1) || 0}%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Health Score
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* System Trends */}
      {trends && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              System Trends
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6} md={3}>
                <Box display="flex" alignItems="center" gap={1}>
                  <AccessTime color="primary" />
                  <Box>
                    <Typography variant="h6">{formatUptime(trends.uptime)}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Uptime
                    </Typography>
                  </Box>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box display="flex" alignItems="center" gap={1}>
                  <TrendingUp color="primary" />
                  <Box>
                    <Typography variant="h6">{trends.averageResponseTime}ms</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Avg Response Time
                    </Typography>
                  </Box>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box display="flex" alignItems="center" gap={1}>
                  <CheckCircle color="success" />
                  <Box>
                    <Typography variant="h6">{trends.last24Hours.healthy}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Healthy (24h)
                    </Typography>
                  </Box>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box display="flex" alignItems="center" gap={1}>
                  <Warning color="warning" />
                  <Box>
                    <Typography variant="h6">{trends.last24Hours.degraded + trends.last24Hours.unhealthy}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Issues (24h)
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Component Status */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Component Status
          </Typography>
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Component</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Response Time</TableCell>
                  <TableCell>Last Checked</TableCell>
                  <TableCell>Details</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {healthData?.details.components && Object.entries(healthData.details.components).map(([name, component]) => (
                  <TableRow key={name}>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        {getComponentIcon(name)}
                        <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                          {name}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        {getStatusIcon(component.healthy, component.status)}
                        <Chip
                          label={component.status}
                          color={getStatusColor(component.healthy, component.status)}
                          size="small"
                        />
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {component.responseTime}ms
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {new Date(component.lastChecked).toLocaleTimeString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {JSON.stringify(component.details, null, 2).substring(0, 100)}...
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
  );
};

export default HealthDashboardPage;
