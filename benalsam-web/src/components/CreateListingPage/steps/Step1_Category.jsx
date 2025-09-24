import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, ChevronRight, CheckCircle, Home, Box, Loader2, Smartphone, Laptop, Gamepad2, Camera, Music, Wrench, Car, Building, Shirt, Dumbbell, GraduationCap, Briefcase, Palette, Baby, Heart, Plane, Bitcoin, Star, Utensils, Book } from 'lucide-react';

// Icon mapping for categories
const ICON_MAPPING = {
  'Elektronik': Smartphone,
  'Telefon': Smartphone,
  'Bilgisayar': Laptop,
  'Oyun Konsolu': Gamepad2,
  'Kamera & Fotoğraf': Camera,
  'TV & Ses Sistemleri': Music,
  'Diğer Elektronik': Wrench,
  'Araç & Vasıta': Car,
  'Otomobil': Car,
  'Motosiklet': Car,
  'Bisiklet': Car,
  'Ticari Araçlar': Car,
  'Yedek Parça & Aksesuar': Wrench,
  'Emlak': Building,
  'Konut': Home,
  'Ticari': Building,
  'Arsa': Building,
  'Bina': Building,
  'Turistik Tesis': Building,
  'Moda': Shirt,
  'Giyim': Shirt,
  'Ayakkabı': Shirt,
  'Aksesuar': Shirt,
  'Ev & Yaşam': Home,
  'Mobilya': Home,
  'Dekorasyon': Home,
  'Ev Aletleri': Wrench,
  'Spor & Outdoor': Dumbbell,
  'Eğitim & Kitap': GraduationCap,
  'Hizmetler': Briefcase,
  'Sanat & Hobi': Palette,
  'Anne & Bebek': Baby,
  'Oyun & Eğlence': Gamepad2,
  'Sağlık & Güzellik': Heart,
  'İş & Endüstri': Briefcase,
  'Seyahat': Plane,
  'Kripto & Finans': Bitcoin,
  'Koleksiyon & Değerli Eşyalar': Star,
  'Yemek & İçecek': Utensils,
  'Hayvanlar': Heart,
  'Bahçe & Tarım': Home,
  'Teknoloji': Smartphone,
  'Müzik': Music,
  'Kitap': Book,
  'Film & TV': Camera,
};

// Helper function to find category by name
const findCategoryByName = (categories, name) => {
  for (const cat of categories) {
    if (cat.name === name) return cat;
    if (cat.subcategories) {
      const found = findCategoryByName(cat.subcategories, name);
      if (found) return found;
    }
  }
  return null;
};

const CategoryCard = ({ category, onClick, parentCategory }) => {
  const Icon = ICON_MAPPING[category.name] || Box;
  const color = category.color || parentCategory?.color || 'from-slate-400 to-slate-500';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      whileHover={{ scale: 1.05, y: -5 }}
      transition={{ duration: 0.2 }}
      onClick={() => onClick(category)}
      className="flex flex-col items-center justify-center p-4 text-center rounded-lg cursor-pointer glass-effect card-hover"
    >
      <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 bg-gradient-to-br ${color}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <span className="text-sm font-medium text-foreground">{category.name}</span>
    </motion.div>
  );
};

const Step1_Category = ({
  categories,
  isLoadingCategories,
  selectedMainCategory, onMainChange,
  selectedSubCategory, onSubChange,
  selectedSubSubCategory, onSubSubChange,
  errors
}) => {
  const [history, setHistory] = useState([]);
  const [currentCategories, setCurrentCategories] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  const parentPath = useMemo(() => history.map(h => h.name).join(' > '), [history]);
  const parentCategory = useMemo(() => (parentPath ? findCategoryByName(categories, parentPath) : null), [parentPath, categories]);

  // Update current categories when categories prop changes
  useEffect(() => {
    if (categories.length > 0) {
      console.log('🔍 DEBUG: Categories loaded', { 
        categoriesCount: categories.length,
        firstCategory: categories[0],
        firstCategorySubcategories: categories[0]?.subcategories 
      });
      setCurrentCategories(categories);
    }
  }, [categories]);

  const allCategoryPaths = useMemo(() => {
    const paths = [];
    const recurse = (categories, parentPath = []) => {
      categories.forEach(cat => {
        const currentPath = [...parentPath, cat.name];
        paths.push({
          name: cat.name,
          path: currentPath.join(' > '),
          fullPath: currentPath,
        });
        if (cat.subcategories) {
          recurse(cat.subcategories, currentPath);
        }
      });
    };
    recurse(categories);
    return paths;
  }, [categories]);
  
  const filteredCategories = useMemo(() => {
    if (!searchQuery) return [];
    return allCategoryPaths.filter(p => p.path.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 10);
  }, [searchQuery, allCategoryPaths]);

  const selectCategory = (category) => {
    console.log('🔍 DEBUG: selectCategory called', { 
      categoryName: category.name, 
      hasSubcategories: !!category.subcategories,
      subcategories: category.subcategories 
    });
    
    const newHistory = [...history, { name: category.name, list: currentCategories }];
    setHistory(newHistory);
    const path = newHistory.map(h => h.name);
    onMainChange(path[0] || '');
    onSubChange(path[1] || '');
    onSubSubChange(path[2] || '');
    setCurrentCategories(category.subcategories || []);
  };
  
  const selectSearchedCategory = (pathArray) => {
    onMainChange(pathArray[0] || '');
    onSubChange(pathArray[1] || '');
    onSubSubChange(pathArray[2] || '');
    setSearchQuery('');

    let currentLevel = categoriesConfig;
    const newHistory = [];
    for (const catName of pathArray) {
        const cat = currentLevel.find(c => c.name === catName);
        if (cat) {
            newHistory.push({ name: cat.name, list: currentLevel });
            currentLevel = cat.subcategories || [];
        }
    }
    setHistory(newHistory);
    setCurrentCategories(currentLevel);
  };

  const goBack = (index) => {
    const newHistory = history.slice(0, index);
    const lastState = newHistory[newHistory.length - 1];
    setHistory(newHistory);
    setCurrentCategories(lastState ? lastState.list.find(c => c.name === lastState.name)?.subcategories : categories);
    const path = newHistory.map(h => h.name);
    onMainChange(path[0] || '');
    onSubChange(path[1] || '');
    onSubSubChange(path[2] || '');
  };

  const fullSelectedPath = [selectedMainCategory, selectedSubCategory, selectedSubSubCategory].filter(Boolean);
  const hasSubcategories = currentCategories && currentCategories.length > 0;
  const isSelectionComplete = fullSelectedPath.length > 0 && !hasSubcategories;

  if (isLoadingCategories) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
        <h2 className="text-2xl font-bold text-center">İlanınız için bir kategori seçin</h2>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <span className="ml-2 text-muted-foreground">Kategoriler yükleniyor...</span>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <h2 className="text-2xl font-bold text-center">İlanınız için bir kategori seçin</h2>
      
      <div className="p-4 space-y-4 rounded-lg bg-muted/50">
        <div className="flex items-center text-sm font-medium text-muted-foreground">
          <Button variant="ghost" size="icon" className="w-8 h-8 mr-2" onClick={() => goBack(0)} disabled={history.length === 0}><Home className="w-4 h-4" /></Button>
          {history.map((item, index) => (
            <React.Fragment key={index}>
              <button onClick={() => goBack(index + 1)} className="hover:text-primary transition-colors">{item.name}</button>
              <ChevronRight className="w-4 h-4 mx-1" />
            </React.Fragment>
          ))}
          {isSelectionComplete && <span className="text-primary font-semibold">Seçim Tamamlandı!</span>}
        </div>
        
        <AnimatePresence mode="wait">
          {hasSubcategories ? (
             <motion.div key={history.length} initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} transition={{ duration: 0.3 }}>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {currentCategories.map(cat => <CategoryCard key={cat.name} category={cat} onClick={selectCategory} parentCategory={parentCategory} />)}
              </div>
            </motion.div>
          ) : (
            <motion.div key="completed" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center p-8 text-center bg-background rounded-lg">
                <CheckCircle className="w-12 h-12 mb-4 text-green-500" />
                <h3 className="text-lg font-semibold">Harika Seçim!</h3>
                <p className="text-muted-foreground">Artık bir sonraki adıma geçebilirsiniz.</p>
            </motion.div>
          )}
        </AnimatePresence>
        {errors.category && <p className="mt-2 text-xs text-center text-destructive">{errors.category}</p>}
      </div>

      <div className="relative text-center">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border" />
        </div>
        <span className="relative px-2 text-sm bg-background text-muted-foreground">veya</span>
      </div>

      <div className="relative">
        <div className="flex items-center">
          <Search className="absolute w-5 h-5 left-3 text-muted-foreground" />
          <Input 
            type="text" 
            placeholder="Kategori ara (örn: akıllı telefon)"
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        {filteredCategories.length > 0 && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="absolute z-10 w-full mt-1 overflow-hidden border rounded-md shadow-lg bg-popover">
            <ul className="py-1">
              {filteredCategories.map(p => (
                <li 
                  key={p.path} 
                  onClick={() => selectSearchedCategory(p.fullPath)}
                  className="px-4 py-2 text-sm cursor-pointer hover:bg-accent"
                >
                  {p.path.split(' > ').map((part, index, arr) => (
                    <span key={index} className={index === arr.length - 1 ? 'font-bold text-primary' : 'text-muted-foreground'}>
                      {part}{index < arr.length - 1 ? ' > ' : ''}
                    </span>
                  ))}
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default Step1_Category;