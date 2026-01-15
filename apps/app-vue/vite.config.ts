import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  base: '/vue/',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['vue', 'vue-router'],
        },
      },
    },
  },
  plugins: [vue()],
  resolve: {
    alias: {
      '@micro-fe/fragment-elements': resolve(__dirname, '../../packages/fragment-elements/src'),
    },
  },
  server: {
    port: 4202,
  },
});
