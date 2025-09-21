import { v2 as cloudinary } from 'cloudinary';
import { ICloudinaryService, UploadedFile } from '../interfaces/IUploadService';
import logger from '../config/logger';

/**
 * Cloudinary Service Implementation
 * Cloudinary işlemleri için abstraction
 */
export class CloudinaryService implements ICloudinaryService {
  private isInitialized: boolean = false;

  constructor() {
    this.initializeClient();
  }

  private initializeClient(): void {
    try {
      const cloudName = process.env['CLOUDINARY_CLOUD_NAME'];
      const apiKey = process.env['CLOUDINARY_API_KEY'];
      const apiSecret = process.env['CLOUDINARY_API_SECRET'];

      if (!cloudName || !apiKey || !apiSecret) {
        logger.warn('Cloudinary credentials not found, service will have limited functionality');
        return;
      }

      cloudinary.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret,
        secure: true
      });

      this.isInitialized = true;
      logger.info('✅ Cloudinary client initialized');
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

      const result = await cloudinary.uploader.upload(`data:${file.mimetype};base64,${file.buffer.toString('base64')}`, {
        folder,
        resource_type: 'auto',
        quality: 'auto',
        fetch_format: 'auto',
        transformation: [
          { width: 1920, height: 1080, crop: 'limit' },
          { quality: 'auto' }
        ]
      });

      const uploadedFile: UploadedFile = {
        id: result.public_id,
        originalName: file.originalname,
        filename: result.original_filename || file.originalname,
        url: result.secure_url,
        size: result.bytes,
        mimeType: file.mimetype,
        width: result.width,
        height: result.height,
        format: result.format,
        publicId: result.public_id,
        folder: result.folder,
        uploadedAt: new Date().toISOString()
      };

      logger.info('Image uploaded successfully', { 
        publicId: result.public_id,
        url: result.secure_url 
      });

      return uploadedFile;
    } catch (error) {
      logger.error('Cloudinary upload failed:', error);
      throw new Error(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async deleteImage(publicId: string): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('Cloudinary client not initialized');
    }

    try {
      logger.info('Deleting image from Cloudinary', { publicId });

      const result = await cloudinary.uploader.destroy(publicId);
      
      if (result.result !== 'ok') {
        throw new Error(`Failed to delete image: ${result.result}`);
      }

      logger.info('Image deleted successfully', { publicId });
    } catch (error) {
      logger.error('Cloudinary delete failed:', error);
      throw new Error(`Delete failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getImageInfo(publicId: string): Promise<any> {
    if (!this.isInitialized) {
      throw new Error('Cloudinary client not initialized');
    }

    try {
      logger.debug('Getting image info from Cloudinary', { publicId });

      const result = await cloudinary.api.resource(publicId);
      
      return {
        publicId: result.public_id,
        format: result.format,
        width: result.width,
        height: result.height,
        bytes: result.bytes,
        url: result.secure_url,
        createdAt: result.created_at
      };
    } catch (error) {
      logger.error('Cloudinary get info failed:', error);
      throw new Error(`Get info failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async healthCheck(): Promise<{ status: string; responseTime: number }> {
    const startTime = Date.now();
    
    try {
      if (!this.isInitialized) {
        return { status: 'unhealthy', responseTime: 0 };
      }

      // Simple API call to test connection
      await cloudinary.api.ping();
      
      const responseTime = Date.now() - startTime;
      return { status: 'healthy', responseTime };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      logger.error('Cloudinary health check failed:', error);
      return { status: 'unhealthy', responseTime };
    }
  }
}