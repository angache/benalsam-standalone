/**
 * Homepage - Modern Design with Filters & Infinite Scroll
 * 
 * Production homepage featuring:
 * - Hero section with gradient background
 * - AI-powered search
 * - Popular categories grid
 * - Quick action buttons
 * - Feature cards
 * - Advanced filtering (category, price, location, urgency)
 * - Infinite scroll pagination
 * - Responsive design (mobile drawer for filters)
 * - Smooth animations and transitions
 * 
 * Note: Old homepage backed up at page.old.tsx
 */

'use client'

import { Suspense, useState, useCallback, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import HeroSection from '@/components/home/HeroSection'
import PopularCategories from '@/components/home/PopularCategories'
import QuickActions from '@/components/home/QuickActions'
import FeatureCards from '@/components/home/FeatureCards'
import FilteredListings from '@/components/home/FilteredListings'
import FilterSidebar, { FilterState } from '@/components/home/FilterSidebar'
import SearchWithAI from '@/components/home/SearchWithAI'
import { PopularListings } from '@/components/home/PopularListings'
import { RecentlyViewed } from '@/components/home/RecentlyViewed'
import { AIRecommendations } from '@/components/home/AIRecommendations'
import { ScrollToTop } from '@/components/ScrollToTop'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { SlidersHorizontal } from 'lucide-react'

export default function HomePageV2() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // Initialize filters from URL params
  const [filters, setFilters] = useState<FilterState>({
    categoryId: searchParams.get('category') ? parseInt(searchParams.get('category')!) : null,
    minPrice: searchParams.get('minPrice') ? parseFloat(searchParams.get('minPrice')!) : null,
    maxPrice: searchParams.get('maxPrice') ? parseFloat(searchParams.get('maxPrice')!) : null,
    location: searchParams.get('location') || null,
    urgency: searchParams.get('urgency') || null,
    sortBy: searchParams.get('sortBy') || null,
    searchQuery: searchParams.get('search') || null,
  })

  // Update URL params when filters change
  const handleFiltersChange = useCallback((newFilters: FilterState) => {
    setFilters(newFilters)
    
    // Build URL params
    const params = new URLSearchParams()
    if (newFilters.categoryId) params.set('category', newFilters.categoryId.toString())
    if (newFilters.minPrice) params.set('minPrice', newFilters.minPrice.toString())
    if (newFilters.maxPrice) params.set('maxPrice', newFilters.maxPrice.toString())
    if (newFilters.location) params.set('location', newFilters.location)
    if (newFilters.urgency) params.set('urgency', newFilters.urgency)
    if (newFilters.sortBy) params.set('sortBy', newFilters.sortBy)
    if (newFilters.searchQuery) params.set('search', newFilters.searchQuery)
    
    // Update URL without full page reload
    const newUrl = params.toString() ? `/?${params.toString()}` : '/'
    router.push(newUrl, { scroll: false })
  }, [router])

  const handleResetFilters = useCallback(() => {
    setFilters({
      categoryId: null,
      minPrice: null,
      maxPrice: null,
      location: null,
      urgency: null,
      sortBy: null,
      searchQuery: null,
    })
    router.push('/', { scroll: false })
  }, [router])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // / - Focus search
      if (e.key === '/' && !e.ctrlKey && !e.metaKey) {
        const searchInput = document.querySelector('input[type="text"]') as HTMLInputElement
        if (searchInput && document.activeElement !== searchInput) {
          e.preventDefault()
          searchInput.focus()
        }
      }
      
      // Esc - Clear filters or blur input
      if (e.key === 'Escape') {
        const activeElement = document.activeElement as HTMLElement
        if (activeElement?.tagName === 'INPUT' || activeElement?.tagName === 'TEXTAREA') {
          activeElement.blur()
        } else if (filters.categoryId || filters.minPrice || filters.maxPrice || filters.location || filters.urgency || filters.searchQuery) {
          handleResetFilters()
        }
      }
      
      // Ctrl/Cmd + K - Focus search (alternative)
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        const searchInput = document.querySelector('input[type="text"]') as HTMLInputElement
        if (searchInput) {
          searchInput.focus()
          searchInput.select()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [filters, handleResetFilters])

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <Suspense fallback={<div className="h-96 bg-muted animate-pulse" />}>
        <HeroSection />
      </Suspense>

      {/* Search with AI Suggestions */}
      <section className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-10">
        <Suspense fallback={<div className="h-16 bg-muted animate-pulse rounded-lg" />}>
          <SearchWithAI />
        </Suspense>
      </section>

      {/* Quick Actions */}
      <section className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Suspense fallback={<div className="h-20 bg-muted animate-pulse rounded-lg" />}>
          <QuickActions />
        </Suspense>
      </section>

      {/* Popular Categories */}
      <section className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <PopularCategories />
      </section>

      {/* Feature Cards */}
      <section className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Suspense fallback={<div className="h-48 bg-muted animate-pulse rounded-lg" />}>
          <FeatureCards />
        </Suspense>
      </section>

      {/* Popular Listings */}
      <Suspense fallback={<div className="h-96 bg-muted animate-pulse rounded-lg" />}>
        <PopularListings />
      </Suspense>

      {/* Recently Viewed */}
      <RecentlyViewed />

      {/* AI Recommendations */}
      <Suspense fallback={<div className="h-96 bg-muted animate-pulse rounded-lg" />}>
        <AIRecommendations />
      </Suspense>

      {/* Filtered Listings with Sidebar */}
      <section className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Filter Sidebar - Desktop */}
          <aside className="hidden lg:block lg:col-span-1">
            <FilterSidebar
              filters={filters}
              onFiltersChange={handleFiltersChange}
              onReset={handleResetFilters}
            />
          </aside>

          {/* Listings Grid */}
          <div className="lg:col-span-3">
            {/* Mobile Filter Button */}
            <div className="lg:hidden mb-4">
              <Sheet>
                <SheetTrigger asChild>
                  <Button 
                    variant="outline" 
                    className="w-full"
                  >
                    <SlidersHorizontal className="w-4 h-4 mr-2" />
                    Filtrele
                  </Button>
                </SheetTrigger>
                <SheetContent className="w-full sm:w-96 overflow-y-auto">
                  <SheetHeader>
                    <SheetTitle>Filtreler</SheetTitle>
                  </SheetHeader>
                  <div className="mt-6">
                    <FilterSidebar
                      filters={filters}
                      onFiltersChange={handleFiltersChange}
                      onReset={handleResetFilters}
                    />
                  </div>
                </SheetContent>
              </Sheet>
            </div>

            <FilteredListings 
              filters={filters} 
              onClearFilters={handleResetFilters}
            />
          </div>
        </div>
      </section>

      {/* Scroll to Top Button */}
      <ScrollToTop />
    </div>
  )
}

