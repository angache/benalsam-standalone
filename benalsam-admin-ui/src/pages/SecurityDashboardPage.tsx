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
  Button,
  IconButton,
  Tooltip,
  Badge,
} from '@mui/material';
import {
  Security as SecurityIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Refresh as RefreshIcon,
  Delete as DeleteIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Visibility as VisibilityIcon,
  Block as BlockIcon,
  Timeline as TimelineIcon,
  Assessment as AssessmentIcon,
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { apiService } from '../services/api';

interface SecurityStats {
  totalEvents: number;
  eventsLast24Hours: number;
  failedLogins: number;
  suspiciousActivity: number;
  rateLimitExceeded: number;
  validationFailures: number;
  topSuspiciousIPs: Array<{ ip: string; count: number }>;
  recentEvents: Array<{
    type: string;
    ip: string;
    endpoint: string;
    method: string;
    timestamp: string;
    details: any;
  }>;
}

interface SecuritySummary {
  totalEvents: number;
  eventsLast24Hours: number;
  failedLogins: number;
  suspiciousActivity: number;
  rateLimitExceeded: number;
  validationFailures: number;
  securityScore: number;
  topThreats: string[];
  recommendations: string[];
}

const SecurityDashboardPage: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [refetchKey, setRefetchKey] = useState(0);

  // Security data queries
  const { 
    data: securityStats, 
    isLoading: statsLoading, 
    error: statsError, 
    refetch: refetchStats 
  } = useQuery({
    queryKey: ['security-stats', refetchKey],
    queryFn: () => apiService.getSecurityStats(),
    refetchInterval: 30000, // 30 seconds
    staleTime: 10000,
  });

  const { 
    data: securitySummary, 
    isLoading: summaryLoading, 
    error: summaryError, 
    refetch: refetchSummary 
  } = useQuery({
    queryKey: ['security-summary', refetchKey],
    queryFn: () => apiService.getSecuritySummary(),
    refetchInterval: 60000, // 1 minute
    staleTime: 30000,
  });

  const { 
    data: securityEvents, 
    isLoading: eventsLoading, 
    error: eventsError, 
    refetch: refetchEvents 
  } = useQuery({
    queryKey: ['security-events', refetchKey],
    queryFn: () => apiService.getSecurityEvents(),
    refetchInterval: 15000, // 15 seconds
    staleTime: 5000,
  });

  const handleRefresh = async () => {
    setRefetchKey(prev => prev + 1);
    try {
      await Promise.all([
        refetchStats(),
        refetchSummary(),
        refetchEvents(),
      ]);
    } catch (error) {
      console.error('Failed to refresh security data:', error);
    }
  };

  const handleClearOldEvents = async () => {
    try {
      await apiService.clearOldSecurityEvents();
      handleRefresh();
    } catch (error) {
      console.error('Failed to clear old events:', error);
    }
  };

  // Helper functions
  const getSecurityScoreColor = (score: number) => {
    if (score >= 8) return 'success';
    if (score >= 6) return 'warning';
    return 'error';
  };

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'failed_login': return 'error';
      case 'suspicious_activity': return 'warning';
      case 'rate_limit_exceeded': return 'info';
      case 'validation_failed': return 'warning';
      default: return 'default';
    }
  };

  const getEventTypeIcon = (type: string) => {
    switch (type) {
      case 'failed_login': return <ErrorIcon />;
      case 'suspicious_activity': return <WarningIcon />;
      case 'rate_limit_exceeded': return <BlockIcon />;
      case 'validation_failed': return <VisibilityIcon />;
      default: return <SecurityIcon />;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  // Loading state
  const isLoading = statsLoading || summaryLoading || eventsLoading;
  const hasError = statsError || summaryError || eventsError;

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
        <Typography variant="body1" sx={{ ml: 2 }}>
          Loading security data...
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
          Failed to load security data. 
          {statsError && <div>Stats: {statsError.message}</div>}
          {summaryError && <div>Summary: {summaryError.message}</div>}
          {eventsError && <div>Events: {eventsError.message}</div>}
        </Alert>
      </Box>
    );
  }

  const stats = securityStats?.data || {};
  const summary = securitySummary?.data || {};
  const events = securityEvents?.data?.events || [];

  // Prepare chart data
  const securityScoreData = [
    { name: 'Security Score', value: summary.securityScore || 0, color: theme.palette[getSecurityScoreColor(summary.securityScore || 0)].main }
  ];

  const eventTypeData = [
    { name: 'Failed Logins', value: stats.failedLogins || 0, color: theme.palette.error.main },
    { name: 'Suspicious Activity', value: stats.suspiciousActivity || 0, color: theme.palette.warning.main },
    { name: 'Rate Limit Exceeded', value: stats.rateLimitExceeded || 0, color: theme.palette.info.main },
    { name: 'Validation Failures', value: stats.validationFailures || 0, color: theme.palette.warning.main },
  ];

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1" gutterBottom>
          <SecurityIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          Security Dashboard
        </Typography>
        <Box>
          <Button
            variant="outlined"
            startIcon={<DeleteIcon />}
            onClick={handleClearOldEvents}
            sx={{ mr: 1 }}
          >
            Clear Old Events
          </Button>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={handleRefresh}
          >
            Refresh
          </Button>
        </Box>
      </Box>

      {/* Security Score */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <AssessmentIcon sx={{ mr: 1 }} />
            <Typography variant="h6">
              Security Score
            </Typography>
          </Box>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h2" color={getSecurityScoreColor(summary.securityScore || 0)}>
                  {summary.securityScore || 0}/10
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Overall Security Rating
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={(summary.securityScore || 0) * 10}
                  color={getSecurityScoreColor(summary.securityScore || 0)}
                  sx={{ mt: 2, height: 8, borderRadius: 4 }}
                />
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box sx={{ height: 200 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={securityScoreData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      dataKey="value"
                      label={({ value }) => `${value}/10`}
                    >
                      {securityScoreData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Security Metrics */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <ErrorIcon color="error" sx={{ mr: 1 }} />
                <Box>
                  <Typography variant="h4" color="error">
                    {stats.failedLogins || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Failed Logins
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <WarningIcon color="warning" sx={{ mr: 1 }} />
                <Box>
                  <Typography variant="h4" color="warning.main">
                    {stats.suspiciousActivity || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Suspicious Activity
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <BlockIcon color="info" sx={{ mr: 1 }} />
                <Box>
                  <Typography variant="h4" color="info.main">
                    {stats.rateLimitExceeded || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Rate Limit Violations
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <VisibilityIcon color="warning" sx={{ mr: 1 }} />
                <Box>
                  <Typography variant="h4" color="warning.main">
                    {stats.validationFailures || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Validation Failures
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Threats and Recommendations */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <WarningIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Top Threats
              </Typography>
              {summary.topThreats && summary.topThreats.length > 0 ? (
                <Box>
                  {summary.topThreats.map((threat, index) => (
                    <Alert key={index} severity="warning" sx={{ mb: 1 }}>
                      {threat}
                    </Alert>
                  ))}
                </Box>
              ) : (
                <Alert severity="success">
                  No active threats detected
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <CheckCircleIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Recommendations
              </Typography>
              {summary.recommendations && summary.recommendations.length > 0 ? (
                <Box>
                  {summary.recommendations.map((recommendation, index) => (
                    <Alert key={index} severity="info" sx={{ mb: 1 }}>
                      {recommendation}
                    </Alert>
                  ))}
                </Box>
              ) : (
                <Alert severity="success">
                  No recommendations at this time
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Recent Security Events */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            <TimelineIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            Recent Security Events
          </Typography>
          {events.length > 0 ? (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Type</TableCell>
                    <TableCell>IP Address</TableCell>
                    <TableCell>Endpoint</TableCell>
                    <TableCell>Method</TableCell>
                    <TableCell>Timestamp</TableCell>
                    <TableCell>Details</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {events.map((event, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Chip
                          icon={getEventTypeIcon(event.type)}
                          label={event.type.replace('_', ' ')}
                          color={getEventTypeColor(event.type)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontFamily="monospace">
                          {event.ip}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {event.endpoint}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={event.method}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {formatTimestamp(event.timestamp)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Tooltip title={JSON.stringify(event.details, null, 2)}>
                          <IconButton size="small">
                            <VisibilityIcon />
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
              No recent security events
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Suspicious IPs */}
      {stats.topSuspiciousIPs && stats.topSuspiciousIPs.length > 0 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              <BlockIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              Top Suspicious IPs
            </Typography>
            <Grid container spacing={2}>
              {stats.topSuspiciousIPs.map((ipData, index) => (
                <Grid item xs={12} sm={6} md={4} key={index}>
                  <Alert severity="error">
                    <Typography variant="body2" fontFamily="monospace" fontWeight="bold">
                      {ipData.ip}
                    </Typography>
                    <Typography variant="body2">
                      {ipData.count} events
                    </Typography>
                  </Alert>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default SecurityDashboardPage;
