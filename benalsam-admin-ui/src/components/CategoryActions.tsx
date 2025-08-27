import React from 'react';
import {
  Box,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Eye,
  Edit,
  Delete,
  Plus,
  ListTree,
  ArrowUp,
  ArrowDown,
  Star,
} from 'lucide-react';
import { type Category } from '../services/categoryService';

interface CategoryActionsProps {
  category: Category;
  path: string;
  isLeaf: boolean;
  sortOrderMode: boolean;
  isEditMode: boolean;
  deleteMutation: any;
  onView: (path: string) => void;
  onEdit: (path: string) => void;
  onDelete: (path: string, name: string) => void;
  onAddSubcategory: (path: string) => void;
  onEditAttributes: (path: string) => void;
  handleMoveUp: (category: Category) => void;
  handleMoveDown: (category: Category) => void;
  handleEditModeMoveUp: (category: Category) => void;
  handleEditModeMoveDown: (category: Category) => void;
  handleToggleFeatured: (id: number) => void;
}

export const CategoryActions: React.FC<CategoryActionsProps> = ({
  category,
  path,
  isLeaf,
  sortOrderMode,
  isEditMode,
  deleteMutation,
  onView,
  onEdit,
  onDelete,
  onAddSubcategory,
  onEditAttributes,
  handleMoveUp,
  handleMoveDown,
  handleEditModeMoveUp,
  handleEditModeMoveDown,
  handleToggleFeatured,
}) => {
  return (
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
              onClick={() => onView(path)}
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
              onClick={() => onEdit(path)}
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
                onClick={() => onEditAttributes(path)}
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
                onClick={() => onAddSubcategory(path)}
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
              onClick={() => onDelete(path, category.name)}
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

      {/* Düzenleme Modu Butonları */}
      {isEditMode && (
        <>
          <Tooltip title="Yukarı Taşı">
            <IconButton
              size="small"
              color="warning"
              onClick={() => {
                console.log('🔄 Edit mode - YUKARI OK tıklandı, kategori:', category.name);
                handleEditModeMoveUp(category);
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
                console.log('🔄 Edit mode - AŞAĞI OK tıklandı, kategori:', category.name);
                handleEditModeMoveDown(category);
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
        </>
      )}

      {/* Eski Sort Order Buttons (geriye uyumluluk için) */}
      {sortOrderMode && !isEditMode && (
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
  );
};
