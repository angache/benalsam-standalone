/**
 * Upload Service
 * 
 * @fileoverview Upload service integration for Listing Service
 * @author Benalsam Team
 * @version 1.0.0
 */

import axios from 'axios';
import { logger } from '../config/logger';

const UPLOAD_SERVICE_URL = process.env['UPLOAD_SERVICE_URL'] || 'http://localhost:3007/api/v1';
const UPLOAD_SERVICE_TIMEOUT = parseInt(process.env['UPLOAD_SERVICE_TIMEOUT'] || '30000');

export class UploadService {
  private static instance: UploadService;

  static getInstance(): UploadService {
    if (!UploadService.instance) {
      UploadService.instance = new UploadService();
    }
    return UploadService.instance;
  }

  /**
   * Upload images to Upload Service
   */
  async uploadImages(images: string[], userId: string): Promise<{
    success: boolean;
    data?: any;
    error?: string;
  }> {
    try {
      logger.info('📤 Uploading images to Upload Service', { 
        imageCount: images.length, 
        userId 
      });

      const response = await axios.post(
        `${UPLOAD_SERVICE_URL}/upload/listings`,
        { images },
        {
          headers: {
            'x-user-id': userId,
            'Content-Type': 'application/json'
          },
          timeout: UPLOAD_SERVICE_TIMEOUT
        }
      );

      logger.info('✅ Images uploaded successfully', { 
        userId,
        uploadedCount: response.data.data?.length || 0
      });

      return {
        success: true,
        data: response.data.data
      };

    } catch (error) {
      logger.error('❌ Error uploading images:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Upload single image
   */
  async uploadSingleImage(imageUrl: string, userId: string): Promise<{
    success: boolean;
    data?: any;
    error?: string;
  }> {
    return this.uploadImages([imageUrl], userId);
  }

  /**
   * Check Upload Service health
   */
  async checkHealth(): Promise<{
    status: 'healthy' | 'unhealthy';
    responseTime: number;
    error?: string;
  }> {
    const startTime = Date.now();
    
    try {
      const response = await axios.get(
        `${UPLOAD_SERVICE_URL}/health`,
        { timeout: 5000 }
      );

      const responseTime = Date.now() - startTime;
      
      return {
        status: response.status === 200 ? 'healthy' : 'unhealthy',
        responseTime
      };

    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      return {
        status: 'unhealthy',
        responseTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

export const uploadService = UploadService.getInstance();
