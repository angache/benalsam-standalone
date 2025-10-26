/**
 * Filter Sidebar Component
 * 
 * Comprehensive filtering interface for listings
 */

'use client'

import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Separator } from '@/components/ui/separator'
import { X, SlidersHorizontal, Search } from 'lucide-react'

export interface FilterState {
  categoryId?: number | null
  minPrice?: number | null
  maxPrice?: number | null
  location?: string | null
  urgency?: string | null
  sortBy?: string | null
  searchQuery?: string | null
}

interface FilterSidebarProps {
  filters: FilterState
  onFiltersChange: (filters: FilterState) => void
  onReset: () => void
}

export default function FilterSidebar({ 
  filters, 
  onFiltersChange, 
  onReset 
}: FilterSidebarProps) {
  const [localFilters, setLocalFilters] = useState<FilterState>(filters)

  // Sync with parent when filters prop changes
  useEffect(() => {
    setLocalFilters(filters)
  }, [filters])

  // Fetch categories
  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name, parent_id')
        .order('name')
      
      if (error) throw error
      return data || []
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  // Get root categories (parent_id is null)
  const rootCategories = categories?.filter(cat => !cat.parent_id) || []

  const handleFilterChange = (key: keyof FilterState, value: any) => {
    const newFilters = { ...localFilters, [key]: value }
    setLocalFilters(newFilters)
    onFiltersChange(newFilters)
  }

  const handleReset = () => {
    const emptyFilters: FilterState = {
      categoryId: null,
      minPrice: null,
      maxPrice: null,
      location: null,
      urgency: null,
      sortBy: null,
      searchQuery: null,
    }
    setLocalFilters(emptyFilters)
    onReset()
  }

  const hasActiveFilters = Object.values(localFilters).some(v => v !== null && v !== undefined)

  return (
    <div className="w-full h-fit bg-card border border-border rounded-lg p-6 sticky top-20">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold text-foreground">Filtreler</h3>
        </div>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4 mr-1" />
            Temizle
          </Button>
        )}
      </div>

      <div className="space-y-6">
        {/* Search Box */}
        <div>
          <Label htmlFor="search" className="text-sm font-medium mb-2 block">
            Ara
          </Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="search"
              type="text"
              placeholder="İlan ara..."
              value={localFilters.searchQuery || ''}
              onChange={(e) => handleFilterChange('searchQuery', e.target.value || null)}
              className="pl-10"
            />
          </div>
        </div>

        <Separator />

        {/* Sort Dropdown */}
        <div>
          <Label className="text-sm font-medium mb-3 block">
            Sıralama
          </Label>
          <div className="space-y-2">
            <button
              onClick={() => handleFilterChange('sortBy', null)}
              className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                !localFilters.sortBy
                  ? 'bg-primary text-primary-foreground font-medium'
                  : 'hover:bg-muted'
              }`}
            >
              Varsayılan
            </button>
            <button
              onClick={() => handleFilterChange('sortBy', 'newest')}
              className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                localFilters.sortBy === 'newest'
                  ? 'bg-primary text-primary-foreground font-medium'
                  : 'hover:bg-muted'
              }`}
            >
              En Yeni
            </button>
            <button
              onClick={() => handleFilterChange('sortBy', 'cheapest')}
              className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                localFilters.sortBy === 'cheapest'
                  ? 'bg-primary text-primary-foreground font-medium'
                  : 'hover:bg-muted'
              }`}
            >
              En Ucuz
            </button>
            <button
              onClick={() => handleFilterChange('sortBy', 'expensive')}
              className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                localFilters.sortBy === 'expensive'
                  ? 'bg-primary text-primary-foreground font-medium'
                  : 'hover:bg-muted'
              }`}
            >
              En Pahalı
            </button>
            <button
              onClick={() => handleFilterChange('sortBy', 'popular')}
              className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                localFilters.sortBy === 'popular'
                  ? 'bg-primary text-primary-foreground font-medium'
                  : 'hover:bg-muted'
              }`}
            >
              En Popüler
            </button>
          </div>
        </div>

        <Separator />

        {/* Category Filter */}
        <div>
          <Label className="text-sm font-medium mb-3 block">
            Kategori
          </Label>
          <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
            <button
              onClick={() => handleFilterChange('categoryId', null)}
              className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                !localFilters.categoryId
                  ? 'bg-primary text-primary-foreground font-medium'
                  : 'hover:bg-muted'
              }`}
            >
              Tüm Kategoriler
            </button>
            {rootCategories.map((category) => (
              <button
                key={category.id}
                onClick={() => handleFilterChange('categoryId', category.id)}
                className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                  localFilters.categoryId === category.id
                    ? 'bg-primary text-primary-foreground font-medium'
                    : 'hover:bg-muted'
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>

        <Separator />

        {/* Price Range Filter */}
        <div>
          <Label className="text-sm font-medium mb-2 block">
            Bütçe Aralığı
          </Label>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Input
                type="number"
                placeholder="Min ₺"
                value={localFilters.minPrice || ''}
                onChange={(e) => 
                  handleFilterChange('minPrice', e.target.value ? parseFloat(e.target.value) : null)
                }
                className="h-9"
              />
            </div>
            <div>
              <Input
                type="number"
                placeholder="Max ₺"
                value={localFilters.maxPrice || ''}
                onChange={(e) => 
                  handleFilterChange('maxPrice', e.target.value ? parseFloat(e.target.value) : null)
                }
                className="h-9"
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Location Filter */}
        <div>
          <Label className="text-sm font-medium mb-3 block">
            Konum
          </Label>
          <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
            <button
              onClick={() => handleFilterChange('location', null)}
              className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                !localFilters.location
                  ? 'bg-primary text-primary-foreground font-medium'
                  : 'hover:bg-muted'
              }`}
            >
              Tüm Konumlar
            </button>
            {['İstanbul', 'Ankara', 'İzmir', 'Bursa', 'Antalya', 'Adana', 'Konya', 'Gaziantep', 'Şanlıurfa', 'Kocaeli'].map((city) => (
              <button
                key={city}
                onClick={() => handleFilterChange('location', city)}
                className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                  localFilters.location === city
                    ? 'bg-primary text-primary-foreground font-medium'
                    : 'hover:bg-muted'
                }`}
              >
                {city}
              </button>
            ))}
          </div>
        </div>

        <Separator />

        {/* Urgency Filter */}
        <div>
          <Label className="text-sm font-medium mb-3 block">
            Aciliyet
          </Label>
          <RadioGroup
            value={localFilters.urgency || 'all'}
            onValueChange={(value) => 
              handleFilterChange('urgency', value === 'all' ? null : value)
            }
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="all" id="urgency-all" />
              <Label htmlFor="urgency-all" className="font-normal cursor-pointer">
                Tümü
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="Acil" id="urgency-urgent" />
              <Label htmlFor="urgency-urgent" className="font-normal cursor-pointer">
                Acil
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="Normal" id="urgency-normal" />
              <Label htmlFor="urgency-normal" className="font-normal cursor-pointer">
                Normal
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="Acil Değil" id="urgency-not-urgent" />
              <Label htmlFor="urgency-not-urgent" className="font-normal cursor-pointer">
                Acil Değil
              </Label>
            </div>
          </RadioGroup>
        </div>

        <Separator />

        {/* Apply Button (Mobile) */}
        <Button
          className="w-full md:hidden"
          onClick={() => onFiltersChange(localFilters)}
        >
          Filtreleri Uygula
        </Button>
      </div>
    </div>
  )
}

