import Redis from 'ioredis';

// Redis Cloud connection for performance analysis
const redisCloud = new Redis({
  host: process.env.REDIS_CLOUD_HOST || 'redis-13243.c135.eu-central-1-1.ec2.redns.redis-cloud.com',
  port: parseInt(process.env.REDIS_CLOUD_PORT || '13243'),
  password: process.env.REDIS_CLOUD_PASSWORD,
  maxRetriesPerRequest: 1,
  lazyConnect: true,
  keepAlive: 30000,
  connectTimeout: 10000,
  commandTimeout: 5000,
  retryStrategy: (times: number) => {
    const delay = Math.min(times * 50, 2000);
    console.log(`🔄 Redis Cloud retry attempt ${times}, delay: ${delay}ms`);
    return delay;
  },
  enableOfflineQueue: true,
  family: 4
});

// Connection event handlers
redisCloud.on('connect', () => {
  console.log('✅ Redis Cloud connected for performance analysis');
});

redisCloud.on('error', (error) => {
  if (error.message.includes('READONLY')) {
    console.warn('⚠️ Redis Cloud read-only replica detected, attempting to reconnect to master...', {
      error: error.message,
      timestamp: new Date().toISOString()
    });
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
    
    if (redisCloud.status === 'wait') {
      await redisCloud.connect();
    }
    
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

// Export Redis Cloud for performance analysis
export { redisCloud, testConnection, initializeRedis };
