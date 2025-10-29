/**
 * TodaysListings Component
 * Listings added in the last 24 hours
 */

'use client'

import { useQuery } from '@tanstack/react-query'
import { fetchListingsWithFilters } from '@/services/listingService/fetchers'
import ListingCard from '@/components/ListingCard'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Calendar, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export default function TodaysListings() {
  const { data, isLoading } = useQuery({
    queryKey: ['todays-listings'],
    queryFn: () =>
      fetchListingsWithFilters(
        {
          sortBy: 'created_at',
          sortOrder: 'desc',
        },
        undefined,
        1,
        8
      ),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  const listings = data?.listings || []

  if (isLoading) {
    return (
      <section className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-lg" />
          ))}
        </div>
      </section>
    )
  }

  if (listings.length === 0) return null

  return (
    <section className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Calendar className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Bugün Eklenenler</h2>
            <p className="text-sm text-muted-foreground">Son 24 saatte eklenen ilanlar</p>
          </div>
        </div>
        <Link href="/ilanlar?dateRange=24h">
          <Button variant="outline" className="gap-2">
            Tümünü Gör
            <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {listings.slice(0, 8).map((listing: any) => (
          <ListingCard key={listing.id} listing={listing} />
        ))}
      </div>
    </section>
  )
}

