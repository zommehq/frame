import { resolve } from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  base: "/react/",
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom", "react-router-dom"],
        },
      },
    },
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@zomme/fragment-elements": resolve(__dirname, "../../packages/fragment-elements/src"),
    },
  },
  server: {
    port: 4201,
  },
});
