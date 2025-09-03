import { createClient } from '@supabase/supabase-js';
import logger from './logger';

class SupabaseConfig {
  private static instance: SupabaseConfig;
  private client: ReturnType<typeof createClient> | null = null;

  private constructor() {}

  public static getInstance(): SupabaseConfig {
    if (!SupabaseConfig.instance) {
      SupabaseConfig.instance = new SupabaseConfig();
    }
    return SupabaseConfig.instance;
  }

  public getClient(): ReturnType<typeof createClient> {
    if (!this.client) {
      const supabaseUrl = process.env.SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_KEY;

      if (!supabaseUrl || !supabaseKey) {
        throw new Error('Supabase URL and key must be provided');
      }

      this.client = createClient(supabaseUrl, supabaseKey, {
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
