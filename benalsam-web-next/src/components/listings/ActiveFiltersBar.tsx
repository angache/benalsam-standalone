/**
 * ActiveFiltersBar Component
 * Display active filters as removable chips
 */

'use client'

import { useFilterStore } from '@/stores/filterStore'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'

export function ActiveFiltersBar() {
  const {
    searchQuery,
    categories,
    location,
    priceRange,
    urgency,
    condition,
    dateRange,
    showOnlyFeatured,
    showOnlyShowcase,
    showOnlyUrgent,
    categoryAttributes,
    removeFilter,
    resetFilters,
    getActiveFilterCount,
  } = useFilterStore()

  const activeCount = getActiveFilterCount()

  if (activeCount === 0) return null

  return (
    <div className="bg-card rounded-lg border p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Aktif Filtreler ({activeCount})</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={resetFilters}
          className="h-8 text-xs"
        >
          Tümünü Temizle
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {/* Search Query */}
        {searchQuery && (
          <Badge variant="secondary" className="gap-1">
            <span>Arama: {searchQuery}</span>
            <button
              onClick={() => removeFilter('searchQuery')}
              className="hover:bg-muted rounded-full p-0.5"
            >
              <X className="w-3 h-3" />
            </button>
          </Badge>
        )}

        {/* Categories */}
        {categories.length > 0 && (
          <Badge variant="secondary" className="gap-1">
            <span>Kategori: {categories.join(', ')}</span>
            <button
              onClick={() => removeFilter('categories')}
              className="hover:bg-muted rounded-full p-0.5"
            >
              <X className="w-3 h-3" />
            </button>
          </Badge>
        )}

        {/* Location */}
        {location.city && (
          <Badge variant="secondary" className="gap-1">
            <span>Şehir: {location.city}</span>
            <button
              onClick={() => removeFilter('location')}
              className="hover:bg-muted rounded-full p-0.5"
            >
              <X className="w-3 h-3" />
            </button>
          </Badge>
        )}

        {/* Price Range */}
        {(priceRange.min !== null || priceRange.max !== null) && (
          <Badge variant="secondary" className="gap-1">
            <span>
              Fiyat: {priceRange.min ? `${priceRange.min}₺` : '0₺'} - {priceRange.max ? `${priceRange.max}₺` : '∞'}
            </span>
            <button
              onClick={() => removeFilter('priceRange')}
              className="hover:bg-muted rounded-full p-0.5"
            >
              <X className="w-3 h-3" />
            </button>
          </Badge>
        )}

        {/* Urgency */}
        {urgency && (
          <Badge variant="secondary" className="gap-1">
            <span>Aciliyet: {urgency}</span>
            <button
              onClick={() => removeFilter('urgency')}
              className="hover:bg-muted rounded-full p-0.5"
            >
              <X className="w-3 h-3" />
            </button>
          </Badge>
        )}

        {/* Date Range */}
        {dateRange !== 'all' && (
          <Badge variant="secondary" className="gap-1">
            <span>
              Tarih: {
                dateRange === '24h' ? 'Son 24 Saat' :
                dateRange === '7d' ? 'Son 7 Gün' :
                'Son 30 Gün'
              }
            </span>
            <button
              onClick={() => removeFilter('dateRange')}
              className="hover:bg-muted rounded-full p-0.5"
            >
              <X className="w-3 h-3" />
            </button>
          </Badge>
        )}

        {/* Premium Filters */}
        {showOnlyFeatured && (
          <Badge variant="secondary" className="gap-1">
            <span>Öne Çıkan</span>
            <button
              onClick={() => removeFilter('featured')}
              className="hover:bg-muted rounded-full p-0.5"
            >
              <X className="w-3 h-3" />
            </button>
          </Badge>
        )}

        {showOnlyShowcase && (
          <Badge variant="secondary" className="gap-1">
            <span>Vitrin</span>
            <button
              onClick={() => removeFilter('showcase')}
              className="hover:bg-muted rounded-full p-0.5"
            >
              <X className="w-3 h-3" />
            </button>
          </Badge>
        )}

        {showOnlyUrgent && (
          <Badge variant="secondary" className="gap-1">
            <span>Acil Premium</span>
            <button
              onClick={() => removeFilter('urgent')}
              className="hover:bg-muted rounded-full p-0.5"
            >
              <X className="w-3 h-3" />
            </button>
          </Badge>
        )}

        {/* Category Attributes */}
        {Object.entries(categoryAttributes).map(([key, values]) => (
          values.length > 0 && (
            <Badge key={key} variant="secondary" className="gap-1">
              <span>{key}: {values.join(', ')}</span>
              <button
                onClick={() => removeFilter(`attr_${key}`)}
                className="hover:bg-muted rounded-full p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          )
        ))}
      </div>
    </div>
  )
}

