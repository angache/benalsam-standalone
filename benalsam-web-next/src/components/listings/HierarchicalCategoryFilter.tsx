/**
 * Hierarchical Category Filter Component
 * Cascading category selection with parent → child navigation
 */

'use client'

import { useState, useEffect } from 'react'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ChevronRight } from 'lucide-react'
import { useCategories } from '@/hooks/useCategories'

interface Category {
  id: number | string
  name: string
  parent_id?: number | string | null
  level: number
  children?: Category[]
}

interface HierarchicalCategoryFilterProps {
  selectedCategories: number[]
  onCategoryChange: (categoryIds: number[]) => void
}

export function HierarchicalCategoryFilter({
  selectedCategories,
  onCategoryChange,
}: HierarchicalCategoryFilterProps) {
  const { categories: allCategories } = useCategories()
  
  // Build category hierarchy
  const [categoryLevels, setCategoryLevels] = useState<Category[][]>([])
  const [selectedAtLevel, setSelectedAtLevel] = useState<(number | null)[]>([])

  useEffect(() => {
    if (!allCategories || allCategories.length === 0) return

    // Get root categories (level 0)
    const rootCategories = allCategories.filter(cat => !cat.parent_id && cat.level === 0)
    setCategoryLevels([rootCategories])

    // If there's a selected category, reconstruct the path
    if (selectedCategories.length > 0) {
      const selectedId = selectedCategories[0]
      const path = buildCategoryPath(selectedId, allCategories)
      setSelectedAtLevel(path)
      
      // Build levels based on path
      const levels: Category[][] = [rootCategories]
      path.forEach((categoryId, index) => {
        if (categoryId !== null) {
          const children = allCategories.filter(cat => cat.parent_id === categoryId)
          if (children.length > 0) {
            levels[index + 1] = children
          }
        }
      })
      setCategoryLevels(levels)
    }
  }, [allCategories, selectedCategories])

  // Build path from selected category to root
  const buildCategoryPath = (categoryId: number, categories: Category[]): (number | null)[] => {
    const path: number[] = []
    let currentId: number | null = categoryId
    
    while (currentId !== null) {
      const category = categories.find(c => Number(c.id) === currentId)
      if (!category) break
      
      path.unshift(currentId)
      currentId = category.parent_id ? Number(category.parent_id) : null
    }
    
    return path
  }

  // Handle selection at a specific level
  const handleLevelChange = (level: number, value: string) => {
    if (value === 'all') {
      // Clear selection from this level onwards
      const newSelected = selectedAtLevel.slice(0, level)
      setSelectedAtLevel(newSelected)
      setCategoryLevels(categoryLevels.slice(0, level + 1))
      
      // Notify parent with the last valid selection
      const lastValidId = newSelected[newSelected.length - 1]
      onCategoryChange(lastValidId ? [Number(lastValidId)] : [])
      return
    }

    const categoryId = parseInt(value)
    const newSelected = [...selectedAtLevel.slice(0, level), categoryId]
    setSelectedAtLevel(newSelected)

    // Get children of selected category
    const children = allCategories.filter(cat => cat.parent_id === categoryId)
    
    if (children.length > 0) {
      // Has children, show next level
      const newLevels = [...categoryLevels.slice(0, level + 1), children]
      setCategoryLevels(newLevels)
    } else {
      // Leaf node, remove deeper levels
      setCategoryLevels(categoryLevels.slice(0, level + 1))
    }

    // Notify parent
    onCategoryChange([categoryId])
  }

  const getLevelLabel = (level: number): string => {
    const labels = ['Ana Kategori', 'Alt Kategori', 'Detay Kategori', 'Kategori']
    return labels[level] || `Seviye ${level + 1}`
  }

  return (
    <div className="space-y-3">
      <Label className="flex items-center gap-2">
        <span>Kategori</span>
        {selectedAtLevel.length > 0 && (
          <span className="text-xs text-muted-foreground">
            ({selectedAtLevel.length} seviye seçili)
          </span>
        )}
      </Label>

      {categoryLevels.map((levelCategories, levelIndex) => (
        <div key={levelIndex} className="space-y-1">
          <div className="flex items-center gap-2">
            {levelIndex > 0 && (
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            )}
            <Label className="text-xs text-muted-foreground">
              {getLevelLabel(levelIndex)}
            </Label>
          </div>
          
          <Select
            value={selectedAtLevel[levelIndex]?.toString() || 'all'}
            onValueChange={(value) => handleLevelChange(levelIndex, value)}
          >
            <SelectTrigger className={levelIndex > 0 ? 'ml-6' : ''}>
              <SelectValue placeholder={`${getLevelLabel(levelIndex)} Seçin`} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                Tüm {getLevelLabel(levelIndex)}ler
              </SelectItem>
              {levelCategories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id.toString()}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ))}

      {selectedAtLevel.length > 0 && (
        <button
          onClick={() => {
            setSelectedAtLevel([])
            setCategoryLevels([allCategories.filter(cat => !cat.parent_id && cat.level === 0)])
            onCategoryChange([])
          }}
          className="text-xs text-primary hover:underline"
        >
          Kategori seçimini temizle
        </button>
      )}
    </div>
  )
}

