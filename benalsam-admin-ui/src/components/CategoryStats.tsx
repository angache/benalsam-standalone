import React from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Skeleton,
} from '@mui/material';
import { type Category } from '../services/categoryService';

interface CategoryStatsProps {
  categories: Category[] | undefined;
  allFlattenedCategories: Array<Category & { path: string; level: number }>;
  isLoading: boolean;
}

export const CategoryStats: React.FC<CategoryStatsProps> = ({
  categories,
  allFlattenedCategories,
  isLoading,
}) => {
  return (
    <Grid container spacing={2} sx={{ mb: { xs: 2, sm: 3 } }}>
      <Grid item xs={6} sm={6} md={3}>
        <Card sx={{ height: '100%' }}>
          <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
            <Typography color="text.secondary" gutterBottom sx={{ 
              fontSize: { xs: '0.75rem', sm: '0.875rem' }
            }}>
              Toplam Kategori
            </Typography>
            <Typography variant="h4" component="div" sx={{ 
              fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' }
            }}>
              {isLoading ? <Skeleton width={60} /> : allFlattenedCategories.length}
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      
      <Grid item xs={6} sm={6} md={3}>
        <Card sx={{ height: '100%' }}>
          <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
            <Typography color="text.secondary" gutterBottom sx={{ 
              fontSize: { xs: '0.75rem', sm: '0.875rem' }
            }}>
              Ana Kategoriler
            </Typography>
            <Typography variant="h4" component="div" color="primary.main" sx={{ 
              fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' }
            }}>
              {isLoading ? <Skeleton width={60} /> : categories?.length || 0}
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      
      <Grid item xs={6} sm={6} md={3}>
        <Card sx={{ height: '100%' }}>
          <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
            <Typography color="text.secondary" gutterBottom sx={{ 
              fontSize: { xs: '0.75rem', sm: '0.875rem' }
            }}>
              Son Kategoriler
            </Typography>
            <Typography variant="h4" component="div" color="secondary.main" sx={{ 
              fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' }
            }}>
              {isLoading ? <Skeleton width={60} /> : 
               allFlattenedCategories.filter(cat => !cat.subcategories || cat.subcategories.length === 0).length}
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      
      <Grid item xs={6} sm={6} md={3}>
        <Card sx={{ height: '100%' }}>
          <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
            <Typography color="text.secondary" gutterBottom sx={{ 
              fontSize: { xs: '0.75rem', sm: '0.875rem' }
            }}>
              Toplam Özellik
            </Typography>
            <Typography variant="h4" component="div" color="success.main" sx={{ 
              fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' }
            }}>
              {isLoading ? <Skeleton width={60} /> : 
               allFlattenedCategories.reduce((sum, cat) => sum + (cat.attributes?.length || 0), 0)}
            </Typography>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};
