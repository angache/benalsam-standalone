import React, { useState } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Collapse,
  Chip,
  Tooltip,
  Paper,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
} from '@mui/material';
import {
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen,
  Settings,
  Edit,
  Delete,
  Eye,
  Plus,
  List as ListIcon,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Category } from '../services/categoryService';

interface CategoryTreeProps {
  categories: Category[];
  level?: number;
  onDelete?: (path: string, name: string) => void;
  onEdit?: (path: string) => void;
  onView?: (path: string) => void;
  onAddSubcategory?: (parentPath: string) => void;
  onEditAttributes?: (path: string) => void;
}

export const CategoryTree: React.FC<CategoryTreeProps> = ({
  categories,
  level = 0,
  onDelete,
  onEdit,
  onView,
  onAddSubcategory,
  onEditAttributes,
}) => {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const navigate = useNavigate();

  const toggleExpanded = (categoryName: string) => {
    const newExpanded = new Set(expanded);
    if (newExpanded.has(categoryName)) {
      newExpanded.delete(categoryName);
    } else {
      newExpanded.add(categoryName);
    }
    setExpanded(newExpanded);
  };

  const getCategoryPath = (category: Category, parentPath: string = ''): string => {
    const currentPath = parentPath ? `${parentPath}/${category.name}` : category.name;
    return currentPath;
  };

  const renderCategory = (category: Category, parentPath: string = '') => {
    const path = getCategoryPath(category, parentPath);
    const hasSubcategories = category.subcategories && category.subcategories.length > 0;
    const hasAttributes = category.attributes && category.attributes.length > 0;
    const isExpanded = expanded.has(category.name);
    const isLeaf = !hasSubcategories;

    return (
      <Box key={category.name} sx={{ ml: level * 2 }}>
        <ListItem
          sx={{
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 1,
            mb: 1,
            backgroundColor: 'background.paper',
            '&:hover': {
              backgroundColor: 'action.hover',
            },
          }}
        >
          <ListItemButton
            onClick={() => toggleExpanded(category.name)}
            sx={{ py: 1 }}
          >
            <ListItemIcon sx={{ minWidth: 40 }}>
              {hasSubcategories ? (
                isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />
              ) : (
                <Folder size={20} color={category.color} />
              )}
            </ListItemIcon>
            
            <ListItemText
              primary={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2" fontWeight="medium">
                    {category.name}
                  </Typography>
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
                      color="primary"
                      variant="outlined"
                    />
                  )}
                </Box>
              }
              secondary={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                  <Typography variant="caption" color="text.secondary">
                    {category.icon} • {category.color}
                  </Typography>
                  {hasSubcategories && (
                    <Typography variant="caption" color="text.secondary">
                      • {category.subcategories!.length} alt kategori
                    </Typography>
                  )}
                </Box>
              }
            />
          </ListItemButton>

          <ListItemSecondaryAction>
            <Box sx={{ display: 'flex', gap: 0.5 }}>
              {onView && (
                <Tooltip title="Görüntüle">
                  <IconButton
                    size="small"
                    color="primary"
                    onClick={() => onView(path)}
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
                    onClick={() => onEdit(path)}
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
                    onClick={() => onEditAttributes(path)}
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
                    onClick={() => onAddSubcategory(path)}
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
                    onClick={() => onDelete(path, category.name)}
                  >
                    <Delete size={16} />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
          </ListItemSecondaryAction>
        </ListItem>

        {hasSubcategories && (
          <Collapse in={isExpanded} timeout="auto" unmountOnExit>
            <CategoryTree
              categories={category.subcategories!}
              level={level + 1}
              onDelete={onDelete}
              onEdit={onEdit}
              onView={onView}
              onAddSubcategory={onAddSubcategory}
              onEditAttributes={onEditAttributes}
            />
          </Collapse>
        )}
      </Box>
    );
  };

  return (
    <List dense>
      {categories.map(category => renderCategory(category))}
    </List>
  );
}; 