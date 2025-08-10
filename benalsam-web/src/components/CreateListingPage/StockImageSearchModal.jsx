import React, { useState, useCallback, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/use-toast';
import { searchUnsplashImages } from '@/services/unsplashService';
import { Loader2, Search, CheckCircle } from 'lucide-react';

const StockImageSearchModal = ({ isOpen, onOpenChange, onImagesSelect, initialSearchQuery }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [images, setImages] = useState([]);
  const [selectedImages, setSelectedImages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

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
    onImagesSelect(selectedImages);
    onOpenChange(false);
  };
  
  useEffect(() => {
    if (isOpen) {
        setSearchQuery(initialSearchQuery);
        setImages([]);
        setSelectedImages([]);
        setHasSearched(false);
    }
  }, [isOpen, initialSearchQuery]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Stok Görsel Bul</DialogTitle>
          <DialogDescription>
            İlanınız için ücretsiz stok görseller arayın. Arama yapmak için ilan başlığı ve kategorisi kullanıldı.
          </DialogDescription>
        </DialogHeader>
        <div className="flex gap-2">
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Örn: Mavi bisiklet, modern koltuk..."
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <Button onClick={handleSearch} disabled={isLoading}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            <span className="ml-2 hidden sm:inline">Ara</span>
          </Button>
        </div>
        <div className="flex-grow overflow-y-auto -mx-6 px-6 py-4 bg-muted/50 rounded-lg my-4">
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
                    <img
                      src={image.urls.small}
                      alt={image.description}
                      className={`w-full h-40 object-cover rounded-lg transition-all ${isSelected ? 'ring-4 ring-primary ring-offset-2 ring-offset-background' : 'ring-0'}`}
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
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>İptal</Button>
          <Button onClick={handleConfirmSelection} disabled={selectedImages.length === 0}>
            {selectedImages.length > 0 ? `${selectedImages.length} Görsel Seç` : 'Görsel Seç'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default StockImageSearchModal;