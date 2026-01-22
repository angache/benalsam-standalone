# 🌐 CORS Configuration Guide

This project uses environment-based CORS configuration to handle cross-origin requests seamlessly across different deployment environments.

## 📁 File Structure

```
src/
├── config/
│   └── corsConfig.ts          # Main CORS configuration logic
├── hooks/
│   └── useEnvironment.ts      # Environment detection hooks
└── lib/
    └── apiClient.ts           # Updated API client using CORS config

.env.local                     # Local development environment
.env.staging                   # Staging/Vercel preview environment  
.env.production                # Production environment
```

## 🚀 How It Works

### 1. Automatic Environment Detection
The system automatically detects the current environment based on the hostname:
- **Development**: `localhost`, `127.0.0.1`, or network IPs
- **Staging**: `*.vercel.app`, `staging.*`, `preview.*`
- **Production**: `benalsam.com`, `www.benalsam.com`, `admin.benalsam.com`

### 2. Dynamic CORS Configuration
Based on the detected environment, appropriate CORS origins are allowed:

**Development Origins:**
```
http://localhost:5173
http://localhost:3003  
http://127.0.0.1:5173
http://192.168.x.x:5173  # Network access
```

**Staging Origins:**
```
*.vercel.app            # Vercel preview deployments
https://staging.benalsam.com
```

**Production Origins:**
```
https://benalsam.com
https://www.benalsam.com  
https://admin.benalsam.com
```

## 🛠️ Setup Instructions

### 1. Local Development Setup

```bash
# Copy the local environment file
cp .env.local .env

# Install dependencies
npm install

# Start development server
npm run dev
```

The development server will automatically:
- Proxy `/api` requests to your VPS backend
- Handle CORS headers properly
- Use the correct API URLs based on environment

### 2. Vercel Deployment Setup

```bash
# Add environment variables to Vercel
vercel env add VITE_API_BASE_URL production
# Value: https://api.benalsam.com

vercel env add VITE_API_BASE_URL preview  
# Value: https://api-staging.benalsam.com
```

### 3. Backend CORS Configuration

Update your backend services to use the CORS configuration:

```typescript
// In your backend service (e.g., admin-backend)
import { getCORSConfig } from '../shared-types';

const corsOptions = getCORSConfig();

app.use(cors(corsOptions));
```

## 🔧 Key Features

### ✅ Automatic Origin Detection
- No manual configuration needed
- Works with Vercel preview deployments
- Supports network development (team collaboration)

### ✅ Smart Proxy Configuration
- Local development proxies API calls to VPS
- Handles CORS headers automatically
- WebSocket support included

### ✅ Environment-Specific URLs
- Different API endpoints for each environment
- Proper WebSocket URLs (ws/wss)
- Flexible service URL configuration

### ✅ React Hooks Integration
```typescript
import { useEnvironment, useFeatureFlag } from '../hooks/useEnvironment';

function MyComponent() {
  const { isDevelopment, apiBaseUrl } = useEnvironment();
  const showDebugTools = useFeatureFlag('ENABLE_DEBUG_MODE');
  
  // Your component logic
}
```

## 🧪 Testing CORS Configuration

### 1. Check Current Environment
```bash
# In browser console
console.log('Environment:', window.location.hostname);
```

### 2. Test API Calls
```bash
# Local development
curl http://localhost:5173/api/health

# Production  
curl https://benalsam.com/api/health
```

### 3. Verify CORS Headers
Check that responses include proper CORS headers:
```
Access-Control-Allow-Origin: *
Access-Control-Allow-Credentials: true
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With
```

## 🚨 Troubleshooting

### Common Issues:

1. **CORS Errors in Development**
   - Ensure `.env.local` exists with correct VPS IP
   - Check that VPS backend is running
   - Verify firewall settings on VPS

2. **Vercel Preview Deployment Issues**
   - Add `*.vercel.app` to allowed origins
   - Check environment variables in Vercel dashboard
   - Ensure backend CORS accepts wildcard origins

3. **WebSocket Connection Problems**
   - Verify `VITE_WEBSOCKET_URL` is set correctly
   - Check that WebSocket server supports CORS
   - Ensure proper protocol (ws:// vs wss://)

## 📝 Best Practices

1. **Always use environment variables** for service URLs
2. **Test in all environments** before deploying
3. **Monitor CORS errors** in production
4. **Keep origin lists updated** as you add new domains
5. **Use HTTPS in production** for security

## 🔐 Security Notes

- Development allows localhost and network IPs
- Production restricts to known domains only
- Credentials are only sent to trusted origins
- Regular origin list reviews recommended

---

Need help? Check the console logs for environment detection information or contact the development team.