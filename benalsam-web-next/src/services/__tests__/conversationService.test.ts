import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  getOrCreateConversation,
  sendMessage,
  fetchMessages,
  fetchConversationDetails,
  markMessagesAsRead,
} from '../conversationService'
import { supabase } from '@/lib/supabase'
import { toast } from '@/hooks/use-toast'
import { addUserActivity } from '@/services/userActivityService'
import { logger } from '@/utils/production-logger'

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

// Mock fetch
global.fetch = vi.fn()

describe('ConversationService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getOrCreateConversation', () => {
    it('should return existing conversation if found', async () => {
      const mockFrom = vi.fn()
      const mockSelect = vi.fn().mockReturnValue({
        or: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: { id: 'existing-conv-id' },
              error: null,
            }),
          }),
        }),
      })

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
      } as never)

      const result = await getOrCreateConversation('user-1', 'user-2')

      expect(result).toBe('existing-conv-id')
    })

    it('should create new conversation if not found', async () => {
      const mockFrom = vi.fn()
      
      // Mock search - no existing conversation
      const mockSearchSelect = vi.fn().mockReturnValue({
        or: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: null,
              error: null,
            }),
          }),
        }),
      })

      // Mock insert - create conversation
      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { id: 'new-conv-id' },
            error: null,
          }),
        }),
      })

      // Mock participants insert
      const mockParticipantsInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockResolvedValue({
          data: [{ id: 'p1' }, { id: 'p2' }],
          error: null,
        }),
      })

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'conversations') {
          return {
            select: mockSearchSelect,
            insert: mockInsert,
            delete: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ error: null }),
            }),
          } as never
        }
        if (table === 'conversation_participants') {
          return {
            insert: mockParticipantsInsert,
          } as never
        }
        if (table === 'offers') {
          return {
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ error: null }),
            }),
          } as never
        }
        return {} as never
      })

      const result = await getOrCreateConversation('user-1', 'user-2')

      expect(result).toBe('new-conv-id')
      expect(mockInsert).toHaveBeenCalled()
    })

    it('should handle validation errors', async () => {
      const result = await getOrCreateConversation('', 'user-2')

      expect(result).toBeNull()
      expect(toast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Sohbet Oluşturulamadı',
          variant: 'destructive',
        })
      )
    })
  })

  describe('sendMessage', () => {
    const mockMessage = {
      id: 'msg-1',
      conversation_id: 'conv-1',
      sender_id: 'user-1',
      content: 'Hello',
      created_at: '2025-01-01T00:00:00Z',
      message_type: 'text' as const,
      status: 'sent' as const,
    }

    it('should send message successfully', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: mockMessage,
        }),
      } as Response)

      vi.mocked(addUserActivity).mockResolvedValue(undefined)

      const result = await sendMessage('conv-1', 'user-1', 'Hello')

      expect(result).toEqual(mockMessage)
      expect(global.fetch).toHaveBeenCalledWith('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversationId: 'conv-1',
          senderId: 'user-1',
          content: 'Hello',
          messageType: 'text',
        }),
      })
    })

    it('should handle API errors', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          error: 'Failed to send message',
        }),
      } as Response)

      const result = await sendMessage('conv-1', 'user-1', 'Hello')

      expect(result).toBeNull()
      expect(toast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Mesaj Gönderilemedi',
          variant: 'destructive',
        })
      )
    })

    it('should handle validation errors', async () => {
      const result = await sendMessage('', 'user-1', 'Hello')

      expect(result).toBeNull()
      expect(toast).toHaveBeenCalled()
    })

    it('should log user activity on success', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: mockMessage,
        }),
      } as Response)

      vi.mocked(addUserActivity).mockResolvedValue(undefined)

      await sendMessage('conv-1', 'user-1', 'Hello')

      expect(addUserActivity).toHaveBeenCalledWith(
        'user-1',
        'message_sent',
        'Mesaj gönderildi',
        'Yeni bir mesaj gönderildi',
        'msg-1'
      )
    })

    it('should handle user activity errors gracefully', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: mockMessage,
        }),
      } as Response)

      vi.mocked(addUserActivity).mockRejectedValue(new Error('Activity error'))

      const result = await sendMessage('conv-1', 'user-1', 'Hello')

      // Should still return message even if activity logging fails
      expect(result).toEqual(mockMessage)
      expect(logger.warn).toHaveBeenCalledWith(
        '[ConversationService] Failed to log user activity (non-critical)',
        expect.objectContaining({ error: expect.any(Error) })
      )
    })
  })

  describe('fetchMessages', () => {
    const mockMessages = [
      {
        id: 'msg-1',
        conversation_id: 'conv-1',
        sender_id: 'user-1',
        content: 'Hello',
        created_at: '2025-01-01T00:00:00Z',
      },
      {
        id: 'msg-2',
        conversation_id: 'conv-1',
        sender_id: 'user-2',
        content: 'Hi',
        created_at: '2025-01-02T00:00:00Z',
      },
    ]

    it('should fetch messages successfully', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: mockMessages,
          total: 2,
        }),
      } as Response)

      const result = await fetchMessages('conv-1', 50, 0)

      expect(result.messages).toEqual(mockMessages)
      expect(result.total).toBe(2)
      expect(result.hasMore).toBe(false)
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/conversations/conv-1/messages?limit=50&offset=0'
      )
    })

    it('should calculate hasMore correctly', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: mockMessages,
          total: 10,
        }),
      } as Response)

      const result = await fetchMessages('conv-1', 50, 0)

      expect(result.hasMore).toBe(true) // 0 + 2 < 10
    })

    it('should handle API errors', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: false,
      } as Response)

      const result = await fetchMessages('conv-1', 50, 0)

      expect(result.messages).toEqual([])
      expect(result.hasMore).toBe(false)
      expect(result.total).toBe(0)
    })

    it('should handle validation errors', async () => {
      const result = await fetchMessages('', 50, 0)

      expect(result.messages).toEqual([])
      expect(result.hasMore).toBe(false)
      expect(result.total).toBe(0)
    })
  })

  describe('fetchConversationDetails', () => {
    const mockConversation = {
      id: 'conv-1',
      user1_id: 'user-1',
      user2_id: 'user-2',
      listing_id: 'listing-1',
      created_at: '2025-01-01T00:00:00Z',
    }

    it('should fetch conversation details successfully', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: mockConversation,
        }),
      } as Response)

      const result = await fetchConversationDetails('conv-1')

      expect(result).toEqual(mockConversation)
      expect(global.fetch).toHaveBeenCalledWith('/api/conversations/conv-1')
    })

    it('should handle API errors', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: false,
      } as Response)

      const result = await fetchConversationDetails('conv-1')

      expect(result).toBeNull()
      expect(toast).toHaveBeenCalled()
    })
  })

  describe('markMessagesAsRead', () => {
    it('should mark messages as read successfully', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: { success: true },
        }),
      } as Response)

      const result = await markMessagesAsRead('conv-1', 'user-1')

      expect(result).toEqual({ success: true })
      expect(global.fetch).toHaveBeenCalledWith('/api/messages/mark-read', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversationId: 'conv-1',
          userId: 'user-1',
        }),
      })
    })

    it('should handle API errors', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          error: 'Failed to mark as read',
        }),
      } as Response)

      const result = await markMessagesAsRead('conv-1', 'user-1')

      expect(result).toBeNull()
      expect(toast).toHaveBeenCalled()
    })
  })
})
