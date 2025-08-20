import React, { useState, useMemo } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const CategorySearch = ({ categories, onSelect, selectedPath = [], getCategoryCount, isLoadingCounts }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);

  // Kategori arama fonksiyonu
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return [];
    
    const query = searchQuery.toLowerCase();
    const results = [];
    
    const searchInCategory = (category, path = []) => {
      const currentPath = [...path, category.name];
      const fullPath = currentPath.join(' > ');
      
      // Kategori adında arama
      if (category.name.toLowerCase().includes(query)) {
        results.push({
          ...category,
          path: currentPath,
          fullPath,
          matchType: 'exact'
        });
      }
      
      // Alt kategorilerde arama
      if (category.subcategories) {
        category.subcategories.forEach(sub => {
          searchInCategory(sub, currentPath);
        });
      }
    };
    
    categories.forEach(category => {
      searchInCategory(category);
    });
    
    return results.slice(0, 8); // Maksimum 8 sonuç
  }, [searchQuery, categories]);

  const handleSelect = (category) => {
    onSelect(category, category.path.length - 1);
    setSearchQuery('');
    setIsExpanded(false);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setIsExpanded(false);
  };

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Kategori ara..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setIsExpanded(e.target.value.length > 0);
          }}
          className="pl-10 pr-10 h-9 text-sm"
          onFocus={() => setIsExpanded(searchQuery.length > 0)}
        />
        {searchQuery && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearSearch}
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0"
          >
            <X className="w-3 h-3" />
          </Button>
        )}
      </div>
      
      {/* Arama Sonuçları */}
      {isExpanded && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-card border rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
          {filteredCategories.length > 0 ? (
            <div className="p-2">
              {filteredCategories.map((category, index) => (
                <div
                  key={`${category.fullPath}-${index}`}
                  onClick={() => handleSelect(category)}
                  className={cn(
                    "flex items-center justify-between p-2 rounded-md cursor-pointer text-sm",
                    "hover:bg-accent transition-colors"
                  )}
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    {category.icon && <category.icon className="w-4 h-4 flex-shrink-0" />}
                    <span className="truncate">{category.fullPath}</span>
                  </div>
                  {getCategoryCount && (
                    <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full flex-shrink-0">
                      {isLoadingCounts ? '...' : getCategoryCount(category.path)}
                    </span>
                  )}
                </div>
              ))}
            </div>
          ) : searchQuery.length > 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              "{searchQuery}" için sonuç bulunamadı
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};

export default CategorySearch;
