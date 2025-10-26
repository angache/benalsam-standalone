'use client';

import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { MessageCircle, Search, Edit, Send, Phone, Video, Info, Smile, MoreVertical } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
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
  const { user, isLoading } = useAuth();
  const [conversations, setConversations] = useState<ConversationPreview[]>([]);
  const [filteredConversations, setFilteredConversations] = useState<ConversationPreview[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Selected conversation state
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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
        console.log('👁️ [MessagesV2] Page became visible, refreshing messages...');
        
        // Refresh messages when tab becomes active again
        fetchMessages(selectedConversationId, 100)
          .then(messagesData => {
            setMessages(messagesData);
            console.log('✅ [MessagesV2] Messages refreshed on visibility change');
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
    console.log('🔄 [MessagesV2] Conversations list useEffect triggered', {
      hasUser: !!user,
      userId: user?.id,
      timestamp: new Date().toISOString()
    });

    if (!user?.id) {
      console.log('⚠️ [MessagesV2] Skipping conversations - no user');
      return;
    }

    const fetchConversationsList = async () => {
      try {
        console.log('📞 [MessagesV2] Fetching conversations list...');
        setLoading(true);
        const response = await fetch(`/api/messages?userId=${user.id}`);
        if (!response.ok) throw new Error('Mesajlar yüklenemedi');

        const { data } = await response.json();
        console.log('✅ [MessagesV2] Conversations loaded:', { count: data?.length || 0 });
        setConversations(data || []);
        setFilteredConversations(data || []);
      } catch (err) {
        console.error('❌ [MessagesV2] Error fetching conversations:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchConversationsList();
  }, [user?.id]);

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

  // Load selected conversation messages
  useEffect(() => {
    console.log('🔄 [MessagesV2] useEffect triggered', {
      selectedConversationId,
      hasUser: !!user,
      userId: user?.id,
      timestamp: new Date().toISOString()
    });

    if (!selectedConversationId || !user?.id) {
      console.log('⚠️ [MessagesV2] Skipping - no conversation or user');
      return;
    }

    console.log('⏱️ [MessagesV2] Starting conversation load...', { conversationId: selectedConversationId });

    const loadConversationMessages = async () => {
      try {
        setLoadingMessages(true);
        const totalStart = performance.now();

        console.log('📞 [MessagesV2] Fetching conversation & messages in parallel...');
        
        // Fetch conversation details and messages in parallel
        const [convData, messagesData] = await Promise.all([
          fetchConversationDetails(selectedConversationId),
          fetchMessages(selectedConversationId, 100)
        ]);

        console.log(`✅ [MessagesV2] Parallel fetch completed in ${(performance.now() - totalStart).toFixed(0)}ms`, {
          hasConversation: !!convData,
          messageCount: messagesData.length
        });
        
        if (!convData) throw new Error('Sohbet bulunamadı');
        setSelectedConversation(convData);
        setMessages(messagesData);

        // Mark as read (non-blocking)
        console.log('📞 [MessagesV2] Marking messages as read...');
        markMessagesAsRead(selectedConversationId, user.id).catch((err) => {
          console.error('⚠️ [MessagesV2] Mark as read failed:', err);
        });
      } catch (err) {
        console.error('❌ [MessagesV2] Error loading conversation:', err);
      } finally {
        setLoadingMessages(false);
        console.log('✅ [MessagesV2] Loading complete');
      }
    };

    loadConversationMessages();

    // Subscribe to new messages
    console.log('📡 [MessagesV2] Setting up realtime subscription...');
    const channel = subscribeToMessages(selectedConversationId, (newMsg) => {
      console.log('📨 [MessagesV2] New message received:', {
        messageId: newMsg.id,
        senderId: newMsg.sender_id,
        isOwnMessage: newMsg.sender_id === user.id
      });
      
      setMessages(prev => {
        if (prev.some(msg => msg.id === newMsg.id)) {
          console.log('⚠️ [MessagesV2] Duplicate message, skipping');
          return prev;
        }
        return [...prev, newMsg];
      });
      
      if (newMsg.sender_id !== user.id) {
        console.log('📞 [MessagesV2] Marking new message as read...');
        markMessagesAsRead(selectedConversationId, user.id).catch(() => {});
      }
    });

    return () => {
      console.log('🔌 [MessagesV2] Cleaning up - unsubscribing from realtime');
      if (channel) channel.unsubscribe();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedConversationId]);

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
    <div className="h-screen flex bg-white dark:bg-black">
      {/* LEFT SIDEBAR - Conversations List */}
      <div className={`
        w-full md:w-96 border-r border-gray-200 dark:border-gray-800 flex flex-col
        ${selectedConversationId ? 'hidden md:flex' : 'flex'}
      `}>
        {/* Header */}
        <div className="border-b border-gray-200 dark:border-gray-800 p-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold">{user?.name || 'Mesajlar'}</h1>
            <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-900 rounded-full transition-colors">
              <Edit className="w-6 h-6" />
            </button>
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
                  onClick={() => setSelectedConversationId(conv.id)}
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
                        {conv.otherUser?.name || 'Kullanıcı'}
                      </p>
                      {conv.lastMessage && (
                        <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
                          {formatMessageTime(conv.lastMessage.created_at)}
                        </span>
                      )}
                    </div>
                    
                    {/* Listing info with role indicator */}
                    {conv.listing && (
                      <p className="text-xs truncate mb-1 flex items-center gap-1.5">
                        {/* Role badge */}
                        {conv.listing.user_id === user?.id ? (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 flex-shrink-0">
                            <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z"/>
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd"/>
                            </svg>
                            Satıcı
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 flex-shrink-0">
                            <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 2a4 4 0 00-4 4v1H5a1 1 0 00-.994.89l-1 9A1 1 0 004 18h12a1 1 0 00.994-1.11l-1-9A1 1 0 0015 7h-1V6a4 4 0 00-4-4zm2 5V6a2 2 0 10-4 0v1h4zm-6 3a1 1 0 112 0 1 1 0 01-2 0zm7-1a1 1 0 100 2 1 1 0 000-2z" clipRule="evenodd"/>
                            </svg>
                            Alıcı
                          </span>
                        )}
                        <span className="text-gray-600 dark:text-gray-400 truncate">
                          {conv.listing.title}
                        </span>
                      </p>
                    )}
                    
                    {conv.lastMessage && (
                      <p className={`
                        text-xs truncate
                        ${isUnread ? 'text-gray-900 dark:text-white font-medium' : 'text-gray-500 dark:text-gray-400'}
                      `}>
                        {conv.lastMessage.sender_id === user?.id && 'Siz: '}
                        {conv.lastMessage.content}
                      </p>
                    )}
                  </div>

                  {isUnread && <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* RIGHT PANEL - Chat Area */}
      <div className={`
        flex-1 flex-col
        ${selectedConversationId ? 'flex' : 'hidden md:flex'}
      `}>
        {!selectedConversationId ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <MessageCircle className="w-24 h-24 text-gray-300 dark:text-gray-600 mb-4" />
            <h2 className="text-2xl font-bold mb-2">Mesajlarınız</h2>
            <p className="text-gray-500 dark:text-gray-400">
              Bir sohbet seçin veya yeni bir sohbet başlatın
            </p>
          </div>
        ) : loadingMessages ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
          </div>
        ) : (
          <>
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
                  <p className="font-semibold text-sm truncate">{otherUser?.name}</p>
                  {selectedConversation?.listing && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {selectedConversation.listing.title}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-900 rounded-full transition-colors">
                  <Phone className="w-5 h-5" />
                </button>
                <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-900 rounded-full transition-colors">
                  <Video className="w-5 h-5" />
                </button>
                <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-900 rounded-full transition-colors">
                  <Info className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <Avatar className="w-20 h-20 mb-4">
                    <AvatarImage src={otherUser?.avatar_url || ''} alt={otherUser?.name} />
                    <AvatarFallback className="bg-gradient-to-br from-purple-400 to-pink-400 text-white text-2xl">
                      {otherUser?.name?.[0] || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <p className="font-semibold mb-1">{otherUser?.name}</p>
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
                              {message.content}
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
          </>
        )}
      </div>
    </div>
  );
}
