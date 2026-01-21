import vue from "@vitejs/plugin-vue";
import { defineConfig } from "vite";

export default defineConfig({
  base: "/vue/",
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
  optimizeDeps: {
    // Exclude workspace packages from pre-bundling so changes are picked up immediately
    exclude: ["@zomme/frame", "@zomme/frame-vue"],
  },
  plugins: [vue()],
  server: {
    port: 4202,
  },
});
