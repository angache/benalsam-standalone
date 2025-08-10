import { useQuery, useMutation, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import { useAuthStore } from '../../stores';
import { queryKeys } from '../../lib/queryClient';
import {
  getUserConversations,
  fetchConversationDetails,
  fetchMessages,
  sendMessage,
  markMessagesAsRead,
  getOrCreateConversation,
  getTotalUnreadMessages,
  getUnreadMessageCounts,
} from '../../services/conversationService';
import { Conversation, Message } from '../../types';

// User's conversations list hook
export const useConversations = (options?: UseQueryOptions<Conversation[], Error>) => {
  const { user } = useAuthStore();
  
  return useQuery({
    queryKey: queryKeys.conversations.all(user?.id || ''),
    queryFn: () => getUserConversations(user?.id || ''),
    enabled: !!user?.id,
    staleTime: 1 * 60 * 1000, // 1 dakika fresh - conversations sık güncellenir
    ...options,
  });
};

// Single conversation detail hook
export const useConversationDetails = (
  conversationId: string,
  options?: UseQueryOptions<Conversation, Error>
) => {
  return useQuery({
    queryKey: queryKeys.conversations.detail(conversationId),
    queryFn: () => fetchConversationDetails(conversationId),
    enabled: !!conversationId,
    staleTime: 5 * 60 * 1000, // 5 dakika fresh - conversation details daha az değişir
    ...options,
  });
};

// Messages in a conversation hook
export const useMessages = (
  conversationId: string,
  limit = 50,
  options?: UseQueryOptions<Message[], Error>
) => {
  return useQuery({
    queryKey: ['messages', conversationId, limit],
    queryFn: () => fetchMessages(conversationId, limit),
    enabled: !!conversationId,
    staleTime: 30 * 1000, // 30 saniye fresh - messages çok hızlı değişir
    refetchInterval: 5000, // 5 saniyede bir kontrol et (realtime için)
    ...options,
  });
};

// Total unread messages count hook
export const useUnreadMessagesCount = (options?: UseQueryOptions<number, Error>) => {
  const { user } = useAuthStore();
  
  return useQuery({
    queryKey: ['unread-messages-total', user?.id],
    queryFn: () => getTotalUnreadMessages(user?.id || ''),
    enabled: !!user?.id,
    staleTime: 30 * 1000, // 30 saniye fresh
    refetchInterval: 30000, // 30 saniyede bir kontrol et
    ...options,
  });
};

// Unread messages count per conversation hook
export const useUnreadMessageCounts = (options?: UseQueryOptions<{ [key: string]: number }, Error>) => {
  const { user } = useAuthStore();
  
  return useQuery({
    queryKey: queryKeys.conversations.unreadCounts(user?.id || ''),
    queryFn: () => getUnreadMessageCounts(user?.id || ''),
    enabled: !!user?.id,
    staleTime: 30 * 1000, // 30 saniye fresh
    refetchInterval: 30000, // 30 saniyede bir kontrol et
    ...options,
  });
};

// Send message mutation
export const useSendMessage = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  
  return useMutation({
    mutationFn: ({
      conversationId,
      content,
      messageType = 'text'
    }: {
      conversationId: string;
      content: string;
      messageType?: Message['message_type'];
    }) => sendMessage(conversationId, user?.id || '', content, messageType),
    
    onMutate: async ({ conversationId, content }) => {
      // Optimistic update
      if (!user?.id) return;
      
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['messages', conversationId] });
      
      // Snapshot the previous value
      const previousMessages = queryClient.getQueryData<Message[]>(['messages', conversationId]);
      
      // Optimistically add the new message
      if (previousMessages) {
        const optimisticMessage = {
          id: `temp-${Date.now()}`,
          content,
          sender_id: user.id,
          conversation_id: conversationId,
          created_at: new Date().toISOString(),
          sender: {
            id: user.id,
            name: user.username || user.email?.split('@')[0],
            avatar_url: user.avatar_url,
          },
          is_optimistic: true, // Mark as optimistic
        };
        
        queryClient.setQueryData(['messages', conversationId], [...previousMessages, optimisticMessage]);
      }
      
      return { previousMessages };
    },
    
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousMessages) {
        queryClient.setQueryData(['messages', variables.conversationId], context.previousMessages);
      }
    },
    
    onSettled: (data, error, variables) => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ['messages', variables.conversationId] });
      
      // Update conversations list to show latest message
      if (user?.id) {
        queryClient.invalidateQueries({ queryKey: queryKeys.conversations.all(user.id) });
      }
    },
  });
};

// Mark messages as read mutation
export const useMarkMessagesAsRead = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  
  return useMutation({
    mutationFn: (conversationId: string) => markMessagesAsRead(conversationId, user?.id || ''),
    
    onSuccess: (data, conversationId) => {
      // Invalidate unread counts
      if (user?.id) {
        queryClient.invalidateQueries({ queryKey: queryKeys.conversations.unreadCounts(user.id) });
        queryClient.invalidateQueries({ queryKey: ['unread-messages-total', user.id] });
      }
    },
  });
};

// Create or get conversation mutation
export const useCreateConversation = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  
  return useMutation({
    mutationFn: ({
      otherUserId,
      offerId = null,
      listingId = null
    }: {
      otherUserId: string;
      offerId?: string | null;
      listingId?: string | null;
    }) => getOrCreateConversation(user?.id || '', otherUserId, offerId, listingId),
    
    onSuccess: () => {
      // Refresh conversations list
      if (user?.id) {
        queryClient.invalidateQueries({ queryKey: queryKeys.conversations.all(user.id) });
      }
    },
  });
};

// Helper hook for conversation actions
export const useConversationActions = () => {
  const sendMessageMutation = useSendMessage();
  const markAsReadMutation = useMarkMessagesAsRead();
  const createConversationMutation = useCreateConversation();
  
  return {
    sendMessage: sendMessageMutation.mutateAsync,
    markAsRead: markAsReadMutation.mutateAsync,
    createConversation: createConversationMutation.mutateAsync,
    
    isSending: sendMessageMutation.isPending,
    isMarkingAsRead: markAsReadMutation.isPending,
    isCreatingConversation: createConversationMutation.isPending,
    
    sendError: sendMessageMutation.error,
    markError: markAsReadMutation.error,
    createError: createConversationMutation.error,
  };
}; 