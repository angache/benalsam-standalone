import React from 'react';
import { motion } from 'framer-motion';
import { 
  Eye, 
  EyeOff, 
  Edit3,
  Trash2,
  MoreHorizontal,
  Calendar,
  MapPin,
  DollarSign,
  MessageSquare,
  Heart,
  Star,
  Zap,
  CheckCircle2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';

const ListingCard = ({ 
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
}) => {
  const premiumBadges = getPremiumBadges(listing);

  const canMarkAsCompleted = status === 'in_transaction' && 
                            listing.offer_accepted_at && 
                            new Date() > new Date(new Date(listing.offer_accepted_at).getTime() + 24 * 60 * 60 * 1000);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="h-full flex flex-col card-hover">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg font-semibold truncate mb-2">
                {listing.title}
              </CardTitle>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                {getStatusBadge(listing)}
                {premiumBadges.map((badge, index) => {
                  const Icon = badge.icon;
                  return (
                    <Badge key={index} className={`${badge.color} text-white flex items-center gap-1`}>
                      <Icon className="w-3 h-3" />
                      {badge.label}
                    </Badge>
                  );
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
          {listing.main_image_url && (
            <div className="w-full h-40 bg-muted rounded-lg mb-4 overflow-hidden">
              <img 
                src={listing.main_image_url} 
                alt={listing.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          
          <p className="text-sm text-muted-foreground line-clamp-2 mb-4 flex-1">
            {listing.description}
          </p>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-1 text-muted-foreground">
                <DollarSign className="w-4 h-4" />
                <span>{listing.budget}₺</span>
              </div>
              <div className="flex items-center gap-1 text-muted-foreground">
                <MapPin className="w-4 h-4" />
                <span className="truncate max-w-24">{listing.location}</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1 text-muted-foreground">
                  <MessageSquare className="w-4 h-4" />
                  <span>{listing.offers_count}</span>
                </div>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Heart className="w-4 h-4" />
                  <span>{listing.favorites_count}</span>
                </div>
              </div>
              <div className="flex items-center gap-1 text-muted-foreground">
                <Calendar className="w-4 h-4" />
                <span>{formatDistanceToNow(new Date(listing.created_at), { addSuffix: true, locale: tr })}</span>
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
            <div className="w-full p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-700 text-center font-medium">
                🛒 Alışveriş devam ediyor
              </p>
              <p className="text-xs text-blue-600 text-center mt-1">
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
  );
};

export default ListingCard;