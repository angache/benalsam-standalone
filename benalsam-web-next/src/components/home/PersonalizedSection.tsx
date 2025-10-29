/**
 * PersonalizedSection Component
 * Personalized recommendations for logged-in users
 */

'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useQuery } from '@tanstack/react-query'
import { fetchListingsWithFilters } from '@/services/listingService/fetchers'
import ListingCard from '@/components/ListingCard'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Sparkles, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export default function PersonalizedSection() {
  const { user } = useAuth()

  // Only show for logged-in users
  if (!user) return null

  const { data, isLoading } = useQuery({
    queryKey: ['personalized-listings', user.id],
    queryFn: () =>
      fetchListingsWithFilters(
        {
          sortBy: 'created_at',
          sortOrder: 'desc',
        },
        user.id,
        1,
        8
      ),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  const listings = data?.listings || []

  if (isLoading) {
    return (
      <section className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-2 border-purple-500/20 rounded-2xl p-6">
          <Skeleton className="h-8 w-64 mb-4" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
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
      <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-2 border-purple-500/20 rounded-2xl p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">
                Merhaba {user.name || 'Kullanıcı'}! 👋
              </h2>
              <p className="text-sm text-muted-foreground">Sana özel seçtiğimiz ilanlar</p>
            </div>
          </div>
        </div>

        {/* Listings Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          {listings.slice(0, 8).map((listing: any) => (
            <div key={listing.id} className="relative">
              <div className="absolute top-2 left-2 z-10 bg-purple-600 text-white text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5" />
                SANA ÖZEL
              </div>
              <ListingCard listing={listing} />
            </div>
          ))}
        </div>

        {/* View All Button */}
        <Link href="/ilanlar">
          <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white gap-2">
            Daha Fazla Keşfet
            <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
      </div>
    </section>
  )
}

