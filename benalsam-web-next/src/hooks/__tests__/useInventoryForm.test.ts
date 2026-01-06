import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { useInventoryForm } from '../useInventoryForm'
import { getInventoryItemById, addInventoryItem, updateInventoryItem } from '@/services/inventoryService'
import { categoryService } from '@/services/categoryService'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/use-toast'

// Mock dependencies
vi.mock('@/services/inventoryService', () => ({
  getInventoryItemById: vi.fn(),
  addInventoryItem: vi.fn(),
  updateInventoryItem: vi.fn(),
}))

vi.mock('@/services/categoryService', () => ({
  categoryService: {
    getCategories: vi.fn(),
  },
}))

vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}))

vi.mock('@/components/ui/use-toast', () => ({
  useToast: vi.fn(),
}))

describe('useInventoryForm', () => {
  const mockRouter = {
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
  }

  const mockToast = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useRouter).mockReturnValue(mockRouter as never)
    vi.mocked(useToast).mockReturnValue({ toast: mockToast } as never)
    vi.mocked(useAuth).mockReturnValue({
      user: { id: 'user-1' },
      isLoading: false,
    } as never)
  })

  describe('initialization', () => {
    it('should initialize with default form data', () => {
      const { result } = renderHook(() => useInventoryForm())

      expect(result.current.formData.name).toBe('')
      expect(result.current.formData.description).toBe('')
      expect(result.current.formData.images).toEqual([])
      expect(result.current.formData.mainImageIndex).toBe(-1)
    })

    it('should set isEditMode to true when itemId is provided', () => {
      const { result } = renderHook(() => useInventoryForm('item-1'))

      expect(result.current.isEditMode).toBe(true)
    })

    it('should set isEditMode to false when itemId is not provided', () => {
      const { result } = renderHook(() => useInventoryForm())

      expect(result.current.isEditMode).toBe(false)
    })
  })

  describe('loading item data (edit mode)', () => {
    it('should load item data when in edit mode', async () => {
      const mockItem = {
        id: 'item-1',
        name: 'Test Item',
        description: 'Test Description',
        category: 'Electronics > Phones',
        images: [
          { url: 'https://example.com/image1.jpg', is_main: true },
          { url: 'https://example.com/image2.jpg', is_main: false },
        ],
      }

      const mockCategories = [
        { id: 1, name: 'Electronics', level: 0, parent_id: null },
        { id: 2, name: 'Phones', level: 1, parent_id: 1 },
      ]

      vi.mocked(getInventoryItemById).mockResolvedValue(mockItem as never)
      vi.mocked(categoryService.getCategories).mockResolvedValue(mockCategories as never)

      const { result } = renderHook(() => useInventoryForm('item-1'))

      await waitFor(() => {
        expect(result.current.loadingInitialData).toBe(false)
      })

      expect(result.current.formData.name).toBe('Test Item')
      expect(result.current.formData.description).toBe('Test Description')
    })

    it('should redirect when item not found', async () => {
      vi.mocked(getInventoryItemById).mockResolvedValue(null)

      renderHook(() => useInventoryForm('item-1'))

      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith('/envanterim')
      })

      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Ürün Bulunamadı',
          variant: 'destructive',
        })
      )
    })
  })

  describe('form updates', () => {
    it('should update form data', () => {
      const { result } = renderHook(() => useInventoryForm())

      act(() => {
        result.current.updateFormData({ name: 'New Name' })
      })

      expect(result.current.formData.name).toBe('New Name')
    })

    it('should update selected categories', () => {
      const { result } = renderHook(() => useInventoryForm())

      act(() => {
        result.current.setSelectedMainCategory('1')
      })

      expect(result.current.selectedMainCategory).toBe('1')
    })
  })

  describe('image handling', () => {
    it('should add images', () => {
      const { result } = renderHook(() => useInventoryForm())

      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })

      act(() => {
        result.current.addImages([file])
      })

      expect(result.current.formData.images.length).toBe(1)
      expect(result.current.formData.images[0].name).toBe('test.jpg')
    })

    it('should remove images', () => {
      const { result } = renderHook(() => useInventoryForm())

      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })

      act(() => {
        result.current.addImages([file])
        result.current.removeImage(0)
      })

      expect(result.current.formData.images.length).toBe(0)
    })

    it('should set main image', () => {
      const { result } = renderHook(() => useInventoryForm())

      const file1 = new File(['test1'], 'test1.jpg', { type: 'image/jpeg' })
      const file2 = new File(['test2'], 'test2.jpg', { type: 'image/jpeg' })

      act(() => {
        result.current.addImages([file1, file2])
        result.current.setMainImage(1)
      })

      expect(result.current.formData.mainImageIndex).toBe(1)
    })
  })

  describe('validation', () => {
    it('should validate form data', () => {
      const { result } = renderHook(() => useInventoryForm())

      act(() => {
        result.current.validateForm()
      })

      expect(result.current.errors.name).toBeDefined()
    })

    it('should clear errors', () => {
      const { result } = renderHook(() => useInventoryForm())

      act(() => {
        result.current.setErrors({ name: 'Error' })
        result.current.clearErrors()
      })

      expect(result.current.errors).toEqual({})
    })
  })

  describe('form submission', () => {
    it('should submit new item', async () => {
      const mockItem = { id: 'new-item-1' }
      vi.mocked(addInventoryItem).mockResolvedValue(mockItem as never)

      const { result } = renderHook(() => useInventoryForm())

      act(() => {
        result.current.updateFormData({
          name: 'Test Item',
          description: 'Test Description',
        })
        result.current.setSelectedMainCategory('1')
      })

      await act(async () => {
        await result.current.handleSubmit()
      })

      expect(addInventoryItem).toHaveBeenCalled()
      expect(mockRouter.push).toHaveBeenCalledWith('/envanterim')
    })

    it('should update existing item', async () => {
      const mockItem = {
        id: 'item-1',
        name: 'Test Item',
        description: 'Test Description',
        category: 'Electronics',
      }

      vi.mocked(getInventoryItemById).mockResolvedValue(mockItem as never)
      vi.mocked(categoryService.getCategories).mockResolvedValue([])
      vi.mocked(updateInventoryItem).mockResolvedValue(mockItem as never)

      const { result } = renderHook(() => useInventoryForm('item-1'))

      await waitFor(() => {
        expect(result.current.loadingInitialData).toBe(false)
      })

      act(() => {
        result.current.updateFormData({ name: 'Updated Name' })
      })

      await act(async () => {
        await result.current.handleSubmit()
      })

      expect(updateInventoryItem).toHaveBeenCalled()
      expect(mockRouter.push).toHaveBeenCalledWith('/envanterim')
    })

    it('should handle submission errors', async () => {
      vi.mocked(addInventoryItem).mockRejectedValue(new Error('Submission failed'))

      const { result } = renderHook(() => useInventoryForm())

      act(() => {
        result.current.updateFormData({
          name: 'Test Item',
          description: 'Test Description',
        })
        result.current.setSelectedMainCategory('1')
      })

      await act(async () => {
        await result.current.handleSubmit()
      })

      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          variant: 'destructive',
        })
      )
    })
  })

  describe('upload progress', () => {
    it('should track upload progress', () => {
      const { result } = renderHook(() => useInventoryForm())

      act(() => {
        result.current.setUploadProgress(50)
      })

      expect(result.current.uploadProgress).toBe(50)
    })

    it('should set uploading state', () => {
      const { result } = renderHook(() => useInventoryForm())

      act(() => {
        result.current.setIsUploading(true)
      })

      expect(result.current.isUploading).toBe(true)
    })
  })
})

