import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { POST } from '../route'

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
  }
})

import { getServerUser } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/supabase'
import { rateLimiters } from '@/lib/rate-limit'
import { validateBody } from '@/lib/api-validation'

describe('POST /api/listings/create', () => {
  const mockUser = {
    id: 'test-user-id',
    email: 'test@example.com',
  }

  const mockListingData = {
    title: 'Test Listing',
    description: 'This is a test listing description',
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
    vi.mocked(getServerUser).mockResolvedValue(mockUser)
    vi.mocked(rateLimiters.strict.check).mockResolvedValue(true)
    // Mock validateBody to return success by default
    vi.mocked(validateBody).mockResolvedValue({
      success: true,
      data: mockListingData,
    })
  })

  it('should create a listing with valid data', async () => {
    const mockInsert = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: {
            id: 'listing-id',
            title: mockListingData.title,
            status: 'pending_approval',
          },
          error: null,
        }),
      }),
    })

    vi.mocked(supabaseAdmin.from).mockReturnValue({
      insert: mockInsert,
    } as unknown as ReturnType<typeof supabaseAdmin.from>)

    const request = new NextRequest('http://localhost:3000/api/listings/create', {
      method: 'POST',
      body: JSON.stringify(mockListingData),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(201)
    expect(data.success).toBe(true)
    expect(data.data.id).toBe('listing-id')
    expect(data.data.title).toBe(mockListingData.title)
  })

  it('should return 401 if user is not authenticated', async () => {
    vi.mocked(getServerUser).mockResolvedValue(null)

    const request = new NextRequest('http://localhost:3000/api/listings/create', {
      method: 'POST',
      body: JSON.stringify(mockListingData),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.success).toBe(false)
    expect(data.error.code).toBe('AUTH_001')
  })

  it('should return 429 if rate limit is exceeded', async () => {
    vi.mocked(rateLimiters.strict.check).mockResolvedValue(false)

    const request = new NextRequest('http://localhost:3000/api/listings/create', {
      method: 'POST',
      body: JSON.stringify(mockListingData),
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
              { field: 'title', message: 'Başlık en az 3 karakter olmalıdır', code: 'too_small' },
            ],
          },
        }),
        { status: 400 }
      ),
    })

    const request = new NextRequest('http://localhost:3000/api/listings/create', {
      method: 'POST',
      body: JSON.stringify({
        title: 'AB', // Too short
        description: 'Short', // Too short
        category: '1',
        acceptTerms: false, // Must be true
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error.code).toBe('VAL_001')
  })

  it('should return 500 for database errors', async () => {
    const mockInsert = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: null,
          error: {
            code: '23505',
            message: 'Duplicate key violation',
            details: 'Key (id) already exists',
            hint: null,
          },
        }),
      }),
    })

    vi.mocked(supabaseAdmin.from).mockReturnValue({
      insert: mockInsert,
    } as unknown as ReturnType<typeof supabaseAdmin.from>)

    const request = new NextRequest('http://localhost:3000/api/listings/create', {
      method: 'POST',
      body: JSON.stringify(mockListingData),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.success).toBe(false)
    expect(data.error.code).toBe('SRV_002')
  })

  it('should process image URLs correctly', async () => {
    const listingWithImages = {
      ...mockListingData,
      images: [
        { uri: 'https://example.com/image1.jpg' },
        { url: 'https://example.com/image2.jpg' },
        'https://example.com/image3.jpg',
      ],
      mainImageIndex: 1,
    }

    // Mock validateBody to return the listing with images
    vi.mocked(validateBody).mockResolvedValue({
      success: true,
      data: listingWithImages,
    })

    const mockInsert = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: {
            id: 'listing-id',
            title: listingWithImages.title,
            status: 'pending_approval',
          },
          error: null,
        }),
      }),
    })

    vi.mocked(supabaseAdmin.from).mockReturnValue({
      insert: mockInsert,
    } as unknown as ReturnType<typeof supabaseAdmin.from>)

    const request = new NextRequest('http://localhost:3000/api/listings/create', {
      method: 'POST',
      body: JSON.stringify(listingWithImages),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(201)
    expect(data.success).toBe(true)
    
    // Verify insert was called with correct image URLs
    // The code processes images: extracts URLs and uses mainImageIndex
    const insertCall = mockInsert.mock.calls[0][0]
    // imageUrls = ['image1.jpg', 'image2.jpg', 'image3.jpg']
    // mainImageIndex = 1, so main_image_url = imageUrls[1] = 'image2.jpg'
    expect(insertCall[0].main_image_url).toBe('https://example.com/image2.jpg')
    // additionalImageUrls = imageUrls.slice(1) = ['image2.jpg', 'image3.jpg']
    expect(insertCall[0].additional_image_urls).toEqual([
      'https://example.com/image2.jpg',
      'https://example.com/image3.jpg',
    ])
  })
})

