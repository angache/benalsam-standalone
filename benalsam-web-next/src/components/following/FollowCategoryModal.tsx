'use client'

import React, { useState, useEffect } from 'react'
import { useToast } from '@/components/ui/use-toast'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { followCategory } from '@/services/categoryFollowService'
import { categoryService } from '@/services/categoryService'
import { Loader2, PlusCircle } from 'lucide-react'

interface FollowCategoryModalProps {
  isOpen: boolean
  onClose: () => void
  currentUserId?: string
  onCategoryFollowed: () => void
}

const FollowCategoryModal: React.FC<FollowCategoryModalProps> = ({
  isOpen,
  onClose,
  currentUserId,
  onCategoryFollowed,
}) => {
  const [selectedCategory, setSelectedCategory] = useState('')
  const [categories, setCategories] = useState<any[]>([])
  const [isLoadingCategories, setIsLoadingCategories] = useState(true)
  const [isFollowing, setIsFollowing] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    const loadCategories = async () => {
      try {
        setIsLoadingCategories(true)
        const fetchedCategories = await categoryService.getCategories()
        setCategories(fetchedCategories || [])
      } catch (error) {
        console.error('Error loading categories:', error)
        setCategories([])
      } finally {
        setIsLoadingCategories(false)
      }
    }

    if (isOpen) {
      loadCategories()
    }
  }, [isOpen])

  const handleFollow = async () => {
    if (!selectedCategory) {
      toast({
        title: "Hata",
        description: "Lütfen bir kategori seçin.",
        variant: "destructive",
      })
      return
    }
    
    if (!currentUserId) {
      toast({
        title: "Hata",
        description: "Giriş yapmanız gerekiyor.",
        variant: "destructive",
      })
      return
    }
    
    setIsFollowing(true)
    const result = await followCategory(currentUserId, selectedCategory)
    if (result && !result.already_following) {
      onCategoryFollowed()
      toast({
        title: "Başarılı",
        description: `"${selectedCategory}" kategorisi takip edildi.`,
      })
      onClose()
      setSelectedCategory('')
    } else if (result?.already_following) {
      toast({
        title: "Bilgi",
        description: `"${selectedCategory}" kategorisini zaten takip ediyorsunuz.`,
      })
    } else {
      toast({
        title: "Hata",
        description: "Kategori takip edilirken bir sorun oluştu.",
        variant: "destructive",
      })
    }
    setIsFollowing(false)
  }
  
  const renderCategoryOptions = (cats: any[], parentPath = ''): React.ReactNode[] => {
    let options: React.ReactNode[] = []
    cats.forEach((cat) => {
      const currentPath = parentPath ? `${parentPath} > ${cat.name}` : cat.name
      options.push(
        <SelectItem key={currentPath} value={currentPath}>
          {currentPath}
        </SelectItem>
      )
      if (cat.children && cat.children.length > 0) {
        options = options.concat(renderCategoryOptions(cat.children, currentPath))
      }
    })
    return options
  }

  // Build category tree from flat list
  const buildCategoryTree = (flatCategories: any[]) => {
    const categoryMap = new Map()
    const roots: any[] = []

    flatCategories.forEach((cat) => {
      categoryMap.set(cat.id, { ...cat, children: [] })
    })

    flatCategories.forEach((cat) => {
      const node = categoryMap.get(cat.id)
      if (!cat.parent_id || cat.level === 0) {
        roots.push(node)
      } else {
        const parent = categoryMap.get(cat.parent_id)
        if (parent) {
          parent.children.push(node)
        }
      }
    })

    return roots
  }

  const categoryTree = buildCategoryTree(categories)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Kategori Takip Et</DialogTitle>
          <DialogDescription>
            Yeni ilanlardan haberdar olmak için bir kategori seçin ve takibe alın.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Kategori Seçin" />
            </SelectTrigger>
            <SelectContent>
              {isLoadingCategories ? (
                <div className="p-2 text-center text-muted-foreground">Kategoriler yükleniyor...</div>
              ) : (
                renderCategoryOptions(categoryTree)
              )}
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isFollowing}>
            İptal
          </Button>
          <Button onClick={handleFollow} disabled={isFollowing || !selectedCategory}>
            {isFollowing ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <PlusCircle className="w-4 h-4 mr-2" />
            )}
            Takip Et
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default FollowCategoryModal

