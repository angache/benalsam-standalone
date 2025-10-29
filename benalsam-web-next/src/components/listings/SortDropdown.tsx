/**
 * SortDropdown Component
 * Sorting options for listings
 */

'use client'

import { useFilterStore, SortBy } from '@/stores/filterStore'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ArrowUpDown } from 'lucide-react'

const SORT_OPTIONS: { value: SortBy; label: string }[] = [
  { value: 'newest', label: 'En Yeni' },
  { value: 'price_low', label: 'Fiyat (Düşük → Yüksek)' },
  { value: 'price_high', label: 'Fiyat (Yüksek → Düşük)' },
  { value: 'popular', label: 'En Popüler' },
  { value: 'relevant', label: 'En İlgili' },
]

export function SortDropdown() {
  const { sortBy, setSortBy } = useFilterStore()

  return (
    <div className="flex items-center gap-2">
      <ArrowUpDown className="w-4 h-4 text-muted-foreground" />
      <Select value={sortBy} onValueChange={(value: SortBy) => setSortBy(value)}>
        <SelectTrigger className="w-[200px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {SORT_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

