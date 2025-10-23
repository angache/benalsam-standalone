'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from '@/components/ui/use-toast'
import { searchUnsplashImages } from '@/services/unsplashService'
import { Loader2, Search, CheckCircle } from 'lucide-react'
import OptimizedImage from '@/components/OptimizedImage'

interface StockImageSearchModalProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onImagesSelect: (images: any[]) => void
  initialSearchQuery?: string
}

export default function StockImageSearchModal({ 
  isOpen, 
  onOpenChange, 
  onImagesSelect, 
  initialSearchQuery = '' 
}: StockImageSearchModalProps) {
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery)
  const [images, setImages] = useState<any[]>([])
  const [selectedImages, setSelectedImages] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)

  useEffect(() => {
    if (initialSearchQuery && isOpen) {
      setSearchQuery(initialSearchQuery)
      handleSearch()
    }
  }, [initialSearchQuery, isOpen])

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) {
      toast({
        title: 'Arama terimi girin',
        description: 'Lütfen aramak için bir şeyler yazın.',
        variant: 'destructive'
      })
      return
    }
    setIsLoading(true)
    setHasSearched(true)
    setImages([])
    setSelectedImages([])
    
    try {
      const results = await searchUnsplashImages(searchQuery)
      setImages(results)
      if (results.length === 0) {
        toast({
          title: 'Sonuç bulunamadı',
          description: 'Farklı bir arama terimi deneyin.'
        })
      }
    } catch (error: any) {
      toast({
        title: 'Arama Hatası',
        description: error.message,
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }, [searchQuery])

  const toggleImageSelection = (image: any) => {
    setSelectedImages(prev => {
      if (prev.find(img => img.id === image.id)) {
        return prev.filter(img => img.id !== image.id)
      } else {
        return [...prev, image]
      }
    })
  }

  const handleConfirmSelection = () => {
    onImagesSelect(selectedImages)
    onOpenChange(false)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Stok Görsel Arama
          </DialogTitle>
          <DialogDescription>
            Unsplash'tan ücretsiz stok görseller arayın ve seçin.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Arama terimi girin (örn: iPhone, laptop, araba...)"
              className="flex-1"
            />
            <Button onClick={handleSearch} disabled={isLoading || !searchQuery.trim()}>
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
            </Button>
          </div>

          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin" />
              <span className="ml-2">Görseller aranıyor...</span>
            </div>
          )}

          {hasSearched && !isLoading && images.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Sonuç bulunamadı</p>
              <p className="text-sm">Farklı bir arama terimi deneyin</p>
            </div>
          )}

          {images.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-h-96 overflow-y-auto">
              {images.map((image, index) => {
                const isSelected = selectedImages.find(img => img.id === image.id)
                return (
                  <div
                    key={`${image.id}-${index}`}
                    className={`relative aspect-square cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                      isSelected 
                        ? 'border-primary ring-2 ring-primary/50' 
                        : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => toggleImageSelection(image)}
                  >
                    <OptimizedImage
                      src={image.urls.small}
                      alt={image.description || 'Stok görsel'}
                      className="w-full h-full object-cover"
                      sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    />
                    {isSelected && (
                      <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                        <CheckCircle className="w-8 h-8 text-primary fill-current" />
                      </div>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-2">
                      <p className="truncate">{image.description || 'Görsel'}</p>
                      <p className="text-xs opacity-75">by {image.user.name}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <DialogFooter className="flex justify-between">
          <div className="text-sm text-muted-foreground">
            {selectedImages.length > 0 && (
              <span>{selectedImages.length} görsel seçildi</span>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              İptal
            </Button>
            <Button 
              onClick={handleConfirmSelection} 
              disabled={selectedImages.length === 0}
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Seçilenleri Ekle ({selectedImages.length})
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
