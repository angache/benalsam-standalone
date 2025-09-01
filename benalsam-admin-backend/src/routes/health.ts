import express, { IRouter } from 'express';
import { redis } from '../config/redis';
import { elasticsearchClient } from '../services/elasticsearchService';
import { supabase } from '../config/supabase';
import Redis from 'ioredis';
import logger from '../config/logger';
import { databaseTriggerBridge } from '../services/databaseTriggerBridge';

const router: IRouter = express.Router();

// Ana health check endpoint
router.get('/', async (req, res) => {
  try {
    const healthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0',
      services: {
        database: 'unknown',
        redis: 'unknown',
        elasticsearch: 'unknown'
      }
    };

    // Database health check
    try {
      const { data, error } = await supabase
        .from('admin_users')
        .select('count')
        .limit(1);
      
      if (error) throw error;
      healthStatus.services.database = 'healthy';
    } catch (error) {
      healthStatus.services.database = 'unhealthy';
      healthStatus.status = 'degraded';
    }

    // Redis health check
    try {
      await redis.ping();
      healthStatus.services.redis = 'healthy';
    } catch (error) {
      healthStatus.services.redis = 'unhealthy';
      healthStatus.status = 'degraded';
    }

    // Elasticsearch health check
    try {
      const health = await elasticsearchClient.cluster.health();
      if (health.status === 'red') {
        healthStatus.services.elasticsearch = 'unhealthy';
        healthStatus.status = 'degraded';
      } else {
        healthStatus.services.elasticsearch = 'healthy';
      }
    } catch (error) {
      healthStatus.services.elasticsearch = 'unhealthy';
      healthStatus.status = 'degraded';
    }

    // Eğer herhangi bir servis unhealthy ise genel durum degraded
    const unhealthyServices = Object.values(healthStatus.services).filter(
      status => status === 'unhealthy'
    ).length;

    if (unhealthyServices > 0) {
      healthStatus.status = 'degraded';
    }

    const statusCode = healthStatus.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json(healthStatus);

  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: (error as Error).message,
      services: {
        database: 'unknown',
        redis: 'unknown',
        elasticsearch: 'unknown'
      }
    });
  }
});

// Detaylı health check endpoint
router.get('/detailed', async (req, res) => {
  try {
    const detailedHealth = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0',
      services: {
        database: {
          status: 'unknown',
          responseTime: 0,
          details: {}
        },
        redis: {
          status: 'unknown',
          responseTime: 0,
          details: {}
        },
        elasticsearch: {
          status: 'unknown',
          responseTime: 0,
          details: {}
        }
      }
    };

    // Database detailed check
    const dbStart = Date.now();
    try {
      const { data, error } = await supabase
        .from('admin_users')
        .select('count')
        .limit(1);
      
      const dbResponseTime = Date.now() - dbStart;
      
      if (error) throw error;
      
      detailedHealth.services.database = {
        status: 'healthy',
        responseTime: dbResponseTime,
        details: {
          connection: 'active',
          queryTime: `${dbResponseTime}ms`
        }
      };
    } catch (error) {
      detailedHealth.services.database = {
        status: 'unhealthy',
        responseTime: Date.now() - dbStart,
        details: {
          error: (error as Error).message,
          connection: 'failed'
        }
      };
      detailedHealth.status = 'degraded';
    }

    // Redis detailed check
    const redisStart = Date.now();
    try {
      const redisPing = await redis.ping();
      const redisResponseTime = Date.now() - redisStart;
      
      detailedHealth.services.redis = {
        status: 'healthy',
        responseTime: redisResponseTime,
        details: {
          connection: 'active',
          pingResponse: redisPing,
          responseTime: `${redisResponseTime}ms`
        }
      };
    } catch (error) {
      detailedHealth.services.redis = {
        status: 'unhealthy',
        responseTime: Date.now() - redisStart,
        details: {
          error: (error as Error).message,
          connection: 'failed'
        }
      };
      detailedHealth.status = 'degraded';
    }

    // Elasticsearch detailed check
    const esStart = Date.now();
    try {
      const health = await elasticsearchClient.cluster.health();
      const esResponseTime = Date.now() - esStart;
      
      detailedHealth.services.elasticsearch = {
        status: health.status === 'red' ? 'unhealthy' : 'healthy',
        responseTime: esResponseTime,
        details: {
          clusterStatus: health.status,
          numberOfNodes: health.number_of_nodes,
          activeShards: health.active_shards,
          responseTime: `${esResponseTime}ms`
        }
      };
      
      if (health.status === 'red') {
        detailedHealth.status = 'degraded';
      }
    } catch (error) {
      detailedHealth.services.elasticsearch = {
        status: 'unhealthy',
        responseTime: Date.now() - esStart,
        details: {
          error: (error as Error).message,
          connection: 'failed'
        }
      };
      detailedHealth.status = 'degraded';
    }

    const statusCode = detailedHealth.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json(detailedHealth);

  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: (error as Error).message,
      services: {
        database: { status: 'unknown', responseTime: 0, details: {} },
        redis: { status: 'unknown', responseTime: 0, details: {} },
        elasticsearch: { status: 'unknown', responseTime: 0, details: {} }
      }
    });
  }
});

// Sadece database health check
router.get('/database', async (req, res) => {
  try {
    const start = Date.now();
    const { data, error } = await supabase
      .from('admin_users')
      .select('count')
      .limit(1);
    
    const responseTime = Date.now() - start;
    
    if (error) throw error;
    
    res.json({
      status: 'healthy',
      service: 'database',
      responseTime: `${responseTime}ms`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      service: 'database',
      error: (error as Error).message,
      timestamp: new Date().toISOString()
    });
  }
});

// Sadece Redis health check
router.get('/redis', async (req, res) => {
  try {
    const start = Date.now();
    const pingResponse = await redis.ping();
    const responseTime = Date.now() - start;
    
    res.json({
      status: 'healthy',
      service: 'redis',
      pingResponse,
      responseTime: `${responseTime}ms`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      service: 'redis',
      error: (error as Error).message,
      timestamp: new Date().toISOString()
    });
  }
});

// Detaylı Redis test endpoint
router.get('/redis/test', async (req, res) => {
  try {
    logger.info('🔍 Starting detailed Redis test...');
    
    const testResults = {
      status: 'healthy',
      service: 'redis',
      timestamp: new Date().toISOString(),
      tests: {
        ping: { status: 'unknown', responseTime: 0, details: '' },
        set: { status: 'unknown', responseTime: 0, details: '' },
        get: { status: 'unknown', responseTime: 0, details: '' },
        delete: { status: 'unknown', responseTime: 0, details: '' },
        info: { status: 'unknown', responseTime: 0, details: {} }
      }
    };

    // Test 1: Ping
    try {
      const start = Date.now();
      const pingResponse = await redis.ping();
      const responseTime = Date.now() - start;
      
      testResults.tests.ping = {
        status: 'success',
        responseTime,
        details: `Response: ${pingResponse}`
      };
      logger.info('✅ Redis ping test passed');
    } catch (error) {
      testResults.tests.ping = {
        status: 'failed',
        responseTime: 0,
        details: (error as Error).message
      };
      logger.error('❌ Redis ping test failed:', error);
    }

    // Test 2: Set
    try {
      const start = Date.now();
      await redis.set('test_key', 'test_value', 'EX', 60);
      const responseTime = Date.now() - start;
      
      testResults.tests.set = {
        status: 'success',
        responseTime,
        details: 'Key set successfully with 60s expiration'
      };
      logger.info('✅ Redis set test passed');
    } catch (error) {
      testResults.tests.set = {
        status: 'failed',
        responseTime: 0,
        details: (error as Error).message
      };
      logger.error('❌ Redis set test failed:', error);
    }

    // Test 3: Get
    try {
      const start = Date.now();
      const value = await redis.get('test_key');
      const responseTime = Date.now() - start;
      
      testResults.tests.get = {
        status: 'success',
        responseTime,
        details: `Retrieved value: ${value}`
      };
      logger.info('✅ Redis get test passed');
    } catch (error) {
      testResults.tests.get = {
        status: 'failed',
        responseTime: 0,
        details: (error as Error).message
      };
      logger.error('❌ Redis get test failed:', error);
    }

    // Test 4: Delete
    try {
      const start = Date.now();
      const deleted = await redis.del('test_key');
      const responseTime = Date.now() - start;
      
      testResults.tests.delete = {
        status: 'success',
        responseTime,
        details: `Deleted ${deleted} key(s)`
      };
      logger.info('✅ Redis delete test passed');
    } catch (error) {
      testResults.tests.delete = {
        status: 'failed',
        responseTime: 0,
        details: (error as Error).message
      };
      logger.error('❌ Redis delete test failed:', error);
    }

    // Test 5: Info
    try {
      const start = Date.now();
      const info = await redis.info();
      const responseTime = Date.now() - start;
      
      // Parse Redis info
      const infoLines = info.split('\r\n');
      const infoObj: any = {};
      infoLines.forEach(line => {
        if (line.includes(':')) {
          const [key, value] = line.split(':');
          infoObj[key] = value;
        }
      });
      
      testResults.tests.info = {
        status: 'success',
        responseTime,
        details: {
          version: infoObj.redis_version,
          uptime: infoObj.uptime_in_seconds,
          connected_clients: infoObj.connected_clients,
          used_memory: infoObj.used_memory_human,
          total_commands_processed: infoObj.total_commands_processed
        }
      };
      logger.info('✅ Redis info test passed');
    } catch (error) {
      testResults.tests.info = {
        status: 'failed',
        responseTime: 0,
        details: (error as Error).message
      };
      logger.error('❌ Redis info test failed:', error);
    }

    // Determine overall status
    const failedTests = Object.values(testResults.tests).filter(test => test.status === 'failed').length;
    if (failedTests > 0) {
      testResults.status = 'degraded';
    }

    const statusCode = testResults.status === 'healthy' ? 200 : 503;
    logger.info(`🔍 Redis test completed with status: ${testResults.status}`);
    
    res.status(statusCode).json(testResults);
  } catch (error) {
    logger.error('❌ Redis test failed:', error);
    res.status(503).json({
      status: 'unhealthy',
      service: 'redis',
      error: (error as Error).message,
      timestamp: new Date().toISOString()
    });
  }
});

// Sadece Elasticsearch health check
router.get('/elasticsearch', async (req, res) => {
  try {
    const start = Date.now();
    const health = await elasticsearchClient.cluster.health();
    const responseTime = Date.now() - start;
    
    const status = health.status === 'red' ? 'unhealthy' : 'healthy';
    const statusCode = status === 'healthy' ? 200 : 503;
    
    res.status(statusCode).json({
      status,
      service: 'elasticsearch',
      clusterStatus: health.status,
      numberOfNodes: health.number_of_nodes,
      activeShards: health.active_shards,
      responseTime: `${responseTime}ms`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      service: 'elasticsearch',
      error: (error as Error).message,
      timestamp: new Date().toISOString()
    });
  }
});

// Test endpoint - Create test listings (no auth required)
router.post('/test-listings/create', async (req, res): Promise<void> => {
  try {
    console.log('🧪 POST /test-listings/create endpoint called!');
    console.log('🧪 Request body:', req.body);
    
    const { count = 5, includeImages = true } = req.body;
    
    if (!count || count < 1 || count > 100) {
      res.status(400).json({ error: 'Count must be between 1 and 100' });
      return;
    }

    console.log('🧪 Test listings endpoint called with count:', count);
    
    // Import Supabase client
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get users
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('id, name')
      .limit(10);

    if (usersError) {
      console.error('❌ Users fetch error:', usersError);
      res.status(500).json({ error: 'Failed to fetch users' });
      return;
    }

    if (!users || users.length === 0) {
      res.status(500).json({ error: 'No users found' });
      return;
    }

    // Get categories (leaf categories only)
    const { data: categories, error: categoriesError } = await supabase
      .from('categories')
      .select('*')
      .order('name');

    if (categoriesError) {
      console.error('❌ Categories fetch error:', categoriesError);
      res.status(500).json({ error: 'Failed to fetch categories' });
      return;
    }

    // Filter for leaf categories
    const leafCategories = categories?.filter((cat: any) => 
      !categories.some((child: any) => child.parent_id === cat.id)
    ) || [];

    if (leafCategories.length === 0) {
      res.status(500).json({ error: 'No leaf categories found' });
      return;
    }

    // Generate test listings
    const createdListings = [];
    const productNames = [
      'iPhone 15 Pro Max', 'Samsung Galaxy S24', 'MacBook Pro M3', 'iPad Air', 'AirPods Pro',
      'PlayStation 5', 'Xbox Series X', 'Nintendo Switch', 'Sony WH-1000XM5', 'Bose QuietComfort',
      'IKEA Malm Yatak', 'IKEA Billy Kitaplık', 'IKEA Poäng Koltuk', 'IKEA Hemnes Komodin',
      'Honda Civic', 'Toyota Corolla', 'BMW 3 Serisi', 'Mercedes C Serisi', 'Audi A4',
      'Nike Air Max', 'Adidas Ultraboost', 'Puma RS-X', 'New Balance 574', 'Converse Chuck Taylor'
    ];

    const descriptions = [
      'Mükemmel durumda, az kullanılmış ürün arıyorum.',
      'Hızlı teslimat, güvenilir satıcı arıyorum.',
      'Uygun fiyatlı, kaliteli ürün arıyorum.',
      'İkinci el ama çok temiz ürün arıyorum.',
      'Yeni gibi, orijinal kutusunda ürün arıyorum.',
      'Acil ihtiyacım var, hızlı satıcı arıyorum.',
      'Kaliteli marka, uygun fiyat arıyorum.',
      'Güvenilir satıcıdan, garantili ürün arıyorum.',
      'Temiz ve bakımlı ürün arıyorum.',
      'Orijinal parçalı, sorunsuz ürün arıyorum.'
    ];

    const locations = [
      'İstanbul', 'Ankara', 'İzmir', 'Bursa', 'Antalya', 'Adana', 'Konya', 'Gaziantep',
      'Mersin', 'Diyarbakır', 'Samsun', 'Denizli', 'Eskişehir', 'Trabzon', 'Erzurum'
    ];

    for (let i = 0; i < count; i++) {
      const user = users[Math.floor(Math.random() * users.length)];
      const category = leafCategories[Math.floor(Math.random() * leafCategories.length)];
      const productName = productNames[Math.floor(Math.random() * productNames.length)];
      const description = descriptions[Math.floor(Math.random() * descriptions.length)];
      const location = locations[Math.floor(Math.random() * locations.length)];
      const urgency = ['Acil', 'Normal', 'Acil Değil'][Math.floor(Math.random() * 3)];
      const condition = ['Yeni', 'İkinci El', 'Çok İyi', 'İyi'][Math.floor(Math.random() * 4)];
      const price = Math.floor(Math.random() * 50000) + 100;

      let imageUrl = '';
      if (includeImages) {
        try {
          // Use Picsum for random images
          const imageId = Math.floor(Math.random() * 1000);
          imageUrl = `https://picsum.photos/400/300?random=${imageId}`;
        } catch (error) {
          console.warn('⚠️ Image generation failed, using placeholder');
          imageUrl = 'https://via.placeholder.com/400x300?text=No+Image';
        }
      }

      // Kategori path'ini Supabase'den al ve " > " ile ayır
      const getCategoryPath = (cat: any): string => {
        return cat.path.replace(/\//g, ' > ');
      };

      // Kategori path array'ini ID'lerden oluştur
      const getCategoryPathArray = (cat: any, allCategories: any[]): number[] => {
        if (!cat.parent_id) {
          return [cat.id];
        }
        const parent = allCategories.find(c => c.id === cat.parent_id);
        if (parent) {
          const parentPath = getCategoryPathArray(parent, allCategories);
          return [...parentPath, cat.id];
        }
        return [cat.id];
      };

      const categoryPath = getCategoryPath(category);

      const listing = {
        user_id: user.id,
        title: `${productName} Arıyorum`,
        description: `${productName} için ${description}`,
        category: categoryPath,
        category_id: category.id,
        category_path: getCategoryPathArray(category, categories || []),
        budget: price,
        location: location,
        urgency: urgency,
        condition: [condition],
        main_image_url: imageUrl,
        additional_image_urls: imageUrl ? [imageUrl] : [],
        contact_preference: ['Telefon', 'Mesaj', 'Email'][Math.floor(Math.random() * 3)],
        features: [],
        attributes: {},
        offers_count: 0,
        views_count: 0,
        favorites_count: 0,
        popularity_score: 0,
        is_featured: false,
        is_urgent_premium: false,
        is_showcase: false,
        up_to_date: true,
        has_bold_border: false,
        accept_terms: true,
        auto_republish: false,
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      createdListings.push(listing);
    }

    console.log('💾 Generated listings:', createdListings.length);

    // Insert listings to Supabase
    const { data, error } = await supabase
      .from('listings')
      .insert(createdListings)
      .select();

    if (error) {
      console.error('❌ Supabase error:', error);
      res.status(500).json({ error: error.message });
      return;
    }

    console.log('✅ Test listings created in Supabase:', data?.length || 0);

    // Insert listings to Elasticsearch
    try {
      const elasticsearchClient = require('../services/elasticsearchService').elasticsearchClient;
      
      const bulkBody = [];
      for (const listing of data) {
        bulkBody.push(
          { index: { _index: 'listings', _id: listing.id } },
          {
            ...listing,
            search_text: `${listing.title} ${listing.description} ${listing.category}`,
            created_at: new Date(listing.created_at).toISOString(),
            updated_at: new Date(listing.updated_at).toISOString()
          }
        );
      }

      if (bulkBody.length > 0) {
        const { body } = await elasticsearchClient.bulk({ body: bulkBody });
        console.log('✅ Test listings indexed in Elasticsearch:', body.items?.length || 0);
      }
    } catch (elasticError) {
      console.error('❌ Elasticsearch error:', elasticError);
      // Don't fail the request, just log the error
    }
    res.json({ 
      success: true, 
      data, 
      count: data?.length || 0,
      stats: {
        users: users.length,
        categories: leafCategories.length,
        generated: createdListings.length,
        inserted: data?.length || 0
      }
    });
    
  } catch (error) {
    console.error('❌ Test endpoint error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Clear test listings
router.delete('/test-listings/clear', async (req, res) => {
  try {
    console.log('🗑️ Clearing test listings...');
    
    // Delete from Supabase
    const { error: deleteError } = await supabase
      .from('listings')
      .delete()
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()); // Son 24 saatteki ilanları sil

    if (deleteError) {
      console.error('❌ Error deleting test listings from Supabase:', deleteError);
      res.status(500).json({ error: 'Failed to delete test listings from Supabase' });
      return;
    }

    console.log('✅ Test listings cleared from Supabase');

    // Delete from Elasticsearch
    try {
      const elasticsearchClient = require('../services/elasticsearchService').elasticsearchClient;
      const { body } = await elasticsearchClient.deleteByQuery({
        index: 'listings',
        body: {
          query: {
            range: {
              created_at: {
                gte: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
              }
            }
          }
        }
      });
      console.log('✅ Test listings cleared from Elasticsearch');
    } catch (elasticError) {
      console.error('❌ Error deleting test listings from Elasticsearch:', elasticError);
      // Don't fail the request, just log the error
    }

    res.json({ success: true, message: 'Test listings cleared successfully from both Supabase and Elasticsearch' });
  } catch (error) {
    console.error('❌ Error clearing test listings:', error);
    res.status(500).json({ error: 'Failed to clear test listings' });
  }
});

// Database Trigger Bridge specific health check
router.get('/database-trigger-bridge', async (req, res) => {
  try {
    const health = await databaseTriggerBridge.healthCheck();
    const status = health.healthy ? 200 : 503;
    
    res.status(status).json({
      timestamp: new Date().toISOString(),
      service: 'database-trigger-bridge',
      ...health
    });

  } catch (error) {
    logger.error('Database trigger bridge health check error:', error);
    res.status(500).json({
      timestamp: new Date().toISOString(),
      service: 'database-trigger-bridge',
      healthy: false,
      message: 'Health check failed with error',
      details: { error: error instanceof Error ? error.message : 'Unknown error' }
    });
  }
});

// Database Trigger Bridge status
router.get('/database-trigger-bridge/status', async (req, res) => {
  try {
    const status = await databaseTriggerBridge.getStatus();
    
    res.json({
      timestamp: new Date().toISOString(),
      service: 'database-trigger-bridge',
      status
    });

  } catch (error) {
    logger.error('Database trigger bridge status error:', error);
    res.status(500).json({
      timestamp: new Date().toISOString(),
      service: 'database-trigger-bridge',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router; 