'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/hooks/useAuth'
import { useFavorites, useRemoveFavorite } from '@/hooks/useFavorites'
import ListingCard from '@/components/ListingCard'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyStateList } from '@/components/ui/empty-state'
import { Button } from '@/components/ui/button'
import { Heart, Search, Grid, List } from 'lucide-react'
import { generateListingUrl } from '@/lib/slugify'

// Skeleton card for listing
const SkeletonCard = () => (
  <div className="rounded-lg overflow-hidden bg-card border">
    <Skeleton className="h-48 w-full" />
    <div className="p-4 space-y-3">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
      <Skeleton className="h-4 w-full" />
    </div>
  </div>
)

// Skeleton component for favorites page
const FavoritesSkeleton = () => (
  <div className="mx-auto w-full max-w-[1600px] 2xl:max-w-[1920px] px-1 sm:px-2 lg:px-4 xl:px-6 py-8">
    {/* Header Skeleton */}
    <div className="mb-8">
      <div className="h-8 bg-muted rounded w-64 mb-4"></div>
      <div className="flex gap-2 mb-4">
        <div className="h-10 bg-muted rounded w-32"></div>
        <div className="h-10 bg-muted rounded w-32"></div>
      </div>
    </div>

    {/* Grid Skeleton */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 xl:gap-5 2xl:gap-4">
      {Array.from({ length: 10 }).map((_, index) => (
        <SkeletonCard key={index} />
      ))}
    </div>
  </div>
)

const FavoritesPage = () => {
  const router = useRouter()
  const { user, isLoading: loadingAuth } = useAuth()
  const { data: favorites = [], isLoading, error } = useFavorites()
  const removeFavoriteMutation = useRemoveFavorite()
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [searchQuery, setSearchQuery] = useState('')

  // Filter favorites by search query
  const filteredFavorites = React.useMemo(() => {
    if (!searchQuery.trim()) return favorites

    const query = searchQuery.toLowerCase()
    return favorites.filter((listing: any) => {
      const title = listing.title?.toLowerCase() || ''
      const description = listing.description?.toLowerCase() || ''
      const category = listing.category?.toLowerCase() || ''
      const location = typeof listing.location === 'string' 
        ? listing.location.toLowerCase()
        : `${listing.location?.province || ''} ${listing.location?.district || ''}`.toLowerCase()

      return title.includes(query) || 
             description.includes(query) || 
             category.includes(query) || 
             location.includes(query)
    })
  }, [favorites, searchQuery])

  const handleRemoveFavorite = async (listingId: string) => {
    removeFavoriteMutation.mutate(listingId)
  }

  const handleViewListing = (listing: any) => {
    router.push(generateListingUrl(listing.title, listing.id))
  }

  if (loadingAuth || isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
          <LoadingSpinner size="xl" />
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
          <EmptyStateList
            title="Giriş Yapmalısınız"
            description="Favorilerinizi görmek için giriş yapmanız gerekiyor."
            action={
              <Button onClick={() => router.push('/auth/login')}>
                Giriş Yap
              </Button>
            }
          />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="mx-auto w-full max-w-[1600px] 2xl:max-w-[1920px] px-1 sm:px-2 lg:px-4 xl:px-6 py-8"
      >
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Heart className="h-8 w-8 text-red-500 fill-red-500" />
                Favorilerim
              </h1>
              <p className="text-muted-foreground mt-2">
                {favorites.length > 0 
                  ? `${favorites.length} favori ilan` 
                  : 'Henüz favori ilanınız yok'}
              </p>
            </div>

            {/* View Mode Toggle */}
            {favorites.length > 0 && (
              <div className="flex items-center gap-2">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid className="h-4 w-4 mr-2" />
                  Grid
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                >
                  <List className="h-4 w-4 mr-2" />
                  Liste
                </Button>
              </div>
            )}
          </div>

          {/* Search Bar */}
          {favorites.length > 0 && (
            <div className="relative mb-6">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Favorilerinizde ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          )}
        </div>

        {/* Content */}
        {error ? (
          <EmptyStateList
            title="Hata Oluştu"
            description="Favorileriniz yüklenirken bir hata oluştu. Lütfen tekrar deneyin."
            action={
              <Button onClick={() => window.location.reload()}>
                Sayfayı Yenile
              </Button>
            }
          />
        ) : filteredFavorites.length === 0 ? (
          <EmptyStateList
            title={searchQuery ? 'Sonuç Bulunamadı' : 'Henüz Favori İlanınız Yok'}
            description={
              searchQuery
                ? 'Arama kriterlerinize uygun favori ilan bulunamadı.'
                : 'Beğendiğiniz ilanları favorilerinize ekleyerek daha sonra kolayca bulabilirsiniz.'
            }
            action={
              !searchQuery ? (
                <Button onClick={() => router.push('/')} className="bg-gradient-to-r from-blue-700 to-blue-900 hover:from-blue-800 hover:to-blue-950 text-white">
                  İlanları Keşfet
                </Button>
              ) : (
                <Button onClick={() => setSearchQuery('')} variant="outline">
                  Aramayı Temizle
                </Button>
              )
            }
          />
        ) : (
          <div className={
            viewMode === 'grid'
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 xl:gap-5 2xl:gap-4'
              : 'space-y-4'
          }>
            <AnimatePresence>
              {filteredFavorites.map((listing) => (
                <motion.div
                  key={listing.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  <ListingCard
                    listing={listing}
                    onToggleFavorite={handleRemoveFavorite}
                    currentUser={user}
                    isFavoritedOverride={true}
                    onView={handleViewListing}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Search Results Info */}
        {searchQuery && filteredFavorites.length > 0 && (
          <div className="mt-6 text-center text-sm text-muted-foreground">
            <p>
              "{searchQuery}" için <strong>{filteredFavorites.length}</strong> sonuç bulundu
            </p>
          </div>
        )}
      </motion.div>
    </div>
  )
}

export default FavoritesPage

