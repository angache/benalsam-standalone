import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, MessageSquare, Share2, Flag, ShoppingBag, CheckCircle, Clock, AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/use-toast';
import { useAuthStore } from '@/stores';
import { trackEvent } from '@/services/analyticsService';

const ListingActions = ({ 
  listing, 
  currentUser, 
  inventoryItems, 
  isFetchingInventory, 
  isFavorited, 
  onToggleFavorite, 
  onStartConversation 
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser: storeUser } = useAuthStore();
  
  const [isMakingOffer, setIsMakingOffer] = useState(false);
  const [showInventory, setShowInventory] = useState(false);
  const [isTogglingFavorite, setIsTogglingFavorite] = useState(false);

  // Use store user if prop is undefined
  const user = currentUser || storeUser;

  const handleToggleFavorite = async () => {
    if (!user) {
      toast({
        title: "Giriş Gerekli",
        description: "Favorilere eklemek için giriş yapmalısınız.",
        variant: "destructive"
      });
      return;
    }

    setIsTogglingFavorite(true);
    await onToggleFavorite(listing.id);
    setIsTogglingFavorite(false);
  };

  const handleMakeOffer = () => {
    if (!user) {
      navigate('/auth?action=register');
      return;
    }

    if (user.id === listing.user_id) {
      toast({
        title: "Kendi İlanınız",
        description: "Kendi ilanınıza teklif yapamazsınız.",
        variant: "destructive"
      });
      return;
    }

    if (listing.status === 'in_transaction') {
      toast({
        title: "Alışveriş Devam Ediyor",
        description: "Bu ilan için bir teklif kabul edilmiş ve alışveriş süreci devam ediyor.",
        variant: "info"
      });
      return;
    }

    if (listing.status === 'sold' || listing.status === 'inactive') {
      toast({
        title: "İlan Artık Aktif Değil",
        description: "Bu ilan satılmış veya pasif durumda.",
        variant: "info"
      });
      return;
    }

    navigate(`/teklif-yap/${listing.id}`);
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: listing.title,
          text: listing.description,
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast({
          title: "Link Kopyalandı",
          description: "İlan linki panoya kopyalandı."
        });
      }
    } catch (error) {
      console.error('Error sharing:', error);
      toast({
        title: "Paylaşım Hatası",
        description: "Link paylaşılırken bir hata oluştu.",
        variant: "destructive"
      });
    }
  };

  const handleReport = () => {
    if (!user) {
      toast({
        title: "Giriş Gerekli",
        description: "İlan bildirmek için giriş yapmalısınız.",
        variant: "destructive"
      });
      return;
    }
    navigate(`/ilan-bildir/${listing.id}`);
  };

  const getListingStatusInfo = () => {
    if (listing.status === 'in_transaction') {
      return {
        badge: (
          <Badge className="bg-blue-500 text-white hover:bg-blue-600 flex items-center gap-1">
            <ShoppingBag className="w-3 h-3" />
            Alışveriş Devam Ediyor
          </Badge>
        ),
        message: "Bu ilan için bir teklif kabul edilmiş ve alışveriş süreci devam ediyor."
      };
    }

    if (listing.status === 'sold') {
      return {
        badge: (
          <Badge className="bg-green-500 text-white hover:bg-green-600 flex items-center gap-1">
            <CheckCircle className="w-3 h-3" />
            Satıldı
          </Badge>
        ),
        message: "Bu ilan başarıyla tamamlanmış."
      };
    }

    if (listing.status === 'inactive') {
      return {
        badge: (
          <Badge variant="secondary" className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Pasif
          </Badge>
        ),
        message: "Bu ilan şu anda pasif durumda."
      };
    }

    if (listing.expires_at && new Date(listing.expires_at) < new Date()) {
      return {
        badge: (
          <Badge variant="destructive" className="flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            Süresi Doldu
          </Badge>
        ),
        message: "Bu ilanın süresi dolmuş."
      };
    }

    return null;
  };

  const statusInfo = getListingStatusInfo();
  const isOwner = user && user.id === listing.user_id;
  const canMakeOffer = 
    listing.status === 'active' && 
    (!listing.expires_at || new Date(listing.expires_at) > new Date()) &&
    !isOwner;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-4"
    >
      {statusInfo && (
        <div className="p-4 bg-muted/50 rounded-lg border">
          <div className="flex items-center gap-2 mb-2">
            {statusInfo.badge}
          </div>
          <p className="text-sm text-muted-foreground">{statusInfo.message}</p>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        {!user ? (
          <Button 
            onClick={() => navigate('/auth?action=register')}
            className="flex-1 btn-primary text-primary-foreground"
            size="lg"
          >
            <ShoppingBag className="w-5 h-5 mr-2" />
            Teklif yapmak için üye girişi yapın
          </Button>
        ) : canMakeOffer ? (
          <Button 
            onClick={handleMakeOffer}
            className="flex-1 btn-primary text-primary-foreground"
            size="lg"
          >
            <ShoppingBag className="w-5 h-5 mr-2" />
            Teklif Yap
          </Button>
        ) : (
          <Button 
            disabled
            className="flex-1"
            size="lg"
            variant="secondary"
          >
            <ShoppingBag className="w-5 h-5 mr-2" />
            {isOwner ? 'Kendi İlanınız' : 
             listing.status === 'in_transaction' ? 'Alışveriş Devam Ediyor' : 
             listing.status === 'sold' ? 'Satıldı' : 
             listing.status === 'inactive' ? 'Pasif İlan' : 'Teklif Yapılamaz'}
          </Button>
        )}

        <Button
          onClick={handleToggleFavorite}
          variant="outline"
          size="lg"
          disabled={isTogglingFavorite}
          className={isFavorited ? 'text-red-500 border-red-500 hover:bg-red-50' : ''}
        >
          <Heart className={`w-5 h-5 mr-2 ${isFavorited ? 'fill-current' : ''}`} />
          {isFavorited ? 'Favorilerden Çıkar' : 'Favorilere Ekle'}
        </Button>
      </div>

      <div className="flex gap-2">
        <Button
          onClick={onStartConversation}
          variant="outline"
          className="flex-1"
          disabled={!user || isOwner}
        >
          <MessageSquare className="w-4 h-4 mr-2" />
          Mesaj Gönder
        </Button>

        <Button onClick={handleShare} variant="outline" size="icon">
          <Share2 className="w-4 h-4" />
        </Button>

        <Button onClick={handleReport} variant="outline" size="icon">
          <Flag className="w-4 h-4" />
        </Button>
      </div>
    </motion.div>
  );
};

export default ListingActions;