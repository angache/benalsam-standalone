import React from 'react';
    import { useNavigate, useParams } from 'react-router-dom';
    import { motion } from 'framer-motion';
    import { ArrowLeft, Tag, Info, FileImage as ImageIcon, Building, Loader2 } from 'lucide-react';
    import { Button } from '@/components/ui/button';
    import { useAuthStore } from '@/stores';
    import { useInventoryForm } from '@/components/InventoryFormPage/useInventoryForm.js';
    import InventoryFormField from '@/components/InventoryFormPage/InventoryFormField.jsx';
    import InventoryCategorySelector from '@/components/InventoryFormPage/InventoryCategorySelector.jsx';
    import InventoryImageUploader from '@/components/InventoryFormPage/InventoryImageUploader.jsx';
    
    const MAX_IMAGES_INVENTORY = 3;
    
    const InventoryFormPage = () => {
      const { itemId } = useParams();
      const navigate = useNavigate();
      const { loadingAuth: authLoading } = useAuthStore(); 
      
      const {
        formData,
        selectedMainCategory, setSelectedMainCategory,
        selectedSubCategory, setSelectedSubCategory,
        selectedSubSubCategory, setSelectedSubSubCategory,
        errors,
        loadingInitialData: formLoading,
        isEditMode,
        isUploading,
        uploadProgress,
        handleChange,
        handleImageArrayChange,
        handleRemoveImageFromArray,
        handleSetMainImage,
        handleSubmit,
      } = useInventoryForm(itemId);
    
      if (authLoading) {
        return (
          <div className="min-h-screen flex items-center justify-center bg-background">
            <Loader2 className="w-12 h-12 animate-spin text-primary" />
            <p className="ml-4 text-muted-foreground">Kimlik doğrulanıyor...</p>
          </div>
        );
      }
    
      if (formLoading) { 
         return (
          <div className="min-h-screen flex items-center justify-center bg-background">
            <Loader2 className="w-12 h-12 animate-spin text-primary" />
            <p className="ml-4 text-muted-foreground">{isEditMode ? 'Ürün bilgileri yükleniyor...' : 'Form hazırlanıyor...'}</p>
          </div>
        );
      }
      
      return (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="mx-auto w-full max-w-4xl px-4 sm:px-6 lg:px-8 py-12"
        >
          <div className="flex items-center mb-8">
             <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="mr-4 text-muted-foreground hover:text-foreground" disabled={isUploading}>
              <ArrowLeft className="w-6 h-6" />
            </Button>
            <h1 className="text-2xl font-bold text-gradient">{isEditMode ? 'Ürünü Düzenle' : 'Yeni Ürün Ekle'}</h1>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6 p-8 glass-effect rounded-2xl max-w-2xl mx-auto">
            <InventoryFormField label="Ürün Adı *" icon={Tag} error={errors.name}>
              <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} placeholder="Örn: Eski Laptop"
                disabled={isUploading}
                className={`w-full px-3 py-2.5 bg-input border rounded-lg focus:outline-none input-glow ${errors.name ? 'border-destructive' : 'border-border'}`} />
            </InventoryFormField>
            
            <InventoryFormField label="Kategori Seçimi *" icon={Building} error={errors.category}>
              <InventoryCategorySelector 
                selectedMain={selectedMainCategory} onMainChange={setSelectedMainCategory}
                selectedSub={selectedSubCategory} onSubChange={setSelectedSubCategory}
                selectedSubSub={selectedSubSubCategory} onSubSubChange={setSelectedSubSubCategory}
                errors={errors}
                disabled={isUploading}
              />
            </InventoryFormField>
    
            <InventoryFormField label="Açıklama" icon={Info} error={errors.description}>
              <textarea name="description" id="description" value={formData.description || ''} onChange={handleChange} placeholder="Ürün hakkında kısa bilgi" rows="3"
                disabled={isUploading}
                className="w-full px-3 py-2.5 bg-input border rounded-lg focus:outline-none input-glow resize-none border-border" />
            </InventoryFormField>
    
            <InventoryFormField label={`Ürün Görselleri (En az 1, En fazla ${MAX_IMAGES_INVENTORY}) *`} icon={ImageIcon} error={errors.images}>
              <InventoryImageUploader
                images={formData.images}
                onImageChange={handleImageArrayChange}
                onRemoveImage={handleRemoveImageFromArray}
                onSetMainImage={handleSetMainImage}
                mainImageIndex={formData.mainImageIndex}
                errors={errors}
                maxImages={MAX_IMAGES_INVENTORY}
                disabled={isUploading}
              />
            </InventoryFormField>
            {isUploading && (
                <div className="mt-4">
                    <div className="relative w-full h-2 bg-muted rounded-full overflow-hidden">
                        <motion.div
                            className="absolute top-0 left-0 h-full bg-primary"
                            initial={{ width: "0%" }}
                            animate={{ width: `${uploadProgress}%` }}
                            transition={{ duration: 0.5, ease: "linear" }}
                        />
                    </div>
                    <p className="text-xs text-center text-muted-foreground mt-1">Görseller yükleniyor: {uploadProgress}%</p>
                </div>
            )}
    
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => navigate(-1)} disabled={isUploading} className="border-muted-foreground/50 text-muted-foreground hover:bg-muted-foreground/10">İptal</Button>
              <Button type="submit" className="btn-primary text-primary-foreground" disabled={isUploading}>
                {isUploading ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {isEditMode ? 'Kaydediliyor...' : 'Ekleniyor...'}
                    </>
                ) : (isEditMode ? 'Kaydet' : 'Ekle')}
                </Button>
            </div>
          </form>
        </motion.div>
      );
    };
    
    export default InventoryFormPage;