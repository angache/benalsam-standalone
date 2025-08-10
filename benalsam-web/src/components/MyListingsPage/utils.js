import { 
  FileText, 
  Eye, 
  EyeOff, 
  Clock, 
  CheckCircle, 
  XCircle,
  Calendar,
  Star,
  Zap
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export const statusConfig = {
  all: { label: 'Tümü', icon: FileText, color: 'default' },
  published: { label: 'Yayında', icon: Eye, color: 'success' },
  draft: { label: 'Taslak', icon: EyeOff, color: 'secondary' },
  pending: { label: 'Onay Bekliyor', icon: Clock, color: 'warning' },
  approved: { label: 'Onaylandı', icon: CheckCircle, color: 'success' },
  rejected: { label: 'Reddedildi', icon: XCircle, color: 'destructive' },
  expired: { label: 'Süresi Doldu', icon: Calendar, color: 'muted' }
};

export const getListingStatus = (listing) => {
  if (listing.status === 'rejected') return 'rejected';
  if (listing.status === 'pending') return 'pending';
  if (listing.status === 'draft') return 'draft';
  if (listing.status === 'published' && new Date(listing.expires_at) < new Date()) return 'expired';
  if (listing.status === 'published') return 'published';
  return 'approved';
};

export const getStatusBadge = (listing) => {
  const status = getListingStatus(listing);
  const config = statusConfig[status];
  const Icon = config.icon;

  const variantMap = {
    success: 'default',
    warning: 'secondary',
    destructive: 'destructive',
    muted: 'outline',
    secondary: 'outline'
  };

  return (
    <Badge variant={variantMap[config.color] || 'default'} className="flex items-center gap-1">
      <Icon className="w-3 h-3" />
      {config.label}
    </Badge>
  );
};

export const getPremiumBadges = (listing) => {
  const badges = [];
  if (listing.is_featured) badges.push({ icon: Star, label: 'Öne Çıkar', color: 'bg-yellow-500' });
  if (listing.is_urgent_premium) badges.push({ icon: Zap, label: 'Acil', color: 'bg-red-500' });
  if (listing.is_showcase) badges.push({ icon: Eye, label: 'Vitrin', color: 'bg-purple-500' });
  return badges;
};