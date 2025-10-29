/**
 * Homepage V2 - Full Featured & Modern
 * 
 * Rich, engaging homepage with:
 * - Enhanced hero with trending keywords
 * - Trust badges
 * - Today's listings
 * - Popular categories
 * - Featured listings
 * - How it works
 * - Testimonials
 * - Live stats
 * - AI recommendations
 * - CTA to advanced search
 * 
 * Old version: page-v1-backup.tsx
 */

'use client'

import { Suspense } from 'react'
import Link from 'next/link'
import { TrendingUp, Sparkles, Grid3x3 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

// Components
import PopularCategories from '@/components/home/PopularCategories'
import { PopularListings } from '@/components/home/PopularListings'
import { AIRecommendations } from '@/components/home/AIRecommendations'
import { RecentlyViewed } from '@/components/home/RecentlyViewed'
import { ScrollToTop } from '@/components/ScrollToTop'
import TrustBadges from '@/components/home/TrustBadges'
import TrendingKeywords from '@/components/home/TrendingKeywords'
import TodaysListings from '@/components/home/TodaysListings'
import HowItWorks from '@/components/home/HowItWorks'
import Testimonials from '@/components/home/Testimonials'
import LiveStats from '@/components/home/LiveStats'
import FlashDeals from '@/components/home/FlashDeals'
import LiveActivityTicker from '@/components/home/LiveActivityTicker'
import PopularInYourCity from '@/components/home/PopularInYourCity'
import SmartSearchBox from '@/components/home/SmartSearchBox'
import PersonalizedSection from '@/components/home/PersonalizedSection'
import AppDownloadBanner from '@/components/home/AppDownloadBanner'
import BlogSection from '@/components/home/BlogSection'
import ScrollProgress from '@/components/ScrollProgress'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Scroll Progress */}
      <ScrollProgress />

      {/* Hero Section - Enhanced */}
      <section className="relative bg-gradient-to-br from-primary/10 via-primary/5 to-background py-16 sm:py-24">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-6">
            {/* Main Heading */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight">
              Aradığın Her Şey
              <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                {" "}Burada
              </span>
            </h1>
            
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
              Binlerce ilan arasından kolayca arama yap, fırsatları kaçırma
            </p>

            {/* Smart Search Box with Autocomplete */}
            <div className="mt-8">
              <SmartSearchBox />

              {/* Trending Keywords */}
              <div className="mt-6">
                <TrendingKeywords />
              </div>
            </div>

            {/* Quick Stats */}
            <div className="flex items-center justify-center gap-8 text-sm text-muted-foreground pt-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                <span>2,500+ Aktif İlan</span>
              </div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                <span>50+ Kategori</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Badges */}
      <TrustBadges />

      {/* Live Stats */}
      <LiveStats />

      {/* Live Activity Ticker */}
      <LiveActivityTicker />

      {/* Personalized Section (logged-in users only) */}
      <PersonalizedSection />

      {/* Flash Deals */}
      <Suspense fallback={<ListingsSkeleton title="Acil İlanlar" />}>
        <FlashDeals />
      </Suspense>

      {/* Today's Listings */}
      <Suspense fallback={<ListingsSkeleton title="Bugün Eklenenler" />}>
        <TodaysListings />
      </Suspense>

      {/* Popular Categories */}
      <section className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-2">Popüler Kategoriler</h2>
          <p className="text-muted-foreground">Hızlı erişim için kategoriye göz atın</p>
        </div>
        <Suspense fallback={<div className="h-64 bg-muted animate-pulse rounded-lg" />}>
          <PopularCategories />
        </Suspense>
      </section>

      {/* Featured Listings Carousel */}
      <section className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Suspense fallback={<div className="h-96 bg-muted animate-pulse rounded-lg" />}>
          <PopularListings />
        </Suspense>
      </section>

      {/* Recently Viewed */}
      <RecentlyViewed />

      {/* AI Recommendations */}
      <section className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Suspense fallback={<div className="h-96 bg-muted animate-pulse rounded-lg" />}>
          <AIRecommendations />
        </Suspense>
      </section>

      {/* Popular in Your City */}
      <Suspense fallback={<ListingsSkeleton title="Şehrinde Popüler" />}>
        <PopularInYourCity />
      </Suspense>

      {/* How It Works */}
      <HowItWorks />

      {/* App Download Banner */}
      <AppDownloadBanner />

      {/* Testimonials */}
      <Testimonials />

      {/* Blog Section */}
      <BlogSection />

      {/* CTA Section - Go to Advanced Search */}
      <section className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl p-8 sm:p-12 text-center">
          <Grid3x3 className="w-16 h-16 mx-auto mb-6 text-primary" />
          <h2 className="text-3xl font-bold mb-4">
            Daha Fazla İlan Keşfet
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Gelişmiş filtreler, sıralama seçenekleri ve binlerce ilan arasından tam olarak aradığınızı bulun
          </p>
          <Link href="/ilanlar">
            <Button size="lg" className="text-lg px-8 py-6">
              <Grid3x3 className="w-5 h-5 mr-2" />
              Tüm İlanları Gör
            </Button>
          </Link>
        </div>
      </section>

      {/* Scroll to Top */}
      <ScrollToTop />
    </div>
  )
}

// Loading Skeleton Component
function ListingsSkeleton({ title }: { title: string }) {
  return (
    <section className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex items-center justify-between mb-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-32" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-64 rounded-lg" />
        ))}
      </div>
    </section>
  )
}
