import { defineConfig } from 'vite';
import { resolve } from 'path';
// import injectHTML from 'vite-plugin-html-inject';

export default defineConfig({
  build: {
    outDir: process.env.IS_HOST === 'true' ? 'public_html' : 'dist',
  },
  server: {
    open: true,
    host: true,
  },
  resolve: {
    alias: { '@': resolve(import.meta.dirname, './src') }
  },
});