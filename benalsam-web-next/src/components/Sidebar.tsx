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
  DollarSign
} from 'lucide-react'

export default function Sidebar() {
  const categories = [
    { icon: Home, name: 'Emlak', count: 1250 },
    { icon: Car, name: 'Araç', count: 890 },
    { icon: Smartphone, name: 'Elektronik', count: 2100 },
    { icon: Shirt, name: 'Moda', count: 750 },
    { icon: Gamepad2, name: 'Spor & Hobi', count: 420 },
    { icon: Heart, name: 'Ev & Yaşam', count: 680 },
  ]

  return (
    <aside className="hidden lg:block w-80 border-r bg-muted/30 p-4">
      <div className="space-y-6">
        {/* Categories */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Kategoriler
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {categories.map((category, index) => (
              <Button
                key={index}
                variant="ghost"
                className="w-full justify-start gap-3 h-auto p-3"
              >
                <category.icon className="h-4 w-4" />
                <span className="flex-1 text-left">{category.name}</span>
                <span className="text-muted-foreground text-sm">
                  {category.count}
                </span>
              </Button>
            ))}
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
