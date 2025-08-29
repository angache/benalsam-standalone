import React, { useRef, useState } from 'react';
    import { Button } from '@/components/ui/button';
    import { toast } from '@/components/ui/use-toast';
    import { Upload, Star as StarIcon, CheckCircle, Trash2, Search, Crown, Pencil } from 'lucide-react';
    import { checkImageLimit, showPremiumUpgradeToast } from '@/services/premiumService';
    import { useAuthStore } from '@/stores';
    import { compressImage } from '@/lib/imageUtils';
import ImageEditorModal from '@/components/ImageEditorModal';
import OptimizedImage from '@/components/OptimizedImage';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { SkeletonCard } from '@/components/ui/skeleton';
    
    const MAX_IMAGES_DEFAULT = 5;
    const MAX_FILE_SIZE_MB_DEFAULT = 2;
    
    const ImageUploader = ({ 
  images, 
  onImageChange, 
  onRemoveImage, 
  onSetMainImage, 
  mainImageIndex, 
  errors, 
  disabled,
  maxImages = MAX_IMAGES_DEFAULT,
  onOpenStockModal
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
      const { currentUser } = useAuthStore();
      const fileInputRef = useRef(null);
      const [editorState, setEditorState] = useState({ isOpen: false, image: null, index: -1 });
    
      const handleImageFileChange = async (event) => {
        const files = Array.from(event.target.files);
        if (files.length === 0) return;
    
        const newImageCount = images.length + files.length;
        
        if (currentUser) {
          const canAddImages = await checkImageLimit(currentUser.id, newImageCount);
          if (!canAddImages) {
            const currentLimit = images.length <= 2 ? 2 : 5;
            showPremiumUpgradeToast('image', images.length, currentLimit);
            return;
          }
        }
    
        let currentImageCount = images.length;
        const filesToProcess = [];
    
        for (const file of files) {
          if (currentImageCount >= maxImages) {
            toast({ title: "Görsel Limiti Aşıldı!", description: `En fazla ${maxImages} görsel yükleyebilirsiniz.`, variant: "destructive" });
            break; 
          }
          filesToProcess.push(file);
          currentImageCount++;
        }
        
        if (filesToProcess.length > 0) {
            setIsProcessing(true);
            toast({ title: "Görseller optimize ediliyor...", description: "Lütfen bekleyin." });
            const compressedFiles = await Promise.all(filesToProcess.map(file => compressImage(file)));
    
            const newImagesState = [...images];
            let processedCount = 0;
    
            compressedFiles.forEach(file => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    newImagesState.push({ file: file, preview: reader.result, name: file.name, isUploaded: false });
                    processedCount++;
                    if (processedCount === compressedFiles.length) {
                        onImageChange(newImagesState);
                        toast({ title: "Görseller eklendi!", description: `${processedCount} görsel başarıyla optimize edildi ve eklendi.` });
                        setIsProcessing(false);
                    }
                };
                reader.readAsDataURL(file);
            });
        }
        
        if (fileInputRef.current) {
          fileInputRef.current.value = null;
        }
      };
    
      const handleEditImage = (index) => {
        setEditorState({ isOpen: true, image: images[index], index });
      };
    
      const handleSaveEditedImage = async (editedFile) => {
        const { index } = editorState;
        const compressedFile = await compressImage(editedFile);
        const reader = new FileReader();
        reader.onloadend = () => {
          const newImages = [...images];
          newImages[index] = { file: compressedFile, preview: reader.result, name: compressedFile.name, isUploaded: false };
          onImageChange(newImages);
          toast({ title: "Görsel Güncellendi", description: "Görsel başarıyla düzenlendi ve optimize edildi." });
        };
        reader.readAsDataURL(compressedFile);
        setEditorState({ isOpen: false, image: null, index: -1 });
      };
    
      const getMaxImagesForUser = () => {
        return images.length <= 2 ? 2 : 5;
      };
    
      const userMaxImages = getMaxImagesForUser();
      const showPremiumHint = images.length >= 2 && userMaxImages === 2;
    
      return (
        <div>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 mb-3">
            {images.map((img, index) => (
              <div key={index} className="relative group aspect-square">
                <OptimizedImage 
                  src={img.preview} 
                  alt={`Önizleme ${index + 1}`} 
                  className="w-full h-full object-cover rounded-md border border-border"
                  sizes="(max-width: 640px) 33vw, (max-width: 768px) 25vw, 20vw"
                  quality={90}
                  priority={false}
                />
                {!disabled && (
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-wrap items-center justify-center gap-1 p-1">
                    <Button type="button" variant="secondary" size="icon" onClick={() => handleEditImage(index)} className="h-7 w-7" title="Düzenle">
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button type="button" variant="destructive" size="icon" onClick={() => onRemoveImage(index)} className="h-7 w-7" title="Sil">
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                    <Button type="button" variant={mainImageIndex === index ? "default" : "secondary"} size="icon" onClick={() => onSetMainImage(index)} className="h-7 w-7" title="Ana görsel yap">
                      {mainImageIndex === index ? <CheckCircle className="w-3.5 h-3.5 text-green-400" /> : <StarIcon className="w-3.5 h-3.5" />}
                    </Button>
                  </div>
                )}
                {mainImageIndex === index && (
                  <div className="absolute top-1 right-1 bg-primary text-primary-foreground p-0.5 rounded-full">
                    <StarIcon className="w-3 h-3 fill-current" />
                  </div>
                )}
              </div>
            ))}
            {images.length < userMaxImages && !disabled && (
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => fileInputRef.current && fileInputRef.current.click()} 
                disabled={isProcessing}
                className="w-full aspect-square flex flex-col items-center justify-center border-dashed border-primary/50 text-primary hover:bg-primary/10"
              >
                {isProcessing ? (
                  <>
                    <LoadingSpinner size="sm" className="mb-1" />
                    <span className="text-xs">İşleniyor...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-6 h-6 mb-1" />
                    <span className="text-xs">Yükle</span>
                  </>
                )}
              </Button>
            )}
            {showPremiumHint && (
              <div className="w-full aspect-square flex flex-col items-center justify-center border-2 border-dashed border-yellow-400/50 bg-yellow-400/10 rounded-md">
                <Crown className="w-6 h-6 text-yellow-400 mb-1" />
                <span className="text-xs text-yellow-400 text-center">Premium ile 5'e kadar</span>
              </div>
            )}
          </div>
          <input type="file" accept="image/jpeg,image/png,image/webp" multiple ref={fileInputRef} onChange={handleImageFileChange} className="hidden" id="imageUpload" disabled={disabled}/>
          
          <div className="flex justify-between items-center mt-2">
            <div className="flex flex-col">
              <p className="text-xs text-muted-foreground">
                {images.length} / {userMaxImages} görsel. Ana görsel: <StarIcon className="w-3 h-3 inline text-yellow-400 fill-current" />
              </p>
              {showPremiumHint && (
                <p className="text-xs text-yellow-400 flex items-center gap-1 mt-1">
                  <Crown className="w-3 h-3" />
                  Premium ile 3 fotoğraf daha ekleyebilirsiniz
                </p>
              )}
            </div>
            <Button type="button" variant="secondary" size="sm" onClick={onOpenStockModal} disabled={disabled || images.length >= userMaxImages}>
              <Search className="w-4 h-4 mr-2" />
              Stok Görsel Bul
            </Button>
          </div>
          {errors?.images && <p className="text-destructive text-xs mt-1">{errors.images}</p>}
    
          {editorState.isOpen && (
            <ImageEditorModal
              isOpen={editorState.isOpen}
              onOpenChange={() => setEditorState({ isOpen: false, image: null, index: -1 })}
              image={editorState.image}
              onSave={handleSaveEditedImage}
            />
          )}
        </div>
      );
    };
    
    export default ImageUploader;