
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ChevronRight, Smartphone, ChevronDown, ChevronUp } from 'lucide-react';
// import { categoriesConfig } from '@/config/categories'; // Removed - using dynamic categories
import dynamicCategoryService from '@/services/dynamicCategoryService';

const MobileCategoryScroller = ({ selectedCategories, onCategorySelect }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [categories, setCategories] = useState([]);

  // Load categories dynamically
  React.useEffect(() => {
    const loadCategories = async () => {
      try {
        const fetchedCategories = await dynamicCategoryService.getCategories();
        setCategories(fetchedCategories);
      } catch (error) {
        console.error('Error loading categories:', error);
        setCategories([]);
      }
    };

    loadCategories();
  }, []);

  const displayedCategories = useMemo(() => {
    if (!selectedCategories || selectedCategories.length === 0) {
      return categories;
    }
    const lastSelected = selectedCategories[selectedCategories.length - 1];
    return lastSelected.subcategories || [];
  }, [selectedCategories]);

  const handleSelect = (category) => {
    const newPath = [...selectedCategories, category];
    onCategorySelect(newPath);
  };

  const categoriesToShow = isExpanded ? displayedCategories : displayedCategories.slice(0, 4);
  const canExpand = displayedCategories.length > 4;

  return (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-3 px-2 sm:px-0">
        <h3 className="font-bold text-lg">Kategoriler</h3>
        {selectedCategories.length > 0 && (
          <Button variant="link" size="sm" onClick={() => onCategorySelect([])}>
            Tümünü Gör
          </Button>
        )}
      </div>

      {selectedCategories.length > 0 && (
        <div className="mb-3 px-2 sm:px-0 flex items-center flex-wrap text-xs text-muted-foreground">
          {selectedCategories.map((cat, index) => (
            <React.Fragment key={cat.name}>
              <span
                className={`cursor-pointer hover:text-primary transition-colors ${
                  index === selectedCategories.length - 1 ? 'text-primary font-semibold' : ''
                }`}
                onClick={() => onCategorySelect(selectedCategories.slice(0, index + 1))}
              >
                {cat.name}
              </span>
              {index < selectedCategories.length - 1 && <ChevronRight className="w-3 h-3 mx-1" />}
            </React.Fragment>
          ))}
        </div>
      )}

      <motion.div layout className="grid grid-cols-4 gap-3">
        <AnimatePresence>
          {categoriesToShow.map((category) => {
            const parent = selectedCategories.length > 0 ? selectedCategories[selectedCategories.length - 1] : null;
            const Icon = category.icon || parent?.icon || Smartphone;
            const color = category.color || parent?.color || 'from-slate-500 to-gray-500';

            return (
              <motion.div
                layout
                key={category.name}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                whileHover={{ y: -2 }}
                onClick={() => handleSelect(category)}
                className="flex flex-col items-center p-1 rounded-lg cursor-pointer category-card"
              >
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mb-2`}>
                  <Icon className="w-7 h-7 text-white" />
                </div>
                <p className="text-center text-xs font-semibold leading-tight h-8 flex items-center justify-center">
                  {category.name}
                </p>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </motion.div>

      {canExpand && (
        <div className="mt-4 text-center">
          <Button variant="ghost" onClick={() => setIsExpanded(!isExpanded)} className="text-primary w-full flex items-center justify-center">
            {isExpanded ? 'Daha Az Gör' : 'Daha Fazla Gör'}
            {isExpanded ? <ChevronUp className="w-4 h-4 ml-2" /> : <ChevronDown className="w-4 h-4 ml-2" />}
          </Button>
        </div>
      )}

      {selectedCategories.length > 0 && displayedCategories.length === 0 && (
        <div className="text-center py-4 glass-effect rounded-xl mx-2 sm:mx-0">
          <p className="text-sm text-foreground">Bu kategoride alt kategori bulunmamaktadır.</p>
        </div>
      )}
    </div>
  );
};

export default MobileCategoryScroller;
