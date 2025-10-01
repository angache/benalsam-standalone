import * as cron from 'node-cron';
import firebaseService from './firebaseService';
import logger from '../config/logger';

/**
 * Job Cleanup Service
 * Automatically deletes old completed jobs from Firebase
 */
export class JobCleanupService {
  private cronJob: ReturnType<typeof cron.schedule> | null = null;
  private readonly DEFAULT_CLEANUP_DAYS = 7;
  private readonly DEFAULT_SCHEDULE = '0 2 * * *'; // Daily at 2 AM

  /**
   * Start the cleanup scheduler
   */
  start(schedule: string = this.DEFAULT_SCHEDULE, olderThanDays: number = this.DEFAULT_CLEANUP_DAYS): void {
    if (this.cronJob) {
      logger.warn('⚠️ Job cleanup service already running');
      return;
    }

    // Validate cron expression
    if (!cron.validate(schedule)) {
      logger.error(`❌ Invalid cron schedule: ${schedule}`);
      throw new Error(`Invalid cron schedule: ${schedule}`);
    }

    this.cronJob = cron.schedule(schedule, async () => {
      await this.runCleanup(olderThanDays);
    });

    logger.info(`✅ Job cleanup service started (schedule: ${schedule}, older than: ${olderThanDays} days)`);
  }

  /**
   * Stop the cleanup scheduler
   */
  stop(): void {
    if (this.cronJob) {
      this.cronJob.stop();
      this.cronJob = null;
      logger.info('🛑 Job cleanup service stopped');
    }
  }

  /**
   * Run cleanup manually
   */
  async runCleanup(olderThanDays: number = this.DEFAULT_CLEANUP_DAYS): Promise<number> {
    try {
      logger.info(`🧹 Starting job cleanup (older than ${olderThanDays} days)...`);
      
      const deletedCount = await firebaseService.deleteOldJobs(olderThanDays);
      
      logger.info(`✅ Job cleanup completed: ${deletedCount} jobs deleted`);
      return deletedCount;
    } catch (error) {
      logger.error('❌ Job cleanup failed:', error);
      throw error;
    }
  }

  /**
   * Check if cleanup service is running
   */
  isRunning(): boolean {
    return this.cronJob !== null;
  }
}

export default new JobCleanupService();

