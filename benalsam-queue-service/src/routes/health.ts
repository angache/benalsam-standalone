import { Router, Request, Response } from 'express';
import logger from '../config/logger';
import { databaseCircuitBreaker } from '../utils/circuitBreaker';
import { realtimeSubscriptionService } from '../services/realtimeSubscriptionService';
import { supabase } from '../config/supabase';

const router = Router();

router.get('/', async (_req: Request, res: Response) => {
  try {
    const circuitBreakerMetrics = databaseCircuitBreaker.getMetrics();
    const realtimeStatus = realtimeSubscriptionService.getStatus();
    
    // Stuck job monitoring (Enterprise Safety)
    let stuckJobsCount = 0;
    let queueStats = { pending: 0, processing: 0, completed: 0, failed: 0 };
    
    try {
      // Stuck jobs (5 dakikadan eski processing)
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      const { count: stuckCount } = await supabase
        .from('elasticsearch_sync_queue')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'processing')
        .lt('processed_at', fiveMinutesAgo);
      
      stuckJobsCount = stuckCount || 0;
      
      // Queue statistics
      const { data: stats } = await supabase
        .from('elasticsearch_sync_queue')
        .select('status');
      
      if (stats) {
        queueStats = stats.reduce((acc: any, job: any) => {
          acc[job.status] = (acc[job.status] || 0) + 1;
          return acc;
        }, { pending: 0, processing: 0, completed: 0, failed: 0 });
      }
    } catch (error) {
      logger.warn('Failed to fetch queue statistics:', error);
    }
    
    const healthCheck = {
      status: circuitBreakerMetrics.isHealthy && realtimeStatus.isConnected && stuckJobsCount === 0 ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      service: 'queue-service',
      version: process.env['npm_package_version'] || '1.0.0',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      environment: process.env['NODE_ENV'],
      architecture: realtimeStatus.isConnected ? 'event-driven' : 'enterprise-polling',
      queue: {
        ...queueStats,
        stuckJobs: stuckJobsCount,
        isHealthy: stuckJobsCount === 0
      },
      circuitBreaker: {
        state: circuitBreakerMetrics.state,
        failureCount: circuitBreakerMetrics.failureCount,
        successCount: circuitBreakerMetrics.successCount,
        isHealthy: circuitBreakerMetrics.isHealthy
      },
      realtime: {
        isConnected: realtimeStatus.isConnected,
        reconnectAttempts: realtimeStatus.reconnectAttempts,
        maxReconnectAttempts: realtimeStatus.maxReconnectAttempts,
        mode: realtimeStatus.isConnected ? 'zero-polling' : 'fallback-polling'
      }
    };

    logger.info('Health check requested', { healthCheck });
    
    res.status(200).json({
      success: true,
      data: healthCheck
    });
  } catch (error) {
    logger.error('Health check failed:', error);
    res.status(500).json({
      success: false,
      message: 'Health check failed'
    });
  }
});

// Enterprise Cleanup Endpoint
router.post('/cleanup-stuck-jobs', async (_req: Request, res: Response) => {
  try {
    logger.info('🧹 Manual stuck job cleanup requested');
    
    // 5 dakikadan eski processing job'ları bul
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    
    const { data: stuckJobs, error } = await supabase
      .from('elasticsearch_sync_queue')
      .select('id, retry_count, created_at, processed_at')
      .eq('status', 'processing')
      .lt('processed_at', fiveMinutesAgo);

    if (error) {
      logger.error('❌ Error fetching stuck jobs:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch stuck jobs'
      });
    }

    if (!stuckJobs || stuckJobs.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No stuck jobs found',
        data: { cleanedJobs: 0 }
      });
    }

    let cleanedCount = 0;
    let failedCount = 0;

    for (const job of stuckJobs) {
      const newRetryCount = (job.retry_count || 0) + 1;
      
      if (newRetryCount >= 3) {
        // Max retry'e ulaştı, failed yap
        const { error: updateError } = await supabase
          .from('elasticsearch_sync_queue')
          .update({ 
            status: 'failed', 
            error_message: 'Job stuck in processing state for too long',
            processed_at: new Date().toISOString()
          })
          .eq('id', job.id);

        if (updateError) {
          logger.error(`❌ Error marking job ${job.id} as failed:`, updateError);
          failedCount++;
        } else {
          logger.info(`❌ Job ${job.id} marked as failed (max retries reached)`);
          cleanedCount++;
        }
      } else {
        // Pending'e çevir ve retry count artır
        const { error: updateError } = await supabase
          .from('elasticsearch_sync_queue')
          .update({ 
            status: 'pending', 
            retry_count: newRetryCount,
            processed_at: null,
            error_message: null
          })
          .eq('id', job.id);

        if (updateError) {
          logger.error(`❌ Error cleaning up stuck job ${job.id}:`, updateError);
          failedCount++;
        } else {
          logger.info(`✅ Stuck job ${job.id} reset to pending (retry ${newRetryCount}/3)`);
          cleanedCount++;
        }
      }
    }

    logger.info(`🧹 Manual cleanup completed: ${cleanedCount} cleaned, ${failedCount} failed`);

    return res.status(200).json({
      success: true,
      message: `Cleanup completed: ${cleanedCount} jobs cleaned, ${failedCount} failed`,
      data: { 
        totalStuckJobs: stuckJobs.length,
        cleanedJobs: cleanedCount,
        failedJobs: failedCount
      }
    });

  } catch (error) {
    logger.error('❌ Manual cleanup failed:', error);
    return res.status(500).json({
      success: false,
      message: 'Manual cleanup failed'
    });
  }
});

export { router as healthRoutes };
