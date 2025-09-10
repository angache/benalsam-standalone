import { Router } from 'express';
import { supabase } from '../config/supabase';
import logger from '../config/logger';

const router = Router();

/**
 * Test trigger'ın çalışıp çalışmadığını kontrol et
 */
router.post('/test-trigger', async (req, res) => {
  try {
    logger.info('🧪 Testing PostgreSQL trigger...');

    // 1. Önce mevcut job sayısını al
    const { data: beforeJobs, error: beforeError } = await supabase
      .from('elasticsearch_sync_queue')
      .select('id')
      .eq('status', 'pending');

    if (beforeError) {
      throw beforeError;
    }

    const beforeCount = beforeJobs?.length || 0;
    logger.info(`📊 Before test: ${beforeCount} pending jobs`);

    // 2. Test ilanı oluştur (status = 'pending')
    const { data: testListing, error: insertError } = await supabase
      .from('listings')
      .insert({
        title: 'Test Trigger İlanı',
        description: 'Bu ilan trigger testi için oluşturuldu',
        category_id: 1,
        user_id: '00000000-0000-0000-0000-000000000000', // Test user ID
        status: 'pending',
        price: 100,
        location: 'Test Location'
      })
      .select()
      .single();

    if (insertError) {
      throw insertError;
    }

    logger.info(`✅ Test listing created: ${testListing.id}`);

    // 3. Kısa bir bekleme (trigger'ın çalışması için)
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 4. Job sayısını tekrar kontrol et
    const { data: afterJobs, error: afterError } = await supabase
      .from('elasticsearch_sync_queue')
      .select('id')
      .eq('status', 'pending');

    if (afterError) {
      throw afterError;
    }

    const afterCount = afterJobs?.length || 0;
    logger.info(`📊 After test: ${afterCount} pending jobs`);

    // 5. İlanı 'active' yap (trigger çalışmalı)
    const { error: updateError } = await supabase
      .from('listings')
      .update({ status: 'active' })
      .eq('id', testListing.id);

    if (updateError) {
      throw updateError;
    }

    logger.info(`✅ Test listing updated to active: ${testListing.id}`);

    // 6. Tekrar bekleme
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 7. Son job sayısını kontrol et
    const { data: finalJobs, error: finalError } = await supabase
      .from('elasticsearch_sync_queue')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(5);

    if (finalError) {
      throw finalError;
    }

    const finalCount = finalJobs?.length || 0;
    logger.info(`📊 Final: ${finalCount} pending jobs`);

    // 8. Test ilanını temizle
    await supabase
      .from('listings')
      .delete()
      .eq('id', testListing.id);

    logger.info(`🗑️ Test listing cleaned up: ${testListing.id}`);

    // Sonuçları döndür
    res.json({
      success: true,
      message: 'Trigger test completed',
      results: {
        beforeCount,
        afterCount,
        finalCount,
        jobsCreated: finalCount - beforeCount,
        recentJobs: finalJobs
      }
    });

  } catch (error) {
    logger.error('❌ Trigger test failed:', error);
    res.status(500).json({
      success: false,
      message: 'Trigger test failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Mevcut job'ları listele
 */
router.get('/jobs', async (req, res) => {
  try {
    const { data: jobs, error } = await supabase
      .from('elasticsearch_sync_queue')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      jobs: jobs || []
    });

  } catch (error) {
    logger.error('❌ Error listing jobs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to list jobs',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * add_to_sync_queue fonksiyonunu oluştur
 */
router.post('/create-sync-function', async (req, res) => {
  try {
    logger.info('🔧 Creating add_to_sync_queue function...');

    const functionSQL = `
      CREATE OR REPLACE FUNCTION add_to_sync_queue()
      RETURNS TRIGGER AS $$
      DECLARE
          record_id UUID;
          old_status TEXT;
          new_status TEXT;
      BEGIN
          -- Record ID'yi belirle
          IF TG_OP = 'DELETE' THEN
              record_id := OLD.id;
          ELSE
              record_id := NEW.id;
          END IF;

          -- Status değişikliklerini kontrol et
          IF TG_OP = 'UPDATE' THEN
              old_status := OLD.status;
              new_status := NEW.status;
          ELSIF TG_OP = 'INSERT' THEN
              new_status := NEW.status;
              old_status := NULL;
          ELSE
              old_status := NULL;
              new_status := NULL;
          END IF;

          -- Job oluşturma koşulları:
          -- 1. INSERT: Sadece status = 'active' için
          -- 2. UPDATE: Sadece status değişimi olanlarda
          -- 3. DELETE: Her zaman
          IF (TG_OP = 'INSERT' AND new_status = 'active') OR
             (TG_OP = 'UPDATE' AND old_status IS DISTINCT FROM new_status) OR
             (TG_OP = 'DELETE') THEN
              
              -- Queue'ya ekle (status = 'pending' olarak)
              INSERT INTO elasticsearch_sync_queue (
                  table_name,
                  operation,
                  record_id,
                  change_data,
                  status
              ) VALUES (
                  TG_TABLE_NAME,
                  TG_OP,
                  record_id,
                  CASE 
                      WHEN TG_OP = 'INSERT' THEN to_jsonb(NEW)
                      WHEN TG_OP = 'UPDATE' THEN jsonb_build_object('old', to_jsonb(OLD), 'new', to_jsonb(NEW))
                      WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD)
                  END,
                  'pending'
              );
          END IF;

          RETURN COALESCE(NEW, OLD);
      END;
      $$ LANGUAGE plpgsql;
    `;

    // SQL'i çalıştır
    const { error } = await supabase.rpc('exec_sql', { sql: functionSQL });

    if (error) {
      throw error;
    }

    logger.info('✅ add_to_sync_queue function created');

    // Trigger'ı güncelle
    const triggerSQL = `
      DROP TRIGGER IF EXISTS listings_queue_sync ON listings;
      CREATE TRIGGER listings_queue_sync
          AFTER INSERT OR UPDATE OR DELETE ON listings
          FOR EACH ROW
          EXECUTE FUNCTION add_to_sync_queue();
    `;

    const { error: triggerError } = await supabase.rpc('exec_sql', { sql: triggerSQL });

    if (triggerError) {
      throw triggerError;
    }

    logger.info('✅ Trigger updated to use add_to_sync_queue');

    res.json({
      success: true,
      message: 'add_to_sync_queue function and trigger created successfully'
    });

  } catch (error) {
    logger.error('❌ Error creating sync function:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create sync function',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
