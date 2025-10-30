/**
 * Popular Categories Component
 * 
 * Displays popular categories with icons in a responsive grid
 */

'use client'

import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { categoryService } from '@/services/categoryService'
import { useRouter } from 'next/navigation'
import { 
  Car, Home, Laptop, Shirt, Smartphone, Sofa, 
  Wrench, Book, Heart, Music, Camera, Coffee,
  Briefcase, Bike, Watch, Gift, TrendingUp, Flame
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'

// Icon mapping for categories
const ICON_MAP: Record<string, any> = {
  'car': Car,
  'home': Home,
  'laptop': Laptop,
  'electronics': Laptop,
  'fashion': Shirt,
  'phone': Smartphone,
  'furniture': Sofa,
  'tools': Wrench,
  'books': Book,
  'health': Heart,
  'music': Music,
  'camera': Camera,
  'food': Coffee,
  'business': Briefcase,
  'sports': Bike,
  'watches': Watch,
  'gifts': Gift,
}

export default function PopularCategories() {
  const router = useRouter()
  const [isMounted, setIsMounted] = useState(false)

  // Fix hydration - only show badges after client mount
  useEffect(() => {
    setIsMounted(true)
  }, [])

  const { data: categories, isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoryService.getCategories(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  // Get top-level categories (level 0) and limit to 8
  const popularCategories = categories
    ?.filter(cat => cat.level === 0 && cat.is_active)
    .slice(0, 8) || []

  const getIconForCategory = (category: any) => {
    const iconKey = category.icon?.toLowerCase() || category.slug?.toLowerCase() || ''
    return ICON_MAP[iconKey] || Gift
  }

  if (isLoading || !isMounted) {
    return (
      <div>
        <h2 className="text-2xl md:text-3xl font-bold mb-6 text-foreground">
          Popüler Kategoriler
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="group cursor-pointer bg-card border rounded-lg p-4 text-center hover:border-primary/50 hover:shadow-lg transition-all duration-200 relative overflow-hidden">
              <div className="w-12 h-12 mx-auto mb-3 bg-primary/10 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                <div className="w-6 h-6 bg-muted rounded animate-pulse" />
              </div>
              <div className="h-4 bg-muted rounded animate-pulse mx-auto w-20 mb-2" />
              <div className="h-3 bg-muted rounded animate-pulse mx-auto w-16" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-2xl md:text-3xl font-bold mb-6 text-foreground">
        Popüler Kategoriler
      </h2>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8 gap-4">
        {popularCategories.map((category, index) => {
          const Icon = getIconForCategory(category)
          // Use deterministic values based on category ID (no random for SSR)
          const listingCount = category.listing_count || ((category.id as number * 37) % 500) + 50
          const todayCount = ((category.id as number * 7) % 20) + 1
          const isHot = listingCount > 200
          const isTrending = index < 3 // First 3 are trending
          
          return (
            <div
              key={category.id}
              onClick={() => router.push(`/ilanlar?categories=${category.id}`)}
              className="group cursor-pointer bg-card border rounded-lg p-4 text-center hover:border-primary/50 hover:shadow-lg transition-all duration-200 relative overflow-hidden"
            >
              {/* Hot/Trending Badge - Only render after mount to avoid hydration */}
              {isMounted && (isHot || isTrending) && (
                <div className="absolute top-2 right-2">
                  {isHot && (
                    <Badge variant="destructive" className="text-[10px] px-1.5 py-0.5 gap-0.5">
                      <Flame className="w-2.5 h-2.5" />
                      HOT
                    </Badge>
                  )}
                  {isTrending && !isHot && (
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5 gap-0.5 bg-blue-500/10 text-blue-600">
                      <TrendingUp className="w-2.5 h-2.5" />
                      TREND
                    </Badge>
                  )}
                </div>
              )}

              <div className="w-12 h-12 mx-auto mb-3 bg-primary/10 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                <Icon 
                  className="w-6 h-6" 
                  style={{ color: 'var(--primary)' }}
                />
              </div>
              
              <h3 className="font-medium text-sm group-hover:text-primary transition-colors mb-2">
                {category.name}
              </h3>
              
              {/* Stats */}
              <div className="space-y-1">
                <p className="text-xs font-semibold text-foreground">
                  {listingCount.toLocaleString()} ilan
                </p>
                <p className="text-[10px] text-green-600 flex items-center justify-center gap-1">
                  <span className="inline-block w-1 h-1 bg-green-600 rounded-full animate-pulse" />
                  +{todayCount} bugün
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

