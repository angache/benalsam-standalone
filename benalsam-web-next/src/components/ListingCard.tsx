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
  CheckCircle2,
  Share2
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
import { useCategories } from '@/hooks/useCategories'
import { generateListingUrl } from '@/lib/slugify'

// Types
interface Listing {
  id: string
  title: string
  description?: string
  price?: number
  budget?: number
  currency?: string
  main_image_url?: string
  image_url?: string
  category?: string
  category_id?: number
  category_path?: number[]
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
  location?: string | {
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
  switch (urgency?.toLowerCase()) {
    case 'very_urgent':
    case 'çok acil':
      return 'bg-red-600 hover:bg-red-700'
    case 'urgent':
    case 'acil':
      return 'bg-orange-500 hover:bg-orange-600'
    case 'normal':
      return 'bg-blue-500 hover:bg-blue-600'
    case 'acil değil':
      return 'bg-green-500 hover:bg-green-600'
    default: return 'bg-slate-500 hover:bg-slate-600'
  }
}

const getUrgencyLabel = (urgency?: string) => {
  switch (urgency?.toLowerCase()) {
    case 'very_urgent':
    case 'çok acil':
      return 'Çok Acil'
    case 'urgent':
    case 'acil':
      return 'Acil'
    case 'normal':
      return 'Normal'
    case 'acil değil':
      return 'Acil Değil'
    default: return urgency || 'Normal'
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

const formatPrice = (listing: Listing) => {
  const price = listing.price || listing.budget
  const currency = listing.currency || 'TL'
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
  const { categories: allCategories } = useCategories()
  const isSmall = size === 'small'
  const isLarge = size === 'large'
  
  // Build category breadcrumb from category_path
  const buildCategoryBreadcrumb = (): string => {
    if (!listing.category_path || listing.category_path.length === 0) {
      return listing.category || 'Kategori belirtilmemiş'
    }

    // Find categories by IDs in category_path
    const findCategoryById = (id: number, cats: any[]): any => {
      for (const cat of cats) {
        if (Number(cat.id) === id) return cat
        if (cat.subcategories && cat.subcategories.length > 0) {
          const found = findCategoryById(id, cat.subcategories)
          if (found) return found
        }
      }
      return null
    }

    const categoryNames = listing.category_path
      .map(id => {
        const cat = findCategoryById(id, allCategories || [])
        return cat?.name
      })
      .filter(Boolean)

    return categoryNames.length > 0 ? categoryNames.join(' > ') : (listing.category || 'Kategori')
  }

  const categoryBreadcrumb = buildCategoryBreadcrumb()
  
  // Generate image URL
  const cardImageUrl =
    listing.main_image_url ||
    listing.image_url ||
    `https://source.unsplash.com/random/400x300/?${
      listing.category?.split(' > ')[0].replace(/\s/g, '+') || 'product'
    }&sig=${listing.id}`

  const isFavorited =
    isFavoritedOverride !== null && isFavoritedOverride !== undefined
      ? isFavoritedOverride
      : (listing.is_favorited ?? false)
  const statusInfo = getStatusInfo(listing.status)
  const premiumBadges = getPremiumBadges ? getPremiumBadges(listing) : []
  
  const canMarkAsCompleted = listing.status === 'in_transaction' && 
                            listing.offer_accepted_at && 
                            new Date() > new Date(new Date(listing.offer_accepted_at).getTime() + 24 * 60 * 60 * 1000)

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    console.log('❤️ [ListingCard] Favorite clicked:', { 
      listingId: listing.id, 
      hasHandler: !!onToggleFavorite,
      isFavorited 
    })
    if (onToggleFavorite) {
      onToggleFavorite(listing.id)
    } else {
      console.warn('⚠️ [ListingCard] No onToggleFavorite handler!')
    }
  }

  const handleCardClick = () => {
    if (onView) {
      onView(listing)
    }
  }

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation()
    
    const shareData = {
      title: listing.title,
      text: listing.description || listing.title,
      url: `${window.location.origin}${generateListingUrl(listing.title, listing.id)}`
    }

    // Check if native share is available (mobile)
    if (navigator.share) {
      try {
        await navigator.share(shareData)
      } catch (err) {
        console.log('Share cancelled or failed')
      }
    } else {
      // Fallback: Copy to clipboard
      try {
        await navigator.clipboard.writeText(shareData.url)
        alert('Link kopyalandı!')
      } catch (err) {
        console.error('Failed to copy:', err)
      }
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
              placeholder="blur"
              blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
            />
          ) : (
            <div className="w-full h-full bg-muted flex items-center justify-center">
              <ImageIcon className="w-8 h-8 text-muted-foreground" />
            </div>
          )}

          {/* Premium Badges */}
          {premiumBadges.length > 0 && (
            <div className="absolute top-3 left-3 flex flex-col gap-2 z-10">
              {premiumBadges.map((badge, index) => {
                const IconComponent = badge.icon
                return (
                  <Badge 
                    key={index}
                    className={`${badge.color} text-white border-0 shadow-lg`}
                  >
                    <IconComponent className="w-3 h-3 mr-1" />
                    {badge.label}
                  </Badge>
                )
              })}
            </div>
          )}

          {/* New Badge */}
          {listing.created_at && new Date(listing.created_at) > new Date(Date.now() - 24 * 60 * 60 * 1000) && (
            <div className="absolute top-3 right-3 z-10">
              <Badge className="bg-green-500 hover:bg-green-600 text-white border-0 shadow-lg">
                <Zap className="w-3 h-3 mr-1" />
                Yeni
              </Badge>
            </div>
          )}

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/10 z-0"></div>
          
          {/* Hover overlay with extra info */}
          <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center gap-2 z-20">
            <div className="text-white text-center space-y-1 px-2">
              {listing.views_count !== undefined && (
                <div className="flex items-center gap-1 justify-center text-sm">
                  <Eye className="w-4 h-4" />
                  <span>{listing.views_count} görüntüleme</span>
                </div>
              )}
              {listing.created_at && (
                <div className="text-xs opacity-80">
                  {formatDistanceToNow(new Date(listing.created_at), { addSuffix: true, locale: tr })}
                </div>
              )}
              <div className="flex gap-2 mt-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    if (onView) onView(listing)
                  }}
                  className="px-4 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium backdrop-blur-sm transition-colors"
                >
                  Hızlı Görünüm
                </button>
                <button
                  onClick={handleShare}
                  className="p-1.5 bg-white/20 hover:bg-white/30 rounded-lg backdrop-blur-sm transition-colors"
                  title="Paylaş"
                >
                  <Share2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
          
          {/* Urgency Badge - Bottom Right */}
          {listing.urgency && (
            <div className="absolute bottom-2 right-2 z-20">
              <div className={`px-2 py-1 rounded-md text-xs font-semibold text-white shadow-lg transition-colors ${getUrgencyColor(listing.urgency)}`}>
                {getUrgencyLabel(listing.urgency)}
              </div>
            </div>
          )}

          {/* Premium Badges - Top Left */}
          <div className="absolute top-1 sm:top-2 left-1 sm:left-2 flex flex-wrap gap-1 z-10">
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
              className="absolute top-2 right-2 z-10 p-1.5 rounded-full bg-black/50 hover:bg-black/70 transition-colors group"
            >
              <Heart 
                size={16} 
                className={cn(
                  'transition-all',
                  isFavorited 
                    ? 'fill-red-500 text-red-500 animate-favoriteAdded' 
                    : 'text-white group-hover:scale-110'
                )}
              />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-3 flex-1 flex flex-col min-w-0">
          {/* 🆕 Category Breadcrumb */}
          <div className="text-[10px] text-muted-foreground mb-1 truncate">
            {categoryBreadcrumb}
          </div>

          <h3 className="font-semibold text-sm line-clamp-2 mb-2 truncate">{listing.title}</h3>
          
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
            <span className="flex items-center gap-1 truncate">
              <MapPin size={12} />
              {typeof listing.location === 'string' 
                ? listing.location 
                : listing.location?.district || 'Konum'}
            </span>
            <span className="flex items-center gap-1 truncate">
              <Clock size={12} />
              {formatDate(listing.created_at)}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="font-bold text-primary truncate">
              {formatPrice(listing)}
            </span>
            <div className="flex items-center gap-2 text-xs text-muted-foreground truncate">
              <span className="flex items-center gap-1 truncate">
                <Eye size={12} />
                {listing.views_count || 0}
              </span>
              <span className="flex items-center gap-1 truncate">
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
            alt={listing.title || 'İlan görseli'}
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
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/10 z-0"></div>
        
        {/* Urgency Badge - Bottom Right */}
        {listing.urgency && (
          <div className="absolute bottom-2 right-2 z-20">
            <div className={`px-2 py-1 rounded-md text-xs font-semibold text-white shadow-lg transition-colors ${getUrgencyColor(listing.urgency)}`}>
              {getUrgencyLabel(listing.urgency)}
            </div>
          </div>
        )}

        {/* Premium Badges - Top Left */}
        <div className="absolute top-2 left-2 flex flex-wrap gap-1 z-10">
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
            className="absolute top-2 right-2 z-10 p-2 rounded-full bg-black/50 hover:bg-black/70 transition-colors group"
          >
            <Heart 
              size={18} 
              className={cn(
                'transition-all',
                isFavorited 
                  ? 'fill-red-500 text-red-500 animate-favoriteAdded' 
                  : 'text-white group-hover:scale-110'
              )}
            />
          </button>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex-1 flex flex-col min-w-0">
        {/* 🆕 Category Breadcrumb */}
        <div className="text-xs text-muted-foreground mb-1.5 truncate">
          {categoryBreadcrumb}
        </div>

        <h3 className="font-semibold text-lg line-clamp-2 mb-2 truncate">{listing.title}</h3>
        
        {listing.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3 truncate">{listing.description}</p>
        )}

        <div className="flex items-center justify-between text-sm text-muted-foreground mb-3">
          <span className="flex items-center gap-1 truncate">
            <MapPin size={14} />
            {typeof listing.location === 'string' 
              ? listing.location 
              : listing.location?.district || 'Konum belirtilmemiş'}
          </span>
          <span className="flex items-center gap-1 truncate">
            <Clock size={14} />
            {formatDate(listing.created_at)}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="font-bold text-xl text-primary truncate">
            {formatPrice(listing)}
          </span>
          <div className="flex items-center gap-4 text-sm text-muted-foreground truncate">
            <span className="flex items-center gap-1 truncate">
              <Eye size={14} />
              {listing.views_count || 0}
            </span>
            <span className="flex items-center gap-1 truncate">
              <MessageCircle size={14} />
              {listing.offers_count || 0}
            </span>
            <span className="flex items-center gap-1 truncate">
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
