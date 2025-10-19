'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
import { 
  Home, 
  Car, 
  Smartphone, 
  Shirt, 
  Gamepad2, 
  Heart,
  Filter,
  MapPin,
  DollarSign,
  Loader2
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { categoryService, type Category } from '@/services/categoryService'
import { useCategoryCounts } from '@/hooks/useCategoryCounts'

// Icon mapping for categories
const iconMap: Record<string, any> = {
  Home,
  Car,
  Smartphone,
  Shirt,
  Gamepad2,
  Heart,
}

export default function Sidebar() {
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { getCategoryCount, isLoading: countsLoading } = useCategoryCounts()

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      setIsLoading(true)
      // Tüm level 0 kategorileri çek
      const allCategories = await categoryService.getCategories()
      const topLevelCategories = allCategories.filter(cat => cat.level === 0)
      console.log('📊 Fetched top level categories for sidebar:', topLevelCategories.length, topLevelCategories)
      setCategories(topLevelCategories)
    } catch (error) {
      console.error('Error loading categories:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <aside className="hidden lg:block w-80 border-r bg-muted/30 p-4 sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto">
      <div className="space-y-6">
        {/* Categories */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Kategoriler ({categories.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 max-h-[400px] overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : categories.length > 0 ? (
              categories.map((category) => {
                const IconComponent = category.icon ? iconMap[category.icon] : Home
                return (
                  <Button
                    key={category.id}
                    variant="ghost"
                    className="w-full justify-start gap-3 h-auto p-3"
                    onClick={() => window.location.href = `/kategori/${category.id}`}
                  >
                    {IconComponent && <IconComponent className="h-4 w-4" />}
                    <span className="flex-1 text-left">{category.name}</span>
                    <span className="text-muted-foreground text-sm">
                      {countsLoading ? '...' : getCategoryCount(String(category.id))}
                    </span>
                  </Button>
                )
              })
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                Kategori bulunamadı
              </p>
            )}
          </CardContent>
        </Card>

        {/* Price Filter */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Fiyat Aralığı
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Slider
                defaultValue={[0, 1000000]}
                max={1000000}
                min={0}
                step={10000}
                className="w-full"
              />
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>0 ₺</span>
                <span>1.000.000 ₺</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Location Filter */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Lokasyon
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Input placeholder="Şehir, ilçe..." />
          </CardContent>
        </Card>

        {/* Clear Filters */}
        <Button variant="outline" className="w-full">
          Filtreleri Temizle
        </Button>
      </div>
    </aside>
  )
}
