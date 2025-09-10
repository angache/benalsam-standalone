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
   * İlan sil
   */
  public async deleteListing(id: string): Promise<void> {
    try {
      const client = await this.getClient();

      await client.delete({
        index: this.indexName,
        id: id,
        refresh: true,
        timeout: '30s'
      });

      logger.info(`✅ Deleted listing: ${id}`);
    } catch (error) {
      logger.error(`❌ Failed to delete listing ${id}:`, error);
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
   * İlan ara
   */
  public async searchListings(params: ListingSearchParams): Promise<{
    hits: ListingData[];
    total: number;
    aggregations?: any;
  }> {
    try {
      const client = await this.getClient();

      // Query body oluştur
      const body: any = {
        query: {
          bool: {
            must: [],
            filter: []
          }
        },
        from: (params.page || 0) * (params.limit || 10),
        size: params.limit || 10
      };

      // Full text search
      if (params.query) {
        body.query.bool.must.push({
          multi_match: {
            query: params.query,
            fields: ['title^2', 'description'],
            type: 'most_fields',
            fuzziness: 'AUTO'
          }
        });
      }

      // Kategori filtresi
      if (params.category) {
        body.query.bool.filter.push({
          term: { category_id: params.category }
        });
      }

      // Fiyat aralığı
      if (params.priceRange) {
        const range: any = {};
        if (params.priceRange.min !== undefined) {
          range.gte = params.priceRange.min;
        }
        if (params.priceRange.max !== undefined) {
          range.lte = params.priceRange.max;
        }
        if (Object.keys(range).length > 0) {
          body.query.bool.filter.push({
            range: { price: range }
          });
        }
      }

      // Lokasyon filtresi
      if (params.location) {
        body.query.bool.filter.push({
          geo_distance: {
            distance: `${params.location.radius}km`,
            location: {
              lat: params.location.lat,
              lon: params.location.lon
            }
          }
        });
      }

      // Durum filtresi
      if (params.status) {
        body.query.bool.filter.push({
          term: { status: params.status }
        });
      }

      // Özel attribute filtreleri
      if (params.attributes) {
        Object.entries(params.attributes).forEach(([key, value]) => {
          body.query.bool.filter.push({
            term: { [`attributes.${key}`]: value }
          });
        });
      }

      // Sıralama
      if (params.sort) {
        body.sort = [
          { [params.sort.field]: { order: params.sort.order } }
        ];
      }

      // Arama yap
      const response = await client.search({
        index: this.indexName,
        body
      });

      return {
        hits: response.hits.hits.map(hit => ({
          ...hit._source as ListingData,
          score: hit._score
        })),
        total: response.hits.total as number,
        aggregations: response.aggregations
      };

    } catch (error) {
      logger.error('❌ Failed to search listings:', error);
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
}

export const elasticsearchService = ElasticsearchService.getInstance();
export default elasticsearchService;
