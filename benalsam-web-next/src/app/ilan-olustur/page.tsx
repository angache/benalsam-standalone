'use client'

import Header from '@/components/Header'
import Footer from '@/components/Footer'
import CategoryStep from '@/components/CreateListing/CategoryStep'
import DetailsStep from '@/components/CreateListing/DetailsStep'
import AttributesStep from '@/components/CreateListing/AttributesStep'
import ImagesStep from '@/components/CreateListing/ImagesStep'
import LocationStep from '@/components/CreateListing/LocationStep'
import ReviewStep from '@/components/CreateListing/ReviewStep'
import ProgressModal, { ProgressPhase } from '@/components/CreateListing/ProgressModal'
import { useCreateListingStore } from '@/stores'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { createListingWithUploadService } from '@/services/createListingService'

export default function CreateListingPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Progress modal state
  const [isProgressModalOpen, setIsProgressModalOpen] = useState(false)
  const [progressPhase, setProgressPhase] = useState<ProgressPhase>('idle')
  const [progressMessage, setProgressMessage] = useState('')
  const [uploadProgress, setUploadProgress] = useState(0)
  
  const {
    currentStep,
    totalSteps,
    category,
    details,
    attributes,
    images,
    mainImageIndex,
    location,
    nextStep,
    prevStep,
    setCategory,
    setDetails,
    updateAttribute,
    addImages,
    setImages,
    removeImage,
    setMainImage,
    setLocation,
    validateStep,
    resetForm
  } = useCreateListingStore()

  const handleCategorySelect = (categoryId: string, pathNames?: string[], pathIds?: string[]) => {
    // Get category name from localStorage cache
    try {
      if (pathNames && pathIds) {
        // Use hierarchical path from CategoryStep
        console.log('🏷️ [PAGE] Using hierarchical path:', { pathNames, pathIds })
        setCategory(categoryId, pathNames[pathNames.length - 1], pathNames, pathIds)
      } else {
        // Fallback: find category name from localStorage
        const raw = localStorage.getItem('benalsam_categories_next_v1.0.0')
        if (raw) {
          const parsed = JSON.parse(raw)
          const roots: unknown[] = parsed?.data || []
          const findById = (nodes: unknown[]): { id: string; name: string } | null => {
            for (const n of nodes) {
              const node = n as { id: string; name: string; subcategories?: unknown[]; children?: unknown[] }
              if (String(node.id) === String(categoryId)) return { id: node.id, name: node.name }
              const subs = node.subcategories || node.children || []
              const found = findById(subs)
              if (found) return found
            }
            return null
          }
          const node = findById(roots)
          if (node) {
            setCategory(categoryId, node.name, [])
          }
        }
      }
    } catch (error) {
      console.error('Error finding category name:', error)
    }
  }

  const handleNext = () => {
    if (validateStep(currentStep)) {
      nextStep()
    }
  }

  const handleBack = () => {
    prevStep()
  }

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <CategoryStep
            selectedCategory={category.selectedCategoryId}
            onCategorySelect={handleCategorySelect}
            onNext={handleNext}
            onBack={handleBack}
          />
        )
      case 2:
        return (
          <DetailsStep
            formData={details}
            onChange={(field, value) => setDetails({ [field]: value })}
            onNext={handleNext}
            onBack={handleBack}
            selectedCategoryId={category.selectedCategoryId}
          />
        )
      case 3:
        return (
          <AttributesStep
            formData={attributes}
            onChange={(key, value) => updateAttribute(key, value)}
            onNext={handleNext}
            onBack={handleBack}
            selectedCategoryId={category.selectedCategoryId}
            selectedCategoryName={category.selectedCategoryName}
          />
        )
      case 4:
        console.log('🔄 [PAGE] Rendering ImagesStep with images:', images)
        return (
          <ImagesStep
            formData={images}
            mainImageIndex={mainImageIndex}
            onChange={(newImages) => {
              console.log('🔄 [PAGE] onChange called (old system):', { images: newImages.length })
              setImages(newImages)
            }}
            onSetMainImage={setMainImage}
            onNext={handleNext}
            onBack={handleBack}
            selectedCategoryName={category.selectedCategoryName}
          />
        )
      case 5:
        return (
          <LocationStep
            formData={location}
            onChange={(key, value) => setLocation({ [key]: value })}
            onNext={handleNext}
            onBack={handleBack}
          />
        )
      case 6:
        return (
          <ReviewStep
            formData={{
              category,
              details,
              attributes,
              images,
              mainImageIndex,
              location
            }}
            acceptTerms={acceptTerms}
            onAcceptTermsChange={setAcceptTerms}
            onSubmit={handleSubmit}
            onBack={handleBack}
            isSubmitting={isSubmitting}
          />
        )
      default:
        return null
    }
  }

  const handleSubmit = async () => {
    if (!acceptTerms) {
      alert('Lütfen ilan verme kurallarını kabul edin.')
      return
    }

    // Validate required fields
    if (!category.selectedCategoryName) {
      alert('Lütfen bir kategori seçin.')
      return
    }

    if (!details.title || details.title.length < 3) {
      alert('Başlık en az 3 karakter olmalıdır.')
      return
    }

    if (!details.description || details.description.length < 10) {
      alert('Açıklama en az 10 karakter olmalıdır.')
      return
    }

    if (!location.city || !location.district) {
      alert('Lütfen şehir ve ilçe seçin.')
      return
    }

    if (!session?.user?.id) {
      alert('Lütfen giriş yapın.')
      router.push('/auth/login')
      return
    }

    setIsSubmitting(true)
    setIsProgressModalOpen(true)
    setProgressPhase('uploading')
    setProgressMessage('Görseller yükleniyor...')
    setUploadProgress(0)
    
    try {
      // Prepare listing data
      const listingData = {
        title: details.title,
        description: details.description,
        budget: Number(details.budget.replace(/\D/g, '')) || 1, // Remove non-digits from formatted string
        category: category.categoryPath?.join(' > ') || category.selectedCategoryName || 'Kategori Seçilmedi',
        category_id: category.category_id, // Use from store (already calculated)
        category_path: category.category_path, // Use from store (already calculated)
        location: `${location.city || 'Şehir'} / ${location.district || 'İlçe'}${location.neighborhood ? ' / ' + location.neighborhood : ''}`,
        listings_province: location.city || null,
        listings_district: location.district || null,
        listings_neighborhood: location.neighborhood || null,
        urgency: details.urgency || 'medium',
        condition: details.condition || [],
        attributes: attributes,
        images: images || [], // Pass image objects
        mainImageIndex: mainImageIndex,
        duration: parseInt(details.duration) || 30,
        contact_preference: details.contactPreference || 'site_message',
        auto_republish: details.autoRepublish || false,
        accept_terms: acceptTerms,
        is_featured: details.premiumFeatures?.is_featured || false,
        is_urgent_premium: details.premiumFeatures?.is_urgent_premium || false,
        is_showcase: details.premiumFeatures?.is_showcase || false,
        has_bold_border: details.premiumFeatures?.has_bold_border || false,
        geolocation: location.coordinates?.lat && location.coordinates?.lng ? `POINT(${location.coordinates.lng} ${location.coordinates.lat})` : null
      }

      console.log('📤 [SUBMIT] Creating listing:', listingData)

      // Call the service (handles upload + create + polling)
      const result = await createListingWithUploadService(
        listingData,
        session.user.id,
        (progress) => {
          setUploadProgress(progress)
          if (progress >= 50 && progressPhase === 'uploading') {
            setProgressPhase('creating')
            setProgressMessage('İlan kaydediliyor...')
          }
        }
      )

      console.log('✅ [SUBMIT] Listing created successfully:', result)

      // Success
      setProgressPhase('success')
      setProgressMessage('İlan başarıyla oluşturuldu. Onaylandıktan sonra yayına alınacak.')
    } catch (error) {
      console.error('❌ [SUBMIT] Error:', error)
      setProgressPhase('error')
      setProgressMessage(error instanceof Error ? error.message : 'Beklenmedik bir hata oluştu')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    if (confirm('İlan oluşturmayı iptal etmek istediğinizden emin misiniz? Tüm veriler silinecektir.')) {
      resetForm()
      setAcceptTerms(false)
      router.push('/')
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1">
        {/* Cancel Button */}
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Geri
              </button>
              <span className="text-sm text-muted-foreground">
                Adım {currentStep} / {totalSteps}
              </span>
            </div>
            <button
              onClick={handleCancel}
              className="text-sm text-red-600 hover:text-red-700 transition-colors"
            >
              Vazgeç
            </button>
          </div>
        </div>
        {renderCurrentStep()}
      </main>
      <Footer />

      {/* Progress Modal */}
      <ProgressModal
        isOpen={isProgressModalOpen}
        phase={progressPhase}
        message={progressMessage}
        uploadProgress={uploadProgress}
        onSuccess={() => {
          setIsProgressModalOpen(false)
          resetForm()
          setAcceptTerms(false)
          router.push('/ilanlarim')
        }}
        onError={() => {
          setIsProgressModalOpen(false)
        }}
      />
    </div>
  )
}