import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vitest/config';
import { loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => ({
	base: loadEnv(mode, process.cwd(), 'VITE_').VITE_BASE_URL || '/',
	plugins: [
		vue(),
		VitePWA({
			strategies: 'generateSW',
			registerType: 'prompt',
			injectRegister: false,
			includeAssets: ['icon-app.svg', 'icons/*.png'],
			manifest: {
				id: './',
				name: 'My notes',
				short_name: 'My notes',
				description: 'Заметки, задачи и папки с сохранением на устройстве и работой без сети.',
				lang: 'ru',
				start_url: './',
				scope: './',
				display: 'standalone',
				background_color: '#f5f5f5',
				theme_color: '#f5f5f5',
				icons: [
					{ src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
					{ src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
					{
						src: 'icons/icon-maskable-512.png',
						sizes: '512x512',
						type: 'image/png',
						purpose: 'maskable',
					},
				],
			},
			workbox: {
				globPatterns: ['**/*.{html,js,css,svg,png,woff,woff2}'],
				navigateFallback: 'index.html',
				navigateFallbackDenylist: [/\/api\//, /\.[^/]+$/],
				cleanupOutdatedCaches: true,
				clientsClaim: true,
				skipWaiting: false,
			},
			devOptions: { enabled: false },
		}),
	],
	resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
	build: { outDir: process.env.IS_HOST === 'true' ? 'public_html' : 'dist' },
	server: { host: process.env.DEV_HOST === 'true', open: false },
	test: {
		environment: 'jsdom',
		setupFiles: ['tests/setup.ts'],
		include: ['tests/src/**/*.test.{ts,js}'],
		clearMocks: true,
		restoreMocks: true,
		maxWorkers: 2,
		fsModuleCache: true,
		coverage: {
			provider: 'v8',
			include: ['src/**/*.{ts,vue}'],
			exclude: ['src/main.ts', 'src/env.d.ts', 'src/types/**', 'src/constants/**'],
		},
	},
}));
