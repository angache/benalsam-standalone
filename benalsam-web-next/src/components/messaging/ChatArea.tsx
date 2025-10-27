'use client';

import { memo, useEffect, useState, useRef } from 'react';
import { MessageCircle, Send, MoreVertical, ArrowLeft } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { sanitizeText } from '@/utils/sanitize';
import { 
  useConversation, 
  useMessages, 
  useSendMessage, 
  useMarkAsRead 
} from '@/hooks/useMessaging';

interface Message {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
  is_read: boolean;
}

interface Conversation {
  id: string;
  listing_id: string;
  user1_id: string;
  user2_id: string;
  created_at: string;
  updated_at: string;
  listing: {
    id: string;
    title: string;
  };
  user1: {
    id: string;
    name: string;
    avatar_url?: string;
  };
  user2: {
    id: string;
    name: string;
    avatar_url?: string;
  };
}

interface ChatAreaProps {
  conversationId: string | null;
  currentUserId: string;
  onMessagesRead: () => void;
  onBack?: () => void;
  className?: string;
}

export const ChatArea = memo(function ChatArea({
  conversationId,
  currentUserId,
  onMessagesRead,
  onBack,
  className = '',
}: ChatAreaProps) {
  console.log('🟩 [ChatArea] Rendering', { conversationId });

  const [newMessage, setNewMessage] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // React Query hooks - with automatic caching!
  const { data: conversation, isLoading: loadingConversation } = useConversation(conversationId);
  const { 
    data: messagesData, 
    isLoading: loadingMessages, 
    isFetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useMessages(conversationId);
  const sendMessageMutation = useSendMessage();
  const markAsReadMutation = useMarkAsRead();

  // Flatten all pages into single array
  const messages = messagesData?.pages.flatMap(page => page.messages) || [];
  const totalMessages = messagesData?.pages[0]?.total || 0;

  const loading = loadingConversation || loadingMessages;

  console.log('🟩 [ChatArea] Query state', { 
    conversationId,
    hasConversation: !!conversation,
    messageCount: messages.length,
    totalMessages,
    isLoading: loading,
    isFetching,
    hasNextPage,
    isFetchingNextPage,
    isCached: !loading && messages.length > 0,
    pagesCount: messagesData?.pages?.length || 0
  });
  
  console.log('🟩 [ChatArea] Pages detail:', 
    messagesData?.pages.map((p, i) => ({
      pageIndex: i,
      messageCount: p.messages.length,
      total: p.total,
      hasMore: p.hasMore,
      firstMsg: p.messages[0]?.id?.substring(0, 8),
      lastMsg: p.messages[p.messages.length - 1]?.id?.substring(0, 8)
    }))
  );

  // Check for duplicates
  const messageIds = messages.map(m => m.id);
  const uniqueIds = new Set(messageIds);
  if (messageIds.length !== uniqueIds.size) {
    console.error('❌ [ChatArea] DUPLICATE MESSAGES DETECTED!', {
      total: messageIds.length,
      unique: uniqueIds.size,
      duplicates: messageIds.filter((id, index) => messageIds.indexOf(id) !== index)
    });
  }

  // Auto-scroll only if user is at bottom (WhatsApp style)
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  };

  // Track if user is at bottom
  const handleScroll = () => {
    if (!messagesContainerRef.current) return;
    
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    const atBottom = scrollHeight - scrollTop - clientHeight < 100; // 100px threshold
    setIsAtBottom(atBottom);
  };

  // Auto-scroll only if at bottom
  useEffect(() => {
    if (isAtBottom) {
      scrollToBottom();
    }
  }, [messages, isAtBottom]);

  useEffect(() => {
    if (!sendMessageMutation.isPending && inputRef.current) {
      inputRef.current.focus();
    }
  }, [sendMessageMutation.isPending]);

  // Mark as read when conversation loads
  useEffect(() => {
    if (conversationId && currentUserId && messages.length > 0 && !loading) {
      markAsReadMutation.mutate(
        { conversationId, userId: currentUserId },
        {
          onSuccess: () => {
            onMessagesRead();
          }
        }
      );
    }
  }, [conversationId, currentUserId, messages.length, loading]); // eslint-disable-line

  // Scroll to bottom when conversation first loads
  useEffect(() => {
    if (conversationId && messages.length > 0 && !loading) {
      console.log('📜 [ChatArea] Initial scroll to bottom');
      // Small delay to ensure DOM is ready
      setTimeout(() => {
        scrollToBottom();
        setIsAtBottom(true);
      }, 100);
    }
  }, [conversationId]); // Only on conversation change, not messages change

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !conversationId || !currentUserId) return;

    const messageContent = newMessage.trim();
    setNewMessage(''); // Clear immediately for better UX
    
    sendMessageMutation.mutate(
      { conversationId, senderId: currentUserId, content: messageContent },
      {
        onSuccess: () => {
          // Scroll to bottom after sending
          setTimeout(() => {
            scrollToBottom();
            setIsAtBottom(true);
            inputRef.current?.focus();
          }, 100);
        },
        onError: () => {
          // Restore message on error
          setNewMessage(messageContent);
        }
      }
    );
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  };

  const otherUser = conversation 
    ? (conversation.user1_id === currentUserId ? conversation.user2 : conversation.user1)
    : null;

  // Empty state
  if (!conversationId) {
    return (
      <div className={`flex-1 flex flex-col h-screen ${className}`}>
        <div className="flex flex-col items-center justify-center h-full text-center p-8 animate-fadeIn">
          <MessageCircle className="w-24 h-24 text-gray-300 dark:text-gray-600 mb-4" />
          <h2 className="text-2xl font-bold mb-2">Mesajlarınız</h2>
          <p className="text-gray-500 dark:text-gray-400">
            Bir sohbet seçin veya yeni bir sohbet başlatın
          </p>
        </div>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className={`flex-1 flex items-center justify-center h-screen animate-fadeIn ${className}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
      </div>
    );
  }

  return (
    <div className={`flex-1 flex flex-col h-screen animate-fadeIn ${className}`}>
      {/* Chat Header */}
      <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-black">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {/* Back Button - Mobile Only */}
          {onBack && (
            <button
              onClick={onBack}
              className="md:hidden p-2 -ml-2 hover:bg-gray-100 dark:hover:bg-gray-900 rounded-full transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
          )}
          
          <Avatar className="w-10 h-10">
            <AvatarImage src={otherUser?.avatar_url || undefined} alt={otherUser?.name} />
            <AvatarFallback className="bg-gradient-to-br from-purple-400 to-pink-400 text-white">
              {otherUser?.name?.[0] || 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-semibold truncate">{sanitizeText(otherUser?.name) || 'Kullanıcı'}</h2>
            {conversation?.listing && (
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {conversation.listing.title}
              </p>
            )}
          </div>
        </div>

        <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-900 rounded-full transition-colors flex-shrink-0">
          <MoreVertical className="w-6 h-6 text-gray-600 dark:text-gray-400" />
        </button>
      </div>

      {/* Messages Container */}
      <div 
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-6 py-4" 
        style={{ minHeight: 0 }}
      >
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500 dark:text-gray-400">Henüz mesaj yok. İlk mesajı gönderin!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Load More Button */}
            {hasNextPage && (
              <div className="flex justify-center py-4">
                <button
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                  className="
                    px-6 py-2 text-sm font-medium
                    bg-gray-100 dark:bg-gray-800 
                    hover:bg-gray-200 dark:hover:bg-gray-700
                    text-gray-700 dark:text-gray-300
                    rounded-full transition-colors
                    disabled:opacity-50 disabled:cursor-not-allowed
                    flex items-center gap-2
                  "
                >
                  {isFetchingNextPage ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                      Yükleniyor...
                    </>
                  ) : (
                    <>
                      ↑ Daha Eski Mesajları Yükle ({totalMessages - messages.length} mesaj daha)
                    </>
                  )}
                </button>
              </div>
            )}

            {messages.map((message) => {
              const isMine = message.sender_id === currentUserId;
              return (
                <div key={message.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[70%] ${isMine ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                    <div className={`px-4 py-2 rounded-2xl ${
                      isMine 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
                    }`}>
                      <p className="text-sm break-words">{sanitizeText(message.content)}</p>
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400 px-2">
                      {formatMessageTime(message.created_at)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Message Input */}
      <div className="flex-shrink-0 p-4 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-black">
        <div className="relative">
          <Input
            ref={inputRef}
            type="text"
            placeholder="Mesajınızı yazın..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={sendMessageMutation.isPending}
            className="
              w-full px-4 py-2.5 pr-12
              bg-gray-100 dark:bg-gray-800
              border border-gray-200 dark:border-gray-700
              rounded-full text-sm
              placeholder:text-gray-500 dark:placeholder:text-gray-400
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-all
            "
          />
          
          {newMessage.trim() && (
            <button
              onClick={handleSendMessage}
              disabled={sendMessageMutation.isPending}
              className="
                absolute right-2 top-1/2 -translate-y-1/2 p-2
                text-blue-500 hover:text-blue-600
                disabled:text-blue-300 disabled:cursor-not-allowed
                transition-colors
              "
            >
              <Send className="w-5 h-5" fill="currentColor" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
});

