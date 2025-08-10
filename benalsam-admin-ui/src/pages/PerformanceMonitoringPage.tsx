import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiService } from '../services/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Alert, AlertDescription } from '../components/ui/alert';
import { 
  Activity, 
  Cpu, 
  Memory, 
  HardDrive, 
  Network, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  TrendingUp,
  TrendingDown,
  Zap
} from 'lucide-react';

interface SystemMetrics {
  cpu_usage: number;
  memory_usage: number;
  disk_usage: number;
  network_io: {
    bytes_sent: number;
    bytes_received: number;
  };
  uptime: number;
  load_average: number[];
}

interface ElasticsearchMetrics {
  cluster_health: string;
  index_count: number;
  document_count: number;
  query_response_time: number;
  indexing_rate: number;
  search_rate: number;
  memory_usage: number;
  cpu_usage: number;
}

interface APIMetrics {
  endpoint: string;
  method: string;
  response_time: number;
  status_code: number;
  request_size: number;
  response_size: number;
  timestamp: string;
}

interface PerformanceAlert {
  id: string;
  timestamp: string;
  alert_type: string;
  severity: 'critical' | 'warning' | 'info';
  metric_name: string;
  threshold: number;
  current_value: number;
  message: string;
  status: string;
}

interface PerformanceDashboard {
  system: SystemMetrics;
  elasticsearch: ElasticsearchMetrics;
  api: {
    avg_response_time: number;
    total_requests: number;
    error_rate: number;
  };
  alerts: {
    active_count: number;
    critical_count: number;
    warning_count: number;
  };
  timestamp: string;
}

const PerformanceMonitoringPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Real-time dashboard data
  const { data: dashboardData, isLoading: dashboardLoading, error: dashboardError, refetch: refetchDashboard } = useQuery({
    queryKey: ['performance-dashboard'],
    queryFn: () => apiService.getPerformanceDashboard(),
    refetchInterval: autoRefresh ? 5000 : false, // 5 saniye
    refetchIntervalInBackground: true
  });

  // System metrics
  const { data: systemMetrics, isLoading: systemLoading } = useQuery({
    queryKey: ['system-metrics'],
    queryFn: () => apiService.getSystemMetrics(),
    refetchInterval: autoRefresh ? 10000 : false, // 10 saniye
    refetchIntervalInBackground: true
  });

  // Elasticsearch metrics
  const { data: elasticsearchMetrics, isLoading: elasticsearchLoading } = useQuery({
    queryKey: ['elasticsearch-metrics'],
    queryFn: () => apiService.getElasticsearchMetrics(),
    refetchInterval: autoRefresh ? 15000 : false, // 15 saniye
    refetchIntervalInBackground: true
  });

  // API metrics
  const { data: apiMetrics, isLoading: apiLoading } = useQuery({
    queryKey: ['api-metrics'],
    queryFn: () => apiService.getAPIMetrics(),
    refetchInterval: autoRefresh ? 10000 : false, // 10 saniye
    refetchIntervalInBackground: true
  });

  // Active alerts
  const { data: alerts, isLoading: alertsLoading } = useQuery({
    queryKey: ['performance-alerts'],
    queryFn: () => apiService.getPerformanceAlerts(),
    refetchInterval: autoRefresh ? 30000 : false, // 30 saniye
    refetchIntervalInBackground: true
  });

  const getHealthStatus = (value: number, thresholds: { warning: number; critical: number }) => {
    if (value >= thresholds.critical) return 'critical';
    if (value >= thresholds.warning) return 'warning';
    return 'healthy';
  };

  const getHealthColor = (status: string) => {
    switch (status) {
      case 'critical': return 'text-red-600';
      case 'warning': return 'text-yellow-600';
      case 'healthy': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  const getHealthIcon = (status: string) => {
    switch (status) {
      case 'critical': return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case 'healthy': return <CheckCircle className="w-4 h-4 text-green-600" />;
      default: return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  if (dashboardLoading && systemLoading && elasticsearchLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (dashboardError) {
    return (
      <Alert className="mb-4">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Performance monitoring verileri yüklenirken hata oluştu. Lütfen tekrar deneyin.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Performance Monitoring</h1>
          <p className="text-gray-600">Sistem performansı ve kaynak kullanımı</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant={autoRefresh ? "default" : "outline"}
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <Zap className="w-4 h-4 mr-2" />
            {autoRefresh ? 'Auto Refresh On' : 'Auto Refresh Off'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              refetchDashboard();
            }}
          >
            <Activity className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
          <TabsTrigger value="elasticsearch">Elasticsearch</TabsTrigger>
          <TabsTrigger value="api">API</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
        </TabsList>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard" className="space-y-6">
          {/* System Health Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">CPU Usage</CardTitle>
                <Cpu className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {dashboardData?.system?.cpu_usage?.toFixed(1)}%
                </div>
                <div className="flex items-center text-xs text-muted-foreground">
                  {getHealthIcon(getHealthStatus(dashboardData?.system?.cpu_usage || 0, { warning: 70, critical: 85 }))}
                  <span className="ml-1">
                    {getHealthStatus(dashboardData?.system?.cpu_usage || 0, { warning: 70, critical: 85 }) === 'critical' ? 'Critical' :
                     getHealthStatus(dashboardData?.system?.cpu_usage || 0, { warning: 70, critical: 85 }) === 'warning' ? 'Warning' : 'Healthy'}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Memory Usage</CardTitle>
                <Memory className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {dashboardData?.system?.memory_usage?.toFixed(1)}%
                </div>
                <div className="flex items-center text-xs text-muted-foreground">
                  {getHealthIcon(getHealthStatus(dashboardData?.system?.memory_usage || 0, { warning: 80, critical: 90 }))}
                  <span className="ml-1">
                    {getHealthStatus(dashboardData?.system?.memory_usage || 0, { warning: 80, critical: 90 }) === 'critical' ? 'Critical' :
                     getHealthStatus(dashboardData?.system?.memory_usage || 0, { warning: 80, critical: 90 }) === 'warning' ? 'Warning' : 'Healthy'}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">API Response Time</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {dashboardData?.api?.avg_response_time?.toFixed(0)}ms
                </div>
                <div className="flex items-center text-xs text-muted-foreground">
                  {getHealthIcon(getHealthStatus(dashboardData?.api?.avg_response_time || 0, { warning: 300, critical: 500 }))}
                  <span className="ml-1">
                    {getHealthStatus(dashboardData?.api?.avg_response_time || 0, { warning: 300, critical: 500 }) === 'critical' ? 'Slow' :
                     getHealthStatus(dashboardData?.api?.avg_response_time || 0, { warning: 300, critical: 500 }) === 'warning' ? 'Warning' : 'Fast'}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {dashboardData?.alerts?.active_count || 0}
                </div>
                <div className="flex items-center text-xs text-muted-foreground">
                  <span className="text-red-600 font-medium">{dashboardData?.alerts?.critical_count || 0} Critical</span>
                  <span className="mx-1">•</span>
                  <span className="text-yellow-600 font-medium">{dashboardData?.alerts?.warning_count || 0} Warning</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Elasticsearch Health */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Network className="w-5 h-5 mr-2" />
                Elasticsearch Health
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Cluster Status</p>
                  <Badge variant={dashboardData?.elasticsearch?.cluster_health === 'green' ? 'default' : 'destructive'}>
                    {dashboardData?.elasticsearch?.cluster_health || 'unknown'}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Indices</p>
                  <p className="text-lg font-semibold">{dashboardData?.elasticsearch?.index_count || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Documents</p>
                  <p className="text-lg font-semibold">{dashboardData?.elasticsearch?.document_count?.toLocaleString() || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Query Time</p>
                  <p className="text-lg font-semibold">{dashboardData?.elasticsearch?.query_response_time?.toFixed(0)}ms</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* System Uptime */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Activity className="w-5 h-5 mr-2" />
                System Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Uptime</p>
                  <p className="text-lg font-semibold">{formatUptime(dashboardData?.system?.uptime || 0)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Load Average</p>
                  <p className="text-lg font-semibold">
                    {dashboardData?.system?.load_average?.map((load: number) => load.toFixed(2)).join(', ') || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Last Updated</p>
                  <p className="text-lg font-semibold">
                    {dashboardData?.timestamp ? new Date(dashboardData.timestamp).toLocaleTimeString() : 'N/A'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* System Tab */}
        <TabsContent value="system" className="space-y-6">
          {systemMetrics && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>CPU Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Usage:</span>
                      <span className="font-semibold">{systemMetrics.cpu_usage.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          systemMetrics.cpu_usage > 80 ? 'bg-red-500' : 
                          systemMetrics.cpu_usage > 60 ? 'bg-yellow-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${Math.min(systemMetrics.cpu_usage, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Memory Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Usage:</span>
                      <span className="font-semibold">{systemMetrics.memory_usage.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          systemMetrics.memory_usage > 85 ? 'bg-red-500' : 
                          systemMetrics.memory_usage > 70 ? 'bg-yellow-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${Math.min(systemMetrics.memory_usage, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Elasticsearch Tab */}
        <TabsContent value="elasticsearch" className="space-y-6">
          {elasticsearchMetrics && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Cluster Health</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span>Status:</span>
                      <Badge variant={elasticsearchMetrics.cluster_health === 'green' ? 'default' : 'destructive'}>
                        {elasticsearchMetrics.cluster_health}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Query Response Time:</span>
                      <span className="font-semibold">{elasticsearchMetrics.query_response_time.toFixed(0)}ms</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Index Statistics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span>Total Indices:</span>
                      <span className="font-semibold">{elasticsearchMetrics.index_count}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Documents:</span>
                      <span className="font-semibold">{elasticsearchMetrics.document_count.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Indexing Rate:</span>
                      <span className="font-semibold">{elasticsearchMetrics.indexing_rate.toLocaleString()}/min</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Search Rate:</span>
                      <span className="font-semibold">{elasticsearchMetrics.search_rate.toLocaleString()}/min</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* API Tab */}
        <TabsContent value="api" className="space-y-6">
          {apiMetrics && apiMetrics.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Recent API Calls</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {apiMetrics.slice(0, 10).map((metric: APIMetrics, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Badge variant={metric.status_code >= 400 ? 'destructive' : 'default'}>
                          {metric.method}
                        </Badge>
                        <span className="font-mono text-sm">{metric.endpoint}</span>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <span>{metric.response_time}ms</span>
                        <span>{metric.status_code}</span>
                        <span>{new Date(metric.timestamp).toLocaleTimeString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Alerts Tab */}
        <TabsContent value="alerts" className="space-y-6">
          {alerts && alerts.length > 0 ? (
            <div className="space-y-4">
              {alerts.map((alert: PerformanceAlert) => (
                <Alert key={alert.id} variant={alert.severity === 'critical' ? 'destructive' : 'default'}>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold">{alert.alert_type.replace(/_/g, ' ').toUpperCase()}</p>
                        <p className="text-sm">{alert.message}</p>
                      </div>
                      <div className="text-right">
                        <Badge variant={alert.severity === 'critical' ? 'destructive' : 'secondary'}>
                          {alert.severity}
                        </Badge>
                        <p className="text-xs mt-1">{new Date(alert.timestamp).toLocaleString()}</p>
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center h-32">
                <div className="text-center">
                  <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <p className="text-muted-foreground">No active alerts</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PerformanceMonitoringPage; 