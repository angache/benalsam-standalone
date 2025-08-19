import path from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// Conditional import for visualizer (only in development)
const plugins = [react()];

if (process.env.NODE_ENV === 'development' && process.env.VITE_ENABLE_ANALYZER === 'true') {
	try {
		const { visualizer } = await import('rollup-plugin-visualizer');
		plugins.push(
			visualizer({
				open: true,
				gzipSize: true,
				brotliSize: true,
				filename: 'dist/bundle-analysis.html',
			})
		);
	} catch (error) {
		console.log('Visualizer plugin not available, skipping...');
	}
}

export default defineConfig({
	plugins,
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
		headers: {
			// Cache headers for static assets
			'*.js': {
				'Cache-Control': 'public, max-age=31536000, immutable',
			},
			'*.css': {
				'Cache-Control': 'public, max-age=31536000, immutable',
			},
			'*.png': {
				'Cache-Control': 'public, max-age=31536000, immutable',
			},
			'*.jpg': {
				'Cache-Control': 'public, max-age=31536000, immutable',
			},
			'*.webp': {
				'Cache-Control': 'public, max-age=31536000, immutable',
			},
			'*.svg': {
				'Cache-Control': 'public, max-age=31536000, immutable',
			},
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
		chunkSizeWarningLimit: 1000,
		sourcemap: false,
		cssCodeSplit: true, // CSS code splitting
		minify: 'terser', // Better minification
		terserOptions: {
			compress: {
				drop_console: true, // Remove console.log in production
				drop_debugger: true,
			},
		},
		// Bundle preloading optimization
		assetsInlineLimit: 4096, // Inline small assets
		rollupOptions: {
			output: {
				// Preload critical chunks
				manualChunks: (id) => {
					// CreateListingPage ve ilgili component'ler için özel chunk
					if (id.includes('CreateListingPage') || id.includes('steps/Step')) {
						return 'create-listing';
					}
					
					// Vendor chunks
					if (id.includes('node_modules')) {
						if (id.includes('react') || id.includes('react-dom')) {
							return 'vendor';
						}
						if (id.includes('react-router-dom')) {
							return 'router';
						}
						if (id.includes('framer-motion') || id.includes('lucide-react')) {
							return 'ui';
						}
						if (id.includes('@tanstack/react-query')) {
							return 'query';
						}
						if (id.includes('@supabase/supabase-js')) {
							return 'supabase';
						}
					}
					
					return undefined;
				},
			}
		},
	}
});
