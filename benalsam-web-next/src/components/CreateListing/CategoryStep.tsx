'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, Smartphone, Building, Car, WashingMachine, Shirt, GraduationCap, Briefcase, Dumbbell, Palette, Baby, Gamepad2, Heart, Factory, Plane, Star, Bitcoin, Home, Book } from 'lucide-react'

// Icon mapping for API categories
const iconMap: { [key: string]: React.ComponentType<any> } = {
  'smartphone': Smartphone,
  'building': Building,
  'car': Car,
  'home': Home,
  'shirt': Shirt,
  'book': Book,
  'briefcase': Briefcase,
  'dumbbell': Dumbbell,
  'palette': Palette,
  'baby': Baby,
  'gamepad': Gamepad2,
  'heart': Heart,
  'factory': Factory,
  'plane': Plane,
  'star': Star,
  'bitcoin': Bitcoin,
  'washing-machine': WashingMachine,
  'graduation-cap': GraduationCap,
}

// Get icon component from string or component
const getIconComponent = (icon: string | React.ComponentType<any> | undefined): React.ComponentType<any> => {
  if (typeof icon === 'string') {
    return iconMap[icon.toLowerCase()] || Smartphone
  }
  return icon || Smartphone
}

// Get default colors for API categories
const getDefaultColors = (categoryName: string) => {
  const name = categoryName.toLowerCase()
  if (name.includes('elektronik') || name.includes('telefon')) return 'bg-gradient-to-br from-blue-500 to-blue-700'
  if (name.includes('emlak') || name.includes('ev')) return 'bg-gradient-to-br from-green-500 to-green-700'
  if (name.includes('araç') || name.includes('otomobil')) return 'bg-gradient-to-br from-red-500 to-red-700'
  if (name.includes('moda') || name.includes('giyim')) return 'bg-gradient-to-br from-pink-500 to-pink-700'
  if (name.includes('spor') || name.includes('fitness')) return 'bg-gradient-to-br from-teal-500 to-teal-700'
  if (name.includes('eğitim') || name.includes('kitap')) return 'bg-gradient-to-br from-indigo-500 to-indigo-700'
  if (name.includes('hizmet') || name.includes('iş')) return 'bg-gradient-to-br from-orange-500 to-orange-700'
  if (name.includes('sanat') || name.includes('hobi')) return 'bg-gradient-to-br from-yellow-500 to-yellow-700'
  if (name.includes('anne') || name.includes('bebek')) return 'bg-gradient-to-br from-rose-500 to-rose-700'
  if (name.includes('oyun') || name.includes('eğlence')) return 'bg-gradient-to-br from-cyan-500 to-cyan-700'
  if (name.includes('sağlık') || name.includes('güzellik')) return 'bg-gradient-to-br from-emerald-500 to-emerald-700'
  if (name.includes('seyahat') || name.includes('turizm')) return 'bg-gradient-to-br from-sky-500 to-sky-700'
  if (name.includes('koleksiyon') || name.includes('değerli')) return 'bg-gradient-to-br from-amber-500 to-amber-700'
  if (name.includes('kripto') || name.includes('finans')) return 'bg-gradient-to-br from-orange-500 to-orange-700'
  return 'bg-gradient-to-br from-gray-500 to-gray-700' // Default
}

interface Category {
  id: string | number
  name: string
  icon?: string | React.ComponentType<any>
  color?: string
  bgColor?: string
  subcategories?: Category[]
  level?: number
  parent_id?: string | number | null
  children?: Category[]
}

const hardcodedCategories: Category[] = [
  {
    id: 'electronics',
    name: 'Elektronik',
    icon: Smartphone,
    color: 'text-white',
    bgColor: 'bg-gradient-to-br from-blue-500 to-blue-700',
    subcategories: [
      { 
        id: 'smartphone', 
        name: 'Akıllı Telefon', 
        icon: Smartphone, 
        color: 'text-white', 
        bgColor: 'bg-gradient-to-br from-blue-500 to-blue-700',
        subcategories: [
          { id: 'iphone', name: 'iPhone', icon: Smartphone, color: 'text-white', bgColor: 'bg-gradient-to-br from-blue-500 to-blue-700' },
          { id: 'samsung', name: 'Samsung', icon: Smartphone, color: 'text-white', bgColor: 'bg-gradient-to-br from-blue-500 to-blue-700' },
          { id: 'xiaomi', name: 'Xiaomi', icon: Smartphone, color: 'text-white', bgColor: 'bg-gradient-to-br from-blue-500 to-blue-700' },
          { id: 'huawei', name: 'Huawei', icon: Smartphone, color: 'text-white', bgColor: 'bg-gradient-to-br from-blue-500 to-blue-700' },
          { id: 'oppo', name: 'Oppo', icon: Smartphone, color: 'text-white', bgColor: 'bg-gradient-to-br from-blue-500 to-blue-700' },
          { id: 'oneplus', name: 'OnePlus', icon: Smartphone, color: 'text-white', bgColor: 'bg-gradient-to-br from-blue-500 to-blue-700' }
        ]
      },
      { id: 'laptop', name: 'Laptop', icon: Smartphone, color: 'text-white', bgColor: 'bg-gradient-to-br from-blue-500 to-blue-700' },
      { id: 'tablet', name: 'Tablet', icon: Smartphone, color: 'text-white', bgColor: 'bg-gradient-to-br from-blue-500 to-blue-700' },
      { id: 'desktop', name: 'Masaüstü', icon: Smartphone, color: 'text-white', bgColor: 'bg-gradient-to-br from-blue-500 to-blue-700' },
      { id: 'tv', name: 'TV & Ses', icon: Smartphone, color: 'text-white', bgColor: 'bg-gradient-to-br from-blue-500 to-blue-700' },
      { id: 'camera', name: 'Kamera', icon: Smartphone, color: 'text-white', bgColor: 'bg-gradient-to-br from-blue-500 to-blue-700' }
    ]
  },
  {
    id: 'real-estate',
    name: 'Emlak',
    icon: Building,
    color: 'text-white',
    bgColor: 'bg-gradient-to-br from-green-500 to-green-700',
    subcategories: [
      { id: 'rental-apartment', name: 'Kiralık Daire', icon: Building, color: 'text-white', bgColor: 'bg-gradient-to-br from-green-500 to-green-700' },
      { id: 'sale-apartment', name: 'Satılık Daire', icon: Building, color: 'text-white', bgColor: 'bg-gradient-to-br from-green-500 to-green-700' },
      { id: 'rental-house', name: 'Kiralık Ev', icon: Building, color: 'text-white', bgColor: 'bg-gradient-to-br from-green-500 to-green-700' },
      { id: 'sale-house', name: 'Satılık Ev', icon: Building, color: 'text-white', bgColor: 'bg-gradient-to-br from-green-500 to-green-700' },
      { id: 'commercial', name: 'Ticari', icon: Building, color: 'text-white', bgColor: 'bg-gradient-to-br from-green-500 to-green-700' },
      { id: 'land', name: 'Arsa', icon: Building, color: 'text-white', bgColor: 'bg-gradient-to-br from-green-500 to-green-700' }
    ]
  },
  {
    id: 'vehicles',
    name: 'Araç & Vasıta',
    icon: Car,
    color: 'text-white',
    bgColor: 'bg-gradient-to-br from-red-500 to-red-700',
    subcategories: [
      { id: 'car', name: 'Otomobil', icon: Car, color: 'text-white', bgColor: 'bg-gradient-to-br from-red-500 to-red-700' },
      { id: 'motorcycle', name: 'Motosiklet', icon: Car, color: 'text-white', bgColor: 'bg-gradient-to-br from-red-500 to-red-700' },
      { id: 'truck', name: 'Kamyon', icon: Car, color: 'text-white', bgColor: 'bg-gradient-to-br from-red-500 to-red-700' },
      { id: 'bus', name: 'Otobüs', icon: Car, color: 'text-white', bgColor: 'bg-gradient-to-br from-red-500 to-red-700' },
      { id: 'boat', name: 'Tekne', icon: Car, color: 'text-white', bgColor: 'bg-gradient-to-br from-red-500 to-red-700' },
      { id: 'bicycle', name: 'Bisiklet', icon: Car, color: 'text-white', bgColor: 'bg-gradient-to-br from-red-500 to-red-700' }
    ]
  },
  {
    id: 'home-appliances',
    name: 'Ev Aletleri & Mobilya',
    icon: WashingMachine,
    color: 'text-white',
    bgColor: 'bg-gradient-to-br from-purple-500 to-purple-700'
  },
  {
    id: 'fashion',
    name: 'Moda & Giyim',
    icon: Shirt,
    color: 'text-white',
    bgColor: 'bg-gradient-to-br from-pink-500 to-pink-700'
  },
  {
    id: 'education',
    name: 'Eğitim & Kitap',
    icon: GraduationCap,
    color: 'text-white',
    bgColor: 'bg-gradient-to-br from-indigo-500 to-indigo-700'
  },
  {
    id: 'services',
    name: 'Hizmetler',
    icon: Briefcase,
    color: 'text-white',
    bgColor: 'bg-gradient-to-br from-orange-500 to-orange-700'
  },
  {
    id: 'sports',
    name: 'Spor & Outdoor',
    icon: Dumbbell,
    color: 'text-white',
    bgColor: 'bg-gradient-to-br from-teal-500 to-teal-700'
  },
  {
    id: 'art-hobby',
    name: 'Sanat & Hobi',
    icon: Palette,
    color: 'text-white',
    bgColor: 'bg-gradient-to-br from-yellow-500 to-yellow-700'
  },
  {
    id: 'mother-baby',
    name: 'Anne & Bebek',
    icon: Baby,
    color: 'text-white',
    bgColor: 'bg-gradient-to-br from-rose-500 to-rose-700'
  },
  {
    id: 'games-entertainment',
    name: 'Oyun & Eğlence',
    icon: Gamepad2,
    color: 'text-white',
    bgColor: 'bg-gradient-to-br from-cyan-500 to-cyan-700'
  },
  {
    id: 'health-beauty',
    name: 'Sağlık & Güzellik',
    icon: Heart,
    color: 'text-white',
    bgColor: 'bg-gradient-to-br from-emerald-500 to-emerald-700'
  },
  {
    id: 'business-industry',
    name: 'İş & Endüstri',
    icon: Factory,
    color: 'text-white',
    bgColor: 'bg-gradient-to-br from-slate-500 to-slate-700'
  },
  {
    id: 'travel',
    name: 'Seyahat',
    icon: Plane,
    color: 'text-white',
    bgColor: 'bg-gradient-to-br from-sky-500 to-sky-700'
  },
  {
    id: 'collectibles',
    name: 'Koleksiyon & Değerli Eşyalar',
    icon: Star,
    color: 'text-white',
    bgColor: 'bg-gradient-to-br from-amber-500 to-amber-700'
  },
  {
    id: 'crypto-finance',
    name: 'Kripto & Finans',
    icon: Bitcoin,
    color: 'text-white',
    bgColor: 'bg-gradient-to-br from-orange-500 to-orange-700'
  }
]

interface CategoryStepProps {
  selectedCategory: string | null
  onCategorySelect: (categoryId: string) => void
  onNext: () => void
  onBack: () => void
}

export default function CategoryStep({ selectedCategory, onCategorySelect, onNext, onBack }: CategoryStepProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [navigationStack, setNavigationStack] = useState<Category[]>([]) // Breadcrumb trail
  const [currentLevel, setCurrentLevel] = useState<Category[]>([]) // Current categories to display
  const [selectedLeafCategory, setSelectedLeafCategory] = useState<string | number | null>(selectedCategory)
  const [rootCategories, setRootCategories] = useState<Category[]>([])

  // Load categories from localStorage
  useEffect(() => {
    const loadCategories = () => {
      try {
        // Use the correct cache key from categoryCacheService
        const cachedCategories = localStorage.getItem('benalsam_categories_next_v1.0.0')
        if (cachedCategories) {
          const parsedCache = JSON.parse(cachedCategories)
          if (parsedCache.data && Array.isArray(parsedCache.data)) {
            // Recursive function to map children/subcategories at all levels
            const mapSubcategories = (cat: any): any => {
              const subcategories = cat.children || cat.subcategories || []
              return {
                ...cat,
                subcategories: subcategories.map(mapSubcategories)
              }
            }
            
            const categoriesWithSubcategories = parsedCache.data.map(mapSubcategories)
            setRootCategories(categoriesWithSubcategories)
            setCurrentLevel(categoriesWithSubcategories) // Start with root categories
            console.log('✅ Categories loaded from cache:', categoriesWithSubcategories.length)
          } else {
            setRootCategories(hardcodedCategories)
            setCurrentLevel(hardcodedCategories)
          }
        } else {
          // Fallback to hardcoded categories if localStorage is empty
          console.log('📦 No cached categories found, using hardcoded fallback')
          setRootCategories(hardcodedCategories)
          setCurrentLevel(hardcodedCategories)
        }
      } catch (error) {
        console.error('❌ Error loading categories from localStorage:', error)
        setRootCategories(hardcodedCategories)
        setCurrentLevel(hardcodedCategories)
      }
    }

    loadCategories()
  }, [])

  // Get current breadcrumb path
  const getBreadcrumb = () => {
    return navigationStack.map(cat => cat.name).join(' > ')
  }

  // Build searchable index of LEAF categories with full breadcrumb path
  type LeafPath = { id: string | number, path: string, trail: Category[] }

  const leafIndex = useMemo<LeafPath[]>(() => {
    const results: LeafPath[] = []

    const dfs = (nodes: Category[], trail: Category[] = []) => {
      for (const node of nodes) {
        const subs = node.subcategories || node.children || []
        const newTrail = [...trail, node]
        if (subs.length === 0) {
          // Leaf
          const path = newTrail.map(c => c.name).join(' > ')
          results.push({ id: node.id, path, trail: newTrail })
        } else {
          dfs(subs, newTrail)
        }
      }
    }

    if (rootCategories && rootCategories.length > 0) {
      dfs(rootCategories)
    }

    return results
  }, [rootCategories])

  // Check if category is a leaf (no subcategories)
  const isLeafCategory = (category: Category): boolean => {
    const subs = category.subcategories || category.children || []
    return subs.length === 0
  }

  // Hierarchical category suggestions (from dynamic LEAF index)
  const getSearchSuggestions = (term: string) => {
    const t = term.trim().toLowerCase()
    if (!t) return []
    return leafIndex
      .filter(item => item.path.toLowerCase().includes(t))
      .slice(0, 12)
  }

  // Handle category click - SINGLE handler for ALL levels
  const handleCategoryClick = (category: Category) => {
    const subcats = category.subcategories || category.children || []
    const isLeaf = subcats.length === 0
    
    console.log('🔍 Category clicked:', { 
      id: category.id, 
      name: category.name, 
      isLeaf, 
      subcatsCount: subcats.length 
    })
    
    if (isLeaf) {
      // LEAF CATEGORY - Select it!
      setSelectedLeafCategory(category.id)
      onCategorySelect(String(category.id))
      console.log('✅ LEAF category selected:', category.name, category.id)
    } else {
      // HAS SUBCATEGORIES - Drill down!
      setNavigationStack([...navigationStack, category])
      setCurrentLevel(subcats)
      setSelectedLeafCategory(null)
      console.log('📂 Drilling down to:', category.name, '- Subcategories:', subcats.length)
    }
  }

  // Go back to previous level
  const handleGoBack = () => {
    if (navigationStack.length === 0) return
    
    const newStack = [...navigationStack]
    newStack.pop()
    setNavigationStack(newStack)
    
    if (newStack.length === 0) {
      // Back to root
      setCurrentLevel(rootCategories)
    } else {
      // Back to parent's subcategories
      const parent = newStack[newStack.length - 1]
      const subcats = parent.subcategories || parent.children || []
      setCurrentLevel(subcats)
    }
    
    setSelectedLeafCategory(null)
    console.log('← Back - Stack depth:', newStack.length)
  }

  const handleSuggestionClick = (suggestion: LeafPath) => {
    // Position UI at the parent level of the leaf and select the leaf
    const trail = suggestion.trail
    if (!trail || trail.length === 0) return

    const parentTrail = trail.slice(0, -1)
    const leaf = trail[trail.length - 1]

    setNavigationStack(parentTrail)

    if (parentTrail.length === 0) {
      setCurrentLevel(rootCategories)
    } else {
      const parent = parentTrail[parentTrail.length - 1]
      const subs = parent.subcategories || parent.children || []
      setCurrentLevel(subs)
    }

    setSelectedLeafCategory(leaf.id)
    onCategorySelect(String(leaf.id))
    setSearchTerm('')
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Progress Bar */}
      <div className="mb-12">
        <div className="flex items-center justify-between mb-6">
          {[1, 2, 3, 4, 5, 6].map((step) => (
            <div key={step} className="flex items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                step === 1 
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg' 
                  : 'bg-gray-200 text-gray-600'
              }`}>
                {step === 1 ? '✓' : step}
              </div>
              {step < 6 && (
                <div className={`w-20 h-2 mx-3 rounded-full transition-all duration-300 ${
                  step === 1 ? 'bg-gradient-to-r from-blue-600 to-purple-600' : 'bg-gray-200'
                }`} />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-between text-sm font-medium text-gray-600">
          <span className="text-blue-600">Kategori</span>
          <span>Detaylar</span>
          <span>Özellikler</span>
          <span>Görseller</span>
          <span>Konum</span>
          <span>Onay</span>
        </div>
      </div>

      {/* Breadcrumb */}
      {navigationStack.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <span>Ana Sayfa</span>
            {navigationStack.map((cat, index) => (
              <span key={cat.id}>
                {' > '}
                <span className="text-blue-400">{cat.name}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Title */}
      <h1 className="text-4xl font-bold text-center mb-8 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
        {navigationStack.length > 0 ? getBreadcrumb() : 'İlanınız için bir kategori seçin'}
      </h1>

      {/* Back Button */}
      {navigationStack.length > 0 && (
        <div className="mb-6">
          <Button 
            variant="outline" 
            onClick={handleGoBack}
            className="flex items-center gap-2"
          >
            ← Geri
          </Button>
        </div>
      )}

      {/* SINGLE GRID - Dynamic categories based on current level */}
      <div className="grid grid-cols-4 gap-6 mb-8">
        {currentLevel.map((category) => {
          const IconComponent = getIconComponent(category.icon)
          const isSelected = selectedLeafCategory === category.id
          const isLeaf = isLeafCategory(category)
          
          return (
            <Card
              key={category.id}
              className={`cursor-pointer transition-all duration-300 transform ${
                isSelected 
                  ? 'ring-4 ring-green-400 shadow-2xl scale-105' 
                  : 'hover:shadow-xl hover:scale-102'
              } border border-gray-700 bg-gray-800 relative`}
              onClick={() => handleCategoryClick(category)}
            >
              <CardContent className="p-6 text-center min-h-[120px] flex flex-col justify-center">
                <div className={`w-16 h-16 mx-auto mb-4 rounded-full ${category.bgColor || getDefaultColors(category.name)} flex items-center justify-center shadow-lg`}>
                  <IconComponent className="w-8 h-8 text-white" />
                </div>
                <p className="text-sm font-semibold text-white">{category.name}</p>
                {isLeaf && (
                  <span className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                    ✓ Seçilebilir
                  </span>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Search */}
      <div className="text-center mb-8">
        <p className="text-gray-400 mb-4">veya</p>
        <div className="relative max-w-2xl mx-auto">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Kategori ara (örn: akıllı telefon)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-gray-800 border-gray-600 text-white focus:border-orange-500 focus:ring-orange-500"
          />
          
          {/* Search Suggestions */}
          {searchTerm && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-gray-800 border border-gray-600 rounded-lg shadow-xl z-10 max-h-64 overflow-y-auto">
              {getSearchSuggestions(searchTerm).map((suggestion, index) => (
                <div
                  key={index}
                  className="px-4 py-3 hover:bg-gray-700 cursor-pointer border-b border-gray-700 last:border-b-0"
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  <div className="text-sm text-white">
                    {suggestion.path.split(' > ').map((part, i) => (
                      <span key={i}>
                        {i > 0 && <span className="text-gray-400"> {'>'} </span>}
                        {part.toLowerCase().includes(searchTerm.toLowerCase()) ? (
                          <span className="text-blue-400 font-medium">{part}</span>
                        ) : (
                          <span>{part}</span>
                        )}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          ← İptal
        </Button>
        <Button 
          onClick={onNext}
          disabled={!selectedLeafCategory}
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
        >
          İleri → {selectedLeafCategory && '✓'}
        </Button>
      </div>
    </div>
  )
}
