import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  CircularProgress,
  Alert,
  AlertTitle,
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
} from '@mui/material';
import {
  HealthAndSafety as HealthIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Refresh as RefreshIcon,
  Schedule as ClockIcon,
  Api as ApiIcon,
  Storage as DatabaseIcon,
  CloudQueue as CloudIcon,
  Storage as StorageIcon,
  Memory as MemoryIcon,
  TrendingUp as TrendingUpIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
} from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { apiService } from '../services/api';

// ✅ Düzeltilmiş Interfaces
interface HealthStatus {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  uptime: number;
  version: string;
  environment: string;
  services: Record<string, 'healthy' | 'unhealthy' | 'degraded'>;
}

interface ServiceHealth {
  status: 'healthy' | 'unhealthy' | 'degraded';
  responseTime: number;
  lastChecked: string;
  details?: any;
  error?: string;
}

interface DetailedHealthCheck {
  services: Record<string, ServiceHealth>;
}

interface UptimeInfo {
  uptime: number;
  uptimeFormatted: string;
  startTime: string;
  currentTime: string;
  status: string;
  version: string;
  environment: string;
  // ✅ Nested data structure için
  data?: {
    uptimeFormatted: string;
    startTime: string;
    currentTime: string;
  };
}

interface SLAInfo {
  overallSLA: string;
  criticalServices: number;
  healthyCriticalServices: number;
  degradedCriticalServices: number;
  unhealthyCriticalServices: number;
  slaTarget: string;
  slaStatus: 'meeting' | 'below_target';
  lastCheck: string;
  // ✅ Nested data structure için
  data?: {
    overallSLA: string;
    criticalServices: number;
    healthyCriticalServices: number;
    degradedCriticalServices: number;
    unhealthyCriticalServices: number;
    slaTarget: string;
    slaStatus: 'meeting' | 'below_target';
  };
}

// ✅ Düzeltilmiş type definitions
type ChipColor = 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning';

const HealthCheckPage: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [activeTab, setActiveTab] = useState(0);
  const [refetchKey, setRefetchKey] = useState(0);

  // Health check queries
  const { 
    data: healthStatus, 
    isLoading: healthLoading, 
    error: healthError, 
    refetch: refetchHealth 
  } = useQuery({
    queryKey: ['health-status', refetchKey],
    queryFn: () => apiService.getHealthStatus(),
    refetchInterval: 30000,
    staleTime: 10000,
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  const { 
    data: detailedHealth, 
    isLoading: detailedLoading, 
    error: detailedError, 
    refetch: refetchDetailed 
  } = useQuery({
    queryKey: ['detailed-health', refetchKey],
    queryFn: () => apiService.getDetailedHealth(),
    refetchInterval: 30000,
    staleTime: 10000,
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  const { 
    data: uptimeInfo, 
    isLoading: uptimeLoading, 
    error: uptimeError, 
    refetch: refetchUptime 
  } = useQuery({
    queryKey: ['uptime-info', refetchKey],
    queryFn: () => apiService.getUptimeInfo(),
    refetchInterval: 60000,
    staleTime: 30000,
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  const { 
    data: slaInfo, 
    isLoading: slaLoading, 
    error: slaError, 
    refetch: refetchSla 
  } = useQuery({
    queryKey: ['sla-info', refetchKey],
    queryFn: () => apiService.getSLAInfo(),
    refetchInterval: 60000,
    staleTime: 30000,
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  const handleRefresh = async () => {
    setRefetchKey(prev => prev + 1);
    try {
      await Promise.all([
        refetchHealth(),
        refetchDetailed(),
        refetchUptime(),
        refetchSla(),
      ]);
    } catch (error) {
      console.error('Failed to refresh data:', error);
    }
  };

  // ✅ Düzeltilmiş helper functions
  const getStatusColor = (status: string): ChipColor => {
    switch (status) {
      case 'healthy': return 'success';
      case 'degraded': return 'warning';
      case 'unhealthy': return 'error';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircleIcon color="success" />;
      case 'degraded': return <WarningIcon color="warning" />;
      case 'unhealthy': return <ErrorIcon color="error" />;
      default: return <InfoIcon />;
    }
  };

  const formatResponseTime = (ms: number): string => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const getServiceIcon = (serviceName: string) => {
    const name = serviceName.toLowerCase();
    if (name.includes('api')) return <ApiIcon />;
    if (name.includes('database')) return <DatabaseIcon />;
    if (name.includes('redis')) return <CloudIcon />;
    if (name.includes('elasticsearch')) return <StorageIcon />;
    if (name.includes('memory')) return <MemoryIcon />;
    if (name.includes('disk') || name.includes('storage')) return <StorageIcon />;
    return <HealthIcon />;
  };

  // ✅ Loading state
  const isLoading = healthLoading || detailedLoading || uptimeLoading || slaLoading;
  const hasError = healthError || detailedError || uptimeError || slaError;

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
        <Typography variant="body1" sx={{ ml: 2 }}>
          Loading health data...
        </Typography>
      </Box>
    );
  }

  if (hasError) {
    return (
      <Box p={3}>
        <Alert 
          severity="error" 
          action={
            <Button color="inherit" size="small" onClick={handleRefresh}>
              Retry
            </Button>
          }
        >
          Failed to load health check data. 
          {healthError && <div>Health: {healthError.message}</div>}
          {detailedError && <div>Details: {detailedError.message}</div>}
          {uptimeError && <div>Uptime: {uptimeError.message}</div>}
          {slaError && <div>SLA: {slaError.message}</div>}
        </Alert>
      </Box>
    );
  }

  // ✅ Safe data access
  const healthData = healthStatus;
  const detailedData = detailedHealth;
  const uptimeData = uptimeInfo;
  const slaData = slaInfo;

  // Prepare chart data with null checks
  const healthChartData = healthData?.services ? [
    { 
      name: 'Healthy', 
      value: Object.values(healthData.services).filter(s => s === 'healthy').length, 
      color: theme.palette.success.main 
    },
    { 
      name: 'Unhealthy', 
      value: Object.values(healthData.services).filter(s => s !== 'healthy').length, 
      color: theme.palette.error.main 
    }
  ] : [];

  // ✅ Safe SLA chart data access
  const slaChartData = slaData?.data ? [
    { name: 'Healthy', value: slaData.data.healthyCriticalServices || 0, color: theme.palette.success.main },
    { name: 'Degraded', value: slaData.data.degradedCriticalServices || 0, color: theme.palette.warning.main },
    { name: 'Unhealthy', value: slaData.data.unhealthyCriticalServices || 0, color: theme.palette.error.main }
  ] : [];

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1" gutterBottom>
          <HealthIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          System Health Dashboard
        </Typography>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={handleRefresh}
          disabled={isLoading}
        >
          Refresh
        </Button>
      </Box>

      {/* Overall Status */}
      {healthData && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              {getStatusIcon(healthData.status)}
              <Typography variant="h6" sx={{ ml: 1 }}>
                Overall System Status: {healthData.status.toUpperCase()}
              </Typography>
            </Box>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <Box textAlign="center">
                  <Typography variant="h4" color="success.main">
                    {healthData.services ? Object.values(healthData.services).filter(s => s === 'healthy').length : 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Healthy Services
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box textAlign="center">
                  <Typography variant="h4" color="error.main">
                    {healthData.services ? Object.values(healthData.services).filter(s => s !== 'healthy').length : 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Unhealthy Services
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box textAlign="center">
                  <Typography variant="h4">
                    {healthData.services ? Object.keys(healthData.services).length : 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Services
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box textAlign="center">
                  <Typography variant="h4">
                    {Math.round((healthData.uptime || 0) / 3600)}h
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Uptime
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(e, newValue) => setActiveTab(newValue)}
          variant={isMobile ? "scrollable" : "fullWidth"}
          scrollButtons={isMobile ? "auto" : false}
        >
          <Tab label="Genel Bakış" icon={<HealthIcon />} />
          <Tab label="Servis Detayları" icon={<InfoIcon />} />
          <Tab label="Uptime" icon={<ClockIcon />} />
          <Tab label="SLA" icon={<TrendingUpIcon />} />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      {activeTab === 0 && (
        <Grid container spacing={3}>
          {/* Health Chart */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Service Health Distribution
                </Typography>
                {healthChartData.length > 0 ? (
                  <Box sx={{ height: 300 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={healthChartData}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          dataKey="value"
                          label={({ name, value }) => `${name}: ${value}`}
                        >
                          {healthChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <RechartsTooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No chart data available
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* System Info */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  System Information
                </Typography>
                {healthData ? (
                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">Version:</Typography>
                      <Typography variant="body2" fontWeight="bold">{healthData.version}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">Environment:</Typography>
                      <Typography variant="body2" fontWeight="bold">{healthData.environment}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">Last Check:</Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {new Date(healthData.timestamp).toLocaleString()}
                      </Typography>
                    </Box>
                    {uptimeData && (
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2">Uptime:</Typography>
                        <Typography variant="body2" fontWeight="bold">
                          {uptimeData.data?.uptimeFormatted || uptimeData.uptimeFormatted || 'N/A'}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No system information available
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Service Details Tab */}
      {activeTab === 1 && (
        <>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Detailed Service Health
              </Typography>
              {detailedData?.services ? (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Service</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Response Time</TableCell>
                        <TableCell>Critical</TableCell>
                        <TableCell>Last Check</TableCell>
                        <TableCell>Details</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {Object.entries(detailedData.services).map(([serviceName, service], index) => (
                        <TableRow key={`${serviceName}-${index}`}>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              {getServiceIcon(serviceName)}
                              <Box sx={{ ml: 1 }}>
                                <Typography variant="body2" fontWeight="bold">
                                  {serviceName.charAt(0).toUpperCase() + serviceName.slice(1)} Health
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {serviceName} service monitoring
                                </Typography>
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Chip
                              icon={getStatusIcon(service.status)}
                              label={service.status}
                              color={getStatusColor(service.status)}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {formatResponseTime(service.responseTime)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label="Critical"
                              color="error"
                              size="small"
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {service.lastChecked ? new Date(service.lastChecked).toLocaleString() : 'Just now'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Tooltip title={service.error || 'Service is healthy'}>
                              <IconButton size="small" color={service.status === 'healthy' ? 'success' : 'error'}>
                                {service.status === 'healthy' ? <CheckCircleIcon /> : <ErrorIcon />}
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Alert severity="info">
                  No detailed service data available
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Health Analysis & Recommendations */}
          {detailedData?.services && (
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  <InfoIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Health Analysis & Recommendations
                </Typography>
                
                <Box>
                  {(() => {
                    const services = detailedData.services;
                    const criticalServices = Object.entries(services).filter(([_, service]) => 
                      service.status !== 'healthy' || service.responseTime > 1000
                    );
                    const healthyServices = Object.entries(services).filter(([_, service]) => 
                      service.status === 'healthy' && service.responseTime <= 1000
                    );
                    const slowServices = Object.entries(services).filter(([_, service]) => 
                      service.status === 'healthy' && service.responseTime > 500
                    );

                    return (
                      <Box>
                        {/* Overall Health Score */}
                        <Box sx={{ mb: 3, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
                          <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                            Overall Health Score
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <LinearProgress
                              variant="determinate"
                              value={(healthyServices.length / Object.keys(services).length) * 100}
                              color={criticalServices.length > 0 ? 'error' : slowServices.length > 0 ? 'warning' : 'success'}
                              sx={{ flexGrow: 1, mr: 2, height: 8, borderRadius: 4 }}
                            />
                            <Typography variant="h6" color={criticalServices.length > 0 ? 'error.main' : slowServices.length > 0 ? 'warning.main' : 'success.main'}>
                              {Math.round((healthyServices.length / Object.keys(services).length) * 100)}%
                            </Typography>
                          </Box>
                          <Typography variant="body2" color="text.secondary">
                            {criticalServices.length > 0 
                              ? `${criticalServices.length} critical issue(s) detected`
                              : slowServices.length > 0 
                              ? `${slowServices.length} service(s) showing performance degradation`
                              : 'All services are performing optimally'
                            }
                          </Typography>
                        </Box>

                        {/* Critical Issues */}
                        {criticalServices.length > 0 && (
                          <Box sx={{ mb: 3 }}>
                            <Typography variant="subtitle1" color="error" fontWeight="bold" gutterBottom>
                              <ErrorIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                              Critical Issues ({criticalServices.length})
                            </Typography>
                            {criticalServices.map(([serviceName, service], index) => (
                              <Alert key={index} severity="error" sx={{ mb: 1 }}>
                                <AlertTitle>
                                  {serviceName.charAt(0).toUpperCase() + serviceName.slice(1)} Service
                                </AlertTitle>
                                <Typography variant="body2" gutterBottom>
                                  <strong>Status:</strong> {service.status} | <strong>Response Time:</strong> {formatResponseTime(service.responseTime)}
                                </Typography>
                                <Typography variant="body2" gutterBottom>
                                  <strong>Issue:</strong> {service.status !== 'healthy' 
                                    ? 'Service is not responding properly'
                                    : 'Response time is too high (>1000ms)'
                                  }
                                </Typography>
                                <Typography variant="body2">
                                  <strong>Recommendation:</strong> {
                                    serviceName === 'database' 
                                      ? 'Check database connection pool, optimize queries, verify disk space'
                                      : serviceName === 'redis'
                                      ? 'Check Redis memory usage, connection limits, network connectivity'
                                      : serviceName === 'elasticsearch'
                                      ? 'Check cluster health, shard allocation, disk space, JVM heap'
                                      : 'Restart service, check logs, verify configuration'
                                  }
                                </Typography>
                              </Alert>
                            ))}
                          </Box>
                        )}

                        {/* Performance Warnings */}
                        {slowServices.length > 0 && (
                          <Box sx={{ mb: 3 }}>
                            <Typography variant="subtitle1" color="warning.main" fontWeight="bold" gutterBottom>
                              <WarningIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                              Performance Warnings ({slowServices.length})
                            </Typography>
                            {slowServices.map(([serviceName, service], index) => (
                              <Alert key={index} severity="warning" sx={{ mb: 1 }}>
                                <AlertTitle>
                                  {serviceName.charAt(0).toUpperCase() + serviceName.slice(1)} Service
                                </AlertTitle>
                                <Typography variant="body2" gutterBottom>
                                  <strong>Response Time:</strong> {formatResponseTime(service.responseTime)} (Above 500ms threshold)
                                </Typography>
                                <Typography variant="body2">
                                  <strong>Recommendation:</strong> {
                                    serviceName === 'database'
                                      ? 'Consider query optimization, increase connection pool, add database indexes'
                                      : serviceName === 'redis'
                                      ? 'Check for memory pressure, optimize data structures, consider Redis clustering'
                                      : serviceName === 'elasticsearch'
                                      ? 'Optimize search queries, check cluster load, consider shard rebalancing'
                                      : 'Monitor resource usage, check for bottlenecks'
                                  }
                                </Typography>
                              </Alert>
                            ))}
                          </Box>
                        )}

                        {/* Healthy Services */}
                        {healthyServices.length > 0 && (
                          <Box>
                            <Typography variant="subtitle1" color="success.main" fontWeight="bold" gutterBottom>
                              <CheckCircleIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                              Healthy Services ({healthyServices.length})
                            </Typography>
                            <Grid container spacing={2}>
                              {healthyServices.map(([serviceName, service], index) => (
                                <Grid item xs={12} sm={6} md={4} key={index}>
                                  <Alert severity="success">
                                    <Typography variant="body2" fontWeight="bold">
                                      {serviceName.charAt(0).toUpperCase() + serviceName.slice(1)}
                                    </Typography>
                                    <Typography variant="body2">
                                      Response Time: {formatResponseTime(service.responseTime)}
                                    </Typography>
                                  </Alert>
                                </Grid>
                              ))}
                            </Grid>
                          </Box>
                        )}
                      </Box>
                    );
                  })()}
                </Box>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Uptime Tab */}
      {activeTab === 2 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Uptime Information
                </Typography>
                {uptimeData ? (
                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                      <Typography variant="body1">Current Uptime:</Typography>
                      <Typography variant="h6" color="primary">
                        {uptimeData.data?.uptimeFormatted || uptimeData.uptimeFormatted || 'N/A'}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                      <Typography variant="body2">Start Time:</Typography>
                      <Typography variant="body2">
                        {(uptimeData.data?.startTime || uptimeData.startTime) ? 
                          new Date(uptimeData.data?.startTime || uptimeData.startTime).toLocaleString() : 
                          'N/A'
                        }
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                      <Typography variant="body2">Current Time:</Typography>
                      <Typography variant="body2">
                        {(uptimeData.data?.currentTime || uptimeData.currentTime) ? 
                          new Date(uptimeData.data?.currentTime || uptimeData.currentTime).toLocaleString() : 
                          'N/A'
                        }
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                      <Typography variant="body2">Status:</Typography>
                      <Chip
                        icon={getStatusIcon(uptimeData.status)}
                        label={uptimeData.status}
                        color={getStatusColor(uptimeData.status)}
                        size="small"
                      />
                    </Box>
                  </Box>
                ) : (
                  <Alert severity="info">
                    No uptime information available
                  </Alert>
                )}
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Uptime Progress
                </Typography>
                <Box sx={{ textAlign: 'center', py: 3 }}>
                  <Typography variant="h3" color="primary" gutterBottom>
                    {uptimeData?.data?.uptimeFormatted || uptimeData?.uptimeFormatted || 'N/A'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    System has been running continuously
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* SLA Tab */}
      {activeTab === 3 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  SLA Overview
                </Typography>
                {slaData?.data ? (
                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="h4" color="primary">
                        {slaData.data.overallSLA || 'N/A'}
                      </Typography>
                      <Chip
                        label={slaData.data.slaStatus === 'meeting' ? 'Meeting Target' : 'Below Target'}
                        color={slaData.data.slaStatus === 'meeting' ? 'success' : 'error'}
                        size="small"
                      />
                    </Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Target: {slaData.data.slaTarget || 'N/A'}
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={slaData.data.overallSLA ? parseFloat(slaData.data.overallSLA) : 0}
                      color={slaData.data.slaStatus === 'meeting' ? 'success' : 'error'}
                      sx={{ height: 8, borderRadius: 4 }}
                    />
                  </Box>
                ) : (
                  <Alert severity="info">
                    No SLA information available
                  </Alert>
                )}
              </CardContent>
            </Card>
          </Grid>
          
          {slaChartData.length > 0 && (
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Critical Services Status
                  </Typography>
                  <Box sx={{ height: 300 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={slaChartData}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          dataKey="value"
                          label={({ name, value }) => `${name}: ${value}`}
                        >
                          {slaChartData.map((entry, index) => (
                            <Cell key={`sla-cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <RechartsTooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          )}
          
          {slaData?.data && (
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    SLA Details
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6} sm={3}>
                      <Box textAlign="center">
                        <Typography variant="h4" color="success.main">
                          {slaData.data.healthyCriticalServices || 0}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Healthy Critical
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Box textAlign="center">
                        <Typography variant="h4" color="warning.main">
                          {slaData.data.degradedCriticalServices || 0}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Degraded Critical
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Box textAlign="center">
                        <Typography variant="h4" color="error.main">
                          {slaData.data.unhealthyCriticalServices || 0}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Unhealthy Critical
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Box textAlign="center">
                        <Typography variant="h4">
                          {slaData.data.criticalServices || 0}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Total Critical
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>
      )}
    </Box>
  );
};

export default HealthCheckPage;
