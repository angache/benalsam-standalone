import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useFilteredListings } from '../useFilteredListings'
import { listingService } from '@/services/listingService'
import { logger } from '@/utils/production-logger'

// Mock dependencies
vi.mock('@/services/listingService', () => ({
  listingService: {
    getListingsWithFilters: vi.fn(),
  },
}))

vi.mock('@/utils/production-logger', () => ({
  logger: {
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}))

describe('useFilteredListings', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          gcTime: 0,
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

  const mockListings = [
    { id: 'listing-1', title: 'Test Listing 1', price: 100 },
    { id: 'listing-2', title: 'Test Listing 2', price: 200 },
  ]

  it('should fetch filtered listings successfully', async () => {
    vi.mocked(listingService.getListingsWithFilters).mockResolvedValue({
      listings: mockListings as never,
      total: 2,
    })

    const { result } = renderHook(
      () =>
        useFilteredListings({
          filters: mockFilters,
          sortBy: 'newest',
          userId: null,
          pageSize: 12,
        }),
      { wrapper }
    )

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data?.pages[0].listings).toEqual(mockListings)
    expect(result.current.data?.pages[0].totalCount).toBe(2)
    expect(listingService.getListingsWithFilters).toHaveBeenCalledWith(
      null,
      {
        search: undefined,
        categoryId: undefined,
        minPrice: undefined,
        maxPrice: undefined,
        location: undefined,
        urgency: undefined,
        sortBy: 'created_at',
        sortOrder: 'desc',
      },
      {
        page: 1,
        limit: 12,
      }
    )
  })

  it('should apply filters correctly', async () => {
    const filtersWithValues = {
      searchQuery: 'test',
      categoryId: 1,
      minPrice: 100,
      maxPrice: 500,
      location: 'İstanbul',
      urgency: 'high',
    }

    vi.mocked(listingService.getListingsWithFilters).mockResolvedValue({
      listings: mockListings as never,
      total: 2,
    })

    renderHook(
      () =>
        useFilteredListings({
          filters: filtersWithValues,
          sortBy: 'price_low',
          userId: 'user-1',
          pageSize: 20,
        }),
      { wrapper }
    )

    await waitFor(() => {
      expect(listingService.getListingsWithFilters).toHaveBeenCalled()
    })

    expect(listingService.getListingsWithFilters).toHaveBeenCalledWith(
      'user-1',
      {
        search: 'test',
        categoryId: 1,
        minPrice: 100,
        maxPrice: 500,
        location: 'İstanbul',
        urgency: 'high',
        sortBy: 'budget',
        sortOrder: 'asc',
      },
      {
        page: 1,
        limit: 20,
      }
    )
  })

  it('should handle different sort options', async () => {
    vi.mocked(listingService.getListingsWithFilters).mockResolvedValue({
      listings: mockListings as never,
      total: 2,
    })

    const sortOptions = [
      { sortBy: 'newest' as const, expectedSort: 'created_at', expectedOrder: 'desc' },
      { sortBy: 'price_low' as const, expectedSort: 'budget', expectedOrder: 'asc' },
      { sortBy: 'price_high' as const, expectedSort: 'budget', expectedOrder: 'desc' },
      { sortBy: 'popular' as const, expectedSort: 'view_count', expectedOrder: 'desc' },
    ]

    for (const { sortBy, expectedSort, expectedOrder } of sortOptions) {
      vi.clearAllMocks()
      renderHook(
        () =>
          useFilteredListings({
            filters: mockFilters,
            sortBy,
            userId: null,
          }),
        { wrapper }
      )

      await waitFor(() => {
        expect(listingService.getListingsWithFilters).toHaveBeenCalled()
      })

      const call = vi.mocked(listingService.getListingsWithFilters).mock.calls[0]
      expect(call[1]?.sortBy).toBe(expectedSort)
      expect(call[1]?.sortOrder).toBe(expectedOrder)
    }
  })

  it('should fetch next page correctly', async () => {
    vi.mocked(listingService.getListingsWithFilters).mockResolvedValue({
      listings: mockListings as never,
      total: 5,
    })

    const { result } = renderHook(
      () =>
        useFilteredListings({
          filters: mockFilters,
          sortBy: 'newest',
          userId: null,
          pageSize: 2,
        }),
      { wrapper }
    )

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    // Fetch next page
    await result.current.fetchNextPage()

    await waitFor(() => {
      expect(listingService.getListingsWithFilters).toHaveBeenCalledTimes(2)
    })

    // Check second page call
    const secondCall = vi.mocked(listingService.getListingsWithFilters).mock.calls[1]
    expect(secondCall[2]?.page).toBe(2)
  })

  it('should not fetch next page when no more pages', async () => {
    vi.mocked(listingService.getListingsWithFilters).mockResolvedValue({
      listings: mockListings as never,
      total: 2,
    })

    const { result } = renderHook(
      () =>
        useFilteredListings({
          filters: mockFilters,
          sortBy: 'newest',
          userId: null,
          pageSize: 12,
        }),
      { wrapper }
    )

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    // Try to fetch next page (should not fetch since total is 2 and pageSize is 12)
    await result.current.fetchNextPage()

    // Should still be only 1 call
    expect(listingService.getListingsWithFilters).toHaveBeenCalledTimes(1)
    expect(result.current.hasNextPage).toBe(false)
  })

  it('should handle errors correctly', async () => {
    const error = new Error('Failed to fetch listings')
    vi.mocked(listingService.getListingsWithFilters).mockRejectedValue(error)

    const { result } = renderHook(
      () =>
        useFilteredListings({
          filters: mockFilters,
          sortBy: 'newest',
          userId: null,
        }),
      { wrapper }
    )

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })

    expect(result.current.error).toEqual(error)
  })

  it('should not retry on rate limit errors', async () => {
    const rateLimitError = new Error('429 Rate limit exceeded')
    vi.mocked(listingService.getListingsWithFilters).mockRejectedValue(rateLimitError)

    const { result } = renderHook(
      () =>
        useFilteredListings({
          filters: mockFilters,
          sortBy: 'newest',
          userId: null,
        }),
      { wrapper }
    )

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })

    // Should not retry on rate limit
    expect(listingService.getListingsWithFilters).toHaveBeenCalledTimes(1)
  })

  it('should retry on network errors', async () => {
    const networkError = new Error('Network error')
    vi.mocked(listingService.getListingsWithFilters)
      .mockRejectedValueOnce(networkError)
      .mockResolvedValueOnce({
        listings: mockListings as never,
        total: 2,
      })

    const { result } = renderHook(
      () =>
        useFilteredListings({
          filters: mockFilters,
          sortBy: 'newest',
          userId: null,
        }),
      { wrapper }
    )

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    }, { timeout: 5000 })

    // Should have retried
    expect(listingService.getListingsWithFilters).toHaveBeenCalledTimes(2)
  })

  it('should log debug messages', async () => {
    vi.mocked(listingService.getListingsWithFilters).mockResolvedValue({
      listings: mockListings as never,
      total: 2,
    })

    renderHook(
      () =>
        useFilteredListings({
          filters: mockFilters,
          sortBy: 'newest',
          userId: null,
        }),
      { wrapper }
    )

    await waitFor(() => {
      expect(logger.debug).toHaveBeenCalled()
    })

    expect(logger.debug).toHaveBeenCalledWith(
      '[useFilteredListings] Fetching page',
      expect.objectContaining({
        pageParam: 1,
        filters: mockFilters,
        sortBy: 'newest',
      })
    )
  })
})

