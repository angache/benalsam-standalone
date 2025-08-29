import { supabase } from '@/lib/supabaseClient';
import { toast } from '@/components/ui/use-toast';
import { addUserActivity } from '@/services/userActivityService';
import { processImagesForSupabase } from '@/services/imageService';
import { Listing } from '@/types';

import { categoriesConfig } from '@/config/categories';

// Kategori path'ini ID'lere çevir
const getCategoryIds = (categoryString: string) => {
  if (!categoryString) return { category_id: null, category_path: null };
  
  console.log('🔍 Processing category string:', categoryString);
  console.log('🔍 categoriesConfig:', categoriesConfig);
  
  // Kategori path'ini parçala
  const pathParts = categoryString.split(' > ');
  console.log('🔍 Path parts:', pathParts);
  
  if (pathParts.length === 0) {
    console.log('⚠️ No path parts found');
    return { category_id: null, category_path: null };
  }
  
  // Ana kategoriyi bul
  const mainCategory = categoriesConfig.find(cat => cat.name === pathParts[0]);
  if (!mainCategory) {
    console.log('⚠️ Main category not found:', pathParts[0]);
    return { category_id: null, category_path: null };
  }
  
  // Ana kategori ID'si (1-13 arası)
  const mainCategoryId = categoriesConfig.findIndex(cat => cat.name === pathParts[0]) + 1;
  console.log('✅ Main category found:', pathParts[0], 'ID:', mainCategoryId);
  
  const categoryPath = [mainCategoryId];
  let categoryId = mainCategoryId;
  
  // Alt kategori varsa
  if (pathParts.length > 1 && mainCategory.subcategories) {
    const subCategory = mainCategory.subcategories.find(sub => sub.name === pathParts[1]);
    if (subCategory) {
      // Alt kategori ID'si (101-1303 arası)
      const subCategoryId = mainCategoryId * 100 + mainCategory.subcategories.findIndex(sub => sub.name === pathParts[1]) + 1;
      categoryPath.push(subCategoryId);
      categoryId = subCategoryId;
      console.log('✅ Subcategory found:', pathParts[1], 'ID:', subCategoryId);
      
      // Alt-alt kategori varsa
      if (pathParts.length > 2 && subCategory.subcategories) {
        const subSubCategory = subCategory.subcategories.find(subSub => subSub.name === pathParts[2]);
        if (subSubCategory) {
          // Alt-alt kategori ID'si (1001-9999 arası)
          const subSubCategoryId = subCategoryId * 10 + subCategory.subcategories.findIndex(subSub => subSub.name === pathParts[2]) + 1;
          categoryPath.push(subSubCategoryId);
          categoryId = subSubCategoryId;
          console.log('✅ Sub-subcategory found:', pathParts[2], 'ID:', subSubCategoryId);
        }
      }
    }
  }
  
  console.log('✅ Final result - Category ID:', categoryId, 'Path:', categoryPath);
  
  return {
    category_id: categoryId,
    category_path: categoryPath
  };
};



export const createListing = async (
  listingData: any, 
  currentUserId: string, 
  onProgress?: (progress: number) => void
): Promise<Listing | null> => {
  if (!listingData || !currentUserId) {
    toast({ title: "Hata", description: "İlan oluşturmak için eksik bilgi.", variant: "destructive" });
    return null;
  }

  try {
    const { mainImageUrl, additionalImageUrls } = await processImagesForSupabase(
      listingData.images,
      listingData.mainImageIndex,
      'item_images',
      'listings',
      currentUserId,
      listingData.category,
      onProgress
    );

    let expiresAt = null;
    if (listingData.duration && listingData.duration > 0) {
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + listingData.duration);
    }

    // Kategori ID'lerini hesapla
    const { category_id, category_path } = getCategoryIds(listingData.category);

    const listingToInsert = {
      user_id: currentUserId,
      title: listingData.title,
      description: listingData.description,
      category: listingData.category,
      category_id: category_id,
      category_path: category_path,
      status: 'pending_approval',
      budget: listingData.budget,
      location: listingData.location,
      urgency: listingData.urgency,
      main_image_url: mainImageUrl,
      additional_image_urls: additionalImageUrls.length > 0 ? additionalImageUrls : null,
      image_url: mainImageUrl,
      expires_at: expiresAt ? expiresAt.toISOString() : null,
      auto_republish: listingData.autoRepublish,
      contact_preference: listingData.contactPreference,
      accept_terms: listingData.acceptTerms,
      is_featured: listingData.is_featured || false,
      is_urgent_premium: listingData.is_urgent_premium || false,
      is_showcase: listingData.is_showcase || false,
      latitude: listingData.geolocation?.latitude || null,
      longitude: listingData.geolocation?.longitude || null,
      geolocation: listingData.geolocation ? `POINT(${listingData.geolocation.longitude} ${listingData.geolocation.latitude})` : null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    console.log('🔍 Creating listing with data:', JSON.stringify(listingToInsert, null, 2));

    const { data, error } = await supabase
      .from('listings')
      .insert(listingToInsert)
      .select()
      .single();

    if (error) {
      console.error('Error creating listing:', error);
      toast({ title: "İlan Oluşturulamadı", description: error.message, variant: "destructive" });
      return null;
    }

    await addUserActivity(
      currentUserId,
      'listing_created',
      'Yeni ilan oluşturuldu',
      `"${listingData.title}" ilanı oluşturuldu`,
      data.id
    );

    return data;
  } catch (error) {
    console.error('Error in createListing:', error);
    toast({ title: "Beklenmedik Hata", description: "İlan oluşturulurken bir sorun oluştu.", variant: "destructive" });
    return null;
  }
};

export const updateListing = async (
  listingId: string, 
  updates: Partial<Listing>, 
  userId: string
): Promise<Listing | null> => {
  if (!listingId || !updates || !userId) {
    toast({ title: "Hata", description: "İlan güncellemek için eksik bilgi.", variant: "destructive" });
    return null;
  }

  try {
    const dbUpdates: any = {
      title: updates.title,
      description: updates.description,
      category: updates.category,
      budget: updates.budget,
      location: updates.location,
      urgency: updates.urgency,
      contact_preference: updates.contact_preference,
      auto_republish: updates.auto_republish,
      accept_terms: updates.accept_terms,
      is_featured: updates.is_featured,
      is_urgent_premium: updates.is_urgent_premium,
      is_showcase: updates.is_showcase,
      geolocation: updates.geolocation,
      updated_at: new Date().toISOString()
    };

    if (updates.main_image_url !== undefined) {
      dbUpdates.main_image_url = updates.main_image_url;
      dbUpdates.image_url = updates.main_image_url;
    }
    if (updates.additional_image_urls !== undefined) {
      dbUpdates.additional_image_urls = updates.additional_image_urls;
    }

    const { data, error } = await supabase
      .from('listings')
      .update(dbUpdates)
      .eq('id', listingId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating listing:', error);
      toast({ title: "İlan Güncellenemedi", description: error.message, variant: "destructive" });
      return null;
    }

    await addUserActivity(
      userId,
      'listing_updated',
      'İlan güncellendi',
      `"${data.title}" ilanı güncellendi`,
      data.id
    );

    return data;
  } catch (error) {
    console.error('Error in updateListing:', error);
    toast({ title: "Beklenmedik Hata", description: "İlan güncellenirken bir sorun oluştu.", variant: "destructive" });
    return null;
  }
};

export const updateListingStatus = async (
  listingId: string, 
  userId: string, 
  status: string, 
  reason: string | null = null
): Promise<Listing | null> => {
  if (!listingId || !userId || !status) {
    toast({ title: "Hata", description: "İlan durumu güncellemek için eksik bilgi.", variant: "destructive" });
    return null;
  }

  try {
    const updateData: any = {
      status: status,
      updated_at: new Date().toISOString()
    };

    if (reason) {
      updateData.rejection_reason = reason;
    }

    const { data, error } = await supabase
      .from('listings')
      .update(updateData)
      .eq('id', listingId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating listing status:', error);
      toast({ title: "Durum Güncellenemedi", description: error.message, variant: "destructive" });
      return null;
    }

    let statusText = '';
    switch (status) {
      case 'active':
        statusText = 'aktif edildi';
        break;
      case 'inactive':
        statusText = 'pasif edildi';
        break;
      case 'pending_approval':
        statusText = 'onay bekliyor';
        break;
      case 'rejected':
        statusText = 'reddedildi';
        break;
      default:
        statusText = 'güncellendi';
    }

    await addUserActivity(
      userId,
      'listing_status_changed',
      `İlan ${statusText}`,
      `"${data.title}" ilanı ${statusText}`,
      data.id
    );

    return data;
  } catch (error) {
    console.error('Error in updateListingStatus:', error);
    toast({ title: "Beklenmedik Hata", description: "İlan durumu güncellenirken bir sorun oluştu.", variant: "destructive" });
    return null;
  }
};

export const deleteListing = async (listingId: string, userId: string): Promise<boolean> => {
  if (!listingId || !userId) {
    toast({ title: "Hata", description: "İlan silmek için eksik bilgi.", variant: "destructive" });
    return false;
  }

  try {
    const { data: listingData, error: fetchError } = await supabase
      .from('listings')
      .select('title')
      .eq('id', listingId)
      .eq('user_id', userId)
      .single();

    if (fetchError) {
      console.error('Error fetching listing for deletion:', fetchError);
      toast({ title: "İlan Bulunamadı", description: "Silinecek ilan bulunamadı.", variant: "destructive" });
      return false;
    }

    const { error } = await supabase
      .from('listings')
      .delete()
      .eq('id', listingId)
      .eq('user_id', userId);

    if (error) {
      console.error('Error deleting listing:', error);
      toast({ title: "İlan Silinemedi", description: error.message, variant: "destructive" });
      return false;
    }

    await addUserActivity(
      userId,
      'listing_deleted',
      'İlan silindi',
      `"${listingData.title}" ilanı silindi`,
      listingId
    );

    return true;
  } catch (error) {
    console.error('Error in deleteListing:', error);
    toast({ title: "Beklenmedik Hata", description: "İlan silinirken bir sorun oluştu.", variant: "destructive" });
    return false;
  }
};

export const toggleListingStatus = async (
  listingId: string, 
  newStatus: string, 
  userId: string
): Promise<Listing | null> => {
  if (!listingId || !newStatus || !userId) {
    toast({ title: "Hata", description: "İlan durumu değiştirmek için eksik bilgi.", variant: "destructive" });
    return null;
  }

  try {
    const { data, error } = await supabase
      .from('listings')
      .update({
        status: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', listingId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error toggling listing status:', error);
      toast({ title: "Durum Değiştirilemedi", description: error.message, variant: "destructive" });
      return null;
    }

    const statusText = newStatus === 'active' ? 'aktif edildi' : 'pasif edildi';

    await addUserActivity(
      userId,
      'listing_status_toggled',
      `İlan ${statusText}`,
      `"${data.title}" ilanı ${statusText}`,
      data.id
    );

    toast({ 
      title: "Durum Güncellendi", 
      description: `İlan ${statusText}.` 
    });

    return data;
  } catch (error) {
    console.error('Error in toggleListingStatus:', error);
    toast({ title: "Beklenmedik Hata", description: "İlan durumu değiştirilirken bir sorun oluştu.", variant: "destructive" });
    return null;
  }
}; 