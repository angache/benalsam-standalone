#!/usr/bin/env node

/**
 * Local CORS Proxy Server
 * Simple proxy to bypass CORS restrictions during local development
 * Uses only built-in Node.js modules
 */

import http from 'http';
import https from 'https';
import url from 'url';
import { parse } from 'querystring';

const PORT = 7242;

function log(message) {
  console.log(`[${new Date().toISOString()}] ${message}`);
}

function proxyRequest(clientReq, clientRes) {
  const parsedUrl = url.parse(clientReq.url);
  const targetHost = 'api.benalsam.com';
  const targetPort = 443;
  const isHttps = true;

  // Keep the path as-is since frontend already sends the correct API path
  const targetPath = parsedUrl.path;

  log(`Proxying: ${clientReq.method} ${clientReq.url} -> https://${targetHost}${targetPath}`);

  const options = {
    hostname: targetHost,
    port: targetPort,
    path: targetPath,
    method: clientReq.method,
    headers: {
      ...clientReq.headers,
      'host': targetHost,
      // Add CORS headers
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, PATCH',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, X-API-Key, x-user-id',
      'Access-Control-Allow-Credentials': 'true'
    }
  };

  const proxyReq = (isHttps ? https : http).request(options, (proxyRes) => {
    // Handle redirects internally to avoid CORS issues
    if ([301, 302, 303, 307, 308].includes(proxyRes.statusCode)) {
      const location = proxyRes.headers.location;
      if (location) {
        log(`Redirect detected: ${proxyRes.statusCode} -> ${location}`);
        
        // If location is a full URL, extract the path
        let newPath;
        if (location.startsWith('http')) {
          const urlObj = new URL(location);
          newPath = urlObj.pathname + urlObj.search;
        } else {
          newPath = location;
        }
        
        log(`Following redirect internally to: ${newPath}`);
        
        // Create new options for the redirect target
        const redirectOptions = {
          hostname: targetHost,
          port: targetPort,
          path: newPath,
          method: clientReq.method,
          headers: {
            ...clientReq.headers,
            'host': targetHost,
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, PATCH',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, X-API-Key, x-user-id',
            'Access-Control-Allow-Credentials': 'true'
          }
        };
        
        // Make the redirected request
        const redirectReq = (isHttps ? https : http).request(redirectOptions, (redirectRes) => {
          // Copy response headers from the final response
          Object.keys(redirectRes.headers).forEach(key => {
            if (!key.toLowerCase().startsWith('access-control-')) {
              clientRes.setHeader(key, redirectRes.headers[key]);
            }
          });

          // Add CORS headers to response
          clientRes.setHeader('Access-Control-Allow-Origin', '*');
          clientRes.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
          clientRes.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, X-API-Key, x-user-id');
          clientRes.setHeader('Access-Control-Allow-Credentials', 'true');

          clientRes.statusCode = redirectRes.statusCode;

          redirectRes.on('data', (chunk) => {
            clientRes.write(chunk);
          });

          redirectRes.on('end', () => {
            log(`Final Response: ${redirectRes.statusCode} ${clientReq.method} ${clientReq.url}`);
            clientRes.end();
          });
        });
        
        redirectReq.on('error', (err) => {
          log(`Redirect proxy error: ${err.message}`);
          clientRes.statusCode = 500;
          clientRes.setHeader('Access-Control-Allow-Origin', '*');
          clientRes.end(JSON.stringify({ error: 'Redirect proxy error', message: err.message }));
        });
        
        // Handle request body for redirect if needed
        if (clientReq.method === 'POST' || clientReq.method === 'PUT' || clientReq.method === 'PATCH') {
          const bodyBuffer = Buffer.concat(body);
          redirectReq.write(bodyBuffer);
        }
        redirectReq.end();
        
        return; // Exit early since we're handling the redirect
      }
    }
    
    // For non-redirect responses, proceed as before
    // Copy response headers
    Object.keys(proxyRes.headers).forEach(key => {
      if (!key.toLowerCase().startsWith('access-control-')) {
        clientRes.setHeader(key, proxyRes.headers[key]);
      }
    });

    // Add CORS headers to response
    clientRes.setHeader('Access-Control-Allow-Origin', '*');
    clientRes.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    clientRes.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, X-API-Key, x-user-id');
    clientRes.setHeader('Access-Control-Allow-Credentials', 'true');

    clientRes.statusCode = proxyRes.statusCode;

    proxyRes.on('data', (chunk) => {
      clientRes.write(chunk);
    });

    proxyRes.on('end', () => {
      log(`Response: ${proxyRes.statusCode} ${clientReq.method} ${clientReq.url}`);
      clientRes.end();
    });
  });

  proxyReq.on('error', (err) => {
    log(`Proxy error: ${err.message}`);
    clientRes.statusCode = 500;
    clientRes.setHeader('Access-Control-Allow-Origin', '*');
    clientRes.end(JSON.stringify({ error: 'Proxy error', message: err.message }));
  });

  // Handle request body
  let body = [];
  if (clientReq.method === 'POST' || clientReq.method === 'PUT' || clientReq.method === 'PATCH') {
    clientReq.on('data', (chunk) => {
      body.push(chunk);
    });
    clientReq.on('end', () => {
      const bodyBuffer = Buffer.concat(body);
      proxyReq.write(bodyBuffer);
      proxyReq.end();
    });
  } else {
    proxyReq.end();
  }
}

const server = http.createServer((req, res) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, X-API-Key, x-user-id');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.end();
    return;
  }

  // Health check
  if (req.url === '/health') {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.end(JSON.stringify({
      status: 'ok',
      message: 'Local CORS Proxy is running',
      timestamp: new Date().toISOString()
    }));
    return;
  }

  // Handle ingest requests for debug logs
  if (req.url.startsWith('/ingest/')) {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        log(`📊 Debug log received: ${data.location || 'unknown'} - ${data.message || 'no message'}`);
        res.statusCode = 200;
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.end('OK');
      } catch (err) {
        log(`❌ Error parsing debug log: ${err.message}`);
        res.statusCode = 400;
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.end('ERROR');
      }
    });
    return;
  }

  // Proxy all other requests to api.benalsam.com
  proxyRequest(req, res);
});

server.listen(PORT, () => {
  log(`🚀 Local CORS Proxy Server running on port ${PORT}`);
  log(`📡 Proxying API requests to: https://api.benalsam.com`);
  log(`🔗 Debug logs endpoint: http://127.0.0.1:${PORT}/ingest/...`);
  log(`❤️  Health check: http://127.0.0.1:${PORT}/health`);
  log(`🔧 Ready to handle CORS requests!`);
});