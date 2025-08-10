import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Star, MessageSquare, Package, DollarSign, Calendar, User, Crown, Zap, FileText, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';
import { featureOffer, checkPremiumFeature, showPremiumUpgradeToast } from '@/services/premiumService';
import PremiumModal from '@/components/PremiumModal';import { formatDate } from 'benalsam-shared-types';


const OfferCard = ({ offer, currentUser, onAccept, onReject, onMessage, showActions = true }) => {
  const [isPremiumModalOpen, setIsPremiumModalOpen] = useState(false);
  const [isFeaturingOffer, setIsFeaturingOffer] = useState(false);

  
  const handleFeatureOffer = async () => {
    if (!currentUser) return;

    const canFeature = await checkPremiumFeature(currentUser.id, 'daily_featured_offers');
    if (!canFeature) {
      showPremiumUpgradeToast('featured_offer', 0, 1);
      setIsPremiumModalOpen(true);
      return;
    }

    setIsFeaturingOffer(true);
    const result = await featureOffer(offer.id, currentUser.id, 24);
    setIsFeaturingOffer(false);

    if (result) {
      toast({
        title: "🌟 Teklif Öne Çıkarıldı!",
        description: "Teklifiniz 24 saat boyunca öne çıkarılacak.",
        duration: 5000
      });
    } else {
      toast({
        title: "Hata",
        description: "Teklif öne çıkarılırken bir hata oluştu.",
        variant: "destructive"
      });
    }
  };

  const generateBoringAvatarUrl = (name, userId) => {
    const cleanedName = name ? String(name).replace(/[^a-zA-Z0-9]/g, '') : '';
    const fallbackName = cleanedName || (userId ? String(userId).substring(0, 8) : 'user');
    return `https://source.boringavatars.com/beam/40/${fallbackName}?colors=ff6b35,f7931e,ff8c42,1a0f0a,2d1810`;
  };

  const offerorName = offer.offeror?.name || offer.offeror?.user_metadata?.name || offer.offeror?.email || 'Anonim Kullanıcı';
  const offerorAvatar = offer.offeror?.avatar_url || offer.offeror?.user_metadata?.avatar_url || generateBoringAvatarUrl(offerorName, offer.offeror?.id);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -2 }}
        transition={{ duration: 0.2 }}
      >
        <Card className={`relative overflow-hidden ${
          offer.is_featured 
            ? 'border-2 border-yellow-400 shadow-lg bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20' 
            : 'border border-border hover:border-primary/50'
        } transition-all duration-300`}>
          {offer.is_featured && (
            <div className="absolute top-2 right-2 z-10">
              <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-bold">
                <Star className="w-3 h-3 mr-1" />
                Öne Çıkan
              </Badge>
            </div>
          )}

          <CardContent className="p-4 space-y-4">
            {/* Kullanıcı bilgileri */}
            <div className="flex items-center gap-3">
              <Avatar className="w-10 h-10 border-2 border-primary/20">
                <AvatarImage src={offerorAvatar} alt={offerorName} />
                <AvatarFallback className="text-sm">
                  {offerorName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-sm truncate">{offerorName}</p>
                  {offer.offeror?.is_premium && (
                    <Crown className="w-4 h-4 text-yellow-500" title="Premium Üye" />
                  )}
                  {offer.offeror?.is_verified && (
                    <Badge variant="secondary" className="text-xs">
                      Doğrulanmış
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {formatDate(offer.created_at)}
                </p>
              </div>
            </div>

            {/* Teklif detayları */}
            <div className="space-y-3">
              {/* Teklif edilen ürün */}
              {offer.offered_item && (
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <Package className="w-5 h-5 text-primary flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{offer.offered_item.name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {offer.offered_item.category}
                    </p>
                  </div>
                  {offer.offered_item.main_image_url && (
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={offer.offered_item.main_image_url} alt={offer.offered_item.name} />
                      <AvatarFallback>
                        <Package className="w-4 h-4" />
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
              )}

              {/* Nakit teklifi */}
              {offer.offered_price && offer.offered_price > 0 && (
                <div className="flex items-center gap-2 text-lg font-bold text-green-600 dark:text-green-400">
                  <DollarSign className="w-5 h-5" />
                  <span>₺{offer.offered_price.toLocaleString('tr-TR')}</span>
                </div>
              )}

              {/* AI önerisi */}
              {offer.ai_suggestion && (
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-4 h-4 text-blue-500" />
                    <span className="text-xs font-medium text-blue-700 dark:text-blue-300">
                      AI Destekli Teklif
                    </span>
                  </div>
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    {offer.ai_suggestion}
                  </p>
                </div>
              )}

              {/* Teklif mesajı */}
              <div className="p-3 bg-background border border-border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <MessageSquare className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">Teklif Mesajı</span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {offer.message}
                </p>
              </div>

              {/* Dosya ekleri */}
              {offer.attachments && offer.attachments.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium">Ekli Dosyalar</span>
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    {offer.attachments.map((attachment, index) => (
                      <a
                        key={index}
                        href={attachment.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 p-2 bg-muted/50 rounded-md hover:bg-muted transition-colors"
                      >
                        <FileText className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm truncate">{attachment.file_name}</span>
                        <span className="text-xs text-muted-foreground ml-auto">
                          {(attachment.file_size / 1024).toFixed(1)} KB
                        </span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Aksiyon butonları */}
            {showActions && (
              <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
                {currentUser?.id === offer.user_id ? (
                  // Teklif sahibi için butonlar
                  <>
                    <Button
                      onClick={handleFeatureOffer}
                      disabled={isFeaturingOffer || offer.is_featured}
                      variant="outline"
                      size="sm"
                      className="flex-1"
                    >
                      {isFeaturingOffer ? (
                        <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                      ) : (
                        <Zap className="w-4 h-4 mr-2" />
                      )}
                      {offer.is_featured ? 'Öne Çıkarıldı' : 'Öne Çıkar'}
                    </Button>
                    <Button
                      onClick={() => onMessage?.(offer)}
                      variant="outline"
                      size="sm"
                      className="flex-1"
                    >
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Mesaj
                    </Button>
                  </>
                ) : (
                  // İlan sahibi için butonlar
                  <>
                    <Button
                      onClick={() => onAccept?.(offer)}
                      size="sm"
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                    >
                      Kabul Et
                    </Button>
                    <Button
                      onClick={() => onReject?.(offer)}
                      variant="outline"
                      size="sm"
                      className="flex-1 border-red-300 text-red-600 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900/20"
                    >
                      Reddet
                    </Button>
                    <Button
                      onClick={() => onMessage?.(offer)}
                      variant="outline"
                      size="sm"
                      className="flex-1"
                    >
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Mesaj
                    </Button>
                  </>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      <PremiumModal 
        isOpen={isPremiumModalOpen} 
        onOpenChange={setIsPremiumModalOpen}
        feature="featured_offer"
      />
    </>
  );
};

export default OfferCard;