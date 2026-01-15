import { defineConfig } from 'vite';
import solid from 'vite-plugin-solid';

export default defineConfig({
  base: '/solid/',

  plugins: [solid()],

  build: {
    outDir: 'dist/app-solid',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['solid-js', '@solidjs/router'],
        },
      },
    },
  },

  server: {
    port: 4204,
    strictPort: true,
    cors: true,
  },

  preview: {
    port: 4204,
    strictPort: true,
    cors: true,
  },

  resolve: {
    alias: {
      '@shared': '/packages/shared/src',
      '~': '/src',
    },
  },
});
