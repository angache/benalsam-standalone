'use client';

import { memo, useEffect, useState, useRef } from 'react';
import { MessageCircle, Send, MoreVertical, ArrowLeft, Check, CheckCheck } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { sanitizeText } from '@/utils/sanitize';
import { 
  useConversation, 
  useMessages, 
  useSendMessage, 
  useMarkAsRead 
} from '@/hooks/useMessaging';
import { useTypingIndicator, TypingIndicatorUI } from '@/hooks/useTypingIndicator';
import { supabase } from '@/lib/supabase';
import { realtimeManager } from '@/lib/realtime-manager';

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

  const [newMessage, setNewMessage] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  
  // Local messages state for new messages (not in infinite scroll cache)
  const [localNewMessages, setLocalNewMessages] = useState<Message[]>([]);

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

  // Get other user ID (after conversation is loaded)
  const otherUserId = conversation?.user1_id === currentUserId ? conversation?.user2_id : conversation?.user1_id || '';

  // Typing indicator hook
  const { isOtherUserTyping, sendTypingStatus } = useTypingIndicator(
    conversationId,
    currentUserId,
    otherUserId
  );

  // Flatten all pages into single array (from cache/API)
  const cachedMessages = messagesData?.pages.flatMap(page => page.messages) || [];
  
  // Get IDs of cached messages
  const cachedIds = new Set(cachedMessages.map(m => m?.id).filter(Boolean));
  
  // Only add local messages that are NOT already in cache (deduplicate)
  const uniqueLocalMessages = localNewMessages.filter(m => !cachedIds.has(m?.id));
  
  // Combine cached + unique local messages
  const messages = [...cachedMessages, ...uniqueLocalMessages].filter(Boolean);
  const totalMessages = messagesData?.pages[0]?.total || 0;
  
  const loading = loadingConversation || loadingMessages;
  
  // Clear local messages when conversation changes
  useEffect(() => {
    setLocalNewMessages([]);
  }, [conversationId]);

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

  // Subscribe to global realtime manager for new messages
  useEffect(() => {
    if (!conversationId) return;

    const unsubscribe = realtimeManager.on('message:new', (data) => {
      // Only handle messages for THIS conversation
      if (data.conversationId !== conversationId) {
        return;
      }

      const newMessage = data.message;

      // Only add if it's NOT from current user (we already added it optimistically)
      if (newMessage.sender_id !== currentUserId) {
        setLocalNewMessages(prev => {
          // Check if message already exists
          const exists = prev.some(m => m.id === newMessage.id);
          if (exists) return prev;
          
          return [...prev, newMessage];
        });

        // Auto-scroll if at bottom
        if (isAtBottom) {
          setTimeout(() => scrollToBottom(), 100);
        }
      }
    });

    return () => {
      unsubscribe();
    };
  }, [conversationId, currentUserId, isAtBottom]); // eslint-disable-line

  // Subscribe to message UPDATE events (for is_read status changes)
  useEffect(() => {
    if (!conversationId) return;

    const unsubscribe = realtimeManager.on('message:update', (data) => {
      // Update local messages if exists
      setLocalNewMessages(prev =>
        prev.map(msg => 
          msg.id === data.messageId 
            ? { ...msg, ...data.updates }
            : msg
        )
      );
    });

    return () => {
      unsubscribe();
    };
  }, [conversationId]); // eslint-disable-line

  // Scroll to bottom when conversation first loads
  useEffect(() => {
    if (conversationId && messages.length > 0 && !loading) {
      setTimeout(() => {
        scrollToBottom();
        setIsAtBottom(true);
      }, 100);
    }
  }, [conversationId]); // Only on conversation change, not messages change

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !conversationId || !currentUserId) {
      return;
    }

    const messageContent = newMessage.trim();
    
    // Create optimistic message
    const optimisticMessage: Message = {
      id: `temp-${Date.now()}`,
      content: messageContent,
      sender_id: currentUserId,
      created_at: new Date().toISOString(),
      is_read: false,
    };
    
    // Add to local messages immediately (optimistic update)
    setLocalNewMessages(prev => [...prev, optimisticMessage]);
    setNewMessage(''); // Clear input immediately for better UX
    
    // Stop typing indicator
    setIsTyping(false);
    sendTypingStatus(false);
    
    // Force scroll to bottom to see new message
    setIsAtBottom(true);
    setTimeout(() => {
      const container = messagesContainerRef.current;
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    }, 100);
    
    // Send to API
    sendMessageMutation.mutate(
      { conversationId, senderId: currentUserId, content: messageContent },
      {
        onSuccess: (realMessage) => {
          // Replace optimistic message with real one
          setLocalNewMessages(prev => 
            prev.map(msg => msg.id === optimisticMessage.id ? realMessage : msg)
          );
          
          // Scroll to bottom
          setTimeout(() => {
            const container = messagesContainerRef.current;
            if (container) {
              container.scrollTop = container.scrollHeight;
            }
            inputRef.current?.focus();
          }, 100);
        },
        onError: () => {
          // Remove optimistic message on error
          setLocalNewMessages(prev => prev.filter(msg => msg.id !== optimisticMessage.id));
          
          // Restore message in input
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

  // Typing indicator handlers
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNewMessage(value);

    // Send typing status
    if (value.trim() && !isTyping) {
      setIsTyping(true);
      sendTypingStatus(true);
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      sendTypingStatus(false);
    }, 1000);
  };

  // Cleanup typing timeout
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

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
                <div 
                  key={message.id} 
                  className={`flex ${isMine ? 'justify-end' : 'justify-start'} mb-2`}
                >
                  <div className={`relative max-w-[70%] ${isMine ? 'items-end' : 'items-start'} flex flex-col`}>
                    {/* Message Bubble */}
                    <div className={`
                      relative px-3 py-2 rounded-2xl shadow-sm
                      ${isMine 
                        ? 'bg-blue-500 text-white rounded-br-md' 
                        : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-bl-md border border-gray-200 dark:border-gray-600'
                      }
                    `}>
                      <p className="text-sm break-words leading-relaxed">{sanitizeText(message.content)}</p>
                      
                      {/* Time + Status (inside bubble, bottom right) */}
                      <div className={`
                        flex items-center gap-1 mt-1 justify-end
                        ${isMine ? 'text-white/70' : 'text-gray-500 dark:text-gray-400'}
                      `}>
                        <span className="text-[10px] leading-none">
                          {formatMessageTime(message.created_at)}
                        </span>
                        {isMine && (
                          <div className="flex items-center ml-1">
                            {message.is_read ? (
                              <CheckCheck size={14} className="text-blue-200" strokeWidth={2.5} />
                            ) : (
                              <Check size={14} className="text-white/60" strokeWidth={2.5} />
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Typing Indicator */}
            {isOtherUserTyping && otherUser && (
              <TypingIndicatorUI isTyping={isOtherUserTyping} userName={otherUser.name} />
            )}
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
            onChange={handleInputChange}
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

