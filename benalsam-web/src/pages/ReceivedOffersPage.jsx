import React, { useState, useEffect, useCallback, memo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowDownLeftSquare, Package, AlertTriangle, Loader2, CheckCircle, XCircle, MessageSquare, ExternalLink, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { fetchReceivedOffers, updateOfferStatus } from '@/services/offerService';
import { getOrCreateConversation } from '@/services/conversationService';
import { canUserReview } from '@/services/reviewService';
import { useAuthStore } from '@/stores';

const ReceivedOffersPage = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuthStore();
  const [receivedOffers, setReceivedOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingOfferId, setUpdatingOfferId] = useState(null);
  const [reviewableOffers, setReviewableOffers] = useState({});
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (!currentUser?.id || isInitialized) {
      return;
    }
    const loadReceivedOffers = async () => {
      try {
        setLoading(true);
        const offers = await fetchReceivedOffers(currentUser.id);
        setReceivedOffers(offers || []);

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
        console.error('Error loading received offers:', error);
        toast({ title: "Hata", description: "Aldığım teklifler yüklenirken bir sorun oluştu.", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };
    loadReceivedOffers();
  }, [currentUser?.id, isInitialized]);

  const getStatusColor = status => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return 'text-yellow-400 border-yellow-400/50 bg-yellow-400/10';
      case 'accepted':
        return 'text-green-400 border-green-400/50 bg-green-400/10';
      case 'rejected':
        return 'text-red-400 border-red-400/50 bg-red-400/10';
      case 'cancelled':
        return 'text-slate-400 border-slate-400/50 bg-slate-400/10';
      default:
        return 'text-slate-500 border-slate-500/50 bg-slate-500/10';
    }
  };
  const handleUpdateStatus = useCallback(async (offerId, status, offeringUserId, listingId) => {
    setUpdatingOfferId(offerId);
    try {
      const updatedOffer = await updateOfferStatus(offerId, status, currentUser.id, offeringUserId, currentUser.id, listingId);
      if (updatedOffer) {
        setReceivedOffers(prevOffers => prevOffers.map(offer => offer.id === offerId ? {
          ...offer,
          status: updatedOffer.status,
          conversation_id: updatedOffer.conversation_id
        } : offer));
        toast({
          title: "Teklif Durumu Güncellendi",
          description: `Teklif ${status === 'accepted' ? 'kabul edildi' : 'reddedildi'}.`
        });
         if (status === 'accepted') {
          const canReview = await canUserReview(currentUser.id, offerId);
          setReviewableOffers(prev => ({...prev, [offerId]: canReview}));
        }
      } else {
        toast({
          title: "Hata",
          description: "Teklif durumu güncellenirken bir sorun oluştu.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error updating offer status:', error);
      toast({
        title: "Hata",
        description: "Beklenmedik bir hata oluştu.",
        variant: "destructive"
      });
    } finally {
      setUpdatingOfferId(null);
    }
  }, [currentUser?.id]);
  const handleStartOrGoToConversation = useCallback(async (offer) => {
    if (!currentUser || !offer.profiles) {
      toast({
        title: "Hata",
        description: "Sohbet başlatılamadı, kullanıcı bilgileri eksik.",
        variant: "destructive"
      });
      return;
    }
    let conversationId = offer.conversation_id;
    if (!conversationId) {
      conversationId = await getOrCreateConversation(currentUser.id, offer.offering_user_id, offer.id, offer.listing_id);
    }
    if (conversationId) {
      setReceivedOffers(prevOffers => prevOffers.map(o => o.id === offer.id ? {
        ...o,
        conversation_id: conversationId
      } : o));
      navigate(`/mesajlar/${conversationId}`);
    } else {
      toast({
        title: "Sohbet Başlatılamadı",
        description: "Lütfen tekrar deneyin.",
        variant: "destructive"
      });
    }
  }, [currentUser]);
  const handleViewOfferedItem = useCallback((item) => {
    if (item && item.id) {
      toast({
        title: "Ürün Detayı (Yakında)",
        description: `${item.name} adlı ürünün detay sayfası yakında eklenecektir.`
      });
    } else {
      toast({
        title: "Ürün Bilgisi Yok",
        description: "Bu teklifte bir ürün belirtilmemiş.",
        variant: "info"
      });
    }
  }, []);

  const handleOpenLeaveReview = useCallback((offer) => {
    navigate(`/degerlendirme/${offer.id}`);
  }, [navigate]);

  const formatDate = dateString => {
    if (!dateString) return "Bilinmiyor";
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-16 h-16 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Aldığım teklifler yükleniyor...</p>
        </div>
      </div>
    );
  }
  return <motion.div initial={{
    opacity: 0,
    y: 20
  }} animate={{
    opacity: 1,
    y: 0
  }} exit={{
    opacity: 0
  }} transition={{
    duration: 0.5
        }} className="mx-auto w-full max-w-[1600px] 2xl:max-w-[1920px] px-1 sm:px-2 lg:px-4 xl:px-6 py-8">
      <div className="flex items-center justify-between mb-10">
        <h1 className="text-3xl md:text-4xl font-bold text-gradient flex items-center">
          <ArrowDownLeftSquare className="w-8 h-8 mr-3 text-primary" /> Aldığım Teklifler
        </h1>
      </div>

      {receivedOffers.length > 0 ? <div className="space-y-6">
          {receivedOffers.map(offer => {
            const offeredItem = offer.inventory_items;
            return (
            <motion.div key={offer.id} initial={{
              opacity: 0,
              scale: 0.95
            }} animate={{
              opacity: 1,
              scale: 1
            }} transition={{
              duration: 0.3
            }} className="glass-effect rounded-xl p-5 shadow-lg hover:shadow-primary/20 transition-shadow">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3">
                <div className="mb-2 sm:mb-0">
                  {offer.listings ? <Link to={`/ilan/${offer.listings.id}`} className="hover:underline">
                        <h2 className="text-xl font-semibold text-foreground mb-1">{offer.listings.title || "İlan Başlığı Yok"}</h2>
                     </Link> : <h2 className="text-xl font-semibold text-foreground mb-1">İlan Bilgisi Yok</h2>}
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
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Teklif Edilen Ürün:</h3>
                  {offeredItem && offeredItem.id ? (
                    <div className="flex items-center gap-3 p-2 bg-background/30 rounded-md">
                      <Avatar className="w-12 h-12 rounded-md">
                        <AvatarImage src={offeredItem.main_image_url || offeredItem.image_url} alt={offeredItem.name} />
                        <AvatarFallback className="rounded-md bg-muted"><Package className="w-6 h-6 text-muted-foreground" /></AvatarFallback>
                      </Avatar>
                      <div>
                        <Button variant="link" className="p-0 h-auto font-medium text-foreground hover:text-primary text-left" onClick={() => handleViewOfferedItem(offeredItem)}>
                          {offeredItem.name || "Ürün Adı Yok"} <ExternalLink className="w-3 h-3 ml-1 opacity-70" />
                        </Button>
                        <p className="text-xs text-muted-foreground">{offeredItem.category || "Kategori Yok"}</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-foreground italic">Bu teklifte ürün belirtilmemiş.</p>
                  )}
                </div>
                <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Ek Nakit Teklifi:</h3>
                    <p className="text-lg font-semibold text-primary">{offer.offered_price ? `${offer.offered_price.toLocaleString()} ₺` : 'Yok'}</p>
                </div>
              </div>

              <div className="mt-3">
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Teklif Verenin Mesajı:</h3>
                <p className="text-sm text-foreground bg-background/20 p-3 rounded-md whitespace-pre-wrap">{offer.message || "Ek mesaj yok."}</p>
              </div>

              <div className="border-t border-border/50 my-4"></div>

              <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
                <div className="flex items-center gap-2">
                  {offer.profiles && <>
                      <Avatar className="w-8 h-8">
                          <AvatarImage src={offer.profiles.avatar_url} alt={offer.profiles.name} />
                          <AvatarFallback>{offer.profiles.name?.charAt(0) || 'T'}</AvatarFallback>
                      </Avatar>
                      <span className="text-sm text-muted-foreground">Teklif Veren: 
                        <Link to={`/profil/${offer.profiles.id}`} className="text-primary hover:underline">
                          {offer.profiles.name || 'Bilinmiyor'}
                        </Link>
                      </span>
                    </>}
                  {!offer.profiles && <span className="text-sm text-muted-foreground">Teklif Veren: Bilinmiyor</span>}
                </div>
                <div className="flex gap-2 flex-wrap justify-end">
                  {offer.id && <Button variant="outline" size="sm" onClick={() => handleStartOrGoToConversation(offer)} className="border-blue-500/50 text-blue-400 hover:bg-blue-500/10">
                      <MessageSquare className="w-3.5 h-3.5 mr-1.5" /> 
                      {offer.conversation_id ? 'Sohbete Git' : 'Mesaj Gönder'}
                    </Button>}
                  {offer.status === 'pending' && <>
                      <Button variant="outline" size="sm" onClick={() => handleUpdateStatus(offer.id, 'accepted', offer.offering_user_id, offer.listing_id)} disabled={updatingOfferId === offer.id} className="border-green-500/50 text-green-400 hover:bg-green-500/10">
                        {updatingOfferId === offer.id && offer.status !== 'accepted' ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5 mr-1.5" />}
                        Kabul Et
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleUpdateStatus(offer.id, 'rejected', offer.offering_user_id, offer.listing_id)} disabled={updatingOfferId === offer.id} className="border-red-500/50 text-red-400 hover:bg-red-500/10">
                        {updatingOfferId === offer.id && offer.status !== 'rejected' ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5 mr-1.5" />}
                        Reddet
                      </Button>
                    </>}
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
                </div>
              </div>
            </motion.div>
          )})}
        </div> : <div className="text-center py-20 glass-effect rounded-2xl">
          <Package className="w-20 h-20 text-primary mx-auto mb-6" />
          <h2 className="text-2xl font-semibold text-foreground mb-3">
            Henüz hiç teklif almamışsınız.
          </h2>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">
            İlanlarınız ilgi gördükçe burada teklifleri görebileceksiniz.
          </p>
          <Button onClick={() => navigate('/')} className="btn-primary text-primary-foreground px-8 py-3 text-lg">
            Ana Sayfaya Dön
          </Button>
        </div>}
    </motion.div>;
};
export default memo(ReceivedOffersPage);