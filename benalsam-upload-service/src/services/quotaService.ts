import { IQuotaService } from '../interfaces/IUploadService';
import logger from '../config/logger';

/**
 * Quota Service Implementation
 * User quota management için abstraction
 */
export class QuotaService implements IQuotaService {
  
  async checkQuota(userId: string, fileSize: number): Promise<{ allowed: boolean; quota: any }> {
    try {
      logger.info('Checking quota for user', { userId, fileSize });

      // Mock quota check for now
      const quota = null; // Mock: no quota found

      // Default quota limits
      const defaultQuota = {
        storage_limit: 100 * 1024 * 1024, // 100MB
        file_count_limit: 50,
        used_storage: 0,
        used_file_count: 0
      };

      const userQuota = quota || defaultQuota;

      // Check if upload is allowed
      const allowed = 
        (userQuota.used_storage + fileSize) <= userQuota.storage_limit &&
        userQuota.used_file_count < userQuota.file_count_limit;

      logger.info('Quota check result', { 
        userId, 
        allowed, 
        usedStorage: userQuota.used_storage,
        storageLimit: userQuota.storage_limit,
        usedFiles: userQuota.used_file_count,
        fileLimit: userQuota.file_count_limit
      });

      return {
        allowed,
        quota: {
          usedStorage: userQuota.used_storage,
          storageLimit: userQuota.storage_limit,
          usedFiles: userQuota.used_file_count,
          fileLimit: userQuota.file_count_limit,
          remainingStorage: userQuota.storage_limit - userQuota.used_storage,
          remainingFiles: userQuota.file_count_limit - userQuota.used_file_count
        }
      };
    } catch (error) {
      logger.error('Quota check failed:', error);
      throw error;
    }
  }

  async updateQuota(userId: string, fileSize: number): Promise<void> {
    try {
      logger.info('Updating quota for user', { userId, fileSize });

      // Mock quota update for now
      logger.info('Quota updated successfully (mock)', { 
        userId, 
        fileSize
      });
    } catch (error) {
      logger.error('Quota update failed:', error);
      throw error;
    }
  }

  async getQuota(userId: string): Promise<any> {
    try {
      logger.info('Getting quota for user', { userId });

      // Return default quota (mock)
      return {
        user_id: userId,
        used_storage: 0,
        used_file_count: 0,
        storage_limit: 100 * 1024 * 1024, // 100MB
        file_count_limit: 50,
        remaining_storage: 100 * 1024 * 1024,
        remaining_files: 50
      };
    } catch (error) {
      logger.error('Get quota failed:', error);
      throw error;
    }
  }

  async healthCheck(): Promise<{ status: string; responseTime: number }> {
    const startTime = Date.now();
    
    try {
      const responseTime = Date.now() - startTime;
      
      // Mock: always healthy
      return { status: 'healthy', responseTime };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      logger.error('Quota service health check failed:', error);
      return { status: 'unhealthy', responseTime };
    }
  }
}