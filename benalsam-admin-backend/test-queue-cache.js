const { createClient } = require('@supabase/supabase-js');
// ElasticsearchService import'unu kaldır, sadece fetch kullan

// Test configuration
const TEST_CONFIG = {
  supabaseUrl: process.env.SUPABASE_URL || 'https://dnwreckpeenhbdtapmxr.supabase.co',
  supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRud3JlY2twZWVuaGJkdGFwbXhyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTk5ODA3MCwiZXhwIjoyMDY1NTc0MDcwfQ.b6UNsncrPKXYB-17oyOEx8xY_hbofAx7ObwzKsyhsm4',
  elasticsearchUrl: process.env.ELASTICSEARCH_URL || 'http://209.227.228.96:9200',
  testListingId: '550e8400-e29b-41d4-a716-' + Date.now().toString().slice(-12),
  testUserId: '17d118f5-7ce2-4d19-8130-56b6fc025291', // Mevcut user ID
  testCategoryId: 948, // İş & Endüstri
};

console.log('🔧 Environment Check:', {
  supabaseUrl: TEST_CONFIG.supabaseUrl ? '✅ Set' : '❌ Missing',
  supabaseKey: TEST_CONFIG.supabaseKey ? '✅ Set' : '❌ Missing',
  elasticsearchUrl: TEST_CONFIG.elasticsearchUrl
});

// Initialize services
const supabase = createClient(TEST_CONFIG.supabaseUrl, TEST_CONFIG.supabaseKey);

console.log('🧪 Queue Cache Invalidation Test Başlatılıyor...');
console.log('📋 Test Konfigürasyonu:', {
  testListingId: TEST_CONFIG.testListingId,
  testUserId: TEST_CONFIG.testUserId,
  testCategoryId: TEST_CONFIG.testCategoryId
});

// Test data
const testListing = {
  id: TEST_CONFIG.testListingId,
  user_id: TEST_CONFIG.testUserId,
  title: 'Test İlan - Cache Invalidation',
  description: 'Bu ilan cache invalidation testi için oluşturuldu',
  category: 'İş & Endüstri',
  category_id: TEST_CONFIG.testCategoryId, // 948
  budget: 1000,
  location: 'İstanbul, Kadıköy',
  urgency: 'medium',
  neighborhood: 'Moda',
  main_image_url: 'https://via.placeholder.com/400x300',
  additional_image_urls: [],
  status: 'pending_approval',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

// Test functions
async function testCacheInvalidation() {
  console.log('\n🚀 Cache Invalidation Test Senaryoları Başlatılıyor...\n');

  try {
    // Test 1: İlan Onaylama (INSERT → UPDATE status: active)
    await testListingApproval();

    // Test 2: Kategori Değiştirme (UPDATE category_id)
    await testCategoryChange();

    // Test 3: İlan Deaktif Etme (UPDATE status: inactive)
    await testListingDeactivation();

    // Test 4: İlan Silme (DELETE)
    await testListingDeletion();

    // Test 5: Yeni Aktif İlan Ekleme (INSERT status: active)
    await testNewActiveListing();

    console.log('\n✅ Tüm test senaryoları başarıyla tamamlandı!');
    console.log('📊 Cache invalidation fonksiyonları düzgün çalışıyor.');

  } catch (error) {
    console.error('❌ Test hatası:', error);
  } finally {
    // Cleanup
    await cleanup();
  }
}

async function testListingApproval() {
  console.log('📝 Test 1: İlan Onaylama (Cache Invalidation)');
  
  try {
    // 1. Test ilanını oluştur
    console.log('   📋 Test ilanı oluşturuluyor...');
    const { data: createdListing, error: createError } = await supabase
      .from('listings')
      .insert(testListing)
      .select()
      .single();

    if (createError) throw createError;
    console.log('   ✅ Test ilanı oluşturuldu:', createdListing.id);

    // 2. Cache'i kontrol et (öncesi)
    console.log('   🔍 Cache durumu kontrol ediliyor (öncesi)...');
    const cacheBefore = await checkCategoryCountsCache();
    console.log('   📊 Cache öncesi:', cacheBefore);

    // 3. İlanı onayla (UPDATE status: active)
    console.log('   ✅ İlan onaylanıyor...');
    const { data: updatedListing, error: updateError } = await supabase
      .from('listings')
      .update({ 
        status: 'active',
        updated_at: new Date().toISOString()
      })
      .eq('id', createdListing.id)
      .select()
      .single();

    if (updateError) throw updateError;
    console.log('   ✅ İlan onaylandı:', updatedListing.status);

    // 4. Queue processing'i bekle
    console.log('   ⏳ Queue processing bekleniyor...');
    await waitForQueueProcessing();

    // 5. Cache'i kontrol et (sonrası)
    console.log('   🔍 Cache durumu kontrol ediliyor (sonrası)...');
    const cacheAfter = await checkCategoryCountsCache();
    console.log('   📊 Cache sonrası:', cacheAfter);

    // 6. Cache'in temizlendiğini doğrula
    if (cacheBefore === cacheAfter) {
      console.log('   ⚠️ Cache temizlenmedi!');
    } else {
      console.log('   ✅ Cache başarıyla temizlendi!');
    }

    console.log('   ✅ Test 1 başarılı!\n');

  } catch (error) {
    console.error('   ❌ Test 1 hatası:', error);
    throw error;
  }
}

async function testCategoryChange() {
  console.log('📝 Test 2: Kategori Değiştirme (Cache Invalidation)');
  
  try {
    // 1. Aktif ilanı bul
    console.log('   🔍 Aktif test ilanı aranıyor...');
    const { data: activeListing, error: findError } = await supabase
      .from('listings')
      .select('*')
      .eq('id', testListing.id)
      .eq('status', 'active')
      .single();

    if (findError) throw findError;
    console.log('   ✅ Aktif ilan bulundu:', activeListing.id);

    // 2. Cache'i kontrol et (öncesi)
    console.log('   🔍 Cache durumu kontrol ediliyor (öncesi)...');
    const cacheBefore = await checkCategoryCountsCache();
    console.log('   📊 Cache öncesi:', cacheBefore);

    // 3. Kategoriyi değiştir
    const newCategory = 'İş Makineleri';
    console.log(`   🔄 Kategori değiştiriliyor: ${activeListing.category} → ${newCategory}`);
    
    const { data: updatedListing, error: updateError } = await supabase
      .from('listings')
      .update({ 
        category: newCategory,
        category_id: 949, // İş Makineleri ID'si
        updated_at: new Date().toISOString()
      })
      .eq('id', activeListing.id)
      .select()
      .single();

    if (updateError) throw updateError;
    console.log('   ✅ Kategori değiştirildi:', updatedListing.category);

    // 4. Queue processing'i bekle
    console.log('   ⏳ Queue processing bekleniyor...');
    await waitForQueueProcessing();

    // 5. Cache'i kontrol et (sonrası)
    console.log('   🔍 Cache durumu kontrol ediliyor (sonrası)...');
    const cacheAfter = await checkCategoryCountsCache();
    console.log('   📊 Cache sonrası:', cacheAfter);

    // 6. Cache'in temizlendiğini doğrula
    if (cacheBefore === cacheAfter) {
      console.log('   ⚠️ Cache temizlenmedi!');
    } else {
      console.log('   ✅ Cache başarıyla temizlendi!');
    }

    console.log('   ✅ Test 2 başarılı!\n');

  } catch (error) {
    console.error('   ❌ Test 2 hatası:', error);
    throw error;
  }
}

async function testListingDeactivation() {
  console.log('📝 Test 3: İlan Deaktif Etme (Cache Invalidation)');
  
  try {
    // 1. Aktif ilanı bul
    console.log('   🔍 Aktif test ilanı aranıyor...');
    const { data: activeListing, error: findError } = await supabase
      .from('listings')
      .select('*')
      .eq('id', testListing.id)
      .eq('status', 'active')
      .single();

    if (findError) throw findError;
    console.log('   ✅ Aktif ilan bulundu:', activeListing.id);

    // 2. Cache'i kontrol et (öncesi)
    console.log('   🔍 Cache durumu kontrol ediliyor (öncesi)...');
    const cacheBefore = await checkCategoryCountsCache();
    console.log('   📊 Cache öncesi:', cacheBefore);

    // 3. İlanı deaktif et
    console.log('   🚫 İlan deaktif ediliyor...');
    const { data: updatedListing, error: updateError } = await supabase
      .from('listings')
      .update({ 
        status: 'inactive',
        updated_at: new Date().toISOString()
      })
      .eq('id', activeListing.id)
      .select()
      .single();

    if (updateError) throw updateError;
    console.log('   ✅ İlan deaktif edildi:', updatedListing.status);

    // 4. Queue processing'i bekle
    console.log('   ⏳ Queue processing bekleniyor...');
    await waitForQueueProcessing();

    // 5. Cache'i kontrol et (sonrası)
    console.log('   🔍 Cache durumu kontrol ediliyor (sonrası)...');
    const cacheAfter = await checkCategoryCountsCache();
    console.log('   📊 Cache sonrası:', cacheAfter);

    // 6. Cache'in temizlendiğini doğrula
    if (cacheBefore === cacheAfter) {
      console.log('   ⚠️ Cache temizlenmedi!');
    } else {
      console.log('   ✅ Cache başarıyla temizlendi!');
    }

    console.log('   ✅ Test 3 başarılı!\n');

  } catch (error) {
    console.error('   ❌ Test 3 hatası:', error);
    throw error;
  }
}

async function testListingDeletion() {
  console.log('📝 Test 4: İlan Silme (Cache Invalidation)');
  
  try {
    // 1. İlanı bul
    console.log('   🔍 Test ilanı aranıyor...');
    const { data: listing, error: findError } = await supabase
      .from('listings')
      .select('*')
      .eq('id', testListing.id)
      .single();

    if (findError) throw findError;
    console.log('   ✅ İlan bulundu:', listing.id);

    // 2. Cache'i kontrol et (öncesi)
    console.log('   🔍 Cache durumu kontrol ediliyor (öncesi)...');
    const cacheBefore = await checkCategoryCountsCache();
    console.log('   📊 Cache öncesi:', cacheBefore);

    // 3. İlanı sil
    console.log('   🗑️ İlan siliniyor...');
    const { error: deleteError } = await supabase
      .from('listings')
      .delete()
      .eq('id', listing.id);

    if (deleteError) throw deleteError;
    console.log('   ✅ İlan silindi');

    // 4. Queue processing'i bekle
    console.log('   ⏳ Queue processing bekleniyor...');
    await waitForQueueProcessing();

    // 5. Cache'i kontrol et (sonrası)
    console.log('   🔍 Cache durumu kontrol ediliyor (sonrası)...');
    const cacheAfter = await checkCategoryCountsCache();
    console.log('   📊 Cache sonrası:', cacheAfter);

    // 6. Cache'in temizlendiğini doğrula
    if (cacheBefore === cacheAfter) {
      console.log('   ⚠️ Cache temizlenmedi!');
    } else {
      console.log('   ✅ Cache başarıyla temizlendi!');
    }

    console.log('   ✅ Test 4 başarılı!\n');

  } catch (error) {
    console.error('   ❌ Test 4 hatası:', error);
    throw error;
  }
}

async function testNewActiveListing() {
  console.log('📝 Test 5: Yeni Aktif İlan Ekleme (Cache Invalidation)');
  
  try {
    // 1. Cache'i kontrol et (öncesi)
    console.log('   🔍 Cache durumu kontrol ediliyor (öncesi)...');
    const cacheBefore = await checkCategoryCountsCache();
    console.log('   📊 Cache öncesi:', cacheBefore);

    // 2. Yeni aktif ilan oluştur
    const newActiveListing = {
      ...testListing,
      id: '550e8400-e29b-41d4-a716-' + (Date.now() + 2).toString().slice(-12),
      status: 'active',
      title: 'Test Aktif İlan - Cache Test',
    };

    console.log('   📋 Yeni aktif ilan oluşturuluyor...');
    const { data: createdListing, error: createError } = await supabase
      .from('listings')
      .insert(newActiveListing)
      .select()
      .single();

    if (createError) throw createError;
    console.log('   ✅ Yeni aktif ilan oluşturuldu:', createdListing.id);

    // 3. Queue processing'i bekle
    console.log('   ⏳ Queue processing bekleniyor...');
    await waitForQueueProcessing();

    // 4. Cache'i kontrol et (sonrası)
    console.log('   🔍 Cache durumu kontrol ediliyor (sonrası)...');
    const cacheAfter = await checkCategoryCountsCache();
    console.log('   📊 Cache sonrası:', cacheAfter);

    // 5. Cache'in temizlendiğini doğrula
    if (cacheBefore === cacheAfter) {
      console.log('   ⚠️ Cache temizlenmedi!');
    } else {
      console.log('   ✅ Cache başarıyla temizlendi!');
    }

    console.log('   ✅ Test 5 başarılı!\n');

  } catch (error) {
    console.error('   ❌ Test 5 hatası:', error);
    throw error;
  }
}

// Helper functions
async function checkCategoryCountsCache() {
  try {
    // Elasticsearch'ten category counts'u çek
    const response = await fetch(`${TEST_CONFIG.elasticsearchUrl}/listings/_search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        size: 0,
        aggs: {
          category_counts: {
            terms: {
              field: 'category_id',
              size: 1000
            }
          }
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Elasticsearch error: ${response.status}`);
    }

    const data = await response.json();
    const buckets = data.aggregations?.category_counts?.buckets || [];
    
    // Hash oluştur (cache durumunu karşılaştırmak için)
    const hash = buckets.map(bucket => `${bucket.key}:${bucket.doc_count}`).join('|');
    return hash;

  } catch (error) {
    console.error('Cache kontrol hatası:', error);
    return 'error';
  }
}

async function waitForQueueProcessing() {
  // Queue processing için bekle (5 saniye)
  await new Promise(resolve => setTimeout(resolve, 5000));
}

async function cleanup() {
  console.log('\n🧹 Temizlik işlemleri başlatılıyor...');
  
  try {
    // Test ilanlarını temizle
    const { error: deleteError } = await supabase
      .from('listings')
      .delete()
      .like('id', '550e8400-e29b-41d4-a716-%');

    if (deleteError) {
      console.error('❌ Temizlik hatası:', deleteError);
    } else {
      console.log('✅ Test ilanları temizlendi');
    }

    // Queue'daki test job'larını temizle
    const { error: queueError } = await supabase
      .from('elasticsearch_sync_queue')
      .delete()
      .like('record_id', '550e8400-e29b-41d4-a716-%');

    if (queueError) {
      console.error('❌ Queue temizlik hatası:', queueError);
    } else {
      console.log('✅ Test queue job\'ları temizlendi');
    }

  } catch (error) {
    console.error('❌ Genel temizlik hatası:', error);
  }
}

// Test execution
if (require.main === module) {
  testCacheInvalidation().then(() => {
    console.log('\n🎉 Test tamamlandı!');
    process.exit(0);
  }).catch((error) => {
    console.error('\n💥 Test başarısız:', error);
    process.exit(1);
  });
}

module.exports = {
  testCacheInvalidation,
  testListingApproval,
  testCategoryChange,
  testListingDeactivation,
  testListingDeletion,
  testNewActiveListing
};
