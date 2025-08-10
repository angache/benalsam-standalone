import React from 'react';
import {
  Box,
  Typography,
  IconButton,
  Chip,
  Tooltip,
} from '@mui/material';
import {
  ChevronRight,
  Home,
  Folder,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Category } from '../services/categoryService';

interface CategoryBreadcrumbProps {
  path: string;
  onNavigate: (path: string) => void;
}

export const CategoryBreadcrumb: React.FC<CategoryBreadcrumbProps> = ({
  path,
  onNavigate,
}) => {
  const navigate = useNavigate();
  const pathParts = path.split('/').filter(Boolean);

  const handleHomeClick = () => {
    navigate('/categories');
  };

  const handlePathClick = (index: number) => {
    const targetPath = pathParts.slice(0, index + 1).join('/');
    onNavigate(targetPath);
  };

  return (
    <Box sx={{ 
      display: 'flex', 
      alignItems: 'center', 
      gap: { xs: 0.5, sm: 1 }, 
      p: { xs: 1, sm: 2 }, 
      backgroundColor: 'background.paper',
      border: '1px solid',
      borderColor: 'divider',
      borderRadius: 1,
      mb: { xs: 1, sm: 2 },
      flexWrap: 'wrap',
      minHeight: { xs: '40px', sm: '48px' },
      overflowX: 'auto'
    }}>
      <Tooltip title="Ana Kategoriler">
        <IconButton
          size="small"
          onClick={handleHomeClick}
          sx={{ 
            color: 'primary.main',
            '&:hover': { backgroundColor: 'primary.light', color: 'white' },
            minWidth: { xs: '32px', sm: 'auto' },
            minHeight: { xs: '32px', sm: 'auto' }
          }}
        >
          <Home size={16} />
        </IconButton>
      </Tooltip>

      {pathParts.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ 
          fontSize: { xs: '0.875rem', sm: '1rem' },
          textAlign: { xs: 'center', sm: 'left' }
        }}>
          Ana Kategoriler
        </Typography>
      ) : (
        pathParts.map((part, index) => (
          <React.Fragment key={index}>
            <ChevronRight size={16} color="text.secondary" />
            <Chip
              label={decodeURIComponent(part)}
              size="small"
              variant={index === pathParts.length - 1 ? "filled" : "outlined"}
              color={index === pathParts.length - 1 ? "primary" : "default"}
              onClick={() => handlePathClick(index)}
              sx={{ 
                cursor: 'pointer',
                fontSize: { xs: '0.7rem', sm: '0.875rem' },
                height: { xs: '24px', sm: '32px' },
                '&:hover': {
                  backgroundColor: index === pathParts.length - 1 ? 'primary.main' : 'action.hover',
                }
              }}
            />
          </React.Fragment>
        ))
      )}
    </Box>
  );
}; 