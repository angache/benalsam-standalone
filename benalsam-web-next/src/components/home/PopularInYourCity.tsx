/**
 * PopularInYourCity Component
 * Location-based popular listings
 */

'use client'

import { useQuery } from '@tanstack/react-query'
import { fetchListingsWithFilters } from '@/services/listingService/fetchers'
import ListingCard from '@/components/ListingCard'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { MapPin, ArrowRight, Navigation } from 'lucide-react'
import Link from 'next/link'
import { useState, useEffect } from 'react'

const CITIES = ['İzmir', 'İstanbul', 'Ankara', 'Bursa', 'Antalya']

export default function PopularInYourCity() {
  const [selectedCity, setSelectedCity] = useState('İzmir')

  // Try to detect user's city (in real app, use IP geolocation)
  useEffect(() => {
    // Simulate city detection
    const randomCity = CITIES[Math.floor(Math.random() * CITIES.length)]
    setSelectedCity(randomCity)
  }, [])

  const { data, isLoading } = useQuery({
    queryKey: ['city-popular', selectedCity],
    queryFn: () =>
      fetchListingsWithFilters(
        {
          location: selectedCity,
          sortBy: 'views_count',
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
        <Skeleton className="h-8 w-64 mb-6" />
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
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-500/10 rounded-lg">
            <MapPin className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <span>{selectedCity}'de Popüler</span>
            </h2>
            <p className="text-sm text-muted-foreground">Şehrinizdeki en çok aranan ilanlar</p>
          </div>
        </div>

        {/* City Selector */}
        <div className="flex items-center gap-2">
          <Navigation className="w-4 h-4 text-muted-foreground" />
          <select
            value={selectedCity}
            onChange={(e) => setSelectedCity(e.target.value)}
            className="border rounded-lg px-3 py-1.5 text-sm bg-card"
          >
            {CITIES.map(city => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Listings Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        {listings.slice(0, 8).map((listing: any) => (
          <ListingCard key={listing.id} listing={listing} />
        ))}
      </div>

      {/* View All */}
      <Link href={`/ilanlar?city=${encodeURIComponent(selectedCity)}`}>
        <Button variant="outline" className="w-full gap-2">
          {selectedCity}'deki Tüm İlanları Gör
          <ArrowRight className="w-4 h-4" />
        </Button>
      </Link>
    </section>
  )
}

