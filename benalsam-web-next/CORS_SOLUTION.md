# CORS Solution for Benalsam Web (Next.js)

## Problem
When developing locally with the Next.js frontend deployed on Vercel while backend services run on VPS, CORS (Cross-Origin Resource Sharing) issues occur because:
- Frontend runs on `http://localhost:3000` (local development) or `https://benalsam.vercel.app` (Vercel)
- Backend services run on `https://api.benalsam.com` (VPS)
- Browser security policies block cross-origin requests

## Solution
Implemented a local CORS proxy server to handle API requests during development.

### Components

#### 1. Local CORS Proxy Server (`local-cors-proxy.js`)
- Runs on `http://127.0.0.1:7242`
- Proxies requests from frontend to backend
- Adds necessary CORS headers to responses
- Handles HTTP redirects internally to prevent browser CORS issues

#### 2. API Client Configuration (`src/lib/apiClient.ts`)
- Uses `NEXT_PUBLIC_USE_CORS_PROXY` environment variable to determine if proxy should be used
- Routes requests through the local proxy when enabled
- Falls back to direct API calls in production

#### 3. Service Files Updates
All service files updated to use the proxy URL:
- `src/services/elasticsearchService.ts`
- `src/services/categoryService.ts`
- `src/services/createListingService.ts`
- `src/services/listingAIService.ts`
- `src/services/uploadService.ts`

### Environment Configuration
In `.env.local`:
```
NEXT_PUBLIC_USE_CORS_PROXY=true
```

### How It Works
1. Frontend makes request to `http://127.0.0.1:7242/api/v1/categories`
2. Local proxy receives request and forwards to `https://api.benalsam.com/api/v1/categories`
3. Backend responds to proxy with data
4. Proxy adds CORS headers and forwards response to frontend
5. Browser receives response with proper CORS headers

### Redirect Handling
The proxy handles HTTP redirects (301, 302, etc.) internally by:
- Detecting redirect responses from the backend
- Following the redirect internally to the final destination
- Adding CORS headers to the final response
- Preventing the browser from directly following redirects (which would cause CORS issues)

### Starting the Proxy
```bash
node local-cors-proxy.js
```

### Verification
- Health check: `http://127.0.0.1:7242/health`
- Test endpoint: `http://127.0.0.1:7242/api/v1/categories`