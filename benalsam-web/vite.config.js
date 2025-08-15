import path from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { visualizer } from 'rollup-plugin-visualizer';

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
	server: {
		host: '0.0.0.0',
		port: 5173,
		cors: true,
		strictPort: true,
		hmr: true, // Hot Module Replacement etkinleştir
		allowedHosts: [
			'benalsam.com',
			'www.benalsam.com',
			'localhost',
			'127.0.0.1',
			'209.227.228.96'
		], // Domain'leri kabul et
		watch: {
			usePolling: true, // VPS'de dosya değişikliklerini izlemek için polling kullan
			interval: 1000, // 1 saniye aralıklarla kontrol et
		},
	},
	preview: {
		host: '0.0.0.0',
		port: 5173,
		cors: true,
		strictPort: true,
	},
	resolve: {
		extensions: ['.jsx', '.js', '.tsx', '.ts', '.json'],
		alias: {
			'@': path.resolve(__dirname, './src'),
			'benalsam-shared-types': path.resolve(__dirname, '../benalsam-shared-types/dist-esm'),
		},
	},
	// Cache directory configuration for Docker
	cacheDir: process.env.VITE_CACHE_DIR || 'node_modules/.vite',
	build: {
		rollupOptions: {
			output: {
				manualChunks: {
					vendor: ['react', 'react-dom'],
					router: ['react-router-dom'],
					ui: ['framer-motion', 'lucide-react'],
					query: ['@tanstack/react-query'],
					supabase: ['@supabase/supabase-js'],
				},
			}
		},
		chunkSizeWarningLimit: 1000,
		sourcemap: false,
	}
});
