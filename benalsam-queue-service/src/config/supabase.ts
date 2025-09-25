import { createClient } from '@supabase/supabase-js';
import logger from './logger';

const supabaseUrl = process.env['SUPABASE_URL'];
const supabaseKey = process.env['SUPABASE_SERVICE_ROLE_KEY'];

if (!supabaseUrl || !supabaseKey) {
  logger.error('❌ Supabase configuration missing. Please check SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables.');
  throw new Error('Supabase configuration is required');
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,  // Disable for better performance
    persistSession: false
  },
  db: {
    schema: 'public'
  },
  global: {
    headers: {
      'X-Client-Info': 'benalsam-queue-service',
      'Connection': 'keep-alive'  // Enable connection pooling
    }
  }
});

logger.info('✅ Supabase client initialized');
