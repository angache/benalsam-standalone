import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Search, CheckCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/use-toast';
import { searchUnsplashImages } from '@/services/unsplashService';
import OptimizedImage from '@/components/OptimizedImage';

const StockImageSearchPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialQuery = searchParams.get('query') || '';
  
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [images, setImages] = useState([]);
  const [selectedImages, setSelectedImages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    if (initialQuery) {
      handleSearch();
    }
  }, []);

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) {
      toast({ title: 'Arama terimi girin', description: 'Lütfen aramak için bir şeyler yazın.', variant: 'destructive' });
      return;
    }
    setIsLoading(true);
    setHasSearched(true);
    setImages([]);
    setSelectedImages([]);
    try {
      const results = await searchUnsplashImages(searchQuery);
      setImages(results);
      if (results.length === 0) {
        toast({ title: 'Sonuç bulunamadı', description: 'Farklı bir arama terimi deneyin.' });
      }
    } catch (error) {
      toast({ title: 'Arama Hatası', description: error.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery]);

  const toggleImageSelection = (image) => {
    setSelectedImages(prev => {
      if (prev.find(img => img.id === image.id)) {
        return prev.filter(img => img.id !== image.id);
      } else {
        return [...prev, image];
      }
    });
  };

  const handleConfirmSelection = () => {
    toast({ 
      title: "🚧 Özellik Geliştiriliyor", 
      description: "Stok görsel seçimi özelliği yakında eklenecek! 🚀",
      duration: 3000
    });
    navigate(-1);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-6xl mx-auto px-4 py-8"
    >
      <div className="flex items-center mb-8">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="mr-4 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-6 h-6" />
        </Button>
        <h1 className="text-2xl font-bold text-gradient">Stok Görsel Bul</h1>
      </div>

      <div className="glass-effect rounded-2xl p-6">
        <p className="text-muted-foreground mb-6">
          İlanınız için ücretsiz stok görseller arayın. Arama yapmak için ilan başlığı ve kategorisi kullanıldı.
        </p>
        
        <div className="flex gap-2 mb-6">
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Örn: Mavi bisiklet, modern koltuk..."
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="bg-input border-border"
          />
          <Button onClick={handleSearch} disabled={isLoading}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            <span className="ml-2 hidden sm:inline">Ara</span>
          </Button>
        </div>

        <div className="min-h-[400px]">
          {isLoading && (
            <div className="flex justify-center items-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}
          
          {!isLoading && images.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {images.map((image) => {
                const isSelected = selectedImages.some(img => img.id === image.id);
                return (
                  <div
                    key={image.id}
                    className="relative group cursor-pointer"
                    onClick={() => toggleImageSelection(image)}
                  >
                    <OptimizedImage
                      src={image.urls.small}
                      alt={image.description}
                      className={`w-full h-40 object-cover rounded-lg transition-all ${isSelected ? 'ring-4 ring-primary ring-offset-2 ring-offset-background' : 'ring-0'}`}
                      sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                      quality={80}
                      priority={false}
                    />
                    {isSelected && (
                      <div className="absolute top-2 right-2 bg-primary rounded-full p-1">
                        <CheckCircle className="h-5 w-5 text-primary-foreground" />
                      </div>
                    )}
                    <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/70 to-transparent p-2 rounded-b-lg opacity-0 group-hover:opacity-100 transition-opacity">
                      <a
                        href={`${image.user.link}?utm_source=benalsam&utm_medium=referral`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-xs text-white hover:underline"
                      >
                        {image.user.name}
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          
          {!isLoading && images.length === 0 && hasSearched && (
            <div className="flex flex-col justify-center items-center h-full text-center text-muted-foreground">
              <p>Aramanız için sonuç bulunamadı.</p>
              <p className="text-sm">Lütfen farklı anahtar kelimelerle tekrar deneyin.</p>
            </div>
          )}
          
          {!isLoading && !hasSearched && (
            <div className="flex flex-col justify-center items-center h-full text-center text-muted-foreground">
              <p>İlanınızla ilgili görseller bulmak için arama yapın.</p>
              <p className="text-sm">Örn: "kırmızı spor araba", "ahşap yemek masası"</p>
            </div>
          )}
        </div>

        {selectedImages.length > 0 && (
          <div className="flex justify-between items-center mt-6 pt-6 border-t border-border/50">
            <p className="text-sm text-muted-foreground">
              {selectedImages.length} görsel seçildi
            </p>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => navigate(-1)}>İptal</Button>
              <Button onClick={handleConfirmSelection} className="btn-primary">
                {selectedImages.length > 0 ? `${selectedImages.length} Görsel Seç` : 'Görsel Seç'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default StockImageSearchPage;