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
import { supabase } from '@/lib/supabase'

interface FeaturedListingsProps {
  title?: string
  limit?: number
}

export default function FeaturedListings({ 
  title = 'Son Eklenen İlanlar',
  limit = 8 
}: FeaturedListingsProps) {
  const { user } = useAuth()

  const { data: listings, isLoading, error } = useQuery({
    queryKey: ['featured-listings', limit, user?.id],
    queryFn: async () => {
      console.log('🔍 [FeaturedListings] Starting fetch...', { limit, userId: user?.id })
      
      try {
        // Fetch listings using listingService (handles ES + Supabase fallback internally)
        const result = await listingService.getListings(user?.id || null, { 
          page: 1, 
          limit 
        })
        
        if (result?.listings && result.listings.length > 0) {
          // Check source (listingService marks source in dev mode)
          const source = (result.listings[0] as any)?.__src === 'S' ? 'Supabase' : 'Elasticsearch'
          console.log(`✅ [FeaturedListings] Got ${result.listings.length} listings from ${source}`)
          return result.listings
        }
        
        console.log('⚠️ [FeaturedListings] No listings found')
        return []
        
      } catch (err) {
        console.error('❌ [FeaturedListings] Total failure:', err)
        throw err
      }
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: 1,
  })
  
  console.log('📊 [FeaturedListings] Render:', { 
    isLoading, 
    hasError: !!error, 
    count: listings?.length || 0 
  })

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

