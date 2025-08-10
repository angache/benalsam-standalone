import React from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { MapPin, Clock, Eye, MessageCircle, Star, TrendingUp, DollarSign, Image as ImageIcon, Heart, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from '@/lib/utils';
import { toast } from '@/components/ui/use-toast';
import { formatDate } from 'benalsam-shared-types';
import OptimizedImage from '@/components/OptimizedImage';


const ListingCard = ({ listing, size = 'normal', onToggleFavorite, currentUser, isFavoritedOverride = null }) => {
  const navigate = useNavigate();

  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case 'Acil': return 'bg-red-600 hover:bg-red-700';
      case 'Normal': return 'bg-amber-500 hover:bg-amber-600';
      case 'Acil Değil': return 'bg-green-500 hover:bg-green-600';
      default: return 'bg-slate-500 hover:bg-slate-600';
    }
  };

  
  const cardImageUrl = listing.main_image_url || listing.image_url || `https://source.unsplash.com/random/400x300/?${listing.category?.split(' > ')[0].replace(/\s/g, '+') || 'product'}&sig=${listing.id}`;
  
  const isSmall = size === 'small';
  
  const isFavorited = isFavoritedOverride !== null ? isFavoritedOverride : listing.is_favorited;

  const handleFavoriteClick = (e) => {
    e.stopPropagation();
    e.preventDefault(); 
    if (currentUser && onToggleFavorite) {
      onToggleFavorite(listing.id, !isFavorited);
    } else if (!currentUser) {
      toast({ title: "Giriş Gerekli", description: "Favorilere eklemek için giriş yapmalısınız.", variant: "destructive" });
      navigate('/auth?action=login');
    }
  };

  const handleMakeOfferClick = (e) => {
    e.stopPropagation();
    e.preventDefault();
    
    if (currentUser && listing.user_id === currentUser.id) {
      navigate(`/ilan/${listing.id}`);
    } else if (currentUser) {
      navigate(`/teklif-yap/${listing.id}`);
    } else {
      toast({ title: "Giriş Gerekli", description: "Teklif yapmak için giriş yapmalısınız.", variant: "destructive" });
      navigate('/auth?action=login');
    }
  };

  const getStatusInfo = (status) => {
    switch (status) {
      case 'sold':
        return { text: 'Satıldı', color: 'bg-green-600' };
      case 'inactive':
        return { text: 'Yayında Değil', color: 'bg-slate-600' };
      case 'pending_approval':
        return { text: 'Onay Bekliyor', color: 'bg-yellow-600' };
      case 'rejected':
        return { text: 'Reddedildi', color: 'bg-red-600' };
      default:
        return null;
    }
  };

  const statusInfo = getStatusInfo(listing.status);

  return (
    <motion.div
      whileHover={{ y: -3, boxShadow: "0 8px 15px rgba(255, 107, 53, 0.15), 0 4px 4px rgba(247, 147, 30, 0.1)" }}
      className={cn(
        'listing-card rounded-lg overflow-hidden card-hover group bg-card border border-border transition-all duration-300 ease-out h-full flex flex-col shadow-sm',
        { 'border-2 border-amber-400 shadow-lg shadow-amber-500/10': listing.has_bold_border },
        isSmall ? 'w-56 sm:w-64 min-w-[224px] sm:min-w-[250px] flex-shrink-0' : ''
      )}
    >
      <div className={`relative overflow-hidden ${isSmall ? 'h-32 sm:h-36' : 'h-40 sm:h-48 md:h-56'}`}>
        {statusInfo && (
          <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-10">
            <div className="text-center text-white p-2 sm:p-4">
              <p className="font-bold text-sm sm:text-lg">
                {statusInfo.text}
              </p>
              {listing.status === 'inactive' && listing.deactivation_reason && <p className="text-xs sm:text-sm opacity-80 mt-1">({listing.deactivation_reason})</p>}
              {listing.status === 'rejected' && listing.rejection_reason && <p className="text-xs sm:text-sm opacity-80 mt-1">Neden: {listing.rejection_reason}</p>}
            </div>
          </div>
        )}
        {cardImageUrl ? (
          <OptimizedImage 
            src={cardImageUrl}
            alt={listing.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ease-out"
            sizes={isSmall ? "(max-width: 640px) 224px, 250px" : "(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw"}
            quality={85}
            priority={false}
          />
        ) : (
          <div className="w-full h-full bg-muted flex items-center justify-center">
            <ImageIcon className={`text-muted-foreground ${isSmall ? 'w-8 h-8 sm:w-12 sm:h-12' : 'w-12 h-12 sm:w-16 sm:h-16'}`} />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/10"></div>
        
        <div className="absolute top-1 sm:top-2 left-1 sm:left-2 flex flex-wrap gap-1 z-10">
          <div className={`px-1 sm:px-2 py-0.5 rounded text-xs font-semibold text-white shadow-md transition-colors ${getUrgencyColor(listing.urgency)}`}>
            {listing.urgency}
          </div>
          {listing.is_urgent_premium && (
            <div className="px-1 sm:px-2 py-0.5 rounded text-xs font-semibold text-white shadow-md bg-red-600 flex items-center gap-1">
              <Zap size={10} className="sm:w-3 sm:h-3" /> Acil
            </div>
          )}
          {listing.is_featured && (
            <div className="px-1 sm:px-2 py-0.5 rounded text-xs font-semibold text-white shadow-md bg-purple-600 flex items-center gap-1">
              <Star size={10} className="sm:w-3 sm:h-3" /> Öne Çıkan
            </div>
          )}
          {listing.is_showcase && (
            <div className="px-1 sm:px-2 py-0.5 rounded text-xs font-semibold text-white shadow-md bg-cyan-500 flex items-center gap-1">
              <Eye size={10} className="sm:w-3 sm:h-3" /> Vitrin
            </div>
          )}
        </div>

        {onToggleFavorite && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-1 sm:top-2 right-1 sm:right-2 text-white hover:text-red-500 hover:bg-black/30 rounded-full p-1 sm:p-1.5 transition-colors z-20 w-6 h-6 sm:w-8 sm:h-8"
            onClick={handleFavoriteClick}
            aria-label={isFavorited ? "Favorilerden kaldır" : "Favorilere ekle"}
          >
            <Heart className={cn("w-3 h-3 sm:w-5 sm:h-5", isFavorited ? "fill-red-500 text-red-500" : "text-white")} />
          </Button>
        )}

        {listing.user && !isSmall && (
          <Link 
            to={`/profil/${listing.user.id}`} 
            className="absolute bottom-1 sm:bottom-2 right-1 sm:right-2 flex items-center space-x-1 sm:space-x-1.5 p-1 bg-black/40 hover:bg-black/60 rounded text-xs transition-colors z-20"
            onClick={(e) => e.stopPropagation()}
          >
            <Avatar className="w-4 h-4 sm:w-6 sm:h-6 border border-primary/60">
              <AvatarImage src={listing.user.avatar_url || `https://source.boringavatars.com/beam/30/${listing.user.name?.replace(/\s+/g, '') || 'user'}?colors=ff6b35,f7931e,ff8c42,1a0f0a,2d1810`} alt={listing.user.name} />
              <AvatarFallback className="text-xs bg-muted text-muted-foreground">{listing.user.name?.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex items-center">
              <Star className="w-2 h-2 sm:w-2.5 sm:h-2.5 text-yellow-400 mr-0.5" />
              <span className="text-xs text-white font-medium">{listing.user.rating?.toFixed(1) || 'N/A'}</span>
            </div>
          </Link>
        )}

        <Link to={`/ilan/${listing.id}`} className="absolute inset-0 z-10" aria-label={`${listing.title} detay sayfasına git`} />
      </div>
      
      <div className={`${isSmall ? 'p-2 sm:p-3' : 'p-3 sm:p-4'} flex-1 flex flex-col bg-card`}>
        <h3 className={cn(
          `${isSmall ? 'text-xs sm:text-sm' : 'text-sm sm:text-base'} font-semibold text-card-foreground mb-1 line-clamp-1 group-hover:text-primary transition-colors`,
          { 'font-extrabold text-amber-300': listing.has_bold_border }
        )}>
          {listing.title}
        </h3>
        <span className={`inline-block px-1 sm:px-2 py-0.5 bg-primary/10 text-primary ${isSmall ? 'text-xs' : 'text-xs sm:text-sm'} font-medium rounded-full mb-1 sm:mb-1.5 w-fit`}>
          {listing.category?.split(' > ')[0]}
        </span>

        {!isSmall && (
          <p className="text-muted-foreground text-xs sm:text-sm mb-1 sm:mb-2 line-clamp-2 flex-1">
            {listing.description}
          </p>
        )}

        <div className={`flex items-center justify-between ${isSmall ? 'text-xs' : 'text-xs sm:text-sm'} text-muted-foreground mb-1 sm:mb-2`}>
          <div className="flex items-center min-w-0 flex-1">
            <MapPin className={`${isSmall ? 'w-3 h-3' : 'w-3 h-3 sm:w-3.5 sm:h-3.5'} mr-1 text-primary/80 flex-shrink-0`} />
            <span className="truncate">{listing.location}</span>
          </div>
          <div className="flex items-center ml-2 flex-shrink-0">
            <Clock className={`${isSmall ? 'w-3 h-3' : 'w-3 h-3 sm:w-3.5 sm:h-3.5'} mr-1 text-primary/80`} />
            <span>{formatDate(listing.created_at)}</span>
          </div>
        </div>

        <div className={`flex items-center justify-between ${isSmall ? 'text-xs' : 'text-xs sm:text-sm'} text-muted-foreground mb-2 sm:mb-2.5`}>
          <div className="flex items-center space-x-1 sm:space-x-2">
            <div className="flex items-center">
              <Eye className={`${isSmall ? 'w-3 h-3' : 'w-3 h-3 sm:w-3.5 sm:h-3.5'} mr-0.5 text-primary/80`} />
              <span>{listing.views_count || 0}</span>
            </div>
            <div className="flex items-center">
              <MessageCircle className={`${isSmall ? 'w-3 h-3' : 'w-3 h-3 sm:w-3.5 sm:h-3.5'} mr-0.5 text-primary/80`} />
              <span>{listing.offers_count || 0}</span>
            </div>
            <div className="flex items-center">
              <Heart className={cn(`${isSmall ? 'w-3 h-3' : 'w-3 h-3 sm:w-3.5 sm:h-3.5'} mr-0.5`, isFavorited ? "text-red-500" : "text-primary/80")} />
              <span>{listing.favorites_count || 0}</span>
            </div>
          </div>
          <div className={`${isSmall ? 'text-sm sm:text-base' : 'text-base sm:text-lg'} font-bold text-gradient`}>
            <DollarSign className={`${isSmall ? 'w-3 h-3' : 'w-3 h-3 sm:w-4 sm:h-4'} inline relative -top-px mr-0.5`} />
            {(listing.budget || 0).toLocaleString()}
          </div>
        </div>

        <Button
          onClick={handleMakeOfferClick}
          className={`w-full btn-primary text-primary-foreground font-semibold ${isSmall ? 'py-1 sm:py-1.5 text-xs' : 'py-1.5 sm:py-2 text-xs sm:text-sm'} mt-auto`}
          size={isSmall ? 'sm' : 'default'}
          disabled={(currentUser && listing.user_id === currentUser.id) || listing.status !== 'active'}
        >
          {listing.status !== 'active' ? (
            statusInfo?.text || 'Yayında Değil'
          ) : (
            <>
              <TrendingUp className={`${isSmall ? 'w-3 h-3' : 'w-3 h-3 sm:w-4 sm:h-4'} mr-1 sm:mr-1.5`} />
              {currentUser && listing.user_id === currentUser.id ? "Kendi İlanın" : "Teklif Yap"}
            </>
          )}
        </Button>
      </div>
    </motion.div>
  );
};

export default ListingCard;