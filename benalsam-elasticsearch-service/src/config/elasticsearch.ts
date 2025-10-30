import { Client } from '@elastic/elasticsearch';
import { IndicesCreateRequest, MappingProperty, IndicesIndexSettings } from '@elastic/elasticsearch/lib/api/types';
import { SearchOptimizedListing } from 'benalsam-shared-types';
import logger from './logger';

// Elasticsearch index ayarları
export const ES_SETTINGS: IndicesIndexSettings = {
  analysis: {
    analyzer: {
      turkish_analyzer: {
        type: 'custom',
        tokenizer: 'standard',
        filter: ['lowercase', 'turkish_stop', 'turkish_lowercase', 'turkish_stemmer']
      }
    }
  },
  number_of_shards: 1,
  number_of_replicas: 1
};

// Elasticsearch mapping - SearchOptimizedListing tipine göre
export const ES_MAPPINGS: { properties: Record<string, MappingProperty> } = {
  properties: {
              // Temel alanlar
          id: { type: 'keyword' } as MappingProperty,
          user_id: { type: 'keyword' } as MappingProperty,
          title: {
            type: 'text',
            analyzer: 'turkish_analyzer',
            fields: {
              keyword: { type: 'keyword' }
            }
          } as MappingProperty,
          description: {
            type: 'text',
            analyzer: 'turkish_analyzer'
          } as MappingProperty,

          // Kategori alanları
          category: { type: 'text' } as MappingProperty, // Match existing: text with keyword subfield
          category_id: { type: 'long' } as MappingProperty, // Match existing: long
          category_path: { type: 'long' } as MappingProperty, // Match existing: long
          subcategory: { type: 'keyword' } as MappingProperty,

          // Bütçe alanı
          budget: { type: 'long' } as MappingProperty,

          // Lokasyon alanları
          location: { type: 'keyword' } as MappingProperty,
          province: { type: 'keyword' } as MappingProperty,
          district: { type: 'keyword' } as MappingProperty,
          neighborhood: { type: 'keyword' } as MappingProperty,
          coordinates: { type: 'geo_point' } as MappingProperty,

          // Diğer temel alanlar
          condition: { type: 'text' } as MappingProperty, // Match existing: text with keyword subfield
          urgency: { type: 'text' } as MappingProperty, // Match existing: text with keyword subfield
          main_image_url: { type: 'keyword' } as MappingProperty,
          additional_image_urls: { type: 'keyword' } as MappingProperty,
          status: { type: 'keyword' } as MappingProperty,
          created_at: { type: 'date' } as MappingProperty,
          updated_at: { type: 'date' } as MappingProperty,

          // Esnek attributes alanı
          attributes: {
            type: 'object',
            dynamic: true
          } as MappingProperty,

          // Arama optimizasyonu alanları
          search_keywords: {
            type: 'text',
            analyzer: 'turkish_analyzer'
          } as MappingProperty,
          popularity_score: { type: 'long' } as MappingProperty, // Changed from float to long
          user_trust_score: { type: 'long' } as MappingProperty  // Changed from float to long
  }
} as const;

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
        maxRetries: 5,
        requestTimeout: 30000, // 30 saniye
        pingTimeout: 10000, // 10 saniye
        sniffOnStart: false,
        sniffOnConnectionFault: false,
        resurrectStrategy: 'ping'
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
            settings: {
              analysis: {
                filter: {
                  turkish_lowercase: {
                    type: "lowercase",
                    language: "turkish"
                  },
                  turkish_stop: {
                    type: "stop",
                    stopwords: "_turkish_"
                  },
                  turkish_stemmer: {
                    type: "stemmer",
                    language: "turkish"
                  }
                },
                analyzer: {
                  turkish_analyzer: {
                    type: "custom",
                    tokenizer: "standard",
                    filter: [
                      "turkish_lowercase",
                      "turkish_stop",
                      "turkish_stemmer"
                    ]
                  }
                }
              },
              number_of_shards: 1,
              number_of_replicas: 1
            },
            mappings: ES_MAPPINGS
          }
        });
        logger.info(`✅ Created index: ${indexName}`);
      } else {
        // Update mapping if index exists
        await client.indices.close({ index: indexName });
        
        // Update settings
        await client.indices.putSettings({
          index: indexName,
          body: {
            analysis: {
              filter: {
                turkish_lowercase: {
                  type: "lowercase",
                  language: "turkish"
                },
                turkish_stop: {
                  type: "stop",
                  stopwords: "_turkish_"
                },
                turkish_stemmer: {
                  type: "stemmer",
                  language: "turkish"
                }
              },
              analyzer: {
                turkish_analyzer: {
                  type: "custom",
                  tokenizer: "standard",
                  filter: [
                    "turkish_lowercase",
                    "turkish_stop",
                    "turkish_stemmer"
                  ]
                }
              }
            }
          }
        });

        // DO NOT update mapping on existing index (causes conflicts)
        // Mapping updates are not allowed in Elasticsearch
        // await client.indices.putMapping({
        //   index: indexName,
        //   body: ES_MAPPINGS
        // });

        // Open index
        await client.indices.open({ index: indexName });
        
        logger.info(`✅ Index already exists, using existing mapping: ${indexName}`);
      }
    } catch (error) {
      logger.error(`❌ Failed to initialize index ${indexName}:`, error);
      throw error;
    }
  }
}

export const elasticsearchConfig = ElasticsearchConfig.getInstance();
export default elasticsearchConfig;
