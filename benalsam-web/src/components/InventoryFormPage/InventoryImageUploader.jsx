import React, { useRef, useState } from 'react';
    import { Button } from '@/components/ui/button';
    import { toast } from '@/components/ui/use-toast';
    import { Upload, Star as StarIcon, CheckCircle, Trash2, Pencil } from 'lucide-react';
    import { compressImage } from '@/lib/imageUtils';
    import ImageEditorModal from '@/components/ImageEditorModal';
    import OptimizedImage from '@/components/OptimizedImage';
    
    const InventoryImageUploader = ({ images, onImageChange, onRemoveImage, onSetMainImage, mainImageIndex, errors, maxImages, disabled }) => {
      const fileInputRef = useRef(null);
      const [editorState, setEditorState] = useState({ isOpen: false, image: null, index: -1 });
    
      const handleImageFileChange = async (event) => {
        const files = Array.from(event.target.files);
        if (files.length === 0) return;
    
        const filesToProcess = files.slice(0, maxImages - images.length);
    
        if (files.length > filesToProcess.length) {
          toast({ title: "Görsel Limiti Aşıldı!", description: `En fazla ${maxImages} görsel yükleyebilirsiniz.`, variant: "destructive" });
        }
    
        if (filesToProcess.length > 0) {
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
    
      return (
        <div>
          <div className="grid grid-cols-3 gap-2 mb-3">
            {images.map((img, index) => (
              <div key={index} className="relative group aspect-square">
                <OptimizedImage src={img.preview} alt={`Önizleme ${index + 1}`} className="w-full h-full object-cover rounded-md border border-border" loading="eager" sizes="150px" />
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
            {images.length < maxImages && !disabled && (
              <Button type="button" variant="outline" onClick={() => fileInputRef.current && fileInputRef.current.click()} className="w-full aspect-square flex flex-col items-center justify-center border-dashed border-primary/50 text-primary hover:bg-primary/10">
                <Upload className="w-6 h-6 mb-1" />
                 <span className="text-xs">Yükle</span>
              </Button>
            )}
          </div>
           <input type="file" accept="image/jpeg,image/png,image/webp" multiple ref={fileInputRef} onChange={handleImageFileChange} className="hidden" id="inventoryImageUploadInput" disabled={disabled}/>
          {errors?.images && <p className="text-destructive text-xs mt-1">{errors.images}</p>}
          <p className="text-xs text-muted-foreground mt-1">
            {images.length} / {maxImages} görsel yüklendi. Ana görseli <StarIcon className="w-3 h-3 inline text-yellow-400 fill-current" /> ile işaretleyebilirsiniz.
          </p>
    
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
    
    export default InventoryImageUploader;