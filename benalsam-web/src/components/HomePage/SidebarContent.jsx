import React, { Suspense } from 'react';
import { Filter, Settings, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { categoriesConfig } from '@/config/categories';

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
  return (
    <div className="p-4 rounded-lg bg-card border shadow-sm hover:shadow-md transition-shadow duration-200 pb-8">
      <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
        <Filter className="w-5 h-5 text-primary" />
        Kategoriler
      </h3>
      
      <Suspense fallback={<LoadingFallback />}>
        <CategorySearch
          categories={categoriesConfig}
          onSelect={handleCategoryClick}
          selectedPath={selectedCategoryPath}
          getCategoryCount={getCategoryCount}
          isLoadingCounts={isLoadingCounts}
        />
      </Suspense>
      
      <div className="mt-4">
        <div className="space-y-1">
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
            {categoriesConfig.map(cat => (
              <CategoryItem 
                key={cat.name} 
                category={cat} 
                onSelect={handleCategoryClick} 
                selectedPath={selectedCategoryPath}
                getCategoryCount={getCategoryCount}
                isLoadingCounts={isLoadingCounts}
              />
            ))}
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
            max={10000}
            min={0}
            step={100}
            className="mb-3"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span className="bg-background px-2 py-1 rounded">₺{filters.priceRange[0].toLocaleString()}</span>
            <span className="bg-background px-2 py-1 rounded">₺{filters.priceRange[1].toLocaleString()}</span>
          </div>
          <div className="flex flex-wrap gap-1 mt-2">
            {[1000, 5000, 10000].map(price => (
              <button
                key={price}
                onClick={() => setFilters(prev => ({ ...prev, priceRange: [0, price] }))}
                className="text-xs bg-background hover:bg-primary/10 px-2 py-1 rounded transition-colors"
              >
                ₺{price.toLocaleString()}+
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
