import { supabase  } from '../services/supabaseClient';

export const searchUnsplashImages = async (query: string) => {
  if (!query || query.trim() === '') {
    return [];
  }

  const { data, error } = await supabase.functions.invoke('fetch-unsplash-images', {
    body: { query },
  });

  if (error) {
    console.error('Error fetching from Unsplash edge function:', error);
    throw new Error('Stok görselleri alınamadı. Lütfen API anahtarınızın doğru yapılandırıldığından emin olun.');
  }
  
  if (data.error) {
    console.error('Error from Unsplash edge function:', data.error);
    throw new Error(data.error);
  }

  return data.images;
}; 