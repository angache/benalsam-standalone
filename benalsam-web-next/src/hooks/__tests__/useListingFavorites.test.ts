import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useListingFavorites } from '../useListingFavorites'
import { useToast } from '@/components/ui/use-toast'

// Mock dependencies
vi.mock('@/components/ui/use-toast', () => ({
  useToast: vi.fn(() => ({
    toast: vi.fn(),
  })),
}))

// Mock fetch
global.fetch = vi.fn()

describe('useListingFavorites', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          gcTime: 0,
        },
        mutations: {
          retry: false,
        },
      },
    })
    vi.clearAllMocks()
  })

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )

  const mockFilters = {
    searchQuery: '',
    categoryId: null,
    minPrice: null,
    maxPrice: null,
    location: null,
    urgency: null,
  }

  const mockListing = {
    id: 'listing-1',
    title: 'Test Listing',
    is_favorited: false,
  }

  it('should add favorite successfully', async () => {
    const mockToast = vi.fn()
    vi.mocked(useToast).mockReturnValue({
      toast: mockToast,
    })

    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: { id: 'favorite-id' } }),
    } as Response)

    // Set initial query data
    queryClient.setQueryData(['filtered-listings', mockFilters, 'user-1', 'newest'], {
      pages: [
        {
          listings: [mockListing],
          totalCount: 1,
        },
      ],
    })

    const { result } = renderHook(
      () =>
        useListingFavorites({
          userId: 'user-1',
          filters: mockFilters,
          sortBy: 'newest',
        }),
      { wrapper }
    )

    await result.current.mutateAsync({
      listingId: 'listing-1',
      isFavorited: true,
    })

    expect(global.fetch).toHaveBeenCalledWith('/api/favorites', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ listingId: 'listing-1' }),
    })

    expect(mockToast).toHaveBeenCalledWith({
      title: '❤️ Favorilere Eklendi',
      description: 'İlan favorilerinize kaydedildi',
      duration: 2000,
    })
  })

  it('should remove favorite successfully', async () => {
    const mockToast = vi.fn()
    vi.mocked(useToast).mockReturnValue({
      toast: mockToast,
    })

    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: { message: 'Removed' } }),
    } as Response)

    const { result } = renderHook(
      () =>
        useListingFavorites({
          userId: 'user-1',
          filters: mockFilters,
          sortBy: 'newest',
        }),
      { wrapper }
    )

    await result.current.mutateAsync({
      listingId: 'listing-1',
      isFavorited: false,
    })

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/favorites?listingId=listing-1',
      {
        method: 'DELETE',
      }
    )

    expect(mockToast).toHaveBeenCalledWith({
      title: 'Favorilerden Çıkarıldı',
      description: 'İlan favorilerinizden kaldırıldı',
      duration: 2000,
    })
  })

  it('should throw error when userId is not provided', async () => {
    const { result } = renderHook(
      () =>
        useListingFavorites({
          userId: '',
          filters: mockFilters,
          sortBy: 'newest',
        }),
      { wrapper }
    )

    await expect(
      result.current.mutateAsync({
        listingId: 'listing-1',
        isFavorited: true,
      })
    ).rejects.toThrow('Giriş yapmalısınız')
  })

  it('should handle API errors when adding favorite', async () => {
    const mockToast = vi.fn()
    vi.mocked(useToast).mockReturnValue({
      toast: mockToast,
    })

    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Failed to add favorite' }),
    } as Response)

    const { result } = renderHook(
      () =>
        useListingFavorites({
          userId: 'user-1',
          filters: mockFilters,
          sortBy: 'newest',
        }),
      { wrapper }
    )

    await expect(
      result.current.mutateAsync({
        listingId: 'listing-1',
        isFavorited: true,
      })
    ).rejects.toThrow('Failed to add favorite')

    expect(mockToast).toHaveBeenCalledWith({
      title: '❌ Hata',
      description: 'Failed to add favorite',
      variant: 'destructive',
      duration: 3000,
    })
  })

  it('should handle API errors when removing favorite', async () => {
    const mockToast = vi.fn()
    vi.mocked(useToast).mockReturnValue({
      toast: mockToast,
    })

    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Failed to remove favorite' }),
    } as Response)

    const { result } = renderHook(
      () =>
        useListingFavorites({
          userId: 'user-1',
          filters: mockFilters,
          sortBy: 'newest',
        }),
      { wrapper }
    )

    await expect(
      result.current.mutateAsync({
        listingId: 'listing-1',
        isFavorited: false,
      })
    ).rejects.toThrow('Failed to remove favorite')
  })

  it('should optimistically update listing favorite status', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: { id: 'favorite-id' } }),
    } as Response)

    // Set initial query data
    queryClient.setQueryData(['filtered-listings', mockFilters, 'user-1', 'newest'], {
      pages: [
        {
          listings: [{ id: 'listing-1', title: 'Test', is_favorited: false }],
          totalCount: 1,
        },
      ],
    })

    const { result } = renderHook(
      () =>
        useListingFavorites({
          userId: 'user-1',
          filters: mockFilters,
          sortBy: 'newest',
        }),
      { wrapper }
    )

    await result.current.mutateAsync({
      listingId: 'listing-1',
      isFavorited: true,
    })

    // Check optimistic update
    const data = queryClient.getQueryData([
      'filtered-listings',
      mockFilters,
      'user-1',
      'newest',
    ]) as {
      pages: Array<{ listings: Array<{ id: string; is_favorited?: boolean }> }>
    }

    expect(data.pages[0].listings[0].is_favorited).toBe(true)
  })

  it('should invalidate queries on success', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: { id: 'favorite-id' } }),
    } as Response)

    const { result } = renderHook(
      () =>
        useListingFavorites({
          userId: 'user-1',
          filters: mockFilters,
          sortBy: 'newest',
        }),
      { wrapper }
    )

    await result.current.mutateAsync({
      listingId: 'listing-1',
      isFavorited: true,
    })

    // Check that queries were invalidated
    expect(
      queryClient.getQueryState(['filtered-listings'])?.isInvalidated
    ).toBe(true)
    expect(queryClient.getQueryState(['favorites'])?.isInvalidated).toBe(true)
  })

  it('should rollback optimistic update on error', async () => {
    const mockToast = vi.fn()
    vi.mocked(useToast).mockReturnValue({
      toast: mockToast,
    })

    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Failed' }),
    } as Response)

    // Set initial query data
    const initialData = {
      pages: [
        {
          listings: [{ id: 'listing-1', title: 'Test', is_favorited: false }],
          totalCount: 1,
        },
      ],
    }
    queryClient.setQueryData(
      ['filtered-listings', mockFilters, 'user-1', 'newest'],
      initialData
    )

    const { result } = renderHook(
      () =>
        useListingFavorites({
          userId: 'user-1',
          filters: mockFilters,
          sortBy: 'newest',
        }),
      { wrapper }
    )

    await expect(
      result.current.mutateAsync({
        listingId: 'listing-1',
        isFavorited: true,
      })
    ).rejects.toThrow()

    // Query should be invalidated (rollback)
    expect(
      queryClient.getQueryState(['filtered-listings'])?.isInvalidated
    ).toBe(true)
  })
})

