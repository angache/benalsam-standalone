'use client'

import { memo } from 'react'
import { X, MapPin, Eye, ExternalLink, Calendar, User } from 'lucide-react'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { sanitizeText } from '@/utils/sanitize'
import { formatPrice } from '@/utils/formatters'
import { formatDistanceToNow } from 'date-fns'
import { tr } from 'date-fns/locale'
import Image from 'next/image'

interface Listing {
  id: string
  title: string
  description?: string
  budget?: number
  currency?: string
  location?: string
  category?: string
  main_image_url?: string
  additional_image_urls?: string[]
  view_count?: number
  created_at?: string
  urgency?: string
  is_featured?: boolean
  is_showcase?: boolean
  is_urgent_premium?: boolean
  profiles?: {
    id: string
    name: string
    avatar_url?: string
    rating?: number
  }
}

interface QuickViewModalProps {
  listing: Listing | null
  onClose: () => void
}

export const QuickViewModal = memo(function QuickViewModal({
  listing,
  onClose,
}: QuickViewModalProps) {
  if (!listing) return null

  const imageUrl = listing.main_image_url || (listing.additional_image_urls && listing.additional_image_urls[0])
  const allImages = [
    ...(listing.main_image_url ? [listing.main_image_url] : []),
    ...(listing.additional_image_urls || [])
  ]

  const getUrgencyColor = (urgency?: string) => {
    switch (urgency) {
      case 'Acil': return 'bg-red-500'
      case 'Normal': return 'bg-amber-500'
      case 'Acil Değil': return 'bg-green-500'
      default: return 'bg-slate-500'
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fadeIn">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl max-w-2xl w-full mx-4 animate-scaleIn overflow-hidden">
        {/* Header Image */}
        <div className="relative h-64 bg-gray-200 dark:bg-gray-800 flex items-center justify-center">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={listing.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 512px"
            />
          ) : (
            <div className="text-gray-500 dark:text-gray-400">Görsel Yok</div>
          )}
          
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
          
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-black/30 hover:bg-black/50 text-white rounded-full transition-colors z-10"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Premium badges */}
          <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
            {listing.is_featured && (
              <Badge className="bg-yellow-500 text-white border-0 shadow-lg">
                ⭐ Öne Çıkan
              </Badge>
            )}
            {listing.is_showcase && (
              <Badge className="bg-purple-500 text-white border-0 shadow-lg">
                👑 Vitrin
              </Badge>
            )}
            {listing.is_urgent_premium && (
              <Badge className="bg-red-500 text-white border-0 shadow-lg">
                ⚡ Acil Premium
              </Badge>
            )}
          </div>

          {/* Title */}
          <h3 className="absolute bottom-4 left-4 text-white text-xl font-bold max-w-[80%]">
            {sanitizeText(listing.title)}
          </h3>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Price & Location */}
          <div className="flex items-center justify-between">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {listing.budget ? formatPrice(listing.budget) : 'Fiyat Belirtilmemiş'}
            </div>
            {listing.location && (
              <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                <MapPin className="w-4 h-4" />
                <span>{sanitizeText(listing.location)}</span>
              </div>
            )}
          </div>

          {/* Category & Urgency */}
          <div className="flex items-center gap-2 flex-wrap">
            {listing.category && (
              <Badge variant="secondary" className="text-sm">
                {sanitizeText(listing.category)}
              </Badge>
            )}
            {listing.urgency && (
              <Badge className={`${getUrgencyColor(listing.urgency)} text-white`}>
                {listing.urgency}
              </Badge>
            )}
          </div>

          {/* Stats */}
          <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
            {listing.view_count !== undefined && (
              <div className="flex items-center gap-1">
                <Eye className="w-4 h-4" />
                <span>{listing.view_count} Görüntüleme</span>
              </div>
            )}
            {listing.created_at && (
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>
                  {formatDistanceToNow(new Date(listing.created_at), { 
                    addSuffix: true, 
                    locale: tr 
                  })}
                </span>
              </div>
            )}
          </div>

          {/* Description */}
          {listing.description && (
            <div>
              <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">Açıklama</h4>
              <p className="text-gray-700 dark:text-gray-300 text-sm line-clamp-4">
                {sanitizeText(listing.description)}
              </p>
            </div>
          )}

          {/* Seller Info */}
          {listing.profiles && (
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">Satıcı Bilgileri</h4>
              <div className="flex items-center gap-3">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={listing.profiles.avatar_url || undefined} alt={listing.profiles.name} />
                  <AvatarFallback className="bg-gradient-to-br from-purple-400 to-pink-400 text-white">
                    {listing.profiles.name?.[0] || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {sanitizeText(listing.profiles.name)}
                  </p>
                  {listing.profiles.rating !== undefined && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Puan: {listing.profiles.rating.toFixed(1)}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <Button
            onClick={onClose}
            variant="outline"
            className="flex-1"
          >
            Kapat
          </Button>
          <Button
            onClick={() => {
              const { generateListingUrl } = require('@/lib/slugify')
              window.open(generateListingUrl(listing.title, listing.id), '_blank')
            }}
            className="flex-1"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            İlanı Görüntüle
          </Button>
        </div>
      </div>
    </div>
  )
})
