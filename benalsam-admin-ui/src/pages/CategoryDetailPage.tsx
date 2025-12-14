import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  Button,
  IconButton,
  Tooltip,
  Alert,
  Skeleton,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from '@mui/material';
import {
  ArrowLeft,
  Edit,
  Delete,
  Folder,
  Settings,
  Plus,
  Eye,
  List as ListIcon,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { categoryService, type Category } from '../services/categoryService';
import { getIconComponent } from '../utils/iconUtils';
import { getColorStyle, getColorName } from '../utils/colorUtils';

export const CategoryDetailPage: React.FC = () => {
  const params = useParams();
  console.log('🔍 CategoryDetailPage params:', params);
  // Support multiple param formats: path, id, or wildcard (*)
  const categoryIdentifier = params.path || params.id || params['*'] || params['0'];
  console.log('🎯 Category identifier:', categoryIdentifier);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Fetch category
  const { data: category, isLoading, error } = useQuery({
    queryKey: ['category', categoryIdentifier],
    queryFn: () => categoryService.getCategory(categoryIdentifier!),
    enabled: !!categoryIdentifier,
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (path: string) => categoryService.deleteCategory(path),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      navigate('/categories');
    },
  });

  const handleDelete = () => {
    if (window.confirm(`"${category?.name}" kategorisini silmek istediğinizden emin misiniz?`)) {
      deleteMutation.mutate(path!);
    }
  };

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          Kategori yüklenirken bir hata oluştu. Lütfen sayfayı yenileyin.
        </Alert>
      </Box>
    );
  }

  if (isLoading) {
    return (
      <Box sx={{ p: 3 }}>
        <Skeleton variant="rectangular" height={400} />
      </Box>
    );
  }

  if (!category) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning">
          Kategori bulunamadı.
        </Alert>
      </Box>
    );
  }

  const hasSubcategories = category.subcategories && category.subcategories.length > 0;
  const hasAttributes = category.attributes && category.attributes.length > 0;
  const isLeaf = !hasSubcategories;

  return (
    <Box sx={{ maxWidth: '100%', overflowX: 'hidden' }}>
      {/* Header */}
      <Box sx={{ 
        display: 'flex', 
        flexDirection: { xs: 'column', lg: 'row' },
        justifyContent: 'space-between', 
        alignItems: { xs: 'stretch', lg: 'center' }, 
        gap: { xs: 2, lg: 0 },
        mb: { xs: 2, sm: 3 },
        p: { xs: 1, sm: 0 }
      }}>
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 2,
          flexDirection: { xs: 'column', sm: 'row' },
          textAlign: { xs: 'center', sm: 'left' }
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton onClick={() => navigate('/categories')}>
              <ArrowLeft size={20} />
            </IconButton>
            <Typography variant="h4" component="h1" sx={{ 
              fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' },
              wordBreak: 'break-word'
            }}>
              {category.name}
            </Typography>
          </Box>
          <Chip
            label={isLeaf ? 'Son Kategori' : 'Ana Kategori'}
            color={isLeaf ? 'primary' : 'secondary'}
            variant="outlined"
            sx={{ alignSelf: { xs: 'center', sm: 'flex-start' } }}
          />
        </Box>
        
        <Box sx={{ 
          display: 'flex', 
          gap: 1,
          flexDirection: { xs: 'column', sm: 'row' },
          width: { xs: '100%', lg: 'auto' }
        }}>
          <Button
            variant="outlined"
            startIcon={<Edit />}
            onClick={() => navigate(`/categories/${encodeURIComponent(path!)}/edit`)}
            sx={{ 
              minWidth: { xs: '100%', sm: 'auto' },
              fontSize: { xs: '0.875rem', sm: '1rem' }
            }}
          >
            ✏️ Kategori Düzenle
          </Button>
          
          {isLeaf && (
            <Button
              variant="contained"
              startIcon={<ListIcon />}
              onClick={() => navigate(`/categories/${encodeURIComponent(path!)}/attributes`)}
              sx={{ 
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
                },
                minWidth: { xs: '100%', sm: 'auto' },
                fontSize: { xs: '0.875rem', sm: '1rem' }
              }}
            >
              📋 Özellikleri Düzenle
            </Button>
          )}
          
          {!isLeaf && (
            <Button
              variant="contained"
              startIcon={<Plus />}
              onClick={() => navigate(`/categories/${encodeURIComponent(path!)}/add-subcategory`)}
              sx={{ 
                minWidth: { xs: '100%', sm: 'auto' },
                fontSize: { xs: '0.875rem', sm: '1rem' }
              }}
            >
              ➕ Alt Kategori Ekle
            </Button>
          )}
          
          <Button
            variant="outlined"
            color="error"
            startIcon={<Delete />}
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
            sx={{ 
              minWidth: { xs: '100%', sm: 'auto' },
              fontSize: { xs: '0.875rem', sm: '1rem' }
            }}
          >
            🗑️ Sil
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Category Info */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Kategori Bilgileri
              </Typography>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Box
                  sx={{
                    width: 60,
                    height: 60,
                    borderRadius: 2,
                    background: getColorStyle(category.color),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '1.5rem',
                  }}
                >
                  {(() => {
                    const IconComponent = getIconComponent(category.icon);
                    return <IconComponent size={30} />;
                  })()}
                </Box>
                <Box>
                  <Typography variant="h5" fontWeight="bold">
                    {category.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    İkon: {category.icon} • Renk: {getColorName(category.color)}
                  </Typography>
                </Box>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Alt Kategoriler
                  </Typography>
                  <Typography variant="h6" color="primary.main">
                    {category.subcategories?.length || 0}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    {isLeaf ? 'Özellikler' : 'Alt Kategoriler'}
                  </Typography>
                  <Typography variant="h6" color="secondary.main">
                    {isLeaf ? (category.attributes?.length || 0) : (category.subcategories?.length || 0)}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Subcategories */}
        {hasSubcategories && (
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">
                    📁 Alt Kategoriler ({category.subcategories!.length})
                  </Typography>
                  <Chip
                    label={`${category.subcategories!.length} Alt Kategori`}
                    color="primary"
                    variant="outlined"
                    size="small"
                  />
                </Box>
                
                <List dense>
                  {category.subcategories!.map((subcategory) => (
                    <ListItem
                      key={subcategory.name}
                      sx={{
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 2,
                        mb: 1.5,
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          backgroundColor: 'action.hover',
                          transform: 'translateY(-1px)',
                          boxShadow: 1,
                        },
                      }}
                      secondaryAction={
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          <Tooltip title="Görüntüle">
                            <IconButton
                              size="small"
                              onClick={() => navigate(`/categories/${encodeURIComponent(path!)}/${encodeURIComponent(subcategory.name)}`)}
                            >
                              <Eye size={16} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Düzenle">
                            <IconButton
                              size="small"
                              onClick={() => navigate(`/categories/${encodeURIComponent(path!)}/${encodeURIComponent(subcategory.name)}/edit`)}
                            >
                              <Edit size={16} />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      }
                    >
                      <ListItemIcon>
                        <Box
                          sx={{
                            width: 32,
                            height: 32,
                            borderRadius: 1,
                            background: getColorStyle(subcategory.color),
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                          }}
                        >
                          {(() => {
                            const IconComponent = getIconComponent(subcategory.icon);
                            return <IconComponent size={16} />;
                          })()}
                        </Box>
                      </ListItemIcon>
                      <ListItemText
                        primary={subcategory.name}
                        secondary={`${subcategory.subcategories?.length || 0} alt kategori • ${subcategory.attributes?.length || 0} özellik`}
                      />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Attributes - Only show for leaf categories */}
        {isLeaf && (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">
                    📋 Kategori Özellikleri ({category.attributes?.length || 0})
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    {hasAttributes && (
                      <Chip
                        label={`${category.attributes!.length} Özellik`}
                        color="success"
                        variant="outlined"
                        size="small"
                      />
                    )}
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<ListIcon />}
                      onClick={() => navigate(`/categories/${encodeURIComponent(path!)}/attributes`)}
                    >
                      {hasAttributes ? 'Düzenle' : 'Ekle'}
                    </Button>
                  </Box>
                </Box>
                
                {!hasAttributes ? (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                      Henüz özellik tanımlanmamış
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                      Bu kategori için özellikler ekleyerek kullanıcıların daha detaylı bilgi girmesini sağlayabilirsiniz.
                    </Typography>
                    <Button
                      variant="contained"
                      startIcon={<Plus />}
                      onClick={() => navigate(`/categories/${encodeURIComponent(path!)}/attributes`)}
                    >
                      📋 İlk Özelliği Ekle
                    </Button>
                  </Box>
                ) : (
                  <Grid container spacing={2}>
                    {category.attributes!.map((attribute) => (
                      <Grid item xs={12} sm={6} md={4} key={attribute.key}>
                        <Card 
                          variant="outlined"
                          sx={{
                            transition: 'all 0.2s ease',
                            '&:hover': {
                              transform: 'translateY(-2px)',
                              boxShadow: 2,
                            },
                          }}
                        >
                          <CardContent>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                              <Typography variant="subtitle1" fontWeight="bold">
                                {attribute.label}
                              </Typography>
                              <Chip
                                label={attribute.required ? 'Zorunlu' : 'İsteğe Bağlı'}
                                size="small"
                                color={attribute.required ? 'error' : 'default'}
                                variant="outlined"
                              />
                            </Box>
                            
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                              🔑 Anahtar: <code>{attribute.key}</code>
                            </Typography>
                            
                            <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                              <Chip
                                label={attribute.type}
                                size="small"
                                color="primary"
                                variant="outlined"
                              />
                            </Box>
                            
                            {attribute.options && attribute.options.length > 0 && (
                              <Box sx={{ mt: 2 }}>
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                                  📋 Seçenekler ({attribute.options.length}):
                                </Typography>
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                  {attribute.options.slice(0, 3).map((option) => (
                                    <Chip
                                      key={option}
                                      label={option}
                                      size="small"
                                      variant="outlined"
                                      sx={{ fontSize: '0.7rem' }}
                                    />
                                  ))}
                                  {attribute.options.length > 3 && (
                                    <Chip
                                      label={`+${attribute.options.length - 3} daha`}
                                      size="small"
                                      variant="outlined"
                                      color="info"
                                    />
                                  )}
                                </Box>
                              </Box>
                            )}
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                )}
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>
    </Box>
  );
}; 