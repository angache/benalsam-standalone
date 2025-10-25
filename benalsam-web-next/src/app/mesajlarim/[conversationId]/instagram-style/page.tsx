'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { ArrowLeft, Send, Phone, Video, Info, MoreVertical, Smile } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { 
  fetchMessages, 
  sendMessage, 
  subscribeToMessages, 
  markMessagesAsRead,
  fetchConversationDetails 
} from '@/services/conversationService';
import { Conversation, Message } from 'benalsam-shared-types';

export default function InstagramStyleMessagePage() {
  const router = useRouter();
  const params = useParams();
  const { user, isLoading } = useAuth();
  const conversationId = params.conversationId as string;
  
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (!loading && inputRef.current) {
      inputRef.current.focus();
    }
  }, [loading, sending]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fetch conversation and messages
  useEffect(() => {
    if (!user?.id || !conversationId || isLoading) {
      return;
    }

    const loadConversation = async () => {
      try {
        setLoading(true);

        const convData = await fetchConversationDetails(conversationId);
        if (!convData) {
          throw new Error('Sohbet bulunamadı');
        }
        setConversation(convData);

        const messagesData = await fetchMessages(conversationId, 100);
        setMessages(messagesData);

        // Mark as read (non-blocking)
        markMessagesAsRead(conversationId, user.id).catch(() => {});
      } catch (err) {
        console.error('Error loading conversation:', err);
      } finally {
        setLoading(false);
      }
    };

    loadConversation();

    // Subscribe to new messages
    const channel = subscribeToMessages(conversationId, (newMsg) => {
      setMessages(prev => {
        if (prev.some(msg => msg.id === newMsg.id)) {
          return prev;
        }
        return [...prev, newMsg];
      });
      if (newMsg.sender_id !== user.id) {
        markMessagesAsRead(conversationId, user.id).catch(() => {});
      }
    });

    return () => {
      if (channel) {
        channel.unsubscribe();
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId, isLoading]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user?.id) return;

    try {
      setSending(true);
      const sentMessage = await sendMessage(conversationId, user.id, newMessage.trim());
      
      if (sentMessage) {
        setMessages(prev => {
          if (prev.some(msg => msg.id === sentMessage.id)) {
            return prev;
          }
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

  const getOtherUser = () => {
    if (!conversation || !user?.id) return null;
    return conversation.user1_id === user.id ? conversation.user2 : conversation.user1;
  };

  const otherUser = getOtherUser();

  if (loading || !conversation || !otherUser) {
    return (
      <div className="h-screen flex items-center justify-center bg-white dark:bg-black">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
      </div>
    );
  }

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
  };

  return (
    <div className="h-screen flex flex-col bg-white dark:bg-black">
      {/* Instagram-Style Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-900 rounded-full transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          
          <Avatar className="w-10 h-10">
            <AvatarImage src={otherUser.avatar_url || ''} alt={otherUser.name} />
            <AvatarFallback className="bg-gradient-to-br from-purple-400 to-pink-400 text-white">
              {otherUser.name?.[0] || 'U'}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm truncate">{otherUser.name}</p>
            {conversation.listing && (
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {conversation.listing.title}
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

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="max-w-3xl mx-auto">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-16">
              <Avatar className="w-20 h-20 mb-4">
                <AvatarImage src={otherUser.avatar_url || ''} alt={otherUser.name} />
                <AvatarFallback className="bg-gradient-to-br from-purple-400 to-pink-400 text-white text-2xl">
                  {otherUser.name?.[0] || 'U'}
                </AvatarFallback>
              </Avatar>
              <p className="font-semibold mb-1">{otherUser.name}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                Instagram · {otherUser.name}
              </p>
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
                    className={`flex items-end gap-2 ${isOwnMessage ? 'justify-end' : 'justify-start'} group`}
                  >
                    {/* Avatar (only for other user's last message in group) */}
                    {!isOwnMessage && (
                      <div className="w-6 h-6 mb-1">
                        {showAvatar && (
                          <Avatar className="w-6 h-6">
                            <AvatarImage src={otherUser.avatar_url || ''} alt={otherUser.name} />
                            <AvatarFallback className="bg-gradient-to-br from-purple-400 to-pink-400 text-white text-xs">
                              {otherUser.name?.[0] || 'U'}
                            </AvatarFallback>
                          </Avatar>
                        )}
                      </div>
                    )}

                    {/* Message Bubble */}
                    <div className="flex flex-col max-w-[70%]">
                      <div
                        className={`
                          px-4 py-2.5 rounded-3xl break-words
                          ${isOwnMessage 
                            ? 'bg-blue-500 text-white rounded-br-md' 
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-bl-md'
                          }
                        `}
                      >
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">
                          {message.content}
                        </p>
                      </div>
                      
                      {/* Time (shows on hover or for last message) */}
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
      </div>

      {/* Instagram-Style Input Area */}
      <div className="border-t border-gray-200 dark:border-gray-800 px-4 py-3">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-3">
            {/* Emoji Button */}
            <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-900 rounded-full transition-colors flex-shrink-0">
              <Smile className="w-6 h-6 text-gray-600 dark:text-gray-400" />
            </button>

            {/* Input Field */}
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
                  rounded-full
                  text-sm
                  placeholder:text-gray-500 dark:placeholder:text-gray-400
                  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                  disabled:opacity-50 disabled:cursor-not-allowed
                  transition-all
                "
              />
              
              {/* Send Button (shows when typing) */}
              {newMessage.trim() && (
                <button
                  onClick={handleSendMessage}
                  disabled={sending}
                  className="
                    absolute right-2 top-1/2 -translate-y-1/2
                    p-2
                    text-blue-500 hover:text-blue-600
                    disabled:text-blue-300 disabled:cursor-not-allowed
                    transition-colors
                  "
                >
                  <Send className="w-5 h-5" fill="currentColor" />
                </button>
              )}
            </div>

            {/* More Options */}
            {!newMessage.trim() && (
              <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-900 rounded-full transition-colors flex-shrink-0">
                <MoreVertical className="w-6 h-6 text-gray-600 dark:text-gray-400" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

