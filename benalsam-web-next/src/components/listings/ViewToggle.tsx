/**
 * ViewToggle Component
 * Toggle between different view modes (grid/list)
 */

'use client'

import { useFilterStore, ViewMode } from '@/stores/filterStore'
import { Button } from '@/components/ui/button'
import { Grid2x2, LayoutGrid, Grid3x3, List } from 'lucide-react'
import { cn } from '@/lib/utils'

const VIEW_OPTIONS: { value: ViewMode; icon: any; label: string }[] = [
  { value: 'grid-2', icon: Grid2x2, label: '2 Kolon' },
  { value: 'grid-3', icon: Grid3x3, label: '3 Kolon' },
  { value: 'grid-4', icon: LayoutGrid, label: '4 Kolon' },
  { value: 'list', icon: List, label: 'Liste' },
]

export function ViewToggle() {
  const { viewMode, setViewMode } = useFilterStore()

  return (
    <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
      {VIEW_OPTIONS.map((option) => {
        const Icon = option.icon
        return (
          <Button
            key={option.value}
            variant="ghost"
            size="sm"
            onClick={() => setViewMode(option.value)}
            className={cn(
              'h-8 w-8 p-0',
              viewMode === option.value && 'bg-background shadow-sm'
            )}
            title={option.label}
          >
            <Icon className="w-4 h-4" />
          </Button>
        )
      })}
    </div>
  )
}

