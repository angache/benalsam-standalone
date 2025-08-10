import { supabase  } from '../services/supabaseClient';

export const createListingReport = async (reportData: any) => {
  const { reporter_id, listing_id, reason, details } = reportData;

  if (!reporter_id || !listing_id || !reason) {
    return null;
  }

  const { data, error } = await supabase
    .from('listing_reports')
    .insert([{ reporter_id, listing_id, reason, details }])
    .select()
    .single();

  if (error) {
    console.error('Error creating listing report:', error);
    return null;
  }
  return data;
}; 