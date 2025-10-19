'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Heart, MapPin, Eye, Clock, Loader2 } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { listingService } from '@/services/listingService'
import { useFilterStore } from '@/stores/filterStore'

interface Listing {
  id: string
  title: string
  description: string
  price: number
  images: string[]
  location?: {
    city?: string
    district?: string
  }
  views?: number
  created_at: string
  category_id?: number
}

export default function MainContent() {
  const { selectedCategory, minPrice, maxPrice, city, sortBy, page, limit } = useFilterStore()
  
  const { data, isLoading, error } = useQuery({
    queryKey: ['listings', { selectedCategory, minPrice, maxPrice, city, sortBy, page, limit }],
    queryFn: async () => {
      const filters: any = {
        page,
        limit,
        sort: sortBy,
      }
      
      if (selectedCategory) filters.category_id = selectedCategory
      if (minPrice) filters.min_price = minPrice
      if (maxPrice) filters.max_price = maxPrice
      if (city) filters.city = city
      
      const response = await listingService.getListings(filters)
      return response
    },
  })

  const listings = data?.data || []
  const totalPages = data?.pagination?.totalPages || 1

  const formatPrice = (price: number) => {
    if (price >= 1_000_000) {
      return `${(price / 1_000_000).toFixed(1)} Mn ₺`
    } else if (price >= 1_000) {
      return `${(price / 1_000).toFixed(0)} Bin ₺`
    }
    return `${price.toLocaleString('tr-TR')} ₺`
  }

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)
    
    if (diffDays > 0) return `${diffDays} gün önce`
    if (diffHours > 0) return `${diffHours} saat önce`
    if (diffMins > 0) return `${diffMins} dakika önce`
    return 'Az önce'
  }

  if (isLoading) {
    return (
      <main className="flex-1 p-4">
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      </main>
    )
  }

  if (error) {
    return (
      <main className="flex-1 p-4">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <p className="text-xl text-muted-foreground mb-4">İlanlar yüklenirken bir hata oluştu</p>
            <Button onClick={() => window.location.reload()}>Tekrar Dene</Button>
          </div>
        </div>
      </main>
    )
  }

  if (listings.length === 0) {
    return (
      <main className="flex-1 p-4">
        <h2 className="mb-6 text-3xl font-bold">Son İlanlar</h2>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <p className="text-xl text-muted-foreground mb-4">Henüz ilan bulunmuyor</p>
            <Button className="bg-gradient-to-r from-blue-600 to-purple-600">
              İlk İlanı Sen Ver
            </Button>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="flex-1 p-4">
      <h2 className="mb-6 text-3xl font-bold">
        Son İlanlar ({data?.pagination?.total || listings.length})
      </h2>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        {listings.map((listing: Listing) => (
          <Card
            key={listing.id}
            className="overflow-hidden transition-all duration-300 hover:shadow-lg cursor-pointer"
            onClick={() => window.location.href = `/ilan/${listing.id}`}
          >
            <div className="relative h-48">
              <img
                src={listing.images?.[0] || 'https://images.unsplash.com/photo-1607936854279-55686100644d?q=80&w=2070&auto=format&fit=crop'}
                alt={listing.title}
                className="h-full w-full object-cover"
              />
              <Badge className="absolute left-3 top-3 bg-primary text-primary-foreground">
                {formatPrice(listing.price)}
              </Badge>
              <Button
                variant="secondary"
                size="icon"
                className="absolute right-3 top-3 rounded-full"
                onClick={(e) => {
                  e.stopPropagation()
                  // TODO: Add to favorites
                }}
              >
                <Heart className="h-4 w-4" />
              </Button>
            </div>
            <CardHeader>
              <CardTitle className="text-xl line-clamp-1">{listing.title}</CardTitle>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {listing.description}
              </p>
            </CardHeader>
            <CardContent className="flex items-center justify-between text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                <span>{listing.location?.city || 'Konum belirtilmemiş'}</span>
              </div>
              {listing.views && (
                <div className="flex items-center gap-1">
                  <Eye className="h-4 w-4" />
                  <span>{listing.views}</span>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>{getTimeAgo(listing.created_at)}</span>
              </div>
              <Button size="sm" className="bg-gradient-to-r from-blue-600 to-purple-600">
                Detayları Gör
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-8">
          <Button
            variant="outline"
            disabled={page === 1}
            onClick={() => useFilterStore.setState({ page: page - 1 })}
          >
            Önceki
          </Button>
          <span className="flex items-center px-4">
            {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            disabled={page >= totalPages}
            onClick={() => useFilterStore.setState({ page: page + 1 })}
          >
            Sonraki
          </Button>
        </div>
      )}
    </main>
  )
}
