import { supabase } from '@/lib/supabase';
import { toast } from '@/hooks/use-toast';
import { ListingReport } from 'benalsam-shared-types';

// Report reason types
export const REPORT_REASONS = {
  INAPPROPRIATE_CONTENT: 'inappropriate_content',
  SPAM: 'spam',
  FRAUD: 'fraud',
  HARASSMENT: 'harassment',
  COPYRIGHT_VIOLATION: 'copyright_violation',
  PRICE_MANIPULATION: 'price_manipulation',
  FAKE_LISTING: 'fake_listing',
  OTHER: 'other'
} as const;

export const createListingReport = async (reportData: Partial<ListingReport>): Promise<ListingReport | null> => {
  const { reporter_id, listing_id, reason } = reportData;

  if (!reporter_id || !listing_id || !reason) {
    toast({ title: "Eksik Bilgi", description: "Şikayet oluşturmak için gerekli tüm alanlar doldurulmalıdır.", variant: "destructive" });
    return null;
  }

  try {
    const { data, error } = await supabase
      .from('listing_reports')
      .insert([{ 
        reporter_id, 
        listing_id, 
        reason, 
        status: 'pending',
        created_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating listing report:', error);
      toast({ title: "Şikayet Oluşturulamadı", description: error.message, variant: "destructive" });
      return null;
    }

    toast({ 
      title: "Şikayet Gönderildi", 
      description: "İlanla ilgili şikayetiniz alınmıştır. En kısa sürede incelenecektir.", 
      variant: "default" 
    });

    return data as ListingReport;
  } catch (error) {
    console.error('Unexpected error in createListingReport:', error);
    toast({ title: "Beklenmedik Hata", description: "Şikayet oluşturulurken bir sorun oluştu.", variant: "destructive" });
    return null;
  }
};

// Additional report functions
export const getUserReports = async (userId: string): Promise<ListingReport[]> => {
  if (!userId) return [];

  try {
    const { data, error } = await supabase
      .from('listing_reports')
      .select('*')
      .eq('reporter_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user reports:', error);
      return [];
    }

    return (data || []) as ListingReport[];
  } catch (error) {
    console.error('Error in getUserReports:', error);
    return [];
  }
};

export const getListingReports = async (listingId: string): Promise<ListingReport[]> => {
  if (!listingId) return [];

  try {
    const { data, error } = await supabase
      .from('listing_reports')
      .select('*')
      .eq('listing_id', listingId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching listing reports:', error);
      return [];
    }

    return (data || []) as ListingReport[];
  } catch (error) {
    console.error('Error in getListingReports:', error);
    return [];
  }
};

export const updateReportStatus = async (
  reportId: string, 
  status: ListingReport['status'], 
  adminNotes?: string
): Promise<ListingReport | null> => {
  if (!reportId || !status) {
    toast({ title: "Eksik Bilgi", description: "Rapor ID'si ve durum gereklidir.", variant: "destructive" });
    return null;
  }

  try {
    const { data, error } = await supabase
      .from('listing_reports')
      .update({
        status,
        admin_notes: adminNotes,
        updated_at: new Date().toISOString()
      })
      .eq('id', reportId)
      .select()
      .single();

    if (error) {
      console.error('Error updating report status:', error);
      toast({ title: "Rapor Güncellenemedi", description: error.message, variant: "destructive" });
      return null;
    }

    return data as ListingReport;
  } catch (error) {
    console.error('Error in updateReportStatus:', error);
    toast({ title: "Beklenmedik Hata", description: "Rapor güncellenirken bir sorun oluştu.", variant: "destructive" });
    return null;
  }
};

export const getReportStats = async (): Promise<{
  totalReports: number;
  pendingReports: number;
  resolvedReports: number;
  dismissedReports: number;
  reportsByReason: Record<string, number>;
} | null> => {
  try {
    const { data, error } = await supabase
      .from('listing_reports')
      .select('*');

    if (error) {
      console.error('Error getting report stats:', error);
      return null;
    }

    const reports = data || [];
    const totalReports = reports.length;
    const pendingReports = reports.filter(report => report.status === 'pending').length;
    const resolvedReports = reports.filter(report => report.status === 'resolved').length;
    const dismissedReports = reports.filter(report => report.status === 'dismissed').length;

    const reportsByReason: Record<string, number> = {};
    reports.forEach(report => {
      reportsByReason[report.reason] = (reportsByReason[report.reason] || 0) + 1;
    });

    return {
      totalReports,
      pendingReports,
      resolvedReports,
      dismissedReports,
      reportsByReason
    };
  } catch (error) {
    console.error('Error in getReportStats:', error);
    return null;
  }
}; 