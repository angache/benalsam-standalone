/**
 * Image Upload Component
 * 
 * @fileoverview Component for uploading images using Upload Service
 * @author Benalsam Team
 * @version 1.0.0
 */

import React, { useState, useRef } from 'react';
import {
  Box,
  Button,
  Typography,
  Alert,
  LinearProgress,
  Grid,
  Card,
  CardMedia,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
} from '@mui/material';
import {
  Upload,
  X,
  Image as ImageIcon,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { useTheme } from '@mui/material/styles';

interface ImageUploadProps {
  onUploadComplete: (images: UploadedImage[]) => void;
  maxImages?: number;
  maxSize?: number; // in MB
  allowedTypes?: string[];
  disabled?: boolean;
}

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

interface UploadProgress {
  file: File;
  progress: number;
  status: 'uploading' | 'completed' | 'error';
  error?: string;
  result?: UploadedImage;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  onUploadComplete,
  maxImages = 10,
  maxSize = 10, // 10MB
  allowedTypes = ['image/jpeg', 'image/png', 'image/webp'],
  disabled = false,
}) => {
  const theme = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [previewDialog, setPreviewDialog] = useState<{ open: boolean; image?: UploadedImage }>({
    open: false,
  });

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    if (files.length === 0) return;

    // Validation
    const validationError = validateFiles(files);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setUploading(true);

    // Initialize progress tracking
    const progress: UploadProgress[] = files.map(file => ({
      file,
      progress: 0,
      status: 'uploading',
    }));
    setUploadProgress(progress);

    try {
      // Upload files to Upload Service
      const formData = new FormData();
      files.forEach(file => {
        formData.append('images', file);
      });

      const response = await fetch('http://localhost:3007/api/v1/upload/listings', {
        method: 'POST',
        headers: {
          'x-user-id': 'admin-user', // TODO: Get from auth context
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Upload failed');
      }

      // Update progress
      const completedProgress = progress.map((item, index) => ({
        ...item,
        progress: 100,
        status: 'completed' as const,
        result: result.data.images[index],
      }));
      setUploadProgress(completedProgress);

      // Update uploaded images
      const newImages = [...uploadedImages, ...result.data.images];
      setUploadedImages(newImages);
      onUploadComplete(newImages);

      // Clear progress after 2 seconds
      setTimeout(() => {
        setUploadProgress([]);
      }, 2000);

    } catch (error) {
      console.error('Upload error:', error);
      setError(error instanceof Error ? error.message : 'Upload failed');
      
      // Update progress with error
      const errorProgress = progress.map(item => ({
        ...item,
        progress: 0,
        status: 'error' as const,
        error: error instanceof Error ? error.message : 'Upload failed',
      }));
      setUploadProgress(errorProgress);
    } finally {
      setUploading(false);
    }
  };

  const validateFiles = (files: File[]): string | null => {
    // Check number of files
    if (files.length > maxImages) {
      return `Maximum ${maxImages} images allowed`;
    }

    // Check total size
    const totalSize = files.reduce((sum, file) => sum + file.size, 0);
    const maxTotalSize = maxSize * 1024 * 1024; // Convert MB to bytes
    if (totalSize > maxTotalSize) {
      return `Total size cannot exceed ${maxSize}MB`;
    }

    // Check individual file size and type
    for (const file of files) {
      if (file.size > maxTotalSize) {
        return `File ${file.name} is too large (max ${maxSize}MB)`;
      }
      
      if (!allowedTypes.includes(file.type)) {
        return `File ${file.name} has unsupported format`;
      }
    }

    return null;
  };

  const removeImage = (imageId: string) => {
    const newImages = uploadedImages.filter(img => img.id !== imageId);
    setUploadedImages(newImages);
    onUploadComplete(newImages);
  };

  const openPreview = (image: UploadedImage) => {
    setPreviewDialog({ open: true, image });
  };

  const closePreview = () => {
    setPreviewDialog({ open: false });
  };

  const getStatusIcon = (status: UploadProgress['status']) => {
    switch (status) {
      case 'uploading':
        return <LinearProgress sx={{ width: '100%' }} />;
      case 'completed':
        return <CheckCircle color="green" size={20} />;
      case 'error':
        return <AlertCircle color="red" size={20} />;
      default:
        return null;
    }
  };

  return (
    <Box>
      {/* Upload Button */}
      <Box sx={{ mb: 2 }}>
        <Button
          variant="contained"
          startIcon={<Upload />}
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || uploading || uploadedImages.length >= maxImages}
          sx={{ mb: 2 }}
        >
          {uploading ? 'Uploading...' : 'Upload Images'}
        </Button>
        
        <Typography variant="body2" color="text.secondary">
          {uploadedImages.length} / {maxImages} images uploaded
        </Typography>
        
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={allowedTypes.join(',')}
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />
      </Box>

      {/* Error Display */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Upload Progress */}
      {uploadProgress.length > 0 && (
        <Box sx={{ mb: 2 }}>
          {uploadProgress.map((item, index) => (
            <Box key={index} sx={{ mb: 1, p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                <ImageIcon size={20} />
                <Typography variant="body2" sx={{ flexGrow: 1 }}>
                  {item.file.name}
                </Typography>
                {getStatusIcon(item.status)}
              </Box>
              
              {item.status === 'uploading' && (
                <LinearProgress variant="determinate" value={item.progress} />
              )}
              
              {item.status === 'error' && (
                <Alert severity="error" size="small">
                  {item.error}
                </Alert>
              )}
            </Box>
          ))}
        </Box>
      )}

      {/* Uploaded Images */}
      {uploadedImages.length > 0 && (
        <Box>
          <Typography variant="h6" gutterBottom>
            Uploaded Images
          </Typography>
          
          <Grid container spacing={2}>
            {uploadedImages.map((image) => (
              <Grid item xs={6} sm={4} md={3} key={image.id}>
                <Card sx={{ position: 'relative' }}>
                  <CardMedia
                    component="img"
                    height="120"
                    image={image.thumbnailUrl || image.url}
                    alt="Uploaded image"
                    sx={{ cursor: 'pointer' }}
                    onClick={() => openPreview(image)}
                  />
                  
                  <IconButton
                    size="small"
                    sx={{
                      position: 'absolute',
                      top: 4,
                      right: 4,
                      backgroundColor: 'rgba(255, 255, 255, 0.8)',
                      '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.9)' },
                    }}
                    onClick={() => removeImage(image.id)}
                  >
                    <X size={16} />
                  </IconButton>
                  
                  <Box sx={{ p: 1 }}>
                    <Chip
                      label={`${image.width}x${image.height}`}
                      size="small"
                      variant="outlined"
                    />
                  </Box>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* Preview Dialog */}
      <Dialog open={previewDialog.open} onClose={closePreview} maxWidth="md" fullWidth>
        <DialogTitle>
          Image Preview
        </DialogTitle>
        <DialogContent>
          {previewDialog.image && (
            <Box>
              <img
                src={previewDialog.image.url}
                alt="Preview"
                style={{
                  width: '100%',
                  height: 'auto',
                  maxHeight: '70vh',
                  objectFit: 'contain',
                }}
              />
              
              <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Chip label={`${previewDialog.image.width}x${previewDialog.image.height}`} />
                <Chip label={previewDialog.image.format.toUpperCase()} />
                <Chip label={`${Math.round(previewDialog.image.size / 1024)}KB`} />
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closePreview}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
