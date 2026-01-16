import { resolve } from "node:path";
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
  plugins: [vue()],
  resolve: {
    alias: {
      "@zomme/fragment-elements": resolve(__dirname, "../../packages/fragment-elements/src"),
    },
  },
  server: {
    port: 4202,
  },
});
