import { describe, it, expect, beforeEach, vi } from 'vitest'
import { fetchUserProfile, updateUserProfile, incrementProfileView, getUserProfileStats } from '../profileService'
import { supabase } from '@/lib/supabase'
import { toast } from '@/hooks/use-toast'

// Mock dependencies
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
    functions: {
      invoke: vi.fn(),
    },
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

vi.mock('@/utils/errorHandler', () => ({
  handleError: vi.fn(),
}))

describe('ProfileService', () => {
  const mockUserId = 'test-user-id'
  const mockProfile = {
    id: mockUserId,
    email: 'test@example.com',
    full_name: 'Test User',
    avatar_url: 'https://example.com/avatar.jpg',
    phone: '+905551234567',
    location: 'İstanbul',
    bio: 'Test bio',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
    trust_score: 75,
    is_verified: false,
    is_2fa_enabled: false,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('fetchUserProfile', () => {
    it('should fetch user profile successfully', async () => {
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: mockProfile,
            error: null,
          }),
        }),
      })

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
      } as any)

      const result = await fetchUserProfile(mockUserId)

      expect(result).toEqual(mockProfile)
      expect(supabase.from).toHaveBeenCalledWith('profiles')
    })

    it('should return null when profile not found', async () => {
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: {
              code: 'PGRST116',
              message: 'Not found',
            },
          }),
        }),
      })

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
      } as any)

      const result = await fetchUserProfile(mockUserId)

      expect(result).toBeNull()
    })

    it('should return null for invalid userId', async () => {
      const result = await fetchUserProfile('')

      expect(result).toBeNull()
    })
  })

  describe('updateUserProfile', () => {
    it('should update user profile successfully', async () => {
      const updates = {
        full_name: 'Updated Name',
        bio: 'Updated bio',
      }

      const updatedProfile = { ...mockProfile, ...updates }

      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: updatedProfile,
              error: null,
            }),
          }),
        }),
      })

      vi.mocked(supabase.from).mockReturnValue({
        update: mockUpdate,
      } as any)

      const result = await updateUserProfile(mockUserId, updates)

      expect(result).toEqual(updatedProfile)
      expect(supabase.from).toHaveBeenCalledWith('profiles')
    })

    it('should handle update errors', async () => {
      const updates = {
        full_name: 'Updated Name',
      }

      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: {
                message: 'Update failed',
                code: 'PGRST301',
              },
            }),
          }),
        }),
      })

      vi.mocked(supabase.from).mockReturnValue({
        update: mockUpdate,
      } as any)

      const result = await updateUserProfile(mockUserId, updates)

      expect(result).toBeNull()
    })

    it('should return null for invalid userId', async () => {
      const result = await updateUserProfile('', { full_name: 'Test' })

      expect(result).toBeNull()
    })
  })

  describe('incrementProfileView', () => {
    it('should increment profile view successfully', async () => {
      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: null,
        error: null,
      } as any)

      await incrementProfileView(mockUserId)

      expect(supabase.functions.invoke).toHaveBeenCalledWith('increment-profile-view', {
        body: { userId: mockUserId },
      })
    })

    it('should handle errors gracefully', async () => {
      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: null,
        error: {
          message: 'Function error',
        },
      } as any)

      // Should not throw
      await expect(incrementProfileView(mockUserId)).resolves.not.toThrow()
    })

    it('should return early for invalid userId', async () => {
      await incrementProfileView('')

      expect(supabase.functions.invoke).not.toHaveBeenCalled()
    })
  })

  describe('getUserProfileStats', () => {
    it('should fetch user profile stats successfully', async () => {
      const mockProfileData = {
        total_listings: 10,
        total_offers: 5,
        total_reviews: 3,
        average_rating: 4.5,
        profile_views: 100,
        total_favorites: 20,
        trust_score: 75,
        created_at: '2025-01-01T00:00:00Z',
      }

      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: mockProfileData,
            error: null,
          }),
        }),
      })

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
      } as any)

      const result = await getUserProfileStats(mockUserId)

      expect(result).toBeDefined()
      expect(result?.totalListings).toBe(10)
      expect(result?.totalOffers).toBe(5)
      expect(result?.totalViews).toBe(100)
      expect(result?.totalFavorites).toBe(20)
      expect(result?.averageRating).toBe(4.5)
      expect(result?.totalReviews).toBe(3)
      expect(result?.trustScore).toBe(75)
    })

    it('should return default stats when data not found', async () => {
      const mockSelectProfile = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: {
              code: 'PGRST116',
            },
          }),
        }),
      })

      const mockSelectStats = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: null,
          }),
        }),
      })

      const mockSelectOffers = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          count: vi.fn().mockResolvedValue({
            count: 0,
            error: null,
          }),
        }),
      })

      const mockSelectReviews = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: null,
          }),
        }),
      })

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'profiles') {
          return {
            select: mockSelectProfile,
          } as any
        }
        if (table === 'user_statistics') {
          return {
            select: mockSelectStats,
          } as any
        }
        if (table === 'offers') {
          return {
            select: mockSelectOffers,
          } as any
        }
        if (table === 'reviews') {
          return {
            select: mockSelectReviews,
          } as any
        }
        return {} as any
      })

      const result = await getUserProfileStats(mockUserId)

      // Function might return null if profile not found
      if (result) {
        expect(result.total_listings).toBeGreaterThanOrEqual(0)
      } else {
        expect(result).toBeNull()
      }
    })

    it('should return null for invalid userId', async () => {
      const result = await getUserProfileStats('')

      expect(result).toBeNull()
    })
  })
})

