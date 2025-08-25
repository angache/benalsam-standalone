#!/usr/bin/env node

/**
 * 🚀 BENALSAM DATA SYNC SCRIPT
 * Supabase'den Elasticsearch'e tüm aktif ilanları senkronize eder
 */

const { createClient } = require('@supabase/supabase-js');
const { Client } = require('@elastic/elasticsearch');
require('dotenv').config();

// Renkli console output
const colors = {
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    red: '\x1b[31m',
    blue: '\x1b[34m',
    reset: '\x1b[0m'
};

const log = (message) => console.log(`${colors.green}[${new Date().toISOString()}]${colors.reset} ${message}`);
const warn = (message) => console.log(`${colors.yellow}[${new Date().toISOString()}] WARNING:${colors.reset} ${message}`);
const error = (message) => console.log(`${colors.red}[${new Date().toISOString()}] ERROR:${colors.reset} ${message}`);

// Environment variables kontrolü
const requiredEnvVars = [
    'SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'ELASTICSEARCH_URL'
];

for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
        error(`${envVar} environment variable tanımlanmamış!`);
        process.exit(1);
    }
}

// Clients oluştur
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

const elasticsearch = new Client({
    node: process.env.ELASTICSEARCH_URL
});

// Elasticsearch index adı
const INDEX_NAME = 'listings';

// Batch size
const BATCH_SIZE = 100;

/**
 * Supabase'den aktif ilanları çek
 */
async function fetchActiveListings() {
    log('📥 Supabase\'den aktif ilanlar çekiliyor...');
    
    try {
        const { data: listings, error } = await supabase
            .from('listings')
            .select(`
                *,
                users!inner(email, full_name)
            `)
            .eq('status', 'active')
            .order('created_at', { ascending: false });
        
        if (error) {
            throw error;
        }
        
        log(`✅ ${listings.length} aktif ilan bulundu`);
        return listings;
    } catch (err) {
        error(`Supabase'den veri çekme hatası: ${err.message}`);
        throw err;
    }
}

/**
 * İlan verisini ES formatına dönüştür
 */
function transformListingForES(listing) {
    // Kategori path'ini oluştur
    let categoryPath = '';
    if (listing.category_path && listing.category_path.length > 0) {
        // Kategori path'ini string'e çevir
        categoryPath = listing.category_path.join(' > ');
    }
    
    // Geolocation oluştur
    let geolocation = null;
    if (listing.latitude && listing.longitude) {
        geolocation = {
            lat: parseFloat(listing.latitude),
            lon: parseFloat(listing.longitude)
        };
    }
    
    // Full-text search için keywords oluştur
    const keywords = [];
    if (listing.title) keywords.push(listing.title.toLowerCase());
    if (listing.description) keywords.push(listing.description.toLowerCase());
    if (listing.location) keywords.push(listing.location.toLowerCase());
    if (listing.neighborhood) keywords.push(listing.neighborhood.toLowerCase());
    
    // Attributes'ları parse et
    let attributes = {};
    if (listing.attributes && typeof listing.attributes === 'object') {
        attributes = listing.attributes;
    }
    
    // Images array'ini oluştur
    const images = [];
    if (listing.main_image_url) images.push(listing.main_image_url);
    if (listing.additional_image_urls && Array.isArray(listing.additional_image_urls)) {
        images.push(...listing.additional_image_urls);
    }
    
    // Popularity score hesapla
    const popularityScore = calculatePopularityScore(listing);
    
    return {
        id: listing.id,
        user_id: listing.user_id,
        title: listing.title,
        description: listing.description,
        category: categoryPath,
        category_id: listing.category_id,
        category_path: listing.category_path || [],
        price: listing.price ? parseFloat(listing.price) : null,
        budget: listing.budget ? parseFloat(listing.budget) : null,
        status: listing.status,
        location: listing.location,
        created_at: listing.created_at,
        updated_at: listing.updated_at,
        is_premium: listing.is_premium || false,
        is_featured: listing.is_featured || false,
        is_urgent_premium: listing.is_urgent_premium || false,
        popularity_score: popularityScore,
        views_count: listing.views_count || 0,
        favorites_count: listing.favorites_count || 0,
        offers_count: listing.offers_count || 0,
        condition: listing.condition || [],
        features: listing.features || [],
        attributes: attributes,
        images: images,
        main_image_url: listing.main_image_url,
        additional_image_urls: listing.additional_image_urls || [],
        contact_preference: listing.contact_preference,
        urgency: listing.urgency,
        neighborhood: listing.neighborhood,
        latitude: listing.latitude ? parseFloat(listing.latitude) : null,
        longitude: listing.longitude ? parseFloat(listing.longitude) : null,
        geolocation: geolocation,
        tags: listing.tags || [],
        fts: keywords.join(' ')
    };
}

/**
 * Popularity score hesapla
 */
function calculatePopularityScore(listing) {
    let score = 0;
    
    // Temel skor
    score += 10;
    
    // Premium özellikler
    if (listing.is_premium) score += 20;
    if (listing.is_featured) score += 15;
    if (listing.is_urgent_premium) score += 10;
    
    // Engagement metrikleri
    if (listing.views_count) score += Math.min(listing.views_count * 0.1, 20);
    if (listing.favorites_count) score += listing.favorites_count * 2;
    if (listing.offers_count) score += listing.offers_count * 5;
    
    // Yaş bazlı skor (yeni ilanlar daha yüksek skor)
    const createdAt = new Date(listing.created_at);
    const now = new Date();
    const daysSinceCreation = (now - createdAt) / (1000 * 60 * 60 * 24);
    score += Math.max(0, 10 - daysSinceCreation * 0.5);
    
    return Math.min(score, 100);
}

/**
 * Elasticsearch'e batch olarak veri yükle
 */
async function bulkIndexListings(listings) {
    log(`📤 ${listings.length} ilan ES'e yükleniyor...`);
    
    const operations = [];
    
    for (const listing of listings) {
        const transformedListing = transformListingForES(listing);
        
        // Index operation
        operations.push({
            index: {
                _index: INDEX_NAME,
                _id: listing.id
            }
        });
        
        // Document
        operations.push(transformedListing);
    }
    
    try {
        const { body } = await elasticsearch.bulk({
            body: operations,
            refresh: true
        });
        
        // Hataları kontrol et
        if (body.errors) {
            const errors = body.items.filter(item => item.index && item.index.error);
            if (errors.length > 0) {
                warn(`${errors.length} ilan yüklenirken hata oluştu`);
                errors.forEach(err => {
                    warn(`ID ${err.index._id}: ${err.index.error.reason}`);
                });
            }
        }
        
        const successCount = body.items.filter(item => item.index && !item.index.error).length;
        log(`✅ ${successCount}/${listings.length} ilan başarıyla yüklendi`);
        
        return successCount;
    } catch (err) {
        error(`Bulk index hatası: ${err.message}`);
        throw err;
    }
}

/**
 * Ana senkronizasyon fonksiyonu
 */
async function syncListingsToES() {
    try {
        log('🚀 Benalsam Data Sync başlıyor...');
        
        // ES bağlantı kontrolü
        try {
            await elasticsearch.ping();
            log('✅ Elasticsearch bağlantısı başarılı');
        } catch (err) {
            error('Elasticsearch bağlantısı başarısız');
            throw err;
        }
        
        // Supabase'den verileri çek
        const listings = await fetchActiveListings();
        
        if (listings.length === 0) {
            log('ℹ️ Yüklenecek ilan yok');
            return;
        }
        
        // Batch'ler halinde yükle
        let totalIndexed = 0;
        for (let i = 0; i < listings.length; i += BATCH_SIZE) {
            const batch = listings.slice(i, i + BATCH_SIZE);
            const indexed = await bulkIndexListings(batch);
            totalIndexed += indexed;
            
            log(`📊 İlerleme: ${Math.min(i + BATCH_SIZE, listings.length)}/${listings.length} (${totalIndexed} başarılı)`);
        }
        
        // Final stats
        log(`🎉 Senkronizasyon tamamlandı!`);
        log(`📊 Toplam: ${listings.length} ilan, Başarılı: ${totalIndexed}`);
        
        // Index stats
        const { body: stats } = await elasticsearch.indices.stats({
            index: INDEX_NAME
        });
        
        const docCount = stats.indices[INDEX_NAME].total.docs.count;
        log(`📈 Index'te toplam ${docCount} doküman var`);
        
    } catch (err) {
        error(`Senkronizasyon hatası: ${err.message}`);
        process.exit(1);
    }
}

// Script'i çalıştır
if (require.main === module) {
    syncListingsToES()
        .then(() => {
            log('✅ Script başarıyla tamamlandı');
            process.exit(0);
        })
        .catch((err) => {
            error(`Script hatası: ${err.message}`);
            process.exit(1);
        });
}

module.exports = { syncListingsToES, transformListingForES };
