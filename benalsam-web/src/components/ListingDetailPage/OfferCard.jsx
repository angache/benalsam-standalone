import React from 'react';
import { Link } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from '@/components/ui/button';
import { Package, ExternalLink, MessageSquare as MessageSquareIcon } from 'lucide-react';

const OfferCard = ({ offer, isOwner, isListingInTransaction, currentUser, handleUpdateOfferStatus, handleStartOrGoToConversation, handleViewOfferedItem, getStatusColor, formatDate, updatingOfferId }) => {
  return (
    <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700">
      <div className="flex items-center justify-between mb-2">
        <Link to={`/profil/${offer.user.id}`} className="flex items-center space-x-2 group">
          <Avatar className="h-8 w-8 border border-primary/50">
            <AvatarImage src={offer.user.avatar_url} alt={offer.user.name} />
            <AvatarFallback className="text-xs bg-slate-600">{offer.user.name?.charAt(0)}</AvatarFallback>
          </Avatar>
          <span className="text-sm font-medium text-slate-300 group-hover:text-primary">{offer.user.name}</span>
        </Link>
        <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${getStatusColor(offer.status)}`}>
          {offer.status?.charAt(0).toUpperCase() + offer.status?.slice(1) || 'Bilinmiyor'}
        </span>
      </div>
      {offer.offered_item && (
        <div className="mb-2 p-2 bg-slate-700/40 rounded-md flex items-center gap-2">
          <Avatar className="w-10 h-10 rounded-md">
            <AvatarImage src={offer.offered_item.main_image_url || offer.offered_item.image_url} alt={offer.offered_item.name} />
            <AvatarFallback className="rounded-md bg-muted"><Package className="w-5 h-5 text-muted-foreground" /></AvatarFallback>
          </Avatar>
          <div>
            <Button 
              variant="link" 
              className="p-0 h-auto text-xs font-medium text-slate-200 hover:text-primary text-left"
              onClick={() => handleViewOfferedItem(offer.offered_item)}
            >
              {offer.offered_item.name || "Ürün Adı Yok"} <ExternalLink className="w-3 h-3 ml-1 opacity-70" />
            </Button>
            {offer.offered_price > 0 && <p className="text-xs text-primary/80">+ {offer.offered_price.toLocaleString()} ₺</p>}
          </div>
        </div>
      )}
      {!offer.offered_item && offer.offered_price > 0 && (
         <p className="text-sm text-primary/90 mb-2">Sadece nakit teklif: {offer.offered_price.toLocaleString()} ₺</p>
      )}
      <p className="text-sm text-slate-300 whitespace-pre-wrap mb-2">{offer.message}</p>
      <p className="text-xs text-slate-500 text-right">{formatDate(offer.created_at)}</p>
      
      {isOwner && offer.status === 'pending' && (
          <div className="mt-3 flex gap-2">
              <Button 
                size="sm" 
                variant="outline" 
                className="text-xs border-green-500/50 text-green-400 hover:bg-green-500/10 flex-1"
                onClick={() => handleUpdateOfferStatus(offer.id, 'accepted', offer.offering_user_id)}
                disabled={updatingOfferId === offer.id || isListingInTransaction}
              >
                Kabul Et
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                className="text-xs border-red-500/50 text-red-400 hover:bg-red-500/10 flex-1"
                onClick={() => handleUpdateOfferStatus(offer.id, 'rejected', offer.offering_user_id)}
                disabled={updatingOfferId === offer.id || isListingInTransaction}
              >
                Reddet
              </Button>
          </div>
      )}
       <Button 
          variant="outline" 
          size="sm" 
          onClick={() => handleStartOrGoToConversation(offer)}
          className="w-full mt-2 border-blue-500/50 text-blue-400 hover:bg-blue-500/10"
        >
          <MessageSquareIcon className="w-3.5 h-3.5 mr-1.5" /> 
          {offer.conversation_id ? 'Sohbete Git' : 'Mesaj Gönder'}
        </Button>
    </div>
  );
};

export default OfferCard;