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

export default function CreateListingPage() {
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const {
    currentStep,
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

    setIsSubmitting(true)
    
    try {
      // TODO: API call to create listing
      console.log('📤 [SUBMIT] Creating listing:', {
        category,
        details,
        attributes,
        images,
        mainImageIndex,
        location
      })

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Success
      alert('✅ İlanınız başarıyla oluşturuldu! Yönetici onayından sonra yayınlanacaktır.')
      
      // Reset form
      resetForm()
      setAcceptTerms(false)
      
      // Redirect to home or listings page
      // router.push('/ilanlarim')
    } catch (error) {
      console.error('❌ [SUBMIT] Error creating listing:', error)
      alert('❌ İlan oluşturulurken bir hata oluştu. Lütfen tekrar deneyin.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1">
        {renderCurrentStep()}
      </main>
      <Footer />
    </div>
  )
}