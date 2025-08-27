import React from 'react';
import {
  TableRow,
  TableCell,
  Box,
  Typography,
  Chip,
} from '@mui/material';
import { Folder } from 'lucide-react';
import { type Category } from '../services/categoryService';
import { CategoryActions } from './CategoryActions';

interface CategoryTableRowProps {
  category: Category;
  currentPath: string;
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

export const CategoryTableRow: React.FC<CategoryTableRowProps> = ({
  category,
  currentPath,
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
        <CategoryActions
          category={category}
          path={path}
          isLeaf={isLeaf}
          sortOrderMode={sortOrderMode}
          isEditMode={isEditMode}
          deleteMutation={deleteMutation}
          onView={onView}
          onEdit={onEdit}
          onDelete={onDelete}
          onAddSubcategory={onAddSubcategory}
          onEditAttributes={onEditAttributes}
          handleMoveUp={handleMoveUp}
          handleMoveDown={handleMoveDown}
          handleEditModeMoveUp={handleEditModeMoveUp}
          handleEditModeMoveDown={handleEditModeMoveDown}
          handleToggleFeatured={handleToggleFeatured}
        />
      </TableCell>
    </TableRow>
  );
};
