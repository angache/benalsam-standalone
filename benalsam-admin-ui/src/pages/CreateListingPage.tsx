/**
 * Create Listing Page
 * 
 * @fileoverview Page for creating new listings with image upload
 * @author Benalsam Team
 * @version 1.0.0
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Divider,
} from '@mui/material';
import {
  ArrowLeft,
  Save,
  Upload,
} from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '../services/api';
import { ImageUpload } from '../components/ImageUpload';

interface UploadedImage {
  id: string;
  url: string;
  width: number;
  height: number;
  format: string;
  size: number;
  thumbnailUrl?: string;
  mediumUrl?: string;
}

const categories = [
  'Elektronik',
  'Ev & Yaşam',
  'Moda & Giyim',
  'Spor & Outdoor',
  'Kitap & Hobi',
  'Otomotiv',
  'Emlak',
  'İş & Ofis',
  'Anne & Bebek',
  'Petshop',
  'Diğer',
];

export const CreateListingPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    category: '',
    location: '',
  });
  
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Create listing mutation
  const createListingMutation = useMutation({
    mutationFn: async (listingData: any) => {
      return apiService.createListing(listingData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['listings'] });
      navigate('/listings');
    },
    onError: (error: any) => {
      console.error('Create listing error:', error);
    },
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: '',
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Başlık gereklidir';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Açıklama gereklidir';
    }

    if (!formData.price.trim()) {
      newErrors.price = 'Fiyat gereklidir';
    } else if (isNaN(Number(formData.price)) || Number(formData.price) <= 0) {
      newErrors.price = 'Geçerli bir fiyat giriniz';
    }

    if (!formData.category) {
      newErrors.category = 'Kategori seçiniz';
    }

    if (uploadedImages.length === 0) {
      newErrors.images = 'En az bir görsel yükleyiniz';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const listingData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        price: Number(formData.price),
        category: formData.category,
        location: formData.location.trim(),
        images: uploadedImages.map(img => img.url),
        status: 'PENDING', // Admin tarafından oluşturulan ilanlar otomatik onaylanır
      };

      await createListingMutation.mutateAsync(listingData);
    } catch (error) {
      console.error('Submit error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageUploadComplete = (images: UploadedImage[]) => {
    setUploadedImages(images);
    
    // Clear images error when images are uploaded
    if (errors.images) {
      setErrors(prev => ({
        ...prev,
        images: '',
      }));
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Button
          startIcon={<ArrowLeft />}
          onClick={() => navigate('/listings')}
        >
          Geri
        </Button>
        <Typography variant="h4" component="h1">
          Yeni İlan Oluştur
        </Typography>
      </Box>

      {/* Error Display */}
      {createListingMutation.error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          İlan oluşturulurken hata oluştu: {createListingMutation.error.message}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Left Column - Form */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                İlan Bilgileri
              </Typography>
              
              <Grid container spacing={3}>
                {/* Title */}
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="İlan Başlığı"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    error={!!errors.title}
                    helperText={errors.title}
                    placeholder="Örn: iPhone 13 Pro Max 128GB"
                  />
                </Grid>

                {/* Description */}
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    label="Açıklama"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    error={!!errors.description}
                    helperText={errors.description}
                    placeholder="İlan hakkında detaylı bilgi veriniz..."
                  />
                </Grid>

                {/* Price and Category */}
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Fiyat (₺)"
                    type="number"
                    value={formData.price}
                    onChange={(e) => handleInputChange('price', e.target.value)}
                    error={!!errors.price}
                    helperText={errors.price}
                    placeholder="0"
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth error={!!errors.category}>
                    <InputLabel>Kategori</InputLabel>
                    <Select
                      value={formData.category}
                      label="Kategori"
                      onChange={(e) => handleInputChange('category', e.target.value)}
                    >
                      {categories.map((category) => (
                        <MenuItem key={category} value={category}>
                          {category}
                        </MenuItem>
                      ))}
                    </Select>
                    {errors.category && (
                      <Typography variant="caption" color="error" sx={{ mt: 1, ml: 2 }}>
                        {errors.category}
                      </Typography>
                    )}
                  </FormControl>
                </Grid>

                {/* Location */}
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Konum (Opsiyonel)"
                    value={formData.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    placeholder="Örn: İstanbul, Kadıköy"
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Right Column - Image Upload */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Görseller
              </Typography>
              
              {errors.images && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {errors.images}
                </Alert>
              )}
              
              <ImageUpload
                onUploadComplete={handleImageUploadComplete}
                maxImages={10}
                maxSize={10}
                disabled={isSubmitting}
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Submit Button */}
      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
        <Button
          variant="outlined"
          onClick={() => navigate('/listings')}
          disabled={isSubmitting}
        >
          İptal
        </Button>
        
        <Button
          variant="contained"
          startIcon={isSubmitting ? <CircularProgress size={20} /> : <Save />}
          onClick={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Oluşturuluyor...' : 'İlan Oluştur'}
        </Button>
      </Box>
    </Box>
  );
};
