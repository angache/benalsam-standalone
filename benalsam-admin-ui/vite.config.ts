import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { visualizer } from 'rollup-plugin-visualizer'

// Environment detection
const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    visualizer({
      open: true,
      gzipSize: true,
      brotliSize: true,
      filename: 'dist/bundle-analysis.html',
    }),
  ],
  base: isDevelopment ? '/' : '/admin/', // Development'ta root, production'da /admin/
  server: {
    port: 3003,
    host: '0.0.0.0', // Tüm network interface'lerini dinle
    strictPort: true, // Port kullanımdaysa hata ver
    cors: true, // CORS'u etkinleştir
    hmr: true, // Hot Module Replacement etkinleştir
    allowedHosts: [
      'benalsam.com',
      'www.benalsam.com',
      'admin.benalsam.com',
      'localhost',
      '127.0.0.1',
      '209.227.228.96'
    ], // Domain'leri kabul et
    watch: {
      usePolling: true, // VPS'de dosya değişikliklerini izlemek için polling kullan
      interval: 1000, // 1 saniye aralıklarla kontrol et
    }
  },
  preview: {
    port: 3003,
    host: '0.0.0.0',
    strictPort: true,
    cors: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          mui: ['@mui/material', '@mui/icons-material', '@mui/x-charts', '@mui/x-data-grid'],
          charts: ['recharts'],
          query: ['@tanstack/react-query', '@tanstack/react-query-devtools'],
          utils: ['axios', 'date-fns', 'lucide-react'],
          router: ['react-router-dom'],
        },
      }
    },
    chunkSizeWarningLimit: 1000,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      // 'benalsam-shared-types': path.resolve(__dirname, '../benalsam-shared-types/dist-esm'), // Frontend'de kullanılmamalı
    },
  },
  // Cache directory configuration for Docker
  cacheDir: process.env.VITE_CACHE_DIR || 'node_modules/.vite',
  define: {
    'process.env': {},
    'import.meta.env.VITE_API_URL': JSON.stringify('http://localhost:3002/api/v1'),
  },
})
