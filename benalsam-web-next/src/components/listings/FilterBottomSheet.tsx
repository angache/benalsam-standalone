/**
 * FilterBottomSheet Component
 * Mobile filter drawer using Sheet component
 */

'use client'

import { useFilterStore } from '@/stores/filterStore'
import { FilterSidebar } from './FilterSidebar'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { SlidersHorizontal } from 'lucide-react'

export function FilterBottomSheet() {
  const activeFilterCount = useFilterStore((state) => state.getActiveFilterCount())

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" className="relative">
          <SlidersHorizontal className="w-4 h-4 mr-2" />
          Filtrele
          {activeFilterCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs w-5 h-5 rounded-full flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[85vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Filtreler</SheetTitle>
        </SheetHeader>
        <div className="mt-6">
          <FilterSidebar />
        </div>
      </SheetContent>
    </Sheet>
  )
}

