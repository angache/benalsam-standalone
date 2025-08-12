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
  Accordion,
  AccordionSummary,
  AccordionDetails
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
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  ExpandMore as ExpandMoreIcon,
  Savings as SavingsIcon,
  Analytics as AnalyticsIcon
} from '@mui/icons-material';
import { Bug as BugIcon } from 'lucide-react';
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

// Interfaces
interface HybridOverview {
  timestamp: string;
  timeRange: string;
  summary: {
    totalErrors: number;
    criticalErrors: number;
    highErrors: number;
    mediumErrors: number;
    lowErrors: number;
    sentryErrors: number;
    localErrors: number;
  };
  systemHealth: {
    overall: string;
    sentry: string;
    local: string;
    database: string;
    redis: string;
    elasticsearch: string;
  };
  performance: {
    avgResponseTime: number;
    errorRate: number;
    throughput: number;
    uptime: number;
  };
  alerts: {
    active: number;
    critical: number;
    warning: number;
    info: number;
  };
}

interface ErrorBreakdown {
  timestamp: string;
  timeRange: string;
  bySeverity: {
    critical: {
      count: number;
      percentage: number;
      sentToSentry: number;
      sentToLocal: number;
    };
    high: {
      count: number;
      percentage: number;
      sentToSentry: number;
      sentToLocal: number;
    };
    medium: {
      count: number;
      percentage: number;
      sentToSentry: number;
      sentToLocal: number;
    };
    low: {
      count: number;
      percentage: number;
      sentToSentry: number;
      sentToLocal: number;
    };
  };
  byCategory: Record<string, {
    count: number;
    severity: string;
    destination: string;
  }>;
}

interface CostAnalysis {
  timestamp: string;
  timeRange: string;
  current: {
    sentryErrors: number;
    localErrors: number;
    totalErrors: number;
    sentryCost: number;
    localCost: number;
    totalCost: number;
  };
  optimization: {
    potentialSentryErrors: number;
    potentialLocalErrors: number;
    potentialSentryCost: number;
    potentialLocalCost: number;
    potentialTotalCost: number;
    savings: number;
    savingsPercentage: number;
  };
  recommendations: string[];
}

interface SystemComparison {
  timestamp: string;
  timeRange: string;
  sentry: {
    features: string[];
    pros: string[];
    cons: string[];
    cost: string;
    bestFor: string;
  };
  local: {
    features: string[];
    pros: string[];
    cons: string[];
    cost: string;
    bestFor: string;
  };
  hybrid: {
    features: string[];
    pros: string[];
    cons: string[];
    cost: string;
    bestFor: string;
  };
}

const HybridMonitoringPage: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [activeTab, setActiveTab] = useState(0);
  const [timeRange, setTimeRange] = useState('24h');

  // Fetch hybrid monitoring data
  const { data: overview, isLoading: overviewLoading, error: overviewError, refetch: refetchOverview } = useQuery({
    queryKey: ['hybrid-overview', timeRange],
    queryFn: () => apiService.getHybridOverview(timeRange),
    refetchInterval: 30000 // 30 seconds
  });

  const { data: breakdown, isLoading: breakdownLoading } = useQuery({
    queryKey: ['hybrid-breakdown', timeRange],
    queryFn: () => apiService.getHybridBreakdown(timeRange),
    refetchInterval: 30000
  });

  const { data: costAnalysis, isLoading: costLoading } = useQuery({
    queryKey: ['hybrid-cost-analysis', timeRange],
    queryFn: () => apiService.getHybridCostAnalysis(timeRange),
    refetchInterval: 60000 // 1 minute
  });

  const { data: comparison, isLoading: comparisonLoading } = useQuery({
    queryKey: ['hybrid-comparison', timeRange],
    queryFn: () => apiService.getHybridComparison(timeRange),
    refetchInterval: 300000 // 5 minutes
  });

  // Loading state
  if (overviewLoading && breakdownLoading && costLoading && comparisonLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  // Error state
  if (overviewError) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        Hibrit monitoring verileri yüklenirken hata oluştu: {overviewError.message}
      </Alert>
    );
  }

  const overviewData = overview?.data as HybridOverview;
  const breakdownData = breakdown?.data as ErrorBreakdown;
  const costData = costAnalysis?.data as CostAnalysis;
  const comparisonData = comparison?.data as SystemComparison;

  // Helper functions
  const getHealthStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'success';
      case 'degraded': return 'warning';
      case 'unhealthy': return 'error';
      default: return 'default';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'error';
      case 'high': return 'warning';
      case 'medium': return 'info';
      case 'low': return 'default';
      default: return 'default';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  // Chart data for error breakdown
  const errorBreakdownChartData = breakdownData ? [
    { name: 'Critical', value: breakdownData.bySeverity.critical.count, color: '#f44336' },
    { name: 'High', value: breakdownData.bySeverity.high.count, color: '#ff9800' },
    { name: 'Medium', value: breakdownData.bySeverity.medium.count, color: '#2196f3' },
    { name: 'Low', value: breakdownData.bySeverity.low.count, color: '#9e9e9e' }
  ] : [];

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          <BarChartIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          Hibrit Monitoring Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Sentry ve mevcut sistem entegrasyonu ile optimize edilmiş monitoring
        </Typography>
      </Box>

      {/* Time Range Selector */}
      <Box sx={{ mb: 3 }}>
        <Button
          variant={timeRange === '1h' ? 'contained' : 'outlined'}
          size="small"
          onClick={() => setTimeRange('1h')}
          sx={{ mr: 1 }}
        >
          1 Saat
        </Button>
        <Button
          variant={timeRange === '24h' ? 'contained' : 'outlined'}
          size="small"
          onClick={() => setTimeRange('24h')}
          sx={{ mr: 1 }}
        >
          24 Saat
        </Button>
        <Button
          variant={timeRange === '7d' ? 'contained' : 'outlined'}
          size="small"
          onClick={() => setTimeRange('7d')}
          sx={{ mr: 1 }}
        >
          7 Gün
        </Button>
        <Button
          variant={timeRange === '30d' ? 'contained' : 'outlined'}
          size="small"
          onClick={() => setTimeRange('30d')}
        >
          30 Gün
        </Button>
        <IconButton onClick={() => refetchOverview()} sx={{ ml: 2 }}>
          <RefreshIcon />
        </IconButton>
      </Box>

      {/* Tabs */}
      <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)} sx={{ mb: 3 }}>
        <Tab label="Genel Bakış" icon={<AnalyticsIcon />} />
        <Tab label="Error Analizi" icon={<BugIcon />} />
        <Tab label="Maliyet Analizi" icon={<SavingsIcon />} />
        <Tab label="Sistem Karşılaştırması" icon={<BarChartIcon />} />
      </Tabs>

      {/* Tab Content */}
      {activeTab === 0 && (
        <Grid container spacing={3}>
          {/* Summary Cards */}
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Toplam Error
                </Typography>
                <Typography variant="h4">
                  {overviewData?.summary.totalErrors || 0}
                </Typography>
                <Box sx={{ mt: 1 }}>
                  <Chip 
                    label={`Sentry: ${overviewData?.summary.sentryErrors || 0}`} 
                    size="small" 
                    color="primary" 
                    sx={{ mr: 0.5 }} 
                  />
                  <Chip 
                    label={`Local: ${overviewData?.summary.localErrors || 0}`} 
                    size="small" 
                    color="secondary" 
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Sistem Sağlığı
                </Typography>
                <Typography variant="h4" color={getHealthStatusColor(overviewData?.systemHealth.overall || 'unknown')}>
                  {overviewData?.systemHealth.overall || 'unknown'}
                </Typography>
                <Box sx={{ mt: 1 }}>
                  <Chip 
                    label={`Sentry: ${overviewData?.systemHealth.sentry || 'unknown'}`} 
                    size="small" 
                    color={getHealthStatusColor(overviewData?.systemHealth.sentry || 'unknown')} 
                    sx={{ mr: 0.5 }} 
                  />
                  <Chip 
                    label={`Local: ${overviewData?.systemHealth.local || 'unknown'}`} 
                    size="small" 
                    color={getHealthStatusColor(overviewData?.systemHealth.local || 'unknown')} 
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Performans
                </Typography>
                <Typography variant="h4">
                  {overviewData?.performance.avgResponseTime || 0}ms
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Error Rate: {overviewData?.performance.errorRate || 0}%
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Uptime: {overviewData?.performance.uptime || 0}%
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Aktif Alert'ler
                </Typography>
                <Typography variant="h4">
                  {overviewData?.alerts.active || 0}
                </Typography>
                <Box sx={{ mt: 1 }}>
                  <Chip 
                    label={`Critical: ${overviewData?.alerts.critical || 0}`} 
                    size="small" 
                    color="error" 
                    sx={{ mr: 0.5 }} 
                  />
                  <Chip 
                    label={`Warning: ${overviewData?.alerts.warning || 0}`} 
                    size="small" 
                    color="warning" 
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Error Severity Breakdown */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Error Severity Dağılımı
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={errorBreakdownChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {errorBreakdownChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* System Health Status */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Sistem Sağlığı Durumu
                </Typography>
                <Box sx={{ mt: 2 }}>
                  {overviewData?.systemHealth && Object.entries(overviewData.systemHealth).map(([service, status]) => (
                    <Box key={service} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                        {service}
                      </Typography>
                      <Chip 
                        label={status} 
                        size="small" 
                        color={getHealthStatusColor(status)}
                        icon={status === 'healthy' ? <CheckCircleIcon /> : status === 'degraded' ? <WarningIcon /> : <ErrorIcon />}
                      />
                    </Box>
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {activeTab === 1 && (
        <Grid container spacing={3}>
          {/* Error Breakdown Table */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Error Kategorileri
                </Typography>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Kategori</TableCell>
                        <TableCell>Sayı</TableCell>
                        <TableCell>Severity</TableCell>
                        <TableCell>Hedef</TableCell>
                        <TableCell>Yüzde</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {breakdownData?.byCategory && Object.entries(breakdownData.byCategory).map(([category, data]) => (
                        <TableRow key={category}>
                          <TableCell sx={{ textTransform: 'capitalize' }}>
                            {category}
                          </TableCell>
                          <TableCell>{data.count}</TableCell>
                          <TableCell>
                            <Chip 
                              label={data.severity} 
                              size="small" 
                              color={getSeverityColor(data.severity)}
                            />
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={data.destination} 
                              size="small" 
                              color={data.destination === 'sentry' ? 'primary' : 'secondary'}
                            />
                          </TableCell>
                          <TableCell>
                            {breakdownData.bySeverity[data.severity as keyof typeof breakdownData.bySeverity]?.percentage.toFixed(1)}%
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
      )}

      {activeTab === 2 && (
        <Grid container spacing={3}>
          {/* Cost Analysis */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Mevcut Maliyet
                </Typography>
                <Typography variant="h4" color="primary">
                  {formatCurrency(costData?.current.totalCost || 0)}
                </Typography>
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2">
                    Sentry: {formatCurrency(costData?.current.sentryCost || 0)}
                  </Typography>
                  <Typography variant="body2">
                    Local: {formatCurrency(costData?.current.localCost || 0)}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Potansiyel Tasarruf
                </Typography>
                <Typography variant="h4" color="success.main">
                  {formatCurrency(costData?.optimization.savings || 0)}
                </Typography>
                <Typography variant="body2" color="success.main">
                  {formatPercentage(costData?.optimization.savingsPercentage || 0)} tasarruf
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Recommendations */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Öneriler
                </Typography>
                <Box component="ul" sx={{ pl: 2 }}>
                  {costData?.recommendations.map((recommendation, index) => (
                    <Typography component="li" key={index} variant="body2" sx={{ mb: 1 }}>
                      {recommendation}
                    </Typography>
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {activeTab === 3 && (
        <Grid container spacing={3}>
          {/* System Comparison */}
          {comparisonData && ['sentry', 'local', 'hybrid'].map((system) => (
            <Grid item xs={12} md={4} key={system}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ textTransform: 'capitalize' }}>
                    {system} Sistemi
                  </Typography>
                  
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    {comparisonData[system as keyof SystemComparison].bestFor}
                  </Typography>
                  
                  <Typography variant="h6" color="primary" gutterBottom>
                    {comparisonData[system as keyof SystemComparison].cost}
                  </Typography>

                  <Accordion>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Typography variant="body2">Özellikler</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Box component="ul" sx={{ pl: 2, m: 0 }}>
                        {comparisonData[system as keyof SystemComparison].features.map((feature, index) => (
                          <Typography component="li" key={index} variant="body2" sx={{ mb: 0.5 }}>
                            {feature}
                          </Typography>
                        ))}
                      </Box>
                    </AccordionDetails>
                  </Accordion>

                  <Accordion>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Typography variant="body2">Avantajlar</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Box component="ul" sx={{ pl: 2, m: 0 }}>
                        {comparisonData[system as keyof SystemComparison].pros.map((pro, index) => (
                          <Typography component="li" key={index} variant="body2" sx={{ mb: 0.5 }}>
                            {pro}
                          </Typography>
                        ))}
                      </Box>
                    </AccordionDetails>
                  </Accordion>

                  <Accordion>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Typography variant="body2">Dezavantajlar</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Box component="ul" sx={{ pl: 2, m: 0 }}>
                        {comparisonData[system as keyof SystemComparison].cons.map((con, index) => (
                          <Typography component="li" key={index} variant="body2" sx={{ mb: 0.5 }}>
                            {con}
                          </Typography>
                        ))}
                      </Box>
                    </AccordionDetails>
                  </Accordion>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

export default HybridMonitoringPage;
