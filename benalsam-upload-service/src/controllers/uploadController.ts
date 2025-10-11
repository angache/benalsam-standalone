import { Response } from 'express';
import { logger } from '../config/logger';
import { publishEvent } from '../config/rabbitmq';
import { CloudinaryService } from '../services/cloudinaryService';
import { QuotaService } from '../services/quotaService';
import {
  validateUserAuthentication,
  validateFileUpload,
  validateSingleFileUpload,
  validateImageId
} from '../utils/validation';
import {
  AuthenticatedRequest,
  UploadResponse,
  UploadType,
  ValidationError,
  QuotaExceededError,
  CloudinaryError,
  FileProcessingError,
  ImageUploadEvent,
  ImageDeleteEvent
} from '../types/upload';

// Service instances
const cloudinaryService = new CloudinaryService();
const quotaService = new QuotaService();

/**
 * Handles image upload requests with proper validation and error handling
 */
async function handleImageUpload(
  req: AuthenticatedRequest, 
  res: Response, 
  type: UploadType
): Promise<void> {
  try {
    // Validate user authentication
    const userId = validateUserAuthentication(req);
    
    // Validate files
    const files = validateFileUpload(req, type);
    
    // Check quota
    const totalSize = files.reduce((sum, file) => sum + file.size, 0);
    const quotaCheck = await quotaService.checkQuota(userId, totalSize);
    if (!quotaCheck.allowed) {
      throw new QuotaExceededError('Quota exceeded', quotaCheck.quota);
    }

    logger.info(`📸 Uploading ${files.length} ${type} images for user: ${userId}`);

    // Debug file object
    logger.info('File object debug', { 
      fileCount: files.length,
      firstFile: {
        hasBuffer: !!files[0]?.buffer,
        hasPath: !!files[0]?.path,
        path: files[0]?.path,
        keys: Object.keys(files[0] || {}),
        mimetype: files[0]?.mimetype,
        originalname: files[0]?.originalname,
        size: files[0]?.size
      }
    });

    // Upload images to Cloudinary
    const results = await Promise.all(files.map(file => cloudinaryService.uploadImage(file, `${type}/${userId}`)));

    // Update quota
    await quotaService.updateQuota(userId, totalSize);

    // Publish event
    const event: ImageUploadEvent = {
      type: `upload.${type}.images` as any,
      userId,
      timestamp: new Date().toISOString(),
      data: {
        images: results.map((result: any) => ({
          id: result.publicId,
          url: result.url,
          width: result.width,
          height: result.height,
          format: result.format,
          size: result.size,
          ...(result.thumbnailUrl && { thumbnailUrl: result.thumbnailUrl }),
          ...(result.mediumUrl && { mediumUrl: result.mediumUrl })
        })),
        count: results.length
      }
    };
    
    await publishEvent(event.type, event.data);

    const response: UploadResponse = {
      success: true,
      message: `${type} images uploaded successfully`,
      data: {
        images: results.map((result: any) => ({
          id: result.publicId,
          url: result.url,
          width: result.width,
          height: result.height,
          format: result.format,
          size: result.size,
          ...(result.thumbnailUrl && { thumbnailUrl: result.thumbnailUrl }),
          ...(result.mediumUrl && { mediumUrl: result.mediumUrl })
        })),
        count: results.length
      }
    };

    res.json(response);

  } catch (error) {
    logger.error(`❌ ${type} image upload failed:`, error);
    
    if (error instanceof ValidationError || 
        error instanceof QuotaExceededError || 
        error instanceof CloudinaryError) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message,
        error: error.code,
        ...(error.details && { details: error.details })
      });
      return;
    }
    
    // Generic error
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: 'INTERNAL_ERROR'
    });
  }
}

export const uploadController = {
  // Upload listing images
  async uploadListingImages(req: AuthenticatedRequest, res: Response): Promise<void> {
    return handleImageUpload(req, res, 'listings');
  },

  // Upload inventory images
  async uploadInventoryImages(req: AuthenticatedRequest, res: Response): Promise<void> {
    return handleImageUpload(req, res, 'inventory');
  },

  // Upload profile image
  async uploadProfileImage(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      // Validate user authentication
      const userId = validateUserAuthentication(req);
      
      // Validate single file
      const file = validateSingleFileUpload(req, 'profile');
      
      // Check quota
      const quotaCheck = await quotaService.checkQuota(userId, file.size);
      if (!quotaCheck.allowed) {
        throw new QuotaExceededError('Quota exceeded', quotaCheck.quota);
      }

      logger.info(`📸 Uploading profile image for user: ${userId}`);

      // Upload image to Cloudinary
      const result = await cloudinaryService.uploadImage(file, `profile/${userId}`);

      // Update quota
      await quotaService.updateQuota(userId, file.size);

      // Publish event
      const event: ImageUploadEvent = {
        type: 'upload.profile.image',
        userId,
        timestamp: new Date().toISOString(),
        data: {
          images: [{
            id: result.publicId,
            url: result.url,
            width: result.width || 0,
            height: result.height || 0,
            format: result.format,
            size: result.size,
            // ...(result.thumbnailUrl && { thumbnailUrl: result.thumbnailUrl }),
            // ...(result.mediumUrl && { mediumUrl: result.mediumUrl })
          }],
          count: 1
        }
      };
      
      await publishEvent(event.type, event.data);

      const response: UploadResponse = {
        success: true,
        message: 'Profile image uploaded successfully',
        data: {
          image: {
            id: result.publicId,
            url: result.url,
            width: result.width || 0,
            height: result.height || 0,
            format: result.format,
            size: result.size,
            // ...(result.thumbnailUrl && { thumbnailUrl: result.thumbnailUrl }),
            // ...(result.mediumUrl && { mediumUrl: result.mediumUrl })
          }
        }
      };

      res.json(response);

    } catch (error) {
      logger.error('❌ Profile image upload failed:', error);
      
      if (error instanceof ValidationError || 
          error instanceof QuotaExceededError || 
          error instanceof CloudinaryError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message,
          error: error.code,
          ...(error.details && { details: error.details })
        });
        return;
      }
      
      // Generic error
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: 'INTERNAL_ERROR'
      });
    }
  },

  // Get user quota
  async getUserQuota(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.headers['x-user-id'] as string || req.user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'User authentication required'
        });
        return;
      }

      const quota = await quotaService.getQuota(userId);

      res.json({
        success: true,
        data: quota
      });

    } catch (error) {
      logger.error('❌ Get user quota failed:', error);
      throw error;
    }
  },

  // Delete image
  async deleteImage(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.headers['x-user-id'] as string || req.user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'User authentication required'
        });
        return;
      }

      const { id } = req.params;
      if (!id) {
        res.status(400).json({
          success: false,
          message: 'Image ID is required'
        });
        return;
      }

      logger.info(`🗑️ Deleting image: ${id} for user: ${userId}`);

      // Delete image from Cloudinary
      const result = await cloudinaryService.deleteImage(id);

      // Update quota
      // await quotaService.removeFromQuota(userId, id);

      // Publish event
      await publishEvent('upload.image.deleted', {
        userId,
        imageId: id,
        timestamp: new Date().toISOString()
      });

      res.json({
        success: true,
        message: 'Image deleted successfully',
        data: result
      });

    } catch (error) {
      logger.error('❌ Delete image failed:', error);
      throw error;
    }
  }
};
