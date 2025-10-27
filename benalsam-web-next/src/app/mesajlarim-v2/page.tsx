'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNotifications } from '@/contexts/NotificationContext';
import { useConversations } from '@/hooks/useMessaging';
import { supabase } from '@/lib/supabase';
import { MessagingErrorBoundary } from '@/components/ErrorBoundary';
import { ConversationList } from '@/components/messaging/ConversationList';
import { ChatArea } from '@/components/messaging/ChatArea';

interface ConversationPreview {
  id: string;
  otherUser: {
    id: string;
    name: string;
    avatar_url?: string;
  };
  listing: {
    id: string;
    title: string;
    user_id: string;
  };
  lastMessage: {
    id: string;
    content: string;
    sender_id: string;
    is_read: boolean;
    created_at: string;
  };
  unreadCount: number;
  created_at: string;
  updated_at: string;
}

export default function MessagesV2Page() {
  const { user, isLoading: authLoading } = useAuth();
  const { setActiveConversation, refreshUnreadCount } = useNotifications();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);

  // React Query - auto cached!
  const { data: conversations = [], isLoading: loadingConversations } = useConversations(user?.id);

  // Update active conversation for notifications
  useEffect(() => {
    setActiveConversation(selectedConversationId);
    return () => {
      setActiveConversation(null);
    };
  }, [selectedConversationId, setActiveConversation]);

  // Subscribe to realtime updates (still needed for instant updates)
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('conversations-list')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
        },
        async () => {
          // React Query will automatically refetch and update cache
          console.log('📨 [MessagesV2Page] New message detected, cache will auto-update');
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [user?.id]);

  // Filter conversations based on search
  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations;

    const query = searchQuery.toLowerCase();
    return conversations.filter(conv => {
      const userName = conv.otherUser?.name?.toLowerCase() || '';
      const listingTitle = conv.listing?.title?.toLowerCase() || '';
      const messageContent = conv.lastMessage?.content?.toLowerCase() || '';
      return userName.includes(query) || listingTitle.includes(query) || messageContent.includes(query);
    });
  }, [searchQuery, conversations]);

  // Handlers
  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  const handleConversationSelect = useCallback((conversationId: string) => {
    setSelectedConversationId(conversationId);
  }, []);

  const handleMessagesRead = useCallback(() => {
    refreshUnreadCount();
  }, [refreshUnreadCount]);

  const handleBack = useCallback(() => {
    setSelectedConversationId(null);
  }, []);

  if (authLoading || !user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
      </div>
    );
  }

  return (
    <MessagingErrorBoundary>
      <div className="fixed inset-0 flex bg-white dark:bg-black overflow-hidden z-[100]">
        {/* LEFT PANEL - Conversation List */}
        <ConversationList
          conversations={filteredConversations}
          selectedConversationId={selectedConversationId}
          searchQuery={searchQuery}
          currentUserId={user.id}
          onSearchChange={handleSearchChange}
          onConversationSelect={handleConversationSelect}
          className={selectedConversationId ? 'hidden md:flex' : 'flex'}
        />

        {/* RIGHT PANEL - Chat Area */}
        <ChatArea
          conversationId={selectedConversationId}
          currentUserId={user.id}
          onMessagesRead={handleMessagesRead}
          onBack={handleBack}
          className={selectedConversationId ? 'flex' : 'hidden md:flex'}
        />
      </div>
    </MessagingErrorBoundary>
  );
}

