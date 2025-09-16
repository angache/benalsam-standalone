/**
 * Upload Service Listing Mutations
 * 
 * @fileoverview Listing creation and updates using Upload Service with job system
 * @author Benalsam Team
 * @version 1.0.0
 */

import { toast } from '@/components/ui/use-toast';
import { addUserActivity } from '@/services/userActivityService';
import { uploadService } from '@/services/uploadService';
import { Listing } from '@/types';
import { ListingStatus } from 'benalsam-shared-types';

const UPLOAD_SERVICE_URL = 'http://localhost:3007/api/v1';

/**
 * Create listing using Upload Service with job system
 */
export const createListingWithUploadService = async (
  listingData: Omit<Listing, 'id' | 'created_at' | 'updated_at' | 'status'> & {
    images: string[];
    mainImageIndex: number;
    duration?: number;
  }, 
  currentUserId: string, 
  onProgress?: (progress: number) => void
): Promise<Listing | null> => {
  if (!listingData || !currentUserId) {
    toast({ title: "Hata", description: "İlan oluşturmak için eksik bilgi.", variant: "destructive" });
    return null;
  }

  try {
    // Check if Upload Service is available
    const isAvailable = await uploadService.isAvailable();
    if (!isAvailable) {
      console.warn('⚠️ Upload Service not available, falling back to direct database creation');
      // Fallback to direct database creation
      const { createListing } = await import('./mutations');
      return createListing(listingData, currentUserId, onProgress);
    }

    console.log('🚀 Creating listing via Upload Service job system', {
      title: listingData.title,
      category: listingData.category,
      imageCount: listingData.images.length
    });

    // Create listing via Upload Service
    const response = await fetch(`${UPLOAD_SERVICE_URL}/listings/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': currentUserId,
      },
      body: JSON.stringify({
        title: listingData.title,
        description: listingData.description,
        price: listingData.budget || 0,
        category: listingData.category,
        location: listingData.location,
        images: listingData.images,
        status: ListingStatus.PENDING_APPROVAL,
        metadata: {
          source: 'web',
          userAgent: navigator.userAgent,
          duration: listingData.duration,
          mainImageIndex: listingData.mainImageIndex
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Listing creation failed: ${response.statusText}`);
    }

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.message || 'Listing creation failed');
    }

    console.log('✅ Listing creation job started', {
      jobId: result.data.jobId,
      status: result.data.status
    });

    // Show success message
    toast({
      title: "İlan Oluşturuldu",
      description: "İlanınız işleme alındı. Görseller yükleniyor...",
    });

    // Poll for job completion
    const listing = await pollListingJobStatus(result.data.jobId, currentUserId, onProgress);
    
    if (listing) {
      await addUserActivity(
        currentUserId,
        'listing_created',
        'Yeni ilan oluşturuldu',
        `"${listingData.title}" ilanı oluşturuldu`,
        listing.id
      );
    }

    return listing;

  } catch (error) {
    console.error('Error in createListingWithUploadService:', error);
    toast({ 
      title: "Beklenmedik Hata", 
      description: error instanceof Error ? error.message : "İlan oluşturulurken bir sorun oluştu.", 
      variant: "destructive" 
    });
    return null;
  }
};

/**
 * Update listing using Upload Service with job system
 */
export const updateListingWithUploadService = async (
  listingId: string, 
  updates: Partial<Listing>, 
  userId: string
): Promise<Listing | null> => {
  if (!listingId || !updates || !userId) {
    toast({ title: "Hata", description: "İlan güncellemek için eksik bilgi.", variant: "destructive" });
    return null;
  }

  try {
    // Check if Upload Service is available
    const isAvailable = await uploadService.isAvailable();
    if (!isAvailable) {
      console.warn('⚠️ Upload Service not available, falling back to direct database update');
      // Fallback to direct database update
      const { updateListing } = await import('./mutations');
      return updateListing(listingId, updates, userId);
    }

    console.log('🔄 Updating listing via Upload Service job system', {
      listingId,
      updateFields: Object.keys(updates)
    });

    // Update listing via Upload Service
    const response = await fetch(`${UPLOAD_SERVICE_URL}/listings/${listingId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': userId,
      },
      body: JSON.stringify({
        title: updates.title,
        description: updates.description,
        price: updates.budget,
        category: updates.category,
        location: updates.location,
        images: updates.images,
        status: updates.status,
        metadata: {
          source: 'web',
          userAgent: navigator.userAgent
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Listing update failed: ${response.statusText}`);
    }

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.message || 'Listing update failed');
    }

    console.log('✅ Listing update job started', {
      jobId: result.data.jobId,
      status: result.data.status
    });

    // Show success message
    toast({
      title: "İlan Güncellendi",
      description: "İlan güncelleme işlemi başlatıldı.",
    });

    // Poll for job completion
    const updatedListing = await pollListingJobStatus(result.data.jobId, userId);
    
    if (updatedListing) {
      await addUserActivity(
        userId,
        'listing_updated',
        'İlan güncellendi',
        `"${updatedListing.title}" ilanı güncellendi`,
        updatedListing.id
      );
    }

    return updatedListing;

  } catch (error) {
    console.error('Error in updateListingWithUploadService:', error);
    toast({ 
      title: "Beklenmedik Hata", 
      description: error instanceof Error ? error.message : "İlan güncellenirken bir sorun oluştu.", 
      variant: "destructive" 
    });
    return null;
  }
};

/**
 * Poll listing job status until completion
 */
async function pollListingJobStatus(
  jobId: string, 
  userId: string, 
  onProgress?: (progress: number) => void
): Promise<Listing | null> {
  const maxAttempts = 60; // 5 minutes max
  const pollInterval = 5000; // 5 seconds
  
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const response = await fetch(`${UPLOAD_SERVICE_URL}/listings/status/${jobId}`, {
        headers: {
          'x-user-id': userId,
        },
      });

      if (!response.ok) {
        throw new Error(`Status check failed: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.data.message || 'Status check failed');
      }

      const { status, progress, result: jobResult, error } = result.data;

      // Update progress
      if (onProgress && progress !== undefined) {
        onProgress(progress);
      }

      if (status === 'completed') {
        console.log('✅ Listing job completed successfully', { jobId });
        
        if (jobResult && jobResult.listingId) {
          // Fetch the created/updated listing from database
          const { supabase } = await import('@/lib/supabaseClient');
          const { data: listing, error: fetchError } = await supabase
            .from('listings')
            .select('*')
            .eq('id', jobResult.listingId)
            .single();

          if (fetchError) {
            console.error('❌ Failed to fetch created listing:', fetchError);
            return null;
          }

          return listing;
        }
        
        return null;
      } else if (status === 'failed') {
        throw new Error(error || 'Listing job failed');
      }

      // Job still processing, wait and try again
      await new Promise(resolve => setTimeout(resolve, pollInterval));
      
    } catch (error) {
      console.error('❌ Error polling job status:', error);
      throw error;
    }
  }

  throw new Error('Listing job timed out');
}
