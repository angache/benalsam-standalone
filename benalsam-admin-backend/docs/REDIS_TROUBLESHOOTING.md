# Redis Troubleshooting Guide

## 🔴 Redis Hataları

### 1. ECONNRESET Hatası

#### Hata Açıklaması
```
[ioredis] Unhandled error event: Error: read ECONNRESET
```

Bu hata Redis bağlantısının aniden koptuğunu gösterir.

### 2. Redis Cloud Stream Hatası

#### Hata Açıklaması
```
❌ Redis Cloud ping failed: Error: Stream isn't writeable and enableOfflineQueue options is false
```

Bu hata Redis Cloud bağlantısının henüz hazır olmadığını gösterir.

### Neden Olur?
- Redis sunucusu yeniden başlatıldığında
- Ağ bağlantısı koptuğunda
- Redis idle timeout'a ulaştığında
- Redis maxclients limitine ulaşıldığında
- Firewall/network issues

### ✅ Çözümler

#### 1. Error Handler Ekleme
```typescript
redis.on('error', (error) => {
  if (error.message.includes('ECONNRESET')) {
    console.warn('⚠️ Redis connection reset, attempting to reconnect...');
  } else {
    console.error('❌ Redis error:', error);
  }
});
```

#### 2. Retry Strategy
```typescript
const redis = new Redis({
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  }
});
```

#### 3. Timeout Ayarları
```typescript
const redis = new Redis({
  connectTimeout: 10000,
  commandTimeout: 5000,
  keepAlive: 30000,
  maxRetriesPerRequest: 3
});
```

#### 4. Enable Offline Queue
```typescript
const redis = new Redis({
  enableOfflineQueue: true, // false yerine true
  lazyConnect: true
});
```

#### 5. Connection Ready Check
```typescript
const testConnection = async () => {
  if (redis.status !== 'ready') {
    await new Promise((resolve) => {
      redis.once('ready', resolve);
    });
  }
  await redis.ping();
};
```

### 🔧 Mevcut Konfigürasyon

Projede şu ayarlar aktif:

```typescript
// src/config/redis.ts
const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  retryStrategy: (times: number) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  connectTimeout: 10000,
  commandTimeout: 5000,
  keepAlive: 30000,
  maxRetriesPerRequest: 3,
  enableOfflineQueue: true // false'dan true'ya değiştirildi
};
```

### 🚀 Environment Variables

```bash
# Redis Configuration
REDIS_HOST=209.227.228.96
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_CONNECT_TIMEOUT=10000
REDIS_COMMAND_TIMEOUT=5000
REDIS_KEEP_ALIVE=30000
REDIS_RETRY_DELAY=50
REDIS_MAX_RETRIES=3

# Redis Cloud Configuration
ENABLE_REDIS_CLOUD=false
REDIS_CLOUD_HOST=redis-13243.c135.eu-central-1-1.ec2.redns.redis-cloud.com
REDIS_CLOUD_PORT=13243
REDIS_CLOUD_PASSWORD=YOUR_REDIS_CLOUD_PASSWORD
```

### 🔍 Monitoring

#### Health Check
```typescript
import { getRedisHealthStatus } from '../config/redis';

const health = await getRedisHealthStatus();
console.log('Redis Health:', health);
```

#### Log Monitoring
Redis bağlantı durumunu loglardan takip edebilirsiniz:
- `✅ Redis connected` - Bağlantı başarılı
- `⚠️ Redis connection reset` - Bağlantı koptu, yeniden bağlanıyor
- `🔄 Redis reconnecting` - Yeniden bağlanma denemesi
- `❌ Redis connection error` - Bağlantı hatası

### 🛠️ Debugging

#### 1. Redis Sunucu Durumu
```bash
# Redis sunucusuna bağlan
redis-cli -h 209.227.228.96 -p 6379

# Ping test
PING

# Info komutu
INFO server
INFO clients
```

#### 2. Network Test
```bash
# Port kontrolü
telnet 209.227.228.96 6379

# Ping test
ping 209.227.228.96
```

#### 3. Application Logs
```bash
# Log dosyalarını kontrol et
tail -f logs/combined.log | grep -i redis
```

### 📊 Performance Monitoring

Redis performansını izlemek için:

```typescript
// src/services/redisService.ts
redisCloud.on('connect', () => {
  console.log('✅ Redis Cloud connected');
});

redisCloud.on('error', (error) => {
  console.error('❌ Redis Cloud error:', error);
});
```

### 🔄 Auto-Recovery

Sistem otomatik olarak:
- Bağlantı koptuğunda yeniden bağlanmaya çalışır
- Exponential backoff ile retry yapar
- Error'ları loglar ve handle eder

### 📞 Support

Eğer sorun devam ederse:
1. Redis sunucu loglarını kontrol edin
2. Network connectivity test edin
3. Redis sunucu kaynaklarını kontrol edin
4. Firewall ayarlarını kontrol edin
