import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  IconButton,
  Tooltip,
  Grid,
  Skeleton,
} from '@mui/material';
import {
  Folder,
  Edit,
  Delete,
  Eye,
  Plus,
  List as ListIcon,
} from 'lucide-react';
import type { Category } from '../services/categoryService';

interface CategoryGridProps {
  categories: Category[];
  currentPath: string;
  onNavigate: (path: string) => void;
  onView?: (path: string) => void;
  onEdit?: (path: string) => void;
  onDelete?: (path: string, name: string) => void;
  onAddSubcategory?: (parentPath: string) => void;
  onEditAttributes?: (path: string) => void;
  isLoading?: boolean;
}

export const CategoryGrid: React.FC<CategoryGridProps> = ({
  categories,
  currentPath,
  onNavigate,
  onView,
  onEdit,
  onDelete,
  onAddSubcategory,
  onEditAttributes,
  isLoading = false,
}) => {
  const handleCategoryClick = (category: Category) => {
    const newPath = currentPath ? `${currentPath}/${category.name}` : category.name;
    onNavigate(newPath);
  };

  const getCategoryPath = (category: Category) => {
    return currentPath ? `${currentPath}/${category.name}` : category.name;
  };

  if (isLoading) {
    return (
      <Grid container spacing={2}>
        {Array.from({ length: 6 }).map((_, index) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={index}>
            <Card>
              <CardContent>
                <Skeleton variant="rectangular" height={60} sx={{ mb: 1 }} />
                <Skeleton variant="text" width="60%" />
                <Skeleton variant="text" width="40%" />
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    );
  }

  if (categories.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="h6" color="text.secondary" gutterBottom>
          Bu seviyede kategori bulunamadı
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Yeni kategori eklemek için yukarıdaki butonu kullanabilirsiniz.
        </Typography>
      </Box>
    );
  }

  return (
    <Grid container spacing={2}>
      {categories.map((category) => {
        const path = getCategoryPath(category);
        const hasSubcategories = category.subcategories && category.subcategories.length > 0;
        const hasAttributes = category.attributes && category.attributes.length > 0;
        const isLeaf = !hasSubcategories;

        return (
          <Grid item xs={12} sm={6} md={4} lg={3} key={category.name}>
            <Card
              sx={{
                height: '100%',
                cursor: 'pointer',
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: 3,
                },
              }}
            >
              <CardContent
                onClick={() => handleCategoryClick(category)}
                sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}
              >
                {/* Category Icon and Info */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Box
                    sx={{
                      width: 50,
                      height: 50,
                      borderRadius: 2,
                      background: category.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: '1.2rem',
                    }}
                  >
                    <Folder size={24} />
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h6" fontWeight="bold" gutterBottom>
                      {category.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {category.icon} • {category.color}
                    </Typography>
                  </Box>
                </Box>

                {/* Category Stats */}
                <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                  {hasSubcategories && (
                    <Chip
                      label={`${category.subcategories!.length} alt kategori`}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  )}
                  {hasAttributes && (
                    <Chip
                      label={`${category.attributes!.length} özellik`}
                      size="small"
                      color="secondary"
                      variant="outlined"
                    />
                  )}
                  {isLeaf && (
                    <Chip
                      label="Son Kategori"
                      size="small"
                      color="success"
                      variant="outlined"
                    />
                  )}
                </Box>

                {/* Action Buttons */}
                <Box sx={{ 
                  display: 'flex', 
                  gap: 0.5, 
                  mt: 'auto',
                  pt: 1,
                  borderTop: '1px solid',
                  borderColor: 'divider',
                }}>
                  {onView && (
                    <Tooltip title="Görüntüle">
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={(e) => {
                          e.stopPropagation();
                          onView(path);
                        }}
                      >
                        <Eye size={16} />
                      </IconButton>
                    </Tooltip>
                  )}
                  
                  {onEdit && (
                    <Tooltip title="Düzenle">
                      <IconButton
                        size="small"
                        color="info"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEdit(path);
                        }}
                      >
                        <Edit size={16} />
                      </IconButton>
                    </Tooltip>
                  )}
                  
                  {onEditAttributes && isLeaf && (
                    <Tooltip title="Özellikleri Düzenle">
                      <IconButton
                        size="small"
                        color="secondary"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditAttributes(path);
                        }}
                      >
                        <ListIcon size={16} />
                      </IconButton>
                    </Tooltip>
                  )}
                  
                  {onAddSubcategory && !isLeaf && (
                    <Tooltip title="Alt Kategori Ekle">
                      <IconButton
                        size="small"
                        color="success"
                        onClick={(e) => {
                          e.stopPropagation();
                          onAddSubcategory(path);
                        }}
                      >
                        <Plus size={16} />
                      </IconButton>
                    </Tooltip>
                  )}
                  
                  {onDelete && (
                    <Tooltip title="Sil">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(path, category.name);
                        }}
                      >
                        <Delete size={16} />
                      </IconButton>
                    </Tooltip>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        );
      })}
    </Grid>
  );
}; 