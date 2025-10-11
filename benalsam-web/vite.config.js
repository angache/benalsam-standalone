import path from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { createManualChunks, chunkSizeConfig } from './src/optimization/chunking/manualChunks.js';

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
		force: true, // Force reload on changes
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
			// Disable cache in development - Chrome specific
			'*.js': {
				'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
				'Pragma': 'no-cache',
				'Expires': '0',
			},
			'*.jsx': {
				'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
				'Pragma': 'no-cache',
				'Expires': '0',
			},
			'*.css': {
				'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
				'Pragma': 'no-cache',
				'Expires': '0',
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
	},
	},
	// Cache directory configuration for Docker
	cacheDir: process.env.VITE_CACHE_DIR || 'node_modules/.vite',
	build: {
		chunkSizeWarningLimit: chunkSizeConfig.chunkSizeWarningLimit,
		sourcemap: false,
		cssCodeSplit: true, // CSS code splitting
		minify: 'terser', // Better minification
		terserOptions: {
			compress: {
				drop_console: true, // Remove console.log in production
				drop_debugger: true,
				pure_funcs: ['console.log', 'console.info', 'console.debug'], // Remove console functions
				passes: 2, // Multiple compression passes
			},
			mangle: {
				toplevel: true, // Mangle top-level names
			},
		},
		// Bundle preloading optimization
		assetsInlineLimit: 4096, // Inline small assets
		target: 'es2015', // Target modern browsers
		rollupOptions: {
			external: [
				'express-rate-limit',
				'helmet',
				'cors',
				'node:crypto',
				'node:buffer',
				'node:net'
			],
			output: {
				// Use optimized manual chunks
				manualChunks: createManualChunks,
				// Optimize chunk naming
				chunkFileNames: (chunkInfo) => {
					const facadeModuleId = chunkInfo.facadeModuleId ? chunkInfo.facadeModuleId.split('/').pop() : 'chunk';
					return `assets/${facadeModuleId}-[hash].js`;
				},
				entryFileNames: 'assets/[name]-[hash].js',
				assetFileNames: (assetInfo) => {
					const info = assetInfo.name.split('.');
					const ext = info[info.length - 1];
					if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
						return `assets/images/[name]-[hash][extname]`;
					}
					if (/css/i.test(ext)) {
						return `assets/css/[name]-[hash][extname]`;
					}
					return `assets/[name]-[hash][extname]`;
				},
			}
		},
	}
});
