'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Package, Plus, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'
import InventoryItemCard from '@/components/InventoryItemCard'
import { useAuth } from '@/hooks/useAuth'
import { fetchInventoryItems, deleteInventoryItem } from '@/services/inventoryService'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { EmptyStateList } from '@/components/ui/empty-state'

interface InventoryItem {
  id: string
  user_id: string
  name: string
  category: string
  description?: string
  main_image_url?: string
  additional_image_urls?: string[]
  image_url?: string
  created_at: string
  updated_at?: string
  condition?: string
  estimated_value?: number
  tags?: string[]
  is_available?: boolean
  is_featured?: boolean
  view_count?: number
  favorite_count?: number
  offer_count?: number
}

const InventoryPage = () => {
  const router = useRouter()
  const { user, isLoading: loadingAuth } = useAuth()
  const { toast } = useToast()

  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([])
  const [isFetchingInventory, setIsFetchingInventory] = useState(false)

  // Fetch inventory items when component mounts or user changes
  useEffect(() => {
    if (user?.id) {
      setIsFetchingInventory(true)

      fetchInventoryItems(user.id)
        .then((items) => {
          setInventoryItems(items || [])
        })
        .catch((error) => {
          logger.error('[InventoryPage] Error fetching inventory', { error })
          toast({
            title: 'Hata',
            description: 'Envanter yüklenirken bir sorun oluştu.',
            variant: 'destructive',
          })
        })
        .finally(() => {
          setIsFetchingInventory(false)
        })
    }
  }, [user?.id, toast])

  const isLoadingPage = loadingAuth || (user && isFetchingInventory && inventoryItems.length === 0)
  const showEmptyState = !isLoadingPage && !isFetchingInventory && inventoryItems.length === 0 && !!user

  if (isLoadingPage) {
    return (
      <div className="min-h-[calc(100vh-80px)] flex flex-col items-center justify-center bg-background p-4 text-center">
        <LoadingSpinner size="xl" />
        <h2 className="text-2xl font-semibold text-foreground mb-3 mt-6">
          {loadingAuth ? 'Kimlik doğrulanıyor...' : 'Envanter yükleniyor...'}
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
          description="Envanterinizi görmek için giriş yapmanız gerekiyor."
          action={
            <Button onClick={() => router.push('/auth/login')}>Giriş Yap</Button>
          }
        />
      </div>
    )
  }

  const handleDelete = async (itemId: string) => {
    try {
      logger.debug('[InventoryPage] Deleting item', { itemId, userId: user.id })

      const success = await deleteInventoryItem(itemId, user.id)
      if (success) {
        setInventoryItems((prev) => prev.filter((item) => item.id !== itemId))
        toast({
          title: 'Başarılı',
          description: 'Ürün başarıyla silindi.',
        })
      } else {
        toast({
          title: 'Silme Başarısız',
          description: 'Ürün silinirken bir hata oluştu.',
          variant: 'destructive',
        })
      }
    } catch (error) {
      logger.error('[InventoryPage] Error deleting inventory item', { error })
      toast({
        title: 'Hata',
        description: 'Ürün silinirken bir sorun oluştu.',
        variant: 'destructive',
      })
    }
  }

  const handleEdit = (item: InventoryItem) => {
    router.push(`/envanter/duzenle/${item.id}`)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="mx-auto w-full max-w-[1600px] 2xl:max-w-[1920px] px-1 sm:px-2 lg:px-4 xl:px-6 py-8"
    >
      <div className="flex flex-col md:flex-row justify-between items-center mb-8">
        <h1 className="text-3xl md:text-4xl font-bold mb-4 md:mb-0">
          Envanterim
        </h1>
        <Button
          onClick={() => router.push('/envanter/yeni')}
          className="text-primary-foreground"
        >
          <Plus className="w-5 h-5 mr-2" /> Yeni Ürün Ekle
        </Button>
      </div>
      <p className="text-muted-foreground mb-8 text-center md:text-left">
        Burada sahip olduğunuz ve alım ilanlarına teklif olarak sunabileceğiniz ürünleri
        yönetebilirsiniz. Bu ürünler herkese açık listelenmez.
      </p>

      {user && isFetchingInventory && inventoryItems.length > 0 && !isLoadingPage && (
        <div className="text-center py-10">
          <Loader2 className="w-8 h-8 text-primary mx-auto mb-3 animate-spin" />
          <p className="text-muted-foreground">Envanter güncelleniyor...</p>
        </div>
      )}

      {!isFetchingInventory && inventoryItems.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          <AnimatePresence>
            {inventoryItems.map((item) => (
              <InventoryItemCard
                key={item.id}
                item={item}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {showEmptyState && (
        <div className="text-center py-20 bg-card rounded-2xl border">
          <Package className="w-20 h-20 text-primary mx-auto mb-6" />
          <h2 className="text-2xl font-semibold text-foreground mb-3">
            Envanterin boş görünüyor.
          </h2>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">
            Tekliflerde kullanmak üzere sahip olduğun ürünleri buraya ekleyebilirsin.
          </p>
          <Button
            onClick={() => router.push('/envanter/yeni')}
            className="text-primary-foreground px-8 py-3 text-lg"
          >
            <Plus className="w-5 h-5 mr-2" /> İlk Ürününü Ekle
          </Button>
        </div>
      )}
    </motion.div>
  )
}

export default InventoryPage

