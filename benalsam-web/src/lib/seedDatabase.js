import { supabase } from '@/lib/supabaseClient';
import { fakerTR as faker } from '@faker-js/faker';
// import { categoriesConfig } from '@/config/categories'; // Removed - using dynamic categories
import { toast } from '@/components/ui/use-toast';

const getRandomElement = (arr) => arr[Math.floor(Math.random() * arr.length)];

const getRandomSubCategoryPath = () => {
  const mainCategory = getRandomElement(categoriesConfig);
  if (mainCategory.subcategories && mainCategory.subcategories.length > 0) {
    const subCategory = getRandomElement(mainCategory.subcategories);
    if (subCategory.subcategories && subCategory.subcategories.length > 0) {
      const subSubCategory = getRandomElement(subCategory.subcategories);
      return `${mainCategory.name} > ${subCategory.name} > ${subSubCategory.name}`;
    }
    return `${mainCategory.name} > ${subCategory.name}`;
  }
  return mainCategory.name;
};

const generateRandomImageUrl = (categoryKeyword, index) => {
  const keywords = categoryKeyword.split(' > ')[0].toLowerCase().replace(/\s+/g, '+') || 'product';
  return `https://source.unsplash.com/random/800x600/?${keywords}&sig=${Date.now() + index}`;
};

export const seedListings = async (count = 100) => {
  try {
    const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser();

    if (userError || !currentUser) {
      console.error('Error fetching current user:', userError);
      return { success: false, message: 'İlan oluşturmak için geçerli bir kullanıcı oturumu bulunamadı.' };
    }

    const listingsToInsert = [];
    for (let i = 0; i < count; i++) {
      const categoryPath = getRandomSubCategoryPath();
      
      let mainImageUrl = null;
      let additionalImageUrls = null;

      const hasMainImage = Math.random() < 0.8;

      if (hasMainImage) {
        mainImageUrl = generateRandomImageUrl(categoryPath, i);
        const hasAdditionalImages = Math.random() < 0.5; 
        if (hasAdditionalImages) {
          additionalImageUrls = Array.from({ length: faker.number.int({ min: 1, max: 3 }) }, (_, k) => generateRandomImageUrl(categoryPath, i * 10 + k + 1));
        }
      }
      
      const listing = {
        user_id: currentUser.id,
        title: faker.commerce.productName() + ' ' + faker.word.adjective(),
        description: faker.lorem.paragraphs(faker.number.int({ min: 1, max: 3 })),
        category: categoryPath,
        budget: faker.number.int({ min: 50, max: 5000 }),
        location: `${faker.location.city()}, ${faker.location.countryCode()}`,
        urgency: getRandomElement(['Acil', 'Normal', 'Acil Değil']),
        main_image_url: mainImageUrl,
        image_url: mainImageUrl, 
        additional_image_urls: additionalImageUrls,
        offers_count: faker.number.int({ min: 0, max: 15 }),
        views_count: faker.number.int({ min: 0, max: 500 }),
        created_at: faker.date.recent({ days: 30 }),
        updated_at: faker.date.recent({ days: 5 }),
      };
      listingsToInsert.push(listing);
    }

    const { data, error } = await supabase.from('listings').insert(listingsToInsert).select();

    if (error) {
      console.error('Error inserting fake listings:', error);
      return { success: false, message: `Sahte ilanlar eklenirken hata: ${error.message}` };
    }

    console.log(`${data.length} fake listings inserted successfully.`);
    return { success: true, message: `${data.length} sahte ilan başarıyla eklendi.` };

  } catch (e) {
    console.error('Unexpected error in seedListings:', e);
    return { success: false, message: `Beklenmedik hata: ${e.message}` };
  }
};

// Yeni güçlü temizleme fonksiyonu
export const clearAllDatabase = async () => {
  // Kullanıcı verileri HARİÇ temizlenecek tablolar (doğru sıralama ile)
  const tablesToClear = [
    // Önce bağımlı tablolar
    'offer_attachments',
    'monthly_usage_stats',
    'user_activities',
    'user_statistics', 
    'user_category_stats',
    'premium_subscriptions',
    'notifications',
    'messages', 
    'conversation_participants',
    'conversations',
    'listing_reports',
    'user_reviews',
    'offers', 
    'user_favorites', 
    'user_follows', 
    'user_followed_categories',
    'inventory_items',
    'listings'
  ];

  let errors = [];
  let successMessages = [];
  let totalClearedRows = 0;

  toast({ 
    title: "🧹 Kapsamlı Veri Temizleme Başladı", 
    description: `Kullanıcı verileri korunarak ${tablesToClear.length} tablo temizleniyor...`,
    duration: 5000
  });

  // Her tablo için temizleme işlemi
  for (const table of tablesToClear) {
    try {
      console.log(`Temizleniyor: ${table}`);
      
      // Önce kaç satır var kontrol et
      const { count: beforeCount } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });

      if (beforeCount > 0) {
        // Tüm satırları sil
        const { error, count } = await supabase
          .from(table)
          .delete()
          .gte('id', '00000000-0000-0000-0000-000000000000'); // Tüm satırları sil

        if (error) {
          console.error(`Error clearing ${table}:`, error);
          errors.push(`${table}: ${error.message}`);
        } else {
          const clearedCount = beforeCount;
          totalClearedRows += clearedCount;
          successMessages.push(`${table}: ${clearedCount} satır silindi`);
          console.log(`✅ ${table} temizlendi: ${clearedCount} satır`);
        }
      } else {
        successMessages.push(`${table}: zaten boş`);
        console.log(`ℹ️ ${table} zaten boş`);
      }
    } catch (e) {
      console.error(`Unexpected error clearing ${table}:`, e);
      errors.push(`${table}: ${e.message}`);
    }
  }

  // Storage bucket'larını temizle
  const storageBuckets = [
    'listing-images',
    'inventory-images', 
    'attachments'
  ];

  for (const bucketName of storageBuckets) {
    try {
      console.log(`Storage temizleniyor: ${bucketName}`);
      
      const { data: files, error: listError } = await supabase.storage
        .from(bucketName)
        .list('', { limit: 1000 });
      
      if (listError) {
        console.error(`Error listing ${bucketName}:`, listError);
        errors.push(`${bucketName} storage listelenemedi: ${listError.message}`);
        continue;
      }

      if (files && files.length > 0) {
        const filePaths = files.map(file => file.name);
        const { error: removeError } = await supabase.storage
          .from(bucketName)
          .remove(filePaths);
        
        if (removeError) {
          console.error(`Error removing files from ${bucketName}:`, removeError);
          errors.push(`${bucketName} dosyaları silinemedi: ${removeError.message}`);
        } else {
          successMessages.push(`${bucketName}: ${files.length} dosya silindi`);
          console.log(`✅ ${bucketName} temizlendi: ${files.length} dosya`);
        }
      } else {
        successMessages.push(`${bucketName}: zaten boş`);
        console.log(`ℹ️ ${bucketName} zaten boş`);
      }
    } catch (storageError) {
      console.error(`Error clearing storage ${bucketName}:`, storageError);
      errors.push(`${bucketName} storage hatası: ${storageError.message}`);
    }
  }

  // Sonuç bildirimi
  if (errors.length > 0) {
    console.error('Temizleme hataları:', errors);
    toast({
      title: "⚠️ Veri Temizleme Tamamlandı (Hatalarla)",
      description: `${totalClearedRows} satır silindi, ${errors.length} hata oluştu. Kullanıcı profilleri korundu.`,
      variant: "destructive",
      duration: 10000
    });
    return { 
      success: false, 
      message: `${totalClearedRows} satır silindi, ${errors.length} hata oluştu.`, 
      errors,
      successMessages,
      totalClearedRows
    };
  } else {
    console.log('✅ Tüm veriler başarıyla temizlendi');
    toast({
      title: "🎉 Veri Temizleme Başarılı!",
      description: `${totalClearedRows} satır ve tüm dosyalar başarıyla silindi. Kullanıcı profilleri korundu.`,
      variant: "default",
      duration: 8000
    });
    return { 
      success: true, 
      message: `${totalClearedRows} satır başarıyla silindi. Kullanıcı verileri korundu.`,
      successMessages,
      totalClearedRows
    };
  }
};

// Eski fonksiyon (geriye uyumluluk için)
export const clearAllSeedData = clearAllDatabase;

// Sadece kullanıcı verilerini temizleme fonksiyonu (acil durum için)
export const clearUserDataOnly = async () => {
  const userTablesToClear = [
    'profiles' // Sadece profil tablosu (auth.users tablosu dokunulmaz)
  ];

  let errors = [];
  let successMessages = [];

  toast({ 
    title: "⚠️ Kullanıcı Verileri Temizleniyor", 
    description: "UYARI: Bu işlem tüm kullanıcı profillerini silecek! Auth verileri korunacak.",
    variant: "destructive",
    duration: 8000
  });

  for (const table of userTablesToClear) {
    try {
      const { error } = await supabase
        .from(table)
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');
      
      if (error) {
        console.error(`Error clearing ${table}:`, error);
        errors.push(`Tablo ${table} temizlenirken hata: ${error.message}`);
      } else {
        successMessages.push(`${table} tablosu başarıyla temizlendi.`);
        console.log(`${table} table cleared successfully.`);
      }
    } catch (e) {
      console.error(`Unexpected error clearing ${table}:`, e);
      errors.push(`Tablo ${table} temizlenirken beklenmedik hata: ${e.message}`);
    }
  }

  // Profile images bucket temizle
  try {
    const { data: profileFiles } = await supabase.storage
      .from('profile-images')
      .list();
    
    if (profileFiles && profileFiles.length > 0) {
      const filePaths = profileFiles.map(file => file.name);
      await supabase.storage
        .from('profile-images')
        .remove(filePaths);
      successMessages.push('profile-images bucket temizlendi.');
    }
  } catch (storageError) {
    console.error('Error clearing profile storage:', storageError);
    errors.push(`Profile storage temizlenirken hata: ${storageError.message}`);
  }

  if (errors.length > 0) {
    toast({
      title: "Kullanıcı Veri Temizleme Hatası",
      description: `Bazı kullanıcı verileri temizlenirken hatalar oluştu: ${errors.join('; ')}`,
      variant: "destructive",
      duration: 10000
    });
    return { success: false, message: `Kullanıcı verileri temizlenirken hatalar oluştu.`, errors };
  } else {
    toast({
      title: "Kullanıcı Verileri Temizlendi!",
      description: "Tüm kullanıcı profilleri ve profil resimleri başarıyla silindi. Auth verileri korundu.",
      variant: "default",
      duration: 8000
    });
    return { success: true, message: "Kullanıcı verileri başarıyla temizlendi." };
  }
};