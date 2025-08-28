// ===========================
// DATA SYNC SERVICE
// ===========================

import { Client } from '@elastic/elasticsearch';
import { createClient } from '@supabase/supabase-js';
import logger from '../../../config/logger';
import { SyncOptions, SyncResult } from '../types';

class DataSyncService {
  private client: Client;
  private supabase: any;

  constructor(client: Client) {
    this.client = client;
    this.supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }

  async syncListingsToElasticsearch(options: SyncOptions = {}): Promise<SyncResult> {
    const startTime = Date.now();
    const { batchSize = 100, force = false, categories, dateRange } = options;
    
    try {
      logger.info('🔄 Starting listings sync to Elasticsearch');

      let query = this.supabase
        .from('listings')
        .select('*')
        .eq('status', 'active');

      if (categories && categories.length > 0) {
        query = query.in('category_id', categories);
      }

      if (dateRange) {
        query = query.gte('created_at', dateRange.start.toISOString())
                   .lte('created_at', dateRange.end.toISOString());
      }

      const { data: listings, error } = await query;

      if (error) {
        throw new Error(`Supabase error: ${error.message}`);
      }

      if (!listings || listings.length === 0) {
        logger.info('ℹ️ No listings to sync');
        return {
          success: true,
          totalProcessed: 0,
          totalSynced: 0,
          totalFailed: 0,
          errors: [],
          duration: Date.now() - startTime
        };
      }

      const documents = listings.map(listing => ({
        index: 'listings',
        document: this.transformListingForES(listing),
        id: listing.id
      }));

      const result = await this.bulkIndexDocuments(documents, batchSize);

      logger.info(`✅ Listings sync completed: ${result.totalSynced}/${result.totalProcessed} synced`);
      return result;

    } catch (error: any) {
      logger.error('❌ Error in listings sync:', error);
      return {
        success: false,
        totalProcessed: 0,
        totalSynced: 0,
        totalFailed: 1,
        errors: [error.message],
        duration: Date.now() - startTime
      };
    }
  }

  async syncUserBehaviorsToElasticsearch(options: SyncOptions = {}): Promise<SyncResult> {
    const startTime = Date.now();
    const { batchSize = 100, dateRange } = options;
    
    try {
      logger.info('🔄 Starting user behaviors sync to Elasticsearch');

      let query = this.supabase
        .from('user_behaviors')
        .select('*');

      if (dateRange) {
        query = query.gte('event_timestamp', dateRange.start.toISOString())
                   .lte('event_timestamp', dateRange.end.toISOString());
      }

      const { data: behaviors, error } = await query;

      if (error) {
        throw new Error(`Supabase error: ${error.message}`);
      }

      if (!behaviors || behaviors.length === 0) {
        logger.info('ℹ️ No user behaviors to sync');
        return {
          success: true,
          totalProcessed: 0,
          totalSynced: 0,
          totalFailed: 0,
          errors: [],
          duration: Date.now() - startTime
        };
      }

      const documents = behaviors.map(behavior => ({
        index: 'user_behaviors',
        document: this.transformUserBehaviorForES(behavior),
        id: behavior.event_id
      }));

      const result = await this.bulkIndexDocuments(documents, batchSize);

      logger.info(`✅ User behaviors sync completed: ${result.totalSynced}/${result.totalProcessed} synced`);
      return result;

    } catch (error: any) {
      logger.error('❌ Error in user behaviors sync:', error);
      return {
        success: false,
        totalProcessed: 0,
        totalSynced: 0,
        totalFailed: 1,
        errors: [error.message],
        duration: Date.now() - startTime
      };
    }
  }

  async syncAISuggestionsToElasticsearch(options: SyncOptions = {}): Promise<SyncResult> {
    const startTime = Date.now();
    const { batchSize = 100, categories } = options;
    
    try {
      logger.info('🔄 Starting AI suggestions sync to Elasticsearch');

      let query = this.supabase
        .from('category_ai_suggestions')
        .select('*')
        .eq('is_approved', true);

      if (categories && categories.length > 0) {
        query = query.in('category_id', categories);
      }

      const { data: suggestions, error } = await query;

      if (error) {
        throw new Error(`Supabase error: ${error.message}`);
      }

      if (!suggestions || suggestions.length === 0) {
        logger.info('ℹ️ No AI suggestions to sync');
        return {
          success: true,
          totalProcessed: 0,
          totalSynced: 0,
          totalFailed: 0,
          errors: [],
          duration: Date.now() - startTime
        };
      }

      const documents = suggestions.map(suggestion => ({
        index: 'ai_suggestions',
        document: this.transformAISuggestionForES(suggestion),
        id: suggestion.id.toString()
      }));

      const result = await this.bulkIndexDocuments(documents, batchSize);

      logger.info(`✅ AI suggestions sync completed: ${result.totalSynced}/${result.totalProcessed} synced`);
      return result;

    } catch (error: any) {
      logger.error('❌ Error in AI suggestions sync:', error);
      return {
        success: false,
        totalProcessed: 0,
        totalSynced: 0,
        totalFailed: 1,
        errors: [error.message],
        duration: Date.now() - startTime
      };
    }
  }

  private async bulkIndexDocuments(
    documents: Array<{ index: string; document: any; id?: string }>,
    batchSize: number
  ): Promise<SyncResult> {
    const startTime = Date.now();
    let totalProcessed = 0;
    let totalSynced = 0;
    let totalFailed = 0;
    const errors: string[] = [];

    // Process in batches
    for (let i = 0; i < documents.length; i += batchSize) {
      const batch = documents.slice(i, i + batchSize);
      
      try {
        const operations = batch.flatMap(({ index, document, id }) => [
          { index: { _index: index, _id: id } },
          document
        ]);

        const response = await this.client.bulk({
          body: operations
        });

        const batchErrors = response.items.filter((item: any) => item.index?.error);
        
        totalProcessed += batch.length;
        totalSynced += batch.length - batchErrors.length;
        totalFailed += batchErrors.length;

        batchErrors.forEach((error: any) => {
          errors.push(`Document ${error.index._id}: ${error.index.error.reason}`);
        });

        logger.info(`📦 Processed batch ${Math.floor(i / batchSize) + 1}: ${batch.length - batchErrors.length}/${batch.length} synced`);

      } catch (error: any) {
        totalProcessed += batch.length;
        totalFailed += batch.length;
        errors.push(`Batch error: ${error.message}`);
        logger.error(`❌ Error processing batch ${Math.floor(i / batchSize) + 1}:`, error);
      }
    }

    return {
      success: totalFailed === 0,
      totalProcessed,
      totalSynced,
      totalFailed,
      errors,
      duration: Date.now() - startTime
    };
  }

  private transformListingForES(listing: any): any {
    return {
      id: listing.id,
      user_id: listing.user_id,
      title: listing.title,
      description: listing.description,
      category: listing.category,
      category_id: listing.category_id,
      category_path: listing.category_path,
      subcategory: listing.subcategory,
      budget: listing.budget,
      location: {
        province: listing.location?.province,
        district: listing.location?.district,
        neighborhood: listing.location?.neighborhood,
        coordinates: listing.location?.coordinates
      },
      condition: listing.condition,
      urgency: listing.urgency,
      main_image_url: listing.main_image_url,
      additional_image_urls: listing.additional_image_urls,
      status: listing.status,
      created_at: listing.created_at,
      updated_at: listing.updated_at,
      attributes: listing.attributes,
      search_keywords: listing.search_keywords,
      popularity_score: listing.popularity_score || 0,
      user_trust_score: listing.user_trust_score || 0
    };
  }

  private transformUserBehaviorForES(behavior: any): any {
    return {
      event_id: behavior.event_id,
      event_name: behavior.event_name,
      event_timestamp: behavior.event_timestamp,
      event_properties: behavior.event_properties,
      user: behavior.user,
      session: behavior.session,
      device: behavior.device,
      context: behavior.context
    };
  }

  private transformAISuggestionForES(suggestion: any): any {
    return {
      id: suggestion.id,
      category_id: suggestion.category_id,
      category_name: suggestion.category_name,
      suggestion_type: suggestion.suggestion_type,
      suggestion_data: suggestion.suggestion_data,
      confidence_score: suggestion.confidence_score,
      is_approved: suggestion.is_approved,
      created_at: suggestion.created_at,
      updated_at: suggestion.updated_at
    };
  }

  async refreshIndices(indices: string[] = ['listings', 'user_behaviors', 'ai_suggestions']): Promise<void> {
    try {
      logger.info('🔄 Refreshing indices');

      await Promise.all(
        indices.map(index => 
          this.client.indices.refresh({ index })
        )
      );

      logger.info('✅ Indices refreshed successfully');

    } catch (error) {
      logger.error('❌ Error refreshing indices:', error);
      throw error;
    }
  }

  async getSyncStatus(): Promise<any> {
    try {
      const [listingsCount, behaviorsCount, suggestionsCount] = await Promise.all([
        this.client.count({ index: 'listings' }),
        this.client.count({ index: 'user_behaviors' }),
        this.client.count({ index: 'ai_suggestions' })
      ]);

      return {
        listings: listingsCount.count,
        userBehaviors: behaviorsCount.count,
        aiSuggestions: suggestionsCount.count,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      logger.error('❌ Error getting sync status:', error);
      throw error;
    }
  }
}

export default DataSyncService;
