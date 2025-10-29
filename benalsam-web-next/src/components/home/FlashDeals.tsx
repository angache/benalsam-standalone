/**
 * FlashDeals Component
 * Urgent/discounted listings with countdown
 */

'use client'

import { useQuery } from '@tanstack/react-query'
import { fetchListingsWithFilters } from '@/services/listingService/fetchers'
import ListingCard from '@/components/ListingCard'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Zap, ArrowRight, Clock } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'

export default function FlashDeals() {
  const [timeLeft, setTimeLeft] = useState({
    hours: 2,
    minutes: 34,
    seconds: 12,
  })

  // Countdown timer
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        let { hours, minutes, seconds } = prev
        
        seconds--
        if (seconds < 0) {
          seconds = 59
          minutes--
        }
        if (minutes < 0) {
          minutes = 59
          hours--
        }
        if (hours < 0) {
          // Reset to 3 hours
          return { hours: 3, minutes: 0, seconds: 0 }
        }
        
        return { hours, minutes, seconds }
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  const { data, isLoading } = useQuery({
    queryKey: ['flash-deals'],
    queryFn: () =>
      fetchListingsWithFilters(
        {
          urgency: 'very_urgent',
          sortBy: 'created_at',
          sortOrder: 'desc',
        },
        undefined,
        1,
        6
      ),
    staleTime: 2 * 60 * 1000, // 2 minutes
  })

  const listings = data?.listings || []

  if (isLoading) {
    return (
      <section className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-gradient-to-r from-orange-500/10 to-red-500/10 border-2 border-orange-500/20 rounded-2xl p-6">
          <Skeleton className="h-8 w-64 mb-4" />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-64 rounded-lg" />
            ))}
          </div>
        </div>
      </section>
    )
  }

  if (listings.length === 0) return null

  return (
    <section className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="bg-gradient-to-r from-orange-500/10 to-red-500/10 border-2 border-orange-500/20 rounded-2xl p-6 relative overflow-hidden">
        {/* Background Effect */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/5 rounded-full blur-3xl" />
        
        {/* Header */}
        <div className="relative flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-orange-500 rounded-xl">
              <Zap className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-bold flex items-center gap-2">
                <span>⚡ Acil İlanlar</span>
              </h2>
              <p className="text-sm text-muted-foreground">Hemen teklif vermen gereken ilanlar</p>
            </div>
          </div>

          {/* Countdown */}
          <div className="hidden sm:flex items-center gap-3 bg-card border-2 border-orange-500/30 rounded-xl px-4 py-3">
            <Clock className="w-5 h-5 text-orange-600" />
            <div className="flex items-center gap-2 font-mono text-lg font-bold">
              <span className="bg-orange-600 text-white px-2 py-1 rounded">{String(timeLeft.hours).padStart(2, '0')}</span>
              <span>:</span>
              <span className="bg-orange-600 text-white px-2 py-1 rounded">{String(timeLeft.minutes).padStart(2, '0')}</span>
              <span>:</span>
              <span className="bg-orange-600 text-white px-2 py-1 rounded">{String(timeLeft.seconds).padStart(2, '0')}</span>
            </div>
          </div>
        </div>

        {/* Listings Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-4">
          {listings.map((listing: any) => (
            <div key={listing.id} className="relative">
              <div className="absolute top-2 right-2 z-10 bg-orange-600 text-white text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1 shadow-lg">
                <Zap className="w-3 h-3" />
                ACİL
              </div>
              <ListingCard listing={listing} />
            </div>
          ))}
        </div>

        {/* View All Button */}
        <Link href="/ilanlar?urgency=very_urgent">
          <Button className="w-full bg-orange-600 hover:bg-orange-700 text-white gap-2">
            Tüm Acil İlanları Gör
            <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
      </div>
    </section>
  )
}

