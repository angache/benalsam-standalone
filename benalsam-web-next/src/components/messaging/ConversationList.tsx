'use client';

import { memo } from 'react';
import { MessageCircle, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { sanitizeText, sanitizeListingTitle } from '@/utils/sanitize';

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

interface ConversationListProps {
  conversations: ConversationPreview[];
  selectedConversationId: string | null;
  searchQuery: string;
  currentUserId: string;
  onSearchChange: (query: string) => void;
  onConversationSelect: (conversationId: string) => void;
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

export const ConversationList = memo(function ConversationList({
  conversations,
  selectedConversationId,
  searchQuery,
  currentUserId,
  onSearchChange,
  onConversationSelect,
}: ConversationListProps) {
  console.log('🟦 [ConversationList] Rendering', { count: conversations.length, selectedConversationId });

  return (
    <div className="w-full md:w-96 flex-shrink-0 border-r border-gray-200 dark:border-gray-800 flex flex-col h-screen bg-white dark:bg-black">
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b border-gray-200 dark:border-gray-800">
        <h1 className="text-2xl font-bold mb-4">Mesajlar</h1>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            type="text"
            placeholder="Ara..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 bg-gray-100 dark:bg-gray-800 border-0 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        {conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <MessageCircle className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" />
            <p className="text-lg font-semibold mb-2">Henüz mesajınız yok</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {searchQuery ? 'Arama sonucu bulunamadı' : 'Yeni bir sohbet başlatın'}
            </p>
          </div>
        ) : (
          conversations.map((conv) => {
            const isUnread = conv.lastMessage && !conv.lastMessage.is_read && conv.lastMessage.sender_id !== currentUserId;
            const isSelected = conv.id === selectedConversationId;

            return (
              <div
                key={conv.id}
                onClick={() => onConversationSelect(conv.id)}
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
                    <AvatarImage src={conv.otherUser?.avatar_url || undefined} alt={conv.otherUser?.name || 'User'} />
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
                      {conv.lastMessage.sender_id === currentUserId && 'Siz: '}
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
  );
});

