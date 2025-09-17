import { Client } from '@elastic/elasticsearch';
import logger from '../config/logger';
import { SearchOptimizedListing } from 'benalsam-shared-types';
import searchCacheService from './searchCacheService';
import { createClient } from '@supabase/supabase-js';
import cacheManager from './cacheManager';
import { 
  SupabaseClient, 
  ElasticsearchIndexMapping, 
  SearchQuery, 
  SearchParameters, 
  SearchResult, 
  IndexStats, 
  HealthCheckResult,
  ELASTICSEARCH_INDEXES,
  ELASTICSEARCH_ANALYZERS,
  ELASTICSEARCH_SORT_OPTIONS
} from '../types/elasticsearch';

export class AdminElasticsearchService {
  protected client: Client;
  protected defaultIndexName: string;
  protected isConnected: boolean = false;
  protected supabase: any; // TODO: Fix SupabaseClient type compatibility

  constructor(
    node: string = process.env.ELASTICSEARCH_URL || 'http://209.227.228.96:9200',
    defaultIndexName: string = 'listings',
    username: string = process.env.ELASTICSEARCH_USERNAME || '',
    password: string = process.env.ELASTICSEARCH_PASSWORD || ''
  ) {
    this.defaultIndexName = defaultIndexName;
    this.client = new Client({
      node,
      auth: username && password ? { username, password } : undefined,
      tls: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined
    });
    
    // ✅ Supabase client'ı başlat
    this.supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }



  private getListingsIndexMapping(): ElasticsearchIndexMapping {
    return {
      settings: {
        analysis: {
          analyzer: {
            turkish_analyzer: {
              type: 'turkish'
            }
          }
        },
        number_of_shards: 1,
        number_of_replicas: 0
      },
      mappings: {
        properties: {
          id: { type: 'keyword' },
          user_id: { type: 'keyword' },
          title: { type: 'text', analyzer: 'turkish_analyzer' },
          description: { type: 'text', analyzer: 'turkish_analyzer' },
          category: { type: 'keyword' },
          category_id: { type: 'integer' },
          category_path: { type: 'integer' },
          subcategory: { type: 'keyword' },
          
          // Temel alanlar
          budget: { type: 'integer' },
          location: {
            type: 'object',
            properties: {
              province: { type: 'keyword' },
              district: { type: 'keyword' },
              neighborhood: { type: 'keyword' },
              coordinates: { type: 'geo_point' }
            }
          },
          condition: { type: 'keyword' },
          urgency: { type: 'keyword' },
          main_image_url: { type: 'keyword' },
          additional_image_urls: { type: 'keyword' },
          status: { type: 'keyword' },
          created_at: { type: 'date' },
          updated_at: { type: 'date' },
          
          // Esnek attributes
          attributes: {
            type: 'object',
            dynamic: true,
            properties: {
              // Sık kullanılan attribute'lar için özel mapping
              brand: { type: 'keyword' },
              model: { type: 'keyword' },
              ram: { type: 'keyword' },
              storage: { type: 'keyword' },
              color: { type: 'keyword' },
              size: { type: 'keyword' },
              year: { type: 'integer' },
              rooms: { type: 'integer' },
              square_meters: { type: 'float' },
              mileage: { type: 'integer' },
              fuel_type: { type: 'keyword' },
              transmission: { type: 'keyword' },
              material: { type: 'keyword' },
              warranty: { type: 'keyword' },
              original_box: { type: 'boolean' },
              furnished: { type: 'boolean' },
              parking: { type: 'boolean' },
              balcony: { type: 'boolean' },
              elevator: { type: 'boolean' },
              air_conditioning: { type: 'boolean' },
              energy_class: { type: 'keyword' },
              engine_size: { type: 'keyword' },
              body_type: { type: 'keyword' },
              doors: { type: 'integer' },
              seats: { type: 'integer' },
              bathrooms: { type: 'integer' },
              floor: { type: 'integer' },
              total_floors: { type: 'integer' },
              heating: { type: 'keyword' },
              building_type: { type: 'keyword' },
              view: { type: 'keyword' },
              floor_heating: { type: 'boolean' },
              security_system: { type: 'boolean' },
              garden: { type: 'boolean' },
              land_type: { type: 'keyword' },
              zoning: { type: 'keyword' },
              utilities: { type: 'keyword' },
              road_access: { type: 'boolean' },
              clothing_type: { type: 'keyword' },
              fit: { type: 'keyword' },
              original_price: { type: 'float' },
              sport_type: { type: 'keyword' },
              rarity: { type: 'keyword' },
              autographed: { type: 'boolean' },
              limited_edition: { type: 'boolean' },
              author: { type: 'text', analyzer: 'turkish_analyzer' },
              publisher: { type: 'keyword' },
              isbn: { type: 'keyword' },
              language: { type: 'keyword' },
              format: { type: 'keyword' },
              genre: { type: 'keyword' },
              pages: { type: 'integer' },
              subject: { type: 'keyword' },
              edition: { type: 'keyword' },
              service_type: { type: 'keyword' },
              experience_years: { type: 'integer' },
              certification: { type: 'keyword' },
              availability: { type: 'keyword' },
              location_type: { type: 'keyword' },
              languages: { type: 'keyword' },
              portfolio_url: { type: 'keyword' },
              references: { type: 'boolean' },
              insurance: { type: 'boolean' },
              payment_methods: { type: 'keyword' },
              hourly_rate: { type: 'float' },
              instrument_type: { type: 'keyword' },
              case_included: { type: 'boolean' },
              equipment_type: { type: 'keyword' },
              power_output: { type: 'keyword' },
              connectivity: { type: 'keyword' },
              artist: { type: 'text', analyzer: 'turkish_analyzer' },
              style: { type: 'keyword' },
              medium: { type: 'keyword' },
              dimensions: { type: 'object' },
              framed: { type: 'boolean' },
              year_created: { type: 'integer' },
              weight: { type: 'float' },
              craft_type: { type: 'keyword' },
              handmade: { type: 'boolean' },
              techniques: { type: 'keyword' },
              period: { type: 'keyword' },
              provenance: { type: 'text' },
              age: { type: 'integer' },
              toy_type: { type: 'keyword' },
              age_range: { type: 'keyword' },
              educational: { type: 'boolean' },
              safety_certified: { type: 'boolean' },
              platform: { type: 'keyword' },
              manual: { type: 'boolean' },
              region: { type: 'keyword' },
              player_count: { type: 'keyword' },
              aid_type: { type: 'keyword' },
              weight_capacity: { type: 'keyword' },
              adjustable: { type: 'boolean' }
            }
          },
          
          // Search optimization
          search_keywords: { type: 'keyword' },
          popularity_score: { type: 'float' },
          user_trust_score: { type: 'float' }
        }
      }
    };
  }

  private getUserBehaviorsIndexMapping() {
    return {
      settings: {
        analysis: {
          analyzer: {
            turkish_analyzer: {
              type: 'turkish'
            }
          }
        },
        number_of_shards: 1,
        number_of_replicas: 0
      },
      mappings: {
        properties: {
          event_id: { type: 'keyword' },
          event_name: { type: 'keyword' },
          event_timestamp: { type: 'date' },
          event_properties: { type: 'object', dynamic: true },
          
          user: {
            type: 'object',
            properties: {
              id: { type: 'keyword' },
              email: { type: 'keyword' },
              name: { type: 'text', analyzer: 'turkish_analyzer' },
              avatar: { type: 'keyword' },
              properties: {
                type: 'object',
                properties: {
                  registration_date: { type: 'date' },
                  subscription_type: { type: 'keyword' },
                  last_login: { type: 'date' },
                  trust_score: { type: 'float' },
                  verification_status: { type: 'keyword' }
                }
              }
            }
          },
          
          session: {
            type: 'object',
            properties: {
              id: { type: 'keyword' },
              start_time: { type: 'date' },
              duration: { type: 'long' },
              page_views: { type: 'integer' },
              events_count: { type: 'integer' }
            }
          },
          
          device: {
            type: 'object',
            properties: {
              platform: { type: 'keyword' },
              version: { type: 'keyword' },
              model: { type: 'keyword' },
              screen_resolution: { type: 'keyword' },
              app_version: { type: 'keyword' },
              os_version: { type: 'keyword' },
              browser: { type: 'keyword' },
              user_agent: { type: 'text' }
            }
          },
          
          context: {
            type: 'object',
            properties: {
              ip_address: { type: 'keyword' },
              user_agent: { type: 'text' },
              referrer: { type: 'keyword' },
              utm_source: { type: 'keyword' },
              utm_medium: { type: 'keyword' },
              utm_campaign: { type: 'keyword' },
              utm_term: { type: 'keyword' },
              utm_content: { type: 'keyword' },
              language: { type: 'keyword' },
              timezone: { type: 'keyword' }
            }
          }
        }
      }
    };
  }

  // Static methods for health checks
  static async getAllIndicesStats(): Promise<any> {
    try {
          const client = new Client({ 
      node: process.env.ELASTICSEARCH_URL || 'http://209.227.228.96:9200',
      auth: process.env.ELASTICSEARCH_USERNAME && process.env.ELASTICSEARCH_PASSWORD ? {
          username: process.env.ELASTICSEARCH_USERNAME,
          password: process.env.ELASTICSEARCH_PASSWORD
        } : undefined,
        tls: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined
      });

      const response = await client.indices.stats();
      return response;
    } catch (error) {
      logger.error('Error getting indices stats:', error);
      throw error;
    }
  }

  static async searchIndexStatic(indexName: string, options: { size?: number } = {}): Promise<any> {
    try {
      const client = new Client({ 
        node: process.env.ELASTICSEARCH_URL || 'http://209.227.228.96:9200',
        auth: process.env.ELASTICSEARCH_USERNAME && process.env.ELASTICSEARCH_PASSWORD ? {
          username: process.env.ELASTICSEARCH_USERNAME,
          password: process.env.ELASTICSEARCH_PASSWORD
        } : undefined,
        tls: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined
      });
      
      // Check if index exists and get mapping
      const indexExists = await client.indices.exists({ index: indexName });
      if (!indexExists) {
        logger.warn(`Index ${indexName} does not exist`);
        return { hits: { hits: [], total: { value: 0 } } };
      }

      // Get index mapping to check available fields
      const mapping = await client.indices.getMapping({ index: indexName });
      const fields = Object.keys(mapping[indexName].mappings.properties || {});
      
      // Determine sort field based on available fields
      let sortField = null;
      if (fields.includes('timestamp')) {
        sortField = 'timestamp';
      } else if (fields.includes('created_at')) {
        sortField = 'created_at';
      } else if (fields.includes('updated_at')) {
        sortField = 'updated_at';
      } else if (fields.includes('createdAt')) {
        sortField = 'createdAt';
      }
      
      const searchBody: SearchQuery = {
        query: {
          match_all: {}
        }
      };
      
      // Only add sort if we have a valid sort field
      if (sortField) {
        searchBody.sort = [
          { [sortField]: { order: 'desc' } }
        ];
      }
      
      const response = await client.search({
        index: indexName,
        size: options.size || 10,
        body: searchBody
      });
      
      return response;
    } catch (error) {
      logger.error(`Error searching index ${indexName}:`, error);
      throw error;
    }
  }

  // Instance methods
  getClient() {
    return this.client;
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await this.client.ping();
      this.isConnected = response;
      return response;
    } catch (error) {
      logger.error('Elasticsearch connection test failed:', error);
      this.isConnected = false;
      return false;
    }
  }

  async getHealth(): Promise<any> {
    try {
      return await this.client.cluster.health();
    } catch (error) {
      logger.error('Error getting cluster health:', error);
      throw error;
    }
  }

  async createIndex(indexName?: string, mapping?: any): Promise<boolean> {
    try {
      const targetIndex = indexName || this.defaultIndexName;
      
      // Use enhanced mapping based on index name
      let enhancedMapping = mapping;
      if (!mapping) {
        if (targetIndex === 'benalsam_listings') {
          enhancedMapping = this.getListingsIndexMapping();
        } else if (targetIndex === 'user_behaviors') {
          enhancedMapping = this.getUserBehaviorsIndexMapping();
        }
      }

      await this.client.indices.create({
        index: targetIndex,
        body: enhancedMapping
      });
      return true;
    } catch (error) {
      logger.error('Create index error:', error);
      return false;
    }
  }

  async deleteIndex(indexName?: string): Promise<boolean> {
    try {
      const targetIndex = indexName || this.defaultIndexName;
      await this.client.indices.delete({
        index: targetIndex
      });
      return true;
    } catch (error) {
      logger.error('Delete index error:', error);
      return false;
    }
  }

  async recreateIndex(indexName?: string, mapping?: any): Promise<boolean> {
    try {
    const targetIndex = indexName || this.defaultIndexName;
    await this.deleteIndex(targetIndex);
      await this.createIndex(targetIndex, mapping);
      return true;
    } catch (error) {
      logger.error('Recreate index error:', error);
      return false;
    }
  }

  async bulkIndex(documents: SearchOptimizedListing[], indexName?: string): Promise<boolean> {
    try {
      const targetIndex = indexName || this.defaultIndexName;
      const operations = documents.flatMap(doc => [
        { index: { _index: targetIndex, _id: doc.id } },
        doc
      ]);

      const response = await this.client.bulk({ body: operations });
      
      if (response.errors) {
        const errors = response.items
          .filter((item: any) => item.index?.error)
          .map((item: any) => item.index.error);
        logger.error('Bulk index errors:', errors);
        return false;
      }
      
      return true;
    } catch (error) {
      logger.error('Bulk index error:', error);
      return false;
    }
  }

  async indexDocument(id: string, document: SearchOptimizedListing, indexName?: string): Promise<boolean> {
    try {
      const targetIndex = indexName || this.defaultIndexName;
      await this.client.index({
        index: targetIndex,
        id,
        body: document
      });
      return true;
    } catch (error) {
      logger.error('Index document error:', error);
      return false;
    }
  }

  async updateDocument(id: string, document: Partial<SearchOptimizedListing>, indexName?: string): Promise<boolean> {
    try {
      const targetIndex = indexName || this.defaultIndexName;
      await this.client.update({
        index: targetIndex,
        id,
        body: {
          doc: document
        }
      });
      return true;
    } catch (error) {
      logger.error('Update document error:', error);
      return false;
    }
  }

  async deleteDocument(id: string, indexName?: string): Promise<boolean> {
    try {
      const targetIndex = indexName || this.defaultIndexName;
      await this.client.delete({
        index: targetIndex,
        id
      });
      return true;
    } catch (error) {
      logger.error('Delete document error:', error);
      return false;
    }
  }

  async search(query: any, indexName?: string): Promise<any> {
    try {
      const targetIndex = indexName || this.defaultIndexName;
      const response = await this.client.search({
        index: targetIndex,
        body: query
      });
      return response;
    } catch (error) {
      logger.error('Search error:', error);
      throw error;
    }
  }

  async searchIndex(indexName: string, options: { size?: number } = {}): Promise<any> {
    try {
      const response = await this.client.search({
        index: indexName,
        size: options.size || 10,
          query: {
            match_all: {}
        }
      });
      return response;
    } catch (error) {
      logger.error(`Error searching index ${indexName}:`, error);
      throw error;
    }
  }

  async getIndexStats(): Promise<any> {
    try {
      const response = await this.client.indices.stats({
        index: this.defaultIndexName
      });
      return response;
    } catch (error) {
      logger.error('Error getting index stats:', error);
      throw error;
    }
  }

  async reindexAllListings(): Promise<{ success: boolean; count: number; errors: string[] }> {
    try {
      // Supabase'den tüm listings'i çek (debug için status filtresi kaldırıldı)
      logger.info('🔍 Fetching all listings from Supabase...');
      const result = await this.supabase
        .from('listings')
        .select('*');
      const { data: listings, error } = result;

      logger.info(`🔍 Found ${listings?.length || 0} listings in Supabase`);

      if (error) {
        throw new Error(`Supabase error: ${error.message}`);
      }

      // Listings'i Enhanced Elasticsearch formatına çevir
      const documents = listings.map((listing: any) => {
        return this.transformListingForElasticsearch(listing);
      });

      // Elasticsearch'e bulk index
      const success = await this.bulkIndex(documents);

      return {
        success,
        count: documents.length,
        errors: success ? [] : ['Bulk indexing failed']
      };
    } catch (error: any) {
      logger.error('Reindex all listings error:', error);
      return {
        success: false,
        count: 0,
        errors: [error.message || 'Unknown error']
      };
    }
  }

  async searchListings(params: {
    query?: string;
    filters?: any;
    sort?: any;
    page?: number;
    limit?: number;
    sessionId?: string;
  }): Promise<any> {
    try {
      const { query, filters, sort, page = 1, limit = 20, sessionId } = params;
      
      // Try to get from cache first (TEMPORARILY DISABLED FOR DEBUG)
      // const cachedResults = await searchCacheService.getCachedSearch(params, sessionId);
      // if (cachedResults) {
      //   logger.info('🎯 Search results served from cache');
      //   return {
      //     success: true,
      //     data: cachedResults.results,
      //     total: cachedResults.total,
      //     aggregations: cachedResults.aggregations,
      //     fromCache: true
      //   };
      // }

      const searchQuery: any = {
          bool: {
            must: [],
          filter: []
        }
      };

      // Default filters - include all statuses for debugging
      // searchQuery.bool.filter.push({ term: { status: 'active' } });
      
      // ✅ Status filtresi kaldırıldı - tüm status'ları göster

      // Text search
      if (query) {
        searchQuery.bool.must.push({
          multi_match: {
            query,
            fields: ['title^2', 'description', 'search_keywords'],
            type: 'best_fields',
            fuzziness: 'AUTO'
          }
        });
      }

      // Filters
      if (filters) {
        if (process.env.NODE_ENV === 'development') {
          logger.info('🔍 Debug - Filters received:', JSON.stringify(filters, null, 2));
        }
        
        // Kategori filtreleme - sadece category_id kullan
        if (filters.category_id && filters.category_id !== null) {
          logger.info('🔍 Debug - Using category_id filter:', filters.category_id);
          searchQuery.bool.filter.push({ term: { category_id: parseInt(filters.category_id) } });
        }
        
        if (filters.subcategory) {
          searchQuery.bool.filter.push({ term: { subcategory: filters.subcategory } });
        }
        if (filters.location) {
          searchQuery.bool.filter.push({ term: { 'location.province': filters.location } });
        }
        if (filters.minBudget || filters.maxBudget) {
          const rangeQuery: any = { range: { budget: {} } };
          if (filters.minBudget) rangeQuery.range.budget.gte = filters.minBudget;
          if (filters.maxBudget) rangeQuery.range.budget.lte = filters.maxBudget;
          searchQuery.bool.filter.push(rangeQuery);
        }
        if (filters.condition) {
          searchQuery.bool.filter.push({ term: { condition: filters.condition } });
        }
        if (filters.urgency) {
          searchQuery.bool.filter.push({ term: { urgency: filters.urgency } });
        }

        // Attribute filters
        if (filters.attributes) {
          Object.entries(filters.attributes).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
              searchQuery.bool.filter.push({ term: { [`attributes.${key}`]: value } });
            }
          });
        }
      }

      // Sort
      let sortQuery: any[] = [];
      if (sort) {
        if (sort.field === 'relevance' && query) {
          sortQuery.push({ _score: { order: 'desc' } });
        } else if (sort.field === 'price') {
          sortQuery.push({ 'budget.min': { order: sort.order || 'asc' } });
        } else if (sort.field === 'date') {
          sortQuery.push({ created_at: { order: sort.order || 'desc' } });
        } else if (sort.field === 'popularity') {
          sortQuery.push({ popularity_score: { order: sort.order || 'desc' } });
        }
      } else {
        // Default sort
        sortQuery.push({ created_at: { order: 'desc' } });
      }

      if (process.env.NODE_ENV === 'development') {
        logger.info('🔍 Elasticsearch search query:', JSON.stringify({
          index: this.defaultIndexName,
          body: {
            query: searchQuery,
            sort: sortQuery,
            from: (page - 1) * limit,
            size: limit,
            aggs: {
              categories: {
                terms: { field: 'category_id', size: 20 }
              }
            }
          }
        }, null, 2));
      }
      
      // Debug için detaylı query log'u
      logger.info('🔍 Raw searchQuery:', JSON.stringify(searchQuery, null, 2));
      logger.info('🔍 searchQuery.bool:', JSON.stringify(searchQuery.bool, null, 2));
      logger.info('🔍 searchQuery.bool.filter:', JSON.stringify(searchQuery.bool.filter, null, 2));

      const response = await this.client.search({
        index: this.defaultIndexName,
        body: {
          query: searchQuery,
          sort: sortQuery,
          from: (page - 1) * limit,
          size: limit,
          aggs: {
            categories: {
              terms: { field: 'category_id', size: 20 }
            }
          }
        }
      });

      logger.info('🔍 Elasticsearch response:', JSON.stringify({
        total: response.hits.total,
        hits_count: response.hits.hits.length,
        first_hit: response.hits.hits[0] ? response.hits.hits[0]._source : null,
        query: searchQuery,
        filters: filters
      }, null, 2));
      
      // Debug için detaylı log
      if (response.hits.hits.length === 0) {
        logger.warn('⚠️ No hits found in Elasticsearch for query:', JSON.stringify(searchQuery, null, 2));
        logger.warn('⚠️ searchQuery.bool.filter:', JSON.stringify(searchQuery.bool.filter, null, 2));
      } else {
        logger.info('✅ Found hits in Elasticsearch:', response.hits.hits.length);
      }

      const total = typeof response.hits.total === 'number' 
          ? response.hits.total
          : response.hits.total?.value || 0;

      const results = response.hits.hits.map((hit: any) => ({
        id: hit._id,
        score: hit._score,
        ...hit._source,
        // User bilgisi yoksa user_id'yi koru
        user_id: hit._source.user_id || hit._source.user?.id
      }));

      // Cache the search results
      await searchCacheService.cacheSearchResults(
        params,
        results,
        total,
        response.aggregations,
        sessionId
      );

      return {
        hits: results,
        total,
        aggregations: response.aggregations,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        fromCache: false
      };
    } catch (error) {
      logger.error('Search listings error:', error);
      throw error;
    }
  }

  // Transform listing to SearchOptimizedListing format
  private transformListingForElasticsearch(listing: any): SearchOptimizedListing {
    // Debug: Log raw listing data
    logger.info(`🔍 Raw listing data for ${listing.id}:`, JSON.stringify(listing, null, 2));

    // Validate required fields with fallbacks
    if (!listing.id) {
      logger.error('❌ Missing id for listing:', listing);
      throw new Error('Listing id is required');
    }

    // Use fallbacks for missing category data
    const categoryId = listing.category_id || null;
    const categoryPath = listing.category_path || [];

    logger.info(`🔍 Transforming listing ${listing.id} for Elasticsearch with category_id: ${categoryId}, category_path: ${JSON.stringify(categoryPath)}`);

    // Parse location details - düzeltilmiş
    let location;
    if (typeof listing.location === 'string') {
      const locationParts = listing.location.split(',').map((part: string) => part.trim());
      location = {
        province: locationParts[0] || '',
        district: locationParts[1] || '',
        neighborhood: locationParts[2] || '',
        coordinates: listing.latitude && listing.longitude ? {
          lat: listing.latitude,
          lng: listing.longitude
        } : undefined
      };
    } else {
      // Location zaten object ise
      location = {
        province: listing.location?.province || '',
        district: listing.location?.district || '',
        neighborhood: listing.location?.neighborhood || '',
        coordinates: listing.latitude && listing.longitude ? {
          lat: listing.latitude,
          lng: listing.longitude
        } : undefined
      };
    }

    // Parse budget details - convert to integer for Elasticsearch
    const budget = listing.budget || 0;

    // Parse attributes
    const attributes = listing.attributes || {};

    // Generate search keywords
    const searchKeywords = this.generateSearchKeywords(listing, attributes);

    // Calculate popularity score
    const popularityScore = this.calculatePopularityScore(listing);

    return {
      id: listing.id,
      user_id: listing.user_id,
      title: listing.title,
      description: listing.description,
      category: listing.category,
      category_id: categoryId,        // ✅ Fallback ile
      category_path: categoryPath, // ✅ Fallback ile
      subcategory: listing.subcategory,
      budget,
      location,
      condition: listing.condition || 'unknown',
      urgency: listing.urgency || 'medium',
      main_image_url: listing.main_image_url || listing.image_url || '',
      additional_image_urls: listing.additional_image_urls || [],
      status: listing.status || 'active',
      created_at: listing.created_at,
      updated_at: listing.updated_at,
      attributes,
      search_keywords: searchKeywords,
      popularity_score: popularityScore,
      user_trust_score: 0.5 // Default trust score
    };
  }

  // Generate search keywords from listing data
  private generateSearchKeywords(listing: any, attributes: any): string[] {
    const keywords = new Set<string>();

    // Add title and description keywords
    if (listing.title) {
      keywords.add(listing.title.toLowerCase());
    }
    if (listing.description) {
      keywords.add(listing.description.toLowerCase());
    }

    // Add category keywords
    if (listing.category) {
      keywords.add(listing.category.toLowerCase());
    }

    // Add attribute keywords
    Object.entries(attributes).forEach(([key, value]) => {
      if (value && typeof value === 'string') {
        keywords.add(value.toLowerCase());
      }
    });

    return Array.from(keywords);
  }

  // Calculate popularity score based on engagement metrics
  private calculatePopularityScore(listing: any): number {
    let score = 0;

    // Base score from listing age (newer = higher score)
    const createdAt = new Date(listing.created_at);
    const now = new Date();
    const daysSinceCreation = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
    score += Math.max(0, 10 - daysSinceCreation * 0.1);

    // Premium features boost
    if (listing.is_premium) score += 5;
    if (listing.is_featured) score += 3;
    if (listing.is_urgent_premium) score += 2;

    // Engagement metrics (if available)
    if (listing.views) score += Math.min(listing.views * 0.01, 10);
    if (listing.favorites) score += listing.favorites * 0.5;
    if (listing.offers) score += listing.offers * 1;

    return Math.min(score, 100); // Cap at 100
  }

  // Get category counts from Elasticsearch
  async getCategoryCounts(): Promise<Record<number, number>> {
    try {
      // ✅ Cache key oluştur
      const cacheKey = 'category_counts';
      const cacheTTL = 30 * 60 * 1000; // 30 dakika
      
      // ✅ Cache'den kontrol et
      const cached = await cacheManager.get(cacheKey);
      if (cached) {
        logger.info('📦 Category counts loaded from cache');
        return cached;
      }

      // ✅ Elasticsearch'ten çek - category_id field'ına göre (leaf kategoriler)
      const response = await this.client.search({
        index: this.defaultIndexName,
        body: {
          size: 0, // Don't return documents, only aggregations
          aggs: {
            category_counts: {
              terms: {
                field: 'category_id',
                size: 1000 // Get all categories
              }
            }
          }
        }
      });

      const buckets = (response.aggregations?.category_counts as any)?.buckets || [];
      const categoryCounts: Record<number, number> = {};

      // Leaf kategorileri say
      buckets.forEach((bucket: any) => {
        categoryCounts[bucket.key] = bucket.doc_count;
      });

      // Hiyerarşik sayıları hesapla - Supabase'den kategori yapısını al
      const result = await this.supabase
        .from('categories')
        .select('id, parent_id, name');

      const { data: categories } = result;
      if (categories) {
        // Her leaf kategori için parent'larına sayı ekle
        Object.entries(categoryCounts).forEach(([categoryId, count]) => {
          const categoryIdNum = parseInt(categoryId);
          this.addCountToParents(categoryIdNum, count, categories, categoryCounts);
        });
      }

      // ✅ Cache'e kaydet
      await cacheManager.set(cacheKey, categoryCounts, cacheTTL);
      
      logger.info(`📊 Retrieved and cached hierarchical category counts for ${Object.keys(categoryCounts).length} categories`);
      return categoryCounts;
    } catch (error) {
      logger.error('❌ Error getting category counts:', error);
      throw error;
    }
  }

  // Parent kategorilere sayı ekle
  private addCountToParents(categoryId: number, count: number, categories: any[], categoryCounts: Record<number, number>) {
    const category = categories.find(cat => cat.id === categoryId);
    if (category && category.parent_id) {
      // Parent'a sayı ekle
      categoryCounts[category.parent_id] = (categoryCounts[category.parent_id] || 0) + count;
      // Recursive olarak üst parent'lara da ekle
      this.addCountToParents(category.parent_id, count, categories, categoryCounts);
    }
  }

  // Invalidate category counts cache
  async invalidateCategoryCountsCache(): Promise<void> {
    try {
      const cacheKey = 'category_counts';
      await cacheManager.delete(cacheKey);
      logger.info('🗑️ Category counts cache invalidated');
    } catch (error) {
      logger.error('❌ Error invalidating category counts cache:', error);
    }
  }

  // Health check method
  async healthCheck(): Promise<any> {
    try {
      const response = await this.client.cluster.health();
      return {
        status: response?.status || 'unknown',
        responseTime: Date.now(),
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('❌ Elasticsearch health check failed:', error);
      return {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        responseTime: Date.now(),
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Get all indices
   */
  async getIndices() {
    try {
      const response = await this.client.cat.indices({ format: 'json' });
      return response.map((index: any) => ({
        index: index.index,
        health: index.health,
        status: index.status,
        docs_count: parseInt(index['docs.count'] || '0'),
        store_size: index['store.size'] || '0b'
      }));
    } catch (error) {
      logger.error('❌ Failed to get indices:', error);
      throw error;
    }
  }

  /**
   * Search documents in an index
   */
  async searchDocuments(index: string, query: string, size: number = 10, from: number = 0) {
    try {
      const response = await this.client.search({
        index,
        body: {
          query: {
            query_string: {
              query: query === '*' ? '*' : `*${query}*`
            }
          },
          size,
          from
        }
      });
      return response;
    } catch (error) {
      logger.error('❌ Failed to search documents:', error);
      throw error;
    }
  }

  /**
   * Get document by ID
   */
  async getDocument(index: string, id: string) {
    try {
      const response = await this.client.get({
        index,
        id
      });
      return response;
    } catch (error) {
      logger.error('❌ Failed to get document:', error);
      throw error;
    }
  }

  /**
   * Get index statistics for specific index
   */
  async getIndexStatsForIndex(index: string) {
    try {
      const response = await this.client.indices.stats({ index });
      return response;
    } catch (error) {
      logger.error('❌ Failed to get index stats:', error);
      throw error;
    }
  }

  /**
   * Reindex an index
   */
  async reindexIndex(index: string) {
    try {
      const newIndex = `${index}_reindexed_${Date.now()}`;
      
      // Get mapping from existing index
      const mapping = await this.getIndexMapping(index);
      
      // Create new index with same mapping
      await this.client.indices.create({
        index: newIndex,
        body: {
          mappings: mapping
        }
      });

      // Reindex data
      const response = await this.client.reindex({
        body: {
          source: { index },
          dest: { index: newIndex }
        }
      });

      return {
        success: true,
        newIndex,
        taskId: response.task
      };
    } catch (error) {
      logger.error('❌ Failed to reindex:', error);
      throw error;
    }
  }

  /**
   * Delete an index by name
   */
  async deleteIndexByName(index: string) {
    try {
      const response = await this.client.indices.delete({ index });
      return response;
    } catch (error) {
      logger.error('❌ Failed to delete index:', error);
      throw error;
    }
  }

  /**
   * Get index mapping
   */
  private async getIndexMapping(index: string) {
    try {
      const response = await this.client.indices.getMapping({ index });
      return response[index].mappings;
    } catch (error) {
      logger.error('❌ Failed to get index mapping:', error);
      throw error;
    }
  }
}

// Export elasticsearch client instance for health checks
export const elasticsearchClient = new AdminElasticsearchService().getClient(); 