import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';

export const useCategoryCounts = (listings = []) => {
  const [categoryCounts, setCategoryCounts] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  // Veritabanından tüm kategorilerin sayılarını çek
  const fetchCategoryCounts = async () => {
    try {
      const { data, error } = await supabase
        .from('listings')
        .select('category')
        .eq('status', 'active')
        .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`);

      if (error) {
        console.error('Error fetching category counts:', error);
        return {};
      }

      const counts = {};
      
      data.forEach(listing => {
        if (listing.category) {
          // Ana kategori
          const mainCategory = listing.category.split(' > ')[0];
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
    } catch (error) {
      console.error('Error in fetchCategoryCounts:', error);
      return {};
    }
  };

  // Kategori path'ine göre sayı getir
  const getCategoryCount = (categoryPath) => {
    if (!categoryPath || categoryPath.length === 0) {
      // Tüm ilanlar için ana kategorilerin toplamını al
      const mainCategories = new Set();
      Object.keys(categoryCounts).forEach(category => {
        const mainCategory = category.split(' > ')[0];
        mainCategories.add(mainCategory);
      });
      
      let totalCount = 0;
      mainCategories.forEach(mainCategory => {
        totalCount += categoryCounts[mainCategory] || 0;
      });
      
      return totalCount;
    }
    
    const fullPath = categoryPath.join(' > ');
    
    // Tam eşleşme varsa onu döndür
    if (categoryCounts[fullPath]) {
      return categoryCounts[fullPath];
    }
    
    // Alt kategorileri de dahil et
    let totalCount = 0;
    Object.keys(categoryCounts).forEach(category => {
      if (category.startsWith(fullPath + ' >') || category === fullPath) {
        totalCount += categoryCounts[category];
      }
    });
    
    console.log('🔍 getCategoryCount - Path:', fullPath, 'Count:', totalCount);
    return totalCount;
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
    const loadCategoryCounts = async () => {
      setIsLoading(true);
      const counts = await fetchCategoryCounts();
      setCategoryCounts(counts);
      setIsLoading(false);
    };
    
    loadCategoryCounts();
  }, []);

  return {
    categoryCounts,
    getCategoryCount,
    getSubcategories,
    isLoading,
    totalListings: listings.length
  };
};
