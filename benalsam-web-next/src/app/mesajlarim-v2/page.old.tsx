'use client';

import { useEffect, useState, useRef, useMemo, useCallback, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useNotifications } from '@/contexts/NotificationContext';
import { supabase } from '@/lib/supabase';
import { MessageCircle, Search, Edit, Send, Phone, Video, Info, Smile, MoreVertical } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { sanitizeMessage, sanitizeText, sanitizeListingTitle } from '@/utils/sanitize';
import { MessagingErrorBoundary } from '@/components/ErrorBoundary';
import { 
  fetchMessages, 
  sendMessage, 
  subscribeToMessages, 
  markMessagesAsRead,
  fetchConversationDetails 
} from '@/services/conversationService';
import { Conversation, Message } from 'benalsam-shared-types';

interface ConversationPreview {
  id: string;
  user1_id: string;
  user2_id: string;
  listing_id?: string;
  listing?: { id: string; title: string };
  otherUser?: { id: string; name: string; avatar_url?: string };
  lastMessage?: { content: string; sender_id: string; created_at: string; is_read: boolean };
  unreadCount: number;
  created_at: string;
  updated_at: string;
}

export default function MessagesV2Page() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const { setActiveConversation, refreshUnreadCount } = useNotifications();
  const [conversations, setConversations] = useState<ConversationPreview[]>([]);
  const [filteredConversations, setFilteredConversations] = useState<ConversationPreview[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Selected conversation state
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);

  // Update active conversation for notifications
  useEffect(() => {
    console.log('🟡 [MessagesV2] Active conversation updated', { selectedConversationId })
    setActiveConversation(selectedConversationId);
    
    return () => {
      console.log('🟡 [MessagesV2] Cleaning up active conversation')
      setActiveConversation(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedConversationId]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const selectedConvRef = useRef<string | null>(selectedConversationId);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!sending && inputRef.current) {
      inputRef.current.focus();
    }
  }, [sending]);

  // Handle page visibility change (tab becomes visible again)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && selectedConversationId && user?.id) {
        // Refresh messages when tab becomes active again
        fetchMessages(selectedConversationId, 100)
          .then(messagesData => {
            setMessages(messagesData);
          })
          .catch(err => {
            console.error('❌ [MessagesV2] Failed to refresh messages:', err);
          });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [selectedConversationId, user?.id]);

  // Fetch conversations list
  useEffect(() => {
    if (!user?.id) {
      return;
    }

    const fetchConversationsList = async (silent = false) => {
      try {
        if (!silent) setLoading(true);
        const response = await fetch(`/api/messages?userId=${user.id}`);
        if (!response.ok) throw new Error('Mesajlar yüklenemedi');

        const { data } = await response.json();
        setConversations(data || []);
        setFilteredConversations(data || []);
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
          event: '*', // Listen to all events (INSERT, UPDATE)
          schema: 'public',
          table: 'messages',
        },
        async (payload) => {
          const newMessage = payload.new as any;
          
          // Don't refresh immediately if this message is for the active conversation
          // (let the mark-as-read flow handle it)
          if (newMessage?.conversation_id === selectedConversationId) {
            // Delay refresh to let mark-as-read complete first
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

  // Search handler
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredConversations(conversations);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = conversations.filter(conv => {
      const userName = conv.otherUser?.name?.toLowerCase() || '';
      const listingTitle = conv.listing?.title?.toLowerCase() || '';
      const messageContent = conv.lastMessage?.content?.toLowerCase() || '';
      return userName.includes(query) || listingTitle.includes(query) || messageContent.includes(query);
    });

    setFilteredConversations(filtered);
  }, [searchQuery, conversations]);

  // Update ref when conversation changes
  useEffect(() => {
    selectedConvRef.current = selectedConversationId;
  }, [selectedConversationId]);

  // Load selected conversation messages (data only, no subscription)
  useEffect(() => {
    console.log('🟠 [MessagesV2] Load conversation effect triggered', { selectedConversationId, hasUser: !!user })
    
    if (!selectedConversationId || !user?.id) {
      console.log('🟠 [MessagesV2] Skipping load: no conversation or user')
      return;
    }

    const loadConversationMessages = async () => {
      console.log('🟠 [MessagesV2] Starting to load conversation...', { conversationId: selectedConversationId })
      
      // Optimistically set loading state
      setLoadingMessages(true);
      
      try {
        // Fetch conversation details and messages in parallel
        const [convData, messagesData] = await Promise.all([
          fetchConversationDetails(selectedConversationId),
          fetchMessages(selectedConversationId, 100)
        ]);
        
        console.log('🟠 [MessagesV2] Conversation data loaded', { 
          hasConversation: !!convData, 
          messageCount: messagesData.length 
        })
        
        if (!convData) throw new Error('Sohbet bulunamadı');
        
        // CRITICAL: Use React.startTransition to batch updates
        // This ensures all updates happen in ONE commit
        console.log('🟣 [MessagesV2] Starting transition for state updates...')
        
        // All these updates will be batched together
        setSelectedConversation(convData);
        setMessages(messagesData);
        setLoadingMessages(false);
        
        console.log('🟣 [MessagesV2] State updates complete')

        // Mark as read (non-blocking) and refresh counts
        markMessagesAsRead(selectedConversationId, user.id)
          .then(() => {
            console.log('✅ [MessagesV2] Messages marked as read')
            refreshUnreadCount();
          })
          .catch(() => {});
      } catch (err) {
        console.error('❌ [MessagesV2] Error loading conversation:', err);
        setLoadingMessages(false);
      }
      
      console.log('🟠 [MessagesV2] Loading complete')
    };

    loadConversationMessages();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedConversationId]);

  // Global message subscription (runs ONCE, listens to all conversations)
  useEffect(() => {
    if (!user?.id) return;
    
    // Subscribe to ALL messages for this user
    const channel = supabase
      .channel('user-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${user.id}`,
        },
        (payload) => {
          const newMsg = payload.new as any;
          
          // Only add message if it's for the currently selected conversation
          // Use ref to avoid re-subscribing on conversation change
          if (newMsg.conversation_id === selectedConvRef.current) {
            setMessages(prev => {
              if (prev.some(msg => msg.id === newMsg.id)) return prev;
              return [...prev, newMsg];
            });
            
            // Mark as read immediately
            markMessagesAsRead(newMsg.conversation_id, user.id).catch(() => {});
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
    // Only depend on user.id, NOT selectedConversationId
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user?.id || !selectedConversationId) return;

    try {
      setSending(true);
      const sentMessage = await sendMessage(selectedConversationId, user.id, newMessage.trim());
      
      if (sentMessage) {
        setMessages(prev => {
          if (prev.some(msg => msg.id === sentMessage.id)) return prev;
          return [...prev, sentMessage];
        });
        setNewMessage('');
        setTimeout(() => inputRef.current?.focus(), 0);
      }
    } catch (err) {
      console.error('Error sending message:', err);
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Memoize conversation selection handler
  const handleSelectConversation = useCallback((conversationId: string) => {
    console.log('🟢 [MessagesV2] Conversation clicked', {
      conversationId,
      currentSelectedId: selectedConversationId,
      isAlreadySelected: conversationId === selectedConversationId
    })
    setSelectedConversationId(conversationId)
  }, [selectedConversationId])

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
  };

  const getOtherUser = () => {
    if (!selectedConversation || !user?.id) return null;
    return selectedConversation.user1_id === user.id ? selectedConversation.user2 : selectedConversation.user1;
  };

  const otherUser = getOtherUser();

  if (loading || isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-white dark:bg-black">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
      </div>
    );
  }

  return (
    <MessagingErrorBoundary>
      <div className="fixed inset-0 flex bg-white dark:bg-black overflow-hidden z-[100]">
      {/* LEFT SIDEBAR - Conversations List */}
      <div className={`
        w-full md:w-96 border-r border-gray-200 dark:border-gray-800 flex flex-col
        ${selectedConversationId ? 'hidden md:flex' : 'flex'}
      `}>
        {/* Header */}
        <div className="border-b border-gray-200 dark:border-gray-800 p-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold">{user?.name || 'Mesajlar'}</h1>
            <div className="flex items-center gap-2">
              {/* Home Button */}
              <button 
                onClick={() => router.push('/')}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-900 rounded-full transition-colors"
                title="Ana Sayfa"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </button>
              
              {/* New Message Button */}
              <button 
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-900 rounded-full transition-colors"
                title="Yeni Mesaj"
              >
                <Edit className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 bg-gray-100 dark:bg-gray-800 border-0 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto">
          {filteredConversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
              <MessageCircle className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" />
              <p className="text-lg font-semibold mb-2">Henüz mesajınız yok</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {searchQuery ? 'Arama sonucu bulunamadı' : 'Yeni bir sohbet başlatın'}
              </p>
            </div>
          ) : (
            filteredConversations.map((conv) => {
              const isUnread = conv.lastMessage && !conv.lastMessage.is_read && conv.lastMessage.sender_id !== user?.id;
              const isSelected = conv.id === selectedConversationId;

              return (
                <div
                  key={conv.id}
                  onClick={() => handleSelectConversation(conv.id)}
                  className={`
                    flex items-center gap-3 p-4 cursor-pointer transition-colors
                    ${isSelected 
                      ? 'bg-gray-100 dark:bg-gray-900' 
                      : 'hover:bg-gray-50 dark:hover:bg-gray-900/50'
                    }
                  `}
                >
                  <div className="relative flex-shrink-0">
                    <Avatar className="w-14 h-14">
                      <AvatarImage src={conv.otherUser?.avatar_url || ''} alt={conv.otherUser?.name || 'User'} />
                      <AvatarFallback className="bg-gradient-to-br from-purple-400 to-pink-400 text-white text-lg">
                        {conv.otherUser?.name?.[0] || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    {isUnread && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-blue-500 rounded-full border-2 border-white dark:border-black"></div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-2 mb-0.5">
                      <p className={`text-sm truncate ${isUnread ? 'font-bold' : 'font-semibold'}`}>
                        {sanitizeText(conv.otherUser?.name) || 'Kullanıcı'}
                      </p>
                      {conv.lastMessage && (
                        <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
                          {formatMessageTime(conv.lastMessage.created_at)}
                        </span>
                      )}
                    </div>
                    
                    {/* Listing info with owner indicator */}
                    {conv.listing && (
                      <p className="text-xs truncate mb-1 flex items-center gap-1.5">
                        {/* Show badge only if other user is the listing owner */}
                        {conv.listing.user_id === conv.otherUser?.id && (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 flex-shrink-0">
                            <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                            </svg>
                            İlan Sahibi
                          </span>
                        )}
                        <span className="text-gray-600 dark:text-gray-400 truncate">
                          {sanitizeListingTitle(conv.listing.title)}
                        </span>
                      </p>
                    )}
                    
                    {conv.lastMessage && (
                      <p className={`
                        text-xs truncate
                        ${isUnread ? 'text-gray-900 dark:text-white font-medium' : 'text-gray-500 dark:text-gray-400'}
                      `}>
                        {conv.lastMessage.sender_id === user?.id && 'Siz: '}
                        {sanitizeText(conv.lastMessage.content)}
                      </p>
                    )}
                  </div>

                  {conv.unreadCount > 0 && (
                    <div className="bg-blue-500 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center flex-shrink-0">
                      {conv.unreadCount > 9 ? '9+' : conv.unreadCount}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* RIGHT PANEL - Chat Area */}
      <div className={`
        flex-1 flex flex-col h-screen
        ${selectedConversationId ? 'flex' : 'hidden md:flex'}
      `}>
        {!selectedConversationId ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-8 animate-fadeIn">
            <MessageCircle className="w-24 h-24 text-gray-300 dark:text-gray-600 mb-4" />
            <h2 className="text-2xl font-bold mb-2">Mesajlarınız</h2>
            <p className="text-gray-500 dark:text-gray-400">
              Bir sohbet seçin veya yeni bir sohbet başlatın
            </p>
          </div>
        ) : loadingMessages ? (
          <div className="flex items-center justify-center h-full animate-fadeIn">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
          </div>
        ) : (
          <div className="flex flex-col h-full animate-fadeIn">
            {/* Chat Header */}
            <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-black">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {/* Back Button - Mobile Only */}
                <button
                  onClick={() => setSelectedConversationId(null)}
                  className="md:hidden p-2 -ml-2 hover:bg-gray-100 dark:hover:bg-gray-900 rounded-full transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>

                <Avatar className="w-10 h-10">
                  <AvatarImage src={otherUser?.avatar_url || ''} alt={otherUser?.name} />
                  <AvatarFallback className="bg-gradient-to-br from-purple-400 to-pink-400 text-white">
                    {otherUser?.name?.[0] || 'U'}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{sanitizeText(otherUser?.name)}</p>
                  {selectedConversation?.listing && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {selectedConversation.listing.title}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* View Listing Button */}
                {selectedConversation?.listing && (
                  <button 
                    onClick={() => router.push(`/ilan/${selectedConversation.listing?.id}`)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-900 rounded-full transition-colors"
                    title="İlanı Görüntüle"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </button>
                )}
                
                {/* View Profile Button */}
                <button 
                  onClick={() => router.push(`/profil/${otherUser?.id}`)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-900 rounded-full transition-colors"
                  title="Profili Görüntüle"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </button>
                
                {/* More Options Button */}
                <button 
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-900 rounded-full transition-colors"
                  title="Daha Fazla"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Messages - Flex 1 for scrollable area */}
            <div className="flex-1 overflow-y-auto px-6 py-4" style={{ minHeight: 0 }}>
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <Avatar className="w-20 h-20 mb-4">
                    <AvatarImage src={otherUser?.avatar_url || ''} alt={otherUser?.name} />
                    <AvatarFallback className="bg-gradient-to-br from-purple-400 to-pink-400 text-white text-2xl">
                      {otherUser?.name?.[0] || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <p className="font-semibold mb-1">{sanitizeText(otherUser?.name)}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Sohbeti başlatmak için bir mesaj gönderin
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {messages.map((message, index) => {
                    const isOwnMessage = message.sender_id === user?.id;
                    const showAvatar = !isOwnMessage && (
                      index === messages.length - 1 || 
                      messages[index + 1]?.sender_id !== message.sender_id
                    );
                    const showTime = index === messages.length - 1 || 
                      messages[index + 1]?.sender_id !== message.sender_id;

                    return (
                      <div
                        key={message.id}
                        className={`flex items-end gap-2 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                      >
                        {!isOwnMessage && (
                          <div className="w-6 h-6 mb-1">
                            {showAvatar && (
                              <Avatar className="w-6 h-6">
                                <AvatarImage src={otherUser?.avatar_url || ''} alt={otherUser?.name} />
                                <AvatarFallback className="bg-gradient-to-br from-purple-400 to-pink-400 text-white text-xs">
                                  {otherUser?.name?.[0] || 'U'}
                                </AvatarFallback>
                              </Avatar>
                            )}
                          </div>
                        )}

                        <div className="flex flex-col max-w-[70%]">
                          <div className={`
                            px-4 py-2.5 rounded-3xl break-words
                            ${isOwnMessage 
                              ? 'bg-blue-500 text-white rounded-br-md' 
                              : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-bl-md'
                            }
                          `}>
                            <p className="text-sm leading-relaxed whitespace-pre-wrap">
                              {sanitizeText(message.content)}
                            </p>
                          </div>
                          
                          {showTime && (
                            <p className={`
                              text-xs text-gray-400 mt-1 px-2
                              ${isOwnMessage ? 'text-right' : 'text-left'}
                            `}>
                              {formatMessageTime(message.created_at)}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="flex-shrink-0 border-t border-gray-200 dark:border-gray-800 px-6 py-3 bg-white dark:bg-black">
              <div className="flex items-center gap-3">
                <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-900 rounded-full transition-colors flex-shrink-0">
                  <Smile className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                </button>

                <div className="flex-1 relative">
                  <input
                    ref={inputRef}
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Mesaj gönder..."
                    disabled={sending}
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
                      disabled={sending}
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

                {!newMessage.trim() && (
                  <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-900 rounded-full transition-colors flex-shrink-0">
                    <MoreVertical className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
    </MessagingErrorBoundary>
  );
}
