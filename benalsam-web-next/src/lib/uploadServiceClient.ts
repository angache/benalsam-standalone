/**
 * Upload Service Integration - EXACT COPY from old system
 * Adapted from benalsam-web/src/services/uploadService.ts
 */

import { logger } from '@/utils/production-logger';

// VPS veya local kullanımı kontrolü
const useVpsServices = process.env.USE_VPS_SERVICES === 'true' || 
                       process.env.NEXT_PUBLIC_USE_VPS_SERVICES === 'true' ||
                       (process.env.NODE_ENV === 'production' && process.env.USE_VPS_SERVICES !== 'false');

const UPLOAD_SERVICE_URL = process.env.NEXT_PUBLIC_UPLOAD_SERVICE_URL || 
  (useVpsServices
    ? 'https://api.benalsam.com/api/v1/upload'
    : 'http://localhost:3007/api/v1')

interface UploadedImage {
  id: string
  url: string
  width: number
  height: number
  format: string
  size: number
  thumbnailUrl?: string
  mediumUrl?: string
}

interface UploadResponse {
  success: boolean
  data: {
    images: UploadedImage[]
    tempId?: string
    expiresAt?: string
  }
  message?: string
}

class UploadServiceClient {
  private userId: string | null = null

  setUserId(userId: string): void {
    this.userId = userId
  }

  private getUserId(): string {
    if (!this.userId) {
      throw new Error('User ID not set. Call setUserId() first.')
    }
    return this.userId
  }

  /**
   * Upload images to Upload Service - EXACT COPY from old system
   */
  async uploadImages(
    files: File[],
    type: 'listings' | 'inventory' | 'profile' = 'listings',
    onProgress?: (progress: number) => void
  ): Promise<UploadedImage[]> {
    if (!files || files.length === 0) {
      throw new Error('No files provided')
    }

    const userId = this.getUserId()
    
    try {
      // Create FormData
      const formData = new FormData()
      files.forEach(file => {
        formData.append('images', file)
      })

      // Add type parameter
      formData.append('type', type)

      logger.debug('[UploadServiceClient] Uploading files to Upload Service', { count: files.length })

      // Upload to Upload Service
      const response = await fetch(`${UPLOAD_SERVICE_URL}/upload/${type}`, {
        method: 'POST',
        headers: {
          'x-user-id': userId,
        },
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `Upload failed: ${response.statusText}`)
      }

      const result: UploadResponse = await response.json()
      
      if (!result.success) {
        throw new Error(result.message || 'Upload failed')
      }

      logger.debug('[UploadServiceClient] Upload successful', { imageCount: result.data.images.length })

      // Simulate progress completion
      if (onProgress) {
        onProgress(100)
      }

      return result.data.images

    } catch (error) {
      logger.error('[UploadServiceClient] Upload error', { error })
      throw error
    }
  }

  /**
   * Check if Upload Service is available
   */
  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${UPLOAD_SERVICE_URL}/health`, {
        method: 'GET',
      })

      return response.ok
    } catch (error) {
      logger.warn('[UploadServiceClient] Service not available', { error })
      return false
    }
  }
}

export const uploadServiceClient = new UploadServiceClient()
export default uploadServiceClient

