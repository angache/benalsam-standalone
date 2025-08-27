import React from 'react';
import {
  Box,
  Typography,
  Button,
} from '@mui/material';
import {
  Plus,
  RefreshCw,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';

interface CategoryHeaderProps {
  isEditMode: boolean;
  batchReorderMutation: any;
  pendingChanges: any[];
  startEditMode: () => void;
  saveEditMode: () => void;
  cancelEditMode: () => void;
}

export const CategoryHeader: React.FC<CategoryHeaderProps> = ({
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
        {/* Düzenleme Modu Butonları */}
        {isEditMode ? (
          <>
            <Button
              variant="contained"
              color="success"
              onClick={saveEditMode}
              disabled={batchReorderMutation.isPending}
              sx={{ 
                minWidth: { xs: '100%', sm: 'auto' },
                fontSize: { xs: '0.875rem', sm: '1rem' }
              }}
            >
              {batchReorderMutation.isPending ? 'Kaydediliyor...' : `Kaydet (${pendingChanges.length} değişiklik)`}
            </Button>
            <Button
              variant="outlined"
              color="error"
              onClick={cancelEditMode}
              disabled={batchReorderMutation.isPending}
              sx={{ 
                minWidth: { xs: '100%', sm: 'auto' },
                fontSize: { xs: '0.875rem', sm: '1rem' }
              }}
            >
              İptal
            </Button>
          </>
        ) : (
          <>
            {/* Normal Mod Butonları */}
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
            
            {/* Düzenleme Modu Başlat Butonu */}
            <Button
              variant="contained"
              color="warning"
              onClick={startEditMode}
              sx={{ 
                minWidth: { xs: '100%', sm: 'auto' },
                fontSize: { xs: '0.875rem', sm: '1rem' }
              }}
            >
              📝 Düzenleme Modu
            </Button>
          </>
        )}
      </Box>
    </Box>
  );
};
