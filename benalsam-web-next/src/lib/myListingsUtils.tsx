import React from 'react'
import { 
  FileText, 
  Eye, 
  EyeOff, 
  Clock, 
  CheckCircle, 
  XCircle,
  Calendar,
  Star,
  Zap,
  ShoppingBag,
  ArrowLeftRight
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'

export interface StatusConfig {
  label: string
  icon: any
  color: string
}

export const statusConfig: Record<string, StatusConfig> = {
  all: { label: 'Tümü', icon: FileText, color: 'default' },
  published: { label: 'Yayında', icon: Eye, color: 'success' },
  draft: { label: 'Taslak', icon: EyeOff, color: 'secondary' },
  pending: { label: 'Onay Bekliyor', icon: Clock, color: 'warning' },
  approved: { label: 'Onaylandı', icon: CheckCircle, color: 'success' },
  rejected: { label: 'Reddedildi', icon: XCircle, color: 'destructive' },
  expired: { label: 'Süresi Doldu', icon: Calendar, color: 'muted' },
  sold: { label: 'Satıldı', icon: ShoppingBag, color: 'success' },
  inactive: { label: 'Pasif', icon: EyeOff, color: 'muted' },
  in_transaction: { label: 'Alışverişte', icon: ArrowLeftRight, color: 'info' }
}

export const getListingStatus = (listing: any): string => {
  const { status, expires_at, offer_accepted_at, accepted_offer_id } = listing

  if (status === 'in_transaction') return 'in_transaction'
  if (status === 'sold') return 'sold'
  if (status === 'inactive') return 'inactive'

  if (status === 'active' || status === 'published') {
    if (expires_at && new Date(expires_at) < new Date()) {
      return 'expired'
    }
    
    if (accepted_offer_id && offer_accepted_at) {
      const acceptedDate = new Date(offer_accepted_at)
      const oneDayLater = new Date(acceptedDate.getTime() + 24 * 60 * 60 * 1000)
      
      if (new Date() > oneDayLater) {
        return 'sold'
      } else {
        return 'in_transaction'
      }
    }
    
    return 'published'
  }

  if (status === 'draft') return 'draft'
  if (status === 'pending') return 'pending'
  if (status === 'approved') return 'approved'
  if (status === 'rejected') return 'rejected'

  return 'pending'
}

export const getStatusBadge = (listing: any) => {
  const status = getListingStatus(listing)
  const config = statusConfig[status]

  if (!config) {
    return (
      <Badge variant="outline" className="flex items-center gap-1">
        <Clock className="w-3 h-3" />
        Bilinmeyen
      </Badge>
    )
  }
  
  const Icon = config.icon

  const variantMap: Record<string, any> = {
    success: 'default',
    warning: 'secondary',
    destructive: 'destructive',
    muted: 'outline',
    secondary: 'outline',
    info: 'default'
  }

  let badgeClass = ''
  if (status === 'sold') {
    badgeClass = 'bg-green-500 text-white hover:bg-green-600'
  } else if (status === 'in_transaction') {
    badgeClass = 'bg-blue-500 text-white hover:bg-blue-600'
  }

  return (
    <Badge variant={variantMap[config.color] || 'default'} className={`flex items-center gap-1 ${badgeClass}`}>
      <Icon className="w-3 h-3" />
      {config.label}
    </Badge>
  )
}

export const getPremiumBadges = (listing: any) => {
  const badges = []
  if (listing.is_featured) badges.push({ icon: Star, label: 'Öne Çıkar', color: 'bg-yellow-500' })
  if (listing.is_urgent_premium) badges.push({ icon: Zap, label: 'Acil', color: 'bg-red-500' })
  if (listing.is_showcase) badges.push({ icon: Eye, label: 'Vitrin', color: 'bg-purple-500' })
  return badges
}

