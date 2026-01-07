/**
 * Integration Test: Messaging Flow
 * 
 * Tests the complete messaging flow:
 * 1. API route (POST /api/messages)
 * 2. Service layer (conversationService)
 * 3. Database operations
 * 4. Real-time updates
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { POST } from '@/app/api/messages/route'
import { createMockRequest, mockUser, createMockSupabaseQueryBuilder } from '../integration/setup'
import { getServerUser } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/supabase'
import { rateLimiters } from '@/lib/rate-limit'
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
    messaging: {
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
          path: '/api/messages',
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

describe('Integration: Messaging Flow', () => {
  const conversationId = 'conv-123'
  const otherUserId = 'other-user-id'
  const messageContent = 'Test message content'

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Setup default mocks
    vi.mocked(getServerUser).mockResolvedValue(mockUser)
    vi.mocked(rateLimiters.messaging.check).mockResolvedValue(true)
    vi.mocked(validateBody).mockResolvedValue({
      success: true,
      data: {
        conversationId,
        senderId: mockUser.id,
        content: messageContent,
        messageType: 'text',
      },
    })
  })

  it('should send message through complete flow', async () => {
    // Mock conversation exists
    const mockConversation = {
      id: conversationId,
      user1_id: mockUser.id,
      user2_id: otherUserId,
    }

    // Mock message creation
    const mockMessage = {
      id: 'message-123',
      conversation_id: conversationId,
      sender_id: mockUser.id,
      content: messageContent,
      message_type: 'text',
      created_at: new Date().toISOString(),
      sender: {
        id: mockUser.id,
        name: mockUser.name,
        avatar_url: null,
      },
    }

    // Mock: Get conversation
    const mockSelectConversation = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: mockConversation,
          error: null,
        }),
      }),
    })

    // Mock: Insert message
    const mockInsertMessage = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: mockMessage,
          error: null,
        }),
      }),
    })

    // Mock: Update conversation (last_message_at)
    const mockUpdateConversation = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({
        data: null,
        error: null,
      }),
    })

    let callCount = 0
    vi.mocked(supabaseAdmin.from).mockImplementation((table: string) => {
      callCount++
      if (table === 'conversations') {
        if (callCount === 1) {
          return { select: mockSelectConversation } as any
        } else {
          return { update: mockUpdateConversation } as any
        }
      } else if (table === 'messages') {
        return { insert: mockInsertMessage } as any
      }
      return {} as any
    })

    const request = createMockRequest('http://localhost:3000/api/messages', {
      method: 'POST',
      body: {
        conversationId,
        senderId: mockUser.id,
        content: messageContent,
      },
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.id).toBe('message-123')
    expect(data.data.content).toBe(messageContent)
    expect(data.data.sender_id).toBe(mockUser.id)

    // Verify validation was called
    expect(validateBody).toHaveBeenCalled()
    
    // Verify rate limiting was checked
    expect(rateLimiters.messaging.check).toHaveBeenCalled()
    
    // Verify conversation was checked
    expect(mockSelectConversation).toHaveBeenCalled()
    
    // Verify message was inserted
    expect(mockInsertMessage).toHaveBeenCalled()
    
    // Verify conversation was updated
    expect(mockUpdateConversation).toHaveBeenCalled()
  })

  it('should reject message if user is not participant', async () => {
    // Mock conversation where user is NOT a participant
    const mockConversation = {
      id: conversationId,
      user1_id: 'other-user-1',
      user2_id: 'other-user-2',
    }

    const mockSelectConversation = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: mockConversation,
          error: null,
        }),
      }),
    })

    vi.mocked(supabaseAdmin.from).mockReturnValue({
      select: mockSelectConversation,
    } as any)

    const request = createMockRequest('http://localhost:3000/api/messages', {
      method: 'POST',
      body: {
        conversationId,
        senderId: mockUser.id,
        content: messageContent,
      },
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(403)
    expect(data.success).toBe(false)
    expect(data.error.code).toBe('AUTH_002')
  })

  it('should handle conversation not found', async () => {
    const mockSelectConversation = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST116' },
        }),
      }),
    })

    vi.mocked(supabaseAdmin.from).mockReturnValue({
      select: mockSelectConversation,
    } as any)

    const request = createMockRequest('http://localhost:3000/api/messages', {
      method: 'POST',
      body: {
        conversationId: 'non-existent-conv',
        senderId: mockUser.id,
        content: messageContent,
      },
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.success).toBe(false)
    expect(data.error.code).toBe('RES_001')
  })

  it('should handle rate limiting', async () => {
    vi.mocked(rateLimiters.messaging.check).mockResolvedValue(false)

    const request = createMockRequest('http://localhost:3000/api/messages', {
      method: 'POST',
      body: {
        conversationId,
        senderId: mockUser.id,
        content: messageContent,
      },
    })

    const response = await POST(request)
    
    expect(response.status).toBe(429)
    
    const data = await response.json()
    expect(data.success).toBe(false)
    expect(data.error.code).toBe('RATE_001')
  })
})

