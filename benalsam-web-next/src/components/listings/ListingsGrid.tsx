/**
 * ListingsGrid Component
 * Main listings display with pagination
 */

'use client'

import { useQuery } from '@tanstack/react-query'
import { useFilterStore } from '@/stores/filterStore'
import { useAuth } from '@/contexts/AuthContext'
import { useEffect, useState } from 'react'
import ListingCard from '@/components/ListingCard'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { AlertCircle, Inbox, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

// Temporary fetch function - will be replaced with proper service
async function fetchListingsWithAdvancedFilters(
  filters: any,
  userId: string | undefined,
  page: number
) {
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
  
  // 🆕 Add attribute filters
  if (filters.categoryAttributes && Object.keys(filters.categoryAttributes).length > 0) {
    Object.entries(filters.categoryAttributes).forEach(([key, values]) => {
      if (values && values.length > 0) {
        params.set(`attr_${key}`, values.join(','))
      }
    })
  }
  
  params.set('sort', filters.sortBy)
  params.set('page', page.toString())
  params.set('pageSize', filters.pageSize.toString())

  const response = await fetch(`/api/listings?${params.toString()}`)
  if (!response.ok) throw new Error('Failed to fetch listings')
  return response.json()
}

// Pagination Component
interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}

function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  // Generate page numbers to show
  const getPageNumbers = () => {
    const delta = 2 // Show 2 pages on each side
    const range: (number | string)[] = []
    const rangeWithDots: (number | string)[] = []

    for (let i = 1; i <= totalPages; i++) {
      if (
        i === 1 ||
        i === totalPages ||
        (i >= currentPage - delta && i <= currentPage + delta)
      ) {
        range.push(i)
      }
    }

    let l: number | undefined
    range.forEach((i) => {
      if (l) {
        if (i - l === 2) {
          rangeWithDots.push(l + 1)
        } else if (i - l !== 1) {
          rangeWithDots.push('...')
        }
      }
      rangeWithDots.push(i)
      l = typeof i === 'number' ? i : undefined
    })

    return rangeWithDots
  }

  const pageNumbers = getPageNumbers()

  return (
    <div className="flex items-center justify-center gap-2 py-8">
      {/* Previous Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="gap-1"
      >
        <ChevronLeft className="w-4 h-4" />
        Önceki
      </Button>

      {/* Page Numbers */}
      <div className="flex items-center gap-1">
        {pageNumbers.map((page, index) => {
          if (page === '...') {
            return (
              <span key={`dots-${index}`} className="px-2 py-1 text-muted-foreground">
                ...
              </span>
            )
          }

          const pageNum = page as number
          const isActive = pageNum === currentPage

          return (
            <Button
              key={pageNum}
              variant={isActive ? 'default' : 'outline'}
              size="sm"
              onClick={() => onPageChange(pageNum)}
              className={cn(
                'min-w-[40px]',
                isActive && 'bg-primary text-primary-foreground'
              )}
            >
              {pageNum}
            </Button>
          )
        })}
      </div>

      {/* Next Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="gap-1"
      >
        Sonraki
        <ChevronRight className="w-4 h-4" />
      </Button>

      {/* Page Info */}
      <div className="ml-4 text-sm text-muted-foreground">
        Sayfa {currentPage} / {totalPages}
      </div>
    </div>
  )
}

export function ListingsGrid() {
  const filterStore = useFilterStore()
  const { user } = useAuth()
  const [isMounted, setIsMounted] = useState(false)

  // 🔧 Fix hydration mismatch
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Get current page from filterStore (default 1)
  const currentPage = filterStore.page || 1

  // Fetch listings with filters (single page)
  const {
    data,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['advanced-listings', filterStore, user?.id, currentPage],
    queryFn: () => fetchListingsWithAdvancedFilters(filterStore, user?.id, currentPage),
  })

  const listings = data?.listings || data?.data || []
  const pagination = data?.pagination
  const totalCount = pagination?.total || 0
  const totalPages = pagination?.totalPages || 1

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
  if (listings.length === 0) {
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
        {listings.map((listing: any, index: number) => (
          <ListingCard
            key={`${listing.id}-${index}`}
            listing={listing}
            priority={index < 6}
            isLarge={filterStore.viewMode === 'list'}
          />
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination 
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={(page) => {
            filterStore.setPage(page)
            // Scroll to top when page changes
            window.scrollTo({ top: 0, behavior: 'smooth' })
          }}
        />
      )}
    </div>
  )
}

