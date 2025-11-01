/**
 * Modern Category Filter Component
 * Sahibinden.com style category navigation with breadcrumb
 */

'use client'

import { useState, useEffect } from 'react'
import { ChevronRight, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useCategories } from '@/hooks/useCategories'
import { cn } from '@/lib/utils'
import { categoryCountsCacheService } from '@/services/categoryCountsCacheService'

interface Category {
  id: number | string
  name: string
  parent_id?: number | string | null
  level: number
  subcategories?: Category[]  // ✅ API'den böyle geliyor
  children?: Category[]
}

interface ModernCategoryFilterProps {
  selectedCategories: number[]
  onCategoryChange: (categoryIds: number[]) => void
}

export function ModernCategoryFilter({
  selectedCategories,
  onCategoryChange,
}: ModernCategoryFilterProps) {
  const { categories: allCategories } = useCategories()
  
  const [categoryPath, setCategoryPath] = useState<Category[]>([])
  const [currentLevelCategories, setCurrentLevelCategories] = useState<Category[]>([])
  const [categoryCounts, setCategoryCounts] = useState<Record<number, number>>({})

  // Fetch category counts (with cache)
  useEffect(() => {
    if (!allCategories || allCategories.length === 0) return
    if (currentLevelCategories.length === 0) return
    
    const fetchCounts = async () => {
      try {
        const visibleIds = currentLevelCategories.map(c => Number(c.id))
        
        // Use cache service
        const counts = await categoryCountsCacheService.getCategoryCounts(
          visibleIds,
          async () => {
            // Fetch function - only called if cache miss
            const freshCounts: Record<number, number> = {}
            
            await Promise.all(
              visibleIds.map(async (catId) => {
                try {
                  const response = await fetch(`/api/listings?categories=${catId}&pageSize=1`)
                  const data = await response.json()
                  freshCounts[catId] = data.pagination?.total || 0
                } catch (error) {
                  freshCounts[catId] = 0
                }
              })
            )
            
            return freshCounts
          }
        )
        
        setCategoryCounts(counts)
      } catch (error) {
        console.error('Error fetching category counts:', error)
      }
    }
    
    fetchCounts()
  }, [currentLevelCategories, allCategories])

  // Get all category IDs from nested structure
  const getAllCategoryIds = (categories: Category[]): number[] => {
    const ids: number[] = []
    categories.forEach(cat => {
      ids.push(Number(cat.id))
      if (cat.subcategories && cat.subcategories.length > 0) {
        ids.push(...getAllCategoryIds(cat.subcategories))
      }
    })
    return ids
  }

  // Build category hierarchy on mount
  useEffect(() => {
    if (!allCategories || allCategories.length === 0) return

    // If no selection, show root categories (level 0)
    if (selectedCategories.length === 0) {
      setCurrentLevelCategories(allCategories)
      setCategoryPath([])
      return
    }

    // Rebuild path from selected category
    const selectedId = selectedCategories[0]
    const selectedCategory = findCategoryById(selectedId, allCategories)
    
    if (selectedCategory) {
      const path = buildPathToCategory(selectedId, allCategories)
      setCategoryPath(path)
      
      // Show subcategories of selected category
      const subcats = selectedCategory.subcategories || []
      setCurrentLevelCategories(subcats)
    }
  }, [allCategories, selectedCategories])

  // Find category by ID in nested structure
  const findCategoryById = (categoryId: number, categories: Category[]): Category | null => {
    for (const cat of categories) {
      if (Number(cat.id) === categoryId) return cat
      
      if (cat.subcategories && cat.subcategories.length > 0) {
        const found = findCategoryById(categoryId, cat.subcategories)
        if (found) return found
      }
    }
    return null
  }

  // Build path from root to selected category
  const buildPathToCategory = (categoryId: number, categories: Category[]): Category[] => {
    const path: Category[] = []
    
    const findPath = (id: number, cats: Category[], currentPath: Category[]): boolean => {
      for (const cat of cats) {
        const newPath = [...currentPath, cat]
        
        if (Number(cat.id) === id) {
          path.push(...newPath)
          return true
        }
        
        if (cat.subcategories && cat.subcategories.length > 0) {
          if (findPath(id, cat.subcategories, newPath)) {
            return true
          }
        }
      }
      return false
    }
    
    findPath(categoryId, categories, [])
    return path
  }

  // Handle category click
  const handleCategoryClick = (category: Category) => {
    const categoryId = Number(category.id)
    const subcats = category.subcategories || []
    
    console.log('🔍 Category clicked:', {
      categoryId,
      categoryName: category.name,
      hasSubcategories: subcats.length > 0,
      subcategoriesCount: subcats.length,
      subcategories: subcats.map(c => c.name)
    })
    
    // ✅ HER SEVİYEDE FİLTRELE - Parent'a tıklayınca da filtrele!
    onCategoryChange([categoryId])
    
    if (subcats.length > 0) {
      // Has subcategories, navigate deeper (but keep current filter active)
      const newPath = [...categoryPath, category]
      setCategoryPath(newPath)
      setCurrentLevelCategories(subcats)
    }
    // Note: Leaf node zaten yukarıda seçildi
  }

  // Handle breadcrumb click
  const handleBreadcrumbClick = (index: number) => {
    if (index === -1) {
      // Back to root
      setCurrentLevelCategories(allCategories)
      setCategoryPath([])
      onCategoryChange([])
    } else {
      // Navigate to that level
      const newPath = categoryPath.slice(0, index + 1)
      const category = newPath[newPath.length - 1]
      const subcats = category.subcategories || []
      
      setCategoryPath(newPath)
      setCurrentLevelCategories(subcats)
      
      // ✅ Her seviyede filtrele
      onCategoryChange([Number(category.id)])
    }
  }

  // Clear selection
  const handleClearSelection = () => {
    setCurrentLevelCategories(allCategories)
    setCategoryPath([])
    onCategoryChange([])
  }

  const selectedCategoryId = selectedCategories[0]
  const hasSelection = selectedCategories.length > 0

  return (
    <div className="space-y-3">
      {/* Breadcrumb Navigation */}
      {(categoryPath.length > 0 || hasSelection) && (
        <div className="flex items-center gap-2 flex-wrap pb-2 border-b">
          <button
            onClick={() => handleBreadcrumbClick(-1)}
            className="text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            Tüm Kategoriler
          </button>
          
          {categoryPath.map((category, index) => (
            <div key={category.id} className="flex items-center gap-2">
              <ChevronRight className="w-3 h-3 text-muted-foreground" />
              <button
                onClick={() => handleBreadcrumbClick(index)}
                className={cn(
                  "text-sm transition-colors",
                  index === categoryPath.length - 1 && !hasSelection
                    ? "text-foreground font-medium"
                    : "text-muted-foreground hover:text-primary"
                )}
              >
                {category.name}
              </button>
            </div>
          ))}

          {hasSelection && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearSelection}
              className="ml-auto h-6 px-2"
            >
              <X className="w-3 h-3 mr-1" />
              Temizle
            </Button>
          )}
        </div>
      )}

      {/* Category Grid */}
      {currentLevelCategories.length > 0 ? (
        <div className="grid grid-cols-1 gap-2">
          {currentLevelCategories.map(category => {
            const categoryId = Number(category.id)
            const isSelected = selectedCategoryId === categoryId
            const hasChildren = (category.subcategories && category.subcategories.length > 0) || false

            return (
              <button
                key={category.id}
                onClick={() => handleCategoryClick(category)}
                className={cn(
                  "flex items-center justify-between p-3 rounded-lg border transition-all text-left group",
                  isSelected
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-border hover:border-primary/50 hover:bg-accent"
                )}
              >
                <div className="flex items-center gap-2 flex-1">
                  <span className={cn(
                    "text-sm font-medium",
                    isSelected ? "text-primary" : "text-foreground"
                  )}>
                    {category.name}
                  </span>
                  
                  {/* Category Count */}
                  {categoryCounts[categoryId] !== undefined && (
                    <span className={cn(
                      "text-xs px-2 py-0.5 rounded-full",
                      isSelected
                        ? "bg-primary/10 text-primary"
                        : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
                    )}>
                      {categoryCounts[categoryId]}
                    </span>
                  )}
                </div>
                
                {hasChildren && (
                  <ChevronRight className={cn(
                    "w-4 h-4 transition-transform",
                    isSelected ? "text-primary" : "text-muted-foreground"
                  )} />
                )}
              </button>
            )
          })}
        </div>
      ) : hasSelection ? (
        <div className="text-center py-6 text-sm text-muted-foreground">
          <p className="mb-2">Kategori seçildi</p>
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearSelection}
          >
            <X className="w-3 h-3 mr-1" />
            Kategori Değiştir
          </Button>
        </div>
      ) : (
        <div className="text-center py-6 text-sm text-muted-foreground">
          Kategori bulunamadı
        </div>
      )}

      {/* Selected Info */}
      {hasSelection && (
        <div className="pt-2 border-t">
          <div className="text-xs text-muted-foreground">
            Seçili Kategori
          </div>
          <div className="text-sm font-medium text-primary mt-1">
            {categoryPath.map(c => c.name).join(' → ') || 'Kategori seçili'}
          </div>
        </div>
      )}
    </div>
  )
}

