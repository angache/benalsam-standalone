import { supabase } from '@/lib/supabaseClient';

export const uploadImages = async (files: File[], userId: string, bucket: string): Promise<string[]> => {
  const uploadPromises = files.map(async (file, index) => {
    const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const fileName = `${userId}/${Date.now()}-${Math.random()}.${fileExt}`;
    
    console.log(`📁 [ImageUpload] File ${index + 1} path:`, fileName);
    
    try {
      console.log(`🚀 [ImageUpload] Starting upload for file ${index + 1}...`);
      
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error(`❌ Image upload error for file ${index + 1}:`, error);
        throw error;
      }

      console.log(`✅ [ImageUpload] File ${index + 1} uploaded successfully:`, data.path);

      // Public URL oluştur
      const { data: publicData } = supabase.storage
        .from(bucket)
        .getPublicUrl(fileName);

      const publicUrl = publicData.publicUrl;
      console.log(`🔗 [ImageUpload] File ${index + 1} public URL:`, publicUrl);

      return publicUrl;
    } catch (error) {
      console.error(`❌ Upload failed for file ${index + 1}:`, error);
      throw error;
    }
  });

  try {
    const results = await Promise.all(uploadPromises);
    return results;
  } catch (error) {
    console.error('❌ Error in uploadImages:', error);
    throw error;
  }
};

export const deleteImages = async (urls: string[]): Promise<any> => {
  if (!urls || urls.length === 0) return;

  const filePaths = urls.map(url => {
    try {
      const urlObject = new URL(url);
      const pathParts = urlObject.pathname.split('/');
      const bucketIndex = pathParts.findIndex(part => part === 'item_images' || part === 'avatars');
      if (bucketIndex === -1) return null;
      return pathParts.slice(bucketIndex + 1).join('/');
    } catch (e) {
      console.error('Invalid URL for deletion:', url);
      return null;
    }
  }).filter(Boolean) as string[];

  if (filePaths.length === 0) return;

  const { data, error } = await supabase.storage.from('item_images').remove(filePaths);

  if (error) {
    console.error('Error deleting images:', error);
  }

  return data;
};

export const processImagesForSupabase = async (
  images: any[], 
  mainImageIndex: number, 
  bucket: string, 
  context_unused: string, 
  userId: string, 
  category_unused: string, 
  onProgress?: (progress: number) => void, 
  initialImageUrls: string[] = []
): Promise<{ mainImageUrl: string | null; additionalImageUrls: string[]; urlsToDelete?: string[] }> => {
  const filesToUpload = images
    .filter(img => !img.isUploaded && (img.file || img.uri))
    .map(img => {
      if (img.file) {
        // Web dosyası
        return img.file;
      } else if (img.uri && img.uri.startsWith('file://')) {
        // Mobil local dosya - dosya objesi oluştur
        return {
          uri: img.uri,
          name: img.name || `image_${Date.now()}.jpg`,
          type: 'image/jpeg'
        };
      }
      return null;
    })
    .filter(Boolean);

  const keptImageUrls = images.filter(img => img.isUploaded).map(img => img.preview || img.uri);
  const urlsToDelete = initialImageUrls.filter(url => !keptImageUrls.includes(url));

  if (urlsToDelete.length > 0) {
    await deleteImages(urlsToDelete);
  }

  let newImageUrls: string[] = [];
  if (filesToUpload.length > 0) {
    newImageUrls = await uploadImages(filesToUpload as File[], userId, bucket);
  }

  const allImageUrls = [...keptImageUrls, ...newImageUrls];
  
  let finalOrderedUrls = [...allImageUrls];
  if (mainImageIndex >= 0 && mainImageIndex < allImageUrls.length) {
    const mainImage = finalOrderedUrls.splice(mainImageIndex, 1)[0];
    finalOrderedUrls.unshift(mainImage);
  }

  return {
    mainImageUrl: finalOrderedUrls[0] || null,
    additionalImageUrls: finalOrderedUrls.slice(1),
    urlsToDelete
  };
}; 