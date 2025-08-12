import { Request, Response } from 'express';
import Redis from 'ioredis';
import { Client } from '@elastic/elasticsearch';
import logger from './logger';
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
const elasticsearch = new Client({
  node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200'
});

export interface HealthStatus {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  uptime: number;
  version: string;
  environment: string;
  checks: {
    api: HealthCheck;
    database: HealthCheck;
    redis: HealthCheck;
    elasticsearch: HealthCheck;
    memory: HealthCheck;
    disk: HealthCheck;
  };
  summary: {
    totalChecks: number;
    healthyChecks: number;
    unhealthyChecks: number;
    degradedChecks: number;
  };
}

export interface HealthCheck {
  status: 'healthy' | 'unhealthy' | 'degraded';
  responseTime: number;
  lastChecked: string;
  details?: any;
  error?: string;
}

export interface DetailedHealthCheck extends HealthCheck {
  name: string;
  description: string;
  critical: boolean;
  dependencies?: string[];
}

class HealthCheckService {
  private startTime: number;
  private version: string;
  private environment: string;

  constructor() {
    this.startTime = Date.now();
    this.version = process.env.APP_VERSION || '1.0.0';
    this.environment = process.env.NODE_ENV || 'development';
  }

  async checkApiHealth(): Promise<HealthCheck> {
    const startTime = Date.now();
    try {
      // Basic API health check
      const responseTime = Date.now() - startTime;
      
      return {
        status: 'healthy',
        responseTime,
        lastChecked: new Date().toISOString(),
        details: {
          endpoints: ['/api/v1/health', '/api/v1/health/detailed'],
          activeConnections: 0, // TODO: Implement connection tracking
          requestRate: 0 // TODO: Implement request rate tracking
        }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        lastChecked: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async checkDatabaseHealth(): Promise<HealthCheck> {
    const startTime = Date.now();
    try {
      // Basic database health check (simplified for now)
      const responseTime = Date.now() - startTime;
      
      // Test için database'i unhealthy yapalım
      const isUnhealthy = Math.random() > 0.7; // %30 ihtimalle unhealthy
      
      return {
        status: isUnhealthy ? 'unhealthy' : 'healthy',
        responseTime: isUnhealthy ? 5000 : responseTime, // Unhealthy ise yavaş
        lastChecked: new Date().toISOString(),
        details: {
          provider: 'postgresql',
          queryTime: isUnhealthy ? 5000 : 0,
          connectionPool: {
            active: 0, // TODO: Implement connection pool monitoring
            idle: 0,
            total: 0
          }
        },
        error: isUnhealthy ? 'Database connection timeout' : undefined
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        lastChecked: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Database connection failed'
      };
    }
  }

  async checkRedisHealth(): Promise<HealthCheck> {
    const startTime = Date.now();
    try {
      // Test Redis connection
      await redis.ping();
      
      // Check Redis performance
      const performanceStart = Date.now();
      await redis.set('health_check', 'test', 'EX', 10);
      await redis.get('health_check');
      const queryTime = Date.now() - performanceStart;

      const responseTime = Date.now() - startTime;
      
      return {
        status: 'healthy',
        responseTime,
        lastChecked: new Date().toISOString(),
        details: {
          provider: 'redis',
          queryTime,
          memory: await redis.info('memory'),
          keyspace: await redis.info('keyspace')
        }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        lastChecked: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Redis connection failed'
      };
    }
  }

  async checkElasticsearchHealth(): Promise<HealthCheck> {
    const startTime = Date.now();
    try {
      // Test Elasticsearch connection
      const clusterHealth = await elasticsearch.cluster.health();
      
      // Check Elasticsearch performance
      const performanceStart = Date.now();
      await elasticsearch.search({
        index: 'benalsam-*',
        size: 1
      });
      const queryTime = Date.now() - performanceStart;

      const responseTime = Date.now() - startTime;
      
      return {
        status: 'healthy',
        responseTime,
        lastChecked: new Date().toISOString(),
        details: {
          provider: 'elasticsearch',
          queryTime,
          clusterHealth: clusterHealth,
          indices: await elasticsearch.cat.indices({ format: 'json' })
        }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        lastChecked: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Elasticsearch connection failed'
      };
    }
  }

  async checkMemoryHealth(): Promise<HealthCheck> {
    const startTime = Date.now();
    try {
      const memUsage = process.memoryUsage();
      const responseTime = Date.now() - startTime;
      
      const memoryUsagePercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;
      const status = memoryUsagePercent > 90 ? 'unhealthy' : 
                    memoryUsagePercent > 70 ? 'degraded' : 'healthy';

      return {
        status,
        responseTime,
        lastChecked: new Date().toISOString(),
        details: {
          heapUsed: memUsage.heapUsed,
          heapTotal: memUsage.heapTotal,
          external: memUsage.external,
          rss: memUsage.rss,
          usagePercent: memoryUsagePercent.toFixed(2)
        }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        lastChecked: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Memory check failed'
      };
    }
  }

  async checkDiskHealth(): Promise<HealthCheck> {
    const startTime = Date.now();
    try {
      // Basic disk check (simplified for now)
      const responseTime = Date.now() - startTime;
      
      return {
        status: 'healthy',
        responseTime,
        lastChecked: new Date().toISOString(),
        details: {
          available: true,
          // TODO: Implement actual disk space checking
          diskUsage: 'N/A'
        }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        lastChecked: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Disk check failed'
      };
    }
  }

  async getOverallHealth(): Promise<HealthStatus> {
    const [
      apiHealth,
      databaseHealth,
      redisHealth,
      elasticsearchHealth,
      memoryHealth,
      diskHealth
    ] = await Promise.all([
      this.checkApiHealth(),
      this.checkDatabaseHealth(),
      this.checkRedisHealth(),
      this.checkElasticsearchHealth(),
      this.checkMemoryHealth(),
      this.checkDiskHealth()
    ]);

    const checks = {
      api: apiHealth,
      database: databaseHealth,
      redis: redisHealth,
      elasticsearch: elasticsearchHealth,
      memory: memoryHealth,
      disk: diskHealth
    };

    const totalChecks = Object.keys(checks).length;
    const healthyChecks = Object.values(checks).filter(c => c.status === 'healthy').length;
    const unhealthyChecks = Object.values(checks).filter(c => c.status === 'unhealthy').length;
    const degradedChecks = Object.values(checks).filter(c => c.status === 'degraded').length;

    // Determine overall status
    let overallStatus: 'healthy' | 'unhealthy' | 'degraded' = 'healthy';
    if (unhealthyChecks > 0) {
      overallStatus = 'unhealthy';
    } else if (degradedChecks > 0) {
      overallStatus = 'degraded';
    }

    const healthStatus: HealthStatus = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: Date.now() - this.startTime,
      version: this.version,
      environment: this.environment,
      checks,
      summary: {
        totalChecks,
        healthyChecks,
        unhealthyChecks,
        degradedChecks
      }
    };

    // Log health status
    logger.info('🏥 Health check completed', {
      status: overallStatus,
      healthy: healthyChecks,
      unhealthy: unhealthyChecks,
      degraded: degradedChecks,
      uptime: healthStatus.uptime
    });

    return healthStatus;
  }

  async getDetailedHealth(): Promise<DetailedHealthCheck[]> {
    const [
      apiHealth,
      databaseHealth,
      redisHealth,
      elasticsearchHealth,
      memoryHealth,
      diskHealth
    ] = await Promise.all([
      this.checkApiHealth(),
      this.checkDatabaseHealth(),
      this.checkRedisHealth(),
      this.checkElasticsearchHealth(),
      this.checkMemoryHealth(),
      this.checkDiskHealth()
    ]);

    return [
      {
        name: 'API Health',
        description: 'API endpoints and request handling',
        critical: true,
        dependencies: [],
        ...apiHealth
      },
      {
        name: 'Database Health',
        description: 'PostgreSQL database connection and performance',
        critical: true,
        dependencies: ['postgresql'],
        ...databaseHealth
      },
      {
        name: 'Redis Health',
        description: 'Redis cache connection and performance',
        critical: false,
        dependencies: ['redis'],
        ...redisHealth
      },
      {
        name: 'Elasticsearch Health',
        description: 'Elasticsearch search engine connection and performance',
        critical: false,
        dependencies: ['elasticsearch'],
        ...elasticsearchHealth
      },
      {
        name: 'Memory Health',
        description: 'Application memory usage and performance',
        critical: true,
        dependencies: [],
        ...memoryHealth
      },
      {
        name: 'Disk Health',
        description: 'Disk space and file system health',
        critical: true,
        dependencies: [],
        ...diskHealth
      }
    ];
  }
}

export const healthCheckService = new HealthCheckService();
