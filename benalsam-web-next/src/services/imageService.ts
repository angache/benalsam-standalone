import { supabase } from '@/lib/supabase'
import { logger } from '@/utils/production-logger'

/**
 * Upload images directly to Supabase Storage (fallback when Upload Service is unavailable)
 */
export const uploadImages = async (
  files: File[],
  userId: string,
  bucket: string = 'item_images'
): Promise<string[]> => {
  const uploadPromises = files.map(async (file, index) => {
    const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg'
    const fileName = `${userId}/${Date.now()}-${Math.random()}.${fileExt}`

    logger.debug(`[ImageService] File ${index + 1} path`, { fileName })

    try {
      logger.debug(`[ImageService] Starting upload for file ${index + 1}...`)

      const { data, error } = await supabase.storage.from(bucket).upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
      })

      if (error) {
        logger.error(`[ImageService] Image upload error for file ${index + 1}`, { error })
        throw error
      }

      logger.debug(`[ImageService] File ${index + 1} uploaded successfully`, { path: data.path })

      // Public URL oluştur
      const {
        data: { publicUrl },
      } = supabase.storage.from(bucket).getPublicUrl(fileName)

      logger.debug(`[ImageService] File ${index + 1} public URL`, { publicUrl })

      return publicUrl
    } catch (error) {
      logger.error(`[ImageService] Upload failed for file ${index + 1}`, { error })
      throw error
    }
  })

  try {
    const results = await Promise.all(uploadPromises)
    return results
  } catch (error) {
    logger.error('[ImageService] Error in uploadImages', { error })
    throw error
  }
}

/**
 * Deletes images from Supabase Storage by their public URLs.
 * Extracts file paths from URLs and removes them from the storage bucket.
 * 
 * @param urls - Array of public image URLs to delete
 * @returns Promise resolving to array of deleted file paths, or null if no valid URLs
 * 
 * @example
 * ```typescript
 * const deleted = await deleteImages([
 *   'https://...supabase.co/storage/v1/object/public/item_images/user123/image.jpg'
 * ])
 * console.log(`Deleted ${deleted?.length || 0} images`)
 * ```
 */
export const deleteImages = async (urls: string[]): Promise<{ path: string }[] | null> => {
  if (!urls || urls.length === 0) return

  const filePaths = urls
    .map((url) => {
      try {
        const urlObject = new URL(url)
        const pathParts = urlObject.pathname.split('/')
        const bucketIndex = pathParts.findIndex(
          (part) => part === 'item_images' || part === 'avatars' || part === 'inventory'
        )
        if (bucketIndex === -1) return null
        return pathParts.slice(bucketIndex + 1).join('/')
      } catch (e) {
        logger.error('[ImageService] Invalid URL for deletion', { url })
        return null
      }
    })
    .filter(Boolean) as string[]

  if (filePaths.length === 0) return

  const { data, error } = await supabase.storage.from('item_images').remove(filePaths)

  if (error) {
    logger.error('[ImageService] Error deleting images', { error })
  }

  return data
}

/**
 * Processes images for Supabase Storage upload.
 * Handles both new file uploads and existing image URLs.
 * Manages main image selection and deletion of old images.
 * 
 * This is a legacy function maintained for compatibility with existing code.
 * 
 * @param images - Array of image items (can be File objects or existing URLs)
 * @param mainImageIndex - Index of the main image in the images array
 * @param bucket - Storage bucket name (default: 'item_images')
 * @param context_unused - Unused parameter (kept for compatibility)
 * @param userId - User ID for organizing uploaded files
 * @param category_unused - Unused parameter (kept for compatibility)
 * @param onProgress - Optional progress callback (not currently used)
 * @param initialImageUrls - Array of existing image URLs to compare against (for deletion)
 * @returns Promise resolving to object with mainImageUrl, additionalImageUrls, and urlsToDelete
 * 
 * @example
 * ```typescript
 * const result = await processImagesForSupabase(
 *   imageItems,
 *   0, // main image index
 *   'item_images',
 *   '',
 *   'user-123',
 *   '',
 *   undefined,
 *   existingImageUrls
 * )
 * ```
 */
interface ImageItem {
  file?: File
  uri?: string
  name?: string
  isUploaded?: boolean
  preview?: string
}

export const processImagesForSupabase = async (
  images: ImageItem[],
  mainImageIndex: number,
  bucket: string,
  context_unused: string,
  userId: string,
  category_unused: string,
  onProgress?: (progress: number) => void,
  initialImageUrls: string[] = []
): Promise<{
  mainImageUrl: string | null
  additionalImageUrls: string[]
  urlsToDelete?: string[]
}> => {
  const filesToUpload = images
    .filter((img) => !img.isUploaded && (img.file || img.uri))
    .map((img) => {
      if (img.file) {
        // Web dosyası
        return img.file
      } else if (img.uri && img.uri.startsWith('file://')) {
        // Mobil local dosya - dosya objesi oluştur
        return {
          uri: img.uri,
          name: img.name || `image_${Date.now()}.jpg`,
          type: 'image/jpeg',
        }
      }
      return null
    })
    .filter(Boolean) as File[]

  const keptImageUrls = images.filter((img) => img.isUploaded).map((img) => img.preview || img.uri)
  const urlsToDelete = initialImageUrls.filter((url) => !keptImageUrls.includes(url))

  if (urlsToDelete.length > 0) {
    await deleteImages(urlsToDelete)
  }

  let newImageUrls: string[] = []
  if (filesToUpload.length > 0) {
    newImageUrls = await uploadImages(filesToUpload, userId, bucket)
  }

  const allImageUrls = [...keptImageUrls, ...newImageUrls]

  let finalOrderedUrls = [...allImageUrls]
  if (mainImageIndex >= 0 && mainImageIndex < allImageUrls.length) {
    const mainImage = finalOrderedUrls.splice(mainImageIndex, 1)[0]
    finalOrderedUrls.unshift(mainImage)
  }

  return {
    mainImageUrl: finalOrderedUrls[0] || null,
    additionalImageUrls: finalOrderedUrls.slice(1),
    urlsToDelete,
  }
}

