'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  Heart, 
  Share2, 
  Flag, 
  MapPin, 
  Calendar, 
  Eye, 
  MessageCircle, 
  Phone, 
  Mail,
  ArrowLeft,
  Star,
  Shield,
  Clock
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { listingService } from '@/services/listingService'

interface Listing {
  id: string
  title: string
  description: string
  price: number
  images: string[]
  category: {
    id: number
    name: string
  }
  location: {
    city: string
    district: string
  }
  user: {
    id: string
    name: string
    avatar?: string
    rating: number
    listingCount: number
    joinDate: string
  }
  created_at: string
  views: number
  likes: number
  comments: number
  isUrgent: boolean
  isPremium: boolean
  contact: {
    phone?: string
    email?: string
  }
}

export default function ListingDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [selectedImage, setSelectedImage] = useState(0)
  const [isLiked, setIsLiked] = useState(false)

  const listingId = params.id as string

  // İlan detaylarını çek
  const { data: listing, isLoading, error } = useQuery({
    queryKey: ['listing', listingId],
    queryFn: () => listingService.getSingleListing(listingId, null),
  })

  const formatPrice = (price: number | undefined) => {
    if (!price) return 'Belirtilmemiş'
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
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-1/4 mb-4"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <div className="h-96 bg-muted rounded-lg mb-4"></div>
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-muted rounded w-1/2"></div>
              </div>
              <div>
                <div className="h-64 bg-muted rounded-lg"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !listing) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">İlan Bulunamadı</h1>
            <p className="text-muted-foreground mb-4">
              Aradığınız ilan bulunamadı veya kaldırılmış olabilir.
            </p>
            <Button onClick={() => router.push('/')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Ana Sayfaya Dön
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button 
              variant="ghost" 
              onClick={() => router.back()}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Geri
            </Button>
            
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon">
                <Share2 className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon">
                <Flag className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Sol Taraf - İlan Detayları */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Başlık ve Fiyat */}
            <div>
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h1 className="text-3xl font-bold mb-2">{listing.title}</h1>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="secondary">{listing.category.name}</Badge>
                    {listing.isUrgent && <Badge variant="destructive">Acil</Badge>}
                    {listing.isPremium && <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500">Premium</Badge>}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-primary">
                    {formatPrice(listing.price)}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  <span>{listing.location.city} {listing.location.district && `- ${listing.location.district}`}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>{getTimeAgo(listing.created_at)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Eye className="h-4 w-4" />
                  <span>{listing.views} görüntülenme</span>
                </div>
              </div>
            </div>

            {/* Fotoğraflar */}
            {listing.images && listing.images.length > 0 && (
              <Card>
                <CardContent className="p-4">
                  <div className="space-y-4">
                    {/* Ana Fotoğraf */}
                    <div className="relative group">
                      <img
                        src={listing.images[selectedImage]}
                        alt={listing.title}
                        className="w-full h-96 object-cover rounded-lg"
                      />
                      
                      {/* Sağa/Sola Ok Butonları */}
                      {listing.images.length > 1 && (
                        <>
                          <button
                            onClick={() => setSelectedImage(prev => prev > 0 ? prev - 1 : listing.images!.length - 1)}
                            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                          </button>
                          <button
                            onClick={() => setSelectedImage(prev => prev < listing.images!.length - 1 ? prev + 1 : 0)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </button>
                        </>
                      )}
                    </div>
                    
                    {/* Thumbnail'ler - Alta Alındı */}
                    {listing.images.length > 1 && (
                      <div className="flex gap-2 overflow-x-auto pb-2 justify-center">
                        {listing.images.map((image, index) => (
                          <button
                            key={index}
                            onClick={() => setSelectedImage(index)}
                            className={`flex-shrink-0 w-20 h-20 rounded-lg border-2 transition-all ${
                              selectedImage === index 
                                ? 'border-primary ring-2 ring-primary/20' 
                                : 'border-border hover:border-primary/50'
                            }`}
                          >
                            <img
                              src={image}
                              alt={`${listing.title} ${index + 1}`}
                              className="w-full h-full object-cover rounded-md"
                            />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Açıklama */}
            <Card>
              <CardHeader>
                <CardTitle>Açıklama</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap">{listing.description}</p>
              </CardContent>
            </Card>

            {/* İstatistikler */}
            <Card>
              <CardHeader>
                <CardTitle>İlan İstatistikleri</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-primary">{listing.views}</div>
                    <div className="text-sm text-muted-foreground">Görüntülenme</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-primary">{listing.likes}</div>
                    <div className="text-sm text-muted-foreground">Beğeni</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-primary">{listing.comments}</div>
                    <div className="text-sm text-muted-foreground">Yorum</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sağ Taraf - Satıcı ve İletişim */}
          <div className="space-y-6">
            
            {/* Satıcı Bilgileri */}
            <Card>
              <CardHeader>
                <CardTitle>Satıcı Bilgileri</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                    <span className="text-white font-bold">
                      {listing.user.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold">{listing.user.name}</h3>
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm">{listing.user.rating}/5</span>
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">İlan Sayısı:</span>
                    <span>{listing.user.listingCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Üyelik:</span>
                    <span>{getTimeAgo(listing.user.joinDate)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* İletişim */}
            <Card>
              <CardHeader>
                <CardTitle>İletişim</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {listing.contact?.phone && (
                  <Button className="w-full" variant="outline">
                    <Phone className="h-4 w-4 mr-2" />
                    Telefon Et
                  </Button>
                )}
                
                {listing.contact?.email && (
                  <Button className="w-full" variant="outline">
                    <Mail className="h-4 w-4 mr-2" />
                    E-posta Gönder
                  </Button>
                )}
                
                <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600">
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Mesaj Gönder
                </Button>
              </CardContent>
            </Card>

            {/* Güvenlik */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Güvenlik
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-green-500" />
                    <span>Doğrulanmış Satıcı</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-blue-500" />
                    <span>7/24 Destek</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
