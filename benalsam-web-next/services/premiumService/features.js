import { supabase } from '@/lib/supabaseClient';
import { incrementUserUsage } from './usage';

// Teklifi öne çıkar
export const featureOffer = async (offerId, userId, durationHours = 24) => {
  if (!offerId || !userId) return false;
  
  try {
    const featuredUntil = new Date();
    featuredUntil.setHours(featuredUntil.getHours() + durationHours);
    
    const { data, error } = await supabase
      .from('featured_offers')
      .insert({
        offer_id: offerId,
        user_id: userId,
        featured_until: featuredUntil.toISOString()
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error featuring offer:', error);
      return false;
    }
    
    // Offers tablosunu güncelle
    await supabase
      .from('offers')
      .update({ 
        is_featured: true, 
        priority_level: 10 
      })
      .eq('id', offerId);
    
    // Kullanımı artır
    await incrementUserUsage(userId, 'featured_offer');
    
    return data;
  } catch (error) {
    console.error('Error featuring offer:', error);
    return false;
  }
};

// Teklif dosyası ekleme
export const addOfferAttachment = async (offerId, file) => {
  if (!offerId || !file) return null;
  
  try {
    // Dosyayı Supabase storage'a yükle
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `offer-attachments/${offerId}/${fileName}`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('attachments')
      .upload(filePath, file);
    
    if (uploadError) {
      console.error('Error uploading file:', uploadError);
      return null;
    }
    
    // Public URL al
    const { data: { publicUrl } } = supabase.storage
      .from('attachments')
      .getPublicUrl(filePath);
    
    // Veritabanına kaydet
    const { data, error } = await supabase
      .from('offer_attachments')
      .insert({
        offer_id: offerId,
        file_name: file.name,
        file_url: publicUrl,
        file_type: file.type,
        file_size: file.size
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error saving attachment:', error);
      return null;
    }
    
    // Offers tablosundaki attachment_count'u artır
    await supabase.rpc('increment', {
      table_name: 'offers',
      row_id: offerId,
      column_name: 'attachment_count'
    });
    
    return data;
  } catch (error) {
    console.error('Error adding attachment:', error);
    return null;
  }
};

// AI teklif önerisi oluştur
export const generateAISuggestion = async (listingTitle, listingDescription, userBudget) => {
  // Bu gerçek bir AI servisi olacak, şimdilik mock data
  const suggestions = [
    `${listingTitle} için harika bir teklifim var! Bütçenize uygun kaliteli bir çözüm sunabilirim.`,
    `Aradığınız ${listingTitle} konusunda deneyimliyim. Size en uygun fiyatı verebilirim.`,
    `${listingTitle} ihtiyacınız için mükemmel bir çözümüm var. Hemen görüşelim!`,
    `Kaliteli ${listingTitle} arıyorsanız doğru adrestesiniz. Uygun fiyat garantisi!`
  ];
  
  return suggestions[Math.floor(Math.random() * suggestions.length)];
};