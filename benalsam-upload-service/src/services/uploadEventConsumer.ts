import { logger } from '../config/logger';
import { rabbitmqConfig } from '../config/rabbitmq';
import { ImageUploadEvent, ImageDeleteEvent } from '../types/upload';
import fs from 'fs';
import path from 'path';

/**
 * Upload Event Consumer Service
 * Handles upload.events queue messages for cleanup and cache operations
 */
export class UploadEventConsumer {
  private static instance: UploadEventConsumer;
  private isRunning = false;
  private tempDir: string;

  private constructor() {
    this.tempDir = path.join(__dirname, '../../temp');
  }

  public static getInstance(): UploadEventConsumer {
    if (!UploadEventConsumer.instance) {
      UploadEventConsumer.instance = new UploadEventConsumer();
    }
    return UploadEventConsumer.instance;
  }

  /**
   * Start consuming upload events
   */
  public async start(): Promise<void> {
    if (this.isRunning) {
      logger.warn('⚠️ Upload Event Consumer is already running');
      return;
    }

    try {
      const channel = await rabbitmqConfig.getChannel();
      
      // Consume from upload.events queue
      await channel.consume('upload.events', async (msg: any) => {
        if (!msg) {
          logger.warn('⚠️ Received null message from upload.events queue');
          return;
        }

        try {
          const event = JSON.parse(msg.content.toString());
          logger.info('📨 Received upload event', { 
            type: event.type,
            userId: event.userId,
            messageId: msg.properties.messageId
          });

          await this.handleEvent(event);
          channel.ack(msg);
          
        } catch (error) {
          logger.error('❌ Error processing upload event:', error);
          channel.nack(msg, false, false); // Send to DLQ
        }
      }, { noAck: false });

      this.isRunning = true;
      logger.info('✅ Upload Event Consumer started');

    } catch (error) {
      logger.error('❌ Failed to start Upload Event Consumer:', error);
      throw error;
    }
  }

  /**
   * Stop consuming events
   */
  public async stop(): Promise<void> {
    if (!this.isRunning) {
      logger.warn('⚠️ Upload Event Consumer is not running');
      return;
    }

    this.isRunning = false;
    logger.info('🛑 Upload Event Consumer stopped');
  }

  /**
   * Handle different types of upload events
   */
  private async handleEvent(event: any): Promise<void> {
    switch (event.type) {
      case 'upload.listings.images':
      case 'upload.inventory.images':
      case 'upload.profile.image':
        await this.handleImageUpload(event as ImageUploadEvent);
        break;
      case 'upload.image.deleted':
        await this.handleImageDeletion(event as ImageDeleteEvent);
        break;
      default:
        logger.warn('⚠️ Unknown upload event type:', event.type);
    }
  }

  /**
   * Handle image upload events
   */
  private async handleImageUpload(event: ImageUploadEvent): Promise<void> {
    try {
      logger.info('🖼️ Processing image upload event', { 
        userId: event.userId,
        imageCount: event.data.count,
        type: event.type
      });

      // 1. Cleanup orphaned temp files
      await this.cleanupOrphanedFiles();

      // 2. Cleanup old temp files (older than 24 hours)
      await this.cleanupOldTempFiles();

      // 3. Invalidate image cache for uploaded images
      await this.invalidateImageCache(event.data.images.map(img => img.id));

      // 4. Update upload analytics
      await this.updateUploadAnalytics(event.userId, event.data.count);

      logger.info('✅ Image upload event processed successfully', { 
        userId: event.userId,
        imageCount: event.data.count
      });

    } catch (error) {
      logger.error('❌ Error handling image upload event:', error);
      throw error;
    }
  }

  /**
   * Handle image deletion events
   */
  private async handleImageDeletion(event: ImageDeleteEvent): Promise<void> {
    try {
      logger.info('🗑️ Processing image deletion event', { 
        userId: event.userId,
        imageId: event.data.imageId
      });

      // 1. Invalidate cache for deleted image
      await this.invalidateImageCache([event.data.imageId]);

      // 2. Cleanup any related temp files
      await this.cleanupRelatedTempFiles(event.data.imageId);

      logger.info('✅ Image deletion event processed successfully', { 
        userId: event.userId,
        imageId: event.data.imageId
      });

    } catch (error) {
      logger.error('❌ Error handling image deletion event:', error);
      throw error;
    }
  }

  /**
   * Cleanup orphaned temporary files
   */
  private async cleanupOrphanedFiles(): Promise<void> {
    try {
      if (!fs.existsSync(this.tempDir)) {
        return;
      }

      const files = fs.readdirSync(this.tempDir);
      let cleanedCount = 0;

      for (const file of files) {
        const filePath = path.join(this.tempDir, file);
        const stats = fs.statSync(filePath);

        // Remove files that are not being used (no recent access)
        const timeSinceAccess = Date.now() - stats.atime.getTime();
        const timeSinceModification = Date.now() - stats.mtime.getTime();

        // Clean files that haven't been accessed in 1 hour and modified more than 2 hours ago
        if (timeSinceAccess > 3600000 && timeSinceModification > 7200000) {
          try {
            fs.unlinkSync(filePath);
            cleanedCount++;
            logger.debug('🗑️ Cleaned orphaned file', { filePath });
          } catch (error) {
            logger.warn('⚠️ Failed to delete orphaned file', { 
              filePath, 
              error: error instanceof Error ? error.message : String(error)
            });
          }
        }
      }

      if (cleanedCount > 0) {
        logger.info('🧹 Orphaned files cleanup completed', { cleanedCount });
      }

    } catch (error) {
      logger.error('❌ Error during orphaned files cleanup:', error);
    }
  }

  /**
   * Cleanup old temporary files (older than 24 hours)
   */
  private async cleanupOldTempFiles(): Promise<void> {
    try {
      if (!fs.existsSync(this.tempDir)) {
        return;
      }

      const files = fs.readdirSync(this.tempDir);
      const twentyFourHoursAgo = Date.now() - (24 * 60 * 60 * 1000);
      let cleanedCount = 0;

      for (const file of files) {
        const filePath = path.join(this.tempDir, file);
        const stats = fs.statSync(filePath);

        // Remove files older than 24 hours
        if (stats.mtime.getTime() < twentyFourHoursAgo) {
          try {
            fs.unlinkSync(filePath);
            cleanedCount++;
            logger.debug('🗑️ Cleaned old temp file', { 
              filePath,
              age: Date.now() - stats.mtime.getTime()
            });
          } catch (error) {
            logger.warn('⚠️ Failed to delete old temp file', { 
              filePath, 
              error: error instanceof Error ? error.message : String(error)
            });
          }
        }
      }

      if (cleanedCount > 0) {
        logger.info('🧹 Old temp files cleanup completed', { 
          cleanedCount,
          maxAge: '24 hours'
        });
      }

    } catch (error) {
      logger.error('❌ Error during old temp files cleanup:', error);
    }
  }

  /**
   * Invalidate image cache
   */
  private async invalidateImageCache(imageIds: string[]): Promise<void> {
    try {
      // TODO: Implement cache invalidation logic
      // This could involve:
      // 1. Redis cache invalidation
      // 2. CDN cache purging
      // 3. Browser cache headers update
      
      logger.info('🔄 Cache invalidation requested', { 
        imageIds,
        count: imageIds.length
      });

      // Placeholder for cache invalidation
      // await redisClient.del(imageIds.map(id => `image:${id}`));
      // await cdnClient.purge(imageIds);

    } catch (error) {
      logger.error('❌ Error during cache invalidation:', error);
    }
  }

  /**
   * Cleanup temp files related to a specific image
   */
  private async cleanupRelatedTempFiles(imageId: string): Promise<void> {
    try {
      if (!fs.existsSync(this.tempDir)) {
        return;
      }

      const files = fs.readdirSync(this.tempDir);
      let cleanedCount = 0;

      for (const file of files) {
        // Look for files that might be related to this image
        if (file.includes(imageId) || file.includes(imageId.substring(0, 8))) {
          const filePath = path.join(this.tempDir, file);
          try {
            fs.unlinkSync(filePath);
            cleanedCount++;
            logger.debug('🗑️ Cleaned related temp file', { filePath, imageId });
          } catch (error) {
            logger.warn('⚠️ Failed to delete related temp file', { 
              filePath, 
              imageId,
              error: error instanceof Error ? error.message : String(error)
            });
          }
        }
      }

      if (cleanedCount > 0) {
        logger.info('🧹 Related temp files cleanup completed', { 
          cleanedCount,
          imageId
        });
      }

    } catch (error) {
      logger.error('❌ Error during related temp files cleanup:', error);
    }
  }

  /**
   * Update upload analytics
   */
  private async updateUploadAnalytics(userId: string, imageCount: number): Promise<void> {
    try {
      // TODO: Implement analytics update
      // This could involve:
      // 1. Database analytics table update
      // 2. Redis metrics increment
      // 3. External analytics service call
      
      logger.info('📊 Upload analytics update', { 
        userId,
        imageCount,
        timestamp: new Date().toISOString()
      });

      // Placeholder for analytics update
      // await analyticsService.incrementUploadCount(userId, imageCount);

    } catch (error) {
      logger.error('❌ Error during analytics update:', error);
    }
  }

  /**
   * Get consumer status
   */
  public isConsumerRunning(): boolean {
    return this.isRunning;
  }

  /**
   * Get temp directory stats
   */
  public getTempDirectoryStats(): { fileCount: number; totalSize: number } {
    try {
      if (!fs.existsSync(this.tempDir)) {
        return { fileCount: 0, totalSize: 0 };
      }

      const files = fs.readdirSync(this.tempDir);
      let totalSize = 0;

      for (const file of files) {
        const filePath = path.join(this.tempDir, file);
        const stats = fs.statSync(filePath);
        totalSize += stats.size;
      }

      return {
        fileCount: files.length,
        totalSize
      };

    } catch (error) {
      logger.error('❌ Error getting temp directory stats:', error);
      return { fileCount: 0, totalSize: 0 };
    }
  }
}

export const uploadEventConsumer = UploadEventConsumer.getInstance();
