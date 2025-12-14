/**
 * ListingsTabs Component
 * 
 * Tab navigation for different listing views:
 * - Öne Çıkanlar (Featured)
 * - Yeni İlanlar (Today's)
 * - Popüler (Popular)
 */

'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import FlashDeals from '@/components/home/FlashDeals'
import TodaysListings from '@/components/home/TodaysListings'
import { PopularListings } from '@/components/home/PopularListings'
import { HomepageSection } from '@/components/home/HomepageErrorBoundary'
import { LazySection } from '@/components/home/LazySection'
import { Sparkles, TrendingUp, Zap } from 'lucide-react'
import type { Listing } from '@/types'

interface ListingsTabsProps {
  flashDeals?: Listing[]
  todaysListings?: Listing[]
  popularListings?: Listing[]
  isLoading?: boolean
}

export function ListingsTabs({
  flashDeals = [],
  todaysListings = [],
  popularListings = [],
  isLoading = false,
}: ListingsTabsProps) {
  const [activeTab, setActiveTab] = useState('featured')

  return (
    <HomepageSection componentName="İlanlar">
      <section className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-3xl font-bold mb-2">İlanlar</h2>
              <p className="text-muted-foreground">
                Binlerce ilan arasından aradığınızı bulun
              </p>
            </div>
          </div>

          <TabsList 
            className="grid w-full max-w-md grid-cols-3 mb-8"
            role="tablist"
            aria-label="İlan görünüm seçenekleri"
          >
            <TabsTrigger 
              value="featured" 
              className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              aria-label="Öne çıkan ilanları göster"
            >
              <Zap className="w-4 h-4" aria-hidden="true" />
              <span className="hidden sm:inline">Öne Çıkanlar</span>
              <span className="sm:hidden">Öne Çıkan</span>
            </TabsTrigger>
            <TabsTrigger 
              value="new" 
              className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              aria-label="Yeni eklenen ilanları göster"
            >
              <Sparkles className="w-4 h-4" aria-hidden="true" />
              <span className="hidden sm:inline">Yeni İlanlar</span>
              <span className="sm:hidden">Yeni</span>
            </TabsTrigger>
            <TabsTrigger 
              value="popular" 
              className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              aria-label="Popüler ilanları göster"
            >
              <TrendingUp className="w-4 h-4" aria-hidden="true" />
              <span className="hidden sm:inline">Popüler</span>
              <span className="sm:hidden">Popüler</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent 
            value="featured" 
            className="mt-0"
            role="tabpanel"
            aria-labelledby="tab-featured"
            id="tabpanel-featured"
          >
            <LazySection
              fallback={<ListingsSkeleton title="Öne Çıkanlar" />}
              rootMargin="200px"
              minHeight="400px"
            >
              <FlashDeals listings={flashDeals} isLoading={isLoading} />
            </LazySection>
          </TabsContent>

          <TabsContent 
            value="new" 
            className="mt-0"
            role="tabpanel"
            aria-labelledby="tab-new"
            id="tabpanel-new"
          >
            <LazySection
              fallback={<ListingsSkeleton title="Yeni İlanlar" />}
              rootMargin="200px"
              minHeight="400px"
            >
              <TodaysListings listings={todaysListings} isLoading={isLoading} />
            </LazySection>
          </TabsContent>

          <TabsContent 
            value="popular" 
            className="mt-0"
            role="tabpanel"
            aria-labelledby="tab-popular"
            id="tabpanel-popular"
          >
            <LazySection
              fallback={<ListingsSkeleton title="Popüler İlanlar" />}
              rootMargin="200px"
              minHeight="400px"
            >
              <PopularListings listings={popularListings} isLoading={isLoading} />
            </LazySection>
          </TabsContent>
        </Tabs>
      </section>
    </HomepageSection>
  )
}

// Loading Skeleton Component
function ListingsSkeleton({ title }: { title: string }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="h-8 w-48 bg-muted animate-pulse rounded" />
        <div className="h-10 w-32 bg-muted animate-pulse rounded" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-64 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    </div>
  )
}

