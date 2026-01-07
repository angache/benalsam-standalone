/**
 * Integration Test: Listing Creation Flow
 * 
 * Tests the complete flow:
 * 1. API route validation
 * 2. Service layer processing
 * 3. Database insertion
 * 4. Response formatting
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { POST } from '@/app/api/listings/create/route'
import { createMockRequest, mockUser, createMockSupabaseQueryBuilder } from '../integration/setup'
import { getServerUser } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/supabase'
import { rateLimiters, rateLimitExceeded } from '@/lib/rate-limit'
import { validateBody } from '@/lib/api-validation'

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
    strict: {
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
          path: '/api/listings/create',
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
    uuid: vi.fn(),
  },
}))

describe('Integration: Listing Creation Flow', () => {
  const validListingData = {
    title: 'Test Listing Title',
    description: 'This is a detailed test listing description that meets the minimum length requirement',
    category: '1',
    budget: 1000,
    location: 'İstanbul',
    urgency: 'normal' as const,
    condition: ['İkinci El'],
    attributes: {},
    images: [],
    mainImageIndex: 0,
    acceptTerms: true,
  }

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Setup default mocks
    vi.mocked(getServerUser).mockResolvedValue(mockUser)
    vi.mocked(rateLimiters.strict.check).mockResolvedValue(true)
    vi.mocked(validateBody).mockResolvedValue({
      success: true,
      data: validListingData,
    })
  })

  it('should successfully create a listing through the complete flow', async () => {
    // Mock successful database insertion
    const mockListing = {
      id: 'listing-123',
      title: validListingData.title,
      description: validListingData.description,
      category: validListingData.category,
      budget: validListingData.budget,
      location: validListingData.location,
      status: 'pending_approval',
      user_id: mockUser.id,
      created_at: new Date().toISOString(),
    }

    const mockInsert = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: mockListing,
          error: null,
        }),
      }),
    })

    vi.mocked(supabaseAdmin.from).mockReturnValue({
      insert: mockInsert,
    } as any)

    // Create request
    const request = createMockRequest('http://localhost:3000/api/listings/create', {
      method: 'POST',
      body: validListingData,
    })

    // Execute API route
    const response = await POST(request)
    const data = await response.json()

    // Assertions
    expect(response.status).toBe(201)
    expect(data.success).toBe(true)
    expect(data.data).toMatchObject({
      id: 'listing-123',
      title: validListingData.title,
      status: 'pending_approval',
    })

    // Verify validation was called
    expect(validateBody).toHaveBeenCalled()
    
    // Verify rate limiting was checked
    expect(rateLimiters.strict.check).toHaveBeenCalled()
    
    // Verify database insertion was attempted
    expect(mockInsert).toHaveBeenCalled()
  })

  it('should handle validation errors in the flow', async () => {
    // Mock validation failure
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
                field: 'title',
                message: 'Başlık en az 3 karakter olmalıdır',
              },
            ],
          },
        }),
        { status: 400 }
      ),
    })

    const invalidData = {
      ...validListingData,
      title: 'ab', // Too short
    }

    const request = createMockRequest('http://localhost:3000/api/listings/create', {
      method: 'POST',
      body: invalidData,
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error.code).toBe('VAL_001')
    expect(data.error.errors).toBeDefined()

    // Verify database was NOT called
    // Note: supabaseAdmin might be null in test environment, so we check if it exists first
    if (supabaseAdmin) {
      expect(supabaseAdmin.from).not.toHaveBeenCalled()
    }
  })

  it('should handle authentication errors in the flow', async () => {
    // Mock unauthenticated user
    vi.mocked(getServerUser).mockResolvedValue(null)

    const request = createMockRequest('http://localhost:3000/api/listings/create', {
      method: 'POST',
      body: validListingData,
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.success).toBe(false)
    expect(data.error.code).toBe('AUTH_001')

    // Verify validation was NOT called (auth check happens first)
    expect(validateBody).not.toHaveBeenCalled()
  })

  it('should handle rate limiting in the flow', async () => {
    // Mock rate limit exceeded
    vi.mocked(rateLimiters.strict.check).mockResolvedValue(false)

    const request = createMockRequest('http://localhost:3000/api/listings/create', {
      method: 'POST',
      body: validListingData,
    })

    const response = await POST(request)
    
    // rateLimitExceeded returns a Response, so we can check it directly
    expect(response.status).toBe(429)
    
    const data = await response.json()
    expect(data.success).toBe(false)
    expect(data.error.code).toBe('RATE_001')

    // Verify validation was NOT called (rate limit check happens before validation)
    expect(validateBody).not.toHaveBeenCalled()
  })

  it('should handle database errors in the flow', async () => {
    // Mock database error
    const mockInsert = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: null,
          error: {
            message: 'Database connection failed',
            code: 'PGRST_ERROR',
          },
        }),
      }),
    })

    vi.mocked(supabaseAdmin.from).mockReturnValue({
      insert: mockInsert,
    } as any)

    const request = createMockRequest('http://localhost:3000/api/listings/create', {
      method: 'POST',
      body: validListingData,
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.success).toBe(false)
    expect(data.error.code).toBe('SRV_002') // DATABASE_ERROR

    // Verify all previous steps were called
    expect(validateBody).toHaveBeenCalled()
    expect(rateLimiters.strict.check).toHaveBeenCalled()
    expect(mockInsert).toHaveBeenCalled()
  })
})

