/**
 * Upload Service Integration - EXACT COPY from old system
 * Adapted from benalsam-web/src/services/uploadService.ts
 */

const UPLOAD_SERVICE_URL = process.env.NEXT_PUBLIC_UPLOAD_SERVICE_URL || 'http://localhost:3007/api/v1'

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

      console.log(`🚀 [UploadService] Uploading ${files.length} files to Upload Service...`)

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

      console.log(`✅ [UploadService] Upload successful:`, result.data.images.length, 'images')

      // Simulate progress completion
      if (onProgress) {
        onProgress(100)
      }

      return result.data.images

    } catch (error) {
      console.error('❌ [UploadService] Upload error:', error)
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
      console.warn('⚠️ [UploadService] Service not available:', error)
      return false
    }
  }
}

export const uploadServiceClient = new UploadServiceClient()
export default uploadServiceClient

