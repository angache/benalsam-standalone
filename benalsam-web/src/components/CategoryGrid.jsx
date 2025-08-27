import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, Smartphone } from 'lucide-react';
import dynamicCategoryService from '@/services/dynamicCategoryService';
import { checkCategoriesVersion } from '@/services/cacheVersionService.js';

const CategoryGrid = ({ selectedCategories, onCategorySelect, searchQuery }) => {
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const isSearching = searchQuery && searchQuery.trim().length > 1;

  // Load categories from dynamic service
  useEffect(() => {
    const loadCategories = async () => {
      try {
        setIsLoading(true);
        setError(null);
        console.log('🔄 Loading categories from dynamic service...');
        
        // Cache version kontrolü
        const versionChanged = await checkCategoriesVersion();
        if (versionChanged) {
          console.log('🔄 Cache version changed, reloading categories...');
        }
        
        const fetchedCategories = await dynamicCategoryService.getCategoryTree();
        console.log('📦 Categories loaded:', fetchedCategories);
        setCategories(fetchedCategories);
      } catch (error) {
        console.error('Error loading categories:', error);
        setError('Kategoriler yüklenirken sorun oluştu. Lütfen sayfayı yenileyin.');
        setCategories([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadCategories();
  }, []);

  const getDisplayedCategories = () => {
    if (isSearching) {
      const allCategories = [];
      const searchRecursive = (cats, path = [], parentData = {}) => {
        for (const cat of cats) {
          const currentPath = [...path, cat.name];
          const categoryData = {
            ...cat,
            path: currentPath,
            icon: cat.icon || parentData.icon,
            color: cat.color || parentData.color,
          };

          if (cat.name.toLowerCase().includes(searchQuery.toLowerCase())) {
            allCategories.push(categoryData);
          }
          
          if (cat.subcategories) {
            searchRecursive(cat.subcategories, currentPath, { icon: categoryData.icon, color: categoryData.color });
          }
        }
      };

      searchRecursive(categories);
      return allCategories;
    }

    if (!selectedCategories || selectedCategories.length === 0) {
      return categories;
    }
    const lastSelected = selectedCategories[selectedCategories.length - 1];
    return lastSelected.subcategories || [];
  };
  
  const displayedCategories = getDisplayedCategories();

  const handleCategoryClick = (category) => {
    if (isSearching) {
      let currentLevel = categories;
      const categoryObjectsPath = [];
      for (const part of category.path) {
        const catObj = currentLevel.find(c => c.name === part);
        if (catObj) {
          categoryObjectsPath.push(catObj);
          currentLevel = catObj.subcategories || [];
        } else {
          break;
        }
      }
      onCategorySelect(categoryObjectsPath);
    } else {
      const currentPath = selectedCategories.map(c => c.name);
      const existingIndex = currentPath.indexOf(category.name);
      if (existingIndex !== -1) {
        onCategorySelect(selectedCategories.slice(0, existingIndex + 1));
        return;
      }

      if (selectedCategories.length === 0 || selectedCategories[selectedCategories.length -1].subcategories?.find(sub => sub.name === category.name)) {
         onCategorySelect([...selectedCategories, category]);
      } else {
          onCategorySelect([category]);
      }
    }
  };
  
  return (
    <div className="px-2 sm:px-0">
      {!isSearching && selectedCategories && selectedCategories.length > 0 && (
        <div className="mb-3 sm:mb-4 flex items-center flex-wrap text-xs sm:text-sm text-muted-foreground px-1">
          <span
            className="cursor-pointer hover:text-primary transition-colors"
            onClick={() => onCategorySelect([])}
          >
            Tüm Kategoriler
          </span>
          <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 mx-1" />
          {selectedCategories.map((cat, index) => (
            <React.Fragment key={cat.name}>
              <span 
                className={`cursor-pointer hover:text-primary transition-colors ${index === selectedCategories.length - 1 ? 'text-primary font-semibold' : ''}`}
                onClick={() => onCategorySelect(selectedCategories.slice(0, index + 1))}
              >
                {cat.name}
              </span>
              {index < selectedCategories.length - 1 && <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 mx-1" />}
            </React.Fragment>
          ))}
           {displayedCategories.length > 0 && !isSearching && <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 mx-1" /> }
           {displayedCategories.length > 0 && !isSearching && <span className="text-foreground">Alt Kategori Seçin</span>}
        </div>
      )}

      {isSearching && displayedCategories.length > 0 && (
        <div className="mb-3 sm:mb-4 text-sm text-muted-foreground px-1">
          "{searchQuery}" için arama sonuçları:
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground mt-2">Kategoriler yükleniyor...</p>
        </div>
      ) : error ? (
        <div className="text-center py-8">
          <div className="text-red-500 mb-2">⚠️</div>
          <p className="text-foreground mb-2">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            Sayfayı Yenile
          </button>
        </div>
      ) : displayedCategories.length > 0 ? (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
          {displayedCategories.map((category) => {
            const parent = !isSearching && selectedCategories.length > 0 ? selectedCategories[selectedCategories.length-1] : null;
            const Icon = category.icon || parent?.icon || Smartphone;
            const color = category.color || parent?.color || 'from-slate-500 to-gray-500';
            const isSelected = !isSearching && selectedCategories[selectedCategories.length -1]?.name === category.name;
            
            return (
              <motion.div
                key={isSearching ? category.path.join('-') : category.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: Math.random() * 0.1 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleCategoryClick(category)}
                className={`category-card rounded-xl p-2 sm:p-3 cursor-pointer text-center ${
                  isSelected ? 'ring-2 ring-primary bg-primary/20' : ''
                }`}
              >
                <div className={`w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 rounded-lg sm:rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mb-2 mx-auto`}>
                  <Icon className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 text-white" />
                </div>
                <div className="text-foreground font-semibold text-xs sm:text-sm leading-tight h-10 flex flex-col items-center justify-center px-1">
                  <span>{category.name}</span>
                  {isSearching && category.path.length > 1 && (
                      <span className="text-muted-foreground font-normal text-[10px] block truncate w-full">
                          ({category.path.slice(0, -1).join(' > ')})
                      </span>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : isSearching ? (
         <div className="text-center py-4 sm:py-6 lg:py-8 glass-effect rounded-xl lg:rounded-2xl mx-1">
            <p className="text-sm sm:text-base lg:text-lg text-foreground">"{searchQuery}" için kategori bulunamadı.</p>
            <p className="text-muted-foreground mt-1 sm:mt-2 text-xs sm:text-sm">Farklı bir anahtar kelime deneyin.</p>
         </div>
      ) : selectedCategories.length > 0 && displayedCategories.length === 0 ? (
         <div className="text-center py-4 sm:py-6 lg:py-8 glass-effect rounded-xl lg:rounded-2xl mx-1">
            <p className="text-sm sm:text-base lg:text-lg text-foreground">Bu kategoride daha fazla alt kategori bulunmamaktadır.</p>
            <p className="text-muted-foreground mt-1 sm:mt-2 text-xs sm:text-sm">Yukarıdaki seçimle devam edebilir veya değiştirebilirsiniz.</p>
         </div>
      ): null}
    </div>
  );
};

export default CategoryGrid;