/**
 * HomePageClient - Client Component
 * 
 * Handles all client-side interactivity
 * Separated from server component for better SEO
 */

'use client'

import { Suspense, lazy } from 'react'
import Link from 'next/link'
import { TrendingUp, Sparkles, Grid3x3 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

// Critical components - load immediately
import PopularCategories from '@/components/home/PopularCategories'
import SmartSearchBox from '@/components/home/SmartSearchBox'
import { ScrollToTop } from '@/components/ScrollToTop'
import { LazySection } from '@/components/home/LazySection'
import { CriticalResources } from '@/components/home/CriticalResources'
import { HomepageSection } from '@/components/home/HomepageErrorBoundary'
import { HomepageListingsWithFilters } from '@/components/home/HomepageListingsWithFilters'
import { useHomePageData } from '@/hooks/useHomePageData'
import { useBackgroundRefetch } from '@/hooks/useBackgroundRefetch'

// Lazy load heavy components - reduce initial bundle size
const TrustBadges = lazy(() => import('@/components/home/TrustBadges').then(m => ({ default: m.default })))
const TrendingKeywords = lazy(() => import('@/components/home/TrendingKeywords').then(m => ({ default: m.default })))
const LiveStats = lazy(() => import('@/components/home/LiveStats').then(m => ({ default: m.default })))
const LiveActivityTicker = lazy(() => import('@/components/home/LiveActivityTicker').then(m => ({ default: m.default })))
const PersonalizedSection = lazy(() => import('@/components/home/PersonalizedSection').then(m => ({ default: m.default })))
const ListingsTabs = lazy(() => import('@/components/home/ListingsTabs').then(m => ({ default: m.ListingsTabs })))
const RecentlyViewed = lazy(() => import('@/components/home/RecentlyViewed').then(m => ({ default: m.RecentlyViewed })))
const AIRecommendations = lazy(() => import('@/components/home/AIRecommendations').then(m => ({ default: m.AIRecommendations })))
const PopularInYourCity = lazy(() => import('@/components/home/PopularInYourCity').then(m => ({ default: m.default })))
const HowItWorks = lazy(() => import('@/components/home/HowItWorks').then(m => ({ default: m.default })))
const AppDownloadBanner = lazy(() => import('@/components/home/AppDownloadBanner').then(m => ({ default: m.default })))
const Testimonials = lazy(() => import('@/components/home/Testimonials').then(m => ({ default: m.default })))
const BlogSection = lazy(() => import('@/components/home/BlogSection').then(m => ({ default: m.default })))
const ScrollProgress = lazy(() => import('@/components/ScrollProgress').then(m => ({ default: m.default })))

interface HomePageClientProps {
  initialStats?: {
    totalListings: number
    totalCategories: number
    activeUsers: number
  }
}

/**
 * HomePageContent - Main content component that uses batch API data
 * Separated to allow Suspense boundary
 */
function HomePageContent({ initialStats }: { initialStats?: HomePageClientProps['initialStats'] }) {
  const { data: homepageData, isLoading: isLoadingData } = useHomePageData()

  return (
    <>
      {/* Hero Section - Enhanced */}
      <section id="hero" className="relative bg-gradient-to-br from-primary/10 via-primary/5 to-background py-16 sm:py-24 scroll-mt-16">
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

            {/* Smart Search Box with Autocomplete - Critical, load immediately */}
            <div className="mt-8">
              <Suspense fallback={<div className="h-16 bg-muted animate-pulse rounded-lg" />}>
                <SmartSearchBox />
              </Suspense>

              {/* Trending Keywords - Non-critical, lazy load */}
              <div className="mt-6">
                <LazySection
                  fallback={null}
                  rootMargin="50px"
                >
                  <TrendingKeywords />
                </LazySection>
              </div>
            </div>

            {/* Quick Stats - Now using dynamic stats */}
            <div 
              className="flex items-center justify-center gap-8 text-sm text-muted-foreground pt-4"
              role="region"
              aria-label="Platform istatistikleri"
            >
              <div className="flex items-center gap-2" aria-label={`${initialStats?.totalListings.toLocaleString('tr-TR') || '2,500'} aktif ilan`}>
                <TrendingUp className="w-4 h-4" aria-hidden="true" />
                <span>{initialStats?.totalListings.toLocaleString('tr-TR') || '2,500'}+ Aktif İlan</span>
              </div>
              <div className="flex items-center gap-2" aria-label={`${initialStats?.totalCategories || '50'} kategori`}>
                <Sparkles className="w-4 h-4" aria-hidden="true" />
                <span>{initialStats?.totalCategories || '50'}+ Kategori</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Badges - Non-critical, lazy load */}
      <LazySection
        fallback={null}
        rootMargin="100px"
        minHeight="100px"
      >
        <TrustBadges />
      </LazySection>

      {/* Live Stats - Non-critical, lazy load */}
      <LazySection
        fallback={null}
        rootMargin="100px"
        minHeight="100px"
      >
        <LiveStats />
      </LazySection>

      {/* Live Activity Ticker - Non-critical, lazy load */}
      <LazySection
        fallback={null}
        rootMargin="100px"
        minHeight="50px"
      >
        <LiveActivityTicker />
      </LazySection>

      {/* Personalized Section (logged-in users only) - Non-critical, lazy load */}
      <LazySection
        fallback={null}
        rootMargin="100px"
        minHeight="200px"
      >
        <PersonalizedSection />
      </LazySection>

      {/* Listings with Filters - New comprehensive filtering experience */}
      <HomepageSection componentName="Filtrelenmiş İlanlar">
        <HomepageListingsWithFilters />
      </HomepageSection>

      {/* Listings Tabs - Öne Çıkanlar, Yeni İlanlar, Popüler (Alternative view) */}
      <HomepageSection componentName="Öne Çıkan İlanlar">
        <section id="featured-listings" className="scroll-mt-16">
          <ListingsTabs
            flashDeals={homepageData?.flashDeals}
            todaysListings={homepageData?.todaysListings}
            popularListings={homepageData?.popularListings}
            isLoading={isLoadingData}
          />
        </section>
      </HomepageSection>

      {/* Popular Categories - Critical, load immediately but using batch data */}
      <HomepageSection componentName="Popüler Kategoriler">
        <section id="categories" className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-12 scroll-mt-16">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-2">Popüler Kategoriler</h2>
            <p className="text-muted-foreground">Hızlı erişim için kategoriye göz atın</p>
          </div>
          <Suspense fallback={<div className="h-64 bg-muted animate-pulse rounded-lg" />}>
            <PopularCategories categories={homepageData?.popularCategories} isLoading={isLoadingData} />
          </Suspense>
        </section>
      </HomepageSection>

      {/* Recently Viewed */}
      <LazySection
        fallback={<div className="h-64 bg-muted animate-pulse rounded-lg" />}
        rootMargin="150px"
        minHeight="300px"
      >
        <RecentlyViewed />
      </LazySection>

      {/* AI Recommendations - Using batch data */}
      <HomepageSection componentName="AI Önerileri">
        <LazySection
          fallback={<div className="h-96 bg-muted animate-pulse rounded-lg" />}
          rootMargin="150px"
          minHeight="400px"
        >
          <section className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <AIRecommendations recommendations={homepageData?.recommendations} isLoading={isLoadingData} />
          </section>
        </LazySection>
      </HomepageSection>

      {/* Popular in Your City */}
      <LazySection
        fallback={<ListingsSkeleton title="Şehrinde Popüler" />}
        rootMargin="150px"
        minHeight="400px"
      >
        <PopularInYourCity />
      </LazySection>

      {/* How It Works - Non-critical, lazy load */}
      <LazySection
        fallback={<div className="h-96 bg-muted animate-pulse rounded-lg" />}
        rootMargin="100px"
        minHeight="400px"
      >
        <HowItWorks />
      </LazySection>

      {/* App Download Banner - Non-critical, lazy load */}
      <LazySection
        fallback={<div className="h-48 bg-muted animate-pulse rounded-lg" />}
        rootMargin="100px"
        minHeight="200px"
      >
        <AppDownloadBanner />
      </LazySection>

      {/* Testimonials - Non-critical, lazy load */}
      <LazySection
        fallback={<div className="h-96 bg-muted animate-pulse rounded-lg" />}
        rootMargin="100px"
        minHeight="400px"
      >
        <Testimonials />
      </LazySection>

      {/* Blog Section - Non-critical, lazy load */}
      <LazySection
        fallback={<div className="h-96 bg-muted animate-pulse rounded-lg" />}
        rootMargin="100px"
        minHeight="400px"
      >
        <BlogSection />
      </LazySection>

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
    </>
  )
}

export default function HomePageClient({ initialStats }: HomePageClientProps) {
  // Background refetch for homepage data (every 2 minutes)
  useBackgroundRefetch({
    queryKeys: [['homepage-data'], ['homepage-stats']],
    interval: 2 * 60 * 1000, // 2 minutes
    onlyWhenVisible: true,
    enabled: true,
  })

  return (
    <div className="min-h-screen bg-background">
      {/* Critical Resources Preloading */}
      <CriticalResources />
      
      {/* Scroll Progress - Lazy loaded */}
      <Suspense fallback={null}>
        <ScrollProgress />
      </Suspense>

      {/* Main Content */}
      <Suspense fallback={<HomePageSkeleton />}>
        <HomePageContent initialStats={initialStats} />
      </Suspense>

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

// HomePage Skeleton for initial load
function HomePageSkeleton() {
  return (
    <>
      {/* Hero Skeleton */}
      <section className="relative bg-gradient-to-br from-primary/10 via-primary/5 to-background py-16 sm:py-24">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-6">
            <Skeleton className="h-16 w-96 mx-auto" />
            <Skeleton className="h-6 w-64 mx-auto" />
            <Skeleton className="h-16 w-full max-w-2xl mx-auto mt-8" />
          </div>
        </div>
      </section>
      
      {/* Content Skeletons */}
      <ListingsSkeleton title="Yükleniyor..." />
    </>
  )
}

