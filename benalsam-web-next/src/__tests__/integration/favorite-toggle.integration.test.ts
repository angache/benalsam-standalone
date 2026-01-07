/**
 * Integration Test: Favorite Toggle Flow
 * 
 * Tests the complete flow:
 * 1. API route (POST /api/favorites)
 * 2. Service layer (favoriteService)
 * 3. Database operations
 * 4. State management
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { z } from 'zod'
import { POST, DELETE } from '@/app/api/favorites/route'
import { createMockRequest, mockUser, createMockSupabaseQueryBuilder } from '../integration/setup'
import { getServerUser } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/supabase'
import { rateLimiters } from '@/lib/rate-limit'
import { validateBody, validateQuery } from '@/lib/api-validation'

// Mock dependencies
vi.mock('@/lib/supabase-server', () => ({
  getServerUser: vi.fn(),
}))

vi.mock('@/lib/supabase', () => ({
  supabaseAdmin: {
    from: vi.fn(),
  },
}))

vi.mock('@/lib/rate-limit', () => ({
  rateLimiters: {
    standard: {
      check: vi.fn(),
    },
  },
  getClientIdentifier: vi.fn(() => 'test-identifier'),
  rateLimitExceeded: vi.fn(() => {
    return new Response(
      JSON.stringify({
        success: false,
        error: {
          code: 'RATE_001',
          message: 'Rate limit exceeded',
          timestamp: new Date().toISOString(),
          path: '/api/favorites',
        },
      }),
      { status: 429, headers: { 'Content-Type': 'application/json' } }
    )
  }),
}))

vi.mock('@/lib/api-validation', () => ({
  validateBody: vi.fn(),
  validateQuery: vi.fn(),
  validateParams: vi.fn(),
  commonSchemas: {
    uuid: z.string().uuid(),
  },
}))

describe('Integration: Favorite Toggle Flow', () => {
  const listingId = 'listing-123'

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Setup default mocks
    vi.mocked(getServerUser).mockResolvedValue(mockUser)
    vi.mocked(rateLimiters.standard.check).mockResolvedValue(true)
    vi.mocked(validateBody).mockResolvedValue({
      success: true,
      data: { listingId },
    })
  })

  it('should add favorite through complete flow', async () => {
    // Mock successful database insertion
    const mockFavorite = {
      id: 'favorite-123',
      user_id: mockUser.id,
      listing_id: listingId,
      created_at: new Date().toISOString(),
    }

    // Mock: Insert favorite
    // Chain: from() -> insert() -> select() -> single()
    const mockInsert = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: mockFavorite,
          error: null,
        }),
      }),
    })

    // Mock: from() returns an object with insert() method
    vi.mocked(supabaseAdmin.from).mockReturnValue({
      insert: mockInsert,
    } as any)

    const request = createMockRequest('http://localhost:3000/api/favorites', {
      method: 'POST',
      body: { listingId },
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.listing_id).toBe(listingId)
    expect(data.data.user_id).toBe(mockUser.id)

    // Verify validation was called
    expect(validateBody).toHaveBeenCalled()
    
    // Verify rate limiting was checked
    expect(rateLimiters.standard.check).toHaveBeenCalled()
    
    // Verify database operations
    expect(mockInsert).toHaveBeenCalled()
    expect(supabaseAdmin.from).toHaveBeenCalledWith('user_favorites')
  })

  it('should remove favorite if already exists', async () => {
    // Mock: Delete favorite
    // Chain: from() -> delete() -> eq() -> eq()
    const mockDelete = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      }),
    })

    // Mock: from() returns an object with delete() method
    vi.mocked(supabaseAdmin.from).mockReturnValue({
      delete: mockDelete,
    } as any)

    // Mock validateQuery for DELETE endpoint
    vi.mocked(validateQuery).mockReturnValue({
      success: true,
      data: { listingId },
    })

    const request = createMockRequest('http://localhost:3000/api/favorites?listingId=' + listingId, {
      method: 'DELETE',
    })

    const response = await DELETE(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.message).toBe('Favori başarıyla silindi')

    // Verify delete was called
    expect(mockDelete).toHaveBeenCalled()
    expect(supabaseAdmin.from).toHaveBeenCalledWith('user_favorites')
  })

  it('should handle validation errors', async () => {
    vi.mocked(validateBody).mockResolvedValue({
      success: false,
      response: new Response(
        JSON.stringify({
          success: false,
          error: {
            code: 'VAL_001',
            message: 'Validation failed',
            errors: [
              {
                field: 'listingId',
                message: 'Listing ID is required',
              },
            ],
          },
        }),
        { status: 400 }
      ),
    })

    const request = createMockRequest('http://localhost:3000/api/favorites', {
      method: 'POST',
      body: {}, // Missing listingId
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error.code).toBe('VAL_001')
  })

  it('should handle authentication errors', async () => {
    vi.mocked(getServerUser).mockResolvedValue(null)

    const request = createMockRequest('http://localhost:3000/api/favorites', {
      method: 'POST',
      body: { listingId },
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.success).toBe(false)
    expect(data.error.code).toBe('AUTH_001')
  })
})

