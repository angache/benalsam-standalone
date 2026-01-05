import { supabase } from '@/lib/supabase'
import { logger } from '@/utils/production-logger'

export const searchUnsplashImages = async (query: string) => {
  if (!query || query.trim() === '') {
    return []
  }

  const { data, error } = await supabase.functions.invoke('fetch-unsplash-images', {
    body: { query },
  })

  if (error) {
    logger.error('[UnsplashService] Error fetching from Unsplash edge function', { error })
    throw new Error(`Stok görselleri alınamadı: ${error.message}`)
  }
  
  if (data?.error) {
    logger.error('[UnsplashService] Error from Unsplash edge function', { error: data.error })
    throw new Error(data.error)
  }

  return data?.images || []
}
