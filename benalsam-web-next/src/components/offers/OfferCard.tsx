'use client'

import React from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { CheckCircle, XCircle, Clock, Package, DollarSign, User, Calendar, MessageSquare, ExternalLink, Loader2, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import Image from 'next/image'
import { formatDistanceToNow } from 'date-fns'
import { tr } from 'date-fns/locale/tr'

interface Offer {
  id: string
  listing_id: string
  offering_user_id: string
  message: string
  status: 'pending' | 'accepted' | 'rejected'
  created_at: string
  updated_at: string
  offered_item_id?: string
  offered_price?: number
  listing?: {
    id: string
    title: string
    main_image_url?: string
    user?: {
      id: string
      name?: string
      avatar_url?: string
    }
  }
  user?: {
    id: string
    name?: string
    avatar_url?: string
    rating?: number
    total_ratings?: number
  }
  inventory_item?: {
    id: string
    name: string
    category: string
    main_image_url?: string
    image_url?: string
  }
}

interface OfferCardProps {
  offer: Offer
  onUpdateStatus: (offerId: string, status: 'accepted' | 'rejected') => void
  isUpdating?: boolean
  mode?: 'sent' | 'received'
  onDelete?: (offerId: string) => void
  isDeleting?: boolean
}

const generateBoringAvatarUrl = (name: string, id: string): string => {
  const colors = [
    'FF6B6B', '4ECDC4', '45B7D1', 'FFA07A', '98D8C8',
    'F7DC6F', 'BB8FCE', '85C1E2', 'F8B739', '52BE80'
  ]
  const colorIndex = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length
  const initials = name.charAt(0).toUpperCase()
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=${colors[colorIndex]}&color=fff&size=128`
}

const OfferCard: React.FC<OfferCardProps> = ({ 
  offer, 
  onUpdateStatus, 
  isUpdating = false,
  mode = 'received',
  onDelete,
  isDeleting = false
}) => {
  // In 'sent' mode, show listing owner; in 'received' mode, show offer sender
  const displayUser = mode === 'sent' ? offer.listing?.user : offer.user
  const displayName = displayUser?.name || 'Kullanıcı'
  const displayUserId = mode === 'sent' ? offer.listing?.user?.id : offer.offering_user_id
  const listingTitle = offer.listing?.title || 'İlan'
  const listingImage = offer.listing?.main_image_url
  const inventoryImage = offer.inventory_item?.main_image_url || offer.inventory_item?.image_url

  const getStatusBadge = () => {
    switch (offer.status) {
      case 'accepted':
        return (
          <Badge variant="default" className="bg-green-500 hover:bg-green-600">
            <CheckCircle className="w-3 h-3 mr-1" />
            Kabul Edildi
          </Badge>
        )
      case 'rejected':
        return (
          <Badge variant="destructive">
            <XCircle className="w-3 h-3 mr-1" />
            Reddedildi
          </Badge>
        )
      default:
        return (
          <Badge variant="secondary">
            <Clock className="w-3 h-3 mr-1" />
            Beklemede
          </Badge>
        )
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 0,
    }).format(price)
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="bg-card rounded-xl border border-border/50 overflow-hidden hover:border-primary/50 transition-all duration-300 shadow-sm hover:shadow-lg h-full flex flex-col"
    >
      {/* Listing Image */}
      {listingImage && (
        <Link href={`/ilan/${offer.listing_id}`} className="relative w-full h-40 overflow-hidden">
          <Image
            src={listingImage}
            alt={listingTitle}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 16vw"
          />
          <div className="absolute top-2 right-2">
            {getStatusBadge()}
          </div>
        </Link>
      )}

      <div className="p-4 flex-1 flex flex-col">
        {/* Listing Title */}
        <Link href={`/ilan/${offer.listing_id}`} className="group mb-2">
          <h3 className="text-base font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2 mb-1">
            {listingTitle}
          </h3>
        </Link>

        {/* Offer Details */}
        <div className="space-y-2 mb-3 flex-1">
          {/* Offered Item */}
          {offer.inventory_item && (
            <div className="flex items-center gap-2 bg-muted/50 rounded-lg p-2">
              {inventoryImage && (
                <div className="relative w-10 h-10 rounded-md overflow-hidden border border-border flex-shrink-0">
                  <Image
                    src={inventoryImage}
                    alt={offer.inventory_item.name}
                    fill
                    className="object-cover"
                    sizes="40px"
                  />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1 text-xs text-muted-foreground mb-0.5">
                  <Package className="w-3 h-3" />
                  <span className="truncate">{offer.inventory_item.category}</span>
                </div>
                <p className="text-xs font-medium text-foreground truncate">
                  {offer.inventory_item.name}
                </p>
              </div>
            </div>
          )}

          {/* Offered Price */}
          {offer.offered_price && (
            <div className="flex items-center gap-2 bg-muted/50 rounded-lg p-2">
              <DollarSign className="w-4 h-4 text-primary flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-xs text-muted-foreground mb-0.5">Nakit Teklif</div>
                <p className="text-sm font-bold text-foreground">
                  {formatPrice(offer.offered_price)}
                </p>
              </div>
            </div>
          )}

          {/* Message Preview */}
          {offer.message && (
            <div className="bg-muted/30 rounded-lg p-2">
              <div className="flex items-start gap-1.5">
                <MessageSquare className="w-3 h-3 text-muted-foreground mt-0.5 flex-shrink-0" />
                <p className="text-xs text-foreground leading-relaxed line-clamp-2">
                  {offer.message}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* User Info & Timestamp */}
        <div className="border-t border-border/50 pt-3 mt-auto">
          <div className="flex items-center justify-between mb-2">
            {displayUserId && (
              <Link href={`/profil/${displayUserId}`} className="flex items-center gap-2 group flex-1 min-w-0">
                <Avatar className="w-8 h-8 border border-primary/20 group-hover:border-primary/60 transition-all flex-shrink-0">
                  <AvatarImage
                    src={displayUser?.avatar_url || generateBoringAvatarUrl(displayName, displayUserId)}
                    alt={displayName}
                  />
                  <AvatarFallback className="text-xs font-bold bg-gradient-to-br from-primary to-primary/60 text-primary-foreground">
                    {displayName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                    {mode === 'sent' ? (displayName || 'İlan Sahibi') : displayName}
                  </p>
                  {mode === 'received' && offer.user?.rating && (
                    <p className="text-xs text-muted-foreground">
                      ⭐ {offer.user.rating.toFixed(1)}
                    </p>
                  )}
                </div>
              </Link>
            )}
          </div>

          {/* Timestamp */}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-3">
            <Calendar className="w-3 h-3" />
            <span>
              {formatDistanceToNow(new Date(offer.created_at), {
                addSuffix: true,
                locale: tr,
              })}
            </span>
          </div>

          {/* Action Buttons */}
          {mode === 'received' && offer.status === 'pending' && (
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => onUpdateStatus(offer.id, 'accepted')}
                disabled={isUpdating}
                className="flex-1 bg-green-500 hover:bg-green-600 text-xs"
              >
                {isUpdating ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <>
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Kabul
                  </>
                )}
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => onUpdateStatus(offer.id, 'rejected')}
                disabled={isUpdating}
                className="flex-1 text-xs"
              >
                {isUpdating ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <>
                    <XCircle className="w-3 h-3 mr-1" />
                    Reddet
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Delete Button for Sent Offers */}
          {mode === 'sent' && offer.status === 'pending' && onDelete && (
            <Button
              size="sm"
              variant="destructive"
              onClick={() => onDelete(offer.id)}
              disabled={isDeleting}
              className="w-full text-xs"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                  Siliniyor...
                </>
              ) : (
                <>
                  <Trash2 className="w-3 h-3 mr-1" />
                  İptal Et
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  )
}

export default OfferCard

