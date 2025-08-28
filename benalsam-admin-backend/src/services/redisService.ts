import Redis from 'ioredis';

// Redis Cloud connection for performance analysis
const redisCloud = new Redis({
  host: process.env.REDIS_CLOUD_HOST || 'redis-13243.c135.eu-central-1-1.ec2.redns.redis-cloud.com',
  port: parseInt(process.env.REDIS_CLOUD_PORT || '13243'),
  password: process.env.REDIS_CLOUD_PASSWORD,
  maxRetriesPerRequest: 1, // Retry sayısını azalt
  lazyConnect: true,
  keepAlive: 30000,
  connectTimeout: 10000,
  commandTimeout: 5000,
  // Read-only replica hatası için iyileştirmeler
  retryStrategy: (times: number) => {
    const delay = Math.min(times * 50, 2000);
    console.log(`🔄 Redis Cloud retry attempt ${times}, delay: ${delay}ms`);
    return delay;
  },
  enableOfflineQueue: true,
  family: 4 // IPv4
});

// Connection event handlers
redisCloud.on('connect', () => {
  console.log('✅ Redis Cloud connected for performance analysis');
});

redisCloud.on('error', (error) => {
  // Read-only replica hatasını özel olarak handle et
  if (error.message.includes('READONLY')) {
    console.warn('⚠️ Redis Cloud read-only replica detected, attempting to reconnect to master...', {
      error: error.message,
      timestamp: new Date().toISOString()
    });
    // Master node'a bağlanmaya çalış
    redisCloud.disconnect();
    setTimeout(() => {
      redisCloud.connect();
    }, 1000);
  } else if (error.message.includes('ECONNRESET')) {
    console.warn('⚠️ Redis Cloud connection reset, attempting to reconnect...', {
      error: error.message,
      timestamp: new Date().toISOString()
    });
  } else {
    console.error('❌ Redis Cloud connection error:', {
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
  }
});

redisCloud.on('ready', () => {
  console.log('🚀 Redis Cloud ready for performance analysis');
});

redisCloud.on('close', () => {
  console.log('🔌 Redis Cloud connection closed');
});

redisCloud.on('reconnecting', () => {
  console.log('🔄 Redis Cloud reconnecting...');
});

// Test connection
const testConnection = async (): Promise<boolean> => {
  try {
    // Bağlantının hazır olmasını bekle
    if (redisCloud.status !== 'ready') {
      console.log('⏳ Waiting for Redis Cloud connection to be ready...');
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Redis Cloud connection timeout'));
        }, 10000);

        const checkReady = () => {
          if (redisCloud.status === 'ready') {
            clearTimeout(timeout);
            resolve(true);
          } else if (redisCloud.status === 'end') {
            clearTimeout(timeout);
            reject(new Error('Redis Cloud connection failed'));
          } else {
            setTimeout(checkReady, 100);
          }
        };
        checkReady();
      });
    }

    await redisCloud.ping();
    console.log('✅ Redis Cloud ping successful');
    return true;
  } catch (error) {
    console.error('❌ Redis Cloud ping failed:', error);
    return false;
  }
};

// Initialize connection
const initializeRedis = async (): Promise<boolean> => {
  try {
    console.log('🔄 Initializing Redis Cloud connection...');
    
    // Bağlantıyı başlat
    if (redisCloud.status === 'wait') {
      await redisCloud.connect();
    }
    
    // Test connection
    const isConnected = await testConnection();
    
    if (isConnected) {
      console.log('✅ Redis Cloud initialization successful');
      return true;
    } else {
      console.warn('⚠️ Redis Cloud initialization failed, but continuing...');
      return false;
    }
  } catch (error) {
    console.error('❌ Redis Cloud initialization failed:', error);
    console.warn('⚠️ Continuing without Redis Cloud...');
    return false;
  }
};

// Export everything
// Export local Redis instead of Redis Cloud to avoid read-only errors
import { redis } from '../config/redis';

export { redis, testConnection, initializeRedis };
