/**
 * SEO Utilities
 * 
 * Functions for generating meta tags, structured data, and SEO metadata
 */

import type { Metadata } from 'next'

export interface SEOData {
  title: string
  description: string
  keywords?: string[]
  image?: string
  url?: string
  type?: 'website' | 'article' | 'product'
  siteName?: string
  locale?: string
}

/**
 * Generate metadata for Next.js pages
 */
export function generateMetadata(seoData: SEOData): Metadata {
  const {
    title,
    description,
    keywords = [],
    image,
    url,
    type = 'website',
    siteName = 'BenAlsam',
    locale = 'tr_TR',
  } = seoData

  const fullTitle = title.includes('BenAlsam') ? title : `${title} | BenAlsam`
  const fullUrl = url ? `https://benalsam.com${url}` : 'https://benalsam.com'
  const ogImage = image || 'https://benalsam.com/og-image.jpg'

  return {
    title: fullTitle,
    description,
    keywords: keywords.length > 0 ? keywords.join(', ') : undefined,
    authors: [{ name: 'BenAlsam' }],
    creator: 'BenAlsam',
    publisher: 'BenAlsam',
    metadataBase: new URL('https://benalsam.com'),
    alternates: {
      canonical: fullUrl,
    },
    openGraph: {
      type,
      locale,
      url: fullUrl,
      title: fullTitle,
      description,
      siteName,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
      images: [ogImage],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  }
}

/**
 * Generate JSON-LD structured data for homepage
 */
export function generateHomepageStructuredData(stats?: {
  totalListings: number
  totalCategories: number
  activeUsers: number
}) {
  const baseData = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'BenAlsam',
    url: 'https://benalsam.com',
    description: 'Türkiye\'nin en güvenilir alım-satım platformu. Binlerce ilan arasından ihtiyacınıza uygun olanı bulun.',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: 'https://benalsam.com/arama?q={search_term_string}',
      },
      'query-input': 'required name=search_term_string',
    },
  }

  if (stats) {
    return {
      ...baseData,
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: '4.8',
        reviewCount: '1000+',
      },
      numberOfItems: stats.totalListings,
    }
  }

  return baseData
}

/**
 * Generate JSON-LD structured data for organization
 */
export function generateOrganizationStructuredData() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'BenAlsam',
    url: 'https://benalsam.com',
    logo: 'https://benalsam.com/logo.png',
    description: 'Türkiye\'nin en güvenilir alım-satım platformu',
    sameAs: [
      // Add social media links here
      // 'https://facebook.com/benalsam',
      // 'https://twitter.com/benalsam',
      // 'https://instagram.com/benalsam',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'Customer Service',
      availableLanguage: ['Turkish'],
    },
  }
}

/**
 * Generate JSON-LD structured data for breadcrumbs
 */
export function generateBreadcrumbStructuredData(items: Array<{ name: string; url: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `https://benalsam.com${item.url}`,
    })),
  }
}

/**
 * Generate JSON-LD structured data for a listing
 */
export function generateListingStructuredData(listing: {
  id: string
  title: string
  description: string
  budget?: number
  currency?: string
  location?: string
  category?: string
  main_image_url?: string
  created_at?: string
  profiles?: {
    name: string
  }
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: listing.title,
    description: listing.description,
    image: listing.main_image_url ? [listing.main_image_url] : [],
    category: listing.category,
    offers: listing.budget
      ? {
          '@type': 'Offer',
          price: listing.budget,
          priceCurrency: listing.currency || 'TRY',
          availability: 'https://schema.org/InStock',
          url: `https://benalsam.com/ilan/${listing.id}`,
        }
      : undefined,
    seller: listing.profiles
      ? {
          '@type': 'Person',
          name: listing.profiles.name,
        }
      : undefined,
    datePublished: listing.created_at,
  }
}

/**
 * Generate JSON-LD structured data for FAQ
 */
export function generateFAQStructuredData(faqs: Array<{ question: string; answer: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  }
}

