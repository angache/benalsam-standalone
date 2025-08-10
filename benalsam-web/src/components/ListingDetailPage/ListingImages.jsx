import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import OptimizedImage from '@/components/OptimizedImage';

const ListingImages = ({ 
  images, 
  title, 
  urgency, 
  currentImageIndex, 
  setCurrentImageIndex, 
  getUrgencyColor,
  isFavorited,
  onToggleFavorite,
  showFavoriteButton
}) => {

  const nextImage = (e) => {
    e.stopPropagation();
    setCurrentImageIndex((prevIndex) => (prevIndex + 1) % images.length);
  };

  const prevImage = (e) => {
    e.stopPropagation();
    setCurrentImageIndex((prevIndex) => (prevIndex - 1 + images.length) % images.length);
  };

  const handleFavoriteClick = (e) => {
    e.stopPropagation();
    if (onToggleFavorite) {
        onToggleFavorite();
    }
  };
  
  const currentImageUrl = images && images.length > 0 && images[currentImageIndex] 
    ? images[currentImageIndex]
    : `https://source.unsplash.com/random/800x600/?${title?.replace(/\s/g, '+') || 'product'}&sig=${Math.random()}`;


  return (
    <div className="relative mb-6">
      <AnimatePresence initial={false} mode="wait">
        <motion.div
          key={currentImageIndex}
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -100 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="aspect-[16/10] md:aspect-[16/9] w-full overflow-hidden rounded-xl shadow-lg relative"
        >
          <OptimizedImage 
            src={currentImageUrl}
            alt={`${title} - Resim ${currentImageIndex + 1}`}
            className="w-full h-full object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 80vw, 60vw"
            quality={90}
            priority={true}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none"></div>
          <div className={`absolute top-3 left-3 px-3 py-1 rounded-md text-sm font-semibold text-white shadow-md ${getUrgencyColor(urgency)}`}>
            {urgency}
          </div>
          {showFavoriteButton && (
             <Button
                variant="ghost"
                size="icon"
                className="absolute top-3 right-3 text-white hover:text-red-500 hover:bg-black/50 rounded-full p-2 transition-colors z-10"
                onClick={handleFavoriteClick}
                aria-label={isFavorited ? "Favorilerden kaldır" : "Favorilere ekle"}
            >
                <Heart className={cn("w-6 h-6", isFavorited ? "fill-red-500 text-red-500" : "text-white")} />
            </Button>
          )}
        </motion.div>
      </AnimatePresence>

      {images && images.length > 1 && (
        <>
          <Button
            variant="ghost"
            size="icon"
            onClick={prevImage}
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white rounded-full p-2 z-10 backdrop-blur-sm"
          >
            <ChevronLeft className="w-6 h-6" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={nextImage}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white rounded-full p-2 z-10 backdrop-blur-sm"
          >
            <ChevronRight className="w-6 h-6" />
          </Button>
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2 z-10">
            {images.map((_, index) => (
              <button
                key={index}
                onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(index);}}
                className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                  currentImageIndex === index ? 'bg-white scale-125' : 'bg-white/50 hover:bg-white/75'
                }`}
                aria-label={`Resim ${index + 1}'e git`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default ListingImages;