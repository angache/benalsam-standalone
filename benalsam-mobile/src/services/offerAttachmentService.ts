import { supabase  } from '../services/supabaseClient';
import { ApiResponse, OfferAttachment } from '../types';
import { ValidationError, DatabaseError, handleError } from '../utils/errors';

export const createOfferAttachment = async (attachmentData: Partial<OfferAttachment>): Promise<ApiResponse<OfferAttachment>> => {
  try {
    // Validate required fields
    if (!attachmentData.offer_id || !attachmentData.file_url || !attachmentData.file_type || !attachmentData.file_name || !attachmentData.file_size) {
      throw new ValidationError('Offer ID, file URL, file type, file name, and file size are required');
    }

    // Validate file type
    const validFileTypes = ['image', 'document', 'other'];
    if (!validFileTypes.includes(attachmentData.file_type)) {
      throw new ValidationError(`Invalid file type. Must be one of: ${validFileTypes.join(', ')}`);
    }

    const { data, error } = await supabase
      .from('offer_attachments')
      .insert([{
        offer_id: attachmentData.offer_id,
        file_url: attachmentData.file_url,
        file_type: attachmentData.file_type,
        file_name: attachmentData.file_name,
        file_size: attachmentData.file_size,
        created_at: new Date().toISOString()
      }])
      .select(`
        *,
        offer:offers!offer_attachments_offer_id_fkey (
          id,
          listing_id,
          offering_user_id,
          status
        )
      `)
      .single();

    if (error) {
      throw new DatabaseError('Failed to create offer attachment', error);
    }

    return { data };
  } catch (error) {
    console.error('Error in createOfferAttachment:', error);
    const handledError = handleError(error);
    return { error: handledError.error };
  }
};

export const getOfferAttachments = async (offerId: string): Promise<ApiResponse<OfferAttachment[]>> => {
  try {
    if (!offerId) {
      throw new ValidationError('Offer ID is required');
    }

    const { data, error } = await supabase
      .from('offer_attachments')
      .select(`
        *,
        offer:offers!offer_attachments_offer_id_fkey (
          id,
          listing_id,
          offering_user_id,
          status
        )
      `)
      .eq('offer_id', offerId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new DatabaseError('Failed to fetch offer attachments', error);
    }

    return { data: data || [] };
  } catch (error) {
    console.error('Error in getOfferAttachments:', error);
    const handledError = handleError(error);
    return { error: handledError.error };
  }
};

export const deleteOfferAttachment = async (attachmentId: string): Promise<ApiResponse<boolean>> => {
  try {
    if (!attachmentId) {
      throw new ValidationError('Attachment ID is required');
    }

    const { error } = await supabase
      .from('offer_attachments')
      .delete()
      .eq('id', attachmentId);

    if (error) {
      throw new DatabaseError('Failed to delete offer attachment', error);
    }

    return { data: true };
  } catch (error) {
    console.error('Error in deleteOfferAttachment:', error);
    const handledError = handleError(error);
    return { error: handledError.error };
  }
}; 