import { supabase } from '../config/supabase';
import { IDatabaseService } from '../interfaces/IDatabaseService';
import logger from '../config/logger';

/**
 * Database Service Implementation
 * Supabase ile database işlemleri
 */
export class DatabaseService implements IDatabaseService {
  
  async healthCheck(): Promise<{ status: string; responseTime: number }> {
    const startTime = Date.now();
    
    try {
      // Simple query to test connection
      const { error } = await supabase
        .from('elasticsearch_sync_queue')
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

  async getPendingJobs(limit: number = 10): Promise<any[]> {
    try {
      const { data: pendingJobs, error } = await supabase
        .from('elasticsearch_sync_queue')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: true })
        .limit(limit);

      if (error) {
        logger.error('Error fetching pending jobs:', error);
        throw new Error(`Failed to fetch pending jobs: ${error.message}`);
      }

      return pendingJobs || [];
    } catch (error) {
      logger.error('Database query failed:', error);
      throw error;
    }
  }

  async updateJobStatus(
    jobId: number, 
    status: string, 
    traceId?: string, 
    errorMessage?: string
  ): Promise<void> {
    try {
      const updateData: any = {
        status,
        updated_at: new Date().toISOString()
      };

      if (traceId) {
        updateData.trace_id = traceId;
      }

      if (errorMessage) {
        updateData.error_message = errorMessage;
      }

      if (status === 'completed' || status === 'failed') {
        updateData.processed_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('elasticsearch_sync_queue')
        .update(updateData)
        .eq('id', jobId);

      if (error) {
        logger.error('Error updating job status:', error);
        throw new Error(`Failed to update job status: ${error.message}`);
      }

      logger.debug(`Job ${jobId} status updated to ${status}`);
    } catch (error) {
      logger.error('Database update failed:', error);
      throw error;
    }
  }

  async markJobAsProcessing(jobId: number, traceId: string): Promise<void> {
    await this.updateJobStatus(jobId, 'processing', traceId);
  }

  async markJobAsCompleted(jobId: number, traceId: string): Promise<void> {
    await this.updateJobStatus(jobId, 'completed', traceId);
  }

  async markJobAsFailed(jobId: number, traceId: string, errorMessage: string): Promise<void> {
    await this.updateJobStatus(jobId, 'failed', traceId, errorMessage);
  }
}
