'use client'

import React, { useRef, useState, useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Upload, Star as StarIcon, CheckCircle, Trash2, Search, Crown, Pencil, Image as ImageIcon } from 'lucide-react'
import { toast } from '@/components/ui/use-toast'
import { useAuthStore } from '@/stores'
import { compressImage } from '@/lib/imageUtils'
import OptimizedImage from '@/components/OptimizedImage'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import StockImageSearchModal from '@/components/CreateListing/StockImageSearchModal'

const MAX_IMAGES_DEFAULT = 5
const MAX_FILE_SIZE_MB_DEFAULT = 2

interface ImagesStepProps {
  formData: any[]
  mainImageIndex: number
  onChange: (newImages: any[]) => void
  onSetMainImage: (index: number) => void
  onNext: () => void
  onBack: () => void
  selectedCategoryName?: string
}

export default function ImagesStep({ formData, mainImageIndex, onChange, onSetMainImage, onNext, onBack, selectedCategoryName }: ImagesStepProps) {
  console.log('🔄 [IMAGESSTEP] Component rendered with formData:', formData)
  
  const [isProcessing, setIsProcessing] = useState(false)
  const [isStockModalOpen, setIsStockModalOpen] = useState(false)
  const { currentUser } = useAuthStore()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // formData is already the images array (old system approach)
  const images = Array.isArray(formData) ? formData : []
  
  console.log('🔄 [IMAGESSTEP] formData type:', typeof formData, 'isArray:', Array.isArray(formData))
  console.log('🔄 [IMAGESSTEP] formData:', formData)
  console.log('🔄 [IMAGESSTEP] images:', images)

  const handleImageFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    if (files.length === 0) return

    const newImageCount = images.length + files.length
    const maxImages = getMaxImagesForUser()
    
    if (newImageCount > maxImages) {
      toast({
        title: "Görsel Limiti Aşıldı!",
        description: `En fazla ${maxImages} görsel yükleyebilirsiniz.`,
        variant: "destructive"
      })
      return
    }

    setIsProcessing(true)
    toast({
      title: "Görseller optimize ediliyor...",
      description: "Lütfen bekleyin."
    })

    try {
      const compressedFiles = await Promise.all(files.map(file => compressImage(file)))
      const newPreviews = await Promise.all(compressedFiles.map(file => 
        new Promise<string>((resolve) => {
          const reader = new FileReader()
          reader.onloadend = () => resolve(reader.result as string)
          reader.readAsDataURL(file)
        })
      ))

      // Create new images array (old system approach)
      const newImages = [...images]
      compressedFiles.forEach(file => {
        const reader = new FileReader()
        reader.onloadend = () => {
          newImages.push({ 
            file: file, 
            preview: reader.result, 
            name: file.name, 
            isUploaded: false 
          })
          onChange(newImages)
        }
        reader.readAsDataURL(file)
      })

      toast({
        title: "Görseller eklendi!",
        description: `${compressedFiles.length} görsel başarıyla optimize edildi ve eklendi.`
      })
    } catch (error) {
      toast({
        title: "Hata",
        description: "Görseller işlenirken bir hata oluştu.",
        variant: "destructive"
      })
    } finally {
      setIsProcessing(false)
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleRemoveImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index)
    onChange(newImages)
  }

  const handleSetMainImage = (index: number) => {
    onSetMainImage(index)
  }

  const getMaxImagesForUser = () => {
    return images.length <= 2 ? 2 : 5
  }

  const userMaxImages = getMaxImagesForUser()
  const showPremiumHint = images.length >= 2 && userMaxImages === 2

  // Generate search query from form data
  const searchQuery = useMemo(() => {
    const parts = [selectedCategoryName].filter(Boolean)
    return parts.join(' ')
  }, [selectedCategoryName])

  const handleStockImageSelect = async (selectedImages: any[]) => {
    if (selectedImages.length === 0) return

    const availableSlots = userMaxImages - images.length
    if (availableSlots <= 0) {
      toast({
        title: "Görsel Limiti Dolu",
        variant: "destructive"
      })
      return
    }

    const imagesToProcess = selectedImages.slice(0, availableSlots)
    toast({
      title: "Görseller İndiriliyor ve Optimize Ediliyor...",
      description: "Lütfen bekleyin."
    })

    try {
      const newImageObjects = await Promise.all(
        imagesToProcess.map(async (img) => {
          try {
            console.log('🔄 [STOCK] Processing image:', img.id)
            // Use download link with CORS-friendly parameters
            const downloadUrl = `${img.urls.regular}&fm=jpg&fit=max&w=1920`
            const response = await fetch(downloadUrl, {
              mode: 'cors',
              credentials: 'omit'
            })
            
            if (!response.ok) {
              throw new Error(`Failed to download image: ${response.status}`)
            }
            
            const blob = await response.blob()
            const file = new File([blob], `${img.id}.jpg`, { type: 'image/jpeg' })
            const compressedFile = await compressImage(file)
            const preview = URL.createObjectURL(compressedFile)
            
            console.log('✅ [STOCK] Image processed:', { 
              id: img.id, 
              fileName: compressedFile.name, 
              fileSize: compressedFile.size,
              previewUrl: preview.substring(0, 50) + '...'
            })
            return { file: compressedFile, preview, name: compressedFile.name, isUploaded: false }
          } catch (error) {
            console.error('❌ [STOCK] Error processing stock image:', error)
            return null
          }
        })
      )

      const validImages = newImageObjects.filter(Boolean)
      const newImages = [...images, ...validImages]

      console.log('🔄 [STOCK] Before update (old system):', { 
        currentImages: images.length,
        newImages: newImages.length,
        validImages: validImages.length
      })

      onChange(newImages)

      toast({
        title: "Stok Görseller Eklendi",
        description: "Seçilen görseller başarıyla eklendi."
      })
    } catch (error) {
      console.error('Stock image processing error:', error)
      toast({
        title: "Hata",
        description: "Stok görselleri işlenirken bir hata oluştu.",
        variant: "destructive"
      })
    }
  }

  const isFormValid = images.length > 0

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      {/* Progress Bar */}
      <div className="mb-12">
        <div className="flex items-center justify-between mb-6 overflow-x-auto">
          {[1, 2, 3, 4, 5, 6].map((step) => (
            <div key={step} className="flex items-center flex-shrink-0">
              <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center text-xs md:text-sm font-bold transition-all duration-300 ${
                step <= 4 
                  ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg ring-2 ring-blue-200' 
                  : 'bg-gray-200 text-gray-500'
              }`}>
                {step < 4 ? '✓' : step === 4 ? '4' : step}
              </div>
              {step < 6 && (
                <div className={`w-12 md:w-20 h-2 mx-2 md:mx-3 rounded-full transition-all duration-300 ${
                  step < 4 ? 'bg-gradient-to-r from-blue-500 to-indigo-600' : 'bg-gray-200'
                }`} />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-between text-xs md:text-sm font-medium text-gray-600 overflow-x-auto">
          <span className="text-green-600 flex-shrink-0 font-semibold">✓ Kategori</span>
          <span className="text-green-600 flex-shrink-0 font-semibold">✓ Detaylar</span>
          <span className="text-green-600 flex-shrink-0 font-semibold">✓ Özellikler</span>
          <span className="text-blue-600 flex-shrink-0 font-semibold">Görseller</span>
          <span className="text-gray-500 flex-shrink-0">Konum</span>
          <span className="text-gray-500 flex-shrink-0">Onay</span>
        </div>
      </div>

      {selectedCategoryName && (
        <div className="mb-4">
          <div className="flex items-center gap-2 rounded-md border bg-muted/30 px-3 py-2 text-sm text-muted-foreground w-fit">
            <span className="inline-flex items-center gap-2">
              <span className="opacity-80">Seçilen Kategori:</span>
              <Badge variant="secondary">{selectedCategoryName}</Badge>
            </span>
          </div>
        </div>
      )}

      <div className="space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Görsel Ekleyin
          </h1>
          <p className="text-sm md:text-base text-muted-foreground">
            İlanınız için en az 1, en fazla {userMaxImages} görsel ekleyin
          </p>
        </div>

        <Card className="border-2 shadow-lg">
          <CardContent className="space-y-6 p-6 md:p-8">
            {/* Image Counter & Premium Badge */}
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                  <ImageIcon className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-semibold text-sm">Yüklenen Görseller</p>
                  <p className="text-2xl font-bold text-blue-600">{images.length} / {userMaxImages}</p>
                </div>
              </div>
              {showPremiumHint && (
                <Badge variant="outline" className="bg-gradient-to-r from-yellow-400 to-orange-400 text-white border-0 px-4 py-2 shadow-md">
                  <Crown className="w-4 h-4 mr-2" />
                  Premium ile +3 görsel
                </Badge>
              )}
            </div>

            {/* Image Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {images.map((img, index) => (
                <div key={index} className="relative group aspect-square rounded-xl overflow-hidden">
                  {/* Main Image Badge */}
                  {mainImageIndex === index && (
                    <div className="absolute top-2 right-2 z-10 bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-2 py-1 rounded-full text-xs font-bold shadow-lg flex items-center gap-1 animate-pulse">
                      <StarIcon className="w-3 h-3 fill-current" />
                      ANA
                    </div>
                  )}
                  
                  {/* Image Preview */}
                  <OptimizedImage 
                    src={img.preview} 
                    alt={`Önizleme ${index + 1}`} 
                    className="w-full h-full object-cover border-2 border-gray-200 dark:border-gray-700 group-hover:border-blue-500 transition-all duration-300"
                    sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 20vw"
                    quality={90}
                    priority={false}
                  />
                  
                  {/* Hover Overlay with Actions */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300">
                    <div className="absolute bottom-2 left-2 right-2 flex items-center justify-center gap-2">
                      <Button 
                        type="button" 
                        variant="secondary" 
                        size="icon" 
                        className="h-8 w-8 bg-white/90 hover:bg-white shadow-lg" 
                        title="Düzenle"
                      >
                        <Pencil className="w-4 h-4 text-blue-600" />
                      </Button>
                      <Button 
                        type="button" 
                        variant="destructive" 
                        size="icon" 
                        onClick={() => handleRemoveImage(index)} 
                        className="h-8 w-8 shadow-lg" 
                        title="Sil"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                      <Button 
                        type="button" 
                        variant={mainImageIndex === index ? "default" : "secondary"} 
                        size="icon" 
                        onClick={() => handleSetMainImage(index)} 
                        className={`h-8 w-8 shadow-lg ${mainImageIndex === index ? 'bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600' : 'bg-white/90 hover:bg-white'}`}
                        title="Ana görsel yap"
                      >
                        {mainImageIndex === index ? (
                          <CheckCircle className="w-4 h-4 text-white" />
                        ) : (
                          <StarIcon className="w-4 h-4 text-yellow-500" />
                        )}
                      </Button>
                    </div>
                  </div>
                  
                  {/* Image Number Badge */}
                  <div className="absolute top-2 left-2 bg-black/70 text-white px-2 py-0.5 rounded-full text-xs font-semibold">
                    #{index + 1}
                  </div>
                </div>
              ))}
              
              {/* Upload Button */}
              {images.length < userMaxImages && (
                <button 
                  type="button" 
                  onClick={() => fileInputRef.current?.click()} 
                  disabled={isProcessing}
                  className="w-full aspect-square flex flex-col items-center justify-center border-3 border-dashed border-blue-400 dark:border-blue-600 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950 hover:border-blue-600 dark:hover:border-blue-400 rounded-xl transition-all duration-300 group/upload disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessing ? (
                    <>
                      <LoadingSpinner size="md" className="mb-2 text-blue-600" />
                      <span className="text-xs font-semibold">İşleniyor...</span>
                    </>
                  ) : (
                    <>
                      <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full mb-2 group-hover/upload:scale-110 transition-transform duration-300">
                        <Upload className="w-6 h-6" />
                      </div>
                      <span className="text-sm font-semibold">Görsel Yükle</span>
                      <span className="text-xs text-muted-foreground mt-1">JPG, PNG, WEBP</span>
                    </>
                  )}
                </button>
              )}
              
              {/* Premium Hint Card */}
              {showPremiumHint && (
                <div className="w-full aspect-square flex flex-col items-center justify-center border-3 border-dashed border-yellow-400/60 dark:border-yellow-500/60 bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-950/30 dark:to-orange-950/30 rounded-xl p-4 relative overflow-hidden">
                  {/* Background Pattern */}
                  <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-2 right-2">
                      <Crown className="w-12 h-12 text-yellow-400 rotate-12" />
                    </div>
                    <div className="absolute bottom-2 left-2">
                      <Crown className="w-8 h-8 text-yellow-400 -rotate-12" />
                    </div>
                  </div>
                  
                  {/* Content */}
                  <div className="relative z-10 text-center">
                    <div className="p-3 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full inline-flex mb-2">
                      <Crown className="w-6 h-6 text-white" />
                    </div>
                    <p className="text-sm font-bold text-yellow-700 dark:text-yellow-400">Premium</p>
                    <p className="text-xs text-yellow-600 dark:text-yellow-500 mt-1">+3 Görsel Ekleyin</p>
                  </div>
                </div>
              )}
            </div>
            
            {/* Empty State */}
            {images.length === 0 && (
              <div className="text-center py-12 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl bg-gray-50/50 dark:bg-gray-900/50">
                <div className="flex flex-col items-center gap-4">
                  <div className="p-4 bg-blue-100 dark:bg-blue-900 rounded-full">
                    <ImageIcon className="w-12 h-12 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-lg font-semibold mb-1">Henüz görsel eklemediniz</p>
                    <p className="text-sm text-muted-foreground">Bilgisayarınızdan yükleyin veya stok görsel arayın</p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button 
                      type="button" 
                      onClick={() => fileInputRef.current?.click()}
                      size="lg"
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                    >
                      <Upload className="w-5 h-5 mr-2" />
                      Bilgisayardan Yükle
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline"
                      size="lg"
                      onClick={() => setIsStockModalOpen(true)}
                      className="border-2 border-blue-500 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950"
                    >
                      <Search className="w-5 h-5 mr-2" />
                      Stok Görsel Ara
                    </Button>
                  </div>
                </div>
              </div>
            )}

            <input 
              type="file" 
              accept="image/jpeg,image/png,image/webp" 
              multiple 
              ref={fileInputRef} 
              onChange={handleImageFileChange} 
              className="hidden" 
            />
            
            {/* Stock Image Search Button */}
            {images.length > 0 && images.length < userMaxImages && (
              <div className="flex justify-center">
                <Button 
                  type="button" 
                  variant="outline" 
                  size="lg" 
                  onClick={() => setIsStockModalOpen(true)}
                  className="border-2 border-blue-500 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950 shadow-md group"
                >
                  <Search className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                  <span className="font-semibold">Stok Görsel Ara</span>
                  <Badge variant="secondary" className="ml-2">
                    Unsplash
                  </Badge>
                </Button>
              </div>
            )}
            
            {/* Info Cards */}
            {images.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-full">
                    <ImageIcon className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Toplam Görsel</p>
                    <p className="text-lg font-bold text-blue-600">{images.length} / {userMaxImages}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-4 bg-yellow-50 dark:bg-yellow-950 rounded-lg border border-yellow-200 dark:border-yellow-800">
                  <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-full">
                    <StarIcon className="w-5 h-5 text-yellow-600 fill-current" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Ana Görsel</p>
                    <p className="text-lg font-bold text-yellow-600">#{mainImageIndex + 1}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
                  <div className="p-2 bg-green-100 dark:bg-green-900 rounded-full">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Kalan Slot</p>
                    <p className="text-lg font-bold text-green-600">{userMaxImages - images.length}</p>
                  </div>
                </div>
              </div>
            )}

          {/* Navigation Buttons */}
          <div className="flex flex-col sm:flex-row justify-between gap-4 pt-6 border-t">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onBack}
              size="lg"
              className="w-full sm:w-auto group"
            >
              <span className="group-hover:-translate-x-1 transition-transform inline-block mr-2">←</span>
              <span className="font-semibold">Geri</span>
            </Button>
            <Button 
              onClick={onNext} 
              disabled={!isFormValid}
              size="lg"
              className="w-full sm:w-auto bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              <span className="font-semibold">Sonraki Adım</span>
              <span className="group-hover:translate-x-1 transition-transform inline-block ml-2">→</span>
            </Button>
          </div>
        </CardContent>
      </Card>
      </div>

      <StockImageSearchModal
        isOpen={isStockModalOpen}
        onOpenChange={setIsStockModalOpen}
        onImagesSelect={handleStockImageSelect}
        initialSearchQuery={searchQuery}
      />
    </div>
  )
}
