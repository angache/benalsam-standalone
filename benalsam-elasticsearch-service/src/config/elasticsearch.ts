import { Client } from '@elastic/elasticsearch';
import logger from './logger';

// Elasticsearch index ayarları
export const ES_INDEX_SETTINGS = {
  number_of_shards: 1,
  number_of_replicas: 1,
  analysis: {
    analyzer: {
      turkish_analyzer: {
        type: 'custom',
        tokenizer: 'standard',
        filter: [
          'lowercase',
          'turkish_stemmer',
          'turkish_stop',
          'apostrophe',
          'asciifolding'
        ]
      }
    },
    filter: {
      turkish_stop: {
        type: 'stop',
        stopwords: '_turkish_'
      },
      turkish_stemmer: {
        type: 'stemmer',
        language: 'turkish'
      }
    }
  }
};

// Elasticsearch mapping
export const ES_MAPPING = {
  properties: {
    id: { type: 'keyword' },
    title: {
      type: 'text',
      analyzer: 'turkish_analyzer',
      fields: {
        keyword: { type: 'keyword' }
      }
    },
    description: {
      type: 'text',
      analyzer: 'turkish_analyzer'
    },
    price: { type: 'double' },
    currency: { type: 'keyword' },
    status: { type: 'keyword' },
    category_id: { type: 'keyword' },
    user_id: { type: 'keyword' },
    attributes: { type: 'object' },
    images: { type: 'keyword' },
    location: {
      properties: {
        lat: { type: 'double' },
        lon: { type: 'double' },
        city: { type: 'keyword' },
        district: { type: 'keyword' }
      }
    },
    created_at: { type: 'date' },
    updated_at: { type: 'date' },
    version: { type: 'long' }
  }
};

class ElasticsearchConfig {
  private static instance: ElasticsearchConfig;
  private client: Client | null = null;

  private constructor() {}

  public static getInstance(): ElasticsearchConfig {
    if (!ElasticsearchConfig.instance) {
      ElasticsearchConfig.instance = new ElasticsearchConfig();
    }
    return ElasticsearchConfig.instance;
  }

  public async getClient(): Promise<Client> {
    if (!this.client) {
      this.client = new Client({
        node: process.env.ELASTICSEARCH_URL || 'http://209.227.228.96:9200',
        auth: {
          username: process.env.ELASTICSEARCH_USERNAME || '',
          password: process.env.ELASTICSEARCH_PASSWORD || ''
        },
        maxRetries: 3,
        requestTimeout: 10000,
        sniffOnStart: false
      });

      try {
        // Test connection
        const health = await this.client.cluster.health();
        logger.info(`✅ Connected to Elasticsearch cluster: ${health.cluster_name}`);
        logger.info(`📊 Cluster status: ${health.status}`);
      } catch (error) {
        logger.error('❌ Failed to connect to Elasticsearch:', error);
        throw error;
      }
    }
    return this.client;
  }

  public async closeConnection(): Promise<void> {
    if (this.client) {
      await this.client.close();
      this.client = null;
      logger.info('✅ Elasticsearch connection closed');
    }
  }

  public async checkConnection(): Promise<boolean> {
    try {
      const client = await this.getClient();
      const health = await client.cluster.health();
      return health.status !== 'red';
    } catch (error) {
      logger.error('❌ Elasticsearch health check failed:', error);
      return false;
    }
  }

  public async initializeIndex(indexName: string): Promise<void> {
    try {
      const client = await this.getClient();
      
      // Check if index exists
      const indexExists = await client.indices.exists({ index: indexName });
      
      if (!indexExists) {
        // Create index with settings and mapping
        await client.indices.create({
          index: indexName,
          body: {
            settings: ES_INDEX_SETTINGS,
            mappings: ES_MAPPING
          }
        });
        logger.info(`✅ Created index: ${indexName}`);
      } else {
        // Update mapping if index exists
        await client.indices.putMapping({
          index: indexName,
          body: ES_MAPPING
        });
        logger.info(`✅ Updated mapping for index: ${indexName}`);
      }
    } catch (error) {
      logger.error(`❌ Failed to initialize index ${indexName}:`, error);
      throw error;
    }
  }
}

export const elasticsearchConfig = ElasticsearchConfig.getInstance();
export default elasticsearchConfig;
