import Redis from 'ioredis';

// Redis Cloud connection for performance analysis
const redisCloud = new Redis({
  host: process.env.REDIS_CLOUD_HOST || 'redis-13243.c135.eu-central-1-1.ec2.redns.redis-cloud.com',
  port: parseInt(process.env.REDIS_CLOUD_PORT || '13243'),
  password: process.env.REDIS_CLOUD_PASSWORD,
  maxRetriesPerRequest: 3,
  lazyConnect: true,
  keepAlive: 30000,
  connectTimeout: 10000,
  commandTimeout: 5000,
});

// Connection event handlers
redisCloud.on('connect', () => {
  console.log('✅ Redis Cloud connected for performance analysis');
});

redisCloud.on('error', (error) => {
  console.error('❌ Redis Cloud connection error:', error);
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
    await testConnection();
    return true;
  } catch (error) {
    console.error('❌ Redis Cloud initialization failed:', error);
    return false;
  }
};

// Export everything
export { redisCloud as redis, testConnection, initializeRedis };
