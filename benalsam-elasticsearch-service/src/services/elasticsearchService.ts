import { Client } from '@elastic/elasticsearch';
import { elasticsearchConfig, ES_SETTINGS, ES_MAPPINGS } from '../config/elasticsearch';
import { ListingData, ListingSearchParams } from '../types/listing';
import logger from '../config/logger';

class ElasticsearchService {
  private static instance: ElasticsearchService;
  private client: Client | null = null;
  private readonly indexName: string = 'benalsam_listings';
  private readonly maxRetries: number = 3;
  private readonly retryDelay: number = 1000; // 1 second

  private constructor() {}

  public static getInstance(): ElasticsearchService {
    if (!ElasticsearchService.instance) {
      ElasticsearchService.instance = new ElasticsearchService();
    }
    return ElasticsearchService.instance;
  }

  /**
   * Client'ı al veya oluştur
   */
  private async getClient(): Promise<Client> {
    if (!this.client) {
      this.client = await elasticsearchConfig.getClient();
    }
    return this.client;
  }

  /**
   * Index'i başlat
   */
  public async initializeIndex(): Promise<void> {
    try {
      const client = await this.getClient();
      
      // Index var mı kontrol et
      const indexExists = await client.indices.exists({
        index: this.indexName
      });

      if (!indexExists) {
        // Index oluştur
        await client.indices.create({
          index: this.indexName,
          body: {
            settings: ES_SETTINGS,
            mappings: ES_MAPPINGS
          }
        });
        logger.info(`✅ Created index: ${this.indexName}`);
      } else {
        // Mapping'i güncelle
        await client.indices.putMapping({
          index: this.indexName,
          body: ES_MAPPINGS
        });
        logger.info(`✅ Updated mapping for index: ${this.indexName}`);
      }
    } catch (error) {
      logger.error(`❌ Failed to initialize index ${this.indexName}:`, error);
      throw error;
    }
  }

  /**
   * İlan ekle
   */
  public async insertListing(listing: ListingData): Promise<void> {
    try {
      const client = await this.getClient();
      
      await client.index({
        index: this.indexName,
        id: listing.id,
        body: listing,
        refresh: true,
        timeout: '30s'
      });

      logger.info(`✅ Inserted listing: ${listing.id}`);
    } catch (error) {
      logger.error(`❌ Failed to insert listing ${listing.id}:`, error);
      throw error;
    }
  }

  /**
   * İlan güncelle
   */
  public async updateListing(id: string, listing: Partial<ListingData>): Promise<void> {
    try {
      const client = await this.getClient();

      // Önce ilanın var olduğunu kontrol et
      const exists = await client.exists({
        index: this.indexName,
        id: id
      });

      if (!exists) {
        throw new Error(`Listing ${id} not found`);
      }

      // İlanı güncelle
      await client.update({
        index: this.indexName,
        id: id,
        body: {
          doc: listing,
          doc_as_upsert: true
        },
        refresh: true,
        timeout: '30s'
      });

      logger.info(`✅ Updated listing: ${id}`);
    } catch (error) {
      logger.error(`❌ Failed to update listing ${id}:`, error);
      throw error;
    }
  }


  /**
   * Bulk operasyon
   */
  public async bulkOperation(operations: Array<{
    action: 'index' | 'update' | 'delete';
    id: string;
    data?: ListingData | Partial<ListingData>;
  }>): Promise<void> {
    try {
      const client = await this.getClient();
      const body: any[] = [];

      // Bulk body oluştur
      operations.forEach(op => {
        switch (op.action) {
          case 'index':
            body.push(
              { index: { _index: this.indexName, _id: op.id } },
              op.data
            );
            break;
          case 'update':
            body.push(
              { update: { _index: this.indexName, _id: op.id } },
              { doc: op.data, doc_as_upsert: true }
            );
            break;
          case 'delete':
            body.push(
              { delete: { _index: this.indexName, _id: op.id } }
            );
            break;
        }
      });

      // Bulk operasyonu gerçekleştir
      const { items } = await client.bulk({
        refresh: true,
        body
      });

      // Hataları kontrol et
      const errors = items.filter(item => {
        const action = Object.keys(item)[0] as 'index' | 'update' | 'delete';
        const actionResult = item[action];
        return actionResult && 'error' in actionResult ? actionResult.error : undefined;
      });

      if (errors.length > 0) {
        logger.error(`❌ Bulk operation completed with ${errors.length} errors:`, errors);
        throw new Error(`Bulk operation failed with ${errors.length} errors`);
      }

      logger.info(`✅ Bulk operation completed successfully (${operations.length} operations)`);
    } catch (error) {
      logger.error('❌ Failed to perform bulk operation:', error);
      throw error;
    }
  }


  /**
   * Index'i yeniden oluştur
   */
  public async reindex(): Promise<void> {
    try {
      const client = await this.getClient();
      const tempIndex = `${this.indexName}_temp`;

      // Temp index oluştur
      await client.indices.create({
        index: tempIndex,
        body: {
                      settings: ES_SETTINGS,
            mappings: ES_MAPPINGS
        }
      });

      // Reindex
      await client.reindex({
        body: {
          source: {
            index: this.indexName
          },
          dest: {
            index: tempIndex
          }
        },
        refresh: true,
        timeout: '10m'
      });

      // Eski index'i sil
      await client.indices.delete({
        index: this.indexName
      });

      // Temp index'i yeniden adlandır
      await client.indices.putAlias({
        index: tempIndex,
        name: this.indexName
      });

      logger.info('✅ Reindex completed successfully');
    } catch (error) {
      logger.error('❌ Failed to reindex:', error);
      throw error;
    }
  }

  /**
   * Index sağlığını kontrol et
   */
  public async checkHealth(): Promise<{
    healthy: boolean;
    details: any;
  }> {
    try {
      const client = await this.getClient();

      // Index stats
      const stats = await client.indices.stats({
        index: this.indexName
      });

      // Index health
      const health = await client.cluster.health({
        index: this.indexName
      });

      return {
        healthy: health.status !== 'red',
        details: {
          status: health.status,
          numberOfDocuments: stats.indices?.[this.indexName]?.total?.docs?.count ?? 0,
          sizeInBytes: stats.indices?.[this.indexName]?.total?.store?.size_in_bytes ?? 0,
          health
        }
      };
    } catch (error) {
      logger.error('❌ Failed to check index health:', error);
      return {
        healthy: false,
        details: {
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }

  /**
   * Search listings
   */
  public async searchListings(params: {
    query: string;
    size?: number;
    from?: number;
    sort?: string;
    filters?: Record<string, any>;
  }): Promise<any> {
    try {
      const client = await this.getClient();
      const { query, size = 10, from = 0, sort, filters = {} } = params;

      // Build search query
      const searchQuery: any = {
        index: this.indexName,
        body: {
          query: query === '*' ? { match_all: {} } : {
            bool: {
              must: [
                {
                  multi_match: {
                    query,
                    fields: ['title^2', 'description', 'search_keywords'],
                    type: 'best_fields',
                    fuzziness: 'AUTO'
                  }
                }
              ],
              filter: []
            }
          },
          size,
          from,
          _source: true
        }
      };

      // Add filters
      if (filters.status) {
        searchQuery.body.query.bool.filter.push({
          term: { status: filters.status }
        });
      }
      if (filters.category) {
        searchQuery.body.query.bool.filter.push({
          term: { category: filters.category }
        });
      }

      // Add sorting
      if (sort) {
        searchQuery.body.sort = [
          { [sort]: { order: 'desc' } }
        ];
      } else {
        searchQuery.body.sort = [
          { _score: { order: 'desc' } }
        ];
      }

      const result = await client.search(searchQuery);

      return {
        took: result.took,
        timed_out: result.timed_out,
        _shards: result._shards,
        hits: {
          total: result.hits.total,
          max_score: result.hits.max_score,
          hits: result.hits.hits
        }
      };
    } catch (error) {
      logger.error('Elasticsearch search failed:', error);
      throw error;
    }
  }

  /**
   * Get listing by ID
   */
  public async getListingById(id: string): Promise<any> {
    try {
      const client = await this.getClient();
      
      const result = await client.get({
        index: this.indexName,
        id
      });

      return result._source;
    } catch (error) {
      if ((error as any).statusCode === 404) {
        return null;
      }
      logger.error('Elasticsearch get listing failed:', error);
      throw error;
    }
  }

  /**
   * Get search statistics
   */
  public async getSearchStats(): Promise<any> {
    try {
      const client = await this.getClient();
      
      const stats = await client.indices.stats({
        index: this.indexName
      });

      const health = await client.cluster.health({
        index: this.indexName
      });

      return {
        index: this.indexName,
        health: health.status,
        documents: stats.indices?.[this.indexName]?.total?.docs?.count || 0,
        size: stats.indices?.[this.indexName]?.total?.store?.size_in_bytes || 0,
        search: {
          query_total: stats.indices?.[this.indexName]?.total?.search?.query_total || 0,
          query_time_in_millis: stats.indices?.[this.indexName]?.total?.search?.query_time_in_millis || 0
        }
      };
    } catch (error) {
      logger.error('Elasticsearch get stats failed:', error);
      throw error;
    }
  }

  /**
   * İlanı Elasticsearch'e ekle/güncelle
   */
  public async upsertListing(listing: any): Promise<void> {
    try {
      const client = await this.getClient();
      
      // Search keywords oluştur
      const searchKeywords = [
        listing.title,
        listing.description,
        listing.category,
        listing.location
      ].filter(Boolean).join(' ');

      const listingData = {
        ...listing,
        search_keywords: searchKeywords,
        updated_at: new Date().toISOString()
      };

      await client.index({
        index: this.indexName,
        id: listing.id,
        body: listingData
      });

      logger.info('✅ Listing upserted to Elasticsearch', {
        id: listing.id,
        title: listing.title
      });

    } catch (error) {
      logger.error('❌ Error upserting listing to Elasticsearch:', error);
      throw error;
    }
  }

  /**
   * İlanı Elasticsearch'ten sil
   */
  public async deleteListing(listingId: string): Promise<void> {
    try {
      const client = await this.getClient();
      
      await client.delete({
        index: this.indexName,
        id: listingId
      });

      logger.info('✅ Listing deleted from Elasticsearch', {
        id: listingId
      });

    } catch (error) {
      if ((error as any).statusCode === 404) {
        logger.warn('⚠️ Listing not found in Elasticsearch', { id: listingId });
        return;
      }
      logger.error('❌ Error deleting listing from Elasticsearch:', error);
      throw error;
    }
  }
}

export const elasticsearchService = ElasticsearchService.getInstance();
export default elasticsearchService;
