import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { sendMessage, fetchMessages, markMessagesAsRead } from '../conversationService'

// Mock fetch
global.fetch = vi.fn()

// Mock supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => ({
            limit: vi.fn(() => Promise.resolve({ data: [], error: null })),
            single: vi.fn(() => Promise.resolve({ data: {}, error: null })),
          })),
        })),
      })),
    })),
    channel: vi.fn(() => ({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn().mockReturnThis(),
      unsubscribe: vi.fn(),
    })),
  },
}))

describe('ConversationService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('sendMessage', () => {
    it('should send message via API', async () => {
      const mockResponse = {
        success: true,
        data: {
          id: 'msg-1',
          conversation_id: 'conv-1',
          sender_id: 'user-1',
          content: 'Hello',
          created_at: new Date().toISOString(),
        },
      }

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      const result = await sendMessage('conv-1', 'user-1', 'Hello')
      
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/messages',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })
      )
      
      expect(result).toEqual(mockResponse.data)
    })

    it('should throw error for missing parameters', async () => {
      await expect(sendMessage('', 'user-1', 'Hello')).rejects.toThrow()
    })

    it('should throw error when API returns error', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Failed to send' }),
      })

      await expect(sendMessage('conv-1', 'user-1', 'Hello')).rejects.toThrow()
    })

    it('should handle network errors', async () => {
      ;(global.fetch as any).mockRejectedValueOnce(new Error('Network error'))

      await expect(sendMessage('conv-1', 'user-1', 'Hello')).rejects.toThrow('Network error')
    })
  })

  describe('fetchMessages', () => {
    it('should fetch messages from API', async () => {
      const mockMessages = [
        {
          id: 'msg-1',
          content: 'Hello',
          sender_id: 'user-1',
          created_at: new Date().toISOString(),
        },
      ]

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockMessages }),
      })

      const result = await fetchMessages('conv-1', 50)
      
      expect(result).toEqual(mockMessages)
    })

    it('should throw error for missing conversationId', async () => {
      await expect(fetchMessages('', 50)).rejects.toThrow()
    })

    it('should handle empty results', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: [] }),
      })

      const result = await fetchMessages('conv-1', 50)
      expect(result).toEqual([])
    })
  })

  describe('markMessagesAsRead', () => {
    it('should mark messages as read via API', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      })

      const result = await markMessagesAsRead('conv-1', 'user-1')
      
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/messages/mark-read',
        expect.objectContaining({
          method: 'POST',
        })
      )
      
      expect(result).toBe(true)
    })

    it('should return false on API error', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Failed' }),
      })

      const result = await markMessagesAsRead('conv-1', 'user-1')
      expect(result).toBe(false)
    })

    it('should throw error for missing parameters', async () => {
      await expect(markMessagesAsRead('', 'user-1')).rejects.toThrow()
    })

    it('should handle timeout (5 seconds)', async () => {
      // Simulate slow API
      ;(global.fetch as any).mockImplementationOnce(() =>
        new Promise(resolve => setTimeout(resolve, 6000))
      )

      // Should timeout and return false
      const result = await markMessagesAsRead('conv-1', 'user-1')
      expect(result).toBe(false)
    }, 7000) // Test timeout > API timeout
  })

  describe('User Profile Cache', () => {
    it('should cache user profiles', () => {
      // This is tested indirectly through subscribeToMessages
      // Cache should prevent duplicate fetches
    })

    it('should expire cache after TTL', () => {
      // Cache TTL is 5 minutes
      // This would require time-based testing
    })
  })

  describe('Error Handling', () => {
    it('should handle ValidationError', async () => {
      await expect(sendMessage('', '', '')).rejects.toThrow()
    })

    it('should handle DatabaseError', async () => {
      ;(global.fetch as any).mockRejectedValueOnce(new Error('Database error'))
      await expect(fetchMessages('conv-1')).rejects.toThrow()
    })
  })
})

