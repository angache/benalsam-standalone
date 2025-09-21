import { IDatabaseService } from '../interfaces/ICategoryService';
import { supabase } from '../config/database';
import logger from '../config/logger';

/**
 * Database Service Implementation
 * Supabase ile database işlemleri
 */
export class DatabaseService implements IDatabaseService {
  
  async query(sql: string, params?: any[]): Promise<any> {
    try {
      // Supabase doesn't support raw SQL queries directly
      // This is a placeholder for future implementation
      logger.warn('Raw SQL queries not supported in Supabase implementation');
      throw new Error('Raw SQL queries not supported');
    } catch (error) {
      logger.error('Database query failed:', error);
      throw error;
    }
  }

  async healthCheck(): Promise<{ status: string; responseTime: number }> {
    const startTime = Date.now();
    
    try {
      // Simple query to test connection
      const { error } = await supabase
        .from('categories')
        .select('id')
        .limit(1);
      
      const responseTime = Date.now() - startTime;
      
      if (error) {
        return { status: 'unhealthy', responseTime };
      }
      
      return { status: 'healthy', responseTime };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      logger.error('Database health check failed:', error);
      return { status: 'unhealthy', responseTime };
    }
  }
}
