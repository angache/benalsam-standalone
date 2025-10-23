'use client'

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

// Types
interface CategoryData {
  selectedCategoryId: string | null
  selectedCategoryName: string | null
  categoryPath: string[]
}

interface DetailsData {
  title: string
  description: string
  price: string
  urgency: 'normal' | 'urgent' | 'very_urgent'
}

interface AttributesData {
  [key: string]: string | number | boolean | string[]
}

// Images are now stored as an array of image objects
// Each image object has: { file, preview, name, isUploaded }

interface LocationData {
  city: string
  district: string
  neighborhood: string
  coordinates?: { lat: number; lng: number }
}

interface ReviewData {
  isUrgent: boolean
  isPremium: boolean
  premiumFeatures: string[]
  totalCost: number
}

interface CreateListingState {
  // Current step
  currentStep: number
  totalSteps: number
  
  // Form data
  category: CategoryData
  details: DetailsData
  attributes: AttributesData
  images: any[] // Array of image objects
  mainImageIndex: number // Moved out of images
  location: LocationData
  review: ReviewData
  
  // UI state
  isLoading: boolean
  errors: Record<string, string>
  isValid: boolean
  
  // Actions
  setCurrentStep: (step: number) => void
  nextStep: () => void
  prevStep: () => void
  
  // Category actions
  setCategory: (id: string, name: string, path: string[]) => void
  clearCategory: () => void
  
  // Details actions
  setDetails: (data: Partial<DetailsData>) => void
  updateDetail: (field: keyof DetailsData, value: string) => void
  
  // Attributes actions
  setAttributes: (data: AttributesData) => void
  updateAttribute: (key: string, value: string | number | boolean | string[]) => void
  
  // Images actions
  setImages: (newImages: any[]) => void
  addImages: (files: File[]) => void
  removeImage: (index: number) => void
  setMainImage: (index: number) => void
  reorderImages: (fromIndex: number, toIndex: number) => void
  
  // Location actions
  setLocation: (data: Partial<LocationData>) => void
  updateLocation: (field: keyof LocationData, value: string) => void
  
  // Review actions
  setReview: (data: Partial<ReviewData>) => void
  updateReview: (field: keyof ReviewData, value: string | number | boolean | string[]) => void
  
  // Validation
  validateStep: (step: number) => boolean
  validateAll: () => boolean
  
  // Reset
  resetForm: () => void
  resetStep: (step: number) => void
  
  // Auto-save
  saveDraft: () => void
  loadDraft: () => void
}

const initialState = {
  currentStep: 1,
  totalSteps: 6,
  
  category: {
    selectedCategoryId: null,
    selectedCategoryName: null,
    categoryPath: []
  },
  
  details: {
    title: '',
    description: '',
    price: '',
    urgency: 'normal' as const
  },
  
  attributes: {},
  
        images: [],
        mainImageIndex: 0,
  
  location: {
    city: '',
    district: '',
    neighborhood: ''
  },
  
  review: {
    isUrgent: false,
    isPremium: false,
    premiumFeatures: [],
    totalCost: 0
  },
  
  isLoading: false,
  errors: {},
  isValid: false
}

export const useCreateListingStore = create<CreateListingState>()(
  persist(
    (set, get) => ({
      ...initialState,
      
      // Step navigation
      setCurrentStep: (step: number) => {
        if (step >= 1 && step <= get().totalSteps) {
          set({ currentStep: step })
        }
      },
      
      nextStep: () => {
        const { currentStep, totalSteps, validateStep } = get()
        console.log(`🚀 [NAVIGATION] nextStep called:`, {
          currentStep,
          totalSteps,
          isValid: validateStep(currentStep)
        })
        
        if (validateStep(currentStep) && currentStep < totalSteps) {
          console.log(`✅ [NAVIGATION] Moving to step ${currentStep + 1}`)
          set({ currentStep: currentStep + 1 })
        } else {
          console.log(`❌ [NAVIGATION] Cannot move to next step:`, {
            isValid: validateStep(currentStep),
            canMove: currentStep < totalSteps
          })
        }
      },
      
      prevStep: () => {
        const { currentStep } = get()
        if (currentStep > 1) {
          set({ currentStep: currentStep - 1 })
        }
      },
      
      // Category actions
      setCategory: (id: string, name: string, path: string[]) => {
        set({
          category: {
            selectedCategoryId: id,
            selectedCategoryName: name,
            categoryPath: path
          },
          // Clear attributes when category changes
          attributes: {}
        })
      },
      
      clearCategory: () => {
        set({
          category: {
            selectedCategoryId: null,
            selectedCategoryName: null,
            categoryPath: []
          }
        })
      },
      
      // Details actions
      setDetails: (data: Partial<DetailsData>) => {
        set(state => ({
          details: { ...state.details, ...data }
        }))
      },
      
      updateDetail: (field: keyof DetailsData, value: string) => {
        set(state => ({
          details: { ...state.details, [field]: value }
        }))
      },
      
      // Attributes actions
      setAttributes: (data: AttributesData) => {
        set({ attributes: data })
      },
      
      updateAttribute: (key: string, value: string | number | boolean | string[]) => {
        set(state => ({
          attributes: { ...state.attributes, [key]: value }
        }))
      },
      
      // Images actions - ESKİ SİSTEM YAKLAŞIMI
      setImages: (newImages: any[]) => {
        console.log('🔄 [STORE] setImages called (old system):', { images: newImages.length })
        set(state => {
          let newMainImageIndex = state.mainImageIndex
          if (newImages.length > 0 && state.mainImageIndex === -1) {
            newMainImageIndex = 0
          } else if (newImages.length === 0) {
            newMainImageIndex = -1
          } else if (state.mainImageIndex >= newImages.length) {
            newMainImageIndex = newImages.length > 0 ? 0 : -1
          }
          
          const newState = {
            images: newImages,
            mainImageIndex: newMainImageIndex
          }
          console.log('✅ [STORE] setImages result:', { 
            images: newState.images.length, 
            mainImageIndex: newState.mainImageIndex 
          })
          return newState
        })
      },
      
      removeImage: (index: number) => {
        set(state => {
          const updatedImages = state.images.filter((_, i) => i !== index)
          let newMainImageIndex = state.mainImageIndex
          if (index === state.mainImageIndex) {
            newMainImageIndex = updatedImages.length > 0 ? 0 : -1
          } else if (index < state.mainImageIndex) {
            newMainImageIndex -= 1
          }
          return {
            images: updatedImages,
            mainImageIndex: newMainImageIndex
          }
        })
      },
      
      setMainImage: (index: number) => {
        set(state => ({
          mainImageIndex: index
        }))
      },
      
      reorderImages: (fromIndex: number, toIndex: number) => {
        set(state => {
          const newImages = [...state.images]
          const [movedImage] = newImages.splice(fromIndex, 1)
          newImages.splice(toIndex, 0, movedImage)
          return {
            images: newImages
          }
        })
      },
      
      // Location actions
      setLocation: (data: Partial<LocationData>) => {
        set(state => ({
          location: { ...state.location, ...data }
        }))
      },
      
      updateLocation: (field: keyof LocationData, value: string) => {
        set(state => ({
          location: { ...state.location, [field]: value }
        }))
      },
      
      // Review actions
      setReview: (data: Partial<ReviewData>) => {
        set(state => ({
          review: { ...state.review, ...data }
        }))
      },
      
      updateReview: (field: keyof ReviewData, value: string | number | boolean | string[]) => {
        set(state => ({
          review: { ...state.review, [field]: value }
        }))
      },
      
      // Validation
      validateStep: (step: number) => {
        const state = get()
        
        console.log(`🔍 [VALIDATION] Validating step ${step}:`, {
          step,
          category: state.category,
          details: state.details,
          currentStep: state.currentStep
        })
        
        switch (step) {
          case 1: // Category
            const categoryValid = !!state.category.selectedCategoryId
            console.log(`✅ [VALIDATION] Step 1 (Category): ${categoryValid}`)
            return categoryValid
          
          case 2: // Details
            const detailsValid = !!(
              state.details.title.trim() &&
              state.details.description.trim() &&
              state.details.price.trim()
            )
            console.log(`✅ [VALIDATION] Step 2 (Details): ${detailsValid}`, {
              title: state.details.title,
              description: state.details.description,
              price: state.details.price
            })
            return detailsValid
          
          case 3: // Attributes
            // Attributes step is always valid (optional)
            console.log(`✅ [VALIDATION] Step 3 (Attributes): true (optional)`)
            return true
          
          case 4: // Images
            return state.images.length > 0
          
          case 5: // Location
            return !!(
              state.location.city.trim() &&
              state.location.district.trim()
            )
          
          case 6: // Review
            return true // Final step
          
          default:
            return false
        }
      },
      
      validateAll: () => {
        const { totalSteps, validateStep } = get()
        for (let i = 1; i <= totalSteps; i++) {
          if (!validateStep(i)) return false
        }
        return true
      },
      
      // Reset
      resetForm: () => {
        set(initialState)
        // Clear localStorage for this store
        localStorage.removeItem('create-listing-store')
      },
      
      resetStep: (step: number) => {
        switch (step) {
          case 1:
            get().clearCategory()
            break
          case 2:
            set({ details: initialState.details })
            break
          case 3:
            set({ attributes: {} })
            break
          case 4:
            set({ images: initialState.images })
            break
          case 5:
            set({ location: initialState.location })
            break
          case 6:
            set({ review: initialState.review })
            break
        }
      },
      
      // Auto-save
      saveDraft: () => {
        // Auto-save is handled by persist middleware
        console.log('Draft saved automatically')
      },
      
      loadDraft: () => {
        // Load is handled by persist middleware
        console.log('Draft loaded automatically')
      }
    }),
    {
      name: 'create-listing-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        currentStep: state.currentStep,
        category: state.category,
        details: state.details,
        attributes: state.attributes,
        // Persist only serializable image metadata (no File objects)
        images: Array.isArray(state.images)
          ? state.images.map((img: any) => ({
              preview: img?.preview ?? null,
              name: img?.name ?? null,
              isUploaded: !!img?.isUploaded,
              uri: img?.uri ?? null
            }))
          : [],
        mainImageIndex: state.mainImageIndex,
        location: state.location,
        review: state.review
      })
    }
  )
)
