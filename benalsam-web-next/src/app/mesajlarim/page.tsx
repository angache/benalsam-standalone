'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { MessageCircle, Search, ChevronRight, Clock, AlertCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

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

export default function MessagesPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [conversations, setConversations] = useState<ConversationPreview[]>([]);
  const [filteredConversations, setFilteredConversations] = useState<ConversationPreview[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session?.user?.id) return;

    const fetchConversations = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/messages?userId=${session.user.id}`);
        if (!response.ok) {
          throw new Error('Mesajlar yüklenemedi');
        }

        const { data } = await response.json();
        setConversations(data || []);
        setFilteredConversations(data || []);
      } catch (err) {
        console.error('Error fetching conversations:', err);
        setError(err instanceof Error ? err.message : 'Bir hata oluştu');
      } finally {
        setLoading(false);
      }
    };

    fetchConversations();
  }, [session?.user?.id]);

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

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Şimdi';
    if (diffMins < 60) return `${diffMins}d`;
    if (diffHours < 24) return `${diffHours}s`;
    if (diffDays < 7) return `${diffDays}g`;

    return date.toLocaleDateString('tr-TR', { month: 'short', day: 'numeric' });
  };

  const handleConversationClick = (conversationId: string) => {
    router.push(`/mesajlarim/${conversationId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-800">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Mesajlarım</h1>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
            <Input
              type="text"
              placeholder="Kişi veya ilan adıyla ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-10 bg-slate-100 dark:bg-slate-700 border-0 text-sm"
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {error && (
          <Card className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <p className="text-red-700 dark:text-red-400">{error}</p>
            </div>
          </Card>
        )}

        {filteredConversations.length === 0 ? (
          <Card className="p-12 text-center">
            <MessageCircle className="w-16 h-16 mx-auto mb-4 text-slate-300 dark:text-slate-600" />
            <p className="text-xl font-semibold text-slate-600 dark:text-slate-400 mb-2">
              {searchQuery ? 'Sonuç bulunamadı' : 'Henüz mesajınız yok'}
            </p>
            <p className="text-slate-500 dark:text-slate-500">
              {searchQuery ? 'Farklı arama terimleri deneyin' : 'İlan sahibi ile iletişime geçin'}
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredConversations.map((conversation) => {
              const isUnread = conversation.unreadCount > 0;
              const isLastMessageFromOther = conversation.lastMessage?.sender_id !== session?.user?.id;

              return (
                <Card
                  key={conversation.id}
                  className={`p-4 cursor-pointer transition-all hover:shadow-md ${
                    isUnread
                      ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-700/50'
                  }`}
                  onClick={() => handleConversationClick(conversation.id)}
                >
                  <div className="flex items-center justify-between">
                    {/* Left: Avatar + Info */}
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      <Avatar className="w-12 h-12 flex-shrink-0">
                        <AvatarImage
                          src={conversation.otherUser?.avatar_url || ''}
                          alt={conversation.otherUser?.name || 'User'}
                        />
                        <AvatarFallback>{conversation.otherUser?.name?.[0] || 'U'}</AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        {/* Name + Time */}
                        <div className="flex items-center justify-between mb-2 gap-2">
                          <p className={`font-semibold truncate ${isUnread ? 'text-blue-900 dark:text-blue-100' : 'text-slate-900 dark:text-white'}`}>
                            {conversation.otherUser?.name || 'Bilinmeyen Kullanıcı'}
                          </p>
                          <span className={`text-xs flex-shrink-0 ${isUnread ? 'text-blue-700 dark:text-blue-300' : 'text-slate-500 dark:text-slate-400'}`}>
                            <Clock className="w-3 h-3 inline mr-1" />
                            {formatTime(conversation.updated_at)}
                          </span>
                        </div>

                        {/* Listing + Message Preview */}
                        {conversation.listing && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 mb-1 truncate">
                            {conversation.listing.title}
                          </p>
                        )}
                        <p className={`text-sm truncate ${isUnread ? 'font-medium text-slate-800 dark:text-slate-200' : 'text-slate-600 dark:text-slate-400'}`}>
                          {conversation.lastMessage
                            ? `${isLastMessageFromOther ? '' : 'Siz: '}${conversation.lastMessage.content}`
                            : 'Sohbet başlatıldı'}
                        </p>
                      </div>
                    </div>

                    {/* Right: Unread Badge + Arrow */}
                    <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                      {isUnread && (
                        <div className="w-3 h-3 rounded-full bg-blue-500 dark:bg-blue-400" />
                      )}
                      <ChevronRight className="w-5 h-5 text-slate-400 dark:text-slate-500" />
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
