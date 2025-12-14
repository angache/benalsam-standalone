import React, { useState } from 'react';
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControlLabel,
  Checkbox,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Paper,
} from '@mui/material';
import {
  ArrowLeft,
  Edit,
  Delete,
  Plus,
  Save,
  X,
  Settings,
  Trash2,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { categoryService, type Category, type CategoryAttribute } from '../services/categoryService';
import { getIconComponent } from '../utils/iconUtils';
import { getColorStyle, getColorName } from '../utils/colorUtils';

interface AttributeFormData {
  key: string;
  label: string;
  type: 'string' | 'number' | 'boolean' | 'array';
  required: boolean;
  options: string[];
}

export const CategoryAttributesPage: React.FC = () => {
  const params = useParams();
  console.log('🔍 CategoryAttributesPage params:', params);
  // Support multiple param formats: path, id, or wildcard (*)
  const categoryIdentifier = params.path || params.id || params['*'] || params['0'];
  console.log('🎯 Category identifier:', categoryIdentifier);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // State for dialog
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAttribute, setEditingAttribute] = useState<CategoryAttribute | null>(null);
  const [formData, setFormData] = useState<AttributeFormData>({
    key: '',
    label: '',
    type: 'string',
    required: false,
    options: [],
  });

  // Fetch category
  const { data: category, isLoading, error } = useQuery({
    queryKey: ['category', categoryIdentifier],
    queryFn: () => categoryService.getCategory(categoryIdentifier!),
    enabled: !!categoryIdentifier,
  });

  // Update category mutation
  const updateMutation = useMutation({
    mutationFn: (data: Partial<Category>) => categoryService.updateCategory(path!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['category', path] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setIsDialogOpen(false);
      setEditingAttribute(null);
      resetForm();
    },
  });

  const resetForm = () => {
    setFormData({
      key: '',
      label: '',
      type: 'string',
      required: false,
      options: [],
    });
  };

  const handleAddAttribute = () => {
    setEditingAttribute(null);
    resetForm();
    setIsDialogOpen(true);
  };

  const handleEditAttribute = (attribute: CategoryAttribute) => {
    setEditingAttribute(attribute);
    setFormData({
      key: attribute.key,
      label: attribute.label,
      type: attribute.type,
      required: attribute.required,
      options: attribute.options || [],
    });
    setIsDialogOpen(true);
  };

  const handleDeleteAttribute = (attributeKey: string) => {
    if (!category) return;

    const updatedAttributes = category.attributes?.filter(attr => attr.key !== attributeKey) || [];
    
    updateMutation.mutate({
      ...category,
      attributes: updatedAttributes,
    });
  };

  const handleSaveAttribute = () => {
    if (!category || !formData.key || !formData.label) return;

    const newAttribute: CategoryAttribute = {
      key: formData.key,
      label: formData.label,
      type: formData.type,
      required: formData.required,
      options: formData.type === 'array' ? formData.options : undefined,
    };

    let updatedAttributes: CategoryAttribute[];

    if (editingAttribute) {
      // Update existing attribute
      updatedAttributes = category.attributes?.map(attr =>
        attr.key === editingAttribute.key ? newAttribute : attr
      ) || [];
    } else {
      // Add new attribute
      updatedAttributes = [...(category.attributes || []), newAttribute];
    }

    updateMutation.mutate({
      ...category,
      attributes: updatedAttributes,
    });
  };

  const handleAddOption = () => {
    setFormData(prev => ({
      ...prev,
      options: [...prev.options, ''],
    }));
  };

  const handleRemoveOption = (index: number) => {
    setFormData(prev => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== index),
    }));
  };

  const handleOptionChange = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      options: prev.options.map((option, i) => i === index ? value : option),
    }));
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
  if (hasSubcategories) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning">
          Bu kategori alt kategorilere sahip. Özellikler sadece son kategorilerde (alt kategorisi olmayan) düzenlenebilir.
        </Alert>
      </Box>
    );
  }

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
            <IconButton onClick={() => navigate(`/categories/${encodeURIComponent(path!)}`)}>
              <ArrowLeft size={20} />
            </IconButton>
            <Box>
              <Typography variant="h4" component="h1" sx={{ 
                fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' },
                wordBreak: 'break-word'
              }}>
                {category.name} - Özellikler
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Kategori özelliklerini yönetin ve düzenleyin
              </Typography>
            </Box>
          </Box>
        </Box>
        
        <Button
          variant="contained"
          startIcon={<Plus />}
          onClick={handleAddAttribute}
          sx={{ 
            minWidth: { xs: '100%', sm: 'auto' },
            fontSize: { xs: '0.875rem', sm: '1rem' }
          }}
        >
          ➕ Yeni Özellik Ekle
        </Button>
      </Box>

      {/* Category Info Card */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box
              sx={{
                width: 50,
                height: 50,
                borderRadius: 2,
                background: getColorStyle(category.color),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
              }}
            >
              {(() => {
                const IconComponent = getIconComponent(category.icon);
                return <IconComponent size={25} />;
              })()}
            </Box>
            <Box>
              <Typography variant="h6" fontWeight="bold">
                {category.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                İkon: {category.icon} • Renk: {getColorName(category.color)} • Özellik Sayısı: {category.attributes?.length || 0}
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Attributes List */}
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              📋 Kategori Özellikleri ({category.attributes?.length || 0})
            </Typography>
            <Chip
              label={category.attributes?.length === 0 ? 'Özellik Yok' : `${category.attributes?.length} Özellik`}
              color={category.attributes?.length === 0 ? 'warning' : 'success'}
              variant="outlined"
            />
          </Box>
          
          {!category.attributes || category.attributes.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography color="text.secondary" gutterBottom>
                Bu kategoride henüz özellik tanımlanmamış.
              </Typography>
              <Button
                variant="outlined"
                startIcon={<Plus />}
                onClick={handleAddAttribute}
              >
                İlk Özelliği Ekle
              </Button>
            </Box>
          ) : (
            <List>
              {category.attributes.map((attribute, index) => (
                <React.Fragment key={attribute.key}>
                  <ListItem
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
                  >
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="subtitle1" fontWeight="medium">
                            {attribute.label}
                          </Typography>
                          <Chip
                            label={attribute.type}
                            size="small"
                            color="primary"
                            variant="outlined"
                          />
                          {attribute.required && (
                            <Chip
                              label="Zorunlu"
                              size="small"
                              color="error"
                              variant="outlined"
                            />
                          )}
                        </Box>
                      }
                      secondary={
                        <Box sx={{ mt: 1 }}>
                          <Typography variant="body2" color="text.secondary">
                            Anahtar: {attribute.key}
                          </Typography>
                          {attribute.options && attribute.options.length > 0 && (
                            <Box sx={{ mt: 1 }}>
                              <Typography variant="caption" color="text.secondary">
                                Seçenekler: {attribute.options.join(', ')}
                              </Typography>
                            </Box>
                          )}
                        </Box>
                      }
                    />
                    <ListItemSecondaryAction>
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <Tooltip title="Düzenle">
                          <IconButton
                            size="small"
                            color="info"
                            onClick={() => handleEditAttribute(attribute)}
                          >
                            <Edit size={16} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Sil">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDeleteAttribute(attribute.key)}
                            disabled={updateMutation.isPending}
                          >
                            <Delete size={16} />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </ListItemSecondaryAction>
                  </ListItem>
                  {index < category.attributes!.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          )}
        </CardContent>
      </Card>

      {/* Attribute Dialog */}
      <Dialog
        open={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        maxWidth="lg"
        fullWidth
        sx={{
          '& .MuiDialog-paper': {
            margin: { xs: 2, sm: 'auto' },
            width: { xs: 'calc(100% - 32px)', sm: 'auto' },
            maxWidth: { xs: '100%', sm: '900px' }
          }
        }}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="h6">
              {editingAttribute ? '✏️ Özellik Düzenle' : '➕ Yeni Özellik Ekle'}
            </Typography>
            {editingAttribute && (
              <Chip
                label="Düzenleme Modu"
                color="info"
                size="small"
                variant="outlined"
              />
            )}
          </Box>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="🔑 Özellik Anahtarı"
                value={formData.key}
                onChange={(e) => setFormData(prev => ({ ...prev, key: e.target.value }))}
                placeholder="ornek_anahtar"
                helperText="Benzersiz bir anahtar (snake_case formatında)"
                disabled={!!editingAttribute}
                InputProps={{
                  startAdornment: <Typography variant="caption" sx={{ mr: 1, color: 'text.secondary' }}>key:</Typography>,
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="📝 Özellik Adı"
                value={formData.label}
                onChange={(e) => setFormData(prev => ({ ...prev, label: e.target.value }))}
                placeholder="Özellik Adı"
                helperText="Kullanıcıya gösterilecek ad"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>📊 Veri Tipi</InputLabel>
                <Select
                  value={formData.type}
                  onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as any }))}
                  label="📊 Veri Tipi"
                >
                  <MenuItem value="string">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography>📝 Metin (String)</Typography>
                      <Typography variant="caption" color="text.secondary">- Kısa metin girişi</Typography>
                    </Box>
                  </MenuItem>
                  <MenuItem value="number">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography>🔢 Sayı (Number)</Typography>
                      <Typography variant="caption" color="text.secondary">- Sayısal değer</Typography>
                    </Box>
                  </MenuItem>
                  <MenuItem value="boolean">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography>✅ Evet/Hayır (Boolean)</Typography>
                      <Typography variant="caption" color="text.secondary">- Checkbox seçimi</Typography>
                    </Box>
                  </MenuItem>
                  <MenuItem value="array">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography>📋 Seçenek Listesi (Array)</Typography>
                      <Typography variant="caption" color="text.secondary">- Dropdown seçimi</Typography>
                    </Box>
                  </MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.required}
                    onChange={(e) => setFormData(prev => ({ ...prev, required: e.target.checked }))}
                  />
                }
                label="⚠️ Zorunlu Alan"
              />
            </Grid>
            
            {formData.type === 'array' && (
              <Grid item xs={12}>
                <Box sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2, bgcolor: 'grey.50' }}>
                  <Typography variant="subtitle1" gutterBottom fontWeight="medium">
                    📋 Seçenekler ({formData.options.length})
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Kullanıcıların seçebileceği seçenekleri ekleyin
                  </Typography>
                  
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    {formData.options.map((option, index) => (
                      <Box key={index} sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                        <Chip
                          label={`${index + 1}`}
                          size="small"
                          color="primary"
                          variant="outlined"
                          sx={{ minWidth: 30 }}
                        />
                        <TextField
                          fullWidth
                          size="small"
                          value={option}
                          onChange={(e) => handleOptionChange(index, e.target.value)}
                          placeholder={`Seçenek ${index + 1}`}
                          InputProps={{
                            startAdornment: <Typography variant="caption" sx={{ mr: 1, color: 'text.secondary' }}>•</Typography>,
                          }}
                        />
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleRemoveOption(index)}
                          sx={{ 
                            '&:hover': { 
                              backgroundColor: 'error.light',
                              color: 'white'
                            } 
                          }}
                        >
                          <Trash2 size={16} />
                        </IconButton>
                      </Box>
                    ))}
                    
                    {formData.options.length === 0 && (
                      <Box sx={{ textAlign: 'center', py: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                          Henüz seçenek eklenmemiş
                        </Typography>
                      </Box>
                    )}
                    
                    <Button
                      variant="outlined"
                      startIcon={<Plus />}
                      onClick={handleAddOption}
                      size="small"
                      sx={{ alignSelf: 'flex-start' }}
                    >
                      ➕ Seçenek Ekle
                    </Button>
                  </Box>
                </Box>
              </Grid>
            )}

            {/* Preview Section */}
            <Grid item xs={12}>
              <Box sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2, bgcolor: 'background.paper' }}>
                <Typography variant="subtitle1" gutterBottom fontWeight="medium">
                  🎨 Özellik Önizleme
                </Typography>
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {/* Attribute Info */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                      <Typography variant="body2" fontWeight="medium">
                        {formData.label || 'Özellik Adı'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Anahtar: {formData.key || 'ornek_anahtar'}
                      </Typography>
                    </Box>
                    <Box sx={{ ml: 'auto', display: 'flex', gap: 1 }}>
                      <Chip
                        label={formData.type || 'string'}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                      {formData.required && (
                        <Chip
                          label="Zorunlu"
                          size="small"
                          color="error"
                          variant="outlined"
                        />
                      )}
                    </Box>
                  </Box>

                  {/* Form Preview */}
                  <Box sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1, bgcolor: 'white' }}>
                    <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                      Form Görünümü:
                    </Typography>
                    
                    {formData.type === 'string' && (
                      <TextField
                        fullWidth
                        size="small"
                        label={formData.label || 'Özellik Adı'}
                        placeholder="Değer girin"
                        disabled
                        variant="outlined"
                      />
                    )}
                    
                    {formData.type === 'number' && (
                      <TextField
                        fullWidth
                        size="small"
                        label={formData.label || 'Özellik Adı'}
                        type="number"
                        placeholder="0"
                        disabled
                        variant="outlined"
                      />
                    )}
                    
                    {formData.type === 'boolean' && (
                      <FormControlLabel
                        control={<Checkbox disabled />}
                        label={formData.label || 'Özellik Adı'}
                      />
                    )}
                    
                    {formData.type === 'array' && (
                      <FormControl fullWidth size="small">
                        <InputLabel>{formData.label || 'Özellik Adı'}</InputLabel>
                        <Select
                          value=""
                          label={formData.label || 'Özellik Adı'}
                          disabled
                        >
                          {formData.options.map((option, index) => (
                            <MenuItem key={index} value={option}>
                              {option}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    )}
                  </Box>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ 
          p: { xs: 2, sm: 3 }, 
          gap: 1,
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { xs: 'stretch', sm: 'center' }
        }}>
          <Button
            onClick={() => setIsDialogOpen(false)}
            startIcon={<X />}
            variant="outlined"
            sx={{ 
              minWidth: { xs: '100%', sm: 'auto' },
              fontSize: { xs: '0.875rem', sm: '1rem' }
            }}
          >
            ❌ İptal
          </Button>
          <Button
            onClick={handleSaveAttribute}
            variant="contained"
            startIcon={<Save />}
            disabled={!formData.key || !formData.label || updateMutation.isPending}
            sx={{ 
              minWidth: { xs: '100%', sm: 120 },
              fontSize: { xs: '0.875rem', sm: '1rem' },
              '&:disabled': {
                opacity: 0.6
              }
            }}
          >
            {editingAttribute ? '💾 Güncelle' : '➕ Ekle'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}; 