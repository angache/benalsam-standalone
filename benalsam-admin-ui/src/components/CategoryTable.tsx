import React from 'react';
import {
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from '@mui/material';
import { type Category } from '../services/categoryService';
import { CategoryTableRow } from './CategoryTableRow';

interface CategoryTableProps {
  filteredCategories: Category[];
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

export const CategoryTable: React.FC<CategoryTableProps> = ({
  filteredCategories,
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
  return (
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
          {filteredCategories.map((category) => (
            <CategoryTableRow
              key={category.name}
              category={category}
              currentPath={currentPath}
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
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};
