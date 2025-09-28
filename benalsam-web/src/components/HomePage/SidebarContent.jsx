import React, { Suspense, useState, useEffect } from 'react';
import { Filter, Settings, X, Clock, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import dynamicCategoryService from '@/services/dynamicCategoryService';
import { useRecentCategories } from '@/hooks/useRecentCategories';

// Lazy load components
const CategorySearch = React.lazy(() => import('./CategorySearch'));
const CategoryItem = React.lazy(() => import('./CategoryItem'));

// Loading fallback
const LoadingFallback = () => (
  <div className="flex items-center justify-center p-4">
    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
  </div>
);

const SidebarContent = ({
  selectedCategories,
  selectedCategoryPath,
  filters,
  setFilters,
  handleCategoryClick,
  handleCategorySelect,
  clearFilters,
  isAnyFilterActive,
  getCategoryCount,
  isLoadingCounts
}) => {
  const [categories, setCategories] = useState([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [popularCategories, setPopularCategories] = useState([]);
  const [isLoadingPopular, setIsLoadingPopular] = useState(false);
  
  // Recent categories hook
  const { 
    recentCategories, 
    addRecentCategory, 
    clearRecentCategories,
    getRecentCategoriesWithInfo 
  } = useRecentCategories();

  // Load categories from dynamic service
  useEffect(() => {
    const loadCategories = async () => {
      try {
        setIsLoadingCategories(true);
        console.log('🔄 Loading categories from dynamic service...');
        const fetchedCategories = await dynamicCategoryService.getCategoryTree();
        console.log('📦 Categories loaded:', fetchedCategories);
        setCategories(fetchedCategories);
      } catch (error) {
        console.error('Error loading categories:', error);
        setCategories([]);
      } finally {
        setIsLoadingCategories(false);
      }
    };

    loadCategories();
  }, []);

  // Load popular categories
  useEffect(() => {
    const loadPopularCategories = async () => {
      try {
        setIsLoadingPopular(true);
        const CATEGORIES_SERVICE_URL = import.meta.env.VITE_CATEGORIES_SERVICE_URL || 'http://localhost:3015';
        const response = await fetch(`${CATEGORIES_SERVICE_URL}/api/v1/categories/popular?limit=5`);
        
        if (response.ok) {
          const result = await response.json();
          setPopularCategories(result.data || []);
        }
      } catch (error) {
        console.error('Error loading popular categories:', error);
        setPopularCategories([]);
      } finally {
        setIsLoadingPopular(false);
      }
    };

    loadPopularCategories();
  }, []);

  // Enhanced category click handler
  const handleCategoryClickWithRecent = (category) => {
    // Add to recent categories
    addRecentCategory(category);
    
    // Call original handler
    handleCategoryClick(category);
  };
  return (
    <div className="p-4 rounded-lg bg-card border shadow-sm hover:shadow-md transition-all duration-200 pb-8">
      <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
        <Filter className="w-5 h-5 text-primary" />
        Kategoriler
      </h3>
      
      <Suspense fallback={<LoadingFallback />}>
        <CategorySearch
          categories={categories}
          onSelect={handleCategoryClickWithRecent}
          selectedPath={selectedCategoryPath}
          getCategoryCount={getCategoryCount}
          isLoadingCounts={isLoadingCounts}
        />
      </Suspense>
      
      <div className="mt-4">
        <div className="space-y-1">
          {/* Son Görüntülenen Kategoriler */}
          {recentCategories.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Son Görüntülenen
              </h4>
              <div className="space-y-1">
                {recentCategories.slice(0, 3).map(category => (
                  <div
                    key={`recent-${category.id}`}
                    className={cn(
                      "flex items-center justify-between py-1.5 px-2 rounded-md cursor-pointer transition-colors text-xs",
                      "hover:bg-accent hover:shadow-sm",
                      selectedCategoryPath.some(cat => cat.id === category.id) && "bg-primary/10 text-primary font-semibold border border-primary/20"
                    )}
                    onClick={() => handleCategoryClickWithRecent(category)}
                  >
                    <span className="truncate">{category.name}</span>
                    <span className="text-xs bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full">
                      {isLoadingCounts ? '...' : getCategoryCount(category.id)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Popüler Kategoriler */}
          {popularCategories.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-1">
                <Star className="w-3 h-3" />
                Popüler
              </h4>
              <div className="space-y-1">
                {popularCategories.slice(0, 3).map(category => (
                  <div
                    key={`popular-${category.id}`}
                    className={cn(
                      "flex items-center justify-between py-1.5 px-2 rounded-md cursor-pointer transition-colors text-xs",
                      "hover:bg-accent hover:shadow-sm",
                      selectedCategoryPath.some(cat => cat.id === category.id) && "bg-primary/10 text-primary font-semibold border border-primary/20"
                    )}
                    onClick={() => handleCategoryClickWithRecent(category)}
                  >
                    <span className="truncate">{category.name}</span>
                    <span className="text-xs bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full">
                      {category.listing_count || 0}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div
            className={cn(
              "flex items-center justify-between py-2 px-3 rounded-md cursor-pointer transition-colors text-sm",
              "hover:bg-accent hover:shadow-sm",
              selectedCategoryPath.length === 0 && "bg-primary/10 text-primary font-semibold border border-primary/20"
            )}
            onClick={() => handleCategorySelect([])}
          >
            <span>Tüm Kategoriler</span>
            <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">
              {isLoadingCounts ? '...' : getCategoryCount([])}
            </span>
          </div>
          <Suspense fallback={<LoadingFallback />}>
            {isLoadingCategories ? (
              <div className="flex items-center justify-center py-4">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
              </div>
            ) : (
              categories.map(cat => (
                <CategoryItem 
                  key={`sidebar-category-${cat.id}`} 
                  category={cat} 
                  onSelect={handleCategoryClickWithRecent} 
                  selectedPath={selectedCategoryPath}
                  parentPath={[]}
                  getCategoryCount={getCategoryCount}
                  isLoadingCounts={isLoadingCounts}
                />
              ))
            )}
          </Suspense>
        </div>
      </div>
      
      <hr className="my-6" />
      
      <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
        <Settings className="w-5 h-5 text-primary" />
        Filtreler
      </h3>
      
      <div className="space-y-6">
        <div className="bg-muted/30 rounded-lg p-3">
          <label className="block text-sm font-medium mb-3">💰 Fiyat Aralığı</label>
          <Slider
            value={filters.priceRange}
            onValueChange={(value) => setFilters(prev => ({ ...prev, priceRange: value }))}
            max={50000}
            min={0}
            step={500}
            className="mb-3"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span className="bg-background px-2 py-1 rounded">₺{filters.priceRange[0].toLocaleString()}</span>
            <span className="bg-background px-2 py-1 rounded">₺{filters.priceRange[1].toLocaleString()}</span>
          </div>
          <div className="flex flex-wrap gap-1 mt-2">
            {[
              { label: '₺1K+', value: 1000 },
              { label: '₺5K+', value: 5000 },
              { label: '₺10K+', value: 10000 },
              { label: '₺25K+', value: 25000 },
              { label: '₺50K+', value: 50000 }
            ].map(price => (
              <button
                key={price.value}
                onClick={() => setFilters(prev => ({ ...prev, priceRange: [0, price.value] }))}
                className="text-xs bg-background hover:bg-primary/10 px-2 py-1 rounded transition-colors"
              >
                {price.label}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-1 mt-2">
            {[
              { label: '₺0-1K', range: [0, 1000] },
              { label: '₺1K-5K', range: [1000, 5000] },
              { label: '₺5K-10K', range: [5000, 10000] },
              { label: '₺10K-25K', range: [10000, 25000] },
              { label: '₺25K+', range: [25000, 50000] }
            ].map(price => (
              <button
                key={price.label}
                onClick={() => setFilters(prev => ({ ...prev, priceRange: price.range }))}
                className="text-xs bg-background hover:bg-primary/10 px-2 py-1 rounded transition-colors"
              >
                {price.label}
              </button>
            ))}
          </div>
        </div>
        
        <div className="bg-muted/30 rounded-lg p-3">
          <label className="block text-sm font-medium mb-2">📍 Konum</label>
          <Input
            placeholder="Şehir, ilçe..."
            value={filters.location}
            onChange={(e) => setFilters(prev => ({ ...prev, location: e.target.value }))}
            className="bg-background"
          />
        </div>
        
        <div className="bg-muted/30 rounded-lg p-3">
          <label className="block text-sm font-medium mb-2">🚨 Acil Durum</label>
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="urgent"
              checked={filters.urgency === 'Acil'}
              onChange={(e) => setFilters(prev => ({ 
                ...prev, 
                urgency: e.target.checked ? 'Acil' : '' 
              }))}
              className="rounded border-gray-300 text-primary focus:ring-primary"
            />
            <label htmlFor="urgent" className="text-sm cursor-pointer">
              Sadece acil ilanları göster
            </label>
          </div>
        </div>
        
        <div className="bg-muted/30 rounded-lg p-3">
          <label className="block text-sm font-medium mb-2">📅 Tarih Filtresi</label>
          <Select
            value={filters.dateRange || ''}
            onValueChange={(value) => setFilters(prev => ({ ...prev, dateRange: value }))}
          >
            <SelectTrigger className="bg-background">
              <SelectValue placeholder="Tarih seçin" />
            </SelectTrigger>
                                  <SelectContent>
                        <SelectItem value="all">Tüm tarihler</SelectItem>
                        <SelectItem value="1">Son 1 gün</SelectItem>
                        <SelectItem value="7">Son 1 hafta</SelectItem>
                        <SelectItem value="30">Son 1 ay</SelectItem>
                        <SelectItem value="90">Son 3 ay</SelectItem>
                      </SelectContent>
          </Select>
        </div>
        
        {isAnyFilterActive && (
          <Button onClick={clearFilters} variant="outline" className="w-full text-primary border-primary/20 hover:bg-primary/5">
            <X className="w-4 h-4 mr-2" />
            Filtreleri Temizle
          </Button>
        )}
      </div>
    </div>
  );
};

export default SidebarContent;
