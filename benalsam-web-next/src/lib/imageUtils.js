import imageCompression from 'browser-image-compression';
import { logger } from '@/utils/production-logger';
    
    const defaultOptions = {
      maxSizeMB: 1,
      maxWidthOrHeight: 1920,
      useWebWorker: true,
      fileType: 'image/jpeg',
      initialQuality: 0.8,
    };
    
    export const compressImage = async (file, options = {}) => {
      const compressionOptions = { ...defaultOptions, ...options };
    
      if (!file.type.startsWith('image/')) {
         logger.warn('[ImageUtils] File is not an image, skipping compression', { fileName: file.name });
         return file;
      }
    
      logger.debug('[ImageUtils] Compressing image', { 
        fileName: file.name, 
        originalSize: `${(file.size / 1024 / 1024).toFixed(2)} MB` 
      });
      
      try {
        const compressedFile = await imageCompression(file, compressionOptions);
        logger.debug('[ImageUtils] Image compressed', { 
          fileName: file.name, 
          newSize: `${(compressedFile.size / 1024 / 1024).toFixed(2)} MB` 
        });
        return compressedFile;
      } catch (error) {
        logger.error('[ImageUtils] Image compression error', { error });
        return file; 
      }
    };
    
    export const blobToFile = (blob, fileName) => {
      return new File([blob], fileName, { type: blob.type, lastModified: Date.now() });
    };