import imageCompression from 'browser-image-compression';
    
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
         console.warn(`File is not an image, skipping compression: ${file.name}`);
         return file;
      }
    
      console.log(`Compressing ${file.name}... Original size: ${(file.size / 1024 / 1024).toFixed(2)} MB`);
      
      try {
        const compressedFile = await imageCompression(file, compressionOptions);
        console.log(`Compressed ${file.name}. New size: ${(compressedFile.size / 1024 / 1024).toFixed(2)} MB`);
        return compressedFile;
      } catch (error) {
        console.error('Image compression error:', error);
        return file; 
      }
    };
    
    export const blobToFile = (blob, fileName) => {
      return new File([blob], fileName, { type: blob.type, lastModified: Date.now() });
    };