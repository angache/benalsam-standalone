'use client'

import React from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { 
  MapPin, 
  Clock, 
  Eye, 
  MessageCircle, 
  Star, 
  TrendingUp, 
  DollarSign, 
  Image as ImageIcon, 
  Heart, 
  Zap,
  MoreHorizontal,
  Edit3,
  Trash2,
  EyeOff,
  CheckCircle2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'
import { tr } from 'date-fns/locale'
import Image from 'next/image'

// Types
interface Listing {
  id: string
  title: string
  description?: string
  price?: number
  currency?: string
  main_image_url?: string
  image_url?: string
  category?: string
  urgency?: 'Acil' | 'Normal' | 'Acil Değil'
  status?: 'active' | 'inactive' | 'pending' | 'rejected' | 'completed' | 'in_transaction'
  is_featured?: boolean
  is_showcase?: boolean
  is_urgent_premium?: boolean
  has_bold_border?: boolean
  is_favorited?: boolean
  created_at?: string
  updated_at?: string
  views_count?: number
  offers_count?: number
  favorites_count?: number
  user?: {
    id: string
    name: string
    avatar_url?: string
    rating?: number
    trust_score?: number
  }
  location?: {
    province?: string
    district?: string
    neighborhood?: string
  }
  deactivation_reason?: string
  rejection_reason?: string
  offer_accepted_at?: string
}

interface ListingCardProps {
  listing: Listing
  size?: 'small' | 'normal' | 'large'
  onToggleFavorite?: (listingId: string) => void
  currentUser?: any
  isFavoritedOverride?: boolean
  priority?: boolean
  showActions?: boolean
  onView?: (listing: Listing) => void
  onEdit?: (listing: Listing) => void
  onDelete?: (listing: Listing) => void
  onToggleStatus?: (listing: Listing) => void
  isDeleting?: boolean
  getStatusBadge?: (listing: Listing) => React.ReactNode
  getPremiumBadges?: (listing: Listing) => Array<{ icon: React.ComponentType<any>, label: string, color: string }>
  onDopingClick?: (listing: Listing) => void
  onMarkAsCompleted?: (listing: Listing) => void
}

// Helper functions
const getUrgencyColor = (urgency?: string) => {
  switch (urgency) {
    case 'Acil': return 'bg-red-600 hover:bg-red-700'
    case 'Normal': return 'bg-amber-500 hover:bg-amber-600'
    case 'Acil Değil': return 'bg-green-500 hover:bg-green-600'
    default: return 'bg-slate-500 hover:bg-slate-600'
  }
}

const getStatusInfo = (status?: string) => {
  switch (status) {
    case 'inactive':
      return { text: 'Pasif', color: 'text-gray-500' }
    case 'pending':
      return { text: 'Onay Bekliyor', color: 'text-yellow-500' }
    case 'rejected':
      return { text: 'Reddedildi', color: 'text-red-500' }
    case 'completed':
      return { text: 'Tamamlandı', color: 'text-green-500' }
    case 'in_transaction':
      return { text: 'İşlemde', color: 'text-blue-500' }
    default:
      return null
  }
}

const formatPrice = (price?: number, currency = 'TL') => {
  if (!price) return 'Fiyat belirtilmemiş'
  return new Intl.NumberFormat('tr-TR').format(price) + ' ' + currency
}

const formatDate = (dateString?: string) => {
  if (!dateString) return ''
  try {
    return formatDistanceToNow(new Date(dateString), { 
      addSuffix: true, 
      locale: tr 
    })
  } catch {
    return ''
  }
}

// Main ListingCard component
export const ListingCard: React.FC<ListingCardProps> = ({
  listing,
  size = 'normal',
  onToggleFavorite,
  currentUser,
  isFavoritedOverride,
  priority = false,
  showActions = false,
  onView,
  onEdit,
  onDelete,
  onToggleStatus,
  isDeleting = false,
  getStatusBadge,
  getPremiumBadges,
  onDopingClick,
  onMarkAsCompleted
}) => {
  const isSmall = size === 'small'
  const isLarge = size === 'large'
  
  // Generate image URL
  const cardImageUrl = listing.main_image_url || 
                     listing.image_url || 
                     `https://source.unsplash.com/random/400x300/?${listing.category?.split(' > ')[0].replace(/\s/g, '+') || 'product'}&sig=${listing.id}`
  
  const isFavorited = isFavoritedOverride !== null ? isFavoritedOverride : listing.is_favorited
  const statusInfo = getStatusInfo(listing.status)
  const premiumBadges = getPremiumBadges ? getPremiumBadges(listing) : []
  
  const canMarkAsCompleted = listing.status === 'in_transaction' && 
                            listing.offer_accepted_at && 
                            new Date() > new Date(new Date(listing.offer_accepted_at).getTime() + 24 * 60 * 60 * 1000)

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onToggleFavorite) {
      onToggleFavorite(listing.id)
    }
  }

  const handleCardClick = () => {
    if (onView) {
      onView(listing)
    }
  }

  // Card content based on size
  if (isSmall) {
    return (
      <motion.div
        whileHover={{ y: -2 }}
        className={cn(
          'listing-card rounded-lg overflow-hidden card-hover group bg-card border border-border transition-all duration-300 ease-out h-full flex flex-col shadow-sm',
          { 'border-2 border-amber-400 shadow-lg shadow-amber-500/10': listing.has_bold_border },
          'w-56 sm:w-64 min-w-[224px] sm:min-w-[250px] flex-shrink-0'
        )}
        onClick={handleCardClick}
      >
        {/* Image */}
        <div className="relative overflow-hidden h-32 sm:h-36">
          {statusInfo && (
            <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-10">
              <div className="text-center text-white p-2 sm:p-4">
                <p className="font-bold text-sm sm:text-lg">
                  {statusInfo.text}
                </p>
                {listing.status === 'inactive' && listing.deactivation_reason && (
                  <p className="text-xs sm:text-sm opacity-80 mt-1">({listing.deactivation_reason})</p>
                )}
                {listing.status === 'rejected' && listing.rejection_reason && (
                  <p className="text-xs sm:text-sm opacity-80 mt-1">Neden: {listing.rejection_reason}</p>
                )}
              </div>
            </div>
          )}
          
          {cardImageUrl ? (
            <Image
              src={cardImageUrl}
              alt={listing.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300 ease-out"
              sizes="(max-width: 640px) 224px, 250px"
              priority={priority}
              quality={85}
            />
          ) : (
            <div className="w-full h-full bg-muted flex items-center justify-center">
              <ImageIcon className="w-8 h-8 text-muted-foreground" />
            </div>
          )}

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/10"></div>
          
          {/* Badges */}
          <div className="absolute top-1 sm:top-2 left-1 sm:left-2 flex flex-wrap gap-1 z-10">
            <div className={`px-1 sm:px-2 py-0.5 rounded text-xs font-semibold text-white shadow-md transition-colors ${getUrgencyColor(listing.urgency)}`}>
              {listing.urgency}
            </div>
            {listing.is_urgent_premium && (
              <div className="px-1 sm:px-2 py-0.5 rounded text-xs font-semibold text-white shadow-md bg-red-600 flex items-center gap-1">
                <Zap size={10} className="sm:w-3 sm:h-3" /> Acil
              </div>
            )}
            {listing.is_featured && (
              <div className="px-1 sm:px-2 py-0.5 rounded text-xs font-semibold text-white shadow-md bg-purple-600 flex items-center gap-1">
                <Star size={10} className="sm:w-3 sm:h-3" /> Öne Çıkan
              </div>
            )}
            {listing.is_showcase && (
              <div className="px-1 sm:px-2 py-0.5 rounded text-xs font-semibold text-white shadow-md bg-cyan-500 flex items-center gap-1">
                <Eye size={10} className="sm:w-3 sm:h-3" /> Vitrin
              </div>
            )}
          </div>

          {/* Favorite button */}
          {onToggleFavorite && (
            <button
              onClick={handleFavoriteClick}
              className="absolute top-2 right-2 z-10 p-1.5 rounded-full bg-black/50 hover:bg-black/70 transition-colors"
            >
              <Heart 
                size={16} 
                className={cn(
                  'transition-colors',
                  isFavorited ? 'fill-red-500 text-red-500' : 'text-white'
                )}
              />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-3 flex-1 flex flex-col min-w-0">
          <h3 className="font-semibold text-sm line-clamp-2 mb-2 truncate">{listing.title}</h3>
          
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
            <span className="flex items-center gap-1">
              <MapPin size={12} />
              {listing.location?.district || 'Konum'}
            </span>
            <span className="flex items-center gap-1">
              <Clock size={12} />
              {formatDate(listing.created_at)}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="font-bold text-primary">
              {formatPrice(listing.price, listing.currency)}
            </span>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Eye size={12} />
                {listing.views_count || 0}
              </span>
              <span className="flex items-center gap-1">
                <MessageCircle size={12} />
                {listing.offers_count || 0}
              </span>
            </div>
          </div>
        </div>
      </motion.div>
    )
  }

  // Normal and large size cards
  return (
    <motion.div
      whileHover={{ y: -3, boxShadow: "0 8px 15px rgba(255, 107, 53, 0.15), 0 4px 4px rgba(247, 147, 30, 0.1)" }}
      className={cn(
        'listing-card rounded-lg overflow-hidden card-hover group bg-card border border-border transition-all duration-300 ease-out h-full flex flex-col shadow-sm',
        { 'border-2 border-amber-400 shadow-lg shadow-amber-500/10': listing.has_bold_border }
      )}
      onClick={handleCardClick}
    >
      {/* Image */}
      <div className={`relative overflow-hidden ${isLarge ? 'h-48 sm:h-56 md:h-64' : 'h-40 sm:h-48 md:h-56'}`}>
        {statusInfo && (
          <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-10">
            <div className="text-center text-white p-2 sm:p-4">
              <p className="font-bold text-sm sm:text-lg">
                {statusInfo.text}
              </p>
              {listing.status === 'inactive' && listing.deactivation_reason && (
                <p className="text-xs sm:text-sm opacity-80 mt-1">({listing.deactivation_reason})</p>
              )}
              {listing.status === 'rejected' && listing.rejection_reason && (
                <p className="text-xs sm:text-sm opacity-80 mt-1">Neden: {listing.rejection_reason}</p>
              )}
            </div>
          </div>
        )}
        
        {cardImageUrl ? (
          <Image
            src={cardImageUrl}
            alt={listing.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300 ease-out"
            sizes={isLarge ? "(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw" : "(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw"}
            priority={priority}
            quality={85}
          />
        ) : (
          <div className="w-full h-full bg-muted flex items-center justify-center">
            <ImageIcon className="w-12 h-12 text-muted-foreground" />
          </div>
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/10"></div>
        
        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-wrap gap-1 z-10">
          <div className={`px-2 py-0.5 rounded text-xs font-semibold text-white shadow-md transition-colors ${getUrgencyColor(listing.urgency)}`}>
            {listing.urgency}
          </div>
          {listing.is_urgent_premium && (
            <div className="px-2 py-0.5 rounded text-xs font-semibold text-white shadow-md bg-red-600 flex items-center gap-1">
              <Zap size={12} className="w-3 h-3" /> Acil
            </div>
          )}
          {listing.is_featured && (
            <div className="px-2 py-0.5 rounded text-xs font-semibold text-white shadow-md bg-purple-600 flex items-center gap-1">
              <Star size={12} className="w-3 h-3" /> Öne Çıkan
            </div>
          )}
          {listing.is_showcase && (
            <div className="px-2 py-0.5 rounded text-xs font-semibold text-white shadow-md bg-cyan-500 flex items-center gap-1">
              <Eye size={12} className="w-3 h-3" /> Vitrin
            </div>
          )}
        </div>

        {/* Favorite button */}
        {onToggleFavorite && (
          <button
            onClick={handleFavoriteClick}
            className="absolute top-2 right-2 z-10 p-2 rounded-full bg-black/50 hover:bg-black/70 transition-colors"
          >
            <Heart 
              size={18} 
              className={cn(
                'transition-colors',
                isFavorited ? 'fill-red-500 text-red-500' : 'text-white'
              )}
            />
          </button>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex-1 flex flex-col min-w-0">
        <h3 className="font-semibold text-lg line-clamp-2 mb-2 truncate">{listing.title}</h3>
        
        {listing.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{listing.description}</p>
        )}

        <div className="flex items-center justify-between text-sm text-muted-foreground mb-3">
          <span className="flex items-center gap-1">
            <MapPin size={14} />
            {listing.location?.district || 'Konum belirtilmemiş'}
          </span>
          <span className="flex items-center gap-1">
            <Clock size={14} />
            {formatDate(listing.created_at)}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="font-bold text-xl text-primary">
            {formatPrice(listing.price, listing.currency)}
          </span>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Eye size={14} />
              {listing.views_count || 0}
            </span>
            <span className="flex items-center gap-1">
              <MessageCircle size={14} />
              {listing.offers_count || 0}
            </span>
            <span className="flex items-center gap-1">
              <Heart size={14} />
              {listing.favorites_count || 0}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default ListingCard
