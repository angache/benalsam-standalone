import React, { useState, useEffect, useMemo, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MessageSquare, Loader2, Search, ArrowLeft } from 'lucide-react';
import { getUserConversations, getUnreadMessageCounts } from '@/services/conversationService';
import { useAuthStore } from '@/stores';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { toast } from '@/components/ui/use-toast';
import { formatDate } from 'benalsam-shared-types';


const ConversationCard = memo(({ conversation, currentUser, onClick, unreadCount }) => {
  const otherUser = conversation.user1_id === currentUser.id ? conversation.user2 : conversation.user1;
  const lastMessage = conversation.last_message;

  const isUnread = unreadCount > 0;

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="flex items-center p-3 space-x-4 rounded-lg cursor-pointer transition-colors duration-200 bg-card hover:bg-card/80 border border-border"
      onClick={onClick}
    >
      <div className="relative">
        <Avatar className="w-12 h-12 border-2 border-primary/30">
          <AvatarImage src={otherUser?.avatar_url} alt={otherUser?.name || 'Kullanıcı'} />
          <AvatarFallback>{otherUser?.name?.charAt(0).toUpperCase() || '?'}</AvatarFallback>
        </Avatar>
        {isUnread && (
          <Badge className="absolute -top-1 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs p-0">
            {unreadCount > 9 ? '9+' : unreadCount}
          </Badge>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-center">
          <p className={cn("font-semibold text-sm truncate", isUnread ? "text-primary" : "text-foreground")}>{otherUser?.name || 'Bilinmeyen Kullanıcı'}</p>
          <p className="text-xs text-muted-foreground">{formatDate(lastMessage?.created_at || conversation.updated_at)}</p>
        </div>
        <p className="text-xs text-muted-foreground truncate mb-1">
          {conversation.listing?.title || 'İlan bilgisi yok'}
        </p>
        <p className={cn("text-xs truncate", isUnread ? "text-foreground font-medium" : "text-muted-foreground")}>
          {lastMessage ? (
            <>
              {lastMessage.sender_id === currentUser.id && 'Siz: '}
              {lastMessage.content}
            </>
          ) : 'Sohbeti başlat...'}
        </p>
      </div>
    </motion.div>
  );
});


const ConversationsListPage = () => {
  const [conversations, setConversations] = useState([]);
  const [unreadCounts, setUnreadCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isInitialized, setIsInitialized] = useState(false);
  const { currentUser } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (currentUser?.id && !isInitialized) {
      const fetchConversations = async () => {
        try {
          setLoading(true);
          const [convData, countsData] = await Promise.all([
            getUserConversations(currentUser.id),
            getUnreadMessageCounts(currentUser.id)
          ]);

          if (convData) {
            setConversations(convData);
          } else {
            toast({
              title: "Sohbetler Yüklenemedi",
              description: "Sohbetlerinizi alırken bir sorun oluştu. Lütfen tekrar deneyin.",
              variant: "destructive",
            });
          }
          setUnreadCounts(countsData || {});
          setIsInitialized(true);
        } catch (error) {
          console.error('Conversation fetch error:', error);
          toast({
            title: "Hata",
            description: "Sohbetler yüklenirken beklenmedik bir hata oluştu.",
            variant: "destructive",
          });
        } finally {
          setLoading(false);
        }
      };
      fetchConversations();
    } else if (!currentUser?.id) {
      setLoading(false);
    }
  }, [currentUser?.id, isInitialized]);

  const filteredConversations = useMemo(() => {
    if (!currentUser?.id || !searchTerm.trim()) {
      return conversations;
    }
    
    const lowerSearchTerm = searchTerm.toLowerCase();
    return conversations.filter(conv => {
      const otherUser = conv.user1_id === currentUser.id ? conv.user2 : conv.user1;
      const listingTitle = conv.listing?.title || '';
      const lastMessageContent = conv.last_message?.content || '';

      return (
        otherUser?.name?.toLowerCase().includes(lowerSearchTerm) ||
        listingTitle.toLowerCase().includes(lowerSearchTerm) ||
        lastMessageContent.toLowerCase().includes(lowerSearchTerm)
      );
    });
  }, [conversations, searchTerm, currentUser?.id]);
  
  const handleGoBack = () => {
    navigate(-1);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="mx-auto w-full max-w-[1600px] 2xl:max-w-[1920px] px-1 sm:px-2 lg:px-4 xl:px-6 py-8"
    >
      <div className="flex items-center mb-6">
        <Button variant="ghost" size="icon" onClick={handleGoBack} className="mr-4 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-2xl font-bold text-gradient flex items-center">
          <MessageSquare className="mr-3 w-7 h-7" />
          Mesajlarım
        </h1>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Sohbetlerde ara..."
          className="pl-10 pr-4 py-2 w-full bg-input border-border"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <span className="ml-3 text-muted-foreground">Sohbetler yükleniyor...</span>
        </div>
      ) : filteredConversations.length > 0 ? (
        <div className="space-y-3">
          {filteredConversations.map(conv => (
            <ConversationCard 
              key={conv.id}
              conversation={conv} 
              currentUser={currentUser}
              unreadCount={unreadCounts[conv.id] || 0}
              onClick={() => navigate(`/mesajlar/${conv.id}`)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <MessageSquare className="mx-auto w-16 h-16 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-semibold text-foreground">Henüz hiç sohbetiniz yok</h3>
          <p className="text-sm text-muted-foreground mt-2">
            Bir ilana teklif yaptığınızda veya teklif aldığınızda sohbetleriniz burada görünecektir.
          </p>
          <Button onClick={() => navigate('/')} className="mt-6">İlanlara Göz At</Button>
        </div>
      )}
    </motion.div>
  );
};

export default memo(ConversationsListPage);