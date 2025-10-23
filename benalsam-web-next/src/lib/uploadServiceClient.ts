import axios, { AxiosInstance, AxiosProgressEvent } from 'axios'

const UPLOAD_SERVICE_URL = process.env.NEXT_PUBLIC_UPLOAD_SERVICE_URL || 'http://localhost:3007'

export interface UploadResult {
  images: Array<{
    url: string
    filename: string
    size: number
    mimeType: string
  }>
  totalSize: number
  uploadTime: number
}

class UploadServiceClient {
  private client: AxiosInstance

  constructor() {
    this.client = axios.create({
      baseURL: UPLOAD_SERVICE_URL,
      timeout: 120000, // 2 minutes for large uploads
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
  }

  /**
   * Upload images with progress tracking
   */
  async uploadImages(
    files: File[],
    userId: string,
    onProgress?: (progress: number) => void
  ): Promise<UploadResult> {
    const formData = new FormData()
    
    files.forEach((file) => {
      formData.append('images', file)
    })

    try {
      console.log('📤 [UPLOAD] Uploading images:', {
        count: files.length,
        userId,
        totalSize: files.reduce((sum, f) => sum + f.size, 0),
      })

      const response = await this.client.post<UploadResult>('/api/v1/upload/images', formData, {
        headers: {
          'x-user-id': userId,
        },
        onUploadProgress: (progressEvent: AxiosProgressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total)
            console.log(`📊 [UPLOAD] Progress: ${percentCompleted}%`)
            onProgress?.(percentCompleted)
          }
        },
      })

      console.log('✅ [UPLOAD] Upload successful:', {
        imageCount: response.data.images.length,
        totalSize: response.data.totalSize,
        uploadTime: response.data.uploadTime,
      })

      return response.data
    } catch (error) {
      console.error('❌ [UPLOAD] Upload failed:', error)
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || 'Görsel yüklenirken hata oluştu')
      }
      throw error
    }
  }

  /**
   * Check if upload service is available
   */
  async isAvailable(): Promise<boolean> {
    try {
      const response = await this.client.get('/health', { timeout: 3000 })
      return response.status === 200
    } catch (error) {
      console.warn('⚠️ [UPLOAD] Service not available:', error)
      return false
    }
  }
}

export const uploadServiceClient = new UploadServiceClient()
export default uploadServiceClient

