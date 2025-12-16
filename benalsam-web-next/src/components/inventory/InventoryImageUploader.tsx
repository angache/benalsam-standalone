'use client'

import React, { useRef } from 'react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'
import { Upload, Star as StarIcon, CheckCircle, Trash2 } from 'lucide-react'
import { compressImage } from '@/lib/imageUtils'
import Image from 'next/image'

interface ImageItem {
  file?: File
  preview: string
  name: string
  isUploaded: boolean
  url?: string
}

interface InventoryImageUploaderProps {
  images: ImageItem[]
  onImageChange: (images: ImageItem[]) => void
  onRemoveImage: (index: number) => void
  onSetMainImage: (index: number) => void
  mainImageIndex: number
  errors?: { images?: string }
  maxImages: number
  disabled?: boolean
}

const InventoryImageUploader: React.FC<InventoryImageUploaderProps> = ({
  images,
  onImageChange,
  onRemoveImage,
  onSetMainImage,
  mainImageIndex,
  errors,
  maxImages,
  disabled,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const handleImageFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    if (files.length === 0) return

    // Filter out duplicate files by checking name and size
    const existingFileNames = new Set(images.map(img => img.name))
    const uniqueFiles = files.filter(file => {
      const isDuplicate = existingFileNames.has(file.name)
      if (isDuplicate) {
        toast({
          title: 'Görsel Zaten Ekli',
          description: `"${file.name}" zaten listeye eklenmiş.`,
          variant: 'destructive',
        })
      }
      return !isDuplicate
    })

    if (uniqueFiles.length === 0) return

    const filesToProcess = uniqueFiles.slice(0, maxImages - images.length)

    if (uniqueFiles.length > filesToProcess.length) {
      toast({
        title: 'Görsel Limiti Aşıldı!',
        description: `En fazla ${maxImages} görsel yükleyebilirsiniz.`,
        variant: 'destructive',
      })
    }

    if (filesToProcess.length > 0) {
      toast({
        title: 'Görseller optimize ediliyor...',
        description: 'Lütfen bekleyin.',
      })

      try {
        const compressedFiles = await Promise.all(filesToProcess.map((file) => compressImage(file)))

        const newImagesState = [...images]
        let processedCount = 0

        compressedFiles.forEach((file) => {
          const reader = new FileReader()
          reader.onloadend = () => {
            newImagesState.push({
              file: file,
              preview: reader.result as string,
              name: file.name,
              isUploaded: false,
            })
            processedCount++
            if (processedCount === compressedFiles.length) {
              onImageChange(newImagesState)
              toast({
                title: 'Görseller eklendi!',
                description: `${processedCount} görsel başarıyla optimize edildi ve eklendi.`,
              })
            }
          }
          reader.readAsDataURL(file)
        })
      } catch (error) {
        console.error('Error processing images:', error)
        toast({
          title: 'Hata',
          description: 'Görseller işlenirken bir sorun oluştu.',
          variant: 'destructive',
        })
      }
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div>
      <div className="grid grid-cols-3 gap-2 mb-3">
        {images.map((img, index) => (
          <div key={index} className="relative group aspect-square">
            <Image
              src={img.preview}
              alt={`Önizleme ${index + 1}`}
              fill
              className="object-cover rounded-md border border-border"
              sizes="150px"
            />
            {!disabled && (
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-wrap items-center justify-center gap-1 p-1">
                <Button
                  type="button"
                  variant="secondary"
                  size="icon"
                  onClick={() => onRemoveImage(index)}
                  className="h-7 w-7"
                  title="Sil"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
                <Button
                  type="button"
                  variant={mainImageIndex === index ? 'default' : 'secondary'}
                  size="icon"
                  onClick={() => onSetMainImage(index)}
                  className="h-7 w-7"
                  title="Ana görsel yap"
                >
                  {mainImageIndex === index ? (
                    <CheckCircle className="w-3.5 h-3.5 text-green-400" />
                  ) : (
                    <StarIcon className="w-3.5 h-3.5" />
                  )}
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
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full aspect-square flex flex-col items-center justify-center border-2 border-dashed border-primary/50 text-primary hover:bg-primary/10 rounded-md transition-colors overflow-hidden box-border p-2"
          >
            <div className="flex-shrink-0 mb-1 flex items-center justify-center" style={{ maxWidth: '100%', maxHeight: '40%' }}>
              <Upload className="w-8 h-8" style={{ maxWidth: '100%', maxHeight: '100%' }} />
            </div>
            <span className="text-[10px] text-center leading-tight whitespace-nowrap overflow-hidden text-ellipsis" style={{ maxWidth: '100%' }}>Yükle</span>
          </button>
        )}
      </div>
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        ref={fileInputRef}
        onChange={handleImageFileChange}
        className="hidden"
        id="inventoryImageUploadInput"
        disabled={disabled}
      />
      {errors?.images && <p className="text-destructive text-xs mt-1">{errors.images}</p>}
      <p className="text-xs text-muted-foreground mt-1">
        {images.length} / {maxImages} görsel yüklendi. Ana görseli{' '}
        <StarIcon className="w-3 h-3 inline text-yellow-400 fill-current" /> ile işaretleyebilirsiniz.
      </p>
    </div>
  )
}

export default InventoryImageUploader

