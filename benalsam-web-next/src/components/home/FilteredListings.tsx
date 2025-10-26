/**
 * Filtered Listings Component with Infinite Scroll
 * 
 * Displays filtered listings with infinite scroll pagination
 */

'use client'

import { useInfiniteQuery } from '@tanstack/react-query'
import { useInView } from 'react-intersection-observer'
import { useEffect } from 'react'
import { listingService } from '@/services/listingService'
import ListingCard from '@/components/ListingCard'
import { Skeleton } from '@/components/ui/skeleton'
import { Loader2, AlertCircle } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import type { FilterState } from './FilterSidebar'

interface FilteredListingsProps {
  filters: FilterState
}

export default function FilteredListings({ filters }: FilteredListingsProps) {
  const { user } = useAuth()
  const { ref, inView } = useInView()

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
  } = useInfiniteQuery({
    queryKey: ['filtered-listings', filters, user?.id],
    queryFn: async ({ pageParam = 1 }) => {
      console.log('🔍 [FilteredListings] Fetching page:', pageParam, 'with filters:', filters)
      
      // Determine sort field and order based on sortBy filter
      let sortBy = 'created_at'
      let sortOrder: 'asc' | 'desc' = 'desc'
      
      if (filters.sortBy === 'newest') {
        sortBy = 'created_at'
        sortOrder = 'desc'
      } else if (filters.sortBy === 'cheapest') {
        sortBy = 'budget'
        sortOrder = 'asc'
      } else if (filters.sortBy === 'expensive') {
        sortBy = 'budget'
        sortOrder = 'desc'
      } else if (filters.sortBy === 'popular') {
        sortBy = 'view_count'
        sortOrder = 'desc'
      }
      
      // Use ES + Supabase fallback with filters
      const result = await listingService.getListingsWithFilters(
        user?.id || null,
        {
          search: filters.searchQuery || undefined,
          categoryId: filters.categoryId || undefined,
          minPrice: filters.minPrice || undefined,
          maxPrice: filters.maxPrice || undefined,
          location: filters.location || undefined,
          urgency: filters.urgency || undefined,
          sortBy,
          sortOrder,
        },
        {
          page: pageParam,
          limit: 12
        }
      )

      return {
        listings: result.listings,
        totalCount: result.total,
        page: pageParam,
      }
    },
    getNextPageParam: (lastPage, allPages) => {
      const totalPages = Math.ceil(lastPage.totalCount / 12)
      const nextPage = allPages.length + 1
      return nextPage <= totalPages ? nextPage : undefined
    },
    initialPageParam: 1,
    staleTime: 1 * 60 * 1000, // 1 minute
  })

  // Fetch next page when scrolling to bottom
  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }, [inView, fetchNextPage, hasNextPage, isFetchingNextPage])

  // Flatten all pages into single array
  const allListings = data?.pages.flatMap((page) => page.listings) || []
  const totalCount = data?.pages[0]?.totalCount || 0

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fadeIn">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-48" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="space-y-3 animate-fadeInUp" style={{ animationDelay: `${i * 50}ms` }}>
              <Skeleton className="h-48 w-full" />
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <div className="flex gap-2">
                <Skeleton className="h-10 flex-1" />
                <Skeleton className="h-10 w-10" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">
            İlanlar
          </h2>
        </div>
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <AlertCircle className="w-16 h-16 text-destructive mb-4" />
          <h3 className="text-xl font-semibold text-foreground mb-2">
            İlanlar Yüklenemedi
          </h3>
          <p className="text-muted-foreground">
            Bir hata oluştu. Lütfen daha sonra tekrar deneyin.
          </p>
        </div>
      </div>
    )
  }

  if (allListings.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">
            İlanlar
          </h2>
        </div>
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
            <AlertCircle className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold text-foreground mb-2">
            İlan Bulunamadı
          </h3>
          <p className="text-muted-foreground">
            Seçtiğiniz filtrelere uygun ilan bulunmuyor.
            <br />
            Filtreleri değiştirmeyi deneyin.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl md:text-3xl font-bold text-foreground">
          İlanlar
          <span className="text-base font-normal text-muted-foreground ml-3">
            ({totalCount} ilan)
          </span>
        </h2>
      </div>

      {/* Listings Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
        {allListings.map((listing: any, index: number) => (
          <div 
            key={listing.id}
            className="animate-fadeInUp hover-lift"
            style={{ animationDelay: `${(index % 12) * 50}ms` }}
          >
            <ListingCard
              listing={listing}
              currentUser={user}
              onToggleFavorite={async (listingId, isFavorited) => {
                console.log('Toggle favorite:', listingId, isFavorited)
              }}
              size="normal"
            />
          </div>
        ))}
      </div>

      {/* Infinite Scroll Trigger */}
      {hasNextPage && (
        <div ref={ref} className="flex justify-center py-8">
          {isFetchingNextPage ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Daha fazla ilan yükleniyor...</span>
            </div>
          ) : (
            <div className="text-muted-foreground">
              Daha fazla ilan yüklemek için aşağı kaydırın
            </div>
          )}
        </div>
      )}

      {/* End of list message */}
      {!hasNextPage && allListings.length > 0 && (
        <div className="text-center py-8 text-muted-foreground">
          Tüm ilanlar gösteriliyor
        </div>
      )}
    </div>
  )
}

