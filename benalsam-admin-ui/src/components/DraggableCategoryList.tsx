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
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Tooltip,
  Chip,
  Typography,
  Paper,
} from '@mui/material';
import {
  Folder,
  ChevronRight,
  Edit,
  Delete,
  Eye,
  Plus,
  List as ListIcon,
  ArrowUp,
  ArrowDown,
  Star,
  GripVertical,
} from 'lucide-react';
import type { Category } from '../services/categoryService';
import { getIconComponent } from '../utils/iconUtils';
import { getColorStyle, getColorName } from '../utils/colorUtils';

interface DraggableCategoryListProps {
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

// Sortable Category Item Component
const SortableCategoryItem: React.FC<{
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
    <ListItem
      ref={setNodeRef}
      style={style}
      sx={{
        border: isDragging ? '2px dashed #1976d2' : '1px solid transparent',
        borderRadius: 1,
        mb: 1,
        backgroundColor: isDragging ? 'rgba(25, 118, 210, 0.08)' : 'transparent',
        transition: 'all 0.2s ease',
        '&:hover': {
          backgroundColor: isDragging ? 'rgba(25, 118, 210, 0.12)' : 'rgba(0, 0, 0, 0.04)',
        },
      }}
    >
      <ListItemButton
        onClick={handleCategoryClick}
        sx={{
          borderRadius: 1,
          p: { xs: 1, sm: 1.5 },
          minHeight: { xs: '48px', sm: '56px' },
        }}
      >
        <ListItemIcon sx={{ minWidth: { xs: 40, sm: 48 } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
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
                <GripVertical size={18} color="#1976d2" />
              </Box>
            )}
            
            <Box
              sx={{
                width: { xs: 32, sm: 40 },
                height: { xs: 32, sm: 40 },
                borderRadius: 1,
                background: category.color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '0.9rem',
              }}
            >
              {React.createElement(getIconComponent(category.icon), { size: 20 })}
            </Box>
          </Box>
        </ListItemIcon>
        
        <ListItemText
          primary={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
              <Typography
                variant="body1"
                fontWeight="medium"
                sx={{
                  fontSize: { xs: '0.875rem', sm: '1rem' },
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
                      minWidth: { xs: '36px', sm: 'auto' },
                      minHeight: { xs: '36px', sm: 'auto' },
                      p: { xs: 0.5, sm: 1 }
                    }}
                  >
                    <ArrowUp size={16} />
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
                      minWidth: { xs: '36px', sm: 'auto' },
                      minHeight: { xs: '36px', sm: 'auto' },
                      p: { xs: 0.5, sm: 1 }
                    }}
                  >
                    <ArrowDown size={16} />
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
                      minWidth: { xs: '36px', sm: 'auto' },
                      minHeight: { xs: '36px', sm: 'auto' },
                      p: { xs: 0.5, sm: 1 }
                    }}
                  >
                    <Star size={16} />
                  </IconButton>
                </Tooltip>
              )}
            </>
          )}
        </Box>
      </ListItemSecondaryAction>
    </ListItem>
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
            width: 40,
            height: 40,
            borderRadius: 1,
            background: category.color,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
          }}
        >
          {React.createElement(getIconComponent(category.icon), { size: 20 })}
        </Box>
        <Typography variant="body1" fontWeight="medium">
          {category.name}
        </Typography>
      </Box>
    </Paper>
  );
};

// Main Draggable Category List Component
export const DraggableCategoryList: React.FC<DraggableCategoryListProps> = ({
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
      <List>
        {Array.from({ length: 6 }).map((_, index) => (
          <ListItem key={index}>
            <ListItemIcon>
              <Box sx={{ width: 40, height: 40, bgcolor: 'grey.300', borderRadius: 1 }} />
            </ListItemIcon>
            <ListItemText
              primary={<Box sx={{ width: '60%', height: 20, bgcolor: 'grey.300', borderRadius: 1 }} />}
              secondary={<Box sx={{ width: '40%', height: 16, bgcolor: 'grey.200', borderRadius: 1, mt: 0.5 }} />}
            />
          </ListItem>
        ))}
      </List>
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
        <List sx={{ p: 0 }}>
          {localCategories.map((category) => (
            <SortableCategoryItem
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
        </List>
      </SortableContext>

      <DragOverlay>
        {activeCategory ? <DragOverlayItem category={activeCategory} /> : null}
      </DragOverlay>
    </DndContext>
  );
};
