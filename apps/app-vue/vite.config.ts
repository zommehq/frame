import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  base: '/vue/',
  build: {
    outDir: 'dist/app-vue',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['vue', 'vue-router'],
        },
      },
    },
  },
  plugins: [vue()],
  server: {
    port: 4202,
  },
});
