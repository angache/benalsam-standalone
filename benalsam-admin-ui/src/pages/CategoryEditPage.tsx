import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  IconButton,
  Alert,
  Skeleton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Grid,
  Divider,
} from '@mui/material';
import {
  ArrowLeft,
  Save,
  X,
  Palette,
  Folder,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { categoryService, type Category } from '../services/categoryService';
import { IconSelector } from '../components/IconSelector';
import { getIconComponent } from '../utils/iconUtils';
import { getColorStyle, getColorName } from '../utils/colorUtils';

export const CategoryEditPage: React.FC = () => {
  const params = useParams();
  console.log('🔍 CategoryEditPage params:', params);
  // Support multiple param formats: path, id, or wildcard (*)
  const categoryIdentifier = params.path || params.id || params['*'] || params['0'];
  console.log('🎯 Category identifier:', categoryIdentifier);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    icon: '',
    color: '',
  });

  // Icon selector state
  const [iconSelectorOpen, setIconSelectorOpen] = useState(false);

  // Fetch category
  const { data: category, isLoading, error } = useQuery({
    queryKey: ['category', categoryIdentifier],
    queryFn: () => categoryService.getCategory(categoryIdentifier!),
    enabled: !!categoryIdentifier,
  });

  // Update form data when category is loaded
  React.useEffect(() => {
    if (category) {
      setFormData({
        name: category.name,
        icon: category.icon,
        color: category.color,
      });
    }
  }, [category]);

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: (data: Partial<Category>) => categoryService.updateCategory(categoryIdentifier!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['category', categoryIdentifier] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      navigate(`/categories/${encodeURIComponent(categoryIdentifier!)}`);
    },
  });

  const handleSave = () => {
    if (!formData.name.trim()) {
      alert('Kategori adı boş olamaz');
      return;
    }

    updateMutation.mutate({
      name: formData.name.trim(),
      icon: formData.icon.trim(),
      color: formData.color.trim(),
    });
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
    <Box>
      {/* Header */}
      <Box sx={{ 
        display: 'flex', 
        flexDirection: { xs: 'column', lg: 'row' },
        justifyContent: 'space-between', 
        alignItems: { xs: 'stretch', lg: 'center' }, 
        gap: { xs: 2, lg: 0 },
        mb: 3 
      }}>
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 2,
          flexDirection: { xs: 'column', sm: 'row' },
          textAlign: { xs: 'center', sm: 'left' }
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton onClick={() => navigate(`/categories/${encodeURIComponent(categoryIdentifier!)}`)}>
              <ArrowLeft size={20} />
            </IconButton>
            <Typography variant="h4" component="h1" sx={{ 
              fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' },
              wordBreak: 'break-word'
            }}>
              Kategori Düzenle
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
            startIcon={<X />}
            onClick={() => navigate(`/categories/${encodeURIComponent(categoryIdentifier!)}`)}
            sx={{ 
              minWidth: { xs: '100%', sm: 'auto' },
              fontSize: { xs: '0.875rem', sm: '1rem' }
            }}
          >
            ❌ İptal
          </Button>
          <Button
            variant="contained"
            startIcon={<Save />}
            onClick={handleSave}
            disabled={updateMutation.isPending}
            sx={{ 
              minWidth: { xs: '100%', sm: 'auto' },
              fontSize: { xs: '0.875rem', sm: '1rem' }
            }}
          >
            💾 Kaydet
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
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <Box
                  sx={{
                    width: 60,
                    height: 60,
                    borderRadius: 2,
                    background: getColorStyle(formData.color || category.color),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '1.5rem',
                  }}
                >
                  {(() => {
                    const IconComponent = getIconComponent(formData.icon || category.icon);
                    return <IconComponent size={30} />;
                  })()}
                </Box>
                <Box>
                  <Typography variant="h5" fontWeight="bold">
                    {formData.name || category.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    İkon: {formData.icon || category.icon} • Renk: {getColorName(formData.color || category.color)}
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

        {/* Edit Form */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Düzenlenebilir Alanlar
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {/* Category Name */}
                <TextField
                  fullWidth
                  label="Kategori Adı"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Kategori adını girin"
                  helperText="Kullanıcıya gösterilecek kategori adı"
                />

                {/* Icon */}
                <Box>
                  <TextField
                    fullWidth
                    label="İkon"
                    value={formData.icon}
                    onChange={(e) => setFormData(prev => ({ ...prev, icon: e.target.value }))}
                    placeholder="İkon adını girin"
                    helperText="Kategori için kullanılacak ikon"
                    InputProps={{
                      endAdornment: (
                        <IconButton onClick={() => setIconSelectorOpen(true)}>
                          <Palette size={20} />
                        </IconButton>
                      ),
                    }}
                  />
                </Box>

                {/* Color */}
                <FormControl fullWidth>
                  <InputLabel>Renk</InputLabel>
                  <Select
                    value={formData.color}
                    onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                    label="Renk"
                  >
                    <MenuItem value="from-blue-500 to-cyan-500">Mavi</MenuItem>
                    <MenuItem value="from-green-500 to-emerald-500">Yeşil</MenuItem>
                    <MenuItem value="from-purple-500 to-pink-500">Mor</MenuItem>
                    <MenuItem value="from-orange-500 to-red-500">Turuncu</MenuItem>
                    <MenuItem value="from-yellow-500 to-orange-500">Sarı</MenuItem>
                    <MenuItem value="from-indigo-500 to-purple-500">İndigo</MenuItem>
                    <MenuItem value="from-pink-500 to-rose-500">Pembe</MenuItem>
                    <MenuItem value="from-gray-500 to-slate-500">Gri</MenuItem>
                    <MenuItem value="from-teal-500 to-cyan-500">Teal</MenuItem>
                    <MenuItem value="from-amber-500 to-orange-500">Amber</MenuItem>
                  </Select>
                </FormControl>

                {/* Preview */}
                <Box sx={{ mt: 2, p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2, bgcolor: 'background.paper' }}>
                  <Typography variant="subtitle1" gutterBottom fontWeight="medium">
                    🎨 Canlı Önizleme
                  </Typography>
                  
                  {/* Large Preview */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 2 }}>
                    <Box
                      sx={{
                        width: 60,
                        height: 60,
                        borderRadius: 2,
                        background: getColorStyle(formData.color || category.color),
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        boxShadow: 2,
                      }}
                    >
                      {(() => {
                        const IconComponent = getIconComponent(formData.icon || category.icon);
                        return <IconComponent size={30} />;
                      })()}
                    </Box>
                    <Box>
                      <Typography variant="h6" fontWeight="bold">
                        {formData.name || category.name || 'Kategori Adı'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        İkon: {formData.icon || category.icon || 'Seçilmedi'} • Renk: {getColorName(formData.color || category.color || 'Varsayılan')}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Small Preview (Menu Style) */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 1, border: '1px solid', borderColor: 'divider', borderRadius: 1, bgcolor: 'grey.50' }}>
                    <Box
                      sx={{
                        width: 32,
                        height: 32,
                        borderRadius: 1,
                        background: getColorStyle(formData.color || category.color),
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                      }}
                    >
                      {(() => {
                        const IconComponent = getIconComponent(formData.icon || category.icon);
                        return <IconComponent size={16} />;
                      })()}
                    </Box>
                    <Typography variant="body2" fontWeight="medium">
                      {formData.name || category.name || 'Kategori Adı'}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Read-only Info */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Salt Okunur Bilgiler
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="body2" color="text.secondary">
                    Kategori Tipi
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {isLeaf ? 'Son Kategori' : 'Ana Kategori'}
                  </Typography>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="body2" color="text.secondary">
                    Alt Kategori Sayısı
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {category.subcategories?.length || 0}
                  </Typography>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="body2" color="text.secondary">
                    {isLeaf ? 'Özellik Sayısı' : 'Alt Kategori Sayısı'}
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {isLeaf ? (category.attributes?.length || 0) : (category.subcategories?.length || 0)}
                  </Typography>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="body2" color="text.secondary">
                    Kategori Yolu
                  </Typography>
                  <Typography variant="body1" fontWeight="medium" sx={{ wordBreak: 'break-all' }}>
                    {category?.path || categoryIdentifier}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Icon Selector Dialog */}
      <IconSelector
        open={iconSelectorOpen}
        onClose={() => setIconSelectorOpen(false)}
        onSelect={(iconName) => {
          setFormData(prev => ({ ...prev, icon: iconName }));
          setIconSelectorOpen(false);
        }}
        selectedIcon={formData.icon}
      />
    </Box>
  );
}; 