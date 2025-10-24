'use client'

import React from 'react'
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
  CheckCircle2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { formatDistanceToNow } from 'date-fns'
import { tr } from 'date-fns/locale'
import Image from 'next/image'

interface MyListingCardProps {
  listing: any
  status: string
  onView: (id: string) => void
  onEdit: () => void
  onToggleStatus: (id: string, currentStatus: string) => void
  onDelete: (id: string) => void
  isDeleting: string | null
  getStatusBadge: (listing: any) => React.ReactNode
  getPremiumBadges: (listing: any) => { icon: any, label: string, color: string }[]
  onDopingClick: (listing: any) => void
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

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="h-full flex flex-col hover:shadow-lg transition-shadow duration-300 overflow-hidden">
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
                <Button variant="ghost" size="icon" className="h-8 w-8">
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
              console.log('🖼️ [IMAGE] Processing:', { 
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
                console.log('✅ [IMAGE] Valid URL:', validUrl)
                
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
                console.warn('❌ [IMAGE] Invalid URL:', listing.main_image_url, error)
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
          {status === 'published' && (
            <Button 
              onClick={() => onDopingClick(listing)} 
              className="w-full"
              variant="outline"
            >
              <Zap className="w-4 h-4 mr-2 text-yellow-500" />
              Doping Yap
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
              onClick={() => onMarkAsCompleted(listing.id)}
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

