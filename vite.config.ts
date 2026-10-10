import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vitest/config';
import { loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig(({ mode }) => ({
	base: loadEnv(mode, process.cwd(), 'VITE_').VITE_BASE_URL || '/',
	plugins: [vue()],
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
