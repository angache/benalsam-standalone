/**
 * Homepage V2 - Modern Design
 * 
 * New modern homepage with hero, categories, quick actions, and featured listings
 * Access via: /v2
 */

'use client'

import { Suspense } from 'react'
import HeroSection from '@/components/home/HeroSection'
import PopularCategories from '@/components/home/PopularCategories'
import QuickActions from '@/components/home/QuickActions'
import FeatureCards from '@/components/home/FeatureCards'
import FeaturedListings from '@/components/home/FeaturedListings'
import SearchWithAI from '@/components/home/SearchWithAI'

export default function HomePageV2() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <Suspense fallback={<div className="h-96 bg-muted animate-pulse" />}>
        <HeroSection />
      </Suspense>

      {/* Search with AI Suggestions */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-10">
        <Suspense fallback={<div className="h-16 bg-muted animate-pulse rounded-lg" />}>
          <SearchWithAI />
        </Suspense>
      </section>

      {/* Quick Actions */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Suspense fallback={<div className="h-20 bg-muted animate-pulse rounded-lg" />}>
          <QuickActions />
        </Suspense>
      </section>

      {/* Popular Categories */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <PopularCategories />
      </section>

      {/* Feature Cards */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Suspense fallback={<div className="h-48 bg-muted animate-pulse rounded-lg" />}>
          <FeatureCards />
        </Suspense>
      </section>

      {/* Featured Listings */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <FeaturedListings />
      </section>
    </div>
  )
}

