/**
 * Advanced Listing Filter Store
 * Enterprise-grade filter state management with URL sync
 */

import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

// ============================================================================
// TYPES
// ============================================================================

export interface LocationFilter {
  city?: string
  district?: string
  neighborhood?: string
}

export interface PriceRange {
  min: number | null
  max: number | null
}

export type SortBy = 'newest' | 'price_low' | 'price_high' | 'popular' | 'relevant'
export type DateRange = 'all' | '24h' | '7d' | '30d'
export type ViewMode = 'grid-2' | 'grid-3' | 'grid-4' | 'list'

export interface FilterState {
  // Basic Filters
  searchQuery: string
  categories: number[]
  location: LocationFilter
  priceRange: PriceRange
  urgency: string | null

  // Advanced Filters
  condition: string[]
  dateRange: DateRange
  showOnlyFeatured: boolean
  showOnlyShowcase: boolean
  showOnlyUrgent: boolean

  // Dynamic Category Attributes
  categoryAttributes: Record<string, string[]>

  // UI State
  sortBy: SortBy
  viewMode: ViewMode
  page: number
  pageSize: number

  // Actions
  setSearchQuery: (query: string) => void
  setCategories: (categories: number[]) => void
  setLocation: (location: LocationFilter) => void
  setPriceRange: (range: PriceRange) => void
  setUrgency: (urgency: string | null) => void
  setCondition: (condition: string[]) => void
  setDateRange: (range: DateRange) => void
  setShowOnlyFeatured: (show: boolean) => void
  setShowOnlyShowcase: (show: boolean) => void
  setShowOnlyUrgent: (show: boolean) => void
  setCategoryAttribute: (key: string, values: string[]) => void
  setSortBy: (sort: SortBy) => void
  setViewMode: (mode: ViewMode) => void
  setPage: (page: number) => void
  resetFilters: () => void
  getActiveFilterCount: () => number
  removeFilter: (filterKey: string) => void
}

// ============================================================================
// INITIAL STATE
// ============================================================================

const initialState = {
  searchQuery: '',
  categories: [],
  location: {},
  priceRange: { min: null, max: null },
  urgency: null,
  condition: [],
  dateRange: 'all' as DateRange,
  showOnlyFeatured: false,
  showOnlyShowcase: false,
  showOnlyUrgent: false,
  categoryAttributes: {},
  sortBy: 'newest' as SortBy,
  viewMode: (typeof window !== 'undefined' 
    ? (localStorage.getItem('viewMode') as ViewMode) || 'grid-3'
    : 'grid-3') as ViewMode,
  page: 1,
  pageSize: 24,
}

// ============================================================================
// STORE
// ============================================================================

export const useFilterStore = create<FilterState>()(
  devtools(
    (set, get) => ({
      ...initialState,

      // Basic Filters
      setSearchQuery: (query) => set({ searchQuery: query, page: 1 }),
      
      setCategories: (categories) => set({ categories, page: 1 }),
      
      setLocation: (location) => set({ location, page: 1 }),
      
      setPriceRange: (range) => set({ priceRange: range, page: 1 }),
      
      setUrgency: (urgency) => set({ urgency, page: 1 }),

      // Advanced Filters
      setCondition: (condition) => set({ condition, page: 1 }),
      
      setDateRange: (range) => set({ dateRange: range, page: 1 }),
      
      setShowOnlyFeatured: (show) => set({ showOnlyFeatured: show, page: 1 }),
      
      setShowOnlyShowcase: (show) => set({ showOnlyShowcase: show, page: 1 }),
      
      setShowOnlyUrgent: (show) => set({ showOnlyUrgent: show, page: 1 }),

      // Dynamic Category Attributes
      setCategoryAttribute: (key, values) => 
        set((state) => ({
          categoryAttributes: { ...state.categoryAttributes, [key]: values },
          page: 1
        })),

      // UI State
      setSortBy: (sort) => set({ sortBy: sort, page: 1 }),
      
      setViewMode: (mode) => {
        if (typeof window !== 'undefined') {
          localStorage.setItem('viewMode', mode)
        }
        set({ viewMode: mode })
      },
      
      setPage: (page) => set({ page }),

      // Reset
      resetFilters: () => set({
        ...initialState,
        viewMode: get().viewMode, // Keep view mode
      }),

      // Get active filter count
      getActiveFilterCount: () => {
        const state = get()
        let count = 0

        if (state.searchQuery) count++
        if (state.categories.length) count++
        if (state.location.city) count++
        if (state.priceRange.min !== null || state.priceRange.max !== null) count++
        if (state.urgency) count++
        if (state.condition.length) count++
        if (state.dateRange !== 'all') count++
        if (state.showOnlyFeatured) count++
        if (state.showOnlyShowcase) count++
        if (state.showOnlyUrgent) count++
        count += Object.keys(state.categoryAttributes).filter(
          key => state.categoryAttributes[key].length > 0
        ).length

        return count
      },

      // Remove individual filter
      removeFilter: (filterKey) => {
        const updates: Partial<FilterState> = { page: 1 }

        switch (filterKey) {
          case 'searchQuery':
            updates.searchQuery = ''
            break
          case 'categories':
            updates.categories = []
            break
          case 'location':
            updates.location = {}
            break
          case 'priceRange':
            updates.priceRange = { min: null, max: null }
            break
          case 'urgency':
            updates.urgency = null
            break
          case 'condition':
            updates.condition = []
            break
          case 'dateRange':
            updates.dateRange = 'all'
            break
          case 'featured':
            updates.showOnlyFeatured = false
            break
          case 'showcase':
            updates.showOnlyShowcase = false
            break
          case 'urgent':
            updates.showOnlyUrgent = false
            break
          default:
            // Category attribute
            if (filterKey.startsWith('attr_')) {
              const attrKey = filterKey.replace('attr_', '')
              updates.categoryAttributes = {
                ...get().categoryAttributes,
                [attrKey]: []
              }
            }
        }

        set(updates)
      },
    }),
    { name: 'FilterStore' }
  )
)

// ============================================================================
// URL SYNC UTILITIES
// ============================================================================

export const filtersToUrlParams = (state: FilterState): URLSearchParams => {
  const params = new URLSearchParams()

  if (state.searchQuery) params.set('q', state.searchQuery)
  if (state.categories.length) params.set('categories', state.categories.join(','))
  if (state.location.city) params.set('city', state.location.city)
  if (state.location.district) params.set('district', state.location.district)
  if (state.location.neighborhood) params.set('neighborhood', state.location.neighborhood)
  if (state.priceRange.min !== null) params.set('minPrice', state.priceRange.min.toString())
  if (state.priceRange.max !== null) params.set('maxPrice', state.priceRange.max.toString())
  if (state.urgency) params.set('urgency', state.urgency)
  if (state.condition.length) params.set('condition', state.condition.join(','))
  if (state.dateRange !== 'all') params.set('dateRange', state.dateRange)
  if (state.showOnlyFeatured) params.set('featured', '1')
  if (state.showOnlyShowcase) params.set('showcase', '1')
  if (state.showOnlyUrgent) params.set('urgent', '1')
  if (state.sortBy !== 'newest') params.set('sort', state.sortBy)
  if (state.page > 1) params.set('page', state.page.toString())

  // Category attributes
  Object.entries(state.categoryAttributes).forEach(([key, values]) => {
    if (values.length) {
      params.set(`attr_${key}`, values.join(','))
    }
  })

  return params
}

export const urlParamsToFilters = (params: URLSearchParams): Partial<FilterState> => {
  const filters: Partial<FilterState> = {}

  const q = params.get('q')
  if (q) filters.searchQuery = q

  const categories = params.get('categories')
  if (categories) filters.categories = categories.split(',').map(Number)

  const city = params.get('city')
  const district = params.get('district')
  const neighborhood = params.get('neighborhood')
  if (city || district || neighborhood) {
    filters.location = { city: city || undefined, district: district || undefined, neighborhood: neighborhood || undefined }
  }

  const minPrice = params.get('minPrice')
  const maxPrice = params.get('maxPrice')
  if (minPrice || maxPrice) {
    filters.priceRange = {
      min: minPrice ? Number(minPrice) : null,
      max: maxPrice ? Number(maxPrice) : null
    }
  }

  const urgency = params.get('urgency')
  if (urgency) filters.urgency = urgency

  const condition = params.get('condition')
  if (condition) filters.condition = condition.split(',')

  const dateRange = params.get('dateRange') as DateRange
  if (dateRange) filters.dateRange = dateRange

  if (params.get('featured')) filters.showOnlyFeatured = true
  if (params.get('showcase')) filters.showOnlyShowcase = true
  if (params.get('urgent')) filters.showOnlyUrgent = true

  const sort = params.get('sort') as SortBy
  if (sort) filters.sortBy = sort

  const page = params.get('page')
  if (page) filters.page = Number(page)

  // Category attributes
  const categoryAttributes: Record<string, string[]> = {}
  params.forEach((value, key) => {
    if (key.startsWith('attr_')) {
      const attrKey = key.replace('attr_', '')
      categoryAttributes[attrKey] = value.split(',')
    }
  })
  if (Object.keys(categoryAttributes).length) {
    filters.categoryAttributes = categoryAttributes
  }

  return filters
}
