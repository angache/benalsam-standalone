import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiService } from '../services/api';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  LinearProgress,
  Alert,
  AlertTitle,
  Tabs,
  Tab,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import { 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  TrendingUp,
  TrendingDown,
  Zap,
  Users,
  Activity,
  Bug,
  Shield,
  Eye,
  RefreshCw
} from 'lucide-react';
import LiveErrorStream from '../components/Sentry/LiveErrorStream';
import ErrorTrends from '../components/Sentry/ErrorTrends';
import CustomAlertRules from '../components/Sentry/CustomAlertRules';
import StackTraceViewer from '../components/Sentry/StackTraceViewer';
import TeamCollaboration from '../components/Sentry/TeamCollaboration';
import ErrorAnalytics from '../components/Sentry/ErrorAnalytics';

interface SentryError {
  id: string;
  title: string;
  message: string;
  level: 'fatal' | 'error' | 'warning' | 'info' | 'debug';
  timestamp: string;
  user: {
    id: string;
    email?: string;
    username?: string;
  };
  tags: Record<string, string>;
  metadata: {
    filename?: string;
    function?: string;
    lineno?: number;
  };
  count: number;
  lastSeen: string;
  firstSeen: string;
}

interface SentryPerformance {
  transaction: string;
  avgDuration: number;
  p95Duration: number;
  errorRate: number;
  throughput: number;
  timestamp: string;
}

interface SentryMetrics {
  errorRate: number;
  totalErrors: number;
  activeErrors: number;
  resolvedErrors: number;
  performanceScore: number;
  userImpact: number;
  releaseHealth: {
    healthy: number;
    degraded: number;
    unhealthy: number;
  };
}

interface SentryRelease {
  version: string;
  date: string;
  health: 'healthy' | 'degraded' | 'unhealthy';
  errorCount: number;
  userCount: number;
}

const SentryDashboardPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [timeRange, setTimeRange] = useState('24h');

  // Sentry overview metrics
  const { data: metrics, isLoading: metricsLoading, error: metricsError, refetch: refetchMetrics } = useQuery({
    queryKey: ['sentry-metrics', timeRange],
    queryFn: () => apiService.getSentryMetrics(timeRange),
    refetchInterval: 30000, // 30 saniye
    refetchIntervalInBackground: true
  });

  // Recent errors
  const { data: errors, isLoading: errorsLoading, refetch: refetchErrors } = useQuery({
    queryKey: ['sentry-errors', timeRange],
    queryFn: () => apiService.getSentryErrors(timeRange),
    refetchInterval: 60000, // 1 dakika
    refetchIntervalInBackground: true
  });

  // Performance data
  const { data: performance, isLoading: performanceLoading } = useQuery({
    queryKey: ['sentry-performance', timeRange],
    queryFn: () => apiService.getSentryPerformance(timeRange),
    refetchInterval: 60000, // 1 dakika
    refetchIntervalInBackground: true
  });

  // Release health
  const { data: releases, isLoading: releasesLoading } = useQuery({
    queryKey: ['sentry-releases'],
    queryFn: () => apiService.getSentryReleases(),
    refetchInterval: 300000, // 5 dakika
    refetchIntervalInBackground: true
  });

  // Real data - empty for now, will be populated by actual Sentry integration
  const mockTrends: any[] = [];
  const mockAlertRules: any[] = [];

  // Mock data for new components
  const mockStackTrace = {
    frames: [
      {
        filename: 'src/services/authService.ts',
        function: 'validateToken',
        lineno: 45,
        colno: 12,
        in_app: true,
        context_line: 'const token = req.headers.authorization?.split(\' \')[1];',
        pre_context: [
          'export const validateToken = (req: Request, res: Response, next: NextFunction) => {',
          '  try {',
          '    // Extract token from Authorization header'
        ],
        post_context: [
          '    if (!token) {',
          '      throw new Error(\'No token provided\');',
          '    }'
        ]
      },
      {
        filename: 'src/middleware/auth.ts',
        function: 'authenticateToken',
        lineno: 23,
        colno: 8,
        in_app: true,
        context_line: 'return validateToken(req, res, next);',
        pre_context: [
          'export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {',
          '  // Validate JWT token'
        ],
        post_context: [
          '};'
        ]
      }
    ],
    registers: {
      'rax': '0x7fff5fbff8c8',
      'rbx': '0x7fff5fbff8d0',
      'rcx': '0x7fff5fbff8d8'
    },
    has_system_frames: false
  };

  const mockTeamMembers = [
    {
      id: '1',
      name: 'Ali Tuna',
      email: 'ali@benalsam.com',
      avatar: '',
      role: 'admin' as const,
      status: 'online' as const,
      lastActive: new Date().toISOString()
    },
    {
      id: '2',
      name: 'Developer 1',
      email: 'dev1@benalsam.com',
      avatar: '',
      role: 'developer' as const,
      status: 'away' as const,
      lastActive: new Date(Date.now() - 300000).toISOString()
    }
  ];

  const mockComments = [
    {
      id: '1',
      author: mockTeamMembers[0],
      content: 'Bu hata JWT token validation ile ilgili görünüyor. Token süresi dolmuş olabilir.',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      type: 'comment' as const
    },
    {
      id: '2',
      author: mockTeamMembers[1],
      content: 'Token refresh mechanism\'i kontrol edilmeli.',
      timestamp: new Date(Date.now() - 1800000).toISOString(),
      type: 'assignment' as const
    }
  ];

  const mockAssignments = [
    {
      id: '1',
      errorId: 'error-1',
      assignedTo: mockTeamMembers[1],
      assignedBy: mockTeamMembers[0],
      assignedAt: new Date(Date.now() - 7200000).toISOString(),
      status: 'in_progress' as const,
      priority: 'high' as const,
      dueDate: new Date(Date.now() + 86400000).toISOString()
    }
  ];

  const mockAnalyticsData = {
    totalErrors: 0,
    errorRate: 0,
    userImpact: 0,
    avgResolutionTime: 0,
    topErrorTypes: [],
    topAffectedUsers: [],
    topAffectedEndpoints: [],
    browserBreakdown: [],
    deviceBreakdown: [],
    geographicBreakdown: [],
    timeDistribution: []
  };

  const getErrorLevelColor = (level: string) => {
    switch (level) {
      case 'fatal': return 'error';
      case 'error': return 'error';
      case 'warning': return 'warning';
      case 'info': return 'info';
      case 'debug': return 'default';
      default: return 'default';
    }
  };

  const getErrorLevelIcon = (level: string) => {
    switch (level) {
      case 'fatal': return <AlertTriangle size={16} color="#d32f2f" />;
      case 'error': return <Bug size={16} color="#f44336" />;
      case 'warning': return <AlertTriangle size={16} color="#ff9800" />;
      case 'info': return <Eye size={16} color="#2196f3" />;
      case 'debug': return <Activity size={16} color="#757575" />;
      default: return <Activity size={16} color="#757575" />;
    }
  };

  const getHealthStatus = (errorRate: number) => {
    if (errorRate < 1) return { status: 'healthy', color: 'success', icon: <CheckCircle size={16} color="#4caf50" /> };
    if (errorRate < 5) return { status: 'degraded', color: 'warning', icon: <AlertTriangle size={16} color="#ff9800" /> };
    return { status: 'unhealthy', color: 'error', icon: <AlertTriangle size={16} color="#f44336" /> };
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms.toFixed(0)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const formatCount = (count: number) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  if (metricsLoading && errorsLoading && performanceLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <LinearProgress sx={{ width: '200px' }} />
      </Box>
    );
  }

  if (metricsError) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        <AlertTitle>Hata</AlertTitle>
        Sentry verileri yüklenirken hata oluştu: {metricsError.message}
      </Alert>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Sentry Dashboard
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Error tracking ve performance monitoring
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Zaman Aralığı</InputLabel>
            <Select
              value={timeRange}
              label="Zaman Aralığı"
              onChange={(e) => setTimeRange(e.target.value)}
            >
              <MenuItem value="1h">Son 1 saat</MenuItem>
              <MenuItem value="24h">Son 24 saat</MenuItem>
              <MenuItem value="7d">Son 7 gün</MenuItem>
              <MenuItem value="30d">Son 30 gün</MenuItem>
            </Select>
          </FormControl>
          <Button
            variant="outlined"
            onClick={() => refetchMetrics()}
            startIcon={<RefreshCw size={16} />}
          >
            Yenile
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={async () => {
              try {
                await fetch('http://localhost:3002/api/v1/sentry-test/generate-error', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer test-token'
                  },
                  body: JSON.stringify({
                    errorType: 'TestError',
                    message: 'Bu bir test hatasıdır - ' + new Date().toLocaleString()
                  })
                });
                refetchErrors();
              } catch (error) {
                console.error('Test error generation failed:', error);
              }
            }}
            startIcon={<Bug size={16} />}
          >
            Test Hatası Oluştur
          </Button>
        </Box>
      </Box>

      {/* Overview Metrics */}
      {metrics && metrics.data && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">Error Rate</Typography>
                  {getHealthStatus(metrics.data.errorRate).icon}
                </Box>
                <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                  {metrics.data.errorRate.toFixed(2)}%
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {getHealthStatus(metrics.data.errorRate).status}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">Total Errors</Typography>
                  <Bug size={16} color="#757575" />
                </Box>
                <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                  {formatCount(metrics.data.totalErrors)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {metrics.data.activeErrors} aktif
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">Performance Score</Typography>
                  <Zap size={16} color="#757575" />
                </Box>
                <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                  {metrics.data.performanceScore.toFixed(0)}%
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {metrics.data.performanceScore >= 90 ? 'Mükemmel' : metrics.data.performanceScore >= 70 ? 'İyi' : 'Geliştirilmeli'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">User Impact</Typography>
                  <Users size={16} color="#757575" />
                </Box>
                <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                  {formatCount(metrics.data.userImpact)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Etkilenen kullanıcı
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
          <Tab label="Genel Bakış" />
          <Tab label="Hatalar" />
          <Tab label="Performans" />
          <Tab label="Release Health" />
        </Tabs>
      </Box>

      {/* Tab Content */}
      {activeTab === 0 && (
        <Grid container spacing={3}>
          {/* Recent Errors */}
          <Grid item xs={12} lg={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Son Hatalar</Typography>
                {errors && errors.data && errors.data.length > 0 ? (
                  <Box sx={{ spaceY: 2 }}>
                    {errors.data.slice(0, 5).map((error: SentryError) => (
                      <Box key={error.id} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2, border: 1, borderColor: 'divider', borderRadius: 1, mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          {getErrorLevelIcon(error.level)}
                          <Box>
                            <Typography variant="body2" fontWeight="medium">{error.title}</Typography>
                            <Typography variant="caption" color="text.secondary">{error.message}</Typography>
                          </Box>
                        </Box>
                        <Chip label={error.count} size="small" color={getErrorLevelColor(error.level)} />
                      </Box>
                    ))}
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary" textAlign="center" py={2}>
                    Henüz hata yok
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Release Health */}
          <Grid item xs={12} lg={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Release Health</Typography>
                {releases && releases.data && releases.data.length > 0 ? (
                  <Box sx={{ spaceY: 2 }}>
                    {releases.data.slice(0, 5).map((release: SentryRelease) => (
                      <Box key={release.version} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2, border: 1, borderColor: 'divider', borderRadius: 1, mb: 2 }}>
                        <Box>
                          <Typography variant="body2" fontWeight="medium">v{release.version}</Typography>
                          <Typography variant="caption" color="text.secondary">{release.date}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Chip 
                            label={release.health} 
                            size="small" 
                            color={release.health === 'healthy' ? 'success' : release.health === 'degraded' ? 'warning' : 'error'} 
                          />
                          <Typography variant="caption" color="text.secondary">
                            {release.errorCount} hata
                          </Typography>
                        </Box>
                      </Box>
                    ))}
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary" textAlign="center" py={2}>
                    Release verisi yok
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {activeTab === 1 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>Tüm Hatalar</Typography>
            {errors && errors.data && errors.data.length > 0 ? (
              <Box sx={{ spaceY: 2 }}>
                {errors.data.map((error: SentryError) => (
                  <Box key={error.id} sx={{ border: 1, borderColor: 'divider', borderRadius: 2, p: 3, mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                        {getErrorLevelIcon(error.level)}
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="h6">{error.title}</Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>{error.message}</Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mt: 2 }}>
                            <Typography variant="caption" color="text.secondary">
                              İlk görülme: {new Date(error.firstSeen).toLocaleString()}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Son görülme: {new Date(error.lastSeen).toLocaleString()}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Toplam: {error.count} kez
                            </Typography>
                          </Box>
                          {error.user && (
                            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                              Kullanıcı: {error.user.email || error.user.username || error.user.id}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                      <Chip label={error.level.toUpperCase()} size="small" color={getErrorLevelColor(error.level)} />
                    </Box>
                  </Box>
                ))}
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary" textAlign="center" py={4}>
                Henüz hata yok
              </Typography>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 2 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>Performance Metrics</Typography>
            {performance && performance.data && performance.data.length > 0 ? (
              <Box sx={{ spaceY: 2 }}>
                {performance.data.map((perf: SentryPerformance) => (
                  <Box key={perf.transaction} sx={{ border: 1, borderColor: 'divider', borderRadius: 2, p: 3, mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box>
                        <Typography variant="h6">{perf.transaction}</Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mt: 1 }}>
                          <Typography variant="body2" color="text.secondary">
                            Ortalama: {formatDuration(perf.avgDuration)}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            P95: {formatDuration(perf.p95Duration)}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Error Rate: {perf.errorRate.toFixed(2)}%
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Throughput: {formatCount(perf.throughput)}/s
                          </Typography>
                        </Box>
                      </Box>
                      <Chip 
                        label={perf.avgDuration < 1000 ? 'Hızlı' : perf.avgDuration < 3000 ? 'Orta' : 'Yavaş'} 
                        size="small" 
                        color={perf.avgDuration < 1000 ? 'success' : perf.avgDuration < 3000 ? 'warning' : 'error'} 
                      />
                    </Box>
                  </Box>
                ))}
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary" textAlign="center" py={4}>
                Performance verisi yok
              </Typography>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 3 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>Release Health</Typography>
            {releases && releases.data && releases.data.length > 0 ? (
              <Box sx={{ spaceY: 2 }}>
                {releases.data.map((release: SentryRelease) => (
                  <Box key={release.version} sx={{ border: 1, borderColor: 'divider', borderRadius: 2, p: 3, mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box>
                        <Typography variant="h6">v{release.version}</Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                          Deploy: {new Date(release.date).toLocaleString()}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mt: 1 }}>
                          <Typography variant="body2" color="text.secondary">
                            {release.errorCount} hata
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {formatCount(release.userCount)} kullanıcı etkilendi
                          </Typography>
                        </Box>
                      </Box>
                      <Chip 
                        label={release.health} 
                        size="small" 
                        color={release.health === 'healthy' ? 'success' : release.health === 'degraded' ? 'warning' : 'error'} 
                      />
                    </Box>
                  </Box>
                ))}
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary" textAlign="center" py={4}>
                Release verisi yok
              </Typography>
            )}
          </CardContent>
        </Card>
      )}

      {/* NEW COMPONENTS */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* Live Error Stream */}
        <Grid item xs={12} md={6}>
          <LiveErrorStream
            errors={errors?.data || []}
            isConnected={true}
            onRefresh={() => refetchErrors()}
          />
        </Grid>

        {/* Error Trends */}
        <Grid item xs={12} md={6}>
          <ErrorTrends
            trends={mockTrends}
            timeRange={timeRange}
            onTimeRangeChange={setTimeRange}
          />
        </Grid>
      </Grid>

      {/* Custom Alert Rules */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12}>
          <CustomAlertRules
            rules={mockAlertRules}
            onAddRule={(rule) => {
              console.log('Add rule:', rule);
              // TODO: Implement add rule functionality
            }}
            onUpdateRule={(id, rule) => {
              console.log('Update rule:', id, rule);
              // TODO: Implement update rule functionality
            }}
            onDeleteRule={(id) => {
              console.log('Delete rule:', id);
              // TODO: Implement delete rule functionality
            }}
            onToggleRule={(id, enabled) => {
              console.log('Toggle rule:', id, enabled);
              // TODO: Implement toggle rule functionality
            }}
          />
        </Grid>
      </Grid>

      {/* NEW ADVANCED COMPONENTS */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* Stack Trace Viewer */}
        <Grid item xs={12} md={6}>
          <StackTraceViewer
            stackTrace={mockStackTrace}
            errorTitle="JWT Token Validation Error"
            errorMessage="Token validation failed: token expired"
            errorLevel="error"
            timestamp={new Date().toISOString()}
          />
        </Grid>

        {/* Team Collaboration */}
        <Grid item xs={12} md={6}>
          <TeamCollaboration
            errorId="error-1"
            teamMembers={mockTeamMembers}
            comments={mockComments}
            assignments={mockAssignments}
            onAddComment={(content) => {
              console.log('Add comment:', content);
              // TODO: Implement add comment functionality
            }}
            onAssignError={(memberId, priority, dueDate) => {
              console.log('Assign error:', memberId, priority, dueDate);
              // TODO: Implement assign error functionality
            }}
            onUpdateAssignment={(assignmentId, status) => {
              console.log('Update assignment:', assignmentId, status);
              // TODO: Implement update assignment functionality
            }}
            onAddTeamMember={(member) => {
              console.log('Add team member:', member);
              // TODO: Implement add team member functionality
            }}
          />
        </Grid>
      </Grid>

      {/* Error Analytics */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12}>
          <ErrorAnalytics
            data={mockAnalyticsData}
            timeRange={timeRange}
            onTimeRangeChange={setTimeRange}
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default SentryDashboardPage;
