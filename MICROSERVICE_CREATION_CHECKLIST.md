# 🚀 **MİKROSERVİS OLUŞTURMA CHECKLİSTİ**

**Versiyon:** 1.0.0  
**Son Güncelleme:** 20 Eylül 2025  
**Hazırlayan:** Benalsam CTO Team

---

## 📋 **GENEL BAKIŞ**

Bu checklist, Benalsam projesinde yeni mikroservisler oluştururken takip edilmesi gereken adımları içerir. Her adım detaylı olarak kontrol edilmeli ve tamamlanmadan bir sonrakine geçilmemelidir.

---

## 🎯 **AŞAMA 1: PROJE HAZIRLIĞI**

### **1.1 Klasör Yapısı Oluşturma**
- [ ] `benalsam-[service-name]-service/` ana klasörü oluştur
- [ ] `src/` klasörü oluştur
- [ ] `src/services/` klasörü oluştur
- [ ] `src/routes/` klasörü oluştur
- [ ] `src/config/` klasörü oluştur
- [ ] `src/types/` klasörü oluştur
- [ ] `src/middleware/` klasörü oluştur
- [ ] `src/utils/` klasörü oluştur
- [ ] `src/__tests__/` klasörü oluştur
- [ ] `docs/` klasörü oluştur
- [ ] `logs/` klasörü oluştur

### **1.2 Temel Dosyalar**
- [ ] `package.json` oluştur
- [ ] `tsconfig.json` oluştur
- [ ] `nodemon.json` oluştur
- [ ] `jest.config.js` oluştur
- [ ] `env.example` oluştur
- [ ] `README.md` oluştur
- [ ] `API_ENDPOINTS.md` oluştur
- [ ] `.gitignore` oluştur
- [ ] `Dockerfile` oluştur (opsiyonel)

---

## 📦 **AŞAMA 2: DEPENDENCIES KURULUMU**

### **2.1 Core Dependencies (MUTLAKA GEREKLİ)**
```bash
npm install express
npm install dotenv
npm install cors
npm install helmet
npm install compression
npm install express-rate-limit
npm install winston
npm install @supabase/supabase-js
npm install ioredis
npm install amqplib
npm install node-cron
npm install joi
npm install bcryptjs
npm install jsonwebtoken
npm install axios
npm install uuid
```

### **2.2 Development Dependencies (MUTLAKA GEREKLİ)**
```bash
npm install --save-dev typescript
npm install --save-dev @types/node
npm install --save-dev @types/express
npm install --save-dev @types/cors
npm install --save-dev @types/helmet
npm install --save-dev @types/compression
npm install --save-dev @types/bcryptjs
npm install --save-dev @types/jsonwebtoken
npm install --save-dev @types/uuid
npm install --save-dev @types/amqplib
npm install --save-dev @types/node-cron
npm install --save-dev ts-node
npm install --save-dev nodemon
npm install --save-dev jest
npm install --save-dev @types/jest
npm install --save-dev ts-jest
npm install --save-dev eslint
npm install --save-dev @typescript-eslint/parser
npm install --save-dev @typescript-eslint/eslint-plugin
npm install --save-dev prettier
```

### **2.3 Service-Specific Dependencies**
#### **Analytics Service için:**
```bash
npm install recharts
npm install @types/recharts
npm install moment
npm install @types/moment
```

#### **Queue Service için:**
```bash
npm install bull
npm install @types/bull
npm install bullmq
```

#### **Cache Service için:**
```bash
npm install node-cache
npm install @types/node-cache
npm install lru-cache
npm install @types/lru-cache
```

#### **File Service için:**
```bash
npm install multer
npm install @types/multer
npm install sharp
npm install @types/sharp
npm install cloudinary
```

### **2.4 Dependencies Kontrol Listesi**
- [ ] Tüm core dependencies kuruldu
- [ ] Tüm dev dependencies kuruldu
- [ ] Service-specific dependencies kuruldu
- [ ] TypeScript types kuruldu
- [ ] `npm install` hatasız çalıştı
- [ ] `node_modules` klasörü oluştu
- [ ] `package-lock.json` oluştu

---

## ⚙️ **AŞAMA 3: KONFİGÜRASYON**

### **3.1 TypeScript Konfigürasyonu**
```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "removeComments": true,
    "noImplicitAny": true,
    "noImplicitReturns": true,
    "noImplicitThis": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitOverride": true,
    "noPropertyAccessFromIndexSignature": true,
    "noUncheckedIndexedAccess": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts"]
}
```

### **3.2 Package.json Konfigürasyonu**
```json
{
  "name": "@benalsam/[service-name]-service",
  "version": "1.0.0",
  "description": "Benalsam [Service Name] Service",
  "main": "dist/index.js",
  "scripts": {
    "dev": "nodemon",
    "build": "tsc -p tsconfig.json",
    "start": "node dist/index.js",
    "test": "jest",
    "test:watch": "jest --watch",
    "lint": "eslint src/**/*.ts",
    "lint:fix": "eslint src/**/*.ts --fix",
    "format": "prettier --write src/**/*.ts"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
```

### **3.3 Nodemon Konfigürasyonu**
```json
// nodemon.json
{
  "watch": ["src"],
  "ext": "ts,js,json",
  "ignore": ["src/**/*.spec.ts", "src/**/*.test.ts"],
  "exec": "ts-node src/index.ts",
  "env": {
    "NODE_ENV": "development"
  }
}
```

### **3.4 Environment Variables**
```bash
# env.example
NODE_ENV=development
PORT=300X
API_VERSION=v1

# Database
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Redis
REDIS_URL=redis://localhost:6379
REDIS_HOST=localhost
REDIS_PORT=6379

# RabbitMQ
RABBITMQ_URL=amqp://localhost:5672

# JWT
JWT_SECRET=your-jwt-secret
JWT_EXPIRES_IN=24h

# Logging
LOG_LEVEL=info
LOG_FILE_PATH=./logs/app.log

# Service Discovery
CONSUL_HOST=localhost
CONSUL_PORT=8500
```

---

## 🏗️ **AŞAMA 4: CORE SERVİS YAPISI**

### **4.1 Ana Index Dosyası**
```typescript
// src/index.ts
import { config } from 'dotenv';

// Load environment variables FIRST
config();

import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import logger from './config/logger';
import { errorHandler } from './middleware/errorHandler';
import { healthRoutes } from './routes/health';

const app = express();
const PORT = process.env.PORT || 300X;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
  credentials: true
}));
app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP'
});
app.use(limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Routes
app.use('/api/v1/health', healthRoutes);

// Error handling
app.use(errorHandler);

// Start server
const server = createServer(app);

server.listen(PORT, () => {
  logger.info(`🚀 [Service Name] Service started on port ${PORT}`);
  logger.info(`📊 Health check: http://localhost:${PORT}/api/v1/health`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});
```

### **4.2 Logger Konfigürasyonu**
```typescript
// src/config/logger.ts
import winston from 'winston';
import path from 'path';

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: { service: '[service-name]' },
  transports: [
    new winston.transports.File({ 
      filename: path.join('logs', 'error.log'), 
      level: 'error' 
    }),
    new winston.transports.File({ 
      filename: path.join('logs', 'combined.log') 
    })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

export default logger;
```

### **4.3 Error Handler**
```typescript
// src/middleware/errorHandler.ts
import { Request, Response, NextFunction } from 'express';
import logger from '../config/logger';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  logger.error('Error occurred:', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};
```

### **4.4 Health Check**
```typescript
// src/routes/health.ts
import { Router, Request, Response } from 'express';
import logger from '../config/logger';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const healthCheck = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: '[service-name]',
      version: process.env.npm_package_version || '1.0.0',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      environment: process.env.NODE_ENV
    };

    logger.info('Health check requested', { healthCheck });
    
    res.status(200).json({
      success: true,
      data: healthCheck
    });
  } catch (error) {
    logger.error('Health check failed:', error);
    res.status(500).json({
      success: false,
      message: 'Health check failed'
    });
  }
});

export { router as healthRoutes };
```

---

## 🔧 **AŞAMA 5: ASYNC KOD YAZIMI**

### **5.1 Async/Await Best Practices**
```typescript
// ✅ DOĞRU KULLANIM
export class ExampleService {
  async processData(data: any): Promise<ProcessResult> {
    try {
      // 1. Validation
      if (!data) {
        throw new Error('Data is required');
      }

      // 2. Async operations with proper error handling
      const result1 = await this.step1(data);
      const result2 = await this.step2(result1);
      const result3 = await this.step3(result2);

      return {
        success: true,
        data: result3
      };
    } catch (error) {
      logger.error('Process data failed:', error);
      throw error;
    }
  }

  private async step1(data: any): Promise<any> {
    // Implementation
  }

  private async step2(data: any): Promise<any> {
    // Implementation
  }

  private async step3(data: any): Promise<any> {
    // Implementation
  }
}

// ❌ YANLIŞ KULLANIM
export class BadExampleService {
  async processData(data: any): Promise<any> {
    // Missing try-catch
    const result1 = await this.step1(data);
    const result2 = await this.step2(result1); // No error handling
    return result2;
  }
}
```

### **5.2 Promise Handling**
```typescript
// ✅ DOĞRU KULLANIM
export class PromiseService {
  async handleMultiplePromises(): Promise<any[]> {
    try {
      const promises = [
        this.fetchData1(),
        this.fetchData2(),
        this.fetchData3()
      ];

      const results = await Promise.allSettled(promises);
      
      const successful = results
        .filter((result): result is PromiseFulfilledResult<any> => 
          result.status === 'fulfilled'
        )
        .map(result => result.value);

      const failed = results
        .filter((result): result is PromiseRejectedResult => 
          result.status === 'rejected'
        )
        .map(result => result.reason);

      if (failed.length > 0) {
        logger.warn('Some promises failed:', failed);
      }

      return successful;
    } catch (error) {
      logger.error('Promise handling failed:', error);
      throw error;
    }
  }
}
```

### **5.3 Error Handling Patterns**
```typescript
// ✅ DOĞRU KULLANIM
export class ErrorHandlingService {
  async safeOperation(): Promise<OperationResult> {
    try {
      const result = await this.riskyOperation();
      return {
        success: true,
        data: result
      };
    } catch (error) {
      logger.error('Operation failed:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async riskyOperation(): Promise<any> {
    // Implementation
  }
}
```

---

## 🧪 **AŞAMA 6: TESTING**

### **6.1 Jest Konfigürasyonu**
```javascript
// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/*.test.ts',
    '!src/**/*.spec.ts',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
};
```

### **6.2 Test Örneği**
```typescript
// src/__tests__/example.test.ts
import { ExampleService } from '../services/exampleService';

describe('ExampleService', () => {
  let service: ExampleService;

  beforeEach(() => {
    service = new ExampleService();
  });

  describe('processData', () => {
    it('should process data successfully', async () => {
      const testData = { id: 1, name: 'test' };
      
      const result = await service.processData(testData);
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    it('should handle errors gracefully', async () => {
      const result = await service.processData(null);
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
});
```

---

## 📚 **AŞAMA 7: DOKÜMANTASYON**

### **7.1 README.md**
```markdown
# Benalsam [Service Name] Service

## Overview
Brief description of the service

## Features
- Feature 1
- Feature 2

## Installation
```bash
npm install
```

## Configuration
Copy `env.example` to `.env` and configure

## Development
```bash
npm run dev
```

## Testing
```bash
npm test
```

## API Endpoints
See `API_ENDPOINTS.md` for detailed documentation
```

### **7.2 API_ENDPOINTS.md**
```markdown
# [Service Name] Service API Endpoints

## Base URL
```
Development: http://localhost:300X/api/v1
Production: https://[service].benalsam.com/api/v1
```

## Authentication
All endpoints require authentication via `Authorization` header:
```bash
Authorization: Bearer <token>
```

## Endpoints

### Health Check
```http
GET /api/v1/health
```

### [Other endpoints...]
```

---

## 🚀 **AŞAMA 8: DEPLOYMENT**

### **8.1 Dockerfile**
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 300X

CMD ["npm", "start"]
```

### **8.2 Docker Compose**
```yaml
version: '3.8'
services:
  [service-name]:
    build: .
    ports:
      - "300X:300X"
    environment:
      - NODE_ENV=production
      - PORT=300X
    env_file:
      - .env
    depends_on:
      - redis
      - rabbitmq
```

---

## ✅ **AŞAMA 9: FINAL CHECKLIST**

### **9.1 Kod Kalitesi**
- [ ] TypeScript hataları yok
- [ ] ESLint hataları yok
- [ ] Prettier formatı uygulandı
- [ ] Tüm async kodlar try-catch ile korunuyor
- [ ] Error handling mevcut
- [ ] Logging implementasyonu mevcut

### **9.2 Testing**
- [ ] Unit testler yazıldı
- [ ] Integration testler yazıldı
- [ ] Test coverage %80+ (opsiyonel)
- [ ] Tüm testler geçiyor

### **9.3 Dokümantasyon**
- [ ] README.md tamamlandı
- [ ] API_ENDPOINTS.md tamamlandı
- [ ] Code comments mevcut
- [ ] Type definitions mevcut

### **9.4 Deployment**
- [ ] Environment variables ayarlandı
- [ ] Dockerfile hazır
- [ ] Health check endpoint çalışıyor
- [ ] Service discovery entegrasyonu (opsiyonel)

### **9.5 Integration**
- [ ] Admin backend ile entegrasyon
- [ ] Diğer servislerle entegrasyon
- [ ] Monitoring setup
- [ ] Error tracking setup

---

## 🚨 **KRİTİK HATALAR VE ÇÖZÜMLERİ**

### **1. dotenv Unutma**
```typescript
// ✅ MUTLAKA EN ÜSTTE
import { config } from 'dotenv';
config();

// Sonra diğer importlar
import express from 'express';
```

### **2. TypeScript Hataları**
```typescript
// ✅ Strict type checking
interface User {
  id: string;
  name: string;
  email: string;
}

// ❌ any kullanma
const user: any = {};

// ✅ Proper typing
const user: User = {
  id: '1',
  name: 'John',
  email: 'john@example.com'
};
```

### **3. Async Error Handling**
```typescript
// ✅ Her async fonksiyon try-catch ile korunmalı
async function riskyOperation(): Promise<Result> {
  try {
    const result = await someAsyncOperation();
    return { success: true, data: result };
  } catch (error) {
    logger.error('Operation failed:', error);
    return { success: false, error: error.message };
  }
}
```

### **4. Memory Leaks**
```typescript
// ✅ Event listener'ları temizle
class Service {
  private interval?: NodeJS.Timeout;

  start(): void {
    this.interval = setInterval(() => {
      // Do something
    }, 1000);
  }

  stop(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = undefined;
    }
  }
}
```

---

## 📞 **DESTEK VE SORUN GİDERME**

### **Yaygın Sorunlar:**
1. **dotenv yüklenmiyor** → Import sırasını kontrol et
2. **TypeScript hataları** → Strict mode ayarlarını kontrol et
3. **Async hatalar** → Try-catch bloklarını kontrol et
4. **Memory leaks** → Event listener'ları temizle
5. **Port çakışması** → Port numarasını kontrol et

### **Debug Adımları:**
1. `npm run build` ile TypeScript hatalarını kontrol et
2. `npm test` ile testleri çalıştır
3. `npm run lint` ile kod kalitesini kontrol et
4. Log dosyalarını kontrol et
5. Health check endpoint'ini test et

---

**Bu checklist'i her mikroservis oluştururken takip edin ve her adımı tamamladıktan sonra işaretleyin!**
