import React from 'react';
import {
  Card,
  CardContent,
  Grid,
  TextField,
  Box,
  Chip,
  Button,
} from '@mui/material';
import {
  Search,
  Plus,
  RefreshCw,
  ListTree,
  Grid3X3,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';

type ViewMode = 'menu' | 'list';

interface CategorySearchAndControlsProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  currentCategories: any[];
  filteredCategories: any[];
  isEditMode: boolean;
  batchReorderMutation: any;
  pendingChanges: any[];
  startEditMode: () => void;
  saveEditMode: () => void;
  cancelEditMode: () => void;
}

export const CategorySearchAndControls: React.FC<CategorySearchAndControlsProps> = ({
  searchTerm,
  setSearchTerm,
  viewMode,
  setViewMode,
  currentCategories,
  filteredCategories,
  isEditMode,
  batchReorderMutation,
  pendingChanges,
  startEditMode,
  saveEditMode,
  cancelEditMode,
}) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return (
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
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};
