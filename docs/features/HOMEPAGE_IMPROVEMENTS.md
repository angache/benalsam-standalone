# 🏠 Anasayfa İyileştirme Planı

**Oluşturulma Tarihi**: 2025-01-XX  
**Durum**: Planlama Aşaması  
**Öncelik**: Yüksek

---

## 📋 İçindekiler

1. [Genel Bakış](#genel-bakış)
2. [Performans İyileştirmeleri](#performans-iyileştirmeleri)
3. [SEO İyileştirmeleri](#seo-iyileştirmeleri)
4. [UX İyileştirmeleri](#ux-iyileştirmeleri)
5. [Kod Kalitesi İyileştirmeleri](#kod-kalitesi-iyileştirmeleri)
6. [Mobil UX İyileştirmeleri](#mobil-ux-iyileştirmeleri)
7. [Erişilebilirlik İyileştirmeleri](#erişilebilirlik-iyileştirmeleri)
8. [API Optimizasyonları](#api-optimizasyonları)
9. [Uygulama Sırası](#uygulama-sırası)
10. [Test Senaryoları](#test-senaryoları)

---

## 🎯 Genel Bakış

### Mevcut Durum
- ✅ Modern, zengin içerikli anasayfa
- ✅ 15+ bölüm ve 25+ component
- ✅ Infinite scroll ve lazy loading
- ✅ Filtreleme sistemi (V2'de)
- ⚠️ Performans optimizasyonu gerekli
- ⚠️ SEO iyileştirmeleri gerekli
- ⚠️ Component refactoring gerekli

### Hedef Metrikler
- **First Contentful Paint**: < 1.5s (şu an: ~2-4s)
- **Time to Interactive**: < 3s
- **Lighthouse Score**: > 90
- **Component Complexity**: < 200 satır (şu an: 534 satır)

---

## 🚀 Performans İyileştirmeleri

### 1. Intersection Observer ile Lazy Loading

**Öncelik**: 🔴 Yüksek  
**Tahmini Süre**: 4-6 saat  
**Dosyalar**: `src/app/page.tsx`, `src/components/home/*`

#### Görevler
- [ ] Intersection Observer hook oluştur (`src/hooks/useIntersectionObserver.ts`)
- [ ] Her section için lazy loading implementasyonu
- [ ] Loading threshold'ları optimize et (0.1, 0.2, 0.3)
- [ ] Skeleton loader'ları iyileştir
- [ ] Prefetching stratejisi ekle

#### Kod Örneği
```typescript
// src/hooks/useIntersectionObserver.ts
export function useIntersectionObserver(
  options?: IntersectionObserverInit
) {
  const [isIntersecting, setIsIntersecting] = useState(false)
  const [hasIntersected, setHasIntersected] = useState(false)
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting)
        if (entry.isIntersecting && !hasIntersected) {
          setHasIntersected(true)
        }
      },
      { threshold: 0.1, ...options }
    )

    observer.observe(element)
    return () => observer.disconnect()
  }, [options, hasIntersected])

  return { ref, isIntersecting, hasIntersected }
}
```

#### Kullanım
```typescript
// src/app/page.tsx
const { ref: todaysRef, hasIntersected: shouldLoadTodays } = useIntersectionObserver()

{shouldLoadTodays && (
  <Suspense fallback={<ListingsSkeleton title="Bugün Eklenenler" />}>
    <TodaysListings />
  </Suspense>
)}
```

---

### 2. Batch API Calls ve Shared Cache

**Öncelik**: 🔴 Yüksek  
**Tahmini Süre**: 6-8 saat  
**Dosyalar**: `src/services/listingService.ts`, `src/hooks/useHomePageData.ts`

#### Görevler
- [ ] Batch API service oluştur (`src/services/batchService.ts`)
- [ ] Shared cache strategy implementasyonu
- [ ] Parallel loading için Promise.all kullanımı
- [ ] Cache invalidation stratejisi
- [ ] Request deduplication

#### Kod Örneği
```typescript
// src/services/batchService.ts
export async function batchFetchHomePageData(userId?: string) {
  const [todays, popular, categories, recommendations] = await Promise.all([
    listingService.getTodaysListings({ page: 1, limit: 8 }),
    listingService.getPopularListings({ page: 1, limit: 8 }),
    categoryService.getPopularCategories({ limit: 12 }),
    userId ? listingService.getRecommendations(userId) : Promise.resolve([]),
  ])

  return {
    todays: todays.listings,
    popular: popular.listings,
    categories: categories,
    recommendations: recommendations,
  }
}
```

---

### 3. Critical Components Önceliklendirme

**Öncelik**: 🟡 Orta  
**Tahmini Süre**: 2-3 saat  
**Dosyalar**: `src/app/page.tsx`

#### Görevler
- [ ] Critical components belirleme (Hero, Search, Categories)
- [ ] Non-critical components'i defer et
- [ ] Resource hints ekle (preload, prefetch)
- [ ] Priority loading implementasyonu

#### Critical Components
1. **Hero Section** - İlk görünen
2. **SmartSearchBox** - Ana etkileşim
3. **PopularCategories** - Hızlı navigasyon
4. **TodaysListings** - İçerik

#### Non-Critical Components
- Testimonials
- Blog Section
- How It Works
- App Download Banner

---

## 🔍 SEO İyileştirmeleri

### 1. SSR/SSG Implementasyonu

**Öncelik**: 🔴 Yüksek  
**Tahmini Süre**: 8-10 saat  
**Dosyalar**: `src/app/page.tsx`, `src/app/layout.tsx`

#### Görevler
- [ ] Critical content için SSR implementasyonu
- [ ] Static generation için getStaticProps benzeri yapı
- [ ] ISR (Incremental Static Regeneration) stratejisi
- [ ] Revalidation stratejisi (5 dakika)
- [ ] Fallback handling

#### Kod Örneği
```typescript
// src/app/page.tsx
export async function generateMetadata() {
  const stats = await getHomePageStats()
  
  return {
    title: 'BenAlsam - Alım İlanları Platformu',
    description: `${stats.totalListings}+ aktif ilan, ${stats.totalCategories}+ kategori`,
    openGraph: {
      title: 'BenAlsam - Alım İlanları Platformu',
      description: `${stats.totalListings}+ aktif ilan`,
      images: ['/og-homepage.jpg'],
    },
  }
}

export const revalidate = 300 // 5 dakika
```

---

### 2. Dinamik Meta Tags ve Structured Data

**Öncelik**: 🟡 Orta  
**Tahmini Süre**: 4-6 saat  
**Dosyalar**: `src/app/page.tsx`, `src/components/SEO/StructuredData.tsx`

#### Görevler
- [ ] Dinamik meta tags oluşturma
- [ ] JSON-LD structured data ekleme
- [ ] Open Graph tags
- [ ] Twitter Card tags
- [ ] Schema.org markup

#### Kod Örneği
```typescript
// src/components/SEO/StructuredData.tsx
export function HomePageStructuredData({ stats, listings }) {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'BenAlsam',
    description: 'Alım ilanları platformu',
    url: 'https://benalsam.com',
    potentialAction: {
      '@type': 'SearchAction',
      target: 'https://benalsam.com/ilanlar?q={search_term_string}',
      'query-input': 'required name=search_term_string',
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      reviewCount: stats.totalReviews,
    },
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  )
}
```

---

## 🎨 UX İyileştirmeleri

### 1. Tab Navigation Sistemi

**Öncelik**: 🟡 Orta  
**Tahmini Süre**: 6-8 saat  
**Dosyalar**: `src/components/home/TabNavigation.tsx`, `src/app/page.tsx`

#### Görevler
- [ ] Tab navigation component oluştur
- [ ] Tab'lar: Öne Çıkanlar, Yeni İlanlar, Popüler
- [ ] URL state management (query params)
- [ ] Smooth scroll to content
- [ ] Active tab indicator

#### Kod Örneği
```typescript
// src/components/home/TabNavigation.tsx
export function TabNavigation() {
  const [activeTab, setActiveTab] = useState<'featured' | 'new' | 'popular'>('featured')
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const tab = searchParams.get('tab') as 'featured' | 'new' | 'popular'
    if (tab) setActiveTab(tab)
  }, [searchParams])

  const handleTabChange = (tab: 'featured' | 'new' | 'popular') => {
    setActiveTab(tab)
    router.push(`/?tab=${tab}`, { scroll: false })
  }

  return (
    <div className="flex gap-2 border-b">
      <button
        onClick={() => handleTabChange('featured')}
        className={cn(
          'px-4 py-2 font-medium',
          activeTab === 'featured' && 'border-b-2 border-primary'
        )}
      >
        Öne Çıkanlar
      </button>
      {/* Diğer tab'lar */}
    </div>
  )
}
```

---

### 2. Ana Sayfaya Filtreleme Sistemi

**Öncelik**: 🟡 Orta  
**Tahmini Süre**: 8-10 saat  
**Dosyalar**: `src/app/page.tsx`, `src/components/home/FilterSidebar.tsx`

#### Görevler
- [ ] FilterSidebar'ı ana sayfaya entegre et
- [ ] URL state management
- [ ] Filter persistence (localStorage)
- [ ] Mobile filter sheet
- [ ] Active filter badges

#### Kod Örneği
```typescript
// src/app/page.tsx
export default function HomePage() {
  const searchParams = useSearchParams()
  const [filters, setFilters] = useState<FilterState>({
    categoryId: searchParams.get('category') ? parseInt(searchParams.get('category')!) : null,
    minPrice: searchParams.get('minPrice') ? parseFloat(searchParams.get('minPrice')!) : null,
    maxPrice: searchParams.get('maxPrice') ? parseFloat(searchParams.get('maxPrice')!) : null,
    location: searchParams.get('location') || null,
    urgency: searchParams.get('urgency') || null,
  })

  // Filter state'i URL'e sync et
  useEffect(() => {
    const params = new URLSearchParams()
    if (filters.categoryId) params.set('category', filters.categoryId.toString())
    // ... diğer filtreler
    router.push(`/?${params.toString()}`, { scroll: false })
  }, [filters, router])

  return (
    <div>
      {/* Hero Section */}
      {/* Filter Sidebar */}
      <FilterSidebar filters={filters} onFiltersChange={setFilters} />
      {/* Filtered Listings */}
      <FilteredListings filters={filters} />
    </div>
  )
}
```

---

### 3. Sticky Navigation ve Smooth Scroll

**Öncelik**: 🟢 Düşük  
**Tahmini Süre**: 3-4 saat  
**Dosyalar**: `src/components/home/StickyNavigation.tsx`

#### Görevler
- [ ] Sticky navigation component
- [ ] Section navigation (scroll to section)
- [ ] Active section indicator
- [ ] Smooth scroll behavior
- [ ] Mobile hamburger menu

---

## 💻 Kod Kalitesi İyileştirmeleri

### 1. FilteredListings Component Refactoring

**Öncelik**: 🔴 Yüksek  
**Tahmini Süre**: 8-10 saat  
**Dosyalar**: `src/components/home/FilteredListings.tsx`, `src/hooks/useFilteredListings.ts`

#### Görevler
- [ ] Custom hook oluştur: `useFilteredListings`
- [ ] Custom hook oluştur: `useInfiniteScroll`
- [ ] Custom hook oluştur: `useListingFavorites`
- [ ] Component'i 200 satır altına indir
- [ ] Logic'i component'ten ayır

#### Kod Yapısı
```
src/
├── components/
│   └── home/
│       └── FilteredListings.tsx (200 satır - sadece UI)
├── hooks/
│   ├── useFilteredListings.ts (API logic)
│   ├── useInfiniteScroll.ts (Scroll logic)
│   └── useListingFavorites.ts (Favorite logic)
```

#### Kod Örneği
```typescript
// src/hooks/useFilteredListings.ts
export function useFilteredListings(
  filters: FilterState,
  sortBy: SortOption,
  userId?: string
) {
  return useInfiniteQuery({
    queryKey: ['filtered-listings', filters, userId, sortBy],
    queryFn: async ({ pageParam = 1 }) => {
      return await listingService.getListingsWithFilters(
        userId || null,
        {
          search: filters.searchQuery,
          categoryId: filters.categoryId,
          minPrice: filters.minPrice,
          maxPrice: filters.maxPrice,
          location: filters.location,
          urgency: filters.urgency,
          sortBy: getSortField(sortBy),
          sortOrder: getSortOrder(sortBy),
        },
        { page: pageParam, limit: 12 }
      )
    },
    getNextPageParam: (lastPage, allPages) => {
      const totalPages = Math.ceil(lastPage.totalCount / 12)
      const nextPage = allPages.length + 1
      return nextPage <= totalPages ? nextPage : undefined
    },
    initialPageParam: 1,
    staleTime: 1 * 60 * 1000,
  })
}

// src/components/home/FilteredListings.tsx
export default function FilteredListings({ filters, onClearFilters }: FilteredListingsProps) {
  const { user } = useAuth()
  const [sortBy, setSortBy] = useState<SortOption>('newest')
  const [view, setView] = useState<ViewType>('grid-3')
  
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
  } = useFilteredListings(filters, sortBy, user?.id)

  const { ref, inView } = useInfiniteScroll({
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  })

  // ... sadece UI logic
}
```

---

### 2. Hardcoded Değerleri Dinamikleştirme

**Öncelik**: 🟡 Orta  
**Tahmini Süre**: 3-4 saat  
**Dosyalar**: `src/app/page.tsx`, `src/services/statsService.ts`

#### Görevler
- [ ] Stats service oluştur
- [ ] API endpoint ekle (GET /api/stats)
- [ ] Homepage stats'ı dinamik çek
- [ ] Cache stratejisi (5 dakika)
- [ ] Fallback değerler

#### Kod Örneği
```typescript
// src/services/statsService.ts
export async function getHomePageStats() {
  const response = await fetch('/api/stats', {
    next: { revalidate: 300 }, // 5 dakika cache
  })
  
  if (!response.ok) {
    return {
      totalListings: 2500,
      totalCategories: 50,
      activeUsers: 1000,
    }
  }
  
  return response.json()
}

// src/app/page.tsx
const stats = await getHomePageStats()

<div className="flex items-center gap-2">
  <TrendingUp className="w-4 h-4" />
  <span>{stats.totalListings.toLocaleString()}+ Aktif İlan</span>
</div>
```

---

### 3. Error Boundary ve Retry Mechanism

**Öncelik**: 🟡 Orta  
**Tahmini Süre**: 4-6 saat  
**Dosyalar**: `src/components/ErrorBoundary.tsx`, `src/hooks/useRetry.ts`

#### Görevler
- [ ] Error Boundary component oluştur
- [ ] Retry mechanism hook
- [ ] Error logging (Sentry)
- [ ] User-friendly error messages
- [ ] Fallback UI

---

## 📱 Mobil UX İyileştirmeleri

### 1. Mobile Filter Sheet

**Öncelik**: 🟡 Orta  
**Tahmini Süre**: 4-6 saat  
**Dosyalar**: `src/components/home/MobileFilterSheet.tsx`

#### Görevler
- [ ] Bottom sheet component
- [ ] FilterSidebar'ı mobile'a adapte et
- [ ] Swipe to close gesture
- [ ] Backdrop blur
- [ ] Smooth animations

---

### 2. Swipe Gestures

**Öncelik**: 🟢 Düşük  
**Tahmini Süre**: 3-4 saat  
**Dosyalar**: `src/hooks/useSwipe.ts`

#### Görevler
- [ ] Swipe hook oluştur
- [ ] Card swipe (favorite, dismiss)
- [ ] Tab swipe navigation
- [ ] Pull to refresh

---

## ♿ Erişilebilirlik İyileştirmeleri

### 1. Keyboard Navigation ve ARIA Labels

**Öncelik**: 🟡 Orta  
**Tahmini Süre**: 6-8 saat  
**Dosyalar**: Tüm component'ler

#### Görevler
- [ ] Tab order optimization
- [ ] Focus management
- [ ] ARIA labels ekle
- [ ] Screen reader support
- [ ] Keyboard shortcuts

#### ARIA Labels Örnekleri
```typescript
<button
  aria-label="Favorilere ekle"
  aria-pressed={isFavorited}
  onClick={handleFavorite}
>
  <Heart className={isFavorited ? 'fill-red-500' : ''} />
</button>

<div role="region" aria-label="İlan listesi">
  {listings.map(listing => (
    <ListingCard key={listing.id} listing={listing} />
  ))}
</div>
```

---

## 🔌 API Optimizasyonları

### 1. Request Deduplication ve Background Refetch

**Öncelik**: 🟡 Orta  
**Tahmini Süre**: 4-6 saat  
**Dosyalar**: `src/services/listingService.ts`, React Query config

#### Görevler
- [ ] Request deduplication
- [ ] Background refetch strategy
- [ ] Stale-while-revalidate pattern
- [ ] Cache invalidation
- [ ] Request cancellation

#### Kod Örneği
```typescript
// src/lib/react-query-config.ts
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1 * 60 * 1000, // 1 dakika
      gcTime: 5 * 60 * 1000, // 5 dakika
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      retry: 2,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
  },
})
```

---

## 📅 Uygulama Sırası

### Faz 1: Performans (1-2 hafta)
1. ✅ Intersection Observer lazy loading
2. ✅ Batch API calls
3. ✅ Critical components önceliklendirme

### Faz 2: Kod Kalitesi (1 hafta)
4. ✅ FilteredListings refactoring
5. ✅ Hardcoded değerleri dinamikleştirme
6. ✅ Error boundary

### Faz 3: SEO ve UX (1-2 hafta)
7. ✅ SSR/SSG implementasyonu
8. ✅ Tab navigation
9. ✅ Ana sayfaya filtreleme

### Faz 4: Mobil ve Erişilebilirlik (1 hafta)
10. ✅ Mobile filter sheet
11. ✅ Keyboard navigation
12. ✅ ARIA labels

---

## 🧪 Test Senaryoları

### Performans Testleri
- [ ] Lighthouse score > 90
- [ ] First Contentful Paint < 1.5s
- [ ] Time to Interactive < 3s
- [ ] Bundle size < 200KB (gzipped)

### Fonksiyonel Testler
- [ ] Infinite scroll çalışıyor
- [ ] Filtreleme doğru çalışıyor
- [ ] Favori sistemi çalışıyor
- [ ] Tab navigation çalışıyor

### Erişilebilirlik Testleri
- [ ] Keyboard navigation çalışıyor
- [ ] Screen reader uyumlu
- [ ] ARIA labels doğru
- [ ] Focus management çalışıyor

### Mobil Testler
- [ ] Mobile filter sheet çalışıyor
- [ ] Swipe gestures çalışıyor
- [ ] Responsive tasarım doğru
- [ ] Touch targets yeterli (44x44px)

---

## 📊 Başarı Metrikleri

### Performans
- **Lighthouse Score**: 90+ (şu an: ~75)
- **First Contentful Paint**: < 1.5s
- **Time to Interactive**: < 3s
- **Bundle Size**: < 200KB

### Kullanıcı Deneyimi
- **Bounce Rate**: %30 altına düşür
- **Time on Page**: %20 artış
- **Scroll Depth**: %80'e çıkar
- **Filter Usage**: %40'a çıkar

### Teknik
- **Component Complexity**: < 200 satır
- **Test Coverage**: > 80%
- **Error Rate**: < 0.1%
- **API Response Time**: < 500ms

---

## 📝 Notlar

- Her faz sonrası code review yapılmalı
- Production'a deploy öncesi staging'de test edilmeli
- Performance monitoring eklenmeli
- User feedback toplanmalı

---

**Son Güncelleme**: 2025-01-XX  
**Durum**: Planlama Tamamlandı  
**Sonraki Adım**: Faz 1 - Performans İyileştirmeleri

