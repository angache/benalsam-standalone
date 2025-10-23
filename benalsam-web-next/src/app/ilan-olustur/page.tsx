'use client'

import Header from '@/components/Header'
import Footer from '@/components/Footer'
import CategoryStep from '@/components/CreateListing/CategoryStep'
import DetailsStep from '@/components/CreateListing/DetailsStep'
import AttributesStep from '@/components/CreateListing/AttributesStep'
import ImagesStep from '@/components/CreateListing/ImagesStep'
import LocationStep from '@/components/CreateListing/LocationStep'
import ReviewStep from '@/components/CreateListing/ReviewStep'
import { useCreateListingStore } from '@/stores'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function CreateListingPage() {
  const router = useRouter()
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
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

  const handleCategorySelect = (categoryId: string) => {
    // Get category name from localStorage cache
    try {
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
          setCategory(categoryId, node.name, [node.name])
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

    setIsSubmitting(true)
    
    try {
      // Prepare listing data
      const listingData = {
        title: details.title,
        description: details.description,
        budget: parseInt(details.budget) || 0,
        category: category.selectedCategoryName || category.categoryPath?.join(' > ') || 'Kategori Seçilmedi',
        location: `${location.city || 'Şehir'} / ${location.district || 'İlçe'}${location.neighborhood ? ' / ' + location.neighborhood : ''}`,
        urgency: details.urgency || 'medium',
        condition: details.condition || [],
        attributes: attributes,
        images: images,
        mainImageIndex: mainImageIndex,
        duration: parseInt(details.duration) || 30,
        contactPreference: details.contactPreference || 'site_message',
        autoRepublish: details.autoRepublish || false,
        acceptTerms: acceptTerms,
        premiumFeatures: {
          is_featured: details.premiumFeatures?.is_featured || false,
          is_urgent_premium: details.premiumFeatures?.is_urgent_premium || false,
          is_showcase: details.premiumFeatures?.is_showcase || false,
          has_bold_border: details.premiumFeatures?.has_bold_border || false
        },
        geolocation: location.coordinates?.lat && location.coordinates?.lng ? `POINT(${location.coordinates.lng} ${location.coordinates.lat})` : null
      }

      console.log('📤 [SUBMIT] Creating listing:', listingData)

      // Call API to create listing
      const response = await fetch('/api/listings/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(listingData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'İlan oluşturulamadı')
      }

      const result = await response.json()
      console.log('✅ [SUBMIT] Listing created successfully:', result)

      // Success
      alert('✅ İlanınız başarıyla oluşturuldu! Yönetici onayından sonra yayınlanacaktır.')
      
      // Reset form
      resetForm()
      setAcceptTerms(false)
      
      // Redirect to listings page
      router.push('/ilanlarim')
    } catch (error) {
      console.error('❌ [SUBMIT] Error creating listing:', error)
      alert(`❌ İlan oluşturulurken bir hata oluştu: ${error.message}`)
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
    </div>
  )
}