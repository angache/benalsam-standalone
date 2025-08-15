import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabaseClient';
import { toast } from '@/components/ui/use-toast';
import useEmblaCarousel from 'embla-carousel-react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import OptimizedImage from '@/components/OptimizedImage';

const AdBanner = ({ placement, format = 'static', className }) => {
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });

  useEffect(() => {
    const fetchAds = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('advertisements')
        .select('*')
        .eq('placement', placement)
        .eq('is_active', true)
        .or(`start_date.is.null,start_date.lte.${new Date().toISOString()}`)
        .or(`end_date.is.null,end_date.gte.${new Date().toISOString()}`);

      if (error) {
        console.error('Error fetching ads:', error);
        toast({
          title: 'Reklamlar Yüklenemedi',
          description: 'Reklamlar yüklenirken bir hata oluştu.',
          variant: 'destructive',
        });
      } else {
        setAds(data);
      }
      setLoading(false);
    };

    fetchAds();
  }, [placement]);

  const handleAdClick = async (adId) => {
    await supabase.rpc('increment_ad_clicks', { ad_id: adId });
  };

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  if (loading) {
    return (
      <div className={cn("w-full h-24 bg-muted/50 animate-pulse rounded-lg my-4", className)}></div>
    );
  }

  if (!ads || ads.length === 0) {
    return null;
  }

  const renderAd = (ad) => (
    <motion.div
      key={ad.id}
      className="flex-shrink-0 w-full h-full"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <a
        href={ad.link_url}
        target="_blank"
        rel="noopener noreferrer sponsored"
        onClick={() => handleAdClick(ad.id)}
        className="block w-full h-full"
      >
        <OptimizedImage 
          src={ad.image_url}
          alt={ad.title}
          className="w-full h-full object-cover rounded-lg"
          loading="lazy"
          sizes="100vw"
        />
      </a>
    </motion.div>
  );

  if (format === 'carousel' && ads.length > 1) {
    return (
      <div className={cn("relative my-6 overflow-hidden rounded-lg group", className)}>
        <div ref={emblaRef} className="h-full">
          <div className="flex h-full">
            {ads.map(renderAd)}
          </div>
        </div>
        <button
          onClick={scrollPrev}
          className="absolute left-2 top-1/2 -translate-y-1/2 bg-background/50 hover:bg-background/80 text-foreground rounded-full p-2 transition-opacity opacity-0 group-hover:opacity-100"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <button
          onClick={scrollNext}
          className="absolute right-2 top-1/2 -translate-y-1/2 bg-background/50 hover:bg-background/80 text-foreground rounded-full p-2 transition-opacity opacity-0 group-hover:opacity-100"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
        <span className="absolute bottom-2 right-2 text-xs bg-black/50 text-white px-2 py-1 rounded">Reklam</span>
      </div>
    );
  }

  return (
    <div className={cn("my-6 rounded-lg relative", className)}>
      {renderAd(ads[0])}
      <span className="absolute bottom-2 right-2 text-xs bg-black/50 text-white px-2 py-1 rounded">Reklam</span>
    </div>
  );
};

export default AdBanner;