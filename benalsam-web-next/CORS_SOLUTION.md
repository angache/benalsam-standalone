# CORS Solution for Benalsam Web (Next.js)

## Problem
When developing locally with the Next.js frontend deployed on Vercel while backend services run on VPS, CORS (Cross-Origin Resource Sharing) issues occur because:
- Frontend runs on `http://localhost:3000` (local development) or `https://benalsam.vercel.app` (Vercel)
- Backend services run on `https://api.benalsam.com` (VPS)
- Browser security policies block cross-origin requests

## Solution
Implemented a local CORS proxy server and proper URL path handling to resolve both CORS and API path duplication issues.

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
All service files updated with proper URL path handling based on environment:

##### Elasticsearch Service (`src/services/elasticsearchService.ts`)
- Added `useVpsServices` flag detection
- Different endpoint paths for VPS vs local modes
- Local development detection to prevent path duplication

##### Category Service (`src/services/categoryService.ts`)
- Updated all endpoints with conditional path construction
- Disabled debug logging in production to prevent CSP violations
- Proper URL routing for VPS and local modes

##### Cache Version Service (`src/services/cacheVersionService.ts`)
- Fixed hardcoded path duplication issue
- Added environment-aware URL construction
- Prevents `/api/v1/categories/api/v1/categories/version` errors

##### Other Services
- `src/services/createListingService.ts`
- `src/services/listingAIService.ts`
- `src/services/uploadService.ts`

### Environment Configuration
In `.env.local`:
```
# Enable VPS services (production-like environment)
NEXT_PUBLIC_USE_VPS_SERVICES=true

# Enable CORS proxy for local development
NEXT_PUBLIC_USE_CORS_PROXY=true

# API URLs
NEXT_PUBLIC_SEARCH_SERVICE_URL=https://api.benalsam.com
NEXT_PUBLIC_CATEGORIES_SERVICE_URL=https://api.benalsam.com
```

### Path Duplication Prevention
To prevent API path duplication issues like `/api/v1/categories/api/v1/categories`:

#### Implementation Logic
```javascript
const useVpsServices = process.env.NEXT_PUBLIC_USE_VPS_SERVICES === 'true'
const isLocalDevelopment = typeof window !== 'undefined' && window.location.hostname === 'localhost'

// VPS mode (production): URL already contains base path, so use relative path
// Local development: Need full path to reach proxy/VPS correctly
const endpoint = (useVpsServices && !isLocalDevelopment) ? '/listings' : '/api/v1/search/listings'
```

#### Environment Scenarios
1. **Production (Vercel)**: `useVpsServices=true`, `isLocalDevelopment=false` → `/listings`
2. **Local Development**: `useVpsServices=true`, `isLocalDevelopment=true` → `/api/v1/search/listings`
3. **True Local Mode**: `useVpsServices=false` → `/api/v1/search/listings`

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
- Production test: `https://api.benalsam.com/api/v1/categories/version`

### Troubleshooting

#### Common Issues
1. **404 Errors**: Check if `useVpsServices` flag and path construction logic match your environment
2. **CSP Violations**: Ensure debug logging is disabled in production environments
3. **Path Duplication**: Verify that frontend and backend base paths don't overlap

#### Browser Cache Issues
If changes don't appear immediately:
- Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
- Clear browser cache
- Restart browser
- Unregister service workers in Developer Tools