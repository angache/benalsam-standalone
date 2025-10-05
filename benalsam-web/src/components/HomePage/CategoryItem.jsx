
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronRight, 
  Smartphone, 
  Laptop, 
  Gamepad2, 
  Camera, 
  Music, 
  Wrench, 
  Car, 
  Building, 
  Home, 
  Shirt, 
  Dumbbell, 
  GraduationCap, 
  Briefcase, 
  Palette, 
  Baby, 
  Heart, 
  Plane, 
  Bitcoin, 
  Star, 
  Utensils, 
  Book, 
  MoreHorizontal 
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Icon mapping - normal import
const ICON_COMPONENTS = {
  'Smartphone': Smartphone,
  'Laptop': Laptop,
  'Gamepad2': Gamepad2,
  'Camera': Camera,
  'Music': Music,
  'Wrench': Wrench,
  'Car': Car,
  'Building': Building,
  'Home': Home,
  'Shirt': Shirt,
  'Dumbbell': Dumbbell,
  'GraduationCap': GraduationCap,
  'Briefcase': Briefcase,
  'Palette': Palette,
  'Baby': Baby,
  'Heart': Heart,
  'Plane': Plane,
  'Bitcoin': Bitcoin,
  'Star': Star,
  'Utensils': Utensils,
  'Book': Book,
  'MoreHorizontal': MoreHorizontal
};

const CategoryItem = ({ category, level = 0, onSelect, selectedPath = [], getCategoryCount, isLoadingCounts, parentPath = [] }) => {
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
    const fullPath = [...parentPath, category.name];
    
    // Kategori objesine ID ekle
    const categoryWithId = {
      ...category,
      id: category.id || null // Eğer yoksa null bırak, HomePage'de bulacak
    };
    
    console.log('🔍 CategoryItem handleSelect - Category:', categoryWithId, 'Level:', level, 'FullPath:', fullPath);
    onSelect(categoryWithId, level, fullPath);
  };

  const handleToggle = (e) => {
    e.stopPropagation();
    if (hasSubcategories) {
      setIsOpen(!isOpen);
    }
  };

  // Kategori sayısını al - sadece ID ile
  const getCategoryCountValue = () => {
    if (getCategoryCount && category.id) {
      const count = getCategoryCount(category.id);
      console.log(`🔍 CategoryItem - ${category.name} (ID: ${category.id}): ${count}`);
      return count;
    }
    console.log(`🔍 CategoryItem - ${category.name} (ID: ${category.id}): No ID or getCategoryCount`);
    return 0;
  };

  // Icon component'ini al
  const IconComponent = category.icon && ICON_COMPONENTS[category.icon] ? 
    ICON_COMPONENTS[category.icon] : 
    ICON_COMPONENTS['MoreHorizontal'];

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
          <IconComponent className="w-4 h-4" />
          <span>{category.name}</span>
        </span>
        {getCategoryCount && !isLoadingCounts && getCategoryCountValue() > 0 && (
          <motion.span 
            className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            {getCategoryCountValue()}
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
                parentPath={[...parentPath, category.name]}
                getCategoryCount={getCategoryCount}
                isLoadingCounts={isLoadingCounts}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CategoryItem;
