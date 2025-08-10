import { supabase } from './supabase';
import { DatabaseConfig } from '@/types';

const databaseConfig: DatabaseConfig = {
  url: process.env.SUPABASE_URL || '',
  key: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
};

export { supabase, databaseConfig }; 