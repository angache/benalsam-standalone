/**
 * MobileFilterSheet Component
 * 
 * Mobile-optimized filter sheet with bottom sheet UI
 * Provides full filter interface for mobile devices
 */

'use client'

import * as React from 'react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  BottomSheet,
  BottomSheetContent,
  BottomSheetHeader,
  BottomSheetTitle,
  BottomSheetTrigger,
} from '@/components/ui/bottom-sheet'
import { SlidersHorizontal, X, Check } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { categoryService } from '@/services/categoryService'
import type { FilterState } from './FilterSidebar'

interface MobileFilterSheetProps {
  filters: FilterState
  onFiltersChange: (filters: FilterState) => void
  onClearFilters: () => void
  /**
   * Active filter count for badge
   */
  activeFilterCount: number
}

export function MobileFilterSheet({
  filters,
  onFiltersChange,
  onClearFilters,
  activeFilterCount,
}: MobileFilterSheetProps) {
  const [localFilters, setLocalFilters] = useState<FilterState>(filters)
  const [isOpen, setIsOpen] = useState(false)

  // Fetch categories
  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoryService.getCategories(),
    staleTime: 5 * 60 * 1000,
  })

  const rootCategories = categories?.filter(cat => cat.level === 0 && cat.is_active) || []

  const handleFilterChange = (key: keyof FilterState, value: any) => {
    const newFilters = { ...localFilters, [key]: value }
    setLocalFilters(newFilters)
  }

  const handleApply = () => {
    onFiltersChange(localFilters)
    setIsOpen(false)
  }

  const handleReset = () => {
    setLocalFilters({})
    onClearFilters()
  }

  // Sync local filters when prop changes
  React.useEffect(() => {
    setLocalFilters(filters)
  }, [filters])

  const hasChanges = JSON.stringify(localFilters) !== JSON.stringify(filters)

  return (
    <BottomSheet open={isOpen} onOpenChange={setIsOpen}>
      <BottomSheetTrigger asChild>
        <Button
          variant="outline"
          className="flex items-center gap-2 md:hidden"
          aria-label="Filtreler"
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span>Filtreler</span>
          {activeFilterCount > 0 && (
            <span className="ml-1 px-1.5 py-0.5 text-xs bg-primary text-primary-foreground rounded-full">
              {activeFilterCount}
            </span>
          )}
        </Button>
      </BottomSheetTrigger>
      
      <BottomSheetContent swipeable className="max-h-[90vh] overflow-y-auto">
        <BottomSheetHeader>
          <BottomSheetTitle>Filtreler</BottomSheetTitle>
        </BottomSheetHeader>

        <div className="mt-6 space-y-6">
          {/* Search */}
          <div className="space-y-2">
            <Label htmlFor="mobile-search">Ara</Label>
            <Input
              id="mobile-search"
              type="text"
              placeholder="İlan ara..."
              value={localFilters.searchQuery || ''}
              onChange={(e) => handleFilterChange('searchQuery', e.target.value || null)}
              aria-label="İlan ara"
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label>Kategori</Label>
            <Select
              value={localFilters.categoryId?.toString() || 'all'}
              onValueChange={(value) =>
                handleFilterChange('categoryId', value === 'all' ? null : parseInt(value))
              }
            >
              <SelectTrigger aria-label="Kategori seç">
                <SelectValue placeholder="Kategori seç" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Kategoriler</SelectItem>
                {rootCategories.map((category) => (
                  <SelectItem key={category.id} value={category.id.toString()}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="mobile-location">Konum</Label>
            <Input
              id="mobile-location"
              type="text"
              placeholder="Konum"
              value={localFilters.location || ''}
              onChange={(e) => handleFilterChange('location', e.target.value || null)}
              aria-label="Konum filtrele"
            />
          </div>

          {/* Price Range */}
          <div className="space-y-4">
            <Label>Bütçe Aralığı</Label>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="mobile-min-price" className="text-sm">Min</Label>
                <Input
                  id="mobile-min-price"
                  type="number"
                  placeholder="Min"
                  value={localFilters.minPrice || ''}
                  onChange={(e) =>
                    handleFilterChange('minPrice', e.target.value ? parseInt(e.target.value) : null)
                  }
                  aria-label="Minimum bütçe"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mobile-max-price" className="text-sm">Max</Label>
                <Input
                  id="mobile-max-price"
                  type="number"
                  placeholder="Max"
                  value={localFilters.maxPrice || ''}
                  onChange={(e) =>
                    handleFilterChange('maxPrice', e.target.value ? parseInt(e.target.value) : null)
                  }
                  aria-label="Maksimum bütçe"
                />
              </div>
            </div>
          </div>

          {/* Urgency */}
          <div className="space-y-2">
            <Label>Acil Durum</Label>
            <Select
              value={localFilters.urgency || 'all'}
              onValueChange={(value) =>
                handleFilterChange('urgency', value === 'all' ? null : value)
              }
            >
              <SelectTrigger aria-label="Acil durum filtrele">
                <SelectValue placeholder="Acil Durum" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tümü</SelectItem>
                <SelectItem value="very_urgent">Çok Acil</SelectItem>
                <SelectItem value="urgent">Acil</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex gap-3 sticky bottom-0 bg-background pt-4 pb-2 border-t">
          <Button
            variant="outline"
            onClick={handleReset}
            className="flex-1"
            aria-label="Filtreleri sıfırla"
          >
            <X className="w-4 h-4 mr-2" />
            Sıfırla
          </Button>
          <Button
            onClick={handleApply}
            className="flex-1"
            disabled={!hasChanges}
            aria-label="Filtreleri uygula"
          >
            <Check className="w-4 h-4 mr-2" />
            Uygula
          </Button>
        </div>
      </BottomSheetContent>
    </BottomSheet>
  )
}

