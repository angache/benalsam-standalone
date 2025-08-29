import React, { useState, useEffect, useMemo, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MessageSquare, Loader2, Search, ArrowLeft, MessageCircle, Users } from 'lucide-react';
import { getUserConversations, getUnreadMessageCounts } from '@/services/conversationService';
import { useAuthStore } from '@/stores';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { toast } from '@/components/ui/use-toast';
import { formatDate } from 'benalsam-shared-types';


const ConversationCard = memo(({ conversation, currentUser, onClick, unreadCount }) => {
  const otherUser = conversation.user1_id === currentUser.id ? conversation.user2 : conversation.user1;
  const lastMessage = conversation.last_message;

  const isUnread = unreadCount > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ 
        scale: 1.02,
        y: -2,
        transition: { duration: 0.2 }
      }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.3 }}
    >
      <Card 
        className="cursor-pointer transition-all duration-200 hover:shadow-md border-0 shadow-sm"
        onClick={onClick}
      >
        <CardContent className="p-4">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Avatar className="w-12 h-12 border-2 border-primary/30">
                <AvatarImage src={otherUser?.avatar_url} alt={otherUser?.name || 'Kullanıcı'} />
                <AvatarFallback>{otherUser?.name?.charAt(0).toUpperCase() || '?'}</AvatarFallback>
              </Avatar>
              {isUnread && (
                <Badge className="absolute -top-1 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs p-0 animate-pulse">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </Badge>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-center">
                <p className={cn("font-semibold text-sm truncate", isUnread ? "text-primary" : "text-foreground")}>
                  {otherUser?.name || 'Bilinmeyen Kullanıcı'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatDate(lastMessage?.created_at || conversation.updated_at)}
                </p>
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
          </div>
        </CardContent>
      </Card>
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
      <motion.div 
        className="flex items-center mb-6"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={handleGoBack} 
          className="mr-4 text-muted-foreground hover:text-foreground hover:bg-accent"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-2xl font-bold text-gradient flex items-center">
          <MessageSquare className="mr-3 w-7 h-7" />
          Mesajlarım
        </h1>
        {filteredConversations.length > 0 && (
          <Badge variant="secondary" className="ml-4">
            {filteredConversations.length} sohbet
          </Badge>
        )}
      </motion.div>

      <motion.div 
        className="relative mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Sohbetlerde ara..."
          className="pl-10 pr-4 py-2 w-full bg-input border-border focus:ring-2 focus:ring-primary/20"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </motion.div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(6)].map((_, index) => (
            <Card key={index} className="border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center space-x-4">
                  <Skeleton className="w-12 h-12 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <div className="flex justify-between items-center">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                    <Skeleton className="h-3 w-48" />
                    <Skeleton className="h-3 w-64" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredConversations.length > 0 ? (
        <motion.div 
          className="space-y-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          {filteredConversations.map((conv, index) => (
            <ConversationCard 
              key={conv.id}
              conversation={conv} 
              currentUser={currentUser}
              unreadCount={unreadCounts[conv.id] || 0}
              onClick={() => navigate(`/mesajlar/${conv.id}`)}
            />
          ))}
        </motion.div>
      ) : (
        <motion.div 
          className="text-center py-20"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, type: "spring" }}
          >
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
              <MessageCircle className="w-12 h-12 text-primary" />
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <h3 className="text-xl font-semibold text-foreground mb-2">Henüz hiç sohbetiniz yok</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Bir ilana teklif yaptığınızda veya teklif aldığınızda sohbetleriniz burada görünecektir.
            </p>
            <Button 
              onClick={() => navigate('/')} 
              variant="default" 
              size="lg"
              className="gap-2"
            >
              <Users size={16} />
              İlanlara Göz At
            </Button>
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default memo(ConversationsListPage);