/**
 * Filtered Listings Component with Infinite Scroll
 * 
 * Displays filtered listings with infinite scroll pagination
 */

'use client'

import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useInView } from 'react-intersection-observer'
import { useEffect, useState, useMemo } from 'react'
import { listingService } from '@/services/listingService'
import ListingCard from '@/components/ListingCard'
import { Skeleton } from '@/components/ui/skeleton'
import { Loader2, AlertCircle, ArrowUpDown, Star, Crown, Zap } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { ViewToggle } from './ViewToggle'
import { ActiveFilterBadge } from './ActiveFilterBadge'
import { QuickViewModal } from './QuickViewModal'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { FilterState } from './FilterSidebar'

interface FilteredListingsProps {
  filters: FilterState
  onClearFilters?: () => void
}

export default function FilteredListings({ filters, onClearFilters }: FilteredListingsProps) {
  const { user } = useAuth()
  const { ref, inView } = useInView()
  const queryClient = useQueryClient()
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [sortBy, setSortBy] = useState<'newest' | 'price_low' | 'price_high' | 'popular'>('newest')
  const [quickViewListing, setQuickViewListing] = useState<{
    id: string
    title: string
    description?: string
    budget?: number
    currency?: string
    location?: string
    category?: string
    main_image_url?: string
    additional_image_urls?: string[]
    view_count?: number
    created_at?: string
    urgency?: string
    is_featured?: boolean
    is_showcase?: boolean
    is_urgent_premium?: boolean
    profiles?: {
      id: string
      name: string
      avatar_url?: string
      rating?: number
    }
  } | null>(null)

  // Optimistic update mutation for favorites
  const toggleFavoriteMutation = useMutation({
    mutationFn: async ({ listingId, isFavorited }: { listingId: string, isFavorited: boolean }) => {
      // API call would go here
      console.log('Toggle favorite:', listingId, isFavorited)
      return { listingId, isFavorited }
    },
    onMutate: async ({ listingId, isFavorited }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['filtered-listings', filters, user?.id, sortBy] })

      // Snapshot the previous value
      const previousData = queryClient.getQueryData(['filtered-listings', filters, user?.id, sortBy])

      // Optimistically update the cache
      queryClient.setQueryData(['filtered-listings', filters, user?.id, sortBy], (old: any) => {
        if (!old) return old
        
        return {
          ...old,
          pages: old.pages.map((page: any) => ({
            ...page,
            listings: page.listings.map((listing: any) =>
              listing.id === listingId
                ? { ...listing, is_favorited: isFavorited }
                : listing
            )
          }))
        }
      })

      return { previousData }
    },
    onError: (err, variables, context) => {
      // Revert the optimistic update on error
      if (context?.previousData) {
        queryClient.setQueryData(['filtered-listings', filters, user?.id, sortBy], context.previousData)
      }
    },
    onSettled: () => {
      // Refetch after error or success
      queryClient.invalidateQueries({ queryKey: ['filtered-listings', filters, user?.id, sortBy] })
    },
  })

  // Count active filters
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.categoryId) count++;
    if (filters.minPrice || filters.maxPrice) count++;
    if (filters.location) count++;
    if (filters.urgency) count++;
    if (filters.searchQuery) count++;
    return count;
  }, [filters])

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
  } = useInfiniteQuery({
    queryKey: ['filtered-listings', filters, user?.id, sortBy],
    queryFn: async ({ pageParam = 1 }) => {
      console.log('🔍 [FilteredListings] Fetching page:', pageParam, 'with filters:', filters)
      
      // Determine sort field and order based on sortBy filter
      let sortField = 'created_at'
      let sortOrder: 'asc' | 'desc' = 'desc'
      
      switch (sortBy) {
        case 'newest':
          sortField = 'created_at'
          sortOrder = 'desc'
          break
        case 'price_low':
          sortField = 'budget'
          sortOrder = 'asc'
          break
        case 'price_high':
          sortField = 'budget'
          sortOrder = 'desc'
          break
        case 'popular':
          sortField = 'view_count'
          sortOrder = 'desc'
          break
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
          sortBy: sortField,
          sortOrder: sortOrder,
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

  // Dynamic results message
  const getResultsMessage = () => {
    if (isLoading) return 'Yükleniyor...'
    if (error) return 'Hata oluştu'
    if (totalCount === 0) return 'İlan bulunamadı'
    if (totalCount === 1) return '1 ilan bulundu'
    return `${totalCount.toLocaleString('tr-TR')} ilan bulundu`
  }

  // Premium badges function
  const getPremiumBadges = (listing: {
    id: string
    title: string
    is_featured?: boolean
    is_showcase?: boolean
    is_urgent_premium?: boolean
  }) => {
    const badges = []
    
    if (listing.is_featured) {
      badges.push({
        icon: Star,
        label: 'Öne Çıkan',
        color: 'bg-yellow-500 hover:bg-yellow-600'
      })
    }
    
    if (listing.is_showcase) {
      badges.push({
        icon: Crown,
        label: 'Vitrin',
        color: 'bg-purple-500 hover:bg-purple-600'
      })
    }
    
    if (listing.is_urgent_premium) {
      badges.push({
        icon: Zap,
        label: 'Acil Premium',
        color: 'bg-red-500 hover:bg-red-600'
      })
    }
    
    return badges
  }

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
            <span className="text-base font-normal text-muted-foreground ml-3">
              ({getResultsMessage()})
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

  if (allListings.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">
            İlanlar
            <span className="text-base font-normal text-muted-foreground ml-3">
              ({getResultsMessage()})
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
              ({getResultsMessage()})
            </span>
          </h2>
          {onClearFilters && (
            <ActiveFilterBadge 
              count={activeFilterCount} 
              onClear={onClearFilters} 
            />
          )}
        </div>
        
        <div className="flex items-center gap-3">
          {/* Sort Dropdown */}
          <Select value={sortBy} onValueChange={(value: 'newest' | 'price_low' | 'price_high' | 'popular') => setSortBy(value)}>
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
      <div className={
        view === 'grid' 
          ? "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6"
          : "flex flex-col gap-4"
      }>
        {allListings.map((listing, index: number) => (
          <div 
            key={listing.id}
            className="animate-fadeInUp hover-lift"
            style={{ animationDelay: `${(index % 12) * 50}ms` }}
          >
            <ListingCard
              listing={listing}
              currentUser={user}
              priority={index < 6} // First 6 cards load with priority
              onToggleFavorite={(listingId: string) => {
                const listing = allListings.find(l => l.id === listingId)
                if (listing) {
                  toggleFavoriteMutation.mutate({
                    listingId,
                    isFavorited: !listing.is_favorited
                  })
                }
              }}
              onView={(listing) => setQuickViewListing(listing)}
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

