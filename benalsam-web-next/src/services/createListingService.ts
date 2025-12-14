/**
 * Listing Creation Service
 * Adapted from old system's uploadServiceMutations.ts
 */

import { uploadServiceClient } from '@/lib/uploadServiceClient'

const UPLOAD_SERVICE_URL = process.env.NEXT_PUBLIC_UPLOAD_SERVICE_URL || 'http://localhost:3007/api/v1'

// EXACT COPY from old system - getCategoryIds function
const getCategoryIds = async (categoryString: string): Promise<{ category_id: number | null, category_path: number[] | null }> => {
  if (!categoryString) return { category_id: null, category_path: null };
  
  console.log('Processing category string', { categoryString });
  
  // Kategori path'ini parçala (sadece ' > ' ve ' / ' ayırıcılarını kullan)
  const pathParts = categoryString.split(/\s*[>\/]\s*/).map(part => part.trim()).filter(part => part);
  console.log('Category path parts', { pathParts });
  
  if (pathParts.length === 0) {
    console.warn('No path parts found');
    return { category_id: null, category_path: null };
  }
  
  try {
    // localStorage'dan kategorileri al
    const raw = localStorage.getItem('benalsam_categories_next_v1.0.0')
    if (!raw) {
      console.warn('No categories cache found')
      return { category_id: null, category_path: null }
    }
    
    const parsed = JSON.parse(raw)
    const categories: any[] = parsed?.data || []
    console.log('Categories from cache', { categoriesCount: categories.length });
    
    // Ana kategoriyi bul
    const mainCategory = categories.find(cat => cat.name === pathParts[0]);
    if (!mainCategory) {
      console.warn('Main category not found', { categoryName: pathParts[0] });
      return { category_id: null, category_path: null };
    }
    
    console.log('Main category found', { categoryName: pathParts[0], categoryId: mainCategory.id });

    // N-seviye gezinme: her bir path parçasını sırayla children içinde ara
    const categoryPath: number[] = [];
    let currentNode: any = mainCategory;
    
    // Ana kategoriyi ekle
    categoryPath.push(currentNode.id);
    
    for (let i = 1; i < pathParts.length; i++) {
      const part = pathParts[i];
      const children = currentNode?.children || [];
      console.log('🔍 Traversing category level', { level: i + 1, lookingFor: part, childrenCount: children.length });
      const next = children.find((c: any) => c.name === part);
      if (!next) {
        console.warn('❌ Category level not found', { level: i + 1, part, available: children.map((c: any) => c.name) });
        break;
      }
      categoryPath.push(next.id);
      currentNode = next;
    }

    const categoryId = categoryPath[categoryPath.length - 1] || null;

    console.log('✅ Category IDs resolved', { 
      categoryString, 
      categoryId, 
      categoryPath,
      pathLength: categoryPath.length 
    });

    return { 
      category_id: categoryId, 
      category_path: categoryPath.length > 0 ? categoryPath : null 
    };

  } catch (error) {
    console.error('❌ Error processing category string:', error);
    return { category_id: null, category_path: null };
  }
}

interface CreateListingInput {
  title: string
  description: string
  budget: number
  category: string
  category_id?: number | null
  category_path?: number[] | null
  location: string
  listings_province?: string | null
  listings_district?: string | null
  listings_neighborhood?: string | null
  urgency?: string
  condition?: string[]
  attributes?: Record<string, any>
  images: any[] // Image objects from form
  mainImageIndex: number
  duration?: number
  accept_terms?: boolean
  auto_republish?: boolean
  contact_preference?: string
  is_featured?: boolean
  is_urgent_premium?: boolean
  is_showcase?: boolean
  has_bold_border?: boolean
  geolocation?: string | null
}

/**
 * Create listing with Upload Service
 * This is the exact flow from the old system
 */
export async function createListingWithUploadService(
  listingData: CreateListingInput,
  currentUserId: string,
  onProgress?: (progress: number) => void
): Promise<any> {
  try {
    console.log('🚀 Creating listing via Upload Service', {
      title: listingData.title,
      category: listingData.category,
      category_id: listingData.category_id,
      imageCount: listingData.images?.length || 0
    })

    // Step 1: Upload images
    let uploadedImageUrls: string[] = []
    if (listingData.images && listingData.images.length > 0) {
      console.log('📸 Uploading images...')
      
      // Convert image objects to File objects
      const imageFiles: File[] = []
      for (const img of listingData.images) {
        try {
          // Priority 1: Use existing file object
          if (img.file && typeof img.file === 'object' && img.file.constructor.name === 'File') {
            imageFiles.push(img.file)
            console.log('✅ [UPLOAD] Using existing file:', img.name)
          } 
          // Priority 2: Try to fetch from blob URL (for non-cached images)
          else if (img.preview && img.preview.startsWith('blob:')) {
            console.log('🔄 [UPLOAD] Fetching blob URL:', img.name)
            const response = await fetch(img.preview)
            if (!response.ok) {
              throw new Error(`Failed to fetch blob: ${response.status}`)
            }
            const blob = await response.blob()
            const file = new File([blob], img.name || 'image.jpg', { type: blob.type || 'image/jpeg' })
            imageFiles.push(file)
            console.log('✅ [UPLOAD] Converted blob to file:', img.name)
          }
          else {
            console.warn('⚠️ [UPLOAD] Image has no valid file or blob:', img.name)
          }
        } catch (error) {
          console.error('❌ [UPLOAD] Failed to process image:', img.name, error)
          throw new Error(`Failed to process image: ${img.name}`)
        }
      }

      if (imageFiles.length > 0) {
        // Set user ID first (required by old system)
        uploadServiceClient.setUserId(currentUserId)
        
        // Upload using uploadServiceClient
        const uploadedImages = await uploadServiceClient.uploadImages(
          imageFiles,
          'listings',
          onProgress
        )
        
        uploadedImageUrls = uploadedImages.map(img => img.url)
        console.log('✅ Images uploaded', { count: uploadedImageUrls.length })
      }
    }

    // Step 2: Use category_id and category_path from form (like old system)
    const category_id = listingData.category_id
    const category_path = listingData.category_path
    
    console.log('🏷️ Category IDs from form:', {
      category: listingData.category,
      category_id,
      category_path
    });

    // Step 3: Create listing via Upload Service
    const response = await fetch(`${UPLOAD_SERVICE_URL}/listings/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': currentUserId,
      },
      body: JSON.stringify({
        title: listingData.title,
        description: listingData.description,
        budget: listingData.budget || 1, // Numeric budget
        category: listingData.category,
        location: listingData.location,
        images: uploadedImageUrls,
        status: 'pending_approval',
        urgency: listingData.urgency || 'medium',
        condition: listingData.condition || [],
        attributes: listingData.attributes || null,
        category_id: category_id, // Use numeric ID from form
        category_path: category_path, // Use numeric array from form
        is_featured: listingData.is_featured ?? false,
        is_urgent_premium: listingData.is_urgent_premium ?? false,
        is_showcase: listingData.is_showcase ?? false,
        geolocation: listingData.geolocation || null,
        metadata: {
          source: 'web',
          userAgent: typeof window !== 'undefined' ? navigator.userAgent : 'server',
          duration: listingData.duration,
          mainImageIndex: listingData.mainImageIndex
        }
      })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || `Listing creation failed: ${response.statusText}`)
    }

    const result = await response.json()
    
    if (!result.success) {
      throw new Error(result.message || 'Listing creation failed')
    }

    console.log('✅ Listing job started', { jobId: result.data.jobId })

    // Step 3: Poll for job completion
    const listing = await pollListingJobStatus(result.data.jobId, currentUserId, onProgress)
    
    return listing

  } catch (error) {
    console.error('❌ Error creating listing:', error)
    throw error
  }
}

/**
 * Poll listing job status until completion
 * Exact copy from old system
 */
async function pollListingJobStatus(
  jobId: string,
  userId: string,
  onProgress?: (progress: number) => void
): Promise<any> {
  const maxAttempts = 60 // 5 minutes max
  const pollInterval = 5000 // 5 seconds
  
  // Try Listing Service first (new system), fallback to Upload Service (old system)
  const LISTING_SERVICE_URL = process.env.NEXT_PUBLIC_LISTING_SERVICE_URL || 'http://localhost:3008/api/v1'
  
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      // Try Listing Service endpoint first
      let response = await fetch(`${LISTING_SERVICE_URL}/listings/jobs/${jobId}`, {
        headers: {
          'x-user-id': userId,
        },
      })

      // If Listing Service fails, try Upload Service (backward compatibility)
      if (!response.ok && response.status === 404) {
        console.log('⚠️ Job not found in Listing Service, trying Upload Service...')
        response = await fetch(`${UPLOAD_SERVICE_URL}/listings/status/${jobId}`, {
          headers: {
            'x-user-id': userId,
          },
        })
      }

      if (!response.ok) {
        throw new Error(`Status check failed: ${response.statusText}`)
      }

      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.data?.message || result.error || 'Status check failed')
      }

      // Handle both Listing Service and Upload Service response formats
      const jobData = result.data || result
      const status = jobData.status
      const progress = jobData.progress
      const jobResult = jobData.result || jobData
      const error = jobData.error

      // Update progress
      if (onProgress && progress !== undefined) {
        onProgress(progress)
      }

      if (status === 'completed') {
        console.log('✅ Listing job completed', { jobId })
        
        // Extract listing ID
        const listingId = jobResult?.listingId || jobResult?.listing?.id
        if (!listingId) {
          console.warn('⚠️ No listing ID in job result', { jobResult })
          return null
        }

        // Try to fetch listing from database
        try {
          const { supabase } = await import('@/lib/supabase')
          const { data: listing, error: fetchError } = await supabase
            .from('listings')
            .select('*')
            .eq('id', listingId)
            .single()

          if (fetchError) {
            console.warn('⚠️ Could not fetch listing', { listingId, error: fetchError.message })
            return { id: listingId, status: 'pending_approval' }
          }

          return listing || { id: listingId, status: 'pending_approval' }
        } catch (fetchErr) {
          console.warn('⚠️ Listing fetch error', { listingId, error: String(fetchErr) })
          return { id: listingId, status: 'pending_approval' }
        }
      } else if (status === 'failed') {
        throw new Error(error || 'Listing job failed')
      }

      // Still processing, wait and try again
      await new Promise(resolve => setTimeout(resolve, pollInterval))
      
    } catch (error) {
      console.error('❌ Error polling job status:', error)
      // Don't throw immediately, wait and retry (might be temporary network issue)
      if (attempt === maxAttempts - 1) {
        throw error
      }
      await new Promise(resolve => setTimeout(resolve, pollInterval))
    }
  }

  throw new Error('Listing job timed out')
}

