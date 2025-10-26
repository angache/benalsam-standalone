/**
 * Featured Listings Component
 * 
 * Displays featured/recent listings in a responsive grid
 */

'use client'

import { useQuery } from '@tanstack/react-query'
import { listingService } from '@/services/listingService'
import ListingCard from '@/components/ListingCard'
import { Loader2 } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

interface FeaturedListingsProps {
  title?: string
  limit?: number
}

export default function FeaturedListings({ 
  title = 'Son Eklenen İlanlar',
  limit = 8 
}: FeaturedListingsProps) {
  const { user } = useAuth()

  const { data, isLoading } = useQuery({
    queryKey: ['featured-listings', limit, user?.id],
    queryFn: async () => {
      // Use Elasticsearch + Supabase fallback (same as old system)
      const result = await listingService.fetchListings(user?.id || null, { 
        page: 1, 
        limit 
      })
      return result
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  })

  const listings = data?.listings || []

  if (isLoading) {
    return (
      <div id="featured-listings">
        <h2 className="text-2xl md:text-3xl font-bold mb-6 text-foreground">
          {title}
        </h2>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
        </div>
      </div>
    )
  }

  if (!listings || listings.length === 0) {
    return null
  }

  return (
    <div id="featured-listings">
      <h2 className="text-2xl md:text-3xl font-bold mb-6 text-foreground">
        {title}
      </h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {listings.map((listing: any) => (
          <ListingCard
            key={listing.id}
            listing={listing}
            currentUser={user}
            onToggleFavorite={async (listingId, isFavorited) => {
              // Favorite toggle will be handled by ListingCard internally
              console.log('Toggle favorite:', listingId, isFavorited)
            }}
            size="normal"
          />
        ))}
      </div>
    </div>
  )
}

