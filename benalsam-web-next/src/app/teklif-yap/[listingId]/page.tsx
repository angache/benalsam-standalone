'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { fetchInventoryItems } from '@/services/inventoryService'
import { createOffer } from '@/services/offerService'
import MakeOfferForm from '@/components/offers/MakeOfferForm'

const MakeOfferPage = () => {
  const params = useParams()
  const router = useRouter()
  const { user, isLoading: loadingAuth } = useAuth()
  const { toast } = useToast()
  const listingId = params?.listingId as string

  const [listing, setListing] = useState<any>(null)
  const [inventoryItems, setInventoryItems] = useState<any[]>([])
  const [loadingListing, setLoadingListing] = useState(false)
  const [isFetchingInventory, setIsFetchingInventory] = useState(false)
  const [isSubmittingOffer, setIsSubmittingOffer] = useState(false)

  // Fetch listing data
  useEffect(() => {
    if (!user?.id || !listingId) return

    const fetchListing = async () => {
      setLoadingListing(true)
      try {
        const { data, error } = await supabase
          .from('listings')
          .select('id, title, description, budget, user_id, status, main_image_url')
          .eq('id', listingId)
          .single()

        if (error || !data) {
          toast({
            title: 'İlan Bulunamadı',
            description: 'Teklif yapılacak ilan bulunamadı.',
            variant: 'destructive',
          })
          router.back()
          return
        }

        // Check if user owns this listing
        if (data.user_id === user.id) {
          toast({
            title: 'Kendi İlanınız',
            description: 'Kendi ilanınıza teklif yapamazsınız.',
            variant: 'destructive',
          })
          router.back()
          return
        }

        // Check if listing is available for offers
        if (data.status === 'in_transaction' || data.status === 'sold') {
          toast({
            title: 'Teklif Yapılamaz',
            description: 'Bu ilan için bir teklif kabul edilmiş veya ilan satılmış.',
            variant: 'destructive',
          })
          router.push(`/ilan/${listingId}`)
          return
        }

        setListing(data)
      } catch (error) {
        console.error('Error fetching listing:', error)
        toast({
          title: 'Hata',
          description: 'İlan yüklenirken bir sorun oluştu.',
          variant: 'destructive',
        })
        router.back()
      } finally {
        setLoadingListing(false)
      }
    }

    fetchListing()
  }, [user?.id, listingId, router, toast])

  // Fetch inventory items
  useEffect(() => {
    if (!user?.id) return

    const fetchInventory = async () => {
      setIsFetchingInventory(true)
      try {
        const data = await fetchInventoryItems(user.id)
        setInventoryItems(data || [])
      } catch (error) {
        console.error('Error fetching inventory:', error)
        setInventoryItems([])
      } finally {
        setIsFetchingInventory(false)
      }
    }

    fetchInventory()
  }, [user?.id])

  const handleOfferSubmit = async (offerData: {
    selectedItemId?: string
    offeredPrice?: number
    message: string
    attachments?: File[]
  }) => {
    if (!user?.id || !listing) return

    setIsSubmittingOffer(true)
    try {
      const offerPayload: any = {
        listing_id: listing.id,
        offering_user_id: user.id,
        message: offerData.message.trim(),
        status: 'pending',
      }

      if (offerData.selectedItemId) {
        offerPayload.offered_item_id = offerData.selectedItemId
      }

      if (offerData.offeredPrice) {
        offerPayload.offered_price = offerData.offeredPrice
      }

      const result = await createOffer(offerPayload)

      if (result) {
        toast({
          title: 'Başarılı!',
          description: 'Teklifiniz başarıyla gönderildi.',
        })
        router.push(`/ilan/${listing.id}`)
      }
    } catch (error: any) {
      console.error('Error submitting offer:', error)
      toast({
        title: 'Hata',
        description: error.message || 'Teklif gönderilirken bir sorun oluştu.',
        variant: 'destructive',
      })
    } finally {
      setIsSubmittingOffer(false)
    }
  }

  const isLoading = loadingListing || isFetchingInventory || !listing || loadingAuth
  const loadingText = loadingListing
    ? 'İlan yükleniyor...'
    : isFetchingInventory
    ? 'Envanter yükleniyor...'
    : 'Yükleniyor...'

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">{loadingText}</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Teklif yapmak için giriş yapmalısınız.</p>
          <Button onClick={() => router.push('/auth/login')}>Giriş Yap</Button>
        </div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="mx-auto w-full max-w-[1600px] 2xl:max-w-[1920px] px-1 sm:px-2 lg:px-4 xl:px-6 py-12"
    >
      <div className="flex items-center mb-8">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          className="mr-4 text-muted-foreground hover:text-foreground"
          disabled={isSubmittingOffer}
        >
          <ArrowLeft className="w-6 h-6" />
        </Button>
        <h1 className="text-2xl font-bold text-gradient truncate">
          Teklif Yap: {listing?.title}
        </h1>
      </div>

      <MakeOfferForm
        listing={listing}
        inventoryItems={inventoryItems}
        currentUser={user}
        onSubmit={handleOfferSubmit}
        isSubmitting={isSubmittingOffer}
      />
    </motion.div>
  )
}

export default MakeOfferPage

