/**
 * Advanced Listings Page (/ilanlar)
 * 
 * Enterprise-grade listing search with:
 * - Advanced filtering (category, location, price, attributes)
 * - URL state sync
 * - Infinite scroll
 * - Grid/List view toggle
 * - Sort options
 * - Active filter chips
 * - Mobile responsive (bottom sheet for filters)
 * - SEO optimized
 */

'use client'

import { useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useFilterStore, filtersToUrlParams, urlParamsToFilters } from '@/stores/filterStore'
import { FilterSidebar } from '@/components/listings/FilterSidebar'
import { ActiveFiltersBar } from '@/components/listings/ActiveFiltersBar'
import { ListingsGrid } from '@/components/listings/ListingsGrid'
import { SortDropdown } from '@/components/listings/SortDropdown'
import { ViewToggle } from '@/components/listings/ViewToggle'
import { FilterBottomSheet } from '@/components/listings/FilterBottomSheet'
import { ScrollToTop } from '@/components/ScrollToTop'
import { Skeleton } from '@/components/ui/skeleton'

export default function ListingsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const filterStore = useFilterStore()

  // Sync URL params to store on mount and URL change
  useEffect(() => {
    const filters = urlParamsToFilters(searchParams)
    
    // Apply filters to store
    if (filters.searchQuery !== undefined) filterStore.setSearchQuery(filters.searchQuery)
    if (filters.categories) filterStore.setCategories(filters.categories)
    if (filters.location) filterStore.setLocation(filters.location)
    if (filters.priceRange) filterStore.setPriceRange(filters.priceRange)
    if (filters.urgency !== undefined) filterStore.setUrgency(filters.urgency)
    if (filters.condition) filterStore.setCondition(filters.condition)
    if (filters.dateRange) filterStore.setDateRange(filters.dateRange)
    if (filters.showOnlyFeatured !== undefined) filterStore.setShowOnlyFeatured(filters.showOnlyFeatured)
    if (filters.showOnlyShowcase !== undefined) filterStore.setShowOnlyShowcase(filters.showOnlyShowcase)
    if (filters.showOnlyUrgent !== undefined) filterStore.setShowOnlyUrgent(filters.showOnlyUrgent)
    if (filters.sortBy) filterStore.setSortBy(filters.sortBy)
    if (filters.page) filterStore.setPage(filters.page)
    if (filters.categoryAttributes) {
      Object.entries(filters.categoryAttributes).forEach(([key, values]) => {
        filterStore.setCategoryAttribute(key, values)
      })
    }
  }, [searchParams])

  // Sync store to URL on filter changes
  useEffect(() => {
    const params = filtersToUrlParams(filterStore)
    const newUrl = params.toString() ? `/ilanlar?${params.toString()}` : '/ilanlar'
    router.replace(newUrl, { scroll: false })
  }, [
    filterStore.searchQuery,
    filterStore.categories,
    filterStore.location,
    filterStore.priceRange,
    filterStore.urgency,
    filterStore.condition,
    filterStore.dateRange,
    filterStore.showOnlyFeatured,
    filterStore.showOnlyShowcase,
    filterStore.showOnlyUrgent,
    filterStore.categoryAttributes,
    filterStore.sortBy,
    filterStore.page,
  ])

  const activeFilterCount = filterStore.getActiveFilterCount()

  return (
    <div className="min-h-screen bg-background">
      {/* Page Header */}
      <section className="bg-muted/30 border-b">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold mb-2">Tüm İlanlar</h1>
          <p className="text-muted-foreground">
            Binlerce ilan arasından gelişmiş filtrelerle tam olarak aradığını bul
          </p>
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Filter Sidebar - Desktop */}
          <aside className="hidden lg:block lg:col-span-1">
            <div className="bg-card rounded-lg border p-6 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Filtreler</h2>
                {activeFilterCount > 0 && (
                  <span className="text-sm bg-primary text-primary-foreground px-2 py-1 rounded-full">
                    {activeFilterCount}
                  </span>
                )}
              </div>
              <FilterSidebar />
            </div>
          </aside>

          {/* Main Content Area */}
          <div className="lg:col-span-3 space-y-4">
            {/* Active Filters Bar */}
            {activeFilterCount > 0 && (
              <ActiveFiltersBar />
            )}

            {/* Controls Bar */}
            <div className="flex items-center justify-between gap-4 bg-card rounded-lg border p-4">
              {/* Mobile Filter Button */}
              <div className="lg:hidden">
                <FilterBottomSheet />
              </div>

              {/* Sort Dropdown */}
              <SortDropdown />

              {/* View Toggle */}
              <ViewToggle />
            </div>

            {/* Listings Grid */}
            <ListingsGrid />
          </div>
        </div>
      </div>

      {/* Scroll to Top */}
      <ScrollToTop />
    </div>
  )
}

// Loading State
export function ListingsPageSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <section className="bg-muted/30 border-b">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Skeleton className="h-9 w-48 mb-2" />
          <Skeleton className="h-5 w-96" />
        </div>
      </section>

      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <aside className="hidden lg:block">
            <Skeleton className="h-[600px] rounded-lg" />
          </aside>
          <div className="lg:col-span-3 space-y-4">
            <Skeleton className="h-16 rounded-lg" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(9)].map((_, i) => (
                <Skeleton key={i} className="h-64 rounded-lg" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

