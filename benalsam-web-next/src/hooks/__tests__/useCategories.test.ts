import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useCategories } from '../useCategories'
import { categoryService } from '@/services/categoryService'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// Mock categoryService
vi.mock('@/services/categoryService', () => ({
  categoryService: {
    getCategories: vi.fn(),
  },
}))

describe('useCategories', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    })
    vi.clearAllMocks()
  })

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )

  it('should fetch categories successfully', async () => {
    const mockCategories = [
      { id: 1, name: 'Electronics', parent_id: null },
      { id: 2, name: 'Phones', parent_id: 1 },
    ]

    vi.mocked(categoryService.getCategories).mockResolvedValue(mockCategories)

    const { result } = renderHook(() => useCategories(), { wrapper })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.categories).toEqual(mockCategories)
    expect(result.current.error).toBeNull()
  })

  it('should return empty array when data is not available', () => {
    vi.mocked(categoryService.getCategories).mockResolvedValue([])

    const { result } = renderHook(() => useCategories(), { wrapper })

    expect(result.current.categories).toEqual([])
  })

  it('should handle loading state', () => {
    vi.mocked(categoryService.getCategories).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    )

    const { result } = renderHook(() => useCategories(), { wrapper })

    expect(result.current.isLoading).toBe(true)
    expect(result.current.categories).toEqual([])
  })

  it('should handle errors', async () => {
    const mockError = new Error('Failed to fetch categories')
    vi.mocked(categoryService.getCategories).mockRejectedValue(mockError)

    const { result } = renderHook(() => useCategories(), { wrapper })

    await waitFor(() => {
      expect(result.current.error).toBeTruthy()
    })

    expect(result.current.categories).toEqual([])
  })

  it('should cache categories for 24 hours', async () => {
    const mockCategories = [
      { id: 1, name: 'Electronics', parent_id: null },
    ]

    vi.mocked(categoryService.getCategories).mockResolvedValue(mockCategories)

    const { result: result1 } = renderHook(() => useCategories(), { wrapper })

    await waitFor(() => {
      expect(result1.current.isLoading).toBe(false)
    })

    // Second hook instance should use cached data
    const { result: result2 } = renderHook(() => useCategories(), { wrapper })

    expect(result2.current.categories).toEqual(mockCategories)
    // Should not call getCategories again due to cache
    expect(categoryService.getCategories).toHaveBeenCalledTimes(1)
  })

  it('should return categories with nested structure', async () => {
    const mockCategories = [
      { id: 1, name: 'Electronics', parent_id: null },
      { id: 2, name: 'Phones', parent_id: 1 },
      { id: 3, name: 'Laptops', parent_id: 1 },
      { id: 4, name: 'iPhone', parent_id: 2 },
    ]

    vi.mocked(categoryService.getCategories).mockResolvedValue(mockCategories)

    const { result } = renderHook(() => useCategories(), { wrapper })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.categories).toEqual(mockCategories)
    expect(result.current.categories.length).toBe(4)
  })
})

