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

  // Fetch conversations list
  useEffect(() => {
    if (!user?.id) return;

    const fetchConversationsList = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/messages?userId=${user.id}`);
        if (!response.ok) throw new Error('Mesajlar yüklenemedi');

        const { data } = await response.json();
        setConversations(data || []);
        setFilteredConversations(data || []);
      } catch (err) {
        console.error('Error fetching conversations:', err);
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
    if (!selectedConversationId || !user?.id) return;

    const loadConversationMessages = async () => {
      try {
        setLoadingMessages(true);

        const convData = await fetchConversationDetails(selectedConversationId);
        if (!convData) throw new Error('Sohbet bulunamadı');
        setSelectedConversation(convData);

        const messagesData = await fetchMessages(selectedConversationId, 100);
        setMessages(messagesData);

        markMessagesAsRead(selectedConversationId, user.id).catch(() => {});
      } catch (err) {
        console.error('Error loading conversation:', err);
      } finally {
        setLoadingMessages(false);
      }
    };

    loadConversationMessages();

    // Subscribe to new messages
    const channel = subscribeToMessages(selectedConversationId, (newMsg) => {
      setMessages(prev => {
        if (prev.some(msg => msg.id === newMsg.id)) return prev;
        return [...prev, newMsg];
      });
      if (newMsg.sender_id !== user.id) {
        markMessagesAsRead(selectedConversationId, user.id).catch(() => {});
      }
    });

    return () => {
      if (channel) channel.unsubscribe();
    };
  }, [selectedConversationId, user?.id]);

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
      <div className="w-full md:w-96 border-r border-gray-200 dark:border-gray-800 flex flex-col">
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
                    <div className="flex items-baseline justify-between gap-2 mb-1">
                      <p className={`text-sm truncate ${isUnread ? 'font-bold' : 'font-normal'}`}>
                        {conv.otherUser?.name || 'Kullanıcı'}
                      </p>
                      {conv.lastMessage && (
                        <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
                          {formatMessageTime(conv.lastMessage.created_at)}
                        </span>
                      )}
                    </div>
                    
                    {conv.lastMessage && (
                      <p className={`
                        text-sm truncate
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
      <div className="hidden md:flex flex-1 flex-col">
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
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800">
              <div className="flex items-center gap-3 flex-1 min-w-0">
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
            <div className="border-t border-gray-200 dark:border-gray-800 px-6 py-3">
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
