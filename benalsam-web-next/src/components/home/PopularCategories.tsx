/**
 * Popular Categories Component
 * 
 * Displays popular categories with icons in a responsive grid
 */

'use client'

import { useQuery } from '@tanstack/react-query'
import { categoryService } from '@/services/categoryService'
import { useRouter } from 'next/navigation'
import { 
  Car, Home, Laptop, Shirt, Smartphone, Sofa, 
  Wrench, Book, Heart, Music, Camera, Coffee,
  Briefcase, Bike, Watch, Gift
} from 'lucide-react'

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

  if (isLoading) {
    return (
      <div>
        <h2 className="text-2xl md:text-3xl font-bold mb-6 text-foreground">
          Popüler Kategoriler
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-card border rounded-lg p-4">
              <div className="w-12 h-12 mx-auto mb-3 bg-muted rounded-lg animate-pulse" />
              <div className="h-4 bg-muted rounded animate-pulse" />
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
        {popularCategories.map((category) => {
          const Icon = getIconForCategory(category)
          
          return (
            <div
              key={category.id}
              onClick={() => router.push(`/kategori/${category.slug || category.id}`)}
              className="group cursor-pointer bg-card border rounded-lg p-4 text-center hover:border-primary/50 hover:shadow-md transition-all duration-200"
            >
              <div className="w-12 h-12 mx-auto mb-3 bg-primary/10 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                <Icon 
                  className="w-6 h-6" 
                  style={{ color: 'var(--primary)' }}
                />
              </div>
              
              <h3 className="font-medium text-sm group-hover:text-primary transition-colors">
                {category.name}
              </h3>
              
              {category.listing_count !== undefined && category.listing_count > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  {category.listing_count} ilan
                </p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

