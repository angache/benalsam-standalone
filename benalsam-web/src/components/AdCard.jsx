import React from 'react';
import { motion } from 'framer-motion';
import { ExternalLink, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabaseClient';
import OptimizedImage from '@/components/OptimizedImage';
const AdCard = ({ ad }) => {
  const handleAdClick = async (adId) => {
    supabase.rpc('increment_ad_clicks', { ad_id: adId }).then(({ error }) => {
      if (error) console.error('Error incrementing ad clicks:', error);
    });
  };

  return (
    <motion.div
      whileHover={{ y: -3, boxShadow: "0 8px 15px rgba(99, 102, 241, 0.15), 0 4px 4px rgba(129, 140, 248, 0.1)" }}
      className="listing-card rounded-lg overflow-hidden card-hover group bg-slate-800/30 backdrop-blur-md border border-indigo-500/50 transition-all duration-300 ease-out h-full flex flex-col"
    >
      <a href={ad.link_url} target="_blank" rel="noopener noreferrer sponsored" onClick={() => handleAdClick(ad.id)} className="block">
        <div className="relative overflow-hidden h-48 md:h-56">
          <OptimizedImage
            src={ad.image_url}
            alt={ad.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ease-out"
            loading="lazy"
            sizes="(max-width: 768px) 100vw, 300px"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/10"></div>
          
          <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md text-xs font-semibold text-white shadow-md bg-indigo-600 hover:bg-indigo-700 transition-colors">
            <Zap className="w-3 h-3 inline-block mr-1" />
            Sponsorlu
          </div>
        </div>
      </a>
      
      <div className="p-4 flex flex-col flex-grow">
        <a href={ad.link_url} target="_blank" rel="noopener noreferrer sponsored" onClick={() => handleAdClick(ad.id)} className="block flex-grow">
          <h3 className="text-base font-semibold text-white mb-2 line-clamp-2 group-hover:text-indigo-400 transition-colors">
            {ad.title}
          </h3>
          <p className="text-slate-400 text-xs mb-4 line-clamp-2">
            Bu sponsorlu bir içeriktir. Daha fazla bilgi için tıklayın.
          </p>
        </a>

        <Button
          asChild
          className="w-full btn-secondary bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 mt-auto"
        >
          <a href={ad.link_url} target="_blank" rel="noopener noreferrer sponsored" onClick={() => handleAdClick(ad.id)}>
            <ExternalLink className="w-4 h-4 mr-1.5" />
            Daha Fazla Bilgi
          </a>
        </Button>
      </div>
    </motion.div>
  );
};

export default AdCard;