'use client'

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export interface FilterState {
  // Category filters
  selectedCategory: number | null
  selectedSubcategories: number[]
  
  // Price filters
  minPrice: number | null
  maxPrice: number | null
  
  // Location filters
  city: string | null
  district: string | null
  
  // Sort & pagination
  sortBy: 'newest' | 'price_asc' | 'price_desc' | 'popular'
  page: number
  limit: number
  
  // Search
  searchQuery: string
  
  // Actions
  setCategory: (categoryId: number | null) => void
  setSubcategories: (subcategoryIds: number[]) => void
  setPriceRange: (min: number | null, max: number | null) => void
  setLocation: (city: string | null, district: string | null) => void
  setSortBy: (sort: FilterState['sortBy']) => void
  setPage: (page: number) => void
  setSearchQuery: (query: string) => void
  resetFilters: () => void
  getActiveFiltersCount: () => number
}

const initialState = {
  selectedCategory: null,
  selectedSubcategories: [],
  minPrice: null,
  maxPrice: null,
  city: null,
  district: null,
  sortBy: 'newest' as const,
  page: 1,
  limit: 20,
  searchQuery: '',
}

export const useFilterStore = create<FilterState>()(
  persist(
    (set, get) => ({
      ...initialState,

      setCategory: (categoryId) => {
        set({ 
          selectedCategory: categoryId,
          selectedSubcategories: [], // Reset subcategories
          page: 1 // Reset page
        })
      },

      setSubcategories: (subcategoryIds) => {
        set({ 
          selectedSubcategories: subcategoryIds,
          page: 1
        })
      },

      setPriceRange: (min, max) => {
        set({ 
          minPrice: min,
          maxPrice: max,
          page: 1
        })
      },

      setLocation: (city, district) => {
        set({ 
          city,
          district,
          page: 1
        })
      },

      setSortBy: (sort) => {
        set({ 
          sortBy: sort,
          page: 1
        })
      },

      setPage: (page) => {
        set({ page })
      },

      setSearchQuery: (query) => {
        set({ 
          searchQuery: query,
          page: 1
        })
      },

      resetFilters: () => {
        set(initialState)
      },

      getActiveFiltersCount: () => {
        const state = get()
        let count = 0
        
        if (state.selectedCategory) count++
        if (state.selectedSubcategories.length > 0) count++
        if (state.minPrice !== null || state.maxPrice !== null) count++
        if (state.city || state.district) count++
        if (state.searchQuery) count++
        
        return count
      },
    }),
    {
      name: 'benalsam-filters-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        selectedCategory: state.selectedCategory,
        minPrice: state.minPrice,
        maxPrice: state.maxPrice,
        city: state.city,
        district: state.district,
        sortBy: state.sortBy,
      }),
    }
  )
)

