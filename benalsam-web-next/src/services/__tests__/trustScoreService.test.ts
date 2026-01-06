import { describe, it, expect, beforeEach, vi } from 'vitest'
import { calculateTrustScore, updateTrustScore, getTrustLevelDescription, getTrustLevelColor } from '../trustScoreService'
import { supabase } from '@/lib/supabase'

// Mock dependencies
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}))

vi.mock('@/utils/production-logger', () => ({
  logger: {
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}))

describe('TrustScoreService', () => {
  const mockUserId = 'test-user-id'
  const mockProfile = {
    id: mockUserId,
    email: 'test@example.com',
    full_name: 'Test User',
    phone: '+905551234567',
    avatar_url: 'https://example.com/avatar.jpg',
    bio: 'Test bio',
    location: 'İstanbul',
    website: 'https://example.com',
    social_links: {
      twitter: 'https://twitter.com/test',
      instagram: 'https://instagram.com/test',
    },
    email_verified: true,
    phone_verified: true,
    is_premium: false,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  }

  const mockStats = {
    accepted_offers: 5,
    avg_response_time_hours: 2,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('calculateTrustScore', () => {
    it('should calculate trust score successfully', async () => {
      const mockSelectProfile = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: mockProfile,
            error: null,
          }),
        }),
      })

      const mockSelectStats = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({
            data: mockStats,
            error: null,
          }),
        }),
      })

      const mockSelectListings = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          count: vi.fn().mockResolvedValue({
            count: 10,
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
        if (table === 'listings') {
          return {
            select: mockSelectListings,
          } as any
        }
        return {} as any
      })

      const result = await calculateTrustScore(mockUserId)

      expect(result).toBeDefined()
      expect(result.totalScore).toBeGreaterThanOrEqual(0)
      expect(result.totalScore).toBeLessThanOrEqual(100)
      expect(result.level).toBeOneOf(['bronze', 'silver', 'gold', 'platinum'])
      expect(result.breakdown).toBeDefined()
      expect(result.nextLevelScore).toBeDefined()
      expect(result.progressToNextLevel).toBeGreaterThanOrEqual(0)
      expect(result.progressToNextLevel).toBeLessThanOrEqual(100)
    })

    it('should initialize user statistics if not exists', async () => {
      const mockSelectProfile = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: mockProfile,
            error: null,
          }),
        }),
      })

      const mockSelectStats = vi.fn()
        .mockReturnValueOnce({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: null,
              error: null,
            }),
          }),
        })
        .mockReturnValueOnce({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: { accepted_offers: 0, avg_response_time_hours: 0 },
              error: null,
            }),
          }),
        })

      const mockInsert = vi.fn().mockResolvedValue({
        error: null,
      })

      const mockSelectListings = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          count: vi.fn().mockResolvedValue({
            count: 0,
            error: null,
          }),
        }),
      })

      let callCount = 0
      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'profiles') {
          return {
            select: mockSelectProfile,
          } as any
        }
        if (table === 'user_statistics') {
          callCount++
          if (callCount === 1) {
            return {
              select: mockSelectStats,
            } as any
          } else if (callCount === 2) {
            return {
              insert: mockInsert,
            } as any
          } else {
            return {
              select: mockSelectStats,
            } as any
          }
        }
        if (table === 'listings') {
          return {
            select: mockSelectListings,
          } as any
        }
        return {} as any
      })

      const result = await calculateTrustScore(mockUserId)

      expect(result).toBeDefined()
      expect(mockInsert).toHaveBeenCalled()
    })

    it('should throw error when user profile not found', async () => {
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

      await expect(calculateTrustScore(mockUserId)).rejects.toThrow('User profile not found')
    })

    it('should throw error for invalid userId', async () => {
      await expect(calculateTrustScore('')).rejects.toThrow('User ID is required')
    })
  })

  describe('updateTrustScore', () => {
    it('should update trust score in database', async () => {
      const mockCalculation = {
        totalScore: 75,
        breakdown: {
          profile_completeness: 80,
          email_verification: 100,
          phone_verification: 100,
          listings: 60,
          completed_trades: 50,
          reviews: 40,
          response_time: 70,
          account_age: 80,
          social_links: 60,
          premium_status: 0,
        },
        level: 'gold',
        nextLevelScore: 86,
        progressToNextLevel: 65,
      }

      const mockSelectProfile = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: mockProfile,
            error: null,
          }),
        }),
      })

      const mockSelectStats = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({
            data: mockStats,
            error: null,
          }),
        }),
      })

      const mockSelectListings = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          count: vi.fn().mockResolvedValue({
            count: 10,
            error: null,
          }),
        }),
      })

      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      })

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'profiles') {
          return {
            select: mockSelectProfile,
            update: mockUpdate,
          } as any
        }
        if (table === 'user_statistics') {
          return {
            select: mockSelectStats,
          } as any
        }
        if (table === 'listings') {
          return {
            select: mockSelectListings,
          } as any
        }
        return {} as any
      })

      const result = await updateTrustScore(mockUserId)

      expect(result).toBeDefined()
      expect(result.totalScore).toBeGreaterThanOrEqual(0)
      expect(mockUpdate).toHaveBeenCalled()
    })
  })

  describe('getTrustLevelDescription', () => {
    it('should return description for bronze level', () => {
      const result = getTrustLevelDescription('bronze')
      expect(result).toBeDefined()
      expect(typeof result).toBe('string')
    })

    it('should return description for silver level', () => {
      const result = getTrustLevelDescription('silver')
      expect(result).toBeDefined()
    })

    it('should return description for gold level', () => {
      const result = getTrustLevelDescription('gold')
      expect(result).toBeDefined()
    })

    it('should return description for platinum level', () => {
      const result = getTrustLevelDescription('platinum')
      expect(result).toBeDefined()
    })
  })

  describe('getTrustLevelColor', () => {
    it('should return color for bronze level', () => {
      const result = getTrustLevelColor('bronze')
      expect(result).toBeDefined()
      expect(typeof result).toBe('string')
    })

    it('should return color for silver level', () => {
      const result = getTrustLevelColor('silver')
      expect(result).toBeDefined()
    })

    it('should return color for gold level', () => {
      const result = getTrustLevelColor('gold')
      expect(result).toBeDefined()
    })

    it('should return color for platinum level', () => {
      const result = getTrustLevelColor('platinum')
      expect(result).toBeDefined()
    })
  })
})

