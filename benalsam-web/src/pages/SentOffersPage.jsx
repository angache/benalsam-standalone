import React, { useState, useEffect, useCallback, memo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowUpRightSquare, Package, AlertTriangle, Loader2, Trash2, MessageSquare, ExternalLink, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { fetchSentOffers, deleteOffer } from '@/services/offerService';
import { getOrCreateConversation } from '@/services/conversationService';
import { canUserReview } from '@/services/reviewService';
import { useAuthStore } from '@/stores';
import { formatDate } from 'benalsam-shared-types';


const SentOffersPage = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuthStore();
  const [sentOffers, setSentOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingOfferId, setDeletingOfferId] = useState(null);
  const [reviewableOffers, setReviewableOffers] = useState({});
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (!currentUser?.id || isInitialized) {
      return;
    }

    const loadSentOffers = async () => {
      try {
        setLoading(true);
        const offers = await fetchSentOffers(currentUser.id);
        setSentOffers(offers || []);
        
        const reviewStatus = {};
        if (offers) {
          for (const offer of offers) {
            if (offer.status === 'accepted') {
              reviewStatus[offer.id] = await canUserReview(currentUser.id, offer.id);
            } else {
              reviewStatus[offer.id] = false;
            }
          }
        }
        setReviewableOffers(reviewStatus);
        setIsInitialized(true);
      } catch (error) {
        console.error('Error loading sent offers:', error);
        toast({ title: "Hata", description: "Gönderdiğim teklifler yüklenirken bir sorun oluştu.", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };

    loadSentOffers();
  }, [currentUser?.id, isInitialized]);

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending': return 'text-yellow-400 border-yellow-400/50 bg-yellow-400/10';
      case 'accepted': return 'text-green-400 border-green-400/50 bg-green-400/10';
      case 'rejected': return 'text-red-400 border-red-400/50 bg-red-400/10';
      case 'cancelled': return 'text-slate-400 border-slate-400/50 bg-slate-400/10';
      default: return 'text-slate-500 border-slate-500/50 bg-slate-500/10';
    }
  };

  const handleDeleteOffer = useCallback(async (offerId) => {
    setDeletingOfferId(offerId);
    try {
      const success = await deleteOffer(offerId, currentUser.id);
      if (success) {
        setSentOffers(prevOffers => prevOffers.filter(offer => offer.id !== offerId));
        toast({ title: "Teklif Silindi", description: "Teklifiniz başarıyla silindi." });
      } else {
        toast({ title: "Hata", description: "Teklif silinirken bir sorun oluştu.", variant: "destructive" });
      }
    } catch (error) {
      console.error('Error deleting offer:', error);
      toast({ title: "Hata", description: "Beklenmedik bir hata oluştu.", variant: "destructive" });
    } finally {
      setDeletingOfferId(null);
    }
  }, [currentUser?.id]);

  const handleStartOrGoToConversation = useCallback(async (offer) => {
    if (!currentUser || !offer.listings || !offer.listings.profiles) {
      toast({ title: "Hata", description: "Sohbet başlatılamadı, kullanıcı veya ilan bilgileri eksik.", variant: "destructive" });
      return;
    }
    
    let conversationId = offer.conversation_id;

    if (!conversationId) {
      conversationId = await getOrCreateConversation(currentUser.id, offer.listings.user_id, offer.id, offer.listings.id);
    }

    if (conversationId) {
      setSentOffers(prevOffers => prevOffers.map(o => o.id === offer.id ? { ...o, conversation_id: conversationId } : o));
      navigate(`/mesajlar/${conversationId}`);
    } else {
      toast({ title: "Sohbet Başlatılamadı", description: "Lütfen tekrar deneyin.", variant: "destructive" });
    }
  }, [currentUser]);

  const handleViewOfferedItem = useCallback((item) => {
    if (item && item.id) {
      toast({
        title: "Ürün Detayı (Yakında)",
        description: `${item.name} adlı ürünün detay sayfası yakında eklenecektir. Şimdilik envanter sayfanızdan kontrol edebilirsiniz.`,
        action: <Button onClick={() => navigate('/envanterim')} variant="outline" size="sm">Envantere Git</Button>
      });
    } else {
      toast({ title: "Ürün Bilgisi Yok", description: "Bu teklifte bir ürün belirtilmemiş.", variant: "info" });
    }
  }, [navigate]);

  const handleOpenLeaveReview = useCallback((offer) => {
    navigate(`/degerlendirme/${offer.id}`);
  }, [navigate]);

  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-16 h-16 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Gönderdiğim teklifler yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-5xl mx-auto px-4 py-8"
    >
      <div className="flex items-center justify-between mb-10">
        <h1 className="text-3xl md:text-4xl font-bold text-gradient flex items-center">
          <ArrowUpRightSquare className="w-8 h-8 mr-3 text-primary" /> Gönderdiğim Teklifler
        </h1>
      </div>

      {sentOffers.length > 0 ? (
        <div className="space-y-6">
          {sentOffers.map((offer) => (
            <motion.div
              key={offer.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="glass-effect rounded-xl p-5 shadow-lg hover:shadow-primary/20 transition-shadow"
            >
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3">
                <div className="mb-2 sm:mb-0">
                  {offer.listings ? (
                    <Link to={`/ilan/${offer.listings.id}`} className="hover:underline">
                      <h2 className="text-xl font-semibold text-foreground mb-1">{offer.listings.title || "İlan Başlığı Yok"}</h2>
                    </Link>
                  ) : (
                     <h2 className="text-xl font-semibold text-foreground mb-1">İlan Bilgisi Yok</h2>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Teklif Tarihi: {formatDate(offer.created_at)}
                  </p>
                </div>
                <span className={`px-3 py-1 text-xs font-medium rounded-full border ${getStatusColor(offer.status)}`}>
                  {offer.status?.charAt(0).toUpperCase() + offer.status?.slice(1) || 'Bilinmiyor'}
                </span>
              </div>
              
              <div className="border-t border-border/50 my-4"></div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start mb-3">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Teklif Edilen Ürünüm:</h3>
                  {offer.inventory_items ? (
                    <div className="flex items-center gap-3 p-2 bg-background/30 rounded-md">
                      <Avatar className="w-12 h-12 rounded-md">
                        <AvatarImage src={offer.inventory_items.main_image_url || offer.inventory_items.image_url} alt={offer.inventory_items.name} />
                        <AvatarFallback className="rounded-md bg-muted"><Package className="w-6 h-6 text-muted-foreground" /></AvatarFallback>
                      </Avatar>
                      <div>
                        <Button 
                          variant="link" 
                          className="p-0 h-auto font-medium text-foreground hover:text-primary text-left"
                          onClick={() => handleViewOfferedItem(offer.inventory_items)}
                        >
                          {offer.inventory_items.name || "Ürün Adı Yok"} <ExternalLink className="w-3 h-3 ml-1 opacity-70" />
                        </Button>
                        <p className="text-xs text-muted-foreground">{offer.inventory_items.category || "Kategori Yok"}</p>
                      </div>
                    </div>
                  ) : <p className="text-sm text-foreground italic">Bu teklifte ürün belirtilmemiş.</p>}
                </div>
                <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Ek Nakit Teklifim:</h3>
                    <p className="text-lg font-semibold text-primary">{offer.offered_price ? `${offer.offered_price.toLocaleString()} ₺` : 'Yok'}</p>
                </div>
              </div>

              <div className="mt-3">
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Mesajım:</h3>
                <p className="text-sm text-foreground bg-background/20 p-3 rounded-md whitespace-pre-wrap">{offer.message || "Ek mesaj yok."}</p>
              </div>
              
              <div className="border-t border-border/50 my-4"></div>

              <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
                <div className="flex items-center gap-2">
                  {offer.listings?.profiles && (
                    <>
                      <Avatar className="w-8 h-8">
                          <AvatarImage src={offer.listings.profiles.avatar_url} alt={offer.listings.profiles.name}/>
                          <AvatarFallback>{offer.listings.profiles.name?.charAt(0) || 'İ'}</AvatarFallback>
                      </Avatar>
                      <span className="text-sm text-muted-foreground">İlan Sahibi: 
                        <Link to={`/profil/${offer.listings.profiles.id}`} className="text-primary hover:underline">
                          {offer.listings.profiles.name || 'Bilinmiyor'}
                        </Link>
                      </span>
                    </>
                  )}
                  {!offer.listings?.profiles && <span className="text-sm text-muted-foreground">İlan Sahibi: Bilinmiyor</span>}
                </div>
                <div className="flex gap-2 flex-wrap justify-end">
                  {offer.id && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleStartOrGoToConversation(offer)}
                      className="border-blue-500/50 text-blue-400 hover:bg-blue-500/10"
                    >
                      <MessageSquare className="w-3.5 h-3.5 mr-1.5" /> 
                      {offer.conversation_id ? 'Sohbete Git' : 'Mesaj Gönder'}
                    </Button>
                  )}
                   {offer.status === 'accepted' && reviewableOffers[offer.id] && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenLeaveReview(offer)}
                        className="border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/10"
                      >
                        <Award className="w-3.5 h-3.5 mr-1.5" /> Değerlendir
                      </Button>
                    )}
                  {(offer.status === 'pending' || offer.status === 'cancelled') && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          disabled={deletingOfferId === offer.id}
                          className="border-destructive/50 text-destructive hover:bg-destructive/10"
                        >
                          {deletingOfferId === offer.id ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin"/> : <Trash2 className="w-3.5 h-3.5 mr-1.5" />}
                          Teklifi Geri Çek
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Teklifi Geri Çekmek İstediğinize Emin Misiniz?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Bu işlem geri alınamaz. Teklifiniz kalıcı olarak silinecektir.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>İptal</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDeleteOffer(offer.id)} className="bg-destructive hover:bg-destructive/90">
                            Evet, Geri Çek
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 glass-effect rounded-2xl">
          <Package className="w-20 h-20 text-primary mx-auto mb-6" />
          <h2 className="text-2xl font-semibold text-foreground mb-3">
            Henüz hiç teklif göndermemişsiniz.
          </h2>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">
            Beğendiğiniz ilanlara teklif yaparak takas dünyasına adım atın!
          </p>
          <Button onClick={() => navigate('/')} className="btn-primary text-primary-foreground px-8 py-3 text-lg">
            İlanları Keşfet
          </Button>
        </div>
      )}
    </motion.div>
  );
};

export default memo(SentOffersPage);