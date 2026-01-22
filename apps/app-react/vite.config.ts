import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
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
  optimizeDeps: {
    // Exclude workspace packages from pre-bundling so changes are picked up immediately
    exclude: ["@zomme/frame", "@zomme/frame-react"],
  },
  plugins: [react()],
  server: {
    port: 4201,
  },
});
