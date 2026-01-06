import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { POST, DELETE } from '../route'

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
  rateLimitExceeded: vi.fn(() => new Response(JSON.stringify({ success: false, error: { code: 'SRV_005' } }), { status: 429 })),
}))

vi.mock('@/utils/production-logger', () => ({
  logger: {
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}))

vi.mock('@/lib/api-validation', async () => {
  const actual = await vi.importActual('@/lib/api-validation')
  return {
    ...actual,
    validateBody: vi.fn(),
    validateQuery: vi.fn(),
  }
})

import { getServerUser } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/supabase'
import { rateLimiters } from '@/lib/rate-limit'
import { validateBody, validateQuery } from '@/lib/api-validation'

describe('POST /api/favorites', () => {
  const mockUser = {
    id: 'test-user-id',
    email: 'test@example.com',
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getServerUser).mockResolvedValue(mockUser)
    vi.mocked(rateLimiters.standard.check).mockResolvedValue(true)
    // Mock validateBody to return success by default
    vi.mocked(validateBody).mockResolvedValue({
      success: true,
      data: { listingId: 'listing-id' },
    })
  })

  it('should add a favorite with valid data', async () => {
    const mockFavorite = {
      id: 'favorite-id',
      user_id: 'test-user-id',
      listing_id: 'listing-id',
      created_at: '2025-01-01T00:00:00Z',
    }

    const mockInsert = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: mockFavorite,
          error: null,
        }),
      }),
    })

    vi.mocked(supabaseAdmin.from).mockReturnValue({
      insert: mockInsert,
    } as unknown as ReturnType<typeof supabaseAdmin.from>)

    // Ensure validateBody returns success
    vi.mocked(validateBody).mockResolvedValue({
      success: true,
      data: { listingId: 'listing-id' },
    })

    const request = new NextRequest('http://localhost:3000/api/favorites', {
      method: 'POST',
      body: JSON.stringify({
        listingId: 'listing-id',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.id).toBe('favorite-id')
  })

  it('should return 401 if user is not authenticated', async () => {
    vi.mocked(getServerUser).mockResolvedValue(null)

    const request = new NextRequest('http://localhost:3000/api/favorites', {
      method: 'POST',
      body: JSON.stringify({
        listingId: 'listing-id',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.success).toBe(false)
    expect(data.error.code).toBe('AUTH_001')
  })

  it('should return 429 if rate limit is exceeded', async () => {
    vi.mocked(rateLimiters.standard.check).mockResolvedValue(false)

    const request = new NextRequest('http://localhost:3000/api/favorites', {
      method: 'POST',
      body: JSON.stringify({
        listingId: 'listing-id',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(429)
    expect(data.success).toBe(false)
    expect(data.error.code).toBe('SRV_005')
  })

  it('should return 400 for invalid data', async () => {
    // Mock validateBody to return validation error
    vi.mocked(validateBody).mockResolvedValue({
      success: false,
      response: new Response(
        JSON.stringify({
          success: false,
          error: {
            code: 'VAL_001',
            message: 'Validation failed',
            errors: [
              { field: 'listingId', message: 'Invalid UUID format', code: 'invalid_string' },
            ],
          },
        }),
        { status: 400 }
      ),
    })

    const request = new NextRequest('http://localhost:3000/api/favorites', {
      method: 'POST',
      body: JSON.stringify({
        listingId: 'invalid-uuid',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error.code).toBe('VAL_001')
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

    vi.mocked(supabaseAdmin.from).mockReturnValue({
      insert: mockInsert,
    } as unknown as ReturnType<typeof supabaseAdmin.from>)

    // Ensure validateBody returns success
    vi.mocked(validateBody).mockResolvedValue({
      success: true,
      data: { listingId: 'listing-id' },
    })

    const request = new NextRequest('http://localhost:3000/api/favorites', {
      method: 'POST',
      body: JSON.stringify({
        listingId: 'listing-id',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.already_favorited).toBe(true)
  })
})

describe('DELETE /api/favorites', () => {
  const mockUser = {
    id: 'test-user-id',
    email: 'test@example.com',
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getServerUser).mockResolvedValue(mockUser)
    vi.mocked(rateLimiters.standard.check).mockResolvedValue(true)
    // Mock validateQuery to return success by default
    vi.mocked(validateQuery).mockReturnValue({
      success: true,
      data: { listingId: 'listing-id' },
    })
    // Mock supabaseAdmin to be truthy
    vi.mocked(supabaseAdmin).from = vi.fn() as unknown as typeof supabaseAdmin.from
  })

  it('should remove a favorite with valid data', async () => {
    const mockDelete = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      }),
    })

    vi.mocked(supabaseAdmin.from).mockReturnValue({
      delete: mockDelete,
    } as unknown as ReturnType<typeof supabaseAdmin.from>)

    // Ensure validateQuery returns success
    vi.mocked(validateQuery).mockReturnValue({
      success: true,
      data: { listingId: 'listing-id' },
    })

    const request = new NextRequest('http://localhost:3000/api/favorites?listingId=listing-id', {
      method: 'DELETE',
    })

    const response = await DELETE(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.message).toBe('Favori başarıyla silindi')
  })

  it('should return 401 if user is not authenticated', async () => {
    vi.mocked(getServerUser).mockResolvedValue(null)

    const request = new NextRequest('http://localhost:3000/api/favorites?listingId=listing-id', {
      method: 'DELETE',
    })

    const response = await DELETE(request)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.success).toBe(false)
    expect(data.error.code).toBe('AUTH_001')
  })

  it('should return 429 if rate limit is exceeded', async () => {
    vi.mocked(rateLimiters.standard.check).mockResolvedValue(false)

    const request = new NextRequest('http://localhost:3000/api/favorites?listingId=listing-id', {
      method: 'DELETE',
    })

    const response = await DELETE(request)
    const data = await response.json()

    expect(response.status).toBe(429)
    expect(data.success).toBe(false)
    expect(data.error.code).toBe('SRV_005')
  })

  it('should return 400 for invalid listingId', async () => {
    // Mock validateQuery to return validation error
    vi.mocked(validateQuery).mockReturnValue({
      success: false,
      response: new Response(
        JSON.stringify({
          success: false,
          error: {
            code: 'VAL_001',
            message: 'Validation failed',
            errors: [
              { field: 'listingId', message: 'Invalid UUID format', code: 'invalid_string' },
            ],
          },
        }),
        { status: 400 }
      ),
    })

    const request = new NextRequest('http://localhost:3000/api/favorites?listingId=invalid-uuid', {
      method: 'DELETE',
    })

    const response = await DELETE(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error.code).toBe('VAL_001')
  })
})

