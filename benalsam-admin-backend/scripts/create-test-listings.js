#!/usr/bin/env node

/**
 * 🧪 Create Test Listings Script
 * 
 * This script creates test listings with different categories to test:
 * - Category filtering
 * - Subcategory filtering
 * - Elasticsearch indexing
 * - Search functionality
 * 
 * Usage: node scripts/create-test-listings.js
 */

const { createClient } = require('@supabase/supabase-js');

// Configuration
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://dnwreckpeenhbdtapmxr.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Initialize client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Test user ID (you may need to create a test user first)
const TEST_USER_ID = '6417b4a3-021b-4649-a83f-a3c9ccbaf522'; // Existing user

// Test listings data
const testListings = [
  // Moda > Giyim kategorisi
  {
    title: 'Kadın Kot Pantolon',
    description: 'Yüksek bel kadın kot pantolon, mavi renk, 38 beden',
    category: 'Moda > Giyim',
    category_id: 663,
    budget: { min: 150, max: 200, currency: 'TRY' },
    location: { province: 'İzmir / Karşıyaka', district: '', neighborhood: '' },
    condition: ['İkinci El'],
    urgency: 'Normal',
    user_id: TEST_USER_ID
  },
  {
    title: 'Erkek Gömlek',
    description: 'Beyaz erkek gömlek, pamuklu kumaş, L beden',
    category: 'Moda > Giyim',
    category_id: 663,
    budget: { min: 100, max: 150, currency: 'TRY' },
    location: { province: 'İstanbul / Kadıköy', district: '', neighborhood: '' },
    condition: ['Yeni'],
    urgency: 'Acil Değil',
    user_id: TEST_USER_ID
  },
  
  // Moda > Ayakkabı kategorisi
  {
    title: 'Spor Ayakkabı',
    description: 'Nike spor ayakkabı, siyah, 42 numara',
    category: 'Moda > Ayakkabı',
    category_id: 664,
    budget: { min: 300, max: 400, currency: 'TRY' },
    location: { province: 'Ankara / Çankaya', district: '', neighborhood: '' },
    condition: ['İkinci El'],
    urgency: 'Acil',
    user_id: TEST_USER_ID
  },
  {
    title: 'Topuklu Ayakkabı',
    description: 'Siyah topuklu ayakkabı, 8cm topuk, 37 numara',
    category: 'Moda > Ayakkabı',
    category_id: 664,
    budget: { min: 200, max: 250, currency: 'TRY' },
    location: { province: 'İzmir / Bornova', district: '', neighborhood: '' },
    condition: ['İkinci El'],
    urgency: 'Normal',
    user_id: TEST_USER_ID
  },
  
  // Elektronik > Telefon kategorisi
  {
    title: 'iPhone 12',
    description: 'iPhone 12, 128GB, siyah, orijinal kutusu ile',
    category: 'Elektronik > Telefon',
    category_id: 665,
    budget: { min: 8000, max: 10000, currency: 'TRY' },
    location: { province: 'İstanbul / Beşiktaş', district: '', neighborhood: '' },
    condition: ['İkinci El'],
    urgency: 'Acil',
    user_id: TEST_USER_ID
  },
  {
    title: 'Samsung Galaxy S21',
    description: 'Samsung Galaxy S21, 256GB, mavi renk',
    category: 'Elektronik > Telefon',
    category_id: 665,
    budget: { min: 7000, max: 8500, currency: 'TRY' },
    location: { province: 'İzmir / Konak', district: '', neighborhood: '' },
    condition: ['İkinci El'],
    urgency: 'Normal',
    user_id: TEST_USER_ID
  },
  
  // Elektronik > Bilgisayar kategorisi
  {
    title: 'MacBook Pro',
    description: 'MacBook Pro 13 inch, M1 işlemci, 8GB RAM, 256GB SSD',
    category: 'Elektronik > Bilgisayar',
    category_id: 666,
    budget: { min: 25000, max: 30000, currency: 'TRY' },
    location: { province: 'İstanbul / Şişli', district: '', neighborhood: '' },
    condition: ['İkinci El'],
    urgency: 'Acil Değil',
    user_id: TEST_USER_ID
  },
  {
    title: 'Gaming Laptop',
    description: 'Gaming laptop, RTX 3060, 16GB RAM, 512GB SSD',
    category: 'Elektronik > Bilgisayar',
    category_id: 666,
    budget: { min: 20000, max: 25000, currency: 'TRY' },
    location: { province: 'Ankara / Kızılay', district: '', neighborhood: '' },
    condition: ['İkinci El'],
    urgency: 'Acil',
    user_id: TEST_USER_ID
  },
  
  // Ev & Yaşam > Mobilya kategorisi
  {
    title: 'Koltuk Takımı',
    description: '3+3+1 koltuk takımı, bej renk, yeni gibi',
    category: 'Ev & Yaşam > Mobilya',
    category_id: 667,
    budget: { min: 3000, max: 4000, currency: 'TRY' },
    location: { province: 'İzmir / Karşıyaka', district: '', neighborhood: '' },
    condition: ['İkinci El'],
    urgency: 'Normal',
    user_id: TEST_USER_ID
  },
  {
    title: 'Yatak Odası Takımı',
    description: 'Yatak odası takımı, ceviz ağacı, 5 parça',
    category: 'Ev & Yaşam > Mobilya',
    category_id: 667,
    budget: { min: 5000, max: 6000, currency: 'TRY' },
    location: { province: 'İstanbul / Üsküdar', district: '', neighborhood: '' },
    condition: ['İkinci El'],
    urgency: 'Acil Değil',
    user_id: TEST_USER_ID
  }
];

async function createTestListings() {
  try {
    console.log('🧪 Starting test listings creation...\n');
    
    console.log(`📊 Creating ${testListings.length} test listings...`);
    
    const createdListings = [];
    
    for (let i = 0; i < testListings.length; i++) {
      const listing = testListings[i];
      
      console.log(`📝 Creating listing ${i + 1}/${testListings.length}: ${listing.title}`);
      
      const { data, error } = await supabase
        .from('listings')
        .insert([{
          ...listing,
          status: 'active',
          main_image_url: null,
          additional_image_urls: [],
          attributes: {},
          search_keywords: [
            listing.title.toLowerCase(),
            listing.description.toLowerCase(),
            listing.category.toLowerCase()
          ],
          popularity_score: Math.random() * 10,
          user_trust_score: 0.5
        }])
        .select();
      
      if (error) {
        console.error(`❌ Error creating listing "${listing.title}":`, error.message);
        continue;
      }
      
      createdListings.push(data[0]);
      console.log(`✅ Created: ${listing.title} (ID: ${data[0].id})`);
    }
    
    console.log(`\n🎉 Successfully created ${createdListings.length} test listings!`);
    
    // Show summary by category
    const categorySummary = {};
    createdListings.forEach(listing => {
      const category = listing.category;
      categorySummary[category] = (categorySummary[category] || 0) + 1;
    });
    
    console.log('\n📈 Category Summary:');
    Object.entries(categorySummary).forEach(([category, count]) => {
      console.log(`   - ${category}: ${count} listings`);
    });
    
    console.log('\n🔍 Next steps:');
    console.log('   1. Wait for Elasticsearch reindex (automatic)');
    console.log('   2. Test category filtering on frontend');
    console.log('   3. Test search functionality');
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    process.exit(1);
  }
}

// Run the script
createTestListings();
