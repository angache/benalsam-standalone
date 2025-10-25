'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { ChevronLeft, Send, AlertCircle, MessageCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { 
  fetchMessages, 
  sendMessage, 
  subscribeToMessages, 
  markMessagesAsRead,
  fetchConversationDetails 
} from '@/services/conversationService';
import { Conversation, Message } from 'benalsam-shared-types';

export default function MessageThreadPage() {
  const router = useRouter();
  const params = useParams();
  const { data: session } = useSession();
  const conversationId = params.conversationId as string;
  
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages update
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fetch conversation and messages
  useEffect(() => {
    if (!session?.user?.id || !conversationId) return;

    const loadConversation = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch conversation details
        const convData = await fetchConversationDetails(conversationId);
        if (!convData) {
          throw new Error('Sohbet bulunamadı');
        }
        setConversation(convData);

        // Fetch messages
        const messagesData = await fetchMessages(conversationId, 100);
        setMessages(messagesData);

        // Mark messages as read
        await markMessagesAsRead(conversationId, session.user.id);
      } catch (err) {
        console.error('Error loading conversation:', err);
        setError(err instanceof Error ? err.message : 'Sohbet yüklenemedi');
      } finally {
        setLoading(false);
      }
    };

    loadConversation();

    // Subscribe to new messages
    const channel = subscribeToMessages(conversationId, (newMsg) => {
      setMessages(prev => [...prev, newMsg]);
      // Mark as read if it's from other user
      if (newMsg.sender_id !== session.user.id) {
        markMessagesAsRead(conversationId, session.user.id);
      }
    });

    return () => {
      if (channel) {
        channel.unsubscribe();
      }
    };
  }, [conversationId, session?.user?.id]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !session?.user?.id) return;

    try {
      setSending(true);
      const sentMessage = await sendMessage(conversationId, session.user.id, newMessage.trim());
      
      if (sentMessage) {
        setMessages(prev => [...prev, sentMessage]);
        setNewMessage('');
      }
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Mesaj gönderilemedi');
    } finally {
      setSending(false);
    }
  };

  const getOtherUser = () => {
    if (!conversation || !session?.user?.id) return null;
    return conversation.user1_id === session.user.id ? conversation.user2 : conversation.user1;
  };

  const otherUser = getOtherUser();

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-800">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-500" />
          <p className="text-slate-600 dark:text-slate-400">Sohbet yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (!conversation || !otherUser) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-800">
        <Card className="p-8 text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Sohbet Bulunamadı</h2>
          <p className="text-slate-600 dark:text-slate-400 mb-6">Bu sohbet silinmiş olabilir veya artık erişilemiyor.</p>
          <Button onClick={() => router.push('/mesajlarim')} className="w-full">
            Mesajlara Dön
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.back()}
              className="text-slate-600 dark:text-slate-400"
            >
              <ChevronLeft className="w-6 h-6" />
            </Button>
            <div className="flex items-center gap-3">
              <Avatar className="w-10 h-10">
                <AvatarImage src={otherUser.avatar_url || ''} alt={otherUser.name} />
                <AvatarFallback>{otherUser.name?.[0] || 'U'}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="font-semibold text-slate-900 dark:text-white truncate">{otherUser.name}</p>
                {conversation.listing && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    {conversation.listing.title}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-3xl mx-auto space-y-4">
          {error && (
            <Card className="p-4 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-500" />
                <p className="text-red-700 dark:text-red-400 text-sm">{error}</p>
              </div>
            </Card>
          )}

          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <MessageCircle className="w-16 h-16 text-slate-300 dark:text-slate-600 mb-4" />
              <p className="text-slate-600 dark:text-slate-400 mb-2">Henüz mesaj yok</p>
              <p className="text-sm text-slate-500 dark:text-slate-500">
                Sohbeti başlatmak için bir mesaj yazın
              </p>
            </div>
          ) : (
            messages.map((message, index) => {
              const isOwnMessage = message.sender_id === session?.user?.id;
              const showAvatar =
                index === messages.length - 1 ||
                messages[index + 1]?.sender_id !== message.sender_id;

              return (
                <div
                  key={message.id}
                  className={`flex gap-3 ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  {showAvatar ? (
                    <Avatar className="w-8 h-8 flex-shrink-0">
                      <AvatarImage src={message.sender?.avatar_url || ''} alt="" />
                      <AvatarFallback>{message.sender?.name?.[0] || 'U'}</AvatarFallback>
                    </Avatar>
                  ) : (
                    <div className="w-8 h-8 flex-shrink-0" />
                  )}

                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      isOwnMessage
                        ? 'bg-blue-500 text-white rounded-br-none'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white rounded-bl-none'
                    }`}
                  >
                    <p className="text-sm break-words">{message.content}</p>
                    <p className={`text-xs mt-1 ${isOwnMessage ? 'text-blue-100' : 'text-slate-500 dark:text-slate-400'}`}>
                      {new Date(message.created_at).toLocaleTimeString('tr-TR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Message Input */}
      <div className="sticky bottom-0 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex gap-3">
            <Input
              type="text"
              placeholder="Mesaj yaz..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              disabled={sending}
              className="flex-1"
            />
            <Button
              onClick={handleSendMessage}
              disabled={!newMessage.trim() || sending}
              size="icon"
              className="text-white"
              style={{ backgroundColor: sending ? '#999' : 'var(--primary)' }}
            >
              {sending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
