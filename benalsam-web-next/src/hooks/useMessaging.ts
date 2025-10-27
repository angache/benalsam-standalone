'use client';

import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { 
  fetchMessages, 
  fetchConversationDetails,
  sendMessage as sendMessageAPI,
  markMessagesAsRead
} from '@/services/conversationService';

/**
 * Hook for fetching conversation details
 */
export function useConversation(conversationId: string | null) {
  return useQuery({
    queryKey: ['conversation', conversationId],
    queryFn: () => {
      if (!conversationId) throw new Error('No conversation ID');
      return fetchConversationDetails(conversationId);
    },
    enabled: !!conversationId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes cache (was cacheTime in v4)
  });
}

/**
 * Hook for fetching messages in a conversation with infinite scroll
 */
export function useMessages(conversationId: string | null) {
  return useInfiniteQuery({
    queryKey: ['messages', conversationId],
    queryFn: async ({ pageParam = 0 }) => {
      if (!conversationId) throw new Error('No conversation ID');
      console.log('🔵 [useMessages] Fetching from API...', { 
        conversationId, 
        offset: pageParam 
      });
      return fetchMessages(conversationId, 50, pageParam);
    },
    enabled: !!conversationId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes cache
    refetchOnWindowFocus: true,
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      // Calculate total messages loaded so far
      const loadedCount = allPages.reduce((sum, page) => sum + page.messages.length, 0);
      
      // If there are more messages, return next offset
      if (lastPage.hasMore && loadedCount < lastPage.total) {
        console.log('📊 [useMessages] Next page', { 
          loadedCount, 
          total: lastPage.total, 
          nextOffset: loadedCount 
        });
        return loadedCount;
      }
      
      console.log('📊 [useMessages] No more pages');
      return undefined;
    },
  });
}

/**
 * Hook for sending a message
 */
export function useSendMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ 
      conversationId, 
      senderId, 
      content 
    }: { 
      conversationId: string; 
      senderId: string; 
      content: string;
    }) => {
      return sendMessageAPI(conversationId, senderId, content);
    },
    
    // On success, update conversations list
    onSuccess: async (data, variables) => {
      console.log('✅ [useSendMessage] Message sent successfully');
      
      // Update conversations list to show latest message
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },

    // On error, log it
    onError: (err) => {
      console.error('❌ [useSendMessage] Failed to send message:', err);
    },
  });
}

/**
 * Hook for marking messages as read
 */
export function useMarkAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ 
      conversationId, 
      userId 
    }: { 
      conversationId: string; 
      userId: string;
    }) => {
      return markMessagesAsRead(conversationId, userId);
    },
    
    onSuccess: (_, variables) => {
      console.log('✅ [useMarkAsRead] Messages marked as read');
      // Invalidate to refresh unread counts
      queryClient.invalidateQueries({ queryKey: ['messages', variables.conversationId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}

/**
 * Hook for conversations list
 */
export function useConversations(userId: string | undefined) {
  return useQuery({
    queryKey: ['conversations', userId],
    queryFn: async () => {
      if (!userId) throw new Error('No user ID');
      console.log('🔵 [useConversations] Fetching from API...', { userId });
      const response = await fetch(`/api/messages?userId=${userId}`);
      if (!response.ok) throw new Error('Failed to fetch conversations');
      const { data } = await response.json();
      return data || [];
    },
    enabled: !!userId,
    staleTime: 1 * 60 * 1000, // 1 minute
    gcTime: 10 * 60 * 1000, // 10 minutes cache
    refetchOnWindowFocus: true,
  });
}

