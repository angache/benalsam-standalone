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
 * SEO Optimized with:
 * - Server-side metadata
 * - Structured data (JSON-LD)
 * - Critical content SSR
 */

import { Suspense } from 'react'
import type { Metadata } from 'next'
import { generateMetadata as generateSEOMetadata } from '@/lib/seo'
import { StructuredData } from '@/components/seo/StructuredData'
import { generateHomepageStructuredData, generateOrganizationStructuredData } from '@/lib/seo'
import { fetchHomePageStats } from '@/services/homePageService'
import HomePageClient from './HomePageClient'

// Generate metadata for SEO
export const metadata: Metadata = generateSEOMetadata({
  title: 'BenAlsam - Türkiye\'nin En Güvenilir Alım-Satım Platformu',
  description: 'Binlerce ilan arasından ihtiyacınıza uygun olanı bulun. Emlak, araç, elektronik ve daha fazlası. Güvenli alım-satım platformu.',
  keywords: [
    'ikinci el',
    'alım satım',
    'ilan',
    'emlak',
    'araç',
    'otomotiv',
    'elektronik',
    'telefon',
    'bilgisayar',
    'mobilya',
    'güvenli alışveriş',
    'Türkiye',
  ],
  url: '/',
  type: 'website',
})

/**
 * Homepage Server Component
 * Fetches critical data on server for SEO
 */
export default async function HomePage() {
  // Fetch stats on server for structured data
  let stats
  try {
    stats = await fetchHomePageStats()
  } catch (error) {
    console.error('Failed to fetch homepage stats:', error)
    stats = {
      totalListings: 2500,
      totalCategories: 50,
      activeUsers: 1000,
    }
  }

  // Generate structured data
  const homepageStructuredData = generateHomepageStructuredData(stats)
  const organizationStructuredData = generateOrganizationStructuredData()

  return (
    <>
      {/* Structured Data for SEO */}
      <StructuredData data={[homepageStructuredData, organizationStructuredData]} />
      
      {/* Client Component for Interactive Features */}
      <HomePageClient initialStats={stats} />
    </>
  )
}
