#!/usr/bin/env node

const { Client } = require('@elastic/elasticsearch');

// Elasticsearch client configuration
const client = new Client({
  node: process.env.ELASTICSEARCH_URL || 'http://209.227.228.96:9200',
  auth: {
    username: process.env.ELASTICSEARCH_USERNAME || '',
    password: process.env.ELASTICSEARCH_PASSWORD || ''
  }
});

// AI Suggestions Index Mapping
const aiSuggestionsIndexMapping = {
  settings: {
    number_of_shards: 1,
    number_of_replicas: 0,
    analysis: {
      analyzer: {
        turkish_analyzer: {
          type: 'custom',
          tokenizer: 'standard',
          filter: [
            'lowercase',
            'turkish_stop',
            'turkish_stemmer',
            'asciifolding'
          ]
        }
      },
      filter: {
        turkish_stop: {
          type: 'stop',
          stopwords: '_turkish_'
        },
        turkish_stemmer: {
          type: 'stemmer',
          language: 'turkish'
        }
      }
    }
  },
  mappings: {
    properties: {
      // Primary fields
      id: { type: 'integer' },
      category_id: { type: 'integer' },
      category_name: { 
        type: 'text',
        analyzer: 'turkish_analyzer',
        fields: {
          keyword: { type: 'keyword' }
        }
      },
      category_path: { 
        type: 'text',
        analyzer: 'turkish_analyzer',
        fields: {
          keyword: { type: 'keyword' }
        }
      },
      
      // Suggestion data
      suggestion_type: { type: 'keyword' }, // 'keyword', 'phrase', 'category', 'brand'
      suggestion_data: {
        properties: {
          keywords: { 
            type: 'text',
            analyzer: 'turkish_analyzer',
            fields: {
              keyword: { type: 'keyword' }
            }
          },
          description: { 
            type: 'text',
            analyzer: 'turkish_analyzer' 
          },
          brand: { 
            type: 'text',
            analyzer: 'turkish_analyzer',
            fields: {
              keyword: { type: 'keyword' }
            }
          },
          model: { 
            type: 'text',
            analyzer: 'turkish_analyzer',
            fields: {
              keyword: { type: 'keyword' }
            }
          },
          attributes: { type: 'object', dynamic: true }
        }
      },
      
      // Scoring and approval
      confidence_score: { type: 'float' },
      is_approved: { type: 'boolean' },
      
      // Metadata
      created_at: { 
        type: 'date',
        format: 'strict_date_optional_time||epoch_millis'
      },
      updated_at: { 
        type: 'date',
        format: 'strict_date_optional_time||epoch_millis'
      },
      
      // Search optimization
      search_boost: { type: 'float' },
      usage_count: { type: 'integer' },
      last_used_at: { 
        type: 'date',
        format: 'strict_date_optional_time||epoch_millis'
      }
    }
  }
};

async function createAiSuggestionsIndex() {
  try {
    console.log('🔍 Elasticsearch bağlantısı kontrol ediliyor...');
    
    // Health check
    const health = await client.cluster.health();
    console.log(`✅ Elasticsearch cluster durumu: ${health.status}`);
    
    const indexName = 'ai_suggestions';
    
    // Index var mı kontrol et
    const indexExists = await client.indices.exists({ index: indexName });
    
    if (indexExists) {
      console.log(`⚠️  Index zaten mevcut: ${indexName}`);
      console.log('🗑️  Mevcut index siliniyor...');
      await client.indices.delete({ index: indexName });
      console.log(`✅ Index silindi: ${indexName}`);
    }
    
    // Yeni index oluştur
    console.log(`📝 AI Suggestions index oluşturuluyor: ${indexName}`);
    await client.indices.create({
      index: indexName,
      body: aiSuggestionsIndexMapping
    });
    
    console.log(`✅ AI Suggestions index başarıyla oluşturuldu: ${indexName}`);
    
    // Index mapping'ini kontrol et
    const mapping = await client.indices.getMapping({ index: indexName });
    console.log('📋 Index mapping:');
    console.log(JSON.stringify(mapping[indexName].mappings, null, 2));
    
    // Test document ekle
    console.log('🧪 Test document ekleniyor...');
    await client.index({
      index: indexName,
      id: 1,
      body: {
        id: 1,
        category_id: 712, // Spor & Outdoor
        category_name: 'Spor & Outdoor',
        category_path: 'Spor & Outdoor',
        suggestion_type: 'keyword',
        suggestion_data: {
          keywords: ['samsung', 'galaxy', 'android', 'telefon'],
          description: 'Samsung Galaxy telefonları için AI önerisi',
          brand: 'Samsung',
          model: 'Galaxy'
        },
        confidence_score: 0.9,
        is_approved: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        search_boost: 1.0,
        usage_count: 0
      }
    });
    
    // Refresh index
    await client.indices.refresh({ index: indexName });
    
    // Test search
    console.log('🔍 Test search yapılıyor...');
    const searchResult = await client.search({
      index: indexName,
      body: {
        query: {
          multi_match: {
            query: 'samsung',
            fields: [
              'suggestion_data.keywords^2',
              'suggestion_data.brand^1.5',
              'category_name^1'
            ],
            fuzziness: 'AUTO'
          }
        },
        sort: [
          { confidence_score: { order: 'desc' } }
        ]
      }
    });
    
    console.log(`✅ Test search başarılı! ${searchResult.hits.total.value} sonuç bulundu`);
    console.log('📄 İlk sonuç:');
    console.log(JSON.stringify(searchResult.hits.hits[0]._source, null, 2));
    
    console.log('\n🎉 AI Suggestions index başarıyla oluşturuldu ve test edildi!');
    
  } catch (error) {
    console.error('❌ Hata:', error.message);
    if (error.meta) {
      console.error('🔍 Detaylar:', JSON.stringify(error.meta, null, 2));
    }
    process.exit(1);
  } finally {
    await client.close();
  }
}

// Script'i çalıştır
if (require.main === module) {
  createAiSuggestionsIndex();
}

module.exports = { createAiSuggestionsIndex, aiSuggestionsIndexMapping };
