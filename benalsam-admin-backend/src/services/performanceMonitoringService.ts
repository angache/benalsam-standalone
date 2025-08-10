import { Client } from '@elastic/elasticsearch';
import logger from '../config/logger';
import os from 'os';
import { performance } from 'perf_hooks';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';

const execAsync = promisify(exec);

export interface PerformanceMetric {
  timestamp: string;
  metric_type: 'api' | 'elasticsearch' | 'system' | 'database' | 'frontend';
  metric_name: string;
  value: number;
  unit: string;
  tags?: Record<string, any>;
  metadata?: Record<string, any>;
}

export interface SystemMetrics {
  cpu_usage: number;
  memory_usage: number;
  disk_usage: number;
  disk_io: {
    read_bytes: number;
    write_bytes: number;
    read_operations: number;
    write_operations: number;
    read_time: number;
    write_time: number;
  };
  network_io: {
    bytes_sent: number;
    bytes_received: number;
    packets_sent: number;
    packets_received: number;
  };
  uptime: number;
  load_average: number[];
}

export interface APIMetrics {
  endpoint: string;
  method: string;
  response_time: number;
  status_code: number;
  request_size: number;
  response_size: number;
  timestamp: string;
}

export interface ElasticsearchMetrics {
  cluster_health: string;
  index_count: number;
  document_count: number;
  query_response_time: number;
  indexing_rate: number;
  search_rate: number;
  memory_usage: number;
  cpu_usage: number;
}

export interface DatabaseMetrics {
  query_count: number;
  slow_queries: number;
  avg_query_time: number;
  max_query_time: number;
  connection_count: number;
  active_connections: number;
  idle_connections: number;
  query_errors: number;
  table_sizes: Record<string, number>;
  index_usage: Record<string, number>;
}

export interface FrontendMetrics {
  componentName: string;
  renderTime: number;
  mountTime: number;
  pageLoadTime: number;
  userInteractions: any[];
  memoryUsage?: number;
  bundleSize?: number;
  url: string;
  timestamp: string;
}

export class PerformanceMonitoringService {
  private client: Client;
  private metricsIndex: string = 'performance_metrics';
  private alertsIndex: string = 'performance_alerts';

  constructor(
    node: string = process.env.ELASTICSEARCH_URL || 'http://209.227.228.96:9200',
    username: string = process.env.ELASTICSEARCH_USERNAME || '',
    password: string = process.env.ELASTICSEARCH_PASSWORD || ''
  ) {
    this.client = new Client({ 
      node, 
      auth: username ? { username, password } : undefined 
    });
  }

  async initializeIndexes(): Promise<boolean> {
    try {
      // Performance Metrics Index
      await this.client.indices.create({
        index: this.metricsIndex,
        body: {
          mappings: {
            properties: {
              timestamp: { type: 'date' },
              metric_type: { type: 'keyword' },
              metric_name: { type: 'keyword' },
              value: { type: 'float' },
              unit: { type: 'keyword' },
              tags: { type: 'object', dynamic: true },
              metadata: { type: 'object', dynamic: true }
            }
          },
          settings: {
            number_of_shards: 1,
            number_of_replicas: 0,
            "index.lifecycle.name": "performance_metrics_policy",
            "index.lifecycle.rollover_alias": "performance_metrics"
          }
        }
      });

      // Performance Alerts Index
      await this.client.indices.create({
        index: this.alertsIndex,
        body: {
          mappings: {
            properties: {
              timestamp: { type: 'date' },
              alert_type: { type: 'keyword' },
              severity: { type: 'keyword' },
              metric_name: { type: 'keyword' },
              threshold: { type: 'float' },
              current_value: { type: 'float' },
              message: { type: 'text' },
              status: { type: 'keyword' },
              resolved_at: { type: 'date' }
            }
          }
        }
      });

      logger.info('Performance monitoring indexes initialized successfully');
      return true;
    } catch (error: any) {
      if (error.message?.includes('resource_already_exists_exception')) {
        logger.info('Performance monitoring indexes already exist');
        return true;
      }
      logger.error('Failed to initialize performance monitoring indexes:', error);
      return false;
    }
  }

  // System Performance Monitoring
  async getSystemMetrics(): Promise<SystemMetrics> {
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const memoryUsage = ((totalMemory - freeMemory) / totalMemory) * 100;

    const cpus = os.cpus();
    const cpuUsage = cpus.reduce((acc, cpu) => {
      const total = Object.values(cpu.times).reduce((a: number, b: number) => a + b, 0);
      const idle = cpu.times.idle;
      return acc + ((total - idle) / total) * 100;
    }, 0) / cpus.length;

    // Disk usage monitoring
    const diskUsage = await this.getDiskUsage();
    
    // Disk I/O monitoring
    const diskIO = await this.getDiskIO();
    
    // Network I/O monitoring
    const networkIO = await this.getNetworkIO();

    return {
      cpu_usage: Math.round(cpuUsage * 100) / 100,
      memory_usage: Math.round(memoryUsage * 100) / 100,
      disk_usage: diskUsage,
      disk_io: diskIO,
      network_io: networkIO,
      uptime: os.uptime(),
      load_average: os.loadavg()
    };
  }

  // Get disk usage percentage
  private async getDiskUsage(): Promise<number> {
    try {
      const rootPath = '/';
      const stats = fs.statfsSync(rootPath);
      const totalBlocks = stats.blocks;
      const freeBlocks = stats.bavail;
      const usedBlocks = totalBlocks - freeBlocks;
      const usagePercentage = (usedBlocks / totalBlocks) * 100;
      
      return Math.round(usagePercentage * 100) / 100;
    } catch (error) {
      logger.error('Failed to get disk usage:', error);
      return 0;
    }
  }

  // Get disk I/O metrics
  private async getDiskIO(): Promise<SystemMetrics['disk_io']> {
    try {
      if (process.platform === 'win32') {
        // Windows implementation
        const { stdout } = await execAsync('wmic logicaldisk get size,freespace,caption');
        const lines = stdout.trim().split('\n').slice(1);
        let totalRead = 0, totalWrite = 0;
        
        // Windows için basit implementasyon - gerçek I/O metrikleri için WMI kullanılabilir
        return {
          read_bytes: totalRead,
          write_bytes: totalWrite,
          read_operations: 0,
          write_operations: 0,
          read_time: 0,
          write_time: 0
        };
      } else {
        // Linux/Unix implementation using /proc/diskstats
        const { stdout } = await execAsync('cat /proc/diskstats');
        const lines = stdout.trim().split('\n');
        let totalReadBytes = 0, totalWriteBytes = 0;
        let totalReadOps = 0, totalWriteOps = 0;
        let totalReadTime = 0, totalWriteTime = 0;

        lines.forEach(line => {
          const parts = line.trim().split(/\s+/);
          if (parts.length >= 14) {
            const readOps = parseInt(parts[3]) || 0;
            const readBytes = parseInt(parts[5]) || 0;
            const writeOps = parseInt(parts[7]) || 0;
            const writeBytes = parseInt(parts[9]) || 0;
            const readTime = parseInt(parts[6]) || 0;
            const writeTime = parseInt(parts[10]) || 0;

            totalReadOps += readOps;
            totalWriteOps += writeOps;
            totalReadBytes += readBytes * 512; // Convert sectors to bytes
            totalWriteBytes += writeBytes * 512;
            totalReadTime += readTime;
            totalWriteTime += writeTime;
          }
        });

        return {
          read_bytes: totalReadBytes,
          write_bytes: totalWriteBytes,
          read_operations: totalReadOps,
          write_operations: totalWriteOps,
          read_time: totalReadTime,
          write_time: totalWriteTime
        };
      }
    } catch (error) {
      logger.error('Failed to get disk I/O metrics:', error);
      return {
        read_bytes: 0,
        write_bytes: 0,
        read_operations: 0,
        write_operations: 0,
        read_time: 0,
        write_time: 0
      };
    }
  }

  // Get network I/O metrics
  private async getNetworkIO(): Promise<SystemMetrics['network_io']> {
    try {
      if (process.platform === 'win32') {
        // Windows implementation
        const { stdout } = await execAsync('netstat -e');
        const lines = stdout.trim().split('\n');
        let bytesSent = 0, bytesReceived = 0;
        
        // Windows için basit implementasyon
        return {
          bytes_sent: bytesSent,
          bytes_received: bytesReceived,
          packets_sent: 0,
          packets_received: 0
        };
      } else {
        // Linux/Unix implementation using /proc/net/dev
        const { stdout } = await execAsync('cat /proc/net/dev');
        const lines = stdout.trim().split('\n').slice(2); // Skip header lines
        let totalBytesSent = 0, totalBytesReceived = 0;
        let totalPacketsSent = 0, totalPacketsReceived = 0;

        lines.forEach(line => {
          const parts = line.trim().split(/\s+/);
          if (parts.length >= 10) {
            const interfaceName = parts[0].replace(':', '');
            // Skip loopback interface
            if (interfaceName !== 'lo') {
              const bytesReceived = parseInt(parts[1]) || 0;
              const packetsReceived = parseInt(parts[2]) || 0;
              const bytesSent = parseInt(parts[9]) || 0;
              const packetsSent = parseInt(parts[10]) || 0;

              totalBytesReceived += bytesReceived;
              totalBytesSent += bytesSent;
              totalPacketsReceived += packetsReceived;
              totalPacketsSent += packetsSent;
            }
          }
        });

        return {
          bytes_sent: totalBytesSent,
          bytes_received: totalBytesReceived,
          packets_sent: totalPacketsSent,
          packets_received: totalPacketsReceived
        };
      }
    } catch (error) {
      logger.error('Failed to get network I/O metrics:', error);
      return {
        bytes_sent: 0,
        bytes_received: 0,
        packets_sent: 0,
        packets_received: 0
      };
    }
  }

  async trackSystemMetrics(): Promise<boolean> {
    try {
      const metrics = await this.getSystemMetrics();
      const timestamp = new Date().toISOString();

      const performanceMetrics: PerformanceMetric[] = [
        {
          timestamp,
          metric_type: 'system',
          metric_name: 'cpu_usage',
          value: metrics.cpu_usage,
          unit: 'percentage',
          tags: { host: os.hostname() }
        },
        {
          timestamp,
          metric_type: 'system',
          metric_name: 'memory_usage',
          value: metrics.memory_usage,
          unit: 'percentage',
          tags: { host: os.hostname() }
        },
        {
          timestamp,
          metric_type: 'system',
          metric_name: 'disk_usage',
          value: metrics.disk_usage,
          unit: 'percentage',
          tags: { host: os.hostname() }
        },
        {
          timestamp,
          metric_type: 'system',
          metric_name: 'disk_read_bytes',
          value: metrics.disk_io.read_bytes,
          unit: 'bytes',
          tags: { host: os.hostname() }
        },
        {
          timestamp,
          metric_type: 'system',
          metric_name: 'disk_write_bytes',
          value: metrics.disk_io.write_bytes,
          unit: 'bytes',
          tags: { host: os.hostname() }
        },
        {
          timestamp,
          metric_type: 'system',
          metric_name: 'disk_read_operations',
          value: metrics.disk_io.read_operations,
          unit: 'count',
          tags: { host: os.hostname() }
        },
        {
          timestamp,
          metric_type: 'system',
          metric_name: 'disk_write_operations',
          value: metrics.disk_io.write_operations,
          unit: 'count',
          tags: { host: os.hostname() }
        },
        {
          timestamp,
          metric_type: 'system',
          metric_name: 'network_bytes_sent',
          value: metrics.network_io.bytes_sent,
          unit: 'bytes',
          tags: { host: os.hostname() }
        },
        {
          timestamp,
          metric_type: 'system',
          metric_name: 'network_bytes_received',
          value: metrics.network_io.bytes_received,
          unit: 'bytes',
          tags: { host: os.hostname() }
        },
        {
          timestamp,
          metric_type: 'system',
          metric_name: 'network_packets_sent',
          value: metrics.network_io.packets_sent,
          unit: 'count',
          tags: { host: os.hostname() }
        },
        {
          timestamp,
          metric_type: 'system',
          metric_name: 'network_packets_received',
          value: metrics.network_io.packets_received,
          unit: 'count',
          tags: { host: os.hostname() }
        },
        {
          timestamp,
          metric_type: 'system',
          metric_name: 'uptime',
          value: metrics.uptime,
          unit: 'seconds',
          tags: { host: os.hostname() }
        }
      ];

      await this.client.bulk({
        body: performanceMetrics.flatMap(metric => [
          { index: { _index: this.metricsIndex } },
          metric
        ])
      });

      logger.info(`✅ System metrics tracked successfully: ${performanceMetrics.length} metrics`);
      return true;
    } catch (error) {
      logger.error('Failed to track system metrics:', error);
      return false;
    }
  }

  // API Performance Monitoring
  async trackAPIMetrics(apiMetrics: APIMetrics): Promise<boolean> {
    try {
      const performanceMetric: PerformanceMetric = {
        timestamp: apiMetrics.timestamp,
        metric_type: 'api',
        metric_name: 'response_time',
        value: apiMetrics.response_time,
        unit: 'milliseconds',
        tags: {
          endpoint: apiMetrics.endpoint,
          method: apiMetrics.method,
          status_code: apiMetrics.status_code
        },
        metadata: {
          request_size: apiMetrics.request_size,
          response_size: apiMetrics.response_size
        }
      };

      await this.client.index({
        index: this.metricsIndex,
        body: performanceMetric
      });

      return true;
    } catch (error) {
      logger.error('Failed to track API metrics:', error);
      return false;
    }
  }

  // Elasticsearch Performance Monitoring
  async getElasticsearchMetrics(): Promise<ElasticsearchMetrics> {
    try {
      const startTime = performance.now();
      
      // Get cluster health
      const healthResponse = await this.client.cluster.health();
      
      // Get cluster stats
      const statsResponse = await this.client.cluster.stats();
      
      // Get indices stats
      const indicesResponse = await this.client.indices.stats();
      
      const endTime = performance.now();
      const queryResponseTime = endTime - startTime;

      return {
        cluster_health: (healthResponse as any).body?.status || 'unknown',
        index_count: Object.keys((indicesResponse as any).body?.indices || {}).length,
        document_count: (statsResponse as any).body?.indices?.docs?.count || 0,
        query_response_time: queryResponseTime,
        indexing_rate: (statsResponse as any).body?.indices?.indexing?.index_total || 0,
        search_rate: (statsResponse as any).body?.indices?.search?.query_total || 0,
        memory_usage: 0, // TODO: Get from cluster stats
        cpu_usage: 0 // TODO: Get from cluster stats
      };
    } catch (error) {
      logger.error('Failed to get Elasticsearch metrics:', error);
      throw error;
    }
  }

  async trackElasticsearchMetrics(): Promise<boolean> {
    try {
      const metrics = await this.getElasticsearchMetrics();
      const timestamp = new Date().toISOString();

      const performanceMetrics: PerformanceMetric[] = [
        {
          timestamp,
          metric_type: 'elasticsearch',
          metric_name: 'query_response_time',
          value: metrics.query_response_time,
          unit: 'milliseconds'
        },
        {
          timestamp,
          metric_type: 'elasticsearch',
          metric_name: 'index_count',
          value: metrics.index_count,
          unit: 'count'
        },
        {
          timestamp,
          metric_type: 'elasticsearch',
          metric_name: 'document_count',
          value: metrics.document_count,
          unit: 'count'
        }
      ];

      await this.client.bulk({
        body: performanceMetrics.flatMap(metric => [
          { index: { _index: this.metricsIndex } },
          metric
        ])
      });

      return true;
    } catch (error) {
      logger.error('Failed to track Elasticsearch metrics:', error);
      return false;
    }
  }

  // Performance Alerts
  async checkPerformanceAlerts(): Promise<any[]> {
    try {
      const alerts: any[] = [];
      const timestamp = new Date().toISOString();

      // Check system metrics
      const systemMetrics = await this.getSystemMetrics();
      
      if (systemMetrics.cpu_usage > 80) {
        alerts.push({
          timestamp,
          alert_type: 'high_cpu_usage',
          severity: 'warning',
          metric_name: 'cpu_usage',
          threshold: 80,
          current_value: systemMetrics.cpu_usage,
          message: `High CPU usage detected: ${systemMetrics.cpu_usage}%`,
          status: 'active'
        });
      }

      if (systemMetrics.memory_usage > 85) {
        alerts.push({
          timestamp,
          alert_type: 'high_memory_usage',
          severity: 'critical',
          metric_name: 'memory_usage',
          threshold: 85,
          current_value: systemMetrics.memory_usage,
          message: `High memory usage detected: ${systemMetrics.memory_usage}%`,
          status: 'active'
        });
      }

      // Check API response times
      const apiMetrics = await this.getAPIMetrics(5); // Last 5 minutes
      const avgResponseTime = apiMetrics.reduce((acc, metric) => acc + metric.response_time, 0) / apiMetrics.length;
      
      if (avgResponseTime > 500) {
        alerts.push({
          timestamp,
          alert_type: 'slow_api_response',
          severity: 'warning',
          metric_name: 'api_response_time',
          threshold: 500,
          current_value: avgResponseTime,
          message: `Slow API response time detected: ${avgResponseTime}ms`,
          status: 'active'
        });
      }

      // Store alerts
      if (alerts.length > 0) {
        await this.client.bulk({
          body: alerts.flatMap(alert => [
            { index: { _index: this.alertsIndex } },
            alert
          ])
        });
      }

      return alerts;
    } catch (error) {
      logger.error('Failed to check performance alerts:', error);
      return [];
    }
  }

  // Get Performance Metrics
  async getPerformanceMetrics(params: {
    metric_type?: string;
    metric_name?: string;
    start_date?: string;
    end_date?: string;
    limit?: number;
  }): Promise<any> {
    try {
      const query: any = {
        bool: {
          must: []
        }
      };

      if (params.metric_type) {
        query.bool.must.push({ term: { metric_type: params.metric_type } });
      }

      if (params.metric_name) {
        query.bool.must.push({ term: { metric_name: params.metric_name } });
      }

      if (params.start_date || params.end_date) {
        const range: any = {};
        if (params.start_date) range.gte = params.start_date;
        if (params.end_date) range.lte = params.end_date;
        query.bool.must.push({ range: { timestamp: range } });
      }

      const response = await this.client.search({
        index: this.metricsIndex,
        body: {
          query,
          sort: [{ timestamp: { order: 'desc' } }],
          size: params.limit || 100
        }
      });

      return {
        total: (response as any).body?.hits?.total?.value || 0,
        metrics: (response as any).body?.hits?.hits?.map((hit: any) => ({
          ...hit._source,
          id: hit._id
        })) || []
      };
    } catch (error) {
      logger.error('Failed to get performance metrics:', error);
      throw error;
    }
  }

  async getAPIMetrics(minutes: number = 5): Promise<APIMetrics[]> {
    try {
      const startDate = new Date(Date.now() - minutes * 60 * 1000).toISOString();
      
      const response = await this.client.search({
        index: this.metricsIndex,
        body: {
          query: {
            bool: {
              must: [
                { term: { metric_type: 'api' } },
                { range: { timestamp: { gte: startDate } } }
              ]
            }
          },
          sort: [{ timestamp: { order: 'desc' } }]
        }
      });

      return (response as any).body?.hits?.hits?.map((hit: any) => ({
        endpoint: hit._source.tags.endpoint,
        method: hit._source.tags.method,
        response_time: hit._source.value,
        status_code: hit._source.tags.status_code,
        request_size: hit._source.metadata?.request_size || 0,
        response_size: hit._source.metadata?.response_size || 0,
        timestamp: hit._source.timestamp
      })) || [];
    } catch (error) {
      logger.error('Failed to get API metrics:', error);
      return [];
    }
  }

  async getActiveAlerts(): Promise<any[]> {
    try {
      const response = await this.client.search({
        index: this.alertsIndex,
        body: {
          query: {
            term: { status: 'active' }
          },
          sort: [{ timestamp: { order: 'desc' } }]
        }
      });

      return (response as any).body?.hits?.hits?.map((hit: any) => ({
        ...hit._source,
        id: hit._id
      })) || [];
    } catch (error) {
      logger.error('Failed to get active alerts:', error);
      return [];
    }
  }

  // Real-time Performance Dashboard
  async getRealTimePerformanceDashboard(): Promise<any> {
    try {
      const [systemMetrics, elasticsearchMetrics, activeAlerts] = await Promise.all([
        this.getSystemMetrics(),
        this.getElasticsearchMetrics(),
        this.getActiveAlerts()
      ]);

      const apiMetrics = await this.getAPIMetrics(5);
      const avgResponseTime = apiMetrics.length > 0 
        ? apiMetrics.reduce((acc, metric) => acc + metric.response_time, 0) / apiMetrics.length 
        : 0;

      return {
        system: {
          cpu_usage: systemMetrics.cpu_usage,
          memory_usage: systemMetrics.memory_usage,
          uptime: systemMetrics.uptime,
          load_average: systemMetrics.load_average
        },
        elasticsearch: {
          cluster_health: elasticsearchMetrics.cluster_health,
          query_response_time: elasticsearchMetrics.query_response_time,
          document_count: elasticsearchMetrics.document_count,
          index_count: elasticsearchMetrics.index_count
        },
        api: {
          avg_response_time: avgResponseTime,
          total_requests: apiMetrics.length,
          error_rate: apiMetrics.filter(m => m.status_code >= 400).length / apiMetrics.length * 100
        },
        alerts: {
          active_count: activeAlerts.length,
          critical_count: activeAlerts.filter(a => a.severity === 'critical').length,
          warning_count: activeAlerts.filter(a => a.severity === 'warning').length
        },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Failed to get real-time performance dashboard:', error);
      throw error;
    }
  }

  // Database Performance Monitoring
  async getDatabaseMetrics(): Promise<DatabaseMetrics> {
    try {
      // Bu implementasyon Prisma ile PostgreSQL kullanıyor
      // Gerçek uygulamada database-specific query'ler kullanılacak
      
      const metrics: DatabaseMetrics = {
        query_count: 0,
        slow_queries: 0,
        avg_query_time: 0,
        max_query_time: 0,
        connection_count: 0,
        active_connections: 0,
        idle_connections: 0,
        query_errors: 0,
        table_sizes: {},
        index_usage: {}
      };

      // PostgreSQL için pg_stat_statements kullanarak query istatistikleri
      // Bu kısım gerçek implementasyonda database'e bağlanarak yapılacak
      
      logger.info('Database metrics collected successfully');
      return metrics;
    } catch (error) {
      logger.error('Failed to get database metrics:', error);
      throw error;
    }
  }

  async trackDatabaseMetrics(): Promise<boolean> {
    try {
      const metrics = await this.getDatabaseMetrics();
      const timestamp = new Date().toISOString();

      const performanceMetrics: PerformanceMetric[] = [
        {
          timestamp,
          metric_type: 'database',
          metric_name: 'query_count',
          value: metrics.query_count,
          unit: 'count',
          tags: { database: 'postgresql' }
        },
        {
          timestamp,
          metric_type: 'database',
          metric_name: 'slow_queries',
          value: metrics.slow_queries,
          unit: 'count',
          tags: { database: 'postgresql' }
        },
        {
          timestamp,
          metric_type: 'database',
          metric_name: 'avg_query_time',
          value: metrics.avg_query_time,
          unit: 'milliseconds',
          tags: { database: 'postgresql' }
        },
        {
          timestamp,
          metric_type: 'database',
          metric_name: 'max_query_time',
          value: metrics.max_query_time,
          unit: 'milliseconds',
          tags: { database: 'postgresql' }
        },
        {
          timestamp,
          metric_type: 'database',
          metric_name: 'connection_count',
          value: metrics.connection_count,
          unit: 'count',
          tags: { database: 'postgresql' }
        },
        {
          timestamp,
          metric_type: 'database',
          metric_name: 'active_connections',
          value: metrics.active_connections,
          unit: 'count',
          tags: { database: 'postgresql' }
        },
        {
          timestamp,
          metric_type: 'database',
          metric_name: 'query_errors',
          value: metrics.query_errors,
          unit: 'count',
          tags: { database: 'postgresql' }
        }
      ];

      await this.client.bulk({
        body: performanceMetrics.flatMap(metric => [
          { index: { _index: this.metricsIndex } },
          metric
        ])
      });

      logger.info(`✅ Database metrics tracked successfully: ${performanceMetrics.length} metrics`);
      return true;
    } catch (error) {
      logger.error('Failed to track database metrics:', error);
      return false;
    }
  }

  // Enhanced Performance Monitoring with all metrics
  async trackAllMetrics(): Promise<boolean> {
    try {
      logger.info('🔄 Starting comprehensive performance monitoring...');
      
      const results = await Promise.allSettled([
        this.trackSystemMetrics(),
        this.trackElasticsearchMetrics(),
        this.trackDatabaseMetrics()
      ]);

      const successCount = results.filter(result => result.status === 'fulfilled' && result.value).length;
      const totalCount = results.length;

      logger.info(`✅ Performance monitoring completed: ${successCount}/${totalCount} successful`);
      
      return successCount === totalCount;
    } catch (error) {
      logger.error('Failed to track all metrics:', error);
      return false;
    }
  }

  // Frontend Performance Monitoring
  async trackFrontendMetrics(metrics: FrontendMetrics): Promise<boolean> {
    try {
      const performanceMetric: PerformanceMetric = {
        timestamp: metrics.timestamp,
        metric_type: 'frontend',
        metric_name: 'component_performance',
        value: metrics.renderTime,
        unit: 'milliseconds',
        tags: {
          component: metrics.componentName,
          url: metrics.url
        },
        metadata: {
          mountTime: metrics.mountTime,
          pageLoadTime: metrics.pageLoadTime,
          memoryUsage: metrics.memoryUsage,
          bundleSize: metrics.bundleSize,
          userInteractions: metrics.userInteractions
        }
      };

      await this.client.index({
        index: this.metricsIndex,
        body: performanceMetric
      });

      logger.info(`✅ Frontend metrics tracked successfully: ${metrics.componentName}`);
      return true;
    } catch (error) {
      logger.error('Failed to track frontend metrics:', error);
      return false;
    }
  }

  async getFrontendMetrics(params: {
    componentName?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
  }): Promise<any> {
    try {
      const query: any = {
        bool: {
          must: [
            { term: { 'metric_type': 'frontend' } }
          ]
        }
      };

      if (params.componentName) {
        query.bool.must.push({ term: { 'tags.component': params.componentName } });
      }

      if (params.startDate || params.endDate) {
        const range: any = {};
        if (params.startDate) range.gte = params.startDate;
        if (params.endDate) range.lte = params.endDate;
        query.bool.must.push({ range: { timestamp: range } });
      }

      const response = await this.client.search({
        index: this.metricsIndex,
        body: {
          query,
          sort: [{ timestamp: { order: 'desc' } }],
          size: params.limit || 100
        }
      });

      const hits = (response as any).hits.hits;
      const metrics = hits.map((hit: any) => ({
        ...hit._source,
        timestamp: new Date(hit._source.timestamp)
      }));

      logger.info(`✅ Frontend metrics retrieved: ${metrics.length} records`);
      return metrics;
    } catch (error) {
      logger.error('Failed to get frontend metrics:', error);
      throw error;
    }
  }
} 