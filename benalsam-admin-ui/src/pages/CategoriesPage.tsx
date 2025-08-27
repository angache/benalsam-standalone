import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Alert,
} from '@mui/material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { categoryService, type Category } from '../services/categoryService';
import { CategoryBreadcrumb } from '../components/CategoryBreadcrumb';
import { DraggableCategoryList } from '../components/DraggableCategoryList';
import { DraggableCategoryTable } from '../components/DraggableCategoryTable';
import { CategoryStats } from '../components/CategoryStats';
import { CategoryHeader } from '../components/CategoryHeader';
import { CategorySearchAndControls } from '../components/CategorySearchAndControls';
import { CategoryTable } from '../components/CategoryTable';

type ViewMode = 'menu' | 'list';

export const CategoriesPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('menu');
  const [currentPath, setCurrentPath] = useState('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [sortOrderMode, setSortOrderMode] = useState(false);
  
  // Düzenleme modu state'leri
  const [isEditMode, setIsEditMode] = useState(false);
  const [pendingChanges, setPendingChanges] = useState<Array<{
    id: number;
    sort_order: number;
    display_priority: number;
    is_featured: boolean;
  }>>([]);
  const [originalCategories, setOriginalCategories] = useState<Category[]>([]);
  
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Fetch categories
  const { data: categories, isLoading, error } = useQuery({
    queryKey: ['categories'],
    queryFn: categoryService.getCategories,
    staleTime: 2 * 60 * 1000, // 2 minutes - reasonable cache time
    gcTime: 5 * 60 * 1000, // 5 minutes garbage collection
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (path: string) => categoryService.deleteCategory(path),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setSuccessMessage('Kategori başarıyla silindi');
      setTimeout(() => setSuccessMessage(null), 3000);
    },
  });

  // Batch reorder mutation (yeni düzenleme modu için)
  const batchReorderMutation = useMutation({
    mutationFn: (categories: Array<{
      id: number;
      sort_order: number;
      display_priority: number;
      is_featured: boolean;
    }>) => {
      console.log('🔄 [FRONTEND] batchReorderMutation.mutationFn called with:', { categoriesCount: categories.length });
      return categoryService.batchReorderCategories(categories);
    },
    onSuccess: (data: any) => {
      console.log('✅ [FRONTEND] batchReorderMutation.onSuccess called with data:', data);
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setSuccessMessage(`${data.data?.length || 0} kategori başarıyla yeniden sıralandı`);
      setTimeout(() => setSuccessMessage(null), 3000);
      
      // Düzenleme modunu kapat
      setIsEditMode(false);
      setPendingChanges([]);
      setOriginalCategories([]);
    },
    onError: (error) => {
      console.log('❌ [FRONTEND] batchReorderMutation.onError called with error:', error);
      setSuccessMessage('Sıralama güncellenirken hata oluştu');
      setTimeout(() => setSuccessMessage(null), 3000);
    },
  });

  // Eski sort order mutations (geriye uyumluluk için)
  const updateSortOrderMutation = useMutation({
    mutationFn: ({ id, sort_order, display_priority, is_featured }: {
      id: number;
      sort_order: number;
      display_priority: number;
      is_featured: boolean;
    }) => {
      console.log('🔄 [FRONTEND] updateSortOrderMutation.mutationFn called with:', { id, sort_order, display_priority, is_featured });
      return categoryService.updateCategoryOrder(id, { sort_order, display_priority, is_featured });
    },
    onSuccess: (data) => {
      console.log('✅ [FRONTEND] updateSortOrderMutation.onSuccess called with data:', data);
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setSuccessMessage('Sıralama güncellendi');
      setTimeout(() => setSuccessMessage(null), 3000);
    },
    onError: (error) => {
      console.log('❌ [FRONTEND] updateSortOrderMutation.onError called with error:', error);
    },
  });

  const toggleFeaturedMutation = useMutation({
    mutationFn: (id: number) => categoryService.toggleFeatured(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setSuccessMessage('Öne çıkan durumu güncellendi');
      setTimeout(() => setSuccessMessage(null), 3000);
    },
  });

  const handleDelete = (path: string, name: string) => {
    if (window.confirm(`"${name}" kategorisini silmek istediğinizden emin misiniz?`)) {
      deleteMutation.mutate(path);
    }
  };

  const handleView = (path: string) => {
    navigate(`/categories/${encodeURIComponent(path)}`);
  };

  const handleEdit = (path: string) => {
    navigate(`/categories/${encodeURIComponent(path)}/edit`);
  };

  const handleAddSubcategory = (parentPath: string) => {
    navigate(`/categories/${encodeURIComponent(parentPath)}/add-subcategory`);
  };

  const handleEditAttributes = (path: string) => {
    navigate(`/categories/${encodeURIComponent(path)}/attributes`);
  };

  const handleNavigate = (path: string) => {
    setCurrentPath(path);
  };

  const handleSortOrderChange = (categoryId: number, newSortOrder: number) => {
    console.log('🔄 [FRONTEND] handleSortOrderChange çağrıldı, categoryId:', categoryId, 'newSortOrder:', newSortOrder);
    console.log('🚀 [FRONTEND] Calling updateSortOrderMutation.mutate...');
    
    updateSortOrderMutation.mutate({
      id: categoryId,
      sort_order: newSortOrder,
      display_priority: 0,
      is_featured: false
    });
  };

  const handleToggleFeatured = (categoryId: number) => {
    toggleFeaturedMutation.mutate(categoryId);
  };

  // Düzenleme modu fonksiyonları
  const startEditMode = () => {
    console.log('🔄 [FRONTEND] Düzenleme modu başlatılıyor...');
    setIsEditMode(true);
    
    // Orijinal kategorileri deep copy ile kaydet
    const originalCategoriesCopy = sortedCategories.map(cat => ({
      ...cat,
      sort_order: cat.sort_order,
      display_priority: cat.display_priority,
      is_featured: cat.is_featured
    }));
    
    setOriginalCategories(originalCategoriesCopy);
    setPendingChanges([]);
    
    console.log('✅ [FRONTEND] Düzenleme modu başlatıldı, orijinal kategoriler kaydedildi:', originalCategoriesCopy.length);
  };

  const cancelEditMode = () => {
    console.log('🔄 [FRONTEND] Düzenleme modu iptal ediliyor...');
    
    // Kategorileri orijinal haline döndür
    if (originalCategories.length > 0) {
      console.log('🔄 [FRONTEND] Kategoriler orijinal haline döndürülüyor...');
      queryClient.setQueryData(['categories'], (oldData: any) => {
        if (!oldData) return oldData;
        
        // Orijinal kategorileri geri yükle
        return oldData.map((cat: Category) => {
          const originalCat = originalCategories.find(orig => orig.id === cat.id);
          if (originalCat) {
            return { ...cat, sort_order: originalCat.sort_order };
          }
          return cat;
        });
      });
    }
    
    // State'leri temizle
    setIsEditMode(false);
    setPendingChanges([]);
    setOriginalCategories([]);
    
    console.log('✅ [FRONTEND] Düzenleme modu iptal edildi, kategoriler orijinal haline döndürüldü');
  };

  const saveEditMode = () => {
    console.log('🔄 [FRONTEND] Düzenleme modu kaydediliyor...', pendingChanges);
    if (pendingChanges.length > 0) {
      batchReorderMutation.mutate(pendingChanges);
    } else {
      setIsEditMode(false);
      setSuccessMessage('Değişiklik yapılmadı');
      setTimeout(() => setSuccessMessage(null), 2000);
    }
  };

  const handleEditModeMoveUp = (category: Category) => {
    console.log('🔄 [FRONTEND] Edit mode - handleMoveUp çağrıldı, kategori:', category.name, 'ID:', category.id);
    
    const currentIndex = sortedCategories.findIndex(cat => cat.id === category.id);
    console.log('🔄 [FRONTEND] Current index in sorted list:', currentIndex);
    
    if (currentIndex > 0) {
      const prevCategory = sortedCategories[currentIndex - 1];
      console.log('📋 [FRONTEND] Previous category:', prevCategory.name, 'ID:', prevCategory.id, 'sort_order:', prevCategory.sort_order);
      
      // Swap sort orders
      const newSortOrder = prevCategory.sort_order;
      const newSortOrderPrev = category.sort_order;
      
      console.log('🔄 [FRONTEND] Swapping sort orders:', {
        [category.name]: newSortOrder,
        [prevCategory.name]: newSortOrderPrev
      });
      
      // Update local state immediately for instant UI feedback
      const updatedCategories = [...sortedCategories];
      updatedCategories[currentIndex] = { ...category, sort_order: newSortOrder };
      updatedCategories[currentIndex - 1] = { ...prevCategory, sort_order: newSortOrderPrev };
      
      // Update pending changes
      const newChanges = [
        { id: category.id, sort_order: newSortOrder, display_priority: category.display_priority, is_featured: category.is_featured },
        { id: prevCategory.id, sort_order: newSortOrderPrev, display_priority: prevCategory.display_priority, is_featured: prevCategory.is_featured }
      ];
      
      setPendingChanges(prev => [...prev.filter(change => change.id !== category.id && change.id !== prevCategory.id), ...newChanges]);
      
      // Force re-render
      queryClient.setQueryData(['categories'], (oldData: any) => {
        if (!oldData) return oldData;
        return oldData.map((cat: Category) => {
          if (cat.id === category.id) return { ...cat, sort_order: newSortOrder };
          if (cat.id === prevCategory.id) return { ...cat, sort_order: newSortOrderPrev };
          return cat;
        });
      });
    } else {
      console.log('❌ [FRONTEND] Kategori zaten en üstte');
    }
  };

  // Drag & Drop reorder handler
  const handleDragReorder = (reorderedCategories: Category[]) => {
    console.log('🔄 [FRONTEND] Drag & drop reorder:', reorderedCategories.map(cat => ({ id: cat.id, name: cat.name, sort_order: cat.sort_order })));
    
    // Update local state immediately for instant UI feedback
    queryClient.setQueryData(['categories'], (oldData: any) => {
      if (!oldData) return oldData;
      
      // Update sort_order based on new positions
      const updatedCategories = reorderedCategories.map((cat, index) => ({
        ...cat,
        sort_order: (index + 1) * 1000 // Generate new sort_order values
      }));
      
      return oldData.map((existingCat: Category) => {
        const updatedCat = updatedCategories.find(upd => upd.id === existingCat.id);
        if (updatedCat) {
          return { ...existingCat, sort_order: updatedCat.sort_order };
        }
        return existingCat;
      });
    });
    
    // Update pending changes
    const newChanges = reorderedCategories.map((cat, index) => ({
      id: cat.id,
      sort_order: (index + 1) * 1000,
      display_priority: cat.display_priority,
      is_featured: cat.is_featured
    }));
    
    setPendingChanges(newChanges);
  };

  const handleEditModeMoveDown = (category: Category) => {
    console.log('🔄 [FRONTEND] Edit mode - handleMoveDown çağrıldı, kategori:', category.name, 'ID:', category.id);
    
    const currentIndex = sortedCategories.findIndex(cat => cat.id === category.id);
    console.log('🔄 [FRONTEND] Current index in sorted list:', currentIndex);
    
    if (currentIndex < sortedCategories.length - 1) {
      const nextCategory = sortedCategories[currentIndex + 1];
      console.log('📋 [FRONTEND] Next category:', nextCategory.name, 'ID:', nextCategory.id, 'sort_order:', nextCategory.sort_order);
      
      // Swap sort orders
      const newSortOrder = nextCategory.sort_order;
      const newSortOrderNext = category.sort_order;
      
      console.log('🔄 [FRONTEND] Swapping sort orders:', {
        [category.name]: newSortOrder,
        [nextCategory.name]: newSortOrderNext
      });
      
      // Update local state immediately for instant UI feedback
      const updatedCategories = [...sortedCategories];
      updatedCategories[currentIndex] = { ...category, sort_order: newSortOrder };
      updatedCategories[currentIndex + 1] = { ...nextCategory, sort_order: newSortOrderNext };
      
      // Update pending changes
      const newChanges = [
        { id: category.id, sort_order: newSortOrder, display_priority: category.display_priority, is_featured: category.is_featured },
        { id: nextCategory.id, sort_order: newSortOrderNext, display_priority: nextCategory.display_priority, is_featured: nextCategory.is_featured }
      ];
      
      setPendingChanges(prev => [...prev.filter(change => change.id !== category.id && change.id !== nextCategory.id), ...newChanges]);
      
      // Force re-render
      queryClient.setQueryData(['categories'], (oldData: any) => {
        if (!oldData) return oldData;
        return oldData.map((cat: Category) => {
          if (cat.id === category.id) return { ...cat, sort_order: newSortOrder };
          if (cat.id === nextCategory.id) return { ...cat, sort_order: newSortOrderNext };
          return cat;
        });
      });
    } else {
      console.log('❌ [FRONTEND] Kategori zaten en altta');
    }
  };

  const handleMoveUp = (category: Category) => {
    console.log('🔄 [FRONTEND] handleMoveUp çağrıldı, kategori:', category.name, 'ID:', category.id);
    console.log('🔄 [FRONTEND] Current sort_order:', category.sort_order);
    
    const currentIndex = sortedCategories.findIndex(cat => cat.id === category.id);
    console.log('🔄 [FRONTEND] Current index in sorted list:', currentIndex);
    
    if (currentIndex > 0) {
      const prevCategory = sortedCategories[currentIndex - 1];
      console.log('📋 [FRONTEND] Previous category:', prevCategory.name, 'ID:', prevCategory.id, 'sort_order:', prevCategory.sort_order);
      
      // Swap sort orders
      const newSortOrder = prevCategory.sort_order;
      const newSortOrderPrev = category.sort_order;
      
      console.log('🔄 [FRONTEND] Swapping sort orders:', {
        [category.name]: newSortOrder,
        [prevCategory.name]: newSortOrderPrev
      });
      
      console.log('🚀 [FRONTEND] Calling handleSortOrderChange for both categories...');
      
      // Update both categories
      handleSortOrderChange(category.id, newSortOrder);
      handleSortOrderChange(prevCategory.id, newSortOrderPrev);
    } else {
      console.log('❌ [FRONTEND] Kategori zaten en üstte');
    }
  };

  const handleMoveDown = (category: Category) => {
    console.log('🔄 [FRONTEND] handleMoveDown çağrıldı, kategori:', category.name, 'ID:', category.id);
    console.log('🔄 [FRONTEND] Current sort_order:', category.sort_order);
    
    const currentIndex = sortedCategories.findIndex(cat => cat.id === category.id);
    console.log('🔄 [FRONTEND] Current index in sorted list:', currentIndex);
    
    if (currentIndex < sortedCategories.length - 1) {
      const nextCategory = sortedCategories[currentIndex + 1];
      console.log('📋 [FRONTEND] Next category:', nextCategory.name, 'ID:', nextCategory.id, 'sort_order:', nextCategory.sort_order);
      
      // Swap sort orders
      const newSortOrder = nextCategory.sort_order;
      const newSortOrderNext = category.sort_order;
      
      console.log('🔄 [FRONTEND] Swapping sort orders:', {
        [category.name]: newSortOrder,
        [nextCategory.name]: newSortOrderNext
      });
      
      console.log('🚀 [FRONTEND] Calling handleSortOrderChange for both categories...');
      
      // Update both categories
      handleSortOrderChange(category.id, newSortOrder);
      handleSortOrderChange(nextCategory.id, newSortOrderNext);
    } else {
      console.log('❌ [FRONTEND] Kategori zaten en altta');
    }
  };

  // Get current level categories
  const getCurrentCategories = (): Category[] => {
    if (!categories) return [];
    
    if (!currentPath) {
      return categories;
    }

    const pathParts = currentPath.split('/');
    let currentLevel = categories;

    for (const part of pathParts) {
      const category = currentLevel.find(cat => cat.name === decodeURIComponent(part));
      if (!category || !category.subcategories) {
        return [];
      }
      currentLevel = category.subcategories;
    }

    return currentLevel;
  };

  const currentCategories = getCurrentCategories();
  
  // Sort categories by sort_order if available
  const sortedCategories = [...currentCategories].sort((a, b) => {
    if (a.sort_order !== undefined && b.sort_order !== undefined) {
      return a.sort_order - b.sort_order; // Lower sort_order first (correct order)
    }
    return a.name.localeCompare(b.name); // Fallback to alphabetical
  });

  const filteredCategories = sortedCategories.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Flatten categories for list view
  const flattenCategories = (cats: Category[], parentPath: string = ''): Array<Category & { path: string; level: number }> => {
    let result: Array<Category & { path: string; level: number }> = [];
    
    cats.forEach(category => {
      const path = parentPath ? `${parentPath}/${category.name}` : category.name;
      result.push({
        ...category,
        path,
        level: parentPath.split('/').length,
      });
      
      if (category.subcategories) {
        result = result.concat(flattenCategories(category.subcategories, path));
      }
    });
    
    return result;
  };

  const allFlattenedCategories = categories ? flattenCategories(categories) : [];

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          Kategoriler yüklenirken bir hata oluştu. Lütfen sayfayı yenileyin.
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      width: '100%', 
      maxWidth: '100%', 
      overflowX: 'auto',
      minHeight: '100vh'
    }}>
      {/* Header */}
      <CategoryHeader
        isEditMode={isEditMode}
        batchReorderMutation={batchReorderMutation}
        pendingChanges={pendingChanges}
        startEditMode={startEditMode}
        saveEditMode={saveEditMode}
        cancelEditMode={cancelEditMode}
      />

      {/* Success Message */}
      {successMessage && (
        <Alert 
          severity="success" 
          sx={{ mb: 3 }}
          onClose={() => setSuccessMessage(null)}
        >
          {successMessage}
        </Alert>
      )}

      {/* Stats Cards */}
      <CategoryStats
        categories={categories}
        allFlattenedCategories={allFlattenedCategories}
        isLoading={isLoading}
      />

      {/* Breadcrumb */}
      <CategoryBreadcrumb
        path={currentPath}
        onNavigate={handleNavigate}
      />

      {/* Search and View Mode */}
      <CategorySearchAndControls
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        viewMode={viewMode}
        setViewMode={setViewMode}
        currentCategories={currentCategories}
        filteredCategories={filteredCategories}
        isEditMode={isEditMode}
        batchReorderMutation={batchReorderMutation}
        pendingChanges={pendingChanges}
        startEditMode={startEditMode}
        saveEditMode={saveEditMode}
        cancelEditMode={cancelEditMode}
      />

      {/* Categories Content */}
      <Card>
        <CardContent>
          {viewMode === 'menu' ? (
            <DraggableCategoryList
              categories={filteredCategories}
              currentPath={currentPath}
              onNavigate={handleNavigate}
              onView={handleView}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onAddSubcategory={handleAddSubcategory}
              onEditAttributes={handleEditAttributes}
              isLoading={isLoading}
              isEditMode={isEditMode}
              onMoveUp={isEditMode ? handleEditModeMoveUp : handleMoveUp}
              onMoveDown={isEditMode ? handleEditModeMoveDown : handleMoveDown}
              onToggleFeatured={handleToggleFeatured}
              onReorder={isEditMode ? handleDragReorder : undefined}
            />
          ) : (
            <CategoryTable
              filteredCategories={filteredCategories}
              currentPath={currentPath}
              sortOrderMode={sortOrderMode}
              isEditMode={isEditMode}
              deleteMutation={deleteMutation}
              onView={handleView}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onAddSubcategory={handleAddSubcategory}
              onEditAttributes={handleEditAttributes}
              handleMoveUp={handleMoveUp}
              handleMoveDown={handleMoveDown}
              handleEditModeMoveUp={handleEditModeMoveUp}
              handleEditModeMoveDown={handleEditModeMoveDown}
              handleToggleFeatured={handleToggleFeatured}
            />
          )}
        </CardContent>
      </Card>
    </Box>
  );
}; 