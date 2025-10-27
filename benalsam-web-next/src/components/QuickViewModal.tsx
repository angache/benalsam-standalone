'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { MapPin, DollarSign, Clock, Eye, Heart, Share2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import Link from 'next/link';

interface QuickViewModalProps {
  listing: any;
  isOpen: boolean;
  onClose: () => void;
  onToggleFavorite?: () => void;
  isFavorited?: boolean;
}

export function QuickViewModal({ 
  listing, 
  isOpen, 
  onClose,
  onToggleFavorite,
  isFavorited 
}: QuickViewModalProps) {
  if (!listing) return null;

  const mainImage = listing.images?.find((img: any) => img.is_main)?.url || listing.images?.[0]?.url;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">{listing.title}</DialogTitle>
        </DialogHeader>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Left: Image */}
          <div className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
            {mainImage ? (
              <Image
                src={mainImage}
                alt={listing.title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <ImageIcon className="w-16 h-16 text-gray-400" />
              </div>
            )}
          </div>

          {/* Right: Details */}
          <div className="space-y-4">
            {/* Price */}
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-600" />
              <span className="text-3xl font-bold text-green-600">
                {listing.budget?.toLocaleString('tr-TR')} ₺
              </span>
            </div>

            {/* Location */}
            {listing.location && (
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <MapPin className="w-5 h-5" />
                <span>{listing.location}</span>
              </div>
            )}

            {/* Created at */}
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <Clock className="w-5 h-5" />
              <span>{new Date(listing.created_at).toLocaleDateString('tr-TR')}</span>
            </div>

            {/* Description */}
            <div className="border-t pt-4">
              <h3 className="font-semibold mb-2">Açıklama</h3>
              <p className="text-gray-700 dark:text-gray-300 line-clamp-6">
                {listing.description || 'Açıklama yok'}
              </p>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 border-t pt-4">
              <span className="flex items-center gap-1">
                <Eye size={16} />
                {listing.view_count || 0}
              </span>
              <span className="flex items-center gap-1">
                <Heart size={16} />
                {listing.favorites_count || 0}
              </span>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button asChild className="flex-1">
                <Link href={`/ilan/${listing.id}`}>
                  Detaylı Görüntüle
                </Link>
              </Button>
              
              {onToggleFavorite && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={onToggleFavorite}
                  className="animate-heartBeat"
                >
                  <Heart 
                    size={20}
                    className={isFavorited ? 'fill-red-500 text-red-500' : ''}
                  />
                </Button>
              )}
              
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  navigator.share?.({
                    title: listing.title,
                    url: `${window.location.origin}/ilan/${listing.id}`
                  });
                }}
              >
                <Share2 size={20} />
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

