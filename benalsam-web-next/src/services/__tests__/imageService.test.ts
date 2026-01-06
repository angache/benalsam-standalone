import { describe, it, expect, beforeEach, vi } from 'vitest'
import { uploadImages, deleteImages } from '../imageService'
import { supabase } from '@/lib/supabase'
import { logger } from '@/utils/production-logger'

// Mock dependencies
vi.mock('@/lib/supabase', () => ({
  supabase: {
    storage: {
      from: vi.fn(),
    },
  },
}))

vi.mock('@/utils/production-logger', () => ({
  logger: {
    debug: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}))

describe('imageService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('uploadImages', () => {
    it('should upload single image successfully', async () => {
      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      const mockPublicUrl = 'https://example.com/image.jpg'

      const mockGetPublicUrl = vi.fn().mockReturnValue({
        data: { publicUrl: mockPublicUrl },
      })

      const mockUpload = vi.fn().mockResolvedValue({
        data: { path: 'user-1/123-test.jpg' },
        error: null,
      })

      vi.mocked(supabase.storage.from).mockReturnValue({
        upload: mockUpload,
        getPublicUrl: mockGetPublicUrl,
      } as never)

      const result = await uploadImages([mockFile], 'user-1')

      expect(result).toEqual([mockPublicUrl])
      expect(mockUpload).toHaveBeenCalledWith(
        expect.stringContaining('user-1/'),
        mockFile,
        expect.objectContaining({
          cacheControl: '3600',
          upsert: false,
        })
      )
    })

    it('should upload multiple images successfully', async () => {
      const mockFiles = [
        new File(['test1'], 'test1.jpg', { type: 'image/jpeg' }),
        new File(['test2'], 'test2.jpg', { type: 'image/jpeg' }),
      ]

      const mockPublicUrls = [
        'https://example.com/image1.jpg',
        'https://example.com/image2.jpg',
      ]

      const mockGetPublicUrl = vi
        .fn()
        .mockReturnValueOnce({
          data: { publicUrl: mockPublicUrls[0] },
        })
        .mockReturnValueOnce({
          data: { publicUrl: mockPublicUrls[1] },
        })

      const mockUpload = vi
        .fn()
        .mockResolvedValueOnce({
          data: { path: 'user-1/123-test1.jpg' },
          error: null,
        })
        .mockResolvedValueOnce({
          data: { path: 'user-1/123-test2.jpg' },
          error: null,
        })

      vi.mocked(supabase.storage.from).mockReturnValue({
        upload: mockUpload,
        getPublicUrl: mockGetPublicUrl,
      } as never)

      const result = await uploadImages(mockFiles, 'user-1')

      expect(result).toEqual(mockPublicUrls)
      expect(mockUpload).toHaveBeenCalledTimes(2)
    })

    it('should handle upload errors', async () => {
      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      const mockError = new Error('Upload failed')

      const mockUpload = vi.fn().mockResolvedValue({
        data: null,
        error: mockError,
      })

      vi.mocked(supabase.storage.from).mockReturnValue({
        upload: mockUpload,
      } as never)

      await expect(uploadImages([mockFile], 'user-1')).rejects.toThrow('Upload failed')
      expect(logger.error).toHaveBeenCalled()
    })

    it('should use custom bucket when provided', async () => {
      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      const mockPublicUrl = 'https://example.com/image.jpg'

      const mockGetPublicUrl = vi.fn().mockReturnValue({
        data: { publicUrl: mockPublicUrl },
      })

      const mockUpload = vi.fn().mockResolvedValue({
        data: { path: 'user-1/123-test.jpg' },
        error: null,
      })

      vi.mocked(supabase.storage.from).mockReturnValue({
        upload: mockUpload,
        getPublicUrl: mockGetPublicUrl,
      } as never)

      await uploadImages([mockFile], 'user-1', 'custom_bucket')

      expect(supabase.storage.from).toHaveBeenCalledWith('custom_bucket')
    })

    it('should generate unique file names', async () => {
      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      const mockPublicUrl = 'https://example.com/image.jpg'

      const mockGetPublicUrl = vi.fn().mockReturnValue({
        data: { publicUrl: mockPublicUrl },
      })

      const mockUpload = vi.fn().mockResolvedValue({
        data: { path: 'user-1/123-test.jpg' },
        error: null,
      })

      vi.mocked(supabase.storage.from).mockReturnValue({
        upload: mockUpload,
        getPublicUrl: mockGetPublicUrl,
      } as never)

      await uploadImages([mockFile], 'user-1')

      const uploadCall = mockUpload.mock.calls[0]
      const fileName = uploadCall[0] as string

      expect(fileName).toContain('user-1/')
      expect(fileName).toMatch(/\.jpg$/)
    })
  })

  describe('deleteImages', () => {
    it('should delete images successfully', async () => {
      const mockUrls = [
        'https://example.com/storage/v1/object/public/item_images/user-1/image1.jpg',
        'https://example.com/storage/v1/object/public/item_images/user-1/image2.jpg',
      ]

      const mockRemove = vi.fn().mockResolvedValue({
        data: [{ path: 'user-1/image1.jpg' }, { path: 'user-1/image2.jpg' }],
        error: null,
      })

      vi.mocked(supabase.storage.from).mockReturnValue({
        remove: mockRemove,
      } as never)

      const result = await deleteImages(mockUrls)

      expect(result).toEqual([
        { path: 'user-1/image1.jpg' },
        { path: 'user-1/image2.jpg' },
      ])
      expect(mockRemove).toHaveBeenCalledWith([
        'user-1/image1.jpg',
        'user-1/image2.jpg',
      ])
    })

    it('should return null for empty urls array', async () => {
      const result = await deleteImages([])

      expect(result).toBeNull()
    })

    it('should handle invalid URLs gracefully', async () => {
      const mockUrls = ['invalid-url', 'https://example.com/no-bucket/image.jpg']

      const mockRemove = vi.fn().mockResolvedValue({
        data: [],
        error: null,
      })

      vi.mocked(supabase.storage.from).mockReturnValue({
        remove: mockRemove,
      } as never)

      const result = await deleteImages(mockUrls)

      expect(result).toEqual([])
      expect(logger.error).toHaveBeenCalled()
    })

    it('should handle different bucket names', async () => {
      const mockUrls = [
        'https://example.com/storage/v1/object/public/avatars/user-1/avatar.jpg',
        'https://example.com/storage/v1/object/public/inventory/user-1/item.jpg',
      ]

      const mockRemove = vi.fn().mockResolvedValue({
        data: [{ path: 'user-1/avatar.jpg' }, { path: 'user-1/item.jpg' }],
        error: null,
      })

      vi.mocked(supabase.storage.from).mockReturnValue({
        remove: mockRemove,
      } as never)

      const result = await deleteImages(mockUrls)

      expect(result).toEqual([
        { path: 'user-1/avatar.jpg' },
        { path: 'user-1/item.jpg' },
      ])
    })

    it('should handle deletion errors', async () => {
      const mockUrls = [
        'https://example.com/storage/v1/object/public/item_images/user-1/image.jpg',
      ]

      const mockError = new Error('Deletion failed')
      const mockRemove = vi.fn().mockResolvedValue({
        data: null,
        error: mockError,
      })

      vi.mocked(supabase.storage.from).mockReturnValue({
        remove: mockRemove,
      } as never)

      const result = await deleteImages(mockUrls)

      expect(result).toBeNull()
      expect(logger.error).toHaveBeenCalledWith(
        '[ImageService] Error deleting images',
        expect.objectContaining({ error: mockError })
      )
    })

    it('should extract file paths correctly from URLs', async () => {
      const mockUrls = [
        'https://example.com/storage/v1/object/public/item_images/user-1/subfolder/image.jpg',
      ]

      const mockRemove = vi.fn().mockResolvedValue({
        data: [{ path: 'user-1/subfolder/image.jpg' }],
        error: null,
      })

      vi.mocked(supabase.storage.from).mockReturnValue({
        remove: mockRemove,
      } as never)

      await deleteImages(mockUrls)

      expect(mockRemove).toHaveBeenCalledWith(['user-1/subfolder/image.jpg'])
    })
  })
})

