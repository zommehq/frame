import vue from "@vitejs/plugin-vue";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    vue({
      template: {
        compilerOptions: {
          // Register custom elements
          isCustomElement: (tag) => tag === "fragment-frame",
        },
      },
    }),
  ],
  server: {
    port: 4001,
    strictPort: true,
    cors: true,
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["vue", "vue-router"],
        },
      },
    },
  },
});
