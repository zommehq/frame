import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  base: '/react/',
  build: {
    outDir: 'dist/app-react',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
        },
      },
    },
  },
  plugins: [react()],
  resolve: {
    alias: {
      '@micro-fe/fragment-elements': resolve(__dirname, '../../packages/fragment-elements/src'),
    },
  },
  server: {
    port: 4203,
  },
});
