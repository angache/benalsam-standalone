import { IElasticsearchService } from '../interfaces/ISearchService';
import elasticsearchConfig from '../config/elasticsearch';
import logger from '../config/logger';

/**
 * Elasticsearch Service Implementation
 * Elasticsearch işlemleri için abstraction
 */
export class ElasticsearchService implements IElasticsearchService {
  private client: any = null;
  private isAvailableFlag: boolean = false;

  constructor() {
    this.initializeClient();
  }

  private async initializeClient(): Promise<void> {
    try {
      this.client = elasticsearchConfig.getClient();
      this.isAvailableFlag = await elasticsearchConfig.connect();
    } catch (error) {
      logger.error('Failed to initialize Elasticsearch client:', error);
      this.isAvailableFlag = false;
    }
  }

  isAvailable(): boolean {
    return this.isAvailableFlag;
  }

  async search(index: string, query: any): Promise<any> {
    if (!this.isAvailable()) {
      throw new Error('Elasticsearch is not available');
    }

    try {
      const response = await this.client.search({
        index,
        ...query
      });

      return response;
    } catch (error) {
      logger.error('Elasticsearch search failed:', error);
      throw error;
    }
  }

  async healthCheck(): Promise<{ status: string; responseTime: number }> {
    const startTime = Date.now();
    
    try {
      if (!this.isAvailable()) {
        return { status: 'unhealthy', responseTime: 0 };
      }

      await this.client.info();
      const responseTime = Date.now() - startTime;
      
      return { status: 'healthy', responseTime };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      logger.error('Elasticsearch health check failed:', error);
      return { status: 'unhealthy', responseTime };
    }
  }

  getDefaultIndexName(): string {
    return elasticsearchConfig.getDefaultIndexName();
  }
}
