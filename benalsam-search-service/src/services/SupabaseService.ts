import { createClient } from '@supabase/supabase-js';
import { ISupabaseService, SearchParams, SearchResult } from '../interfaces/ISearchService';
import logger from '../config/logger';

/**
 * Supabase Service Implementation
 * Database işlemleri için abstraction
 */
export class SupabaseService implements ISupabaseService {
  private supabase: any = null;

  constructor() {
    this.initializeClient();
  }

  private initializeClient(): void {
    try {
      const supabaseUrl = process.env['SUPABASE_URL'];
      const supabaseServiceKey = process.env['SUPABASE_SERVICE_ROLE_KEY'];
      
      if (!supabaseUrl || !supabaseServiceKey) {
        logger.warn('Supabase credentials not found, service will have limited functionality');
        return;
      }

      this.supabase = createClient(supabaseUrl, supabaseServiceKey);
      logger.info('✅ Supabase client initialized');
    } catch (error) {
      logger.error('Failed to initialize Supabase client:', error);
    }
  }

  async searchListings(params: SearchParams): Promise<SearchResult> {
    if (!this.supabase) {
      throw new Error('Supabase client not initialized');
    }

    try {
      // For now, return empty results like the original implementation
      logger.info('Using Supabase search fallback', { query: params.query });
      
      return {
        success: true,
        data: [],
        total: 0,
        page: params.page || 1,
        pageSize: params.pageSize || 20,
        totalPages: 0,
        responseTime: 0,
        cached: false,
        query: params.query
      };
    } catch (error) {
      logger.error('Supabase search failed:', error);
      throw new Error(`Supabase search operation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async healthCheck(): Promise<{ status: string; responseTime: number }> {
    const startTime = Date.now();
    
    try {
      if (!this.supabase) {
        return { status: 'unhealthy', responseTime: 0 };
      }

      // Simple query to test connection
      const { error } = await this.supabase
        .from('listings')
        .select('id')
        .limit(1);
      
      const responseTime = Date.now() - startTime;
      
      if (error) {
        return { status: 'unhealthy', responseTime };
      }
      
      return { status: 'healthy', responseTime };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      logger.error('Supabase health check failed:', error);
      return { status: 'unhealthy', responseTime };
    }
  }
}
