import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createOffer, getOffersForListing, fetchSentOffers, updateOfferStatus, deleteOffer } from '../offerService'
import { supabase } from '@/lib/supabase'
import { toast } from '@/hooks/use-toast'
import { addUserActivity } from '../userActivityService'

// Mock dependencies
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}))

vi.mock('@/hooks/use-toast', () => ({
  toast: vi.fn(),
}))

vi.mock('@/services/userActivityService', () => ({
  addUserActivity: vi.fn(),
}))

vi.mock('@/utils/production-logger', () => ({
  logger: {
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}))

describe('OfferService', () => {
  const mockUserId = 'test-user-id'
  const mockListingId = 'test-listing-id'
  const mockOffer = {
    id: 'offer-id',
    listing_id: mockListingId,
    offering_user_id: mockUserId,
    message: 'Test offer message',
    status: 'pending',
    offered_price: 1000,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
    listings: {
      id: mockListingId,
      title: 'Test Listing',
      main_image_url: 'https://example.com/image.jpg',
      user_id: 'listing-owner-id',
      profiles: {
        id: 'listing-owner-id',
        name: 'Listing Owner',
        avatar_url: null,
      },
    },
    profiles: {
      id: mockUserId,
      name: 'Test User',
      avatar_url: null,
    },
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('createOffer', () => {
    it('should create an offer with price successfully', async () => {
      const mockOfferWithRelations = {
        ...mockOffer,
        listings: mockOffer.listings,
        profiles: mockOffer.profiles,
        inventory_items: null,
      }

      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: mockOfferWithRelations,
            error: null,
          }),
        }),
      })

      vi.mocked(supabase.from).mockReturnValue({
        insert: mockInsert,
      } as any)

      const offerData = {
        listing_id: mockListingId,
        offering_user_id: mockUserId,
        message: 'Test offer message',
        offered_price: 1000,
      }

      const result = await createOffer(offerData)

      expect(result).toBeTruthy()
      expect(result?.id).toBe(mockOffer.id)
      expect(result?.listing).toBeDefined()
      expect(result?.user).toBeDefined()
      expect(toast).toHaveBeenCalledWith({
        title: 'Teklif Gönderildi! 🎉',
        description: 'Teklifiniz başarıyla gönderildi.',
      })
      expect(addUserActivity).toHaveBeenCalled()
    })

    it('should create an offer with item successfully', async () => {
      const mockOfferWithRelations = {
        ...mockOffer,
        listings: mockOffer.listings,
        profiles: mockOffer.profiles,
        inventory_items: {
          id: 'item-id',
          name: 'Test Item',
          category: 'test',
          main_image_url: null,
          image_url: null,
        },
      }

      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: mockOfferWithRelations,
            error: null,
          }),
        }),
      })

      vi.mocked(supabase.from).mockReturnValue({
        insert: mockInsert,
      } as any)

      const offerData = {
        listing_id: mockListingId,
        offering_user_id: mockUserId,
        message: 'Test offer message',
        offered_item_id: 'item-id',
      }

      const result = await createOffer(offerData)

      expect(result).toBeTruthy()
      expect(result?.id).toBe(mockOffer.id)
      expect(result?.listing).toBeDefined()
      expect(result?.user).toBeDefined()
      expect(result?.inventory_item).toBeDefined()
    })

    it('should return null for invalid data (missing listing_id)', async () => {
      const offerData = {
        offering_user_id: mockUserId,
        message: 'Test offer message',
        offered_price: 1000,
      }

      const result = await createOffer(offerData)

      expect(result).toBeNull()
      expect(toast).toHaveBeenCalledWith({
        title: 'Eksik Bilgi',
        description: 'Teklif oluşturmak için gerekli bilgiler eksik.',
        variant: 'destructive',
      })
    })

    it('should return null for invalid data (missing both price and item)', async () => {
      const offerData = {
        listing_id: mockListingId,
        offering_user_id: mockUserId,
        message: 'Test offer message',
      }

      const result = await createOffer(offerData)

      expect(result).toBeNull()
      expect(toast).toHaveBeenCalledWith({
        title: 'Eksik Teklif',
        description: 'En az bir ürün seçin veya nakit teklifi yapın.',
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

      const offerData = {
        listing_id: mockListingId,
        offering_user_id: mockUserId,
        message: 'Test offer message',
        offered_price: 1000,
      }

      const result = await createOffer(offerData)

      expect(result).toBeNull()
      // Toast is called with error object, not just message string
      expect(toast).toHaveBeenCalled()
    })
  })

  describe('getOffersForListing', () => {
    it('should fetch offers for a listing successfully', async () => {
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: [mockOffer],
            error: null,
          }),
        }),
      })

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
      } as any)

      const result = await getOffersForListing(mockListingId)

      expect(result).toHaveLength(1)
      expect(result[0].id).toBe(mockOffer.id)
    })

  })

  describe('fetchSentOffers', () => {
    it('should fetch sent offers for a user successfully', async () => {
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: [mockOffer],
            error: null,
          }),
        }),
      })

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
      } as any)

      const result = await fetchSentOffers(mockUserId)

      expect(result).toHaveLength(1)
      expect(result[0].id).toBe(mockOffer.id)
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

      const result = await fetchSentOffers(mockUserId)

      expect(result).toEqual([])
    })

    it('should return empty array for invalid userId', async () => {
      const result = await fetchSentOffers('')

      expect(result).toEqual([])
    })
  })

  describe('updateOfferStatus', () => {
    it('should return null for invalid data', async () => {
      const result = await updateOfferStatus('', 'accepted', mockUserId)

      expect(result).toBeNull()
      expect(toast).toHaveBeenCalledWith({
        title: 'Eksik Bilgi',
        description: 'Teklif durumu güncellemek için gerekli bilgiler eksik.',
        variant: 'destructive',
      })
    })

    it('should handle database errors when fetching offer', async () => {
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
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
        select: mockSelect,
      } as any)

      const result = await updateOfferStatus('offer-id', 'accepted', mockUserId)

      expect(result).toBeNull()
      expect(toast).toHaveBeenCalledWith({
        title: 'Teklif Bulunamadı',
        description: 'Güncellenecek teklif bulunamadı.',
        variant: 'destructive',
      })
    })
  })

  describe('deleteOffer', () => {
    it('should delete an offer successfully', async () => {
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { ...mockOffer, offering_user_id: mockUserId },
            error: null,
          }),
        }),
      })

      const mockDelete = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      })

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'offers') {
          return {
            select: mockSelect,
            delete: mockDelete,
          } as any
        }
        return {} as any
      })

      const result = await deleteOffer('offer-id', mockUserId)

      expect(result).toBe(true)
      expect(toast).toHaveBeenCalledWith({
        title: 'Teklif Silindi',
        description: 'Teklif başarıyla silindi.',
      })
    })

    it('should handle database errors', async () => {
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
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
        select: mockSelect,
      } as any)

      const result = await deleteOffer('offer-id', mockUserId)

      expect(result).toBe(false)
    })

    it('should return false for invalid data', async () => {
      const result = await deleteOffer('', mockUserId)

      expect(result).toBe(false)
    })
  })
})

