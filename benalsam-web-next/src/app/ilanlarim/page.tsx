'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from '@/components/ui/use-toast'
import { useAuth } from '@/hooks/useAuth'
import MyListingsHeader from '@/components/MyListings/MyListingsHeader'
import MyListingCard from '@/components/MyListings/MyListingCard'
import DopingModal from '@/components/MyListings/DopingModal'
import { statusConfig, getListingStatus, getStatusBadge, getPremiumBadges } from '@/lib/myListingsUtils'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyStateList } from '@/components/ui/empty-state'
import { Button } from '@/components/ui/button'
import type { Listing } from '@/types'

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

// Modern skeleton component for my listings page
const MyListingsSkeleton = () => (
  <div className="mx-auto w-full max-w-[1600px] 2xl:max-w-[1920px] px-1 sm:px-2 lg:px-4 xl:px-6 py-8">
    {/* Header Skeleton */}
    <div className="mb-8">
      <div className="h-8 bg-muted rounded w-48 mb-4"></div>
      <div className="flex gap-2 mb-4">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="h-10 bg-muted rounded w-20"></div>
        ))}
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

const MyListingsPage = () => {
  const router = useRouter()
  const { user, isLoading: loadingAuth } = useAuth()
  const [myListings, setMyListings] = useState<Partial<Listing>[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const [dopingModalOpen, setDopingModalOpen] = useState(false)
  const [selectedListingForDoping, setSelectedListingForDoping] = useState<Partial<Listing> | null>(null)

  useEffect(() => {
    if (loadingAuth || !user) return
    fetchMyListings()
  }, [user, loadingAuth])

  const fetchMyListings = async () => {
    if (!user?.id) return
    
    setIsLoading(true)
    try {
      const response = await fetch('/api/listings/my-listings')
      
      if (!response.ok) {
        throw new Error('Failed to fetch listings')
      }

      const data = await response.json()
      setMyListings(data.listings || [])
    } catch (error) {
      console.error('Error fetching listings:', error)
      toast({
        title: 'İlanlar Yüklenemedi',
        description: 'İlanlarınız yüklenirken bir hata oluştu.',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const filteredListings = useMemo(() => {
    if (selectedStatus === 'all') return myListings
    return myListings.filter(listing => getListingStatus(listing) === selectedStatus)
  }, [myListings, selectedStatus])

  const handleDeleteListing = async (listingId: string) => {
    if (!confirm('Bu ilanı silmek istediğinizden emin misiniz?')) return

    setIsDeleting(listingId)
    try {
      const response = await fetch(`/api/listings/${listingId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to delete listing')
      }

      setMyListings(prev => prev.filter(listing => listing.id !== listingId))
      toast({
        title: 'İlan Silindi',
        description: 'İlanınız başarıyla silindi.',
        variant: 'default'
      })
    } catch (error) {
      console.error('Error deleting listing:', error)
      toast({
        title: 'Hata',
        description: 'İlan silinirken bir hata oluştu.',
        variant: 'destructive'
      })
    } finally {
      setIsDeleting(null)
    }
  }

  const handleToggleStatus = async (listingId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active'
    
    try {
      const response = await fetch(`/api/listings/${listingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })

      if (!response.ok) {
        throw new Error('Failed to update status')
      }

      setMyListings(prev => prev.map(listing => 
        listing.id === listingId ? { ...listing, status: newStatus } : listing
      ))

      toast({
        title: 'Durum Güncellendi',
        description: `İlan ${newStatus === 'active' ? 'yayına alındı' : 'yayından kaldırıldı'}.`,
        variant: 'default'
      })
    } catch (error) {
      console.error('Error toggling status:', error)
      toast({
        title: 'Hata',
        description: 'İlan durumu güncellenirken bir hata oluştu.',
        variant: 'destructive'
      })
    }
  }

  const handleMarkAsCompleted = async (listingId: string) => {
    if (!confirm('Bu alışverişi tamamlandı olarak işaretlemek istediğinizden emin misiniz?')) return

    try {
      const response = await fetch(`/api/listings/${listingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'sold' })
      })

      if (!response.ok) {
        throw new Error('Failed to mark as completed')
      }

      setMyListings(prev => prev.map(listing => 
        listing.id === listingId ? { ...listing, status: 'sold' } : listing
      ))

      toast({
        title: 'Alışveriş Tamamlandı',
        description: 'İlan tamamlandı olarak işaretlendi.',
        variant: 'default'
      })
    } catch (error) {
      console.error('Error marking as completed:', error)
      toast({
        title: 'Hata',
        description: 'İlan tamamlanırken bir hata oluştu.',
        variant: 'destructive'
      })
    }
  }

  const handleDopingClick = (listing: Partial<Listing>) => {
    setSelectedListingForDoping(listing)
    setDopingModalOpen(true)
  }

  const handleDopingSuccess = () => {
    setDopingModalOpen(false)
    setSelectedListingForDoping(null)
    fetchMyListings()
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

  return (
    <div className="min-h-screen bg-background">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="mx-auto w-full max-w-[1600px] 2xl:max-w-[1920px] px-1 sm:px-2 lg:px-4 xl:px-6 py-8"
      >
        <MyListingsHeader
          selectedStatus={selectedStatus}
          onStatusChange={setSelectedStatus}
          statusConfig={statusConfig}
          onCreateClick={() => router.push('/ilan-olustur')}
        />

        {isLoading ? (
          <MyListingsSkeleton />
        ) : filteredListings.length === 0 ? (
          <EmptyStateList
            title={selectedStatus === 'all' ? 'Henüz ilan oluşturmamışsınız' : `${statusConfig[selectedStatus].label} ilan bulunamadı`}
            description={selectedStatus === 'all' 
              ? 'İlk ilanınızı oluşturarak takas yapmaya başlayın!'
              : 'Bu durumda ilan bulunmuyor. Farklı bir filtre deneyin.'
            }
            action={
              selectedStatus === 'all' ? (
                <Button onClick={() => router.push('/ilan-olustur')} className="bg-gradient-to-r from-blue-700 to-blue-900 hover:from-blue-800 hover:to-blue-950 text-white">
                  İlk İlanını Oluştur
                </Button>
              ) : undefined
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 xl:gap-5 2xl:gap-4">
            <AnimatePresence>
              {filteredListings.map((listing) => {
                const status = getListingStatus(listing)
                
                return (
                  <MyListingCard
                    key={listing.id}
                    listing={listing}
                    status={status}
                    onView={(id) => {
                      const { generateListingUrl } = require('@/lib/slugify')
                      router.push(generateListingUrl(listing.title, id))
                    }}
                    onEdit={() => toast({ title: '🚧 Yakında!', description: 'İlan düzenleme özelliği geliştirme aşamasında.' })}
                    onToggleStatus={handleToggleStatus}
                    onDelete={handleDeleteListing}
                    onMarkAsCompleted={handleMarkAsCompleted}
                    isDeleting={isDeleting}
                    getStatusBadge={getStatusBadge}
                    getPremiumBadges={getPremiumBadges}
                    onDopingClick={handleDopingClick}
                  />
                )
              })}
            </AnimatePresence>
          </div>
        )}

        <DopingModal
          isOpen={dopingModalOpen}
          onClose={() => setDopingModalOpen(false)}
          listing={selectedListingForDoping}
          onSuccess={handleDopingSuccess}
        />
      </motion.div>
    </div>
  )
}

export default MyListingsPage

