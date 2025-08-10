import React from 'react';
import { Tag, MapPin, Clock, Eye, MessageCircle, DollarSign } from 'lucide-react';

const ListingInfo = ({ listing, formatDate }) => {
  return (
    <>
      <h1 className="text-3xl md:text-4xl font-bold text-gradient mb-3">{listing.title}</h1>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-slate-400 mb-6">
        <span className="flex items-center"><Tag className="w-4 h-4 mr-1.5 text-primary" /> {listing.category}</span>
        <span className="flex items-center"><MapPin className="w-4 h-4 mr-1.5 text-primary" /> {listing.location}</span>
        <span className="flex items-center"><Clock className="w-4 h-4 mr-1.5 text-primary" /> {formatDate(listing.created_at)}</span>
      </div>
      
      <p className="text-slate-300 leading-relaxed mb-8 whitespace-pre-wrap">{listing.description}</p>

      <div className="flex flex-col sm:flex-row items-center justify-between text-sm text-slate-400 border-t border-slate-700 pt-6">
        <div className="flex items-center space-x-5 mb-4 sm:mb-0">
          <span className="flex items-center"><Eye className="w-5 h-5 mr-1.5 text-primary/80" /> {listing.views_count || 0} Görüntülenme</span>
          <span className="flex items-center"><MessageCircle className="w-5 h-5 mr-1.5 text-primary/80" /> {listing.offers_count || 0} Teklif</span>
        </div>
        <div className="text-3xl font-bold text-gradient">
          <DollarSign className="w-7 h-7 inline relative -top-0.5 mr-1" />
          {(listing.budget || 0).toLocaleString()} ₺
        </div>
      </div>
    </>
  );
};

export default ListingInfo;