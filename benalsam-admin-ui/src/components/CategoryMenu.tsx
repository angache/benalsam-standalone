import React from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Tooltip,
  Chip,
  Skeleton,
  Typography,
} from '@mui/material';
import {
  Folder,
  ChevronRight,
  Edit,
  Delete,
  Eye,
  Plus,
  List as ListIcon,
} from 'lucide-react';
import type { Category } from '../services/categoryService';
import { getIconComponent } from '../utils/iconUtils';
import { getColorStyle, getColorName } from '../utils/colorUtils';

interface CategoryMenuProps {
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

export const CategoryMenu: React.FC<CategoryMenuProps> = ({
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
    const hasSubcategories = category.subcategories && category.subcategories.length > 0;
    
    // Leaf kategoriler tıklanamaz
    if (!hasSubcategories) {
      return;
    }
    
    const newPath = currentPath ? `${currentPath}/${category.name}` : category.name;
    onNavigate(newPath);
  };

  const getCategoryPath = (category: Category) => {
    return currentPath ? `${currentPath}/${category.name}` : category.name;
  };

  if (isLoading) {
    return (
      <List>
        {Array.from({ length: 6 }).map((_, index) => (
          <ListItem key={index}>
            <ListItemIcon>
              <Skeleton variant="circular" width={40} height={40} />
            </ListItemIcon>
            <ListItemText
              primary={<Skeleton variant="text" width="60%" />}
              secondary={<Skeleton variant="text" width="40%" />}
            />
          </ListItem>
        ))}
      </List>
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
    <List sx={{ 
      width: '100%', 
      bgcolor: 'background.paper',
      p: { xs: 1, sm: 2 }
    }}>
      {categories.map((category) => {
        const path = getCategoryPath(category);
        const hasSubcategories = category.subcategories && category.subcategories.length > 0;
        const hasAttributes = category.attributes && category.attributes.length > 0;
        const isLeaf = !hasSubcategories;

        return (
          <ListItem
            key={category.name}
            disablePadding
            sx={{
              mb: { xs: 0.5, sm: 1 },
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 1,
              '&:hover': {
                backgroundColor: 'action.hover',
              },
            }}
          >
            <ListItemButton
              onClick={() => handleCategoryClick(category)}
              disabled={isLeaf}
              sx={{ 
                py: { xs: 1.5, sm: 2 },
                px: { xs: 1, sm: 2 },
                opacity: isLeaf ? 0.7 : 1,
                cursor: isLeaf ? 'default' : 'pointer',
              }}
            >
              <ListItemIcon>
                <Box
                  sx={{
                    width: { xs: 32, sm: 40 },
                    height: { xs: 32, sm: 40 },
                    borderRadius: 1,
                    background: getColorStyle(category.color),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                  }}
                >
                  {(() => {
                    const IconComponent = getIconComponent(category.icon);
                    return <IconComponent size={20} />;
                  })()}
                </Box>
              </ListItemIcon>
              
              <ListItemText
                primary={
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: { xs: 0.5, sm: 1 },
                    flexWrap: 'wrap'
                  }}>
                    <Typography variant="subtitle1" fontWeight="medium" sx={{ 
                      fontSize: { xs: '0.875rem', sm: '1rem' }
                    }}>
                      {category.name}
                    </Typography>
                    {hasSubcategories && (
                      <Chip
                        label={`${category.subcategories!.length} alt`}
                        size="small"
                        color="primary"
                        variant="outlined"
                        sx={{ fontSize: { xs: '0.6rem', sm: '0.75rem' } }}
                      />
                    )}
                    {hasAttributes && isLeaf && (
                      <Chip
                        label={`${category.attributes!.length} öz`}
                        size="small"
                        color="secondary"
                        variant="outlined"
                        sx={{ fontSize: { xs: '0.6rem', sm: '0.75rem' } }}
                      />
                    )}
                    {isLeaf && (
                      <Chip
                        label="Son"
                        size="small"
                        color="success"
                        variant="outlined"
                        sx={{ fontSize: { xs: '0.6rem', sm: '0.75rem' } }}
                      />
                    )}
                  </Box>
                }
                secondary={
                  <Typography variant="body2" color="text.secondary" sx={{ 
                    fontSize: { xs: '0.7rem', sm: '0.875rem' }
                  }}>
                    {category.icon} • {getColorName(category.color)}
                  </Typography>
                }
              />
              
              {!isLeaf && <ChevronRight size={20} color="text.secondary" />}
            </ListItemButton>
            
            <ListItemSecondaryAction>
              <Box sx={{ 
                display: 'flex', 
                gap: 0.5,
                flexDirection: { xs: 'row', sm: 'row' },
                alignItems: { xs: 'center', sm: 'flex-end' },
                flexWrap: 'wrap'
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
                      sx={{ 
                        minWidth: { xs: '36px', sm: 'auto' },
                        minHeight: { xs: '36px', sm: 'auto' },
                        p: { xs: 0.5, sm: 1 }
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
                      sx={{ 
                        minWidth: { xs: '36px', sm: 'auto' },
                        minHeight: { xs: '36px', sm: 'auto' },
                        p: { xs: 0.5, sm: 1 }
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
                      sx={{ 
                        minWidth: { xs: '36px', sm: 'auto' },
                        minHeight: { xs: '36px', sm: 'auto' },
                        p: { xs: 0.5, sm: 1 }
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
                
                {onDelete && (
                  <Tooltip title="Sil">
                    <IconButton
                      size="small"
                      color="error"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(path, category.name);
                      }}
                      sx={{ 
                        minWidth: { xs: '36px', sm: 'auto' },
                        minHeight: { xs: '36px', sm: 'auto' },
                        p: { xs: 0.5, sm: 1 }
                      }}
                    >
                      <Delete size={16} />
                    </IconButton>
                  </Tooltip>
                )}
              </Box>
            </ListItemSecondaryAction>
          </ListItem>
        );
      })}
    </List>
  );
}; 