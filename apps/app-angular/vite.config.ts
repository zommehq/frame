import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@micro-fe/fragment-elements/sdk': resolve(__dirname, '../../packages/fragment-elements/dist/sdk.js'),
      '@micro-fe/fragment-elements/constants': resolve(__dirname, '../../packages/fragment-elements/dist/constants.js'),
      '@micro-fe/fragment-elements/types': resolve(__dirname, '../../packages/fragment-elements/dist/types.js'),
      '@micro-fe/fragment-elements': resolve(__dirname, '../../packages/fragment-elements/dist/index.js'),
    },
  },
  server: {
    port: 4201,
    cors: true,
  },
});
