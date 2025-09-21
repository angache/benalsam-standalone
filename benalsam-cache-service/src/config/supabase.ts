import { createClient } from '@supabase/supabase-js';
import logger from './logger';

const supabaseUrl = process.env['SUPABASE_URL'];
const supabaseServiceKey = process.env['SUPABASE_SERVICE_ROLE_KEY'];

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase configuration. Please check SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables.');
}

export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

logger.info('✅ Supabase client initialized', { service: 'cache-service' });
