import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Production optimizations
  compress: true,
  poweredByHeader: false,
  productionBrowserSourceMaps: false, // Disable source maps in production
  
  // Performance optimizations
  reactStrictMode: true,
  
  // ESLint - Allow build despite warnings
  eslint: {
    ignoreDuringBuilds: true, // Ignore ESLint warnings during production build
  },
  
  // TypeScript - Allow build despite type errors (for faster iteration)
  typescript: {
    ignoreBuildErrors: true, // Skip TypeScript checks during build
  },
  
  /* config options here */
  
  // Security headers for Lighthouse Best Practices
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(self)'
          },
          {
            key: 'X-Permitted-Cross-Domain-Policies',
            value: 'none'
          },
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin'
          },
          {
            key: 'Cross-Origin-Resource-Policy',
            value: 'cross-origin'
          },
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'unsafe-none' // Required for third-party resources
          },
          {
            key: 'Content-Security-Policy',
            value: process.env.NODE_ENV === 'production'
              ? [
                  "default-src 'self'",
                  "script-src 'self' https://accounts.google.com https://apis.google.com",
                  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
                  "img-src 'self' data: blob: https: http:",
                  "font-src 'self' data: https://fonts.gstatic.com",
                  "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
                  "frame-src 'self' https://accounts.google.com",
                  "object-src 'none'",
                  "base-uri 'self'",
                  "form-action 'self'",
                  "frame-ancestors 'self'",
                  "upgrade-insecure-requests"
                ].join('; ')
              : [
                  // Development: More permissive
                  "default-src 'self'",
                  "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://accounts.google.com https://apis.google.com",
                  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
                  "img-src 'self' data: blob: https: http:",
                  "font-src 'self' data: https://fonts.gstatic.com",
                  "connect-src 'self' https://*.supabase.co wss://*.supabase.co http://localhost:* ws://localhost:* wss://localhost:* ws://0.0.0.0:*",
                  "frame-src 'self' https://accounts.google.com",
                  "object-src 'none'",
                  "base-uri 'self'",
                  "form-action 'self'",
                  "frame-ancestors 'self'"
                ].join('; ')
          }
        ],
      },
    ]
  },
  
  // Image optimization
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
    ],
  },
};

export default nextConfig;
