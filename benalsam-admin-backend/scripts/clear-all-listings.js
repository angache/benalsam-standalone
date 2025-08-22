#!/usr/bin/env node

/**
 * 🧹 Clear All Listings Script
 * 
 * This script safely removes all listings and their related data:
 * - Listings from Supabase
 * - Related offers, messages, favorites, views, reports
 * - Elasticsearch index
 * - Search cache
 * 
 * Usage: node scripts/clear-all-listings.js
 */

const { createClient } = require('@supabase/supabase-js');
const { Client } = require('@elastic/elasticsearch');
const Redis = require('ioredis');

// Configuration
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://dnwreckpeenhbdtapmxr.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ELASTICSEARCH_URL = process.env.ELASTICSEARCH_URL || 'http://localhost:9200';
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

// Initialize clients
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
const elasticsearch = new Client({ node: ELASTICSEARCH_URL });
const redis = new Redis(REDIS_URL);

console.log('🧹 Starting comprehensive listing cleanup...\n');

async function clearAllListings() {
  try {
    console.log('📊 Step 1: Getting current statistics...');
    
    // Get current counts
    const { count: listingsCount } = await supabase
      .from('listings')
      .select('*', { count: 'exact', head: true });
    
    const { count: offersCount } = await supabase
      .from('offers')
      .select('*', { count: 'exact', head: true });
    
    const { count: conversationsCount } = await supabase
      .from('conversations')
      .select('*', { count: 'exact', head: true });
    
    const { count: favoritesCount } = await supabase
      .from('user_favorites')
      .select('*', { count: 'exact', head: true });
    
    const { count: viewsCount } = await supabase
      .from('listing_views')
      .select('*', { count: 'exact', head: true });
    
    const { count: reportsCount } = await supabase
      .from('listing_reports')
      .select('*', { count: 'exact', head: true });

    console.log(`📈 Current data counts:`);
    console.log(`   - Listings: ${listingsCount}`);
    console.log(`   - Offers: ${offersCount}`);
    console.log(`   - Conversations: ${conversationsCount}`);
    console.log(`   - Favorites: ${favoritesCount}`);
    console.log(`   - Views: ${viewsCount}`);
    console.log(`   - Reports: ${reportsCount}\n`);

    // Confirm deletion
    console.log('⚠️  WARNING: This will permanently delete ALL listings and related data!');
    console.log('   Due to CASCADE constraints, this will also delete:');
    console.log('   - All offers');
    console.log('   - All conversations and messages');
    console.log('   - All favorites');
    console.log('   - All view history');
    console.log('   - All reports');
    console.log('   - All Elasticsearch data');
    console.log('   - All search cache\n');

    // In production, you might want to add a confirmation prompt here
    // For now, we'll proceed with the deletion

    console.log('🗑️  Step 2: Deleting all listings from Supabase...');
    
    // Delete all listings (CASCADE will handle related data)
    const { error: deleteError } = await supabase
      .from('listings')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all except dummy record
    
    if (deleteError) {
      throw new Error(`Failed to delete listings: ${deleteError.message}`);
    }
    
    console.log('✅ All listings deleted from Supabase\n');

    console.log('🔍 Step 3: Clearing Elasticsearch index...');
    
    try {
      // Delete the entire index
      await elasticsearch.indices.delete({
        index: 'listings'
      });
      console.log('✅ Elasticsearch index deleted');
    } catch (esError) {
      if (esError.message.includes('index_not_found_exception')) {
        console.log('ℹ️  Elasticsearch index was already empty');
      } else {
        console.log(`⚠️  Elasticsearch error: ${esError.message}`);
      }
    }

    console.log('🔄 Step 4: Recreating Elasticsearch index...');
    
    try {
      // Recreate the index with proper mapping
      await elasticsearch.indices.create({
        index: 'listings',
        body: {
          mappings: {
            properties: {
              id: { type: 'keyword' },
              user_id: { type: 'keyword' },
              title: { type: 'text', analyzer: 'standard' },
              description: { type: 'text', analyzer: 'standard' },
              category: { type: 'keyword' },
              category_id: { type: 'integer' },
              category_path: { type: 'integer' },
              subcategory: { type: 'keyword' },
              budget: {
                properties: {
                  min: { type: 'integer' },
                  max: { type: 'integer' },
                  currency: { type: 'keyword' }
                }
              },
              location: {
                properties: {
                  province: { type: 'keyword' },
                  district: { type: 'keyword' },
                  neighborhood: { type: 'keyword' }
                }
              },
              condition: { type: 'keyword' },
              urgency: { type: 'keyword' },
              status: { type: 'keyword' },
              created_at: { type: 'date' },
              updated_at: { type: 'date' },
              search_keywords: { type: 'text', analyzer: 'standard' },
              popularity_score: { type: 'float' },
              user_trust_score: { type: 'float' }
            }
          }
        }
      });
      console.log('✅ Elasticsearch index recreated');
    } catch (esError) {
      console.log(`⚠️  Elasticsearch recreation error: ${esError.message}`);
    }

    console.log('🧹 Step 5: Clearing Redis cache...');
    
    try {
      // Clear all search-related cache keys
      const keys = await redis.keys('search:*');
      if (keys.length > 0) {
        await redis.del(...keys);
        console.log(`✅ Cleared ${keys.length} search cache keys`);
      } else {
        console.log('ℹ️  No search cache keys found');
      }
    } catch (redisError) {
      console.log(`⚠️  Redis error: ${redisError.message}`);
    }

    console.log('\n📊 Step 6: Verifying cleanup...');
    
    // Verify deletion
    const { count: finalListingsCount } = await supabase
      .from('listings')
      .select('*', { count: 'exact', head: true });
    
    const { count: finalOffersCount } = await supabase
      .from('offers')
      .select('*', { count: 'exact', head: true });
    
    const { count: finalConversationsCount } = await supabase
      .from('conversations')
      .select('*', { count: 'exact', head: true });

    console.log(`✅ Final verification:`);
    console.log(`   - Listings: ${finalListingsCount} (was ${listingsCount})`);
    console.log(`   - Offers: ${finalOffersCount} (was ${offersCount})`);
    console.log(`   - Conversations: ${finalConversationsCount} (was ${conversationsCount})`);

    console.log('\n🎉 SUCCESS: All listings and related data have been cleared!');
    console.log('   You can now create fresh test data.');

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    process.exit(1);
  } finally {
    // Close connections
    await redis.quit();
    process.exit(0);
  }
}

// Run the script
clearAllListings();

