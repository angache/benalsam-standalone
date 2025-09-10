import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';
import logger from './logger';

export type Tables = Database['public']['Tables'];
export type TableRow<T extends keyof Tables> = Tables[T]['Row'];
export type TableInsert<T extends keyof Tables> = Tables[T]['Insert'];
export type TableUpdate<T extends keyof Tables> = Tables[T]['Update'];

class SupabaseConfig {
  private static instance: SupabaseConfig;
  private client: SupabaseClient | null = null;

  private constructor() {}

  public static getInstance(): SupabaseConfig {
    if (!SupabaseConfig.instance) {
      SupabaseConfig.instance = new SupabaseConfig();
    }
    return SupabaseConfig.instance;
  }

  public getClient(): SupabaseClient {
    if (!this.client) {
      const supabaseUrl = process.env.SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_KEY;

      if (!supabaseUrl || !supabaseKey) {
        throw new Error('Supabase URL and key must be provided');
      }

      this.client = createClient<Database>(supabaseUrl, supabaseKey, {
        auth: {
          persistSession: false
        }
      });

      logger.info('✅ Supabase client initialized');
    }

    return this.client;
  }

  public async checkConnection(): Promise<boolean> {
    try {
      const client = this.getClient();
      const { data, error } = await client
        .from('elasticsearch_sync_queue')
        .select('count')
        .limit(1);

      if (error) {
        logger.error('❌ Supabase health check failed:', error);
        return false;
      }

      return true;
    } catch (error) {
      logger.error('❌ Supabase health check failed:', error);
      return false;
    }
  }
}

export const supabaseConfig = SupabaseConfig.getInstance();
export default supabaseConfig;
