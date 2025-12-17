'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
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
  Clock,
  ChevronLeft,
  ChevronRight,
  Handshake
} from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/use-toast'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'

interface ListingDetailClientProps {
  listing: any
  listingId: string
}

export function ListingDetailClient({ listing: initialListing, listingId }: ListingDetailClientProps) {
  const router = useRouter()
  const { user, isLoading } = useAuth()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [selectedImage, setSelectedImage] = useState(0)
  
  // Use initialListing from SSR
  const [listing, setListing] = useState(initialListing)
  
  // Check if user owns this listing (only after auth is loaded to prevent hydration mismatch)
  const isOwnListing = !isLoading && user?.id && listing?.user?.id && listing.user.id === user.id

  // Favorite toggle mutation
  const toggleFavoriteMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id || !listingId) {
        throw new Error('Giriş yapmalısınız')
      }
      
      if (listing?.is_favorited) {
        // Remove favorite via API route
        const response = await fetch(`/api/favorites?listingId=${listingId}`, {
          method: 'DELETE'
        })
        
        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || 'Favori kaldırılamadı')
        }
        
        return false
      } else {
        // Add favorite via API route
        const response = await fetch('/api/favorites', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ listingId })
        })
        
        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || 'Favori eklenemedi')
        }
        
        return true
      }
    },
    onSuccess: (isFavorited) => {
      // Update local state immediately
      setListing((prev: any) => ({
        ...prev,
        is_favorited: isFavorited
      }))
      
      toast({
        title: isFavorited ? 'Favorilere Eklendi' : 'Favorilerden Çıkarıldı',
        description: isFavorited ? 'İlan favorilerinize eklendi' : 'İlan favorilerinizden kaldırıldı',
      })
    },
    onError: (error: any) => {
      toast({
        title: 'Hata',
        description: error.message || 'Favori işlemi başarısız',
        variant: 'destructive'
      })
    }
  })

  const handleToggleFavorite = () => {
    if (!user) {
      toast({
        title: 'Giriş Gerekli',
        description: 'Favorilere eklemek için giriş yapmalısınız',
        variant: 'destructive'
      })
      router.push('/auth/login')
      return
    }
    
    toggleFavoriteMutation.mutate()
  }

  const handleShare = () => {
    const url = window.location.href
    const title = listing?.title || 'İlan'
    
    if (navigator.share) {
      navigator.share({
        title,
        url,
      }).catch(() => {
        // Fallback: Copy to clipboard
        navigator.clipboard.writeText(url)
        toast({
          title: 'Link Kopyalandı',
          description: 'İlan linki panoya kopyalandı',
        })
      })
    } else {
      // Fallback: Copy to clipboard
      navigator.clipboard.writeText(url)
      toast({
        title: 'Link Kopyalandı',
        description: 'İlan linki panoya kopyalandı',
      })
    }
  }

  if (!listing) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-6">
          <p className="text-muted-foreground">İlan bulunamadı</p>
        </Card>
      </div>
    )
  }

  const images = listing.images || []
  const hasMultipleImages = images.length > 1

  const formatPrice = (price: number | undefined) => {
    if (!price) return 'Belirtilmemiş'
    return new Intl.NumberFormat('tr-TR', { 
      style: 'currency', 
      currency: 'TRY',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price)
  }

  return (
    <>
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Button 
            variant="ghost"
            onClick={() => router.back()}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Geri</span>
          </Button>
          
          <h1 className="text-sm sm:text-base font-semibold truncate max-w-[200px] sm:max-w-md" style={{color: 'var(--secondary)'}}>
            {listing?.title}
          </h1>
          
          <div className="flex items-center gap-1 sm:gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleToggleFavorite}
              disabled={toggleFavoriteMutation.isPending}
              className={listing?.is_favorited ? 'text-red-500' : ''}
              aria-label={listing?.is_favorited ? 'Favorilerden çıkar' : 'Favorilere ekle'}
            >
              <Heart className={`h-5 w-5 ${listing?.is_favorited ? 'fill-current' : ''}`} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleShare}
              aria-label="Paylaş"
            >
              <Share2 className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Şikayet et"
            >
              <Flag className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-7xl">

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Images */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                {/* Main Image */}
                <div className="relative aspect-video bg-gray-100 dark:bg-gray-800">
                  {images.length > 0 ? (
                    <img
                      src={images[selectedImage]}
                      alt={listing.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      Görsel Yok
                    </div>
                  )}
                  
                  {/* Navigation Buttons */}
                  {hasMultipleImages && (
                    <>
                      <button
                        onClick={() => setSelectedImage((prev) => (prev === 0 ? images.length - 1 : prev - 1))}
                        className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 dark:bg-gray-800/90 p-2 rounded-full shadow-lg hover:bg-white dark:hover:bg-gray-800 transition-colors"
                        aria-label="Önceki görsel"
                      >
                        <ChevronLeft className="h-6 w-6" />
                      </button>
                      <button
                        onClick={() => setSelectedImage((prev) => (prev === images.length - 1 ? 0 : prev + 1))}
                        className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 dark:bg-gray-800/90 p-2 rounded-full shadow-lg hover:bg-white dark:hover:bg-gray-800 transition-colors"
                        aria-label="Sonraki görsel"
                      >
                        <ChevronRight className="h-6 w-6" />
                      </button>
                    </>
                  )}
                  
                  {/* Image Counter */}
                  {hasMultipleImages && (
                    <div className="absolute bottom-4 right-4 bg-black/70 text-white px-3 py-1 rounded-full text-sm">
                      {selectedImage + 1} / {images.length}
                    </div>
                  )}
                </div>

                {/* Thumbnails - Below main image */}
                {hasMultipleImages && (
                  <div className="p-4 bg-gray-50 dark:bg-gray-900">
                    <div className="flex gap-2 overflow-x-auto justify-center">
                      {images.map((img: string, idx: number) => (
                        <button
                          key={idx}
                          onClick={() => setSelectedImage(idx)}
                          className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                            selectedImage === idx
                              ? 'border-blue-500 ring-2 ring-blue-200 dark:ring-blue-800'
                              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                          }`}
                        >
                          <img
                            src={img}
                            alt={`${listing.title} - ${idx + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Title and Description */}
            <Card>
              <CardHeader className="space-y-4">
                <div>
                  <CardTitle className="text-2xl font-bold mb-2">
                    {listing.title}
                  </CardTitle>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {listing.location}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {format(new Date(listing.created_at), 'dd MMMM yyyy', { locale: tr })}
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye className="h-4 w-4" />
                      {listing.views} görüntülenme
                    </span>
                  </div>
                </div>

                {listing.isUrgent && (
                  <Badge variant="destructive" className="w-fit">
                    <Clock className="h-3 w-3 mr-1" />
                    Acil
                  </Badge>
                )}
              </CardHeader>

              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Açıklama</h3>
                  <p className="text-muted-foreground whitespace-pre-wrap">
                    {listing.description}
                  </p>
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Kategori</p>
                    <p className="font-medium">{listing.category}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Fiyat</p>
                    <p className="font-bold text-xl text-green-600">
                      {formatPrice(listing.price)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Contact & User Info */}
          <div className="space-y-6">
            {/* Price Card */}
            <Card className="border-blue-200 dark:border-purple-800">
              <CardHeader>
                <CardTitle className="text-3xl font-bold" style={{color: 'var(--success)'}}>
                    {formatPrice(listing.price)}
                  </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full text-white" size="lg"
                  style={{backgroundColor: 'var(--primary)'}}
                  onMouseEnter={(e) => {e.currentTarget.style.backgroundColor = 'var(--primary-hover)'}}
                  onMouseLeave={(e) => {e.currentTarget.style.backgroundColor = 'var(--primary)'}}
                >
                  <MessageCircle className="h-5 w-5 mr-2" />
                  Mesaj Gönder
                </Button>
                {!isLoading && !isOwnListing && (
                  <Button 
                    variant="outline" 
                    className="w-full" 
                    size="lg"
                    onClick={() => {
                      if (!user) {
                        toast({
                          title: 'Giriş Gerekli',
                          description: 'Teklif göndermek için giriş yapmalısınız',
                          variant: 'destructive'
                        })
                        router.push('/auth/login')
                        return
                      }
                      router.push(`/teklif-yap/${listingId}`)
                    }}
                  >
                    <Handshake className="h-5 w-5 mr-2" />
                    Teklif Gönder
                  </Button>
                )}
                {listing.contact?.phone && (
                  <Button variant="outline" className="w-full" size="lg">
                    <Phone className="h-5 w-5 mr-2" />
                    {listing.contact.phone}
                  </Button>
                )}
                {listing.contact?.email && (
                  <Button variant="outline" className="w-full" size="lg">
                    <Mail className="h-5 w-5 mr-2" />
                    E-posta Gönder
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* User Card */}
            {listing.user && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">İlan Sahibi</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                      {listing.user.name?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <div>
                      <p className="font-semibold">{listing.user.name}</p>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span>{listing.user.rating?.toFixed(1) || '0.0'}</span>
                      </div>
                    </div>
                  </div>
                  <Separator />
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Aktif İlan</span>
                      <span className="font-medium">{listing.user.listingCount || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Üyelik</span>
                      <span className="font-medium">
                        {listing.user.joinDate ? format(new Date(listing.user.joinDate), 'MMM yyyy', { locale: tr }) : 'Bilinmiyor'}
                      </span>
                    </div>
                  </div>
                  <Button variant="outline" className="w-full">
                    Profili Görüntüle
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Safety Tips Card */}
            <Card className="border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2 text-amber-900 dark:text-amber-100">
                  <Shield className="h-5 w-5" />
                  Güvenlik İpuçları
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-2 text-amber-900 dark:text-amber-100">
                <p>• Satıcı ile güvenli bir yerde buluşun</p>
                <p>• Ödeme yapmadan önce ürünü kontrol edin</p>
                <p>• Şüpheli durumlarda işlem yapmayın</p>
              </CardContent>
            </Card>
          </div>
        </div>
        </div>
      </div>
    </>
  )
}

