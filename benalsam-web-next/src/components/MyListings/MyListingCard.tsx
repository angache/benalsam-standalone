'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Eye, 
  EyeOff, 
  Edit3,
  Trash2,
  MoreHorizontal,
  Calendar,
  MapPin,
  MessageSquare,
  Heart,
  Zap,
  ImageIcon,
  CheckCircle2,
  Award,
  Siren,
  Rocket,
  Palette,
  CalendarClock,
  X,
  Loader2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { logger } from '@/utils/production-logger'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { formatDistanceToNow, format } from 'date-fns'
import { tr } from 'date-fns/locale'
import Image from 'next/image'
import type { Listing } from '@/types'
import { dopingOptions } from '@/config/dopingOptions'
import { toast } from '@/components/ui/use-toast'

interface MyListingCardProps {
  listing: Partial<Listing>
  status: string
  onView: (id: string) => void
  onEdit: () => void
  onToggleStatus: (id: string, currentStatus: string) => void
  onDelete: (id: string) => void
  isDeleting: string | null
  getStatusBadge: (listing: Partial<Listing>) => React.ReactNode
  getPremiumBadges: (listing: Partial<Listing>) => { icon: React.ComponentType<{ className?: string }>, label: string, color: string }[]
  onDopingClick: (listing: Partial<Listing>) => void
  onMarkAsCompleted: (id: string) => void
}

const MyListingCard = ({ 
  listing, 
  status, 
  onView, 
  onEdit, 
  onToggleStatus, 
  onDelete, 
  isDeleting,
  getStatusBadge,
  getPremiumBadges,
  onDopingClick,
  onMarkAsCompleted
}: MyListingCardProps) => {
  const premiumBadges = getPremiumBadges(listing)

  const canMarkAsCompleted = status === 'in_transaction' && 
                            listing.offer_accepted_at && 
                            new Date() > new Date(new Date(listing.offer_accepted_at).getTime() + 24 * 60 * 60 * 1000)

  // Get active dopings for this listing
  const getActiveDopings = () => {
    const activeDopings: Array<{
      id: string
      title: string
      icon: React.ComponentType<{ className?: string }>
      expiresAt: string | null
      isExpired: boolean
    }> = []

    const now = new Date()

    dopingOptions.forEach(option => {
      const isActive = listing[option.db_field] === true
      
      if (isActive) {
        let expiresAt: string | null = null
        let isExpired = false

        // Check expiration dates
        if (option.id === 'showcase' && listing.showcase_expires_at) {
          expiresAt = listing.showcase_expires_at as string
          isExpired = new Date(expiresAt) < now
        } else if (option.id === 'urgent' && listing.urgent_expires_at) {
          expiresAt = listing.urgent_expires_at as string
          isExpired = new Date(expiresAt) < now
        } else if (option.id === 'featured' && listing.featured_expires_at) {
          expiresAt = listing.featured_expires_at as string
          isExpired = new Date(expiresAt) < now
        } else if (option.id === 'up_to_date' && listing.upped_at) {
          // Güncelim dopingi için upped_at tarihini göster
          expiresAt = listing.upped_at as string
        }
        // bold_border ve up_to_date için expiration yok (duration: 0)

        // Only show if not expired (or if it's a permanent doping like bold_border)
        if (!isExpired || option.id === 'bold_border' || option.id === 'up_to_date') {
          activeDopings.push({
            id: option.id,
            title: option.title,
            icon: option.icon,
            expiresAt,
            isExpired: false, // We already filtered expired ones
          })
        }
      }
    })

    return activeDopings
  }

  const activeDopings = getActiveDopings()
  const hasActiveDopings = activeDopings.length > 0
  const [cancellingDoping, setCancellingDoping] = useState<string | null>(null)

  /**
   * Cancel a specific doping
   */
  const handleCancelDoping = async (dopingId: string) => {
    if (!listing?.id || cancellingDoping) {
      logger.warn('[MyListingCard] Cannot cancel doping', { listingId: listing?.id, cancellingDoping })
      return
    }

    logger.debug('[MyListingCard] Starting doping cancellation', { dopingId, listingId: listing.id })
    setCancellingDoping(dopingId)

    try {
      // Find the doping option to get db_field
      const dopingOption = dopingOptions.find(opt => opt.id === dopingId)
      if (!dopingOption) {
        throw new Error('Doping seçeneği bulunamadı')
      }

      logger.debug('[MyListingCard] Found doping option', { dopingOption: dopingOption.db_field })

      // Prepare update payload based on doping type
      const updatePayload: Record<string, unknown> = {
        [dopingOption.db_field]: false,
        updated_at: new Date().toISOString()
      }

      // Clear expiration dates
      if (dopingId === 'showcase') {
        updatePayload.showcase_expires_at = null
      } else if (dopingId === 'urgent') {
        updatePayload.urgent_expires_at = null
      } else if (dopingId === 'featured') {
        updatePayload.featured_expires_at = null
      } else if (dopingId === 'up_to_date') {
        updatePayload.upped_at = null
      }

      logger.debug('[MyListingCard] Sending cancellation request', { updatePayload, listingId: listing.id })

      const response = await fetch(`/api/listings/${listing.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatePayload)
      })

      logger.debug('[MyListingCard] Received response', { status: response.status, ok: response.ok })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        logger.error('[MyListingCard] API error response', { errorData, status: response.status })
        throw new Error(errorData.error?.message || `Doping iptal edilemedi (${response.status})`)
      }

      const result = await response.json()
      logger.debug('[MyListingCard] Cancellation successful', { result })

      toast({
        title: 'Başarılı',
        description: 'Doping başarıyla iptal edildi. (Not: Para iadesi yapılmaz)',
        variant: 'default',
      })

      // Refresh the page to show updated data
      setTimeout(() => {
        window.location.reload()
      }, 1000)
    } catch (error) {
      logger.error('[MyListingCard] Error cancelling doping', { 
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        dopingId, 
        listingId: listing?.id 
      })
      toast({
        title: 'Hata',
        description: error instanceof Error ? error.message : 'Doping iptal edilirken bir hata oluştu.',
        variant: 'destructive',
      })
    } finally {
      setCancellingDoping(null)
    }
  }

  const handleCardClick = () => {
    if (listing?.id) {
      onView(listing.id)
    }
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.3 }}
    >
      <Card 
        className="h-full flex flex-col hover:shadow-lg transition-shadow duration-300 overflow-hidden cursor-pointer"
        onClick={handleCardClick}
      >
        <CardHeader className="pb-3 min-w-0">
          <div className="flex items-start justify-between gap-2 min-w-0">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg font-semibold truncate mb-2 overflow-hidden">
                {listing.title}
              </CardTitle>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                {getStatusBadge(listing)}
                {premiumBadges.map((badge, index) => {
                  const Icon = badge.icon
                  return (
                    <Badge key={index} className={`${badge.color} text-white flex items-center gap-1`}>
                      <Icon className="w-3 h-3" />
                      {badge.label}
                    </Badge>
                  )
                })}
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8"
                  onClick={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.stopPropagation()}
                >
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onView(listing.id)}>
                  <Eye className="w-4 h-4 mr-2" />
                  Görüntüle
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onEdit}>
                  <Edit3 className="w-4 h-4 mr-2" />
                  Düzenle
                </DropdownMenuItem>
                {(status === 'published' || status === 'draft') && (
                  <DropdownMenuItem onClick={() => onToggleStatus(listing.id, listing.status)}>
                    {status === 'published' ? (
                      <>
                        <EyeOff className="w-4 h-4 mr-2" />
                        Yayından Kaldır
                      </>
                    ) : (
                      <>
                        <Eye className="w-4 h-4 mr-2" />
                        Yayınla
                      </>
                    )}
                  </DropdownMenuItem>
                )}
                {canMarkAsCompleted && (
                  <DropdownMenuItem onClick={() => onMarkAsCompleted(listing.id)}>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Alışverişi Tamamla
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem 
                  onClick={() => onDelete(listing.id)}
                  disabled={isDeleting === listing.id}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  {isDeleting === listing.id ? 'Siliniyor...' : 'Sil'}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        
        <CardContent className="flex-1 flex flex-col pb-4">
          {listing.main_image_url ? (
            (() => {
              logger.debug('[MyListingCard] Processing image', { 
                id: listing.id, 
                main_image_url: listing.main_image_url,
                type: typeof listing.main_image_url 
              })
              
              try {
                // Validate URL - check if it's a valid absolute URL
                let validUrl = listing.main_image_url
                if (!listing.main_image_url.startsWith('http://') && !listing.main_image_url.startsWith('https://')) {
                  // Relative URL - make it absolute
                  validUrl = `${window.location.origin}${listing.main_image_url.startsWith('/') ? '' : '/'}${listing.main_image_url}`
                }
                new URL(validUrl) // Validate
                logger.debug('[MyListingCard] Valid URL', { validUrl })
                
                return (
                  <div className="w-full h-40 bg-muted rounded-lg mb-4 overflow-hidden relative">
                    <Image 
                      src={validUrl} 
                      alt={listing.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 400px"
                      unoptimized
                    />
                  </div>
                )
              } catch (error) {
                // Invalid URL, show placeholder
                logger.warn('[MyListingCard] Invalid URL', { url: listing.main_image_url, error })
                return (
                  <div className="w-full h-40 bg-muted rounded-lg mb-4 overflow-hidden relative flex items-center justify-center bg-muted">
                    <ImageIcon className="w-12 h-12 text-muted-foreground opacity-50" />
                  </div>
                )
              }
            })()
          ) : (
            <div className="w-full h-40 bg-muted rounded-lg mb-4 overflow-hidden relative flex items-center justify-center">
              <ImageIcon className="w-12 h-12 text-muted-foreground opacity-50" />
              <span className="text-xs text-muted-foreground ml-2">Görsel Yok</span>
            </div>
          )}
          
          <p className="text-sm text-muted-foreground line-clamp-2 mb-4 flex-1 overflow-hidden">
            {listing.description}
          </p>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-1 text-muted-foreground truncate">
                <MapPin className="w-4 h-4 flex-shrink-0" />
                <span className="truncate max-w-24">
                  {listing.listings_district || listing.listings_province || 'Konum Yok'}
                </span>
              </div>
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-4 truncate">
                <div className="flex items-center gap-1 text-muted-foreground truncate">
                  <MessageSquare className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">{listing.offers_count || 0}</span>
                </div>
                <div className="flex items-center gap-1 text-muted-foreground truncate">
                  <Heart className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">{listing.favorites_count || 0}</span>
                </div>
              </div>
              <div className="flex items-center gap-1 text-muted-foreground truncate">
                <Calendar className="w-4 h-4 flex-shrink-0" />
                <span className="text-xs truncate">
                  {formatDistanceToNow(new Date(listing.created_at), { addSuffix: true, locale: tr })}
                </span>
              </div>
            </div>
          </div>
        </CardContent>

        <CardFooter className="p-4 pt-0 flex flex-col gap-2">
          {/* Active Dopings Display */}
          {hasActiveDopings && status === 'published' && (
            <div className="w-full p-3 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 border border-blue-200 dark:border-blue-800 rounded-lg mb-2">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-4 h-4 text-yellow-500" />
                <span className="text-sm font-semibold text-foreground">Aktif Doping'ler:</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {activeDopings.map((doping) => {
                  const Icon = doping.icon
                  const isCancelling = cancellingDoping === doping.id
                  return (
                    <div
                      key={doping.id}
                      className="flex items-center gap-1.5 px-2 py-1 bg-white dark:bg-gray-800 rounded-md border border-blue-200 dark:border-blue-700 group relative"
                    >
                      <Icon className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                      <span className="text-xs font-medium text-foreground">{doping.title}</span>
                      {doping.expiresAt && (
                        <span className="text-xs text-muted-foreground">
                          ({format(new Date(doping.expiresAt), 'dd.MM.yyyy', { locale: tr })})
                        </span>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          e.preventDefault()
                          if (window.confirm('Doping\'i iptal etmek istediğinize emin misiniz?\n\nNot: Para iadesi yapılmaz.')) {
                            handleCancelDoping(doping.id)
                          }
                        }}
                        onMouseDown={(e) => e.stopPropagation()}
                        disabled={isCancelling}
                        className="ml-1 opacity-70 hover:opacity-100 transition-opacity p-1 hover:bg-red-100 dark:hover:bg-red-900 rounded text-red-600 dark:text-red-400 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Doping'i İptal Et"
                        type="button"
                      >
                        {isCancelling ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <X className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {status === 'published' && (
            <Button 
              onClick={(e) => {
                e.stopPropagation()
                onDopingClick(listing)
              }}
              onMouseDown={(e) => e.stopPropagation()}
              className="w-full"
              variant={hasActiveDopings ? "default" : "outline"}
            >
              <Zap className="w-4 h-4 mr-2 text-yellow-500" />
              {hasActiveDopings ? 'Doping Yönet' : 'Doping Yap'}
            </Button>
          )}
          
          {status === 'in_transaction' && (
            <div className="w-full p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-sm text-blue-700 dark:text-blue-300 text-center font-medium">
                🛒 Alışveriş devam ediyor
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-400 text-center mt-1">
                Teklif kabul edildi, süreç tamamlanıyor
              </p>
            </div>
          )}

          {canMarkAsCompleted && (
            <Button 
              onClick={(e) => {
                e.stopPropagation()
                onMarkAsCompleted(listing.id)
              }}
              onMouseDown={(e) => e.stopPropagation()}
              className="w-full bg-green-600 hover:bg-green-700 text-white"
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Alışverişi Tamamla
            </Button>
          )}
        </CardFooter>
      </Card>
    </motion.div>
  )
}

export default MyListingCard

