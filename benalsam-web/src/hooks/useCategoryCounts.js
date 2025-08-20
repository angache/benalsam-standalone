import { useState, useEffect, useMemo } from 'react';

export const useCategoryCounts = (listings = []) => {
  const [categoryCounts, setCategoryCounts] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  // Gerçek veri ile kategori sayılarını hesapla
  const calculateCategoryCounts = useMemo(() => {
    const counts = {};
    
    // Tüm kategoriler için sayıları hesapla
    const allCategories = new Set();
    
    listings.forEach(listing => {
      if (listing.category) {
        // Ana kategori
        const mainCategory = listing.category.split(' > ')[0];
        allCategories.add(mainCategory);
        counts[mainCategory] = (counts[mainCategory] || 0) + 1;
        
        // Alt kategoriler
        const categoryParts = listing.category.split(' > ');
        for (let i = 1; i < categoryParts.length; i++) {
          const subCategory = categoryParts.slice(0, i + 1).join(' > ');
          counts[subCategory] = (counts[subCategory] || 0) + 1;
        }
      }
    });

    return counts;
  }, [listings]);

  // Kategori path'ine göre sayı getir
  const getCategoryCount = (categoryPath) => {
    if (!categoryPath || categoryPath.length === 0) {
      return listings.length; // Tüm ilanlar
    }
    
    const fullPath = categoryPath.join(' > ');
    return categoryCounts[fullPath] || 0;
  };

  // Alt kategorileri getir
  const getSubcategories = (parentPath = []) => {
    const parentString = parentPath.join(' > ');
    const subcategories = new Set();
    
    listings.forEach(listing => {
      if (listing.category && listing.category.startsWith(parentString)) {
        const parts = listing.category.split(' > ');
        if (parts.length > parentPath.length) {
          const subcategory = parts[parentPath.length];
          subcategories.add(subcategory);
        }
      }
    });

    return Array.from(subcategories).map(name => ({
      name,
      count: getCategoryCount([...parentPath, name])
    }));
  };

  useEffect(() => {
    setCategoryCounts(calculateCategoryCounts);
    setIsLoading(false);
  }, [calculateCategoryCounts]);

  return {
    categoryCounts,
    getCategoryCount,
    getSubcategories,
    isLoading,
    totalListings: listings.length
  };
};
