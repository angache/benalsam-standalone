/**
 * FilterSidebar Component
 * Advanced filtering sidebar for /ilanlar page
 */

'use client'

import { useFilterStore } from '@/stores/filterStore'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Slider } from '@/components/ui/slider'
import { X } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useCategories } from '@/hooks/useCategories'

// Turkish cities for location filter
const CITIES = [
  'İstanbul', 'Ankara', 'İzmir', 'Bursa', 'Antalya', 'Adana', 
  'Konya', 'Gaziantep', 'Şanlıurfa', 'Kocaeli', 'Mersin', 'Diyarbakır'
]

export function FilterSidebar() {
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
    setSearchQuery,
    setCategories,
    setLocation,
    setPriceRange,
    setUrgency,
    setCondition,
    setDateRange,
    setShowOnlyFeatured,
    setShowOnlyShowcase,
    setShowOnlyUrgent,
    resetFilters,
  } = useFilterStore()

  const { categories: availableCategories } = useCategories()
  const [priceMin, setPriceMin] = useState(priceRange.min?.toString() || '')
  const [priceMax, setPriceMax] = useState(priceRange.max?.toString() || '')

  // Debounce price inputs
  useEffect(() => {
    const timer = setTimeout(() => {
      setPriceRange({
        min: priceMin ? parseFloat(priceMin) : null,
        max: priceMax ? parseFloat(priceMax) : null,
      })
    }, 500)
    return () => clearTimeout(timer)
  }, [priceMin, priceMax])

  return (
    <div className="space-y-6">
      {/* Search Query */}
      <div className="space-y-2">
        <Label>Arama</Label>
        <div className="relative">
          <Input
            type="text"
            placeholder="İlan ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Category */}
      <div className="space-y-2">
        <Label>Kategori</Label>
        <Select
          value={categories[0]?.toString() || 'all'}
          onValueChange={(value) => setCategories(value === 'all' ? [] : [parseInt(value)])}
        >
          <SelectTrigger>
            <SelectValue placeholder="Tüm Kategoriler" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tüm Kategoriler</SelectItem>
            {availableCategories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id.toString()}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Location */}
      <div className="space-y-2">
        <Label>Şehir</Label>
        <Select
          value={location.city || 'all'}
          onValueChange={(value) => setLocation({ city: value === 'all' ? undefined : value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Tüm Şehirler" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tüm Şehirler</SelectItem>
            {CITIES.map((city) => (
              <SelectItem key={city} value={city}>
                {city}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Price Range */}
      <div className="space-y-2">
        <Label>Fiyat Aralığı</Label>
        <div className="grid grid-cols-2 gap-2">
          <Input
            type="number"
            placeholder="Min"
            value={priceMin}
            onChange={(e) => setPriceMin(e.target.value)}
          />
          <Input
            type="number"
            placeholder="Max"
            value={priceMax}
            onChange={(e) => setPriceMax(e.target.value)}
          />
        </div>
      </div>

      {/* Urgency */}
      <div className="space-y-2">
        <Label>Aciliyet</Label>
        <Select
          value={urgency || 'all'}
          onValueChange={(value) => setUrgency(value === 'all' ? null : value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Tümü" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tümü</SelectItem>
            <SelectItem value="normal">Normal</SelectItem>
            <SelectItem value="urgent">Acil</SelectItem>
            <SelectItem value="very_urgent">Çok Acil</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Date Range */}
      <div className="space-y-2">
        <Label>İlan Tarihi</Label>
        <Select
          value={dateRange}
          onValueChange={(value: any) => setDateRange(value)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tümü</SelectItem>
            <SelectItem value="24h">Son 24 Saat</SelectItem>
            <SelectItem value="7d">Son 7 Gün</SelectItem>
            <SelectItem value="30d">Son 30 Gün</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Premium Filters */}
      <div className="space-y-3 pt-4 border-t">
        <Label>Premium İlanlar</Label>
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="featured"
              checked={showOnlyFeatured}
              onCheckedChange={(checked) => setShowOnlyFeatured(!!checked)}
            />
            <label htmlFor="featured" className="text-sm cursor-pointer">
              Öne Çıkan İlanlar
            </label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="showcase"
              checked={showOnlyShowcase}
              onCheckedChange={(checked) => setShowOnlyShowcase(!!checked)}
            />
            <label htmlFor="showcase" className="text-sm cursor-pointer">
              Vitrinde
            </label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="urgent"
              checked={showOnlyUrgent}
              onCheckedChange={(checked) => setShowOnlyUrgent(!!checked)}
            />
            <label htmlFor="urgent" className="text-sm cursor-pointer">
              Acil Premium
            </label>
          </div>
        </div>
      </div>

      {/* Reset Button */}
      <Button
        variant="outline"
        onClick={resetFilters}
        className="w-full"
      >
        <X className="w-4 h-4 mr-2" />
        Filtreleri Temizle
      </Button>
    </div>
  )
}

