import cloudinary from 'cloudinary';
import { logger } from '../config/logger';

// Configure Cloudinary
const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

if (!cloudName || !apiKey || !apiSecret) {
  throw new Error('Cloudinary configuration missing. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET');
}

cloudinary.v2.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret
});

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
  async uploadImage(
    file: Express.Multer.File, 
    userId: string, 
    type: 'listings' | 'inventory' | 'profile'
  ): Promise<UploadResult> {
    try {
      logger.info(`📤 Starting Cloudinary upload for user: ${userId}, type: ${type}`);
      logger.info(`📤 File details:`, {
        mimetype: file.mimetype,
        size: file.size,
        hasPath: !!file.path,
        hasBuffer: !!file.buffer,
        originalname: file.originalname
      });

      // Validate file
      if (!file.mimetype.startsWith('image/')) {
        throw new Error('File is not an image');
      }
      
      if (file.size < 1000) { // Less than 1KB
        throw new Error('File is too small to be a valid image');
      }
      
      if (file.size > 10 * 1024 * 1024) { // More than 10MB
        throw new Error('File is too large');
      }

      // Check if file path exists and is readable
      if (file.path) {
        const fs = require('fs');
        try {
          const stats = fs.statSync(file.path);
          if (stats.size !== file.size) {
            throw new Error('File size mismatch');
          }
          // Read first few bytes to check if it's a valid image
          const buffer = fs.readFileSync(file.path, { start: 0, end: 10 });
          const header = buffer.toString('hex');
          console.log('File header (first 10 bytes):', header);
          
          // Check for common image file signatures
          if (!header.startsWith('ffd8') && // JPEG
              !header.startsWith('89504e47') && // PNG
              !header.startsWith('47494638') && // GIF
              !header.startsWith('52494646')) { // WEBP
            throw new Error('File does not appear to be a valid image');
          }
        } catch (error) {
          throw new Error(`File validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      // Generate folder path
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substring(2, 15);
      const folderPath = `benalsam/${userId}/${type}/${timestamp}_${randomId}`;

      // Upload options based on type
      let uploadOptions: any = {
        folder: folderPath,
        transformation: [
          { width: 800, height: 600, crop: 'fill' },
          { quality: 'auto', format: 'auto' }
        ],
        resource_type: 'image' as const
      };

      // Type-specific optimizations
      if (type === 'profile') {
        uploadOptions.transformation = [
          { width: 400, height: 400, crop: 'fill' },
          { quality: 'auto', format: 'auto' }
        ];
      } else if (type === 'inventory') {
        uploadOptions.transformation = [
          { width: 1200, height: 800, crop: 'fill' },
          { quality: 'auto', format: 'auto' }
        ];
        uploadOptions.eager = [
          { 
            width: 400, 
            height: 300, 
            crop: 'fill', 
            quality: 'auto'
          },
          { 
            width: 800, 
            height: 600, 
            crop: 'fill', 
            quality: 'auto'
          }
        ];
        uploadOptions.eager_async = true;
      }

      let result;
      
      // Check if file has path (disk storage) or buffer (memory storage)
      if (file.path) {
        // Disk storage - use file path
        result = await cloudinary.v2.uploader.upload(file.path, {
          ...uploadOptions,
          public_id: `${folderPath}/main`,
          overwrite: false,
          invalidate: true
        });
      } else if (file.buffer) {
        // Memory storage - convert buffer to base64
        const base64String = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
        result = await cloudinary.v2.uploader.upload(base64String, {
          ...uploadOptions,
          public_id: `${folderPath}/main`,
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
  async uploadImages(
    files: Express.Multer.File[], 
    userId: string, 
    type: 'listings' | 'inventory' | 'profile'
  ): Promise<UploadResult[]> {
    try {
      logger.info(`📤 Starting multiple image upload for user: ${userId}, type: ${type}, count: ${files.length}`);

      const uploadPromises = files.map((file, index) => 
        this.uploadImage(file, userId, type)
      );
      
      const results = await Promise.all(uploadPromises);

      logger.info(`✅ Successfully uploaded ${results.length} images`);
      return results;

    } catch (error) {
      logger.error('❌ Multiple image upload failed:', error);
      throw new Error(`Multiple image upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete image from Cloudinary
   */
  async deleteImage(publicId: string): Promise<DeleteResult> {
    try {
      logger.info(`🗑️ Deleting image from Cloudinary: ${publicId}`);

      const result = await cloudinary.v2.uploader.destroy(publicId, {
        resource_type: 'image'
      });

      logger.info(`✅ Image deleted: ${publicId}, result: ${result.result}`);

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
   * Delete folder from Cloudinary
   */
  async deleteFolder(folderPath: string): Promise<boolean> {
    try {
      logger.info(`🗑️ Deleting folder from Cloudinary: ${folderPath}`);

      const result = await cloudinary.v2.api.delete_resources_by_prefix(folderPath, {
        resource_type: 'image'
      });

      logger.info(`✅ Folder deleted: ${folderPath}, deleted: ${result.deleted}`);

      return Object.keys(result.deleted).length > 0;

    } catch (error) {
      logger.error('❌ Cloudinary folder delete failed:', error);
      throw new Error(`Folder deletion failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

export const cloudinaryService = new CloudinaryService();
