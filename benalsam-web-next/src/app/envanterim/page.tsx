'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Package, Plus, Loader2, Search, Grid, List, Filter, X, SlidersHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/use-toast'
import InventoryItemCard from '@/components/InventoryItemCard'
import { useAuth } from '@/hooks/useAuth'
import { fetchInventoryItems, deleteInventoryItem } from '@/services/inventoryService'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { EmptyStateList } from '@/components/ui/empty-state'
import { logger } from '@/utils/production-logger'

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
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'category'>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showFilters, setShowFilters] = useState(false)

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

  // Get unique categories from inventory items
  const categories = useMemo(() => {
    const uniqueCategories = new Set<string>()
    inventoryItems.forEach(item => {
      if (item.category) uniqueCategories.add(item.category)
    })
    return Array.from(uniqueCategories).sort()
  }, [inventoryItems])

  // Filter and sort inventory items
  const filteredAndSortedItems = useMemo(() => {
    let filtered = [...inventoryItems]

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(item => {
        const name = item.name?.toLowerCase() || ''
        const description = item.description?.toLowerCase() || ''
        const category = item.category?.toLowerCase() || ''
        const tags = item.tags?.join(' ').toLowerCase() || ''
        
        return name.includes(query) || 
               description.includes(query) || 
               category.includes(query) ||
               tags.includes(query)
      })
    }

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(item => item.category === selectedCategory)
    }

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0
      
      switch (sortBy) {
        case 'name':
          comparison = (a.name || '').localeCompare(b.name || '')
          break
        case 'category':
          comparison = (a.category || '').localeCompare(b.category || '')
          break
        case 'date':
        default:
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          break
      }
      
      return sortOrder === 'asc' ? comparison : -comparison
    })

    return filtered
  }, [inventoryItems, searchQuery, selectedCategory, sortBy, sortOrder])

  // Count active filters
  const activeFilterCount = useMemo(() => {
    let count = 0
    if (searchQuery.trim()) count++
    if (selectedCategory !== 'all') count++
    return count
  }, [searchQuery, selectedCategory])

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery('')
    setSelectedCategory('all')
  }

  const handleDelete = async (itemId: string) => {
    try {
      logger.debug('[InventoryPage] Deleting item', { itemId, userId: user?.id })

      if (!user?.id) return

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

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="mx-auto w-full max-w-[1600px] 2xl:max-w-[1920px] px-1 sm:px-2 lg:px-4 xl:px-6 py-8"
    >
      <div className="flex flex-col md:flex-row justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
          Envanterim
        </h1>
          <p className="text-muted-foreground text-sm">
            {filteredAndSortedItems.length} ürün {activeFilterCount > 0 && `(${activeFilterCount} filtre aktif)`}
          </p>
        </div>
        <div className="flex items-center gap-3 mt-4 md:mt-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="relative"
          >
            <SlidersHorizontal className="w-4 h-4 mr-2" />
            Filtreler
            {activeFilterCount > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-primary text-primary-foreground text-xs rounded-full">
                {activeFilterCount}
              </span>
            )}
          </Button>
          <div className="flex items-center gap-1 border rounded-lg p-1">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="h-8 w-8 p-0"
            >
              <Grid className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="h-8 w-8 p-0"
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        <Button
          onClick={() => router.push('/envanter/yeni')}
          className="text-primary-foreground"
        >
          <Plus className="w-5 h-5 mr-2" /> Yeni Ürün Ekle
        </Button>
      </div>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Ürün adı, kategori veya açıklamada ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-2"
          />
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="mb-6 p-4 bg-card border rounded-lg space-y-4"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Filtreler
            </h3>
            {activeFilterCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4 mr-1" />
                Filtreleri Temizle
              </Button>
            )}
          </div>

          <div className="flex flex-col md:flex-row items-start md:items-end gap-4">
            {/* Category Filter */}
            <div className="flex-1 md:max-w-xs">
              <label className="text-sm font-medium mb-2 block">Kategori</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg bg-background h-9"
              >
                <option value="all">Tüm Kategoriler</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            {/* Sort Options */}
            <div className="flex items-end gap-4 flex-shrink-0 w-full md:w-auto">
              <div className="flex flex-col">
                <label className="text-sm font-medium mb-2 block md:hidden">Sırala</label>
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium whitespace-nowrap hidden md:block">Sırala:</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as 'date' | 'name' | 'category')}
                    className="px-3 py-2 border rounded-lg bg-background h-9"
                  >
                    <option value="date">Tarih</option>
                    <option value="name">İsim</option>
                    <option value="category">Kategori</option>
                  </select>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                    className="whitespace-nowrap h-9"
                  >
                    {sortOrder === 'asc' ? '↑ Artan' : '↓ Azalan'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {user && isFetchingInventory && inventoryItems.length > 0 && !isLoadingPage && (
        <div className="text-center py-10">
          <Loader2 className="w-8 h-8 text-primary mx-auto mb-3 animate-spin" />
          <p className="text-muted-foreground">Envanter güncelleniyor...</p>
        </div>
      )}

      {!isFetchingInventory && inventoryItems.length > 0 && (
        <>
          {filteredAndSortedItems.length === 0 ? (
            <div className="text-center py-20 bg-card rounded-2xl border">
              <Package className="w-20 h-20 text-muted-foreground mx-auto mb-6" />
              <h2 className="text-2xl font-semibold text-foreground mb-3">
                Filtrelere uygun ürün bulunamadı
              </h2>
              <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                Farklı filtreler deneyin veya filtreleri temizleyin.
              </p>
              <Button
                variant="outline"
                onClick={clearFilters}
              >
                <X className="w-4 h-4 mr-2" />
                Filtreleri Temizle
              </Button>
            </div>
          ) : (
            <div className={
              viewMode === 'grid'
                ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6'
                : 'space-y-4'
            }>
          <AnimatePresence>
                {filteredAndSortedItems.map((item) => (
              <InventoryItemCard
                key={item.id}
                item={item}
                onEdit={handleEdit}
                onDelete={handleDelete}
                    viewMode={viewMode}
              />
            ))}
          </AnimatePresence>
        </div>
          )}
        </>
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

