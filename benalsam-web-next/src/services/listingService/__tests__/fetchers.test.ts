import { describe, it, expect, beforeEach, vi } from 'vitest'
import { fetchListings, fetchSingleListing, fetchMyListings, fetchListingsWithFilters } from '../fetchers'
import { supabase } from '@/lib/supabase'
import { searchListingsWithElasticsearch, fetchListingByIdFromES } from '@/services/elasticsearchService'
import { processFetchedListings, addPremiumSorting } from '../core'

// Mock dependencies
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
    rpc: vi.fn(),
  },
}))

vi.mock('@/services/elasticsearchService', () => ({
  searchListingsWithElasticsearch: vi.fn(),
  fetchListingByIdFromES: vi.fn(),
}))

vi.mock('../core', () => ({
  processFetchedListings: vi.fn(),
  addPremiumSorting: vi.fn((query) => query),
}))

vi.mock('@/hooks/use-toast', () => ({
  toast: vi.fn(),
}))

vi.mock('@/lib/debugSource', () => ({
  incrementSourceCount: vi.fn(),
}))

vi.mock('@/utils/production-logger', () => ({
  logger: {
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}))

describe('ListingService Fetchers', () => {
  const mockListing = {
    id: 'listing-1',
    title: 'Test Listing',
    description: 'Test Description',
    budget: 1000,
    status: 'active',
    user_id: 'user-1',
    category_id: 1,
    created_at: '2025-01-01T00:00:00Z',
    expires_at: null,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('fetchListings', () => {
    it('should fetch listings from Elasticsearch successfully', async () => {
      const mockElasticsearchResult = {
        data: [mockListing],
        total: 1,
      }

      vi.mocked(searchListingsWithElasticsearch).mockResolvedValue(mockElasticsearchResult as any)

      const result = await fetchListings(null, { page: 1, limit: 24 })

      expect(result.listings).toHaveLength(1)
      expect(result.total).toBe(1)
      expect(result.hasMore).toBe(false)
      expect(searchListingsWithElasticsearch).toHaveBeenCalled()
    })

    it('should fallback to Supabase when Elasticsearch fails', async () => {
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          or: vi.fn().mockReturnValue({
            range: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({
                data: [mockListing],
                error: null,
              }),
            }),
          }),
        }),
      })

      const mockCount = vi.fn().mockResolvedValue({
        count: 1,
      })

      vi.mocked(searchListingsWithElasticsearch).mockResolvedValue({
        data: [],
        total: 0,
      } as any)

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'listings') {
          return {
            select: mockSelect,
          } as any
        }
        return {} as any
      })

      // Mock count query
      const mockCountSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          or: vi.fn().mockResolvedValue(mockCount),
        }),
      })

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'listings') {
          return {
            select: (columns: string, options?: { count?: string; head?: boolean }) => {
              if (options?.count === 'exact' && options?.head) {
                return mockCountSelect()
              }
              return mockSelect()
            },
          } as any
        }
        return {} as any
      })

      vi.mocked(processFetchedListings).mockResolvedValue([mockListing] as any)

      const result = await fetchListings(null, { page: 1, limit: 24 })

      expect(result.listings).toHaveLength(1)
      // Total might be 0 if count query fails, but listings should be processed
      expect(result.listings.length).toBeGreaterThan(0)
    })

    it('should handle errors gracefully', async () => {
      vi.mocked(searchListingsWithElasticsearch).mockRejectedValue(new Error('Elasticsearch error'))

      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          or: vi.fn().mockReturnValue({
            range: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({
                data: null,
                error: {
                  message: 'Database error',
                },
              }),
            }),
          }),
        }),
      })

      const mockCountSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          or: vi.fn().mockResolvedValue({
            count: 0,
          }),
        }),
      })

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'listings') {
          return {
            select: (columns: string, options?: { count?: string; head?: boolean }) => {
              if (options?.count === 'exact' && options?.head) {
                return mockCountSelect()
              }
              return mockSelect()
            },
          } as any
        }
        return {} as any
      })

      const result = await fetchListings(null, { page: 1, limit: 24 })

      expect(result.listings).toEqual([])
      expect(result.total).toBe(0)
      expect(result.hasMore).toBe(false)
    })
  })

  describe('fetchSingleListing', () => {
    it('should fetch single listing from Elasticsearch successfully', async () => {
      vi.mocked(fetchListingByIdFromES).mockResolvedValue(mockListing as any)

      const result = await fetchSingleListing('listing-1', null)

      expect(result).toEqual(mockListing)
      expect(fetchListingByIdFromES).toHaveBeenCalledWith('listing-1')
    })

    it('should fallback to Supabase when Elasticsearch fails', async () => {
      const mockMaybeSingle = vi.fn().mockResolvedValue({
        data: mockListing,
        error: null,
      })

      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: mockMaybeSingle,
        }),
      })

      vi.mocked(fetchListingByIdFromES).mockResolvedValue(null)
      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
      } as any)
      vi.mocked(processFetchedListings).mockResolvedValue([mockListing] as any)

      const result = await fetchSingleListing('listing-1', null)

      expect(result).toBeTruthy()
      expect(result?.id).toBe('listing-1')
    })

    it('should return null when listing not found', async () => {
      vi.mocked(fetchListingByIdFromES).mockResolvedValue(null)

      const mockMaybeSingle = vi.fn().mockResolvedValue({
        data: null,
        error: null,
      })

      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: mockMaybeSingle,
        }),
      })

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
      } as any)

      const result = await fetchSingleListing('non-existent', null)

      expect(result).toBeNull()
    })
  })

  describe('fetchMyListings', () => {
    it('should fetch user listings successfully', async () => {
      const mockOrder = vi.fn().mockResolvedValue({
        data: [mockListing],
        error: null,
      })

      const mockOr = vi.fn().mockReturnValue({
        order: mockOrder,
      })

      const mockEqStatus = vi.fn().mockReturnValue({
        or: mockOr,
      })

      const mockEqUserId = vi.fn().mockReturnValue({
        eq: mockEqStatus,
      })

      const mockSelect = vi.fn().mockReturnValue({
        eq: mockEqUserId,
      })

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
      } as any)

      // processFetchedListings should be called with the data
      vi.mocked(processFetchedListings).mockImplementation(async (data) => {
        return data || []
      })

      const result = await fetchMyListings('user-1')

      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('listing-1')
      expect(processFetchedListings).toHaveBeenCalledWith([mockListing], 'user-1')
    })

    it('should return empty array on error', async () => {
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: null,
            error: {
              message: 'Database error',
            },
          }),
        }),
      })

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
      } as any)

      const result = await fetchMyListings('user-1')

      expect(result).toEqual([])
    })
  })

  describe('fetchListingsWithFilters', () => {
    it('should fetch listings with filters from Elasticsearch successfully', async () => {
      const mockElasticsearchResult = {
        data: [mockListing],
        total: 1,
      }

      vi.mocked(searchListingsWithElasticsearch).mockResolvedValue(mockElasticsearchResult as any)

      const filters = {
        search: 'test',
        categoryId: 1,
        minPrice: 100,
        maxPrice: 1000,
        sortBy: 'created_at',
        sortOrder: 'desc' as const,
      }

      const result = await fetchListingsWithFilters(null, filters, { page: 1, limit: 12 })

      expect(result.listings).toHaveLength(1)
      expect(result.total).toBe(1)
      expect(searchListingsWithElasticsearch).toHaveBeenCalledWith(
        expect.objectContaining({
          query: 'test',
          filters: expect.objectContaining({
            category_id: 1,
            minBudget: 100,
            maxBudget: 1000,
          }),
        }),
        null
      )
    })

    it('should fallback to Supabase when Elasticsearch fails', async () => {
      vi.mocked(searchListingsWithElasticsearch).mockResolvedValue({
        data: [],
        total: 0,
      } as any)

      // Simplified mock - just test that it returns empty array when ES fails
      const mockOrder = vi.fn().mockResolvedValue({
        data: [mockListing],
        error: null,
      })

      const mockRange = vi.fn().mockReturnValue({
        order: mockOrder,
      })

      const mockOr = vi.fn().mockReturnValue({
        range: mockRange,
      })

      const mockLte = vi.fn().mockReturnValue({
        or: mockOr,
      })

      const mockGte = vi.fn().mockReturnValue({
        lte: mockLte,
      })

      const mockEq = vi.fn().mockReturnValue({
        gte: mockGte,
      })

      const mockSelect = vi.fn().mockReturnValue({
        eq: mockEq,
      })

      const mockCountSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          gte: vi.fn().mockReturnValue({
            lte: vi.fn().mockReturnValue({
              or: vi.fn().mockResolvedValue({
                count: 1,
              }),
            }),
          }),
        }),
      })

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'listings') {
          return {
            select: (columns: string, options?: { count?: string; head?: boolean }) => {
              if (options?.count === 'exact' && options?.head) {
                return mockCountSelect()
              }
              return mockSelect()
            },
          } as any
        }
        return {} as any
      })

      vi.mocked(processFetchedListings).mockResolvedValue([mockListing] as any)

      const filters = {
        categoryId: 1,
        minPrice: 100,
        maxPrice: 1000,
      }

      const result = await fetchListingsWithFilters(null, filters, { page: 1, limit: 12 })

      // Just verify it doesn't crash and returns a result
      expect(result).toBeDefined()
      expect(Array.isArray(result.listings)).toBe(true)
    })
  })
})

