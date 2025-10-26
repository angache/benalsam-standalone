'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNotifications } from '@/contexts/NotificationContext';
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
  console.log('🔴 [MessagesV2Page] Main page rendering...');

  const { user, isLoading } = useAuth();
  const { setActiveConversation, refreshUnreadCount } = useNotifications();
  
  const [conversations, setConversations] = useState<ConversationPreview[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);

  // Update active conversation for notifications
  useEffect(() => {
    setActiveConversation(selectedConversationId);
    return () => {
      setActiveConversation(null);
    };
  }, [selectedConversationId, setActiveConversation]);

  // Fetch conversations list
  useEffect(() => {
    if (!user?.id) return;

    const fetchConversationsList = async (silent = false) => {
      try {
        if (!silent) setLoading(true);
        const response = await fetch(`/api/messages?userId=${user.id}`);
        if (!response.ok) throw new Error('Mesajlar yüklenemedi');

        const { data } = await response.json();
        setConversations(data || []);
      } catch (err) {
        console.error('❌ [MessagesV2] Error fetching conversations:', err);
      } finally {
        if (!silent) setLoading(false);
      }
    };

    fetchConversationsList(false);

    // Subscribe to new messages to refresh conversation list (silently)
    const channel = supabase
      .channel('conversations-list')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
        },
        async (payload) => {
          const newMessage = payload.new as any;
          
          if (newMessage?.conversation_id === selectedConversationId) {
            setTimeout(async () => {
              await fetchConversationsList(true);
            }, 1000);
          } else {
            await fetchConversationsList(true);
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [user?.id, selectedConversationId]);

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
    console.log('🟢 [MessagesV2Page] Conversation selected', { conversationId });
    setSelectedConversationId(conversationId);
  }, []);

  const handleMessagesRead = useCallback(() => {
    refreshUnreadCount();
  }, [refreshUnreadCount]);

  if (isLoading || !user) {
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
        />

        {/* RIGHT PANEL - Chat Area */}
        <ChatArea
          conversationId={selectedConversationId}
          currentUserId={user.id}
          onMessagesRead={handleMessagesRead}
        />
      </div>
    </MessagingErrorBoundary>
  );
}

