/**
 * Filtered Listings Component with Infinite Scroll
 * 
 * Displays filtered listings with infinite scroll pagination
 * Refactored to use custom hooks for better code organization
 */

'use client'

import { useState, useMemo } from 'react'
import ListingCard from '@/components/ListingCard'
import { Skeleton } from '@/components/ui/skeleton'
import { Loader2, AlertCircle, ArrowUpDown } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { ViewToggle } from './ViewToggle'
import { ActiveFilterBadge } from './ActiveFilterBadge'
import { QuickViewModal } from './QuickViewModal'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/components/ui/use-toast'
import type { FilterState } from './FilterSidebar'
import { useFilteredListings } from '@/hooks/useFilteredListings'
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll'
import { useListingFavorites } from '@/hooks/useListingFavorites'
import { useViewPreference } from '@/hooks/useViewPreference'
import { useSortOptions } from '@/hooks/useSortOptions'
import { getPremiumBadges, getResultsMessage, getGridClassName } from '@/utils/listingUtils'
import type { Listing } from '@/types'

interface FilteredListingsProps {
  filters: FilterState
  onClearFilters?: () => void
}

// Quick view listing type
type QuickViewListing = Pick<
  Listing,
  | 'id'
  | 'title'
  | 'description'
  | 'budget'
  | 'currency'
  | 'location'
  | 'category'
  | 'main_image_url'
  | 'additional_image_urls'
  | 'view_count'
  | 'created_at'
  | 'urgency'
  | 'is_featured'
  | 'is_showcase'
  | 'is_urgent_premium'
> & {
  profiles?: {
    id: string
    name: string
    avatar_url?: string
    rating?: number
  }
}

export default function FilteredListings({ filters, onClearFilters }: FilteredListingsProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  
  // View preference management
  const { view, setView } = useViewPreference('grid-3')
  
  // Sort options management
  const { sortBy, setSortBy } = useSortOptions('newest')
  
  // Quick view state
  const [quickViewListing, setQuickViewListing] = useState<QuickViewListing | null>(null)

  // Fetch filtered listings with infinite scroll
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
  } = useFilteredListings({
    filters,
    sortBy,
    userId: user?.id || null,
    pageSize: 12,
  })

  // Infinite scroll logic
  const allListings = data?.pages.flatMap((page) => page.listings) || []
  const totalCount = data?.pages[0]?.totalCount || 0

  const { ref } = useInfiniteScroll({
    hasNextPage: !!hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    itemCount: allListings.length,
  })

  // Favorite mutation
  const toggleFavoriteMutation = useListingFavorites({
    userId: user?.id || '',
    filters,
    sortBy,
  })

  // Count active filters
  const activeFilterCount = useMemo(() => {
    let count = 0
    if (filters.categoryId) count++
    if (filters.minPrice || filters.maxPrice) count++
    if (filters.location) count++
    if (filters.urgency) count++
    if (filters.searchQuery) count++
    return count
  }, [filters])

  // Handle favorite toggle
  const handleToggleFavorite = (listingId: string) => {
    const listing = allListings.find((l) => l.id === listingId)
    if (listing && user?.id) {
      // Geçerli favori durumunu al (undefined ise false kabul et)
      const currentStatus = listing.is_favorited ?? false
      const newStatus = !currentStatus

      toggleFavoriteMutation.mutate({
        listingId,
        isFavorited: newStatus,
      })
    }
  }

  // Loading state
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

  // Error state
  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">
            İlanlar
            <span className="text-base font-normal text-muted-foreground ml-3">
              ({getResultsMessage(isLoading, error, totalCount)})
            </span>
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

  // Empty state
  if (allListings.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">
            İlanlar
            <span className="text-base font-normal text-muted-foreground ml-3">
              ({getResultsMessage(isLoading, error, totalCount)})
            </span>
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
    <>
      <div className="space-y-6">
        {/* Header with View Toggle and Active Filters */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">
              İlanlar
              <span className="text-base font-normal text-muted-foreground ml-3">
                ({getResultsMessage(isLoading, error, totalCount)})
              </span>
            </h2>
            {onClearFilters && (
              <ActiveFilterBadge 
                count={activeFilterCount} 
                onClear={() => {
                  onClearFilters()
                  toast({
                    title: "🗑️ Filtreler Temizlendi",
                    description: "Tüm filtreler kaldırıldı",
                  })
                }} 
              />
            )}
          </div>
          
          <div className="flex items-center gap-3">
            {/* Sort Dropdown */}
            <Select 
              value={sortBy} 
              onValueChange={setSortBy}
            >
              <SelectTrigger className="w-[180px]">
                <ArrowUpDown className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Sırala" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">En Yeni</SelectItem>
                <SelectItem value="price_low">En Ucuz</SelectItem>
                <SelectItem value="price_high">En Pahalı</SelectItem>
                <SelectItem value="popular">Popüler</SelectItem>
              </SelectContent>
            </Select>
            
            <ViewToggle view={view} onViewChange={setView} />
          </div>
        </div>

        {/* Listings Grid/List */}
        <div className={getGridClassName(view)}>
          {allListings.map((listing, index: number) => (
            <div 
              key={listing.id}
              data-listing-index={index}
              className="animate-fadeInUp hover-lift"
              style={{ animationDelay: `${(index % 12) * 50}ms` }}
            >
              <ListingCard
                listing={listing}
                currentUser={user}
                priority={index < 6} // First 6 cards load with priority
                onToggleFavorite={handleToggleFavorite}
                onView={(listing) => setQuickViewListing(listing as QuickViewListing)}
                getPremiumBadges={getPremiumBadges}
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
      
      {/* Quick View Modal */}
      {quickViewListing && (
        <QuickViewModal
          listing={quickViewListing}
          onClose={() => setQuickViewListing(null)}
        />
      )}
    </>
  )
}
