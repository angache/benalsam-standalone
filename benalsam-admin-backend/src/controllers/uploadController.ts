import { Request, Response } from 'express';
import cloudinaryService from '../services/cloudinaryService';
import logger from '../config/logger';

// Request tipini extend et
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
  };
}

export class UploadController {
  /**
   * Upload single image
   */
  async uploadSingleImage(req: AuthenticatedRequest, res: Response): Promise<Response | void> {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No image file provided'
        });
      }

      const userId = req.user?.id || req.body.userId;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'User authentication required'
        });
      }

      const result = await cloudinaryService.uploadImage(req.file, userId);

      return res.json({
        success: true,
        message: 'Image uploaded successfully',
        data: {
          publicId: result.publicId,
          url: result.secureUrl,
          width: result.width,
          height: result.height,
          format: result.format,
          size: result.size
        }
      });

    } catch (error) {
      logger.error('❌ Single image upload failed:', error);
      return res.status(500).json({
        success: false,
        message: 'Image upload failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Upload multiple images
   */
  async uploadMultipleImages(req: AuthenticatedRequest, res: Response): Promise<Response | void> {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No image files provided'
        });
      }

      const userId = req.user?.id || req.body.userId;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'User authentication required'
        });
      }

      const files = req.files as Express.Multer.File[];
      const results = await cloudinaryService.uploadMultipleImages(files, userId);

      return res.json({
        success: true,
        message: 'Images uploaded successfully',
        data: {
          images: results.map(result => ({
            publicId: result.publicId,
            url: result.secureUrl,
            width: result.width,
            height: result.height,
            format: result.format,
            size: result.size
          })),
          count: results.length
        }
      });

    } catch (error) {
      logger.error('❌ Multiple image upload failed:', error);
      return res.status(500).json({
        success: false,
        message: 'Image upload failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}

export default new UploadController();
