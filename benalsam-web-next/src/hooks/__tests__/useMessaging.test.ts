import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  useConversation,
  useMessages,
  useSendMessage,
  useMarkAsRead,
  useConversations,
} from '../useMessaging'
import {
  fetchConversationDetails,
  fetchMessages,
  sendMessage as sendMessageAPI,
  markMessagesAsRead,
} from '@/services/conversationService'
import { logger } from '@/utils/production-logger'

// Mock dependencies
vi.mock('@/services/conversationService', () => ({
  fetchConversationDetails: vi.fn(),
  fetchMessages: vi.fn(),
  sendMessage: vi.fn(),
  markMessagesAsRead: vi.fn(),
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

describe('useMessaging', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          gcTime: 0,
        },
      },
    })
    vi.clearAllMocks()
  })

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )

  describe('useConversation', () => {
    const mockConversation = {
      id: 'conv-1',
      listing_id: 'listing-1',
      participants: ['user-1', 'user-2'],
    }

    it('should fetch conversation details', async () => {
      vi.mocked(fetchConversationDetails).mockResolvedValue(
        mockConversation as never
      )

      const { result } = renderHook(
        () => useConversation('conv-1'),
        { wrapper }
      )

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(result.current.data).toEqual(mockConversation)
      expect(fetchConversationDetails).toHaveBeenCalledWith('conv-1')
    })

    it('should not fetch when conversationId is null', () => {
      const { result } = renderHook(() => useConversation(null), { wrapper })

      expect(result.current.isEnabled).toBe(false)
      expect(fetchConversationDetails).not.toHaveBeenCalled()
    })

    it('should handle errors', async () => {
      const error = new Error('Failed to fetch conversation')
      vi.mocked(fetchConversationDetails).mockRejectedValue(error)

      const { result } = renderHook(
        () => useConversation('conv-1'),
        { wrapper }
      )

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      expect(result.current.error).toEqual(error)
    })
  })

  describe('useMessages', () => {
    const mockMessages = {
      messages: [
        { id: 'msg-1', content: 'Hello', created_at: '2025-01-01' },
        { id: 'msg-2', content: 'Hi', created_at: '2025-01-02' },
      ],
      total: 2,
      hasMore: false,
    }

    it('should fetch messages', async () => {
      vi.mocked(fetchMessages).mockResolvedValue(mockMessages as never)

      const { result } = renderHook(() => useMessages('conv-1'), { wrapper })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(result.current.data?.pages[0].messages).toEqual(mockMessages.messages)
      expect(fetchMessages).toHaveBeenCalledWith('conv-1', 50, 0)
    })

    it('should fetch next page', async () => {
      const firstPage = {
        messages: [{ id: 'msg-1', content: 'Hello' }],
        total: 3,
        hasMore: true,
      }
      const secondPage = {
        messages: [{ id: 'msg-2', content: 'Hi' }],
        total: 3,
        hasMore: false,
      }

      vi.mocked(fetchMessages)
        .mockResolvedValueOnce(firstPage as never)
        .mockResolvedValueOnce(secondPage as never)

      const { result } = renderHook(() => useMessages('conv-1'), { wrapper })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      // Fetch next page
      await result.current.fetchNextPage()

      await waitFor(() => {
        expect(fetchMessages).toHaveBeenCalledTimes(2)
      })

      expect(fetchMessages).toHaveBeenCalledWith('conv-1', 50, 1)
    })

    it('should not fetch when conversationId is null', () => {
      const { result } = renderHook(() => useMessages(null), { wrapper })

      expect(result.current.isEnabled).toBe(false)
      expect(fetchMessages).not.toHaveBeenCalled()
    })
  })

  describe('useSendMessage', () => {
    const mockMessage = {
      id: 'msg-1',
      conversation_id: 'conv-1',
      sender_id: 'user-1',
      content: 'Hello',
    }

    it('should send message successfully', async () => {
      vi.mocked(sendMessageAPI).mockResolvedValue(mockMessage as never)

      const { result } = renderHook(() => useSendMessage(), { wrapper })

      await result.current.mutateAsync({
        conversationId: 'conv-1',
        senderId: 'user-1',
        content: 'Hello',
      })

      expect(sendMessageAPI).toHaveBeenCalledWith('conv-1', 'user-1', 'Hello')
      expect(result.current.isSuccess).toBe(true)
    })

    it('should invalidate conversations on success', async () => {
      vi.mocked(sendMessageAPI).mockResolvedValue(mockMessage as never)

      const { result } = renderHook(() => useSendMessage(), { wrapper })

      await result.current.mutateAsync({
        conversationId: 'conv-1',
        senderId: 'user-1',
        content: 'Hello',
      })

      // Check that conversations query was invalidated
      const conversationsData = queryClient.getQueryData(['conversations'])
      // Data should be invalidated (undefined or stale)
      expect(queryClient.getQueryState(['conversations'])?.isInvalidated).toBe(
        true
      )
    })

    it('should handle errors', async () => {
      const error = new Error('Failed to send message')
      vi.mocked(sendMessageAPI).mockRejectedValue(error)

      const { result } = renderHook(() => useSendMessage(), { wrapper })

      await expect(
        result.current.mutateAsync({
          conversationId: 'conv-1',
          senderId: 'user-1',
          content: 'Hello',
        })
      ).rejects.toThrow()

      expect(logger.error).toHaveBeenCalledWith(
        '[useSendMessage] Failed to send message',
        { error }
      )
    })
  })

  describe('useMarkAsRead', () => {
    it('should mark messages as read', async () => {
      vi.mocked(markMessagesAsRead).mockResolvedValue({ success: true } as never)

      const { result } = renderHook(() => useMarkAsRead(), { wrapper })

      await result.current.mutateAsync({
        conversationId: 'conv-1',
        userId: 'user-1',
      })

      expect(markMessagesAsRead).toHaveBeenCalledWith('conv-1', 'user-1')
      expect(result.current.isSuccess).toBe(true)
    })

    it('should invalidate queries on success', async () => {
      vi.mocked(markMessagesAsRead).mockResolvedValue({ success: true } as never)

      const { result } = renderHook(() => useMarkAsRead(), { wrapper })

      await result.current.mutateAsync({
        conversationId: 'conv-1',
        userId: 'user-1',
      })

      // Check that queries were invalidated
      expect(
        queryClient.getQueryState(['messages', 'conv-1'])?.isInvalidated
      ).toBe(true)
      expect(queryClient.getQueryState(['conversations'])?.isInvalidated).toBe(
        true
      )
    })
  })

  describe('useConversations', () => {
    const mockConversations = [
      { id: 'conv-1', last_message: 'Hello' },
      { id: 'conv-2', last_message: 'Hi' },
    ]

    it('should fetch conversations', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockConversations }),
      } as Response)

      const { result } = renderHook(() => useConversations('user-1'), {
        wrapper,
      })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(result.current.data).toEqual(mockConversations)
      expect(global.fetch).toHaveBeenCalledWith('/api/messages?userId=user-1')
    })

    it('should not fetch when userId is undefined', () => {
      const { result } = renderHook(() => useConversations(undefined), {
        wrapper,
      })

      expect(result.current.isEnabled).toBe(false)
      expect(global.fetch).not.toHaveBeenCalled()
    })

    it('should handle fetch errors', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: false,
      } as Response)

      const { result } = renderHook(() => useConversations('user-1'), {
        wrapper,
      })

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      expect(result.current.error).toBeInstanceOf(Error)
    })

    it('should log debug messages', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockConversations }),
      } as Response)

      renderHook(() => useConversations('user-1'), { wrapper })

      await waitFor(() => {
        expect(logger.debug).toHaveBeenCalled()
      })

      expect(logger.debug).toHaveBeenCalledWith(
        '[useConversations] Fetching from API',
        { userId: 'user-1' }
      )
    })
  })
})

