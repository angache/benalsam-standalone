import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { GET, POST } from '../route'

// Mock dependencies
vi.mock('@/lib/supabase-server', () => ({
  getServerUser: vi.fn(),
}))

// Mock supabaseAdmin to be a truthy object (not null)
vi.mock('@/lib/supabase', () => {
  const mockFrom = vi.fn()
  const mockSupabaseAdmin = {
    from: mockFrom,
  }
  return {
    supabaseAdmin: mockSupabaseAdmin,
  }
})

vi.mock('@/lib/rate-limit', () => ({
  rateLimiters: {
    messaging: {
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
import { NextResponse } from 'next/server'

describe('GET /api/messages', () => {
  const mockUser = {
    id: 'test-user-id',
    email: 'test@example.com',
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getServerUser).mockResolvedValue(mockUser)
    vi.mocked(rateLimiters.messaging.check).mockResolvedValue(true)
  })

  it('should fetch conversations for authenticated user', async () => {
    const mockConversations = [
      {
        id: 'conv-1',
        user1_id: 'test-user-id',
        user2_id: 'other-user-id',
        listing_id: 'listing-1',
        user1: { id: 'test-user-id', name: 'Test User', avatar_url: null },
        user2: { id: 'other-user-id', name: 'Other User', avatar_url: null },
        listing: { id: 'listing-1', title: 'Test Listing', user_id: 'test-user-id' },
        messages: [
          { content: 'Hello', created_at: '2025-01-01T00:00:00Z', sender_id: 'test-user-id', is_read: true },
        ],
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
        last_message_at: '2025-01-01T00:00:00Z',
      },
    ]

    const mockSelect = vi.fn().mockReturnValue({
      or: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({
          data: mockConversations,
          error: null,
        }),
      }),
    })

    vi.mocked(supabaseAdmin.from).mockReturnValue({
      select: mockSelect,
    } as unknown as ReturnType<typeof supabaseAdmin.from>)

    // Ensure validateQuery returns success
    vi.mocked(validateQuery).mockReturnValue({
      success: true,
      data: { userId: mockUser.id },
    })

    const request = new NextRequest('http://localhost:3000/api/messages?userId=test-user-id', {
      method: 'GET',
    })

    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(Array.isArray(data.data)).toBe(true)
    expect(data.data[0].id).toBe('conv-1')
  })

  it('should return 401 if user is not authenticated', async () => {
    vi.mocked(getServerUser).mockResolvedValue(null)

    const request = new NextRequest('http://localhost:3000/api/messages?userId=test-user-id', {
      method: 'GET',
    })

    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.success).toBe(false)
    expect(data.error.code).toBe('AUTH_001')
  })

  it('should return 403 if userId does not match authenticated user', async () => {
    // Mock validateQuery to return different userId
    vi.mocked(validateQuery).mockReturnValue({
      success: true,
      data: { userId: 'other-user-id' },
    })

    const request = new NextRequest('http://localhost:3000/api/messages?userId=other-user-id', {
      method: 'GET',
    })

    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(403)
    expect(data.success).toBe(false)
    expect(data.error.code).toBe('AUTH_002')
  })

  it('should return 429 if rate limit is exceeded', async () => {
    vi.mocked(rateLimiters.messaging.check).mockResolvedValue(false)

    const request = new NextRequest('http://localhost:3000/api/messages?userId=test-user-id', {
      method: 'GET',
    })

    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(429)
    expect(data.success).toBe(false)
    expect(data.error.code).toBe('SRV_005')
  })
})

describe('POST /api/messages', () => {
  const mockUser = {
    id: 'test-user-id',
    email: 'test@example.com',
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getServerUser).mockResolvedValue(mockUser)
    vi.mocked(rateLimiters.messaging.check).mockResolvedValue(true)
    // Mock validateBody to return success by default
    vi.mocked(validateBody).mockResolvedValue({
      success: true,
      data: {
        conversationId: 'conv-1',
        senderId: mockUser.id,
        content: 'Test message',
      },
    })
    // Ensure supabaseAdmin is not null
    vi.mocked(supabaseAdmin).from = vi.fn() as any
  })

  it('should create a message with valid data', async () => {
    // Mock validateBody to return success
    vi.mocked(validateBody).mockResolvedValue({
      success: true,
      data: {
        conversationId: 'conv-1',
        senderId: 'test-user-id',
        content: 'Test message',
      },
    })

    const mockMessage = {
      id: 'message-id',
      conversation_id: 'conv-1',
      sender_id: 'test-user-id',
      content: 'Test message',
      created_at: '2025-01-01T00:00:00Z',
      sender: { id: 'test-user-id', name: 'Test User', avatar_url: null },
    }

    const mockConversation = {
      id: 'conv-1',
      user1_id: 'test-user-id',
      user2_id: 'other-user-id',
    }

    const mockSelectConversation = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: mockConversation,
          error: null,
        }),
      }),
    })

    const mockInsert = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: mockMessage,
          error: null,
        }),
      }),
    })

    const mockUpdate = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ data: null, error: null }),
    })

    vi.mocked(supabaseAdmin.from).mockImplementation((table: string) => {
      if (table === 'conversations') {
        return {
          select: mockSelectConversation,
          update: mockUpdate,
        } as unknown as ReturnType<typeof supabaseAdmin.from>
      }
      if (table === 'messages') {
        return {
          insert: mockInsert,
        } as unknown as ReturnType<typeof supabaseAdmin.from>
      }
      return {} as unknown as ReturnType<typeof supabaseAdmin.from>
    })

    const request = new NextRequest('http://localhost:3000/api/messages', {
      method: 'POST',
      body: JSON.stringify({
        conversationId: 'conv-1',
        senderId: 'test-user-id',
        content: 'Test message',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.id).toBe('message-id')
  })

  it('should return 400 for invalid data', async () => {
    // Mock validateBody to return validation error
    const errorResponse = NextResponse.json(
      {
        success: false,
        error: {
          code: 'VAL_001',
          message: 'Validation failed',
          errors: [
            { field: 'content', message: 'Mesaj içeriği boş olamaz', code: 'too_small' },
          ],
        },
      },
      { status: 400 }
    )
    
    vi.mocked(validateBody).mockResolvedValue({
      success: false,
      response: errorResponse,
    })

    const request = new NextRequest('http://localhost:3000/api/messages', {
      method: 'POST',
      body: JSON.stringify({
        conversationId: 'invalid-uuid',
        senderId: 'test-user-id',
        content: '', // Empty content
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error.code).toBe('VAL_001')
  })
})

