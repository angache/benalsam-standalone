
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const CategoryItem = ({ category, level = 0, onSelect, selectedPath = [], getCategoryCount, isLoadingCounts }) => {
  const [isOpen, setIsOpen] = useState(() => {
    if (selectedPath.length > level) {
      return selectedPath[level] === category.name;
    }
    return false;
  });

  const isSelected = selectedPath.length === level + 1 && selectedPath[level] === category.name;
  const isPartiallySelected = selectedPath.length > level + 1 && selectedPath[level] === category.name;
  const hasSubcategories = category.subcategories && category.subcategories.length > 0;

  useEffect(() => {
    if (selectedPath.length > level) {
      setIsOpen(selectedPath[level] === category.name);
    } else {
      setIsOpen(false);
    }
  }, [selectedPath, level, category.name]);

  const handleSelect = (e) => {
    e.stopPropagation();
    onSelect(category, level);
  };

  const handleToggle = (e) => {
    e.stopPropagation();
    if (hasSubcategories) {
      setIsOpen(!isOpen);
    }
  };

  return (
    <div className="text-sm">
      <motion.div
        className={cn(
          "flex items-center justify-between py-2 px-3 rounded-md cursor-pointer transition-all duration-200",
          "hover:bg-accent hover:shadow-sm hover:scale-[1.02]",
          "active:scale-[0.98]",
          isSelected && "bg-primary/10 text-primary font-semibold shadow-sm border border-primary/20",
          isPartiallySelected && "bg-accent shadow-sm"
        )}
        style={{ paddingLeft: `${level * 1.25 + 0.75}rem` }}
        onClick={handleSelect}
        whileHover={{ x: 2 }}
        whileTap={{ scale: 0.98 }}
      >
        <span className="flex items-center gap-2">
          {category.icon && <category.icon className="w-4 h-4" />}
          <span>{category.name}</span>
        </span>
        {getCategoryCount && (
          <motion.span 
            className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            {isLoadingCounts ? (
              <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            ) : (
              getCategoryCount([category.name])
            )}
          </motion.span>
        )}
        {hasSubcategories && (
          <button onClick={handleToggle} className="p-1 rounded-full hover:bg-primary/10">
            <ChevronRight className={cn("w-4 h-4 transition-transform", isOpen && "rotate-90")} />
          </button>
        )}
      </motion.div>
      <AnimatePresence>
        {isOpen && hasSubcategories && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            {category.subcategories.map(subCategory => (
              <CategoryItem
                key={subCategory.name}
                category={subCategory}
                level={level + 1}
                onSelect={onSelect}
                selectedPath={selectedPath}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CategoryItem;
