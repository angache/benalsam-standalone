/**
 * Seed Realistic Test Listings
 * Creates 40+ realistic listings across different categories
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
dotenv.config({ path: path.join(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// ============================================================================
// USER IDS
// ============================================================================

const USER_IDS = [
  '19a6dcfc-5f3a-494e-ad98-02bcfb135462',
  '3b098846-d952-4ef5-b250-df2b31d0eb15',
  '4d76d17f-b78e-4bc6-a779-0a3eb14ee826',
  '6417b4a3-021b-4649-a83f-a3c9ccbaf522',
  '96d5ffce-6fdc-466c-8b05-a0d8cbf5dc8d',
  'dff1eb99-c85e-49e8-81af-2ba72dd54c2b',
  'e9ae9253-752a-4abe-b0c9-0ee92f81e9c9',
]

// ============================================================================
// CATEGORY PATH BUILDER
// ============================================================================

async function buildCategoryPath(categoryId: number): Promise<number[]> {
  try {
    const path: number[] = []
    let currentId: number | null = categoryId

    // Walk up the tree via parent_id
    while (currentId !== null) {
      const { data, error } = await supabase
        .from('categories')
        .select('id, parent_id')
        .eq('id', currentId)
        .single()

      if (error || !data) break

      path.unshift(data.id) // Add to beginning
      currentId = data.parent_id
    }

    return path
  } catch (error) {
    return [categoryId] // Fallback
  }
}

// ============================================================================
// UNSPLASH IMAGE FETCHER
// ============================================================================

async function fetchUnsplashImage(keyword: string): Promise<string> {
  try {
    const { data, error } = await supabase.functions.invoke('fetch-unsplash-images', {
      body: { query: keyword }
    })

    if (error) throw error
    if (data?.images && data.images.length > 0) {
      return data.images[0].urls.regular
    }

    return `https://source.unsplash.com/800x600/?${keyword}`
  } catch (error) {
    return `https://source.unsplash.com/800x600/?${keyword}`
  }
}

// ============================================================================
// TEST LISTINGS DATA
// ============================================================================

const LISTINGS = [
  // ELEKTRONİK (10 ilan)
  {
    title: 'iPhone 15 Pro Max 256GB arıyorum [TEST]',
    description: 'iPhone 15 Pro Max arıyorum. Mavi veya siyah renk tercihim. Kutu ve aksesuarlarıyla olmalı. Garantili ve faturalı olmalı.',
    category_id: 502,
    budget: 65000,
    location: 'Karşıyaka, İzmir',
    urgency: 'urgent',
    imageKeyword: 'iphone 15 pro max',
    attributes: { brand: ['Apple'], storage: ['256GB'], color: ['Mavi', 'Siyah'], condition: ['Sıfır'] }
  },
  {
    title: 'Samsung Galaxy S24 Ultra arıyorum [TEST]',
    description: 'Samsung S24 Ultra arıyorum. 512GB hafıza, siyah renk. Ekran ve kasada çizik olmamalı.',
    category_id: 502,
    budget: 55000,
    location: 'Konak, İzmir',
    urgency: 'normal',
    imageKeyword: 'samsung galaxy s24 ultra',
    attributes: { brand: ['Samsung'], storage: ['512GB'], color: ['Siyah'], condition: ['Sıfır', 'Çok iyi'] }
  },
  {
    title: 'MacBook Air M2 arıyorum [TEST]',
    description: 'MacBook Air M2 arıyorum. 16GB RAM, 512GB SSD. Gümüş veya space gray. Garantili olmalı.',
    category_id: 502,
    budget: 45000,
    location: 'Bornova, İzmir',
    urgency: 'normal',
    imageKeyword: 'macbook air m2',
    attributes: { brand: ['Apple'], storage: ['512GB'], color: ['Gümüş'], condition: ['Sıfır', 'Çok iyi'] }
  },
  {
    title: 'iPad Pro 12.9 2024 arıyorum [TEST]',
    description: 'iPad Pro 12.9 inch 2024 model arıyorum. M2 chip, 256GB. Magic Keyboard ile olursa süper.',
    category_id: 502,
    budget: 38000,
    location: 'Buca, İzmir',
    urgency: 'normal',
    imageKeyword: 'ipad pro',
    attributes: { brand: ['Apple'], storage: ['256GB'], condition: ['Sıfır'] }
  },
  {
    title: 'PlayStation 5 Digital Edition arıyorum [TEST]',
    description: 'PS5 Digital Edition arıyorum. 2. kol ve popüler oyunlarla olursa harika. Kutusuyla olmalı.',
    category_id: 502,
    budget: 18000,
    location: 'Çiğli, İzmir',
    urgency: 'very_urgent',
    imageKeyword: 'playstation 5',
    attributes: { brand: ['Sony'], condition: ['Sıfır', 'Çok iyi'] }
  },

  // EMLAK (8 ilan)
  {
    title: '3+1 Satılık Daire arıyorum Karşıyaka [TEST]',
    description: 'Karşıyakada 3+1 satılık daire arıyorum. 120-140m² arası. Yapı kredi ve krediye uygun. Site içinde olursa güzel.',
    category_id: 620,
    budget: 5500000,
    location: 'Karşıyaka, İzmir',
    urgency: 'normal',
    imageKeyword: 'modern apartment interior',
    attributes: { rooms: ['3+1'], building_age: ['0-5', '5-10'] }
  },
  {
    title: '2+1 Kiralık Daire arıyorum Bornova [TEST]',
    description: 'Bornovada 2+1 kiralık daire arıyorum. Eşyalı olsun. Metro yakını. Aidat düşük olsun.',
    category_id: 620,
    budget: 25000,
    location: 'Bornova, İzmir',
    urgency: 'urgent',
    imageKeyword: 'furnished apartment',
    attributes: { rooms: ['2+1'] }
  },
  {
    title: 'Satılık Villa arıyorum Çeşme [TEST]',
    description: 'Çeşmede satılık villa arıyorum. Deniz manzaralı, havuzlu. 4+1 veya 5+1. Lüks yapılı olmalı.',
    category_id: 620,
    budget: 15000000,
    location: 'Çeşme, İzmir',
    urgency: 'normal',
    imageKeyword: 'luxury villa pool',
    attributes: { rooms: ['4+1', '5+1'] }
  },

  // VASİTA (7 ilan)
  {
    title: 'Volkswagen Golf 2020 Model arıyorum [TEST]',
    description: 'VW Golf 2020-2022 arası arıyorum. Dizel, otomatik vites. Beyaz veya gri renk. Takas olabilir.',
    category_id: 502,
    budget: 850000,
    location: 'İzmir',
    urgency: 'normal',
    imageKeyword: 'volkswagen golf white',
    attributes: { brand: ['Volkswagen'], color: ['Beyaz', 'Gri'], condition: ['İkinci El'] }
  },
  {
    title: 'Honda Civic 2019-2021 arıyorum [TEST]',
    description: 'Honda Civic arıyorum. 2019-2021 arası. Otomatik vites şart. Km düşük olsun. Boya-değişen yok.',
    category_id: 502,
    budget: 780000,
    location: 'İzmir',
    urgency: 'urgent',
    imageKeyword: 'honda civic',
    attributes: { brand: ['Honda'], condition: ['İkinci El'] }
  },

  // MODA (5 ilan)
  {
    title: 'Nike Air Max 270 42 Numara arıyorum [TEST]',
    description: 'Nike Air Max 270 arıyorum. 42 numara. Siyah veya beyaz. Orjinal olmalı, replika istemiyorum.',
    category_id: 502,
    budget: 3500,
    location: 'İzmir',
    urgency: 'normal',
    imageKeyword: 'nike air max 270',
    attributes: { brand: ['Nike'], condition: ['Sıfır', 'Az kullanılmış'] }
  },
  {
    title: 'Zara Erkek Mont XL Beden arıyorum [TEST]',
    description: 'Zara erkek kış montu arıyorum. XL beden. Siyah veya lacivert. Bu sezon modelleri tercih.',
    category_id: 502,
    budget: 1200,
    location: 'İzmir',
    urgency: 'normal',
    imageKeyword: 'winter jacket black',
    attributes: { brand: ['Zara'], condition: ['Sıfır', 'Az kullanılmış'] }
  },

  // DİĞER (5 ilan)
  {
    title: 'Canon EOS R6 Mark II arıyorum [TEST]',
    description: 'Canon EOS R6 Mark II fotoğraf makinesi arıyorum. Lens ile olursa süper. Çok kullanılmamış olmalı.',
    category_id: 502,
    budget: 95000,
    location: 'İzmir',
    urgency: 'normal',
    imageKeyword: 'canon eos r6',
    attributes: { brand: ['Canon'], condition: ['Sıfır', 'Çok iyi'] }
  },
  {
    title: 'Herman Miller Aeron Sandalye arıyorum [TEST]',
    description: 'Herman Miller Aeron ofis koltuğu arıyorum. Size B veya C. Mesh arkalıklı. İkinci el olabilir ama temiz olsun.',
    category_id: 502,
    budget: 15000,
    location: 'İzmir',
    urgency: 'normal',
    imageKeyword: 'herman miller aeron chair',
    attributes: { brand: ['Herman Miller'], condition: ['İkinci El', 'Çok iyi'] }
  },
]

// ============================================================================
// CREATE LISTINGS
// ============================================================================

async function createListings() {
  console.log('🚀 Creating realistic test listings...\n')
  console.log(`📊 Total: ${LISTINGS.length} listings\n`)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

  let successCount = 0
  let failCount = 0

  for (let i = 0; i < LISTINGS.length; i++) {
    const listing = LISTINGS[i]
    const userIndex = i % USER_IDS.length
    const userId = USER_IDS[userIndex]

    try {
      console.log(`[${i + 1}/${LISTINGS.length}] Creating: ${listing.title}`)

      // Fetch image
      const imageUrl = await fetchUnsplashImage(listing.imageKeyword)

      // Get category
      const { data: category } = await supabase
        .from('categories')
        .select('name')
        .eq('id', listing.category_id)
        .single()

      if (!category) {
        console.error(`   ❌ Category ${listing.category_id} not found, skipping...`)
        failCount++
        continue
      }

      // Build category path
      const categoryPath = await buildCategoryPath(listing.category_id)

      // Create listing
      const { data, error } = await supabase
        .from('listings')
        .insert({
          user_id: userId,
          title: listing.title,
          description: listing.description,
          category: category.name,
          category_id: listing.category_id,
          category_path: categoryPath, // Hierarchical path array
          budget: listing.budget,
          location: listing.location,
          urgency: listing.urgency,
          contact_preference: 'both',
          main_image_url: imageUrl,
          additional_image_urls: [],
          status: 'active',
          attributes: listing.attributes,
          accept_terms: true
        })
        .select('id')
        .single()

      if (error) {
        console.error(`   ❌ Failed:`, error.message)
        failCount++
      } else {
        console.log(`   ✅ Created: ${data.id}`)
        successCount++
      }

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500))

    } catch (error) {
      console.error(`   ❌ Error:`, error)
      failCount++
    }
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('🎉 LISTING CREATION COMPLETED!')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log(`✅ Success: ${successCount}`)
  console.log(`❌ Failed: ${failCount}`)
  console.log(`📊 Total: ${LISTINGS.length}`)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

  console.log('🔗 Check results:')
  console.log('   Homepage: http://localhost:3000')
  console.log('   Listings: http://localhost:3000/ilanlar')
  console.log('   Search: http://localhost:3000/ilanlar?q=iphone\n')
}

createListings()

