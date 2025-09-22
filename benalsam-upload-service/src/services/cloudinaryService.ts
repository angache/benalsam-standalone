import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import logger from '../config/logger';
import { UploadedFile } from '../interfaces/IUploadService';

export class CloudinaryService {
  private isInitialized: boolean = false;

  constructor() {
    this.initialize();
  }

  private initialize(): void {
    try {
      cloudinary.config({
        cloud_name: process.env['CLOUDINARY_CLOUD_NAME']!,
        api_key: process.env['CLOUDINARY_API_KEY']!,
        api_secret: process.env['CLOUDINARY_API_SECRET']!
      });

      this.isInitialized = true;
      logger.info('✅ Cloudinary client initialized', { service: 'upload-service' });
    } catch (error) {
      logger.error('Failed to initialize Cloudinary client:', error);
      this.isInitialized = false;
    }
  }

  async uploadImage(file: Express.Multer.File, folder: string): Promise<UploadedFile> {
    if (!this.isInitialized) {
      throw new Error('Cloudinary client not initialized');
    }

    try {
      logger.info('Uploading image to Cloudinary', { 
        filename: file.originalname, 
        size: file.size,
        folder 
      });


      // Disk storage approach - use file path
      if (!file.path || !fs.existsSync(file.path)) {
        throw new Error(`File path not found or file does not exist. Path: ${file.path}`);
      }

      const uploadSource = file.path;

      logger.info('🚀 Starting Cloudinary upload', {
        uploadSourceType: typeof uploadSource,
        uploadSourceLength: uploadSource.length,
        uploadSourcePreview: uploadSource.substring(0, 100) + '...',
        folder,
        filename: file.originalname
      });

      const result = await cloudinary.uploader.upload(uploadSource, {
        folder,
        resource_type: 'auto',
        quality: 'auto',
        fetch_format: 'auto',
        transformation: [
          { width: 1200, height: 1200, crop: 'limit' },
          { quality: 'auto' }
        ]
      });

      logger.info('✅ Cloudinary upload completed', {
        publicId: result.public_id,
        url: result.secure_url,
        bytes: result.bytes,
        format: result.format
      });

      const uploadedFile: UploadedFile = {
        id: result.public_id,
        originalName: file.originalname,
        filename: result.original_filename || file.originalname,
        url: result.secure_url,
        size: result.bytes,
        mimeType: result.format,
        width: result.width,
        height: result.height,
        format: result.format,
        publicId: result.public_id,
        folder: result.folder,
        uploadedAt: new Date(result.created_at).toISOString()
      };

      logger.info('✅ Image uploaded successfully', { 
        filename: file.originalname,
        publicId: result.public_id,
        url: result.secure_url
      });

      // Clean up temporary file (only for disk storage)
      if (file.path && fs.existsSync(file.path)) {
        try {
          fs.unlinkSync(file.path);
          logger.info('🗑️ Temporary file cleaned up', { path: file.path });
        } catch (cleanupError) {
          logger.warn('⚠️ Failed to cleanup temporary file', { 
            path: file.path, 
            error: cleanupError instanceof Error ? cleanupError.message : String(cleanupError)
          });
        }
      }

      return uploadedFile;
    } catch (error) {
      // Clean up temporary file on error
      if (file.path && fs.existsSync(file.path)) {
        try {
          fs.unlinkSync(file.path);
          logger.info('🗑️ Temporary file cleaned up after error', { path: file.path });
        } catch (cleanupError) {
          logger.warn('⚠️ Failed to cleanup temporary file after error', { 
            path: file.path, 
            error: cleanupError instanceof Error ? cleanupError.message : String(cleanupError)
          });
        }
      }
      
      
      logger.error('Cloudinary upload failed:', error);
      throw new Error(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async deleteImage(publicId: string): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('Cloudinary client not initialized');
    }

    try {
      await cloudinary.uploader.destroy(publicId);
      logger.info('✅ Image deleted successfully', { publicId });
    } catch (error) {
      logger.error('Failed to delete image:', error);
      throw new Error(`Delete failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async getImageInfo(publicId: string): Promise<any> {
    if (!this.isInitialized) {
      throw new Error('Cloudinary client not initialized');
    }

    try {
      const result = await cloudinary.api.resource(publicId);
      return result;
    } catch (error) {
      logger.error('Failed to get image info:', error);
      throw new Error(`Get info failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

export default new CloudinaryService();
