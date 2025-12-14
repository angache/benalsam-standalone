/**
 * HomepageListingsWithFilters Component
 * 
 * Combines filter bar and filtered listings for homepage
 * Provides a complete filtering experience
 */

'use client'

import { useState } from 'react'
import { HomepageFilterBar } from './HomepageFilterBar'
import FilteredListings from './FilteredListings'
import type { FilterState } from './FilterSidebar'

export function HomepageListingsWithFilters() {
  const [filters, setFilters] = useState<FilterState>({})

  const handleFiltersChange = (newFilters: FilterState) => {
    setFilters(newFilters)
  }

  const handleClearFilters = () => {
    setFilters({})
  }

  return (
    <section id="listings" className="scroll-mt-16">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Filter Bar */}
        <div className="mb-8">
          <HomepageFilterBar
            filters={filters}
            onFiltersChange={handleFiltersChange}
            onClearFilters={handleClearFilters}
          />
        </div>

        {/* Filtered Listings */}
        <FilteredListings
          filters={filters}
          onClearFilters={handleClearFilters}
        />
      </div>
    </section>
  )
}

