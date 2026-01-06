import { describe, it, expect, beforeEach, vi } from 'vitest'
import { addFavorite, removeFavorite, isFavorite, toggleFavorite, fetchUserFavoriteListings } from '../favoriteService'
import { supabase } from '@/lib/supabase'
import { toast } from '@/hooks/use-toast'

// Mock dependencies
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}))

vi.mock('@/hooks/use-toast', () => ({
  toast: vi.fn(),
}))

vi.mock('@/utils/production-logger', () => ({
  logger: {
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}))

describe('FavoriteService', () => {
  const mockUserId = 'test-user-id'
  const mockListingId = 'test-listing-id'
  const mockFavorite = {
    id: 'favorite-id',
    user_id: mockUserId,
    listing_id: mockListingId,
    created_at: '2025-01-01T00:00:00Z',
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('addFavorite', () => {
    it('should add a favorite successfully', async () => {
      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: mockFavorite,
            error: null,
          }),
        }),
      })

      vi.mocked(supabase.from).mockReturnValue({
        insert: mockInsert,
      } as any)

      const result = await addFavorite(mockUserId, mockListingId)

      expect(result).toEqual(mockFavorite)
      expect(toast).toHaveBeenCalledWith({
        title: 'Favorilere Eklendi! ❤️',
        description: 'İlan favorilerinize eklendi.',
      })
    })

    it('should handle duplicate favorite gracefully', async () => {
      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: {
              code: '23505',
              message: 'Duplicate key violation',
            },
          }),
        }),
      })

      vi.mocked(supabase.from).mockReturnValue({
        insert: mockInsert,
      } as any)

      const result = await addFavorite(mockUserId, mockListingId)

      expect(result).toEqual({
        listing_id: mockListingId,
        user_id: mockUserId,
        already_favorited: true,
      })
      expect(toast).toHaveBeenCalledWith({
        title: 'Bilgi',
        description: 'Bu ilan zaten favorilerinizde.',
      })
    })

    it('should return null for invalid data', async () => {
      const result = await addFavorite('', mockListingId)

      expect(result).toBeNull()
      expect(toast).toHaveBeenCalledWith({
        title: 'Eksik Bilgi',
        description: 'Kullanıcı veya ilan ID\'si eksik.',
        variant: 'destructive',
      })
    })

    it('should handle database errors', async () => {
      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: {
              code: 'PGRST301',
              message: 'Database error',
            },
          }),
        }),
      })

      vi.mocked(supabase.from).mockReturnValue({
        insert: mockInsert,
      } as any)

      const result = await addFavorite(mockUserId, mockListingId)

      expect(result).toBeNull()
      expect(toast).toHaveBeenCalledWith({
        title: 'Favori Eklenemedi',
        description: 'Database error',
        variant: 'destructive',
      })
    })
  })

  describe('removeFavorite', () => {
    it('should remove a favorite successfully', async () => {
      const mockDelete = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: null,
            error: null,
          }),
        }),
      })

      vi.mocked(supabase.from).mockReturnValue({
        delete: mockDelete,
      } as any)

      const result = await removeFavorite(mockUserId, mockListingId)

      expect(result).toBe(true)
      expect(toast).toHaveBeenCalledWith({
        title: 'Favorilerden Kaldırıldı',
        description: 'İlan favorilerinizden kaldırıldı.',
      })
    })

    it('should return false for invalid data', async () => {
      const result = await removeFavorite('', mockListingId)

      expect(result).toBe(false)
    })

    it('should handle database errors', async () => {
      const mockDelete = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: null,
            error: {
              code: 'PGRST301',
              message: 'Database error',
            },
          }),
        }),
      })

      vi.mocked(supabase.from).mockReturnValue({
        delete: mockDelete,
      } as any)

      const result = await removeFavorite(mockUserId, mockListingId)

      expect(result).toBe(false)
    })
  })

  describe('isFavorite', () => {
    it('should return true if listing is favorited', async () => {
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { listing_id: mockListingId },
              error: null,
            }),
          }),
        }),
      })

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
      } as any)

      const result = await isFavorite(mockUserId, mockListingId)

      expect(result).toBe(true)
    })

    it('should return false if listing is not favorited', async () => {
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: {
                code: 'PGRST116',
                message: 'Not found',
              },
            }),
          }),
        }),
      })

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
      } as any)

      const result = await isFavorite(mockUserId, mockListingId)

      expect(result).toBe(false)
    })

    it('should return false for invalid data', async () => {
      const result = await isFavorite('', mockListingId)

      expect(result).toBe(false)
    })
  })

  describe('toggleFavorite', () => {
    it('should add favorite if not already favorited', async () => {
      // Mock isFavorite to return false
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116' },
            }),
          }),
        }),
      })

      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: mockFavorite,
            error: null,
          }),
        }),
      })

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'user_favorites') {
          return {
            select: mockSelect,
            insert: mockInsert,
          } as any
        }
        return {} as any
      })

      const result = await toggleFavorite(mockUserId, mockListingId)

      expect(result).toBe(true)
    })

    it('should remove favorite if already favorited', async () => {
      // Mock isFavorite to return true
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { listing_id: mockListingId },
              error: null,
            }),
          }),
        }),
      })

      const mockDelete = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: null,
            error: null,
          }),
        }),
      })

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'user_favorites') {
          return {
            select: mockSelect,
            delete: mockDelete,
          } as any
        }
        return {} as any
      })

      const result = await toggleFavorite(mockUserId, mockListingId)

      expect(result).toBe(false)
    })

    it('should return false for invalid data', async () => {
      const result = await toggleFavorite('', mockListingId)

      expect(result).toBe(false)
    })
  })

  describe('fetchUserFavoriteListings', () => {
    it('should fetch user favorite listings successfully', async () => {
      const mockListings = [
        {
          id: 'listing-1',
          title: 'Test Listing 1',
          user_id: 'user-1',
        },
        {
          id: 'listing-2',
          title: 'Test Listing 2',
          user_id: 'user-2',
        },
      ]

      const mockFavorites = [
        {
          listing_id: 'listing-1',
          created_at: '2025-01-01T00:00:00Z',
          listings: {
            ...mockListings[0],
            profiles: {
              id: 'user-1',
              name: 'User 1',
              avatar_url: null,
              rating: 5,
            },
          },
        },
        {
          listing_id: 'listing-2',
          created_at: '2025-01-02T00:00:00Z',
          listings: {
            ...mockListings[1],
            profiles: {
              id: 'user-2',
              name: 'User 2',
              avatar_url: null,
              rating: 4,
            },
          },
        },
      ]

      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: mockFavorites,
            error: null,
          }),
        }),
      })

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
      } as any)

      const result = await fetchUserFavoriteListings(mockUserId)

      expect(result).toHaveLength(2)
      expect(result[0].id).toBe('listing-1')
      expect(result[0].is_favorited).toBe(true)
      expect(result[0].user).toEqual(mockFavorites[0].listings.profiles)
    })

    it('should return empty array for invalid userId', async () => {
      const result = await fetchUserFavoriteListings('')

      expect(result).toEqual([])
    })

    it('should handle database errors', async () => {
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: null,
            error: {
              code: 'PGRST301',
              message: 'Database error',
            },
          }),
        }),
      })

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
      } as any)

      const result = await fetchUserFavoriteListings(mockUserId)

      expect(result).toEqual([])
      expect(toast).toHaveBeenCalledWith({
        title: 'Favori İlanlar Yüklenemedi',
        description: 'Database error',
        variant: 'destructive',
      })
    })
  })
})

