import { elasticsearchService } from './elasticsearchService';
// import { queueConsumer } from './queueConsumer'; // DEVRE DIŞI
import { firebaseEventConsumer } from './firebaseEventConsumer';
import { rabbitmqConfig } from '../config/rabbitmq';
import { supabaseConfig } from '../config/supabase';
import { getCircuitBreakerStatus } from '../config/circuitBreaker';
import logger from '../config/logger';

export interface HealthCheckResult {
  healthy: boolean;
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  duration: number;
  details: any;
}

export interface ComponentHealth {
  name: string;
  healthy: boolean;
  status: string;
  responseTime: number;
  lastChecked: string;
  details: any;
}

class HealthService {
  private static instance: HealthService;
  private healthHistory: HealthCheckResult[] = [];
  private readonly maxHistorySize = 100;

  private constructor() {}

  public static getInstance(): HealthService {
    if (!HealthService.instance) {
      HealthService.instance = new HealthService();
    }
    return HealthService.instance;
  }

  /**
   * Comprehensive health check
   */
  public async performHealthCheck(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    const timestamp = new Date().toISOString();

    try {
      // Check all components in parallel
      const [
        elasticsearchHealth,
        rabbitmqHealth,
        databaseHealth,
        // consumerHealth, // DEVRE DIŞI
        firebaseConsumerHealth,
        circuitBreakerHealth
      ] = await Promise.all([
        this.checkElasticsearch(),
        this.checkRabbitMQ(),
        this.checkDatabase(),
        // this.checkConsumer(), // DEVRE DIŞI
        this.checkFirebaseConsumer(),
        this.checkCircuitBreakers()
      ]);

      // Calculate overall health
      const allHealthy = [
        elasticsearchHealth.healthy,
        rabbitmqHealth.healthy,
        databaseHealth.healthy,
        // consumerHealth.healthy, // DEVRE DIŞI
        firebaseConsumerHealth.healthy,
        circuitBreakerHealth.healthy
      ].every(Boolean);

      const anyDegraded = [
        elasticsearchHealth,
        rabbitmqHealth,
        databaseHealth,
        // consumerHealth, // DEVRE DIŞI
        firebaseConsumerHealth,
        circuitBreakerHealth
      ].some(component => !component.healthy);

      let status: 'healthy' | 'degraded' | 'unhealthy';
      if (allHealthy) {
        status = 'healthy';
      } else if (anyDegraded) {
        status = 'degraded';
      } else {
        status = 'unhealthy';
      }

      const result: HealthCheckResult = {
        healthy: allHealthy,
        status,
        timestamp,
        duration: Date.now() - startTime,
        details: {
          components: {
            elasticsearch: elasticsearchHealth,
            rabbitmq: rabbitmqHealth,
            database: databaseHealth,
            // consumer: consumerHealth, // DEVRE DIŞI
            firebaseConsumer: firebaseConsumerHealth,
            circuitBreakers: circuitBreakerHealth
          },
          summary: {
            totalComponents: 5,
            healthyComponents: [elasticsearchHealth, rabbitmqHealth, databaseHealth, firebaseConsumerHealth, circuitBreakerHealth].filter(c => c.healthy).length,
            degradedComponents: [elasticsearchHealth, rabbitmqHealth, databaseHealth, firebaseConsumerHealth, circuitBreakerHealth].filter(c => !c.healthy).length
          }
        }
      };

      // Store in history
      this.addToHistory(result);

      return result;

    } catch (error) {
      logger.error('❌ Health check failed:', error);
      
      const result: HealthCheckResult = {
        healthy: false,
        status: 'unhealthy',
        timestamp,
        duration: Date.now() - startTime,
        details: {
          error: error instanceof Error ? error.message : 'Unknown error',
          components: {}
        }
      };

      this.addToHistory(result);
      return result;
    }
  }

  /**
   * Check Elasticsearch health
   */
  private async checkElasticsearch(): Promise<ComponentHealth> {
    const startTime = Date.now();
    const timestamp = new Date().toISOString();

    try {
      const health = await elasticsearchService.checkHealth();
      
      return {
        name: 'elasticsearch',
        healthy: health.healthy,
        status: health.details.status,
        responseTime: Date.now() - startTime,
        lastChecked: timestamp,
        details: {
          connected: health.healthy,
          status: health.details.status,
          documents: health.details.numberOfDocuments,
          size: health.details.sizeInBytes,
          cluster: health.details.clusterName
        }
      };
    } catch (error) {
      return {
        name: 'elasticsearch',
        healthy: false,
        status: 'error',
        responseTime: Date.now() - startTime,
        lastChecked: timestamp,
        details: {
          error: error instanceof Error ? error.message : 'Unknown error',
          connected: false
        }
      };
    }
  }

  /**
   * Check RabbitMQ health
   */
  private async checkRabbitMQ(): Promise<ComponentHealth> {
    const startTime = Date.now();
    const timestamp = new Date().toISOString();

    try {
      const connected = await rabbitmqConfig.checkConnection();
      // const consumerRunning = queueConsumer.isRunning(); // DEVRE DIŞI
      const consumerRunning = true; // Firebase consumer için placeholder

      return {
        name: 'rabbitmq',
        healthy: connected && consumerRunning,
        status: connected ? (consumerRunning ? 'connected' : 'consumer_stopped') : 'disconnected',
        responseTime: Date.now() - startTime,
        lastChecked: timestamp,
        details: {
          connected,
          consumer: {
            running: consumerRunning
          }
        }
      };
    } catch (error) {
      return {
        name: 'rabbitmq',
        healthy: false,
        status: 'error',
        responseTime: Date.now() - startTime,
        lastChecked: timestamp,
        details: {
          error: error instanceof Error ? error.message : 'Unknown error',
          connected: false,
          consumer: { running: false }
        }
      };
    }
  }

  /**
   * Check Database health
   */
  private async checkDatabase(): Promise<ComponentHealth> {
    const startTime = Date.now();
    const timestamp = new Date().toISOString();

    try {
      const connected = await supabaseConfig.checkConnection();
      
      if (!connected) {
        return {
          name: 'database',
          healthy: false,
          status: 'disconnected',
          responseTime: Date.now() - startTime,
          lastChecked: timestamp,
          details: {
            connected: false,
            error: 'Database connection failed'
          }
        };
      }

      // Get job metrics
      const { data: jobMetrics } = await supabaseConfig.getClient()
        .from('elasticsearch_sync_queue')
        .select('status')
        .then(result => {
          const metrics = {
            total: 0,
            pending: 0,
            processing: 0,
            completed: 0,
            failed: 0
          };
          
          if (result.data) {
            result.data.forEach(job => {
              metrics.total++;
              metrics[job.status as keyof typeof metrics]++;
            });
          }
          
          return { data: metrics };
        });

      return {
        name: 'database',
        healthy: true,
        status: 'connected',
        responseTime: Date.now() - startTime,
        lastChecked: timestamp,
        details: {
          connected: true,
          jobs: jobMetrics,
          errorRate: jobMetrics.failed / (jobMetrics.total || 1)
        }
      };
    } catch (error) {
      return {
        name: 'database',
        healthy: false,
        status: 'error',
        responseTime: Date.now() - startTime,
        lastChecked: timestamp,
        details: {
          error: error instanceof Error ? error.message : 'Unknown error',
          connected: false
        }
      };
    }
  }

  /**
   * Check Consumer health
   */
  private async checkConsumer(): Promise<ComponentHealth> {
    const startTime = Date.now();
    const timestamp = new Date().toISOString();

    try {
      // const isRunning = queueConsumer.isRunning(); // DEVRE DIŞI
      const isRunning = true; // Firebase consumer için placeholder

      return {
        name: 'consumer',
        healthy: isRunning,
        status: isRunning ? 'running' : 'stopped',
        responseTime: Date.now() - startTime,
        lastChecked: timestamp,
        details: {
          running: isRunning,
          queue: 'elasticsearch.sync'
        }
      };
    } catch (error) {
      return {
        name: 'consumer',
        healthy: false,
        status: 'error',
        responseTime: Date.now() - startTime,
        lastChecked: timestamp,
        details: {
          error: error instanceof Error ? error.message : 'Unknown error',
          running: false
        }
      };
    }
  }

  /**
   * Check Firebase Consumer health
   */
  private async checkFirebaseConsumer(): Promise<ComponentHealth> {
    const startTime = Date.now();
    const timestamp = new Date().toISOString();

    try {
      const isRunning = firebaseEventConsumer.isConsumerRunning();

      return {
        name: 'firebaseConsumer',
        healthy: isRunning,
        status: isRunning ? 'running' : 'stopped',
        responseTime: Date.now() - startTime,
        lastChecked: timestamp,
        details: {
          running: isRunning,
          queue: 'elasticsearch.sync',
          type: 'firebase_events'
        }
      };
    } catch (error) {
      return {
        name: 'firebaseConsumer',
        healthy: false,
        status: 'error',
        responseTime: Date.now() - startTime,
        lastChecked: timestamp,
        details: {
          error: error instanceof Error ? error.message : 'Unknown error',
          running: false
        }
      };
    }
  }

  /**
   * Check Circuit Breakers health
   */
  private async checkCircuitBreakers(): Promise<ComponentHealth> {
    const startTime = Date.now();
    const timestamp = new Date().toISOString();

    try {
      const circuitBreakerStatus = getCircuitBreakerStatus();
      const isHealthy = circuitBreakerStatus.elasticsearch.enabled && 
                       circuitBreakerStatus.rabbitmq.enabled;

      return {
        name: 'circuitBreakers',
        healthy: isHealthy,
        status: isHealthy ? 'enabled' : 'disabled',
        responseTime: Date.now() - startTime,
        lastChecked: timestamp,
        details: circuitBreakerStatus
      };
    } catch (error) {
      return {
        name: 'circuitBreakers',
        healthy: false,
        status: 'error',
        responseTime: Date.now() - startTime,
        lastChecked: timestamp,
        details: {
          error: error instanceof Error ? error.message : 'Unknown error',
          elasticsearch: { enabled: false },
          rabbitmq: { enabled: false }
        }
      };
    }
  }

  /**
   * Add health check result to history
   */
  private addToHistory(result: HealthCheckResult): void {
    this.healthHistory.unshift(result);
    
    // Keep only last maxHistorySize results
    if (this.healthHistory.length > this.maxHistorySize) {
      this.healthHistory = this.healthHistory.slice(0, this.maxHistorySize);
    }
  }

  /**
   * Get health history
   */
  public getHealthHistory(): HealthCheckResult[] {
    return this.healthHistory;
  }

  /**
   * Get health trends
   */
  public getHealthTrends(): {
    uptime: number;
    averageResponseTime: number;
    healthScore: number;
    last24Hours: {
      healthy: number;
      degraded: number;
      unhealthy: number;
    };
  } {
    const now = Date.now();
    const last24Hours = this.healthHistory.filter(
      result => now - new Date(result.timestamp).getTime() < 24 * 60 * 60 * 1000
    );

    const healthy = last24Hours.filter(r => r.status === 'healthy').length;
    const degraded = last24Hours.filter(r => r.status === 'degraded').length;
    const unhealthy = last24Hours.filter(r => r.status === 'unhealthy').length;

    const averageResponseTime = last24Hours.length > 0 
      ? last24Hours.reduce((sum, r) => sum + r.duration, 0) / last24Hours.length
      : 0;

    const healthScore = last24Hours.length > 0 
      ? (healthy / last24Hours.length) * 100
      : 100;

    return {
      uptime: process.uptime(),
      averageResponseTime,
      healthScore,
      last24Hours: {
        healthy,
        degraded,
        unhealthy
      }
    };
  }
}

export const healthService = HealthService.getInstance();
export default healthService;
