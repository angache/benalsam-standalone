'use client';

import { useQuery } from '@tanstack/react-query';
import { X, MapPin, Eye, ExternalLink, Loader2 } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

interface ListingInfoModalProps {
  listingId: string;
  onClose: () => void;
}

export function ListingInfoModal({ listingId, onClose }: ListingInfoModalProps) {
  // Fetch listing details from API
  const { data, isLoading, error } = useQuery({
    queryKey: ['listing-detail', listingId],
    queryFn: async () => {
      const response = await fetch(`/api/listings/${listingId}`);
      if (!response.ok) throw new Error('Failed to fetch listing');
      const result = await response.json();
      return result.data;
    },
    enabled: !!listingId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div 
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-lg w-full mx-4 overflow-hidden animate-scaleIn"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="p-8 text-center">
            <p className="text-red-600 mb-4">İlan bilgileri yüklenemedi</p>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200"
            >
              Kapat
            </button>
          </div>
        )}

        {/* Content */}
        {data && (
          <>
            {/* Header with Image */}
            <div className="relative">
              {data.main_image_url && (
                <div className="relative h-48 bg-gray-100 dark:bg-gray-800">
                  <img 
                    src={data.main_image_url} 
                    alt={data.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                </div>
              )}
              
              {/* Close Button */}
              <button
                onClick={onClose}
                className="absolute top-3 right-3 p-2 bg-white/90 dark:bg-gray-900/90 hover:bg-white dark:hover:bg-gray-900 rounded-full transition-colors shadow-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4">
              {/* Title & Price */}
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 line-clamp-2">
                  {data.title}
                </h3>
                <div className="flex items-center justify-between">
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {formatPrice(data.budget || 0)}
                  </p>
                  {data.view_count !== undefined && (
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                      <Eye className="w-4 h-4" />
                      <span>{data.view_count} görüntülenme</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Location & Category */}
              {(data.location || data.category) && (
                <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                  {data.location && (
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      <span>{data.location}</span>
                    </div>
                  )}
                  {data.category && (
                    <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-full text-xs">
                      {data.category}
                    </span>
                  )}
                </div>
              )}

              {/* Description */}
              {data.description && (
                <div className="border-t border-gray-200 dark:border-gray-800 pt-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3">
                    {data.description}
                  </p>
                </div>
              )}

              {/* Seller Info */}
              {data.profiles && (
                <div className="border-t border-gray-200 dark:border-gray-800 pt-4">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Satıcı</p>
                  <div className="flex items-center gap-3">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={data.profiles.avatar_url || undefined} alt={data.profiles.name} />
                      <AvatarFallback className="bg-gradient-to-br from-purple-400 to-pink-400 text-white">
                        {data.profiles.name?.[0] || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {data.profiles.name}
                      </p>
                      {data.profiles.rating && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          ⭐ {data.profiles.rating.toFixed(1)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => {
                    window.location.href = `/ilan/${listingId}`;
                  }}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  İlanı Görüntüle
                </button>
                <button
                  onClick={onClose}
                  className="px-6 py-3 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-white rounded-xl font-semibold transition-colors"
                >
                  Kapat
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

