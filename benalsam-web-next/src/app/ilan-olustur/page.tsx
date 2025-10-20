'use client'

import { useState } from 'react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import CategoryStep from '@/components/CreateListing/CategoryStep'

export default function CreateListingPage() {
  const [currentStep, setCurrentStep] = useState(1)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId)
  }

  const handleNext = () => {
    if (currentStep < 6) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <CategoryStep
            selectedCategory={selectedCategory}
            onCategorySelect={handleCategorySelect}
            onNext={handleNext}
            onBack={handleBack}
          />
        )
      case 2:
        return <div>Detaylar Adımı (Yapılacak)</div>
      case 3:
        return <div>Özellikler Adımı (Yapılacak)</div>
      case 4:
        return <div>Görseller Adımı (Yapılacak)</div>
      case 5:
        return <div>Konum Adımı (Yapılacak)</div>
      case 6:
        return <div>Onay Adımı (Yapılacak)</div>
      default:
        return null
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