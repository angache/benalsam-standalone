/**
 * ListingsGrid Component
 * Main listings display with infinite scroll
 */

'use client'

import { useInfiniteQuery } from '@tanstack/react-query'
import { useFilterStore } from '@/stores/filterStore'
import { useAuth } from '@/contexts/AuthContext'
import { useInView } from 'react-intersection-observer'
import { useEffect, useState } from 'react'
import ListingCard from '@/components/ListingCard'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { AlertCircle, Inbox } from 'lucide-react'
import { cn } from '@/lib/utils'

// Temporary fetch function - will be replaced with proper service
async function fetchListingsWithAdvancedFilters(
  filters: any,
  userId: string | undefined,
  page: number
) {
  // TODO: Implement proper Elasticsearch query builder
  const params = new URLSearchParams()
  if (filters.searchQuery) params.set('q', filters.searchQuery)
  if (filters.categories.length) params.set('categories', filters.categories.join(','))
  if (filters.location.city) params.set('city', filters.location.city)
  if (filters.priceRange.min) params.set('minPrice', filters.priceRange.min.toString())
  if (filters.priceRange.max) params.set('maxPrice', filters.priceRange.max.toString())
  if (filters.urgency) params.set('urgency', filters.urgency)
  if (filters.dateRange !== 'all') params.set('dateRange', filters.dateRange)
  if (filters.showOnlyFeatured) params.set('featured', '1')
  if (filters.showOnlyShowcase) params.set('showcase', '1')
  if (filters.showOnlyUrgent) params.set('urgent', '1')
  params.set('sort', filters.sortBy)
  params.set('page', page.toString())
  params.set('pageSize', filters.pageSize.toString())

  const response = await fetch(`/api/listings?${params.toString()}`)
  if (!response.ok) throw new Error('Failed to fetch listings')
  return response.json()
}

export function ListingsGrid() {
  const filterStore = useFilterStore()
  const { user } = useAuth()
  const { ref: loadMoreRef, inView } = useInView()
  const [isMounted, setIsMounted] = useState(false)

  // 🔧 Fix hydration mismatch
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Fetch listings with filters
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
  } = useInfiniteQuery({
    queryKey: ['advanced-listings', filterStore, user?.id],
    queryFn: ({ pageParam = 1 }) =>
      fetchListingsWithAdvancedFilters(filterStore, user?.id, pageParam),
    getNextPageParam: (lastPage) => {
      if (!lastPage.pagination) return undefined
      const { page, totalPages } = lastPage.pagination
      return page < totalPages ? page + 1 : undefined
    },
    initialPageParam: 1,
  })

  // Infinite scroll trigger
  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage])

  // Flatten all pages into single array
  const allListings = data?.pages.flatMap((page) => page.listings || page.data || []) || []
  const totalCount = data?.pages[0]?.pagination?.total || 0

  // Grid class based on view mode (use default until mounted to prevent hydration mismatch)
  const gridClass = cn(
    'grid gap-4',
    {
      'grid-cols-1 sm:grid-cols-2': isMounted && filterStore.viewMode === 'grid-2',
      'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3': !isMounted || filterStore.viewMode === 'grid-3', // Default
      'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4': isMounted && filterStore.viewMode === 'grid-4',
      'grid-cols-1': isMounted && filterStore.viewMode === 'list',
    }
  )

  // Loading State
  if (isLoading) {
    return (
      <div className={gridClass}>
        {[...Array(12)].map((_, i) => (
          <Skeleton key={i} className="h-64 rounded-lg" />
        ))}
      </div>
    )
  }

  // Error State
  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <AlertCircle className="w-16 h-16 text-destructive mb-4" />
        <h3 className="text-lg font-semibold mb-2">Bir Hata Oluştu</h3>
        <p className="text-muted-foreground mb-4">
          {error instanceof Error ? error.message : 'İlanlar yüklenirken bir sorun oluştu'}
        </p>
        <Button onClick={() => window.location.reload()}>
          Tekrar Dene
        </Button>
      </div>
    )
  }

  // Empty State
  if (allListings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Inbox className="w-16 h-16 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">İlan Bulunamadı</h3>
        <p className="text-muted-foreground mb-4">
          Arama kriterlerinize uygun ilan bulunamadı. Filtreleri değiştirerek tekrar deneyin.
        </p>
        <Button variant="outline" onClick={() => filterStore.resetFilters()}>
          Filtreleri Temizle
        </Button>
      </div>
    )
  }

  // Listings Grid
  return (
    <div className="space-y-4">
      {/* Results Count */}
      <div className="text-sm text-muted-foreground">
        <span className="font-semibold text-foreground">{totalCount}</span> ilan bulundu
      </div>

      {/* Grid */}
      <div className={gridClass}>
        {allListings.map((listing: any, index: number) => (
          <ListingCard
            key={`${listing.id}-${index}`}
            listing={listing}
            priority={index < 6}
            isLarge={filterStore.viewMode === 'list'}
          />
        ))}
      </div>

      {/* Infinite Scroll Trigger */}
      {hasNextPage && (
        <div ref={loadMoreRef} className="flex justify-center py-8">
          {isFetchingNextPage && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <span>Daha fazla yükleniyor...</span>
            </div>
          )}
        </div>
      )}

      {/* End of Results */}
      {!hasNextPage && allListings.length > 0 && (
        <div className="text-center py-8 text-muted-foreground">
          Tüm ilanlar gösterildi
        </div>
      )}
    </div>
  )
}

