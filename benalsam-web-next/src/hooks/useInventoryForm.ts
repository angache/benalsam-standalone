'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/use-toast'
import { useAuth } from '@/hooks/useAuth'
import { getInventoryItemById, addInventoryItem, updateInventoryItem } from '@/services/inventoryService'
import { categoryService } from '@/services/categoryService'
import type { Category } from '@/services/categoryService'

interface ImageItem {
  file?: File
  preview: string
  name: string
  isUploaded: boolean
  url?: string
}

interface FormData {
  id?: string
  name: string
  description: string
  images: ImageItem[]
  mainImageIndex: number
}

interface FormErrors {
  name?: string
  category?: string
  images?: string
  [key: string]: string | undefined
}

export const useInventoryForm = (itemId?: string) => {
  const router = useRouter()
  const { user, isLoading: loadingAuth } = useAuth()
  const { toast } = useToast()

  const isEditMode = !!itemId

  const defaultFormData: FormData = {
    name: '',
    description: '',
    images: [],
    mainImageIndex: -1,
  }

  const [formData, setFormData] = useState<FormData>(defaultFormData)
  const [selectedMainCategory, setSelectedMainCategory] = useState<string>('')
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>('')
  const [selectedSubSubCategory, setSelectedSubSubCategory] = useState<string>('')
  const [errors, setErrors] = useState<FormErrors>({})
  const [loadingInitialData, setLoadingInitialData] = useState(isEditMode)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  // Load item data for edit mode
  useEffect(() => {
    if (isEditMode && user) {
      const fetchItemData = async () => {
        setLoadingInitialData(true)
        try {
          const item = await getInventoryItemById(itemId!)

          if (!item) {
            toast({
              title: 'Ürün Bulunamadı',
              description: 'Düzenlenecek ürün bulunamadı veya size ait değil.',
              variant: 'destructive',
            })
            router.push('/envanterim')
            return
          }

          // Load categories to find category IDs
          const categories = await categoryService.getCategories()
          const categoryPath = item.category?.split(' > ') || []
          let mainCatId = ''
          let subCatId = ''
          let subSubCatId = ''

          if (categoryPath.length > 0) {
            const mainCat = categories.find((cat) => cat.name === categoryPath[0] && (cat.level === 0 || !cat.parent_id))
            if (mainCat) {
              mainCatId = String(mainCat.id)
              if (categoryPath.length > 1) {
                const subCat = categories.find(
                  (cat) => cat.name === categoryPath[1] && String(cat.parent_id) === mainCatId
                )
                if (subCat) {
                  subCatId = String(subCat.id)
                  if (categoryPath.length > 2) {
                    const subSubCat = categories.find(
                      (cat) => cat.name === categoryPath[2] && String(cat.parent_id) === subCatId
                    )
                    if (subSubCat) {
                      subSubCatId = String(subSubCat.id)
                    }
                  }
                }
              }
            }
          }

          setSelectedMainCategory(mainCatId)
          setSelectedSubCategory(subCatId)
          setSelectedSubSubCategory(subSubCatId)

          const initialImages: ImageItem[] = []
          if (item.main_image_url) {
            initialImages.push({
              preview: item.main_image_url,
              name: 'main_image.jpg',
              isUploaded: true,
              url: item.main_image_url,
            })
          }
          ;(item.additional_image_urls || []).forEach((url, index) => {
            initialImages.push({
              preview: url,
              name: `additional_image_${index}.jpg`,
              isUploaded: true,
              url: url,
            })
          })

          setFormData({
            id: item.id,
            name: item.name,
            description: item.description || '',
            images: initialImages,
            mainImageIndex:
              initialImages.length > 0
                ? initialImages.findIndex((img) => img.url === item.main_image_url)
                : -1,
          })
        } catch (error) {
          console.error('Error loading inventory item:', error)
          toast({
            title: 'Hata',
            description: 'Ürün bilgileri yüklenirken bir sorun oluştu.',
            variant: 'destructive',
          })
        } finally {
          setLoadingInitialData(false)
        }
      }
      fetchItemData()
    } else if (!isEditMode) {
      setFormData(defaultFormData)
      setSelectedMainCategory('')
      setSelectedSubCategory('')
      setSelectedSubSubCategory('')
      setErrors({})
      setLoadingInitialData(false)
    } else if (isEditMode && !user) {
      setLoadingInitialData(false)
    }
  }, [itemId, isEditMode, user, router, toast])

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target
      setFormData((prev) => ({ ...prev, [name]: value }))
      if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }))
    },
    [errors]
  )

  const handleImageArrayChange = useCallback((newImages: ImageItem[]) => {
    setFormData((prev) => {
      let newMainImageIndex = prev.mainImageIndex
      if (newImages.length === 1 && prev.mainImageIndex === -1) {
        newMainImageIndex = 0
      } else if (newImages.length === 0) {
        newMainImageIndex = -1
      } else if (prev.mainImageIndex >= newImages.length) {
        newMainImageIndex = newImages.length > 0 ? 0 : -1
      }
      return { ...prev, images: newImages, mainImageIndex: newMainImageIndex }
    })
  }, [])

  const handleRemoveImageFromArray = useCallback((indexToRemove: number) => {
    setFormData((prev) => {
      const updatedImages = prev.images.filter((_, index) => index !== indexToRemove)
      let newMainImageIndex = prev.mainImageIndex
      if (indexToRemove === prev.mainImageIndex) {
        newMainImageIndex = updatedImages.length > 0 ? 0 : -1
      } else if (indexToRemove < prev.mainImageIndex) {
        newMainImageIndex -= 1
      }
      return { ...prev, images: updatedImages, mainImageIndex: newMainImageIndex }
    })
  }, [])

  const handleSetMainImage = useCallback((index: number) => {
    setFormData((prev) => ({ ...prev, mainImageIndex: index }))
  }, [])

  const getCategoryPath = useCallback(async (): Promise<string> => {
    // Try to get from localStorage first (faster and has tree structure)
    try {
      const cachedCategories = localStorage.getItem('benalsam_categories_next_v1.0.0')
      if (cachedCategories) {
        const parsedCache = JSON.parse(cachedCategories)
        if (parsedCache.data && Array.isArray(parsedCache.data)) {
          const findCategoryPath = (nodes: any[], targetId: string, currentPath: string[] = []): string[] | null => {
            for (const node of nodes) {
              const newPath = [...currentPath, node.name]
              if (String(node.id) === targetId) {
                return newPath
              }
              const children = node.children || node.subcategories || []
              if (children.length > 0) {
                const found = findCategoryPath(children, targetId, newPath)
                if (found) return found
              }
            }
            return null
          }
          
          // Find path for the deepest selected category
          const targetId = selectedSubSubCategory || selectedSubCategory || selectedMainCategory
          if (targetId) {
            const path = findCategoryPath(parsedCache.data, targetId)
            if (path && path.length > 0) {
              return path.join(' > ')
            }
          }
        }
      }
    } catch (error) {
      console.error('Error getting category path from cache:', error)
    }
    
    // Fallback: build path from flat categories
    const categories = await categoryService.getCategories()
    const path: string[] = []

    if (selectedMainCategory) {
      const mainCat = categories.find((cat) => String(cat.id) === selectedMainCategory)
      if (mainCat) {
        path.push(mainCat.name)
        if (selectedSubCategory) {
          const subCat = categories.find((cat) => String(cat.id) === selectedSubCategory)
          if (subCat) {
            path.push(subCat.name)
            if (selectedSubSubCategory) {
              const subSubCat = categories.find((cat) => String(cat.id) === selectedSubSubCategory)
              if (subSubCat) {
                path.push(subSubCat.name)
              }
            }
          }
        }
      }
    }

    return path.join(' > ')
  }, [selectedMainCategory, selectedSubCategory, selectedSubSubCategory])

  const validate = useCallback((): boolean => {
    const newErrors: FormErrors = {}
    if (!formData.name.trim()) newErrors.name = 'Ürün adı gerekli.'

    if (!selectedMainCategory) {
      newErrors.category = 'Ana kategori seçimi gerekli'
    }
    // Note: Subcategory validation is handled in the form, but we can add sync validation here if needed

    if (formData.images.length === 0) {
      newErrors.images = 'En az bir görsel yüklemelisiniz.'
    } else if (formData.mainImageIndex === -1 && formData.images.length > 0) {
      setFormData((prev) => ({ ...prev, mainImageIndex: 0 }))
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [formData, selectedMainCategory])

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      if (isUploading || !user) return
      if (!validate()) {
        toast({
          title: 'Form Hatalı',
          description: 'Lütfen gerekli alanları doldurun, kategori seçimini tamamlayın ve en az bir görsel ekleyin.',
          variant: 'destructive',
        })
        return
      }

      try {
        setIsUploading(true)
        setUploadProgress(0)

        const categoryPath = await getCategoryPath()

        // Prepare images for upload
        const imagesToUpload = formData.images.filter((img) => !img.isUploaded && img.file)
        const imageFiles = imagesToUpload.map((img) => img.file!).filter(Boolean)

        // Prepare item data
        const itemData: any = {
          name: formData.name,
          category: categoryPath,
          description: formData.description,
          images: imageFiles,
          mainImageIndex: formData.mainImageIndex,
        }

        // For edit mode, include existing image URLs
        if (isEditMode && formData.id) {
          itemData.id = formData.id
          itemData.initialImageUrls = formData.images.filter((img) => img.isUploaded).map((img) => img.url || img.preview)
        }

        let result
        if (isEditMode) {
          result = await updateInventoryItem(itemData, user.id, (progress) => {
            setUploadProgress(progress)
          })
        } else {
          result = await addInventoryItem(itemData, user.id, (progress) => {
            setUploadProgress(progress)
          })
        }

        if (result) {
          toast({
            title: 'Başarılı!',
            description: isEditMode ? 'Ürün başarıyla güncellendi.' : 'Ürün başarıyla eklendi.',
          })
          router.push('/envanterim')
        }
      } catch (error) {
        console.error('Error submitting inventory item:', error)
        toast({
          title: 'Hata',
          description: 'Ürün kaydedilirken bir sorun oluştu. Lütfen tekrar deneyin.',
          variant: 'destructive',
        })
      } finally {
        setIsUploading(false)
        setUploadProgress(0)
      }
    },
    [isUploading, validate, formData, selectedMainCategory, selectedSubCategory, selectedSubSubCategory, isEditMode, user, router, toast, getCategoryPath]
  )

  return {
    formData,
    selectedMainCategory,
    setSelectedMainCategory,
    selectedSubCategory,
    setSelectedSubCategory,
    selectedSubSubCategory,
    setSelectedSubSubCategory,
    errors,
    loadingInitialData,
    isEditMode,
    isUploading,
    uploadProgress,
    handleChange,
    handleImageArrayChange,
    handleRemoveImageFromArray,
    handleSetMainImage,
    handleSubmit,
  }
}

