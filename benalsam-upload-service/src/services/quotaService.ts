import { getRedisClient } from '../config/redis';
import { logger } from '../config/logger';
import { UploadResult } from './cloudinaryService';

export interface UserQuota {
  userId: string;
  dailyUploads: number;
  totalStorage: number;
  lastResetDate: string;
  maxDailyUploads: number;
  maxStorage: number;
}

export interface QuotaCheck {
  allowed: boolean;
  message?: string;
  quota: UserQuota;
}

export class QuotaService {
  private readonly maxDailyUploads = parseInt(process.env.RATE_LIMIT_MAX_UPLOADS_PER_DAY || '50');
  private readonly maxStorage = parseInt(process.env.QUOTA_MAX_STORAGE_PER_USER || '1073741824'); // 1GB
  private readonly cleanupIntervalHours = parseInt(process.env.QUOTA_CLEANUP_INTERVAL_HOURS || '24');

  /**
   * Get user quota from Redis
   */
  async getUserQuota(userId: string): Promise<UserQuota> {
    try {
      const redisClient = getRedisClient();
      const quotaKey = `quota:${userId}`;
      
      const quotaData = await redisClient.get(quotaKey);
      
      if (!quotaData) {
        // Create new quota
        const today = new Date().toISOString().split('T')[0] as string;
        const newQuota: UserQuota = {
          userId,
          dailyUploads: 0,
          totalStorage: 0,
          lastResetDate: today,
          maxDailyUploads: this.maxDailyUploads,
          maxStorage: this.maxStorage
        };
        
        await this.saveUserQuota(newQuota);
        return newQuota;
      }

      const quota = JSON.parse(quotaData) as UserQuota;
      
      // Check if quota needs reset (new day)
      const today = new Date().toISOString().split('T')[0] as string;
      if (quota.lastResetDate !== today) {
        quota.dailyUploads = 0;
        quota.lastResetDate = today;
        await this.saveUserQuota(quota);
      }

      return quota;

    } catch (error) {
      logger.error('❌ Failed to get user quota:', error);
      throw new Error('Failed to get user quota');
    }
  }

  /**
   * Save user quota to Redis
   */
  private async saveUserQuota(quota: UserQuota): Promise<void> {
    try {
      const redisClient = getRedisClient();
      const quotaKey = `quota:${quota.userId}`;
      
      // Set with expiration (24 hours)
      await redisClient.setEx(quotaKey, 24 * 60 * 60, JSON.stringify(quota));
      
    } catch (error) {
      logger.error('❌ Failed to save user quota:', error);
      throw new Error('Failed to save user quota');
    }
  }

  /**
   * Check if user can upload files
   */
  async checkQuota(userId: string, files: Express.Multer.File[]): Promise<QuotaCheck> {
    try {
      const quota = await this.getUserQuota(userId);
      
      // Check daily upload limit
      if (quota.dailyUploads + files.length > quota.maxDailyUploads) {
        return {
          allowed: false,
          message: `Daily upload limit exceeded. You can upload ${quota.maxDailyUploads - quota.dailyUploads} more files today.`,
          quota
        };
      }

      // Check storage limit
      const totalFileSize = files.reduce((sum, file) => sum + file.size, 0);
      if (quota.totalStorage + totalFileSize > quota.maxStorage) {
        return {
          allowed: false,
          message: `Storage limit exceeded. You have ${Math.round((quota.maxStorage - quota.totalStorage) / 1024 / 1024)}MB remaining.`,
          quota
        };
      }

      return {
        allowed: true,
        quota
      };

    } catch (error) {
      logger.error('❌ Failed to check quota:', error);
      throw new Error('Failed to check quota');
    }
  }

  /**
   * Update user quota after successful upload
   */
  async updateQuota(userId: string, uploadResults: UploadResult[]): Promise<void> {
    try {
      const quota = await this.getUserQuota(userId);
      
      // Update daily uploads
      quota.dailyUploads += uploadResults.length;
      
      // Update total storage
      const totalSize = uploadResults.reduce((sum, result) => sum + result.size, 0);
      quota.totalStorage += totalSize;
      
      await this.saveUserQuota(quota);
      
      logger.info(`✅ Quota updated for user ${userId}: ${quota.dailyUploads}/${quota.maxDailyUploads} uploads, ${Math.round(quota.totalStorage / 1024 / 1024)}MB/${Math.round(quota.maxStorage / 1024 / 1024)}MB storage`);

    } catch (error) {
      logger.error('❌ Failed to update quota:', error);
      throw new Error('Failed to update quota');
    }
  }

  /**
   * Remove from quota after successful deletion
   */
  async removeFromQuota(userId: string, imageId: string): Promise<void> {
    try {
      const quota = await this.getUserQuota(userId);
      
      // Note: We can't easily get the exact size of deleted image
      // So we'll just decrement the upload count
      if (quota.dailyUploads > 0) {
        quota.dailyUploads--;
      }
      
      await this.saveUserQuota(quota);
      
      logger.info(`✅ Quota updated after deletion for user ${userId}: ${quota.dailyUploads}/${quota.maxDailyUploads} uploads`);

    } catch (error) {
      logger.error('❌ Failed to remove from quota:', error);
      throw new Error('Failed to remove from quota');
    }
  }

  /**
   * Cleanup expired quotas (run as cron job)
   */
  async cleanupExpiredQuotas(): Promise<void> {
    try {
      const redisClient = getRedisClient();
      const pattern = 'quota:*';
      
      const keys = await redisClient.keys(pattern);
      let cleanedCount = 0;
      
      for (const key of keys) {
        const quotaData = await redisClient.get(key);
        if (quotaData) {
          const quota = JSON.parse(quotaData) as UserQuota;
          const today = new Date().toISOString().split('T')[0] as string;
          
          // Reset daily uploads if it's a new day
          if (quota.lastResetDate !== today) {
            quota.dailyUploads = 0;
            quota.lastResetDate = today;
            await this.saveUserQuota(quota);
            cleanedCount++;
          }
        }
      }
      
      logger.info(`✅ Cleaned up ${cleanedCount} expired quotas`);

    } catch (error) {
      logger.error('❌ Failed to cleanup expired quotas:', error);
    }
  }
}

export const quotaService = new QuotaService();
