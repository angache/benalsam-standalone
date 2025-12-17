'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { MessageSquare, Loader2, Package, DollarSign, User, Calendar, CheckCircle, XCircle, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'
import { useAuth } from '@/hooks/useAuth'
import { fetchReceivedOffers, updateOfferStatus } from '@/services/offerService'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { EmptyStateList } from '@/components/ui/empty-state'
import OfferCard from '@/components/offers/OfferCard'

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

const ReceivedOffersPage = () => {
  const router = useRouter()
  const { user, isLoading: loadingAuth } = useAuth()
  const { toast } = useToast()

  const [offers, setOffers] = useState<Offer[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'accepted' | 'rejected'>('all')
  const [updatingOfferId, setUpdatingOfferId] = useState<string | null>(null)

  // Fetch offers when component mounts or user changes
  useEffect(() => {
    if (user?.id) {
      setIsLoading(true)
      fetchReceivedOffers(user.id)
        .then((fetchedOffers) => {
          setOffers(fetchedOffers || [])
        })
        .catch((error) => {
          console.error('Error fetching received offers:', error)
          toast({
            title: 'Hata',
            description: 'Teklifler yüklenirken bir sorun oluştu.',
            variant: 'destructive',
          })
        })
        .finally(() => {
          setIsLoading(false)
        })
    }
  }, [user?.id, toast])

  const handleUpdateOfferStatus = async (offerId: string, status: 'accepted' | 'rejected') => {
    if (!user?.id) return

    setUpdatingOfferId(offerId)
    try {
      const updatedOffer = await updateOfferStatus(offerId, status, user.id)
      if (updatedOffer) {
        setOffers((prevOffers) =>
          prevOffers.map((offer) =>
            offer.id === offerId ? { ...offer, status: updatedOffer.status } : offer
          )
        )
      }
    } catch (error) {
      console.error('Error updating offer status:', error)
    } finally {
      setUpdatingOfferId(null)
    }
  }

  const filteredOffers = offers.filter((offer) => {
    if (filterStatus === 'all') return true
    return offer.status === filterStatus
  })

  const pendingCount = offers.filter((o) => o.status === 'pending').length
  const acceptedCount = offers.filter((o) => o.status === 'accepted').length
  const rejectedCount = offers.filter((o) => o.status === 'rejected').length

  const isLoadingPage = loadingAuth || (user && isLoading && offers.length === 0)
  const showEmptyState = !isLoadingPage && !isLoading && filteredOffers.length === 0 && !!user

  if (isLoadingPage) {
    return (
      <div className="min-h-[calc(100vh-80px)] flex flex-col items-center justify-center bg-background p-4 text-center">
        <LoadingSpinner size="xl" />
        <h2 className="text-2xl font-semibold text-foreground mb-3 mt-6">
          {loadingAuth ? 'Kimlik doğrulanıyor...' : 'Teklifler yükleniyor...'}
        </h2>
        <p className="text-muted-foreground">Lütfen bekleyin.</p>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-[calc(100vh-80px)] flex flex-col items-center justify-center bg-background p-4 text-center">
        <EmptyStateList
          title="Giriş Yapmalısınız"
          description="Aldığınız teklifleri görmek için giriş yapmanız gerekiyor."
          action={
            <Button onClick={() => router.push('/auth/login')}>Giriş Yap</Button>
          }
        />
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="mx-auto w-full max-w-[1600px] 2xl:max-w-[1920px] px-1 sm:px-2 lg:px-4 xl:px-6 py-8"
    >
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold mb-2">Aldığım Teklifler</h1>
        <p className="text-muted-foreground">
          İlanlarınıza gelen teklifleri buradan görüntüleyebilir ve yönetebilirsiniz.
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 mb-6 border-b border-border/50 pb-4">
        <Button
          variant={filterStatus === 'all' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setFilterStatus('all')}
          className="relative"
        >
          Tümü
          {offers.length > 0 && (
            <span className="ml-2 text-xs bg-muted px-1.5 py-0.5 rounded-full">
              {offers.length}
            </span>
          )}
        </Button>
        <Button
          variant={filterStatus === 'pending' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setFilterStatus('pending')}
          className="relative"
        >
          <Clock className="w-4 h-4 mr-1.5" />
          Bekleyen
          {pendingCount > 0 && (
            <span className="ml-2 text-xs bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full">
              {pendingCount}
            </span>
          )}
        </Button>
        <Button
          variant={filterStatus === 'accepted' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setFilterStatus('accepted')}
        >
          <CheckCircle className="w-4 h-4 mr-1.5" />
          Kabul Edilen
          {acceptedCount > 0 && (
            <span className="ml-2 text-xs bg-green-500 text-white px-1.5 py-0.5 rounded-full">
              {acceptedCount}
            </span>
          )}
        </Button>
        <Button
          variant={filterStatus === 'rejected' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setFilterStatus('rejected')}
        >
          <XCircle className="w-4 h-4 mr-1.5" />
          Reddedilen
          {rejectedCount > 0 && (
            <span className="ml-2 text-xs bg-destructive text-destructive-foreground px-1.5 py-0.5 rounded-full">
              {rejectedCount}
            </span>
          )}
        </Button>
      </div>

      {/* Offers List */}
      {isLoading && offers.length > 0 && (
        <div className="text-center py-10">
          <Loader2 className="w-8 h-8 text-primary mx-auto mb-3 animate-spin" />
          <p className="text-muted-foreground">Teklifler güncelleniyor...</p>
        </div>
      )}

      {!isLoading && filteredOffers.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
          {filteredOffers.map((offer) => (
            <OfferCard
              key={offer.id}
              offer={offer}
              onUpdateStatus={handleUpdateOfferStatus}
              isUpdating={updatingOfferId === offer.id}
            />
          ))}
        </div>
      )}

      {showEmptyState && (
        <div className="text-center py-20 bg-card rounded-2xl border">
          <MessageSquare className="w-20 h-20 text-primary mx-auto mb-6" />
          <h2 className="text-2xl font-semibold text-foreground mb-3">
            {filterStatus === 'all'
              ? 'Henüz teklif almadınız'
              : filterStatus === 'pending'
              ? 'Bekleyen teklif yok'
              : filterStatus === 'accepted'
              ? 'Kabul edilen teklif yok'
              : 'Reddedilen teklif yok'}
          </h2>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">
            {filterStatus === 'all'
              ? 'İlanlarınıza henüz teklif gelmedi. Daha fazla görünürlük için ilanlarınızı öne çıkarabilirsiniz.'
              : 'Bu kategoride henüz teklif bulunmuyor.'}
          </p>
          {filterStatus !== 'all' && (
            <Button
              variant="outline"
              onClick={() => setFilterStatus('all')}
              className="px-8 py-3"
            >
              Tüm Teklifleri Gör
            </Button>
          )}
        </div>
      )}
    </motion.div>
  )
}

export default ReceivedOffersPage

