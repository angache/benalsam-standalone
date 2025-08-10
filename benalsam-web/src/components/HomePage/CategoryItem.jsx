
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const CategoryItem = ({ category, level = 0, onSelect, selectedPath = [] }) => {
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
      <div
        className={cn(
          "flex items-center justify-between py-2 px-3 rounded-md cursor-pointer transition-colors",
          "hover:bg-accent",
          isSelected && "bg-primary/10 text-primary font-semibold",
          isPartiallySelected && "bg-accent"
        )}
        style={{ paddingLeft: `${level * 1.25 + 0.75}rem` }}
        onClick={handleSelect}
      >
        <span className="flex items-center gap-2">
          {category.icon && <category.icon className="w-4 h-4" />}
          <span>{category.name}</span>
        </span>
        {hasSubcategories && (
          <button onClick={handleToggle} className="p-1 rounded-full hover:bg-primary/10">
            <ChevronRight className={cn("w-4 h-4 transition-transform", isOpen && "rotate-90")} />
          </button>
        )}
      </div>
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
