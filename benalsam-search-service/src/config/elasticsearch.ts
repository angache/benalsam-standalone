import { Client } from '@elastic/elasticsearch';
import { logger } from './logger';
import { elasticsearchCircuitBreaker } from '../utils/circuitBreaker';

class ElasticsearchConfig {
  private client: Client | null = null;
  private isConnected: boolean = false;

  constructor() {
    this.initializeClient();
  }

  private initializeClient() {
    try {
      // console.log('🔍 [DEBUG] ELASTICSEARCH_URL:', process.env.ELASTICSEARCH_URL);
      const config: any = {
        node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200',
        requestTimeout: 30000,
        maxRetries: 3,
        resurrectStrategy: 'ping'
      };

      // Add authentication if provided
      if (process.env.ELASTICSEARCH_USERNAME && process.env.ELASTICSEARCH_PASSWORD) {
        config.auth = {
          username: process.env.ELASTICSEARCH_USERNAME,
          password: process.env.ELASTICSEARCH_PASSWORD
        };
      }

      this.client = new Client(config);
      
      logger.info('Elasticsearch client initialized', {
        url: config.node,
        hasAuth: !!(config.auth)
      });
    } catch (error) {
      logger.error('Failed to initialize Elasticsearch client:', error);
      throw error;
    }
  }

  async connect(): Promise<boolean> {
    if (!this.client) {
      throw new Error('Elasticsearch client not initialized');
    }

    return await elasticsearchCircuitBreaker.execute(async () => {
      try {
        // Use info() instead of ping() for better compatibility
        const response = await this.client!.info();
        this.isConnected = true;
        
        logger.info('✅ Elasticsearch connection verified', {
          connected: this.isConnected,
          clusterName: response.cluster_name,
          version: response.version?.number
        });
        
        return true;
      } catch (error) {
        this.isConnected = false;
        logger.error('❌ Elasticsearch connection failed:', {
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        throw error;
      }
    }, 'elasticsearch-connect');
  }

  getClient(): Client {
    if (!this.client) {
      throw new Error('Elasticsearch client not initialized');
    }
    return this.client;
  }

  isElasticsearchAvailable(): boolean {
    return this.isConnected;
  }

  async healthCheck(): Promise<{ status: string; responseTime: number; circuitBreaker?: any }> {
    if (!this.client) {
      return { status: 'unhealthy', responseTime: 0 };
    }

    return await elasticsearchCircuitBreaker.execute(async () => {
      const startTime = Date.now();
      try {
        await this.client!.info();
        const responseTime = Date.now() - startTime;
        return { 
          status: 'healthy', 
          responseTime,
          circuitBreaker: elasticsearchCircuitBreaker.getMetrics()
        };
      } catch (error) {
        const responseTime = Date.now() - startTime;
        logger.error('Elasticsearch health check failed:', {
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        throw error;
      }
    }, 'elasticsearch-health-check');
  }

  getDefaultIndexName(): string {
    const prefix = process.env.ELASTICSEARCH_INDEX_PREFIX || 'benalsam';
    const defaultIndex = process.env.ELASTICSEARCH_DEFAULT_INDEX || 'listings';
    return `${prefix}_${defaultIndex}`;
  }

  /**
   * Close Elasticsearch connection
   */
  async closeConnection(): Promise<void> {
    try {
      if (this.client) {
        await this.client.close();
        this.client = null;
        this.isConnected = false;
        logger.info('✅ Elasticsearch connection closed gracefully');
      }
    } catch (error) {
      logger.error('❌ Error closing Elasticsearch connection:', error);
    }
  }
}

export const elasticsearchConfig = new ElasticsearchConfig();
export default elasticsearchConfig;
