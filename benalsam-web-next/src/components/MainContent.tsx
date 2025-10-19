'use client'

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MapPin, Heart, Eye, Clock } from 'lucide-react'

export default function MainContent() {
  // Mock data for listings
  const listings = [
    {
      id: 1,
      title: "iPhone 15 Pro Max 256GB",
      description: "Az kullanılmış, garantili, kutusu ile birlikte",
      price: 45000,
      location: "İstanbul, Kadıköy",
      image: "https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=400&h=300&fit=crop",
      views: 1250,
      timeAgo: "2 saat önce",
      isFavorite: false
    },
    {
      id: 2,
      title: "3+1 Kiralık Daire",
      description: "Merkezi konumda, asansörlü, balkonlu",
      price: 15000,
      location: "Ankara, Çankaya",
      image: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&h=300&fit=crop",
      views: 890,
      timeAgo: "5 saat önce",
      isFavorite: true
    },
    {
      id: 3,
      title: "2020 Model BMW 3.20i",
      description: "Tek elden, servis bakımlı, kazasız",
      price: 850000,
      location: "İzmir, Konak",
      image: "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=400&h=300&fit=crop",
      views: 2100,
      timeAgo: "1 gün önce",
      isFavorite: false
    },
    {
      id: 4,
      title: "MacBook Pro M2 14 inch",
      description: "Profesyonel kullanım için ideal",
      price: 35000,
      location: "Bursa, Nilüfer",
      image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&h=300&fit=crop",
      views: 750,
      timeAgo: "3 gün önce",
      isFavorite: false
    },
    {
      id: 5,
      title: "2+1 Satılık Daire",
      description: "Deniz manzaralı, güney cephe",
      price: 2500000,
      location: "Antalya, Muratpaşa",
      image: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400&h=300&fit=crop",
      views: 3200,
      timeAgo: "1 hafta önce",
      isFavorite: true
    },
    {
      id: 6,
      title: "Samsung Galaxy S24 Ultra",
      description: "Yeni nesil kamera sistemi",
      price: 28000,
      location: "Trabzon, Ortahisar",
      image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&h=300&fit=crop",
      views: 450,
      timeAgo: "2 gün önce",
      isFavorite: false
    }
  ]

  const formatPrice = (price: number) => {
    if (price >= 1000000) {
      return `${(price / 1000000).toFixed(1)}M ₺`
    } else if (price >= 1000) {
      return `${(price / 1000).toFixed(0)}K ₺`
    }
    return `${price.toLocaleString('tr-TR')} ₺`
  }

  return (
    <main className="flex-1 p-6">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Son İlanlar</h1>
        <p className="text-muted-foreground">
          En yeni eklenen ilanları keşfedin
        </p>
      </div>

      {/* Listings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {listings.map((listing) => (
          <Card key={listing.id} className="group hover:shadow-lg transition-all duration-300">
            <CardHeader className="p-0">
              <div className="relative">
                <img
                  src={listing.image}
                  alt={listing.title}
                  className="w-full h-48 object-cover rounded-t-lg group-hover:scale-105 transition-transform duration-300"
                />
                <Button
                  size="icon"
                  variant="secondary"
                  className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Heart className={`h-4 w-4 ${listing.isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
                </Button>
                <Badge className="absolute top-2 left-2 bg-black/70 text-white">
                  {formatPrice(listing.price)}
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent className="p-4">
              <CardTitle className="text-lg mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                {listing.title}
              </CardTitle>
              <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
                {listing.description}
              </p>
              
              <div className="flex items-center gap-1 text-muted-foreground text-sm mb-3">
                <MapPin className="h-4 w-4" />
                <span>{listing.location}</span>
              </div>
              
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Eye className="h-4 w-4" />
                  <span>{listing.views}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>{listing.timeAgo}</span>
                </div>
              </div>
            </CardContent>
            
            <CardFooter className="p-4 pt-0">
              <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                Detayları Gör
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* Load More Button */}
      <div className="text-center mt-8">
        <Button variant="outline" size="lg">
          Daha Fazla Göster
        </Button>
      </div>
    </main>
  )
}
