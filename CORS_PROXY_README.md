# Local CORS Proxy Setup

## Problem
When developing locally (`localhost:3000`) but connecting to production services on VPS (`https://api.benalsam.com`), browsers block requests due to CORS (Cross-Origin Resource Sharing) policy.

## Solution
A local CORS proxy server that runs on port 7242 and proxies API requests to the VPS services.

## Setup Instructions

### 1. Environment Variable
Add to your `.env.local` file:
```env
NEXT_PUBLIC_USE_CORS_PROXY=true
```

### 2. Start the Proxy Server
Open a new terminal and run:
```bash
cd /path/to/benalsam-standalone
node scripts/local-cors-proxy.js
```

Or use the start script:
```bash
./scripts/start-cors-proxy.sh
```

### 3. Start Your Development Server
In another terminal:
```bash
cd benalsam-web-next
npm run dev
```

## How It Works

1. **Frontend** (`localhost:3000`) makes API calls to services
2. **CORS Proxy** (`localhost:7242`) receives the requests
3. **Proxy** forwards requests to **VPS** (`https://api.benalsam.com`)
4. **VPS** responds to **Proxy**
5. **Proxy** adds CORS headers and sends response back to **Frontend**

## Files Modified

- `src/lib/apiClient.ts` - Updated `withCorsProxy` to use local proxy
- `next.config.ts` - Removed external proxy from CSP
- `scripts/local-cors-proxy.js` - New proxy server using built-in Node modules
- `scripts/start-cors-proxy.sh` - Convenience script to start proxy

## Debug Logging

The proxy also collects debug logs from your frontend:
- Logs are sent to: `http://127.0.0.1:7242/ingest/...`
- View logs in the proxy server terminal

## Health Check

Test if proxy is running:
```bash
curl http://127.0.0.1:7242/health
```

## Troubleshooting

### Proxy not starting
- Check if port 7242 is already in use
- Make sure Node.js is installed

### Still getting CORS errors
- Verify `NEXT_PUBLIC_USE_CORS_PROXY=true` is set
- Check that proxy server is running
- Look at proxy server logs for errors

### API calls failing
- Check VPS services are running
- Verify network connectivity to `api.benalsam.com`

## Security Notes

- This proxy only runs in development (`NODE_ENV=development`)
- Only activated when `NEXT_PUBLIC_USE_CORS_PROXY=true`
- Uses built-in Node.js modules, no external dependencies
- Adds proper CORS headers to all responses