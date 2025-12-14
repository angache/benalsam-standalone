/**
 * HomepageFilterBar Component
 * 
 * Compact filter bar for homepage listings
 * Provides quick access to common filters
 */

'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { SlidersHorizontal, X, Search } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { categoryService } from '@/services/categoryService'
import type { FilterState } from './FilterSidebar'
import { MobileFilterSheet } from './MobileFilterSheet'
import { cn } from '@/lib/utils'

interface HomepageFilterBarProps {
  filters: FilterState
  onFiltersChange: (filters: FilterState) => void
  onClearFilters: () => void
  /**
   * Show advanced filters button
   * @default true
   */
  showAdvanced?: boolean
  /**
   * Callback when advanced filters button is clicked
   */
  onAdvancedClick?: () => void
}

export function HomepageFilterBar({
  filters,
  onFiltersChange,
  onClearFilters,
  showAdvanced = true,
  onAdvancedClick,
}: HomepageFilterBarProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  // Fetch categories
  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoryService.getCategories(),
    staleTime: 5 * 60 * 1000,
  })

  const rootCategories = categories?.filter(cat => cat.level === 0 && cat.is_active) || []

  // Count active filters
  const activeFilterCount = Object.values(filters).filter(
    (value) => value !== null && value !== undefined && value !== ''
  ).length

  const hasActiveFilters = activeFilterCount > 0

  const handleFilterChange = (key: keyof FilterState, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    })
  }

  return (
    <div className="w-full space-y-4">
      {/* Desktop Filter Bar */}
      <div className="hidden md:flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="İlan ara..."
            value={filters.searchQuery || ''}
            onChange={(e) => handleFilterChange('searchQuery', e.target.value || null)}
            className="pl-10"
            aria-label="İlan ara"
          />
        </div>

        {/* Category Select */}
        <Select
          value={filters.categoryId?.toString() || 'all'}
          onValueChange={(value) =>
            handleFilterChange('categoryId', value === 'all' ? null : parseInt(value))
          }
        >
          <SelectTrigger className="w-full sm:w-[200px]" aria-label="Kategori seç">
            <SelectValue placeholder="Kategori" />
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

        {/* Location Input */}
        <Input
          type="text"
          placeholder="Konum"
          value={filters.location || ''}
          onChange={(e) => handleFilterChange('location', e.target.value || null)}
          className="w-full sm:w-[180px]"
          aria-label="Konum filtrele"
        />

        {/* Advanced Filters Button */}
        {showAdvanced && (
          <Button
            variant="outline"
            onClick={() => {
              setIsExpanded(!isExpanded)
              onAdvancedClick?.()
            }}
            className="flex items-center gap-2"
            aria-label="Gelişmiş filtreler"
            aria-expanded={isExpanded}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span className="hidden sm:inline">Filtreler</span>
            {hasActiveFilters && (
              <span className="ml-1 px-1.5 py-0.5 text-xs bg-primary text-primary-foreground rounded-full">
                {activeFilterCount}
              </span>
            )}
          </Button>
        )}

        {/* Clear Filters Button */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            className="flex items-center gap-2"
            aria-label="Filtreleri temizle"
          >
            <X className="w-4 h-4" />
            <span className="hidden sm:inline">Temizle</span>
          </Button>
        )}
      </div>

      {/* Mobile Filter Bar */}
      <div className="md:hidden flex gap-2 items-center">
        {/* Search Input - Mobile */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="İlan ara..."
            value={filters.searchQuery || ''}
            onChange={(e) => handleFilterChange('searchQuery', e.target.value || null)}
            className="pl-10"
            aria-label="İlan ara"
          />
        </div>

        {/* Mobile Filter Sheet */}
        <MobileFilterSheet
          filters={filters}
          onFiltersChange={onFiltersChange}
          onClearFilters={onClearFilters}
          activeFilterCount={activeFilterCount}
        />
      </div>

      {/* Expanded Advanced Filters */}
      {isExpanded && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-muted/50 rounded-lg border">
          {/* Price Range */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Min Bütçe</label>
            <Input
              type="number"
              placeholder="Min"
              value={filters.minPrice || ''}
              onChange={(e) =>
                handleFilterChange('minPrice', e.target.value ? parseInt(e.target.value) : null)
              }
              aria-label="Minimum bütçe"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Max Bütçe</label>
            <Input
              type="number"
              placeholder="Max"
              value={filters.maxPrice || ''}
              onChange={(e) =>
                handleFilterChange('maxPrice', e.target.value ? parseInt(e.target.value) : null)
              }
              aria-label="Maksimum bütçe"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Acil Durum</label>
            <Select
              value={filters.urgency || 'all'}
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
      )}
    </div>
  )
}

