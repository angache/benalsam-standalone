import React, { useState, useEffect, useRef, memo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Send, Loader2, Paperclip, Briefcase, User, Info } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/use-toast';
import { 
  fetchMessages, 
  sendMessage, 
  fetchConversationDetails,
  subscribeToMessages,
  markMessagesAsRead,
  subscribeToMessageStatusChanges
} from '@/services/conversationService';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores';
import MessageStatus from '@/components/MessageStatus';
import { supabase } from '@/lib/supabaseClient';
import { formatDate } from 'benalsam-shared-types';



const ConversationPage = () => {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuthStore();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [conversationDetails, setConversationDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const messagesEndRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const subscriptionRef = useRef(null);
  const statusSubscriptionRef = useRef(null);

  const scrollToBottom = (behavior = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };
  
  const handleMarkAsRead = async () => {
      if (currentUser && conversationId) {
          await markMessagesAsRead(conversationId, currentUser.id);
      }
  };

  useEffect(() => {
    if (!currentUser || !conversationId) return;

    const loadConversation = async () => {
      setLoading(true);
      const details = await fetchConversationDetails(conversationId);
      if (details) {
        const isParticipant = details.conversation_participants?.some(p => p.user_id === currentUser.id);
        if (!isParticipant) {
            toast({ title: "Yetkisiz Erişim", description: "Bu sohbete erişim yetkiniz yok.", variant: "destructive" });
            navigate(-1);
            setLoading(false);
            return;
        }
        setConversationDetails(details);
        const initialMessages = await fetchMessages(conversationId);
        setMessages(initialMessages || []);
        await handleMarkAsRead(); 
        setTimeout(() => scrollToBottom("auto"), 100);
      } else {
        toast({ title: "Sohbet Bulunamadı", description: "Bu sohbet mevcut değil veya erişim yetkiniz yok.", variant: "destructive" });
        navigate('/aldigim-teklifler'); 
      }
      setLoading(false);
    };

    loadConversation();
  }, [conversationId, currentUser?.id]);


  useEffect(() => {
    if (!currentUser || !conversationId || loading) return;

    const handleNewMessage = (newMessagePayload) => {
      const container = scrollContainerRef.current;
      const isAtBottom = container ? (container.scrollHeight - container.scrollTop - container.clientHeight < 150) : true;

      setMessages((prevMessages) => {
        const exists = prevMessages.some(msg => msg.id === newMessagePayload.id);
        if (exists) {
          return prevMessages.map(msg => 
            msg.id === newMessagePayload.id 
            ? { ...msg, ...newMessagePayload, status: newMessagePayload.status || msg.status } 
            : msg
          );
        }

        if (newMessagePayload.sender_id === currentUser.id) {
          const optimisticIndex = prevMessages.findLastIndex(m => m.id.toString().startsWith('optimistic-'));
          if (optimisticIndex !== -1) {
            const newMessages = [...prevMessages];
            newMessages[optimisticIndex] = { ...newMessagePayload, status: 'delivered' };
            return newMessages;
          }
        }
        
        return [...prevMessages, newMessagePayload];
      });

      if (isAtBottom) {
        setTimeout(() => scrollToBottom('smooth'), 50);
      }
      if (newMessagePayload.sender_id !== currentUser.id && document.visibilityState === 'visible') {
        handleMarkAsRead();
      }
    };

    const handleStatusUpdate = (updatePayload) => {
        setMessages(prevMessages => 
            prevMessages.map(msg => 
                msg.id === updatePayload.id ? { ...msg, status: updatePayload.status, read_at: updatePayload.read_at } : msg
            )
        );
    };

    subscriptionRef.current = subscribeToMessages(conversationId, handleNewMessage);
    statusSubscriptionRef.current = subscribeToMessageStatusChanges(conversationId, handleStatusUpdate);
    
    const handleFocusAndVisibility = () => {
        if (document.visibilityState === 'visible') {
            handleMarkAsRead();
        }
    };

    document.addEventListener('visibilitychange', handleFocusAndVisibility);
    window.addEventListener('focus', handleFocusAndVisibility);

    return () => {
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current);
        subscriptionRef.current = null;
      }
      if (statusSubscriptionRef.current) {
        supabase.removeChannel(statusSubscriptionRef.current);
        statusSubscriptionRef.current = null;
      }
      document.removeEventListener('visibilitychange', handleFocusAndVisibility);
      window.removeEventListener('focus', handleFocusAndVisibility);
    };
  }, [conversationId, currentUser?.id, loading]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentUser || sending) return;

    setSending(true);
    const tempMessageContent = newMessage.trim();
    const optimisticId = `optimistic-${Date.now()}`;
    setNewMessage('');

    const optimisticMessage = {
      id: optimisticId,
      conversation_id: conversationId,
      sender_id: currentUser.id,
      content: tempMessageContent,
      created_at: new Date().toISOString(),
      status: 'sent',
      sender: { 
        id: currentUser.id, 
        name: currentUser.user_metadata?.name || currentUser.email,
        avatar_url: currentUser.user_metadata?.avatar_url || currentUser.avatar_url 
      },
    };
    
    setMessages(prev => [...prev, optimisticMessage]);
    setTimeout(() => scrollToBottom('smooth'), 50);
    
    try {
      const sentMessage = await sendMessage(conversationId, currentUser.id, tempMessageContent);
      
      if (sentMessage) {
        setMessages(prev => 
          prev.map(msg => msg.id === optimisticId ? { ...sentMessage, status: 'delivered' } : msg)
        );
      } else {
        throw new Error("Message sending failed, service handled toast.");
      }

    } catch (error) {
      if (error.message !== "Message sending failed, service handled toast.") {
        toast({title: "Mesaj Gönderilemedi", description: "Lütfen tekrar deneyin.", variant: "destructive"});
      }
      setMessages(prev => prev.filter(msg => msg.id !== optimisticId));
      setNewMessage(tempMessageContent); 
    } finally {
      setSending(false);
    }
  };

  const getOtherParticipant = () => {
    if (!conversationDetails || !currentUser) return null;
    return conversationDetails.conversation_participants?.find(p => p.user_id !== currentUser.id)?.profiles;
  };

  const otherParticipant = getOtherParticipant();

  
  if (loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-background">
        <Loader2 className="w-16 h-16 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Sohbet yükleniyor...</p>
      </div>
    );
  }
  
  if (!conversationDetails) {
     return (
      <div className="h-screen flex flex-col items-center justify-center bg-background p-4">
        <Info className="w-16 h-16 text-destructive mb-4" />
        <p className="text-xl font-semibold text-center mb-2">Sohbet Bilgisi Bulunamadı</p>
        <p className="text-muted-foreground text-center mb-6">Bu sohbet mevcut olmayabilir veya erişim izniniz olmayabilir.</p>
        <Button onClick={() => navigate(-1)} variant="outline">
          <ArrowLeft className="w-4 h-4 mr-2" /> Geri Dön
        </Button>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col h-screen bg-gradient-to-br from-background to-slate-900/50"
    >
      <header className="flex-shrink-0 bg-background/80 backdrop-blur-md shadow-sm p-3 border-b border-border">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="mr-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          {otherParticipant && (
            <Link to={`/profil/${otherParticipant.id}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity overflow-hidden flex-1 min-w-0">
              <Avatar className="w-10 h-10 border-2 border-primary/50 shrink-0">
                <AvatarImage src={otherParticipant.avatar_url} alt={otherParticipant.name} />
                <AvatarFallback>{otherParticipant.name?.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="overflow-hidden min-w-0">
                <h2 className="font-semibold text-sm text-foreground truncate">{otherParticipant.name}</h2>
                 {conversationDetails.listings && (
                  <p className="text-xs text-muted-foreground truncate">"{conversationDetails.listings.title}" ilanı için</p>
                )}
                 {!conversationDetails.listings && conversationDetails.offers?.inventory_items && (
                    <p className="text-xs text-muted-foreground truncate">"{conversationDetails.offers.inventory_items.name}" ürünü hakkında</p>
                 )}
              </div>
            </Link>
          )}
           {!otherParticipant && (
             <div className="flex items-center gap-3 overflow-hidden flex-1 min-w-0">
                <Avatar className="w-10 h-10 border-2 border-primary/50 shrink-0">
                    <AvatarFallback><User className="w-5 h-5"/></AvatarFallback>
                </Avatar>
                <div className="overflow-hidden min-w-0">
                    <h2 className="font-semibold text-sm text-foreground truncate">Sohbet</h2>
                    {conversationDetails.listings && (
                        <p className="text-xs text-muted-foreground truncate">"{conversationDetails.listings.title}" ilanı için</p>
                    )}
                     {!conversationDetails.listings && conversationDetails.offers?.inventory_items && (
                        <p className="text-xs text-muted-foreground truncate">"{conversationDetails.offers.inventory_items.name}" ürünü hakkında</p>
                     )}
                </div>
            </div>
          )}
          <div className="flex items-center gap-2 shrink-0">
            {conversationDetails.listings && (
                <Button variant="outline" size="sm" asChild className="hidden sm:inline-flex">
                    <Link to={`/ilan/${conversationDetails.listing_id}`}>
                        <Briefcase className="w-3.5 h-3.5 mr-1.5" /> İlanı Gör
                    </Link>
                </Button>
            )}
          </div>
        </div>
      </header>

      <main ref={scrollContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-transparent">
        <div className="max-w-4xl mx-auto">
          {messages.map((msg) => {
            const isCurrentUser = msg.sender_id === currentUser.id;
            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className={cn(
                  "flex mb-3 max-w-[80%] sm:max-w-[70%]",
                  isCurrentUser ? "ml-auto justify-end" : "mr-auto justify-start"
                )}
              >
                <div className="flex items-end gap-2">
                  {!isCurrentUser && msg.sender && (
                    <Avatar className="w-8 h-8 self-start shrink-0">
                      <AvatarImage src={msg.sender.avatar_url} alt={msg.sender.name} />
                      <AvatarFallback>{msg.sender.name?.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                  )}
                  <div
                    className={cn(
                      "p-3 rounded-xl shadow-md text-sm whitespace-pre-wrap break-words",
                      msg.id?.toString().startsWith('optimistic-') && "opacity-70",
                      isCurrentUser
                        ? "bg-primary text-primary-foreground rounded-br-none"
                        : "bg-card text-card-foreground rounded-bl-none border border-border"
                    )}
                  >
                    <p>{msg.content}</p>
                    <div className={cn(
                        "flex items-center gap-1.5 text-xs mt-1",
                        isCurrentUser ? "text-primary-foreground/70 justify-end" : "text-muted-foreground/70 justify-start"
                      )}>
                      <span>{formatDate(msg.created_at)}</span>
                      <MessageStatus status={msg.status} isCurrentUser={isCurrentUser} />
                    </div>
                  </div>
                   {isCurrentUser && (
                    <Avatar className="w-8 h-8 self-start shrink-0">
                      <AvatarImage src={currentUser.user_metadata?.avatar_url || currentUser.avatar_url} alt={currentUser.user_metadata?.name || currentUser.email} />
                      <AvatarFallback>{(currentUser.user_metadata?.name || currentUser.email)?.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                  )}
                </div>
              </motion.div>
            )}
          )}
          <div ref={messagesEndRef} />
        </div>
      </main>

      <footer className="flex-shrink-0 bg-background/80 backdrop-blur-md p-3 border-t border-border">
        <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto flex items-center gap-2">
          <Button variant="ghost" size="icon" type="button" className="text-muted-foreground hover:text-primary" onClick={() => toast({title: "🚧 Çok Yakında!", description:"Dosya ve görsel gönderme özelliği geliştirme aşamasında.", variant:"info"})}>
            <Paperclip className="w-5 h-5" />
          </Button>
          <Input
            type="text"
            placeholder="Bir mesaj yazın..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            className="flex-1 bg-input/50 focus:bg-input/80 border-border focus:ring-primary"
            disabled={sending}
          />
          <Button type="submit" size="icon" className="bg-primary hover:bg-primary/90 text-primary-foreground" disabled={sending || !newMessage.trim()}>
            {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </Button>
        </form>
      </footer>
    </motion.div>
  );
};
export default memo(ConversationPage);