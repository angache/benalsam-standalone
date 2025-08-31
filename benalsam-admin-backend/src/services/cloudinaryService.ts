import cloudinary, { cloudinaryUploadOptions, cloudinaryDeleteOptions, inventoryUploadOptions } from '../config/cloudinary';
import logger from '../config/logger';

export interface UploadResult {
  publicId: string;
  url: string;
  secureUrl: string;
  width: number;
  height: number;
  format: string;
  size: number;
  thumbnailUrl?: string;
  mediumUrl?: string;
}

export interface DeleteResult {
  publicId: string;
  deleted: boolean;
}

export class CloudinaryService {
  /**
   * Upload image to Cloudinary with optimization
   */
  async uploadImage(file: Express.Multer.File, userId: string, folder?: string, itemId?: string, imageIndex?: number): Promise<UploadResult> {
    try {
      logger.info(`📤 Starting Cloudinary upload for user: ${userId}, folder: ${folder || 'default'}, itemId: ${itemId || 'N/A'}`);

      // Generate filename based on itemId and imageIndex
      let fileName: string;
      let folderPath: string;
      let uploadOptions: any;

      if (folder === 'inventory' && itemId) {
        // Inventory: benalsam/inventory/userId/itemId/main.jpg
        fileName = imageIndex === 0 ? 'main' : `image_${imageIndex}`;
        folderPath = `benalsam/inventory/${userId}/${itemId}/${fileName}`;
        uploadOptions = inventoryUploadOptions;
      } else if (folder === 'listings' && itemId) {
        // Listings: benalsam/listings/userId/itemId/main.jpg
        fileName = imageIndex === 0 ? 'main' : `image_${imageIndex}`;
        folderPath = `benalsam/listings/${userId}/${itemId}/${fileName}`;
        uploadOptions = cloudinaryUploadOptions;
      } else {
        // Fallback: benalsam/general/userId_timestamp_random
        const timestamp = Date.now();
        const randomId = Math.random().toString(36).substring(2, 15);
        fileName = `${userId}_${timestamp}_${randomId}`;
        folderPath = `benalsam/general/${fileName}`;
        uploadOptions = cloudinaryUploadOptions;
      }

      let result;
      
      // Check if file has path (disk storage) or buffer (memory storage)
      if (file.path) {
        // Disk storage - use file path
        result = await cloudinary.uploader.upload(file.path, {
          ...uploadOptions,
          public_id: folderPath,
          overwrite: false,
          invalidate: true
        });
      } else if (file.buffer) {
        // Memory storage - convert buffer to base64
        const base64String = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
        result = await cloudinary.uploader.upload(base64String, {
          ...uploadOptions,
          public_id: folderPath,
          overwrite: false,
          invalidate: true
        });
      } else {
        throw new Error('File has neither path nor buffer');
      }

      logger.info(`✅ Image uploaded successfully: ${result.public_id}`);

      // Extract thumbnail and medium URLs if available
      let thumbnailUrl, mediumUrl;
      if (result.eager && result.eager.length > 0) {
        thumbnailUrl = result.eager[0]?.secure_url;
        mediumUrl = result.eager[1]?.secure_url;
      }

      return {
        publicId: result.public_id,
        url: result.url,
        secureUrl: result.secure_url,
        width: result.width,
        height: result.height,
        format: result.format,
        size: result.bytes,
        thumbnailUrl,
        mediumUrl
      };

    } catch (error) {
      logger.error('❌ Cloudinary upload failed:', error);
      throw new Error(`Image upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Upload multiple images
   */
  async uploadMultipleImages(files: Express.Multer.File[], userId: string, folder?: string): Promise<UploadResult[]> {
    try {
      logger.info(`📤 Starting multiple image upload for user: ${userId}, count: ${files.length}, folder: ${folder || 'default'}`);

      const uploadPromises = files.map(file => this.uploadImage(file, userId, folder));
      const results = await Promise.all(uploadPromises);

      logger.info(`✅ Successfully uploaded ${results.length} images`);
      return results;

    } catch (error) {
      logger.error('❌ Multiple image upload failed:', error);
      throw new Error(`Multiple image upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Upload inventory images with special optimization
   */
  async uploadInventoryImages(files: Express.Multer.File[], userId: string, itemId?: string): Promise<UploadResult[]> {
    try {
      logger.info(`📤 Starting inventory image upload for user: ${userId}, count: ${files.length}, itemId: ${itemId || 'N/A'}`);

      const uploadPromises = files.map((file, index) => 
        this.uploadImage(file, userId, 'inventory', itemId, index)
      );
      const results = await Promise.all(uploadPromises);

      logger.info(`✅ Successfully uploaded ${results.length} inventory images`);
      return results;

    } catch (error) {
      logger.error('❌ Inventory image upload failed:', error);
      throw new Error(`Inventory image upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete image from Cloudinary
   */
  async deleteImage(publicId: string): Promise<DeleteResult> {
    try {
      logger.info(`🗑️ Deleting image from Cloudinary: ${publicId}`);

      const result = await cloudinary.uploader.destroy(publicId, cloudinaryDeleteOptions);

      logger.info(`✅ Image deleted successfully: ${publicId}`);

      return {
        publicId,
        deleted: result.result === 'ok'
      };

    } catch (error) {
      logger.error('❌ Cloudinary delete failed:', error);
      throw new Error(`Image deletion failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete multiple images from Cloudinary
   */
  async deleteMultipleImages(publicIds: string[]): Promise<DeleteResult[]> {
    try {
      logger.info(`🗑️ Deleting multiple images from Cloudinary: ${publicIds.length} images`);

      const deletePromises = publicIds.map(publicId => this.deleteImage(publicId));
      const results = await Promise.all(deletePromises);

      logger.info(`✅ Successfully deleted ${results.length} images`);
      return results;

    } catch (error) {
      logger.error('❌ Multiple image deletion failed:', error);
      throw new Error(`Multiple image deletion failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete folder from Cloudinary
   */
  async deleteFolder(folderPath: string): Promise<boolean> {
    try {
      logger.info(`🗑️ Deleting folder from Cloudinary: ${folderPath}`);

      // Klasör altındaki tüm dosyaları sil
      const deleteResult = await cloudinary.api.delete_resources_by_prefix(folderPath, {
        resource_type: 'image'
      });

      logger.info(`✅ Successfully deleted resources from folder: ${folderPath}`);
      logger.info(`📊 Delete result:`, deleteResult);

      // Boş klasörü de sil (UI'de gözükmesin diye)
      try {
        await cloudinary.api.delete_folder(folderPath);
        logger.info(`✅ Successfully deleted empty folder: ${folderPath}`);
      } catch (folderError) {
        // Klasör zaten boşsa veya yoksa hata verebilir, bu normal
        logger.debug(`ℹ️ Folder deletion note: ${folderError instanceof Error ? folderError.message : 'Unknown error'}`);
      }
      
      return true;

    } catch (error) {
      logger.error('❌ Folder deletion failed:', error);
      logger.error('❌ Error details:', {
        folderPath,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      return false; // Don't throw error, just return false
    }
  }

  /**
   * Delete inventory item folder and all its images
   */
  async deleteInventoryItemFolder(userId: string, itemId: string): Promise<boolean> {
    try {
      const folderPath = `benalsam/inventory/${userId}/${itemId}`;
      logger.info(`🗑️ Deleting inventory item folder: ${folderPath}`);

      const result = await this.deleteFolder(folderPath);
      return result;

    } catch (error) {
      logger.error('❌ Inventory item folder deletion failed:', error);
      return false;
    }
  }

  /**
   * Get optimized URL for different sizes
   */
  getOptimizedUrl(publicId: string, options: {
    width?: number;
    height?: number;
    crop?: 'fill' | 'scale' | 'fit' | 'thumb';
    quality?: 'auto' | 'low' | 'medium' | 'high';
    format?: 'auto' | 'webp' | 'jpg' | 'png';
  } = {}): string {
    const {
      width = 800,
      height = 600,
      crop = 'fill',
      quality = 'auto',
      format = 'auto'
    } = options;

    return cloudinary.url(publicId, {
      width,
      height,
      crop,
      quality,
      format,
      secure: true
    });
  }

  /**
   * Extract public ID from Cloudinary URL
   */
  extractPublicId(url: string): string | null {
    try {
      const urlParts = url.split('/');
      const uploadIndex = urlParts.findIndex(part => part === 'upload');
      if (uploadIndex === -1) return null;

      const publicIdParts = urlParts.slice(uploadIndex + 2);
      const publicId = publicIdParts.join('/').split('.')[0]; // Remove file extension
      return publicId;

    } catch (error) {
      logger.error('❌ Failed to extract public ID from URL:', error);
      return null;
    }
  }

  /**
   * Get image information
   */
  async getImageInfo(publicId: string): Promise<any> {
    try {
      const result = await cloudinary.api.resource(publicId, {
        resource_type: 'image'
      });

      return result;

    } catch (error) {
      logger.error('❌ Failed to get image info:', error);
      throw new Error(`Failed to get image info: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

export default new CloudinaryService();

