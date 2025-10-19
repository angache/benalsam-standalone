'use client';

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
      <div className={cn("relative my-6 overflow-hidden rounded-lg bg-gradient-to-r from-primary/5 to-secondary/5 border border-border/30", className)}>
        <div className="flex items-center justify-center h-full p-6">
          <div className="text-center animate-pulse">
            <div className="h-4 bg-muted rounded w-48 mx-auto mb-2"></div>
            <div className="h-3 bg-muted rounded w-32 mx-auto mb-4"></div>
            <div className="flex gap-2 justify-center">
              <div className="h-6 bg-muted rounded-full w-12"></div>
              <div className="h-6 bg-muted rounded-full w-16"></div>
              <div className="h-6 bg-muted rounded-full w-14"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!ads || ads.length === 0) {
    // Fallback content when no ads are available
    return (
      <div className={cn("relative my-6 overflow-hidden rounded-lg bg-gradient-to-r from-primary/10 to-secondary/10 border border-border/50", className)}>
        <div className="flex items-center justify-center h-full p-6">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-foreground mb-2">
              İhtiyacınız Olan Ürünü Bulun
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Binlerce kullanıcı ile bağlantı kurun ve en iyi fiyatları bulun
            </p>
            <div className="flex gap-2 justify-center">
              <span className="px-3 py-1 bg-primary/20 text-primary rounded-full text-xs font-medium">
                Hızlı
              </span>
              <span className="px-3 py-1 bg-secondary/20 text-secondary rounded-full text-xs font-medium">
                Güvenli
              </span>
              <span className="px-3 py-1 bg-green-500/20 text-green-600 rounded-full text-xs font-medium">
                Ücretsiz
              </span>
            </div>
          </div>
        </div>
      </div>
    );
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