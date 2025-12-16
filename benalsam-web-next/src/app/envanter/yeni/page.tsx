'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft, Tag, Info, FileImage as ImageIcon, Building, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'
import { useInventoryForm } from '@/hooks/useInventoryForm'
import InventoryFormField from '@/components/inventory/InventoryFormField'
import InventoryCategorySelector from '@/components/inventory/InventoryCategorySelector'
import InventoryImageUploader from '@/components/inventory/InventoryImageUploader'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

const MAX_IMAGES_INVENTORY = 3

const InventoryFormPage = () => {
  const router = useRouter()
  const { user, isLoading: loadingAuth } = useAuth()

  const {
    formData,
    selectedMainCategory,
    setSelectedMainCategory,
    selectedSubCategory,
    setSelectedSubCategory,
    selectedSubSubCategory,
    setSelectedSubSubCategory,
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
  } = useInventoryForm()

  if (loadingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LoadingSpinner size="xl" />
        <p className="ml-4 text-muted-foreground">Kimlik doğrulanıyor...</p>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Envanter eklemek için giriş yapmalısınız.</p>
          <Button onClick={() => router.push('/auth/login')}>Giriş Yap</Button>
        </div>
      </div>
    )
  }

  if (formLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LoadingSpinner size="xl" />
        <p className="ml-4 text-muted-foreground">{isEditMode ? 'Ürün bilgileri yükleniyor...' : 'Form hazırlanıyor...'}</p>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="mx-auto w-full max-w-4xl px-4 sm:px-6 lg:px-8 py-12"
    >
      <div className="flex items-center mb-8">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          className="mr-4 text-muted-foreground hover:text-foreground"
          disabled={isUploading}
        >
          <ArrowLeft className="w-6 h-6" />
        </Button>
        <h1 className="text-2xl font-bold">{isEditMode ? 'Ürünü Düzenle' : 'Yeni Ürün Ekle'}</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 p-8 bg-card rounded-2xl border max-w-2xl mx-auto">
        <InventoryFormField label="Ürün Adı *" icon={Tag} error={errors.name}>
          <input
            type="text"
            name="name"
            id="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Örn: Eski Laptop"
            disabled={isUploading}
            className={`w-full px-3 py-2.5 bg-input border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary ${
              errors.name ? 'border-destructive' : 'border-border'
            }`}
          />
        </InventoryFormField>

        <InventoryFormField label="Kategori Seçimi *" icon={Building} error={errors.category}>
          <InventoryCategorySelector
            selectedMain={selectedMainCategory}
            onMainChange={setSelectedMainCategory}
            selectedSub={selectedSubCategory}
            onSubChange={setSelectedSubCategory}
            selectedSubSub={selectedSubSubCategory}
            onSubSubChange={setSelectedSubSubCategory}
            errors={errors}
            disabled={isUploading}
            onLeafCategorySelect={(categoryId, pathNames, pathIds) => {
              console.log('✅ [InventoryForm] Leaf category selected:', { categoryId, pathNames, pathIds })
              // Leaf kategori seçildiğinde, en son seviyeyi set et
              if (pathIds.length === 1) {
                setSelectedMainCategory(pathIds[0])
                setSelectedSubCategory('')
                setSelectedSubSubCategory('')
              } else if (pathIds.length === 2) {
                setSelectedMainCategory(pathIds[0])
                setSelectedSubCategory(pathIds[1])
                setSelectedSubSubCategory('')
              } else if (pathIds.length === 3) {
                setSelectedMainCategory(pathIds[0])
                setSelectedSubCategory(pathIds[1])
                setSelectedSubSubCategory(pathIds[2])
              } else if (pathIds.length === 4) {
                setSelectedMainCategory(pathIds[0])
                setSelectedSubCategory(pathIds[1])
                setSelectedSubSubCategory(pathIds[2])
                // 4. seviye için de state eklenebilir ama şimdilik 3. seviyeyi kullanıyoruz
              }
            }}
          />
        </InventoryFormField>

        <InventoryFormField label="Açıklama" icon={Info} error={errors.description}>
          <textarea
            name="description"
            id="description"
            value={formData.description || ''}
            onChange={handleChange}
            placeholder="Ürün hakkında kısa bilgi"
            rows={3}
            disabled={isUploading}
            className="w-full px-3 py-2.5 bg-input border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none border-border"
          />
        </InventoryFormField>

        <InventoryFormField
          label={`Ürün Görselleri (En az 1, En fazla ${MAX_IMAGES_INVENTORY}) *`}
          icon={ImageIcon}
          error={errors.images}
        >
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
                initial={{ width: '0%' }}
                animate={{ width: `${uploadProgress}%` }}
                transition={{ duration: 0.5, ease: 'linear' }}
              />
            </div>
            <p className="text-xs text-center text-muted-foreground mt-1">
              Görseller yükleniyor: {uploadProgress}%
            </p>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isUploading}
            className="border-muted-foreground/50 text-muted-foreground hover:bg-muted-foreground/10"
          >
            İptal
          </Button>
          <Button type="submit" className="text-primary-foreground" disabled={isUploading}>
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isEditMode ? 'Kaydediliyor...' : 'Ekleniyor...'}
              </>
            ) : (
              isEditMode ? 'Kaydet' : 'Ekle'
            )}
          </Button>
        </div>
      </form>
    </motion.div>
  )
}

export default InventoryFormPage

