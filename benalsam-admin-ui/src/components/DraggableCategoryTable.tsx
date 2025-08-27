import React, { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from '@dnd-kit/core';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  Chip,
  Typography,
  Paper,
  Button,
} from '@mui/material';
import {
  Folder,
  Edit,
  Delete,
  Eye,
  Plus,
  List as ListIcon,
  ArrowUp,
  ArrowDown,
  Star,
  GripVertical,
  ChevronRight,
} from 'lucide-react';
import type { Category } from '../services/categoryService';
import { getIconComponent } from '../utils/iconUtils';
import { getColorStyle, getColorName } from '../utils/colorUtils';

interface DraggableCategoryTableProps {
  categories: Category[];
  currentPath: string;
  onNavigate: (path: string) => void;
  onView?: (path: string) => void;
  onEdit?: (path: string) => void;
  onDelete?: (path: string, name: string) => void;
  onAddSubcategory?: (parentPath: string) => void;
  onEditAttributes?: (path: string) => void;
  isLoading?: boolean;
  isEditMode?: boolean;
  onMoveUp?: (category: Category) => void;
  onMoveDown?: (category: Category) => void;
  onToggleFeatured?: (categoryId: number) => void;
  onReorder?: (categories: Category[]) => void;
}

// Sortable Table Row Component
const SortableTableRow: React.FC<{
  category: Category;
  currentPath: string;
  onNavigate: (path: string) => void;
  onView?: (path: string) => void;
  onEdit?: (path: string) => void;
  onDelete?: (path: string, name: string) => void;
  onAddSubcategory?: (parentPath: string) => void;
  onEditAttributes?: (path: string) => void;
  isEditMode?: boolean;
  onMoveUp?: (category: Category) => void;
  onMoveDown?: (category: Category) => void;
  onToggleFeatured?: (categoryId: number) => void;
}> = ({
  category,
  currentPath,
  onNavigate,
  onView,
  onEdit,
  onDelete,
  onAddSubcategory,
  onEditAttributes,
  isEditMode = false,
  onMoveUp,
  onMoveDown,
  onToggleFeatured,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: category.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleCategoryClick = () => {
    const hasSubcategories = category.subcategories && category.subcategories.length > 0;
    
    if (!hasSubcategories) {
      return;
    }
    
    const newPath = currentPath ? `${currentPath}/${category.name}` : category.name;
    onNavigate(newPath);
  };

  const getCategoryPath = () => {
    return currentPath ? `${currentPath}/${category.name}` : category.name;
  };

  const path = getCategoryPath();
  const hasSubcategories = category.subcategories && category.subcategories.length > 0;
  const hasAttributes = category.attributes && category.attributes.length > 0;
  const isLeaf = !hasSubcategories;

  return (
    <TableRow
      ref={setNodeRef}
      style={style}
      sx={{
        border: isDragging ? '2px dashed #1976d2' : '1px solid transparent',
        backgroundColor: isDragging ? 'rgba(25, 118, 210, 0.08)' : 'transparent',
        transition: 'all 0.2s ease',
        '&:hover': {
          backgroundColor: isDragging ? 'rgba(25, 118, 210, 0.12)' : 'rgba(0, 0, 0, 0.04)',
        },
        cursor: hasSubcategories ? 'pointer' : 'default',
      }}
      onClick={handleCategoryClick}
    >
      <TableCell sx={{ p: { xs: 1, sm: 1.5, md: 2 } }}>
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: { xs: 1, sm: 2 },
          flexDirection: { xs: 'column', sm: 'row' },
          textAlign: { xs: 'center', sm: 'left' }
        }}>
          {/* Drag Handle - sadece düzenleme modunda görünür */}
          {isEditMode && (
            <Box
              {...attributes}
              {...listeners}
              sx={{
                cursor: 'grab',
                p: 0.5,
                borderRadius: 0.5,
                backgroundColor: 'rgba(25, 118, 210, 0.1)',
                border: '1px solid rgba(25, 118, 210, 0.3)',
                '&:hover': {
                  backgroundColor: 'rgba(25, 118, 210, 0.2)',
                  border: '1px solid rgba(25, 118, 210, 0.5)',
                },
                '&:active': {
                  cursor: 'grabbing',
                  backgroundColor: 'rgba(25, 118, 210, 0.3)',
                },
              }}
            >
              <GripVertical size={16} color="#1976d2" />
            </Box>
          )}
          
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
            {React.createElement(getIconComponent(category.icon), { size: 16 })}
          </Box>
          
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: { xs: 'center', sm: 'flex-start' },
            gap: 0.5
          }}>
            <Typography
              variant="body2"
              fontWeight="medium"
              sx={{
                fontSize: { xs: '0.75rem', sm: '0.875rem' },
                color: isDragging ? 'text.secondary' : 'text.primary',
              }}
            >
              {category.name}
            </Typography>
            
            {category.is_featured && (
              <Chip
                label="Öne Çıkan"
                size="small"
                color="success"
                variant="outlined"
                sx={{ fontSize: { xs: '0.6rem', sm: '0.75rem' } }}
              />
            )}
          </Box>
          
          {!isLeaf && <ChevronRight size={16} color="text.secondary" />}
        </Box>
      </TableCell>
      
      <TableCell sx={{ p: { xs: 1, sm: 1.5, md: 2 } }}>
        <Typography variant="body2" sx={{ fontSize: { xs: '0.7rem', sm: '0.875rem' } }}>
          {currentPath.split('/').length}
        </Typography>
      </TableCell>
      
      <TableCell sx={{ p: { xs: 1, sm: 1.5, md: 2 } }}>
        <Typography variant="body2" sx={{ fontSize: { xs: '0.7rem', sm: '0.875rem' } }}>
          {hasAttributes ? `${category.attributes?.length} özellik` : 'Yok'}
        </Typography>
      </TableCell>
      
      <TableCell sx={{ p: { xs: 1, sm: 1.5, md: 2 } }}>
        <Typography variant="body2" sx={{ fontSize: { xs: '0.7rem', sm: '0.875rem' } }}>
          {hasSubcategories ? `${category.subcategories?.length} alt kategori` : 'Yok'}
        </Typography>
      </TableCell>
      
      <TableCell align="right" sx={{ p: { xs: 1, sm: 1.5, md: 2 } }}>
        <Box sx={{ 
          display: 'flex', 
          gap: 0.5,
          justifyContent: { xs: 'center', sm: 'flex-end' },
          flexWrap: 'wrap'
        }}>
          {/* Normal Action Buttons */}
          {!isEditMode && (
            <>
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
                      minWidth: { xs: '32px', sm: 'auto' },
                      minHeight: { xs: '32px', sm: 'auto' },
                      p: { xs: 0.5, sm: 1 }
                    }}
                  >
                    <Eye size={14} />
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
                      minWidth: { xs: '32px', sm: 'auto' },
                      minHeight: { xs: '32px', sm: 'auto' },
                      p: { xs: 0.5, sm: 1 }
                    }}
                  >
                    <Edit size={14} />
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
                      minWidth: { xs: '32px', sm: 'auto' },
                      minHeight: { xs: '32px', sm: 'auto' },
                      p: { xs: 0.5, sm: 1 }
                    }}
                  >
                    <ListIcon size={14} />
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
                      minWidth: { xs: '32px', sm: 'auto' },
                      minHeight: { xs: '32px', sm: 'auto' },
                      p: { xs: 0.5, sm: 1 }
                    }}
                  >
                    <Plus size={14} />
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
                      minWidth: { xs: '32px', sm: 'auto' },
                      minHeight: { xs: '32px', sm: 'auto' },
                      p: { xs: 0.5, sm: 1 }
                    }}
                  >
                    <Delete size={14} />
                  </IconButton>
                </Tooltip>
              )}
            </>
          )}

          {/* Edit Mode Buttons */}
          {isEditMode && (
            <>
              {onMoveUp && (
                <Tooltip title="Yukarı Taşı">
                  <IconButton
                    size="small"
                    color="warning"
                    onClick={(e) => {
                      e.stopPropagation();
                      onMoveUp(category);
                    }}
                    sx={{ 
                      minWidth: { xs: '32px', sm: 'auto' },
                      minHeight: { xs: '32px', sm: 'auto' },
                      p: { xs: 0.5, sm: 1 }
                    }}
                  >
                    <ArrowUp size={14} />
                  </IconButton>
                </Tooltip>
              )}
              
              {onMoveDown && (
                <Tooltip title="Aşağı Taşı">
                  <IconButton
                    size="small"
                    color="warning"
                    onClick={(e) => {
                      e.stopPropagation();
                      onMoveDown(category);
                    }}
                    sx={{ 
                      minWidth: { xs: '32px', sm: 'auto' },
                      minHeight: { xs: '32px', sm: 'auto' },
                      p: { xs: 0.5, sm: 1 }
                    }}
                  >
                    <ArrowDown size={14} />
                  </IconButton>
                </Tooltip>
              )}
              
              {onToggleFeatured && (
                <Tooltip title={category.is_featured ? "Öne Çıkanı Kaldır" : "Öne Çıkar"}>
                  <IconButton
                    size="small"
                    color={category.is_featured ? "success" : "default"}
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleFeatured(category.id);
                    }}
                    sx={{ 
                      minWidth: { xs: '32px', sm: 'auto' },
                      minHeight: { xs: '32px', sm: 'auto' },
                      p: { xs: 0.5, sm: 1 }
                    }}
                  >
                    <Star size={14} />
                  </IconButton>
                </Tooltip>
              )}
            </>
          )}
        </Box>
      </TableCell>
    </TableRow>
  );
};

// Drag Overlay Component
const DragOverlayItem: React.FC<{ category: Category }> = ({ category }) => {
  return (
    <Paper
      elevation={8}
      sx={{
        p: 2,
        borderRadius: 2,
        backgroundColor: 'background.paper',
        border: '2px solid #1976d2',
        transform: 'rotate(5deg)',
        maxWidth: 300,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Box
          sx={{
            width: 32,
            height: 32,
            borderRadius: 1,
            background: category.color,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
          }}
        >
          {React.createElement(getIconComponent(category.icon), { size: 16 })}
        </Box>
        <Typography variant="body2" fontWeight="medium">
          {category.name}
        </Typography>
      </Box>
    </Paper>
  );
};

// Main Draggable Category Table Component
export const DraggableCategoryTable: React.FC<DraggableCategoryTableProps> = ({
  categories,
  currentPath,
  onNavigate,
  onView,
  onEdit,
  onDelete,
  onAddSubcategory,
  onEditAttributes,
  isLoading = false,
  isEditMode = false,
  onMoveUp,
  onMoveDown,
  onToggleFeatured,
  onReorder,
}) => {
  const [activeId, setActiveId] = useState<number | null>(null);
  const [localCategories, setLocalCategories] = useState<Category[]>(categories);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as number);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (active.id !== over?.id) {
      const oldIndex = localCategories.findIndex(cat => cat.id === active.id);
      const newIndex = localCategories.findIndex(cat => cat.id === over?.id);

      const newCategories = arrayMove(localCategories, oldIndex, newIndex);
      setLocalCategories(newCategories);

      // Call onReorder callback if provided
      if (onReorder) {
        onReorder(newCategories);
      }
    }
  };

  // Update local categories when props change
  React.useEffect(() => {
    setLocalCategories(categories);
  }, [categories]);

  if (isLoading) {
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
              <TableCell>Kategori</TableCell>
              <TableCell>Seviye</TableCell>
              <TableCell>Özellikler</TableCell>
              <TableCell>Alt Kategoriler</TableCell>
              <TableCell align="right">İşlemler</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {Array.from({ length: 6 }).map((_, index) => (
              <TableRow key={index}>
                <TableCell><Box sx={{ width: '60%', height: 20, bgcolor: 'grey.300', borderRadius: 1 }} /></TableCell>
                <TableCell><Box sx={{ width: '40%', height: 16, bgcolor: 'grey.200', borderRadius: 1 }} /></TableCell>
                <TableCell><Box sx={{ width: '50%', height: 16, bgcolor: 'grey.200', borderRadius: 1 }} /></TableCell>
                <TableCell><Box sx={{ width: '50%', height: 16, bgcolor: 'grey.200', borderRadius: 1 }} /></TableCell>
                <TableCell><Box sx={{ width: '40%', height: 16, bgcolor: 'grey.200', borderRadius: 1 }} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  }

  if (localCategories.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="h6" color="text.secondary" gutterBottom>
          Kategori bulunamadı
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Bu seviyede kategori bulunmuyor.
        </Typography>
      </Box>
    );
  }

  const activeCategory = activeId ? localCategories.find(cat => cat.id === activeId) : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={localCategories.map(cat => cat.id)}
        strategy={verticalListSortingStrategy}
      >
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
              {localCategories.map((category) => (
                <SortableTableRow
                  key={category.id}
                  category={category}
                  currentPath={currentPath}
                  onNavigate={onNavigate}
                  onView={onView}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onAddSubcategory={onAddSubcategory}
                  onEditAttributes={onEditAttributes}
                  isEditMode={isEditMode}
                  onMoveUp={onMoveUp}
                  onMoveDown={onMoveDown}
                  onToggleFeatured={onToggleFeatured}
                />
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </SortableContext>

      <DragOverlay>
        {activeCategory ? <DragOverlayItem category={activeCategory} /> : null}
      </DragOverlay>
    </DndContext>
  );
};

