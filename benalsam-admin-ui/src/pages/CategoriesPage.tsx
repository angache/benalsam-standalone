import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  Button,
  TextField,
  IconButton,
  Tooltip,
  Alert,
  Skeleton,
  Paper,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  Plus,
  Edit,
  Delete,
  Folder,
  Search,
  RefreshCw,
  Eye,
  Grid3X3,
  ListTree,
  ArrowUp,
  ArrowDown,
  Star,
  X,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { categoryService, type Category } from '../services/categoryService';
import { CategoryBreadcrumb } from '../components/CategoryBreadcrumb';
import { CategoryMenu } from '../components/CategoryMenu';
import { getIconComponent } from '../utils/iconUtils';

type ViewMode = 'menu' | 'list';

export const CategoriesPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('menu');
  const [currentPath, setCurrentPath] = useState('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [sortOrderMode, setSortOrderMode] = useState(false);
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

  // Sort order mutations
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
      <Box sx={{ 
        display: 'flex', 
        flexDirection: { xs: 'column', md: 'row' },
        justifyContent: 'space-between', 
        alignItems: { xs: 'stretch', md: 'center' }, 
        gap: { xs: 2, md: 0 },
        mb: { xs: 2, sm: 3 },
        p: { xs: 1, sm: 0 }
      }}>
        <Typography variant="h4" component="h1" sx={{ 
          textAlign: { xs: 'center', md: 'left' },
          fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' },
          mb: { xs: 1, md: 0 }
        }}>
          Kategori Yönetimi
        </Typography>
        
        <Box sx={{ 
          display: 'flex', 
          gap: { xs: 1, sm: 2 },
          flexDirection: { xs: 'column', sm: 'row' },
          width: { xs: '100%', md: 'auto' }
        }}>
          {!sortOrderMode && (
            <>
              <Button
                variant="contained"
                startIcon={<Plus />}
                onClick={() => navigate('/categories/create')}
                sx={{ 
                  minWidth: { xs: '100%', sm: 'auto' },
                  fontSize: { xs: '0.875rem', sm: '1rem' }
                }}
              >
                Yeni Kategori
              </Button>
              <Button
                variant="outlined"
                startIcon={<RefreshCw />}
                onClick={() => {
                  console.log('🔄 Cache temizleniyor...');
                  queryClient.removeQueries({ queryKey: ['categories'] });
                  queryClient.invalidateQueries({ queryKey: ['categories'] });
                  queryClient.refetchQueries({ queryKey: ['categories'] });
                  console.log('✅ Cache temizlendi ve veriler yeniden yüklendi');
                }}
                sx={{ 
                  minWidth: { xs: '100%', sm: 'auto' },
                  fontSize: { xs: '0.875rem', sm: '1rem' }
                }}
              >
                Yenile
              </Button>
            </>
          )}
        </Box>
      </Box>

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
      <Grid container spacing={2} sx={{ mb: { xs: 2, sm: 3 } }}>
        <Grid item xs={6} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
              <Typography color="text.secondary" gutterBottom sx={{ 
                fontSize: { xs: '0.75rem', sm: '0.875rem' }
              }}>
                Toplam Kategori
              </Typography>
              <Typography variant="h4" component="div" sx={{ 
                fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' }
              }}>
                {isLoading ? <Skeleton width={60} /> : allFlattenedCategories.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={6} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
              <Typography color="text.secondary" gutterBottom sx={{ 
                fontSize: { xs: '0.75rem', sm: '0.875rem' }
              }}>
                Ana Kategoriler
              </Typography>
              <Typography variant="h4" component="div" color="primary.main" sx={{ 
                fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' }
              }}>
                {isLoading ? <Skeleton width={60} /> : categories?.length || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={6} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
              <Typography color="text.secondary" gutterBottom sx={{ 
                fontSize: { xs: '0.75rem', sm: '0.875rem' }
              }}>
                Son Kategoriler
              </Typography>
              <Typography variant="h4" component="div" color="secondary.main" sx={{ 
                fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' }
              }}>
                {isLoading ? <Skeleton width={60} /> : 
                 allFlattenedCategories.filter(cat => !cat.subcategories || cat.subcategories.length === 0).length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={6} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
              <Typography color="text.secondary" gutterBottom sx={{ 
                fontSize: { xs: '0.75rem', sm: '0.875rem' }
              }}>
                Toplam Özellik
              </Typography>
              <Typography variant="h4" component="div" color="success.main" sx={{ 
                fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' }
              }}>
                {isLoading ? <Skeleton width={60} /> : 
                 allFlattenedCategories.reduce((sum, cat) => sum + (cat.attributes?.length || 0), 0)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Breadcrumb */}
      <CategoryBreadcrumb
        path={currentPath}
        onNavigate={handleNavigate}
      />

      {/* Search and View Mode */}
      <Card sx={{ mb: { xs: 2, sm: 3 } }}>
        <CardContent sx={{ p: { xs: 1.5, sm: 2, md: 3 } }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="🔍 Kategori Ara"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Kategori adı yazın..."
                size="small"
                InputProps={{
                  startAdornment: <Search size={20} style={{ marginRight: 8 }} />,
                }}
                sx={{
                  '& .MuiInputBase-input': {
                    fontSize: { xs: '0.875rem', sm: '1rem' }
                  }
                }}
              />
            </Grid>
            
            <Grid item xs={6} md={3}>
              <Box sx={{ 
                display: 'flex', 
                gap: 0.5, 
                flexWrap: 'wrap',
                justifyContent: { xs: 'center', md: 'flex-start' }
              }}>
                <Chip
                  label={`📁 ${currentCategories.length}`}
                  color="primary"
                  variant="outlined"
                  size="small"
                  sx={{ 
                    fontSize: { xs: '0.65rem', sm: '0.75rem' },
                    height: { xs: '24px', sm: '32px' }
                  }}
                />
                <Chip
                  label={`🔍 ${filteredCategories.length}`}
                  color="secondary"
                  variant="outlined"
                  size="small"
                  sx={{ 
                    fontSize: { xs: '0.65rem', sm: '0.75rem' },
                    height: { xs: '24px', sm: '32px' }
                  }}
                />
              </Box>
            </Grid>
            
            <Grid item xs={6} md={3}>
              <Box sx={{ 
                display: 'flex', 
                gap: 0.5,
                justifyContent: { xs: 'center', md: 'flex-end' },
                flexWrap: 'wrap'
              }}>
                <Button
                  variant={viewMode === 'menu' ? 'contained' : 'outlined'}
                  startIcon={<ListTree size={16} />}
                  onClick={() => setViewMode('menu')}
                  size="small"
                  sx={{ 
                    minWidth: { xs: '70px', sm: 'auto' },
                    fontSize: { xs: '0.65rem', sm: '0.875rem' },
                    height: { xs: '32px', sm: 'auto' },
                    px: { xs: 1, sm: 2 }
                  }}
                >
                  Menü
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'contained' : 'outlined'}
                  startIcon={<Grid3X3 size={16} />}
                  onClick={() => setViewMode('list')}
                  size="small"
                  sx={{ 
                    minWidth: { xs: '70px', sm: 'auto' },
                    fontSize: { xs: '0.65rem', sm: '0.875rem' },
                    height: { xs: '32px', sm: 'auto' },
                    px: { xs: 1, sm: 2 }
                  }}
                >
                  Liste
                </Button>
                {!sortOrderMode && (
                  <Button
                    variant="outlined"
                    startIcon={<ArrowUp size={16} />}
                    onClick={() => {
                      console.log('SIRALA butonuna tıklandı, mevcut sortOrderMode:', sortOrderMode);
                      setSortOrderMode(!sortOrderMode);
                      console.log('Yeni sortOrderMode olacak:', !sortOrderMode);
                    }}
                    size="small"
                    color="warning"
                    sx={{ 
                      minWidth: { xs: '70px', sm: 'auto' },
                      fontSize: { xs: '0.65rem', sm: '0.875rem' },
                      height: { xs: '32px', sm: 'auto' },
                      px: { xs: 1, sm: 2 }
                    }}
                  >
                    Sırala
                  </Button>
                )}
                {sortOrderMode && (
                  <Button
                    variant="contained"
                    startIcon={<X size={16} />}
                    onClick={() => {
                      console.log('SIRALA KAPAT butonuna tıklandı');
                      setSortOrderMode(false);
                    }}
                    size="small"
                    color="error"
                    sx={{ 
                      minWidth: { xs: '70px', sm: 'auto' },
                      fontSize: { xs: '0.65rem', sm: '0.875rem' },
                      height: { xs: '32px', sm: 'auto' },
                      px: { xs: 1, sm: 2 }
                    }}
                  >
                    Sıralamayı Kapat
                  </Button>
                )}
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Categories Content */}
      <Card>
        <CardContent>
          {viewMode === 'menu' ? (
            <CategoryMenu
              categories={filteredCategories}
              currentPath={currentPath}
              onNavigate={handleNavigate}
              onView={handleView}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onAddSubcategory={handleAddSubcategory}
              onEditAttributes={handleEditAttributes}
              isLoading={isLoading}
              sortOrderMode={sortOrderMode}
              onMoveUp={handleMoveUp}
              onMoveDown={handleMoveDown}
              onToggleFeatured={handleToggleFeatured}
            />
          ) : (
            <TableContainer sx={{ 
              overflowX: 'auto',
              '& .MuiTable-root': {
                minWidth: { xs: 500, sm: 'auto' }
              }
            }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ 
                      minWidth: { xs: 120, sm: 'auto' },
                      fontSize: { xs: '0.75rem', sm: '0.875rem', md: '1rem' },
                      p: { xs: 1, sm: 1.5, md: 2 }
                    }}>
                      Kategori
                    </TableCell>
                    <TableCell sx={{ 
                      minWidth: { xs: 60, sm: 'auto' },
                      fontSize: { xs: '0.75rem', sm: '0.875rem', md: '1rem' },
                      p: { xs: 1, sm: 1.5, md: 2 }
                    }}>
                      Seviye
                    </TableCell>
                    <TableCell sx={{ 
                      minWidth: { xs: 80, sm: 'auto' },
                      fontSize: { xs: '0.75rem', sm: '0.875rem', md: '1rem' },
                      p: { xs: 1, sm: 1.5, md: 2 }
                    }}>
                      Özellikler
                    </TableCell>
                    <TableCell sx={{ 
                      minWidth: { xs: 100, sm: 'auto' },
                      fontSize: { xs: '0.75rem', sm: '0.875rem', md: '1rem' },
                      p: { xs: 1, sm: 1.5, md: 2 }
                    }}>
                      Alt Kategoriler
                    </TableCell>
                    <TableCell align="right" sx={{ 
                      minWidth: { xs: 100, sm: 'auto' },
                      fontSize: { xs: '0.75rem', sm: '0.875rem', md: '1rem' },
                      p: { xs: 1, sm: 1.5, md: 2 }
                    }}>
                      İşlemler
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredCategories.map((category) => {
                    const path = currentPath ? `${currentPath}/${category.name}` : category.name;
                    const hasSubcategories = category.subcategories && category.subcategories.length > 0;
                    const hasAttributes = category.attributes && category.attributes.length > 0;
                    const isLeaf = !hasSubcategories;

                    return (
                      <TableRow key={category.name}>
                        <TableCell sx={{ p: { xs: 1, sm: 1.5, md: 2 } }}>
                          <Box sx={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: { xs: 1, sm: 2 },
                            flexDirection: { xs: 'column', sm: 'row' },
                            textAlign: { xs: 'center', sm: 'left' }
                          }}>
                            <Box
                              sx={{
                                width: { xs: 24, sm: 32 },
                                height: { xs: 24, sm: 32 },
                                borderRadius: 1,
                                background: category.color,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white',
                                fontSize: '0.9rem',
                              }}
                            >
                              <Folder size={16} />
                            </Box>
                            <Box>
                              <Typography variant="body2" fontWeight="medium" sx={{ 
                                fontSize: { xs: '0.75rem', sm: '0.875rem', md: '1rem' }
                              }}>
                                {category.name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary" sx={{ 
                                fontSize: { xs: '0.65rem', sm: '0.75rem' }
                              }}>
                                {category.icon} • {category.color}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={`Seviye ${currentPath.split('/').length}`}
                            size="small"
                            color={currentPath.split('/').length === 0 ? 'primary' : 'secondary'}
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>
                          {hasAttributes && isLeaf ? (
                            <Chip
                              label={`${category.attributes!.length} özellik`}
                              size="small"
                              color="secondary"
                              variant="outlined"
                            />
                          ) : (
                            <Typography variant="caption" color="text.secondary">
                              {isLeaf ? 'Özellik yok' : 'Alt kategoriler var'}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          {hasSubcategories ? (
                            <Chip
                              label={`${category.subcategories!.length} alt kategori`}
                              size="small"
                              color="info"
                              variant="outlined"
                            />
                          ) : (
                            <Typography variant="caption" color="text.secondary">
                              Alt kategori yok
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell align="right" sx={{ p: { xs: 1, sm: 1.5, md: 2 } }}>
                          <Box sx={{ 
                            display: 'flex', 
                            gap: 0.5, 
                            justifyContent: 'flex-end',
                            flexWrap: 'wrap'
                          }}>
                            {!sortOrderMode && (
                              <>
                                <Tooltip title="Görüntüle">
                                  <IconButton
                                    size="small"
                                    color="primary"
                                    onClick={() => handleView(path)}
                                    sx={{ 
                                      minWidth: { xs: '36px', sm: 'auto' },
                                      minHeight: { xs: '36px', sm: 'auto' },
                                      p: { xs: 0.5, sm: 1 }
                                    }}
                                  >
                                    <Eye size={16} />
                                  </IconButton>
                                </Tooltip>
                                
                                <Tooltip title="Düzenle">
                                  <IconButton
                                    size="small"
                                    color="info"
                                    onClick={() => handleEdit(path)}
                                    sx={{ 
                                      minWidth: { xs: '36px', sm: 'auto' },
                                      minHeight: { xs: '36px', sm: 'auto' },
                                      p: { xs: 0.5, sm: 1 }
                                    }}
                                  >
                                    <Edit size={16} />
                                  </IconButton>
                                </Tooltip>
                                
                                {isLeaf && (
                                  <Tooltip title="Özellikleri Düzenle">
                                    <IconButton
                                      size="small"
                                      color="secondary"
                                      onClick={() => handleEditAttributes(path)}
                                      sx={{ 
                                        minWidth: { xs: '36px', sm: 'auto' },
                                        minHeight: { xs: '36px', sm: 'auto' },
                                        p: { xs: 0.5, sm: 1 }
                                      }}
                                    >
                                      <ListTree size={16} />
                                    </IconButton>
                                  </Tooltip>
                                )}
                                
                                {!isLeaf && (
                                  <Tooltip title="Alt Kategori Ekle">
                                    <IconButton
                                      size="small"
                                      color="success"
                                      onClick={() => handleAddSubcategory(path)}
                                      sx={{ 
                                        minWidth: { xs: '36px', sm: 'auto' },
                                        minHeight: { xs: '36px', sm: 'auto' },
                                        p: { xs: 0.5, sm: 1 }
                                      }}
                                    >
                                      <Plus size={16} />
                                    </IconButton>
                                  </Tooltip>
                                )}
                                
                                <Tooltip title="Sil">
                                  <IconButton
                                    size="small"
                                    color="error"
                                    onClick={() => handleDelete(path, category.name)}
                                    disabled={deleteMutation.isPending}
                                    sx={{ 
                                      minWidth: { xs: '36px', sm: 'auto' },
                                      minHeight: { xs: '36px', sm: 'auto' },
                                      p: { xs: 0.5, sm: 1 }
                                    }}
                                  >
                                    <Delete size={16} />
                                  </IconButton>
                                </Tooltip>
                              </>
                            )}

                            {/* Sort Order Buttons */}
                            {sortOrderMode && (
                              <>
                                <Tooltip title="Yukarı Taşı">
                                  <IconButton
                                    size="small"
                                    color="warning"
                                    onClick={() => {
                                      console.log('YUKARI OK tıklandı, kategori:', category.name);
                                      handleMoveUp(category);
                                    }}
                                    sx={{ 
                                      minWidth: { xs: '36px', sm: 'auto' },
                                      minHeight: { xs: '36px', sm: 'auto' },
                                      p: { xs: 0.5, sm: 1 }
                                    }}
                                  >
                                    <ArrowUp size={16} />
                                  </IconButton>
                                </Tooltip>
                                
                                <Tooltip title="Aşağı Taşı">
                                  <IconButton
                                    size="small"
                                    color="warning"
                                    onClick={() => {
                                      console.log('AŞAĞI OK tıklandı, kategori:', category.name);
                                      handleMoveDown(category);
                                    }}
                                    sx={{ 
                                      minWidth: { xs: '36px', sm: 'auto' },
                                      minHeight: { xs: '36px', sm: 'auto' },
                                      p: { xs: 0.5, sm: 1 }
                                    }}
                                  >
                                    <ArrowDown size={16} />
                                  </IconButton>
                                </Tooltip>
                                
                                <Tooltip title={category.is_featured ? "Öne Çıkanı Kaldır" : "Öne Çıkar"}>
                                  <IconButton
                                    size="small"
                                    color={category.is_featured ? "success" : "default"}
                                    onClick={() => {
                                      console.log('YILDIZ tıklandı, kategori:', category.name);
                                      handleToggleFeatured(category.id);
                                    }}
                                    sx={{ 
                                      minWidth: { xs: '36px', sm: 'auto' },
                                      minHeight: { xs: '36px', sm: 'auto' },
                                      p: { xs: 0.5, sm: 1 }
                                    }}
                                  >
                                    <Star size={16} />
                                  </IconButton>
                                </Tooltip>
                              </>
                            )}
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}; 