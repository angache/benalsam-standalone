'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
 * Hook for fetching messages in a conversation
 */
export function useMessages(conversationId: string | null) {
  return useQuery({
    queryKey: ['messages', conversationId],
    queryFn: () => {
      if (!conversationId) throw new Error('No conversation ID');
      console.log('🔵 [useMessages] Fetching from API...', { conversationId });
      return fetchMessages(conversationId, 100);
    },
    enabled: !!conversationId,
    staleTime: 2 * 60 * 1000, // 2 minutes - messages more frequently updated
    gcTime: 15 * 60 * 1000, // 15 minutes cache
    refetchOnWindowFocus: true, // Refetch when user comes back
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
    
    // Optimistic update
    onMutate: async ({ conversationId, senderId, content }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['messages', conversationId] });

      // Snapshot previous value
      const previousMessages = queryClient.getQueryData(['messages', conversationId]);

      // Optimistically update
      const tempMessage = {
        id: `temp-${Date.now()}`,
        content,
        sender_id: senderId,
        created_at: new Date().toISOString(),
        is_read: false,
      };

      queryClient.setQueryData(['messages', conversationId], (old: any) => {
        return old ? [...old, tempMessage] : [tempMessage];
      });

      console.log('✨ [useSendMessage] Optimistic update applied');

      return { previousMessages };
    },

    // On success, invalidate to refetch
    onSuccess: (data, variables) => {
      console.log('✅ [useSendMessage] Message sent successfully');
      queryClient.invalidateQueries({ queryKey: ['messages', variables.conversationId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },

    // On error, rollback
    onError: (err, variables, context) => {
      console.error('❌ [useSendMessage] Failed to send message:', err);
      if (context?.previousMessages) {
        queryClient.setQueryData(['messages', variables.conversationId], context.previousMessages);
      }
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

