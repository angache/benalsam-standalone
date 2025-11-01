import * as cron from 'node-cron';
import firebaseService from './firebaseService';
import logger from '../config/logger';

/**
 * Job Cleanup Service
 * Automatically deletes old completed jobs from Firebase
 */
export class JobCleanupService {
  private cronJob: ReturnType<typeof cron.schedule> | null = null;
  private readonly DEFAULT_CLEANUP_HOURS = parseInt(process.env['QUEUE_CLEANUP_TTL_HOURS'] || '24');
  private readonly CLEANUP_INTERVAL_HOURS = parseInt(process.env['QUEUE_CLEANUP_INTERVAL_HOURS'] || '6');
  private readonly DEFAULT_SCHEDULE = `0 */${this.CLEANUP_INTERVAL_HOURS} * * *`; // ENV'den oku

  /**
   * Start the cleanup scheduler
   */
  start(schedule: string = this.DEFAULT_SCHEDULE, olderThanHours: number = this.DEFAULT_CLEANUP_HOURS): void {
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
      await this.runCleanup(olderThanHours);
    });

    logger.info(`✅ Job cleanup service started (schedule: ${schedule}, older than: ${olderThanHours} hours)`);
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
  async runCleanup(olderThanHours: number = this.DEFAULT_CLEANUP_HOURS): Promise<number> {
    try {
      logger.info(`🧹 Starting job cleanup (older than ${olderThanHours} hours)...`);
      
      // Convert hours to days for compatibility
      const olderThanDays = olderThanHours / 24;
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

